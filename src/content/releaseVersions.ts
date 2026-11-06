export type PlatformVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';

export type ReleaseDefinition = {
  id: PlatformVersion;
  name: string;
  status: 'stable-baseline' | 'research-build' | 'beta-preview' | 'open-science-preview' | 'quality-preview';
  summary: string;
  capabilities: string[];
  boundary: string;
};

export const releaseDefinitions: ReleaseDefinition[] = [
  {
    id: 'v1', name: 'Foundation', status: 'stable-baseline',
    summary: 'The preserved original Chemistry Atlas learning experience.',
    capabilities: ['Core lessons and syllabus tracks', 'Original interactive model collection', 'Practice, notes and study progress'],
    boundary: 'V1 is retained as the original baseline and is not overwritten by later editions.',
  },
  {
    id: 'v2', name: 'Molecular & Laboratory', status: 'research-build',
    summary: 'The additive molecular studio and practical chemistry development release.',
    capabilities: ['PubChem-linked molecule lookup', 'Three molecular representations and atom measurements', 'Orbital concept views and expanded practical workbench'],
    boundary: 'Some orbital views and laboratory calculations are teaching models, not general-purpose quantum solvers or calibrated instruments.',
  },
  {
    id: 'v3', name: 'World-Class Learning', status: 'beta-preview',
    summary: 'A phased research and learning-quality programme layered on V2.',
    capabilities: ['Scientific evidence cards and model provenance', 'Reaction and spectroscopy development roadmap', 'Adaptive mastery, teacher review and concept connections'],
    boundary: 'This edition exposes V3 planning and preview surfaces; its full simulation catalogue is not implemented yet.',
  },
  {
    id: 'v4', name: 'Open Science Atlas', status: 'open-science-preview',
    summary: 'The free, non-commercial, ad-free direction with transparent data sourcing.',
    capabilities: ['Scientific dataset and licence registry', 'Open-data acquisition manifests and provenance rules', 'Versioned release builds and V1–V5 administrator selection'],
    boundary: 'V4 is a development preview. Dataset snapshots and advanced simulation engines must pass validation before being labelled complete.',
  },
  {
    id: 'v5', name: 'Precision & Quality', status: 'quality-preview',
    summary: 'A quality-focused release with 50 governed advanced features, source-level reliability fixes and a permanent free/no-ads policy.',
    capabilities: ['50 governed advanced feature specifications with acceptance gates', 'Admin-controlled rollout flags for implemented and preview modules', 'Molecular input validation, stale-request cancellation and accessible WebGL fallbacks', 'File-type signature checks, safer authentication and atomic first-admin bootstrap', 'Exact-rational neutral molecular equation balancer with explicit unsupported-input boundaries', 'Portfolio attachment race protection and small-cohort analytics suppression', 'Permanent free, non-commercial and ad-free product policy'],
    boundary: 'V5 includes selected working refinements; only features marked available or preview have source-level implementations. Planned features remain locked until built, scientifically reviewed and independently validated. A full dependency-backed build and browser/device test is still required before calling this a stable release.',
  },
];

export const isVersionAtLeast = (version: PlatformVersion, minimum: PlatformVersion): boolean =>
  Number(version.slice(1)) >= Number(minimum.slice(1));

export const isPlatformVersion = (value: unknown): value is PlatformVersion =>
  value === 'v1' || value === 'v2' || value === 'v3' || value === 'v4' || value === 'v5';
