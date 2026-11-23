# Neerva Build photography and product media audit — 23 November 2026

## Source/permission controls
The home hero and house-gallery *editorial* references in `src/modules/home/assets.ts` are fetched from Unsplash CDN using stable photo IDs. Licence: https://unsplash.com/license (commercial-use permission for photographs, without claiming property or person permissions outside the photograph). They are for broad architectural style only.

Image refs:
- `photo-1600585154340-be6161a56a0c`
- `photo-1600596542815-ffad4c1539a9`
- `photo-1600047509807-ba8f99d2cdde`
- `photo-1600585152915-d208bec867a1`
- `photo-1600573472591-ee6b68d14c68`
- `photo-1600585152220-90363fe7e115`
- Construction/editorial `photo-1504307651254-35680f356dfd`

All are reference photographs, **not** NEERVA-built structures, architectural drawings based on the given 2D plot, a verified project location or a same-building construction time lapse. The interface explicitly states construction/finished photographs depict **different properties**. Do not describe these as architectural renders of any portfolio option.

Retain responsive image sizes, lazy-load non-hero photos, avoid adding unbounded requests, and review actual CDN availability and Next.js optimization in the mobile CI/preview.

## Manufacturer images: exact SKU and rights are mandatory
There is no signed, supplied manufacturer SKU pack photograph in Neerva's actual DB as of this audit: `products=0`, `product_variants=0`, `inventory=0`; 14 brand names exist as **draft reference records**, not authorised/dealer verified. Examples: ACC, UltraTech, Ambuja, Tata Tiscon, JSW, Astral, Supreme, Polycab, Kajaria, Asian Paints.

An actual product photo may be marked exact only with:
1. Confirmed manufacturer and model/grade/bag size `sku`, not just marketing brand.
2. Photograph uploaded by an authorised partner/manufacturer, with an approved rights/license record.
3. Complete alternate-angle assets for the *same* SKU, with checksums; no repeated pipe/cement sample files claimed as different camera angles.
4. Approved dealer branch and correct stock row, and separately approved public pricing. No stock quantity or rupee figure inferred from photo.
5. Admin publishing review and auditing before image is labelled exact. Current code `CatalogMaterialImage` and `ProductGallery` intentionally fall back to *illustrative* category photos if no approved exact SKU photo.

Trusted product **references** (links, not copied imagery):
- ACC product portfolio: https://www.acclimited.com/annual-report-2025-26/product-portfolio.html
- Ambuja manufacturer: https://www.ambujacement.com/
- UltraTech manufacturer: https://www.ultratechcement.com/

Avoid unauthorized bulk mirroring or hotlinking of manufacturer packaging and trademark materials into local Neerva assets. A generic cement bag cannot honestly be advertised as “ACC PPC 50kg”.


## Media audit 2 — real material imagery and actual branded identities

Not all search hits are reusable: Google Images is a discovery index, **not** a reuse licence. Never scrape images from a distributor, competitor, search snippet or aggregator and call them manufacturer-authorized.

Three additional **real photographs** replace decorative category SVGs. Individual Pexels photo pages state "Free" licence. Original page and credited creator remain reachable at:
- Painting supplies — https://www.pexels.com/photo/paintbrushes-and-paint-buckets-6764238/ ; reference asset https://images.pexels.com/photos/6764238/pexels-photo-6764238.jpeg
- Physical tile samples — https://www.pexels.com/photo/colorful-ceramic-tile-samples-on-display-40080972/ ; reference asset https://images.pexels.com/photos/40080972/pexels-photo-40080972.jpeg
- Metal screws/bolts — https://www.pexels.com/photo/high-angle-shot-of-bolts-and-screws-on-white-surface-4049352/ ; reference asset https://images.pexels.com/photos/4049352/pexels-photo-4049352.jpeg
- Pexels licence rules: https://www.pexels.com/license/. These are category sample photographs, not stock photos of specific SKUs or manufacturer trademarks.

Actual original brand-logo media, reused solely for **nominative identification**, is sourced from:
- ACC — https://commons.wikimedia.org/wiki/File:ACC_Limited_logo.svg . Commons PD-textlogo; **trademark restrictions remain**.
- UltraTech — https://commons.wikimedia.org/wiki/File:UltraTech_logo.jpg . Commons PD-textlogo; **trademark restrictions remain**.

The genuine UltraTech manufacturer press-media packaging reference image comes from https://www.ultratechcement.com/corporate/media/press-kit and uses https://www.ultratechcement.com/content/dam/ultratechcementwebsite/media/ultratech_indi-27sno-1cement_hiresr1.jpg . It is an **official pack image/artwork**, not guaranteed a photograph, and it does not prove a particular bag grade/weight/SKU or that NEERVA is an authorised dealer. Keep a link to the press kit and do not use the image as exact SKU verification.

All other brand names must remain text-only until their authentic logos and use rights are reviewed. In particular, Wikimedia file `AMBUJA LOGO.jpg` describes GAEL (Gujarat Ambuja Exports Ltd) **not Ambuja Cements**, so it MUST NOT be displayed as the cement manufacturer's mark.

**External availability:** Use optimised responsive sizes and narrow Next.js `remotePatterns`; if a CDN asset is blocked, fallback to labelled textual identity and submit an image incident for later verification. No invented price, certification, brand affiliation or inventory claim is permitted.
