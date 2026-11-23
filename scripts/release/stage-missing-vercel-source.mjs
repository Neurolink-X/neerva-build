#!/usr/bin/env node
/**
 * Stage ONLY files absent from the repository; do not overwrite PR5/6/7 code.
 * Generate a conflict report for the shared files so human review is possible.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
const root = resolve(process.cwd());
const source = process.argv[2] && resolve(process.argv[2]);
if (!source || source === root) throw new Error("Pass the directory created by recover-vercel-source.mjs");
const manifest = JSON.parse(await readFile(join(source, "source-recovery-manifest.json"), "utf8"));
if (!Array.isArray(manifest.files) || manifest.files.length < 50) throw new Error("Recovery manifest incomplete");
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const report = { sourceDeploymentId: manifest.sourceDeploymentId, recoveredFiles: manifest.files.length, newlyRestored: [], sharedIdentical: [], sharedDifferent: [] };
for (const file of manifest.files) {
  const relative = file.path;
  if (typeof relative !== "string" || relative.includes("..") || relative.startsWith("/")) throw new Error("Unsafe manifest path");
  const from = join(source, relative), to = join(root, relative);
  const bytes = await readFile(from);
  if (sha256(bytes) !== file.sha256) throw new Error("Checksum mismatch: " + relative);
  const exists = await stat(to).then(() => true, () => false);
  if (!exists) {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
    report.newlyRestored.push(relative);
  } else {
    const current = await readFile(to);
    (sha256(current) === file.sha256 ? report.sharedIdentical : report.sharedDifferent).push(relative);
  }
}
await mkdir(join(root, "docs"), { recursive: true });
await writeFile(join(root, "docs", "production-source-recovery-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log("Recovered: " + report.newlyRestored.length + "; shared identical: " + report.sharedIdentical.length + "; shared divergent: " + report.sharedDifferent.length);
if (report.sharedDifferent.length) console.log("Shared differences require review; no existing source file was overwritten.");
