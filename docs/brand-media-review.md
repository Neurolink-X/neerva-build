# Brand asset review and local bundling

Kohinoor: the HomeRun listing for 32 mm sink waste PVC pipe identifies Kohinoor Impex. The existing local WebP depicts the product but has no visible manufacturer mark. Do not use an unrelated Kohinoor Pipes, apparel or jewellery mark. The corporate logo remains unconfirmed.

Candidate review: the read-only GitHub Actions job downloads registered HTTPS image candidates, validates and converts them, and uploads a source/status report and candidate WebP files. These files are not public application assets and no repository write or deployment occurs.

Local publication: visually review each candidate, confirm the brand/product and permission for commercial republication, then run `node --experimental-strip-types scripts/catalog/import-brand-media.mjs <approved HTTPS URL> ...`. Commit the generated manifest and actual WebP files together. Failed or unapproved files must remain absent from the manifest. Production builds never download these files. Existing local product images and text fallbacks remain available.

Do not infer stock, SKU, endorsement or trademark ownership from a decoded image.
