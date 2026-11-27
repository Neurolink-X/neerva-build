# Academy and Knowledge Hub: local-first publishing
- Serve original educational explanations, worked examples and checklists from the repository. Do not import external images, scripts, fonts, iframes or video players for instructional content.
- Cite the actual institution, document title, date and official URL. Distinguish government targets, pilots and project evidence. Do not reproduce copyrighted standards, photos or articles without rights.
- External citations are optional, ordinary navigation with HTTPS, noopener, noreferrer and no-referrer. They do not execute a request as part of rendering the local lesson.
- Keep calculators and useful accessibility controls. Replace decorative simulations with evidence-led guidance; do not remove functional planning tools.
- Run `node --experimental-strip-types scripts/release/audit-learning-references.mjs` during monthly editorial review. A redirect, timeout or rejected HEAD is a review signal, not proof that a citation is invalid. Update references only after checking the document and its applicable scope.
- Do not make external site availability a production build requirement. The reference audit is manual to avoid recurring CI cost and false failures.
- Review local construction rules and professional safety requirements independently. Educational content is not construction approval.
