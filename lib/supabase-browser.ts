import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Safari Private mode restricts crypto.subtle, which breaks PKCE code
        // challenge generation (produces invalid base64url characters).
        // Implicit flow avoids the PKCE step entirely and works in all browsers.
        flowType: 'implicit',
      },
    }
  )
}
