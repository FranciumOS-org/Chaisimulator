-- ============================================================
--  مای پیکسل — اسکیمای دیتابیس
--  SQLite (سازگار با انتقال به PostgreSQL با تغییرات جزئی)
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------- کاربران ----------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT    NOT NULL DEFAULT '',
  last_name     TEXT    NOT NULL DEFAULT '',
  phone         TEXT    UNIQUE,                 -- 09xxxxxxxxx
  email         TEXT    UNIQUE,
  username      TEXT    UNIQUE,                 -- فقط برای ادمین
  password_hash TEXT,                           -- فقط برای ادمین
  role          TEXT    NOT NULL DEFAULT 'customer',  -- customer | admin
  google_id     TEXT    UNIQUE,
  avatar        TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  is_banned     INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------- کدهای تایید پیامکی (OTP) ----------
CREATE TABLE IF NOT EXISTS otp_codes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phone       TEXT    NOT NULL,
  code        TEXT    NOT NULL,
  purpose     TEXT    NOT NULL DEFAULT 'login',  -- login | register
  payload     TEXT,                              -- JSON: نام و نام خانوادگی هنگام ثبت‌نام
  expires_at  TEXT    NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  consumed    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, consumed);

-- ---------- دسته‌بندی‌ها ----------
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name_fa     TEXT    NOT NULL,
  name_en     TEXT    NOT NULL DEFAULT '',
  desc_fa     TEXT    NOT NULL DEFAULT '',
  desc_en     TEXT    NOT NULL DEFAULT '',
  icon        TEXT    NOT NULL DEFAULT 'box',   -- کلید آیکون در فرانت
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- محصولات ----------
CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT    NOT NULL UNIQUE,
  sku            TEXT    UNIQUE,
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name_fa        TEXT    NOT NULL,
  name_en        TEXT    NOT NULL DEFAULT '',
  desc_fa        TEXT    NOT NULL DEFAULT '',
  desc_en        TEXT    NOT NULL DEFAULT '',
  price          INTEGER NOT NULL DEFAULT 0,     -- تومان
  discount_price INTEGER,                        -- اگر پر باشد قیمت نهایی همین است
  stock          INTEGER NOT NULL DEFAULT 0,
  image_url      TEXT,
  icon           TEXT    NOT NULL DEFAULT 'box',
  is_active      INTEGER NOT NULL DEFAULT 1,
  is_featured    INTEGER NOT NULL DEFAULT 0,     -- محصولات ویژه صفحه اصلی
  views          INTEGER NOT NULL DEFAULT 0,
  sold_count     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_cat  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_feat ON products(is_featured, is_active);

CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------- سفارش‌ها ----------
CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_code  TEXT    NOT NULL UNIQUE,        -- کدی که به مشتری داده می‌شود
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name  TEXT    NOT NULL DEFAULT '',
  phone          TEXT    NOT NULL DEFAULT '',
  province       TEXT    NOT NULL DEFAULT '',
  city           TEXT    NOT NULL DEFAULT '',
  address        TEXT    NOT NULL DEFAULT '',
  postal_code    TEXT    NOT NULL DEFAULT '',
  note           TEXT    NOT NULL DEFAULT '',
  subtotal       INTEGER NOT NULL DEFAULT 0,
  shipping_cost  INTEGER NOT NULL DEFAULT 0,
  discount       INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'pending',
  -- pending | paid | processing | packed | shipped | delivered | cancelled | refunded
  payment_status TEXT    NOT NULL DEFAULT 'unpaid', -- unpaid | paid | failed | refunded
  gateway_id     INTEGER REFERENCES payment_gateways(id) ON DELETE SET NULL,
  ref_id         TEXT,                            -- شماره پیگیری بانک
  tracking_post  TEXT,                            -- کد رهگیری پست
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
  title_snapshot TEXT    NOT NULL,
  unit_price     INTEGER NOT NULL,
  qty            INTEGER NOT NULL DEFAULT 1
);

-- تاریخچه‌ی تغییر وضعیت — برای صفحه‌ی پیگیری سفارش
CREATE TABLE IF NOT EXISTS order_status_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL,
  note       TEXT    NOT NULL DEFAULT '',
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- نظرات ----------
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT    NOT NULL DEFAULT 'مهمان',
  rating      INTEGER NOT NULL DEFAULT 5,
  body        TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_reply TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- ---------- سوالات متداول ----------
CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_fa TEXT    NOT NULL,
  answer_fa   TEXT    NOT NULL,
  question_en TEXT    NOT NULL DEFAULT '',
  answer_en   TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- اطلاعیه‌ها ----------
CREATE TABLE IF NOT EXISTS announcements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title_fa     TEXT    NOT NULL,
  body_fa      TEXT    NOT NULL DEFAULT '',
  title_en     TEXT    NOT NULL DEFAULT '',
  body_en      TEXT    NOT NULL DEFAULT '',
  level        TEXT    NOT NULL DEFAULT 'info',  -- info | success | warning
  is_pinned    INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  published_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- درگاه‌های پرداخت ----------
CREATE TABLE IF NOT EXISTS payment_gateways (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT    NOT NULL UNIQUE,          -- zarinpal | idpay | nextpay | cod ...
  name_fa      TEXT    NOT NULL,
  name_en      TEXT    NOT NULL DEFAULT '',
  merchant_id  TEXT    NOT NULL DEFAULT '',
  callback_url TEXT    NOT NULL DEFAULT '',
  sandbox      INTEGER NOT NULL DEFAULT 1,
  is_active    INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  config_json  TEXT    NOT NULL DEFAULT '{}',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- تنظیمات کلی سایت ----------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- لاگ فعالیت ادمین ----------
CREATE TABLE IF NOT EXISTS admin_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,      -- create | update | delete | login
  entity     TEXT NOT NULL,      -- product | category | order | ...
  entity_id  TEXT,
  meta       TEXT NOT NULL DEFAULT '{}',
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
