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
