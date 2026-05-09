-- Migration: Add payment_reference column to orders
-- Stores the Jeko Africa transaction ID for webhook reconciliation

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_reference
  ON orders (payment_reference)
  WHERE payment_reference IS NOT NULL;
