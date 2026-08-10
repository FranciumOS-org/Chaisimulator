/**
 * ارسال پیامک.
 * تنظیمات اول از پنل مدیریت (جدول settings) خوانده می‌شود و اگر خالی بود
 * از متغیرهای .env استفاده می‌کند. پیش‌فرض درایور console است تا بدون
 * پنل پیامکی هم بشود لوکال تست کرد.
 */
const { db } = require('./db');

function setting(key, fallback = '') {
  try {
    const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return r && r.value !== '' ? r.value : fallback;
  } catch (_) { return fallback; }
}

function conf() {
  return {
    driver:   setting('sms_driver', process.env.SMS_DRIVER || 'console'),
    apiKey:   setting('private_sms_api_key', process.env.SMS_API_KEY || ''),
    sender:   setting('sms_sender', process.env.SMS_SENDER || ''),
    template: setting('sms_otp_template', process.env.SMS_TEMPLATE || ''),
    lineNo:   setting('sms_line', process.env.SMS_LINE || '')
  };
}

async function postJson(url, body, headers = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
  if (!r.ok) throw new Error(data.message || data.error || `HTTP ${r.status}`);
  return data;
}

/**
 * @param {string} phone شماره گیرنده
 * @param {string} text  متن آماده‌شده
 * @param {string} key   کلید قالب (برای پنل‌هایی که الگوی اختصاصی دارند)
 * @param {object} vars  مقادیر قالب (مثلاً code)
 */
async function sendSms(phone, text, key = '', vars = {}) {
  const c = conf();

  if (c.driver === 'console') {
    console.log(`\n[SMS → ${phone}]${key ? ` (${key})` : ''}\n${text}\n`);
    return { ok: true, driver: 'console' };
  }

  if (!c.apiKey) throw new Error('کلید API پنل پیامکی تنظیم نشده');

  if (c.driver === 'kavenegar') {
    // اگر برای کد ورود الگوی تاییدشده تعریف شده باشد، از lookup استفاده کن
    if (key === 'otp' && c.template && vars.code) {
      const url = `https://api.kavenegar.com/v1/${c.apiKey}/verify/lookup.json`
        + `?receptor=${encodeURIComponent(phone)}`
        + `&token=${encodeURIComponent(vars.code)}`
        + `&template=${encodeURIComponent(c.template)}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!r.ok || (d.return && d.return.status !== 200)) {
        throw new Error((d.return && d.return.message) || `HTTP ${r.status}`);
      }
      return { ok: true, driver: 'kavenegar', mode: 'lookup' };
    }
    const url = `https://api.kavenegar.com/v1/${c.apiKey}/sms/send.json`
      + `?receptor=${encodeURIComponent(phone)}`
      + `&sender=${encodeURIComponent(c.sender)}`
      + `&message=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    const d = await r.json();
    if (!r.ok || (d.return && d.return.status !== 200)) {
      throw new Error((d.return && d.return.message) || `HTTP ${r.status}`);
    }
    return { ok: true, driver: 'kavenegar' };
  }

  if (c.driver === 'smsir') {
    const d = await postJson('https://api.sms.ir/v1/send/bulk',
      { lineNumber: c.lineNo || c.sender, messageText: text, mobiles: [phone] },
      { 'x-api-key': c.apiKey, Accept: 'application/json' });
    if (d.status && d.status !== 1) throw new Error(d.message || 'ارسال ناموفق');
    return { ok: true, driver: 'smsir' };
  }

  if (c.driver === 'melipayamak') {
    const d = await postJson('https://console.melipayamak.com/api/send/simple/' + c.apiKey,
      { from: c.sender, to: phone, text });
    if (d.status && String(d.status).toLowerCase() !== 'ok' && !d.recId) {
      throw new Error(d.status || 'ارسال ناموفق');
    }
    return { ok: true, driver: 'melipayamak' };
  }

  if (c.driver === 'ghasedak') {
    const body = new URLSearchParams({ message: text, receptor: phone, linenumber: c.sender });
    const r = await fetch('https://api.ghasedak.me/v2/sms/send/simple', {
      method: 'POST',
      headers: { apikey: c.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || (d.result && d.result.code !== 200)) {
      throw new Error((d.result && d.result.message) || `HTTP ${r.status}`);
    }
    return { ok: true, driver: 'ghasedak' };
  }

  throw new Error('درایور پیامک ناشناخته: ' + c.driver);
}

module.exports = { send: sendSms, sendSms, conf };
