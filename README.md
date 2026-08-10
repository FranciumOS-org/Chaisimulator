<div dir="rtl">

# مای پیکسل — فروشگاه کلکسیونی

فروشگاه کامل با بک‌اند Node.js + SQLite، سایت تک‌صفحه‌ای فارسی/انگلیسی، و پنل مدیریت.

---

## راه‌اندازی سریع (لوکال)

```bash
cd backend
cp .env.example .env      # بعد JWT_SECRET رو عوض کن
npm install
npm run seed              # ساخت جداول + داده نمونه + حساب ادمین
npm start
```

> از ریشه‌ی پروژه (پوشه‌ی `mypixel`) هم می‌تونی همین دستورها رو بزنی —
> `npm install`، `npm run seed`، `npm start` — به `backend` منتقل می‌شن.

سایت: `http://localhost:3000`
پنل مدیریت: `http://localhost:3000/admin`

**حساب ادمین پیش‌فرض:**

| نام کاربری | رمز |
|---|---|
| `admin` | `MyPixel@1404` |

> ⚠️ **بلافاصله بعد از نصب رمز رو عوض کن** — از پنل: تنظیمات سایت ← رمز عبور حساب مدیر.

اسکریپت‌های دیگر:

```bash
npm run dev      # اجرا با ری‌استارت خودکار
npm run reset    # پاک کردن کامل دیتابیس و ساخت دوباره از صفر
npm run dedupe   # حذف ردیف‌های تکراری بدون از دست دادن داده
```

> `npm run seed` چند بار پشت سر هم مشکلی ایجاد نمی‌کند — هر بخش فقط وقتی جدولش
> خالی باشد پر می‌شود. اگر از نسخه‌ای قدیمی‌تر ردیف تکراری مانده،
> `npm run dedupe` تمیزش می‌کند و محتوایی که خودت اضافه کرده‌ای دست‌نخورده می‌ماند.

---

## ساختار پروژه

```
mypixel/
├── backend/
│   ├── server.js            نقطه ورود، سئو، حالت تعمیر، سرو استاتیک و API
│   ├── schema.sql           جداول پایه
│   ├── schema2.sql          جداول تنوع، علاقه‌مندی، آدرس، مرجوعی، پروموشن، تخفیف، بنر، پلتفرم
│   ├── seed.js              داده اولیه + ساخت حساب ادمین
│   ├── dedupe.js            حذف ردیف‌های تکراری
│   ├── lib/
│   │   ├── db.js            اتصال SQLite (WAL) و مهاجرت
│   │   ├── variants.js      ساخت و همگام‌سازی ترکیب‌های سایز×رنگ
│   │   ├── notify.js        قالب‌های پیامک، رندر متغیرها و ثبت در تاریخچه
│   │   ├── gateways.js      درایور زرین‌پال و زیبال
│   │   ├── provinces.js     ۳۱ استان ایران
│   │   ├── icons.js         ۵۰ کلید آیکون
│   │   ├── helpers.js       نرمال‌سازی موبایل، اسلاگ، کد پیگیری، OTP
│   │   └── sms.js           درایور پیامک (console / kavenegar / smsir)
│   ├── middleware/auth.js   JWT، requireAuth، requireAdmin، لاگ ادمین
│   └── routes/
│       ├── auth.js          OTP، ورود ادمین، /me
│       ├── shop.js          محصولات، دسته‌بندی، جستجو، FAQ، اطلاعیه
│       ├── orders.js        ثبت سفارش با آدرس/تنوع/تخفیف/مالیات، پیگیری، سفارش‌های من
│       ├── account.js       علاقه‌مندی، آدرس‌ها، دیدگاه‌های من، مرجوعی
│       └── admin.js         تمام CRUD پنل مدیریت
├── data/
│   └── mypixel.db           دیتابیس (خودکار ساخته می‌شه)
└── public/
    ├── index.html           سایت (SPA با hash routing)
    ├── admin.html           پنل مدیریت
    └── assets/
        ├── styles.css       استایل پایه سایت
        ├── styles2.css      استایل تنوع، دیدگاه، تسویه، فوتر، انیمیشن‌ها
        ├── icons.js         کتابخانه ۵۰ آیکون SVG
        ├── app.js           منطق سایت
        ├── admin.css        استایل پنل
        ├── admin.js         منطق پنل
        └── logo.svg         لوگو
```

---

## استقرار روی سرور

### ۱. انتقال فایل‌ها

```bash
rsync -avz --exclude node_modules mypixel/ user@server:/var/www/mypixel/
```

### ۲. نصب و تنظیم

```bash
cd /var/www/mypixel/backend
cp .env.example .env
nano .env
```

مقدارهایی که حتماً باید عوض بشن:

```ini
JWT_SECRET=<خروجی openssl rand -hex 32>
SITE_URL=https://mypixel.ir
CORS_ORIGIN=https://mypixel.ir
SECURE_COOKIE=1
EXPOSE_OTP=0
SMS_DRIVER=kavenegar
SMS_API_KEY=<کلید پنل پیامکی>
```

```bash
npm install --omit=dev
npm run seed
```

### ۳. اجرای دائمی با systemd

فایل `/etc/systemd/system/mypixel.service`:

```ini
[Unit]
Description=MyPixel Shop
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mypixel/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
EnvironmentFile=/var/www/mypixel/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mypixel
sudo systemctl status mypixel
```

یا با pm2:

```bash
npm i -g pm2
pm2 start server.js --name mypixel
pm2 save && pm2 startup
```

> **مهم:** سایت از History API استفاده می‌کند و آدرس‌ها بدون `#` هستند
> (`/products` نه `/#/products`). هر مسیری باید به `index.html` برسد.
> `server.js` با `app.get('*')` این کار را می‌کند، و چون nginx همه‌چیز را
> proxy می‌کند مشکلی نیست. اگر روزی فایل‌های استاتیک را جدا سرو کردی،
> حتماً `try_files $uri /index.html;` اضافه کن، وگرنه رفرش روی
> `/products` خطای ۴۰۴ می‌دهد.

### ۴. Nginx

> ⚠️ **مهم:** آدرس‌ها بدون `#` هستند (`/products` نه `/#/products`). یعنی سرور باید
> هر مسیری را به `index.html` بدهد. `app.get('*')` در `server.js` این کار را می‌کند و
> کانفیگ nginx زیر هم چون همه‌چیز را proxy می‌کند مشکلی ندارد. اگر روزی فایل‌های استاتیک
> را جدا سرو کردی، حتماً `try_files $uri /index.html;` اضافه کن وگرنه رفرش روی
> `/products` خطای ۴۰۴ می‌دهد.

```nginx
server {
    listen 80;
    server_name mypixel.ir www.mypixel.ir;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mypixel.ir www.mypixel.ir;

    ssl_certificate     /etc/letsencrypt/live/mypixel.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mypixel.ir/privkey.pem;

    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # کش فایل‌های استاتیک
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

```bash
sudo certbot --nginx -d mypixel.ir -d www.mypixel.ir
```

### ۵. پشتیبان‌گیری

کل دیتابیس یک فایله. کرون روزانه:

```bash
0 3 * * * sqlite3 /var/www/mypixel/data/mypixel.db ".backup '/var/backups/mypixel-$(date +\%F).db'"
```

---

## پنل مدیریت

| بخش | امکانات |
|---|---|
| داشبورد | فروش کل، سفارش‌های باز، موجودی رو به اتمام، نمودار ۷ روزه، آخرین سفارش‌ها |
| محصولات | افزودن/ویرایش/حذف، قیمت تخفیفی، آپلود چند تصویر، علامت «ویژه» |
| موجودی ترکیب‌ها | ماتریس سایز×رنگ — موجودی هر ترکیب جدا، جمع خودکار |
| تصویر هر رنگ | انتخاب عکس اختصاصی برای هر رنگ از گالری محصول |
| دسته‌بندی‌ها | CRUD، اسلاگ، آیکون، ترتیب نمایش |
| سفارش‌ها | تغییر وضعیت (۸ حالت)، وضعیت پرداخت، کد رهگیری پست، یادداشت برای مشتری، تاریخچه |
| کاربران | CRUD، تغییر نقش به مدیر، مسدودسازی |
| نظرات | تایید / رد / حذف |
| درگاه‌های پرداخت | افزودن درگاه، Merchant ID، کال‌بک، حالت تست |
| سوالات متداول | CRUD دوزبانه |
| اطلاعیه‌ها | CRUD، سنجاق، سه سطح (اطلاع / خبر خوب / هشدار) |
| تنظیمات | نام سایت، هزینه ارسال، آستانه ارسال رایگان، اطلاعات پشتیبانی، حالت تعمیر |
| مرجوعی‌ها | بررسی درخواست‌ها، تغییر وضعیت، یادداشت برای مشتری |
| پروموشن‌ها | تخفیف شگفت‌انگیز / پیشنهادی / تخفیف‌دار — انتخاب محصول با جستجو |
| کدهای تخفیف | درصدی یا مبلغ ثابت، سقف، حداقل سفارش، تعداد استفاده، بازه زمانی |
| بنرهای تبلیغاتی | سه جایگاه (بالا/وسط/پایین صفحه اصلی)، اسلایدر خودکار، آپلود تصویر، لینک مقصد |
| پلتفرم‌های فروش | دیجی‌کالا، باسلام، ترب، ایمالز و هر پلتفرم دیگر — لوگو، لینک، توضیح، پس‌زمینه بلور |
| کانال‌های پشتیبانی | تلگرام، اینستاگرام، واتساپ، تلفن، ایمیل، ساعت کاری — آیکون، لوگو، پس‌زمینه بلور |
| پرداخت، مالیات و مکان | درصد مالیات، هزینه ارسال استانی، مهلت مرجوعی، مختصات فروشگاه |
| مدیریت سئو | Title، Description، Keywords، Canonical، Robots، OG image، GA، GTM |
| ورود با گوگل و نمادها | Client ID/Secret، Redirect URI، لینک اینماد/ترب/ایمالز |
| سفارش‌های لغوشده | تفکیک لغو مشتری/فروشگاه، آیدی تلگرام و شماره کارت برای بازگشت وجه |
| مدیریت رسانه | همه تصاویر آپلودشده، نمایش محل استفاده، ویرایش عنوان و alt، حذف امن |
| قوانین و مقررات | ویرایشگر مارک‌داون با پیش‌نمایش زنده |
| سفارش‌های لغوشده | تفکیک لغو مشتری/فروشگاه، آیدی تلگرام، شماره کارت بازگشت وجه |
| مدیریت رسانه | همه تصاویر آپلودشده، جای استفاده هر کدام، ویرایش عنوان و alt، حذف |
| قوانین و مقررات | ویرایشگر مارک‌داون با پیش‌نمایش زنده |
| پنل پیامکی | ۸ قالب رویداد، ۵ سرویس‌دهنده، ارسال تست، تاریخچه ارسال |
| گزارش فعالیت | لاگ همه عملیات مدیر |

محافظت‌های داخلی: حذف دسته‌بندی دارای محصول ممنوع · حذف یا تنزل آخرین مدیر ممنوع · حذف حساب خود ممنوع.

---

## مسیرهای API

### عمومی
```
GET    /api/health
GET    /api/categories
GET    /api/categories/:slug
GET    /api/products?q=&category=&min=&max=&sort=&featured=&in_stock=&page=
GET    /api/search?q=
GET    /api/products/:slug
POST   /api/products/:id/comments
GET    /api/faqs
GET    /api/announcements
GET    /api/gateways
GET    /api/settings
POST   /api/orders
GET    /api/orders/track/:code        ← پیگیری بدون نیاز به ورود
GET    /api/orders/actions/:code      ← آیا سفارش قابل لغو یا مرجوع است؟
GET    /api/orders/invoice/:code      ← فاکتور کامل برای چاپ
POST   /api/orders/cancel             ← لغو سفارش + آیدی تلگرام و کارت بازگشت وجه
GET    /api/orders/invoice/:code      ← فاکتور قابل چاپ
GET    /api/platforms
GET    /api/support-channels
```

### احراز هویت
```
POST   /api/auth/otp/request     { phone, mode: login|register, first_name, last_name }
POST   /api/auth/otp/verify      { phone, code }
POST   /api/auth/admin/login     { username, password }
GET    /api/auth/me
GET    /api/auth/google/config      ← آیا ورود با گوگل فعال است؟
POST   /api/auth/google             ← credential یا code
POST   /api/auth/logout
PATCH  /api/auth/me
```

### حساب کاربری (نیازمند ورود)
```
GET    /api/account/wishlist
GET    /api/account/wishlist/ids
POST   /api/account/wishlist/:productId    ← toggle
CRUD   /api/account/addresses
GET    /api/account/reviews
POST   /api/account/returns/check          ← بررسی واجد شرایط بودن سفارش
POST   /api/account/returns                ← فقط برای سفارش تحویل‌شده، با انتخاب اقلام و تعداد
GET    /api/account/returns/mine
```

### عمومی — افزوده
```
GET    /api/promotions
GET    /api/banners?position=
GET    /api/provinces
GET    /api/icons
POST   /api/coupon/check
DELETE /api/comments/:id                   ← حذف دیدگاه توسط خود کاربر
GET    /robots.txt
GET    /sitemap.xml
```

### مدیریت (نیازمند نقش admin)
```
GET    /api/admin/stats
POST   /api/admin/upload
CRUD   /api/admin/products
CRUD   /api/admin/categories
CRUD   /api/admin/users
CRUD   /api/admin/gateways
CRUD   /api/admin/faqs
CRUD   /api/admin/announcements
GET    /api/admin/orders
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status
GET    /api/admin/comments
PATCH  /api/admin/comments/:id
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/logs
GET    /api/admin/sms/templates
PUT    /api/admin/sms/templates/:key
POST   /api/admin/sms/preview
POST   /api/admin/sms/test
GET    /api/admin/sms/log
DELETE /api/admin/sms/log
CRUD   /api/admin/promotions
CRUD   /api/admin/coupons
CRUD   /api/admin/banners
CRUD   /api/admin/platforms
CRUD   /api/admin/support-channels
GET    /api/admin/media
POST   /api/admin/media               ← آپلود دسته‌ای
PUT    /api/admin/media/:id
DELETE /api/admin/media/:id?force=1
GET    /api/admin/media
POST   /api/admin/media               ← آپلود دسته‌ای
PUT    /api/admin/media/:id
DELETE /api/admin/media/:id?force=1
GET    /api/admin/products/:id/variants    ← ماتریس موجودی
PUT    /api/admin/products/:id/variants
GET    /api/admin/returns
PATCH  /api/admin/returns/:id
GET    /api/admin/products/lookup?q=
GET    /api/admin/products/:id/images
POST   /api/admin/products/:id/images      ← چند فایل با هم
DELETE /api/admin/products/:id/images/:imgId
PATCH  /api/admin/products/:id/images/:imgId/cover
GET    /api/admin/products/:id/options
POST   /api/admin/products/:id/options     ← سایز یا رنگ
PUT    /api/admin/options/:optId
DELETE /api/admin/options/:optId
```

---

## کارهایی که هنوز نمادین‌اند

| مورد | وضعیت |
|---|---|
| ارسال پیامک | از پنل پیامکی سرویس‌دهنده و کلید API را وارد کن |
| ورود با گوگل | از «ورود با گوگل و نمادها» در پنل، Client ID و Secret را وارد و فعال کن |
| اتصال واقعی درگاه پرداخت | جدول و پنل آماده‌ست، منطق redirect/verify زرین‌پال باید اضافه بشه |
| صفحه اطلاعیه‌ها | ساختار کامل، محتوا نمونه‌ست |

---

## حالت تعمیر و نگهداری

از پنل: تنظیمات سایت ← «حالت تعمیر و نگهداری».

وقتی روشن باشد:
- بازدیدکننده‌ها یک صفحه ۵۰۳ شیشه‌ای با پیام دلخواه می‌بینند
- پنل `/admin`، مسیر `/api/admin/*`، `/api/auth/*` و فایل‌های `/assets/` باز می‌مانند
- هر کاربری که با حساب مدیر وارد شده باشد، سایت را عادی می‌بیند

---

## چک‌لیست امنیتی قبل از انتشار

- [ ] `JWT_SECRET` عوض شده
- [ ] رمز حساب `admin` عوض شده
- [ ] `EXPOSE_OTP=0`
- [ ] `SECURE_COOKIE=1` و سایت روی HTTPS
- [ ] `CORS_ORIGIN` فقط دامنه خودت
- [ ] فایل `.env` توی گیت نیست
- [ ] پوشه `data/` بیرون از دسترس وب

</div>

---

## پنل پیامکی

از پنل: **پنل پیامکی**. سه تب دارد.

### تنظیمات
سرویس‌دهنده را انتخاب کن و کلید API را بگذار. پنل‌های پشتیبانی‌شده:

| سرویس | چه چیزی لازم است |
|---|---|
| کنسول | هیچ — پیامک‌ها فقط در لاگ سرور چاپ می‌شوند (برای تست لوکال) |
| کاوه‌نگار | کلید API، شماره فرستنده، و اختیاری نام الگوی تاییدشده برای کد ورود |
| SMS.ir | کلید API و شماره خط |
| ملی پیامک | کلید API و شماره فرستنده |
| قاصدک | کلید API و شماره خط |

کلید API با پیشوند `private_` ذخیره می‌شود و هرگز در پاسخ `/api/settings` برای کاربر ارسال نمی‌شود.

### قالب‌ها
هشت رویداد که خودکار پیامک می‌فرستند:

| کلید | چه زمانی | متغیرها |
|---|---|---|
| `otp` | درخواست کد ورود | `{code}` `{minutes}` |
| `welcome` | اولین ساخت حساب | `{name}` |
| `order_placed` | ثبت سفارش | `{name}` `{code}` `{total}` `{items}` |
| `order_status` | تغییر وضعیت توسط مدیر | `{code}` `{status}` |
| `order_shipped` | وضعیت «ارسال شد» با کد رهگیری | `{code}` `{post}` |
| `order_cancelled` | لغو سفارش | `{code}` |
| `return_received` | ثبت درخواست مرجوعی | `{code}` `{items}` |
| `return_status` | تغییر وضعیت مرجوعی | `{code}` `{status}` `{note}` |

`{shop}` در همه قالب‌ها در دسترس است. هر قالب را می‌شود جداگانه خاموش کرد.

### تاریخچه
هر پیامک با گیرنده، متن، وضعیت و سرویس ثبت می‌شود. شکست ارسال هیچ‌وقت جریان اصلی
(ثبت سفارش، مرجوعی، ورود) را متوقف نمی‌کند و فقط «ناموفق» لاگ می‌شود.

---

## ورود با گوگل

۱. در [console.cloud.google.com](https://console.cloud.google.com) یک **OAuth Client ID** از نوع
   *Web application* بساز.
۲. در بخش **Authorized JavaScript origins** آدرس سایتت را اضافه کن (مثلاً `https://mypixel.ir`).
۳. در پنل مدیریت → **ورود با گوگل و نمادها**: `Client ID` و `Client Secret` را بگذار و
   تیک «ورود با گوگل فعال باشد» را بزن.

دکمه‌ی گوگل در پنجره‌ی ورود سایت فقط وقتی نمایش داده می‌شود که این تنظیمات کامل باشند.
اگر کاربری با ایمیلی وارد شود که از قبل حساب دارد، همان حساب به گوگل وصل می‌شود
و حساب تکراری ساخته نمی‌شود.

---

## صفحه‌های سایت

| مسیر | چیست |
|---|---|
| `/` | صفحه اصلی — بنر، محصولات ویژه، پروموشن‌ها، دسته‌بندی‌ها |
| `/products` | همه محصولات با فیلتر |
| `/product/:slug` | صفحه محصول |
| `/categories` | دسته‌بندی‌ها |
| `/track` | پیگیری سفارش (با فاکتور، لغو و مرجوعی) |
| `/checkout` | تکمیل سفارش (نیازمند ورود) |
| `/account` | حساب کاربری — ۶ تب با `?tab=` |
| `/wishlist` | علاقه‌مندی‌ها |
| `/returns` | قوانین و ثبت مرجوعی |
| `/shipping` | اطلاعات حمل و نقل |
| `/terms` | قوانین و مقررات |
| `/platforms` | پلتفرم‌های فروش |
| `/faq` · `/announcements` · `/about` · `/support` | صفحات محتوایی |
| هر مسیر دیگر | صفحه ۴۰۴ با جستجو و میان‌بر |

## فاکتور

از سه جا در دسترس است: بعد از ثبت سفارش، صفحه پیگیری، و تب سفارش‌ها در حساب کاربری.
در پنجره‌ای جدا باز می‌شود و دکمه چاپ دارد (استایل مخصوص چاپ روی کاغذ سفید).

چون فاکتور آدرس کامل و شماره تماس دارد، دسترسی محدود است: حساب صاحب سفارش، مدیر،
یا هرکسی که شماره موبایل ثبت‌شده در سفارش را وارد کند. اگر شماره حساب با سفارش نخواند،
خودش شماره را می‌پرسد.

## مدیریت رسانه

فایل‌های پوشه `public/uploads` را با دیتابیس همگام می‌کند و برای هر تصویر نشان می‌دهد
کجا استفاده شده (محصول، گالری، بنر، پلتفرم، کانال پشتیبانی، تنظیمات).

حذف یک تصویر بدون استفاده مستقیم انجام می‌شود. اگر جایی استفاده شده باشد، اول هشدار
می‌دهد و در صورت تایید، ارجاع‌ها را هم پاک می‌کند تا تصویر شکسته نماند.

---

## فاکتور

بعد از ثبت سفارش، دکمه «مشاهده فاکتور» ظاهر می‌شود. همچنین در صفحه پیگیری
و در تب «سفارش‌ها» ی حساب کاربری.

فاکتور در پنجره‌ی جدا باز می‌شود و دکمه چاپ دارد (استایل چاپ جداگانه دارد،
پس روی کاغذ تمیز درمی‌آید). شامل: مشخصات فروشگاه، خریدار، آدرس تحویل،
جدول اقلام با تنوع، تخفیف، ارسال، مالیات و مبلغ نهایی.

چون فاکتور اطلاعات کامل سفارش را دارد، فقط برای صاحب سفارش باز می‌شود.
اگر شماره‌ی حساب کاربری با شماره‌ی سفارش یکی نباشد، شماره پرسیده می‌شود.

---

## مدیریت رسانه

از پنل: **مدیریت رسانه**. فایل‌های پوشه‌ی `public/uploads` را با دیتابیس
همگام می‌کند، پس تصاویری که قبلاً آپلود کرده‌ای هم دیده می‌شوند.

برای هر تصویر نشان می‌دهد **کجا استفاده شده** — محصول، گالری، بنر، پلتفرم،
کانال پشتیبانی یا تنظیمات. فیلتر «بدون استفاده» فایل‌های یتیم را پیدا می‌کند.

حذف تصویری که جایی استفاده شده، تایید دوم می‌خواهد و ارجاع‌ها را هم پاک می‌کند
تا تصویر شکسته نماند.

---

## تست

سوییت‌های تست در `/home/claude/t3.js` تا `t10.js` هستند (خارج از بسته).
چون داده‌ی مشترک عوض می‌شود، قبل از هر سوییت:

```bash
node reset-test-data.js && node t8.js
```

---

## تم روشن و تاریک

دکمه‌ی تغییر تم در هدر (دسکتاپ) و بالای پنل همبرگری کنار دکمه‌ی بستن (موبایل) است.

- **پیش‌فرض از سیستم:** اگر کاربر انتخابی نکرده باشد، سایت از `prefers-color-scheme`
  مرورگر پیروی می‌کند و اگر کاربر تم سیستم را عوض کند سایت هم زنده عوض می‌شود.
- **انتخاب کاربر اولویت دارد** و در `localStorage` با کلید `mp_theme` می‌ماند.
- یک اسکریپت کوچک در `<head>` تم را **قبل از اولین رنگ‌آمیزی** ست می‌کند تا پرش سفید نداشته باشی.
- `<meta name="theme-color">` هم هماهنگ می‌شود تا نوار آدرس مرورگر موبایل هم‌رنگ باشد.

تم روشن با بازنویسی توکن‌های CSS در `html[data-theme="light"]` ساخته شده،
پس اگر رنگی اضافه کردی، آن را هم به‌صورت `var(--…)` بنویس تا هر دو تم را پوشش بدهد.

---

## تصویر اختصاصی هر رنگ

در پنل → محصول → تب «سایز و رنگ»، کنار هر رنگ یک مربع تصویر هست.
با کلیک روی آن، از میان عکس‌های همان محصول یکی را انتخاب می‌کنی.

در صفحه محصول، وقتی مشتری آن رنگ را می‌زند، گالری خودکار روی همان عکس می‌رود.
اگر برای رنگی تصویری تعریف نکنی، گالری دست‌نخورده می‌ماند.

### موجودی بر اساس ترکیب
اگر سایزی برای رنگ انتخاب‌شده موجود نباشد، دکمه‌اش **غیرفعال** می‌شود و کلیک هم نمی‌خورد.
رنگی که در هیچ سایزی موجود نیست کاملاً غیرفعال می‌شود.
با تعویض رنگ، اگر سایز فعلی برای آن رنگ ناموجود باشد، خودکار روی اولین سایز موجود می‌رود.

---

## عملکرد روی موبایل

اندازه‌گیری با CPU چهار برابر کندتر و شبکه‌ی ۴G ضعیف (شبیه موبایل میان‌رده):

| سنجه | قبل | بعد |
|---|---|---|
| اولین رنگ‌آمیزی (FCP) | ۲۴۶۸ms | ~۹۵۰ms |
| بارگذاری کامل | ۶۱۶۸ms | ~۴۸۰۰ms |
| اسکرول ۳۰۰۰ پیکسل | ۱۲۱۵ms | ~۴۳۰ms |
| حجم `app.js` روی شبکه | ۲۳۰KB | ۶۳KB |

کارهایی که انجام شد:

- **`backdrop-filter` زیر ۹۰۰px خاموش** و با پس‌زمینه‌ی مات جایگزین شد (۴۷ → ۲۰ المان).
  این گران‌ترین افکت روی GPU موبایل بود.
- **`compression`** فعال شد — پاسخ‌ها gzip/brotli می‌شوند.
- **فونت و `styles2.css` رندر را مسدود نمی‌کنند.**
- **`content-visibility:auto`** روی بخش‌های صفحه اصلی.
- تعداد پیکسل‌های متحرک هیرو روی موبایل و دستگاه‌های ضعیف از ۱۴ به ۶.
- شنونده‌ی اسکرول با `requestAnimationFrame` throttle شد.
- تصاویر با `loading="lazy"` و `decoding="async"`.
- کش یک‌ساله برای فایل‌های استاتیک در حالت production.

> برای کش‌شدن درست فایل‌های استاتیک، روی سرور `NODE_ENV=production` را ست کن.

---

## درگاه پرداخت

**زرین‌پال** و **زیبال** پیاده‌سازی شده‌اند. در پنل → «درگاه‌های پرداخت»
merchant را بگذار و درگاه را فعال کن. تا وقتی `sandbox` روشن باشد پول واقعی
جابه‌جا نمی‌شود (زیبال با مرچنت `zibal` و زرین‌پال با محیط sandbox).

### آدرس بازگشت
در پنل درگاه ثبت کن:

```
https://yourdomain.ir/api/payments/callback/zarinpal
https://yourdomain.ir/api/payments/callback/zibal
```

`SITE_URL` را هم در `.env` درست بگذار، چون callback از روی آن ساخته می‌شود.

### چرا این لایه امن است

خطر اصلی پرداخت، پایگاه‌داده نیست — **پرداخت تکراری** است. اینها رعایت شده:

- `authority` در دیتابیس **UNIQUE** است؛ یک تراکنش درگاه هرگز دو بار ثبت نمی‌شود
- اگر تراکنش قبلاً `paid` باشد، callback **اصلاً با درگاه تماس نمی‌گیرد** و
  کاربر را به نتیجه می‌برد (رفرش صفحه‌ی بازگشت بی‌خطر است)
- ثبت نهایی داخل یک تراکنش با شرط `WHERE status='pending'` است؛ اگر دو callback
  همزمان برسند فقط یکی اثر می‌کند
- کدهای «قبلاً تایید شده» (زرین‌پال ۱۰۱، زیبال ۲۰۱) موفق شمرده می‌شوند، نه خطا
- **مبلغ از دیتابیس خوانده می‌شود، نه از درخواست کاربر**
- زیبال مبلغ پرداختی را برمی‌گرداند و با مبلغ سفارش مقایسه می‌شود
- اگر درگاه شناسه‌ی تکراری بدهد، سرور کرش نمی‌کند

### تست بدون درگاه واقعی
آدرس درگاه‌ها با متغیر محیطی قابل تغییر است:

```bash
ZARINPAL_BASE=…  ZARINPAL_SANDBOX=…  ZIBAL_BASE=…
```

---

## پایداری دیتابیس

SQLite با تنظیمات زیر اجرا می‌شود:

| تنظیم | مقدار | چرا |
|---|---|---|
| `journal_mode` | WAL | خواندن و نوشتن همدیگر را قفل نمی‌کنند |
| `busy_timeout` | ۵۰۰۰ms | بدون این، اجرای چندفرآیندی `SQLITE_BUSY` می‌دهد |
| `synchronous` | NORMAL | در WAL امن است و نوشتن را چند برابر سریع‌تر می‌کند |
| `foreign_keys` | ON | یکپارچگی ارجاع‌ها |

### بکاپ

```bash
npm run backup                # در پوشه backups
npm run backup /mnt/backups   # مسیر دلخواه
```

از `VACUUM INTO` استفاده می‌کند: بکاپ حتی وسط نوشتن هم سالم است و بعد از ساخت،
سلامتش با `integrity_check` تایید می‌شود. ۱۴ نسخه‌ی آخر نگه داشته می‌شود
(با `BACKUP_KEEP` قابل تغییر).

> **هرگز با `cp` از دیتابیس بکاپ نگیر.** اگر وسط نوشتن باشد، فایل خراب می‌شود.

کرون روزانه:
```
0 3 * * * cd /var/www/mypixel/backend && /usr/bin/node backup.js >> /var/log/mypixel-backup.log 2>&1
```

### کِی باید به پستگرس بروی

| وضعیت | تصمیم |
|---|---|
| تا حدود ۱۰۰۰ سفارش در روز | SQLite کافی است |
| چند سرور اپلیکیشن پشت لودبالانسر | پستگرس |
| نیاز به replication و failover | پستگرس |
