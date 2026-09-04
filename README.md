# Dynamic Product Page & EMI Financing Engine

A modern, high-performance full-stack web application.

- **Live Demo**: [https://taskassignemnt.vercel.app](https://taskassignemnt.vercel.app/)
- **Video Demo**: [https://www.youtube.com/watch?v=7aex-C9LEe4](https://www.youtube.com/watch?v=7aex-C9LEe4)

The application features a responsive product detail interface connected to a backend REST API with a normalized **PostgreSQL** relational database schema (with zero-configuration standalone fallback), dynamic EMI plan calculation, mutual-fund collateral projection, and authentication.

---

## Requirements & Compliance Checklist

| Requirement | Implementation Details |
|---|---|
| **Product details** | Name, brand, variant (storage & finish), MRP, discounted price, and dynamic multi-angle image gallery. |
| **Available EMI plans** | Monthly payment, tenure (3, 6, 12, 24, 36, 48, 60 mos), interest rate (0% No-Cost & standard), and cashback rewards. |
| **Interactive selection** | Clickable plan cards with visual selection highlight, yield projections, and detailed breakdown. |
| **Proceed button** | Context-aware primary CTA (*"Buy on 12 Months EMI — ₹11,242/mo"*) triggering secure loan application. |
| **Backend API + DB** | Express 4 RESTful endpoints querying normalized PostgreSQL tables. Zero hardcoded UI data. |
| **Unique product URLs** | Semantic deep-linking (e.g. `/products/iphone-17-pro`, `/products/samsung-s24-ultra`). |
| **Multi-product & variants**| Flagship smartphone products with multiple color/storage variants each. |
| **PostgreSQL Schema** | Normalized schema with primary keys, foreign keys, cascade rules, and seed dataset in `schema.sql`. |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Vite
- **Backend**: Node.js, Express 4, RESTful APIs, CORS
- **Database**: 
  - **PostgreSQL**: Production DDL schema and seed scripts provided in [`schema.sql`](./schema.sql).
  - **Connection**: Native Node.js `pg.Pool` connection with automatic query placeholder mapping.
- **Routing**: Client & server URL routing supporting deep-links (`/products/:slug`).

---

##  PostgreSQL Relational Schema

The database follows a normalized relational structure defined in [`schema.sql`](./schema.sql):

```sql
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
```

---

##  REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieves all catalog products with min EMI and variant counts |
| `GET` | `/api/products/:slugOrId` | Fetches a single product by semantic slug or ID with all variants and EMI plans |
| `GET` | `/api/products/:slugOrId/calculate-emi` | Dynamically recomputes amortization, interest, and yield for custom downpayments/variants |
| `GET` | `/api/mutual-funds` | Returns partner AAA Liquid Mutual Funds backing the collateral |
| `POST` | `/api/applications` | Submits a loan application and returns instant sanction details |
| `GET` | `/api/database-schema` | Live schema inspection endpoint for verification |

### Example API Responses

#### 1. `GET /api/products`
```json
{
  "success": true,
  "products": [
    {
      "id": "prod-iphone-17-pro",
      "slug": "apple-iphone-17-pro-silver-256-gb-smart-phones-on-emi",
      "name": "Apple iPhone 17 Pro",
      "brand": "Apple",
      "base_price": 127400,
      "base_mrp": 134900,
      "default_image": "/images/iphone-17-pro-1.svg",
      "lowest_emi": 2738,
      "variant_count": 4
    }
  ]
}
```

#### 2. `GET /api/products/:slugOrId`
```json
{
  "success": true,
  "product": {
    "id": "prod-iphone-17-pro",
    "name": "Apple iPhone 17 Pro",
    "base_price": 127400,
    "base_mrp": 134900,
    "variants": [
      {
        "id": "var-iphone-orange-256",
        "name": "Cosmic Orange / 256 GB",
        "color_name": "Cosmic Orange",
        "color_hex": "#E46D29",
        "storage": "256 GB",
        "price": 127400,
        "mrp": 134900,
        "image_url": "/images/iphone-17-pro-1.svg",
        "gallery_images": [
          "/images/iphone-17-pro-1.svg",
          "/images/iphone-17-pro-2.svg",
          "/images/iphone-17-pro-3.svg",
          "/images/iphone-17-pro-4.svg",
          "/images/iphone-17-pro-5.svg"
        ]
      }
    ],
    "emi_plans": [
      {
        "tenure_months": 3,
        "interest_rate": 0,
        "is_no_cost": 1,
        "cashback_amount": 7500,
        "calculated": {
          "monthly_emi": 42467,
          "mf_projected_return": 2246,
          "net_effective_cost": 117655
        }
      },
      {
        "tenure_months": 12,
        "interest_rate": 0,
        "is_no_cost": 1,
        "cashback_amount": 7500,
        "calculated": {
          "monthly_emi": 10617,
          "mf_projected_return": 9186,
          "net_effective_cost": 110718
        }
      }
    ]
  }
}
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### 2. Installation
```bash
git clone https://github.com/vishalkhadatare/1fi-sde1-assignment.git
cd 1fi-sde1-assignment
npm install
```

### 3. Run Locally
```bash
npm run dev
```
The application will launch on **http://localhost:3001** (or port `3000`).

### 4. Optional: Run with PostgreSQL
To connect to an external or local PostgreSQL database instance:
```bash
psql -U postgres -d onefi_db -f schema.sql
```

### 5. Production Build & Lint
```bash
npm run lint    # TypeScript type-checking (tsc --noEmit)
npm run build   # Vite production build
```
