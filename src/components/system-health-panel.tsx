"use client";

import { useCallback, useEffect, useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type Incident = { id: string; module: string; severity: string; error_code: string | null; route: string | null; safe_summary: string; impact: string | null; occurrence_count: number; first_seen_at: string; last_seen_at: string; last_trace_id: string | null; status: "open" | "investigating" | "resolved" | "ignored"; resolved_at: string | null };
const client = createNeervaBrowserClient();

async function authorized(path: string, init?: RequestInit) {
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with an administrator account to see system incidents.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; incidents?: Incident[] };
  if (!response.ok) throw new Error(body.error ?? "System health data could not be loaded.");
  return body;
}

function date(value: string) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
function suggestedCheck(code: string | null) {
  const checks: Record<string, string> = {
    RFQ_RATE_LIMIT_UNAVAILABLE: "Check the NEERVA Redis endpoint and token configuration, provide¶»§q«^