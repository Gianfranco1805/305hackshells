import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

/**
 * Server-side Supabase client for use in API routes and Server Components.
 * Uses the service role key — never call this client-side.
 * Throws if the caller is not authenticated.
 */
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function requireUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated: no active Clerk session");
  }

  return userId;
}

export async function createServerClient() {
  const userId = await requireUserId();

  return { client: createServiceClient(), userId };
}

/**
 * Helper to return a JSON error response from an API route.
 */
export function apiError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}
