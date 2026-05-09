'use server'

import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Email subscription schema
const subscribeSchema = z.object({
  email: z.string().email('Email invalide'),
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
 * 1. Rate limit (TODO: implement with Upstash Redis)
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
    // Step 1: Rate limit (TODO: implement)
    // const rateLimitResult = await checkRateLimit(request.ip)
    // if (!rateLimitResult.success) {
    //   return { success: false, error: 'Trop de tentatives' }
    // }

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

      console.error('Newsletter subscription error:', insertError)
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
        ip_address: 'TODO', // Extract from headers
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error('Audit log error:', error)
      })

    return {
      success: true,
      message: 'Merci ! Vous êtes maintenant inscrit à notre newsletter.'
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return {
      success: false,
      message: '',
      error: 'Une erreur inattendue est survenue'
    }
  }
}
