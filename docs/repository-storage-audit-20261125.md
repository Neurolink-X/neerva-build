# Repository storage audit — 2026-11-25

Baseline commit 75d9ae3d0003f186aa3ac4297c6b216b774972b5: 697 tracked files, 12,809,095 bytes in the checked-out tree (not compressed Git history or deployed size). Public images: 6,696,710 bytes. Catalog review assets: 3,511,462 bytes.

## Implemented

- 21 review WebP paths were byte-identical to already published public copies (matching Git blob IDs). Consolidate 1542830 duplicate bytes into existing canonical public paths. Preserve review metadata, source rights and SHA-256. The stage script reuses canonical bytes only after size/hash validation; no publication status is promoted.
- Retain all unpublished candidate assets, all public assets, all database rows, and Git history. Do not rewrite history or delete user records.
- Guard the review manifest and actual file bytes in mandatory CI with `node scripts/catalog/audit-storage.mjs`.
- Ignore temporary audit and browser evidence folders, which are uploaded as separate CI artifacts where configured.
- Cache content-addressed approved assets with immutable headers; use already compressed family WebP assets directly and read dimensions from the manifest, avoiding unnecessary image-transform variants.

## Remaining checks

Actual runtime browser, CI and deployment validation remains required. Large existing editorial JPEGs should be converted only after checking visual quality, updating all consumers and preserving attribution. Live database storage, backup usage, indexes, private uploads and retention need authenticated read-only measurement; no destructive cleanup or production data deletion is authorized here. This tree audit does not certify full project functionality.

## Live production database read-only audit (2026-11-25)

Database size 15,709,875 bytes, public relations 54, public table/index total 1,851,392 bytes, public indexes 1,302,528 bytes. No public base table without RLS; no identical non-unique valid index definitions detected. Two private buckets, zero objects. Catalog exact counts: 9 categories, 14 brands, zero products, variants, or inventory. Existing offline draft exporter and disposable DB idempotency verification must pass before production catalog import; never create unverified stock or prices.

Supabase advisor worklist: 53 unindexed foreign keys (info), 31 unused indexes (info), 12 auth init-plan policy warnings, 12 multiple permissive policy warnings, 5 authenticated SECURITY DEFINER warnings, and leaked-password protection disabled. These are not automatically proven security vulnerabilities. Do not drop unused indexes from an early-stage database or add all FK indexes without workload evidence. Confirm function role/ownership guards and equivalent RLS semantics on isolated staging before production changes. All five flagged functions are non-executable by anon and contain auth.uid() references; that alone does not certify authorization.

Catalog API now uses stable slug cursor pagination and category-scoped queries, bounded signed-media requests, and filters published variants. The UI fetches 24 products per page and replaces page data rather than retaining the entire catalog. Existing default API page size remains 100. No production database writes were performed. CI, real pagination against populated staging, authentication and full mobile verification remain pending.

## Bounded rendering and storage budgets

Reference discovery now renders 24 product families per page while preserving full-catalog search, all technical variant links and total counts. Filters reset pagination. Public offer polling pauses while hidden, shares one request, uses a ten-second timeout and removes expired/stale offers independently of refresh. Mandatory storage audit checks 16 MiB tracked tree, 10 MiB public images, 4 MiB review assets and 512 KiB per public image. These are initial capacity targets; revise explicitly as legitimate content grows. Audit rejects review bytes duplicated in public assets. Full build and E2E still required before release.
