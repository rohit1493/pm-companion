-- Mark existing paywalled articles as inactive
-- Run this once in Supabase SQL editor to clean up already-synced paywalled content

UPDATE articles
SET is_active = false
WHERE is_active = true
  AND (
    summary ILIKE '%paid subscriber%'
    OR summary ILIKE '%subscribe to read%'
    OR summary ILIKE '%for subscribers only%'
    OR summary ILIKE '%upgrade to read%'
    OR summary ILIKE '%unlock this post%'
    OR summary ILIKE '%become a paid member%'
    OR summary ILIKE '%paying member%'
  );
