# Chemistry Atlas V5 — 50 advanced feature registry

**Release:** 0.5.3 · **Last updated:** 4 November 2026

Each entry is a governed feature record. Status is based on the source in this release; a roadmap item is not an implemented feature. A V5 rollout toggle is available only for `available` and `preview` entries whose integration exists. Planned items are locked.

- Registered: **50**
- Available in source: **15**
- Preview / configuration-dependent: **6**
- Planned: **29**

## Registry

### Molecular science

1. **Source-linked molecular studio** — `available`, target V2. Load a curated PubChem conformer and inspect its source record. **Acceptance:** Structure CID, formula and record link agree.
2. **Three molecular representations** — `available`, target V2. Ball-and-stick, space-filling and wireframe display modes. **Acceptance:** Each mode uses documented display radii and units.
3. **Atom picking and geometry measurements** — `available`, target V2. Select atoms and measure coordinate distances and three-point angles. **Acceptance:** Measurements use source coordinates in ångström.
### Scientific integrity

4. **Scientific model evidence cards** — `available`, target V3/V4. Expose model origin, source record, units and limitations. **Acceptance:** Never label a computed conformer as an experimental structure.
### Molecular science

5. **Educator-reviewed molecule catalogue** — `available`, target V4. Only allowlisted school-relevant compounds are searchable by students. **Acceptance:** Unapproved names are rejected before any external request.
### Quantum chemistry

6. **Hydrogenic orbital probability viewer** — `available`, target V2. Analytic teaching distributions for selected hydrogen-like states. **Acceptance:** Model assumptions and phase/probability distinction are visible.
### Laboratory

7. **Eleven-discipline practical catalogue** — `available`, target V2. Map analytical, organic, physical and other practical chemistry areas. **Acceptance:** Mapped activity is not misrepresented as an implemented simulator.
8. **Ideal gas calculation workbench** — `available`, target V2. Interactive PV=nRT calculator with stated ideal-gas assumptions. **Acceptance:** Units and assumptions shown with result.
### Physical chemistry

9. **Arrhenius temperature comparison** — `available`, target V2. Compare relative rate constants using a fixed activation energy. **Acceptance:** Reference temperature and equation are shown.
10. **Ideal dilute strong-acid pH model** — `available`, target V2. Estimate pH under explicit complete-dissociation assumptions. **Acceptance:** Concentration and model boundary are visible.
### Laboratory

11. **Structured laboratory notebook export** — `available`, target V2. Export aim, observations, calculations, conclusion and uncertainty. **Acceptance:** Export includes safety/model boundary and date.
### School tools

12. **Teacher cohort analytics** — `preview`, target V2. Aggregate participation and quiz performance through the configured backend. **Acceptance:** Privacy thresholds and role checks are applied.
### AI

13. **Cloudflare Workers AI chemistry tutor** — `preview`, target V2. Server-mediated tutor using grade, track and lesson context. **Acceptance:** Requires configured AI binding and source-grounding guardrails.
### Scientific integrity

14. **Scientific source and licence registry** — `available`, target V4. Browse sources, licence classes, reuse notes and ingestion constraints. **Acceptance:** Do not infer one licence for every record in an aggregator.
15. **Bounded open-data acquisition** — `preview`, target V4. Download selected, size-limited open crystallography/protein records. **Acceptance:** Pinned record, licence, attribution and SHA-256 are retained.
### Platform engineering

16. **V1–V5 edition selector** — `available`, target V5. Switch edition builds while preserving learner data. **Acceptance:** School-wide setting requires authenticated administrator role.
17. **Immutable prompt revision history** — `available`, target V2. Version, activate and roll back prompts by stable prompt ID. **Acceptance:** Prior revisions remain readable and never overwrite history.
### Molecular science

18. **Shareable molecule deep links** — `preview`, target V5. Open a permitted catalogue molecule directly from a stable URL. **Acceptance:** Only allowlisted molecule IDs are accepted from URL parameters.
19. **Molecule coordinate JSON export** — `preview`, target V5. Export source CID, formula, atom coordinates and bond records. **Acceptance:** Export preserves units and source provenance.
20. **Molecule coordinate CSV export** — `preview`, target V5. Export atom coordinates for spreadsheet analysis. **Acceptance:** CSV headers identify atom index, element and ångström coordinates.
21. **Conformer comparison workspace** — `planned`, target V6. Compare multiple conformers and explain their energy/model context. **Acceptance:** Conformer source, optimisation method and energy reference required.
22. **Valence-aware 2D chemical sketcher** — `planned`, target V6. Draw atoms, bonds, charges, lone pairs and ring templates. **Acceptance:** Valence, formal charge and stereochemical validation required.
23. **Stereochemistry and chirality explorer** — `planned`, target V6. Inspect R/S, E/Z and conformational stereochemistry. **Acceptance:** CIP assignments must be validated against trusted test cases.
### Quantum chemistry

24. **Electron-density and electrostatic surfaces** — `planned`, target V7. Display computed density and molecular electrostatic potential surfaces. **Acceptance:** Requires a named electronic-structure method and grid provenance.
25. **Hybridisation and orbital-overlap laboratory** — `planned`, target V6. Compare idealised hybrid orbitals and overlap diagrams. **Acceptance:** Distinguish bonding models from observables and modern MO theory.
26. **Molecular orbital visualisation engine** — `planned`, target V7. Display bonding/antibonding orbitals from validated calculations. **Acceptance:** Wavefunction method, basis set and phase convention disclosed.
### Materials chemistry

27. **Materials band-structure explorer** — `planned`, target V7. Visualise bands, density of states and reciprocal-space paths. **Acceptance:** Dataset and computational method are traceable.
28. **Crystallographic unit-cell explorer** — `planned`, target V6. Render CIF structures, symmetry operations and unit cells. **Acceptance:** Space group, cell parameters and atom occupancies preserved.
### Learning intelligence

29. **Periodic-trend comparison laboratory** — `planned`, target V5. Compare properties with sources, definitions and uncertainty. **Acceptance:** Property values include source, units and periodic-table definition.
### Reaction science

30. **Explainable neutral-equation balancer** — `available`, target V5. Balance supported neutral formula equations with exact rational linear algebra and element-count verification. **Acceptance:** Exact integer coefficients, residual counts and unsupported cases are shown; ionic/redox equations are excluded.
31. **Reaction atom mapping engine** — `planned`, target V6. Track atom correspondence between reactants and products. **Acceptance:** Mass and charge conservation checks pass.
32. **Reaction mechanism authoring canvas** — `planned`, target V6. Create electron-flow diagrams with chemically validated arrows. **Acceptance:** Arrow origins, destinations and valence changes are checked.
33. **Reaction energy-profile explorer** — `planned`, target V6. Compare reaction coordinate diagrams and activation barriers. **Acceptance:** Label schematic profiles separately from computed energy data.
34. **Reaction network knowledge graph** — `planned`, target V7. Connect compounds, reaction classes, conditions and sources. **Acceptance:** Edges carry evidence and confidence metadata.
### Physical chemistry

35. **Kinetics graphing and regression laboratory** — `planned`, target V5. Fit rate laws and compare zero, first and second order models. **Acceptance:** Residuals, units, fit quality and limitations reported.
36. **Equilibrium and ICE-table solver** — `planned`, target V5. Solve supported equilibrium systems with explainable steps. **Acceptance:** Numerical solution checked against mass action and positivity.
### Laboratory

37. **Multi-system titration curve simulator** — `planned`, target V5. Model strong/weak acid-base curves and indicators. **Acceptance:** Equilibria and activity assumptions stated for each system.
### Analytical chemistry

38. **Spectroscopy reference explorer** — `planned`, target V6. Browse permitted IR/UV-Vis/MS/NMR references and annotations. **Acceptance:** Source, instrument conditions and licensing attached to spectra.
39. **Spectroscopy concept simulator** — `planned`, target V6. Explore Beer–Lambert, vibrational modes and simplified spectra. **Acceptance:** Simulated spectra labelled and models cited.
### Laboratory

40. **Virtual analytical instrument bench** — `planned`, target V6. Interact with digital balances, burettes, pH meters and spectrometers. **Acceptance:** Instrument precision, calibration and uncertainty modelled.
41. **Branching virtual laboratory scenarios** — `planned`, target V6. Decision-based lab experiences with controlled feedback. **Acceptance:** Safety gates and validated outcome logic are mandatory.
42. **Observation tables and live experiment graphs** — `planned`, target V5. Plot readings, fit trends and export raw data with units. **Acceptance:** Data points retain units, uncertainty and provenance.
### School tools

43. **Teacher-reviewed content publishing workflow** — `planned`, target V5. Draft, review, approve, reject and version student/teacher content. **Acceptance:** Only approved content is visible in public lesson catalogues.
### Learning intelligence

44. **Adaptive mastery and prerequisite graph** — `planned`, target V6. Recommend next topics using evidence of concept mastery. **Acceptance:** Recommendations are explainable and teacher-overridable.
45. **Spaced retrieval review scheduler** — `planned`, target V5. Schedule review using recall confidence and performance. **Acceptance:** Learners can inspect and edit their review schedule.
### Assessment

46. **Misconception diagnosis engine** — `planned`, target V6. Map distractor choices to teachable misconceptions. **Acceptance:** Teacher-reviewed misconception mapping required.
47. **Question authoring and moderation studio** — `planned`, target V5. Create, tag, review and version assessment items. **Acceptance:** Answer key and explanation reviewed before publication.
### Platform engineering

48. **Offline downloadable learning packs** — `planned`, target V6. Cache lessons and selected simulations for low-connectivity use. **Acceptance:** Offline content shows its data freshness and sync status.
49. **Accessibility audit and keyboard-only mode** — `planned`, target V5. Provide keyboard navigation, reduced motion and contrast checks. **Acceptance:** Automated checks plus manual WCAG 2.2 AA review.
### Research engineering

50. **Reproducible scientific computation workbench** — `planned`, target V7. Record inputs, method versions, parameters, outputs and random seeds. **Acceptance:** Same pinned input/method reproduces the recorded result.

## Release-gating rule

No feature may be advertised as implemented merely because it has a registry entry. Before changing a feature from `planned` to `preview` or `available`, a maintainer must commit the implementation, automated tests, scientific review evidence where relevant, licensing record, accessible UI and rollback behavior. The registry status must be updated in the same code change.

## Permanent product constraint

Chemistry Atlas remains free to learners, non-commercial and ad-free. There are no paid feature tiers, ads, sponsored result placement or mandatory paid API dependencies in core learning paths. Cloud hosting and optional AI may still have operator-side quotas or costs; graceful fallbacks are required.
