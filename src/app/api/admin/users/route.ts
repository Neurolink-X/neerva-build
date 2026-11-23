import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/modules/identity/server-auth";

export const dynamic = "force-dynamic";
const roles = ["customer", "contractor", "design_professional", "support", "finance", "admin"] as const;

export async function GET(request: Request) {
  const result = await requirePlatformAdmin(request);
  if (!result.ok) return result.response;
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId || !z.string().uuid().safeParse(userId).success) return NextResponse.json({ error: "Enter a valid account ID to look up a user." }, { status: 422, headers: { "Cache-Control": "no-store" } });
  const [{ data: profile, error: profileError }, { data: grants, error: grantsError }, { data: memberships, error: membershipsError }, { data: canManageRoles, error: roleCheckError }] = await Promise.all([
    result.auth.client.from("profiles").select("id,display_name,preferred_locale,created_at").eq("id", userId).maybeSingle(),
    result.auth.client.from("platform_role_grants").select("role,granted_at,granted_by").eq("user_id", userId),
    result.auth.client.from("tenant_memberships").select("tenant_id,role,active,tenants(business_name)").eq("user_id", userId),
    result.auth.client.rpc("has_platform_role", { p_roles: ["super_admin"] }),
  ]);
  if (profileError || grantsError || membershipsError || roleCheckError) return NextResponse.json({ error: "User access details could not be l¶»§q«^