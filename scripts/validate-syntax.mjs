import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'functions'];
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
}
for (const root of roots) walk(root);
let errors = 0;
for (const file of files) {
  const result = ts.transpileModule(readFileSync(file, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  });
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors += 1;
      console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
    }
  }
}
if (errors) process.exit(1);
console.log(`Chemistry Atlas source syntax validation: PASS (${files.length} TypeScript/TSX files)`);
