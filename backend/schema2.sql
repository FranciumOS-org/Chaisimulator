-- ═══════════════════════════════════════════════════════════
--  مای پیکسل — مهاجرت دوم
--  تنوع محصول، علاقه‌مندی، آدرس، مرجوعی، پروموشن، تخفیف، بنر
-- ═══════════════════════════════════════════════════════════

-- ───── تنوع محصول: سایز و رنگ ─────
CREATE TABLE IF NOT EXISTS product_options (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL,               -- size | color
  label      TEXT    NOT NULL,               -- «۳۰» یا «آبی نفتی»
  unit       TEXT    NOT NULL DEFAULT '',    -- سانتی‌متر / اینچ / میلی‌متر …
  color_hex  TEXT,                           -- #1E90FF  (فقط برای kind=color)
  price_diff INTEGER NOT NULL DEFAULT 0,     -- اختلاف قیمت نسبت به قیمت پایه
  stock      INTEGER NOT NULL DEFAULT -1,    -- ‎-1 یعنی از موجودی کل محصول تبعیت کن
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_opt_product ON product_options(product_id, kind);

-- ───── لیست علاقه‌مندی ─────
CREATE TABLE IF NOT EXISTS wishlist (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);

-- ───── آدرس‌های کاربر ─────
CREATE TABLE IF NOT EXISTS addresses (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT    NOT NULL DEFAULT 'آدرس من',
  province       TEXT    NOT NULL DEFAULT '',
  city           TEXT    NOT NULL DEFAULT '',
  address        TEXT    NOT NULL DEFAULT '',   -- آدرس کامل
  street         TEXT    NOT NULL DEFAULT '',   -- کوچه
  plaque         TEXT    NOT NULL DEFAULT '',   -- پلاک
  unit           TEXT    NOT NULL DEFAULT '',   -- واحد
  postal_code    TEXT    NOT NULL DEFAULT '',
  receiver_type  TEXT    NOT NULL DEFAULT 'self',  -- self | other
  receiver_name  TEXT    NOT NULL DEFAULT '',
  receiver_phone TEXT    NOT NULL DEFAULT '',
  is_default     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addr_user ON addresses(user_id);

-- ───── درخواست‌های مرجوعی ─────
CREATE TABLE IF NOT EXISTS returns (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tracking_code TEXT    NOT NULL,
  phone         TEXT    NOT NULL DEFAULT '',
  full_name     TEXT    NOT NULL DEFAULT '',
  reason        TEXT    NOT NULL DEFAULT '',   -- defective | wrong_item | not_as_described | changed_mind | other
  description   TEXT    NOT NULL DEFAULT '',
  status        TEXT    NOT NULL DEFAULT 'pending', -- pending | approved | rejected | received | refunded
  admin_note    TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── پروموشن‌ها (شگفت‌انگیز / پیشنهادی / تخفیف‌دار) ─────
CREATE TABLE IF NOT EXISTS promotions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title_fa         TEXT    NOT NULL,
  title_en         TEXT    NOT NULL DEFAULT '',
  subtitle_fa      TEXT    NOT NULL DEFAULT '',
  kind             TEXT    NOT NULL DEFAULT 'suggested', -- flash | suggested | discount
  badge_fa         TEXT    NOT NULL DEFAULT '',
  discount_percent INTEGER NOT NULL DEFAULT 0,  -- اگر >۰ روی قیمت محصولات این پروموشن اعمال می‌شود
  starts_at        TEXT,
  ends_at          TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotion_items (
  promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (promotion_id, product_id)
);

-- ───── کدهای تخفیف ─────
CREATE TABLE IF NOT EXISTS coupons (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT    NOT NULL UNIQUE,
  kind       TEXT    NOT NULL DEFAULT 'percent', -- percent | amount
  value      INTEGER NOT NULL DEFAULT 0,
  min_order  INTEGER NOT NULL DEFAULT 0,
  max_amount INTEGER NOT NULL DEFAULT 0,         -- سقف تخفیف برای نوع درصدی (۰ = بی‌نهایت)
  max_uses   INTEGER NOT NULL DEFAULT 0,         -- ۰ = نامحدود
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at  TEXT,
  ends_at    TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── بنرهای تبلیغاتی ─────
CREATE TABLE IF NOT EXISTS banners (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title_fa   TEXT    NOT NULL DEFAULT '',
  body_fa    TEXT    NOT NULL DEFAULT '',
  image_url  TEXT,
  link_url   TEXT    NOT NULL DEFAULT '',
  position   TEXT    NOT NULL DEFAULT 'home_top', -- home_top | home_mid | sidebar
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── پلتفرم‌های فروش (دیجی‌کالا، باسلام، ترب، ایمالز …) ─────
CREATE TABLE IF NOT EXISTS platforms (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name_fa    TEXT    NOT NULL,
  name_en    TEXT    NOT NULL DEFAULT '',
  slug       TEXT    NOT NULL DEFAULT '',   -- digikala | basalam | torob | emalls | custom
  url        TEXT    NOT NULL DEFAULT '',
  desc_fa    TEXT    NOT NULL DEFAULT '',
  logo_url   TEXT,                          -- اگر خالی باشد از آیکون داخلی استفاده می‌شود
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);


-- ───── کانال‌های پشتیبانی (تلگرام، اینستاگرام، تلفن، ساعت کاری، …) ─────
CREATE TABLE IF NOT EXISTS support_channels (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name_fa    TEXT    NOT NULL,
  name_en    TEXT    NOT NULL DEFAULT '',
  desc_fa    TEXT    NOT NULL DEFAULT '',
  desc_en    TEXT    NOT NULL DEFAULT '',
  kind       TEXT    NOT NULL DEFAULT 'custom',  -- telegram|instagram|whatsapp|phone|email|hours|custom
  value      TEXT    NOT NULL DEFAULT '',        -- لینک، شماره یا متن
  icon       TEXT    NOT NULL DEFAULT 'chat',    -- کلید آیکون داخلی
  logo_url   TEXT,
  bg_url     TEXT,                               -- تصویر پس‌زمینه (بلور می‌شود)
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── موجودی بر اساس ترکیب سایز و رنگ ─────
CREATE TABLE IF NOT EXISTS product_variants (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id    INTEGER REFERENCES product_options(id) ON DELETE CASCADE,
  color_id   INTEGER REFERENCES product_options(id) ON DELETE CASCADE,
  stock      INTEGER NOT NULL DEFAULT 0,
  sku        TEXT,
  UNIQUE (product_id, size_id, color_id)
);
CREATE INDEX IF NOT EXISTS idx_variant_product ON product_variants(product_id);

-- ───── اقلام انتخاب‌شده در هر درخواست مرجوعی ─────
CREATE TABLE IF NOT EXISTS return_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id     INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id INTEGER,
  title         TEXT    NOT NULL DEFAULT '',
  opt_size      TEXT    NOT NULL DEFAULT '',
  opt_color     TEXT    NOT NULL DEFAULT '',
  qty           INTEGER NOT NULL DEFAULT 1,
  unit_price    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_return_items ON return_items(return_id);

-- ───── قالب‌های پیامک ─────
CREATE TABLE IF NOT EXISTS sms_templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT    NOT NULL UNIQUE,   -- otp | welcome | order_placed | order_status | order_cancelled | return_received | return_status
  title_fa   TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── تاریخچه پیامک‌ها ─────
CREATE TABLE IF NOT EXISTS sms_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phone       TEXT    NOT NULL,
  template    TEXT    NOT NULL DEFAULT '',
  body        TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'sent',   -- sent | failed | skipped
  error       TEXT    NOT NULL DEFAULT '',
  driver      TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_smslog_time ON sms_log(created_at DESC);

-- ───── فایل‌های آپلودشده (مدیریت رسانه) ─────
CREATE TABLE IF NOT EXISTS media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  url        TEXT    NOT NULL UNIQUE,
  filename   TEXT    NOT NULL DEFAULT '',
  title      TEXT    NOT NULL DEFAULT '',
  alt        TEXT    NOT NULL DEFAULT '',
  size       INTEGER NOT NULL DEFAULT 0,
  mime       TEXT    NOT NULL DEFAULT '',
  uploaded_by INTEGER,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ───── تراکنش‌های پرداخت ─────
-- authority یکتاست تا کال‌بک تکراری نتواند دو رکورد بسازد.
CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway     TEXT    NOT NULL,                    -- zarinpal | zibal
  amount      INTEGER NOT NULL,                    -- تومان (همان واحد سایت)
  authority   TEXT    UNIQUE,                      -- Authority زرین‌پال یا trackId زیبال
  ref_id      TEXT,                                -- شماره پیگیری بانک بعد از verify
  card_pan    TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending | paid | failed | cancelled
  fail_reason TEXT    NOT NULL DEFAULT '',
  ip          TEXT    NOT NULL DEFAULT '',
  raw_request TEXT    NOT NULL DEFAULT '',
  raw_verify  TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_pay_order  ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status, created_at DESC);

