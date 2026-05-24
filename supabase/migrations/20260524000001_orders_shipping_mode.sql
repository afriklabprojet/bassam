-- Add shipping_mode_id to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_mode_id TEXT;

COMMENT ON COLUMN orders.shipping_mode_id IS 'ID of the selected delivery mode (matches ShippingConfig.modes[].id)';
