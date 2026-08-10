const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// On Vercel, the filesystem is read-only except for /tmp
const DATA_DIR = process.env.DATA_DIR || '/tmp';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'mypixel.db');
const db = new Database(DB_PATH);

// Disable WAL mode on Vercel serverless /tmp to avoid file locking issues
if (!process.env.VERCEL) {
  db.pragma('journal_mode = WAL');
} else {
  db.pragma('journal_mode = DELETE');
}

db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

function addColumn(table, column, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    return true;
  }
  return false;
}

function migrate() {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  db.exec(read('schema.sql'));
  db.exec(read('schema2.sql'));

  // ───── ستون‌های جدید محصولات ─────
  addColumn('products', 'pros_fa',      "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'cons_fa',      "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'pros_en',      "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'cons_en',      "TEXT NOT NULL DEFAULT ''");
  addColumn('products', 'rating_avg',   'REAL NOT NULL DEFAULT 0');
  addColumn('products', 'rating_count', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('products', 'has_warranty', 'INTEGER NOT NULL DEFAULT 1');

  // ───── ستون‌های جدید دیدگاه ─────
  addColumn('comments', 'pros',     "TEXT NOT NULL DEFAULT ''");
  addColumn('comments', 'cons',     "TEXT NOT NULL DEFAULT ''");
  addColumn('comments', 'is_buyer', 'INTEGER NOT NULL DEFAULT 0');

  // ───── ستون‌های جدید سفارش ─────
  addColumn('orders', 'address_id',      'INTEGER');
  addColumn('orders', 'coupon_code',     "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('orders', 'tax_amount',      'INTEGER NOT NULL DEFAULT 0');
  addColumn('orders', 'street',          "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'plaque',          "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'unit',            "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'receiver_name',   "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'receiver_phone',  "TEXT NOT NULL DEFAULT ''");

  // ───── کانال‌های پشتیبانی: هم‌راستاسازی با نسخه‌های قدیمی‌تر جدول ─────
  addColumn('support_channels', 'value',    "TEXT NOT NULL DEFAULT ''");
  addColumn('support_channels', 'desc_en',  "TEXT NOT NULL DEFAULT ''");
  addColumn('support_channels', 'logo_url', 'TEXT');
  addColumn('support_channels', 'bg_url',   'TEXT');

  // ───── مرجع پرداخت آنلاین روی سفارش ─────
  addColumn('orders', 'payment_ref', "TEXT NOT NULL DEFAULT ''");

  // ───── تصویر اختصاصی هر رنگ ─────
  addColumn('product_options', 'image_url', 'TEXT');

  // ───── اطلاعات تماس و بازگشت وجه هنگام لغو سفارش ─────
  addColumn('orders', 'cancel_reason',   "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'cancel_telegram', "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'cancel_card',     "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'cancel_holder',   "TEXT NOT NULL DEFAULT ''");
  addColumn('orders', 'cancelled_by',    "TEXT NOT NULL DEFAULT ''");

  // ───── آیدی تلگرام در درخواست مرجوعی ─────
  addColumn('returns', 'telegram', "TEXT NOT NULL DEFAULT ''");

  // ───── تصویر پس‌زمینه پلتفرم ─────
  addColumn('platforms', 'bg_url', 'TEXT');

  // ───── تنوع انتخاب‌شده در هر قلم سفارش ─────
  addColumn('order_items', 'opt_size',  "TEXT NOT NULL DEFAULT ''");
  addColumn('order_items', 'opt_color', "TEXT NOT NULL DEFAULT ''");
}

module.exports = { db, migrate, addColumn, DB_PATH, DATA_DIR };