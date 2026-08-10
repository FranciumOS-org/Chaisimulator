/**
 * پرداخت آنلاین.
 *
 * قاعده‌ی طلایی این فایل: **هیچ عملیاتی نباید دو بار اثر بگذارد.**
 * درگاه ممکن است کال‌بک را دو بار بزند، کاربر صفحه را رفرش کند،
 * یا Authority دستکاری شود. برای همین:
 *   ۱. authority در جدول payments یکتاست
 *   ۲. اگر پرداخت از قبل paid باشد، بدون تماس دوباره با درگاه موفق برمی‌گردد
 *   ۳. verify و علامت‌زدن سفارش داخل یک تراکنش اتمیک انجام می‌شود
 *   ۴. مبلغ همیشه از دیتابیس خوانده می‌شود، نه از ورودی کاربر
 */
const express = require('express');
const { db } = require('../lib/db');
const { normalizePhone } = require('../lib/helpers');
const { getGateway, activeGateways } = require('../lib/gateways');
const { notify } = require('../lib/notify');

const router = express.Router();

function setting(key, fallback = '') {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return r && r.value !== '' ? r.value : fallback;
}

function siteUrl(req) {
  const fromSetting = setting('site_url', process.env.SITE_URL || '').replace(/\/+$/, '');
  if (fromSetting) return fromSetting;
  return `${req.protocol}://${req.get('host')}`;
}

/** آدرسی که کاربر بعد از پرداخت روی سایت می‌بیند */
function resultUrl(base, code, state, extra = '') {
  return `${base}/track?code=${encodeURIComponent(code)}&pay=${state}${extra}`;
}

/* ───────────────────────────────────────────────
   فهرست درگاه‌های آماده
─────────────────────────────────────────────── */
router.get('/gateways', (_req, res) => {
  res.json({ items: activeGateways().filter(g => g.ready || !g.online) });
});

/* ───────────────────────────────────────────────
   شروع پرداخت
─────────────────────────────────────────────── */
router.post('/start', async (req, res) => {
  const code = String(req.body.tracking_code || '').trim().toUpperCase();
  const phone = normalizePhone(req.body.phone || (req.user && req.user.phone) || '');
  if (!code) return res.status(400).json({ error: 'کد پیگیری سفارش لازم است' });

  const order = db.prepare('SELECT * FROM orders WHERE tracking_code = ?').get(code);
  if (!order) return res.status(404).json({ error: 'سفارشی با این کد پیدا نشد' });

  const owner = (req.user && order.user_id === req.user.id) || (!!phone && order.phone === phone);
  if (!owner) return res.status(403).json({ error: 'شماره موبایل با سفارش همخوانی نداره' });

  if (order.payment_status === 'paid') {
    return res.status(409).json({ error: 'این سفارش قبلاً پرداخت شده', already_paid: true });
  }
  if (['cancelled', 'refunded'].includes(order.status)) {
    return res.status(409).json({ error: 'این سفارش لغو شده و قابل پرداخت نیست' });
  }
  if (order.total <= 0) {
    return res.status(400).json({ error: 'مبلغ سفارش معتبر نیست' });
  }

  // درگاه: یا آنچه کاربر انتخاب کرده، یا آنچه روی سفارش ثبت شده
  const wanted = String(req.body.gateway || '').toLowerCase();
  let gwRow = wanted
    ? db.prepare('SELECT * FROM payment_gateways WHERE code = ? AND is_active = 1').get(wanted)
    : (order.gateway_id
        ? db.prepare('SELECT * FROM payment_gateways WHERE id = ? AND is_active = 1').get(order.gateway_id)
        : null);
  if (!gwRow) {
    gwRow = db.prepare("SELECT * FROM payment_gateways WHERE is_active = 1 AND code <> 'cod' ORDER BY sort_order, id").get();
  }
  if (!gwRow) return res.status(503).json({ error: 'درگاه پرداخت فعالی تنظیم نشده' });

  const drv = getGateway(gwRow.code);
  if (!drv) return res.status(503).json({ error: `درگاه «${gwRow.name_fa}» هنوز پیاده‌سازی نشده` });
  if (!drv.configured()) {
    return res.status(503).json({ error: `کلید درگاه ${drv.title} در پنل تنظیم نشده` });
  }

  // اگر تراکنش باز و تازه‌ای برای همین سفارش هست، همان را ادامه بده
  const open = db.prepare(`SELECT * FROM payments
    WHERE order_id = ? AND gateway = ? AND status = 'pending'
      AND created_at > datetime('now','-15 minutes')
    ORDER BY id DESC`).get(order.id, drv.name);
  if (open && open.authority) {
    const url = drv.name === 'zibal'
      ? `https://gateway.zibal.ir/start/${open.authority}`
      : `${drv.base()}/StartPay/${open.authority}`;
    return res.json({ ok: true, redirect_url: url, authority: open.authority, reused: true });
  }

  const base = siteUrl(req);
  const r = await drv.request({
    amount: order.total,                       // مبلغ از دیتابیس، نه از کاربر
    callbackUrl: `${base}/api/payments/callback/${drv.name}`,
    orderCode: order.tracking_code,
    mobile: order.phone,
    description: `سفارش ${order.tracking_code} — ${setting('site_name_fa', 'مای پیکسل')}`
  });

  const ins = db.prepare(`INSERT INTO payments
    (order_id, gateway, amount, authority, status, ip, raw_request, fail_reason)
    VALUES (?,?,?,?,?,?,?,?)`);

  if (!r.ok) {
    ins.run(order.id, drv.name, order.total, null, 'failed',
      req.ip || '', JSON.stringify(r.raw || {}).slice(0, 2000), r.error || '');
    return res.status(502).json({ error: r.error || 'ارتباط با درگاه برقرار نشد' });
  }

  // authority یکتاست. اگر درگاه شناسه‌ی تکراری بدهد (باگ درگاه یا حالت تست)
  // نباید سرور کرش کند — یا همان تراکنش را ادامه بده، یا خطای تمیز بده.
  try {
    ins.run(order.id, drv.name, order.total, r.authority, 'pending',
      req.ip || '', JSON.stringify(r.raw || {}).slice(0, 2000), '');
  } catch (e) {
    if (!/UNIQUE/i.test(e.message)) {
      console.error('ثبت تراکنش ناموفق:', e.message);
      return res.status(500).json({ error: 'ثبت تراکنش ناموفق بود' });
    }
    const prev = db.prepare('SELECT * FROM payments WHERE authority = ?').get(r.authority);
    // اگر همین سفارش است و هنوز پرداخت نشده، همان تراکنش را ادامه بده
    if (prev && prev.order_id === order.id && prev.status === 'pending') {
      return res.json({ ok: true, redirect_url: r.redirectUrl, authority: r.authority,
        gateway: drv.name, reused: true });
    }
    console.error('درگاه authority تکراری برگرداند:', r.authority, 'سفارش', order.tracking_code);
    return res.status(502).json({
      error: 'درگاه شناسه‌ی تکراری برگرداند. چند لحظه بعد دوباره تلاش کن.'
    });
  }

  res.json({ ok: true, redirect_url: r.redirectUrl, authority: r.authority, gateway: drv.name });
});

/* ───────────────────────────────────────────────
   بازگشت از درگاه — قلب idempotency
─────────────────────────────────────────────── */
router.get('/callback/:gateway', async (req, res) => {
  const base = siteUrl(req);
  const drv = getGateway(req.params.gateway);
  if (!drv) return res.redirect(`${base}/?pay=badgateway`);

  const { authority, userCancelled } = drv.readCallback(req.query);
  if (!authority) return res.redirect(`${base}/?pay=noauthority`);

  const pay = db.prepare('SELECT * FROM payments WHERE authority = ? AND gateway = ?')
    .get(authority, drv.name);
  if (!pay) return res.redirect(`${base}/?pay=notfound`);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(pay.order_id);
  if (!order) return res.redirect(`${base}/?pay=notfound`);

  // ── حالت ۱: قبلاً موفق ثبت شده — بدون تماس دوباره با درگاه ──
  if (pay.status === 'paid') {
    return res.redirect(resultUrl(base, order.tracking_code, 'ok', '&repeat=1'));
  }

  // ── حالت ۲: کاربر در درگاه انصراف داده ──
  if (userCancelled) {
    db.prepare(`UPDATE payments SET status='cancelled', fail_reason=? WHERE id=? AND status='pending'`)
      .run('انصراف کاربر در درگاه', pay.id);
    return res.redirect(resultUrl(base, order.tracking_code, 'cancel'));
  }

  // ── حالت ۳: تایید نزد درگاه ──
  const v = await drv.verify({ amount: pay.amount, authority });

  if (!v.ok) {
    db.prepare(`UPDATE payments SET status='failed', fail_reason=?, raw_verify=? WHERE id=? AND status='pending'`)
      .run(v.error || 'تایید ناموفق', JSON.stringify(v.raw || {}).slice(0, 2000), pay.id);
    return res.redirect(resultUrl(base, order.tracking_code, 'fail'));
  }

  // زیبال مبلغ پرداخت‌شده را برمی‌گرداند — با مبلغ سفارش مقایسه کن
  if (v.paidAmount != null && v.paidAmount !== pay.amount) {
    db.prepare(`UPDATE payments SET status='failed', fail_reason=?, raw_verify=? WHERE id=?`)
      .run(`مبلغ پرداختی (${v.paidAmount}) با مبلغ سفارش (${pay.amount}) یکی نیست`,
           JSON.stringify(v.raw || {}).slice(0, 2000), pay.id);
    return res.redirect(resultUrl(base, order.tracking_code, 'mismatch'));
  }

  // ── ثبت اتمیک: یا همه‌چیز ثبت می‌شود یا هیچ‌چیز ──
  let firstTime = false;
  try {
    db.transaction(() => {
      // شرط status='pending' یعنی اگر کال‌بک همزمان دو بار برسد، فقط یکی اثر می‌کند
      const upd = db.prepare(`UPDATE payments SET status='paid', ref_id=?, card_pan=?,
        raw_verify=?, verified_at=datetime('now') WHERE id=? AND status='pending'`)
        .run(v.refId || '', v.cardPan || '',
             JSON.stringify(v.raw || {}).slice(0, 2000), pay.id);

      if (upd.changes === 0) return;   // نویسنده‌ی دیگری زودتر ثبتش کرده
      firstTime = true;

      db.prepare(`UPDATE orders SET payment_status='paid', payment_ref=?,
        status = CASE WHEN status='pending' THEN 'paid' ELSE status END,
        updated_at=datetime('now') WHERE id=?`).run(v.refId || '', order.id);

      db.prepare(`INSERT INTO order_status_history (order_id, status, note)
        VALUES (?,?,?)`).run(order.id, 'paid',
        `پرداخت آنلاین با ${drv.title}${v.refId ? ' — کد پیگیری ' + v.refId : ''}`);
    })();
  } catch (e) {
    db.prepare(`UPDATE payments SET fail_reason=? WHERE id=?`)
      .run('خطا در ثبت نهایی: ' + e.message, pay.id);
    return res.redirect(resultUrl(base, order.tracking_code, 'dberror'));
  }

  if (firstTime) {
    notify('order_status', order.phone, {
      code: order.tracking_code, name: order.customer_name, status: 'پرداخت شد'
    }).catch(() => {});
  }

  res.redirect(resultUrl(base, order.tracking_code, 'ok',
    v.refId ? '&ref=' + encodeURIComponent(v.refId) : ''));
});

/* ───────────────────────────────────────────────
   وضعیت پرداخت یک سفارش
─────────────────────────────────────────────── */
router.get('/status/:code', (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const o = db.prepare('SELECT * FROM orders WHERE tracking_code = ?').get(code);
  if (!o) return res.status(404).json({ error: 'سفارش پیدا نشد' });

  const phone = normalizePhone(req.query.phone || (req.user && req.user.phone) || '');
  const owner = (req.user && (o.user_id === req.user.id || req.user.role === 'admin'))
             || (!!phone && o.phone === phone);
  if (!owner) return res.status(403).json({ error: 'دسترسی مجاز نیست' });

  const last = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC').get(o.id);
  res.json({
    ok: true,
    payment_status: o.payment_status,
    total: o.total,
    payable: o.payment_status !== 'paid' && !['cancelled', 'refunded'].includes(o.status),
    last: last ? {
      gateway: last.gateway, status: last.status, ref_id: last.ref_id,
      card_pan: last.card_pan, fail_reason: last.fail_reason, created_at: last.created_at
    } : null
  });
});

module.exports = router;
