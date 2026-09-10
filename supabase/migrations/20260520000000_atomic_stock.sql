-- ─────────────────────────────────────────────────────────────────────────
-- Atomic stock decrement for order_items
--
-- Prevents overselling under concurrency by using a single conditional
-- UPDATE (PostgreSQL row-level locking) instead of a read-modify-write
-- pattern. Two concurrent inserts on the last unit of a product will now
-- reliably result in one success and one failure — never two successes.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Decrement on order_items INSERT ──────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_rows INT;
BEGIN
  -- Atomic conditional update: only succeeds if enough stock remains.
  -- PostgreSQL locks the matching row for the duration of the UPDATE,
  -- so concurrent transactions serialize on this row and cannot both
  -- observe the same pre-decrement value.
  UPDATE products
     SET stock_quantity = stock_quantity - NEW.quantity,
         updated_at     = NOW()
   WHERE id = NEW.product_id
     AND stock_quantity >= NEW.quantity;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RAISE EXCEPTION 'insufficient_stock: produit % (demandé: %)',
      NEW.product_id, NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_decrement_stock ON order_items;

CREATE TRIGGER trg_order_items_decrement_stock
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_stock();

-- ── Restore stock when an order is cancelled ─────────────────────────────
-- Complements the decrement above: if an order transitions to a cancelled
-- state (either explicitly, or by a failed payment webhook), we return the
-- reserved units to the products table so they can be resold.
CREATE OR REPLACE FUNCTION restore_product_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE products p
       SET stock_quantity = p.stock_quantity + oi.quantity,
           updated_at     = NOW()
      FROM order_items oi
     WHERE oi.order_id = NEW.id
       AND p.id = oi.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_restore_stock_on_cancel ON orders;

CREATE TRIGGER trg_orders_restore_stock_on_cancel
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_stock_on_cancel();
