import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Logged-in users don't need landing or auth pages — send them straight to feed
    if (pathname === '/' || pathname === '/auth') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }

    // Prevent logged-in users with a completed profile from re-doing onboarding
    if (pathname === '/onboarding') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('archetype')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile?.archetype) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
    }
  } else {
    // Unauthenticated users can't access protected routes
    if (pathname.startsWith('/feed') || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/auth', '/onboarding', '/feed/:path*', '/dashboard/:path*'],
}
