import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePlatformAdmin } from "@/modules/identity/server-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reference = randomUUID();
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in with an administrator account to view incidents.", reference }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Incident monitoring is not configured.", reference }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return NextResponse.json({ error: "Your session expired. Sign in again.", reference }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const { data: allowed, error: roleError } = await supabase.rpc("has_platform_role", { p_roles: ["a¶»§q«^