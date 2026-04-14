import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { getTheme } from '@/lib/archetype-themes'
import { FANGClimberAvatar } from '@/components/avatars/FANGClimberAvatar'
import { StartupClimberAvatar } from '@/components/avatars/StartupClimberAvatar'
import { AIFirstPMAvatar } from '@/components/avatars/AIFirstPMAvatar'
import { GrowthPMAvatar } from '@/components/avatars/GrowthPMAvatar'
import { ScannerAvatar } from '@/components/avatars/ScannerAvatar'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pm-companion-six.vercel.app'

async function getShareData(userId: string) {
  const [profileRes, progressRes] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('streak, archetype, archetype_display, archetype_tagline')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true),
  ])

  const profile = profileRes.data
  const totalCompleted = progressRes.count ?? 0

  return {
    streak: profile?.streak ?? 0,
    totalCompleted,
    archetype: profile?.archetype ?? null,
    archetypeDisplay: profile?.archetype_display ?? 'PM Dojo',
    archetypeTagline: profile?.archetype_tagline ?? '',
  }
}

function AvatarForArchetype({ archetype, size, primaryColor, secondaryColor, tertiaryColor }: {
  archetype: string | null
  size: number
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
}) {
  const props = { size, primaryColor, secondaryColor, tertiaryColor, animated: false }
  if (archetype === 'startup_climber') return <StartupClimberAvatar {...props} />
  if (archetype === 'ai_first_pm') return <AIFirstPMAvatar {...props} />
  if (archetype === 'growth_pm') return <GrowthPMAvatar {...props} />
  if (archetype === 'scanner') return <ScannerAvatar {...props} />
  return <FANGClimberAvatar {...props} />
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const { streak, totalCompleted, archetypeDisplay } = await getShareData(userId)

  return {
    title: `${streak} day streak — ${archetypeDisplay} on PM Dojo`,
    description: `I've completed ${totalCompleted} articles and built a ${streak}-day reading streak on PM Dojo. Every PM is drowning in content but starving for progress — PM Dojo tells you exactly what to read next.`,
    openGraph: {
      title: `${streak} day streak 🔥`,
      description: `${totalCompleted} articles completed · ${archetypeDisplay}`,
      siteName: 'PM Dojo',
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { streak, totalCompleted, archetype, archetypeDisplay, archetypeTagline } = await getShareData(userId)
  const theme = getTheme(archetype)
  const streakEmoji = streak >= 14 ? '🔥' : streak >= 7 ? '⚡' : streak >= 3 ? '📈' : '📖'

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bgGradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${theme.primary}33`,
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: `0 32px 80px rgba(0,0,0,0.4), 0 0 60px ${theme.glow}`,
        backdropFilter: 'blur(12px)',
      }}>

        {/* PM Dojo wordmark */}
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: theme.primary,
          marginBottom: '28px',
        }}>
          PM Dojo
        </p>

        {/* Avatar */}
        <div style={{
          width: '88px',
          height: '88px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: `${theme.primary}18`,
          border: `2px solid ${theme.primary}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AvatarForArchetype
            archetype={archetype}
            size={60}
            primaryColor={theme.primary}
            secondaryColor={theme.secondary}
            tertiaryColor={theme.tertiary}
          />
        </div>

        {/* Archetype name */}
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: theme.primary,
          marginBottom: '4px',
        }}>
          {archetypeDisplay}
        </p>
        {archetypeTagline && (
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.5,
            marginBottom: '28px',
          }}>
            {archetypeTagline}
          </p>
        )}

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
        }}>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${theme.primary}22`,
            borderRadius: '14px',
            padding: '16px 12px',
          }}>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '36px',
              fontWeight: 800,
              color: '#f6fafe',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {streak}{streakEmoji}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              day streak
            </p>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${theme.primary}22`,
            borderRadius: '14px',
            padding: '16px 12px',
          }}>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '36px',
              fontWeight: 800,
              color: '#f6fafe',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {totalCompleted}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              articles done
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href={APP_URL}
          style={{
            display: 'block',
            background: theme.primary,
            color: 'white',
            borderRadius: '12px',
            padding: '14px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '0.04em',
          }}
        >
          Build your PM path →
        </a>

        <p style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          marginTop: '14px',
          letterSpacing: '0.04em',
        }}>
          pmdojo.app
        </p>
      </div>
    </div>
  )
}
