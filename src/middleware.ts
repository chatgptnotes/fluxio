import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'flownexus_session'

// Routes that require custom session authentication
const _protectedRoutes = ['/admin']

// Routes that require admin role
const _adminRoutes = ['/admin']

// Public routes (no auth required)
const _publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/unauthorized']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Check for our custom session cookie for admin routes
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Handle admin routes with custom session auth
  if (pathname.startsWith('/admin')) {
    if (!sessionToken) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Note: Role verification happens in the AuthGuard component
    // since we cannot access the database directly in middleware
    return response
  }

  // Handle CSTPS readings route - require session
  if (pathname === '/cstps-pipeline/readings') {
    if (!sessionToken) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Permission verification happens client-side via useAuth
    return response
  }

  // Check if Supabase credentials are configured for other protected routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, check for custom session only
  if (!supabaseUrl || !supabaseKey) {
    // For protected dashboard routes, allow if they have a custom session
    if (pathname.startsWith('/dashboard') &&
        !pathname.startsWith('/dashboard/reports') &&
        !sessionToken) {
      // Skip auth in development when no Supabase configured
      console.warn('Supabase credentials not configured. Skipping authentication.')
      return response
    }
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access if user has either Supabase auth OR custom session
  const isAuthenticated = !!user || !!sessionToken

  // Protected routes that require authentication
  // Exclude /dashboard/reports from authentication (public access)
  if (pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/dashboard/reports')) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    (pathname === '/login' || pathname === '/signup') &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/cstps-pipeline/readings', '/login', '/signup'],
}
