'use server'

import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// ── In-memory rate limiter (3 tentatives / 10 min par IP) ────────────────────
// Note: fonctionne sur instance unique. Pour multi-instances, migrer vers Redis.
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX = 3

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = _rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// Email subscription schema
const subscribeSchema = z.object({
  email: z.email({ message: 'Email invalide' }),
  phone: z.string().optional(),
})

type SubscribeInput = z.infer<typeof subscribeSchema>

type ActionResult = {
  success: boolean
  message: string
  error?: string
}

/**
 * Server Action: Newsletter Subscription
 * 
 * Follows 7-Step Security Pattern:
 * 1. Rate limit (in-memory, 3 req/10 min/IP — migrer vers Redis pour multi-instances)
 * 2. Auth verification (optional for newsletter)
 * 3. Zod validation
 * 4. Authorization check (N/A for public endpoint)
 * 5. Mutation
 * 6. Granular revalidateTag()
 * 7. Audit log
 */
export async function subscribeToNewsletter(
  input: SubscribeInput
): Promise<ActionResult> {
  try {
    // ── Extraire l'IP dès le début (needed for rate limit + audit log) ───────
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
      headersList.get('x-real-ip') ??
      'unknown'

    // Step 1: Rate limit ─────────────────────────────────────────────────────
    if (!checkRateLimit(ip)) {
      return {
        success: false,
        message: '',
        error: 'Trop de tentatives. Réessayez dans 10 minutes.',
      }
    }

    // Step 2: Auth verification (optional for newsletter)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return {
        success: false,
        message: '',
        error: 'Supabase n’est pas encore configuré localement. Ajoutez vos clés dans .env.local pour activer la newsletter.',
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Step 3: Zod validation
    const validationResult = subscribeSchema.safeParse(input)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ')
      return {
        success: false,
        message: '',
        error: errors
      }
    }

    const { email, phone } = validationResult.data

    // Step 4: Authorization check (N/A for newsletter)

    // Step 5: Mutation
    const { error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        phone,
        user_id: user?.id || null,
        subscribed_at: new Date().toISOString(),
        source: 'website',
      })

    if (insertError) {
      // Check if already subscribed
      if (insertError.code === '23505') {
        return {
          success: false,
          message: '',
          error: 'Cette adresse email est déjà inscrite'
        }
      }

      logger.error('newsletter.action', 'Insert failed')
      return {
        success: false,
        message: '',
        error: 'Une erreur est survenue lors de l\'inscription'
      }
    }

    // Step 6: Granular revalidateTag (Next.js 16 requires a cache profile)
    revalidateTag('newsletter-count', 'max')

    // Step 7: Audit log (async, non-blocking)
    // Don't await to avoid blocking the response
    supabase
      .from('audit_logs')
      .insert({
        action: 'newsletter_subscription',
        user_id: user?.id || null,
        metadata: { email, hasPhone: !!phone },
        ip_address: ip,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) logger.warn('newsletter.action', 'Audit log failed')
      })

    return {
      success: true,
      message: 'Merci ! Vous êtes maintenant inscrit à notre newsletter.'
    }
  } catch (error) {
    logger.error('newsletter.action', 'Unexpected error', error)
    return {
      success: false,
      message: '',
      error: 'Une erreur inattendue est survenue'
    }
  }
}
