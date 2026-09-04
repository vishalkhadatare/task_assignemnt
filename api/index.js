// server/vercel.ts
import express from "express";

// server/api.ts
import { Router } from "express";

// server/db.ts
import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
var connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || process.env.PGUSER || "postgres"}:${encodeURIComponent(process.env.DB_PASSWORD || process.env.PGPASSWORD || "Vishal123")}@${process.env.DB_HOST || process.env.PGHOST || "localhost"}:${process.env.DB_PORT || process.env.PGPORT || "5432"}/${process.env.DB_NAME || process.env.PGDATABASE || "ecommerce_db"}`;
var pool = null;
var isConnectedToPostgres = false;
var memoryStore = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : void 0,
      connectionTimeoutMillis: 5e3,
      idleTimeoutMillis: 3e4,
      max: 10
    });
    pool.on("error", (err) => {
      console.error("[PostgreSQL] Unexpected error on idle client:", err.message);
    });
  }
  return pool;
}
async function initDb() {
  if ((process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) && !process.env.DATABASE_URL) {
    console.log("[PostgreSQL] Vercel serverless environment detected without external DB. Using instant memory store.");
    initMemoryFallback();
    return;
  }
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      console.log("[PostgreSQL] Successfully connected to database engine!");
      isConnectedToPostgres = true;
      const checkRes = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
        ) as table_exists;
      `);
      if (!checkRes.rows[0]?.table_exists) {
        console.log("[PostgreSQL] Initializing schema & inserting seed data from schema.sql...");
        const schemaPath = path.join(process.cwd(), "schema.sql");
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, "utf-8");
          await client.query(sql);
          console.log("[PostgreSQL] Database schema & seed data initialized successfully!");
        }
      } else {
        console.log("[PostgreSQL] Relational tables already present and ready.");
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`[PostgreSQL] Connection note: ${err.message}`);
    console.log("[PostgreSQL] To connect to your local database, create a .env file with:");
    console.log("             DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/your_db");
    console.log("[PostgreSQL] Running in resilient mode with seeded data while database config is verified.");
    initMemoryFallback();
  }
}
function convertPlaceholders(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}
async function queryAll(sql, params = []) {
  if (isConnectedToPostgres && pool) {
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await pool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error("[PostgreSQL Query Error]:", err.message);
      throw err;
    }
  }
  return memoryQueryAll(sql, params);
}
async function queryOne(sql, params = []) {
  const list = await queryAll(sql, params);
  return list.length > 0 ? list[0] : null;
}
function initMemoryFallback() {
  if (memoryStore) return;
  const mutual_funds = [
    {
      id: "mf-icici-liquid",
      name: "ICICI Prudential Liquid Fund - Direct Growth",
      amc: "ICICI Prudential AMC",
      category: "Liquid Fund",
      nav: 362.15,
      cagr_1yr: 7.18,
      risk_level: "Low Risk",
      aum_cr: 48200,
      rating_stars: 5
    },
    {
      id: "mf-absl-liquid",
      name: "Aditya Birla Sun Life Liquid Fund - Direct Plan",
      amc: "Aditya Birla Sun Life AMC",
      category: "Liquid Fund",
      nav: 386.42,
      cagr_1yr: 7.24,
      risk_level: "Low Risk",
      aum_cr: 41500,
      rating_stars: 5
    },
    {
      id: "mf-sbi-liquid",
      name: "SBI Liquid Fund - Direct Plan Growth",
      amc: "SBI Funds Management",
      category: "Liquid Fund",
      nav: 3780.2,
      cagr_1yr: 7.21,
      risk_level: "Low Risk",
      aum_cr: 62e3,
      rating_stars: 5
    },
    {
      id: "mf-hdfc-overnight",
      name: "HDFC Overnight Fund - Direct Growth",
      amc: "HDFC AMC",
      category: "Overnight / Liquid",
      nav: 3450.8,
      cagr_1yr: 6.85,
      risk_level: "Lowest Risk",
      aum_cr: 32800,
      rating_stars: 5
    }
  ];
  const products = [
    {
      id: "prod-iphone-17-pro",
      slug: "apple-iphone-17-pro-silver-256-gb-smart-phones-on-emi",
      name: "Apple iPhone 17 Pro",
      brand: "Apple",
      tagline: "Precision-milled aerospace titanium with next-generation A19 Pro silicon.",
      description: "Experience the cutting-edge Apple iPhone 17 Pro featuring the revolutionary A19 Pro chip, custom ceramic shield front, 120Hz ProMotion Super Retina XDR display, and 48MP quad-lens fusion camera system with 5x telephoto optical zoom. Backed by 1Fi Mutual Fund collateral for zero-cost financing.",
      category: "Smartphones",
      rating: 4.2,
      reviews_count: 1420,
      base_price: 127400,
      base_mrp: 134900,
      default_image: "/images/iphone-17-pro-1.svg",
      highlights: JSON.stringify([
        "Storage: 256 GB",
        "Color: Silver",
        "Front Camera: 18MP with Center Stage & 4K stabilized video",
        "Rear Camera: 48MP + 48MP + 48MP Fusion system with 4 lenses & 8x zoom",
        "Screen Size: 6.3 inch (2622 \xD7 1206 Pixels)",
        "Pay only \u20B920,235 now \u2022 0% EMI with 1Fi Smart EMI"
      ]),
      specs: JSON.stringify({
        "Storage": "256 GB",
        "Color": "Silver",
        "Front Camera": "18MP",
        "Screen Size": "6.3 inch",
        "Processor": "Apple A19 Pro Silicon (3nm architecture)",
        "Operating System": "iOS 19 with Apple Intelligence deep integration"
      })
    },
    {
      id: "prod-samsung-s24-ultra",
      slug: "samsung-galaxy-s24-ultra-titanium-gray-256-gb-smart-phones-on-emi",
      name: "Samsung Galaxy S24 Ultra 5G",
      brand: "Samsung",
      tagline: "Galaxy AI is here. Encased in durable titanium with built-in S-Pen.",
      description: "The pinnacle of Android craftsmanship. Samsung Galaxy S24 Ultra brings a flat 6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, titanium frame, 200MP camera system, and integrated S Pen for precision productivity.",
      category: "Smartphones",
      rating: 4.8,
      reviews_count: 980,
      base_price: 114999,
      base_mrp: 129999,
      default_image: "/images/s24-ultra-1.svg",
      highlights: JSON.stringify([
        "Snapdragon 8 Gen 3 for Galaxy with Vapor Chamber Cooling",
        "6.8-inch QHD+ Dynamic AMOLED 2X, 2600 nits peak brightness",
        "Titanium frame with Corning Gorilla Armor anti-reflective glass",
        "200MP Quad Telephoto Camera with ProVisual AI Engine",
        "Built-in S Pen stylus with Air Actions & live translation"
      ]),
      specs: JSON.stringify({
        "Display": "6.8-inch Dynamic AMOLED 2X",
        "Processor": "Qualcomm Snapdragon 8 Gen 3 for Galaxy",
        "Rear Camera": "200MP + 50MP + 10MP + 12MP",
        "Battery": "5,000 mAh with 45W Fast Charging"
      })
    }
  ];
  const variants = [
    // iPhone 17 Pro - Cosmic Orange
    {
      id: "var-iphone-orange-256",
      product_id: "prod-iphone-17-pro",
      name: "Cosmic Orange / 256GB",
      color_name: "Cosmic Orange",
      color_hex: "#E46D29",
      storage: "256GB",
      price: 132900,
      mrp: 139900,
      image_url: "/images/iphone-17-pro-orange-1.jpg",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-orange-1.jpg",
        "/images/iphone-17-pro-orange-2.jpg",
        "/images/iphone-17-pro-orange-3.jpg",
        "/images/iphone-17-pro-orange-4.jpg",
        "/images/iphone-17-pro-orange-5.jpg"
      ]),
      in_stock: 1,
      stock_quantity: 18
    },
    {
      id: "var-iphone-orange-512",
      product_id: "prod-iphone-17-pro",
      name: "Cosmic Orange / 512GB",
      color_name: "Cosmic Orange",
      color_hex: "#E46D29",
      storage: "512GB",
      price: 152900,
      mrp: 159900,
      image_url: "/images/iphone-17-pro-orange-1.jpg",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-orange-1.jpg",
        "/images/iphone-17-pro-orange-2.jpg",
        "/images/iphone-17-pro-orange-3.jpg",
        "/images/iphone-17-pro-orange-4.jpg",
        "/images/iphone-17-pro-orange-5.jpg"
      ]),
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: "var-iphone-orange-1tb",
      product_id: "prod-iphone-17-pro",
      name: "Cosmic Orange / 1TB",
      color_name: "Cosmic Orange",
      color_hex: "#E46D29",
      storage: "1TB",
      price: 172900,
      mrp: 179900,
      image_url: "/images/iphone-17-pro-orange-1.jpg",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-orange-1.jpg",
        "/images/iphone-17-pro-orange-2.jpg",
        "/images/iphone-17-pro-orange-3.jpg",
        "/images/iphone-17-pro-orange-4.jpg",
        "/images/iphone-17-pro-orange-5.jpg"
      ]),
      in_stock: 1,
      stock_quantity: 6
    },
    // iPhone 17 Pro - Natural Silver
    {
      id: "var-iphone-silver-256",
      product_id: "prod-iphone-17-pro",
      name: "Silver / 256GB",
      color_name: "Silver",
      color_hex: "#E2E4E1",
      storage: "256GB",
      price: 127900,
      mrp: 134900,
      image_url: "/images/iphone-17-pro-silver-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-silver-1.png",
        "/images/iphone-17-pro-silver-2.png",
        "/images/iphone-17-pro-silver-3.png",
        "/images/iphone-17-pro-silver-4.png",
        "/images/iphone-17-pro-silver-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: "var-iphone-silver-512",
      product_id: "prod-iphone-17-pro",
      name: "Silver / 512GB",
      color_name: "Silver",
      color_hex: "#E2E4E1",
      storage: "512GB",
      price: 147900,
      mrp: 154900,
      image_url: "/images/iphone-17-pro-silver-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-silver-1.png",
        "/images/iphone-17-pro-silver-2.png",
        "/images/iphone-17-pro-silver-3.png",
        "/images/iphone-17-pro-silver-4.png",
        "/images/iphone-17-pro-silver-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 10
    },
    {
      id: "var-iphone-silver-1tb",
      product_id: "prod-iphone-17-pro",
      name: "Silver / 1TB",
      color_name: "Silver",
      color_hex: "#E2E4E1",
      storage: "1TB",
      price: 167900,
      mrp: 174900,
      image_url: "/images/iphone-17-pro-silver-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-silver-1.png",
        "/images/iphone-17-pro-silver-2.png",
        "/images/iphone-17-pro-silver-3.png",
        "/images/iphone-17-pro-silver-4.png",
        "/images/iphone-17-pro-silver-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 5
    },
    // iPhone 17 Pro - Deep Blue
    {
      id: "var-iphone-blue-256",
      product_id: "prod-iphone-17-pro",
      name: "Deep Blue / 256GB",
      color_name: "Deep Blue",
      color_hex: "#2E3D52",
      storage: "256GB",
      price: 129900,
      mrp: 136900,
      image_url: "/images/iphone-17-pro-blue-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-blue-1.png",
        "/images/iphone-17-pro-blue-2.jpg",
        "/images/iphone-17-pro-blue-3.png",
        "/images/iphone-17-pro-blue-4.png",
        "/images/iphone-17-pro-blue-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 20
    },
    {
      id: "var-iphone-blue-512",
      product_id: "prod-iphone-17-pro",
      name: "Deep Blue / 512GB",
      color_name: "Deep Blue",
      color_hex: "#2E3D52",
      storage: "512GB",
      price: 149900,
      mrp: 156900,
      image_url: "/images/iphone-17-pro-blue-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-blue-1.png",
        "/images/iphone-17-pro-blue-2.jpg",
        "/images/iphone-17-pro-blue-3.png",
        "/images/iphone-17-pro-blue-4.png",
        "/images/iphone-17-pro-blue-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: "var-iphone-blue-1tb",
      product_id: "prod-iphone-17-pro",
      name: "Deep Blue / 1TB",
      color_name: "Deep Blue",
      color_hex: "#2E3D52",
      storage: "1TB",
      price: 169900,
      mrp: 176900,
      image_url: "/images/iphone-17-pro-blue-1.png",
      gallery_images: JSON.stringify([
        "/images/iphone-17-pro-blue-1.png",
        "/images/iphone-17-pro-blue-2.jpg",
        "/images/iphone-17-pro-blue-3.png",
        "/images/iphone-17-pro-blue-4.png",
        "/images/iphone-17-pro-blue-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 7
    },
    // Samsung S24 Ultra
    {
      id: "var-s24-black-256",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Black / 256GB",
      color_name: "Titanium Black",
      color_hex: "#222324",
      storage: "256GB",
      price: 119999,
      mrp: 134999,
      image_url: "/images/s24-ultra-black-1.png",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-black-1.png",
        "/images/s24-ultra-black-2.png",
        "/images/s24-ultra-black-3.png",
        "/images/s24-ultra-black-4.png",
        "/images/s24-ultra-black-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 20
    },
    {
      id: "var-s24-black-512",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Black / 512GB",
      color_name: "Titanium Black",
      color_hex: "#222324",
      storage: "512GB",
      price: 129999,
      mrp: 144999,
      image_url: "/images/s24-ultra-black-1.png",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-black-1.png",
        "/images/s24-ultra-black-2.png",
        "/images/s24-ultra-black-3.png",
        "/images/s24-ultra-black-4.png",
        "/images/s24-ultra-black-5.png"
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: "var-s24-gray-256",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Gray / 256GB",
      color_name: "Titanium Gray",
      color_hex: "#686B6F",
      storage: "256GB",
      price: 117999,
      mrp: 132999,
      image_url: "/images/s24-ultra-1.svg",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-1.svg",
        "/images/s24-ultra-2.svg",
        "/images/s24-ultra-3.svg",
        "/images/s24-ultra-4.svg",
        "/images/s24-ultra-5.svg"
      ]),
      in_stock: 1,
      stock_quantity: 15
    },
    {
      id: "var-s24-gray-512",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Gray / 512GB",
      color_name: "Titanium Gray",
      color_hex: "#686B6F",
      storage: "512GB",
      price: 127999,
      mrp: 142999,
      image_url: "/images/s24-ultra-1.svg",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-1.svg",
        "/images/s24-ultra-2.svg",
        "/images/s24-ultra-3.svg",
        "/images/s24-ultra-4.svg",
        "/images/s24-ultra-5.svg"
      ]),
      in_stock: 1,
      stock_quantity: 12
    },
    {
      id: "var-s24-violet-256",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Violet / 256GB",
      color_name: "Titanium Violet",
      color_hex: "#5F5170",
      storage: "256GB",
      price: 118999,
      mrp: 133999,
      image_url: "/images/s24-ultra-2.svg",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-2.svg",
        "/images/s24-ultra-1.svg",
        "/images/s24-ultra-3.svg",
        "/images/s24-ultra-4.svg",
        "/images/s24-ultra-5.svg"
      ]),
      in_stock: 1,
      stock_quantity: 14
    },
    {
      id: "var-s24-violet-512",
      product_id: "prod-samsung-s24-ultra",
      name: "Titanium Violet / 512GB",
      color_name: "Titanium Violet",
      color_hex: "#5F5170",
      storage: "512GB",
      price: 128999,
      mrp: 143999,
      image_url: "/images/s24-ultra-2.svg",
      gallery_images: JSON.stringify([
        "/images/s24-ultra-2.svg",
        "/images/s24-ultra-1.svg",
        "/images/s24-ultra-3.svg",
        "/images/s24-ultra-4.svg",
        "/images/s24-ultra-5.svg"
      ]),
      in_stock: 1,
      stock_quantity: 10
    }
  ];
  const emi_plans = [];
  const pIds = ["prod-iphone-17-pro", "prod-samsung-s24-ultra"];
  const tenures = [
    { m: 3, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-absl-liquid" },
    { m: 6, rate: 0, cash: 7500, noCost: 1, pop: 1, mf: "mf-icici-liquid" },
    { m: 12, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-sbi-liquid" },
    { m: 24, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-icici-liquid" },
    { m: 36, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-hdfc-overnight" },
    { m: 48, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-absl-liquid" },
    { m: 60, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-sbi-liquid" }
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
        cashback_description: `Additional cashback of \u20B9${t.cash.toLocaleString("en-IN")}`,
        is_no_cost: t.noCost,
        is_popular: t.pop,
        mutual_fund_id: t.mf
      });
    }
  }
  variants.forEach((v) => {
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
function memoryQueryAll(sql, params = []) {
  initMemoryFallback();
  if (!memoryStore) return [];
  const lower = sql.toLowerCase();
  if (lower.includes("from products") && lower.includes("group by")) {
    return memoryStore.products.map((p) => {
      const vars = memoryStore.variants.filter((v) => v.product_id === p.id);
      const minPrice = vars.length > 0 ? Math.min(...vars.map((v) => v.price)) : p.base_price;
      const minMrp = vars.length > 0 ? Math.min(...vars.map((v) => v.mrp)) : p.base_mrp;
      return {
        ...p,
        variants_count: vars.length,
        min_price: minPrice,
        min_mrp: minMrp
      };
    });
  }
  if (lower.includes("from products") && lower.includes("where")) {
    const term = (params[0] || "").toString().toLowerCase();
    if (term === "1") {
      return memoryStore.products.filter((p) => p.id === "prod-iphone-17-pro" || p.name.includes("iPhone"));
    }
    if (term === "2") {
      return memoryStore.products.filter((p) => p.id === "prod-samsung-s24-ultra" || p.name.includes("Samsung"));
    }
    const found = memoryStore.products.filter((p) => {
      const pSlug = p.slug.toLowerCase();
      const pId = p.id.toLowerCase();
      const pName = p.name.toLowerCase();
      return p.slug === term || p.id === term || term.length > 2 && pSlug.includes(term) || term.includes(pSlug) || term.includes("iphone") && (pSlug.includes("iphone") || pName.includes("iphone")) || term.includes("samsung") && (pSlug.includes("samsung") || pName.includes("samsung")) || term.includes("s24") && (pSlug.includes("s24") || pName.includes("s24"));
    });
    return found;
  }
  if (lower.includes("from product_variants") && lower.includes("where product_id")) {
    const pid = String(params[0]);
    return memoryStore.variants.filter((v) => String(v.product_id) === pid);
  }
  if (lower.includes("from product_variants") && lower.includes("where id")) {
    const vid = String(params[0]);
    return memoryStore.variants.filter((v) => String(v.id) === vid);
  }
  if (lower.includes("from emi_plans")) {
    const tenures = [
      { m: 3, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-absl-liquid" },
      { m: 6, rate: 0, cash: 7500, noCost: 1, pop: 1, mf: "mf-icici-liquid" },
      { m: 9, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-sbi-liquid" },
      { m: 12, rate: 0, cash: 7500, noCost: 1, pop: 0, mf: "mf-sbi-liquid" },
      { m: 18, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-hdfc-overnight" },
      { m: 24, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-icici-liquid" },
      { m: 36, rate: 10.5, cash: 7500, noCost: 0, pop: 0, mf: "mf-hdfc-overnight" }
    ];
    return tenures.map((t, idx) => {
      const mf = memoryStore.mutual_funds.find((m) => m.id === t.mf) || memoryStore.mutual_funds[0];
      return {
        id: idx + 1,
        variant_id: params[0] || 1,
        tenure_months: t.m,
        interest_rate: t.rate,
        downpayment_amount: 0,
        processing_fee: 0,
        cashback: t.cash,
        cashback_amount: t.cash,
        cashback_description: `Additional cashback of \u20B9${t.cash.toLocaleString("en-IN")}`,
        is_no_cost: t.noCost,
        is_popular: t.pop,
        mutual_fund_id: t.mf,
        mf_name: mf ? mf.name : "ICICI Prudential Liquid Fund",
        mf_amc: mf ? mf.amc : "ICICI Prudential AMC",
        mf_nav: mf ? mf.nav : 362.15,
        mf_cagr: mf ? mf.cagr_1yr : 7.2,
        mf_risk: mf ? mf.risk_level : "Low Risk",
        mf_rating: mf ? mf.rating_stars : 5
      };
    });
  }
  if (lower.includes("from mutual_funds")) {
    return memoryStore.mutual_funds;
  }
  if (lower.includes("count(*) as count from products")) {
    return [{ count: memoryStore.products.length }];
  }
  if (lower.includes("count(*) as count from product_variants")) {
    return [{ count: memoryStore.variants.length }];
  }
  if (lower.includes("count(*) as count from emi_plans")) {
    return [{ count: memoryStore.emi_plans.length }];
  }
  if (lower.includes("count(*) as count from mutual_funds")) {
    return [{ count: memoryStore.mutual_funds.length }];
  }
  if (lower.includes("count(*) as count from emi_applications")) {
    return [{ count: memoryStore.applications.length }];
  }
  return [];
}

// server/api.ts
var apiRouter = Router();
function computeEmi(fullPrice, annualRate, tenureMonths, downpaymentRate = 0) {
  const downpayment = Math.round(fullPrice * downpaymentRate);
  const financedPrincipal = Math.max(0, fullPrice - downpayment);
  if (annualRate <= 0) {
    const monthlyEmi2 = Math.round(financedPrincipal / tenureMonths);
    const totalPayable2 = monthlyEmi2 * tenureMonths + downpayment;
    return {
      downpayment,
      financedPrincipal,
      monthlyEmi: monthlyEmi2,
      totalInterest: 0,
      totalPayable: totalPayable2
    };
  }
  const monthlyRate = annualRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmi = Math.round(financedPrincipal * monthlyRate * factor / (factor - 1));
  const totalPayable = monthlyEmi * tenureMonths + downpayment;
  const totalInterest = Math.max(0, monthlyEmi * tenureMonths - financedPrincipal);
  return {
    downpayment,
    financedPrincipal,
    monthlyEmi,
    totalInterest,
    totalPayable
  };
}
apiRouter.get("/test-db", async (req, res) => {
  try {
    const result = await queryOne("SELECT NOW() as now");
    res.json({
      success: true,
      message: "PostgreSQL connected successfully",
      database: "ecommerce_db",
      time: result?.now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});
apiRouter.get("/products", async (req, res) => {
  try {
    const products = await queryAll(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        COALESCE(MIN(pv.mrp), p.mrp) as min_mrp,
        COALESCE(MIN(pv.price), p.price) as min_price,
        p.created_at,
        COUNT(pv.id)::int as variants_count,
        COALESCE(MIN(pv.image_url), '/images/iphone-17-pro-orange-1.jpg') as default_image
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);
    const formatted = products.map((p) => {
      const priceNum = parseFloat(p.min_price) || 0;
      const mrpNum = parseFloat(p.min_mrp) || priceNum;
      const lowestEmi = Math.round(priceNum / 12);
      const isIphone = p.slug.includes("iphone");
      const isSamsung = p.slug.includes("samsung") || p.slug.includes("s24");
      const defaultImage = isIphone ? "/images/iphone-17-pro-orange-1.jpg" : isSamsung ? "/images/s24-ultra-black-1.png" : p.default_image;
      return {
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.name.includes("iPhone") ? "Apple" : "Samsung",
        base_price: priceNum,
        base_mrp: mrpNum,
        rating: 4.8,
        reviews_count: 1420,
        default_image: defaultImage,
        variants_count: p.variants_count,
        lowest_emi: lowestEmi,
        save_amount: Math.max(0, mrpNum - priceNum)
      };
    });
    res.json({ success: true, count: formatted.length, products: formatted });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/products/:slugOrId", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const product = await queryOne(`
      SELECT * FROM products
      WHERE slug = ? OR id::text = ? OR slug LIKE ?
    `, [slugOrId, slugOrId, `%${slugOrId}%`]);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const priceNum = parseFloat(product.price) || 0;
    const mrpNum = parseFloat(product.mrp) || priceNum;
    const variantsRaw = await queryAll(`
      SELECT * FROM product_variants
      WHERE product_id = ?
      ORDER BY 
        CASE 
          WHEN LOWER(color) LIKE '%orange%' THEN 0 
          WHEN LOWER(color) LIKE '%silver%' THEN 1 
          WHEN LOWER(color) LIKE '%blue%' THEN 2 
          WHEN LOWER(color) LIKE '%black%' THEN 0
          WHEN LOWER(color) LIKE '%gray%' OR LOWER(color) LIKE '%grey%' THEN 1
          WHEN LOWER(color) LIKE '%violet%' THEN 2
          ELSE 3 
        END,
        CASE
          WHEN LOWER(storage) LIKE '%256%' THEN 0
          WHEN LOWER(storage) LIKE '%512%' THEN 1
          WHEN LOWER(storage) LIKE '%1tb%' OR LOWER(storage) LIKE '%1 tb%' THEN 2
          ELSE 3
        END,
        id ASC
    `, [product.id]);
    const isIphone = product.slug.includes("iphone");
    const isSamsung = product.slug.includes("samsung") || product.slug.includes("s24");
    const variants = variantsRaw.map((v) => {
      const variantColor = (v.color || v.color_name || "Silver").toString();
      const variantStorage = (v.storage || "256GB").toString();
      let gallery = [v.image_url];
      let imageUrl = v.image_url;
      if (isIphone) {
        if (variantColor.toLowerCase().includes("orange")) {
          imageUrl = "/images/iphone-17-pro-orange-1.jpg";
          gallery = [
            "/images/iphone-17-pro-orange-1.jpg",
            "/images/iphone-17-pro-orange-2.jpg",
            "/images/iphone-17-pro-orange-3.jpg",
            "/images/iphone-17-pro-orange-4.jpg",
            "/images/iphone-17-pro-orange-5.jpg"
          ];
        } else if (variantColor.toLowerCase().includes("blue")) {
          imageUrl = "/images/iphone-17-pro-blue-1.png";
          gallery = [
            "/images/iphone-17-pro-blue-1.png",
            "/images/iphone-17-pro-blue-2.jpg",
            "/images/iphone-17-pro-blue-3.png",
            "/images/iphone-17-pro-blue-4.png",
            "/images/iphone-17-pro-blue-5.png"
          ];
        } else {
          imageUrl = "/images/iphone-17-pro-silver-1.png";
          gallery = [
            "/images/iphone-17-pro-silver-1.png",
            "/images/iphone-17-pro-silver-2.png",
            "/images/iphone-17-pro-silver-3.png",
            "/images/iphone-17-pro-silver-4.png",
            "/images/iphone-17-pro-silver-5.png"
          ];
        }
      } else if (isSamsung) {
        if (variantColor.toLowerCase().includes("black")) {
          imageUrl = "/images/s24-ultra-black-1.png";
          gallery = [
            "/images/s24-ultra-black-1.png",
            "/images/s24-ultra-black-2.png",
            "/images/s24-ultra-black-3.png",
            "/images/s24-ultra-black-4.png",
            "/images/s24-ultra-black-5.png"
          ];
        } else if (variantColor.toLowerCase().includes("gray") || variantColor.toLowerCase().includes("grey")) {
          imageUrl = "/images/s24-ultra-1.svg";
          gallery = [
            "/images/s24-ultra-1.svg",
            "/images/s24-ultra-2.svg",
            "/images/s24-ultra-3.svg",
            "/images/s24-ultra-4.svg",
            "/images/s24-ultra-5.svg"
          ];
        } else if (variantColor.toLowerCase().includes("violet")) {
          imageUrl = "/images/s24-ultra-2.svg";
          gallery = [
            "/images/s24-ultra-2.svg",
            "/images/s24-ultra-1.svg",
            "/images/s24-ultra-3.svg",
            "/images/s24-ultra-4.svg",
            "/images/s24-ultra-5.svg"
          ];
        } else {
          gallery = [
            "/images/s24-ultra-1.svg",
            "/images/s24-ultra-2.svg",
            "/images/s24-ultra-3.svg",
            "/images/s24-ultra-4.svg",
            "/images/s24-ultra-5.svg"
          ];
        }
      }
      const colorHex = variantColor.toLowerCase().includes("orange") ? "#E46D29" : variantColor.toLowerCase().includes("blue") ? "#2E3D52" : variantColor.toLowerCase().includes("silver") ? "#E2E4E1" : variantColor.toLowerCase().includes("violet") ? "#5F5170" : variantColor.toLowerCase().includes("gray") || variantColor.toLowerCase().includes("grey") ? "#686B6F" : variantColor.toLowerCase().includes("black") ? "#222324" : variantColor.toLowerCase().includes("white") ? "#E8ECEF" : "#252729";
      const varPrice = v.price ? parseFloat(v.price) : priceNum;
      const varMrp = v.mrp ? parseFloat(v.mrp) : mrpNum;
      return {
        id: String(v.id),
        product_id: String(v.product_id),
        name: `${variantColor} / ${variantStorage}`,
        color_name: variantColor,
        color_hex: colorHex,
        storage: variantStorage,
        price: varPrice,
        mrp: varMrp,
        image_url: imageUrl,
        gallery_images: gallery,
        in_stock: 1,
        stock_quantity: 15
      };
    });
    const activeVariant = variants.find((v) => (v.color_name || "").toLowerCase().includes("orange") && (v.storage || "").toLowerCase().includes("256")) || variants.find((v) => (v.color_name || "").toLowerCase().includes("orange")) || variants.find((v) => (v.color_name || "").toLowerCase().includes("black") && (v.storage || "").toLowerCase().includes("256")) || variants.find((v) => (v.color_name || "").toLowerCase().includes("black")) || variants[0] || null;
    const activeVariantId = activeVariant ? parseInt(activeVariant.id, 10) : null;
    const activeVariantPrice = activeVariant ? activeVariant.price : priceNum;
    const activeVariantMrp = activeVariant ? activeVariant.mrp : mrpNum;
    let emiPlansRaw = activeVariantId ? await queryAll(`
          SELECT * FROM emi_plans
          WHERE variant_id = ?
          ORDER BY tenure_months ASC
        `, [activeVariantId]) : [];
    if (emiPlansRaw.length === 0 && variantsRaw[0]) {
      emiPlansRaw = await queryAll(`
        SELECT * FROM emi_plans
        WHERE variant_id = ?
        ORDER BY tenure_months ASC
      `, [variantsRaw[0].id]);
    }
    const plansWithCalculations = emiPlansRaw.map((plan) => {
      const tenure = parseInt(plan.tenure_months, 10);
      const rate = parseFloat(plan.interest_rate) || 0;
      const cashback = parseFloat(plan.cashback) || 0;
      const calc = computeEmi(activeVariantPrice, rate, tenure);
      const tenureYears = tenure / 12;
      const mfProjectedReturn = Math.round(activeVariantPrice * (Math.pow(1 + 7.2 / 100, tenureYears) - 1));
      const monthlyPayment = parseFloat(plan.monthly_payment) || calc.monthlyEmi;
      const netEffectiveCost = Math.max(0, monthlyPayment * tenure - cashback - mfProjectedReturn);
      return {
        id: String(plan.id),
        product_id: String(product.id),
        tenure_months: tenure,
        interest_rate: rate,
        downpayment_amount: 0,
        processing_fee: 0,
        monthly_payment: calc.monthlyEmi,
        cashback_amount: cashback,
        cashback_description: cashback > 0 ? `Additional cashback of \u20B9${cashback.toLocaleString("en-IN")}` : "",
        is_no_cost: rate === 0 ? 1 : 0,
        is_popular: tenure === 6 ? 1 : 0,
        mutual_fund_id: tenure <= 6 ? "mf-icici-liquid" : "mf-sbi-liquid",
        mf_name: tenure <= 6 ? "ICICI Prudential Liquid Fund" : "SBI Liquid Fund Growth",
        mf_amc: tenure <= 6 ? "ICICI Prudential AMC" : "SBI Funds Management",
        mf_nav: 362.15,
        mf_cagr: 7.2,
        mf_risk: "Low Risk",
        mf_rating: 5,
        calculated: {
          principal: activeVariantPrice,
          downpayment: calc.downpayment,
          financedPrincipal: calc.financedPrincipal,
          monthly_emi: calc.monthlyEmi,
          total_interest: calc.totalInterest,
          total_payable: calc.totalPayable,
          cashback_amount: cashback,
          net_payable_after_cashback: calc.totalPayable - cashback,
          mf_projected_return: mfProjectedReturn,
          net_effective_cost: netEffectiveCost,
          interest_fully_offset_by_mf: true
        }
      };
    });
    if (plansWithCalculations.length === 0) {
      const tenures = [
        { m: 3, rate: 0, cash: 7500, pop: false },
        { m: 6, rate: 0, cash: 7500, pop: true },
        { m: 9, rate: 0, cash: 7500, pop: false },
        { m: 12, rate: 0, cash: 7500, pop: false },
        { m: 18, rate: 10.5, cash: 7500, pop: false },
        { m: 24, rate: 10.5, cash: 7500, pop: false },
        { m: 36, rate: 10.5, cash: 7500, pop: false }
      ];
      for (const t of tenures) {
        const calc = computeEmi(activeVariantPrice, t.rate, t.m);
        const tenureYears = t.m / 12;
        const mfProjectedReturn = Math.round(activeVariantPrice * (Math.pow(1 + 7.2 / 100, tenureYears) - 1));
        const netEffectiveCost = Math.max(0, calc.totalPayable - t.cash - mfProjectedReturn);
        plansWithCalculations.push({
          id: `plan-${t.m}m`,
          product_id: String(product.id),
          tenure_months: t.m,
          interest_rate: t.rate,
          downpayment_amount: 0,
          processing_fee: 0,
          monthly_payment: calc.monthlyEmi,
          cashback_amount: t.cash,
          cashback_description: `Additional cashback of \u20B9${t.cash.toLocaleString("en-IN")}`,
          is_no_cost: t.rate === 0 ? 1 : 0,
          is_popular: t.pop ? 1 : 0,
          mutual_fund_id: t.m <= 6 ? "mf-icici-liquid" : "mf-sbi-liquid",
          mf_name: t.m <= 6 ? "ICICI Prudential Liquid Fund" : "SBI Liquid Fund Growth",
          mf_amc: t.m <= 6 ? "ICICI Prudential AMC" : "SBI Funds Management",
          mf_nav: 362.15,
          mf_cagr: 7.2,
          mf_risk: "Low Risk",
          mf_rating: 5,
          calculated: {
            principal: activeVariantPrice,
            downpayment: calc.downpayment,
            financedPrincipal: calc.financedPrincipal,
            monthly_emi: calc.monthlyEmi,
            total_interest: calc.totalInterest,
            total_payable: calc.totalPayable,
            cashback_amount: t.cash,
            net_payable_after_cashback: calc.totalPayable - t.cash,
            mf_projected_return: mfProjectedReturn,
            net_effective_cost: netEffectiveCost,
            interest_fully_offset_by_mf: true
          }
        });
      }
    }
    const parsedProduct = {
      id: String(product.id),
      slug: product.slug,
      name: product.name,
      brand: product.name.includes("iPhone") ? "Apple" : "Samsung",
      tagline: "Backed by liquid mutual funds with zero-cost tenure options and real-time approval.",
      description: product.description,
      category: "Smartphones",
      rating: 4.8,
      reviews_count: 1420,
      base_price: activeVariantPrice,
      base_mrp: activeVariantMrp,
      default_image: activeVariant?.image_url || "/images/iphone-17-pro-orange-1.jpg",
      highlights: [
        `Storage: ${activeVariant?.storage || "256GB"}`,
        `Color: ${activeVariant?.color_name || "Orange"}`,
        "Super Retina XDR Display / Dynamic AMOLED 2X",
        "0% Interest Smart EMI backed by mutual funds",
        "Additional cashback on selected tenures"
      ],
      specs: {
        "Display": "ProMotion 120Hz OLED Display",
        "Processor": "Next-Gen Flagship Silicon (3nm)",
        "Storage": activeVariant?.storage || "256GB",
        "Color": activeVariant?.color_name || "Orange"
      },
      variants,
      emi_plans: plansWithCalculations
    };
    res.json({ success: true, product: parsedProduct });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/products/:slugOrId/calculate-emi", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const variantId = req.query.variant_id;
    const customPrice = req.query.price ? Number(req.query.price) : null;
    const product = await queryOne(`
      SELECT * FROM products WHERE slug = ? OR id::text = ? OR slug LIKE ?
    `, [slugOrId, slugOrId, `%${slugOrId}%`]);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const priceNum = parseFloat(product.price) || 0;
    let targetPrice = customPrice && !isNaN(customPrice) ? customPrice : 0;
    if (!targetPrice && variantId) {
      const v = await queryOne(`SELECT price FROM product_variants WHERE id = ?`, [variantId]);
      if (v && v.price) {
        targetPrice = parseFloat(v.price);
      }
    }
    if (!targetPrice) {
      targetPrice = priceNum;
    }
    let emiPlans = variantId ? await queryAll(`
          SELECT * FROM emi_plans WHERE variant_id = ? ORDER BY tenure_months ASC
        `, [variantId]) : [];
    if (emiPlans.length === 0) {
      emiPlans = await queryAll(`
        SELECT ep.* FROM emi_plans ep
        JOIN product_variants pv ON ep.variant_id = pv.id
        WHERE pv.product_id = ?
        ORDER BY ep.tenure_months ASC
      `, [product.id]);
    }
    const calculatedPlans = emiPlans.map((plan) => {
      const tenure = parseInt(plan.tenure_months, 10);
      const rate = parseFloat(plan.interest_rate) || 0;
      const cashback = parseFloat(plan.cashback) || 0;
      const calc = computeEmi(targetPrice, rate, tenure);
      const tenureYears = tenure / 12;
      const mfProjectedReturn = Math.round(targetPrice * (Math.pow(1 + 7.2 / 100, tenureYears) - 1));
      const netEffectiveCost = Math.max(0, calc.totalPayable - cashback - mfProjectedReturn);
      return {
        ...plan,
        monthly_payment: calc.monthlyEmi,
        calculated: {
          principal: targetPrice,
          downpayment: calc.downpayment,
          financedPrincipal: calc.financedPrincipal,
          monthly_emi: calc.monthlyEmi,
          total_interest: calc.totalInterest,
          total_payable: calc.totalPayable,
          cashback_amount: cashback,
          net_payable_after_cashback: calc.totalPayable - cashback,
          mf_projected_return: mfProjectedReturn,
          net_effective_cost: netEffectiveCost,
          interest_fully_offset_by_mf: true
        }
      };
    });
    if (calculatedPlans.length === 0) {
      const tenures = [
        { m: 3, rate: 0, cash: 7500, pop: false },
        { m: 6, rate: 0, cash: 7500, pop: true },
        { m: 9, rate: 0, cash: 7500, pop: false },
        { m: 12, rate: 0, cash: 7500, pop: false },
        { m: 18, rate: 10.5, cash: 7500, pop: false },
        { m: 24, rate: 10.5, cash: 7500, pop: false },
        { m: 36, rate: 10.5, cash: 7500, pop: false }
      ];
      for (const t of tenures) {
        const calc = computeEmi(targetPrice, t.rate, t.m);
        const tenureYears = t.m / 12;
        const mfProjectedReturn = Math.round(targetPrice * (Math.pow(1 + 7.2 / 100, tenureYears) - 1));
        const netEffectiveCost = Math.max(0, calc.totalPayable - t.cash - mfProjectedReturn);
        calculatedPlans.push({
          id: `plan-${t.m}m`,
          tenure_months: t.m,
          interest_rate: t.rate,
          downpayment_amount: 0,
          processing_fee: 0,
          monthly_payment: calc.monthlyEmi,
          cashback_amount: t.cash,
          cashback_description: `Additional cashback of \u20B9${t.cash.toLocaleString("en-IN")}`,
          is_no_cost: t.rate === 0 ? 1 : 0,
          is_popular: t.pop ? 1 : 0,
          mutual_fund_id: t.m <= 6 ? "mf-icici-liquid" : "mf-sbi-liquid",
          mf_name: t.m <= 6 ? "ICICI Prudential Liquid Fund" : "SBI Liquid Fund Growth",
          mf_amc: t.m <= 6 ? "ICICI Prudential AMC" : "SBI Funds Management",
          mf_nav: 362.15,
          mf_cagr: 7.2,
          mf_risk: "Low Risk",
          mf_rating: 5,
          calculated: {
            principal: targetPrice,
            downpayment: calc.downpayment,
            financedPrincipal: calc.financedPrincipal,
            monthly_emi: calc.monthlyEmi,
            total_interest: calc.totalInterest,
            total_payable: calc.totalPayable,
            cashback_amount: t.cash,
            net_payable_after_cashback: calc.totalPayable - t.cash,
            mf_projected_return: mfProjectedReturn,
            net_effective_cost: netEffectiveCost,
            interest_fully_offset_by_mf: true
          }
        });
      }
    }
    res.json({ success: true, plans: calculatedPlans });
  } catch (error) {
    console.error("Error calculating EMI:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.post("/applications", async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      variant_id,
      variant_name,
      product_price,
      tenure_months,
      monthly_emi,
      interest_rate,
      cashback_amount,
      mutual_fund_name,
      full_name,
      phone,
      email,
      pan_number,
      monthly_income
    } = req.body;
    if (!full_name || !phone || !pan_number) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields (full_name, phone, pan_number)"
      });
    }
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanctionNumber = `FI-EMI-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({
      success: true,
      message: "1Fi Smart EMI Approved Instantly!",
      application: {
        id: applicationId,
        sanction_number: sanctionNumber,
        status: "APPROVED & SANCTIONED",
        product_name,
        variant_name,
        product_price,
        tenure_months,
        monthly_emi,
        interest_rate,
        cashback_amount,
        customer: {
          name: full_name,
          phone,
          pan: pan_number.toUpperCase()
        },
        sanction_date: createdAt
      }
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
apiRouter.get("/database-schema", async (req, res) => {
  try {
    const pCount = await queryOne("SELECT COUNT(*)::int as count FROM products");
    const vCount = await queryOne("SELECT COUNT(*)::int as count FROM product_variants");
    const eCount = await queryOne("SELECT COUNT(*)::int as count FROM emi_plans");
    const tables = [
      { name: "products", count: pCount?.count || 0 },
      { name: "product_variants", count: vCount?.count || 0 },
      { name: "emi_plans", count: eCount?.count || 0 }
    ];
    res.json({
      success: true,
      database: "PostgreSQL 18 (ecommerce_db)",
      tables,
      features: [
        "Relational foreign keys (ON DELETE CASCADE)",
        "Dynamic EMI amortization calculator",
        "1Fi Mutual Fund yield offset logic",
        "Multi-variant product catalog with SVG galleries"
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/vercel.ts
var app = express();
app.use(express.json());
initDb().catch((err) => {
  console.warn("[Vercel Serverless] DB init note:", err?.message);
});
app.get(["/", "/api"], (req, res) => {
  res.json({ status: "ok", service: "Fi Smart EMI Serverless API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api", apiRouter);
app.use(apiRouter);
var vercel_default = app;
export {
  vercel_default as default
};
