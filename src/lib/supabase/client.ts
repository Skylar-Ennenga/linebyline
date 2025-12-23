import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Client Component Client (client.ts)
// Used in components marked with "use client". These run in the browser, so this client uses createBrowserClient which stores the auth session in browser cookies automatically.
// When a user logs in, the session token gets saved. On every subsequent request, the client reads that cookie and includes the token so Supabase knows who's making the request.