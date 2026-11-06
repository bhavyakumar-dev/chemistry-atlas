# What Chemistry Atlas needs from the project owner

## Confirmed product decisions

- Chemistry Atlas will always be free to learners, non-commercial and ad-free. No paid tiers, advertisements, sponsored ranking, paid model packs or mandatory paid APIs for core learning.
- A chemistry teacher can review the science in principle. The teacher's identity/contact details are not required here; only subject expertise and review scope are needed.
- Keep ICSE Class 10, ISC Classes 11–12, CBSE, JEE Main, JEE Advanced enrichment and NEET.
- Prefer openly reusable scientific datasets. Download and redistribute only records whose specific licences and provider terms permit it.
- Publish V1–V5 edition entry points and keep an administrator-controlled release selector with data-preserving rollback.

## The most useful contributions still needed

1. **Teacher review scope:** which areas the reviewer can check (ICSE/ISC, CBSE, JEE/NEET, practical chemistry, physical/organic/inorganic/analytical chemistry). A name, email or login is not needed in this document.
2. **Current official syllabuses:** PDF or official URL for the relevant academic year and exam cycle, especially when new bulletins are released. The project must check the issuing authority before each annual release.
3. **School practical specification:** approved practical list, apparatus constraints, safety policy, expected observations, record-book format and marking rubric if the lab should mirror a particular school.
4. **Original material you own or have permission to use:** question banks, teacher-authored notes, experimental measurements, spectrum files or additional molecules for review. Preferred formats: CSV/XLSX/JSON/SDF/MOL/XYZ/CIF/JCAMP-DX. Provide units, conditions, author/source and reuse permission.
5. **Device testing access:** one low-end Android phone, one school laptop and a projector/browser combination. Report browser/device class and reproducible issue steps; do not send device identifiers.
6. **Release testing help:** a teacher or trusted adult can try the preview, record confusing explanations and confirm whether worked answers match the expected school method.

No more product-direction decisions are currently required from the owner. These contributions improve content coverage and verification; they are not blockers to maintaining the codebase.

## What the owner does not need to upload

- Public datasets that can be fetched from official providers under compatible terms (the project maintainers can use the source manifest and bounded download scripts).
- Competitor source code, proprietary graphics, screenshots, paid lesson files or copied textbook chapters.
- Private student names, email addresses, marks, medical information or account data.
- Passwords, API keys, Cloudflare tokens or GitHub credentials. Secrets belong in provider dashboards.

## Scientific data contribution requirements

Every contributed record should include: stable source identifier, dataset/version, licence or written permission, retrieval/acquisition date, checksum, units, temperature/pressure/solvent/instrument conditions when relevant, method and known uncertainty. Label each molecular representation experimental, computational or idealised. Never convert unknown metadata into a guessed value.

## Release acceptance checklist

- Teacher review recorded for the relevant grade/topic.
- Imported data has source, version, licence, retrieval date and checksum.
- Model origin, units, assumptions, uncertainty and limitations are visible.
- A regression test exists for every critical calculator or data transformation.
- No unsafe home-lab instructions are published.
- Mobile, keyboard, reduced-motion, accessibility and offline checks pass.
- Live Cloudflare/API and rollback tests pass before production release.
