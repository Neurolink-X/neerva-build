"use client";

import { createClient } from "@supabase/supabase-js";
import type { NeervaDatabase } from "@/modules/supabase/database";

let singleton: ReturnType<typeof createClient<NeervaDatabase>> | null = null;
export function createNeervaBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  singleton ??= createClient<NeervaDatabase>(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return singleton;
}
