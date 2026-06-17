-- Allow deleting products even when they appear in order_items.
-- We preserve order history by setting product_id to NULL on delete
-- rather than blocking the deletion.
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
