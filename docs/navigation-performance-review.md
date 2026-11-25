# Navigation and paint regression review
- The root loading boundary streamed a 200 before notFound could select HTTP 404. The authenticated editorial archive test caught this. Loading is now route-scoped to the plot portfolio; missing catalog and unpublished article routes retain their original status.
- Keep the original authenticated archive assertion and shared interaction accessibility guard. Decorative navigation feedback CSS is isolated; the overlay cannot capture taps.
- Intent prefetch remains bounded and excludes editorial details, account, order, quote and other private paths; opt out of automatic prefetch on selected account/checkout links. No speculative writes, no global cache of sensitive responses.
- Preview tint uses a reusable RGBA scratch buffer and two shade surfaces, released when the photo changes or the editor unmounts. A simple fallback remains if a tint surface is unavailable. Physical colours and manually drawn masks remain approximate.
- Browser checks record actual local navigation times, not a promise of instant content. Production p95, mobile heap and slow-network measurements remain required before claiming performance targets.
