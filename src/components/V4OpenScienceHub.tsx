import { useMemo, useState } from 'react';
import { ArrowDownToLine, ExternalLink, FileCheck2, FlaskConical, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { scientificSources } from '../content/scientificSources';

const reuseLabel = {
  'open-data': 'Open data · reuse with attribution',
  'record-level-review': 'Record-level licence review',
  'reference-only': 'Reference and link first',
  software: 'Open-source software',
} as const;

export default function V4OpenScienceHub({ rootPath = "./", featureFlags = {} }: { rootPath?: string; featureFlags?: Record<string, boolean> }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All sources');
  const categories = useMemo(() => ['All sources', ...Array.from(new Set(scientificSources.map((source) => source.category)))], []);
  const filtered = scientificSources.filter((source) =>
    (category === 'All sources' || source.category === category) &&
    `${source.name} ${source.category} ${source.plannedUse} ${source.licence}`.toLowerCase().includes(query.toLowerCase()),
  );

  return <section className="panel admin-section v4-open-science-hub">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V4–V5 · OPEN SCIENCE GOVERNANCE</div><h3>Scientific data and licence registry</h3></div><span className="pill pill-mint">FREE · NON-COMMERCIAL · NO ADS</span></div>
    <p className="v2-intro-copy">Every imported scientific record must keep its source, version, licence, retrieval date, units, conditions, checksum and validation status. A link to a dataset is not the same as permission to redistribute it.</p>
    <div className="v4-principle-grid">
      <article><ShieldCheck size={18}/><strong>Provenance first</strong><small>Record source IDs, authors, release dates and hashes.</small></article>
      <article><FileCheck2 size={18}/><strong>Licence aware</strong><small>Separate reusable datasets from reference-only services.</small></article>
      <article><FlaskConical size={18}/><strong>Validated science</strong><small>Track units, assumptions, peer review and test evidence.</small></article>
      <article><LockKeyhole size={18}/><strong>Privacy by design</strong><small>No advertising trackers or sale of learner data.</small></article>
    </div>
    <div className="v4-source-toolbar"><label className="v4-source-search"><Search size={15}/><input aria-label="Search scientific sources" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources, data types or licences"/></label><select aria-label="Filter scientific source category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="v4-source-grid">{filtered.map((source) => <article className="v4-source-card" key={source.id}>
      <div className="v4-source-top"><span>{source.category}</span><span className={`v4-reuse v4-reuse-${source.reuse}`}>{reuseLabel[source.reuse]}</span></div>
      <h4>{source.name}</h4><p>{source.plannedUse}</p><div className="v4-source-license"><strong>Reuse:</strong> {source.licence}</div>
      <small className="v4-source-caveat">{source.caveat}</small>
      <div className="v4-source-ingestion"><strong>Acquisition:</strong> {source.ingestion}</div>
      <a href={source.canonicalUrl} target="_blank" rel="noreferrer">Open official source <ExternalLink size={12}/></a>
    </article>)}</div>
    {featureFlags['bounded-open-data-ingest'] !== false && <div className="v4-data-note"><ArrowDownToLine size={16}/><span>Bounded acquisition preview is enabled. Downloads are managed through the repository's dataset manifest and scripts, not directly from this browser panel. Only clearly reusable, size-bounded records belong in Git. Raw reaction-procedure corpora are not published to the student catalogue.</span></div>}
    <div className="v4-document-links">
      <a href={`${rootPath}docs/V4_OPEN_SCIENCE_AND_DATA_PLAN.md`} target="_blank" rel="noreferrer">V4 open-science and data policy <ExternalLink size={12}/></a>
      <a href={`${rootPath}docs/V7_ENGINEERING_MIRACLE.md`} target="_blank" rel="noreferrer">V7 engineering vision <ExternalLink size={12}/></a>
      <a href={`${rootPath}docs/WHAT_WE_NEED_FROM_YOU.md`} target="_blank" rel="noreferrer">Project-owner contribution checklist <ExternalLink size={12}/></a>
      <a href={`${rootPath}docs/PRODUCT_POLICY.md`} target="_blank" rel="noreferrer">Free-first product policy <ExternalLink size={12}/></a>
    </div>
  </section>;
}
