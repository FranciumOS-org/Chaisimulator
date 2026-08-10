const { db } = require('./db');

/**
 * ترکیب‌های ممکن یک محصول را می‌سازد یا به‌روز می‌کند.
 * اگر محصول سایز/رنگ نداشته باشد، ترکیبی ساخته نمی‌شود و
 * موجودی از خود جدول products خوانده می‌شود.
 */
function syncVariants(productId) {
  const sizes  = db.prepare("SELECT id FROM product_options WHERE product_id=? AND kind='size'  AND is_active=1 ORDER BY sort_order, id").all(productId);
  const colors = db.prepare("SELECT id FROM product_options WHERE product_id=? AND kind='color' AND is_active=1 ORDER BY sort_order, id").all(productId);

  if (!sizes.length && !colors.length) {
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
    return { created: 0, removed: 0 };
  }

  const wanted = [];
  const S = sizes.length ? sizes.map(s => s.id) : [null];
  const C = colors.length ? colors.map(c => c.id) : [null];
  for (const s of S) for (const c of C) wanted.push({ size_id: s, color_id: c });

  const ins = db.prepare(`INSERT OR IGNORE INTO product_variants (product_id, size_id, color_id, stock)
                          VALUES (?,?,?,0)`);
  let created = 0;
  db.transaction(() => { for (const v of wanted) created += ins.run(productId, v.size_id, v.color_id).changes; })();

  // ترکیب‌هایی که گزینه‌شان حذف شده را پاک کن
  const key = v => `${v.size_id ?? 'n'}|${v.color_id ?? 'n'}`;
  const keep = new Set(wanted.map(key));
  const all = db.prepare('SELECT id, size_id, color_id FROM product_variants WHERE product_id = ?').all(productId);
  const stale = all.filter(v => !keep.has(key(v)));
  const del = db.prepare('DELETE FROM product_variants WHERE id = ?');
  db.transaction(() => stale.forEach(v => del.run(v.id)))();

  return { created, removed: stale.length };
}

/** موجودی کل محصول را برابر مجموع ترکیب‌ها می‌کند */
function rollupStock(productId) {
  const n = db.prepare('SELECT COUNT(*) c FROM product_variants WHERE product_id = ?').get(productId).c;
  if (!n) return null;                       // بدون ترکیب: products.stock دست‌نخورده می‌ماند
  const sum = db.prepare('SELECT COALESCE(SUM(stock),0) s FROM product_variants WHERE product_id = ?').get(productId).s;
  db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(sum, productId);
  return sum;
}

/** ترکیب متناظر با سایز و رنگ انتخابی؛ اگر محصول ترکیب نداشته باشد null */
function findVariant(productId, sizeId, colorId) {
  const has = db.prepare('SELECT COUNT(*) c FROM product_variants WHERE product_id = ?').get(productId).c;
  if (!has) return null;
  return db.prepare(`SELECT * FROM product_variants
    WHERE product_id = ? AND size_id IS ? AND color_id IS ?`).get(productId, sizeId ?? null, colorId ?? null) || undefined;
}

module.exports = { syncVariants, rollupStock, findVariant };
