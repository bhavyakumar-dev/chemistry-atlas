import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Atom, ChevronRight, Download, ExternalLink, LoaderCircle, RotateCcw, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { isVersionAtLeast, type PlatformVersion } from '../content/releaseVersions';
import { approvedTeachingMolecules } from '../content/approvedTeachingMolecules';

type AtomRecord = { element: string; x: number; y: number; z: number };
type BondRecord = { a: number; b: number; order: number };
type StructureRecord = { atoms: AtomRecord[]; bonds: BondRecord[]; cid: number; formula: string; molecularWeight: string; iupacName: string; query: string };
type Representation = 'ball-stick' | 'space-fill' | 'wireframe';

const cpk: Record<string, string> = { H: '#f4f7fc', C: '#555e6d', N: '#3977e8', O: '#e84e5b', F: '#48b96a', CL: '#40b86c', BR: '#9b4a35', I: '#7846a8', P: '#ed9a31', S: '#e7c93d', NA: '#8b61d9', MG: '#4cba9d', CA: '#7b9d37', FE: '#b66d40', CU: '#c47742', ZN: '#7987a9' };
const vdw: Record<string, number> = { H: 1.2, C: 1.7, N: 1.55, O: 1.52, F: 1.47, P: 1.8, S: 1.8, CL: 1.75, BR: 1.85, I: 1.98, NA: 2.27, MG: 1.73, CA: 2.31, FE: 2.0, CU: 1.4, ZN: 1.39 };

function parseSdf(sdf: string): { atoms: AtomRecord[]; bonds: BondRecord[] } {
  if (sdf.length > 5_000_000) throw new Error('The structure file exceeds the 5 MB safety limit.');
  const lines = sdf.replace(/\r/g, '').split('\n');
  const countIndex = lines.findIndex((line) => line.includes('V2000') || line.includes('V3000'));
  if (countIndex < 0 || lines[countIndex].includes('V3000')) throw new Error('This structure uses an unsupported SDF variant. Try a different PubChem record.');
  const atomCount = Number.parseInt(lines[countIndex].slice(0, 3).trim(), 10);
  const bondCount = Number.parseInt(lines[countIndex].slice(3, 6).trim(), 10);
  if (!Number.isFinite(atomCount) || atomCount < 1 || atomCount > 2500 || !Number.isFinite(bondCount) || bondCount < 0 || bondCount > 10000) throw new Error('The structure file has invalid atom or bond counts.');
  const atoms: AtomRecord[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[countIndex + 1 + i] || '';
    const element = line.slice(31, 34).trim().toUpperCase();
    const x = Number.parseFloat(line.slice(0, 10));
    const y = Number.parseFloat(line.slice(10, 20));
    const z = Number.parseFloat(line.slice(20, 30));
    if (!element || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) throw new Error(`Could not parse atom ${i + 1} from the SDF file.`);
    atoms.push({ element, x, y, z });
  }
  const bonds: BondRecord[] = [];
  const bondStart = countIndex + 1 + atomCount;
  for (let i = 0; i < bondCount; i++) {
    const line = lines[bondStart + i] || '';
    const a = Number.parseInt(line.slice(0, 3).trim(), 10) - 1;
    const b = Number.parseInt(line.slice(3, 6).trim(), 10) - 1;
    const order = Number.parseInt(line.slice(6, 9).trim(), 10);
    if (a < 0 || b < 0 || a >= atoms.length || b >= atoms.length || !Number.isInteger(order) || order < 0 || order > 4) throw new Error(`Could not parse bond ${i + 1} from the SDF file.`);
    bonds.push({ a, b, order });
  }
  return { atoms, bonds };
}

function isStructureRecord(value: unknown): value is StructureRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StructureRecord>;
  return Number.isInteger(item.cid) && Number(item.cid) > 0
    && typeof item.formula === 'string' && typeof item.query === 'string'
    && Array.isArray(item.atoms) && item.atoms.length > 0 && item.atoms.length <= 2500
    && item.atoms.every((atom) => atom && typeof atom.element === 'string' && atom.element.length <= 2
      && Number.isFinite(atom.x) && Number.isFinite(atom.y) && Number.isFinite(atom.z))
    && Array.isArray(item.bonds) && item.bonds.length <= 10000
    && item.bonds.every((bond) => bond && Number.isInteger(bond.a) && Number.isInteger(bond.b)
      && bond.a >= 0 && bond.b >= 0 && bond.a < item.atoms!.length && bond.b < item.atoms!.length
      && Number.isInteger(bond.order) && bond.order >= 0 && bond.order <= 4);
}

function observeElementSize(element: HTMLElement, callback: () => void): { disconnect: () => void } {
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(callback);
    observer.observe(element);
    return { disconnect: () => observer.disconnect() };
  }
  window.addEventListener('resize', callback);
  return { disconnect: () => window.removeEventListener('resize', callback) };
}

async function fetchPubChemStructure(query: string, signal: AbortSignal): Promise<StructureRecord> {
  const base = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
  const normalized = query.trim().toLocaleLowerCase('en-US');
  const approved = approvedTeachingMolecules.find((item) => item.aliases.includes(normalized));
  if (!approved) throw new Error('This edition contains a small educator-reviewed classroom molecule catalogue. Ask a chemistry teacher to review additional curriculum examples before they are added.');
  const cid = approved.cid;
  const [sdfResponse, propertyResponse] = await Promise.all([
    fetch(`${base}/compound/cid/${cid}/record/SDF?record_type=3d`, { signal, headers: { Accept: 'chemical/x-mdl-sdfile' } }),
    fetch(`${base}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`, { signal, headers: { Accept: 'application/json' } }),
  ]);
  if (!sdfResponse.ok) throw new Error(sdfResponse.status === 404 ? 'PubChem has no 3D conformer available for this record. Try another molecule or open its 2D record.' : `PubChem 3D record request failed (${sdfResponse.status}).`);
  const sdf = await sdfResponse.text();
  const geometry = parseSdf(sdf);
  let formula = 'Not supplied'; let molecularWeight = 'Not supplied'; let iupacName = 'Not supplied';
  if (propertyResponse.ok) {
    const data = await propertyResponse.json() as { PropertyTable?: { Properties?: { MolecularFormula?: string; MolecularWeight?: string | number; IUPACName?: string }[] } };
    const p = data.PropertyTable?.Properties?.[0];
    formula = p?.MolecularFormula || formula;
    molecularWeight = p?.MolecularWeight != null ? String(p.MolecularWeight) : molecularWeight;
    iupacName = p?.IUPACName || iupacName;
  }
  return { ...geometry, cid, formula, molecularWeight, iupacName, query: approved.name };
}

function createAtomLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 64); ctx.fillStyle = 'rgba(8,14,28,.84)'; ctx.beginPath(); if (typeof ctx.roundRect === 'function') ctx.roundRect(8, 9, 112, 46, 13); else ctx.rect(8, 9, 112, 46); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 27px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text.slice(0, 5), 64, 32);
  }
  const texture = new THREE.CanvasTexture(canvas); const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material); sprite.scale.set(0.7, 0.35, 1); return sprite;
}

function SdfCanvas({ structure, representation, labels, motion, onAtomPick }: { structure: StructureRecord; representation: Representation; labels: boolean; motion: boolean; onAtomPick?: (index: number) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState('');
  const callbackRef = useRef(onAtomPick); callbackRef.current = onAtomPick;
  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    const width = Math.max(220, host.clientWidth); const height = Math.max(280, host.clientHeight);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#070e1d');
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 2000); camera.position.set(0, 0, 12);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); setRenderError(''); }
    catch { setRenderError('Interactive 3D is unavailable in this browser or device. The source record and coordinate exports remain available.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(width, height); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.06; controls.minDistance = 2; controls.maxDistance = 100;
    scene.add(new THREE.HemisphereLight(0xdbe8ff, 0x18213e, 1.8));
    const key = new THREE.PointLight(0xffffff, 800, 100); key.position.set(-8, 10, 14); scene.add(key);
    const rim = new THREE.PointLight(0x728bff, 500, 100); rim.position.set(8, -5, -12); scene.add(rim);
    const root = new THREE.Group(); scene.add(root);
    const centroid = structure.atoms.reduce((p, a) => p.add(new THREE.Vector3(a.x, a.y, a.z)), new THREE.Vector3()).multiplyScalar(1 / structure.atoms.length);
    const positions = structure.atoms.map((a) => new THREE.Vector3(a.x, a.y, a.z).sub(centroid));
    const atomMeshes: THREE.Mesh[] = [];
    const sphereGeometry = new THREE.SphereGeometry(1, representation === 'wireframe' ? 20 : 40, representation === 'wireframe' ? 16 : 32);
    structure.atoms.forEach((atom, index) => {
      const symbol = atom.element.toUpperCase();
      const radius = representation === 'space-fill' ? (vdw[symbol] || 1.65) : representation === 'wireframe' ? 0.36 : 0.29;
      const material = new THREE.MeshPhysicalMaterial({ color: cpk[symbol] || '#b4bfd3', roughness: representation === 'wireframe' ? 0.58 : 0.24, metalness: 0.04, clearcoat: representation === 'wireframe' ? 0 : 0.65, wireframe: representation === 'wireframe', transparent: representation === 'wireframe', opacity: representation === 'wireframe' ? 0.88 : 1 });
      const mesh = new THREE.Mesh(sphereGeometry, material); mesh.scale.setScalar(radius); mesh.position.copy(positions[index]); mesh.userData.atomIndex = index; mesh.userData.element = symbol; root.add(mesh); atomMeshes.push(mesh);
      if (labels && structure.atoms.length <= 60) { const label = createAtomLabel(`${index + 1} ${symbol}`, cpk[symbol] || '#dce6fb'); label.position.copy(positions[index]).add(new THREE.Vector3(0, radius + 0.18, 0)); root.add(label); }
    });
    if (representation !== 'space-fill') {
      structure.bonds.forEach((bond) => {
        const start = positions[bond.a]; const end = positions[bond.b]; const direction = new THREE.Vector3().subVectors(end, start); const length = direction.length();
        const unit = direction.clone().normalize(); const helper = Math.abs(unit.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const perpendicular = new THREE.Vector3().crossVectors(unit, helper).normalize();
        const order = bond.order === 4 ? 1 : Math.max(1, Math.min(3, bond.order));
        const offsets = order === 3 ? [-0.105, 0, 0.105] : order === 2 ? [-0.075, 0.075] : [0];
        offsets.forEach((offset) => {
          const mid = start.clone().add(end).multiplyScalar(0.5).addScaledVector(perpendicular, offset);
          const geometry = new THREE.CylinderGeometry(0.055, 0.055, Math.max(0.01, length * 0.91), 12);
          const material = new THREE.MeshStandardMaterial({ color: '#c2d0e8', metalness: 0.35, roughness: 0.36 });
          const rod = new THREE.Mesh(geometry, material); rod.position.copy(mid); rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit); root.add(rod);
        });
      });
    }
    const box = new THREE.Box3().setFromObject(root); const size = box.getSize(new THREE.Vector3()); const maxDimension = Math.max(size.x, size.y, size.z, 2); camera.position.set(maxDimension * 0.12, maxDimension * 0.1, maxDimension * 2.25); camera.near = Math.max(0.01, maxDimension / 200); camera.far = maxDimension * 30; camera.updateProjectionMatrix(); controls.target.set(0, 0, 0); controls.update();
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    let pressOrigin: { x: number; y: number } | null = null;
    const beginPick = (event: PointerEvent) => { pressOrigin = { x: event.clientX, y: event.clientY }; };
    const cancelPick = () => { pressOrigin = null; };
    const click = (event: PointerEvent) => {
      if (!pressOrigin || Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y) > 4) { pressOrigin = null; return; }
      pressOrigin = null;
      const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(atomMeshes, false); if (hits[0]) callbackRef.current?.(Number(hits[0].object.userData.atomIndex));
    };
    renderer.domElement.addEventListener('pointerdown', beginPick);
    renderer.domElement.addEventListener('pointerup', click);
    renderer.domElement.addEventListener('pointercancel', cancelPick);
    let frame = 0; let active = true;
    const render = () => { if (!active) return; frame = requestAnimationFrame(render); if (motion) root.rotation.y += 0.0008; controls.update(); renderer.render(scene, camera); };
    render();
    const resize = observeElementSize(host, () => { if (!host.isConnected) return; const w = Math.max(220, host.clientWidth); const h = Math.max(280, host.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });
    return () => { active = false; cancelAnimationFrame(frame); resize.disconnect(); renderer.domElement.removeEventListener('pointerdown', beginPick); renderer.domElement.removeEventListener('pointerup', click); renderer.domElement.removeEventListener('pointercancel', cancelPick); controls.dispose(); root.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.geometry.dispose(); if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) { const mat = obj.material; if (Array.isArray(mat)) mat.forEach((m) => { (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); }); else { (mat as THREE.SpriteMaterial).map?.dispose(); mat.dispose(); } } }); sphereGeometry.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [structure, representation, labels, motion]);
  return <div className="v2-sdf-canvas" ref={hostRef}>{renderError ? <div className="v5-webgl-fallback" role="status"><strong>Static-safe fallback</strong><span>{renderError}</span></div> : <span className="v2-canvas-hint">Drag to rotate · Scroll to zoom · Tap 2 atoms for distance or 3 for angle (middle atom is the vertex)</span>}</div>;
}

function OrbitalShapeCanvas({ orbital }: { orbital: 's' | 'p' | 'd' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState('');
  useEffect(() => {
    const host = ref.current; if (!host) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a1122');
    const width = Math.max(280, host.clientWidth || 360);
    const camera = new THREE.PerspectiveCamera(42, width / 230, 0.1, 80);
    const cameraDistance = orbital === 's' ? 4.2 : orbital === 'p' ? 7.5 : 13.5;
    camera.position.set(cameraDistance * 0.3, cameraDistance * 0.22, cameraDistance);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); setRenderError(''); }
    catch { setRenderError('WebGL is unavailable. The orbital explanation remains available in text.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setSize(width, 230); renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xe0eaff, 0x252a55, 1.4));
    const group = new THREE.Group(); scene.add(group);

    // Sample the analytic hydrogenic probability distributions, not hand-positioned lobes.
    // Display coordinates are auto-scaled per orbital for legibility; they are not bond-length data.
    let seed = orbital === 's' ? 701 : orbital === 'p' ? 1701 : 3701;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed + 1) / 4294967297; };
    const gammaRadius = (shape: number, rate: number) => { let value = 0; for (let i = 0; i < shape; i++) value += -Math.log(Math.max(1e-12, random())) / rate; return value; };
    const points = 24000; const positions = new Float32Array(points * 3); const colors = new Float32Array(points * 3);
    const positive = new THREE.Color('#62c9f2'); const negative = new THREE.Color('#a38bff');
    const scale = 0.34;
    for (let i = 0; i < points; i++) {
      const radius = orbital === 's' ? gammaRadius(3, 2) : orbital === 'p' ? gammaRadius(5, 1) : gammaRadius(7, 2 / 3);
      let mu = 2 * random() - 1;
      if (orbital === 'p') { while (random() > mu * mu) mu = 2 * random() - 1; }
      if (orbital === 'd') { while (random() > Math.pow(1 - mu * mu, 2)) mu = 2 * random() - 1; }
      let phi = 2 * Math.PI * random();
      if (orbital === 'd') { while (random() > Math.pow(Math.sin(2 * phi), 2)) phi = 2 * Math.PI * random(); }
      const sinTheta = Math.sqrt(Math.max(0, 1 - mu * mu));
      positions[i * 3] = scale * radius * sinTheta * Math.cos(phi);
      positions[i * 3 + 1] = scale * radius * sinTheta * Math.sin(phi);
      positions[i * 3 + 2] = scale * radius * mu;
      const phase = orbital === 's' ? 1 : orbital === 'p' ? mu : Math.sin(2 * phi);
      (phase >= 0 ? positive : negative).toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const cloud = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.78, sizeAttenuation: true, depthWrite: false }));
    group.add(cloud);
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16), new THREE.MeshBasicMaterial({ color: '#f3d48a' }));
    group.add(nucleus);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
    let frame = 0; let active = true;
    const render = () => { if (!active) return; frame = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); }; render();
    const resize = observeElementSize(host, () => { if (!host.isConnected) return; const w = Math.max(220, host.clientWidth); camera.aspect = w / 230; camera.updateProjectionMatrix(); renderer.setSize(w, 230); });
    return () => { active = false; cancelAnimationFrame(frame); resize.disconnect(); controls.dispose(); geometry.dispose(); (cloud.material as THREE.Material).dispose(); nucleus.geometry.dispose(); (nucleus.material as THREE.Material).dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [orbital]);
  return <div className="v2-orbital-canvas" ref={ref}>{renderError && <div className="v5-webgl-fallback" role="status">{renderError}</div>}</div>;
}

export default function V2MoleculeStudio({ edition = 'v2', showOrbital = true, showEvidence = true, featureFlags = {} }: { edition?: PlatformVersion; showOrbital?: boolean; showEvidence?: boolean; featureFlags?: Record<string, boolean> }) {
  const [query, setQuery] = useState('water');
  const [structure, setStructure] = useState<StructureRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [representation, setRepresentation] = useState<Representation>('ball-stick');
  const [labels, setLabels] = useState(true);
  const [motion, setMotion] = useState(true);
  const [selectedAtoms, setSelectedAtoms] = useState<number[]>([]);
  const [orbital, setOrbital] = useState<'s' | 'p' | 'd'>('p');
  const [sourceNote, setSourceNote] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const activeRequest = useRef<AbortController | null>(null);
  const requestNumber = useRef(0);
  const selectedDistance = useMemo(() => {
    if (!structure || selectedAtoms.length < 2) return null;
    const [a, b] = selectedAtoms.slice(0, 2).map((index) => structure.atoms[index]);
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }, [structure, selectedAtoms]);
  const selectedAngle = useMemo(() => {
    if (!structure || selectedAtoms.length !== 3) return null;
    const [a, vertex, c] = selectedAtoms.map((index) => structure.atoms[index]);
    const u = new THREE.Vector3(a.x - vertex.x, a.y - vertex.y, a.z - vertex.z);
    const v = new THREE.Vector3(c.x - vertex.x, c.y - vertex.y, c.z - vertex.z);
    const denominator = u.length() * v.length();
    if (!denominator) return null;
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(u.dot(v) / denominator, -1, 1)));
  }, [structure, selectedAtoms]);

  const load = async (term = query) => {
    const cleanTerm = term.trim().toLocaleLowerCase('en-US');
    if (!cleanTerm) return;
    if (featureFlags['curated-molecule-catalogue'] === false) { setError('The educator-reviewed molecule catalogue is disabled by the administrator.'); return; }
    const approved = approvedTeachingMolecules.find((item) => item.aliases.includes(cleanTerm));
    if (!approved) {
      activeRequest.current?.abort();
      requestNumber.current += 1;
      setLoading(false);
      setStructure(null);
      setSelectedAtoms([]);
      setError('This edition contains a small educator-reviewed classroom molecule catalogue. Ask a chemistry teacher to review additional curriculum examples before they are added.');
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const sequence = ++requestNumber.current;
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    setLoading(true); setError(''); setSourceNote(''); setSelectedAtoms([]); setStructure(null); setShareMessage('');
    try {
      const cacheKey = `chem-atlas-pubchem-${approved.cid}`;
      let found: StructureRecord | null = null;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) { const parsed: unknown = JSON.parse(cached); if (isStructureRecord(parsed)) found = parsed; else sessionStorage.removeItem(cacheKey); }
      } catch { /* Browser storage may be unavailable; continue with network retrieval. */ }
      if (!found) {
        found = await fetchPubChemStructure(approved.name, controller.signal);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(found)); } catch { /* Cache is optional. */ }
      }
      if (sequence !== requestNumber.current) return;
      setStructure(found);
      setQuery(approved.name);
      setSourceNote('Coordinates are the PubChem 3D conformer supplied for this compound. A computed conformer is a model, not a direct experimental measurement of every bond length or angle.');
      const url = new URL(window.location.href);
      url.searchParams.set('molecule', approved.name.toLowerCase().replace(/\s+/g, '-'));
      window.history.replaceState({}, '', url);
    } catch (e) {
      if (sequence !== requestNumber.current) return;
      setError(e instanceof Error ? (e.name === 'AbortError' ? 'PubChem request timed out or was cancelled. Try again.' : e.message) : 'Could not load the PubChem structure.');
    } finally {
      window.clearTimeout(timeout);
      if (sequence === requestNumber.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (featureFlags['curated-molecule-catalogue'] === false) { setStructure(null); return () => { requestNumber.current += 1; activeRequest.current?.abort(); }; }
    const slug = new URLSearchParams(window.location.search).get('molecule')?.toLowerCase();
    const initial = approvedTeachingMolecules.find((item) => item.aliases.includes(slug || '') || item.name.toLowerCase().replace(/\s+/g, '-') === slug);
    if (initial) { setQuery(initial.name); void load(initial.name); } else { void load('water'); }
    return () => { requestNumber.current += 1; activeRequest.current?.abort(); };
  }, [featureFlags['curated-molecule-catalogue']]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const downloadReport = () => {
    if (!structure) return;
    const text = [`# Chemistry Atlas V5 — Structure record`, ``, `Name searched: ${structure.query}`, `PubChem CID: ${structure.cid}`, `Formula: ${structure.formula}`, `Molecular weight: ${structure.molecularWeight} g/mol`, `IUPAC name: ${structure.iupacName}`, `Atoms: ${structure.atoms.length}`, `Bonds: ${structure.bonds.length}`, `Selected atom indices: ${selectedAtoms.map((i) => i + 1).join(", ") || "None"}`, `Measured distance (first two selected): ${selectedDistance == null ? "Not measured" : `${selectedDistance.toFixed(4)} Å`}`, `Measured angle (three selected): ${selectedAngle == null ? "Not measured" : `${selectedAngle.toFixed(2)}°`}`, `Coordinates: PubChem 3D conformer`, `Retrieved: ${new Date().toISOString()}`, `Source: https://pubchem.ncbi.nlm.nih.gov/compound/${structure.cid}`, ``, `Atom coordinates (Å)`, `Index,Element,X,Y,Z`, ...structure.atoms.map((a, i) => `${i + 1},${a.element},${a.x},${a.y},${a.z}`)].join('\n');
    downloadBlob(new Blob([text], { type: 'text/markdown;charset=utf-8' }), `chemistry-atlas-pubchem-${structure.cid}.md`);
  };
  const downloadJSON = () => {
    if (!structure) return;
    const payload = { schema: 'chemistry-atlas.molecule/v1', retrievedAt: new Date().toISOString(), origin: 'computed-conformer', source: { name: 'PubChem', cid: structure.cid, url: `https://pubchem.ncbi.nlm.nih.gov/compound/${structure.cid}` }, query: structure.query, formula: structure.formula, molecularWeight_g_mol: structure.molecularWeight, iupacName: structure.iupacName, coordinateUnit: 'angstrom', atoms: structure.atoms.map((atom, index) => ({ index: index + 1, ...atom })), bonds: structure.bonds.map((bond) => ({ atomA: bond.a + 1, atomB: bond.b + 1, order: bond.order })) };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), `chemistry-atlas-${structure.cid}.json`);
  };
  const downloadCSV = () => {
    if (!structure) return;
    const rows = [['index','element','x_angstrom','y_angstrom','z_angstrom'], ...structure.atoms.map((atom, index) => [String(index + 1), atom.element, String(atom.x), String(atom.y), String(atom.z)])];
    const csv = rows.map((row) => row.map((cell) => `\"${cell.replaceAll('\"', '\"\"')}\"`).join(',')).join('\r\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `chemistry-atlas-${structure.cid}-coordinates.csv`);
  };
  const displayedRepresentation = featureFlags['molecular-representations'] === false ? 'ball-stick' : representation;
  useEffect(() => { if (featureFlags['molecular-representations'] === false) setRepresentation('ball-stick'); }, [featureFlags['molecular-representations']]);
  const copyShareLink = async () => {
    if (!structure) return;
    const url = new URL(window.location.href); url.searchParams.set('molecule', structure.query.toLowerCase().replace(/\s+/g, '-'));
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage('Share link copied.');
    } catch {
      setShareMessage(url.toString());
    }
  };

  return <div className="v2-studio-stack">
    <section className="panel v2-structure-panel">
      <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">V2 · SOURCE-LINKED MOLECULAR DATA</div><h3>Precision molecular studio</h3></div><span className="pill pill-mint"><span className="v2-live-dot"/> PUBCHEM 3D</span></div>
      <p className="v2-intro-copy">Search a molecule by common name. V2 loads a source-linked PubChem 3D conformer rather than guessing coordinates from a decorative template. Ball-and-stick bond radii are schematic; space-fill uses approximate element van der Waals radii, which depend on the chosen reference set.</p>
      {featureFlags['curated-molecule-catalogue'] !== false ? <><form className="v2-molecule-search" onSubmit={(e) => { e.preventDefault(); void load(); }}><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search approved classroom examples"/><button className="primary-button small" disabled={loading || !query.trim()}>{loading ? <LoaderCircle size={14} className="spin-icon"/> : <Atom size={14}/>} Load 3D</button></form><div className="v2-quick-searches">Try: {approvedTeachingMolecules.map((item) => <button key={item.cid} onClick={() => { setQuery(item.name); void load(item.name); }}>{item.name}</button>)}</div><p className="v2-intro-copy">This student preview uses a small educator-reviewed classroom catalogue. Additional compounds are added only after curriculum and source review.</p></> : <div className="v2-error" role="status">The educator-reviewed molecule catalogue is currently disabled. An administrator can re-enable it in the V5 feature registry.</div>}
      {error && <div className="v2-error" role="alert">{error}</div>}
      {structure && <>
        <div className="v2-model-meta"><div><span className="eyebrow muted-eyebrow">LOADED COMPOUND</span><h4>{structure.query} <span>{structure.formula}</span></h4><small>PubChem CID {structure.cid} · {structure.atoms.length} atoms · {structure.bonds.length} bonds</small></div><a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${structure.cid}`} target="_blank" rel="noreferrer">Open source record <ExternalLink size={13}/></a></div>
        <div className="v2-viewer-toolbar">{featureFlags['molecular-representations'] !== false ? <div className="segmented">{(['ball-stick', 'space-fill', 'wireframe'] as Representation[]).map((mode) => <button key={mode} className={displayedRepresentation === mode ? 'active' : ''} onClick={() => setRepresentation(mode)}>{mode === 'ball-stick' ? 'Ball & stick' : mode === 'space-fill' ? 'Space fill' : 'Wireframe'}</button>)}</div> : <span className="v5-feature-disabled-note">Ball-and-stick view · other representations disabled</span>}<label className="v2-check"><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)}/> Atom labels</label><label className="v2-check"><input type="checkbox" checked={motion} onChange={(e) => setMotion(e.target.checked)}/> Motion</label>{featureFlags['atom-measurements'] !== false && <button className="icon-button subtle" onClick={() => setSelectedAtoms([])} title="Clear atom measurement"><RotateCcw size={15}/></button>}</div>
        <SdfCanvas structure={structure} representation={displayedRepresentation} labels={labels} motion={motion} onAtomPick={featureFlags['atom-measurements'] === false ? undefined : (i) => setSelectedAtoms((prev) => prev.includes(i) || prev.length >= 3 ? [i] : [...prev, i])}/>
        <div className="v2-structure-details"><div><span>FORMULA</span><strong>{structure.formula}</strong></div><div><span>MOLAR MASS</span><strong>{structure.molecularWeight} g/mol</strong></div>{featureFlags['atom-measurements'] !== false && <><div><span>SELECTED ATOMS</span><strong>{selectedAtoms.length ? selectedAtoms.map((i) => `${i + 1} (${structure.atoms[i].element})`).join(' ↔ ') : 'Tap atoms in the model'}</strong></div><div><span>MEASURED DISTANCE</span><strong>{selectedAtoms.length < 2 || selectedDistance == null ? 'Select 2 atoms' : `${selectedDistance.toFixed(3)} Å`}</strong></div><div><span>A–B–C ANGLE (B IS THE VERTEX)</span><strong>{selectedAngle == null ? 'Select 3 atoms' : `${selectedAngle.toFixed(2)}°`}</strong></div></>}</div>
        <div className="v2-source-note"><Sparkles size={15}/><span>{sourceNote} <a href="https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest" target="_blank" rel="noreferrer">PUG REST documentation</a>.</span><div className="v5-export-actions"><button className="text-button small-text" onClick={downloadReport}><Download size={13}/> Report</button>{featureFlags['molecule-json-export'] !== false && <button className="text-button small-text" onClick={downloadJSON}>JSON</button>}{featureFlags['molecule-csv-export'] !== false && <button className="text-button small-text" onClick={downloadCSV}>CSV</button>}{featureFlags['molecule-share-links'] !== false && <button className="text-button small-text" onClick={() => void copyShareLink()}>Share link</button>}</div></div>{shareMessage && <div className="v5-share-message" role="status">{shareMessage}</div>}
        {showEvidence && isVersionAtLeast(edition, 'v3') && <section className="v4-evidence-card"><div className="v4-evidence-heading"><ShieldCheck size={17}/><div><strong>Scientific evidence card</strong><small>V3/V4 model provenance · {edition.toUpperCase()}</small></div><span className="v4-evidence-status">SOURCE LINKED</span></div><div className="v4-evidence-grid"><div><span>MODEL ORIGIN</span><strong>Computed 3D conformer</strong></div><div><span>PRIMARY RECORD</span><strong>PubChem CID {structure.cid}</strong></div><div><span>COORDINATE UNIT</span><strong>Å (ångström)</strong></div><div><span>RETRIEVAL / PARSING</span><strong>Loaded and SDF-parsed</strong></div></div><p>This is a computational conformer supplied in a PubChem 3D record, not a photograph or a direct experimental measurement of the molecule's instantaneous shape. The viewer's ball-and-stick radii and cylinders are illustrative. A single conformer does not describe all molecular motion or conformational populations.</p><p><strong>Licence and review:</strong> PubChem aggregates contributions from many sources. Check the source-level terms for any field before redistribution. Browser retrieval is source-linked, but this record has not been independently reviewed or archived with a checksum in this session.</p><a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${structure.cid}`} target="_blank" rel="noreferrer">Inspect the canonical record <ExternalLink size={12}/></a></section>}
      </>}
    </section>

    {showOrbital && <section className="panel v2-orbital-panel">
      <div className="panel-heading"><div><div className="eyebrow muted-eyebrow">QUANTUM CONCEPT LAB</div><h3>Orbital shape explorer</h3></div><span className="pill pill-violet">IDEALISED TEACHING ISOSURFACE</span></div>
      <div className="v2-orbital-layout"><div className="v2-orbital-copy"><p>Compare the characteristic shape and phase regions of common atomic orbitals. These point clouds are sampled from analytic hydrogenic probability distributions for 1s, 2pᶻ and 3dₓᵧ states. They are single-electron hydrogen models, not multi-electron atomic orbitals or molecular orbitals.</p><div className="segmented">{(['s', 'p', 'd'] as const).map((value) => <button className={orbital === value ? 'active' : ''} key={value} onClick={() => setOrbital(value)}>{value}-orbital</button>)}</div><div className="v2-orbital-explanation">{orbital === 's' ? '1s hydrogenic state: a spherically symmetric probability cloud with no angular node.' : orbital === 'p' ? '2pₙ (2p along z): two probability lobes separated by an angular nodal plane. The two colours encode opposite wavefunction phase.' : '3dxy hydrogenic state: four lobes with alternating phase, separated by the nodal planes x = 0 and y = 0.'}</div><small>The viewer shows probability density |ψ|²; colour indicates wavefunction phase. Display scale is adjusted per state. Multi-electron shielding, molecular fields, energy-level splitting and electron correlation are not modelled.</small></div><div className="v2-orbital-visual"><OrbitalShapeCanvas orbital={orbital}/></div></div>
    </section>}
  </div>;
}
