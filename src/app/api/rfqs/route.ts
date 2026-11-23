import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { recordIncident } from "@/modules/observability/incidents";
import { rfqSchema } from "@/modules/rfq/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 32_768;
const fieldHelp: Record<string, string> = {
  categorySlug: "Choose one of the listed material categories.",
  materialDescription: "Add the material type, grade or size you need.",
  quantity: "Enter a quantity greater than zero.",
  unit: "Choose a unit that matches this material.",
  city: "Enter the delivery city.",
  pincode: "Enter a valid six-digit Indian pincode.",
  deliveryAddress: "Add the site address or a nearby landmark for the delivery quote.",
  requestedDate: "Choose a valid delivery date.",
  contactName: "Enter the name dealers should use when contacting you.",
  phone: "Enter a valid 10-digit Indian mobile number.",
};

type PublicFailureCode = "INVALID_REQUEST" | "SERVICE_NOT_READY" | "RATE_LIMITED" | "VERIFICATION_FAILED" | "REQUEST_NOT_CONFIRMED" | "REQUEST_NOT_SAVED";

function failure(status: number, code: PublicFailureCode, traceId: string, retryAfter?: number) {
  const copy: Record<PublicFailureCode, { message: string; retryable: boolean }> = {
    INVALID_REQUEST: { message: "Please check the ¶»§q«^