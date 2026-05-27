import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const NEWSLETTER_RATE_LIMIT = { limit: 3, windowSec: 300 };

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  phone: z
    .string()
    .trim()
    .min(8, 'Numéro invalide')
    .optional()
    .or(z.literal('')),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'newsletter', NEWSLETTER_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((issue) => issue.message).join(', '),
        },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase n’est pas encore configuré localement. Ajoutez vos clés dans .env.local pour activer la newsletter.',
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { email, phone } = parsed.data;

    const { error } = await supabase.from('newsletter_subscriptions').insert({
      email,
      phone: phone || null,
      source: 'website',
      subscribed_at: new Date().toISOString(),
    });

    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Cette adresse email est déjà inscrite.' },
        { status: 409 }
      );
    }

    if (error) {
      logger.error('Newsletter route error:', 'Error', error);
      return NextResponse.json(
        { success: false, error: 'Impossible de finaliser l\'inscription.' },
        { status: 500 }
      );
    }

    revalidateTag('newsletter-count', 'max');

    return NextResponse.json({
      success: true,
      message: 'Merci ! Vous êtes maintenant inscrit à notre newsletter.',
    });
  } catch (error) {
    logger.error('Newsletter route unexpected error:', 'Error', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    );
  }
}
