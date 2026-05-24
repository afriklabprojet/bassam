import { NextResponse } from 'next/server';
import { getShippingConfig } from '@/lib/shipping';

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
