export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import OnboardingFlow from './OnboardingFlow'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in and already has a non-scanner archetype, skip onboarding
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('archetype')
      .eq('user_id', user.id)
      .not('archetype', 'is', null)
      .neq('archetype', 'scanner')
      .limit(1)
      .maybeSingle()

    if (profile) {
      redirect('/feed')
    }
  }

  return <OnboardingFlow />
}
