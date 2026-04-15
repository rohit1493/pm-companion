# Avatar System — Design Spec
**Date:** 2026-04-15  
**Branch target:** `fix/all-35-issues` → merge, then `feature/avatar-system`  
**Authored by:** Anmoll (design) + Claude (spec)  
**For:** Rohit

---

## What This Is

A fighter identity system. User picks one of 6 avatar characters **once** during onboarding. That choice drives **all accent colors** across the entire app — nav, progress bars, cards, buttons, streak counter, glow effects, mood-shift cycling.

Art type (archetype) = learning path only. Avatar = visual identity only. Clean split.

---

## The 6 Fighters

| Key | Name | Accent | Mood Palette | Emoji | Type |
|---|---|---|---|---|---|
| `sensei` | Sensei | `#a78bfa` | `['#a78bfa','#c4b5fd','#7c3aed']` | 🧠 | Mental |
| `shadow` | Shadow | `#06b6d4` | `['#06b6d4','#22d3ee','#0891b2']` | ⚡ | Action |
| `kata` | Kata | `#fb923c` | `['#fb923c','#fdba74','#ea580c']` | 🔥 | Action |
| `guardian` | Guardian | `#3b82f6` | `['#3b82f6','#60a5fa','#1d4ed8']` | 🛡️ | Action |
| `monk` | Monk | `#34d399` | `['#34d399','#6ee7b7','#059669']` | ☯️ | Mental |
| `chronicler` | Chronicler | `#fbbf24` | `['#fbbf24','#fde68a','#d97706']` | 📜 | Mental |

**Mood palette** = the 3 colors cycled every 15s by the existing `useArchetypeTheme` hook (unchanged cadence).

---

## Rules

1. **Selected once.** AvatarPicker only shows in onboarding if `user_profiles.avatar IS NULL`. Once set, it never appears in the main flow again.
2. **Re-pick lives in settings.** Profile menu has a "Change Fighter" row → opens AvatarPicker modal → same burst animation → patches DB → CSS vars update live.
3. **Avatar ≠ archetype.** Never derive accent from archetype. Never derive path from avatar. They are independent.
4. **Burst fires on every pick.** Both onboarding and settings re-pick trigger the full burst + "Power Acquired" banner. It's a moment, not a modal.

---

## Files to Change

### 1. DB migration — NEW

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_avatar_to_user_profiles.sql
ALTER TABLE user_profiles
  ADD COLUMN avatar text NOT NULL DEFAULT 'sensei'
  CHECK (avatar IN ('sensei','shadow','kata','guardian','monk','chronicler'));
```

Run via Supabase dashboard or CLI. Default `'sensei'` backfills existing users cleanly.

---

### 2. `lib/avatar-themes.ts` — NEW

```ts
export type AvatarKey = 'sensei' | 'shadow' | 'kata' | 'guardian' | 'monk' | 'chronicler'

export interface AvatarTheme {
  key: AvatarKey
  label: string
  emoji: string
  type: 'mental' | 'action'
  title: string          // tagline shown in picker + burst banner
  powers: [string, string, string]  // 3 power-up tags
  accent: string         // primary hex
  moodPalette: [string, string, string]  // for 15s mood cycling
}

export const AVATAR_THEMES: Record<AvatarKey, AvatarTheme> = {
  sensei: {
    key: 'sensei', label: 'Sensei', emoji: '🧠', type: 'mental',
    title: '"Reads the room before it reads you"',
    powers: ['Deep Recall', 'Pattern Lock', 'Mentor Vision'],
    accent: '#a78bfa',
    moodPalette: ['#a78bfa', '#c4b5fd', '#7c3aed'],
  },
  shadow: {
    key: 'shadow', label: 'Shadow', emoji: '⚡', type: 'action',
    title: '"Moves before you see them coming"',
    powers: ['Silent Read', 'Edge Strike', 'Ghost Mode'],
    accent: '#06b6d4',
    moodPalette: ['#06b6d4', '#22d3ee', '#0891b2'],
  },
  kata: {
    key: 'kata', label: 'Kata', emoji: '🔥', type: 'action',
    title: '"Perfect form, every single rep"',
    powers: ['Form Lock', 'Precision Chain', 'Flow State'],
    accent: '#fb923c',
    moodPalette: ['#fb923c', '#fdba74', '#ea580c'],
  },
  guardian: {
    key: 'guardian', label: 'Guardian', emoji: '🛡️', type: 'action',
    title: '"Takes the hit so the team doesn\'t"',
    powers: ['Risk Shield', 'Team Buffer', 'Iron Frame'],
    accent: '#3b82f6',
    moodPalette: ['#3b82f6', '#60a5fa', '#1d4ed8'],
  },
  monk: {
    key: 'monk', label: 'Monk', emoji: '☯️', type: 'mental',
    title: '"Processes 10x while others react"',
    powers: ['Calm Core', 'Signal Filter', 'Zero Noise'],
    accent: '#34d399',
    moodPalette: ['#34d399', '#6ee7b7', '#059669'],
  },
  chronicler: {
    key: 'chronicler', label: 'Chronicler', emoji: '📜', type: 'mental',
    title: '"Sees the whole story, not just today"',
    powers: ['Memory Vault', 'Story Thread', 'Long View'],
    accent: '#fbbf24',
    moodPalette: ['#fbbf24', '#fde68a', '#d97706'],
  },
}

export function getAvatarTheme(key: string): AvatarTheme {
  return AVATAR_THEMES[key as AvatarKey] ?? AVATAR_THEMES.sensei
}
```

---

### 3. `AvatarBurst.tsx` — NEW

Radial burst + particle explosion + "Power Acquired" banner.

**Props:**
```ts
interface AvatarBurstProps {
  fighter: AvatarTheme
  originX: number       // px from left (card center)
  originY: number       // px from top (card center)
  onComplete: () => void
}
```

**Behaviour:**
- On mount: spawn 20–24 particles from origin, radial burst circle expands to full viewport, "Power Acquired / [Name] / [title]" banner scales in center
- Auto-calls `onComplete` after 1.4s
- Unmounts itself via `onComplete`

**Animation sequence:**
1. `t=0ms` — particles fire from origin
2. `t=0ms` — burst circle begins expanding (550ms, ease cubic-bezier(0.2,0,0.3,1))
3. `t=80ms` — shockwave ring expands (400ms)
4. `t=200ms` — burst circle fades out (300ms)
5. `t=300ms` — banner scales in (250ms, spring)
6. `t=1100ms` — banner fades out
7. `t=1400ms` — `onComplete()` fires

Use `position: fixed, z-index: 9999, pointer-events: none` for overlay. Remove from DOM via `onComplete`.

---

### 4. `AvatarPicker.tsx` — NEW

Full-screen or modal fighter picker.

**Props:**
```ts
interface AvatarPickerProps {
  currentAvatar?: AvatarKey   // highlights current selection
  onSelect: (key: AvatarKey, originX: number, originY: number) => void
}
```

**Layout:**
- Title: "Choose your fighter"
- 2×3 grid of fighter cards (or 3×2 on desktop)
- Each card: emoji (large), name, type badge (Mental/Action), tagline, 3 power-up tags
- Currently selected card has accent border + glow
- On tap: record card center coordinates → call `onSelect(key, x, y)`

**The picker does NOT fire the burst.** The parent (OnboardingFlow or ProfileMenu) receives `onSelect`, spawns AvatarBurst, then calls the DB write + CSS var update in `onComplete`.

---

### 5. `app/onboarding/OnboardingFlow.tsx` — MODIFY

Insert AvatarPicker as step 0.

```tsx
// Add to state
const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(null)
const [showBurst, setShowBurst] = useState(false)
const [burstOrigin, setBurstOrigin] = useState({ x: 0, y: 0 })
const [step, setStep] = useState<'avatar' | 'path' | ...>('avatar')

// Render logic
if (step === 'avatar') {
  return (
    <>
      <AvatarPicker onSelect={(key, x, y) => {
        setAvatarKey(key)
        setBurstOrigin({ x, y })
        setShowBurst(true)
      }} />
      {showBurst && avatarKey && (
        <AvatarBurst
          fighter={getAvatarTheme(avatarKey)}
          originX={burstOrigin.x}
          originY={burstOrigin.y}
          onComplete={() => {
            setShowBurst(false)
            setStep('path')  // advance to archetype questions
          }}
        />
      )}
    </>
  )
}
```

**Guard:** Only show avatar step if `user_profiles.avatar IS NULL`. Add this check to the onboarding entry condition.

On final onboarding submit: include `avatar: avatarKey` in the profile creation payload.

---

### 6. `hooks/useArchetypeTheme.ts` → rename to `useAvatarTheme.ts` — MODIFY

Change the color source from archetype palette to avatar palette.

```ts
// BEFORE (reads archetype colors)
const theme = ARCHETYPE_THEMES[archetypeKey]
const palette = theme.moodPalette

// AFTER (reads avatar colors)
const theme = getAvatarTheme(avatarKey)
const palette = theme.moodPalette
```

Everything else stays identical:
- `setInterval` at 15s cycling `palette[0] → [1] → [2] → [0]`
- CSS vars: `--avatar-accent`, `--avatar-accent-dim`, `--avatar-accent-glow`, `--avatar-accent-mid`
- Inject on mount, clean up on unmount

**CSS var rename:** `--archetype-primary` → `--avatar-accent` (update all Tailwind/CSS references site-wide — global find/replace).

---

### 7. `app/api/feed/route.ts` — MODIFY

Add `avatar` to the feed response.

```ts
// In the profile query, select avatar alongside existing fields
const { data: profile } = await supabase
  .from('user_profiles')
  .select('archetype, archetypeDisplay, archetypeKey, avatar, ...')  // add avatar
  .eq('user_id', userId)
  .single()

// Add to response payload
return NextResponse.json({
  ...existingFields,
  archetypeKey: profile.archetypeKey,  // keep — still used for content routing
  avatar: profile.avatar ?? 'sensei',  // add
})
```

---

### 8. `app/feed/FeedClient.tsx` — MODIFY

Pass `avatar` to theme hook instead of `archetypeKey`.

```tsx
// BEFORE
useArchetypeTheme(feedData.archetypeKey)

// AFTER
useAvatarTheme(feedData.avatar)
```

`archetypeKey` stays in FeedClient for content routing (path label, article sequence). It no longer touches theme/color.

---

### 9. Nav component — MODIFY

Add avatar chip to nav. Location: top-right, next to streak counter.

```tsx
const theme = getAvatarTheme(feedData.avatar)

<div className="nav-avatar-chip" style={{ color: 'var(--avatar-accent)' }}>
  <span>{theme.emoji}</span>
  <span>{theme.label}</span>
</div>
```

Tapping chip → opens profile/settings sheet.

---

### 10. Profile/Settings component — MODIFY

Add "Change Fighter" row above Notifications.

```tsx
<SettingsRow
  label={`${currentTheme.emoji} Change Fighter`}
  value={`Currently: ${currentTheme.label}`}
  onPress={() => setShowAvatarPicker(true)}
/>

{showAvatarPicker && (
  <>
    <AvatarPicker
      currentAvatar={currentAvatar}
      onSelect={(key, x, y) => {
        setShowAvatarPicker(false)
        // fire burst, then patch DB + update CSS vars
        triggerBurst(key, x, y, async () => {
          await supabase
            .from('user_profiles')
            .update({ avatar: key })
            .eq('user_id', userId)
          useAvatarTheme(key)  // update vars live
        })
      }}
    />
  </>
)}
```

---

## Acceptance Criteria

- [ ] New user: AvatarPicker is first screen in onboarding. Archetype questions come after.
- [ ] Selecting a fighter triggers burst animation. Banner shows "Power Acquired — [Name]".
- [ ] After burst: entire app (nav, cards, progress bar, streak, glow) reflects fighter's accent.
- [ ] Mood shifts still cycle (15s) using avatar's 3-color palette.
- [ ] `user_profiles.avatar` is set on profile creation. No null values after onboarding.
- [ ] Returning user: AvatarPicker does NOT appear in onboarding if `avatar` is already set.
- [ ] Settings has "Change Fighter" row. Tapping re-opens AvatarPicker.
- [ ] Re-pick fires same burst animation, patches DB, updates CSS vars live.
- [ ] `archetypeKey` is unaffected — still routes content correctly.
- [ ] Default fallback: if `avatar` is null for any reason, render as `sensei`.

---

## What Does NOT Change

- Archetype derivation logic (unchanged)
- Content sequencing per archetype (unchanged)
- Quiz mechanic (unchanged)
- Streak logic (unchanged)
- Mood shift timing: 15s setInterval (unchanged, just fed different colors)
- `archetypeKey` in feed API (kept, still needed for content routing)

---

## Notes for Rohit

1. The burst animation JS/CSS is fully prototyped in the brainstorm mockup at `.superpowers/brainstorm/`. Reference `accent-transition-v1.html` for the exact animation implementation — it's production-ready JavaScript that can be ported to React directly.

2. The fighter card CSS designs (full-body vs bust portrait) are in `avatar-select-v2.html`. Use as visual reference for the AvatarPicker card designs.

3. `--avatar-accent` CSS var is the single source of truth. Any component that needs the accent color reads this var. Never hardcode fighter colors in component styles.

4. Run the DB migration before deploying the UI changes. The feed API will fail if the `avatar` column doesn't exist when it tries to select it.
