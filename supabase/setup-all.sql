-- VIP Parfumerie Bar - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES categories(id),
  gender TEXT CHECK (gender IN ('homme', 'femme', 'mixte')),
  stock_quantity INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  user_id UUID REFERENCES auth.users(id),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'website',
  is_active BOOLEAN DEFAULT TRUE
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'card', 'cash_on_delivery')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_gender ON products(gender);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (TRUE);

-- Products: Public read
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (TRUE);

-- Newsletter: Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  WITH CHECK (TRUE);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order items: Users can only see items from their orders
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Audit logs: Service role only
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data for categories
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Parfums Homme', 'homme', 'Des fragrances masculines puissantes et raffinées', 1),
  ('Parfums Femme', 'femme', 'Des senteurs féminines élégantes et envoûtantes', 2),
  ('Parfums Mixtes', 'mixte', 'Des fragrances unisexes modernes', 3);

-- ═══════════════════════════════════════════════════════════════
-- Migration: Champs étendus + Politiques Admin
-- ═══════════════════════════════════════════════════════════════
-- VIP Parfumerie Bar — Schema Migration: Extended product fields + Admin RLS
-- Run in Supabase SQL Editor AFTER initial schema.sql

-- ══════════════════════════════════════════════════════════════════════════
-- 1. Extended product columns for product detail page
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS concentration TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS volume TEXT DEFAULT NULL;

COMMENT ON COLUMN products.notes IS 'Olfactory pyramid: {"top": [...], "heart": [...], "base": [...]}';
COMMENT ON COLUMN products.concentration IS 'e.g. Eau de Toilette, Eau de Parfum, Extrait';
COMMENT ON COLUMN products.volume IS 'e.g. 50 ml, 100 ml';

-- Index for faster lookups by slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. Admin role helper
--    We store admin in auth.users.raw_app_meta_data.role = 'admin'
--    Set via Supabase dashboard or:
--      UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
--      WHERE id = '<admin-user-uuid>';
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. Admin RLS Policies — CRUD on key tables
-- ══════════════════════════════════════════════════════════════════════════

-- Products: Admin can insert/update/delete
CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- Categories: Admin can insert/update/delete
CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin can delete categories"
  ON categories FOR DELETE
  USING (is_admin());

-- Orders: Admin can view all orders + update status
CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING (is_admin());

-- Order items: Admin can view all order items
CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

-- Profiles: Admin can view all profiles (for admin dashboard)
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Newsletter: Admin can view/delete subscriptions
CREATE POLICY "Admin can view newsletter subscriptions"
  ON newsletter_subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can delete newsletter subscriptions"
  ON newsletter_subscriptions FOR DELETE
  USING (is_admin());

-- Audit logs: Admin can view (in addition to service_role)
CREATE POLICY "Admin can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- 4. Order items INSERT policy (for creating orders)
-- ══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can insert order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- 5. Profiles INSERT policy (for handle_new_user trigger)
-- ══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. Update seed data with extended fields
-- ══════════════════════════════════════════════════════════════════════════

-- Example: add extended fields to products (if they exist in DB)
-- You can run individual updates like:
-- UPDATE products SET
--   notes = '{"top":["Bergamote","Poivre"],"heart":["Lavande","Muscade"],"base":["Ambroxan","Cèdre"]}',
--   concentration = 'Eau de Toilette',
--   volume = '100 ml'
-- WHERE slug = 'dior-sauvage-edt';
