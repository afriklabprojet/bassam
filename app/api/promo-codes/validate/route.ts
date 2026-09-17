import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { formatPrice } from '@/lib/format';
import { validatePromoCode } from '@/lib/promo';

// POST /api/promo-codes/validate
// Body: { code: string, orderAmount: number }
export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json() as { code: string; orderAmount: number };
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await validatePromoCode(supabase, code, Number(orderAmount) || 0);

    if (!result.ok) {
      // Re-format the min-order-amount message with the app's currency formatter.
      const match = /^Montant minimum requis : (\d+(\.\d+)?)$/.exec(result.error);
      const error = match ? `Montant minimum requis : ${formatPrice(Number(match[1]))}` : result.error;
      return NextResponse.json({ valid: false, error });
    }

    return NextResponse.json({ valid: true, type: result.type, value: result.value });
  } catch (err) {
    logger.error('[POST /api/promo-codes/validate]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
