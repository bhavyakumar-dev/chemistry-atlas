# Chemistry Atlas V2 — research map, implementation status and scientific-integrity standard

**Product edition:** V2  
**Source package:** 0.3.0  
**Research reviewed:** 4 November 2026  
**Purpose:** consolidate capabilities represented by the reference platforms into one Indian-curriculum-first chemistry learning environment, without copying third-party source code, lesson text, models, media or proprietary datasets.

## 1. Reference-platform capability map

The following is a feature-research map. A feature appearing in this table is not a claim that Chemistry Atlas already implements that feature, nor an endorsement of the competitor's scientific accuracy. The current release column is the implementation truth for this source release.

| Reference platform | Capability areas to learn from | Current Chemistry Atlas V2 status |
|---|---|---|
| ChemTube3D | Atomic and molecular orbital learning; nodal planes; conformations; VSEPR; molecular symmetry; organic reaction animations; spectroscopy and electrostatic surfaces | Orbital concept preview and source-linked molecule viewer are implemented. Numerical orbitals, full reaction animations and spectroscopy suite remain roadmap. |
| Chemistry JAM | 3D atomic orbitals, orbital overlap, hybridisation, VSEPR, resonance, Maxwell–Boltzmann distributions, chromatography, guided theory and worked practice | Feature map and topic taxonomy are included. A few concept previews/calculators exist; the dedicated 21-lab-style simulation catalogue remains roadmap. |
| Symmetria | Molecule search, 3D structures, bond angles, symmetry, polarity, stereochemistry, flashcards, scored practice and teacher/student paths | An educator-reviewed classroom compound allowlist feeds the PubChem viewer, with atom picking, distance/angle calculations and 3D representations. Polarity/symmetry explorers, spaced repetition and large flashcard set remain roadmap. |
| MolView | 2D sketcher; bonds, charges, lone pairs, radicals, ring templates, automatic layout, reaction/electron-pushing arrows, R groups, viewer and data/file workflows | Research map only. A chemistry-aware 2D sketcher and mechanism editor are roadmap; they require valence/charge validation, not just a drawing canvas. |
| Molecular | Element explorer, molecule building, curated structures, browser reaction demonstrations and reaction log | Existing periodic-table/learning content remains in V1. Drag-and-snap molecule builder and reaction workbench are roadmap. |
| virtual Chemistry 3D (vChem3D) | Jmol/JSmol-style molecular viewing; source searching (PubChem/RCSB); rotate/zoom; molecular structures and conformations | Selected educator-approved PubChem classroom records and 3D conformer display are implemented. RCSB protein/macromolecule hand-off and user coordinate-file import are roadmap. |
| Labster | Immersive scenario-based laboratory, inquiry-led decisions, feedback after errors, repeatable attempts, syllabus alignment and LMS workflow | 11 chemistry practical categories and a notebook/calculation workbench are implemented. Scenario engine, classroom assignment workflow and LMS interoperability remain roadmap. |
| SimOli Chemistry 3D Lab | Broad chemistry practical library across analytical, organic, physical, electrochemistry, thermochemistry, kinetics, spectroscopy and laboratory measurement; guided mode; observation tables/graphs/reports | All 11 discipline categories are mapped. Generic notebook and three calculation tools are implemented. The site’s advertised 100 experiment catalogue is not reproduced; individual validated, interactive experiment modules remain roadmap. |
| VidyaXR | Browser/mobile/desktop 3D, periodic-table exploration, titration, practicals, organic mechanisms and VR-ready content | Touch-friendly browser viewer and practical category map are included. Full VR, complete school-practical catalogue and offline downloadable simulations remain roadmap. |
| Heyprof 3D Chemistry Lab | Virtual glassware/reagent interaction, measuring, dispensing/heating, visible observations, reaction log and PPE gates | Safety design principles and notebook are mapped. The full manipulable lab bench, reagent-combination engine and hazard-gated procedures remain roadmap. |
| ChemVerse | Guided practical steps, aim/materials/procedure/observations and multiple school-level practical categories | Guided practical taxonomy and report fields are included; each experiment still needs its own model, calibrated data and teacher-reviewed protocol. |
| PraxiLabs | 3D guided simulations, learning material, step feedback, repeatable practice, hints, progress tracking and institutional controls | Generic notebook and concept-level calculation tools are included. Scenario-based guided simulation, auto-marking and institutional reporting need further work. |
| Atomurus | 118-element workspace, 3D atomic/molecular/allotrope models, molar-mass/dilution/unit/gas/pH calculators and articles | The V1 periodic table and V2 molecule viewer coexist. This V2 release does not yet reproduce all 118 high-fidelity atomic models or all calculator/article modules. |
| Chemistry Explainer | Orbital and crystal-lattice visuals; stoichiometry, redox, titration, gas-law, galvanic-cell, equilibrium and spectroscopy tools | Three calculation models are live in the V2 lab. Crystal-lattice explorer, spectra tools, equilibrium/ICE solver and full electrochemistry simulator are roadmap. Vendor claims require independent scientific validation. |
| PhET Interactive Simulations | Build an atom/molecule, molecular shape/polarity, gas behaviour, diffusion, states of matter, pH, acid-base, concentration, molarity, equations and reactants/products | These topics are mapped for future simulation modules; existing question/lesson content covers a subset. No PhET source code or simulation assets are bundled. |
| ChemViz3D | Rotate/pause/compare reaction animations, inspect atoms/bonds, selected reaction pathways and create/share teaching animations | Molecule rotation and atom inspection are implemented. A reaction storyboard/animation editor and chemically valid atom-mapped transformation engine remain roadmap. |
| ChemAlly (named in the supplied screenshot) | Screenshot-described NCERT Class 11–12 access, 3D modules and a quantum-wave lab | Not independently verified from a reliable public source during this research. Kept as an unverified research lead; no capability claim is used as a scientific benchmark. |

Primary product references:

- ChemTube3D: <https://www.chemtube3d.com/>
- Chemistry JAM: <https://chemistryjam.com/>
- Symmetria: <https://www.symmetriachem.com/>
- MolView feature catalogue: <https://molview.com/features/>
- Molecular: <https://molecular.chriswest.tech/>
- vChem3D: <https://vchem3d.univ-tlse3.fr/>
- Labster capabilities: <https://www.labster.com/capabilities>
- SimOli Chemistry 3D Lab: <https://simolilab.in/chemistry-lab>
- VidyaXR: <https://vidyaxr.in/>
- Heyprof lab demo: <https://www.heyprof.app/en/demo/chemie-labor-3d>
- ChemVerse: <https://chemvers.netlify.app/>
- PraxiLabs: <https://praxilabs.com/en/virtual-labs>
- Atomurus: <https://atomurus.com/>
- Chemistry Explainer: <https://chemistryexplainer.com/about>
- PhET Chemistry catalogue: <https://phet.colorado.edu/en/simulations/browse?subjects=chemistry>
- ChemViz3D: <https://www.chemviz3d.com/>

## 2. What is actually implemented in this V2 source release

1. **Molecular studio:** matches a student search against a small educator-reviewed classroom compound allowlist, requests the corresponding PubChem CID 3D SDF conformer, parses atoms and bonds, and renders a rotatable Three.js model in ball-and-stick, space-filling and wireframe views. It supports atom labels/picking, measurements between two selected atoms, a three-atom angle measurement and an exportable source/coordinate record.
2. **Orbital probability view:** samples analytic single-electron hydrogenic probability distributions for 1s, 2pᶻ and 3dₓᵧ states. Point density represents |ψ|² and contrasting colours represent wavefunction phase. The renderer does not solve a general numerical Schrödinger equation and does not model multi-electron shielding, molecular orbitals or electron correlation.
3. **V2 virtual-lab companion:** gives an 11-branch practical map, an ideal-gas calculator, an Arrhenius relative-rate comparison, an ideal dilute strong-acid pH approximation and an exportable practical notebook with observations, uncertainty and mistake-correction fields.
4. **Research matrix:** administrators can inspect the capability categories and source links which inform the V2 roadmap.
5. **Version control:** an administrator can switch the school-wide edition between V1 and V2. Prompt text can be versioned by prompt ID, archived and reactivated. The D1 migration provides persistent school-level storage when the Cloudflare backend is configured; otherwise the prompt history and edition selection are local to the browser.

The existing V1 experience remains in the codebase and can be selected from the administrator panel. This release does not delete V1 content or rewrite the V1 model viewer.

## 3. Scientific integrity and 3D fidelity standard

A visually convincing model is not automatically chemically correct. V2 must preserve the following metadata and validation rules as it expands:

### 3.1 Molecular structures

- Every molecular model must carry a source identifier (for example PubChem CID or PDB accession), source URL, retrieval timestamp, file/data format and licence/attribution note.
- Store or display whether coordinates are deposited/experimental, computationally generated, conformer-optimised, idealised, or pedagogical. Never describe a computed conformer as an experimental structure.
- Keep source coordinates in ångströms (Å). Any transformation for rendering must be reversible and must not alter the exported coordinate record.
- Record atom element, isotope where available, formal charge, aromaticity, stereochemistry, atom mapping and bond order when the source contains them. The current SDF renderer is a viewer; it is not yet a complete cheminformatics parser. The orbital probability view is an analytic hydrogenic model and must not be confused with a molecular-orbital calculation.
- Distinguish measured bond length from a value computed from a supplied conformer. IUPAC notes that measured bond lengths depend on the experimental method and can differ slightly between methods.
- Treat van der Waals radii as a selected reference convention, not universal constants. Expose the radius source/version and a note that alternate sets differ. The current visual radius map is approximate and must not be used as a measurement tool.
- A ball-and-stick radius is purely a visibility choice. Never imply its sphere radius reflects a physical atom radius.

### 3.2 Quantum/orbital models

- Separate wavefunction amplitude/phase, probability density (|ψ|²), radial distribution and a chosen boundary isosurface. These are not interchangeable pictures.
- Show the quantum numbers, orbital orientation, nodal planes/nodal surfaces, normalisation convention and any selected isovalue when a numerical orbital is implemented.
- A hydrogenic analytic state, pedagogical illustration and numerically solved multi-electron orbital are different levels of model. Label the one actually shown. The current 1s/2pᶻ/3dₓᵧ cloud is generated from analytic hydrogenic probability distributions; it is not a general-purpose multi-electron Schrödinger solver.
- Molecular orbitals require a named method/basis set or a source-provided orbital dataset. Do not fabricate electron clouds from decorative meshes.

### 3.3 Chemical and physical simulations

- Every calculator/simulation must display its governing equation, unit system, parameters, assumptions, valid range and known omissions next to the result.
- Add automated reference cases with known answers, boundary tests and independent teacher review before labelling a simulator “validated”. Record test version and reviewer.
- Use activity corrections where appropriate, and state when ideal-solution, ideal-gas, dilute-solution or constant-temperature approximations apply.
- Reaction visualisations must conserve atoms and charge, show balanced equations and distinguish an illustrative mechanism from a predictive claim. A sequence of animated spheres does not establish reaction feasibility, rate, yield or selectivity.
- All practical modules must show reagent identity/concentration, PPE, hazards, disposal and teacher-supervision requirements. Do not simulate unsafe instructions as an unsupervised home activity.
- Never invent measured datasets, reference spectra, equilibrium constants, kinetics or experimental readings. Source each reference value and show its temperature/pressure/context where applicable.

### 3.4 Accuracy/data sources to prefer

- PubChem PUG REST supports 2D and 3D compound conformer retrieval and provides explicit conformer information: <https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest>.
- RCSB PDB provides the Mol* 3D viewer and structural data resources for macromolecules and ligand-binding sites: <https://www.rcsb.org/tools>.
- IUPAC Gold Book defines bond length and explains why the experimental method matters: <https://goldbook.iupac.org/terms/view/BT07003>.
- A. Bondi, “van der Waals Volumes and Radii”, J. Phys. Chem. 68 (1964), 441–451, DOI: <https://doi.org/10.1021/j100785a001>.
- S. Alvarez, “A cartography of the van der Waals territories”, Dalton Trans. 42 (2013), 8617–8636, DOI: <https://doi.org/10.1039/C3DT50599E>.
- CIAAW standard atomic weights: <https://www.ciaaw.org/atomic-weights.htm>.
- NIST critically evaluated atomic properties: <https://www.nist.gov/pml/periodic-table-elements>.
- PhET's catalogue is a useful reference for concept-simulation breadth, not a data source for Atlas's calculated results: <https://phet.colorado.edu/en/simulations/browse?subjects=chemistry>.

## 4. Roadmap to a genuinely high-fidelity platform

### Priority A — complete the molecular engine

- Replace the current lightweight SDF parser with a tested cheminformatics parser (for example, a carefully licensed RDKit/WebAssembly integration) and support mol/SDF, SMILES and InChI with full bond, charge, isotope and stereochemical data.
- Add conformer selection, provenance, coordinate confidence/quality, atom and bond inspection, bond-angle/dihedral measurement, ring and stereochemistry overlays, and explicit 2D/3D comparison.
- Add sourced radii presets (Bondi, Alvarez or another named set), CPK colouring, configurable labels and accessible high-contrast palettes.
- Integrate RCSB Mol* for large biological macromolecules instead of pretending a small-molecule viewer is suitable for proteins.

### Priority B — proper electronic-structure visualisation

- Render numerically generated hydrogenic s/p/d/f orbitals with selectable n/l/m, radial/angular nodes, phase, |ψ|² and isosurfaces.
- Add overlap integrals, bonding/antibonding molecular orbital demonstrations and hybridisation only where the mathematical approximation is explained.
- Add electrostatic potential surfaces, dipole vectors and intermolecular interactions only when the fields are computed from a traceable model/dataset.

### Priority C — 2D chemical editor and reaction engine

- Add a validated 2D sketcher with atom/bond tools, charges, lone pairs, radicals, ring templates, R-groups and stereochemical wedge/dash bonds.
- Add curved electron-pushing arrows, reaction step annotations, atom mapping and balanced reaction schemes.
- Validate valence, charge, atom conservation, reaction conditions and stereochemical outcomes. Keep predicted reaction products separate from teacher-verified textbook examples.

### Priority D — virtual laboratory catalogue

- Build each practical as an individual tested module, not a generic 3D bench with arbitrary outcomes. Begin with school-safe acid-base titration, salt analysis decision trees, calorimetry, electrochemical cells, chromatography and rate experiments.
- Model apparatus scale, meniscus reading, burette/pipette increments, reagent concentration, temperature, endpoint uncertainty and realistic observation tables.
- Add guided/free mode, action feedback, event log, undo/retry, graphing, report export and teacher assessment.
- Add rigorous PPE and hazard rules. Some practicals should remain virtual-only.

### Priority E — physical/inorganic/spectroscopy workbenches

- Build gas kinetic distributions, Maxwell–Boltzmann curves, Arrhenius/kinetics, equilibrium/ICE, calorimetry, pH/titration curves, electrochemical cells, lattice structures, coordination complexes, flame/emission spectra, IR and NMR interpretation.
- Each tool needs a documented model, sourced constants/data, unit tests and a limitation panel. A spectrum should be sourced or generated by a declared model; it must not be a decorative curve.

### Priority F — learning, classroom and analytics

- Add spaced-repetition flashcards, mastery tracking, solved/unsolved practice, hints, rubric-based practical grading, teacher assignment workflows and LMS/LTI integration only after role-based security and privacy review.
- Align every module to exact board/grade/topic outcomes, with a source/version date. Make cross-grade access an administrator policy.
- Publish a coverage report. A source platform advertising 100 labs or 900 questions is not evidence that Atlas has the same coverage.

## 5. Licensing and attribution

ChemTube3D identifies its site content as Creative Commons Attribution-Noncommercial-Share Alike 2.0 UK. That licence and any third-party terms must be reviewed before reusing its content. Other products may contain proprietary models, lesson copy or paid content. Chemistry Atlas must implement its own code and learning material, link to public scientific data services under their terms, and credit every data/model source. This project does not bundle competitor assets or clone their proprietary code.

## 6. Release gate for a feature to be labelled “scientifically validated”

A module is not eligible for that label until it has:

1. A written model/specification with variables, units, equations, assumptions and applicability range.
2. Traceable primary/authoritative data or a reproducible calculation method.
3. Test vectors with known values, edge cases and automated regression checks.
4. Independent review by a qualified chemistry educator or domain specialist.
5. Explicit visual labels for measured, computed, estimated and idealised quantities.
6. A versioned validation record with date, reviewer, dataset/software version and known limitations.

Until those gates pass, use wording such as “educational model”, “approximation”, “mapped activity” or “concept illustration”.
