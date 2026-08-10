require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { migrate, db } = require('./lib/db');
const { attachUser } = require('./middleware/auth');
const runSeed = require('./seed');

// Run migrations
migrate();

// Auto-seed on startup if the database is fresh/empty
try {
  const prodCheck = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (!prodCheck || prodCheck.count === 0) {
    console.log('Database empty. Running seed...');
    runSeed();
  }
} catch (err) {
  console.error('Auto-seed check failed:', err);
}

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');

migrate();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');

app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

// ---- API ----
app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'مای پیکسل', time: new Date().toISOString() }));
// ═══════ حالت تعمیر و نگهداری ═══════
// همه‌چیز بسته می‌شود جز: پنل ادمین، API ادمین، ورود، فایل‌های استاتیک
function isMaintenance() {
  try {
    const r = db.prepare("SELECT value FROM settings WHERE key = 'maintenance'").get();
    return r && (r.value === '1' || r.value === 'true');
  } catch (_) { return false; }
}

app.use((req, res, next) => {
  if (!isMaintenance()) return next();
  if (req.user && req.user.role === 'admin') return next();

  const p = req.path;
  const allowed =
    p.startsWith('/admin') ||
    p.startsWith('/api/admin') ||
    p.startsWith('/api/auth') ||
    p.startsWith('/assets/') ||
    p === '/api/health' ||
    p === '/api/settings';
  if (allowed) return next();

  const msg = (() => {
    try {
      const r = db.prepare("SELECT value FROM settings WHERE key = 'maintenance_message'").get();
      return (r && r.value) || 'سایت موقتاً در حال به‌روزرسانیه. به‌زودی برمی‌گردیم.';
    } catch (_) { return 'سایت موقتاً در حال به‌روزرسانیه.'; }
  })();

  if (p.startsWith('/api/')) return res.status(503).json({ error: msg, maintenance: true });

  res.status(503).type('html').send(`<!DOCTYPE html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>در حال به‌روزرسانی | مای پیکسل</title>
<link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--cyan:#2EE6F5}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;
  font-family:Estedad,system-ui,sans-serif;background:#05080B;color:#E8F4F6;
  background-image:radial-gradient(60rem 40rem at 50% -10%,rgba(46,230,245,.13),transparent 60%)}
.box{max-width:520px;text-align:center;padding:48px 34px;border-radius:24px;
  background:rgba(255,255,255,.05);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.14);
  box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(255,255,255,.06);
  position:relative;overflow:hidden}
.box::before{content:'';position:absolute;inset:0 0 auto;height:1px;
  background:linear-gradient(90deg,transparent,rgba(46,230,245,.85),transparent)}
svg{margin-bottom:20px}
h1{margin:0 0 12px;font-size:1.5rem;font-weight:800}
p{margin:0;color:#93AEB4;line-height:2}
.dots{display:flex;gap:7px;justify-content:center;margin-top:26px}
.dots i{width:8px;height:8px;border-radius:50%;background:var(--cyan);opacity:.3;
  animation:b 1.35s infinite ease-in-out}
.dots i:nth-child(2){animation-delay:.18s}.dots i:nth-child(3){animation-delay:.36s}
@keyframes b{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-6px)}}
</style></head><body><div class="box">
<svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#2EE6F5" stroke-width="1.6"
 stroke-linecap="round" stroke-linejoin="round">
<path d="M14.7 6.3a5 5 0 0 0 6.6 6.6L18 16.2l-2.6-2.6-5.7 5.7a2.4 2.4 0 0 1-3.4-3.4l5.7-5.7L9.4 7.6z"/></svg>
<h1>در حال به‌روزرسانی</h1><p>${msg}</p>
<div class="dots"><i></i><i></i><i></i></div></div></body></html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', require('./routes/payments'));
app.use('/api', shopRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'مسیر API پیدا نشد' }));

// هر خطایی که تا اینجا رسیده باشد، به‌جای کرش پاسخ تمیز می‌گیرد
app.use('/api', (err, _req, res, _next) => {
  console.error('[api error]', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'خطای غیرمنتظره در سرور' });
});

// ---- فایل‌های استاتیک ----
// ═══════ تزریق متادیتای سئو در index.html ═══════
const fsMod = require('fs');
const INDEX_PATH = path.join(PUBLIC_DIR, 'index.html');

function seoSettings() {
  try {
    const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'seo_%' OR key='site_name_fa'").all();
    const o = {}; rows.forEach(r => o[r.key] = r.value); return o;
  } catch (_) { return {}; }
}
const escHtml = v => String(v || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function renderIndex(req, res) {
  let html;
  try { html = fsMod.readFileSync(INDEX_PATH, 'utf8'); }
  catch (_) { return res.status(500).send('index.html not found'); }

  const s = seoSettings();
  const title = s.seo_title || s.site_name_fa || 'مای پیکسل';
  const desc  = s.seo_description || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const url   = s.seo_canonical || `${proto}://${req.get('host')}`;
  const img   = s.seo_og_image ? (s.seo_og_image.startsWith('http') ? s.seo_og_image : url + s.seo_og_image) : '';

  const tags = [
    `<title>${escHtml(title)}</title>`,
    desc && `<meta name="description" content="${escHtml(desc)}">`,
    s.seo_keywords && `<meta name="keywords" content="${escHtml(s.seo_keywords)}">`,
    `<meta name="robots" content="${escHtml(s.seo_robots || 'index,follow')}">`,
    `<link rel="canonical" href="${escHtml(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    desc && `<meta property="og:description" content="${escHtml(desc)}">`,
    `<meta property="og:url" content="${escHtml(url)}">`,
    img && `<meta property="og:image" content="${escHtml(img)}">`,
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
    s.seo_verification || '',
    s.seo_ga && `<script async src="https://www.googletagmanager.com/gtag/js?id=${escHtml(s.seo_ga)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${escHtml(s.seo_ga)}');</script>`,
    s.seo_gtm && `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${escHtml(s.seo_gtm)}');</script>`
  ].filter(Boolean).join('\n  ');

  html = html.replace(/<title>[\s\S]*?<\/title>/, '').replace('</head>', '  ' + tags + '\n</head>');
  res.type('html').send(html);
}

app.get('/', renderIndex);
app.get('/robots.txt', (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${proto}://${req.get('host')}/sitemap.xml\n`);
});
app.get('/sitemap.xml', (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const base = `${proto}://${req.get('host')}`;
  let urls = ['', '#/products', '#/categories', '#/about', '#/faq', '#/track', '#/returns', '#/shipping'];
  try {
    db.prepare('SELECT slug FROM products WHERE is_active = 1').all().forEach(p => urls.push('#/product/' + p.slug));
  } catch (_) {}
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${base}/${u}</loc></url>`).join('\n') + `\n</urlset>`);
});

// فشرده‌سازی پاسخ‌ها — روی CSS/JS فارسی حدود ۷۵٪ حجم کم می‌کند.
// اگر بسته‌ی compression نصب نباشد، سایت بدون آن هم کار می‌کند.
try {
  const compression = require('compression');
  app.use(compression({ threshold: 1024 }));
} catch (_) {
  console.log('  ℹ compression نصب نیست — برای سرعت بیشتر: npm i compression');
}

app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
  // فایل‌های استاتیک یک ساله کش شوند؛ نام فایل‌ها با تغییر نسخه عوض می‌شود
  maxAge: process.env.NODE_ENV === 'production' ? '365d' : 0,
  setHeaders: (res, filePath) => {
    if (/\.(css|js)$/.test(filePath) && process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.get('/admin', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('*', renderIndex);

// ---- خطاها ----
app.use((err, _req, res, _next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'خطای داخلی سرور' });
});

/* ═══════════════════════════════════════════════
   محافظ کرش
   یک خطای پیش‌بینی‌نشده در یک درخواست نباید کل فروشگاه را بخواباند.
   خطا لاگ می‌شود ولی فرآیند زنده می‌ماند.
   ═══════════════════════════════════════════════ */
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
  // خطاهای شبکه و برنامه‌ای نباید فرآیند را بکشند؛
  // فقط خطای مربوط به خود سرور (مثل پورت اشغال) کشنده است.
  if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) process.exit(1);
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  مای پیکسل روی http://localhost:${PORT} بالا اومد`);
    console.log(`  پنل مدیریت: http://localhost:${PORT}/admin\n`);
  });
}

// Export app for Vercel serverless functions
module.exports = app;
