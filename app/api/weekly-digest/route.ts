import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://pm-companion-six.vercel.app'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-sync-secret')
  const validSecret = process.env.SYNC_SECRET
  if (!validSecret) {
    return NextResponse.json({ error: 'SYNC_SECRET env var not configured' }, { status: 500 })
  }
  if (secret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Last 7 days window
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  // Get all users with their emails from auth
  // TODO: add cursor pagination for >1000 users
  const { data: authUsersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })
  const users = authUsersData?.users || []

  const results: { email: string; sent: boolean; articles: number }[] = []

  for (const user of users) {
    if (!user.email) continue

    // Get last week's reads for this user
    const { data: reads } = await supabaseAdmin
      .from('daily_articles')
      .select('assigned_date, articles(title, url, source, topics)')
      .eq('user_id', user.id)
      .eq('read', true)
      .gte('assigned_date', weekAgoStr)
      .order('assigned_date', { ascending: false })

    if (!reads || reads.length === 0) continue

    // Collect unique topics covered
    const topicsSet = new Set<string>()
    for (const r of reads) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const art = r.articles as any
      for (const t of art?.topics || []) {
        topicsSet.add(t)
      }
    }
    const topicsCovered = Array.from(topicsSet)

    // Build article list HTML
    const articleLines = reads.map(r => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = r.articles as any
      if (!a) return ''
      return `<li style="margin-bottom:10px"><a href="${a.url}" style="color:#4F46E5;text-decoration:none;font-weight:500">${a.title}</a><br><span style="color:#94A3B8;font-size:12px">${a.source}</span></li>`
    }).filter(Boolean).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:white;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">
      <!-- Header -->
      <div style="background:#4F46E5;padding:28px 32px">
        <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0 0 4px;letter-spacing:0.06em;text-transform:uppercase">PM Companion</p>
        <h1 style="color:white;font-size:22px;font-weight:600;margin:0;line-height:1.3">Your week in review</h1>
      </div>

      <!-- Body -->
      <div style="padding:28px 32px">
        <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 20px">
          Last week you read <strong style="color:#1E293B">${reads.length} article${reads.length !== 1 ? 's' : ''}</strong>
          ${topicsCovered.length > 0 ? `covering <strong style="color:#1E293B">${topicsCovered.join(', ')}</strong>` : ''}.
          Here's what you got through:
        </p>

        <ul style="padding:0;margin:0 0 24px;list-style:none">
          ${articleLines}
        </ul>

        <a href="${APP_URL}/feed"
           style="display:block;background:#4F46E5;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
          Read today's article →
        </a>
      </div>

      <!-- Footer -->
      <div style="padding:20px 32px;border-top:1px solid #F1F5F9">
        <p style="color:#CBD5E1;font-size:12px;margin:0;text-align:center">
          PM Companion · You're receiving this because you signed up for weekly digests.
        </p>
        <p style="font-size:11px;color:#666;text-align:center;margin-top:32px;">
          <a href="${APP_URL}/unsubscribe?uid=${user.id}" style="color:#666;">Unsubscribe</a> · PM Dojo
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'PM Companion <onboarding@resend.dev>',
        to: user.email,
        subject: `You read ${reads.length} articles last week 📚`,
        html,
      })
      results.push({ email: user.email, sent: true, articles: reads.length })
    } catch {
      results.push({ email: user.email, sent: false, articles: reads.length })
    }
  }

  return NextResponse.json({ sent: results.filter(r => r.sent).length, results })
}
