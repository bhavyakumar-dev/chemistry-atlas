import ts from 'typescript';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const temp = mkdtempSync(join(tmpdir(), 'chemistry-atlas-content-'));
const sourceFiles = ['src/content/lessons.ts', 'src/content/tracks.ts', 'src/content/experiments.ts', 'src/content/questionBank.ts', 'src/content/releaseVersions.ts', 'src/content/scientificSources.ts', 'src/content/approvedTeachingMolecules.ts', 'src/content/advancedFeatures.ts', 'src/data.ts'];

try {
  for (const relative of sourceFiles) {
    let source = readFileSync(new URL(relative, root), 'utf8');
    source = source.replaceAll("from './lessons'", "from './lessons.js'")
      .replaceAll("from './tracks'", "from './tracks.js'");
    const output = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    });
    const errors = (output.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
    if (errors.length) throw new Error(`${relative}: ${errors.map((e) => ts.flattenDiagnosticMessageText(e.messageText, ' ')).join('; ')}`);
    const name = relative.split('/').at(-1).replace(/\.ts$/, '.js');
    writeFileSync(join(temp, name), output.outputText);
  }

  const lessons = await import(pathToFileURL(join(temp, 'lessons.js')));
  const tracks = await import(pathToFileURL(join(temp, 'tracks.js')));
  const experiments = await import(pathToFileURL(join(temp, 'experiments.js')));
  const questions = await import(pathToFileURL(join(temp, 'questionBank.js')));
  const data = await import(pathToFileURL(join(temp, 'data.js')));
  const releaseVersions = await import(pathToFileURL(join(temp, 'releaseVersions.js')));
  const scientificSources = await import(pathToFileURL(join(temp, 'scientificSources.js')));
  const approvedMolecules = await import(pathToFileURL(join(temp, 'approvedTeachingMolecules.js')));
  const advancedFeatures = await import(pathToFileURL(join(temp, 'advancedFeatures.js')));

  const gradeCounts = Object.fromEntries(['10', '11', '12'].map((grade) => [grade, lessons.boardLessons.filter((lesson) => lesson.grade === grade).length]));
  const expectedGradeCounts = { '10': 9, '11': 9, '12': 10 };
  if (lessons.boardLessons.length !== 28 || JSON.stringify(gradeCounts) !== JSON.stringify(expectedGradeCounts)) {
    throw new Error(`Board lesson inventory mismatch: ${JSON.stringify(gradeCounts)}`);
  }
  for (const lesson of lessons.boardLessons) {
    if (lesson.sections.length < 4 || lesson.objectives.length < 3 || lesson.checks.length < 2 || !lesson.workedExample?.solution) {
      throw new Error(`Incomplete authored lesson structure: ${lesson.id}`);
    }
  }

  const expectedUnits = { CBSE: 24, JEE_MAIN: 20, NEET: 21 };
  const allUnits = Object.values(tracks.courseTracks).flatMap((track) => track.units);
  const lessonIds = new Set(lessons.boardLessons.map((lesson) => lesson.id));
  for (const [name, count] of Object.entries(expectedUnits)) {
    if (tracks.courseTracks[name].units.length !== count) throw new Error(`${name} should contain ${count} units.`);
  }
  for (const unit of allUnits) {
    if (!unit.mappedLessonIds.length || unit.mappedLessonIds.some((id) => !lessonIds.has(id))) {
      throw new Error(`Invalid core-lesson mapping in ${unit.code}`);
    }
    if (!unit.topics.length || !unit.assessment) throw new Error(`Missing syllabus/assessment data in ${unit.code}`);
  }

  const questionList = questions.questionBank;
  const questionIds = new Set();
  for (const question of questionList) {
    if (questionIds.has(question.id)) throw new Error(`Duplicate question ID: ${question.id}`);
    questionIds.add(question.id);
    if (question.options.length !== 4 || question.answer < 0 || question.answer > 3 || !question.explanation) {
      throw new Error(`Invalid MCQ structure: ${question.id}`);
    }
  }
  const extensionTrackByCode = (code) => code.startsWith('CB') ? 'CBSE' : code.startsWith('JM') ? 'JEE_MAIN' : 'NEET';
  for (const unit of allUnits) {
    if (!questionList.some((question) => question.track === extensionTrackByCode(unit.code) && question.unitId === unit.code)) {
      throw new Error(`No mapped question in ${unit.code}`);
    }
  }

  if (experiments.experimentLibrary.length !== 47) throw new Error('Experiment library should contain 47 entries.');
  if (experiments.experimentLibrary.some((item) => !item.principle || item.procedure.length < 3 || !item.safety || !item.report.length)) {
    throw new Error('An experiment is missing required guide/safety/report fields.');
  }
  if (data.modelOptions.length !== 11 || data.experiments.length !== 6 || data.diyGuides.length !== 5) {
    throw new Error('3D model, interactive lab mode or DIY inventory mismatch.');
  }

  if (releaseVersions.releaseDefinitions.map((item) => item.id).join(',') !== 'v1,v2,v3,v4,v5') throw new Error('Release selector must contain V1–V5 in order.');
  if (scientificSources.scientificSources.length < 9) throw new Error('Scientific source registry is incomplete.');
  if (!scientificSources.scientificSources.some((item) => item.id === 'cod' && item.licence.includes('CC0'))) throw new Error('COD CC0 provenance entry is missing.');
  if (approvedMolecules.approvedTeachingMolecules.length !== 6) throw new Error('The educator-reviewed molecule allowlist should contain six entries.');
  if (advancedFeatures.advancedFeatures.length !== 50) throw new Error(`V5 feature registry must contain exactly 50 features, got ${advancedFeatures.advancedFeatures.length}.`);
  const featureStatusCounts = Object.fromEntries(['available', 'preview', 'planned'].map((status) => [status, advancedFeatures.advancedFeatures.filter((feature) => feature.status === status).length]));
  const expectedFeatureStatusCounts = { available: 15, preview: 6, planned: 29 };
  if (JSON.stringify(featureStatusCounts) !== JSON.stringify(expectedFeatureStatusCounts)) throw new Error(`Feature status counts changed unexpectedly: ${JSON.stringify(featureStatusCounts)}`);
  if (!advancedFeatures.advancedFeatures.some((feature) => feature.id === 'equation-balancer' && feature.status === 'available')) throw new Error('The V5 neutral equation balancer must be registered as available.');
  const featureIds = advancedFeatures.advancedFeatures.map((item) => item.id);
  if (new Set(featureIds).size !== featureIds.length) throw new Error('V5 feature IDs must be unique.');
  if (advancedFeatures.advancedFeatures.some((item) => !item.name || !item.description || !item.acceptance || !item.release)) throw new Error('Every V5 feature must include an acceptance gate and release target.');
  if (advancedFeatures.advancedFeatures.some((item) => item.status === 'planned' && advancedFeatures.defaultFeatureFlags[item.id] !== false)) throw new Error('Planned features must default to locked/disabled.');
  const rolloutApi = readFileSync(new URL('functions/api/admin/feature-flags.ts', root), 'utf8');
  const whitelist = new Set([...rolloutApi.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]).filter((id) => advancedFeatures.advancedFeatures.some((feature) => feature.id === id)));
  const expectedRolloutIds = new Set(advancedFeatures.advancedFeatures.filter((feature) => feature.status !== 'planned' && feature.id !== 'release-selector').map((feature) => feature.id));
  if (whitelist.size !== expectedRolloutIds.size || [...expectedRolloutIds].some((id) => !whitelist.has(id))) throw new Error('Feature rollout API whitelist does not match the release-ready/preview registry.');
  const dataDownloader = readFileSync(new URL('scripts/download-open-data.mjs', root), 'utf8');
  for (const molecule of approvedMolecules.approvedTeachingMolecules) {
    if (!dataDownloader.includes(`'${molecule.cid}'`)) throw new Error(`PubChem downloader allowlist is missing CID ${molecule.cid}.`);
  }
  if (dataDownloader.includes('ORD_DATA_URLS')) throw new Error('Raw ORD procedure datasets must remain reference-only until teacher screening.');

  console.log('Chemistry Atlas content validation: PASS');
  console.log(`Board lessons: ${lessons.boardLessons.length} (${gradeCounts['10']}/${gradeCounts['11']}/${gradeCounts['12']})`);
  console.log(`Extension syllabus units: ${allUnits.length} (CBSE 24 · JEE Main 20 · NEET 21)`);
  console.log(`Questions: ${questionList.length}; experiments: ${experiments.experimentLibrary.length}; models: ${data.modelOptions.length}; lab modes: ${data.experiments.length}; DIYs: ${data.diyGuides.length}`);
  console.log(`Editions: ${releaseVersions.releaseDefinitions.length}; V5 features: ${advancedFeatures.advancedFeatures.length}; scientific sources: ${scientificSources.scientificSources.length}; educator-approved molecules: ${approvedMolecules.approvedTeachingMolecules.length}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
