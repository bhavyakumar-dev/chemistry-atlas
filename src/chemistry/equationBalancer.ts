type Fraction = { n: bigint; d: bigint };
export type BalancedSpecies = { formula: string; coefficient: bigint; side: 'reactant' | 'product' };
export type BalanceResult = {
  equation: string;
  coefficients: bigint[];
  species: BalancedSpecies[];
  elements: string[];
  balanceRows: { element: string; reactants: bigint; products: bigint }[];
  method: 'exact-rational-nullspace';
  limitation: string;
};

const abs = (n: bigint) => n < 0n ? -n : n;
const gcd = (a: bigint, b: bigint): bigint => {
  a = abs(a); b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
const lcm = (a: bigint, b: bigint) => abs(a / gcd(a, b) * b);
const f = (n: bigint, d = 1n): Fraction => {
  if (d === 0n) throw new Error('Internal equation-balancer division by zero.');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
const add = (a: Fraction, b: Fraction) => f(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Fraction, b: Fraction) => f(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Fraction, b: Fraction) => f(a.n * b.n, a.d * b.d);
const div = (a: Fraction, b: Fraction) => f(a.n * b.d, a.d * b.n);
const ELEMENT_SYMBOLS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));

function parseFormula(raw: string): Map<string, bigint> {
  const formula = raw.trim();
  if (!formula || formula.length > 120 || /[\s+−-]/.test(formula) || /[·.]/.test(formula)) {
    throw new Error(`Unsupported formula "${raw}". Enter a neutral molecular formula without charge or hydrate notation.`);
  }
  let index = 0;
  const readNumber = (): bigint => {
    const start = index;
    while (index < formula.length && /\d/.test(formula[index])) index++;
    if (start === index) return 1n;
    const number = BigInt(formula.slice(start, index));
    if (number < 1n || number > 1_000_000n) throw new Error('Formula multipliers must be between 1 and 1,000,000.');
    return number;
  };
  const parseGroup = (closing?: string): Map<string, bigint> => {
    const counts = new Map<string, bigint>();
    let found = false;
    while (index < formula.length) {
      const char = formula[index];
      if (closing && char === closing) {
        index++;
        if (!found) throw new Error(`Empty groups are not valid in formula "${raw}".`);
        return counts;
      }
      if (char === '(' || char === '[') {
        index++;
        const nested = parseGroup(char === '(' ? ')' : ']');
        const multiplier = readNumber();
        for (const [element, count] of nested) counts.set(element, (counts.get(element) || 0n) + count * multiplier);
        found = true;
        continue;
      }
      if (/[A-Z]/.test(char)) {
        const start = index++;
        while (index < formula.length && /[a-z]/.test(formula[index])) index++;
        const element = formula.slice(start, index);
        if (!ELEMENT_SYMBOLS.has(element)) throw new Error(`Unknown element symbol "${element}" in formula "${raw}".`);
        const multiplier = readNumber();
        counts.set(element, (counts.get(element) || 0n) + multiplier);
        found = true;
        continue;
      }
      throw new Error(`Unexpected character "${char}" in formula "${raw}".`);
    }
    if (closing) throw new Error(`Missing closing bracket in formula "${raw}".`);
    if (!found) throw new Error(`Formula "${raw}" is empty or invalid.`);
    return counts;
  };
  const counts = parseGroup();
  if (index !== formula.length || counts.size === 0) throw new Error(`Invalid formula "${raw}".`);
  return counts;
}

function parseSide(value: string, side: 'reactant' | 'product'): BalancedSpecies[] {
  const terms = value.split('+').map((term) => term.trim()).filter(Boolean);
  if (!terms.length || terms.length > 8) throw new Error('Each side must contain between 1 and 8 chemical species.');
  return terms.map((term) => {
    // Existing leading coefficients are ignored: the solver derives the smallest
    // integer stoichiometric ratio from the formulas themselves.
    const coefficientMatch = term.match(/^(\d+)\s*(.+)$/);
    if (coefficientMatch && (BigInt(coefficientMatch[1]) < 1n || BigInt(coefficientMatch[1]) > 1_000_000n)) throw new Error(`Leading coefficient in "${term}" must be between 1 and 1,000,000.`);
    const withoutCoefficient = coefficientMatch ? coefficientMatch[2] : term;
    if (!withoutCoefficient || /\s/.test(withoutCoefficient)) throw new Error(`Could not read species "${term}". Use formulas such as Ca(OH)2.`);
    parseFormula(withoutCoefficient);
    return { formula: withoutCoefficient, coefficient: 1n, side };
  });
}

function nullspaceOne(matrix: bigint[][]): bigint[] {
  const rowCount = matrix.length;
  const columnCount = matrix[0]?.length || 0;
  const a: Fraction[][] = matrix.map((row) => row.map((n) => f(n)));
  const pivots: number[] = [];
  let pivotRow = 0;
  for (let column = 0; column < columnCount && pivotRow < rowCount; column++) {
    let selected = pivotRow;
    while (selected < rowCount && a[selected][column].n === 0n) selected++;
    if (selected === rowCount) continue;
    [a[pivotRow], a[selected]] = [a[selected], a[pivotRow]];
    const pivot = a[pivotRow][column];
    for (let c = column; c < columnCount; c++) a[pivotRow][c] = div(a[pivotRow][c], pivot);
    for (let r = 0; r < rowCount; r++) {
      if (r === pivotRow || a[r][column].n === 0n) continue;
      const factor = a[r][column];
      for (let c = column; c < columnCount; c++) a[r][c] = sub(a[r][c], mul(factor, a[pivotRow][c]));
    }
    pivots.push(column);
    pivotRow++;
  }
  const freeColumns = Array.from({ length: columnCount }, (_, i) => i).filter((i) => !pivots.includes(i));
  if (freeColumns.length !== 1) {
    throw new Error(freeColumns.length === 0
      ? 'This equation has no non-zero balancing solution.'
      : 'This equation has multiple independent balancing solutions. Use a more specific reaction or a dedicated advanced solver.');
  }
  const freeColumn = freeColumns[0];
  const solution: Fraction[] = Array.from({ length: columnCount }, () => f(0n));
  solution[freeColumn] = f(1n);
  pivots.forEach((column, row) => { solution[column] = f(-a[row][freeColumn].n, a[row][freeColumn].d); });
  if (solution.every((value) => value.n < 0n)) solution.forEach((value, i) => { solution[i] = f(-value.n, value.d); });
  if (solution.some((value) => value.n <= 0n)) throw new Error('A strictly positive coefficient was not found for every species. Check the reaction formulas.');
  const commonDenominator = solution.reduce((current, value) => lcm(current, value.d), 1n);
  const integers = solution.map((value) => value.n * (commonDenominator / value.d));
  const divisor = integers.reduce((current, value) => gcd(current, value), integers[0]);
  const smallest = integers.map((value) => value / divisor);
  if (smallest.some((value) => value > 1_000_000_000n)) throw new Error('The smallest integer coefficients are too large for this teaching solver.');
  return smallest;
}

export function balanceChemicalEquation(input: string): BalanceResult {
  if (typeof input !== 'string' || input.trim().length < 5 || input.length > 500) throw new Error('Enter a chemical equation up to 500 characters.');
  const separators = [...input.matchAll(/->|→|=/g)];
  if (separators.length !== 1) throw new Error('Use exactly one reaction arrow, for example H2 + O2 -> H2O.');
  const separator = separators[0];
  const leftText = input.slice(0, separator.index).trim();
  const rightText = input.slice((separator.index || 0) + separator[0].length).trim();
  if (!leftText || !rightText) throw new Error('Add at least one reactant and one product.');
  const species = [...parseSide(leftText, 'reactant'), ...parseSide(rightText, 'product')];
  if (species.length > 12) throw new Error('The teaching solver supports at most 12 total species.');
  const formulas = species.map((item) => parseFormula(item.formula));
  const elements = Array.from(new Set(formulas.flatMap((formula) => [...formula.keys()]))).sort();
  if (elements.length > 12) throw new Error('The teaching solver supports at most 12 distinct elements.');
  const matrix = elements.map((element) => formulas.map((formula, index) => {
    const count = formula.get(element) || 0n;
    return species[index].side === 'reactant' ? count : -count;
  }));
  const coefficients = nullspaceOne(matrix);
  const balancedSpecies = species.map((item, index) => ({ ...item, coefficient: coefficients[index] }));
  const balanceRows = elements.map((element) => {
    let reactants = 0n; let products = 0n;
    formulas.forEach((formula, index) => {
      const count = (formula.get(element) || 0n) * coefficients[index];
      if (species[index].side === 'reactant') reactants += count;
      else products += count;
    });
    return { element, reactants, products };
  });
  if (balanceRows.some((row) => row.reactants !== row.products)) throw new Error('Internal conservation check failed. Do not use this result.');
  const renderSide = (side: 'reactant' | 'product') => balancedSpecies.filter((item) => item.side === side)
    .map((item) => `${item.coefficient === 1n ? '' : item.coefficient.toString()}${item.formula}`).join(' + ');
  return {
    equation: `${renderSide('reactant')} → ${renderSide('product')}`,
    coefficients, species: balancedSpecies, elements, balanceRows,
    method: 'exact-rational-nullspace',
    limitation: 'Supports neutral formula equations with element symbols and nested () or [] groups. It does not balance ionic charges, half-reactions, hydrates or reactions with multiple independent solutions.',
  };
}
