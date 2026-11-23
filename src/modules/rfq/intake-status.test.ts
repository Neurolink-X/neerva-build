import assert from "node:assert/strict";
import test from "node:test";
import {rfqIntakeEnabled} from "./intake-status.ts";
test("customer contact data intake defaults to OFF without explicit production approval",()=>{
 assert.equal(rfqIntakeEnabled({}),false);
 assert.equal(rfqIntakeEnabled({NEERVA_RFQ_INTAKE_ENABLED:"false"}),false);
 assert.equal(rfqIntakeEnabled({NEERVA_RFQ_INTAKE_ENABLED:"TRUE"}),false);
 assert.equal(rfqIntakeEnabled({NEERVA_RFQ_INTAKE_ENABLED:"true"}),true);
});
