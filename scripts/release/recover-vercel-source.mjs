#!/usr/bin/env node
/**
 * Download an authenticated Vercel deployment's original source into a NEW,
 * empty directory. Never asks for tokens on the command line, and never
 * uploads production source or secrets to a third party.
 *
 * VERCEL_TOKEN=... VERCEL_TEAM_ID=... node scripts/release/recover-vercel-source.mjs \
 *   --deployment dpl_... --out ../neerva-vercel-source
 *
 * Requires Node 24+. Production deployment source is not the built Next.js output.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] || null;
};
const deployment = getArg("--deployment");
const outArg = getArg("--out");
const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || "";
if (!token || !deployment || !outArg || !/^dpl_[A-Za-z0-9]+$/.test(deployment)) {
  console.error("Set VERCEL_TOKEN and pass --deployment dpl_... --out <empty-directory>. Optional: VERCEL_TEAM_ID.");
  process.exit(2);
}
const out = resolve(outArg);
if (out === process.cwd() || process.cwd().startsWith(out + sep)) {
  console.error("Refusing to overwrite a working repository. Use a new, empty directory outside the repo.");
  process.exit(2);
}
const params = teamId ? "?teamId=" + encodeURIComponent(teamId) : "";
const base = "https://api.vercel.com";
const headers = { Authorization: "Bearer " + token };
async function request(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      let response;
      try {
        response = await fetch(url, { headers, redirect: "follow", signal: controller.signal });
      } finally { clearTimeout(timer); }
      if (response.ok) return response;
      const code = response.status;
      if (![429, 500, 502, 503, 504].includes(code)) throw new Error("Vercel API HTTP " + code + " (token, access or endpoint issue)");
      last = new Error("Vercel API HTTP " + code);
    } catch (error) { last = error; }
    await new Promise((done) => setTimeout(done, (attempt + 1) * 1500));
  }
  throw last;
}
function flatten(nodes, prefix = "") {
  const result = [];
  for (const entry of nodes) {
    const full = entry.path || [prefix, entry.name].filter(Boolean).join("/");
    if (Array.isArray(entry.children)) result.push(...flatten(entry.children, full));
    else if (entry.uid && full) result.push({ path: full, uid: entry.uid, size: entry.size });
  }
  return result;
}
function safePath(path) {
  if (!path.startsWith("src/")) return null; // Vercel API-upload root
  const relative = path.slice(4).replaceAll("\\", "/");
  if (!relative || isAbsolute(relative) || relative.startsWith("/") || relative.split("/").some((x) => x === "." || x === "..")) return null;
  if (/(^|\/)(\.env(?:\..*)?|\.vercel|\.git|node_modules|\.next|out)(\/|$)/i.test(relative) ||
      /\.(?:pem|key|p12|pfx|sqlite|db)$/i.test(relative)) return null;
  return normalize(relative);
}
const response = await request(base + "/v6/deployments/" + deployment + "/files" + params);
const root = await response.json();
const source = Array.isArray(root) ? root : root.files || root.result?.files || [];
if (!Array.isArray(source) || source.length === 0) throw new Error("No deployment source tree available");
const all = flatten(source).filter((x) => safePath(x.path));
if (all.length < 50) throw new Error("Incomplete source manifest: fewer than 50 files");
if (new Set(all.map((x) => safePath(x.path))).size !== all.length) throw new Error("Duplicate file paths in source tree");
await mkdir(out, { recursive: true });
if ((await readdir(out)).length > 0) throw new Error("Output directory must be empty");
const recovered = [];
let cursor = 0;
async function worker() {
  while (cursor < all.length) {
    const file = all[cursor++];
    const relative = safePath(file.path);
    if (!relative) continue;
    const uri = base + "/v8/deployments/" + deployment + "/files/" + encodeURIComponent(file.uid) + params;
    const result = await request(uri);
    const bytes = Buffer.from(await result.arrayBuffer());
    const sha1 = createHash("sha1").update(bytes).digest("hex");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (/^[a-f0-9]{40}$/i.test(file.uid) && sha1 !== file.uid.toLowerCase()) {
      throw new Error("SHA1 mismatch for " + relative + ": Vercel source may be incomplete");
    }
    if (Number.isSafeInteger(file.size) && file.size >= 0 && bytes.length !== file.size) {
      throw new Error("Size mismatch for " + relative);
    }
    if (bytes.includes(Buffer.from("...[truncated]"))) {
      throw new Error("Refusing truncated contents for " + relative);
    }
    const destination = join(out, relative);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes, { flag: "wx" });
    recovered.push({ path: relative.replaceAll("\\", "/"), sha256, size: bytes.length });
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()));
recovered.sort((a, b) => a.path.localeCompare(b.path));
const manifest = {
  version: 1,
  sourceDeploymentId: deployment,
  recoveredAt: new Date().toISOString(),
  fileCount: recovered.length,
  files: recovered,
};
await writeFile(join(out, "source-recovery-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
console.log("Recovered and SHA-verified " + recovered.length + " source files into " + out);
console.log("Do not directly overwrite main. Add only missing files and review changed shared files in a PR.");
