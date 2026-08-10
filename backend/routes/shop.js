const express = require('express');
const { db } = require('../lib/db');
const { requireAuth } = require('../middleware/auth');
const { paginate } = require('../lib/helpers');

const router = express.Router();

/** میانگین امتیاز محصول را از دیدگاه‌های تاییدشده خریداران بازمحاسبه می‌کند */
function recalcRating(productId) {
  const r = db.prepare(`SELECT AVG(rating) a, COUNT(*) c FROM comments
    WHERE product_id = ? AND status = 'approved' AND is_buyer = 1 AND rating > 0`).get(productId);
  db.prepare('UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?')
    .run(Math.round((r.a || 0) * 10) / 10, r.c || 0, productId);
}
router.recalcRating = recalcRating;

const PRODUCT_FIELDS = `
  p.id, p.slug, p.sku, p.category_id, p.name_fa, p.name_en, p.desc_fa, p.desc_en,
  p.price, p.discount_price, p.stock, p.image_url, p.icon,
  p.is_featured, p.views, p.sold_count, p.created_at,
  p.rating_avg, p.rating_count, p.has_warranty, p.pros_fa, p.cons_fa, p.pros_en, p.cons_en,
  c.slug AS category_slug, c.name_fa AS category_fa, c.name_en AS category_en, c.icon AS category_icon
`;

// ---------------- دسته‌بندی‌ها ----------------
router.get('/categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
    FROM categories c WHERE c.is_active = 1
    ORDER BY c.sort_order, c.id
  `).all();
  res.json({ items: rows });
});

router.get('/categories/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'دسته‌بندی پیدا نشد' });
  res.json({ item: row });
});

// ---------------- محصولات + فیلتر + جستجو ----------------
// GET /api/products?q=&category=&min=&max=&sort=&featured=1&in_stock=1&page=&limit=
router.get('/products', (req, res) => {
  const { page, limit, offset } = paginate(req.query, 12, 60);
  const where = ['p.is_active = 1'];
  const params = {};

  if (req.query.q) {
    where.push('(p.name_fa LIKE @q OR p.name_en LIKE @q OR p.desc_fa LIKE @q OR p.sku LIKE @q)');
    params.q = `%${String(req.query.q).trim()}%`;
  }
  if (req.query.category && req.query.category !== 'all') {
    where.push('c.slug = @cat');
    params.cat = req.query.category;
  }
  if (req.query.min) { where.push('COALESCE(p.discount_price, p.price) >= @min'); params.min = parseInt(req.query.min); }
  if (req.query.max) { where.push('COALESCE(p.discount_price, p.price) <= @max'); params.max = parseInt(req.query.max); }
  if (req.query.featured === '1') where.push('p.is_featured = 1');
  if (req.query.in_stock === '1') where.push('p.stock > 0');

  const sorts = {
    newest: 'p.created_at DESC, p.id DESC',
    cheap: 'COALESCE(p.discount_price, p.price) ASC',
    expensive: 'COALESCE(p.discount_price, p.price) DESC',
    popular: 'p.sold_count DESC, p.views DESC',
    name: 'p.name_fa ASC'
  };
  const orderBy = sorts[req.query.sort] || sorts.newest;
  const whereSql = where.join(' AND ');

  const total = db.prepare(`
    SELECT COUNT(*) AS n FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${whereSql}`).get(params).n;

  const items = db.prepare(`
    SELECT ${PRODUCT_FIELDS} FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}`).all(params);

  const range = db.prepare(`
    SELECT MIN(COALESCE(discount_price, price)) AS min_price,
           MAX(COALESCE(discount_price, price)) AS max_price
    FROM products WHERE is_active = 1`).get();

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1, range });
});

// جستجوی سریع هدر
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ items: [], categories: [] });
  const like = `%${q}%`;

  const items = db.prepare(`
    SELECT ${PRODUCT_FIELDS} FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1
      AND (p.name_fa LIKE @q OR p.name_en LIKE @q OR p.sku LIKE @q
           OR p.desc_fa LIKE @q OR c.name_fa LIKE @q OR c.name_en LIKE @q)
    ORDER BY
      CASE WHEN p.name_fa LIKE @starts OR p.name_en LIKE @starts THEN 0 ELSE 1 END,
      p.sold_count DESC
    LIMIT 8`).all({ q: like, starts: `${q}%` });

  const categories = db.prepare(`
    SELECT c.id, c.slug, c.name_fa, c.name_en, c.icon,
           (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = c.id AND p2.is_active = 1) AS product_count
    FROM categories c
    WHERE c.is_active = 1 AND (c.name_fa LIKE @q OR c.name_en LIKE @q OR c.slug LIKE @q)
    ORDER BY c.sort_order LIMIT 4`).all({ q: like });

  res.json({ items, categories });
});


router.get('/products/:slug', (req, res) => {
  const key = req.params.slug;
  const item = db.prepare(`
    SELECT ${PRODUCT_FIELDS} FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND (p.slug = ? OR p.id = ?)`).get(key, key);
  if (!item) return res.status(404).json({ error: 'محصول پیدا نشد' });

  db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(item.id);

  item.images = db.prepare('SELECT id, url FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(item.id);
  if (item.image_url && !item.images.some(i => i.url === item.image_url)) {
    item.images.unshift({ id: 0, url: item.image_url });
  }

  const opts = db.prepare(`SELECT id, kind, label, unit, color_hex, price_diff, stock, image_url
    FROM product_options WHERE product_id = ? AND is_active = 1 ORDER BY sort_order, id`).all(item.id);
  item.sizes  = opts.filter(o => o.kind === 'size');
  item.colors = opts.filter(o => o.kind === 'color');

  // موجودی هر ترکیب سایز×رنگ
  item.variants = db.prepare(`SELECT size_id, color_id, stock, sku
    FROM product_variants WHERE product_id = ?`).all(item.id);
  item.has_variants = item.variants.length > 0;

  item.comments = db.prepare(`
    SELECT id, user_id, author_name, rating, body, pros, cons, is_buyer, admin_reply, created_at
    FROM comments WHERE product_id = ? AND status = 'approved'
    ORDER BY id DESC LIMIT 50`).all(item.id);

  // آیا کاربر فعلی این محصول را خریده؟ آیا در علاقه‌مندی دارد؟
  item.is_buyer = false;
  item.is_wished = false;
  item.has_reviewed = false;
  if (req.user) {
    item.is_buyer = !!db.prepare(`SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = ? AND o.user_id = ?`).get(item.id, req.user.id);
    item.is_wished = !!db.prepare('SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, item.id);
    item.has_reviewed = !!db.prepare('SELECT 1 FROM comments WHERE user_id = ? AND product_id = ?').get(req.user.id, item.id);
  }

  res.json({ item });
});

// ---------------- نظرات ----------------
router.post('/products/:id/comments', requireAuth, (req, res) => {
  const body = String(req.body.body || '').trim();
  if (body.length < 3) return res.status(400).json({ error: 'متن دیدگاه خیلی کوتاهه' });

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'محصول پیدا نشد' });

  const dup = db.prepare('SELECT id FROM comments WHERE user_id = ? AND product_id = ?').get(req.user.id, product.id);
  if (dup) return res.status(409).json({ error: 'قبلاً برای این محصول دیدگاه ثبت کردی' });

  // فقط خریدار می‌تواند امتیاز و نقاط قوت/ضعف بدهد
  const isBuyer = !!db.prepare(`SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = ? AND o.user_id = ?`).get(product.id, req.user.id);

  const rating = isBuyer ? Math.min(5, Math.max(1, parseInt(req.body.rating) || 5)) : 0;
  const pros = isBuyer ? String(req.body.pros || '').trim() : '';
  const cons = isBuyer ? String(req.body.cons || '').trim() : '';

  const name = `${req.user.first_name} ${req.user.last_name}`.trim() || 'کاربر مای پیکسل';
  db.prepare(`INSERT INTO comments (product_id, user_id, author_name, rating, body, pros, cons, is_buyer)
    VALUES (?,?,?,?,?,?,?,?)`).run(product.id, req.user.id, name, rating, body, pros, cons, isBuyer ? 1 : 0);

  res.status(201).json({
    ok: true,
    is_buyer: isBuyer,
    message: 'دیدگاهت ثبت شد و بعد از تایید مدیر نمایش داده می‌شه'
  });
});

// حذف دیدگاه توسط خود کاربر
router.delete('/comments/:id', requireAuth, (req, res) => {
  const c = db.prepare('SELECT id, user_id, product_id FROM comments WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'دیدگاه پیدا نشد' });
  if (c.user_id !== req.user.id) return res.status(403).json({ error: 'این دیدگاه مال تو نیست' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(c.id);
  recalcRating(c.product_id);
  res.json({ ok: true });
});


// ---------------- سوالات متداول ----------------
router.get('/faqs', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

// ---------------- اطلاعیه‌ها ----------------
router.get('/announcements', (_req, res) => {
  res.json({
    items: db.prepare(`SELECT * FROM announcements WHERE is_active = 1
                       ORDER BY is_pinned DESC, published_at DESC, id DESC`).all()
  });
});

// ---------------- درگاه‌های پرداخت فعال ----------------
router.get('/gateways', (_req, res) => {
  res.json({
    items: db.prepare(`SELECT id, code, name_fa, name_en FROM payment_gateways
                       WHERE is_active = 1 ORDER BY sort_order, id`).all()
  });
});

// ---------------- تنظیمات عمومی ----------------
router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) if (!r.key.startsWith('private_')) out[r.key] = r.value;
  res.json({ settings: out });
});

// ---------------- پروموشن‌ها ----------------
router.get('/promotions', (_req, res) => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const promos = db.prepare(`SELECT * FROM promotions WHERE is_active = 1
    AND (starts_at IS NULL OR starts_at = '' OR starts_at <= ?)
    AND (ends_at   IS NULL OR ends_at   = '' OR ends_at   >= ?)
    ORDER BY sort_order, id`).all(now, now);

  const itemsStmt = db.prepare(`
    SELECT ${PRODUCT_FIELDS} FROM promotion_items pi
    JOIN products p ON p.id = pi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE pi.promotion_id = ? AND p.is_active = 1
    ORDER BY pi.sort_order, p.id`);

  res.json({
    items: promos.map(pr => ({ ...pr, products: itemsStmt.all(pr.id) })).filter(pr => pr.products.length)
  });
});

// ---------------- بنرها ----------------
router.get('/banners', (req, res) => {
  const pos = req.query.position;
  const rows = pos
    ? db.prepare('SELECT * FROM banners WHERE is_active = 1 AND position = ? ORDER BY sort_order, id').all(pos)
    : db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order, id').all();
  res.json({ items: rows });
});

// ---------------- استان‌ها و آیکون‌ها ----------------
router.get('/provinces', (_req, res) => res.json({ items: require('../lib/provinces') }));
router.get('/icons', (_req, res) => res.json({ items: require('../lib/icons') }));

// ---------------- اعتبارسنجی کد تخفیف ----------------
router.post('/coupon/check', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const subtotal = parseInt(req.body.subtotal) || 0;
  const c = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1').get(code);
  if (!c) return res.status(404).json({ error: 'کد تخفیف معتبر نیست' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (c.starts_at && c.starts_at > now) return res.status(400).json({ error: 'این کد هنوز فعال نشده' });
  if (c.ends_at && c.ends_at < now)     return res.status(400).json({ error: 'این کد منقضی شده' });
  if (c.max_uses && c.used_count >= c.max_uses) return res.status(400).json({ error: 'ظرفیت این کد پر شده' });
  if (subtotal < c.min_order) {
    return res.status(400).json({ error: `حداقل مبلغ سفارش برای این کد ${c.min_order.toLocaleString('en-US')} تومانه` });
  }

  let amount = c.kind === 'percent' ? Math.floor(subtotal * c.value / 100) : c.value;
  if (c.kind === 'percent' && c.max_amount > 0) amount = Math.min(amount, c.max_amount);
  amount = Math.min(amount, subtotal);

  res.json({ ok: true, code: c.code, kind: c.kind, value: c.value, amount });
});

// ---------------- کانال‌های پشتیبانی ----------------
router.get('/support-channels', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM support_channels WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

// ---------------- کانال‌های پشتیبانی ----------------
router.get('/support-channels', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM support_channels WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

// ---------------- پلتفرم‌های فروش ----------------
router.get('/platforms', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM platforms WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

module.exports = router;
