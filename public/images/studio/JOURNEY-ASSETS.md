# Premium construction journey image pair
The new local images are AI-generated illustrative stages, not project photography or a measured bill of materials.
Place both reviewed WebP files in this directory, without changing their bytes:
- journey-finished.webp (90,956 bytes; 1200×600)
- journey-shell.webp (116,840 bytes; 1200×600)

The server validates both SHA-256 digests and dimensions before using the new pair on the home comparison and new Colour Studio masks. Until both assets are present, the previous working image and mask pair remains selected. The asset test now rejects missing, incomplete or modified pairs in CI, including when both images are absent. The runtime fallback is retained for recovery only. No external downloads, API or paid service needed.

Upload both files together to the PR branch in this directory, then run `npm test`. Do not overwrite the legacy assets or reuse their masks for this new home.
