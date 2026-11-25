#!/usr/bin/env python3
"""Read-only audit of reachable Git history; never print matched credentials.
Run on an authorized, full mirror of the private repo before public conversion.
Heuristic only: it cannot inspect GitHub logs, artifacts, LFS contents or licenses.
"""
import json
import re
import subprocess
import sys
from collections import defaultdict

def git(*args):
    return subprocess.check_output(["git", *args])
if git("rev-parse", "--is-shallow-repository").strip() != b"false":
    sys.exit("Full, non-shallow clone or mirror required.")
patterns = {
    "private_key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "provider_token": re.compile(rb"\b(?:github_pat_|ghp_|gho_|sb_secret_|sk_live_|vcp_)[A-Za-z0-9_-]{20,}"),
    "aws_access_key": re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "database_credentials": re.compile(rb"postgres(?:ql)?://[^:@/\s'\"<>]+:[^@/\s'\"<>]+@[^\s'\"<>]+"),
    "literal_secret_assignment": re.compile(rb"(?i)\b(?:service_role_key|api_secret|client_secret|access_token|refresh_token|secret_key)\s*[:=]\s*[\"'][^\r\n\"']{16,}[\"']"),
}
objects = {}
for entry in git("rev-list", "--objects", "--all").splitlines():
    oid, _, path = entry.partition(b" ")
    objects[oid] = path.decode("utf-8", "replace")
# Use a temporary file for object IDs; feeding both pipes concurrently can deadlock.
import tempfile
with tempfile.TemporaryFile() as ids:
    ids.write(b"\n".join(objects) + b"\n")
    ids.seek(0)
    proc = subprocess.Popen(["git", "cat-file", "--batch"], stdin=ids, stdout=subprocess.PIPE)
    findings = []
    reviewed = 0
    binary = 0
    while True:
        header = proc.stdout.readline()
        if not header:
            break
        parts = header.rstrip(b"\n").split()
        if len(parts) != 3:
            sys.exit("Incomplete Git object stream; audit cannot pass.")
        oid, kind, length = parts
        remaining = int(length)
        # Read all objects without retaining large binaries; inspect text up to 4 MiB.
        prefix = proc.stdout.read(min(remaining, 4 * 1024 * 1024))
        remaining -= len(prefix)
        oversized = remaining > 0
        while remaining:
            chunk = proc.stdout.read(min(remaining, 65536))
            if not chunk:
                sys.exit("Truncated Git object stream.")
            remaining -= len(chunk)
        if proc.stdout.read(1) != b"\n":
            sys.exit("Invalid Git object boundary.")
        if kind != b"blob":
            continue
        path = objects.get(oid, "")
        categories = []
        if re.search(r"(?i)(?:^|/)(?:\.env(?:\..*)?|.*\.(?:pem|key|p12|dump|bak|sqlite3?))$", path) and not path.endswith(".env.example"):
            categories.append("sensitive_filename")
        if b"\x00" in prefix[:8192]:
            binary += 1
        else:
            reviewed += 1
            if oversized:
                categories.append("oversize_text_manual_review")
            categories.extend(name for name, pattern in patterns.items() if pattern.search(prefix))
        if categories:
            findings.append({"blob": oid.decode(), "path": path, "categories": categories})
    if proc.wait() != 0:
        sys.exit("Git object audit failed.")
print(json.dumps({"scope":"reachable local refs only", "text_blobs":reviewed, "binary_blobs_manual_review":binary, "potential_findings":findings, "manual_review_required":True}, indent=2))
sys.exit(1 if findings else 0)
