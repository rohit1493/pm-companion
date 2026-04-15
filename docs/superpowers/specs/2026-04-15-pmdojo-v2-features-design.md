# PM Dojo V2 Features — Design Spec
**Date:** 2026-04-15
**Status:** Approved, ready for implementation
**Branch target:** `feat/v2-features` off `main`

---

## Overview

Five systems that take PM Dojo from a functional feed to a complete learning loop. All systems are additive — no existing behaviour is removed. The implementation builds on the existing Supabase + Next.js App Router stack.

**Systems covered:**
1. `weak_area_tags` — content dimension tagging (foundational)
2. PM Edge Score — per-dimension skill signal updated after every quiz
3. Quiz Q3 + Streak Shield — optional summary earns 1-day streak protection
4. Path Completion + Path 2 — end-of-path celebration and next path construction
5. Returning User States — gap-aware banner at top of feed

---

## 1. Data Model

All changes are additive. One migration file, all `ALTER TABLE ADD COLUMN IF NOT EXISTS`.

### `articles` table

```sql
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS weak_area_tags text[] DEFAULT '{}';
```

Valid values (enforced at enrichment time): `strategy`, `execution`, `data`, `stakeholders`, `sense`.

### `user_profiles` table

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS edge_score           jsonb,
  ADD COLUMN IF NOT EXISTS streak_shield        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_shield_earned timestamptz,
  ADD COLUMN IF NOT EXISTS path_number          integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_active_at       timestamptz;
```

**`edge_score` shape:**
```json
{ "productStrategy": 55, "execution": 55, "dataThinking": 55 }
```

Null until first quiz completed. Seeded on first quiz (see Section 3).

---

## 2. Content Enrichment Pipeline

**File:** `app/api/sync-articles/route.ts`

### 2a. Groq prompt additions

Add two new fields to `buildEnrichPrompt`:

```
"weak_area_tags": ["strategy", "execution"],
// 1–3 tags from ONLY this set: strategy, execution, data, stakeholders, sense

"hooks": {
  "faang_climber": "...",
  "startup_climber": "...",
  "ai_first_pm": "...",
  "growth_pm": "...",
  "scanner": "..."
}
// One hook per archetype. Same article, different tone per archetype.
// Format: specific pain + surprising claim + implied payoff
```

Same strict-retry pattern as `category`: if `weak_area_tags` contains values outside the allowed set, retry once with a stricter prompt. If still invalid, store `[]` — article remains active but won't contribute to Edge Score.

### 2b. Backfill pass

After the main enrichment pass (articles where `summary_short IS NULL`), add a second pass:

```sql
WHERE weak_area_tags IS NULL AND summary_short IS NOT NULL
LIMIT 20
```

Cap at 20 per cron run. Clears existing article backlog over ~3 days. Same `enrichArticle()` function, no new Groq calls if article already has `summary_short` (re-enrichment only for the new fields).

Wait — backfill should be a targeted update: fetch articles where `weak_area_tags IS NULL`, call Groq only for the two new fields (subset prompt), update only those columns. This avoids overwriting existing `summary_short`/`key_insight` values.

### 2c. Feed hook selection

`FeedClient.tsx` reads `hooks[user.archetype]` from the article object. Fallback: `hooks?.scanner ?? hooks?.[0] ?? ''`.

---

## 3. PM Edge Score

### 3a. Dimension mapping

| `weak_area_tags` value | Dimension |
|---|---|
| `strategy`, `stakeholders` | `productStrategy` |
| `execution`, `sense` | `execution` |
| `data` | `dataThinking` |

### 3b. Score update rules (inside `/api/quiz` POST)

Called after streak update, before returning response.

**If `edge_score` is null (first quiz):**
- Identify the dimension(s) covered by this quiz's articles
- Covered dimension(s) → set to quiz result value (see table below)
- Uncovered dimensions → seed at 55

**If `edge_score` exists:**
- For each covered dimension: apply quiz result value IF it is higher than stored (best-of rule)
- Uncovered dimensions: unchanged

**Quiz result → score value:**

| Score | Value |
|---|---|
| All correct (N/N) | 88 |
| Partial (1 to N-1 correct) | 62 |
| Zero correct (0/N) | 35 |

**best-of rule:** `newValue = Math.max(stored, quizResultValue)`

A zero-score quiz on an already-62 dimension stays at 62. Scores only ever go up.

### 3c. `/api/quiz` POST response additions

```json
{
  "success": true,
  "streak": 5,
  "edge_score": { "productStrategy": 88, "execution": 55, "dataThinking": 62 },
  "score_delta": { "productStrategy": 33 }
}
```

`score_delta` contains only dimensions that changed this quiz.

### 3d. EdgeScoreCard component

**File:** `app/feed/EdgeScoreCard.tsx`

Inserted in quiz flow between Key Insight reveal and Streak screen.
Props: `edgeScore`, `scoreDelta`.

Displays:
- 3 horizontal bars, labeled `Product Strategy`, `Execution`, `Data Thinking`
- Bar fills proportionally (0–100)
- Changed dimensions show `(+N)` delta badge in orange
- "Continue →" button routes to streak screen
- If `scoreDelta` is empty (no change): skips this card entirely, routes straight to streak

### 3e. Dashboard

`/api/dashboard` route adds `edge_score` to its response (select from `user_profiles`).
`DashboardClient.tsx` renders 3 bars in the existing stats section.
If `edge_score` is null: shows `"Complete your first quiz to unlock your Edge Score"` placeholder.

---

## 4. Quiz Q3 + Streak Shield

### 4a. Q3 UI (in `QuizCard.tsx`)

Inserted after the result screen, before Key Insight. Always shown when quiz had ≥ 1 question.

```
"Bonus round — optional 🛡️"
"Write one sentence about what you'll take from today's reading."

[ text input — placeholder: "The key idea I'll apply is..." ]

[ Earn streak shield →  ]    [ Skip for now → ]
```

- Submit (any non-empty text after `.trim()`) → calls `/api/quiz/shield` POST → routes to Edge Score card
- Skip → routes to Edge Score card, no shield change
- If `streak_shield` is already `true` on the user's profile → button label: `"Refresh your shield →"` (same behaviour, refreshes timestamp)

### 4b. `/api/quiz/shield` POST

New route: `app/api/quiz/shield/route.ts`

Auth-required. No body validation beyond auth (any submission earns shield).

```sql
UPDATE user_profiles
SET streak_shield = true,
    streak_shield_earned = now()
WHERE user_id = $userId
```

Returns `{ shield: true }`.

### 4c. Shield activation logic (in `/api/quiz` POST streak block)

```typescript
// Gap ≥ 48hr but shield is active → absorb the miss
if (gap >= 48hr && profile.streak_shield === true) {
  newStreak = currentStreak  // no reset
  shieldConsumed = true
  // clear shield
  streak_shield = false
  streak_shield_earned = null
}
```

Return `shield_activated: true` in POST response when consumed.

### 4d. Feed shield toast

`FeedClient` checks `shield_activated` in the quiz POST response (stored in component state). On next feed render: one-time toast banner: `"Your streak shield saved Day N. Earn a new one after today's quiz."`. Dismissed on tap or after 5s.

### 4e. StreakBadge update

When `streak_shield = true`: render `N🔥🛡️`. When false: `N🔥` (existing behaviour).

### 4f. Re-engagement email update

In `re-engagement/route.ts`, streak-risk email subject gains shield awareness:

```typescript
subject: profile.streak_shield
  ? `Your shield is active — one article keeps your streak alive 🛡️`
  : `Your ${streak}-day streak is waiting 🔥`
```

---

## 5. Path Completion + Path 2

### 5a. Completion detection (in `/api/feed` GET)

After loading `user_progress` rows:

```typescript
const allComplete = progressRows.length > 0 &&
  progressRows.every(r => r.completed === true)

if (allComplete) {
  return NextResponse.json({ path_complete: true, archetype: profile.archetype, ... })
}
```

### 5b. FeedClient redirect

```typescript
if (feedData.path_complete) {
  router.push('/path-complete')
  return
}
```

### 5c. Middleware update

Add `/path-complete` to the auth-protected matcher in `middleware.ts`.

### 5d. `/path-complete` page

**File:** `app/path-complete/page.tsx` — server component, auth-required.

Sections:

**1. Celebration header**
```
Path 1 Complete 🎉
[archetype_display name]
```

**2. Edge Score breakdown**
3 bars with final values. Gap sentence below, from lookup:

```typescript
const GAP_SENTENCES = {
  dataThinking: "Your data thinking is your biggest gap. Path 2 is built around closing it.",
  execution: "Your execution muscle needs work. Path 2 focuses on shipping and prioritising.",
  productStrategy: "Strategy depth is your gap. Path 2 goes harder on vision and stakeholder thinking.",
  none: "Your foundation is strong. Path 2 pushes you into Advanced territory across the board.",
}
```

Weakest = lowest score. If all ≥ 75 → `none`.

**3. Share card**
Styled `<div>` (not a real OG image — no server-side image generation needed).

```
┌─────────────────────────────┐
│  PM Dojo                    │
│  Path 1 Complete            │
│                             │
│  [Archetype display name]   │
│  productStrategy  ████ 88   │
│  execution        ███  62   │
│  dataThinking     ██   55   │
└─────────────────────────────┘
```

LinkedIn share button:
```
https://linkedin.com/sharing/share-offsite/?url=<APP_URL>/share/<userId>
```

**4. Path 2 CTA**
Button: `"Your next path is ready →"` — disabled with spinner until Path 2 is built.
On click: routes to `/feed`.

### 5e. `/api/path-complete` POST

**File:** `app/api/path-complete/route.ts`

Called by the page on mount. Idempotent (checks `path_number` before building).

```typescript
// 1. Check not already built
if (profile.path_number >= 2) return { built: true, already: true }

// 2. Read edge_score — find weakest 1-2 dimensions
const weakest = lowestDimensions(profile.edge_score)  // returns tag names

// 3. Fetch articles for Path 2
// 60% slots (6): weak dimension tags, Intermediate + Advanced
const weakArticles = await supabaseAdmin
  .from('articles')
  .select('id')
  .contains('weak_area_tags', weakestTags)
  .in('difficulty', [2, 3])
  .not('id', 'in', path1ArticleIds)
  .limit(6)

// 4. Pad remaining 4 slots: other dimension Advanced articles
// 5. Shuffle, cap at 10
// 6. Insert user_progress rows (position 1-10, completed = false)
// 7. Update user_profiles: path_number = 2, sequence = newArticleIds
```

Returns `{ built: true }`.

---

## 6. Returning User States

### 6a. Gap detection (in `/api/feed` GET)

`user_profiles` now has `last_active_at`. Update it on every feed GET:
```sql
UPDATE user_profiles SET last_active_at = now() WHERE user_id = $userId
```

Compute `returning_state` before returning feed data:

```typescript
const gapHours = (now - lastActive) / 3600000

let returning_state: 'grace' | 'lapsed' | 'long_absence' | null = null

if (gapHours >= 25 && gapHours < 48)   returning_state = 'grace'
else if (gapHours >= 48 && gapHours < 168) returning_state = 'lapsed'
else if (gapHours >= 168)               returning_state = 'long_absence'
```

Included in feed response.

### 6b. ReturningBanner component

**File:** `app/feed/ReturningBanner.tsx`

Rendered above `StreakBadge` in `FeedClient`. Dismissible via localStorage key `pm_banner_dismissed_<date>` — dismissed once per day.

| `returning_state` | Copy |
|---|---|
| `grace` | "You've still got your streak — complete today's quiz to keep it going." |
| `lapsed` | "Your streak paused at [N] days. Today's a great day to start a new one 🔥" |
| `long_absence` | "Welcome back. You left off at Article [N] of 10. Pick up where you stopped." |

Rules:
- Never mention days missed
- `lapsed` uses the **previous** streak value (read from feed response `prev_streak` field)
- `long_absence` uses current `position` from `user_progress`
- Auto-dismisses after 5s for `long_absence` only

`/api/feed` adds `prev_streak` to its response: the streak value before the gap reset.

---

## File Change Summary

| File | Change type |
|---|---|
| `supabase/migrations/YYYYMMDD_v2_columns.sql` | New — schema migration |
| `app/api/sync-articles/route.ts` | Modified — weak_area_tags, 5-hook prompt, backfill pass |
| `app/api/quiz/route.ts` | Modified — Edge Score computation, shield activation |
| `app/api/quiz/shield/route.ts` | New — shield earn endpoint |
| `app/api/feed/route.ts` | Modified — path_complete detection, returning_state, last_active_at update |
| `app/api/path-complete/route.ts` | New — Path 2 builder |
| `app/feed/QuizCard.tsx` | Modified — Q3 UI, EdgeScoreCard insertion |
| `app/feed/EdgeScoreCard.tsx` | New — Edge Score delta display |
| `app/feed/StreakBadge.tsx` | Modified — shield badge |
| `app/feed/ReturningBanner.tsx` | New — gap-state banner |
| `app/feed/FeedClient.tsx` | Modified — shield toast, path_complete redirect, ReturningBanner |
| `app/path-complete/page.tsx` | New — path completion celebration page |
| `app/dashboard/DashboardClient.tsx` | Modified — Edge Score bars |
| `app/api/dashboard/route.ts` | Modified — add edge_score to response |
| `app/api/re-engagement/route.ts` | Modified — shield-aware email subject |
| `middleware.ts` | Modified — add /path-complete to protected routes |

---

## Failure Modes

| Scenario | Behaviour |
|---|---|
| Groq returns invalid `weak_area_tags` | Store `[]`, retry once with strict prompt. Article active, won't contribute to Edge Score. |
| Edge Score compute fails | Non-fatal: log error, return quiz success without score. Client shows stale score. |
| Path 2 builder finds < 10 articles | Fill remaining slots with any `is_active = true` articles not in Path 1. Never return < 10. |
| `/api/path-complete` called twice | Idempotent: `path_number >= 2` check returns `{ built: true, already: true }` immediately. |
| Shield activation on a streak that's already 0 | Shield consumes but streak stays at 0. Shield cleared. No negative state. |
| `last_active_at` null (new user) | `returning_state = null`. No banner shown. |

---

## Success Criteria

- User completes quiz → Edge Score updates → delta card shown in flow → dashboard shows bars
- User submits Q3 → shield earned → `🛡️` appears in StreakBadge
- User misses a day with shield → streak preserved → toast confirms shield used
- User completes all 10 articles → redirected to `/path-complete` → Edge Score + gap sentence shown → Path 2 builds → feed loads with new articles
- User returns after 25–47hr gap → grace banner shown once → dismisses cleanly
- User returns after 7 days → long absence banner shown → auto-dismisses after 5s
- New articles ingested with `weak_area_tags` and archetype-specific `hooks`
- Feed shows archetype-appropriate hook for each article
