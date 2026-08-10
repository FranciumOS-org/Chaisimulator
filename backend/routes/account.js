const express = require('express');
const { db } = require('../lib/db');
const { requireAuth } = require('../middleware/auth');
const { normalizePhone } = require('../lib/helpers');
const { notify } = require('../lib/notify');
const PROVINCES = require('../lib/provinces');

const router = express.Router();

/* ═══════════════════════════════════════════
   لیست علاقه‌مندی‌ها
═══════════════════════════════════════════ */
router.get('/wishlist', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT p.id, p.slug, p.name_fa, p.name_en, p.price, p.discount_price, p.stock,
           p.image_url, p.icon, p.rating_avg, p.rating_count,
           c.name_fa AS category_fa, w.created_at AS added_at
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE w.user_id = ? AND p.is_active = 1
    ORDER BY w.created_at DESC`).all(req.user.id);
  res.json({ items });
});

/** فقط شناسه‌ها — برای رنگ‌کردن آیکون قلب در لیست محصولات */
router.get('/wishlist/ids', requireAuth, (req, res) => {
  const ids = db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?')
    .all(req.user.id).map(r => r.product_id);
  res.json({ ids });
});

router.post('/wishlist/:productId', requireAuth, (req, res) => {
  const p = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(req.params.productId);
  if (!p) return res.status(404).json({ error: 'محصول پیدا نشد' });

  const exists = db.prepare('SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, p.id);
  if (exists) {
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, p.id);
    return res.json({ ok: true, wished: false, message: 'از علاقه‌مندی‌ها حذف شد' });
  }
  db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?,?)').run(req.user.id, p.id);
  res.json({ ok: true, wished: true, message: 'به علاقه‌مندی‌ها اضافه شد' });
});

router.delete('/wishlist/:productId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ ok: true, wished: false });
});

/* ═══════════════════════════════════════════
   آدرس‌ها
═══════════════════════════════════════════ */
router.get('/addresses', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.user.id);
  res.json({ items, provinces: PROVINCES });
});

function readAddress(body, user) {
  const receiverType = body.receiver_type === 'other' ? 'other' : 'self';
  let name = '', phone = '';

  if (receiverType === 'self') {
    name  = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    phone = user.phone || '';
  } else {
    name  = String(body.receiver_name || '').trim();
    phone = normalizePhone(String(body.receiver_phone || ''));
  }

  return {
    title:          String(body.title || 'آدرس من').trim(),
    province:       String(body.province || '').trim(),
    city:           String(body.city || '').trim(),
    address:        String(body.address || '').trim(),
    street:         String(body.street || '').trim(),
    plaque:         String(body.plaque || '').trim(),
    unit:           String(body.unit || '').trim(),
    postal_code:    String(body.postal_code || '').trim(),
    receiver_type:  receiverType,
    receiver_name:  name,
    receiver_phone: phone,
    is_default:     body.is_default ? 1 : 0
  };
}

function validateAddress(a) {
  if (!a.province) return 'استان رو انتخاب کن';
  if (!PROVINCES.includes(a.province)) return 'استان معتبر نیست';
  if (!a.city) return 'شهر رو وارد کن';
  if (a.address.length < 5) return 'آدرس کامل رو وارد کن';
  if (a.receiver_type === 'other') {
    if (a.receiver_name.length < 3) return 'نام تحویل‌گیرنده رو وارد کن';
    if (!/^09\d{9}$/.test(a.receiver_phone)) return 'شماره تماس تحویل‌گیرنده معتبر نیست';
  }
  return null;
}

router.post('/addresses', requireAuth, (req, res) => {
  const a = readAddress(req.body, req.user);
  const err = validateAddress(a);
  if (err) return res.status(400).json({ error: err });

  const count = db.prepare('SELECT COUNT(*) c FROM addresses WHERE user_id = ?').get(req.user.id).c;
  if (count === 0) a.is_default = 1;
  if (a.is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);

  const info = db.prepare(`INSERT INTO addresses
    (user_id, title, province, city, address, street, plaque, unit, postal_code,
     receiver_type, receiver_name, receiver_phone, is_default)
    VALUES (@user_id,@title,@province,@city,@address,@street,@plaque,@unit,@postal_code,
            @receiver_type,@receiver_name,@receiver_phone,@is_default)`)
    .run({ ...a, user_id: req.user.id });

  res.status(201).json({ ok: true, item: db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/addresses/:id', requireAuth, (req, res) => {
  const own = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!own) return res.status(404).json({ error: 'آدرس پیدا نشد' });

  const a = readAddress(req.body, req.user);
  const err = validateAddress(a);
  if (err) return res.status(400).json({ error: err });

  if (a.is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare(`UPDATE addresses SET title=@title, province=@province, city=@city, address=@address,
    street=@street, plaque=@plaque, unit=@unit, postal_code=@postal_code, receiver_type=@receiver_type,
    receiver_name=@receiver_name, receiver_phone=@receiver_phone, is_default=@is_default
    WHERE id=@id`).run({ ...a, id: own.id });

  res.json({ ok: true, item: db.prepare('SELECT * FROM addresses WHERE id = ?').get(own.id) });
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  const own = db.prepare('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!own) return res.status(404).json({ error: 'آدرس پیدا نشد' });

  db.prepare('DELETE FROM addresses WHERE id = ?').run(own.id);
  if (own.is_default) {
    const next = db.prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
    if (next) db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(next.id);
  }
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════
   دیدگاه‌های من
═══════════════════════════════════════════ */
router.get('/reviews', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT cm.id, cm.rating, cm.body, cm.pros, cm.cons, cm.status, cm.is_buyer,
           cm.admin_reply, cm.created_at,
           p.slug AS product_slug, p.name_fa AS product_fa, p.image_url, p.icon
    FROM comments cm
    LEFT JOIN products p ON p.id = cm.product_id
    WHERE cm.user_id = ? ORDER BY cm.id DESC`).all(req.user.id);
  res.json({ items });
});

/* ═══════════════════════════════════════════
   درخواست مرجوعی
═══════════════════════════════════════════ */
const { RETURN_REASONS, RETURN_STATUS } = require('../lib/returns');

router.get('/returns/meta', (_req, res) => res.json({ reasons: RETURN_REASONS, statuses: RETURN_STATUS }));

/** ثبت مرجوعی — نیازی به ورود نیست، با کد پیگیری کار می‌کند */
router.post('/returns', (req, res) => {
  const code = String(req.body.tracking_code || '').trim().toUpperCase();
  const reason = String(req.body.reason || '').trim();
  const description = String(req.body.description || '').trim();
  const phone = normalizePhone(String(req.body.phone || ''));

  if (!code) return res.status(400).json({ error: 'کد پیگیری سفارش رو وارد کن' });
  if (!RETURN_REASONS[reason]) return res.status(400).json({ error: 'دلیل مرجوعی رو انتخاب کن' });

  // آیدی تلگرام برای تماس سریع‌تر پشتیبانی — قالبش قبل از هر چیز بررسی می‌شود
  let telegram = String(req.body.telegram || '').trim();
  if (telegram) {
    telegram = telegram.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '').trim();
    if (!/^[A-Za-z0-9_]{4,32}$/.test(telegram)) {
      return res.status(400).json({ error: 'آیدی تلگرام باید انگلیسی و بین ۴ تا ۳۲ کاراکتر باشه (مثل mypixel_ir)' });
    }
  }

  const order = db.prepare('SELECT id, user_id, phone, customer_name, status, created_at FROM orders WHERE tracking_code = ?').get(code);
  if (!order) return res.status(404).json({ error: 'سفارشی با این کد پیگیری پیدا نشد' });

  // یا سفارش مال همین حسابه، یا شماره موبایل با سفارش می‌خونه
  // (سفارش‌های مهمان user_id ندارند ولی با شماره قابل تاییدند)
  const owner = (req.user && order.user_id === req.user.id) || (!!phone && order.phone === phone);
  if (!owner) return res.status(403).json({ error: 'شماره موبایل با سفارش همخوانی نداره' });

  // فقط سفارش تحویل‌شده قابل مرجوع کردن است
  if (order.status !== 'delivered') {
    const FA = {
      pending:    'هنوز پرداخت نشده',
      paid:       'پرداخت شده ولی هنوز ارسال نشده',
      processing: 'در حال آماده‌سازی',
      packed:     'بسته‌بندی شده',
      shipped:    'ارسال شده ولی هنوز تحویل نشده',
      cancelled:  'لغو شده',
      refunded:   'قبلاً مرجوع شده'
    };
    const why = FA[order.status] || order.status;
    return res.status(409).json({
      error: `این سفارش ${why}. درخواست مرجوعی فقط برای سفارش‌های تحویل‌شده ثبت می‌شه.`,
      order_status: order.status
    });
  }

  const dup = db.prepare("SELECT id FROM returns WHERE tracking_code = ? AND status IN ('pending','approved')").get(code);
  if (dup) return res.status(409).json({ error: 'برای این سفارش یک درخواست مرجوعی باز داری' });

  const days = Math.floor((Date.now() - new Date(order.created_at.replace(' ', 'T') + 'Z')) / 86400000);
  const limit = parseInt(getSetting('return_days', '7'));
  if (days > limit) return res.status(400).json({ error: `مهلت مرجوعی این سفارش (${limit} روز) گذشته` });

  // اقلام انتخاب‌شده — اگر چیزی نفرستاده باشد یعنی کل سفارش
  const picked = Array.isArray(req.body.items) ? req.body.items : [];
  const orderItems = db.prepare(`SELECT oi.id, oi.title_snapshot, oi.qty, oi.unit_price, oi.opt_size, oi.opt_color,
      COALESCE((SELECT SUM(ri.qty) FROM return_items ri
                JOIN returns rr ON rr.id = ri.return_id
                WHERE ri.order_item_id = oi.id AND rr.status <> 'rejected'), 0) AS returned_qty
    FROM order_items oi WHERE oi.order_id = ?`).all(order.id);

  let chosen = [];
  if (picked.length) {
    for (const sel of picked) {
      const oi = orderItems.find(x => x.id === parseInt(sel.order_item_id));
      if (!oi) return res.status(400).json({ error: 'یکی از کالاهای انتخابی در این سفارش نیست' });
      const max = oi.qty - oi.returned_qty;
      const q = Math.max(1, parseInt(sel.qty) || 1);
      if (max <= 0) return res.status(400).json({ error: `«${oi.title_snapshot}» قبلاً مرجوع شده` });
      if (q > max) return res.status(400).json({ error: `حداکثر ${max} عدد از «${oi.title_snapshot}» قابل مرجوع کردنه` });
      chosen.push({ oi, qty: q });
    }
  } else {
    chosen = orderItems.filter(x => x.qty - x.returned_qty > 0)
                       .map(oi => ({ oi, qty: oi.qty - oi.returned_qty }));
  }
  if (!chosen.length) return res.status(400).json({ error: 'کالایی برای مرجوع کردن انتخاب نشده' });

  const info = db.prepare(`INSERT INTO returns
    (order_id, user_id, tracking_code, phone, full_name, reason, description, telegram)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(order.id,
         // اگر کاربر وارد شده، مرجوعی به حساب او وصل شود حتی اگر سفارش مهمان بوده
         (req.user && req.user.id) || order.user_id,
         code, order.phone, order.customer_name, reason, description, telegram);

  const insItem = db.prepare(`INSERT INTO return_items
    (return_id, order_item_id, title, opt_size, opt_color, qty, unit_price) VALUES (?,?,?,?,?,?,?)`);
  db.transaction(() => chosen.forEach(c =>
    insItem.run(info.lastInsertRowid, c.oi.id, c.oi.title_snapshot,
                c.oi.opt_size || '', c.oi.opt_color || '', c.qty, c.oi.unit_price)))();

  notify('return_received', order.phone, {
    code, name: order.customer_name, items: chosen.length
  }).catch(() => {});

  res.status(201).json({
    ok: true, id: info.lastInsertRowid,
    items: chosen.length,
    message: `درخواست مرجوعی برای ${chosen.length} قلم ثبت شد. کارشناس ما تا ۲۴ ساعت آینده باهات تماس می‌گیره.`
  });
});

/** بررسی می‌کند سفارش قابل مرجوع کردن هست یا نه — قبل از نمایش فرم */
router.post('/returns/check', (req, res) => {
  const code = String(req.body.tracking_code || '').trim().toUpperCase();
  const phone = normalizePhone(String(req.body.phone || ''));
  if (!code) return res.status(400).json({ error: 'کد پیگیری سفارش رو وارد کن' });

  const o = db.prepare(`SELECT id, user_id, phone, customer_name, status, created_at
    FROM orders WHERE tracking_code = ?`).get(code);
  if (!o) return res.status(404).json({ error: 'سفارشی با این کد پیگیری پیدا نشد' });

  const owner = (req.user && o.user_id === req.user.id) || (!!phone && o.phone === phone);
  if (!owner) return res.status(403).json({ error: 'شماره موبایل با سفارش همخوانی نداره' });

  const limit = parseInt(getSetting('return_days', '7'));
  const days = Math.floor((Date.now() - new Date(o.created_at.replace(' ', 'T') + 'Z')) / 86400000);
  const open = db.prepare("SELECT id FROM returns WHERE tracking_code = ? AND status IN ('pending','approved')").get(code);

  let eligible = true, reason = '';
  if (o.status !== 'delivered') { eligible = false; reason = 'not_delivered'; }
  else if (days > limit)        { eligible = false; reason = 'expired'; }
  else if (open)                { eligible = false; reason = 'duplicate'; }

  res.json({
    ok: true, eligible, reason,
    status: o.status,
    days_left: Math.max(0, limit - days),
    return_days: limit,
    customer_name: o.customer_name,
    items: db.prepare(`SELECT oi.id, oi.title_snapshot, oi.qty, oi.unit_price, oi.opt_size, oi.opt_color,
        COALESCE((SELECT SUM(ri.qty) FROM return_items ri
                  JOIN returns rr ON rr.id = ri.return_id
                  WHERE ri.order_item_id = oi.id AND rr.status <> 'rejected'), 0) AS returned_qty
      FROM order_items oi WHERE oi.order_id = ?`).all(o.id)
      .map(i => ({ ...i, max_qty: Math.max(0, i.qty - i.returned_qty) }))
  });
});

router.get('/returns/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM returns WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  const itemsOf = db.prepare('SELECT * FROM return_items WHERE return_id = ?');
  res.json({ items: rows.map(r => ({
    ...r,
    reason_fa: RETURN_REASONS[r.reason] || r.reason,
    status_fa: RETURN_STATUS[r.status] || r.status,
    items: itemsOf.all(r.id)
  })) });
});

function getSetting(key, fallback) {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return r ? r.value : fallback;
}

module.exports = router;
