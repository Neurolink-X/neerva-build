# Customer journey release gate

## Auth / email
Production Auth logs returned `429 over_email_send_rate_limit`. A request cooldown is not an email-provider quota. Keep confirmation, anti-abuse throttles and RLS enabled. In Neerva's own Supabase dashboard configure a verified custom SMTP sender (suggested noreply@neerva.in, only after domain verification), SPF/DKIM and DMARC; disable mail link tracking for authentication links. Set site URL to https://neerva.in and allow the exact /account/verify callback, including the permitted checkout or order return parameters. Review the actual provider quota and bounce logs. Use Supabase's supported ConfirmationURL for the existing browser session flow, not a custom token-handling scheme without tests. Test signup, resend, magic link, recovery, expired links and private access using an authorised non-team test mailbox. Do not merge the callback change until the redirect allow-list is verified.

## Commerce
Verify NEXT_PUBLIC_RFQ_INTAKE_ENABLED and corresponding server guard, database migrations, RLS, rate limiting, idempotency and authenticated end-to-end submission before opening intake. No client-only flag change. Verify contractor workspace uses actual project, materials, quote and order routes; dealer application requires approved role.

## UI and planner
Test 320/360/393/768/1280px widths. On mobile choose a room and house exterior, switch colours/patterns, verify uncropped full preview and no unintended scroll. Test portrait, landscape and keyboard. Test 40x50 ft, 3 BHK, G+1 and 2 BHK variants across all road orientations: exact brief, total bedrooms, room overlap, circulation, stair alignment, open strips and independent 2D/3D geometry. Never describe concept validation as structural approval. Validate old saved design links and selected floor behavior. Test order guest/verified/expired sessions, both order sources, pagination, repeat order and permission isolation.

References: https://supabase.com/docs/guides/auth/auth-smtp ; https://supabase.com/docs/guides/auth/rate-limits ; https://supabase.com/docs/guides/auth/auth-email-templates
