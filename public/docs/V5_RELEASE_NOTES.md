# Chemistry Atlas V5 — Precision, Safety & Quality

**Package version:** 0.5.4  
**Date:** 4 November 2026  
**Release type:** quality-preview source release

## Permanent product promise

Chemistry Atlas is intended to remain free to learners, non-commercial and ad-free permanently. There are no subscriptions, paid feature tiers, sponsored placements, paid model packs or mandatory paid API dependencies for core learning. Core lessons, revision and offline-friendly study should remain useful when optional AI or external datasets are unavailable. Hosting, storage, bandwidth and optional AI may still impose operator-side limits or costs; those must not become learner paywalls.

The existing repository MIT licence is a separate source-code licence which permits commercial reuse of the code. This product promise does not alter that legal licence.

## V5 additions and refinements

- Five administrator-selectable editions (V1–V5), with five static edition entry routes. These are edition builds from one current source tree, not historical snapshots.
- A governed registry of exactly 50 advanced feature definitions with acceptance criteria and explicit status: **15 available, 6 preview/configuration-dependent, 29 planned/locked**. Only implemented/preview capabilities can be toggled; roadmap items cannot be enabled by configuration alone.
- Feature gating for the implemented molecule, laboratory, teacher analytics, AI tutor, prompt-history, open-science and neutral-equation-balancer surfaces.
- A working exact-rational neutral molecular equation balancer. It supports a deliberately bounded formula grammar, displays atom conservation, and rejects ionic/redox, hydrate, ambiguous or unsupported inputs rather than guessing.
- Nine positive equation regression fixtures and eight invalid/unsupported fixtures; the pure solver passes an isolated strict TypeScript type-check.
- Streamed byte-counted JSON parsing and actual streamed-byte bounds for multipart uploads, including requests with missing or misleading `Content-Length`.
- Exact-origin checks for browser cookie mutations, explicit missing-Origin denial, robust malformed-cookie handling and a clear boundary between browser cookies and explicit bearer-token clients.
- Bounded PBKDF2 verifier parameters, constant-time bootstrap-secret comparison, per-IP/per-email login throttling, bootstrap throttling and atomic first-administrator guard migration `0006`.
- Safe API error handling: expected invalid input returns a controlled 400; unexpected server/database errors return a generic 500 without leaking internal exception details.
- Learning-event validation: impossible scores, invalid durations and oversized event metadata are rejected or safely truncated before persistence.
- Tutor prompt-injection boundary: system instructions are static, browser-controlled study context stays in user-role content, and forged client-supplied assistant turns are discarded.
- Analytics dimension allowlists: only known grades, tracks and event types are persisted/presented; unexpected legacy dimension strings are bucketed as Other.
- Reject empty nested formula groups and cover this case in the equation solver negative-input suite.
- Teacher analytics privacy safeguards: small cohorts below three distinct learners are suppressed; optional Workers AI summary failure no longer makes the aggregate dashboard unavailable.
- Portfolio hardening: title/body/category and attachment identifiers are validated, upload media signatures are checked, and attachment-claim updates use an atomic conditional D1 batch to prevent concurrent attachment races.
- Molecular viewer hardening: validate downloaded SDF/cache content, cancel stale requests, guard rendering lifecycle and provide a fallback when WebGL/ResizeObserver is unavailable.
- Browser-storage guards, clearer fetch failure reporting, offline-friendly system font fallbacks and removal of remote Google Fonts calls.
- Permanent free/non-commercial/ad-free product policy and owner checklist updated to reflect decisions already confirmed by the project owner.
- One-command source regression suite: `npm run validate:all`.

## Current implementation boundary

The 50-feature registry is not a claim that all 50 systems are implemented. There are 15 available, 6 preview/configuration-dependent and 29 planned/locked. V5 adds a bounded equation balancer and reliability/security refinements; it does not yet implement the complete chemistry sketcher, broad reaction-mechanism engine, multi-electron quantum solver, full spectroscopy suite, calibrated instrument bench, all 47 independent lab simulators or the V7 molecular digital twin.

## Validation and release gate

Run `npm run validate:all` for TypeScript/TSX syntax, curriculum/content contracts, equation-balancer regressions, SQLite schema tests and selected API/security regression checks. These checks are source-level tests, not a substitute for a dependency-backed `npm run typecheck`/`npm run build:editions`, live Cloudflare integration, browser/device accessibility and end-to-end tests, performance testing, or educator review.

**Release status:** quality-preview source. Do not call it production-certified or claim all possible bugs are solved until the outstanding checks in `VALIDATION_REPORT.md` pass.
