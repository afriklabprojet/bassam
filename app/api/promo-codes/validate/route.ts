import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// POST /api/promo-codes/validate
// Body: { code: string, orderAmount: number }
export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json() as { code: string; orderAmount: number };
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('id, code, type, value, min_order_amount, max_uses, uses_count, expires_at, is_active')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Code promo invalide' });
    }

    if (!data.is_active) {
      return NextResponse.json({ valid: false, error: 'Ce code promo est désactivé' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a expiré' });
    }

    if (data.max_uses !== null && data.uses_count >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a atteint son nombre maximum d\'utilisations' });
    }

    if (data.min_order_amount && orderAmount < data.min_order_amount) {
      return NextResponse.json({
        valid: false,
        error: `Montant minimum requis : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(data.min_order_amount)}`,
      });
    }

    return NextResponse.json({
      valid: true,
      type: data.type as 'percentage' | 'fixed',
      value: data.value as number,
    });
  } catch (err) {
    logger.error('[POST /api/promo-codes/validate]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
