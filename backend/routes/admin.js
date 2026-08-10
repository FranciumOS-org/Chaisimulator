const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db } = require('../lib/db');
const { requireAdmin, logAdmin } = require('../middleware/auth');
const { slugify, paginate, normalizePhone, ORDER_STATUSES, ORDER_STATUS_FA } = require('../lib/helpers');

const router = express.Router();
const { syncVariants, rollupStock } = require('../lib/variants');
const { notify, getTemplate, ensureTemplates, DEFAULTS, render } = require('../lib/notify');

/** میانگین امتیاز محصول را از دیدگاه‌های تاییدشده خریداران بازمحاسبه می‌کند */
function recalcRating(productId) {
  if (!productId) return;
  const r = db.prepare(`SELECT AVG(rating) a, COUNT(*) c FROM comments
    WHERE product_id = ? AND status = 'approved' AND is_buyer = 1 AND rating > 0`).get(productId);
  db.prepare('UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?')
    .run(Math.round((r.a || 0) * 10) / 10, r.c || 0, productId);
}
router.use(requireAdmin);            // ← همه‌ی مسیرهای زیر فقط برای ادمین

// ===================== آپلود تصویر =====================
// On Vercel, route uploads to the writable /tmp directory. Otherwise, use the local public folder.
const UPLOAD_DIR = process.env.VERCEL 
  ? '/tmp/uploads' 
  : (process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'public', 'uploads'));

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[Warning] Could not create uploads directory. Running on read-only file system.');
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, UPLOAD_DIR),
    filename: (_r, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype);
    cb(ok ? null : new Error('فقط فایل تصویری مجاز است'), ok);
  }
});

/** فایل آپلودشده را در فهرست رسانه ثبت می‌کند */
function registerMedia(req, file) {
  const url = `/uploads/${file.filename}`;
  try {
    db.prepare(`INSERT OR IGNORE INTO media (url, filename, size, mime, uploaded_by)
                VALUES (?,?,?,?,?)`).run(url, file.originalname || file.filename,
                file.size || 0, file.mimetype || '', req.user ? req.user.id : null);
  } catch (_) { /* ثبت رسانه نباید آپلود را بشکند */ }
  return url;
}

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'فایلی دریافت نشد' });
  const url = registerMedia(req, req.file);
  logAdmin(req, 'create', 'upload', req.file.filename);
  res.json({ ok: true, url });
});

/* ═══════════════════════════════════════════════════
   مدیریت رسانه
═══════════════════════════════════════════════════ */
const fsx = require('fs');
const pathx = require('path');

/** جاهایی که یک تصویر استفاده شده را پیدا می‌کند */
function mediaUsage(url) {
  const q = (sql, ...a) => { try { return db.prepare(sql).all(...a); } catch (_) { return []; } };
  const out = [];
  q('SELECT id, name_fa FROM products WHERE image_url = ?', url)
    .forEach(r => out.push({ kind: 'product', id: r.id, title: r.name_fa }));
  q(`SELECT pi.product_id id, p.name_fa FROM product_images pi
     JOIN products p ON p.id = pi.product_id WHERE pi.url = ?`, url)
    .forEach(r => out.push({ kind: 'gallery', id: r.id, title: r.name_fa }));
  q('SELECT id, title_fa FROM banners WHERE image_url = ?', url)
    .forEach(r => out.push({ kind: 'banner', id: r.id, title: r.title_fa }));
  q('SELECT id, name_fa FROM platforms WHERE logo_url = ? OR bg_url = ?', url, url)
    .forEach(r => out.push({ kind: 'platform', id: r.id, title: r.name_fa }));
  q('SELECT id, name_fa FROM support_channels WHERE logo_url = ? OR bg_url = ?', url, url)
    .forEach(r => out.push({ kind: 'channel', id: r.id, title: r.name_fa }));
  q('SELECT key FROM settings WHERE value = ?', url)
    .forEach(r => out.push({ kind: 'setting', id: r.key, title: r.key }));
  return out;
}

router.get('/media', (req, res) => {
  // فایل‌های روی دیسک را با جدول همگام کن (برای آپلودهای قدیمی‌تر)
  try {
    if (fsx.existsSync(UPLOAD_DIR)) {
      const known = new Set(db.prepare('SELECT url FROM media').all().map(r => r.url));
      const ins = db.prepare('INSERT OR IGNORE INTO media (url, filename, size, mime) VALUES (?,?,?,?)');
      for (const f of fsx.readdirSync(UPLOAD_DIR)) {
        const url = '/uploads/' + f;
        if (known.has(url)) continue;
        const st = fsx.statSync(pathx.join(UPLOAD_DIR, f));
        if (!st.isFile()) continue;
        const ext = pathx.extname(f).slice(1).toLowerCase();
        ins.run(url, f, st.size, ext ? 'image/' + ext : '');
      }
      // رکوردهایی که فایلشان پاک شده
      db.prepare('SELECT id, url FROM media').all().forEach(r => {
        if (!fsx.existsSync(pathx.join(UPLOAD_DIR, pathx.basename(r.url)))) {
          db.prepare('DELETE FROM media WHERE id = ?').run(r.id);
        }
      });
    }
  } catch (_) { /* همگام‌سازی اختیاری است */ }

  const q = String(req.query.q || '').trim();
  const rows = q
    ? db.prepare(`SELECT * FROM media WHERE filename LIKE ? OR title LIKE ? OR url LIKE ?
                  ORDER BY id DESC`).all(`%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare('SELECT * FROM media ORDER BY id DESC').all();

  const items = rows.map(r => ({ ...r, usage: mediaUsage(r.url) }));
  const total = items.reduce((n, i) => n + (i.size || 0), 0);
  res.json({ items, total_size: total, unused: items.filter(i => !i.usage.length).length });
});

router.put('/media/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'فایل پیدا نشد' });
  db.prepare('UPDATE media SET title = ?, alt = ? WHERE id = ?')
    .run(String(req.body.title ?? cur.title), String(req.body.alt ?? cur.alt), cur.id);
  res.json({ ok: true });
});

router.delete('/media/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'فایل پیدا نشد' });

  const used = mediaUsage(cur.url);
  if (used.length && req.query.force !== '1') {
    return res.status(409).json({
      error: `این تصویر در ${used.length} جا استفاده شده. اگر مطمئنی، حذف اجباری بزن.`,
      usage: used
    });
  }

  // ارجاع‌ها را پاک کن تا تصویر شکسته نماند
  try {
    db.prepare('UPDATE products SET image_url = NULL WHERE image_url = ?').run(cur.url);
    db.prepare('DELETE FROM product_images WHERE url = ?').run(cur.url);
    db.prepare('UPDATE banners SET image_url = NULL WHERE image_url = ?').run(cur.url);
    db.prepare('UPDATE platforms SET logo_url = NULL WHERE logo_url = ?').run(cur.url);
    db.prepare('UPDATE platforms SET bg_url = NULL WHERE bg_url = ?').run(cur.url);
    db.prepare('UPDATE support_channels SET logo_url = NULL WHERE logo_url = ?').run(cur.url);
    db.prepare('UPDATE support_channels SET bg_url = NULL WHERE bg_url = ?').run(cur.url);
    db.prepare("UPDATE settings SET value = '' WHERE value = ?").run(cur.url);
  } catch (_) { }

  try { fsx.unlinkSync(pathx.join(UPLOAD_DIR, pathx.basename(cur.url))); } catch (_) { }
  db.prepare('DELETE FROM media WHERE id = ?').run(cur.id);
  logAdmin(req, 'delete', 'media', cur.id, { url: cur.url });
  res.json({ ok: true });
});

/** آپلود دسته‌ای مستقیم از بخش رسانه */
router.post('/media', upload.array('files', 20), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'فایلی دریافت نشد' });
  const urls = req.files.map(f => registerMedia(req, f));
  logAdmin(req, 'create', 'media', null, { count: urls.length });
  res.status(201).json({ ok: true, urls });
});

// ===================== داشبورد =====================
router.get('/stats', (_req, res) => {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  res.json({
    products: one('SELECT COUNT(*) n FROM products').n,
    products_active: one('SELECT COUNT(*) n FROM products WHERE is_active = 1').n,
    low_stock: one('SELECT COUNT(*) n FROM products WHERE stock <= 2 AND is_active = 1').n,
    categories: one('SELECT COUNT(*) n FROM categories').n,
    users: one("SELECT COUNT(*) n FROM users WHERE role = 'customer'").n,
    orders: one('SELECT COUNT(*) n FROM orders').n,
    orders_open: one("SELECT COUNT(*) n FROM orders WHERE status NOT IN ('delivered','cancelled','refunded')").n,
    revenue: one("SELECT COALESCE(SUM(total),0) v FROM orders WHERE payment_status = 'paid'").v,
    comments_pending: one("SELECT COUNT(*) n FROM comments WHERE status = 'pending'").n,
    returns_pending: db.prepare("SELECT COUNT(*) c FROM returns WHERE status='pending'").get().c,
    recent_orders: db.prepare(`SELECT id, tracking_code, customer_name, total, status, created_at
                               FROM orders ORDER BY id DESC LIMIT 8`).all()
      .map(o => ({ ...o, status_fa: ORDER_STATUS_FA[o.status] || o.status })),
    sales_7d: db.prepare(`SELECT date(created_at) d, COUNT(*) c, COALESCE(SUM(total),0) v
                          FROM orders WHERE created_at >= datetime('now','-7 days')
                          GROUP BY d ORDER BY d`).all()
  });
});

// ===================== محصولات =====================
router.get('/products', (req, res) => {
  const { page, limit, offset } = paginate(req.query, 20, 200);
  const where = [], params = {};
  if (req.query.q) { where.push('(p.name_fa LIKE @q OR p.name_en LIKE @q OR p.sku LIKE @q)'); params.q = `%${req.query.q}%`; }
  if (req.query.category) { where.push('p.category_id = @cat'); params.cat = parseInt(req.query.category); }
  if (req.query.status === 'active') where.push('p.is_active = 1');
  if (req.query.status === 'inactive') where.push('p.is_active = 0');
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) n FROM products p ${w}`).get(params).n;
  const items = db.prepare(`
    SELECT p.*, c.name_fa AS category_fa FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${w} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`).all(params);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.post('/products', (req, res) => {
  const b = req.body;
  if (!b.name_fa) return res.status(400).json({ error: 'نام فارسی محصول لازمه' });
  const slug = slugify(b.slug || b.name_en || b.name_fa, 'product');
  try {
    const info = db.prepare(`
      INSERT INTO products (slug, sku, category_id, name_fa, name_en, desc_fa, desc_en,
                            price, discount_price, stock, image_url, icon, is_active, is_featured,
                            pros_fa, cons_fa, pros_en, cons_en, has_warranty)
      VALUES (@slug,@sku,@category_id,@name_fa,@name_en,@desc_fa,@desc_en,
              @price,@discount_price,@stock,@image_url,@icon,@is_active,@is_featured,
              @pros_fa,@cons_fa,@pros_en,@cons_en,@has_warranty)`).run({
      slug,
      sku: b.sku || null,
      category_id: b.category_id || null,
      name_fa: b.name_fa,
      name_en: b.name_en || '',
      desc_fa: b.desc_fa || '',
      desc_en: b.desc_en || '',
      price: parseInt(b.price) || 0,
      discount_price: b.discount_price ? parseInt(b.discount_price) : null,
      stock: parseInt(b.stock) || 0,
      image_url: b.image_url || null,
      icon: b.icon || 'box',
      is_active: b.is_active === false ? 0 : 1,
      is_featured: b.is_featured ? 1 : 0,
      pros_fa: b.pros_fa || '', cons_fa: b.cons_fa || '',
      pros_en: b.pros_en || '', cons_en: b.cons_en || '',
      has_warranty: b.has_warranty === false ? 0 : 1
    });
    syncVariants(info.lastInsertRowid);
    logAdmin(req, 'create', 'product', info.lastInsertRowid, { name: b.name_fa });
    res.status(201).json({ ok: true, item: db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid) });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'اسلاگ یا SKU تکراری است' : e.message });
  }
});

router.put('/products/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'محصول پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE products SET
      slug=@slug, sku=@sku, category_id=@category_id, name_fa=@name_fa, name_en=@name_en,
      desc_fa=@desc_fa, desc_en=@desc_en, price=@price, discount_price=@discount_price,
      stock=@stock, image_url=@image_url, icon=@icon, is_active=@is_active, is_featured=@is_featured,
      pros_fa=@pros_fa, cons_fa=@cons_fa, pros_en=@pros_en, cons_en=@cons_en, has_warranty=@has_warranty,
      updated_at=datetime('now') WHERE id=@id`).run({
    id: cur.id,
    slug: slugify(b.slug || cur.slug, 'product'),
    sku: b.sku ?? cur.sku,
    category_id: b.category_id ?? cur.category_id,
    name_fa: b.name_fa ?? cur.name_fa,
    name_en: b.name_en ?? cur.name_en,
    desc_fa: b.desc_fa ?? cur.desc_fa,
    desc_en: b.desc_en ?? cur.desc_en,
    price: b.price != null ? parseInt(b.price) : cur.price,
    discount_price: b.discount_price ? parseInt(b.discount_price) : null,
    stock: b.stock != null ? parseInt(b.stock) : cur.stock,
    image_url: b.image_url ?? cur.image_url,
    icon: b.icon ?? cur.icon,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    is_featured: b.is_featured != null ? (b.is_featured ? 1 : 0) : cur.is_featured,
    pros_fa: b.pros_fa ?? cur.pros_fa, cons_fa: b.cons_fa ?? cur.cons_fa,
    pros_en: b.pros_en ?? cur.pros_en, cons_en: b.cons_en ?? cur.cons_en,
    has_warranty: b.has_warranty != null ? (b.has_warranty ? 1 : 0) : cur.has_warranty
  });
  logAdmin(req, 'update', 'product', cur.id);
  res.json({ ok: true, item: db.prepare('SELECT * FROM products WHERE id = ?').get(cur.id) });
});

router.delete('/products/:id', (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'محصول پیدا نشد' });
  logAdmin(req, 'delete', 'product', req.params.id);
  res.json({ ok: true });
});

// ===================== دسته‌بندی‌ها =====================
router.get('/categories', (_req, res) => {
  res.json({
    items: db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id) AS product_count
                       FROM categories c ORDER BY c.sort_order, c.id`).all()
  });
});

router.post('/categories', (req, res) => {
  const b = req.body;
  if (!b.name_fa) return res.status(400).json({ error: 'نام دسته‌بندی لازمه' });
  try {
    const info = db.prepare(`INSERT INTO categories (slug,name_fa,name_en,desc_fa,desc_en,icon,image_url,sort_order,is_active)
                             VALUES (?,?,?,?,?,?,?,?,?)`).run(
      slugify(b.slug || b.name_en || b.name_fa, 'category'),
      b.name_fa, b.name_en || '', b.desc_fa || '', b.desc_en || '',
      b.icon || 'box', b.image_url || null,
      parseInt(b.sort_order) || 0, b.is_active === false ? 0 : 1
    );
    logAdmin(req, 'create', 'category', info.lastInsertRowid, { name: b.name_fa });
    res.status(201).json({ ok: true, item: db.prepare('SELECT * FROM categories WHERE id=?').get(info.lastInsertRowid) });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'اسلاگ تکراری است' : e.message });
  }
});

router.put('/categories/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'دسته‌بندی پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE categories SET slug=?,name_fa=?,name_en=?,desc_fa=?,desc_en=?,icon=?,image_url=?,sort_order=?,is_active=? WHERE id=?`).run(
    slugify(b.slug || cur.slug, 'category'),
    b.name_fa ?? cur.name_fa, b.name_en ?? cur.name_en,
    b.desc_fa ?? cur.desc_fa, b.desc_en ?? cur.desc_en,
    b.icon ?? cur.icon, b.image_url ?? cur.image_url,
    b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order,
    b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    cur.id
  );
  logAdmin(req, 'update', 'category', cur.id);
  res.json({ ok: true, item: db.prepare('SELECT * FROM categories WHERE id=?').get(cur.id) });
});

router.delete('/categories/:id', (req, res) => {
  const n = db.prepare('SELECT COUNT(*) n FROM products WHERE category_id = ?').get(req.params.id).n;
  if (n > 0) return res.status(409).json({ error: `${n} محصول در این دسته‌بندی هست. اول اونا رو جابه‌جا کن.` });
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'دسته‌بندی پیدا نشد' });
  logAdmin(req, 'delete', 'category', req.params.id);
  res.json({ ok: true });
});

// ===================== سفارش‌ها =====================
router.get('/orders', (req, res) => {
  const { page, limit, offset } = paginate(req.query, 20, 200);
  const where = [], params = {};
  if (req.query.q) { where.push('(o.tracking_code LIKE @q OR o.customer_name LIKE @q OR o.phone LIKE @q)'); params.q = `%${req.query.q}%`; }
  if (req.query.status && req.query.status !== 'all') { where.push('o.status = @st'); params.st = req.query.status; }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) n FROM orders o ${w}`).get(params).n;
  const items = db.prepare(`SELECT o.* FROM orders o ${w} ORDER BY o.id DESC LIMIT ${limit} OFFSET ${offset}`).all(params)
    .map(o => ({ ...o, status_fa: ORDER_STATUS_FA[o.status] || o.status }));
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, statuses: ORDER_STATUSES, status_labels: ORDER_STATUS_FA });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'سفارش پیدا نشد' });
  res.json({
    order: { ...order, status_fa: ORDER_STATUS_FA[order.status] || order.status },
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id),
    history: db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id').all(order.id)
      .map(h => ({ ...h, status_fa: ORDER_STATUS_FA[h.status] || h.status }))
  });
});

// تغییر وضعیت لحظه‌ای سفارش  ← این چیزیه که سمت مشتری در «پیگیری سفارش» دیده می‌شه
router.patch('/orders/:id/status', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'سفارش پیدا نشد' });

  const status = String(req.body.status || '');
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است', allowed: ORDER_STATUSES });
  }
  const note = String(req.body.note || '');
  const paymentStatus = req.body.payment_status;

  db.transaction(() => {
    db.prepare(`UPDATE orders SET status=?, payment_status=COALESCE(?,payment_status),
                tracking_post=COALESCE(?,tracking_post), updated_at=datetime('now') WHERE id=?`)
      .run(status, paymentStatus || null, req.body.tracking_post || null, order.id);
    db.prepare('INSERT INTO order_status_history (order_id,status,note,changed_by) VALUES (?,?,?,?)')
      .run(order.id, status, note, req.user.id);
  })();

  // پیامک تغییر وضعیت — برای «ارسال شد» قالب اختصاصی با کد رهگیری
  if (status !== order.status) {
    const post = req.body.tracking_post || order.tracking_post || '';
    const key = (status === 'shipped' && post) ? 'order_shipped'
              : (status === 'cancelled') ? 'order_cancelled' : 'order_status';
    notify(key, order.phone, {
      code: order.tracking_code, name: order.customer_name,
      status: ORDER_STATUS_FA[status] || status, post
    }).catch(() => {});
  }

  logAdmin(req, 'update', 'order_status', order.id, { from: order.status, to: status });
  res.json({ ok: true, status, status_fa: ORDER_STATUS_FA[status] });
});

router.delete('/orders/:id', (req, res) => {
  const info = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'سفارش پیدا نشد' });
  logAdmin(req, 'delete', 'order', req.params.id);
  res.json({ ok: true });
});

// ===================== کاربران =====================
router.get('/users', (req, res) => {
  const { page, limit, offset } = paginate(req.query, 20, 200);
  const where = [], params = {};
  if (req.query.q) { where.push('(first_name LIKE @q OR last_name LIKE @q OR phone LIKE @q OR email LIKE @q)'); params.q = `%${req.query.q}%`; }
  if (req.query.role) { where.push('role = @role'); params.role = req.query.role; }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) n FROM users ${w}`).get(params).n;
  const items = db.prepare(`
    SELECT id, first_name, last_name, phone, email, username, role, is_active, is_banned, last_login_at, created_at,
           (SELECT COUNT(*) FROM orders o WHERE o.user_id = users.id) AS order_count
    FROM users ${w} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`).all(params);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.post('/users', (req, res) => {
  const b = req.body;
  const phone = b.phone ? normalizePhone(b.phone) : null;
  try {
    const info = db.prepare(`INSERT INTO users (first_name,last_name,phone,email,username,password_hash,role,is_active)
                             VALUES (?,?,?,?,?,?,?,?)`).run(
      b.first_name || '', b.last_name || '', phone, b.email || null,
      b.username ? String(b.username).toLowerCase() : null,
      b.password ? bcrypt.hashSync(String(b.password), 10) : null,
      b.role === 'admin' ? 'admin' : 'customer',
      b.is_active === false ? 0 : 1
    );
    logAdmin(req, 'create', 'user', info.lastInsertRowid);
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'شماره/ایمیل/نام کاربری تکراری است' : e.message });
  }
});

router.put('/users/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'کاربر پیدا نشد' });
  const b = req.body;

  // نگهبان: آخرین ادمین فعال نباید حذف/غیرفعال یا تنزل درجه پیدا کند
  if (cur.role === 'admin' && (b.role === 'customer' || b.is_active === false || b.is_banned === true)) {
    const admins = db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND is_active=1 AND is_banned=0").get().n;
    if (admins <= 1) return res.status(409).json({ error: 'این تنها ادمین فعال سایته و نمی‌شه غیرفعالش کرد.' });
  }

  db.prepare(`UPDATE users SET first_name=?,last_name=?,phone=?,email=?,username=?,role=?,is_active=?,is_banned=?
              ${b.password ? ', password_hash=?' : ''} WHERE id=?`).run(
    ...[
      b.first_name ?? cur.first_name,
      b.last_name ?? cur.last_name,
      b.phone ? normalizePhone(b.phone) : cur.phone,
      b.email ?? cur.email,
      b.username ? String(b.username).toLowerCase() : cur.username,
      b.role === 'admin' ? 'admin' : (b.role === 'customer' ? 'customer' : cur.role),
      b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
      b.is_banned != null ? (b.is_banned ? 1 : 0) : cur.is_banned,
      ...(b.password ? [bcrypt.hashSync(String(b.password), 10)] : []),
      cur.id
    ]
  );
  logAdmin(req, 'update', 'user', cur.id);
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'کاربر پیدا نشد' });
  if (cur.id === req.user.id) return res.status(409).json({ error: 'نمی‌تونی حساب خودت رو حذف کنی.' });
  if (cur.role === 'admin') {
    const admins = db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").get().n;
    if (admins <= 1) return res.status(409).json({ error: 'تنها ادمین سایت رو نمی‌شه حذف کرد.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(cur.id);
  logAdmin(req, 'delete', 'user', cur.id);
  res.json({ ok: true });
});

// ===================== نظرات =====================
router.get('/comments', (req, res) => {
  const status = req.query.status && req.query.status !== 'all' ? req.query.status : null;
  const items = db.prepare(`
    SELECT cm.*, p.name_fa AS product_fa FROM comments cm
    LEFT JOIN products p ON p.id = cm.product_id
    ${status ? 'WHERE cm.status = ?' : ''}
    ORDER BY cm.id DESC LIMIT 200`).all(...(status ? [status] : []));
  res.json({ items });
});

router.patch('/comments/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'دیدگاه پیدا نشد' });
  const status = ['pending', 'approved', 'rejected'].includes(req.body.status) ? req.body.status : cur.status;
  db.prepare('UPDATE comments SET status = ?, admin_reply = ? WHERE id = ?')
    .run(status, String(req.body.admin_reply ?? cur.admin_reply ?? ''), cur.id);
  recalcRating(cur.product_id);
  logAdmin(req, 'update', 'comment', cur.id, { to: status });
  res.json({ ok: true });
});


router.delete('/comments/:id', (req, res) => {
  const cur = db.prepare('SELECT product_id FROM comments WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  if (cur) recalcRating(cur.product_id);
  logAdmin(req, 'delete', 'comment', req.params.id);
  res.json({ ok: true });
});


// ===================== درگاه‌های پرداخت =====================
router.get('/gateways', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM payment_gateways ORDER BY sort_order, id').all() });
});

router.post('/gateways', (req, res) => {
  const b = req.body;
  if (!b.code || !b.name_fa) return res.status(400).json({ error: 'کد و نام درگاه لازمه' });
  try {
    const info = db.prepare(`INSERT INTO payment_gateways (code,name_fa,name_en,merchant_id,callback_url,sandbox,is_active,sort_order,config_json)
                             VALUES (?,?,?,?,?,?,?,?,?)`).run(
      String(b.code).toLowerCase(), b.name_fa, b.name_en || '',
      b.merchant_id || '', b.callback_url || '',
      b.sandbox ? 1 : 0, b.is_active ? 1 : 0,
      parseInt(b.sort_order) || 0, b.config_json || '{}'
    );
    logAdmin(req, 'create', 'gateway', info.lastInsertRowid);
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'کد درگاه تکراری است' : e.message });
  }
});

router.put('/gateways/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM payment_gateways WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'درگاه پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE payment_gateways SET name_fa=?,name_en=?,merchant_id=?,callback_url=?,sandbox=?,is_active=?,sort_order=?,config_json=? WHERE id=?`).run(
    b.name_fa ?? cur.name_fa, b.name_en ?? cur.name_en,
    b.merchant_id ?? cur.merchant_id, b.callback_url ?? cur.callback_url,
    b.sandbox != null ? (b.sandbox ? 1 : 0) : cur.sandbox,
    b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order,
    b.config_json ?? cur.config_json, cur.id
  );
  logAdmin(req, 'update', 'gateway', cur.id);
  res.json({ ok: true });
});

router.delete('/gateways/:id', (req, res) => {
  db.prepare('DELETE FROM payment_gateways WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'gateway', req.params.id);
  res.json({ ok: true });
});

// ===================== سوالات متداول =====================
router.get('/faqs', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM faqs ORDER BY sort_order, id').all() });
});

router.post('/faqs', (req, res) => {
  const b = req.body;
  if (!b.question_fa || !b.answer_fa) return res.status(400).json({ error: 'سوال و جواب فارسی لازمه' });
  const info = db.prepare(`INSERT INTO faqs (question_fa,answer_fa,question_en,answer_en,sort_order,is_active) VALUES (?,?,?,?,?,?)`)
    .run(b.question_fa, b.answer_fa, b.question_en || '', b.answer_en || '', parseInt(b.sort_order) || 0, b.is_active === false ? 0 : 1);
  logAdmin(req, 'create', 'faq', info.lastInsertRowid);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/faqs/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'سوال پیدا نشد' });
  const b = req.body;
  db.prepare('UPDATE faqs SET question_fa=?,answer_fa=?,question_en=?,answer_en=?,sort_order=?,is_active=? WHERE id=?').run(
    b.question_fa ?? cur.question_fa, b.answer_fa ?? cur.answer_fa,
    b.question_en ?? cur.question_en, b.answer_en ?? cur.answer_en,
    b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order,
    b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active, cur.id
  );
  logAdmin(req, 'update', 'faq', cur.id);
  res.json({ ok: true });
});

router.delete('/faqs/:id', (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'faq', req.params.id);
  res.json({ ok: true });
});

// ===================== اطلاعیه‌ها =====================
router.get('/announcements', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM announcements ORDER BY is_pinned DESC, id DESC').all() });
});

router.post('/announcements', (req, res) => {
  const b = req.body;
  if (!b.title_fa) return res.status(400).json({ error: 'عنوان اطلاعیه لازمه' });
  const info = db.prepare(`INSERT INTO announcements (title_fa,body_fa,title_en,body_en,level,is_pinned,is_active) VALUES (?,?,?,?,?,?,?)`)
    .run(b.title_fa, b.body_fa || '', b.title_en || '', b.body_en || '',
         b.level || 'info', b.is_pinned ? 1 : 0, b.is_active === false ? 0 : 1);
  logAdmin(req, 'create', 'announcement', info.lastInsertRowid);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/announcements/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'اطلاعیه پیدا نشد' });
  const b = req.body;
  db.prepare('UPDATE announcements SET title_fa=?,body_fa=?,title_en=?,body_en=?,level=?,is_pinned=?,is_active=? WHERE id=?').run(
    b.title_fa ?? cur.title_fa, b.body_fa ?? cur.body_fa,
    b.title_en ?? cur.title_en, b.body_en ?? cur.body_en,
    b.level ?? cur.level,
    b.is_pinned != null ? (b.is_pinned ? 1 : 0) : cur.is_pinned,
    b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active, cur.id
  );
  logAdmin(req, 'update', 'announcement', cur.id);
  res.json({ ok: true });
});

router.delete('/announcements/:id', (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'announcement', req.params.id);
  res.json({ ok: true });
});

// ===================== تنظیمات =====================
router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});

router.put('/settings', (req, res) => {
  const entries = Object.entries(req.body || {});
  const stmt = db.prepare(`INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now'))
                           ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`);
  db.transaction(() => { for (const [k, v] of entries) stmt.run(k, String(v ?? '')); })();
  logAdmin(req, 'update', 'settings', null, { keys: entries.map(e => e[0]) });
  res.json({ ok: true });
});

// ===================== لاگ فعالیت =====================
router.get('/logs', (_req, res) => {
  res.json({
    items: db.prepare(`SELECT l.*, u.first_name, u.last_name, u.username FROM admin_log l
                       LEFT JOIN users u ON u.id = l.admin_id
                       ORDER BY l.id DESC LIMIT 200`).all()
  });
});


/* ═══════════════════════════════════════════════════
   گالری تصاویر محصول
═══════════════════════════════════════════════════ */
router.get('/products/:id/images', (req, res) => {
  res.json({ items: db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(req.params.id) });
});

/** آپلود چند تصویر همزمان */
router.post('/products/:id/images', upload.array('files', 12), (req, res) => {
  const p = db.prepare('SELECT id, image_url FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'محصول پیدا نشد' });

  const urls = [];
  if (req.files && req.files.length) req.files.forEach(f => urls.push('/uploads/' + f.filename));
  if (Array.isArray(req.body.urls)) req.body.urls.forEach(u => u && urls.push(String(u)));
  else if (req.body.urls) urls.push(String(req.body.urls));
  if (!urls.length) return res.status(400).json({ error: 'تصویری انتخاب نشده' });

  const max = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM product_images WHERE product_id = ?').get(p.id).m;
  const ins = db.prepare('INSERT INTO product_images (product_id, url, sort_order) VALUES (?,?,?)');
  db.transaction(() => urls.forEach((u, i) => ins.run(p.id, u, max + i + 1)))();

  // اولین تصویر به عنوان کاور اگر کاور نداشت
  if (!p.image_url) db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(urls[0], p.id);

  logAdmin(req, 'create', 'product_images', p.id, { count: urls.length });
  res.status(201).json({ ok: true, items: db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(p.id) });
});

router.delete('/products/:id/images/:imgId', (req, res) => {
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imgId, req.params.id);
  if (!img) return res.status(404).json({ error: 'تصویر پیدا نشد' });
  db.prepare('DELETE FROM product_images WHERE id = ?').run(img.id);
  const prod = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
  if (prod && prod.image_url === img.url) {
    const next = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1').get(req.params.id);
    db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(next ? next.url : null, req.params.id);
  }
  res.json({ ok: true });
});

/** تعیین تصویر کاور */
router.patch('/products/:id/images/:imgId/cover', (req, res) => {
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imgId, req.params.id);
  if (!img) return res.status(404).json({ error: 'تصویر پیدا نشد' });
  db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(img.url, req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   تنوع محصول — سایز و رنگ
═══════════════════════════════════════════════════ */
router.get('/products/:id/options', (req, res) => {
  const rows = db.prepare('SELECT * FROM product_options WHERE product_id = ? ORDER BY kind, sort_order, id').all(req.params.id);
  const images = db.prepare('SELECT id, url FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(req.params.id);
  const cover = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
  if (cover && cover.image_url && !images.some(i => i.url === cover.image_url)) {
    images.unshift({ id: 0, url: cover.image_url });
  }
  res.json({
    sizes: rows.filter(r => r.kind === 'size'),
    colors: rows.filter(r => r.kind === 'color'),
    images
  });
});

router.post('/products/:id/options', (req, res) => {
  const p = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'محصول پیدا نشد' });

  const kind = req.body.kind === 'color' ? 'color' : 'size';
  const label = String(req.body.label || '').trim();
  if (!label) return res.status(400).json({ error: kind === 'size' ? 'مقدار سایز رو وارد کن' : 'نام رنگ رو وارد کن' });

  let hex = null;
  if (kind === 'color') {
    hex = String(req.body.color_hex || '').trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return res.status(400).json({ error: 'کد رنگ باید مثل ‎#1E90FF باشه' });
  }

  const max = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM product_options WHERE product_id=? AND kind=?').get(p.id, kind).m;
  const info = db.prepare(`INSERT INTO product_options
    (product_id, kind, label, unit, color_hex, price_diff, stock, image_url, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    p.id, kind, label,
    kind === 'size' ? String(req.body.unit || '').trim() : '',
    hex, parseInt(req.body.price_diff) || 0,
    req.body.stock != null && req.body.stock !== '' ? parseInt(req.body.stock) : -1,
    kind === 'color' ? (req.body.image_url || null) : null,
    max + 1
  );
  syncVariants(p.id); rollupStock(p.id);
  logAdmin(req, 'create', 'product_option', info.lastInsertRowid, { product: p.id, kind, label });
  res.status(201).json({ ok: true, item: db.prepare('SELECT * FROM product_options WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/options/:optId', (req, res) => {
  const cur = db.prepare('SELECT * FROM product_options WHERE id = ?').get(req.params.optId);
  if (!cur) return res.status(404).json({ error: 'گزینه پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE product_options SET label=@label, unit=@unit, color_hex=@color_hex,
    price_diff=@price_diff, stock=@stock, image_url=@image_url,
    sort_order=@sort_order, is_active=@is_active WHERE id=@id`).run({
    id: cur.id,
    label: b.label ?? cur.label,
    unit: b.unit ?? cur.unit,
    color_hex: b.color_hex ?? cur.color_hex,
    image_url: b.image_url !== undefined ? (b.image_url || null) : cur.image_url,
    price_diff: b.price_diff != null ? parseInt(b.price_diff) : cur.price_diff,
    stock: b.stock != null ? parseInt(b.stock) : cur.stock,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active
  });
  res.json({ ok: true });
});

router.delete('/options/:optId', (req, res) => {
  const cur = db.prepare('SELECT product_id FROM product_options WHERE id = ?').get(req.params.optId);
  db.prepare('DELETE FROM product_options WHERE id = ?').run(req.params.optId);
  if (cur) { syncVariants(cur.product_id); rollupStock(cur.product_id); }
  logAdmin(req, 'delete', 'product_option', req.params.optId);
  res.json({ ok: true });
});

/* ═══ ماتریس موجودی ترکیب‌ها ═══ */
router.get('/products/:id/variants', (req, res) => {
  const pid = parseInt(req.params.id);
  syncVariants(pid);
  const sizes  = db.prepare("SELECT id,label,unit FROM product_options WHERE product_id=? AND kind='size'  AND is_active=1 ORDER BY sort_order,id").all(pid);
  const colors = db.prepare("SELECT id,label,color_hex FROM product_options WHERE product_id=? AND kind='color' AND is_active=1 ORDER BY sort_order,id").all(pid);
  const variants = db.prepare('SELECT id,size_id,color_id,stock,sku FROM product_variants WHERE product_id=?').all(pid);
  const prod = db.prepare('SELECT stock FROM products WHERE id=?').get(pid);
  res.json({ sizes, colors, variants, product_stock: prod ? prod.stock : 0, has_variants: variants.length > 0 });
});

router.put('/products/:id/variants', (req, res) => {
  const pid = parseInt(req.params.id);
  const rows = Array.isArray(req.body.variants) ? req.body.variants : [];
  const upd = db.prepare('UPDATE product_variants SET stock = ?, sku = ? WHERE id = ? AND product_id = ?');
  db.transaction(() => {
    for (const r of rows) upd.run(Math.max(0, parseInt(r.stock) || 0), r.sku || null, r.id, pid);
  })();
  const total = rollupStock(pid);
  logAdmin(req, 'update', 'product_variants', pid, { rows: rows.length });
  res.json({ ok: true, product_stock: total });
});

/* ═══════════════════════════════════════════════════
   پروموشن‌ها
═══════════════════════════════════════════════════ */
router.get('/promotions', (_req, res) => {
  const items = db.prepare('SELECT * FROM promotions ORDER BY sort_order, id').all();
  const cnt = db.prepare('SELECT COUNT(*) c FROM promotion_items WHERE promotion_id = ?');
  res.json({ items: items.map(p => ({ ...p, product_count: cnt.get(p.id).c })) });
});

router.get('/promotions/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'پروموشن پیدا نشد' });
  p.products = db.prepare(`SELECT pr.id, pr.name_fa, pr.price, pr.discount_price, pr.image_url, pr.icon
    FROM promotion_items pi JOIN products pr ON pr.id = pi.product_id
    WHERE pi.promotion_id = ? ORDER BY pi.sort_order`).all(p.id);
  res.json({ item: p });
});

function savePromoItems(promoId, ids) {
  db.prepare('DELETE FROM promotion_items WHERE promotion_id = ?').run(promoId);
  if (!Array.isArray(ids)) return;
  const ins = db.prepare('INSERT OR IGNORE INTO promotion_items (promotion_id, product_id, sort_order) VALUES (?,?,?)');
  db.transaction(() => ids.forEach((pid, i) => ins.run(promoId, pid, i)))();
}

router.post('/promotions', (req, res) => {
  const b = req.body;
  if (!b.title_fa) return res.status(400).json({ error: 'عنوان پروموشن لازمه' });
  const info = db.prepare(`INSERT INTO promotions
    (title_fa, title_en, subtitle_fa, kind, badge_fa, discount_percent, starts_at, ends_at, is_active, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    b.title_fa, b.title_en || '', b.subtitle_fa || '', b.kind || 'suggested', b.badge_fa || '',
    parseInt(b.discount_percent) || 0, b.starts_at || null, b.ends_at || null,
    b.is_active === false ? 0 : 1, parseInt(b.sort_order) || 0);
  savePromoItems(info.lastInsertRowid, b.product_ids);
  logAdmin(req, 'create', 'promotion', info.lastInsertRowid, { title: b.title_fa });
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/promotions/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'پروموشن پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE promotions SET title_fa=@title_fa, title_en=@title_en, subtitle_fa=@subtitle_fa,
    kind=@kind, badge_fa=@badge_fa, discount_percent=@discount_percent, starts_at=@starts_at,
    ends_at=@ends_at, is_active=@is_active, sort_order=@sort_order WHERE id=@id`).run({
    id: cur.id,
    title_fa: b.title_fa ?? cur.title_fa, title_en: b.title_en ?? cur.title_en,
    subtitle_fa: b.subtitle_fa ?? cur.subtitle_fa, kind: b.kind ?? cur.kind,
    badge_fa: b.badge_fa ?? cur.badge_fa,
    discount_percent: b.discount_percent != null ? parseInt(b.discount_percent) : cur.discount_percent,
    starts_at: b.starts_at ?? cur.starts_at, ends_at: b.ends_at ?? cur.ends_at,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order
  });
  if (b.product_ids) savePromoItems(cur.id, b.product_ids);
  logAdmin(req, 'update', 'promotion', cur.id);
  res.json({ ok: true });
});

router.delete('/promotions/:id', (req, res) => {
  db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'promotion', req.params.id);
  res.json({ ok: true });
});

/** جستجوی سریع محصول برای انتخاب در پروموشن */
router.get('/products/lookup', (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`;
  const items = db.prepare(`SELECT id, name_fa, price, discount_price, image_url, icon
    FROM products WHERE name_fa LIKE ? OR name_en LIKE ? OR sku LIKE ? ORDER BY id DESC LIMIT 25`).all(q, q, q);
  res.json({ items });
});

/* ═══════════════════════════════════════════════════
   کدهای تخفیف
═══════════════════════════════════════════════════ */
router.get('/coupons', (_req, res) => res.json({ items: db.prepare('SELECT * FROM coupons ORDER BY id DESC').all() }));

router.post('/coupons', (req, res) => {
  const b = req.body;
  const code = String(b.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'کد تخفیف رو وارد کن' });
  try {
    const info = db.prepare(`INSERT INTO coupons
      (code, kind, value, min_order, max_amount, max_uses, starts_at, ends_at, is_active)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      code, b.kind || 'percent', parseInt(b.value) || 0, parseInt(b.min_order) || 0,
      parseInt(b.max_amount) || 0, parseInt(b.max_uses) || 0,
      b.starts_at || null, b.ends_at || null, b.is_active === false ? 0 : 1);
    logAdmin(req, 'create', 'coupon', info.lastInsertRowid, { code });
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'این کد تخفیف قبلاً تعریف شده' : e.message });
  }
});

router.put('/coupons/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'کد تخفیف پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE coupons SET kind=@kind, value=@value, min_order=@min_order, max_amount=@max_amount,
    max_uses=@max_uses, starts_at=@starts_at, ends_at=@ends_at, is_active=@is_active WHERE id=@id`).run({
    id: cur.id, kind: b.kind ?? cur.kind,
    value: b.value != null ? parseInt(b.value) : cur.value,
    min_order: b.min_order != null ? parseInt(b.min_order) : cur.min_order,
    max_amount: b.max_amount != null ? parseInt(b.max_amount) : cur.max_amount,
    max_uses: b.max_uses != null ? parseInt(b.max_uses) : cur.max_uses,
    starts_at: b.starts_at ?? cur.starts_at, ends_at: b.ends_at ?? cur.ends_at,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active
  });
  res.json({ ok: true });
});

router.delete('/coupons/:id', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'coupon', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   بنرهای تبلیغاتی
═══════════════════════════════════════════════════ */
router.get('/banners', (_req, res) => res.json({ items: db.prepare('SELECT * FROM banners ORDER BY sort_order, id').all() }));

router.post('/banners', (req, res) => {
  const b = req.body;
  const info = db.prepare(`INSERT INTO banners (title_fa, body_fa, image_url, link_url, position, is_active, sort_order)
    VALUES (?,?,?,?,?,?,?)`).run(b.title_fa || '', b.body_fa || '', b.image_url || null, b.link_url || '',
    b.position || 'home_top', b.is_active === false ? 0 : 1, parseInt(b.sort_order) || 0);
  logAdmin(req, 'create', 'banner', info.lastInsertRowid);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/banners/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'بنر پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE banners SET title_fa=@title_fa, body_fa=@body_fa, image_url=@image_url,
    link_url=@link_url, position=@position, is_active=@is_active, sort_order=@sort_order WHERE id=@id`).run({
    id: cur.id, title_fa: b.title_fa ?? cur.title_fa, body_fa: b.body_fa ?? cur.body_fa,
    image_url: b.image_url ?? cur.image_url, link_url: b.link_url ?? cur.link_url,
    position: b.position ?? cur.position,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order
  });
  res.json({ ok: true });
});

router.delete('/banners/:id', (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'banner', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   مرجوعی‌ها
═══════════════════════════════════════════════════ */
const { RETURN_REASONS, RETURN_STATUS } = require('../lib/returns');

router.get('/returns', (req, res) => {
  const status = req.query.status && req.query.status !== 'all' ? req.query.status : null;
  const rows = status
    ? db.prepare('SELECT * FROM returns WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM returns ORDER BY id DESC').all();
  const itemsOf = db.prepare('SELECT * FROM return_items WHERE return_id = ?');
  rows.forEach(r => { r.items = itemsOf.all(r.id); });
  res.json({
    items: rows.map(r => ({ ...r, reason_fa: RETURN_REASONS[r.reason] || r.reason, status_fa: RETURN_STATUS[r.status] || r.status })),
    statuses: RETURN_STATUS, reasons: RETURN_REASONS
  });
});

router.patch('/returns/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'درخواست پیدا نشد' });
  const status = RETURN_STATUS[req.body.status] ? req.body.status : cur.status;
  db.prepare("UPDATE returns SET status=?, admin_note=?, updated_at=datetime('now') WHERE id=?")
    .run(status, String(req.body.admin_note ?? cur.admin_note), cur.id);

  if (status !== cur.status) {
    notify('return_status', cur.phone, {
      code: cur.tracking_code, name: cur.full_name,
      status: RETURN_STATUS[status] || status,
      note: req.body.admin_note ?? cur.admin_note ?? ''
    }).catch(() => {});
  }

  logAdmin(req, 'update', 'return', cur.id, { to: status });
  res.json({ ok: true });
});

router.delete('/returns/:id', (req, res) => {
  db.prepare('DELETE FROM returns WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'return', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   کانال‌های پشتیبانی
═══════════════════════════════════════════════════ */
router.get('/support-channels', (_req, res) =>
  res.json({ items: db.prepare('SELECT * FROM support_channels ORDER BY sort_order, id').all() }));

router.post('/support-channels', (req, res) => {
  const b = req.body;
  if (!b.name_fa) return res.status(400).json({ error: 'نام کانال لازمه' });
  const info = db.prepare(`INSERT INTO support_channels
    (name_fa,name_en,desc_fa,desc_en,kind,value,icon,logo_url,bg_url,is_active,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.name_fa, b.name_en || '', b.desc_fa || '', b.desc_en || '',
    b.kind || 'custom', b.value || '', b.icon || 'chat',
    b.logo_url || null, b.bg_url || null,
    b.is_active === false ? 0 : 1, parseInt(b.sort_order) || 0);
  logAdmin(req, 'create', 'support_channel', info.lastInsertRowid, { name: b.name_fa });
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/support-channels/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM support_channels WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'کانال پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE support_channels SET name_fa=@name_fa, name_en=@name_en, desc_fa=@desc_fa,
    desc_en=@desc_en, kind=@kind, value=@value, icon=@icon, logo_url=@logo_url, bg_url=@bg_url,
    is_active=@is_active, sort_order=@sort_order WHERE id=@id`).run({
    id: cur.id,
    name_fa: b.name_fa ?? cur.name_fa, name_en: b.name_en ?? cur.name_en,
    desc_fa: b.desc_fa ?? cur.desc_fa, desc_en: b.desc_en ?? cur.desc_en,
    kind: b.kind ?? cur.kind, value: b.value ?? cur.value, icon: b.icon ?? cur.icon,
    logo_url: b.logo_url ?? cur.logo_url, bg_url: b.bg_url ?? cur.bg_url,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order
  });
  logAdmin(req, 'update', 'support_channel', cur.id);
  res.json({ ok: true });
});

router.delete('/support-channels/:id', (req, res) => {
  db.prepare('DELETE FROM support_channels WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'support_channel', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   کانال‌های پشتیبانی
═══════════════════════════════════════════════════ */
router.get('/support-channels', (_req, res) =>
  res.json({ items: db.prepare('SELECT * FROM support_channels ORDER BY sort_order, id').all() }));

router.post('/support-channels', (req, res) => {
  const b = req.body;
  if (!b.name_fa) return res.status(400).json({ error: 'نام کانال لازمه' });
  const info = db.prepare(`INSERT INTO support_channels
    (name_fa,name_en,desc_fa,desc_en,kind,value,icon,logo_url,bg_url,is_active,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.name_fa, b.name_en || '', b.desc_fa || '', b.desc_en || '',
    b.kind || 'custom', b.value || '', b.icon || 'chat',
    b.logo_url || null, b.bg_url || null,
    b.is_active === false ? 0 : 1, parseInt(b.sort_order) || 0);
  logAdmin(req, 'create', 'support_channel', info.lastInsertRowid, { name: b.name_fa });
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/support-channels/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM support_channels WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'کانال پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE support_channels SET name_fa=@name_fa, name_en=@name_en, desc_fa=@desc_fa,
    desc_en=@desc_en, kind=@kind, value=@value, icon=@icon, logo_url=@logo_url, bg_url=@bg_url,
    is_active=@is_active, sort_order=@sort_order WHERE id=@id`).run({
    id: cur.id,
    name_fa: b.name_fa ?? cur.name_fa, name_en: b.name_en ?? cur.name_en,
    desc_fa: b.desc_fa ?? cur.desc_fa, desc_en: b.desc_en ?? cur.desc_en,
    kind: b.kind ?? cur.kind, value: b.value ?? cur.value, icon: b.icon ?? cur.icon,
    logo_url: b.logo_url ?? cur.logo_url, bg_url: b.bg_url ?? cur.bg_url,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order
  });
  logAdmin(req, 'update', 'support_channel', cur.id);
  res.json({ ok: true });
});

router.delete('/support-channels/:id', (req, res) => {
  db.prepare('DELETE FROM support_channels WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'support_channel', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   پلتفرم‌های فروش
═══════════════════════════════════════════════════ */
router.get('/platforms', (_req, res) =>
  res.json({ items: db.prepare('SELECT * FROM platforms ORDER BY sort_order, id').all() }));

router.post('/platforms', (req, res) => {
  const b = req.body;
  if (!b.name_fa) return res.status(400).json({ error: 'نام پلتفرم لازمه' });
  const info = db.prepare(`INSERT INTO platforms (name_fa,name_en,slug,url,desc_fa,logo_url,bg_url,is_active,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    b.name_fa, b.name_en || '', b.slug || '', b.url || '', b.desc_fa || '',
    b.logo_url || null, b.bg_url || null, b.is_active === false ? 0 : 1, parseInt(b.sort_order) || 0);
  logAdmin(req, 'create', 'platform', info.lastInsertRowid, { name: b.name_fa });
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/platforms/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'پلتفرم پیدا نشد' });
  const b = req.body;
  db.prepare(`UPDATE platforms SET name_fa=@name_fa, name_en=@name_en, slug=@slug, url=@url,
    desc_fa=@desc_fa, logo_url=@logo_url, bg_url=@bg_url, is_active=@is_active, sort_order=@sort_order WHERE id=@id`).run({
    id: cur.id,
    name_fa: b.name_fa ?? cur.name_fa, name_en: b.name_en ?? cur.name_en,
    slug: b.slug ?? cur.slug, url: b.url ?? cur.url, desc_fa: b.desc_fa ?? cur.desc_fa,
    logo_url: b.logo_url ?? cur.logo_url,
    bg_url: b.bg_url ?? cur.bg_url,
    is_active: b.is_active != null ? (b.is_active ? 1 : 0) : cur.is_active,
    sort_order: b.sort_order != null ? parseInt(b.sort_order) : cur.sort_order
  });
  logAdmin(req, 'update', 'platform', cur.id);
  res.json({ ok: true });
});

router.delete('/platforms/:id', (req, res) => {
  db.prepare('DELETE FROM platforms WHERE id = ?').run(req.params.id);
  logAdmin(req, 'delete', 'platform', req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   پنل پیامکی
═══════════════════════════════════════════════════ */
const SMS_VARS = {
  otp:             ['code', 'minutes', 'shop'],
  welcome:         ['name', 'shop'],
  order_placed:    ['name', 'code', 'total', 'items', 'shop'],
  order_status:    ['name', 'code', 'status', 'shop'],
  order_shipped:   ['name', 'code', 'post', 'shop'],
  order_cancelled: ['name', 'code', 'shop'],
  return_received: ['name', 'code', 'items', 'shop'],
  return_status:   ['name', 'code', 'status', 'note', 'shop']
};

router.get('/sms/templates', (_req, res) => {
  ensureTemplates();
  const rows = db.prepare('SELECT * FROM sms_templates ORDER BY id').all();
  res.json({
    items: rows.map(r => ({ ...r, vars: SMS_VARS[r.key] || [], default_body: (DEFAULTS[r.key] || {}).body || '' })),
    vars: SMS_VARS
  });
});

router.put('/sms/templates/:key', (req, res) => {
  const cur = db.prepare('SELECT * FROM sms_templates WHERE key = ?').get(req.params.key);
  if (!cur) return res.status(404).json({ error: 'قالب پیدا نشد' });
  db.prepare(`UPDATE sms_templates SET title_fa=?, body=?, is_active=?, updated_at=datetime('now')
              WHERE key=?`).run(
    req.body.title_fa ?? cur.title_fa,
    req.body.body ?? cur.body,
    req.body.is_active != null ? (req.body.is_active ? 1 : 0) : cur.is_active,
    cur.key);
  logAdmin(req, 'update', 'sms_template', null, { key: cur.key });
  res.json({ ok: true });
});

/** پیش‌نمایش قالب با مقادیر نمونه */
router.post('/sms/preview', (req, res) => {
  const sample = { code: '48213', minutes: '2', name: 'محمدرضا حسین‌زاده',
    total: '1,585,000', items: '2', status: 'ارسال شد', post: '۱۲۳۴۵۶۷۸۹۰',
    note: 'کالا سالم دریافت شد' };
  res.json({ ok: true, text: render(String(req.body.body || ''), sample) });
});

router.post('/sms/test', async (req, res) => {
  const phone = normalizePhone(String(req.body.phone || ''));
  if (!/^09\d{9}$/.test(phone)) return res.status(400).json({ error: 'شماره موبایل معتبر نیست' });
  const key = req.body.key || 'otp';
  const r = await notify(key, phone, { code: '12345', minutes: 2, name: 'تست',
    total: '100,000', items: 1, status: 'تست', post: '000', note: 'تست' });
  if (!r.ok) return res.status(400).json({ error: r.error || `ارسال نشد (${r.reason})` });
  res.json({ ok: true, message: 'پیامک تست ارسال شد', body: r.body });
});

router.get('/sms/log', (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit) || 60);
  const status = req.query.status && req.query.status !== 'all' ? req.query.status : null;
  const rows = status
    ? db.prepare('SELECT * FROM sms_log WHERE status = ? ORDER BY id DESC LIMIT ?').all(status, limit)
    : db.prepare('SELECT * FROM sms_log ORDER BY id DESC LIMIT ?').all(limit);
  const stats = db.prepare(`SELECT status, COUNT(*) c FROM sms_log GROUP BY status`).all();
  res.json({ items: rows, stats: Object.fromEntries(stats.map(s => [s.status, s.c])) });
});

router.delete('/sms/log', (req, res) => {
  db.prepare('DELETE FROM sms_log').run();
  logAdmin(req, 'delete', 'sms_log', null);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════
   تراکنش‌های پرداخت
═══════════════════════════════════════════════════ */
router.get('/payments', (req, res) => {
  const status = req.query.status && req.query.status !== 'all' ? req.query.status : null;
  const limit = Math.min(200, parseInt(req.query.limit) || 80);

  const rows = (status
    ? db.prepare(`SELECT p.*, o.tracking_code, o.customer_name, o.phone
        FROM payments p JOIN orders o ON o.id = p.order_id
        WHERE p.status = ? ORDER BY p.id DESC LIMIT ?`).all(status, limit)
    : db.prepare(`SELECT p.*, o.tracking_code, o.customer_name, o.phone
        FROM payments p JOIN orders o ON o.id = p.order_id
        ORDER BY p.id DESC LIMIT ?`).all(limit));

  const stats = db.prepare('SELECT status, COUNT(*) c, COALESCE(SUM(amount),0) s FROM payments GROUP BY status').all();
  const paid = stats.find(x => x.status === 'paid');

  res.json({
    items: rows.map(r => ({ ...r, raw_request: undefined, raw_verify: undefined })),
    stats: Object.fromEntries(stats.map(x => [x.status, { count: x.c, sum: x.s }])),
    total_paid: paid ? paid.s : 0
  });
});

/** جزئیات کامل یک تراکنش شامل پاسخ خام درگاه */
router.get('/payments/:id', (req, res) => {
  const p = db.prepare(`SELECT p.*, o.tracking_code, o.customer_name, o.phone, o.total AS order_total
    FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = ?`).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'تراکنش پیدا نشد' });
  res.json({ item: p });
});

module.exports = router;
