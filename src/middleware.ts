import { NextRequest, NextResponse } from 'next/server'

// Routes qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les routes publiques et les assets
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/sw-custom.js' ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Si Supabase n'est pas configuré → accès libre (mode offline)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  // Vérifier la session via les cookies Supabase (format sb-<ref>-auth-token)
  const cookies = request.headers.get('cookie') || ''
  const hasSession =
    cookies.includes('sb-') && cookies.includes('auth-token')

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
