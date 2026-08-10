require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, migrate, DB_PATH } = require('./lib/db');
const { makeTrackingCode } = require('./lib/helpers');

const RESET = process.argv.includes('--reset');

migrate();

if (RESET) {
  console.log('پاک کردن داده‌های قبلی...');
  for (const t of ['order_status_history', 'order_items', 'orders', 'product_images', 'products',
                   'categories', 'comments', 'faqs', 'announcements', 'payment_gateways',
                   'settings', 'otp_codes', 'admin_log', 'platforms', 'support_channels', 'banners', 'users']) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  db.prepare("DELETE FROM sqlite_sequence").run();
}

// ---------------- ادمین ----------------
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'MyPixel@1404';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '09120000000';

const existingAdmin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
if (!existingAdmin) {
  db.prepare(`INSERT INTO users (first_name,last_name,phone,username,password_hash,role,email)
              VALUES (?,?,?,?,?,?,?)`)
    .run('مدیر', 'مای پیکسل', ADMIN_PHONE, ADMIN_USER, bcrypt.hashSync(ADMIN_PASS, 10), 'admin', 'admin@mypixel.local');
  console.log(`\n  حساب مدیر ساخته شد →  نام کاربری: ${ADMIN_USER}   رمز: ${ADMIN_PASS}`);
  console.log('  حتماً بعد از اولین ورود رمز رو از پنل عوض کن.\n');
} else {
  console.log('حساب مدیر از قبل وجود دارد؛ رد شد.');
}

// ---------------- دسته‌بندی‌ها ----------------
const cats = [
  { slug: 'wall-art', name_fa: 'تابلو', name_en: 'Wall Art', icon: 'art',
    desc_fa: 'طرح‌های خاص و باکیفیت برای دیوارهای خاص.', desc_en: 'Distinctive, high-quality designs for distinctive walls.' },
  { slug: 'scanned-figures', name_fa: 'فیگور اسکن‌شده', name_en: 'Scanned Figures', icon: 'figure',
    desc_fa: 'از اسکن دیجیتال تا مجسمه‌ی رومیزی، با جزئیات دقیق.', desc_en: 'From a digital scan to a detailed desk figurine.' },
  { slug: 'metal-cars', name_fa: 'ماشین فلزی', name_en: 'Metal Cars', icon: 'car',
    desc_fa: 'ماشین‌های کالکشنی فلزی با جزئیات ماندگار.', desc_en: 'Collectible metal cars with lasting detail.' },
  { slug: 'accessories', name_fa: 'لوازم جانبی', name_en: 'Accessories', icon: 'box',
    desc_fa: 'پایه، استند و جعبه‌های نگهداری کالکشن.', desc_en: 'Stands, bases and display cases.' }
];

const insCat = db.prepare(`INSERT OR IGNORE INTO categories (slug,name_fa,name_en,desc_fa,desc_en,icon,sort_order)
                           VALUES (@slug,@name_fa,@name_en,@desc_fa,@desc_en,@icon,@sort_order)`);
cats.forEach((c, i) => insCat.run({ ...c, sort_order: i }));

const catId = s => db.prepare('SELECT id FROM categories WHERE slug = ?').get(s)?.id;

// ---------------- محصولات ----------------
const products = [
  { slug:'foggy-city-led', name_fa:'تابلو LED شهر مه‌آلود', name_en:'Foggy City LED Wall Art', cat:'wall-art', icon:'art', price:450000, stock:12, featured:1,
    desc_fa:'تابلوی نوری با نورپردازی LED پشت‌زمینه؛ ابعاد ۴۰×۶۰ سانتی‌متر، قاب چوبی مات.' },
  { slug:'neon-grid', name_fa:'تابلو گرید نئون', name_en:'Neon Grid Wall Art', cat:'wall-art', icon:'art', price:380000, discount:320000, stock:8, featured:1,
    desc_fa:'گرید نئونی روی بک‌گراند تیره؛ مناسب اتاق گیمینگ و استودیو.' },
  { slug:'cyber-warrior', name_fa:'فیگور اسکن‌شده جنگجوی سایبری', name_en:'Cyber Warrior Scanned Figure', cat:'scanned-figures', icon:'figure', price:890000, stock:5, featured:1,
    desc_fa:'اسکن سه‌بعدی با رزین دقیق، ارتفاع ۱۸ سانتی‌متر، رنگ‌آمیزی دستی.' },
  { slug:'space-explorer', name_fa:'فیگور اسکن‌شده کاوشگر فضایی', name_en:'Space Explorer Scanned Figure', cat:'scanned-figures', icon:'figure', price:950000, stock:3, featured:0,
    desc_fa:'فیگور کاوشگر با کلاه شفاف و پایه‌ی فلزی؛ ارتفاع ۲۰ سانتی‌متر.' },
  { slug:'classic-roadster', name_fa:'ماشین فلزی رودستر کلاسیک', name_en:'Classic Roadster Metal Car', cat:'metal-cars', icon:'car', price:620000, stock:15, featured:1,
    desc_fa:'مقیاس ۱:۲۴، بدنه‌ی فلزی، درب‌های بازشو و داشبورد با جزئیات کامل.' },
  { slug:'racing-gt', name_fa:'ماشین فلزی GT مسابقه‌ای', name_en:'Racing GT Metal Car', cat:'metal-cars', icon:'car', price:710000, discount:649000, stock:9, featured:1,
    desc_fa:'مقیاس ۱:۱۸ با لاستیک لاستیکی و شاسی فلزی؛ همراه استند نمایش.' },
  { slug:'display-stand', name_fa:'استند نمایش فیگور', name_en:'Figure Display Stand', cat:'accessories', icon:'box', price:180000, stock:30, featured:0,
    desc_fa:'استند آکریلیک شفاف دو طبقه برای نمایش فیگور و ماشین.' },
  { slug:'dust-case', name_fa:'باکس محافظ کالکشن', name_en:'Collection Dust Case', cat:'accessories', icon:'box', price:260000, stock:0, featured:0,
    desc_fa:'باکس ضد گردوغبار با درب مگنتی؛ مناسب فیگورهای تا ۲۵ سانتی‌متر.' }
];

const insProd = db.prepare(`INSERT OR IGNORE INTO products
  (slug,sku,category_id,name_fa,name_en,desc_fa,price,discount_price,stock,icon,is_featured,sold_count)
  VALUES (@slug,@sku,@category_id,@name_fa,@name_en,@desc_fa,@price,@discount,@stock,@icon,@featured,@sold)`);

products.forEach((p, i) => insProd.run({
  slug: p.slug,
  sku: 'MP-' + String(1001 + i),
  category_id: catId(p.cat),
  name_fa: p.name_fa,
  name_en: p.name_en,
  desc_fa: p.desc_fa,
  price: p.price,
  discount: p.discount || null,
  stock: p.stock,
  icon: p.icon,
  featured: p.featured,
  sold: Math.floor(Math.random() * 30)
}));

// ---------------- سوالات متداول (نمونه — بعداً ویرایش می‌شود) ----------------
const faqs = [
  { q:'ارسال سفارش چقدر طول می‌کشه؟', a:'سفارش‌ها معمولاً ۱ تا ۲ روز کاری آماده و تحویل پست می‌شن. زمان رسیدن بسته به شهر مقصد بین ۲ تا ۵ روز کاری متغیره.',
    qen:'How long does shipping take?', aen:'Orders ship within 1–2 business days and arrive in 2–5 business days depending on your city.' },
  { q:'امکان مرجوع کردن کالا هست؟', a:'تا ۷ روز بعد از تحویل، اگر کالا باز نشده و سالم باشه می‌تونی مرجوعش کنی. هزینه‌ی ارسال مرجوعی با خریداره مگر اینکه ایراد از کالا باشه.',
    qen:'Can I return an item?', aen:'You can return unopened, undamaged items within 7 days of delivery.' },
  { q:'کد پیگیری سفارشم رو کجا ببینم؟', a:'بلافاصله بعد از ثبت سفارش کد پیگیری نمایش داده می‌شه و پیامک هم می‌شه. از بخش «پیگیری سفارش» توی منو می‌تونی وضعیت لحظه‌ای رو ببینی.',
    qen:'Where do I find my tracking code?', aen:'It appears right after checkout and is texted to you. Check status any time in the Track Order page.' },
  { q:'فیگورهای اسکن‌شده چطور ساخته می‌شن؟', a:'با اسکنر سه‌بعدی مدل گرفته می‌شه، بعد پرینت رزینی و در آخر رنگ‌آمیزی دستی انجام می‌شه. همین باعث می‌شه هر قطعه کمی منحصربه‌فرد باشه.',
    qen:'How are scanned figures made?', aen:'3D-scanned, resin-printed, then hand-painted — so every piece is slightly unique.' }
];
// فقط وقتی جدول خالی است — تا اجرای دوباره seed محتوا را تکراری نکند
if (!db.prepare('SELECT id FROM faqs LIMIT 1').get()) {
  const insFaq = db.prepare('INSERT INTO faqs (question_fa,answer_fa,question_en,answer_en,sort_order) VALUES (?,?,?,?,?)');
  faqs.forEach((f, i) => insFaq.run(f.q, f.a, f.qen, f.aen, i));
  console.log(`  ✓ ${faqs.length} سوال متداول نمونه`);
} else {
  console.log('  · سوالات متداول از قبل وجود دارد؛ رد شد.');
}

// ---------------- اطلاعیه‌ها ----------------
const anns = [
  { t:'فروشگاه با نام جدید «مای پیکسل» راه‌اندازی شد', b:'اسم و لوگوی فروشگاه عوض شد ولی همون تیم و همون کیفیت. سفارش‌های قبلی با همون کد پیگیری قابل رهگیری‌ان.', level:'success', pin:1 },
  { t:'تخفیف تابستانه روی دسته‌ی ماشین فلزی', b:'تا پایان مرداد روی محصولات منتخب دسته‌ی ماشین فلزی تخفیف داریم. تعداد محدوده.', level:'info', pin:0 },
  { t:'تعطیلی ارسال در روزهای تعطیل رسمی', b:'در روزهای تعطیل رسمی ارسال انجام نمی‌شه و سفارش‌ها اولین روز کاری بعد پست می‌شن.', level:'warning', pin:0 }
];
if (!db.prepare('SELECT id FROM announcements LIMIT 1').get()) {
  const insAnn = db.prepare('INSERT INTO announcements (title_fa,body_fa,level,is_pinned) VALUES (?,?,?,?)');
  anns.forEach(a => insAnn.run(a.t, a.b, a.level, a.pin));
  console.log(`  ✓ ${anns.length} اطلاعیه نمونه`);
} else {
  console.log('  · اطلاعیه‌ها از قبل وجود دارد؛ رد شد.');
}

// ---------------- درگاه‌های پرداخت ----------------
const gws = [
  { code:'zarinpal', fa:'زرین‌پال', en:'ZarinPal', active:1, sort:0 },
  { code:'zibal',    fa:'زیبال',    en:'Zibal',    active:1, sort:1 },
  { code:'idpay',    fa:'آیدی‌پی',  en:'IDPay',    active:0, sort:2 },
  { code:'nextpay',  fa:'نکست‌پی',  en:'NextPay',  active:0, sort:3 },
  { code:'cod',      fa:'پرداخت در محل', en:'Cash on Delivery', active:1, sort:3 }
];
const insGw = db.prepare(`INSERT OR IGNORE INTO payment_gateways (code,name_fa,name_en,is_active,sort_order,callback_url)
                          VALUES (?,?,?,?,?,?)`);
gws.forEach(g => insGw.run(g.code, g.fa, g.en, g.active, g.sort, '/api/payment/callback/' + g.code));

// ---------------- تنظیمات ----------------
const settings = {
  site_name_fa: 'مای پیکسل',
  site_name_en: 'MY PIXEL',
  tagline_fa: 'اشیای دیجیتال، در دنیای واقعی.',
  tagline_en: 'Digital objects, in the real world.',
  support_phone: '02100000000',
  support_telegram: 'https://t.me/mypixel',
  support_instagram: 'https://instagram.com/mypixel',
  support_hours: 'شنبه تا چهارشنبه، ۱۰ تا ۱۸',
  shipping_cost: '65000',
  free_shipping_from: '2000000',
  currency_fa: 'تومان',
  about_fa: 'مای پیکسل جاییه که ایده‌های دیجیتال به اشیای واقعی تبدیل می‌شن.',
  maintenance: '0',
  maintenance_message: 'داریم چندتا چیز رو بهتر می‌کنیم. خیلی زود برمی‌گردیم.',

  // ───── مالیات و مکان ─────
  tax_rate: '0',                    // درصد — ۹ برای ارزش افزوده
  tax_label_fa: 'مالیات بر ارزش افزوده',
  home_province: 'تهران',
  shipping_cost_home: '45000',
  shipping_carriers_fa: 'پست پیشتاز، تیپاکس',
  store_address_fa: '',
  store_lat: '', store_lng: '',
  return_days: '7',

  // ───── سئو ─────
  seo_title: 'مای پیکسل | فروشگاه اشیای کلکسیونی',
  seo_description: 'تابلوهای طرح‌دار، فیگورهای اسکن‌شده و ماشین‌های فلزی کلکسیونی.',
  seo_keywords: 'فیگور، تابلو، ماشین فلزی، کلکسیونی، مای پیکسل',
  seo_og_image: '',
  seo_canonical: '',
  seo_robots: 'index,follow',
  seo_gtm: '', seo_ga: '', seo_verification: '',

  // ───── درگاه پرداخت ─────
  site_url: '',                      // مثلاً https://mypixel.ir — برای ساخت callback
  private_zarinpal_merchant: '',     // کد پذیرنده ۳۶ کاراکتری زرین‌پال
  zarinpal_sandbox: '0',
  private_zibal_merchant: '',        // کد پذیرنده زیبال
  zibal_sandbox: '0',
  private_zibal_merchant: '',        // کد پذیرنده زیبال («zibal» برای تست)

  // ───── قوانین و مقررات ─────
  terms_title: 'قوانین و مقررات',
  terms_updated: '',
  terms_body: `به فروشگاه مای پیکسل خوش اومدی. با ثبت سفارش، شرایط زیر رو می‌پذیری.

## ۱. ثبت سفارش
سفارش بعد از ثبت و پرداخت قطعی می‌شه. تا قبل از ارسال، از صفحه پیگیری می‌تونی لغوش کنی.

## ۲. قیمت‌ها و موجودی
قیمت‌ها به تومان و شامل هزینه بسته‌بندی هستن. اگر بعد از ثبت سفارش کالایی ناموجود بشه، باهات تماس می‌گیریم و مبلغش رو برمی‌گردونیم.

## ۳. ارسال
سفارش‌ها با پست پیشتاز یا تیپاکس ارسال می‌شن و کد رهگیری در صفحه پیگیری قرار می‌گیره. زمان تحویل معمولاً ۲ تا ۵ روز کاریه.

## ۴. مرجوعی
تا ۷ روز بعد از تحویل، اگر کالا معیوب یا اشتباه بود، از بخش مرجوعی درخواست بده. کالا باید در بسته‌بندی اصلی و بدون آسیب باشه.

## ۵. حریم خصوصی
اطلاعات تماس و آدرست فقط برای پردازش سفارش استفاده می‌شه و در اختیار شخص ثالث قرار نمی‌گیره.

## ۶. مالکیت محتوا
تصاویر، طرح‌ها و متن‌های این سایت متعلق به مای پیکسل هستن و استفاده تجاری ازشون نیاز به اجازه کتبی داره.

## ۷. تماس
اگر سوالی داشتی یا موردی برات پیش اومد، از بخش پشتیبانی بهمون پیام بده.`,

  // ───── پنل پیامکی ─────
  sms_enabled: '1',
  sms_driver: 'console',        // console | kavenegar | smsir | melipayamak | ghasedak
  private_sms_api_key: '',
  sms_sender: '',
  sms_line: '',
  sms_otp_template: '',         // نام الگوی تاییدشده برای کد ورود (کاوه‌نگار)

  // ───── ورود با گوگل ─────
  google_enabled: '0',
  google_client_id: '',
  private_google_client_secret: '',
  google_redirect_uri: '',

  // ───── نمادهای اعتماد ─────
  trust_enamad_url: '', trust_enamad_code: '',
  trust_enamad_title: 'نماد اعتماد', trust_enamad_desc: 'ای‌نماد', trust_enamad_icon: 'shield',
  trust_torob_url: '',
  trust_torob_title: 'ترب', trust_torob_desc: 'مقایسه قیمت', trust_torob_icon: 'search',
  trust_emalls_url: '',
  trust_emalls_title: 'ایمالز', trust_emalls_desc: 'رصد قیمت', trust_emalls_icon: 'bag',
  trust_enamad_logo: '', trust_torob_logo: '', trust_emalls_logo: ''
};
const insSet = db.prepare(`INSERT INTO settings (key,value) VALUES (?,?)
                           ON CONFLICT(key) DO NOTHING`);
Object.entries(settings).forEach(([k, v]) => insSet.run(k, v));

// ---------------- پروموشن و کد تخفیف نمونه ----------------
if (!db.prepare('SELECT id FROM promotions LIMIT 1').get()) {
  const promos = [
    { title_fa: 'تخفیف شگفت‌انگیز امروز', subtitle_fa: 'تا ۲۴ ساعت دیگر', kind: 'flash', badge_fa: 'شگفت‌انگیز', discount_percent: 20, sort: 1 },
    { title_fa: 'پیشنهاد مای پیکسل', subtitle_fa: 'دست‌چین سردبیر', kind: 'suggested', badge_fa: 'پیشنهادی', discount_percent: 0, sort: 2 }
  ];
  const ids = db.prepare('SELECT id FROM products ORDER BY id').all().map(r => r.id);
  promos.forEach((pr, idx) => {
    const info = db.prepare(`INSERT INTO promotions
      (title_fa, subtitle_fa, kind, badge_fa, discount_percent, sort_order) VALUES (?,?,?,?,?,?)`)
      .run(pr.title_fa, pr.subtitle_fa, pr.kind, pr.badge_fa, pr.discount_percent, pr.sort);
    const pick = idx === 0 ? ids.slice(0, 3) : ids.slice(3, 7);
    pick.forEach((pid, i) =>
      db.prepare('INSERT OR IGNORE INTO promotion_items (promotion_id, product_id, sort_order) VALUES (?,?,?)')
        .run(info.lastInsertRowid, pid, i));
  });
  console.log('  ✓ ۲ پروموشن نمونه');
}

if (!db.prepare('SELECT id FROM coupons LIMIT 1').get()) {
  db.prepare(`INSERT INTO coupons (code, kind, value, min_order, max_amount, max_uses)
    VALUES ('PIXEL10','percent',10,500000,200000,100)`).run();
  db.prepare(`INSERT INTO coupons (code, kind, value, min_order)
    VALUES ('WELCOME','amount',50000,300000)`).run();
  console.log('  ✓ ۲ کد تخفیف نمونه (PIXEL10، WELCOME)');
}

// ---------------- قالب‌های پیامک ----------------
require('./lib/notify').ensureTemplates();
console.log('  ✓ قالب‌های پیامک آماده شد');

// ---------------- کانال‌های پشتیبانی ----------------
if (!db.prepare('SELECT id FROM support_channels LIMIT 1').get()) {
  const get = k => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
  const ins = db.prepare(`INSERT INTO support_channels
    (name_fa,name_en,desc_fa,desc_en,kind,value,icon,sort_order) VALUES (?,?,?,?,?,?,?,?)`);
  [
    ['تلگرام','Telegram','سریع‌ترین راه ارتباط. معمولاً زیر ۱۰ دقیقه جواب می‌دیم.',
     'Fastest way to reach us — usually under 10 minutes.','telegram', get('support_telegram'), 'telegram', 0],
    ['اینستاگرام','Instagram','دایرکت بده، کارهای جدید رو هم اونجا می‌ذاریم.',
     'Send us a DM — we post new work there too.','instagram', get('support_instagram'), 'instagram', 1],
    ['تماس تلفنی','Phone','اگه عجله داری زنگ بزن.',
     'Call us if it is urgent.','phone', get('support_phone'), 'phone', 2],
    ['ساعت کاری','Working hours','','',
     'hours', get('support_hours') || 'شنبه تا چهارشنبه، ۱۰ تا ۱۸', 'clock2', 3]
  ].forEach(c => ins.run(...c));
  console.log('  ✓ ۴ کانال پشتیبانی نمونه');
}

// ---------------- پلتفرم‌های فروش ----------------
if (!db.prepare('SELECT id FROM platforms LIMIT 1').get()) {
  const ins = db.prepare(`INSERT INTO platforms (name_fa,name_en,slug,url,desc_fa,sort_order)
    VALUES (?,?,?,?,?,?)`);
  [
    ['دیجی‌کالا','Digikala','digikala','', 'محصولات مای پیکسل با ارسال دیجی‌کالا و امکان پرداخت در محل.', 0],
    ['باسلام','Basalam','basalam','', 'غرفه‌ی ما در باسلام، با تمرکز روی کارهای دست‌ساز و سفارشی.', 1],
    ['ترب','Torob','torob','', 'مقایسه‌ی قیمت محصولات ما با بقیه فروشگاه‌ها.', 2],
    ['ایمالز','Emalls','emalls','', 'رصد قیمت و تاریخچه‌ی تخفیف‌های مای پیکسل.', 3]
  ].forEach(x => ins.run(...x));
  console.log('  ✓ ۴ پلتفرم فروش نمونه');
}

// ---------------- بنرهای نمونه ----------------
if (!db.prepare('SELECT id FROM banners LIMIT 1').get()) {
  const ins = db.prepare(`INSERT INTO banners (title_fa, body_fa, link_url, position, sort_order)
    VALUES (?,?,?,?,?)`);
  [
    ['ارسال رایگان بالای ۲ میلیون تومان', 'برای همه سفارش‌های داخل ایران', '#/products', 'home_top', 0],
    ['کالکشن تابستانه رسید', 'تابلوها و فیگورهای جدید، تعداد محدود', '#/products?category=wall-art', 'home_top', 1],
    ['گارانتی اصالت روی همه محصولات', 'اگر اصل نبود، بدون سوال مرجوع می‌شه', '#/about', 'home_mid', 0],
    ['کد تخفیف PIXEL10', 'ده درصد تخفیف روی سفارش‌های بالای ۵۰۰ هزار تومان', '#/products', 'home_bottom', 0]
  ].forEach(b => ins.run(b[0], b[1], b[2], b[3], b[4]));
  console.log('  ✓ ۴ بنر نمونه (۲ بالا، ۱ وسط، ۱ پایین)');
}

// ---------------- سایز و رنگ نمونه برای محصول اول ----------------
if (!db.prepare('SELECT id FROM product_options LIMIT 1').get()) {
  const first = db.prepare('SELECT id FROM products ORDER BY id LIMIT 1').get();
  if (first) {
    const io = db.prepare(`INSERT INTO product_options
      (product_id, kind, label, unit, color_hex, price_diff, sort_order) VALUES (?,?,?,?,?,?,?)`);
    [['30', 'سانتی‌متر', 0], ['50', 'سانتی‌متر', 120000], ['70', 'سانتی‌متر', 260000]]
      .forEach((x, i) => io.run(first.id, 'size', x[0], x[1], null, x[2], i));
    [['مشکی', '#111418'], ['سیان', '#2EE6F5'], ['طلایی', '#D9A441']]
      .forEach((x, i) => io.run(first.id, 'color', x[0], '', x[1], 0, i));

    db.prepare(`UPDATE products SET
      pros_fa = 'چاپ باکیفیت و ماندگار' || char(10) || 'قاب آماده نصب' || char(10) || 'بسته‌بندی ضدضربه',
      cons_fa = 'وزن نسبتاً بالا برای سایز ۷۰' || char(10) || 'فقط سه رنگ موجوده'
      WHERE id = ?`).run(first.id);
    // موجودی جداگانه برای هر ترکیب سایز×رنگ
    const { syncVariants, rollupStock } = require('./lib/variants');
    syncVariants(first.id);
    const stocks = [12, 8, 15, 10, 0, 14, 18, 9, 11];   // یکی عمداً صفر تا حالت ناموجود دیده شود
    db.prepare('SELECT id FROM product_variants WHERE product_id = ? ORDER BY id').all(first.id)
      .forEach((v, i) => db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?')
        .run(stocks[i % stocks.length], v.id));
    rollupStock(first.id);
    console.log('  ✓ سایز/رنگ، موجودی هر ترکیب، و نقاط قوت و ضعف نمونه');
  }
}

// ---------------- یک سفارش نمونه برای تست صفحه‌ی پیگیری ----------------
if (!db.prepare('SELECT id FROM orders LIMIT 1').get()) {
  const code = makeTrackingCode();
  const p = db.prepare('SELECT * FROM products LIMIT 1').get();
  const info = db.prepare(`INSERT INTO orders (tracking_code,customer_name,phone,city,address,subtotal,shipping_cost,total,status,payment_status)
                           VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(code, 'مشتری نمونه', '09121234567', 'تهران', 'خیابان نمونه، پلاک ۱', p.price, 65000, p.price + 65000, 'processing', 'paid');
  db.prepare('INSERT INTO order_items (order_id,product_id,title_snapshot,unit_price,qty) VALUES (?,?,?,?,?)')
    .run(info.lastInsertRowid, p.id, p.name_fa, p.price, 1);
  const hist = db.prepare('INSERT INTO order_status_history (order_id,status,note) VALUES (?,?,?)');
  hist.run(info.lastInsertRowid, 'pending', 'سفارش ثبت شد');
  hist.run(info.lastInsertRowid, 'paid', 'پرداخت تایید شد');
  hist.run(info.lastInsertRowid, 'processing', 'در حال آماده‌سازی بسته');
  console.log(`  سفارش نمونه ساخته شد → کد پیگیری برای تست: ${code}`);
}

console.log(`\n  دیتابیس آماده شد: ${DB_PATH}\n`);
