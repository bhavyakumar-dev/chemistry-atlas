import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Archive, Check, Clock3, FilePlus2, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { atlasApi, type AtlasUser } from '../api';

type PromptVersion = { id: string; prompt_key: string; version: string; title: string; prompt_text: string; change_note: string; is_active: boolean; created_at: string };
const STORAGE_KEY = 'chem-atlas-prompt-version-history-v1';
const readHistory = (): PromptVersion[] => { try { const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as PromptVersion[] | null; return Array.isArray(saved) && saved.length ? saved : [SEED, V5_SEED]; } catch { return [SEED, V5_SEED]; } };
const writeHistory = (items: PromptVersion[]) => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Storage may be disabled; keep prompt revisions in memory for this session. */ } };
const SEED: PromptVersion = {
  id: 'local-ca-3d-001-v1', prompt_key: 'CHEM-ATLAS-3D-PLATFORM', version: '1.0', title: '3D platform capability upgrade and scientific integrity',
  prompt_text: 'Add. All features of names of websites mentioned in the screenshots all features make 3d models of ours more refined than theirs and make it the bestest most realistic and accurate 3d modles and simulations and data. Scientifically backed study. Make this as v2 toggabel from v1 in admin panel. Add version control for each prompt from now on.',
  change_note: 'Initial recorded product prompt; implementation scope and limitations documented in docs/V2_RESEARCH_AND_ACCURACY.md.', is_active: true, created_at: '2026-11-04T00:00:00.000Z',
};
const V5_SEED: PromptVersion = {
  id: 'local-ca-v5-quality-001', prompt_key: 'CHEM-ATLAS-V5-QUALITY', version: '1.0', title: 'V5 reliability, 50 advanced features and permanent free model',
  prompt_text: 'Yes it will always be free add 50 more advanced feature and refined and solve all bugs in v5',
  change_note: 'Permanent free/non-commercial/no-ads policy, 50-item governed feature registry, admin rollout flags, stability fixes and release validation.', is_active: true, created_at: '2026-11-04T10:09:00.000Z',
};

export default function PromptVersionManager({ currentUser, onNotice }: { currentUser: AtlasUser | null; onNotice: (message: string) => void }) {
  const [versions, setVersions] = useState<PromptVersion[]>(() => {
    return readHistory();
  });
  const [promptKey, setPromptKey] = useState('CHEM-ATLAS-3D-PLATFORM');
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [expandedId, setExpandedId] = useState(SEED.id);
  const [busy, setBusy] = useState(false);
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');

  useEffect(() => { writeHistory(versions); }, [versions]);
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    let alive = true;
    atlasApi.adminPromptVersions().then(async ({ versions: remote }) => {
      if (!alive) return;
      setStorageMode('cloud');
      if (remote.length) {
        setVersions(remote);
      } else {
        try {
          const first = await atlasApi.createAdminPromptVersion({ promptKey: SEED.prompt_key, title: SEED.title, promptText: SEED.prompt_text, changeNote: SEED.change_note });
          const second = await atlasApi.createAdminPromptVersion({ promptKey: V5_SEED.prompt_key, title: V5_SEED.title, promptText: V5_SEED.prompt_text, changeNote: V5_SEED.change_note });
          if (alive) setVersions([first.version, second.version]);
        } catch { if (alive) setVersions([SEED, V5_SEED]); }
      }
    }).catch(() => { if (alive) setStorageMode('local'); });
    return () => { alive = false; };
  }, [currentUser]);

  const sorted = useMemo(() => [...versions].sort((a, b) => a.prompt_key.localeCompare(b.prompt_key) || b.created_at.localeCompare(a.created_at)), [versions]);
  const promptKeys = useMemo(() => Array.from(new Set(versions.map((item) => item.prompt_key))), [versions]);

  const addVersion = async (event: FormEvent) => {
    event.preventDefault();
    const key = promptKey.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(key) || title.trim().length < 3 || promptText.trim().length < 10) { onNotice('Add a valid prompt ID, title and full prompt text (at least 10 characters).'); return; }
    setBusy(true);
    try {
      if (currentUser?.role === 'admin' && storageMode === 'cloud') {
        const result = await atlasApi.createAdminPromptVersion({ promptKey: key, title: title.trim(), promptText: promptText.trim(), changeNote: changeNote.trim() });
        setVersions((prev) => [...prev.map((item) => item.prompt_key === key ? { ...item, is_active: false } : item), result.version]);
        onNotice(`Saved ${key} version ${result.version.version} to the school database.`);
      } else {
        const prior = versions.filter((item) => item.prompt_key === key).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        const [major, minor] = prior ? prior.version.split('.').map(Number) : [1, -1];
        const next: PromptVersion = { id: `local-${key}-${Date.now()}`, prompt_key: key, version: `${major}.${minor + 1}`, title: title.trim(), prompt_text: promptText.trim(), change_note: changeNote.trim(), is_active: true, created_at: new Date().toISOString() };
        setVersions((prev) => [...prev.map((item) => item.prompt_key === key ? { ...item, is_active: false } : item), next]);
        onNotice(`Saved ${key} version ${next.version} in this browser. Sign in as administrator with the Cloudflare API configured for school-wide history.`);
      }
      setTitle(''); setPromptText(''); setChangeNote('');
    } catch (error) { onNotice(error instanceof Error ? error.message : 'Could not save this prompt version.'); }
    finally { setBusy(false); }
  };

  const activate = async (item: PromptVersion) => {
    try {
      if (currentUser?.role === 'admin' && storageMode === 'cloud' && !item.id.startsWith('local-')) await atlasApi.activateAdminPromptVersion(item.id);
      setVersions((prev) => prev.map((entry) => entry.prompt_key === item.prompt_key ? { ...entry, is_active: entry.id === item.id } : entry));
      onNotice(`Activated ${item.prompt_key} version ${item.version}. Previous versions remain in history.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : 'Could not activate that version.'); }
  };

  return <section className="panel admin-section prompt-version-manager">
    <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">CHANGE CONTROL · PROMPT REGISTRY</div><h3>Prompt version history</h3></div><span className={`pill ${storageMode === 'cloud' ? 'pill-mint' : 'pill-amber'}`}>{storageMode === 'cloud' ? 'SCHOOL DATABASE' : 'BROWSER-LOCAL'}</span></div>
    <div className="prompt-version-explainer"><ShieldCheck size={16}/><span>Each prompt has a stable ID and immutable numbered revisions. New revisions become active; older text stays available for audit and rollback. This registry records prompts entered here—it does not silently capture messages from other chats.</span></div>
    <form className="prompt-version-form" onSubmit={addVersion}>
      <div className="prompt-version-fields"><label>Prompt ID<input value={promptKey} onChange={(e) => setPromptKey(e.target.value)} maxLength={64} placeholder="CHEM-ATLAS-3D-PLATFORM" list="prompt-keys"/><datalist id="prompt-keys">{promptKeys.map((key) => <option key={key} value={key}/>)}</datalist></label><label>Revision title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What changes in this revision?"/></label></div>
      <label>Full prompt text<textarea required rows={5} maxLength={20000} value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Paste the complete prompt so this exact version can be restored or audited."/></label>
      <label>Change note<input value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="Reason for change, expected impact, linked issue…"/></label>
      <div className="prompt-version-submit"><small>{promptText.length.toLocaleString()} / 20,000 characters · New revision increments the existing prompt ID.</small><button className="primary-button small" disabled={busy || !promptText.trim()}><Save size={14}/>{busy ? 'Saving…' : 'Save new revision'}</button></div>
    </form>
    <div className="prompt-history-heading"><div><h4>Recorded revisions</h4><small>{versions.length} versions · {promptKeys.length} prompt IDs</small></div></div>
    <div className="prompt-history-list">{sorted.map((item) => <article className={`prompt-history-item ${item.is_active ? 'active' : ''}`} key={item.id}>
      <button className="prompt-history-top" onClick={() => setExpandedId(expandedId === item.id ? '' : item.id)}><span className="prompt-history-icon"><Archive size={15}/></span><span className="prompt-history-main"><strong>{item.title}</strong><small>{item.prompt_key} · v{item.version} · {new Date(item.created_at).toLocaleString()}</small></span>{item.is_active ? <span className="prompt-active"><Check size={12}/> ACTIVE</span> : <span className="prompt-old">HISTORY</span>}</button>
      {expandedId === item.id && <div className="prompt-history-detail"><p>{item.prompt_text}</p>{item.change_note && <small>Change note: {item.change_note}</small>}{!item.is_active && <button className="outline-button small" onClick={() => void activate(item)}><RotateCcw size={13}/> Restore this version</button>}</div>}
    </article>)}</div>
    <div className="prompt-version-footnote"><Clock3 size={14}/> Use a new revision instead of overwriting old prompt text. Rollback only changes which version is active; it does not delete later revisions.</div>
  </section>;
}
