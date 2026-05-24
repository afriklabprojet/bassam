import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

function createResponse(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
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
  })
}

function handleMissingSupabaseConfig(isPublicRoute: boolean, request: NextRequest, response: NextResponse) {
  if (!isPublicRoute) {
    return redirectTo('/auth/login', request)
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isPublicRoute = isPublicPath(pathname)

  const response = createResponse(request)

  // Allow the storefront to run even before Supabase env vars are configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    return handleMissingSupabaseConfig(isPublicRoute, request, response)
  }

  const supabase = createSupabaseClient(request, response, supabaseUrl, supabaseAnonKey)

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser() as { data: { user: AuthUser } }

  const adminResponse = handleAdminRoute(pathname, user, request, response)
  if (adminResponse) return adminResponse

  const protectedResponse = handleProtectedRoute(pathname, isPublicRoute, user, request)
  if (protectedResponse) return protectedResponse

  const authPageResponse = handleAuthPage(pathname, user, request)
  if (authPageResponse) return authPageResponse

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