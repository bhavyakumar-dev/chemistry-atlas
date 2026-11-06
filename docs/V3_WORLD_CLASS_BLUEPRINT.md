# Chemistry Atlas V3 — world-class learning and scientific engine

Status: phased roadmap. This document is not a statement that all features are implemented.

## V3 objectives

1. Build a scientific evidence layer for every scientific object and simulation.
2. Upgrade molecular visualisation with coordinate provenance, conformer selection, measurements, surface/charge overlays where source data support them, and uncertainty labels.
3. Develop chemically valid 2D sketching, reaction mapping and mechanism editing.
4. Create simulation modules that expose assumptions, equations, units, valid ranges and limitations.
5. Build reusable practical-lab scenarios with guided/free modes, repeatable trials, observation tables, graphs and exportable reports.
6. Add a concept graph, adaptive practice, spaced retrieval and misconception diagnostics.
7. Provide teacher assignment, moderation, review and class-level mastery tools.
8. Validate with chemistry educators and independent reference datasets.

## Capability workstreams

- Molecular geometry, stereochemistry, conformers and symmetry.
- Atomic and molecular orbital visualisation; explicitly distinguish analytic teaching models from numerical quantum chemistry.
- Crystal lattices and crystallographic structure viewers.
- Reaction network explorer, atom mapping, electron-pushing and energy profiles.
- Spectroscopy explorer for IR, mass, UV/Vis and NMR only where reliable reference data and licensing exist.
- Acid/base, equilibrium, kinetics, electrochemistry, gas and thermochemistry simulations with documented mathematical models.
- Learning science engine: retrieval practice, distributed practice, interleaving, worked examples and diagnostic feedback.

## Non-negotiable scientific controls

Every model card includes source/data version, method, units, conditions, assumptions, limitations, validation tests, reviewer status and licence. An animation must not imply atom trajectories or reaction pathways that its underlying model does not support.

## Release gates

- Scientific unit tests pass for published calculations.
- Reference-value regression tests include units and significant figures.
- No unresolved critical scientific-review findings.
- Student-facing explanations identify idealisations and approximations.
- Keyboard, screen-reader, low-end Android and reduced-motion checks pass.
- New editions keep data migrations backward-compatible and include rollback.
