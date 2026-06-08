import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ─── CSP (nonce-based, set per request) ──────────────────────────────────────

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? `'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'nonce-${nonce}' 'strict-dynamic'`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "media-src 'self' blob: https://videos.pexels.com https://*.supabase.co https://*.supabase.in",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.jeko.africa",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://formsubmit.co",
  ].join('; ')
}

type AuthUser = {
  app_metadata?: {
    role?: string
  }
} | null

const PUBLIC_ROUTES = [
  '/',
  '/a-propos',
  '/contact',
  '/collections',
  '/produits',
  '/services',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/callback',
  '/admin/login',
  '/api/health',
  '/api/newsletter',
  '/api/orders',
  '/api/payment/initiate',
  '/api/payment/webhook',
  '/api/products',
  '/api/promo-codes',
  '/api/reviews',
  '/api/shipping-config',
  '/api/consultation',
  '/panier',
  '/commande',
  '/cgv',
  '/mentions',
  '/confidentialite',
]

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function getUserRole(user: AuthUser) {
  return user?.app_metadata?.role
}

function redirectTo(pathname: string, request: NextRequest) {
  return NextResponse.redirect(new URL(pathname, request.url))
}

function createResponse(requestHeaders: Headers) {
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

function createSupabaseClient(
  request: NextRequest,
  response: NextResponse,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function handleMissingSupabaseConfig(isPublicRoute: boolean, request: NextRequest, response: NextResponse) {
  if (!isPublicRoute) {
    const { pathname } = request.nextUrl
    const target = pathname.startsWith('/admin') ? '/admin/login' : '/auth/login'
    return redirectTo(target, request)
  }
  return response
}

function handleAdminRoute(pathname: string, user: AuthUser, request: NextRequest, response: NextResponse) {
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')
  const isAdminLogin = pathname === '/admin/login'

  if (isAdminLogin && getUserRole(user) === 'admin') {
    return redirectTo('/admin', request)
  }

  if (!isAdminRoute || isAdminLogin) {
    return null
  }

  if (!user || getUserRole(user) !== 'admin') {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { error: user ? 'Accès refusé' : 'Authentification requise' },
        { status: user ? 403 : 401 }
      )
    }

    return redirectTo('/admin/login', request)
  }

  return response
}

function handleProtectedRoute(pathname: string, isPublicRoute: boolean, user: AuthUser, request: NextRequest) {
  if (isPublicRoute || user) {
    return null
  }

  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

function handleAuthPage(pathname: string, user: AuthUser, request: NextRequest) {
  const isAuthEntryPage = pathname === '/auth/login' || pathname === '/auth/signup'

  if (isAuthEntryPage && user) {
    return redirectTo('/compte', request)
  }

  return null
}

function shouldResolveUser(pathname: string, isPublicRoute: boolean) {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return true
  }

  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    return true
  }

  return !isPublicRoute
}

function addCspToResponse(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('Content-Security-Policy', buildCsp(nonce))
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isPublicRoute = isPublicPath(pathname)

  // Build a mutable copy of the request headers that includes the nonce.
  // Next.js 16 reads the nonce from the 'content-security-policy' request header
  // (not 'x-nonce') via parseRequestHeaders → getScriptNonceFromHeader.
  // We must forward the full CSP string in the request headers so the renderer
  // can stamp every <script> tag with the matching nonce automatically.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', buildCsp(nonce))

  // response carries both the forwarded request headers AND the CSP response header
  const response = createResponse(requestHeaders)
  addCspToResponse(response, nonce)

  // Allow the storefront to run even before Supabase env vars are configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    const fallback = handleMissingSupabaseConfig(isPublicRoute, request, response)
    addCspToResponse(fallback, nonce)
    return fallback
  }

  const supabase = createSupabaseClient(request, response, supabaseUrl, supabaseAnonKey)

  if (!shouldResolveUser(pathname, isPublicRoute)) {
    return response
  }

  let user: AuthUser = null
  const { data, error: authError } = await supabase.auth.getUser()
  if (!authError) {
    user = data.user as AuthUser
  }
  // authError is expected when refresh token is expired/reused — treat as unauthenticated

  const adminResponse = handleAdminRoute(pathname, user, request, response)
  if (adminResponse) {
    addCspToResponse(adminResponse as NextResponse, nonce)
    return adminResponse
  }

  const protectedResponse = handleProtectedRoute(pathname, isPublicRoute, user, request)
  if (protectedResponse) {
    addCspToResponse(protectedResponse as NextResponse, nonce)
    return protectedResponse
  }

  const authPageResponse = handleAuthPage(pathname, user, request)
  if (authPageResponse) {
    addCspToResponse(authPageResponse as NextResponse, nonce)
    return authPageResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images folder
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icons|images|videos|.*[.](?:svg|png|jpg|jpeg|gif|webp|mp4|webm|json|js)$).*)',
  ],
}