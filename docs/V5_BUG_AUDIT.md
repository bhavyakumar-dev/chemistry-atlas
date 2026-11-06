# Chemistry Atlas V5 — source-level bug and reliability audit

**Release:** 0.5.3 · **Audit date:** 4 November 2026

This document records defects and risks identified during the available source review, the changes made, and the regression checks. It does not claim that every possible bug has been found. Full dependency-backed build, real-browser/device testing, a live Cloudflare environment and educator review are not available in this workspace.

## Fixes made in this source release

| Area | Defect / risk | V5 change | Verification |
|---|---|---|---|
| Browser storage | `sessionStorage` can throw in restricted/private contexts | Guard token reads/writes/removals and retain safe fallback behaviour | Source/security checks |
| API connectivity | Network failures could leave portfolio download without a useful state | Return a bounded, user-safe service error | Syntax check; live endpoint still required |
| Request parsing | JSON length could be checked after full read and UTF-16 character count is not a byte limit | Stream request bytes, enforce cap, reject malformed/non-object JSON | Security regression tests |
| Multipart upload | `Content-Length` could be missing or misleading, allowing a chunked body to bypass a header-only check | Count actual streamed request bytes before multipart parsing | Security regression test |
| Cookie parsing | Malformed percent-encoding could throw during session lookup | Treat malformed cookie as absent | Security regression test |
| Password verification | Unbounded stored PBKDF2 iteration parameters could create CPU exhaustion | Validate scheme, salt/digest lengths and iteration range before computation | Security regression test |
| CORS | Frontend and configured origins could drift | Apply an exact-origin allowlist including configured frontend origin | Security regression tests |
| CSRF | Cookie-authenticated mutations did not consistently require a trusted browser Origin | Require trusted Origin for cookie-only mutations; explicit bearer token clients remain a separate path | Security regression tests; live browser testing required |
| Bootstrap race | Two first-admin requests could pass a prior account-count check | Atomic one-time D1 bootstrap guard migration `0006` | SQLite migration/logic test; live D1 transaction test required |
| Bootstrap abuse | No per-IP limit and direct secret comparison | Add bootstrap rate limit and constant-time comparison | Security regression tests; live D1 rate test required |
| Login abuse | Per-email throttling could be bypassed by rotating identifiers | Add per-IP and per-email limits and password input bounds | Source/security tests; live rate test required |
| API error exposure | Unexpected database/runtime exceptions could be returned as raw 400 errors | Expected validation errors map to safe 400; unexpected errors map to generic 500 | Regression test verifies internal error text is not returned |
| Learning-event integrity | Impossible scores, out-of-range duration and oversized event metadata could pollute analytics | Validate event types, score/max-score, duration and safely truncate metadata | Security regression tests |
| Tutor prompt injection | Browser-supplied grade/track/chapter text was interpolated into system instructions; forged assistant history could be submitted | Keep system prompt static, restrict study metadata to an allowlist, put context in user-role content, and discard client-supplied assistant turns | Security regression test |
| Analytics dimensions | Client-controlled grade/track labels could pollute cohort outputs and optional AI summary context | Persist only known grade/track values and map unexpected legacy values to a neutral Other bucket; allowlist event labels | Security regression test and source inspection |
| Teacher analytics privacy | Small classes could be exposed through narrow cohorts; optional AI failure could break dashboard | Suppress cohort/topic groups with fewer than three distinct learners; show aggregate dashboard when optional AI summary fails | Source/query tests; real multi-school D1 test required |
| Upload spoofing | Client-declared MIME type can be forged | Validate supported JPEG/PNG/WebP/PDF/MP4/WebM magic bytes and size | Security regression tests |
| Upload orphan | R2 object could remain if D1 metadata insert failed | Delete newly uploaded R2 object on metadata persistence failure | Source review; live R2 failure injection required |
| Portfolio race | Concurrent requests could claim the same uploaded media item | Use a conditional D1 batch to claim only still-unassigned media and reject conflicts | SQL/source regression; live D1 concurrency test required |
| Portfolio validation | Arbitrary title/body/category/media ID shapes could enter records | Validate types, lengths, array count and duplicate IDs before persistence | Syntax/source regression |
| V5 feature flags | Admin switch could imply unimplemented functionality was available | Match feature API whitelist to actual non-planned registry IDs; planned features remain locked | Content validator |
| Neutral equation balancing | No implemented solver or clear supported-input boundary; empty nested groups could be accepted | Exact-rational nullspace solver for supported neutral formulas; reject ionic/redox, hydrate, empty-group and ambiguous cases | 9 balanced fixtures; 8 invalid/unsupported fixtures |
| Molecular viewer | Cached/remote SDF content and overlapping requests could produce stale/unsafe renders | Validate SDF/cache content, abort stale fetches and guard render lifecycle | Syntax/source review; browser model tests pending |
| Edition paths | Edition links/docs could diverge | Keep V1–V5 registry, shared base path and generated static entry routes | YAML/script syntax; actual Pages route test pending |
| Content checks | No single command ran the complete source-level regression suite | Add `npm run validate:all` | Run as release check |

## Regression gates

- TypeScript/TSX syntax parse across source and Cloudflare Functions.
- Authored curriculum and learning-content inventory, question structure and extension-unit mapping.
- Exactly 50 unique advanced feature IDs, status-count check and feature API allowlist match.
- Nine positive and eight negative/unsupported neutral equation solver fixtures.
- SQLite execution of migrations, teacher analytics query checks, prompt/version tables, scientific provenance and atomic bootstrap guard logic.
- Security tests for byte-limited JSON and multipart bodies, malformed cookies, browser Origin/CSRF policy, error redaction, PBKDF2 parameter bounds, file signatures, event score/duration validation, metadata truncation and constant-time bootstrap-secret comparison.
- JavaScript syntax of build/data/validation scripts, dataset manifest JSON, and GitHub Pages workflow YAML.

## Not yet verified — do not mark these as solved

1. Full dependency installation, TypeScript project type-check and Vite production build. The dependency installation attempt timed out; the full React/Three/Vite dependency tree is not present here.
2. Browser end-to-end tests, accessibility audit, reduced-motion review, screen-reader tests and real Android/low-end laptop/projector rendering.
3. Cloudflare D1 transaction behaviour, live R2 cleanup, session/CORS behaviour, authentication and all API endpoints on the owner's real deployment.
4. Live Workers AI model availability, quotas, data handling and grounding.
5. Deployed cross-edition learner data behaviour and release rollback tests.
6. Scientific review by a chemistry educator and independent comparison against reference structures/calculations.
7. Full external dataset download; this project stores a licence-aware source register and bounded downloader, not complete mirrors of PubChem/COD/RCSB/NIST/ORD.

## Release decision

V5 is a **quality-preview source release**. The defects described above have corresponding source changes and selected regression tests. Remaining release gates require dependency-backed build, real-browser/device testing, live Cloudflare integration and educator sign-off. “Solve all bugs” is treated as an ongoing defect-management requirement: reproduce, fix, add a regression test, and record anything that remains unverified.
