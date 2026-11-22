import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const incidentCatalog = {
  RFQ_RATE_LIMIT_UNAVAILABLE: { module: "rfq", severity: "error", summary: "RFQ protection service is unavailable.", impact: "New quote requests may be temporarily unavailable." },
  RFQ_CAPTCHA_PROVIDER_FAILED: { module: "rfq", severity: "warning", summary: "Quote security verification could not be completed.", impact: "Some visitors may be unable to submit quote requests." },
  RFQ_CAPTCHA_REJECTED: { module: "rfq", severity: "info", summary: "A quote request did not pass security verification.", impact: "The submitted quote request was not accepted." },
  RFQ_PERSISTENCE_FAILED: { module: "rfq", severity: "critical", summary: "A validated quote request could not be saved.", impact: "A customer quote request may not have reached dealers." },
  RFQ_IDEMPOTENCY_LOOKUP_FAILED: { module: "rfq", severity: "error", summary: "The system could not confirm an earlier quote submission.", impact: "A customer may not see the result of a previous submission." },
} as const;

export type IncidentCode = keyof typeof incidentCatalog;

export function incidentFingerprint(code: IncidentCode): string {
  const incident = incidentCatalog[code];
  return createHash("sha256").update(`${incident.module}:${code}:/api/rfqs`).digest("hex");
}

/** Persist only catalogued, low-PII operational events. Never pass raw exceptions here. */
export async function recordIncident(code: IncidentCode, traceId: string): Promise<void> {
  const incident = incidentCatalog[code];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(JSON.stringify({ level: "error", event: "incident_store_unconfigured", module: incident.module, code, traceId }));
    return;
  }

  const incidentKey = incidentFingerprint(code);

  try {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.rpc("record_system_incident", {
      p_incident_key: incidentKey,
      p_module: incident.module,
      p_code: code,
      p_severity: incident.severity,
      p_safe_summary: incident.summary,
      p_route: "/api/rfqs",
      p_impact: incident.impact,
      p_trace_id: traceId,
    });
    if (error) {
      console.error(JSON.stringify({ level: "error", event: "incident_store_failed", module: incident.module, code, traceId, providerCode: /^[A-Z0-9_-]{1,24}$/.test(error.code ?? "") ? error.code : "UNKNOWN" }));
    }
  } catch {
    console.error(JSON.stringify({ level: "error", event: "incident_store_failed", module: incident.module, code, traceId, providerCode: "UNKNOWN" }));
  }
}

export const incidentCatalogForAdmin = incidentCatalog;
