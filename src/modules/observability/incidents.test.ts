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

import {assessReadiness} from "./readiness.ts";
test("readiness distinguishes unavailable, empty and present data",()=>{const rows=assessReadiness({products:0,inventory:2,prices:null,dealers:-1,directOrders:0});const get=(key:string)=>rows.find(row=>row.key===key);assert.deepEqual(get("products"),{key:"products",count:0,state:"empty",priority:"critical"});assert.equal(get("inventory")?.state,"present");assert.equal(get("prices")?.state,"unknown");assert.equal(get("dealers")?.state,"unknown");assert.equal(get("directOrders")?.priority,"review");assert.equal(get("variants")?.state,"unknown");});
