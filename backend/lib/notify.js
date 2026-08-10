const { db } = require('./db');
const sms = require('./sms');

/** قالب‌های پیش‌فرض — اگر در دیتابیس نباشند، همین‌ها استفاده می‌شوند */
const DEFAULTS = {
  otp: {
    title: 'کد ورود',
    body: 'کد ورود شما به {shop}: {code}\nاین کد تا {minutes} دقیقه معتبر است.'
  },
  welcome: {
    title: 'خوش‌آمدگویی',
    body: '{name} عزیز، به {shop} خوش اومدی 🎉\nهر وقت سوالی داشتی از بخش پشتیبانی بهمون پیام بده.'
  },
  order_placed: {
    title: 'ثبت سفارش',
    body: '{name} عزیز، سفارشت در {shop} ثبت شد.\nکد پیگیری: {code}\nمبلغ: {total} تومان'
  },
  order_status: {
    title: 'تغییر وضعیت سفارش',
    body: 'وضعیت سفارش {code} در {shop} به «{status}» تغییر کرد.'
  },
  order_shipped: {
    title: 'ارسال سفارش',
    body: 'سفارش {code} ارسال شد 📦\nکد رهگیری پستی: {post}\nپیگیری: {shop}'
  },
  order_cancelled: {
    title: 'لغو سفارش',
    body: 'سفارش {code} در {shop} لغو شد.\nاگه پرداختی داشتی، تا ۷۲ ساعت کاری برمی‌گرده.'
  },
  return_received: {
    title: 'ثبت درخواست مرجوعی',
    body: 'درخواست مرجوعی سفارش {code} ثبت شد.\nکارشناس {shop} تا ۲۴ ساعت آینده باهات تماس می‌گیره.'
  },
  return_status: {
    title: 'تغییر وضعیت مرجوعی',
    body: 'وضعیت مرجوعی سفارش {code}: {status}\n{shop}'
  }
};

function setting(key, fallback = '') {
  try {
    const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return r && r.value !== '' ? r.value : fallback;
  } catch (_) { return fallback; }
}

/** قالب‌های پیش‌فرض را در دیتابیس می‌سازد (فقط اگر نباشند) */
function ensureTemplates() {
  const ins = db.prepare('INSERT OR IGNORE INTO sms_templates (key, title_fa, body) VALUES (?,?,?)');
  for (const [key, t] of Object.entries(DEFAULTS)) ins.run(key, t.title, t.body);
}

function getTemplate(key) {
  try {
    const row = db.prepare('SELECT * FROM sms_templates WHERE key = ?').get(key);
    if (row) return row;
  } catch (_) { /* جدول هنوز ساخته نشده */ }
  const d = DEFAULTS[key];
  return d ? { key, title_fa: d.title, body: d.body, is_active: 1 } : null;
}

/** {name} و {code} و … را با مقدار واقعی جایگزین می‌کند */
function render(body, vars) {
  const base = {
    shop: setting('site_name_fa', 'مای پیکسل'),
    support: setting('support_phone', '')
  };
  const all = { ...base, ...vars };
  return String(body).replace(/\{(\w+)\}/g, (m, k) => (all[k] != null ? String(all[k]) : ''));
}

function log(phone, template, body, status, error, driver) {
  try {
    db.prepare(`INSERT INTO sms_log (phone, template, body, status, error, driver)
                VALUES (?,?,?,?,?,?)`).run(phone, template, body, status, error || '', driver || '');
  } catch (_) { /* لاگ نباید جریان اصلی را بشکند */ }
}

/**
 * پیامک را با قالب مشخص می‌فرستد.
 * هرگز throw نمی‌کند — شکست پیامک نباید ثبت سفارش یا مرجوعی را خراب کند.
 */
async function notify(key, phone, vars = {}) {
  const driver = setting('sms_driver', process.env.SMS_DRIVER || 'console');
  if (!phone) return { ok: false, reason: 'no-phone' };

  const tpl = getTemplate(key);
  if (!tpl) { log(phone, key, '', 'skipped', 'قالب پیدا نشد', driver); return { ok: false, reason: 'no-template' }; }
  if (!tpl.is_active) { log(phone, key, '', 'skipped', 'قالب غیرفعال است', driver); return { ok: false, reason: 'disabled' }; }
  if (setting('sms_enabled', '1') !== '1') {
    log(phone, key, '', 'skipped', 'ارسال پیامک خاموش است', driver);
    return { ok: false, reason: 'off' };
  }

  const body = render(tpl.body, vars);
  try {
    await sms.send(phone, body, key, vars);
    log(phone, key, body, 'sent', '', driver);
    return { ok: true, body };
  } catch (e) {
    log(phone, key, body, 'failed', e.message, driver);
    return { ok: false, reason: 'error', error: e.message };
  }
}

module.exports = { notify, render, getTemplate, ensureTemplates, DEFAULTS, setting };
