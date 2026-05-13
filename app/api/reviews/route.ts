import { NextRequest, NextResponse } from 'next/server';
import { getApprovedReviews, submitReview } from '@/lib/supabase/reviews';

/** GET /api/reviews — avis approuvés (public) */
export async function GET() {
  try {
    const reviews = await getApprovedReviews(9);
    return NextResponse.json({ reviews }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/reviews — soumettre un nouvel avis (en attente de modération) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ville, texte, rating } = body;

    // Validation basique côté serveur
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
    }
    if (!ville || typeof ville !== 'string' || ville.trim().length < 2) {
      return NextResponse.json({ error: 'Ville invalide' }, { status: 400 });
    }
    if (!texte || typeof texte !== 'string' || texte.trim().length < 10) {
      return NextResponse.json({ error: 'Avis trop court (10 caractères minimum)' }, { status: 400 });
    }
    if (texte.trim().length > 500) {
      return NextResponse.json({ error: 'Avis trop long (500 caractères maximum)' }, { status: 400 });
    }
    const safeRating = typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : 5;

    const result = await submitReview({
      name: name.trim().slice(0, 80),
      ville: ville.trim().slice(0, 80),
      texte: texte.trim().slice(0, 500),
      rating: safeRating,
      source: 'website',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Avis soumis, en attente de validation.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
