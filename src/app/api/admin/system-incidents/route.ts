import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { data: allowed, error: roleError } = await supabase.rpc("has_platform_role", { p_roles: ["admin", "super_admin"] });
  if (roleError) return NextResponse.json({ error: "Administrator permissions could not be checked.", reference }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (allowed !== true) return NextResponse.json({ error: "You do not have permission to view platform incidents.", reference }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const { data, error } = await supabase.from("system_incidents")
    .select("id,module,severity,error_code,route,safe_summary,impact,occurrence_count,first_seen_at,last_seen_at,last_trace_id,status,resolved_at")
    .order("last_seen_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Incident records could not be loaded. Retry shortly.", reference }, { status: 503, headers: { "Cache-Control": "no-store" } });

  return NextResponse.json({ incidents: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

import {z} from "zod";
import {requireAdmin,apiData,apiFailed} from "@/modules/identity/server-auth";
const review=z.object({id:z.string().uuid(),expected:z.enum(["open","investigating","resolved","ignored"]),status:z.enum(["open","investigating","resolved","ignored"]),reason:z.string().trim().min(10).max(500)}).strict();
export async function PATCH(request:Request){const auth=await requireAdmin(request);if(auth instanceof Response)return auth;try{const raw=await request.text();const v=review.safeParse(raw.length<=3000?JSON.parse(raw):null);if(!v.success)return Response.json({error:"Invalid incident decision."},{status:400});const d=v.data;const r=await auth.client.rpc("neerva_admin_review_incident",{p_id:d.id,p_expected:d.expected,p_status:d.status,p_note:d.reason});if(r.error)return Response.json({error:r.error.code==="40001"?"Incident changed; refresh.":"Incident review failed."},{status:r.error.code==="40001"?409:r.error.code==="42501"?403:503});return apiData({changed:r.data===true})}catch{return apiFailed()}}
