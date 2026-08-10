const express = require('express');
const { db } = require('../lib/db');
const { findVariant } = require('../lib/variants');
const { notify } = require('../lib/notify');
const { requireAuth } = require('../middleware/auth');
const { makeTrackingCode, normalizePhone, ORDER_STATUS_FA } = require('../lib/helpers');

const router = express.Router();

function setting(key, fallback) {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return r && r.value !== '' ? r.value : fallback;
}

function shippingCost(subtotal, province) {
  const free = parseInt(setting('free_shipping_from', '0'), 10);
  if (free > 0 && subtotal >= free) return 0;
  const flat = parseInt(setting('shipping_cost', '0'), 10);
  // هزینه ارسال جداگانه برای شهر مبدأ (مثلاً تهران)
  const homeProv = setting('home_province', '');
  const homeCost = parseInt(setting('shipping_cost_home', '0'), 10);
  if (homeProv && province && province === homeProv && homeCost > 0) return homeCost;
  return flat;
}

function taxAmount(base) {
  const rate = parseFloat(setting('tax_rate', '0')) || 0;
  if (rate <= 0) return 0;
  return Math.round(base * rate / 100);
}

/** کد تخفیف را اعتبارسنجی و مبلغ تخفیف را برمی‌گرداند */
function applyCoupon(rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { code: '', amount: 0, row: null };

  const c = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1').get(code);
  if (!c) throw new Error('کد تخفیف معتبر نیست');

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (c.starts_at && c.starts_at > now) throw new Error('این کد تخفیف هنوز فعال نشده');
  if (c.ends_at && c.ends_at < now) throw new Error('این کد تخفیف منقضی شده');
  if (c.max_uses && c.used_count >= c.max_uses) throw new Error('ظرفیت این کد تخفیف پر شده');
  if (subtotal < c.min_order) throw new Error('مبلغ سفارش برای این کد تخفیف کافی نیست');

  let amount = c.kind === 'percent' ? Math.floor(subtotal * c.value / 100) : c.value;
  if (c.kind === 'percent' && c.max_amount > 0) amount = Math.min(amount, c.max_amount);
  return { code: c.code, amount: Math.min(amount, subtotal), row: c };
}

// ---------------------------------------------------------
// POST /api/orders  — ثبت سفارش، برمی‌گرداند کد پیگیری
// body: { items:[{product_id, qty, size, color}], address_id | فیلدهای آدرس،
//         customer_name, phone, note, gateway_id, coupon_code }
// ---------------------------------------------------------
router.post('/', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'سبد خرید خالیه' });

  // ───── آدرس: یا از آدرس‌های ذخیره‌شده کاربر، یا دستی ─────
  let addr = {
    province: String(req.body.province || ''), city: String(req.body.city || ''),
    address: String(req.body.address || ''), street: String(req.body.street || ''),
    plaque: String(req.body.plaque || ''), unit: String(req.body.unit || ''),
    postal_code: String(req.body.postal_code || ''),
    receiver_name: '', receiver_phone: ''
  };
  let addressId = null;

  if (req.body.address_id && req.user) {
    const a = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
      .get(req.body.address_id, req.user.id);
    if (!a) return res.status(400).json({ error: 'آدرس انتخاب‌شده پیدا نشد' });
    addressId = a.id;
    addr = {
      province: a.province, city: a.city, address: a.address, street: a.street,
      plaque: a.plaque, unit: a.unit, postal_code: a.postal_code,
      receiver_name: a.receiver_name, receiver_phone: a.receiver_phone
    };
  }

  const name = String(req.body.customer_name || addr.receiver_name || '').trim();
  const phone = normalizePhone(req.body.phone || addr.receiver_phone || (req.user && req.user.phone) || '');

  if (!name) return res.status(400).json({ error: 'نام گیرنده رو وارد کن' });
  if (!/^09\d{9}$/.test(phone)) return res.status(400).json({ error: 'شماره موبایل معتبر نیست' });
  if (!addr.province) return res.status(400).json({ error: 'استان رو انتخاب کن' });
  if (!addr.city) return res.status(400).json({ error: 'شهر رو وارد کن' });
  if (addr.address.trim().length < 5) return res.status(400).json({ error: 'آدرس کامل رو وارد کن' });

  // ───── اقلام و تنوع ─────
  const resolved = [];
  let subtotal = 0;

  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(it.product_id);
    if (!p) return res.status(400).json({ error: `محصول با شناسه ${it.product_id} موجود نیست` });

    const qty = Math.max(1, parseInt(it.qty) || 1);

    let unit = p.discount_price || p.price;
    let optSize = '', optColor = '';
    let pickedSizeId = null, pickedColorId = null;

    // اگر محصول سایز/رنگ تعریف‌شده دارد، انتخاب اجباری است
    const sizes = db.prepare("SELECT * FROM product_options WHERE product_id=? AND kind='size' AND is_active=1").all(p.id);
    const colors = db.prepare("SELECT * FROM product_options WHERE product_id=? AND kind='color' AND is_active=1").all(p.id);

    if (sizes.length) {
      const s = sizes.find(x => x.id === parseInt(it.size_id) || x.label === it.size);
      if (!s) return res.status(400).json({ error: `برای «${p.name_fa}» باید سایز انتخاب کنی` });
      optSize = s.unit ? `${s.label} ${s.unit}` : s.label;
      unit += s.price_diff;
      pickedSizeId = s.id;
    }
    if (colors.length) {
      const c = colors.find(x => x.id === parseInt(it.color_id) || x.label === it.color);
      if (!c) return res.status(400).json({ error: `برای «${p.name_fa}» باید رنگ انتخاب کنی` });
      optColor = c.label;
      unit += c.price_diff;
      pickedColorId = c.id;
    }

    // موجودی: اگر محصول ترکیب دارد، موجودی همان ترکیب ملاک است
    const variant = findVariant(p.id, pickedSizeId, pickedColorId);
    if (variant === undefined) {
      return res.status(400).json({ error: `این ترکیب از «${p.name_fa}» موجود نیست` });
    }
    const available = variant ? variant.stock : p.stock;
    if (available < qty) {
      const label = [optSize, optColor].filter(Boolean).join(' · ');
      return res.status(400).json({
        error: `موجودی «${p.name_fa}»${label ? ` (${label})` : ''} کافی نیست (${available} عدد)`
      });
    }

    subtotal += unit * qty;
    resolved.push({ p, qty, unit, optSize, optColor, variantId: variant ? variant.id : null });
  }

  // ───── تخفیف، ارسال، مالیات ─────
  let coupon;
  try { coupon = applyCoupon(req.body.coupon_code, subtotal); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const ship = shippingCost(subtotal - coupon.amount, addr.province);
  const tax = taxAmount(subtotal - coupon.amount);
  const total = subtotal - coupon.amount + ship + tax;
  const code = makeTrackingCode();

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO orders (tracking_code, user_id, address_id, customer_name, phone,
                          province, city, address, street, plaque, unit, postal_code,
                          receiver_name, receiver_phone, note,
                          subtotal, discount_amount, coupon_code, shipping_cost, tax_amount, total, gateway_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      code, req.user ? req.user.id : null, addressId, name, phone,
      addr.province, addr.city, addr.address, addr.street, addr.plaque, addr.unit, addr.postal_code,
      addr.receiver_name, addr.receiver_phone, String(req.body.note || ''),
      subtotal, coupon.amount, coupon.code, ship, tax, total,
      req.body.gateway_id || null
    );
    const orderId = info.lastInsertRowid;

    const insItem = db.prepare(`INSERT INTO order_items
      (order_id, product_id, title_snapshot, unit_price, qty, opt_size, opt_color) VALUES (?,?,?,?,?,?,?)`);
    const decStock = db.prepare('UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?');
    const decVariant = db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?');
    for (const r of resolved) {
      insItem.run(orderId, r.p.id, r.p.name_fa, r.unit, r.qty, r.optSize, r.optColor);
      if (r.variantId) decVariant.run(r.qty, r.variantId);
      decStock.run(r.qty, r.qty, r.p.id);
    }
    if (coupon.row) db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.row.id);

    db.prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?,?,?)')
      .run(orderId, 'pending', 'سفارش ثبت شد');
    return orderId;
  });

  const orderId = tx();

  notify('order_placed', phone, {
    name, code, total: total.toLocaleString('en-US'), items: resolved.length
  }).catch(() => {});

  res.status(201).json({
    ok: true, order_id: orderId, tracking_code: code,
    subtotal, discount_amount: coupon.amount, shipping_cost: ship, tax_amount: tax, total,
    message: 'سفارش ثبت شد. کد پیگیری رو نگه دار.'
  });
});

// ---------------------------------------------------------
// GET /api/orders/track/:code  — پیگیری عمومی سفارش
// ---------------------------------------------------------
router.get('/track/:code', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const order = db.prepare('SELECT * FROM orders WHERE UPPER(tracking_code) = ?').get(code);
  if (!order) return res.status(404).json({ error: 'سفارشی با این کد پیدا نشد. کد رو دوباره چک کن.' });

  const items = db.prepare('SELECT title_snapshot, unit_price, qty FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare(
    'SELECT status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY id'
  ).all(order.id);

  res.json({
    order: {
      tracking_code: order.tracking_code,
      customer_name: order.customer_name,
      // شماره را ماسک می‌کنیم چون این مسیر عمومی است
      phone: order.phone.replace(/^(\d{4})\d{3}(\d{4})$/, '$1***$2'),
      status: order.status,
      status_fa: ORDER_STATUS_FA[order.status] || order.status,
      payment_status: order.payment_status,
      city: order.city,
      total: order.total,
      shipping_cost: order.shipping_cost,
      tracking_post: order.tracking_post,
      created_at: order.created_at,
      updated_at: order.updated_at
    },
    items,
    history: history.map(h => ({ ...h, status_fa: ORDER_STATUS_FA[h.status] || h.status }))
  });
});

// ---------------------------------------------------------
// GET /api/orders/mine
// ---------------------------------------------------------
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, tracking_code, status, total, created_at FROM orders WHERE user_id = ? ORDER BY id DESC'
  ).all(req.user.id);
  res.json({ items: rows.map(r => ({ ...r, status_fa: ORDER_STATUS_FA[r.status] || r.status })) });
});

/** فاکتور سفارش — همه‌چیزی که برای چاپ لازم است */
router.get('/invoice/:code', (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const o = db.prepare('SELECT * FROM orders WHERE tracking_code = ?').get(code);
  if (!o) return res.status(404).json({ error: 'سفارشی با این کد پیدا نشد' });

  const phone = normalizePhone(req.query.phone || (req.user && req.user.phone) || '');
  const owner = (req.user && o.user_id === req.user.id)
             || (req.user && req.user.role === 'admin')
             || (!!phone && o.phone === phone);
  if (!owner) return res.status(403).json({ error: 'برای دیدن فاکتور، شماره موبایل سفارش رو وارد کن' });

  const items = db.prepare(`SELECT title_snapshot, unit_price, qty, opt_size, opt_color
    FROM order_items WHERE order_id = ?`).all(o.id);
  const gw = o.gateway_id
    ? db.prepare('SELECT name_fa FROM payment_gateways WHERE id = ?').get(o.gateway_id) : null;

  const st = {};
  db.prepare(`SELECT key, value FROM settings WHERE key IN
    ('site_name_fa','support_phone','support_hours','store_address_fa','tax_label_fa','seo_title')`)
    .all().forEach(r => st[r.key] = r.value);

  res.json({
    ok: true,
    order: {
      tracking_code: o.tracking_code, created_at: o.created_at, status: o.status,
      status_fa: ORDER_STATUS_FA[o.status] || o.status,
      payment_status: o.payment_status,
      customer_name: o.customer_name, phone: o.phone,
      receiver_name: o.receiver_name, receiver_phone: o.receiver_phone,
      province: o.province, city: o.city, address: o.address,
      street: o.street, plaque: o.plaque, unit: o.unit, postal_code: o.postal_code,
      note: o.note, tracking_post: o.tracking_post,
      subtotal: o.subtotal, discount_amount: o.discount_amount, coupon_code: o.coupon_code,
      shipping_cost: o.shipping_cost, tax_amount: o.tax_amount, total: o.total,
      gateway: gw ? gw.name_fa : ''
    },
    items,
    shop: {
      name: st.site_name_fa || 'مای پیکسل',
      phone: st.support_phone || '',
      hours: st.support_hours || '',
      address: st.store_address_fa || '',
      tax_label: st.tax_label_fa || 'مالیات'
    }
  });
});

/** لغو سفارش توسط مشتری — فقط قبل از ارسال */
router.post('/cancel', (req, res) => {
  const code = String(req.body.tracking_code || '').trim().toUpperCase();
  const phone = normalizePhone(req.body.phone || (req.user && req.user.phone) || '');
  if (!code) return res.status(400).json({ error: 'کد پیگیری سفارش رو وارد کن' });

  const o = db.prepare('SELECT * FROM orders WHERE tracking_code = ?').get(code);
  if (!o) return res.status(404).json({ error: 'سفارشی با این کد پیدا نشد' });

  const owner = (req.user && o.user_id === req.user.id) || (!!phone && o.phone === phone);
  if (!owner) return res.status(403).json({ error: 'شماره موبایل با سفارش همخوانی نداره' });

  const CANCELABLE = ['pending', 'paid', 'processing'];
  if (!CANCELABLE.includes(o.status)) {
    const FA = { packed:'بسته‌بندی شده', shipped:'ارسال شده', delivered:'تحویل داده شده',
                 cancelled:'قبلاً لغو شده', refunded:'مرجوع شده' };
    return res.status(409).json({
      error: `این سفارش ${FA[o.status] || o.status} و دیگه قابل لغو نیست. اگه تحویل گرفتی، از بخش مرجوعی اقدام کن.`,
      order_status: o.status
    });
  }

  // آیدی تلگرام و شماره کارت برای پیگیری و بازگشت وجه
  let telegram = String(req.body.telegram || '').trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '');
  if (telegram && !/^[A-Za-z0-9_]{4,32}$/.test(telegram)) {
    return res.status(400).json({ error: 'آیدی تلگرام باید انگلیسی و بین ۴ تا ۳۲ کاراکتر باشه (مثل mypixel_ir)' });
  }

  const card = String(req.body.card || '').replace(/[^0-9]/g, '');
  const holder = String(req.body.card_holder || '').trim();
  const paid = o.payment_status === 'paid';

  if (paid) {
    if (!/^\d{16}$/.test(card)) {
      return res.status(400).json({ error: 'برای بازگشت وجه، شماره کارت ۱۶ رقمی به نام خودت رو وارد کن' });
    }
    if (holder.length < 3) {
      return res.status(400).json({ error: 'نام صاحب کارت رو وارد کن' });
    }
  } else if (card && !/^\d{16}$/.test(card)) {
    return res.status(400).json({ error: 'شماره کارت باید ۱۶ رقم باشه' });
  }

  const reason = String(req.body.reason || '').trim();

  db.transaction(() => {
    db.prepare(`UPDATE orders SET status='cancelled', cancel_reason=?, cancel_telegram=?,
      cancel_card=?, cancel_holder=?, cancelled_by='customer', updated_at=datetime('now')
      WHERE id=?`).run(reason, telegram, card, holder, o.id);
    db.prepare("INSERT INTO order_status_history (order_id,status,note) VALUES (?,?,?)")
      .run(o.id, 'cancelled', reason || 'لغو توسط مشتری');
    // برگرداندن موجودی
    const back = db.prepare('UPDATE products SET stock = stock + ?, sold_count = MAX(0, sold_count - ?) WHERE id = ?');
    const backVar = db.prepare(`UPDATE product_variants SET stock = stock + ?
      WHERE product_id = ? AND COALESCE(size_id,0) = COALESCE(?,0) AND COALESCE(color_id,0) = COALESCE(?,0)`);
    db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id).forEach(it => {
      back.run(it.qty, it.qty, it.product_id);
      // ترکیب را از روی برچسب سایز/رنگ پیدا کن
      const sz = it.opt_size ? db.prepare(`SELECT id FROM product_options
        WHERE product_id=? AND kind='size' AND (label || ' ' || unit) = ? OR (product_id=? AND kind='size' AND label = ?)`)
        .get(it.product_id, it.opt_size, it.product_id, it.opt_size) : null;
      const cl = it.opt_color ? db.prepare("SELECT id FROM product_options WHERE product_id=? AND kind='color' AND label=?")
        .get(it.product_id, it.opt_color) : null;
      if (sz || cl) backVar.run(it.qty, it.product_id, sz ? sz.id : null, cl ? cl.id : null);
    });
  })();

  notify('order_cancelled', o.phone, { code, name: o.customer_name }).catch(() => {});

  res.json({
    ok: true,
    message: paid
      ? 'سفارش لغو شد. وجه تا ۷۲ ساعت کاری به کارتت برمی‌گرده.'
      : 'سفارش لغو شد.'
  });
});

/** وضعیت‌های قابل اقدام برای دکمه‌های صفحه پیگیری */
router.get('/actions/:code', (req, res) => {
  const o = db.prepare('SELECT status, payment_status, created_at FROM orders WHERE tracking_code = ?')
    .get(String(req.params.code).trim().toUpperCase());
  if (!o) return res.status(404).json({ error: 'سفارش پیدا نشد' });

  const days = Math.floor((Date.now() - new Date(o.created_at.replace(' ', 'T') + 'Z')) / 86400000);
  const limit = parseInt(setting('return_days', '7'), 10);
  res.json({
    ok: true,
    status: o.status,
    is_paid: o.payment_status === 'paid',
    can_cancel: ['pending', 'paid', 'processing'].includes(o.status),
    can_return: o.status === 'delivered' && days <= limit,
    days_left: Math.max(0, limit - days)
  });
});

module.exports = router;
