# Migration reconciliation

Fresh local Supabase replay failed at 0028 with SQLSTATE 42883: missing neerva_account_access_allowed(). The production migration history already contains the nine missing administrative/catalog migrations. Restored the recorded SQL in original order in repository slots 0020–0027 (last slot contains two consecutive production migrations). No new production DDL executed. Do not push these numbered migrations against the existing hosted database or repair its history blindly; reconcile the recorded production version IDs first.

- 20261124105110 — neerva_admin_profile_directory
- 20261124105459 — neerva_admin_review_and_staff_controls
- 20261124111248 — neerva_catalog_media_and_private_kyc
- 20261124112442 — neerva_customer_access_and_evidence_guards
- 20261124113117 — neerva_operations_incident_recovery_and_dealer_roles
- 20261124122148 — neerva_batched_admin_snapshot
- 20261124123644 — neerva_design_review_queue
- 20261124124649 — neerva_public_refresh_signals
- 20261124124917 — neerva_admin_business_metrics

CI must verify a completely fresh database before authenticated order lifecycle can be considered passing.
