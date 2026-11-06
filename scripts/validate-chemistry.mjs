import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = readFileSync(new URL('../src/chemistry/equationBalancer.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const errors = (output.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
if (errors.length) throw new Error(errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, ' ')).join('\n'));
const directory = mkdtempSync(join(tmpdir(), 'chem-atlas-balance-'));
try {
  const path = join(directory, 'equationBalancer.mjs');
  writeFileSync(path, output.outputText);
  const { balanceChemicalEquation } = await import(pathToFileURL(path));
  const samples = [
    ['H2 + O2 -> H2O', '2H2 + O2 → 2H2O'],
    ['CH4 + O2 -> CO2 + H2O', 'CH4 + 2O2 → CO2 + 2H2O'],
    ['Fe2O3 + CO -> Fe + CO2', 'Fe2O3 + 3CO → 2Fe + 3CO2'],
    ['Al + O2 -> Al2O3', '4Al + 3O2 → 2Al2O3'],
    ['Ca(OH)2 + HCl -> CaCl2 + H2O', 'Ca(OH)2 + 2HCl → CaCl2 + 2H2O'],
    ['H2SO4 + NaOH -> Na2SO4 + H2O', 'H2SO4 + 2NaOH → Na2SO4 + 2H2O'],
    ['C2H6 + O2 -> CO2 + H2O', '2C2H6 + 7O2 → 4CO2 + 6H2O'],
    ['Al2(SO4)3 + Ca(OH)2 -> Al(OH)3 + CaSO4', 'Al2(SO4)3 + 3Ca(OH)2 → 2Al(OH)3 + 3CaSO4'],
    ['Na3PO4 + MgCl2 -> Mg3(PO4)2 + NaCl', '2Na3PO4 + 3MgCl2 → Mg3(PO4)2 + 6NaCl'],
  ];
  for (const [input, expected] of samples) {
    const result = balanceChemicalEquation(input);
    if (result.equation !== expected) throw new Error(`Unexpected balance for ${input}: ${result.equation}; expected ${expected}`);
    if (result.balanceRows.some((row) => row.reactants !== row.products)) throw new Error(`Element conservation failed for ${input}`);
  }
  const rejects = [
    'H2 + O2 H2O',
    'Na+ + Cl- -> NaCl',
    'CuSO4·5H2O -> CuSO4 + H2O',
    'H2 + O2 -> H2O + H2O2',
    'this is not a formula -> H2O',
    'Xx2 + O2 -> Xx2O4',
    '0H2 + O2 -> H2O',
    'Ca()2 + HCl -> CaCl2 + H2O',
  ];
  for (const input of rejects) {
    let rejected = false;
    try { balanceChemicalEquation(input); } catch { rejected = true; }
    if (!rejected) throw new Error(`Unsupported/ambiguous equation was silently accepted: ${input}`);
  }
  console.log(`Chemistry equation-balancer regression tests: PASS (${samples.length} balanced equations, ${rejects.length} invalid/unsupported cases)`);
} finally { rmSync(directory, { recursive: true, force: true }); }
