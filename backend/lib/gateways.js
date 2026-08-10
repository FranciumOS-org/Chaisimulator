/**
 * درگاه‌های پرداخت — زرین‌پال و زیبال.
 *
 * تنظیمات (merchant، sandbox) از جدول payment_gateways در پنل خوانده می‌شود،
 * پس تغییرشان نیاز به ری‌استارت ندارد.
 *
 * نکته‌ی حیاتی برای idempotency: هر دو درگاه برای تراکنشی که قبلاً تایید شده
 * کد جداگانه‌ای برمی‌گردانند (زرین‌پال ۱۰۱، زیبال ۲۰۱). این حالت «موفق» است،
 * نه خطا — وگرنه اگر کاربر صفحه‌ی بازگشت را رفرش کند سفارش ناموفق ثبت می‌شود.
 */
const { db } = require('./db');

// آدرس‌ها با متغیر محیطی قابل تغییرند — هم برای تست، هم اگر روزی
// لازم شد از میرور یا پراکسی داخلی استفاده کنی.
const ZP_LIVE    = process.env.ZARINPAL_BASE    || 'https://payment.zarinpal.com/pg';
const ZP_SANDBOX = process.env.ZARINPAL_SANDBOX || 'https://sandbox.zarinpal.com/pg';
const ZIBAL      = process.env.ZIBAL_BASE       || 'https://gateway.zibal.ir';

/** ردیف درگاه از دیتابیس */
function row(code) {
  try {
    return db.prepare('SELECT * FROM payment_gateways WHERE code = ?').get(code) || null;
  } catch (_) { return null; }
}

async function post(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);   // درگاه نباید بی‌نهایت معطلمان کند
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch (_) { data = { raw: text.slice(0, 500) }; }
    return { httpOk: r.ok, status: r.status, data };
  } catch (e) {
    return { httpOk: false, status: 0, data: {}, netError: e.name === 'AbortError' ? 'مهلت پاسخ درگاه تمام شد' : e.message };
  } finally { clearTimeout(timer); }
}

/* ══════════════════════ زرین‌پال ══════════════════════ */
const zarinpal = {
  name: 'zarinpal',
  title: 'زرین‌پال',
  online: true,

  base() {
    const g = row('zarinpal');
    return (g && g.sandbox) ? ZP_SANDBOX : ZP_LIVE;
  },
  configured() {
    const g = row('zarinpal');
    if (!g) return false;
    return g.sandbox ? true : !!String(g.merchant_id || '').trim();
  },

  async request(o) {
    const g = row('zarinpal') || {};
    const r = await post(`${this.base()}/v4/payment/request.json`, {
      merchant_id: String(g.merchant_id || '').trim(),
      amount: o.amount * 10,                       // زرین‌پال ریال می‌گیرد
      callback_url: o.callbackUrl,
      description: o.description || 'خرید از فروشگاه',
      metadata: { mobile: o.mobile || '', order_id: o.orderCode || '' }
    });
    if (r.netError) return { ok: false, error: r.netError, raw: {} };

    const d = (r.data && r.data.data) || {};
    if (d.code === 100 && d.authority) {
      return { ok: true, authority: d.authority, redirectUrl: `${this.base()}/StartPay/${d.authority}`, raw: r.data };
    }
    const err = (r.data && r.data.errors) || {};
    return {
      ok: false,
      error: err.message || `ساخت تراکنش ناموفق بود (کد ${err.code || d.code || r.status})`,
      raw: r.data
    };
  },

  readCallback(q) {
    const authority = String(q.Authority || q.authority || '');
    const status = String(q.Status || q.status || '');
    return { authority, userCancelled: !!authority && status !== 'OK' };
  },

  async verify(o) {
    const g = row('zarinpal') || {};
    const r = await post(`${this.base()}/v4/payment/verify.json`, {
      merchant_id: String(g.merchant_id || '').trim(),
      amount: o.amount * 10,
      authority: o.authority
    });
    if (r.netError) return { ok: false, error: r.netError, raw: {} };

    const d = (r.data && r.data.data) || {};
    // ۱۰۰ = تایید شد | ۱۰۱ = قبلاً تایید شده بود (هر دو موفق‌اند)
    if (d.code === 100 || d.code === 101) {
      return {
        ok: true,
        already: d.code === 101,
        refId: String(d.ref_id || ''),
        cardPan: String(d.card_pan || ''),
        paidAmount: null,                          // زرین‌پال مبلغ برنمی‌گرداند
        raw: r.data
      };
    }
    const err = (r.data && r.data.errors) || {};
    return {
      ok: false,
      error: err.message || `تایید تراکنش ناموفق بود (کد ${err.code || d.code || r.status})`,
      raw: r.data
    };
  }
};

/* ══════════════════════ زیبال ══════════════════════ */
const zibal = {
  name: 'zibal',
  title: 'زیبال',
  online: true,

  base() { return ZIBAL; },
  merchant() {
    const g = row('zibal') || {};
    // مرچنت «zibal» حالت تست رسمی خود زیبال است
    return g.sandbox ? 'zibal' : String(g.merchant_id || '').trim();
  },
  configured() {
    const g = row('zibal');
    if (!g) return false;
    return g.sandbox ? true : !!String(g.merchant_id || '').trim();
  },

  async request(o) {
    const r = await post(`${ZIBAL}/v1/request`, {
      merchant: this.merchant(),
      amount: o.amount * 10,                       // زیبال هم ریال می‌گیرد
      callbackUrl: o.callbackUrl,
      orderId: o.orderCode || '',
      description: o.description || 'خرید از فروشگاه',
      mobile: o.mobile || ''
    });
    if (r.netError) return { ok: false, error: r.netError, raw: {} };

    const d = r.data || {};
    if (d.result === 100 && d.trackId) {
      return { ok: true, authority: String(d.trackId), redirectUrl: `${ZIBAL}/start/${d.trackId}`, raw: d };
    }
    return { ok: false, error: d.message || `ساخت تراکنش ناموفق بود (کد ${d.result || r.status})`, raw: d };
  },

  readCallback(q) {
    const authority = String(q.trackId || q.trackid || '');
    const success = String(q.success || '');
    return { authority, userCancelled: !!authority && success === '0' };
  },

  async verify(o) {
    const r = await post(`${ZIBAL}/v1/verify`, {
      merchant: this.merchant(),
      trackId: o.authority
    });
    if (r.netError) return { ok: false, error: r.netError, raw: {} };

    const d = r.data || {};
    // ۱۰۰ = تایید شد | ۲۰۱ = قبلاً تایید شده بود
    if (d.result === 100 || d.result === 201) {
      return {
        ok: true,
        already: d.result === 201,
        refId: String(d.refNumber || ''),
        cardPan: String(d.cardNumber || ''),
        paidAmount: d.amount ? Math.round(d.amount / 10) : null,   // برگرداندن به تومان
        raw: d
      };
    }
    return { ok: false, error: d.message || `تایید تراکنش ناموفق بود (کد ${d.result || r.status})`, raw: d };
  }
};

const DRIVERS = { zarinpal, zibal };

/** درایور یک درگاه؛ برای درگاه‌های بدون پیاده‌سازی (مثل cod) null */
function getGateway(code) {
  return DRIVERS[String(code || '').toLowerCase()] || null;
}

/** فهرست درگاه‌های فعال برای نمایش در تسویه */
function activeGateways() {
  let rows = [];
  try {
    rows = db.prepare('SELECT * FROM payment_gateways WHERE is_active = 1 ORDER BY sort_order, id').all();
  } catch (_) { return []; }

  return rows.map(g => {
    const drv = getGateway(g.code);
    return {
      code: g.code,
      title: g.name_fa,
      title_en: g.name_en || '',
      online: !!drv,                               // cod آفلاین است
      sandbox: !!g.sandbox,
      ready: drv ? drv.configured() : true         // درگاه آفلاین همیشه آماده است
    };
  });
}

module.exports = { getGateway, activeGateways, DRIVERS };
