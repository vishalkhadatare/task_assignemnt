import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Read PostgreSQL connection config from environment or default parameters
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Vishal123')}@${process.env.DB_HOST || process.env.PGHOST || 'localhost'}:${process.env.DB_PORT || process.env.PGPORT || '5432'}/${process.env.DB_NAME || process.env.PGDATABASE || 'ecommerce_db'}`;

let pool: pg.Pool | null = null;
let isConnectedToPostgres = false;

// Fallback in-memory store for seamless developer experience if PostgreSQL password/database is not yet configured
let memoryStore: {
  products: any[];
  variants: any[];
  emi_plans: any[];
  mutual_funds: any[];
  applications: any[];
} | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}

/**
 * Initializes the PostgreSQL Database.
 * Connects to the database and runs schema.sql if tables are not yet created.
 */
export async function initDb(): Promise<void> {
  // If running in Vercel or cloud serverless environment without explicit PostgreSQL host / connection string,
  // initialize memory fallback immediately so serverless requests respond instantly without timing out.
  if ((process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) && !process.env.DATABASE_URL) {
    console.log('[PostgreSQL] Vercel serverless environment detected without external DB. Using instant memory store.');
    initMemoryFallback();
    return;
  }

  const p = getPool();
  try {
    const client = await p.connect();
    try {
      console.log('[PostgreSQL] Successfully connected to database engine!');
      isConnectedToPostgres = true;

      // Verify if products table exists
      const checkRes = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
        ) as table_exists;
      `);

      if (!checkRes.rows[0]?.table_exists) {
        console.log('[PostgreSQL] Initializing schema & inserting seed data from schema.sql...');
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf-8');
          await client.query(sql);
          console.log('[PostgreSQL] Database schema & seed data initialized successfully!');
        }
      } else {
        console.log('[PostgreSQL] Relational tables already present and ready.');
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn(`[PostgreSQL] Connection note: ${err.message}`);
    console.log('[PostgreSQL] To connect to your local database, create a .env file with:');
    console.log('             DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/your_db');
    console.log('[PostgreSQL] Running in resilient mode with seeded data while database config is verified.');
    initMemoryFallback();
  }
}

/**
 * Converts standard SQL '?' placeholders into PostgreSQL '$1, $2, ...' placeholders
 */
function convertPlaceholders(sql: string): string {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

/**
 * Execute a query returning multiple rows
 */
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isConnectedToPostgres && pool) {
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await pool.query(pgSql, params);
      return res.rows as T[];
    } catch (err: any) {
      console.error('[PostgreSQL Query Error]:', err.message);
      throw err;
    }
  }

  // Fallback handler if local postgres password is not yet entered in .env
  return memoryQueryAll<T>(sql, params);
}

/**
 * Execute a query returning a single row
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const list = await queryAll<T>(sql, params);
  return list.length > 0 ? list[0] : null;
}

/**
 * Execute an insert / update / delete query
 */
export async function execute(sql: string, params: any[] = []): Promise<any> {
  if (isConnectedToPostgres && pool) {
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await pool.query(pgSql, params);
      return res;
    } catch (err: any) {
      console.error('[PostgreSQL Execute Error]:', err.message);
      throw err;
    }
  }

  return memoryExecute(sql, params);
}

// ---------------------------------------------------------------------------------
// Resilient In-Memory Seed Store (Used if PostgreSQL credentials require configuration)
// ---------------------------------------------------------------------------------
function initMemoryFallback() {
  if (memoryStore) return;

  const mutual_funds = [
    {
      id: 'mf-icici-liquid',
      name: 'ICICI Prudential Liquid Fund - Direct Growth',
      amc: 'ICICI Prudential AMC',
      category: 'Liquid Fund',
      nav: 362.15,
      cagr_1yr: 7.18,
      risk_level: 'Low Risk',
      aum_cr: 48200,
      rating_stars: 5
    },
    {
      id: 'mf-absl-liquid',
      name: 'Aditya Birla Sun Life Liquid Fund - Direct Plan',
      amc: 'Aditya Birla Sun Life AMC',
      category: 'Liquid Fund',
      nav: 386.42,
      cagr_1yr: 7.24,
      risk_level: 'Low Risk',
      aum_cr: 41500,
      rating_stars: 5
    },
    {
      id: 'mf-sbi-liquid',
      name: 'SBI Liquid Fund - Direct Plan Growth',
      amc: 'SBI Funds Management',
      category: 'Liquid Fund',
      nav: 3780.2,
      cagr_1yr: 7.21,
      risk_level: 'Low Risk',
      aum_cr: 62000,
      rating_stars: 5
    },
    {
      id: 'mf-hdfc-overnight',
      name: 'HDFC Overnight Fund - Direct Growth',
      amc: 'HDFC AMC',
      category: 'Overnight / Liquid',
      nav: 3450.8,
      cagr_1yr: 6.85,
      risk_level: 'Lowest Risk',
      aum_cr: 32800,
      rating_stars: 5
    }
  ];

  const products = [
    {
      id: 'prod-iphone-17-pro',
      slug: 'apple-iphone-17-pro-silver-256-gb-smart-phones-on-emi',
      name: 'Apple iPhone 17 Pro',
      brand: 'Apple',
      tagline: 'Precision-milled aerospace titanium with next-generation A19 Pro silicon.',
      description: 'Experience the cutting-edge Apple iPhone 17 Pro featuring the revolutionary A19 Pro chip, custom ceramic shield front, 120Hz ProMotion Super Retina XDR display, and 48MP quad-lens fusion camera system with 5x telephoto optical zoom. Backed by 1Fi Mutual Fund collateral for zero-cost financing.',
      category: 'Smartphones',
      rating: 4.2,
      reviews_count: 1420,
      base_price: 127400,
      base_mrp: 134900,
      default_image: '/images/iphone-17-pro-1.svg',
      highlights: JSON.stringify([
        'Storage: 256 GB',
        'Color: Silver',
        'Front Camera: 18MP with Center Stage & 4K stabilized video',
        'Rear Camera: 48MP + 48MP + 48MP Fusion system with 4 lenses & 8x zoom',
        'Screen Size: 6.3 inch (2622 × 1206 Pixels)',
        'Pay only ₹20,235 now • 0% EMI with 1Fi Smart EMI'
      ]),
      specs: JSON.stringify({
        'Storage': '256 GB',
        'Color': 'Silver',
        'Front Camera': '18MP',
        'Screen Size': '6.3 inch',
        'Processor': 'Apple A19 Pro Silicon (3nm architecture)',
        'Operating System': 'iOS 19 with Apple Intelligence deep integration'
      })
    },
    {
      id: 'prod-samsung-s24-ultra',
      slug: 'samsung-galaxy-s24-ultra-titanium-gray-256-gb-smart-phones-on-emi',
      name: 'Samsung Galaxy S24 Ultra 5G',
      brand: 'Samsung',
      tagline: 'Galaxy AI is here. Encased in durable titanium with built-in S-Pen.',
      description: 'The pinnacle of Android craftsmanship. Samsung Galaxy S24 Ultra brings a flat 6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, titanium frame, 200MP camera system, and integrated S Pen for precision productivity.',
      category: 'Smartphones',
      rating: 4.8,
      reviews_count: 980,
      base_price: 114999,
      base_mrp: 129999,
      default_image: '/images/s24-ultra-1.svg',
      highlights: JSON.stringify([
        'Snapdragon 8 Gen 3 for Galaxy with Vapor Chamber Cooling',
        '6.8-inch QHD+ Dynamic AMOLED 2X, 2600 nits peak brightness',
        'Titanium frame with Corning Gorilla Armor anti-reflective glass',
        '200MP Quad Telephoto Camera with ProVisual AI Engine',
        'Built-in S Pen stylus with Air Actions & live translation'
      ]),
      specs: JSON.stringify({
        'Display': '6.8-inch Dynamic AMOLED 2X',
        'Processor': 'Qualcomm Snapdragon 8 Gen 3 for Galaxy',
        'Rear Camera': '200MP + 50MP + 10MP + 12MP',
        'Battery': '5,000 mAh with 45W Fast Charging'
      })
    }
  ];

  const variants = [
    // iPhone 17 Pro - Cosmic Orange
    {
      id: 'var-iphone-orange-256',
      product_id: 'prod-iphone-17-pro',
      name: 'Cosmic Orange / 256GB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '256GB',
      price: 132900,
      mrp: 139900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ]),
      in_stock: 1,
      stock_quantity: 18
    },
    {
      id: 'var-iphone-orange-512',
      product_id: 'prod-iphone-17-pro',
      name: 'Cosmic Orange / 512GB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '512GB',
      price: 152900,
      mrp: 159900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ]),
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: 'var-iphone-orange-1tb',
      product_id: 'prod-iphone-17-pro',
      name: 'Cosmic Orange / 1TB',
      color_name: 'Cosmic Orange',
      color_hex: '#E46D29',
      storage: '1TB',
      price: 172900,
      mrp: 179900,
      image_url: '/images/iphone-17-pro-orange-1.jpg',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-orange-1.jpg',
        '/images/iphone-17-pro-orange-2.jpg',
        '/images/iphone-17-pro-orange-3.jpg',
        '/images/iphone-17-pro-orange-4.jpg',
        '/images/iphone-17-pro-orange-5.jpg'
      ]),
      in_stock: 1,
      stock_quantity: 6
    },
    // iPhone 17 Pro - Natural Silver
    {
      id: 'var-iphone-silver-256',
      product_id: 'prod-iphone-17-pro',
      name: 'Silver / 256GB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '256GB',
      price: 127900,
      mrp: 134900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: 'var-iphone-silver-512',
      product_id: 'prod-iphone-17-pro',
      name: 'Silver / 512GB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '512GB',
      price: 147900,
      mrp: 154900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 10
    },
    {
      id: 'var-iphone-silver-1tb',
      product_id: 'prod-iphone-17-pro',
      name: 'Silver / 1TB',
      color_name: 'Silver',
      color_hex: '#E2E4E1',
      storage: '1TB',
      price: 167900,
      mrp: 174900,
      image_url: '/images/iphone-17-pro-silver-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-silver-1.png',
        '/images/iphone-17-pro-silver-2.png',
        '/images/iphone-17-pro-silver-3.png',
        '/images/iphone-17-pro-silver-4.png',
        '/images/iphone-17-pro-silver-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 5
    },
    // iPhone 17 Pro - Deep Blue
    {
      id: 'var-iphone-blue-256',
      product_id: 'prod-iphone-17-pro',
      name: 'Deep Blue / 256GB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '256GB',
      price: 129900,
      mrp: 136900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 20
    },
    {
      id: 'var-iphone-blue-512',
      product_id: 'prod-iphone-17-pro',
      name: 'Deep Blue / 512GB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '512GB',
      price: 149900,
      mrp: 156900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: 'var-iphone-blue-1tb',
      product_id: 'prod-iphone-17-pro',
      name: 'Deep Blue / 1TB',
      color_name: 'Deep Blue',
      color_hex: '#2E3D52',
      storage: '1TB',
      price: 169900,
      mrp: 176900,
      image_url: '/images/iphone-17-pro-blue-1.png',
      gallery_images: JSON.stringify([
        '/images/iphone-17-pro-blue-1.png',
        '/images/iphone-17-pro-blue-2.jpg',
        '/images/iphone-17-pro-blue-3.png',
        '/images/iphone-17-pro-blue-4.png',
        '/images/iphone-17-pro-blue-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 7
    },
    // Samsung S24 Ultra
    {
      id: 'var-s24-black-256',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Black / 256GB',
      color_name: 'Titanium Black',
      color_hex: '#222324',
      storage: '256GB',
      price: 119999,
      mrp: 134999,
      image_url: '/images/s24-ultra-black-1.png',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-black-1.png',
        '/images/s24-ultra-black-2.png',
        '/images/s24-ultra-black-3.png',
        '/images/s24-ultra-black-4.png',
        '/images/s24-ultra-black-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 20
    },
    {
      id: 'var-s24-black-512',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Black / 512GB',
      color_name: 'Titanium Black',
      color_hex: '#222324',
      storage: '512GB',
      price: 129999,
      mrp: 144999,
      image_url: '/images/s24-ultra-black-1.png',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-black-1.png',
        '/images/s24-ultra-black-2.png',
        '/images/s24-ultra-black-3.png',
        '/images/s24-ultra-black-4.png',
        '/images/s24-ultra-black-5.png'
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: 'var-s24-gray-256',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Gray / 256GB',
      color_name: 'Titanium Gray',
      color_hex: '#686B6F',
      storage: '256GB',
      price: 117999,
      mrp: 132999,
      image_url: '/images/s24-ultra-1.svg',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: 'var-s24-gray-512',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Gray / 512GB',
      color_name: 'Titanium Gray',
      color_hex: '#686B6F',
      storage: '512GB',
      price: 127999,
      mrp: 142999,
      image_url: '/images/s24-ultra-1.svg',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ]),
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: 'var-s24-violet-256',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Violet / 256GB',
      color_name: 'Titanium Violet',
      color_hex: '#5F5170',
      storage: '256GB',
      price: 118999,
      mrp: 133999,
      image_url: '/images/s24-ultra-2.svg',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ]),
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: 'var-s24-violet-512',
      product_id: 'prod-samsung-s24-ultra',
      name: 'Titanium Violet / 512GB',
      color_name: 'Titanium Violet',
      color_hex: '#5F5170',
      storage: '512GB',
      price: 128999,
      mrp: 143999,
      image_url: '/images/s24-ultra-2.svg',
      gallery_images: JSON.stringify([
        '/images/s24-ultra-2.svg',
        '/images/s24-ultra-1.svg',
        '/images/s24-ultra-3.svg',
        '/images/s24-ultra-4.svg',
        '/images/s24-ultra-5.svg'
      ]),
      in_stock: 1,
      stock_quantity: 10
    }
  ];

  const emi_plans: any[] = [];
  const pIds = ['prod-iphone-17-pro', 'prod-samsung-s24-ultra'];
  const tenures = [
    { m: 3, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-absl-liquid' },
    { m: 6, rate: 0.0, cash: 7500, noCost: 1, pop: 1, mf: 'mf-icici-liquid' },
    { m: 12, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-sbi-liquid' },
    { m: 24, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-icici-liquid' },
    { m: 36, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-hdfc-overnight' },
    { m: 48, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-absl-liquid' },
    { m: 60, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-sbi-liquid' }
  ];

  for (const pid of pIds) {
    for (const t of tenures) {
      emi_plans.push({
        id: `emi-${pid}-${t.m}m`,
        product_id: pid,
        tenure_months: t.m,
        interest_rate: t.rate,
        downpayment_amount: 0,
        processing_fee: 0,
        cashback_amount: t.cash,
        cashback_description: `Additional cashback of ₹${t.cash.toLocaleString('en-IN')}`,
        is_no_cost: t.noCost,
        is_popular: t.pop,
        mutual_fund_id: t.mf
      });
    }
  }

  variants.forEach((v: any) => {
    if (!v.color && v.color_name) v.color = v.color_name;
  });

  memoryStore = {
    products,
    variants,
    emi_plans,
    mutual_funds,
    applications: []
  };
}

function memoryQueryAll<T = any>(sql: string, params: any[] = []): T[] {
  initMemoryFallback();
  if (!memoryStore) return [];

  const lower = sql.toLowerCase();

  if (lower.includes('from products') && lower.includes('group by')) {
    return memoryStore.products.map(p => {
      const vars = memoryStore!.variants.filter(v => v.product_id === p.id);
      const minPrice = vars.length > 0 ? Math.min(...vars.map(v => v.price)) : p.base_price;
      const minMrp = vars.length > 0 ? Math.min(...vars.map(v => v.mrp)) : p.base_mrp;
      return {
        ...p,
        variants_count: vars.length,
        min_price: minPrice,
        min_mrp: minMrp
      };
    }) as any;
  }

  if (lower.includes('from products') && lower.includes('where')) {
    const term = (params[0] || '').toString().toLowerCase();

    // Explicit numeric ID matching: 1 -> iPhone 17 Pro, 2 -> Samsung Galaxy S24 Ultra
    if (term === '1') {
      return memoryStore.products.filter(p => p.id === 'prod-iphone-17-pro' || p.name.includes('iPhone')) as any;
    }
    if (term === '2') {
      return memoryStore.products.filter(p => p.id === 'prod-samsung-s24-ultra' || p.name.includes('Samsung')) as any;
    }

    const found = memoryStore.products.filter(p => {
      const pSlug = p.slug.toLowerCase();
      const pId = p.id.toLowerCase();
      const pName = p.name.toLowerCase();
      return (
        p.slug === term || 
        p.id === term || 
        (term.length > 2 && pSlug.includes(term)) ||
        term.includes(pSlug) ||
        (term.includes('iphone') && (pSlug.includes('iphone') || pName.includes('iphone'))) ||
        (term.includes('samsung') && (pSlug.includes('samsung') || pName.includes('samsung'))) ||
        (term.includes('s24') && (pSlug.includes('s24') || pName.includes('s24')))
      );
    });
    return found as any;
  }

  if (lower.includes('from product_variants') && lower.includes('where product_id')) {
    const pid = String(params[0]);
    return memoryStore.variants.filter(v => String(v.product_id) === pid) as any;
  }

  if (lower.includes('from product_variants') && lower.includes('where id')) {
    const vid = String(params[0]);
    return memoryStore.variants.filter(v => String(v.id) === vid) as any;
  }

  if (lower.includes('from emi_plans')) {
    const tenures = [
      { m: 3, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-absl-liquid' },
      { m: 6, rate: 0.0, cash: 7500, noCost: 1, pop: 1, mf: 'mf-icici-liquid' },
      { m: 9, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-sbi-liquid' },
      { m: 12, rate: 0.0, cash: 7500, noCost: 1, pop: 0, mf: 'mf-sbi-liquid' },
      { m: 18, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-hdfc-overnight' },
      { m: 24, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-icici-liquid' },
      { m: 36, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: 'mf-hdfc-overnight' }
    ];
    return tenures.map((t, idx) => {
      const mf = memoryStore!.mutual_funds.find(m => m.id === t.mf) || memoryStore!.mutual_funds[0];
      return {
        id: idx + 1,
        variant_id: params[0] || 1,
        tenure_months: t.m,
        interest_rate: t.rate,
        downpayment_amount: 0,
        processing_fee: 0,
        cashback: t.cash,
        cashback_amount: t.cash,
        cashback_description: `Additional cashback of ₹${t.cash.toLocaleString('en-IN')}`,
        is_no_cost: t.noCost,
        is_popular: t.pop,
        mutual_fund_id: t.mf,
        mf_name: mf ? mf.name : 'ICICI Prudential Liquid Fund',
        mf_amc: mf ? mf.amc : 'ICICI Prudential AMC',
        mf_nav: mf ? mf.nav : 362.15,
        mf_cagr: mf ? mf.cagr_1yr : 7.2,
        mf_risk: mf ? mf.risk_level : 'Low Risk',
        mf_rating: mf ? mf.rating_stars : 5
      };
    }) as any;
  }

  if (lower.includes('from mutual_funds')) {
    return memoryStore.mutual_funds as any;
  }

  if (lower.includes('count(*) as count from products')) {
    return [{ count: memoryStore.products.length }] as any;
  }
  if (lower.includes('count(*) as count from product_variants')) {
    return [{ count: memoryStore.variants.length }] as any;
  }
  if (lower.includes('count(*) as count from emi_plans')) {
    return [{ count: memoryStore.emi_plans.length }] as any;
  }
  if (lower.includes('count(*) as count from mutual_funds')) {
    return [{ count: memoryStore.mutual_funds.length }] as any;
  }
  if (lower.includes('count(*) as count from emi_applications')) {
    return [{ count: memoryStore.applications.length }] as any;
  }

  return [];
}

function memoryExecute(sql: string, params: any[]): any {
  initMemoryFallback();
  if (!memoryStore) return;

  const lower = sql.toLowerCase();
  if (lower.includes('insert into emi_applications')) {
    memoryStore.applications.push({
      id: params[0],
      sanction_number: params[1],
      product_id: params[2],
      full_name: params[12]
    });
  }
  return { rowCount: 1 };
}
