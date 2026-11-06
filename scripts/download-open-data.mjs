import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Curated, bounded source acquisition. This intentionally does not mirror entire
// scientific databases. Every output receives a SHA-256 and source/licence note.
// Raw reaction datasets must remain unpublished until a teacher/admin has screened
// records for age-appropriate educational use and preserved CC-BY-SA attribution.
const root = process.cwd();
const outDir = path.join(root, 'data', 'downloads');
const codUrls = (process.env.COD_PATH_URLS || '').split(',').map((x) => x.trim()).filter(Boolean);
const pdbIds = (process.env.PDB_IDS || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const pubchemCids = (process.env.PUBCHEM_CIDS || '').split(',').map((x) => x.trim()).filter(Boolean);
const allowedPdb = /^[0-9][A-Z0-9]{3}$/;
const approvedTeachingCids = new Set(['962', '280', '5793', '5988', '311', '750']);
const maxBytes = 25 * 1024 * 1024;

if (!codUrls.length && !pdbIds.length && !pubchemCids.length) {
  console.log('No dataset IDs supplied. Optional environment variables:');
  console.log('  COD_PATH_URLS=<comma-separated exact official .cif URLs>');
  console.log('  PDB_IDS=<comma-separated checked PDB IDs>');
  console.log('ORD raw reaction corpora are reference-only until a teacher-reviewed, safe educational subset is curated.');
  console.log('  PUBCHEM_CIDS=<comma-separated numeric PubChem CIDs>');
  console.log('Only selected records are fetched; full corpora are intentionally not mirrored.');
  process.exit(0);
}

await fs.mkdir(outDir, { recursive: true });
const records = [];
async function save(url, filename, source, licence, useNote) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ChemistryAtlas-OpenScience/0.4 educational selected-record acquisition' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) throw new Error(`${source}: unexpected file size ${bytes.length}; use separately managed storage`);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  await fs.writeFile(path.join(outDir, safeName), bytes);
  records.push({ source, url, final_url: response.url, filename: safeName, bytes: bytes.length, sha256, licence, use_note: useNote, retrieved_at: new Date().toISOString() });
}

for (const [index, value] of codUrls.entries()) {
  const url = new URL(value);
  const officialHosts = new Set(['www.crystallography.net', 'cod.psdi.ac.uk']);
  if (!officialHosts.has(url.hostname) || !url.pathname.toLowerCase().endsWith('.cif')) {
    throw new Error(`COD URL must be an exact official COD .cif URL: ${value}`);
  }
  const filename = `cod-${path.basename(url.pathname).replace(/[^a-zA-Z0-9._-]/g, '_') || `${index}.cif`}`;
  await save(url.toString(), filename, 'Crystallography Open Database', 'CC0-1.0', 'Acknowledge the original structure authors and retain COD record ID.');
}

for (const id of pdbIds) {
  if (!allowedPdb.test(id)) throw new Error(`Invalid PDB identifier: ${id}`);
  await save(`https://files.rcsb.org/download/${id}.cif`, `pdb-${id}.cif`, 'RCSB Protein Data Bank archive', 'CC0-1.0 for PDB archive data', 'Acknowledge original structure authors; inspect integrated external-resource metadata separately.');
}

for (const cid of pubchemCids) {
  if (!approvedTeachingCids.has(cid)) throw new Error(`PubChem CID ${cid} is not on the educator-reviewed classroom allowlist. Update the list only after curriculum, source and age-appropriateness review.`);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=3d`;
  await save(url, `pubchem-${cid}-3d.sdf`, 'PubChem PUG REST educator-approved selected classroom structure', 'Contributor/source-level terms must be checked', 'This is an API-returned teaching structure, not a blanket licence grant. Preserve CID and source provenance; review contributor terms before redistribution.');
  // Be conservative with API traffic; the PubChem guidance sets a 5 req/s ceiling.
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

const manifest = {
  manifest_version: 2,
  generated_at: new Date().toISOString(),
  warning: 'Selected records only. This manifest does not mean every record is approved for public redistribution. Review provenance, licence, safety classification, units and source conditions before publication.',
  records,
};
await fs.writeFile(path.join(outDir, 'download-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Downloaded ${records.length} selected records. SHA-256 values and licence notes saved to data/downloads/download-manifest.json.`);
