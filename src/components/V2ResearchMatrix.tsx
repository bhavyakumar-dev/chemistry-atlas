import { ExternalLink, Microscope, Orbit, ShieldCheck } from 'lucide-react';
import { v2CapabilityGroups, v2ResearchMap } from '../content/v2Capabilities';

export default function V2ResearchMatrix() {
  return <section className="panel admin-section v2-research-matrix">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V2 RESEARCH BLUEPRINT</div><h3>Capability coverage and source map</h3></div><span className="pill pill-violet">RESEARCH INVENTORY</span></div>
    <p className="v2-intro-copy">These are the capability areas to combine and validate in Chemistry Atlas. The references are independent products and research tools; their code, paid content, logos and proprietary assets are not copied into this project.</p>
    <div className="v2-capability-grid">{v2CapabilityGroups.map((group, index) => <article className="v2-capability-card" key={group.area}><div className="v2-capability-card-top"><span>{String(index + 1).padStart(2, '0')}</span>{index === 0 ? <Orbit size={17}/> : index === 3 ? <Microscope size={17}/> : <ShieldCheck size={17}/>}</div><h4>{group.area}</h4><ul>{group.capabilities.map((feature) => <li key={feature}>{feature}</li>)}</ul><small>{group.evidence}</small></article>)}</div>
    <div className="v2-source-heading"><div><div className="eyebrow muted-eyebrow">BENCHMARK SOURCES</div><h4>Platforms represented in the research screenshots</h4></div><span>{v2ResearchMap.length} references</span></div>
    <div className="v2-source-list">{v2ResearchMap.map((source) => <details key={source.name} className="v2-source-item"><summary><strong>{source.name}</strong><span>{source.verification}</span><ExternalLink size={13}/></summary><ul>{source.capabilities.map((feature) => <li key={feature}>{feature}</li>)}</ul>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open source page <ExternalLink size={12}/></a>}</details>)}</div>
  </section>;
}
