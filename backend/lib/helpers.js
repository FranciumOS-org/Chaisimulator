const crypto = require('crypto');

/** تبدیل ارقام فارسی/عربی به انگلیسی */
function toEnDigits(s = '') {
  const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
  return String(s).replace(/[۰-۹٠-٩]/g, d => {
    const i = fa.indexOf(d);
    return i > -1 ? i : ar.indexOf(d);
  });
}

/** نرمال‌سازی شماره موبایل ایران → 09xxxxxxxxx */
function normalizePhone(input) {
  let p = toEnDigits(input || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if (p.length === 10 && p.startsWith('9')) p = '0' + p;
  return p;
}

function isValidPhone(p) {
  return /^09\d{9}$/.test(p);
}

/** اسلاگ سازگار با فارسی */
function slugify(text, fallback = 'item') {
  const s = String(text || '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return s || `${fallback}-${Date.now().toString(36)}`;
}

/** کد پیگیری سفارش: MP-XXXXXX */
function makeTrackingCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return `MP-${out}`;
}

function makeOtp(len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) out += crypto.randomInt(0, 10);
  return out;
}

function paginate(query, defLimit = 12, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defLimit));
  return { page, limit, offset: (page - 1) * limit };
}

const ORDER_STATUSES = [
  'pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'
];

const ORDER_STATUS_FA = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شد',
  processing: 'در حال آماده‌سازی',
  packed: 'بسته‌بندی شد',
  shipped: 'ارسال شد',
  delivered: 'تحویل داده شد',
  cancelled: 'لغو شد',
  refunded: 'مرجوع شد'
};

module.exports = {
  toEnDigits, normalizePhone, isValidPhone, slugify,
  makeTrackingCode, makeOtp, paginate, ORDER_STATUSES, ORDER_STATUS_FA
};
