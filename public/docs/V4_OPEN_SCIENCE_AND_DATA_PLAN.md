# Chemistry Atlas V4 — Open Science Edition

**Product direction:** mostly free, non-commercial, ad-free and English-first. This is the project's intended policy; public release terms, contributor agreements and hosting costs still need review before launch.

## What V4 adds

- Scientific-source registry with conservative licence classification.
- Dataset manifest with canonical URLs, version/retrieval date, licence URL, attribution, checksum and validation status.
- Provenance-first molecule, crystal, reaction and spectra records.
- Cache and offline-pack policy for selected files that may legally be redistributed.
- Four selectable editions (V1–V4) in Admin Console, with rollback and separate static edition entry points.
- No advertising SDKs, behavioural ad tracking or sale of learner information.
- Free-first hosting and open-source dependencies; paid APIs are not a required path.

## Dataset sourcing policy

Download only data whose licence and source can be established. Do not scrape or mirror competitor websites, proprietary lessons, paid simulations, copyrighted images or complete databases whose terms do not permit redistribution. PubChem is a multi-contributor database: inspect the source/licence of each contribution class. Student-facing molecule lookup is restricted to educator-reviewed curriculum examples; new items are not automatically enabled from arbitrary searches. NIST WebBook should initially be linked/cited rather than bulk mirrored until terms are confirmed. IUPAC individual terms are CC BY-SA 4.0 and may be reused with attribution/share-alike compliance; compilation rights and any commercial use need separate confirmation. Keep COD CC0 and PDB archive CC0 data in separately versioned, attributed snapshots. ORD is used as a schema/research reference only at this stage. Raw reaction-procedure corpora are not bulk-imported into the student product; any future subset requires educator screening for age-appropriate school use as well as attribution/share-alike compliance.

## Dataset manifest contract

Every dataset package records: dataset ID, title, canonical source and record IDs; release/snapshot, retrieval date, SHA-256 and format; licence URL, attribution and share-alike/non-commercial limits; units, measurement conditions, method and provenance; schema/parser versions, validation report and reviewer state; and whether the record is experimental, computed, curated or pedagogical.

## Download and deployment strategy

- Small, explicitly reusable seed files may live in `public/data/` with a licence notice.
- Medium/large snapshots are downloaded by a repeatable script, pinned by checksum, then stored in R2 or a dataset release—not copied into the app bundle.
- Public APIs use caching, rate limits, attribution and source-aware refresh.
- Reference-only services are linked, not mirrored.
- Every offline pack includes source and licence notices.

## Important limitations

The full COD/PDB/reaction/compound universe is too large and continuously updated for a browser bundle or Git repository. COD documentation recommends rsync or Subversion for a complete mirror and warns that packaged archives are periodically stale; even an older CIF-only checkout was already several gigabytes. “Download everything” creates stale snapshots, rate-limit problems, repository bloat and licensing mistakes. V4 uses curated, versioned subsets and reproducible acquisition scripts.
