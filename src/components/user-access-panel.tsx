"use client";

import { useState, type FormEvent } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

type UserAccess = { profile: { id: string; display_name: string; preferred_locale: string; created_at: string }; roles: { role: string; granted_at: string; granted_by: string | null }[]; memberships: { tenant_id: string; role: string; active: boolean; tenants: { business_name: string } | null }[]; canManageRoles: boolean };
const client = createNeervaBrowserClient();
const manageableRoles = ["customer", "contractor", "design_professional", "support", "finance", "admin"];

async function authorized(path: string, init?: RequestInit) {
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in with a platform admin account to manage access.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string; profile?: UserAccess["profile"]; roles?: UserAccess["roles"]; memberships?: UserAccess["memberships"]; canManageRoles?: boolean };
  if (!response.ok) throw new Error(body.error ?? "The access service could not complete this action.");
  return body;
}

export function UserAccessPanel() {
  const [userId, setUserId] = useState("");
  const [access, setAccess] = ¶»§q«^