import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, BookOpen, Download, FileText, FlaskConical, Gauge, ShieldCheck, Table2 } from 'lucide-react';
import { v2LabCategories } from '../content/v2Capabilities';

type LabTab = 'catalogue' | 'simulators' | 'report';
export default function V2VirtualLab({ featureFlags = {} }: { featureFlags?: Record<string, boolean> }) {
  const [tab, setTab] = useState<LabTab>('catalogue');
  const [categoryId, setCategoryId] = useState(v2LabCategories[0].id);
  const [volume, setVolume] = useState(10);
  const [gasTemperature, setGasTemperature] = useState(298);
  const [arrheniusTemperature, setArrheniusTemperature] = useState(298);
  const [activationEnergy, setActivationEnergy] = useState(55);
  const [acidExponent, setAcidExponent] = useState(-2);
  const [aim, setAim] = useState('');
  const [observations, setObservations] = useState('');
  const [calculation, setCalculation] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [uncertainty, setUncertainty] = useState('');
  const [errors, setErrors] = useState('');
  const category = v2LabCategories.find((entry) => entry.id === categoryId) || v2LabCategories[0];
  const gasPressure = useMemo(() => 0.082057 * gasTemperature / volume, [gasTemperature, volume]);
  const rateRatio = useMemo(() => Math.exp((activationEnergy * 1000 / 8.314462618) * (1 / 298 - 1 / arrheniusTemperature)), [activationEnergy, arrheniusTemperature]);
  const acidConcentration = Math.pow(10, acidExponent);
  const idealAcidPh = -Math.log10(acidConcentration);
  const showGas = featureFlags['ideal-gas-calculator'] !== false;
  const showArrhenius = featureFlags['arrhenius-calculator'] !== false;
  const showAcid = featureFlags['dilute-acid-ph'] !== false;
  const showReportExport = featureFlags['lab-notebook-export'] !== false;
  const hasCalculators = showGas || showArrhenius || showAcid;
  useEffect(() => { if (!hasCalculators && tab === 'simulators') setTab('catalogue'); }, [hasCalculators, tab]);

  const exportRecord = () => {
    const content = [
      '# Chemistry Atlas V2 — Virtual practical record', '',
      `Date: ${new Date().toLocaleString()}`, `Category: ${category.name}`, '',
      '## Aim and hypothesis', aim || 'Not recorded', '',
      '## Apparatus / virtual materials', category.examples.join('; '), '',
      '## Observations', observations || 'Not recorded', '',
      '## Calculations and equations', calculation || 'Not recorded', '',
      '## Conclusion', conclusion || 'Not recorded', '',
      '## Sources of uncertainty', uncertainty || 'Not recorded', '',
      '## Mistakes and corrective actions', errors || 'Not recorded', '',
      '## Safety and model boundaries', 'This is a digital educational simulation. It does not authorise unsupervised wet-lab work. Check the named experiment protocol, reagent hazards, equipment limits and teacher instructions before performing a physical practical.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `chemistry-atlas-v5-lab-record-${Date.now()}.md`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return <section className="panel v2-lab-companion">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V2 · VIRTUAL PRACTICALS & DATA WORKBENCH</div><h3>Laboratory learning system</h3></div><span className="pill pill-mint">GUIDED + FREE MODE</span></div>
    <p className="v2-intro-copy">V2 groups practicals by chemistry discipline and adds observation, graph-ready calculations, error analysis and downloadable lab records. The current release provides a category map plus the live calculation tools below; it does not claim that every catalogue entry already has a full 3D apparatus simulation.</p>
    <div className="v2-tabbar">{([{ id: 'catalogue', label: 'Experiment map', icon: <BookOpen size={15}/> }, ...(hasCalculators ? [{ id: 'simulators' as const, label: 'Calculation lab', icon: <Gauge size={15}/> }] : []), { id: 'report', label: 'Practical notebook', icon: <FileText size={15}/> }] as { id: LabTab; label: string; icon: ReactNode }[]).map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.icon}{item.label}</button>)}</div>

    {tab === 'catalogue' && <div className="v2-lab-catalogue"><div className="v2-lab-category-list">{v2LabCategories.map((item) => <button key={item.id} className={categoryId === item.id ? 'active' : ''} onClick={() => setCategoryId(item.id)}><span>{item.name}</span><small>{item.examples.length} mapped activities</small></button>)}</div><div className="v2-lab-category-detail"><div className="eyebrow muted-eyebrow">DISCIPLINE MAP · {String(v2LabCategories.findIndex((entry) => entry.id === categoryId) + 1).padStart(2, '0')} / {v2LabCategories.length}</div><h4>{category.name}</h4><p>Example activity pathways in this discipline. Each activity should have a theory brief, apparatus list, controlled procedure, expected observations, calculations, safety notes and explicit model limitations before being published as a completed virtual practical.</p><div className="v2-activity-grid">{category.examples.map((example, index) => <div key={example} className="v2-activity-card"><span>{String(index + 1).padStart(2, '0')}</span><strong>{example}</strong><small>Curriculum mapping · teacher review required</small></div>)}</div><div className="v2-sim-rule"><ShieldCheck size={16}/><span>Real-world practical work remains teacher-supervised. The software should stop unsafe sequences, surface hazard labels and distinguish virtual observations from real laboratory measurements.</span></div></div></div>}

    {tab === 'simulators' && hasCalculators && <div className="v2-calculation-grid">
      {showGas && <article className="v2-calculator-card"><div className="v2-calculator-title"><Gauge size={18}/><div><strong>Ideal gas law</strong><small>PV = nRT · n = 1.00 mol</small></div></div><label>Volume <strong>{volume.toFixed(1)} L</strong><input type="range" min="1" max="20" step="0.5" value={volume} onChange={(e) => setVolume(Number(e.target.value))}/></label><label>Temperature <strong>{gasTemperature} K</strong><input type="range" min="273" max="373" step="1" value={gasTemperature} onChange={(e) => setGasTemperature(Number(e.target.value))}/></label><div className="v2-calculator-result"><span>CALCULATED PRESSURE</span><strong>{gasPressure.toFixed(3)} atm</strong></div><small>Ideal-gas assumption; real gases can deviate, especially at high pressure or near condensation.</small></article>}
      {showArrhenius && <article className="v2-calculator-card"><div className="v2-calculator-title"><Activity size={18}/><div><strong>Arrhenius temperature comparison</strong><small>Relative rate constant · k(T) / k(298 K)</small></div></div><label>Temperature <strong>{arrheniusTemperature} K</strong><input type="range" min="273" max="373" step="1" value={arrheniusTemperature} onChange={(e) => setArrheniusTemperature(Number(e.target.value))}/></label><label>Activation energy <strong>{activationEnergy} kJ mol⁻¹</strong><input type="range" min="20" max="120" step="1" value={activationEnergy} onChange={(e) => setActivationEnergy(Number(e.target.value))}/></label><div className="v2-calculator-result"><span>RELATIVE k</span><strong>{rateRatio.toFixed(3)}×</strong></div><small>Single-step Arrhenius comparison with a fixed activation energy; not a fitted rate law for a named reaction.</small></article>}
      {showAcid && <article className="v2-calculator-card"><div className="v2-calculator-title"><FlaskConical size={18}/><div><strong>Strong-acid pH model</strong><small>Ideal dilute-solution approximation</small></div></div><label>Concentration <strong>{acidConcentration.toExponential(1)} mol L⁻¹</strong><input type="range" min="-6" max="-1" step="0.1" value={acidExponent} onChange={(e) => setAcidExponent(Number(e.target.value))}/></label><div className="v2-ph-scale"><span>pH 0</span><i style={{ left: `${idealAcidPh / 14 * 100}%` }}/><span>pH 14</span></div><div className="v2-calculator-result"><span>IDEAL pH</span><strong>{idealAcidPh.toFixed(2)}</strong></div><small>Assumes complete dissociation, unit activity coefficient and 25 °C water ionisation ignored. Not for concentrated or weak acids.</small></article>}
    </div>}

    {tab === 'report' && <div className="v2-report-form"><div className="v2-report-header"><div><div className="eyebrow muted-eyebrow">STUDENT LAB NOTEBOOK</div><h4>Structured practical record</h4><p>Capture results, reasoning and mistakes. Export a Markdown record for printing or conversion to PDF.</p></div>{showReportExport && <button className="primary-button small" onClick={exportRecord}><Download size={14}/> Export report</button>}</div><label>Experiment discipline<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>{v2LabCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Aim and hypothesis<textarea rows={2} value={aim} onChange={(e) => setAim(e.target.value)} placeholder="What are you testing? State a prediction."/></label><label>Observations and readings<textarea rows={4} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Record measured values, units, colours, precipitates, gas evolution, time points…"/></label><label>Calculations, equations and graphs<textarea rows={3} value={calculation} onChange={(e) => setCalculation(e.target.value)} placeholder="Show the equation, substituted values, units and significant figures."/></label><label>Conclusion<textarea rows={2} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Answer the aim using evidence from your observations."/></label><div className="v2-report-two-col"><label>Uncertainty / sources of error<textarea rows={3} value={uncertainty} onChange={(e) => setUncertainty(e.target.value)} placeholder="Instrument resolution, endpoint judgement, heat loss…"/></label><label>Mistake log and correction<textarea rows={3} value={errors} onChange={(e) => setErrors(e.target.value)} placeholder="What went wrong? What did you change on the next attempt?"/></label></div><div className="v2-report-footnote"><Table2 size={15}/> A full interactive observation table and chart are still tied to each individual experiment module; this notebook provides a common structured export.</div></div>}
  </section>;
}
