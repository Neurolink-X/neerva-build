import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { recordIncident } from "@/modules/observability/incidents";
import { rfqSchema } from "@/modules/rfq/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 8_192;
const fieldHelp: Record<string, string> = {
  categorySlug: "Choose one of the listed material categories.",
  materialDescription: "Add the material type, grade or size you need.",
  quantity: "Enter a quantity greater than zero.",
  unit: "Choose a unit that matches this material.",
  city: "Enter the delivery city.",
  pincode: "Enter a valid six-digit Indian pincode.",
  requestedDate: "Choose a valid delivery date.",
  contactName: "Enter the name dealers should use when contacting you.",
  phone: "Enter a valid 10-digit Indian mobile number.",
};

type PublicFailureCode = "INVALID_REQUEST" | "SERVICE_NOT_READY" | "RATE_LIMITED" | "VERIFICATION_FAILED" | "REQUEST_NOT_CONFIRMED" | "REQUEST_NOT_SAVED";

function failure(status: number, code: PublicFailureCode, traceId: string, retryAfter?: number) {
  const copy: Record<PublicFailureCode, { message: string; retryable: boolean }> = {
    INVALID_REQUEST: { message: "Please check the highlighted details and try again.", retryable: false },
    SERVICE_NOT_READY: { message: "We can’t send this request right now. Your details are still here—please try again shortly.", retryable: true },
    RATE_LIMITED: { message: "A few requests were sent recently. Please wait a little and try again.", retryable: true },
    VERIFICATION_FAILED: { message: "The security check expired or didn’t finish. Complete it again, then retry.", retryable: true },
    REQUEST_NOT_CONFIRMED: { message: "We couldn’t confirm whether your request was received. Retry safely; we’ll prevent a duplicate submission.", retryable: true },
    REQUEST_NOT_SAVED: { message: "Your request wasn’t saved. Your details are still here—please retry shortly.", retryable: true },
  };
  return NextResponse.json({ error: copy[code].message, code, retryable: copy[code].retryable, reference: traceId }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}

async function readBoundedJson(request: Request): Promise<unknown | null> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

function clientIp(request: Request): string | null {
  // Hosting must set this at its trusted edge; do not use browser-supplied custom IP fields.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || null;
}

async function verifyTurnstile(token: string, ip: string | null): Promise<{ ok: true } | { ok: false; reason: "rejected" | "unavailable" }> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: "unavailable" };
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const result = await response.json() as { success?: boolean; hostname?: string };
    const allowedHosts = process.env.TURNSTILE_ALLOWED_HOSTNAMES
      ?.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)
      ?? (process.env.NEXT_PUBLIC_SITE_URL ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase()] : []);
    if (result.success !== true || !allowedHosts.includes(result.hostname?.toLowerCase() ?? "")) return { ok: false, reason: "rejected" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const traceId = randomUUID();
  const raw = await readBoundedJson(request);
  const parsed = rfqSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({
      error: "Please check the highlighted details and try again.",
      code: "INVALID_REQUEST",
      retryable: false,
      reference: traceId,
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "form")))].map((field) => ({
        field,
        message: fieldHelp[field] ?? "Review this value and try again.",
      })),
    }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!redisUrl || !redisToken || !supabaseUrl || !serviceKey || !turnstileSecret) {
    await recordIncident("RFQ_RATE_LIMIT_UNAVAILABLE", traceId);
    return failure(503, "SERVICE_NOT_READY", traceId);
  }

  const ip = clientIp(request);
  const ipKey = createHash("sha256").update(ip ?? "unknown").digest("hex");
  let rate: { success: boolean; reset: number };
  try {
    const limiter = new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "neerva:public-rfq",
    });
    rate = await limiter.limit(ipKey);
  } catch {
    await recordIncident("RFQ_RATE_LIMIT_UNAVAILABLE", traceId);
    return failure(503, "SERVICE_NOT_READY", traceId);
  }
  if (!rate.success) return failure(429, "RATE_LIMITED", traceId, Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)));

  const verification = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!verification.ok && verification.reason === "unavailable") {
    await recordIncident("RFQ_CAPTCHA_PROVIDER_FAILED", traceId);
    return failure(503, "SERVICE_NOT_READY", traceId);
  }
  if (!verification.ok) {
    await recordIncident("RFQ_CAPTCHA_REJECTED", traceId);
    return failure(403, "VERIFICATION_FAILED", traceId);
  }

  try {
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

    if (error && error.code !== "23505") {
      await recordIncident("RFQ_PERSISTENCE_FAILED", traceId);
      return failure(503, "REQUEST_NOT_SAVED", traceId);
    }

    if (error?.code === "23505") {
      const { data, error: lookupError } = await supabase.from("quote_requests")
        .select("id")
        .eq("idempotency_key", parsed.data.idempotencyKey)
        .maybeSingle();
      if (lookupError || !data?.id) {
        await recordIncident("RFQ_IDEMPOTENCY_LOOKUP_FAILED", traceId);
        return failure(503, "REQUEST_NOT_CONFIRMED", traceId);
      }
      return NextResponse.json({ requestId: data.id, status: "received", reference: traceId }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ requestId, status: "received", reference: traceId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    await recordIncident("RFQ_PERSISTENCE_FAILED", traceId);
    return failure(503, "REQUEST_NOT_SAVED", traceId);
  }
}
