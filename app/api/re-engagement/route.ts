import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = 'https://pm-companion-six.vercel.app'

export async function GET(request: NextRequest) {
  const headerSecret = request.headers.get('x-sync-secret')
  const querySecret = request.nextUrl.searchParams.get('secret')
  const validSecret = process.env.SYNC_SECRET || 'pm-companion-sync'
  if (headerSecret !== validSecret && querySecret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch all active path users with their email + streak data
  const { data: profiles } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, archetype, archetype_display, streak, streak_last_updated, last_active_at')
    .not('archetype', 'is', null)
    .neq('archetype', 'scanner')

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Get emails for these users
  const userIds = profiles.map((p) => p.user_id).filter(Boolean)
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const emailMap = new Map(
    (authUsers?.users || []).map((u) => [u.id, u.email])
  )

  const results: { email: string; trigger: string; sent: boolean }[] = []

  for (const profile of profiles) {
    const email = emailMap.get(profile.user_id)
    if (!email) continue

    const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null
    const streak = profile.streak || 0
    const displayName = profile.archetype_display || 'PM'

    // Trigger 1: 4–24hr since last active → streak at risk nudge
    if (lastActive && lastActive < fourHoursAgo && lastActive > twentyFourHoursAgo) {
      const { error } = await resend.emails.send({
        from: 'PM Dojo <onboarding@resend.dev>',
        to: email,
        subject: `Your ${streak}-day streak is waiting 🔥`,
        html: streakNudgeEmail(displayName, streak),
      })
      results.push({ email, trigger: 'streak_risk', sent: !error })
    }

    // Trigger 2: streak = 6 → one more day to PM Dojo score
    else if (streak === 6) {
      const { error } = await resend.emails.send({
        from: 'PM Dojo <onboarding@resend.dev>',
        to: email,
        subject: 'One more article. Your PM Dojo score unlocks tomorrow.',
        html: daySevenEmail(displayName),
      })
      results.push({ email, trigger: 'day_6', sent: !error })
    }

    // Trigger 3: 7+ days inactive → archetype re-engagement
    else if (lastActive && lastActive < sevenDaysAgo) {
      const { error } = await resend.emails.send({
        from: 'PM Dojo <onboarding@resend.dev>',
        to: email,
        subject: `${displayName} — your path is still waiting`,
        html: reEngagementEmail(displayName, profile.archetype_display || ''),
      })
      results.push({ email, trigger: '7day_inactive', sent: !error })
    }
  }

  const sent = results.filter((r) => r.sent).length
  return NextResponse.json({ sent, results })
}

function streakNudgeEmail(name: string, streak: number): string {
  return `
    <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F8FAFC;">
      <div style="background:white;border-radius:16px;padding:36px 32px;border:1px solid #E2E8F0;">
        <p style="font-family:'Georgia',serif;font-size:20px;color:#1E293B;margin-bottom:8px;">
          Your streak is at risk 🔥
        </p>
        <p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px;">
          You're on a <strong style="color:#1E293B;">${streak}-day streak</strong>.
          Read one article today to keep it alive — it takes less than 5 minutes.
        </p>
        <a href="${APP_URL}/feed" style="display:block;background:#4F46E5;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:500;">
          Continue reading →
        </a>
        <p style="font-size:12px;color:#94A3B8;margin-top:20px;text-align:center;">PM Dojo · pm-companion-six.vercel.app</p>
      </div>
    </div>`
}

function daySevenEmail(name: string): string {
  return `
    <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F8FAFC;">
      <div style="background:white;border-radius:16px;padding:36px 32px;border:1px solid #E2E8F0;">
        <p style="font-family:'Georgia',serif;font-size:20px;color:#1E293B;margin-bottom:8px;">
          One article away from your PM Dojo score 🎯
        </p>
        <p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px;">
          You've built a 6-day streak. Read one more article today and your
          <strong style="color:#1E293B;">PM Dojo score</strong> unlocks on your dashboard.
        </p>
        <a href="${APP_URL}/feed" style="display:block;background:#4F46E5;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:500;">
          Read Article 7 →
        </a>
        <p style="font-size:12px;color:#94A3B8;margin-top:20px;text-align:center;">PM Dojo · pm-companion-six.vercel.app</p>
      </div>
    </div>`
}

function reEngagementEmail(name: string, archetypeDisplay: string): string {
  return `
    <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F8FAFC;">
      <div style="background:white;border-radius:16px;padding:36px 32px;border:1px solid #E2E8F0;">
        <p style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4F46E5;margin-bottom:12px;">
          ${archetypeDisplay}
        </p>
        <p style="font-family:'Georgia',serif;font-size:20px;color:#1E293B;margin-bottom:8px;">
          Your path is still waiting.
        </p>
        <p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px;">
          You haven't read in a while. Your personalised 10-article path is right where you left it —
          no need to start over.
        </p>
        <a href="${APP_URL}/feed" style="display:block;background:#4F46E5;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:500;">
          Pick up where you left off →
        </a>
        <p style="font-size:12px;color:#94A3B8;margin-top:20px;text-align:center;">PM Dojo · pm-companion-six.vercel.app</p>
      </div>
    </div>`
}
