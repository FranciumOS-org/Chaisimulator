require('dotenv').config();
const { db, migrate } = require('./lib/db');

migrate();

/**
 * ردیف‌های تکراری را حذف می‌کند و قدیمی‌ترین (کوچک‌ترین id) را نگه می‌دارد.
 * محتوایی که خودت بعداً اضافه یا ویرایش کردی دست‌نخورده می‌ماند.
 */
function dedupe(table, keyCols) {
  const key = keyCols.join(', ');
  const before = db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;

  const info = db.prepare(`
    DELETE FROM ${table}
    WHERE id NOT IN (SELECT MIN(id) FROM ${table} GROUP BY ${key})
  `).run();

  const after = db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;
  if (info.changes) {
    console.log(`  ✓ ${table.padEnd(16)} ${before} → ${after}   (${info.changes} تکراری حذف شد)`);
  } else {
    console.log(`  · ${table.padEnd(16)} ${after}   (تکراری نداشت)`);
  }
  return info.changes;
}

console.log('\n  پاک‌سازی ردیف‌های تکراری…\n');

let total = 0;
db.transaction(() => {
  total += dedupe('faqs', ['question_fa']);
  total += dedupe('announcements', ['title_fa', 'body_fa']);
  total += dedupe('categories', ['slug']);
  total += dedupe('products', ['slug']);
  total += dedupe('payment_gateways', ['code']);
  total += dedupe('promotions', ['title_fa', 'kind']);
  total += dedupe('coupons', ['code']);
  total += dedupe('banners', ['title_fa', 'position']);
})();

console.log(total ? `\n  در مجموع ${total} ردیف تکراری حذف شد.\n`
                  : '\n  چیزی برای حذف نبود — دیتابیس تمیزه.\n');
