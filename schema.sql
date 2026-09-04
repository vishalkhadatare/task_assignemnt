-- ====================================================================
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

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- 1. Products
INSERT INTO products (name, slug, description, mrp, price)
VALUES
(
    'Apple iPhone 17 Pro',
    'iphone-17-pro',
    'Apple iPhone 17 Pro smartphone featuring aerospace titanium, A19 Pro silicon, Super Retina XDR display, and 0% Smart EMI backed by mutual funds.',
    139900,
    132900
),
(
    'Samsung Galaxy S24 Ultra',
    'samsung-s24-ultra',
    'Samsung Galaxy S24 Ultra smartphone featuring Galaxy AI, Snapdragon 8 Gen 3, titanium frame, and built-in S Pen.',
    134999,
    119999
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Product Variants (Tiered pricing by color and storage)
INSERT INTO product_variants (product_id, color, storage, price, mrp, image_url)
VALUES
-- iPhone 17 Pro (Cosmic Orange - Signature Edition)
(1, 'Cosmic Orange', '256GB', 132900, 139900, '/images/iphone-17-pro-orange-1.jpg'),
(1, 'Cosmic Orange', '512GB', 152900, 159900, '/images/iphone-17-pro-orange-1.jpg'),
(1, 'Cosmic Orange', '1TB',   172900, 179900, '/images/iphone-17-pro-orange-1.jpg'),

-- iPhone 17 Pro (Natural Silver - Classic Finish)
(1, 'Silver',        '256GB', 127900, 134900, '/images/iphone-17-pro-silver-1.png'),
(1, 'Silver',        '512GB', 147900, 154900, '/images/iphone-17-pro-silver-1.png'),
(1, 'Silver',        '1TB',   167900, 174900, '/images/iphone-17-pro-silver-1.png'),

-- iPhone 17 Pro (Deep Blue - Premium Finish)
(1, 'Deep Blue',     '256GB', 129900, 136900, '/images/iphone-17-pro-blue-1.png'),
(1, 'Deep Blue',     '512GB', 149900, 156900, '/images/iphone-17-pro-blue-1.png'),
(1, 'Deep Blue',     '1TB',   169900, 176900, '/images/iphone-17-pro-blue-1.png'),

-- Samsung S24 Ultra (Titanium Black)
(2, 'Titanium Black',  '256GB', 119999, 134999, '/images/s24-ultra-black-1.png'),
(2, 'Titanium Black',  '512GB', 129999, 144999, '/images/s24-ultra-black-1.png'),

-- Samsung S24 Ultra (Titanium Gray)
(2, 'Titanium Gray',   '256GB', 117999, 132999, '/images/s24-ultra-1.svg'),
(2, 'Titanium Gray',   '512GB', 127999, 142999, '/images/s24-ultra-1.svg'),

-- Samsung S24 Ultra (Titanium Violet)
(2, 'Titanium Violet', '256GB', 118999, 133999, '/images/s24-ultra-2.svg'),
(2, 'Titanium Violet', '512GB', 128999, 143999, '/images/s24-ultra-2.svg')
ON CONFLICT DO NOTHING;

-- 3. Seed EMI Plans dynamically based on product variants
DO $$
DECLARE
    v RECORD;
    tenures INT[] := ARRAY[3, 6, 9, 12, 18, 24, 36];
    t INT;
    rate NUMERIC;
    cb NUMERIC;
    monthly NUMERIC;
BEGIN
    FOR v IN SELECT id, price FROM product_variants LOOP
        FOREACH t IN ARRAY tenures LOOP
            IF t <= 6 THEN
                rate := 0;
            ELSIF t = 9 THEN
                rate := 10.5;
            ELSIF t = 12 THEN
                rate := 12.0;
            ELSIF t = 18 THEN
                rate := 13.5;
            ELSIF t = 24 THEN
                rate := 14.0;
            ELSE
                rate := 15.0;
            END IF;

            IF t = 6 THEN
                cb := 2500;
            ELSIF t = 12 THEN
                cb := 1500;
            ELSE
                cb := 0;
            END IF;

            IF rate = 0 THEN
                monthly := ROUND(v.price / t);
            ELSE
                monthly := ROUND((v.price * (rate / (12 * 100)) * POWER(1 + (rate / (12 * 100)), t)) / (POWER(1 + (rate / (12 * 100)), t) - 1));
            END IF;

            INSERT INTO emi_plans (variant_id, monthly_payment, tenure_months, interest_rate, cashback)
            VALUES (v.id, monthly, t, rate, cb);
        END LOOP;
    END LOOP;
END $$;
