# Chemistry Atlas edition and publishing matrix

| Edition | Release intent | GitHub Pages entry | Admin selectable | Actual release state |
|---|---|---|---|---|
| V1 | Preserved foundation experience | `/versions/v1/` | Yes | Original baseline code path |
| V2 | Molecular studio and virtual-lab development slice | `/versions/v2/` | Yes | Partial research build; see V2 research/accuracy notes |
| V3 | World-class learning and scientific model assurance | `/versions/v3/` | Yes | Beta and roadmap preview; advanced engines remain incomplete |
| V4 | Open-science sources and licence governance | `/versions/v4/` | Yes | Registry and governance preview; no full dataset mirror |
| V5 | Precision, quality and release governance | `/` and `/versions/v5/` | Yes | Quality preview; 50-item registry, source-level reliability fixes, neutral-equation balancer and security regression coverage |

The Pages workflow builds V5 at the root and five additional entry points from the same source tree. These edition routes control the selected product surface; they are not immutable historical source snapshots. Git commits and tags remain the true source history. An edition is published only after the GitHub Actions Pages workflow succeeds and the live entry route has been checked.

## Rollback rule

The administrator may select V1–V5 without deleting learner records. Feature switches may only enable code already marked available or preview. Planned work is locked. Before a school-wide edition change, the operator must verify the selected build, D1 migrations, API bindings and a rollback path. A static frontend without the backend stores edition choices locally, not school-wide.
