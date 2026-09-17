# Security Record

## Security Gate Status
- Automated Security Scan: [ PASS / FAIL ]
- Dependency Audit (npm audit): [ PASS / FAIL ]
- Secrets & Credential Verification: [ PASS / FAIL ]
- AuthN / AuthZ / IDOR Review: [ N/A — static lead-gen page ]
- Injection & Data Flow Review: [ PASS / FAIL ]
- RLS / Database Policy Review: [ N/A — no database ]
- Security Headers & Production Configuration: [ PASS / FAIL ]
- Overall Security Status: [ PASS / FAIL / BLOCKED ]

## Automated Scan Results
- Critical Issues: 0
- High Issues: 0
- Medium Issues: 0
- Low Issues: 0
- Command run: `node scripts/security-scan.mjs`

## Authentication & Session Management
- Auth Provider: None (static lead-gen page)
- Session Storage: N/A

## Authorization Matrix & Access Control
- Server-side Enforcement: N/A (no authenticated routes)

## Database & Row Level Security (RLS)
- N/A — no database integration

## Input Validation & Injection Defenses
- Validation Library: N/A (Tally handles form submission)
- XSS Defenses: Standard React escaping; no dangerouslySetInnerHTML
- Command / Code Execution: No eval, new Function, or child_process

## Security Headers
- `Content-Security-Policy`: [ To be configured in next.config ]
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`

## Environment & Secrets Inventory
> [!NOTE]
> Inventory of required environment variables (names only — never record values).
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Client safe — GA4 measurement ID)

## Known Limitations & Follow-Up Items
- Add security headers via `next.config` before production deployment
- Verify Tally form CORS/CSP allows iframe embed on production domain

## Sign-off
- Auditor / Agent:
- Date:
- Result:
