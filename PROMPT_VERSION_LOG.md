# Chemistry Atlas — prompt version log

This file records product prompts/change requests that define the project. Each distinct user prompt that changes scope, behavior, data, UI, security or deployment is recorded as a new revision under a stable prompt ID. Do not overwrite prior text; add a new revision and change note.

## `CHEM-ATLAS-3D-PLATFORM`

### v1.0 — 4 November 2026 — Initial V2 capability expansion

**Prompt (preserved in meaning):**

> Add. All features of names of websites mentioned in the screenshots all features make 3d models of ours more refined than theirs and make it the bestest most realistic and accurate 3d modles and simulations and data. Scientifically backed study. Make this as v2 toggabel from v1 in admin panel. Add version control for each prompt from now on.

**Implementation note:** V2 currently adds the PubChem 3D molecule viewer, three model representations, atom selection and geometric measurement, idealised orbital shape teaching views, a mapped 11-branch practical catalogue, three calculation models, a practical notebook, a source-capability matrix, admin edition switching and a prompt-history registry. See `docs/V2_RESEARCH_AND_ACCURACY.md` for precise feature status, limitations and roadmap.

**Limitations:** this revision does not mean every feature from every referenced platform is already implemented. It does not copy third-party source code/assets. It does not claim all displayed models/simulations have passed scientific validation. V1 remains available.

---

## Future prompt-revision rules

- Use a stable prompt ID such as `CHEM-ATLAS-3D-PLATFORM`, `CHEM-ATLAS-CURRICULUM`, or `CHEM-ATLAS-ADMIN`.
- For a new change, store the full user prompt, not only a paraphrased summary; use the change note for a concise explanation of scope and impact.
- Increment the minor version for additive changes (`1.0` → `1.1`). Reserve a major version for a material change in direction or compatibility (`1.x` → `2.0`).
- Keep every old version and support rollback by activating an older revision. Never delete a historical prompt to “clean up” the list.
- The in-app manager stores prompt revisions in the school D1 database when the Cloudflare backend is configured and the administrator is signed in. Without that backend it falls back to the current browser's local storage. It does not automatically read messages from other ChatGPT conversations; future prompts need to be entered into the manager or captured in a repository change by the maintainer.

## `CHEM-ATLAS-WORLD-CLASS-PLATFORM`

### v1.0 — 4 November 2026 — World-class scientific learning blueprint

**Prompt (preserved in meaning):**

> Add all the world-class blueprint capabilities: scientifically accurate 3D molecular and orbital models, realistic virtual laboratories, a visually explanatory reaction engine, three learning modes, a chemistry-aware AI tutor, an interactive Chemistry Universe, detailed periodic-table profiles, a teacher/school ecosystem, strong engineering and accessibility, scientific evidence cards, reality-vs-model comparisons, molecule playground, reaction detective, experiment designer, misconception learning, challenge arena, AI research assistant, model validator and teacher content studio. Preserve V1, develop V2 and V3, keep all models scientifically honest, and measure release quality rather than making unsupported superiority claims.

**Change note:** Recorded as the full product direction. It is a roadmap, not a statement that every capability is already implemented.

## `CHEM-ATLAS-OPEN-SCIENCE-V4`

### v1.0 — 4 November 2026 — Open, free-first V4 and four-edition publishing

**Prompt (preserved verbatim):**

> Tell me what u wnat from me add all these features also. Also,Add v4 with chem Atlas mostly free non commercial and ad free 2 yes 3 yes 4 downlaod everything from. The web I have turned on pages for the main bracj of the githib repo. So push it.. make it the best and better better the websites whose names where there in the ss. Also suggest features for v7 best feature that would make this an engineering miracle,stmte of the art software. BEST results I qnat. I dont care how much time or tokens u consume,I I the best result. Also publish all version of github eavh version toggabel from admin.

**Interpretation recorded:** Free-first, non-commercial and ad-free product direction; science reviewer available in principle; retain ICSE/ISC, CBSE, JEE Main, JEE Advanced and NEET; acquire web datasets only when reuse terms permit; build separate V1–V4 static entry points and an administrator release selector; preserve rollback; propose V7 frontier-engineering roadmap.

**Implementation note:** V4 adds the source/licence registry, dataset manifest, bounded downloader for selected CC0 CIF/mmCIF records, version definitions and the four-entry edition selector. Full bulk datasets are not bundled. GitHub write access was denied by the connected integration, so no remote push or deployment is claimed.

---

## Prompt history rule (continued)

For every future feature request, append the complete prompt under a stable prompt ID with a new revision and change note before implementation. Never overwrite or delete an earlier revision. Record implementation status separately from requested scope.

### V4 implementation refinement — 4 November 2026

The student-facing molecule viewer and PubChem download helper use one six-record educator-reviewable classroom allowlist. New structures require curriculum/source review before addition. Raw Open Reaction Database procedures remain reference-only and are not bulk-imported into student-facing content. This protects scientific provenance and keeps the platform focused on approved educational examples.

## `CHEM-ATLAS-V5-QUALITY`

### v1.0 — 4 November 2026 — Permanent free model, 50 advanced features and V5 quality work

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Confirmed product decisions:** Chemistry Atlas remains free to learners, non-commercial and ad-free permanently. Retain all six curriculum/exam pathways (ICSE Class 10, ISC Classes 11–12, CBSE, JEE Main, JEE Advanced enrichment and NEET). Chemistry teacher review is available in principle. Prefer free/open data and acquire/redistribute only where licence terms allow.

**Implementation note:** V5 has a 50-entry governed advanced feature registry, five edition definitions, an administrator rollout surface, source-level input/rendering/API hardening, security regression checks, atomic first-admin bootstrap migration, and the permanent free policy. The registry originally marked 14 features available, six preview and 30 planned/locked. 0.5.1 implements the neutral-equation balancer and updates the counts to 15 available, six preview and 29 planned/locked. V5 is a quality-preview source build; all possible bugs cannot be certified solved without dependency-backed build, real-browser/device testing, live Cloudflare integration and educator review.

**Change-control requirement:** This revision is immutable. Future prompt changes must create a new version under this or a new stable prompt ID; never overwrite the original text.


## `CHEM-ATLAS-V5-PRECISION`

### v1.1 — 4 November 2026 — V5 quality, permanent free policy and advanced-feature registry

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Change note:** Preserve the permanent free/non-commercial/ad-free decision; keep all six education tracks; add a governed 50-item feature registry and V1–V5 edition selector; harden browser/API/authentication/upload/molecular-viewer paths; add regression checks. The registry distinguishes available, preview and planned capabilities. “Solve all bugs” is treated as a requirement to fix reproducible defects and add regression tests, not as a claim that an untested system is bug-free.

## `CHEM-ATLAS-V5-FREE-FOREVER`

### v1.0 — 4 November 2026 — Free-forever commercial boundary

**Prompt (preserved verbatim):**

> Yes it will always be free

**Product rule:** Chemistry Atlas must remain free to learners, non-commercial and ad-free. No subscriptions, advertisements, sponsored results, paid learning packs or mandatory paid APIs for core learning. Operator infrastructure may have costs and quotas; core study material must remain usable when optional services are unavailable. The repository's existing MIT source licence is a separate legal instrument and has not been changed by this product promise.

## `CHEM-ATLAS-V5-QUALITY-EXPANSION`

### v1.0 — 4 November 2026 — Fifty advanced features and reliability pass

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Implementation boundary:** V5 records 50 feature definitions and acceptance gates. A feature is described as implemented only when its working UI/API/model and validation exist. Planned features remain locked. Security smoke tests and source validations do not replace real-browser, full dependency build, Cloudflare production or educator testing.


### v1.1 — 4 November 2026 — V5 refinement and defect-hardening request

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Change note:** Added the actual V5 neutral-equation balancer, nine balanced-equation fixtures and five negative/unsupported cases; updated rollout controls and feature counts; introduced `npm run validate:all`; updated owner inputs so already-confirmed product decisions are not asked again. “Solve all bugs” continues to mean reproduce/fix defects found and document unresolved verification, never certify untested production behavior as bug-free.


## `CHEM-ATLAS-V5-QUALITY-EXPANSION`

### v1.2 — 4 November 2026 — 0.5.2 security, analytics and reliability refinement

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Change note:** Preserve free/non-commercial/ad-free operation and the six learning tracks. Continue the V5 reliability pass by enforcing actual streamed multipart size limits, redacting unexpected API exceptions, validating learning-event score/duration/metadata, suppressing teacher analytics cohorts smaller than three learners, allowing analytics metrics to remain available when optional Workers AI fails, preventing portfolio attachment races, and expanding regression coverage. The equation balancer remains a limited neutral-molecular-equation tool. This revision records verified source fixes; it does not claim untested production software is bug-free.


## `CHEM-ATLAS-V5-QUALITY-EXPANSION`

### v1.3 — 4 November 2026 — Tutor and analytics trust-boundary refinement

**Prompt (preserved verbatim):**

> Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5

**Change note:** Keep the permanent free/non-commercial/ad-free product policy and 50-item governed feature registry. Harden the AI tutor against browser-controlled system-prompt context and forged assistant-history messages; normalise analytics dimensions and known event labels; reject empty molecular formula groups; add regression cases. These changes address concrete source findings. The project remains a quality-preview until dependency-backed build, live backend and browser/device gates pass.
