#!/usr/bin/env node
/**
 * Two explicit semantics for the same fail-closed release contract:
 *
 *  --check      CI / Vercel Build Command: exit 0 on success, 1 on failure
 *  (default)    Vercel Ignored Build Step: exit 1 to BUILD, 0 to SKIP
 *
 * A missing/invalid contract blocks the build; do not let an arbitrary
 * changed commit silently publish protected order or permissions code.
 */
import {validateProductionContract} from "./contract.mjs";

const ci=process.argv.includes("--check");
const env=process.env;
if(!ci&&env.VERCEL_ENV!=="production"){
 console.log("NEERVA preview build allowed (source contract is checked by CI).");
 process.exit(1);
}
const errors=validateProductionContract({env});
if(errors.length){
 for(const error of errors)console.error("NEERVA release blocked: "+error);
 console.error("Fix the stated source/contract issue, then rerun CI and mobile E2E. Do not bypass the gate.");
 process.exit(ci?1:0);
}
console.log("NEERVA release contract v2 passed — source inventory, protected workflows and Neerva DB.");
process.exit(ci?0:1);
