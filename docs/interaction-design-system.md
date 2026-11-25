# Interaction design system

Use native links for navigation and native buttons for operations. Existing .button variants remain supported. The shared style sheet is loaded once from the root layout.

| Purpose | Markup class and variant |
| --- | --- |
| Main action (checkout, submit, generate) | .nb-action + data-variant="primary" |
| Secondary action (review, compare, add to cart) | .nb-action + data-variant="secondary" |
| Selected marketing action | .nb-action + data-variant="accent" |
| Low-emphasis text action | .nb-action + data-variant="quiet" |
| Explicit destructive action | .nb-action + data-variant="danger" |

Use data-size="large" for high-priority actions and data-size="icon" only with a meaningful accessible name. Prefer one main action per decision area. Keep the underlying native semantics, href, type, and disabled state; CSS does not grant access, submit forms, or block navigation. Use a native disabled button for unavailable operations, and omit href from unavailable navigation. For asynchronous operations, expose actual pending state with aria-busy and prevent repeat submissions in the handler, not CSS.

Keep inline reading links underlined; do not turn all links into filled buttons. Use aria-pressed for genuine toggles. Do not rely on color alone for meaning. Verify focus, keyboard navigation, long Hindi/English labels, 360–1440px layout, disabled and reduced-motion states. The automated browser audit inventories small and unnamed controls and gates primary touch height; it does not prove all dynamic links or authenticated operations work. No animation library, icon dependency, or remote assets are required.
