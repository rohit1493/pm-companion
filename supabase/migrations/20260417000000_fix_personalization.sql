-- Fix personalization: reset summary_short on articles that are likely miscategorised
-- so the next sync run re-enriches them with the improved Groq prompt.
--
-- Targets:
-- 1. Articles from Martin Fowler that are NOT about PM strategy/analytics
--    (software architecture essays shouldn't appear in startup_climber feeds)
-- 2. Articles categorised as 'AI' that mention Turing, architecture, or theory
--    (these are CS theory, not AI product management)
-- 3. Any article with 0 PM-relevant signal in the title/summary

-- Reset enrichment on Martin Fowler articles that are CS/architecture focused
-- (they will be re-enriched with improved category descriptions on next sync)
UPDATE articles
SET summary_short = NULL,
    category = NULL,
    key_insight = NULL,
    hooks = NULL,
    quiz_q1 = NULL, quiz_a1 = NULL,
    quiz_q2 = NULL, quiz_a2 = NULL
WHERE source = 'Martin Fowler'
  AND (
    title ILIKE '%turing%'
    OR title ILIKE '%architecture%'
    OR title ILIKE '%refactor%'
    OR title ILIKE '%microservice%'
    OR title ILIKE '%event sourcing%'
    OR title ILIKE '%domain%driven%'
    OR title ILIKE '%creative slump%'
    OR summary ILIKE '%creative slump%'
  );

-- Deactivate articles where title/summary has zero PM relevance
-- (creative lifestyle content that got through paywall checks)
UPDATE articles
SET is_active = false
WHERE is_active = true
  AND (
    title ILIKE '%creative slump%'
    OR title ILIKE '%morning routine%'
    OR title ILIKE '%journaling%'
    OR (
      source = 'Martin Fowler'
      AND category NOT IN ('Product Strategy', 'AI', 'Analytics', 'Case Studies & Teardowns')
      AND category IS NOT NULL
    )
  );
