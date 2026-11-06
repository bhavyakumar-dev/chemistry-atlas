// Curated classroom structure examples. This is intentionally a small allowlist,
// not an unrestricted chemical-name search. Additional entries require educator
// review for syllabus relevance, record provenance and student-facing suitability.
export type ApprovedTeachingMolecule = {
  name: string;
  cid: number;
  aliases: string[];
  gradeUse: string[];
  note: string;
};

export const approvedTeachingMolecules: ApprovedTeachingMolecule[] = [
  { name: 'water', cid: 962, aliases: ['water', 'h2o', 'dihydrogen oxide'], gradeUse: ['10', '11'], note: 'Molecular shape and hydrogen bonding context.' },
  { name: 'carbon dioxide', cid: 280, aliases: ['carbon dioxide', 'co2'], gradeUse: ['10', '11'], note: 'Linear molecular geometry and covalent bonding.' },
  { name: 'glucose', cid: 5793, aliases: ['glucose', 'd-glucose'], gradeUse: ['10', '12'], note: 'A carbohydrate structure for biochemistry context.' },
  { name: 'sucrose', cid: 5988, aliases: ['sucrose', 'table sugar'], gradeUse: ['10', '12'], note: 'A disaccharide structure for carbohydrate context.' },
  { name: 'citric acid', cid: 311, aliases: ['citric acid'], gradeUse: ['10', '12'], note: 'A familiar polyfunctional carboxylic-acid structure.' },
  { name: 'glycine', cid: 750, aliases: ['glycine'], gradeUse: ['11', '12'], note: 'A simple amino-acid structure.' },
];
