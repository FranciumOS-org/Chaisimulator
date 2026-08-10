const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Connect to Turso Cloud DB if credentials exist, otherwise fall back to local file
const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
if (!isTurso && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'mypixel.db');

const client = createClient(
  isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: `file:${DB_PATH}`,
      }
);

// Wrapper to provide synchronous-like helpers around libSQL async calls
const db = {
  prepare(sql) {
    return {
      get: async (...params) => {
        const res = await client.execute({ sql, args: params.flat() });
        return res.rows[0] || null;
      },
      all: async (...params) => {
        const res = await client.execute({ sql, args: params.flat() });
        return res.rows;
      },
      run: async (...params) => {
        return await client.execute({ sql, args: params.flat() });
      }
    };
  },
  exec: async (sql) => {
    return await client.executeMultiple(sql);
  }
};

/** افزودن ستون فقط در صورتی که وجود نداشته باشد */
async function addColumn(table, column, def) {
  try {
    const res = await client.execute(`PRAGMA table_info(${table})`);
    const cols = res.rows.map(c => c.name);
    if (!cols.includes(column)) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      return true;
    }
  } catch (err) {
    console.error(`Error adding column ${column} to ${table}:`, err);
  }
  return false;
}

async function migrate() {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  
  try {
    await db.exec(read('schema.sql'));
    await db.exec(read('schema2.sql'));

    // ───── ستون‌های جدید محصولات ─────
    await addColumn('products', 'pros_fa',      "TEXT NOT NULL DEFAULT ''");
    await addColumn('products', 'cons_fa',      "TEXT NOT NULL DEFAULT ''");
    await addColumn('products', 'pros_en',      "TEXT NOT NULL DEFAULT ''");
    await addColumn('products', 'cons_en',      "TEXT NOT NULL DEFAULT ''");
    await addColumn('products', 'rating_avg',   'REAL NOT NULL DEFAULT 0');
    await addColumn('products', 'rating_count', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('products', 'has_warranty', 'INTEGER NOT NULL DEFAULT 1');

    // ───── ستون‌های جدید دیدگاه ─────
    await addColumn('comments', 'pros',     "TEXT NOT NULL DEFAULT ''");
    await addColumn('comments', 'cons',     "TEXT NOT NULL DEFAULT ''");
    await addColumn('comments', 'is_buyer', 'INTEGER NOT NULL DEFAULT 0');

    // ───── ستون‌های جدید سفارش ─────
    await addColumn('orders', 'address_id',      'INTEGER');
    await addColumn('orders', 'coupon_code',     "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('orders', 'tax_amount',      'INTEGER NOT NULL DEFAULT 0');
    await addColumn('orders', 'street',          "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'plaque',          "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'unit',            "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'receiver_name',   "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'receiver_phone',  "TEXT NOT NULL DEFAULT ''");

    // ───── کانال‌های پشتیبانی: هم‌راستاسازی با نسخه‌های قدیمی‌تر جدول ─────
    await addColumn('support_channels', 'value',    "TEXT NOT NULL DEFAULT ''");
    await addColumn('support_channels', 'desc_en',  "TEXT NOT NULL DEFAULT ''");
    await addColumn('support_channels', 'logo_url', 'TEXT');
    await addColumn('support_channels', 'bg_url',   'TEXT');

    // ───── مرجع پرداخت آنلاین روی سفارش ─────
    await addColumn('orders', 'payment_ref', "TEXT NOT NULL DEFAULT ''");

    // ───── تصویر اختصاصی هر رنگ ─────
    await addColumn('product_options', 'image_url', 'TEXT');

    // ───── اطلاعات تماس و بازگشت وجه هنگام لغو سفارش ─────
    await addColumn('orders', 'cancel_reason',   "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'cancel_telegram', "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'cancel_card',     "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'cancel_holder',   "TEXT NOT NULL DEFAULT ''");
    await addColumn('orders', 'cancelled_by',    "TEXT NOT NULL DEFAULT ''");

    // ───── آیدی تلگرام در درخواست مرجوعی ─────
    await addColumn('returns', 'telegram', "TEXT NOT NULL DEFAULT ''");

    // ───── تصویر پس‌زمینه پلتفرم ─────
    await addColumn('platforms', 'bg_url', 'TEXT');

    // ───── تنوع انتخاب‌شده در هر قلم سفارش ─────
    await addColumn('order_items', 'opt_size',  "TEXT NOT NULL DEFAULT ''");
    await addColumn('order_items', 'opt_color', "TEXT NOT NULL DEFAULT ''");

    console.log('Database migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

module.exports = { db, client, migrate, addColumn, DB_PATH, DATA_DIR };