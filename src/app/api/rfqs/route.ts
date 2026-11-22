import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rfqSchema } from "@/modules/rfq/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result: { success?: boolean } = await response.json();
  return result.success === true;
}

export async function POST(request: Request) {
  const parsed = rfqSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid quote request." }, { status: 400 });

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!redisUrl || !redisToken || !supabaseUrl || !serviceKey || !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    return NextResponse.json({ error: "Quote requests are not available yet. Please try again later." }, { status: 503 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? null;
  const key = createHash("sha256").update(clientIp ?? "unknown").digest("hex");
  const limiter = new Ratelimit({ redis: new Redis({ url: redisUrl, token: redisToken }), limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "neerva:public-rfq" });
  const rate = await limiter.limit(key);
  if (!rate.success) return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, clientIp))) {
    return NextResponse.json({ error: "Security verification failed. Please retry." }, { status: 403 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const requestId = randomUUID();
  const { error } = await supabase.from("quote_requests").insert({
    id: requestId,
    idempotency_key: parsed.data.idempotencyKey,
    category_slug: parsed.data.categorySlug,
    material_description: parsed.data.materialDescription,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    city: parsed.data.city,
    pincode: parsed.data.pincode,
    requested_date: parsed.data.requestedDate ?? null,
    contact_name: parsed.data.contactName,
    phone: parsed.data.phone,
    status: "open",
  });
  if (error && error.code !== "23505") return NextResponse.json({ error: "Could not save the quote request. Please retry later." }, { status: 503 });

  let savedRequestId = requestId;
  if (error?.code === "23505") {
    const { data } = await supabase.from("quote_requests").select("id").eq("idempotency_key", parsed.data.idempotencyKey).maybeSingle();
    if (!data?.id) return NextResponse.json({ error: "Could not confirm the request. Please retry later." }, { status: 503 });
    savedRequestId = data.id;
  }

  return NextResponse.json({ requestId: savedRequestId, status: "received" }, { status: error?.code === "23505" ? 200 : 201, headers: { "Cache-Control": "no-store" } });
}
