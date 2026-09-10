import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Le point 6 du plan exige un décrément de stock atomique côté SQL pour
 * prévenir la survente en cas de commandes concurrentes sur le dernier
 * article. La condition de course elle-même ne peut être reproduite qu'avec
 * un vrai PostgreSQL, mais ce test structurel garantit que la migration
 * suit bien le pattern atomique (conditional UPDATE + ROW_COUNT check +
 * RAISE EXCEPTION) et non un read-modify-write vulnérable.
 */
describe('migration 20260520000000_atomic_stock', () => {
  const sql = readFileSync(
    path.resolve(__dirname, '../../supabase/migrations/20260520000000_atomic_stock.sql'),
    'utf8'
  );

  it('utilise un UPDATE conditionnel `stock_quantity >= NEW.quantity`', () => {
    // C'est le cœur de l'atomicité : Postgres verrouille la ligne pendant
    // l'UPDATE, la condition évalue la valeur *actuelle*, donc deux
    // transactions concurrentes ne peuvent pas toutes deux décrémenter
    // sous zéro.
    expect(sql).toMatch(/UPDATE\s+products[\s\S]+stock_quantity\s*-\s*NEW\.quantity/i);
    expect(sql).toMatch(/stock_quantity\s*>=\s*NEW\.quantity/i);
  });

  it('vérifie ROW_COUNT et lève une exception en cas de stock insuffisant', () => {
    expect(sql).toMatch(/GET\s+DIAGNOSTICS[\s\S]+ROW_COUNT/i);
    expect(sql).toMatch(/RAISE\s+EXCEPTION[\s\S]+insufficient_stock/i);
  });

  it('attache le trigger en BEFORE INSERT sur order_items', () => {
    expect(sql).toMatch(/BEFORE\s+INSERT\s+ON\s+order_items/i);
    expect(sql).toMatch(/FOR\s+EACH\s+ROW/i);
  });

  it('ne réalise pas de read-modify-write en plpgsql (pas de SELECT stock puis UPDATE)', () => {
    // Un pattern vulnérable ressemblerait à :
    //   SELECT stock_quantity INTO v FROM products WHERE …;
    //   IF v < NEW.quantity THEN RAISE …;
    //   UPDATE products SET stock_quantity = v - NEW.quantity …;
    // On vérifie que la fonction ne contient pas ce SELECT préalable.
    const fn = sql.match(/decrement_product_stock[\s\S]+?\$\$;/i)?.[0] ?? '';
    expect(fn).not.toMatch(/SELECT\s+stock_quantity/i);
  });

  it('restaure le stock lorsqu\'une commande passe à cancelled', () => {
    expect(sql).toMatch(/restore_product_stock_on_cancel/);
    expect(sql).toMatch(/AFTER\s+UPDATE\s+OF\s+status\s+ON\s+orders/i);
    expect(sql).toMatch(/stock_quantity\s*\+\s*oi\.quantity/i);
  });
});
