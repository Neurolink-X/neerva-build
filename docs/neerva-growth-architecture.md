# Neerva growth architecture
## Product loops
Discovery → inspiration board → create/share → revisit → optional project or quote.
Academy → short concept → worked example → actual tool → optional knowledge check → next lesson.
Keep checkout and professional functionality separate from engagement; no artificial urgency, streak punishment, or account wall.
## Performance and memory
Static lesson routes and small client islands; no extra dependency, background fetch, polling, or media downloads for Academy. Store only validated stable lesson IDs (completion and optional practice), not answers, personal data, images, or activity history. Bound reads to 4 KiB and persist only explicit changes. Existing board and project use local-only records. Avoid duplicate global state. Use atomic multi-file commits to reduce unnecessary CI and preview builds. Measure mobile INP, LCP, CLS, JS transfer and heap before claiming improvement.
## Future staged expansion
1. Expand curated learning and inspiration by topic, review accuracy and provenance, translate full lessons, and add usable calculators or simulations only with verified assumptions.
2. Add multiple named boards, plan comparison and export using existing PlanModel geometry; validate storage sizes and migrations. Build furniture placement in an on-demand route with bounded canvas/WebGL resources and disposal.
3. Optional cloud sync only after explicit user choice, authentication, RLS, deletion/export controls, quotas and retention policy.
4. Community/portfolio publication only after moderation, rights/provenance, abuse controls, reporting and private-by-default drafts. No open user uploads before quotas and security controls.
5. Add first-party funnel measurement only with disclosed minimal events, privacy review and aggregation; never claim verified leads or sales before actual intake and fulfilment work. Measure meaningful return visits, board saves/shares, learning-to-tool navigation, qualified enquiries and completed orders, not time spent alone.
