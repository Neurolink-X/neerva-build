#!/usr/bin/env node
/**
 * Fail closed before a recovered production file is committed to Git.
 * This catches obvious credential patterns; HUMAN secret review remains required.
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
const path = process.argv[2];
if (!path) { console.error("Usage: node scripts/release/scan-recovered.mjs <recovered-dir>"); process.exit(2); }
const root = resolve(path);
const manifest = JSON.parse(await readFile(join(root, "source-recovery-manifest.json"), "utf8"));
if (!Array.isArray(manifest.files) || manifest.files.length < 50) throw new Error("Source manifest missing or incomplete");
const sensitive = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i,
  /\b(?:sk_live_|sk_test_|sb_secret_|github_pat_|ghp_|vcp_)[A-Za-z0-9_-]{12,}/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\b(?:password|service_role_key|api_secret|bearer_token)\s*[:=]\s*["'][^"'\r\n]{8,}["']/i,
  /\bpostgres(?:ql)?:\/\/[^:@/\s]+:[^@/\s]+@/i,
];
let scanned = 0;
for (const file of manifest.files) {
  const bytes = await readFile(join(root, file.path));
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== file.sha256 || bytes.length !== file.size) throw new Error("Source integrity failure for " + file.path);
  if (!/\.(?:c|css|html|js|json|jsx|md|mjs|sql|ts|tsx|txt|yml|yaml)$/i.test(file.path)) continue;
  const text = bytes.toString("utf8");
  if (sensitive.some((pattern) => pattern.test(text))) throw new Error("Potential secret in recovered file; human review required: " + file.path);
  scanned++;
}
console.log("Recovery manifest verified; scanned " + scanned + " text source files. Manual code/credential review still required.");
