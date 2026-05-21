import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type CustomCreationSnapshot,
  formatCustomCreationSnapshot,
  getCustomCreationFormula,
} from '@/lib/custom-creation';
import type { OrderItem } from './orders';

export type IncomingOrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  customCreation?: CustomCreationSnapshot;
};

type NormalizeOrderItemsResult =
  | { ok: true; items: OrderItem[]; notes: string[] }
  | { ok: false; error: string };

function getCustomProductSlug(formulaId: string) {
  return `creation-personnalisee-${formulaId}`;
}

async function ensureCustomCreationProduct(
  supabase: SupabaseClient,
  snapshot: CustomCreationSnapshot
): Promise<{ id: string } | { error: string }> {
  const formula = getCustomCreationFormula(snapshot.formulaId);
  const slug = getCustomProductSlug(formula.id);

  const { data: existing, error: selectError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (selectError) {
    console.error('[custom product lookup]', selectError.message);
    return { error: 'Impossible de verifier la formule personnalisée' };
  }

  if (existing) return { id: existing.id };

  const insertResult = await supabase
    .from('products')
    .insert({
      name: `Creation personnalisée - ${formula.name}`,
      slug,
      brand: 'VIP Parfumerie Bar',
      description: formula.description,
      price: formula.price,
      stock_quantity: 999,
      is_featured: false,
      images: ['/images/products/product-placeholder.svg'],
      notes: { type: 'custom_creation', formulaId: formula.id },
      concentration: 'Sur-mesure',
      volume: formula.volume,
    })
    .select('id')
    .limit(1);

  const created = insertResult.data?.[0];
  const insertError = insertResult.error;

  if (insertError || !created) {
    console.error('[custom product create]', insertError?.message);
    return { error: 'Impossible de préparer la formule personnalisée' };
  }

  return { id: created.id };
}

export async function normalizeOrderItemsForPersistence(
  supabase: SupabaseClient,
  items: IncomingOrderItem[]
): Promise<NormalizeOrderItemsResult> {
  const normalizedItems: OrderItem[] = [];
  const notes: string[] = [];

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { ok: false, error: 'Quantité invalide' };
    }

    if (!item.customCreation) {
      normalizedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
      continue;
    }

    const formula = getCustomCreationFormula(item.customCreation.formulaId);
    const product = await ensureCustomCreationProduct(supabase, item.customCreation);
    if ('error' in product) return { ok: false, error: product.error };

    normalizedItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: formula.price,
    });
    notes.push(`Creation personnalisée:\n${formatCustomCreationSnapshot(item.customCreation)}`);
  }

  return { ok: true, items: normalizedItems, notes };
}