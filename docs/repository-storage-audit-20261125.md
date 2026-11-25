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
