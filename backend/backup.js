#!/usr/bin/env node
/**
 * بکاپ امن از دیتابیس.
 *
 *   node backup.js                 → در پوشه backups
 *   node backup.js /mnt/backups    → مسیر دلخواه
 *
 * از VACUUM INTO استفاده می‌کند: بکاپ حتی وسط نوشتن هم سالم است
 * و فایل خروجی فشرده و بدون فضای هدررفته است.
 * کپی ساده‌ی فایل (cp) موقع نوشتن، دیتابیس خراب می‌دهد.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('./lib/db');

const KEEP = parseInt(process.env.BACKUP_KEEP || '14', 10);   // چند بکاپ نگه داشته شود
const dir = process.argv[2]
  || process.env.BACKUP_DIR
  || path.join(__dirname, '..', 'backups');

fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = path.join(dir, `mypixel-${stamp}.db`);

try {
  // VACUUM INTO یک بکاپ اتمیک و منسجم می‌سازد
  db.prepare('VACUUM INTO ?').run(out);
  const size = fs.statSync(out).size;

  // سلامت فایل خروجی را بررسی کن
  const Database = require('better-sqlite3');
  const check = new Database(out, { readonly: true });
  const res = check.pragma('integrity_check', { simple: true });
  const orders = check.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const products = check.prepare('SELECT COUNT(*) c FROM products').get().c;
  check.close();

  if (res !== 'ok') {
    console.error('✗ بکاپ سالم نیست:', res);
    fs.unlinkSync(out);
    process.exit(1);
  }

  console.log(`✓ بکاپ گرفته شد: ${out}`);
  console.log(`  حجم: ${(size / 1024 / 1024).toFixed(2)} مگابایت | سفارش: ${orders} | محصول: ${products}`);

  // بکاپ‌های قدیمی را پاک کن
  const olds = fs.readdirSync(dir)
    .filter(f => /^mypixel-.*\.db$/.test(f))
    .sort()
    .reverse();
  const extra = olds.slice(KEEP);
  extra.forEach(f => fs.unlinkSync(path.join(dir, f)));
  if (extra.length) console.log(`  ${extra.length} بکاپ قدیمی پاک شد (${KEEP} تای آخر نگه داشته شد)`);

} catch (e) {
  console.error('✗ بکاپ ناموفق:', e.message);
  process.exit(1);
}
