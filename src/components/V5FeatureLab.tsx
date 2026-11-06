import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, CircleHelp, LockKeyhole, Search, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { advancedFeatures, type AdvancedFeatureStatus } from '../content/advancedFeatures';

export default function V5FeatureLab({ flags, onToggle, readOnly = false, saving = false }: {
  flags: Record<string, boolean>;
  onToggle: (id: string, enabled: boolean) => void;
  readOnly?: boolean;
  saving?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [showRoadmap, setShowRoadmap] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const categories = useMemo(() => ['All categories', ...Array.from(new Set(advancedFeatures.map((item) => item.category)))], []);
  const filtered = advancedFeatures.filter((feature) => {
    if (!showRoadmap && feature.status === 'planned') return false;
    if (category !== 'All categories' && feature.category !== category) return false;
    if (status !== 'All statuses' && feature.status !== status) return false;
    return `${feature.name} ${feature.description} ${feature.acceptance} ${feature.release}`.toLowerCase().includes(query.toLowerCase());
  });
  const counts = {
    available: advancedFeatures.filter((item) => item.status === 'available').length,
    preview: advancedFeatures.filter((item) => item.status === 'preview').length,
    planned: advancedFeatures.filter((item) => item.status === 'planned').length,
  };
  const statusLabel: Record<AdvancedFeatureStatus, string> = { available: 'Available in source', preview: 'Preview / configuration dependent', planned: 'Roadmap · not implemented' };

  return <section className="panel admin-section v5-feature-lab">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V5 · ADVANCED FEATURE GOVERNANCE</div><h3>50-feature engineering registry</h3></div><span className="pill pill-mint"><Sparkles size={12}/> FREE FOREVER · NO ADS</span></div>
    <p className="v2-intro-copy">Every feature has an explicit implementation state and an acceptance test. Administrators can switch release-ready and preview rollout flags. Roadmap items stay locked until their code and validation gates exist; a switch must never make an unimplemented feature appear functional.</p>
    <div className="v5-feature-stats">
      <div><strong>{advancedFeatures.length}</strong><span>REGISTERED</span></div>
      <div><strong>{counts.available}</strong><span>AVAILABLE</span></div>
      <div><strong>{counts.preview}</strong><span>PREVIEW</span></div>
      <div><strong>{counts.planned}</strong><span>ROADMAP</span></div>
    </div>
    <div className="v5-feature-toolbar">
      <label className="v4-source-search"><Search size={15}/><input aria-label="Search features" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search features, acceptance criteria…"/></label>
      <select aria-label="Filter feature category" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Filter implementation status" value={status} onChange={(e) => setStatus(e.target.value)}><option>All statuses</option><option value="available">Available</option><option value="preview">Preview</option><option value="planned">Planned</option></select>
      <label className="v5-roadmap-toggle"><input type="checkbox" checked={showRoadmap} onChange={(e) => setShowRoadmap(e.target.checked)}/> Show roadmap</label>
    </div>
    <div className="v5-feature-list">
      {filtered.map((feature, index) => {
        const enabled = flags[feature.id] ?? feature.status !== 'planned';
        const canToggle = !readOnly && !saving && feature.status !== 'planned' && feature.id !== 'release-selector';
        const open = expanded === feature.id;
        return <article key={feature.id} className={`v5-feature-card v5-feature-${feature.status}`}>
          <div className="v5-feature-main">
            <div className="v5-feature-number">{String(advancedFeatures.indexOf(feature) + 1).padStart(2, '0')}</div>
            <div className="v5-feature-copy"><strong>{feature.name}</strong><small>{feature.category} · Target {feature.release}</small><span>{statusLabel[feature.status]}</span></div>
            <div className="v5-feature-controls">
              {feature.status === 'planned' ? <span className="v5-locked"><LockKeyhole size={13}/> Locked</span> : feature.id === 'release-selector' ? <span className="v5-locked"><ShieldCheck size={13}/> Core control</span> : <label className={`v5-switch ${canToggle ? '' : 'read-only'}`} title={canToggle ? 'Toggle rollout' : 'Read-only feature state'}><input aria-label={`${enabled ? 'Disable' : 'Enable'} ${feature.name}`} type="checkbox" checked={enabled} disabled={!canToggle} onChange={(e) => onToggle(feature.id, e.target.checked)}/><span/></label>}
              <button className="icon-button subtle" aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} acceptance criteria for ${feature.name}`} onClick={() => setExpanded(open ? null : feature.id)}>{open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</button>
            </div>
          </div>
          {open && <div className="v5-feature-detail"><p>{feature.description}</p><div><ShieldCheck size={14}/><span><strong>Acceptance gate:</strong> {feature.acceptance}</span></div></div>}
        </article>;
      })}
      {!filtered.length && <div className="v5-empty"><CircleHelp size={20}/> No matching features. Change the filters or search term.</div>}
    </div>
    <div className="v5-feature-footnote"><SlidersHorizontal size={15}/><span>{readOnly ? 'Feature states are shown in read-only mode.' : saving ? 'Saving school-wide rollout settings…' : 'Availability/preview switches are saved as school settings when Cloudflare D1 is configured. Planned entries are locked and cannot be enabled until implemented.'}</span></div>
  </section>;
}
