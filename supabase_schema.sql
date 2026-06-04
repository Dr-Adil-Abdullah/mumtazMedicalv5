-- ============================================
-- Mumtaz Medical v5 - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  shop_name TEXT,
  shop_address TEXT,
  shop_phone TEXT,
  tax_rate NUMERIC DEFAULT 0,
  sync_enabled BOOLEAN DEFAULT false,
  super_key_1 TEXT,
  super_key_2 TEXT,
  super_key_3 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ STAFF ============
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  short_code TEXT,
  pin_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  must_change_pin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT,
  brand TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PRODUCT BATCHES ============
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'regular',
  phone TEXT,
  pending_amount NUMERIC DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SUPPLIERS ============
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SALES ============
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  cashier_id UUID,
  payment_mode TEXT,
  total_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  is_return BOOLEAN DEFAULT false,
  original_sale_id UUID,
  approval_status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SALE ITEMS ============
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  batch_id UUID,
  quantity INTEGER,
  unit_price NUMERIC,
  total_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ EXPENSES ============
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  sale_id UUID REFERENCES sales(id),
  is_enabled BOOLEAN DEFAULT true,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PURCHASE LIST ============
CREATE TABLE IF NOT EXISTS purchase_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ LOGS ============
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  details JSONB
);

-- ============ PARTIAL PAYMENTS ============
CREATE TABLE IF NOT EXISTS partial_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  amount NUMERIC,
  received_by UUID,
  payment_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DAY SESSIONS ============
CREATE TABLE IF NOT EXISTS day_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opened_by UUID,
  closed_by UUID,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_cash NUMERIC DEFAULT 0,
  closing_cash NUMERIC DEFAULT 0,
  notes TEXT
);

-- ============ SYNC QUEUE (local only - can be ignored in Supabase) ============
-- This table is only used locally in Dexie

-- Enable Row Level Security (optional - disable for simplicity with anon key)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (for development)
CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all" ON staff FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON product_batches FOR ALL USING (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all" ON logs FOR ALL USING (true);
CREATE POLICY "Allow all" ON partial_payments FOR ALL USING (true);
CREATE POLICY "Allow all" ON day_sessions FOR ALL USING (true);

-- Insert default settings row
INSERT INTO settings (id, shop_name, sync_enabled) 
VALUES (1, 'Mumtaz Medical', true)
ON CONFLICT (id) DO NOTHING;