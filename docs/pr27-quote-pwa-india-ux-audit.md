# Neerva PR27 — quote, PWA, fit and India-first UX audit (2026-11-23)
## Verified code problems
- Legacy quote layout stays two columns until 680px with 10-11px labels, causing crowding. Secure RFQ submission is disabled while approved dealer sourcing is unavailable, so users need an actually usable draft action.
- Home header selects Kanpur or Noida without verifying delivery. Home marketing says Kanpur first rather than a nationwide aspirational message.
- Studio landing starts with fixed three examples, independent of plot dimensions. Fit page calls its simple land envelope LIVE CONCEPT STUDY, confusing users who expect an actual house design.
- Install page only explained browser menus. Existing global PWA banner depends on dismissal and is not a reliable permanent entry point; browser decides if an install prompt exists.
- Footer/header vary across routes; tablet and mobile nav need consistent access. There is no verified marketing-offer dataset supporting discount countdowns or scarcity messaging.
## Implemented fixes
- Clear 16px-input responsive quote form, one-column phone layout, honest disabled RFQ note, local Copy draft excluding contact information; no false backend submission.
- Plot-first studio landing with dimensions, road, rooms, floors and parking, redirecting to PR26 validated shared 2D/3D portfolio; truthful simple land-size preview and direct plan link on /fit.
- India-first home slogan in Hindi/English without suggesting nationwide delivery; quote delivery city requested in form instead of header dropdown; buyer education on GST, freight and unloading, without fake offers.
- Dedicated live browser beforeinstallprompt action with iOS/Android/desktop fallback, manifest/SW retained; no duplicate global banner on /install.
- Consistent 360-1440px headers and footers, responsive menu for catalog and homepage, studio and quote.
- Browser E2E extended for PWA event wiring, quote draft copy, studio URL handoff, layout overflow.
## Release constraints
- Stacked on PR26, not merged or live until both PR26 and PR27 pass final GitHub CI/mobile and deployment checks.
- No live dealer price or submitted RFQ claim; no installer guarantee on unsupported browsers or app-store promise.