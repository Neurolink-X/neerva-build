# Draft catalog synchronization

Run `node --experimental-strip-types scripts/catalog/export-draft-catalog.mjs` from the repository root to generate reviewable SQL. Test the export twice on a disposable database before applying to production. Reference rows and internal reference codes remain draft; existing records are never overwritten. No inventory, prices, dealers or manufacturer SKU verification is created. No hosted synchronization has been executed.
