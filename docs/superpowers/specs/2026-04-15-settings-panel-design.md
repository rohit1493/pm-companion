# Settings Panel — Design Spec
**Date:** 2026-04-15
**Branch target:** `feature/settings-panel`
**For:** Rohit

---

## What This Is

A complete replacement of the current settings menu (which only has email + sign out). Full settings panel as a slide-in drawer from the right. Every row is wired to a real backend action.

Visual reference: `.superpowers/brainstorm/…/settings-panel-v2.html`

---

## Panel Sections (top to bottom)

### 1. Fighter Block
- Shows current fighter: emoji, name, tagline, 3 power-up tags
- **Change Fighter** button → opens `AvatarPicker` modal → full burst animation → patches `user_profiles.avatar`
- Accent color throughout panel comes from current avatar via `--avatar-accent` CSS var

### 2. User + Stats
- User initial avatar, display name, email (read-only here, editable in Profile)
- Stats row: **PM Edge Score** · **Day Streak** · **Articles Read** — all read from `user_profiles`

### 3. Learning Path
- Active archetype name + sub-label
- Progress bar: `current_article_index / total_articles` from `user_profiles`
- **Switch Path** → re-triggers archetype onboarding questions, resets `user_profiles.archetype` and `article_index` to 0

### 4. Email Reminders
- **Daily streak reminder toggle** — stores `reminder_enabled: boolean` in `user_profiles`
- **Send time** — time picker, stores `reminder_time: string` (e.g. `"08:00"`) in `user_profiles`
- When toggled off: Resend cron skips this user. When on: sends daily at their `reminder_time`.

### 5. Account
- **Profile** → inline edit sheet: display name + email. Patches `user_profiles.display_name` and Supabase auth email.

### 6. Bottom Actions
- **Sign Out** → `supabase.auth.signOut()`, redirect to `/auth`
- **Request Account Deletion** → inserts row into `deletion_requests` table (`user_id`, `requested_at`). Shows confirmation toast "We'll process within 72 hours." Does NOT immediately delete — manual review step for now.

---

## DB Changes

```sql
-- Add to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN reminder_time    text    NOT NULL DEFAULT '08:00';

-- New table for deletion requests
CREATE TABLE deletion_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed    boolean NOT NULL DEFAULT false
);
```

---

## Resend — Daily Streak Reminder

**How it works:**
1. Vercel cron job (`/api/cron/streak-reminder`) runs every hour
2. Queries `user_profiles` where `reminder_enabled = true` AND `reminder_time` matches current IST hour (e.g. `08:*`)
3. For each matched user: sends email via Resend with their streak count + today's article link
4. One email per user per day — guard with `last_reminder_sent_at` timestamp in `user_profiles`

```sql
-- Add guard column
ALTER TABLE user_profiles
  ADD COLUMN last_reminder_sent_at timestamptz;
```

**Cron query:**
```ts
// /api/cron/streak-reminder
const istHour = new Date().toLocaleTimeString('en-IN', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
}).slice(0,5)

const { data: users } = await supabase
  .from('user_profiles')
  .select('user_id, email, display_name, streak_count, reminder_time, last_reminder_sent_at')
  .eq('reminder_enabled', true)
  .eq('reminder_time', istHour)

for (const user of users) {
  // Skip if already sent today
  const today = new Date().toDateString()
  if (user.last_reminder_sent_at && new Date(user.last_reminder_sent_at).toDateString() === today) continue

  await resend.emails.send({
    from: 'PM Dojo <hello@pmdojo.app>',
    to: user.email,
    subject: `🔥 ${user.streak_count}-day streak — don't break it`,
    html: streakReminderTemplate(user),
  })

  await supabase
    .from('user_profiles')
    .update({ last_reminder_sent_at: new Date().toISOString() })
    .eq('user_id', user.user_id)
}
```

**Timezone:** IST only for now. All times stored and compared in IST. No per-user timezone field needed.

**Vercel cron config (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/cron/streak-reminder",
    "schedule": "0 * * * *"
  }]
}
```

---

## Files to Create / Modify

| File | Status | What |
|---|---|---|
| `components/SettingsPanel.tsx` | NEW | Full panel component. Slide-in drawer. Reads user state, dispatches actions. |
| `components/ProfileEditSheet.tsx` | NEW | Inline sheet for editing display name + email. |
| `app/api/settings/reminder/route.ts` | NEW | PATCH endpoint — updates `reminder_enabled` + `reminder_time` in `user_profiles` |
| `app/api/settings/profile/route.ts` | NEW | PATCH endpoint — updates `display_name`, triggers Supabase auth email update |
| `app/api/settings/deletion-request/route.ts` | NEW | POST endpoint — inserts into `deletion_requests` |
| `app/api/cron/streak-reminder/route.ts` | NEW | Hourly cron — queries eligible users, sends Resend emails |
| `vercel.json` | MODIFY | Add cron schedule for streak-reminder |
| `user_profiles` migration | DB | Add `reminder_enabled`, `reminder_time`, `last_reminder_sent_at` columns |
| `deletion_requests` migration | DB | New table |
| Nav / layout | MODIFY | Wire settings icon/chip to open `SettingsPanel` |

---

## Acceptance Criteria

- [ ] Settings panel opens from nav avatar chip or hamburger menu
- [ ] Fighter block shows current avatar with correct accent color
- [ ] "Change Fighter" opens AvatarPicker with burst animation
- [ ] Stats (PM Edge, Streak, Articles) are live from DB, not hardcoded
- [ ] Learning path shows current archetype + real progress bar
- [ ] "Switch Path" re-triggers archetype onboarding and resets progress
- [ ] Streak reminder toggle persists to `user_profiles.reminder_enabled`
- [ ] Send time persists to `user_profiles.reminder_time`
- [ ] Cron job sends exactly one email per day to eligible users at their chosen IST time
- [ ] Profile edit saves display name + email
- [ ] Sign Out calls `supabase.auth.signOut()` and redirects to `/auth`
- [ ] Request Deletion inserts into `deletion_requests`, shows toast, does NOT delete account
- [ ] Panel accent color matches selected fighter throughout

---

## What We Removed (and Why)

| Removed | Reason |
|---|---|
| Push notifications | Email only — no native app, no service worker setup needed |
| Re-engagement emails toggle | Handled by product logic, not a user setting |
| Timezone picker | India-only focus for now. All times IST. |
| Delete Account (immediate) | Too risky without review. Request + 72hr manual process is safer. |
