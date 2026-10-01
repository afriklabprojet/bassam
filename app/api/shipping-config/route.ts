import { NextResponse } from 'next/server';
import { getShippingConfig } from '@/lib/shipping';

// Next.js requires a static literal here (must match REVALIDATE_SHORT_SEC in lib/constants.ts)
export const revalidate = 60;

export async function GET() {
  try {
    const config = await getShippingConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
