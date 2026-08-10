const jwt = require('jsonwebtoken');
const { db } = require('../lib/db');

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const EXPIRES = process.env.JWT_EXPIRES || '30d';

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone || null },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

function readToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  if (req.cookies && req.cookies.mp_token) return req.cookies.mp_token;
  return null;
}

/** کاربر را اگر توکن معتبر بود روی req.user می‌گذارد؛ ولی جلوی درخواست را نمی‌گیرد */
function attachUser(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1 AND is_banned = 0').get(payload.id);
    if (user) {
      delete user.password_hash;
      req.user = user;
    }
  } catch (_) { /* توکن نامعتبر — مهمان */ }
  next();
}

/** ورود اجباری */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'برای این کار باید وارد حساب کاربری بشی' });
  next();
}

/** فقط ادمین */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'ابتدا وارد پنل مدیریت شو' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'دسترسی مدیریتی نداری' });
  next();
}

/** ثبت لاگ فعالیت ادمین */
function logAdmin(req, action, entity, entityId, meta = {}) {
  try {
    db.prepare(
      'INSERT INTO admin_log (admin_id, action, entity, entity_id, meta, ip) VALUES (?,?,?,?,?,?)'
    ).run(
      req.user ? req.user.id : null,
      action, entity,
      entityId == null ? null : String(entityId),
      JSON.stringify(meta),
      req.ip || ''
    );
  } catch (_) { /* لاگ نباید درخواست را بشکند */ }
}

module.exports = { sign, attachUser, requireAuth, requireAdmin, logAdmin, SECRET };
