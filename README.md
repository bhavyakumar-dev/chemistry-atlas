# Chemistry Atlas — V5 Precision & Quality preview · 0.5.3

Chemistry Atlas is a free-to-learn, non-commercial and ad-free chemistry-learning platform for ICSE Class 10, ISC Classes 11–12, and mapped CBSE, JEE Main, JEE Advanced enrichment and NEET pathways. The frontend uses React, TypeScript and Three.js. Cloudflare Pages Functions provide optional authenticated services using D1, Workers AI and R2.

> **Release truth:** V5 is a quality-preview source release. It adds a 50-entry governed feature registry, V1–V5 edition selection, selected feature rollout switches, molecule-viewer and browser/API hardening, a byte-limited request reader, trusted-origin checks, password-verification bounds, safer portfolio uploads, analytics cohort privacy, tutor prompt-injection boundaries, and an atomic one-time bootstrap migration. The registry intentionally marks unimplemented capabilities as planned and locked. The neutral-equation balancer is now an implemented V5 module with exact-rational solving and explicit supported-scope limits. 0.5.2 also hardens upload byte counting, unexpected-error redaction, analytics event validation, small-cohort privacy and portfolio attachment concurrency. A full dependency-backed Vite build and browser/device end-to-end tests could not be run in this environment; therefore V5 is not described as production-certified and “all bugs solved” is not claimed.

## Permanent product promise

Chemistry Atlas is intended to remain **free to learners, non-commercial and ad-free permanently**. There will be no subscription, paid feature tier, paid model pack, display ad, sponsored result placement or mandatory paid API for core learning. Core lessons and revision should remain useful if optional AI or external data services are unavailable. Hosting, storage, bandwidth and optional AI may still impose operator-side quotas or costs; no learner paywall should be introduced to cover them.

The GitHub repository currently carries an MIT licence selected at repository creation. MIT permits commercial reuse of source code. That code licence is distinct from the non-commercial operating policy of the hosted product; this release does not change the repository licence.

## Edition model

| Edition | Purpose | Status |
|---|---|---|
| V1 | Preserved foundation | Original baseline |
| V2 | Molecular studio and virtual practical development | Partial research build |
| V3 | World-class learning and scientific assurance | Preview / roadmap |
| V4 | Open-science sources and licence governance | Preview |
| V5 | Precision, quality, feature governance and reliability | Quality preview |

The Admin Console selects V1–V5. The root GitHub Pages build opens V5, with static entry routes `/versions/v1/` through `/versions/v5/`. These routes are separate builds from the current codebase, not frozen historical source trees. Git commits and tags are the actual source history. A school-wide selector is stored in D1 only when Cloudflare is configured and an administrator is authenticated; static/local use falls back to browser storage.

## Learning content currently in source

- **28 authored CISCE lessons:** 9 ICSE Class 10, 9 ISC Class 11 and 10 ISC Class 12. Each has objectives, explanatory sections, equations where appropriate, worked example, exam focus, misconceptions and retrieval checks.
- **65 mapped extension units:** 24 CBSE, 20 JEE Main and 21 NEET. Each maps to core lessons, topic coverage, an assessment target and at least one question. These are mapped study packs, not 65 additional textbook-length manuscripts.
- **JEE Advanced:** 20 enrichment units built from the JEE Main chemistry map; they are not represented as a separately verified official exam syllabus.
- **123 original MCQs:** 56 CISCE, 24 CBSE, 22 JEE Main and 21 NEET, with options, answer and explanation. They are not a reproduced previous-year-paper archive.
- **47 experiment-library entries**, **6 interactive lab modes**, **5 low-risk DIY guides**, and **11 base 3D teaching models**. A catalogue entry is not automatically a dedicated independently validated simulator; each physical activity retains safety and adult/teacher supervision boundaries.

Track baselines and source URLs live in `src/content/tracks.ts`. Exam bulletins should be rechecked against the official issuing body before each academic-year release.

## V5 — 50 advanced feature registry

V5 contains exactly 50 unique feature records with descriptions, implementation status, target release and acceptance criteria:

- **15 available in source**
- **6 preview / configuration-dependent**
- **29 planned and locked**

Administrators can search/filter the registry and toggle only integrated available/preview modules. Planned items cannot be made to appear functional by a switch. See [the complete feature catalogue](docs/V5_ADVANCED_FEATURES.md).

### Source-level reliability changes

- Guarded browser session-storage access and clearer network errors.
- Streamed, byte-counted JSON request parsing and controlled malformed-body errors.
- Safe handling of malformed session cookies.
- Exact trusted-origin checks for cookie-authenticated state-changing requests.
- PBKDF2 record validation and an iteration-count bound before password verification.
- Per-IP and per-email login throttles, plus per-IP one-time-bootstrap throttling.
- Constant-time comparison of the one-time bootstrap secret.
- Atomic bootstrap guard (migration 0006) to prevent concurrent first-administrator creation.
- Portfolio upload signature checks for JPEG, PNG, WebP, PDF, MP4 and WebM; actual streamed-byte request caps; cleanup of an R2 object if D1 metadata creation fails.
- Safe unexpected-error redaction, numeric event validation, small-cohort analytics suppression, optional-AI fallback and atomic portfolio media attachment claims.
- Static tutor system instructions, allowlisted grade/track context, and rejection of forged client-supplied assistant history.
- Molecule structure validation/cache checks, stale-request cancellation and WebGL fallback messaging.
- Feature switches wired to relevant current molecule, lab, teacher, tutor, prompt and open-science UI surfaces.
- Removed external Google Fonts requests; system font fallbacks improve offline behavior and avoid that third-party request.

See [V5 source-level bug audit](docs/V5_BUG_AUDIT.md) for exactly what was changed and what still requires live testing.

## Scientific integrity and datasets

The source includes a scientific source/licence registry and a bounded acquisition manifest. It does not bundle a complete mirror of PubChem, COD, RCSB PDB, NIST or ORD. Each source/record has its own reuse conditions. Do not infer redistribution rights from a website being free to access. The six student-facing PubChem structures are an educator-reviewable allowlist, not a claim to a complete compound library. Full raw reaction-procedure corpora remain excluded until a teacher-reviewed, age-appropriate, appropriately licensed subset is approved.

Every scientific model should identify whether it is experimental, computational or idealised, with source record, units, assumptions, uncertainty, method and limitations. See:

- `docs/V2_RESEARCH_AND_ACCURACY.md`
- `docs/V3_WORLD_CLASS_BLUEPRINT.md`
- `docs/V4_OPEN_SCIENCE_AND_DATA_PLAN.md`
- `docs/V5_ADVANCED_FEATURES.md`
- `docs/V5_BUG_AUDIT.md`
- `docs/V5_RELEASE_NOTES.md`
- `docs/WHAT_WE_NEED_FROM_YOU.md`
- `docs/V7_ENGINEERING_MIRACLE.md`
- `scripts/datasets.manifest.json`

## Prompt and version governance

The in-app prompt registry uses stable prompt IDs and immutable revisions with activation/rollback. With Cloudflare D1 and an administrator session it is stored school-wide; otherwise it is browser-local. It records prompts explicitly entered into the manager and does not silently read other chats. The repository's [prompt version log](PROMPT_VERSION_LOG.md) records product-changing requests and their implementation status.

## Run locally

Requirements: Node.js 20+ (Node 22 recommended) and npm.

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run build:editions
npm run preview
```

Run the source-level validation suite:

```bash
npm run validate:all
```

This runs TypeScript/TSX syntax parsing, content-contract checks, SQLite migration/analytics/provenance/bootstrap smoke tests and security-helper tests. These are not a substitute for a dependency-backed TypeScript project build or browser QA.

## GitHub Pages publishing

The included `.github/workflows/deploy.yml` builds the root V5 site and five edition entry points, then publishes `dist/` to GitHub Pages using Actions.

1. Push the project to `bhavyakumar-dev/chemistry-atlas` on `main`.
2. In repository **Settings → Pages**, select **GitHub Actions** as the source.
3. If using Cloudflare as the API, add the GitHub Actions variable `VITE_API_BASE_URL` with the Cloudflare Pages project root URL (no trailing slash).
4. Confirm the Cloudflare API allows the frontend origin in `APP_ORIGINS`, and sets `FRONTEND_ORIGIN` to the exact frontend origin for cross-site session cookies.
5. Verify the workflow succeeds, then test root and every `/versions/vN/` route.

See [Windows push instructions](PUSH_TO_GITHUB_WINDOWS.md). The connected GitHub integration in this preparation session returned HTTP 403 on write calls, so this ZIP was not pushed by the assistant and no deployment is claimed.

## Cloudflare backend setup

The optional backend requires D1, Workers AI and R2. Follow `wrangler.toml` and `.dev.vars.example`:

- Create a D1 database and replace the placeholder ID in `wrangler.toml`.
- Apply all six SQL migrations.
- Create the R2 bucket named `chemistry-atlas-portfolios`.
- Bind D1 as `DB`, Workers AI as `AI`, and R2 as `PORTFOLIOS`.
- Set `BOOTSTRAP_ADMIN_TOKEN` as a secret.
- Set `APP_ORIGINS` to the exact allowed frontend origins and `FRONTEND_ORIGIN` to the frontend origin used by the cross-site cookie.
- Optionally set `AI_MODEL`; Workers AI availability and quotas are account-dependent.

Use first-time setup once to create the first admin. Migration 0006 closes the first-admin race. Never commit real secrets. The account system still needs a school/operator consent, retention, backup, account recovery and data deletion review before use with real minors or school data.

## Validation and known limits

0.5.1 validation is reported in `VALIDATION_REPORT.md` and the [bug audit](docs/V5_BUG_AUDIT.md). Source-level tests can pass while browser, deployment, D1 transaction and scientific-validation failures remain undiscovered. In this preparation environment, package installation/full Vite build, real browser end-to-end tests, Cloudflare live integration and chemistry teacher sign-off remain unverified.

Do not claim that the platform is fully bug-free, a complete replacement for laboratory work, a general quantum-chemistry package, or the world's best without independent evidence. The next steps are teacher review, a dependency-backed build, mobile/keyboard/screen-reader testing, live Cloudflare integration tests and a reproducible science benchmark suite.
