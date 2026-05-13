import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Public routes - deny-by-default, but keep auth/public pages reachable
  const publicRoutes = [
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
    '/api/webhook',
    '/api/products',
    '/api/promo-codes',
    '/api/reviews',
    '/panier',
    '/commande',
    '/cgv',
    '/mentions',
    '/confidentialite',
  ]

  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Allow the storefront to run even before Supabase env vars are configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options as CookieOptions)
        })
      },
    },
  })

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Admin routes require admin role (except /admin/login)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isAdminLogin = pathname === '/admin/login'

  // Redirect authenticated admins away from admin login
  if (isAdminLogin && user) {
    const role = (user as unknown as { app_metadata?: { role?: string } }).app_metadata?.role
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  if (isAdminRoute && !isAdminLogin) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const role = (user as unknown as { app_metadata?: { role?: string } }).app_metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // Protected routes require authentication
  if (!isPublicRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Prevent authenticated users from accessing auth pages
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && user) {
    return NextResponse.redirect(new URL('/compte', request.url))
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icons|images|videos|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|json|js)$).*)',
  ],
}
