import assert from "node:assert/strict";
import test from "node:test";
import { incidentCatalogForAdmin, incidentFingerprint } from "./incidents.ts";

test("incident fingerprints are stable and distinct by failure category", () => {
  assert.equal(incidentFingerprint("RFQ_PERSISTENCE_FAILED"), incidentFingerprint("RFQ_PERSISTENCE_FAILED"));
  assert.notEqual(incidentFingerprint("RFQ_PERSISTENCE_FAILED"), incidentFingerprint("RFQ_CAPTCHA_PROVIDER_FAILED"));
  assert.match(incidentFingerprint("RFQ_PERSISTENCE_FAILED"), /^[a-f0-9]{64}$/);
});

test("incident catalog contains safe summaries without request or customer data", () => {
  for (const incident of Object.values(incidentCatalogForAdmin)) {
    assert.equal(incident.module, "rfq");
    assert.ok(incident.summary.length <= 180);
    assert.ok(incident.impact.length <= 240);
    assert.doesNotMatch(incident.summary, /phone|password|token|email|address/i);
  }
});

test("security rejects are separated from provider outages", () => {
  assert.equal(incidentCatalogForAdmin.RFQ_CAPTCHA_REJECTED.severity, "info");
  assert.equal(incidentCatalogForAdmin.RFQ_CAPTCHA_PROVIDER_FAILED.severity, "warning");
  assert.notEqual(incidentFingerprint("RFQ_CAPTCHA_REJECTED"), incidentFingerprint("RFQ_CAPTCHA_PROVIDER_FAILED"));
});
