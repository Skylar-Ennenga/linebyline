import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}

// Server Component Client (server.ts)
// Server components and API routes run on your server, not in the browser. They don't have automatic access to browser cookies — you have to explicitly read them using Next.js's cookies() function.
// This client does that handoff: it reads the cookies from the incoming request and passes them to Supabase so server-side code knows who the user is too.