import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, FlaskConical, RotateCcw, Scale } from 'lucide-react';
import { balanceChemicalEquation, type BalanceResult } from '../chemistry/equationBalancer';

const EXAMPLES = [
  'H2 + O2 -> H2O',
  'CH4 + O2 -> CO2 + H2O',
  'Fe2O3 + CO -> Fe + CO2',
  'Al + O2 -> Al2O3',
  'Ca(OH)2 + HCl -> CaCl2 + H2O',
  'H2SO4 + NaOH -> Na2SO4 + H2O',
];

export default function V5EquationBalancer({ disabled = false }: { disabled?: boolean }) {
  const [equation, setEquation] = useState(EXAMPLES[0]);
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const solve = (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try { setResult(balanceChemicalEquation(equation)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not balance this equation.'); }
    finally { setBusy(false); }
  };
  return <section className="panel v5-equation-balancer">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V5 · EXACT INTEGER STOICHIOMETRY</div><h3>Explainable equation balancer</h3></div><span className="pill pill-mint"><Scale size={12}/> CONSERVATION CHECK</span></div>
    <p className="v2-intro-copy">Balance supported neutral molecular equations with exact rational linear algebra. The solver verifies that every element count matches on both sides.</p>
    <form className="v5-equation-form" onSubmit={solve}>
      <label htmlFor="v5-equation-input">Chemical equation</label>
      <input id="v5-equation-input" value={equation} onChange={(event) => setEquation(event.target.value)} maxLength={500} spellCheck={false} placeholder="H2 + O2 -> H2O" disabled={disabled}/>
      <div className="v5-equation-examples"><span>Examples</span>{EXAMPLES.map((example) => <button type="button" key={example} onClick={() => { setEquation(example); setResult(null); setError(''); }} disabled={disabled}>{example}</button>)}</div>
      <div className="v5-equation-actions"><button className="primary-button small" type="submit" disabled={disabled || busy || !equation.trim()}><Scale size={14}/> Balance equation</button><button className="outline-button compact-button" type="button" onClick={() => { setEquation(EXAMPLES[0]); setResult(null); setError(''); }}><RotateCcw size={13}/> Reset</button></div>
    </form>
    {error && <div className="v5-equation-error" role="alert">{error}</div>}
    {result && <div className="v5-equation-result" aria-live="polite">
      <div className="v5-equation-answer"><CheckCircle2 size={17}/><div><span>BALANCED EQUATION</span><strong>{result.equation}</strong></div></div>
      <div className="v5-equation-matrix"><strong>Atom conservation</strong>{result.balanceRows.map((row) => <div key={row.element}><span>{row.element}</span><b>{row.reactants.toString()}</b><ArrowRight size={13}/><b>{row.products.toString()}</b>{row.reactants === row.products && <CheckCircle2 size={13}/>}</div>)}</div>
      <details className="v5-equation-method"><summary>How the solver works</summary><p>It builds an element-by-species conservation matrix, reduces it with exact rational arithmetic, finds the one-dimensional nullspace and converts the result into the smallest positive integer coefficient set. A second exact-count pass verifies every element.</p><small>Method: {result.method.replaceAll('-', ' ')}. {result.limitation}</small></details>
    </div>}
    <div className="v5-equation-boundary"><FlaskConical size={15}/><span>Scope boundary: neutral formula equations only. Ionic charge balancing, half-reactions, hydrates and ambiguous multi-solution systems require a different solver.</span></div>
  </section>;
}
