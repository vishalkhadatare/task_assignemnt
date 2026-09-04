import React, { useState, useEffect } from 'react';
import { X, Database, Table, Code, RefreshCw, Layers, Copy, Check, Terminal, Play, Search, Sparkles } from 'lucide-react';

interface DbSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QueryItem {
  id: string;
  title: string;
  description: string;
  category: 'Overview' | 'Variants' | 'EMI Plans' | 'Filters';
  sql: string;
}

const VERIFICATION_QUERIES: QueryItem[] = [
  {
    id: 'q-counts',
    title: '1. Check Table Counts (products, variants, emi_plans)',
    description: 'Verify total row counts across all three PostgreSQL tables.',
    category: 'Overview',
    sql: `SELECT 'products' AS table_name, COUNT(*) AS total_rows FROM products
UNION ALL
SELECT 'product_variants' AS table_name, COUNT(*) AS total_rows FROM product_variants
UNION ALL
SELECT 'emi_plans' AS table_name, COUNT(*) AS total_rows FROM emi_plans;`
  },
  {
    id: 'q-products',
    title: '2. All Products with Variant Counts & Min/Max Pricing',
    description: 'List all products with active prices, MRPs, and total variant counts.',
    category: 'Overview',
    sql: `SELECT 
    p.id,
    p.name,
    p.slug,
    COUNT(pv.id) AS total_variants,
    MIN(pv.price) AS min_price,
    MAX(pv.price) AS max_price,
    MIN(pv.mrp) AS min_mrp
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.slug
ORDER BY p.id ASC;`
  },
  {
    id: 'q-iphone-variants',
    title: '3. All Variants for Apple iPhone 17 Pro',
    description: 'View all 9 variants (Cosmic Orange, Silver, Deep Blue across 256GB, 512GB, 1TB) with tiered pricing.',
    category: 'Variants',
    sql: `SELECT 
    pv.id AS variant_id,
    p.name AS product_name,
    pv.color,
    pv.storage,
    pv.price,
    pv.mrp,
    (pv.mrp - pv.price) AS instant_savings,
    pv.image_url
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.slug = 'iphone-17-pro'
ORDER BY 
    CASE 
        WHEN pv.color LIKE '%Orange%' THEN 1
        WHEN pv.color LIKE '%Silver%' THEN 2
        WHEN pv.color LIKE '%Blue%' THEN 3
        ELSE 4
    END,
    pv.price ASC;`
  },
  {
    id: 'q-samsung-variants',
    title: '4. All Variants for Samsung Galaxy S24 Ultra',
    description: 'View all 6 variants (Titanium Black, Titanium Gray, Titanium Violet across 256GB, 512GB).',
    category: 'Variants',
    sql: `SELECT 
    pv.id AS variant_id,
    p.name AS product_name,
    pv.color,
    pv.storage,
    pv.price,
    pv.mrp,
    (pv.mrp - pv.price) AS instant_savings,
    pv.image_url
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.slug = 'samsung-s24-ultra'
ORDER BY pv.color, pv.storage;`
  },
  {
    id: 'q-iphone-emi',
    title: '5. EMI Plans for iPhone 17 Pro (Cosmic Orange 256GB)',
    description: 'Fetch all tenure options (3 to 60 mos), interest rates, monthly payments, and cashback for a specific variant.',
    category: 'EMI Plans',
    sql: `SELECT 
    ep.id AS plan_id,
    p.name AS product,
    pv.color,
    pv.storage,
    pv.price AS total_price,
    ep.tenure_months,
    ep.interest_rate,
    ep.monthly_payment AS monthly_emi,
    ep.cashback,
    (ep.monthly_payment * ep.tenure_months) AS total_amount_payable
FROM emi_plans ep
JOIN product_variants pv ON ep.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE p.slug = 'iphone-17-pro' 
  AND pv.color = 'Cosmic Orange' 
  AND pv.storage = '256GB'
ORDER BY ep.tenure_months ASC;`
  },
  {
    id: 'q-samsung-emi',
    title: '6. EMI Plans for Samsung S24 Ultra (Titanium Black 256GB)',
    description: 'Fetch all EMI tenure options and monthly payments for Samsung Galaxy S24 Ultra.',
    category: 'EMI Plans',
    sql: `SELECT 
    ep.id AS plan_id,
    p.name AS product,
    pv.color,
    pv.storage,
    pv.price AS total_price,
    ep.tenure_months,
    ep.interest_rate,
    ep.monthly_payment AS monthly_emi,
    ep.cashback,
    (ep.monthly_payment * ep.tenure_months) AS total_amount_payable
FROM emi_plans ep
JOIN product_variants pv ON ep.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE p.slug = 'samsung-s24-ultra' 
  AND pv.color = 'Titanium Black' 
  AND pv.storage = '256GB'
ORDER BY ep.tenure_months ASC;`
  },
  {
    id: 'q-no-cost',
    title: '7. Find All "0% No-Cost EMI" Plans Across All Products',
    description: 'Filter plans where interest_rate = 0.00% to view all zero-cost financing tenures.',
    category: 'EMI Plans',
    sql: `SELECT 
    p.name AS product_name,
    pv.color,
    pv.storage,
    pv.price,
    ep.tenure_months,
    ep.interest_rate,
    ep.monthly_payment,
    ep.cashback
FROM emi_plans ep
JOIN product_variants pv ON ep.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE ep.interest_rate = 0.00
ORDER BY p.id, pv.id, ep.tenure_months;`
  },
  {
    id: 'q-lowest-emi',
    title: '8. Find Lowest Monthly EMI for Each Product',
    description: 'Aggregate and compute the minimum entry-level monthly payment for each smartphone.',
    category: 'Overview',
    sql: `SELECT 
    p.name AS product_name,
    p.slug,
    MIN(ep.monthly_payment) AS lowest_monthly_emi
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
JOIN emi_plans ep ON pv.id = ep.variant_id
GROUP BY p.id, p.name, p.slug
ORDER BY p.id ASC;`
  },
  {
    id: 'q-color-search',
    title: '9. Search Variants by Color / Finish (Orange, Blue, Black)',
    description: 'Search and inspect variants by color keywords across the entire catalog.',
    category: 'Filters',
    sql: `SELECT 
    p.name AS product,
    pv.color,
    pv.storage,
    pv.price,
    pv.image_url
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE LOWER(pv.color) LIKE '%orange%' 
   OR LOWER(pv.color) LIKE '%blue%'
   OR LOWER(pv.color) LIKE '%black%'
ORDER BY pv.price ASC;`
  }
];

export const DbSchemaModal: React.FC<DbSchemaModalProps> = ({ isOpen, onClose }) => {
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'queries' | 'schema' | 'apis'>('queries');
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [copiedAllQueries, setCopiedAllQueries] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
    }
  }, [isOpen]);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database-schema');
      const data = await res.json();
      setSchemaData(data);
    } catch (err) {
      console.error('Error fetching schema info:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyQuery = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const copyAllQueries = () => {
    const allSql = VERIFICATION_QUERIES.map(q => `-- ${q.title}\n-- ${q.description}\n${q.sql}\n`).join('\n');
    navigator.clipboard.writeText(allSql);
    setCopiedAllQueries(true);
    setTimeout(() => setCopiedAllQueries(false), 2000);
  };

  const copySqlDdl = () => {
    const ddl = `-- ====================================================================
-- 1Fi SDE1 Assignment — PostgreSQL Database Schema & Seed Data
-- Target Database: ecommerce_db
-- ====================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    mrp DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color VARCHAR(100),
    storage VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMI PLANS TABLE
CREATE TABLE IF NOT EXISTS emi_plans (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    monthly_payment DECIMAL(10,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    cashback DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
    navigator.clipboard.writeText(ddl);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-lg max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modalEnter border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-800/80 text-[#ff5e00] border border-gray-700/80 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Database & API Inspector
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#ff5e00]/20 text-[#ff8033] font-bold border border-[#ff5e00]/40">
                  PostgreSQL (ecommerce_db)
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Full-Stack Architecture Verification • Normalized Relational Tables, Ready-to-Run Queries & REST APIs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Record Counts Bar */}
        <div className="bg-gray-50/90 px-6 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#ff5e00]" />
              <span className="font-bold text-xs uppercase tracking-wider text-gray-700">Live PostgreSQL Record Counts</span>
            </div>
            <button
              onClick={fetchSchema}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-[#ff5e00] hover:text-[#e65500] font-bold cursor-pointer transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Counts</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2.5">
            {schemaData?.tables?.map((table: any) => (
              <div key={table.name} className="p-2.5 bg-white rounded-md border border-gray-200 text-center shadow-xs">
                <div className="text-gray-500 text-xs font-mono font-medium truncate">{table.name}</div>
                <div className="text-xl font-bold text-gray-900 mt-0.5">{table.count ?? '0'}</div>
                <div className="text-[10px] text-gray-400 font-medium">records</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('queries')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 cursor-pointer ${
                activeTab === 'queries'
                  ? 'border-[#ff5e00] text-[#ff5e00] bg-orange-50/60'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>SQL Queries ({VERIFICATION_QUERIES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 cursor-pointer ${
                activeTab === 'schema'
                  ? 'border-[#ff5e00] text-[#ff5e00] bg-orange-50/60'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>SQL DDL Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('apis')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 cursor-pointer ${
                activeTab === 'apis'
                  ? 'border-[#ff5e00] text-[#ff5e00] bg-orange-50/60'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>REST APIs (4)</span>
            </button>
          </div>

          {activeTab === 'queries' && (
            <button
              onClick={copyAllQueries}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-xs"
            >
              {copiedAllQueries ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">All Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Queries</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'schema' && (
            <button
              onClick={copySqlDdl}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-xs"
            >
              {copiedDdl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy DDL</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-800 bg-gray-50/50 flex-1">
          
          {/* TAB 1: SQL Queries with Individual Copy Buttons */}
          {activeTab === 'queries' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-md p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ready to Run in pgAdmin / psql: </span>
                  Each query is isolated and ready to copy. Click the <strong>Copy Query</strong> button on any card to copy that specific query directly into your clipboard.
                </div>
              </div>

              {VERIFICATION_QUERIES.map((q) => {
                const isCopied = copiedQueryId === q.id;
                return (
                  <div 
                    key={q.id} 
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs hover:border-gray-300 transition-all"
                  >
                    {/* Query Card Header */}
                    <div className="px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#ff5e00] flex-shrink-0" />
                        <h4 className="text-xs font-bold truncate text-gray-100">
                          {q.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => copyQuery(q.id, q.sql)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer shadow-xs ${
                          isCopied 
                            ? 'bg-emerald-600 text-white border border-emerald-500' 
                            : 'bg-gray-700/80 hover:bg-[#ff5e00] text-gray-100 hover:text-white border border-gray-600 hover:border-[#ff5e00]'
                        }`}
                        title="Copy SQL Query"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Query</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Query Description */}
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 font-medium">
                      {q.description}
                    </div>

                    {/* Code block */}
                    <pre className="p-3.5 text-xs font-mono text-emerald-400 bg-gray-950 overflow-x-auto leading-relaxed selection:bg-emerald-800 selection:text-white">
                      {q.sql}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SQL DDL Schema */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-950 border border-gray-800 overflow-hidden shadow-md">
                <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#ff5e00]" />
                    schema.sql (PostgreSQL 18 DDL)
                  </span>
                  <span className="text-[11px] text-gray-500">Normalized Relational Architecture</span>
                </div>

                <pre className="p-4 text-emerald-400 overflow-x-auto text-xs font-mono leading-relaxed max-h-[480px]">
{`-- ====================================================================
-- 1Fi SDE1 Assignment — PostgreSQL Database Schema & Seed Data
-- Target Database: ecommerce_db
-- ====================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    mrp DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color VARCHAR(100),
    storage VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMI PLANS TABLE
CREATE TABLE IF NOT EXISTS emi_plans (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    monthly_payment DECIMAL(10,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    cashback DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys cascade on delete to maintain clean referential integrity.
-- Seed data automatically provisions variants & dynamic EMI amortizations.`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Registered Express REST APIs */}
          {activeTab === 'apis' && (
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3.5 bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-500 card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-xs">GET</span>
                  <span className="font-bold text-gray-900">/api/products</span>
                </div>
                <span className="text-gray-500 font-sans text-xs">Catalog summary with variant counts & lowest EMIs</span>
              </div>

              <div className="p-3.5 bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-500 card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-xs">GET</span>
                  <span className="font-bold text-gray-900">/api/products/:slugOrId</span>
                </div>
                <span className="text-gray-500 font-sans text-xs">Full product details, all variants, and 7 EMI tenure plans</span>
              </div>

              <div className="p-3.5 bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-500 card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-xs">GET</span>
                  <span className="font-bold text-gray-900">/api/products/:slugOrId/calculate-emi</span>
                </div>
                <span className="text-gray-500 font-sans text-xs">Dynamic amortization recomputation for custom prices</span>
              </div>

              <div className="p-3.5 bg-white border border-gray-200 rounded-lg border-l-4 border-l-green-500 card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold text-xs">POST</span>
                  <span className="font-bold text-gray-900">/api/applications</span>
                </div>
                <span className="text-gray-500 font-sans text-xs">Loan sanction generator with approval reference</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            PostgreSQL Database: <span className="font-mono font-bold text-gray-800">ecommerce_db</span> (Port: 5432)
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

