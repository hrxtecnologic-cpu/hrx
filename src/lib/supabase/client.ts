import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso no browser (Client Components)
 * Usado para Realtime subscriptions e operações client-side
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
