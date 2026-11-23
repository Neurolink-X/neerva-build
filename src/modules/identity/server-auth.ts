import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NeervaDatabase } from "@/modules/supabase/database";
import type { NextResponse } from "next/server";

type AuthErrorResponse = NextResponse<{ error: string; reference: string }>;
export type RequestAuth = { client: SupabaseClient<NeervaDatabase>; userId: string; email: string | null };
export type AuthResult = { ok: true; auth: RequestAuth } | { ok: false; response: AuthErrorResponse };

function failure(status: number, error: string): AuthErrorResponse {
  return Response.json({ error, reference: crypto.randomUUID() }, { status, headers: { "Cache-Control": "no-store" } }) as AuthErrorResponse;
}

export async function getRequestAuth(request: Request): Promise<AuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { ok: false, response: failure(503, "The separate NEERVA BUILD account service is not configured.") };
  const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9._~-]{20,4096})$/)?.[1];
  if (!token) return { ok: false, response: failure(401, "Sign in to continue.") };
  const client = createClient<NeervaDatabase>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { ok¶»§q«^