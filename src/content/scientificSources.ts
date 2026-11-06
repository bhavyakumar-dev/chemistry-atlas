export type ScientificSource = {
  id: string;
  name: string;
  category: string;
  canonicalUrl: string;
  licence: string;
  reuse: 'open-data' | 'record-level-review' | 'reference-only' | 'software';
  plannedUse: string;
  ingestion: string;
  caveat: string;
};

// Licence is intentionally conservative. A whole site is never assumed to share
// one licence when individual records can have different contributors or terms.
export const scientificSources: ScientificSource[] = [
  {
    id: 'pubchem', name: 'PubChem', category: 'Compound records and structures',
    canonicalUrl: 'https://pubchem.ncbi.nlm.nih.gov/',
    licence: 'Record/source-level review required', reuse: 'record-level-review',
    plannedUse: 'Compound identifiers, names, formulas, structures, computed conformers and property records.',
    ingestion: 'API lookup with caching; inspect provenance and contributor terms for each data class before redistributing bulk content.',
    caveat: 'PubChem contains data from many contributors. Do not treat every attached annotation or depositor dataset as having one blanket licence.',
  },
  {
    id: 'cod', name: 'Crystallography Open Database', category: 'Small-molecule crystal structures',
    canonicalUrl: 'https://cod.psdi.ac.uk/', licence: 'CC0 1.0; acknowledge original structure authors', reuse: 'open-data',
    plannedUse: 'Experimental crystal structures for inorganic, organic, mineral and metal-organic compounds.',
    ingestion: 'Download selected CIF records or a separately managed snapshot; record COD ID, original authors and file hash.',
    caveat: 'Do not put the entire evolving archive in the frontend bundle. Pin datasets and retain individual structure metadata.',
  },
  {
    id: 'pdb', name: 'RCSB Protein Data Bank', category: 'Macromolecular structures',
    canonicalUrl: 'https://www.rcsb.org/', licence: 'PDB archive data: CC0 1.0; attribute original structure authors', reuse: 'open-data',
    plannedUse: 'Proteins, nucleic acids, ligands and biological assembly structures for biochemistry learning.',
    ingestion: 'Use mmCIF and selected-entry downloads; cache only curated structures needed by lessons.',
    caveat: 'Integrated external resources may have separate terms. PDB articles and Molecule of the Month text/images are not automatically CC0.',
  },
  {
    id: 'ord', name: 'Open Reaction Database', category: 'Reaction research reference',
    canonicalUrl: 'https://open-reaction-database.org/',
    licence: 'CC BY-SA 4.0; attribution and share-alike obligations', reuse: 'reference-only',
    plannedUse: 'Research reference for reaction data schema, provenance and the design of a safe school-level curated reaction library.',
    ingestion: 'Do not bulk-import raw reaction procedures into the student product. Any later subset requires teacher screening, record-level metadata, pinned version, attribution and a specific educational-use approval.',
    caveat: 'The corpus contains experimental reaction procedures across broad research contexts. It is not a ready-made school practical bank; unsafe or age-inappropriate records must never be exposed to students.',
  },
  {
    id: 'ciaaw', name: 'CIAAW', category: 'Atomic weights and isotope compositions',
    canonicalUrl: 'https://ciaaw.org/atomic-weights.htm',
    licence: 'Official reference source; link and cite; confirm reuse terms before republishing tables', reuse: 'reference-only',
    plannedUse: 'Current standard atomic weights, interval values and isotope-abundance context.',
    ingestion: 'Maintain a small versioned transcription only after checking the official release and reviewer approval.',
    caveat: 'Some standard atomic weights are intervals or conditional values, not a single universal decimal.',
  },
  {
    id: 'nist', name: 'NIST Chemistry WebBook (SRD 69)', category: 'Thermochemistry and spectra',
    canonicalUrl: 'https://webbook.nist.gov/chemistry/',
    licence: 'Reference service; confirm applicable SRD permissions before bulk redistribution', reuse: 'reference-only',
    plannedUse: 'Thermochemical properties, reaction thermochemistry, IR, mass, UV/Vis and gas-phase data.',
    ingestion: 'Use reference links or permitted query access; store citation metadata and only redistribute data after terms review.',
    caveat: 'Do not mirror the complete WebBook or spectra corpus without verifying its conditions of use.',
  },
  {
    id: 'iupac', name: 'IUPAC Gold Book', category: 'Terminology and definitions',
    canonicalUrl: 'https://goldbook.iupac.org/',
    licence: 'Individual terms: CC BY-SA 4.0; verify compilation and commercial-use terms separately', reuse: 'open-data',
    plannedUse: 'Terminology, definitions, recommended symbols and concept cross-links.',
    ingestion: 'Use individual terms with required attribution/share-alike treatment; link to the canonical term page.',
    caveat: 'The compilation has separate licensing considerations and the current edition warns that some definitions may be superseded. Store term source and review date.',
  },
  {
    id: 'rdkit', name: 'RDKit', category: 'Cheminformatics software',
    canonicalUrl: 'https://github.com/rdkit/rdkit',
    licence: 'BSD 3-Clause software licence', reuse: 'software',
    plannedUse: 'Structure parsing, sanitisation, descriptors, fingerprints and computational chemistry workflows.',
    ingestion: 'Integrate a pinned package/build only after checking web/WASM support, transitive dependencies and licence notices.',
    caveat: 'RDKit is software, not a chemical reference dataset. Its output still needs scientific validation.',
  },
  {
    id: 'phet', name: 'PhET Interactive Simulations', category: 'Pedagogical simulation benchmark',
    canonicalUrl: 'https://phet.colorado.edu/en/simulations/browse?subjects=chemistry',
    licence: 'HTML simulations commonly CC BY-NC 4.0; check individual assets and current terms', reuse: 'reference-only',
    plannedUse: 'Pedagogical benchmarking for atom/molecule building, bonding, pH, gases and reactions.',
    ingestion: 'Study instructional design and build original interactions; do not copy simulation code or bundled assets.',
    caveat: 'Attribution and non-commercial restrictions apply to relevant materials. Linking is safer than rehosting.',
  },
];
