# Changelog

## 0.5.3 — V5 tutor and analytics trust-boundary refinement · 4 November 2026

- Keep tutor system instructions static; learner-supplied grade, track and chapter context now remains user-role metadata.
- Discard client-supplied assistant-history messages because browser-provided assistant turns cannot be authenticated. Retain only bounded prior learner turns.
- Restrict persisted grade and track analytics dimensions to the platform's known grade/track vocabulary; map legacy unexpected dimensions to an `Other` bucket in the teacher view.
- Allow only known learning-event types into AI analytics aggregates; continue excluding free-text topic labels and individual work from AI summaries.
- Reject empty nested formula groups in the equation balancer and extend negative-input regression coverage to eight cases.
- Add regression tests for tutor prompt-injection boundaries and analytics dimension allowlists.

**Verification boundary:** source-level validation passes; full dependency-backed build, browser/device and live Cloudflare integration remain open.

## 0.5.2 — V5 reliability refinement · 4 November 2026

- Promoted the neutral-equation balancer to an available V5 feature. Added exact-rational solving, atom-conservation explanation and explicit rejection of unsupported ionic/redox/hydrate/ambiguous inputs.
- Expanded regression coverage to nine balanced examples and seven invalid/unsupported inputs.
- Added actual streamed multipart byte enforcement; declared `Content-Length` is not treated as a trustworthy size boundary.
- Redacted unexpected server exceptions to a generic 500 response while preserving safe, expected input errors.
- Validated analytics event score/max-score/duration ranges and bounded metadata truncation.
- Suppressed analytics cohorts below three distinct learners and made the aggregate teacher dashboard resilient to optional Workers AI summary failures.
- Added atomic portfolio-media attachment claiming and stricter portfolio/review/admin input validation.
- Updated the V5 release audit, data/feature acceptance documentation and `npm run validate:all` status.
- The 50-feature registry status is now 15 available, 6 preview and 29 planned/locked.

**Verification boundary:** source-level tests pass. Dependency-backed full build, browser/device tests, live Cloudflare integration and independent chemistry educator review remain open.

## 0.5.1 — V5 refinement pass · 4 November 2026

- Added a working exact-rational neutral chemical equation balancer with a clearly bounded formula grammar and explicit rejection of ionic/redox/hydrate/ambiguous cases.
- Added nine balanced-equation fixtures and five negative/unsupported input regression cases.
- Added the balancer's V5 feature flag and integrated its UI into the laboratory workspace.
- Added one-command `npm run validate:all` including the chemistry solver regression set.
- Updated teacher contribution guidance to record the user's already-confirmed free/non-commercial/ad-free policy and all six learning tracks.
- Remaining browser, full-build, live Cloudflare and external educator checks are still release gates.

## 0.5.0 — V5 Precision & Quality preview · 4 November 2026

- Confirmed the permanent product policy: free to learners, non-commercial and ad-free; no paid tiers, ads, sponsored placement or mandatory paid API in core learning paths.
- Added 50 governed advanced feature records with unique IDs, status, target release and acceptance criteria: 14 available, 6 preview and 30 planned/locked.
- Expanded V1–V5 edition selector and static build targets; V5 is the root edition.
- Added administrator feature registry filters and switches for integrated available/preview features; planned entries remain locked.
- Added V5 feature gating to current molecule, lab, teacher analytics, AI tutor, prompt history and open-science surfaces.
- Improved API browser-storage fallback, response handling and portfolio-download error messaging.
- Reworked JSON parsing to stream and enforce a byte limit; handle malformed cookies safely.
- Added exact-origin rejection for cookie-authenticated state-changing requests.
- Bounded PBKDF2 verification parameters; added per-IP login throttling and bounded password lengths.
- Added constant-time bootstrap-secret comparison, bootstrap throttling and migration 0006 atomic first-admin guard.
- Validated uploaded file signatures for supported image, PDF and video MIME types; remove an orphaned R2 object when D1 metadata persistence fails.
- Improved molecule SDF/cache validation, stale request cancellation and WebGL fallback handling.
- Removed external Google Fonts requests and use system font fallbacks.
- Added 50-feature catalogue, V5 release notes, source-level bug audit and permanent-free policy.
- Added security regression smoke tests and `npm run validate:all`.

### V5 limits

- This is a quality-preview source release, not a production-certified stable release.
- Only 14 registry features are marked available and 6 are preview/configuration-dependent. Thirty roadmap entries remain locked; the registry is not a claim that all 50 engines are implemented.
- Dependency-backed Vite build, live Cloudflare/D1/R2/Workers AI tests, browser/device accessibility and e2e testing, and chemistry teacher review remain release gates.
- No remote GitHub write or deployment is claimed from this preparation session; the GitHub integration returned HTTP 403 on write calls.

## 0.4.0 — V4 Open Science preview

- Added the scientific-source and licence registry, dataset provenance schema and bounded data acquisition manifest.
- Restricted student-facing PubChem access to an educator-reviewable six-record allowlist.
- Added open-science governance and V7 engineering roadmap documents.
- Added V1–V4 release selector and static entry targets.
- Established free-first, non-commercial, ad-free product direction.

## Earlier releases

See `docs/V2_RESEARCH_AND_ACCURACY.md` and repository history for earlier V1/V2 foundations and V3 feature research. Older source builds should be preserved by Git tags/commits when the repository is populated.
