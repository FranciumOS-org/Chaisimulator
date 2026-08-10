const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { db } = require('../lib/db');
const { notify } = require('../lib/notify');
const { sign, requireAuth, logAdmin } = require('../middleware/auth');
const { normalizePhone, isValidPhone, makeOtp } = require('../lib/helpers');

const router = express.Router();

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL || '120', 10);
const EXPOSE_OTP = process.env.EXPOSE_OTP === '1'; // فقط برای تست/دمو

// در حالت توسعه (EXPOSE_OTP=1) سقف بالاتر است تا موقع تست لوکال به ۴۲۹ نخوری.
// با OTP_MAX و OTP_WINDOW_MIN در .env هم قابل تنظیم است.
const DEV_OTP = process.env.EXPOSE_OTP === '1';
const OTP_MAX = parseInt(process.env.OTP_MAX || (DEV_OTP ? '100' : '6'), 10);
const OTP_WINDOW = parseInt(process.env.OTP_WINDOW_MIN || '10', 10) * 60 * 1000;

const otpLimiter = rateLimit({
  windowMs: OTP_WINDOW,
  max: OTP_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تعداد درخواست کد زیاد شد. چند دقیقه دیگه دوباره امتحان کن.' }
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: DEV_OTP ? 100 : 10 });

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
}

// ---------------------------------------------------------
// POST /api/auth/otp/request   { phone, mode: 'login'|'register', first_name?, last_name? }
// ---------------------------------------------------------
router.post('/otp/request', otpLimiter, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const mode = req.body.mode === 'register' ? 'register' : 'login';

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر نیست. مثل 09123456789 وارد کن.' });
  }

  const existing = db.prepare('SELECT id, is_banned FROM users WHERE phone = ?').get(phone);

  if (mode === 'login' && !existing) {
    return res.status(404).json({ error: 'حسابی با این شماره پیدا نشد. اول ثبت‌نام کن.' });
  }
  if (mode === 'register' && existing) {
    return res.status(409).json({ error: 'این شماره قبلاً ثبت‌نام کرده. از بخش ورود وارد شو.' });
  }
  if (existing && existing.is_banned) {
    return res.status(403).json({ error: 'این حساب مسدود شده است.' });
  }

  let payload = null;
  if (mode === 'register') {
    const first = String(req.body.first_name || '').trim();
    const last = String(req.body.last_name || '').trim();
    if (first.length < 2) return res.status(400).json({ error: 'نام رو کامل وارد کن.' });
    if (last.length < 2) return res.status(400).json({ error: 'نام خانوادگی رو کامل وارد کن.' });
    payload = JSON.stringify({ first_name: first, last_name: last });
  }

  // کدهای قبلی همین شماره را باطل کن
  db.prepare('UPDATE otp_codes SET consumed = 1 WHERE phone = ? AND consumed = 0').run(phone);

  const code = makeOtp(5);
  db.prepare(`INSERT INTO otp_codes (phone, code, purpose, payload, expires_at)
              VALUES (?,?,?,?, datetime('now', '+' || ? || ' seconds'))`)
    .run(phone, code, mode, payload, OTP_TTL_SECONDS);

  await notify('otp', phone, { code, minutes: 2 });

  res.json({
    ok: true,
    message: 'کد تایید پیامک شد',
    expires_in: OTP_TTL_SECONDS,
    ...(EXPOSE_OTP ? { dev_code: code } : {})
  });
});

// ---------------------------------------------------------
// POST /api/auth/otp/verify   { phone, code }
// ---------------------------------------------------------
router.post('/otp/verify', otpLimiter, (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '').replace(/\D/g, '');

  const row = db.prepare(`SELECT * FROM otp_codes
                          WHERE phone = ? AND consumed = 0
                          ORDER BY id DESC LIMIT 1`).get(phone);

  if (!row) return res.status(400).json({ error: 'کدی برای این شماره ثبت نشده. دوباره درخواست بده.' });

  const expired = db.prepare("SELECT datetime('now') > ? AS x").get(row.expires_at).x;
  if (expired) {
    db.prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?').run(row.id);
    return res.status(400).json({ error: 'کد منقضی شده. کد جدید بگیر.' });
  }
  if (row.attempts >= 5) {
    db.prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?').run(row.id);
    return res.status(429).json({ error: 'تعداد تلاش زیاد شد. کد جدید بگیر.' });
  }
  if (row.code !== code) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return res.status(400).json({ error: 'کد وارد شده درست نیست.' });
  }

  db.prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?').run(row.id);

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    const p = row.payload ? JSON.parse(row.payload) : { first_name: '', last_name: '' };
    const info = db.prepare(
      'INSERT INTO users (first_name, last_name, phone, role) VALUES (?,?,?,?)'
    ).run(p.first_name || '', p.last_name || '', phone, 'customer');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    sendWelcome(user);          // اولین ساخت حساب → پیامک خوش‌آمد
  }
  if (user.is_banned) return res.status(403).json({ error: 'این حساب مسدود شده است.' });

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  const token = sign(user);
  res.cookie('mp_token', token, cookieOpts());
  delete user.password_hash;
  res.json({ ok: true, token, user });
});

// ---------------------------------------------------------
// POST /api/auth/admin/login   { username, password }
// ---------------------------------------------------------
router.post('/admin/login', loginLimiter, (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = db.prepare(
    "SELECT * FROM users WHERE (username = ? OR phone = ? OR email = ?) AND role = 'admin'"
  ).get(username, normalizePhone(username), username);

  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
  }
  if (user.is_banned || !user.is_active) {
    return res.status(403).json({ error: 'این حساب غیرفعال است.' });
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  const token = sign(user);
  res.cookie('mp_token', token, cookieOpts());
  delete user.password_hash;

  req.user = user;
  logAdmin(req, 'login', 'admin', user.id);

  res.json({ ok: true, token, user });
});

// ---------------------------------------------------------
// POST /api/auth/google  — اسکلت. بعداً با Google Identity کامل می‌شود.
// ---------------------------------------------------------
/** توکن را روی کوکی می‌نشاند (همان تنظیماتی که مسیرهای دیگر استفاده می‌کنند) */
function setAuthCookie(res, token) {
  res.cookie('mp_token', token, cookieOpts());
}

/** پیامک خوش‌آمد برای اولین ورود — شکستش نباید ثبت‌نام را خراب کند */
function sendWelcome(user) {
  if (!user || !user.phone) return;
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'دوست عزیز';
  notify('welcome', user.phone, { name }).catch(() => {});
}

/** تنظیمات گوگل از جدول settings */
function googleConf() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'google_%' OR key = 'private_google_client_secret'").all();
  const o = {}; rows.forEach(r => o[r.key] = r.value);
  return {
    enabled: o.google_enabled === '1',
    clientId: (o.google_client_id || process.env.GOOGLE_CLIENT_ID || '').trim(),
    clientSecret: (o.private_google_client_secret || process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    redirectUri: (o.google_redirect_uri || process.env.GOOGLE_REDIRECT_URI || '').trim()
  };
}

/** آیا ورود با گوگل آماده است؟ سایت با این تصمیم می‌گیرد دکمه را نشان بدهد یا نه */
router.get('/google/config', (_req, res) => {
  const c = googleConf();
  res.json({ enabled: c.enabled && !!c.clientId, client_id: c.enabled ? c.clientId : '' });
});

/** ورود/ثبت‌نام با گوگل — هم credential (Google Identity) هم code (OAuth) */
router.post('/google', async (req, res) => {
  const conf = googleConf();
  if (!conf.enabled) return res.status(503).json({ error: 'ورود با گوگل توسط مدیر فعال نشده.' });
  if (!conf.clientId) return res.status(503).json({ error: 'شناسه کلاینت گوگل تنظیم نشده.' });

  let payload = null;

  try {
    if (req.body.credential) {
      // حالت Google Identity Services: توکن هویت را مستقیم اعتبارسنجی کن
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(req.body.credential));
      if (!r.ok) return res.status(401).json({ error: 'توکن گوگل معتبر نیست.' });
      payload = await r.json();
    } else if (req.body.code) {
      // حالت OAuth: کد را با کلاینت‌سکرت تبدیل به توکن کن
      if (!conf.clientSecret) return res.status(503).json({ error: 'کلاینت‌سکرت گوگل تنظیم نشده.' });
      const body = new URLSearchParams({
        code: req.body.code,
        client_id: conf.clientId,
        client_secret: conf.clientSecret,
        redirect_uri: req.body.redirect_uri || conf.redirectUri,
        grant_type: 'authorization_code'
      });
      const tr = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
      });
      const tok = await tr.json();
      if (!tr.ok || !tok.id_token) {
        return res.status(401).json({ error: tok.error_description || 'تبادل کد با گوگل ناموفق بود.' });
      }
      const r2 = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tok.id_token));
      payload = await r2.json();
    } else {
      return res.status(400).json({ error: 'توکن یا کد گوگل ارسال نشد.' });
    }
  } catch (e) {
    return res.status(502).json({ error: 'ارتباط با گوگل برقرار نشد: ' + e.message });
  }

  if (!payload || !payload.sub) return res.status(401).json({ error: 'پاسخ گوگل قابل خواندن نبود.' });
  if (payload.aud && payload.aud !== conf.clientId) {
    return res.status(401).json({ error: 'این توکن برای این فروشگاه صادر نشده.' });
  }
  if (payload.email_verified === 'false' || payload.email_verified === false) {
    return res.status(401).json({ error: 'ایمیل گوگل تایید نشده.' });
  }

  const email = (payload.email || '').toLowerCase();
  const first = payload.given_name || '';
  const last  = payload.family_name || '';
  const avatar = payload.picture || null;

  // اول با google_id، بعد با ایمیل — تا حساب موجود دوباره ساخته نشود
  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(payload.sub);
  let isNew = false;

  if (!user && email) {
    user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
    if (user) db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(payload.sub, user.id);
  }

  if (!user) {
    const info = db.prepare(`INSERT INTO users (first_name, last_name, email, google_id, avatar_url, role)
      VALUES (?,?,?,?,?,'customer')`).run(first, last, email || null, payload.sub, avatar);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    isNew = true;
  } else {
    if (user.is_banned) return res.status(403).json({ error: 'این حساب مسدود شده.' });
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  }

  if (isNew) sendWelcome(user);

  delete user.password_hash;
  const token = sign(user);
  setAuthCookie(res, token);
  res.json({ ok: true, token, user, is_new: isNew, needs_phone: !user.phone });
});


// ---------------------------------------------------------
router.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('mp_token');
  res.json({ ok: true });
});

router.patch('/me', requireAuth, (req, res) => {
  const { first_name, last_name, email } = req.body;
  db.prepare('UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email) WHERE id = ?')
    .run(first_name ?? null, last_name ?? null, email ?? null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  delete user.password_hash;
  res.json({ ok: true, user });
});

module.exports = router;
