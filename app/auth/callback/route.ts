import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') || '/feed'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/feed'

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // Cookies can't be set in some edge cases — non-fatal
              }
            },
          },
        }
      )
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('exchangeCodeForSession error:', error.message)
        return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url))
      }

      // For default redirects (not explicit next= like password reset), check if the
      // user has completed onboarding. First-time Google OAuth users have no profile.
      if (next === '/feed') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('archetype')
            .eq('user_id', user.id)
            .maybeSingle()
          if (!profile?.archetype) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }
        }
      }
    } catch (err) {
      console.error('callback route exception:', err)
      const msg = err instanceof Error ? err.message : 'callback_failed'
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(msg)}`, request.url))
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
