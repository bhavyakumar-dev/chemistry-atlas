import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Activity, Atom, Award, BookOpen, Bookmark, Check, ChevronDown, ChevronRight, Download,
  Clock3, FlaskConical, GraduationCap, LayoutDashboard, Lightbulb, Menu,
  MessageCircle, Moon, MoreHorizontal, NotebookPen, Plus, Play, RotateCcw,
  Search, Settings, ShieldCheck, Sparkles, Sun, Target, Users, X, Zap,
  ClipboardList, Send, LogIn, LogOut, FileText, Upload, Beaker, ListChecks,
} from 'lucide-react';
import { curriculum, diyGuides, experiments, modelOptions, type Grade, type Track } from './data';
import { boardLessons, lessonById } from './content/lessons';
import { courseTracks, jeeAdvancedCourse, type CourseUnit, syllabusSources } from './content/tracks';
import { experimentLibrary } from './content/experiments';
import { questionBank, type AtlasQuestion } from './content/questionBank';
import { atlasApi, type AtlasUser, type AnalyticsPayload, type PortfolioItem } from './api';
import V2MoleculeStudio from './components/V2MoleculeStudio';
import V2VirtualLab from './components/V2VirtualLab';
import PromptVersionManager from './components/PromptVersionManager';
import V2ResearchMatrix from './components/V2ResearchMatrix';
import V4OpenScienceHub from './components/V4OpenScienceHub';
import V5FeatureLab from './components/V5FeatureLab';
import V5EquationBalancer from './components/V5EquationBalancer';
import { advancedFeatures, defaultFeatureFlags } from './content/advancedFeatures';
import { isPlatformVersion, isVersionAtLeast, releaseDefinitions, type PlatformVersion } from './content/releaseVersions';

type Page = 'overview' | 'learn' | 'models' | 'lab' | 'diy' | 'practice' | 'notes' | 'portfolio' | 'teacher' | 'admin' | 'preferences';
type Role = 'Student' | 'Teacher' | 'Admin';
type ThemeName = 'lab' | 'minimal' | 'museum' | 'university';

type ModelAtom = { element: string; x: number; y: number; z: number; radius: number; name: string };
type ModelBond = { from: number; to: number; order?: number };

const storageGet = (key: string): string | null => { try { return window.localStorage.getItem(key); } catch { return null; } };
const storageSet = (key: string, value: string): void => { try { window.localStorage.setItem(key, value); } catch { /* Storage may be blocked; keep current session usable. */ } };

const elementColors: Record<string, string> = {
  H: '#dfe7f4', C: '#303d52', O: '#f06c83', N: '#6b8dff', Na: '#a88aff', Cl: '#75d6a4', E: '#6fe0cf', S: '#a18aff', P: '#a18aff',
};
const elementRadii: Record<string, number> = { H: 0.28, C: 0.52, O: 0.5, N: 0.49, Na: 0.54, Cl: 0.58, E: 0.105, S: 1.15, P: 0.76 };

function modelGeometry(id: string): { atoms: ModelAtom[]; bonds: ModelBond[] } {
  const atom = (element: string, x: number, y: number, z: number, name: string): ModelAtom => ({ element, x, y, z, radius: elementRadii[element] || 0.45, name });
  if (id === 'water') return { atoms: [atom('O', 0, 0, 0, 'Oxygen'), atom('H', -0.78, 0.55, 0, 'Hydrogen'), atom('H', 0.78, 0.55, 0, 'Hydrogen')], bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }] };
  if (id === 'co2') return { atoms: [atom('O', -1.2, 0, 0, 'Oxygen'), atom('C', 0, 0, 0, 'Carbon'), atom('O', 1.2, 0, 0, 'Oxygen')], bonds: [{ from: 0, to: 1, order: 2 }, { from: 1, to: 2, order: 2 }] };
  if (id === 'methane') {
    const r = 1.1;
    return { atoms: [atom('C', 0, 0, 0, 'Carbon'), atom('H', r, r, r, 'Hydrogen'), atom('H', -r, -r, r, 'Hydrogen'), atom('H', -r, r, -r, 'Hydrogen'), atom('H', r, -r, -r, 'Hydrogen')], bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }] };
  }
  if (id === 'ammonia') return { atoms: [atom('N', 0, 0, 0, 'Nitrogen'), atom('H', -0.82, -0.42, 0.45, 'Hydrogen'), atom('H', 0.82, -0.42, 0.45, 'Hydrogen'), atom('H', 0, -0.42, -0.9, 'Hydrogen')], bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }] };
  if (id === 'oxygen') return { atoms: [atom('O', -0.68, 0, 0, 'Oxygen'), atom('O', 0.68, 0, 0, 'Oxygen')], bonds: [{ from: 0, to: 1, order: 2 }] };
  if (id === 'nacl') return { atoms: [atom('Na', -0.75, 0, 0, 'Sodium ion'), atom('Cl', 0.75, 0, 0, 'Chloride ion')], bonds: [{ from: 0, to: 1 }] };
  if (id === 'atomic-carbon') return { atoms: [atom('C', 0, 0, 0, 'Carbon nucleus'), atom('E', 0.92, 0, 0, '1s electron'), atom('E', -0.92, 0, 0, '1s electron'), atom('E', 0, 1.72, 0, '2s electron'), atom('E', 0, -1.72, 0, '2s electron'), atom('E', 1.15, 1.2, 0, '2p electron'), atom('E', -1.15, -1.2, 0, '2p electron')], bonds: [] };
  if (id === 's-orbital') return { atoms: [atom('S', 0, 0, 0, 's-orbital probability cloud')], bonds: [] };
  if (id === 'p-orbital') return { atoms: [atom('P', 0, 0.73, 0, 'Positive p-orbital lobe'), atom('P', 0, -0.73, 0, 'Negative p-orbital lobe')], bonds: [] };
  if (id === 'nacl-lattice') {
    const atoms: ModelAtom[] = [];
    const bonds: ModelBond[] = [];
    const indexAt = (x: number, y: number, z: number) => x * 9 + y * 3 + z;
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
      const element = (x + y + z) % 2 === 0 ? 'Na' : 'Cl';
      atoms.push({ ...atom(element, (x - 1) * 1.25, (y - 1) * 1.25, (z - 1) * 1.25, element === 'Na' ? 'Sodium ion' : 'Chloride ion'), radius: 0.27 });
      if (x < 2) bonds.push({ from: indexAt(x, y, z), to: indexAt(x + 1, y, z) });
      if (y < 2) bonds.push({ from: indexAt(x, y, z), to: indexAt(x, y + 1, z) });
      if (z < 2) bonds.push({ from: indexAt(x, y, z), to: indexAt(x, y, z + 1) });
    }
    return { atoms, bonds };
  }
  const atoms: ModelAtom[] = [];
  const bonds: ModelBond[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    atoms.push(atom('C', Math.cos(angle) * 1.05, Math.sin(angle) * 1.05, 0, `Carbon ${i + 1}`));
    atoms.push(atom('H', Math.cos(angle) * 1.78, Math.sin(angle) * 1.78, 0, `Hydrogen ${i + 1}`));
    bonds.push({ from: i * 2, to: ((i + 1) % 6) * 2, order: 1.5 });
    bonds.push({ from: i * 2, to: i * 2 + 1 });
  }
  return { atoms, bonds };
}

function ModelViewer({ modelId, allow2D, onAtomSelect, adaptive }: { modelId: string; allow2D: boolean; onAtomSelect: (atom: ModelAtom) => void; adaptive: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedAtom, setSelectedAtom] = useState<ModelAtom | null>(null);
  const [webglError, setWebglError] = useState('');
  const graph = useMemo(() => modelGeometry(modelId), [modelId]);
  useEffect(() => {
    const host = mountRef.current;
    if (!host || allow2D) return;
    const width = host.clientWidth || 600;
    const height = host.clientHeight || 440;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1224');
    const camera = new THREE.PerspectiveCamera(43, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 6.1);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: !adaptive, alpha: false, powerPreference: 'high-performance' }); setWebglError(''); }
    catch { setWebglError('WebGL is unavailable on this device. Showing a lightweight atom summary instead of crashing the page.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, adaptive ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    scene.add(new THREE.AmbientLight(0x9eb8ff, 1.5));
    const keyLight = new THREE.PointLight(0xb8d5ff, 36, 30);
    keyLight.position.set(-4, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x8a74ff, 30, 25);
    rimLight.position.set(4, -2, -5);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x8fe9da, 8, 18);
    fillLight.position.set(0, -5, 4);
    scene.add(fillLight);

    const starGeometry = new THREE.BufferGeometry();
    const stars = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      stars[i * 3] = (Math.random() - 0.5) * 19;
      stars[i * 3 + 1] = (Math.random() - 0.5) * 13;
      stars[i * 3 + 2] = (Math.random() - 0.5) * 15 - 4;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    const starField = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x9aaee7, size: 0.018, transparent: true, opacity: 0.42 }));
    scene.add(starField);

    const root = new THREE.Group();
    scene.add(root);
    const positions: THREE.Vector3[] = [];
    graph.atoms.forEach((item, index) => {
      const pos = new THREE.Vector3(item.x, item.y, item.z);
      positions.push(pos);
      const geometry = new THREE.SphereGeometry(item.radius, 48, 48);
      const material = new THREE.MeshPhysicalMaterial({
        color: elementColors[item.element] || '#c7d4ee', roughness: item.element === 'H' ? 0.3 : 0.22,
        metalness: item.element === 'C' ? 0.28 : 0.08, clearcoat: 0.85, clearcoatRoughness: 0.18,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      mesh.userData.atomIndex = index;
      root.add(mesh);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(item.radius * 1.12, 24, 24), new THREE.MeshBasicMaterial({ color: elementColors[item.element], transparent: true, opacity: 0.075, side: THREE.BackSide }));
      halo.position.copy(pos);
      root.add(halo);
    });
    if (modelId === 'atomic-carbon') {
      [0.92, 1.72].forEach((radius, index) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 6, 100), new THREE.MeshBasicMaterial({ color: index === 0 ? '#7d9bef' : '#9c8aff', transparent: true, opacity: 0.56 }));
        ring.rotation.x = index === 0 ? 0.2 : 1.0;
        ring.rotation.y = index === 0 ? 0.1 : 0.6;
        root.add(ring);
      });
    }
    graph.bonds.forEach((bond) => {
      const start = positions[bond.from];
      const end = positions[bond.to];
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const order = bond.order || 1;
      const offsets = order >= 1.8 ? [-0.09, 0.09] : order > 1.2 ? [-0.065, 0, 0.065] : [0];
      offsets.forEach((offset) => {
        const perpendicular = new THREE.Vector3(0, 0, 1);
        if (Math.abs(direction.clone().normalize().dot(perpendicular)) > 0.92) perpendicular.set(0, 1, 0);
        perpendicular.cross(direction.clone().normalize()).normalize().multiplyScalar(offset);
        const geometry = new THREE.CylinderGeometry(0.075, 0.075, length * 0.92, 16, 1, false);
        const material = new THREE.MeshStandardMaterial({ color: '#a9bddc', metalness: 0.5, roughness: 0.27 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(start).add(end).multiplyScalar(0.5).add(perpendicular);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        root.add(mesh);
      });
    });
    root.position.y = 0.02;
    root.rotation.x = -0.09;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(root.children, false).filter((hit) => typeof hit.object.userData.atomIndex === 'number');
      if (hits.length) {
        const selected = graph.atoms[hits[0].object.userData.atomIndex as number];
        setSelectedAtom(selected);
        onAtomSelect(selected);
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointer);
    let frame = 0;
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      frame += 0.003;
      starField.rotation.y = frame * 0.06;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    const resize = () => {
      const w = host.clientWidth || width;
      const h = host.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(host); else window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      controls.dispose();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) { object.geometry.dispose(); const material = object.material; if (Array.isArray(material)) material.forEach((m) => m.dispose()); else material.dispose(); }
      });
      starGeometry.dispose();
      (starField.material as THREE.Material).dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [modelId, allow2D, adaptive, graph, onAtomSelect]);

  if (allow2D) {
    return <div className="molecule-2d">
      <div className="m2d-bond-line" />
      {graph.atoms.map((a, i) => <div key={i} className={`m2d-atom m2d-${a.element.toLowerCase()}`} style={{ left: `${50 + a.x * 14}%`, top: `${50 - a.y * 14}%` }}>{a.element}</div>)}
      <span className="m2d-label">2D teaching diagram · enabled by administrator</span>
    </div>;
  }
  if (webglError) return <div className="model-webgl-fallback" role="status"><strong>3D fallback active</strong><p>{webglError}</p><div>{graph.atoms.map((atom, index) => <span key={`${atom.element}-${index}`}><i style={{ background: elementColors[atom.element] || '#c7d4ee' }}/>{atom.name} ({atom.element})</span>)}</div></div>;
  return <div className="model-canvas-wrap">
    <div ref={mountRef} className="model-canvas" />
    <div className="model-canvas-hint"><span className="drag-icon">↗</span> Drag to rotate <span>·</span> Scroll to zoom <span>·</span> Tap an atom</div>
    {selectedAtom && <div className="atom-selection"><span className="element-dot" style={{ background: elementColors[selectedAtom.element] }} /> Selected: {selectedAtom.name} <button onClick={() => setSelectedAtom(null)} aria-label="Clear selected atom"><X size={13} /></button></div>}
  </div>;
}

function App() {
  const [page, setPage] = useState<Page>('overview');
  const [role, setRole] = useState<Role>('Student');
  const [currentUser, setCurrentUser] = useState<AtlasUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'bootstrap'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSchool, setAuthSchool] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [teacherAnalytics, setTeacherAnalytics] = useState<AnalyticsPayload | null>(null);
  const [teacherPortfolioItems, setTeacherPortfolioItems] = useState<PortfolioItem[]>([]);
  const [teacherLoadError, setTeacherLoadError] = useState('');
  const [myPortfolioItems, setMyPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioCategory, setPortfolioCategory] = useState('experiment-report');
  const [portfolioBody, setPortfolioBody] = useState('');
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioMessage, setPortfolioMessage] = useState('');
  const [portfolioBusy, setPortfolioBusy] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState<Record<string, string>>({});
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState<Grade>('10');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => { try { return JSON.parse(storageGet('chem-atlas-completed') || '[]') as string[]; } catch { return []; } });
  const [practiceAttempts, setPracticeAttempts] = useState<{ correct: boolean; questionId: string; at: number }[]>(() => { try { return JSON.parse(storageGet('chem-atlas-quiz-attempts') || '[]') as { correct: boolean; questionId: string; at: number }[]; } catch { return []; } });
  const [track, setTrack] = useState<Track>('CISCE');
  const [theme, setTheme] = useState<ThemeName>(() => (storageGet('chem-atlas-theme') as ThemeName) || 'lab');
  const [isLight, setIsLight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState('bonding');
  const [modelId, setModelId] = useState('water');
  const [selectedAtom, setSelectedAtom] = useState<ModelAtom | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [adaptive, setAdaptive] = useState(false);
  const [allow2D, setAllow2D] = useState(false);
  const [allowCrossGrade, setAllowCrossGrade] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [uiPreset, setUiPreset] = useState('balanced');
  const [expId, setExpId] = useState('titration');
  const [labMode, setLabMode] = useState<'guided' | 'free'>('guided');
  const [baseVolume, setBaseVolume] = useState(0);
  const [acidMolarity, setAcidMolarity] = useState(0.1);
  const [baseMolarity, setBaseMolarity] = useState(0.1);
  const [temperature, setTemperature] = useState(25);
  const [concentration, setConcentration] = useState(50);
  const [observations, setObservations] = useState<{ volume: number; ph: number }[]>([]);
  const [labNote, setLabNote] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [noteText, setNoteText] = useState(() => storageGet('chem-atlas-note') || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDIY, setSelectedDIY] = useState('indicator');
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorError, setTutorError] = useState('');
  const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [activeAtlasExperimentId, setActiveAtlasExperimentId] = useState('acid-base-titration');
  const [experimentSearch, setExperimentSearch] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [platformVersion, setPlatformVersion] = useState<PlatformVersion>(() => {
    const pathEdition = window.location.pathname.match(/\/versions\/(v[1-5])(?:\/|$)/)?.[1];
    const stored = storageGet('chem-atlas-platform-version');
    const buildDefault = (import.meta as any).env?.VITE_DEFAULT_EDITION;
    if (isPlatformVersion(pathEdition)) return pathEdition;
    if (isPlatformVersion(stored)) return stored;
    return isPlatformVersion(buildDefault) ? buildDefault : 'v5';
  });

  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
    try {
      const raw = storageGet('chem-atlas-v5-feature-flags');
      return raw ? { ...defaultFeatureFlags, ...JSON.parse(raw) } : { ...defaultFeatureFlags };
    } catch { return { ...defaultFeatureFlags }; }
  });
  const [featureFlagsBusy, setFeatureFlagsBusy] = useState(false);

  const activeModel = modelOptions.find((m) => m.id === modelId) || modelOptions[0];
  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
  const appRootPath = window.location.pathname.includes('/versions/') ? `${window.location.pathname.split('/versions/')[0]}/` : window.location.pathname.replace(/\/?$/, '/');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const quizAccuracy = practiceAttempts.length ? Math.round(practiceAttempts.filter((attempt) => attempt.correct).length * 100 / practiceAttempts.length) : 0;
  const noteWordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;
  const boardCompletedCount = completedLessonIds.filter((id) => Boolean(lessonById(id))).length;
  const activeExp = experiments.find((e) => e.id === expId) || experiments[0];
  const activeDIY = diyGuides.find((d) => d.id === selectedDIY) || diyGuides[0];
  const chapters = curriculum[grade];
  const boardUnits = boardLessons.filter((lesson) => lesson.grade === grade);
  const selectedCourseKey = track === 'JEE' || track === 'JEE_ADVANCED' ? 'JEE_MAIN' : track;
  const course = track === 'CISCE' ? null : track === 'JEE_ADVANCED' ? jeeAdvancedCourse : courseTracks[selectedCourseKey as keyof typeof courseTracks];
  const selectedCourseUnits = course ? course.units.filter((unit) => unit.grade === grade) : [];
  const currentBoardLesson = track === 'CISCE' ? lessonById(activeChapter) : undefined;
  const currentCourseUnit = track === 'CISCE' ? undefined : selectedCourseUnits.find((unit) => unit.code === activeChapter);
  const activeUnitTitle = currentBoardLesson?.title || currentCourseUnit?.title || boardLessons.find((lesson) => lesson.grade === grade)?.title || 'Chemistry foundations';
  const activeUnitId = currentBoardLesson?.id || currentCourseUnit?.code || '';
  const activeUnitComplete = Boolean(activeUnitId && completedLessonIds.includes(activeUnitId));
  const selectedUnitLessons = (currentCourseUnit?.mappedLessonIds || []).map((id) => lessonById(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const unitList = track === 'CISCE'
    ? boardUnits.map((lesson) => ({ id: lesson.id, title: lesson.title, group: chapters.find((c) => c.id === lesson.id)?.group || 'Chemistry', minutes: lesson.minutes, lessons: lesson.sections.length, description: lesson.overview }))
    : selectedCourseUnits.map((unit) => ({ id: unit.code, title: unit.title, group: `Class ${unit.grade} · ${track}`, minutes: 90, lessons: unit.topics.length, description: unit.assessment }));
  const filteredChapters = unitList.filter((c) => `${c.title} ${c.group} ${c.description}`.toLowerCase().includes(search.toLowerCase()));
  const activeAtlasExperiment = experimentLibrary.find((exp) => exp.id === activeAtlasExperimentId) || experimentLibrary[0];
  const filteredExperimentLibrary = experimentLibrary.filter((exp) => `${exp.title} ${exp.category} ${exp.syllabus.join(' ')}`.toLowerCase().includes(experimentSearch.toLowerCase()));
  const questionTrack = track === 'JEE' || track === 'JEE_ADVANCED' ? 'JEE_MAIN' : track;
  const practiceQuestions = useMemo(() => {
    const matching = questionBank.filter((q) => q.track === questionTrack && q.grade === grade && (track !== 'JEE_ADVANCED' || q.difficulty === 'advanced'));
    return matching.length ? matching : questionBank.filter((q) => q.track === 'CISCE' && q.grade === grade);
  }, [questionTrack, grade, track]);
  const effectiveRole = currentUser?.role || (role === 'Admin' ? 'admin' : role === 'Teacher' ? 'teacher' : 'student');

  useEffect(() => { storageSet('chem-atlas-theme', theme); }, [theme]);
  useEffect(() => { storageSet('chem-atlas-note', noteText); }, [noteText]);
  useEffect(() => { storageSet('chem-atlas-platform-version', platformVersion); }, [platformVersion]);
  useEffect(() => { try { storageSet('chem-atlas-v5-feature-flags', JSON.stringify(featureFlags)); } catch { /* Private browsing may disable storage; in-memory controls still work. */ } }, [featureFlags]);
  useEffect(() => {
    atlasApi.me().then(({ user }) => {
      setCurrentUser(user);
      if (user) setRole(user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student');
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    atlasApi.adminFeatureFlags().then(({ flags }) => {
      if (alive) setFeatureFlags((current) => ({ ...current, ...flags }));
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [currentUser]);
  const toggleFeatureFlag = async (id: string, enabled: boolean) => {
    const next = { ...featureFlags, [id]: enabled };
    setFeatureFlags(next);
    if (currentUser?.role === 'admin') {
      setFeatureFlagsBusy(true);
      try { await atlasApi.saveAdminFeatureFlags(Object.fromEntries(advancedFeatures.filter((feature) => feature.status !== 'planned' && feature.id !== 'release-selector').map((feature) => [feature.id, next[feature.id] !== false]))); setAdminNotice(`Feature rollout setting updated: ${id} ${enabled ? 'enabled' : 'disabled'}.`); }
      catch (error) { setAdminNotice(`Saved on this device only. School-wide feature sync is unavailable: ${error instanceof Error ? error.message : 'API not configured'}`); }
      finally { setFeatureFlagsBusy(false); }
    } else {
      setAdminNotice('Feature preview saved on this device. Sign in as administrator to save school-wide rollout settings.');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    const isVersionArchive = /\/versions\/v[1-5](?:\/|$)/.test(window.location.pathname);
    if (isVersionArchive) return () => { alive = false; };
    atlasApi.adminPlatformSettings().then(({ platformVersion: saved }) => {
      if (alive) setPlatformVersion(isPlatformVersion(saved) ? saved : 'v5');
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [currentUser]);
  const changePlatformVersion = async (next: PlatformVersion) => {
    setPlatformVersion(next);
    storageSet('chem-atlas-platform-version', next);
    if (currentUser?.role === 'admin') {
      try { await atlasApi.saveAdminPlatformVersion(next); setAdminNotice(`Chemistry Atlas ${next.toUpperCase()} is now the school-wide edition.`); }
      catch (error) { setAdminNotice(`Saved ${next.toUpperCase()} on this device. School-wide sync is unavailable: ${error instanceof Error ? error.message : 'API not configured'}`); }
    } else {
      setAdminNotice(`Preview switched to ${next.toUpperCase()} on this device. Sign in as administrator to save this school-wide.`);
    }
  };
  useEffect(() => {
    if (page !== 'teacher' || !currentUser || !['teacher', 'admin'].includes(currentUser.role) || featureFlags['teacher-analytics'] === false) return;
    setTeacherLoadError('');
    Promise.all([atlasApi.analytics(), atlasApi.reviewQueue()]).then(([analytics, queue]) => {
      setTeacherAnalytics(analytics); setTeacherPortfolioItems(queue.items);
    }).catch((error: Error) => setTeacherLoadError(error.message));
  }, [page, currentUser, featureFlags['teacher-analytics']]);
  useEffect(() => {
    if (page !== 'portfolio' || !currentUser) return;
    atlasApi.myPortfolio().then(({ items }) => setMyPortfolioItems(items)).catch((error: Error) => setPortfolioMessage(error.message));
  }, [page, currentUser]);

  const titration = useMemo(() => {
    const acidMoles = acidMolarity * 0.025;
    const baseMoles = baseMolarity * baseVolume / 1000;
    const totalL = (25 + baseVolume) / 1000;
    let ph = 7;
    if (acidMoles > baseMoles + 1e-8) ph = -Math.log10((acidMoles - baseMoles) / totalL);
    else if (baseMoles > acidMoles + 1e-8) ph = 14 + Math.log10((baseMoles - acidMoles) / totalL);
    return { ph: Math.max(0, Math.min(14, ph)), equivalence: acidMoles / baseMolarity * 1000, acidMoles, baseMoles };
  }, [acidMolarity, baseMolarity, baseVolume]);

  const changePage = (next: Page) => { setPage(next); setSidebarOpen(false); setSearch(''); };
  const selectChapter = (id: string) => { setActiveChapter(id); setPage('learn'); };
  const selectGrade = (next: Grade) => {
    const targetGrade: Grade = (track === 'JEE' || track === 'JEE_ADVANCED' || track === 'NEET') && next === '10' ? '11' : next;
    setGrade(targetGrade);
    const selectedCourse = track === 'JEE_ADVANCED' ? jeeAdvancedCourse : courseTracks[selectedCourseKey as keyof typeof courseTracks];
    const first = track === 'CISCE' ? boardLessons.find((lesson) => lesson.grade === targetGrade) : selectedCourse.units.find((unit) => unit.grade === targetGrade);
    setActiveChapter(first ? ('id' in first ? first.id : first.code) : '');
    setQuizIndex(0); setQuizAnswer(null); setQuizDone(false); setQuizScore(0);
  };
  const selectTrack = (next: Track) => {
    const targetGrade: Grade = (next === 'JEE' || next === 'JEE_ADVANCED' || next === 'NEET') && grade === '10' ? '11' : grade;
    setTrack(next); setGrade(targetGrade);
    const key = next === 'JEE' || next === 'JEE_ADVANCED' ? 'JEE_MAIN' : next;
    const selectedCourse = next === 'JEE_ADVANCED' ? jeeAdvancedCourse : courseTracks[key as keyof typeof courseTracks];
    const first = next === 'CISCE' ? boardLessons.find((lesson) => lesson.grade === targetGrade) : selectedCourse.units.find((unit) => unit.grade === targetGrade);
    setActiveChapter(first ? ('id' in first ? first.id : first.code) : '');
    setQuizIndex(0); setQuizAnswer(null); setQuizDone(false); setQuizScore(0);
  };
  const sendLearningEvent = (event: Parameters<typeof atlasApi.event>[0]) => {
    if (currentUser) atlasApi.event(event).catch(() => undefined);
  };
  const markLessonComplete = (id: string, title: string) => {
    const completed = JSON.parse(storageGet('chem-atlas-completed') || '[]') as string[];
    if (!completed.includes(id)) { const next = [...completed, id]; storageSet('chem-atlas-completed', JSON.stringify(next)); setCompletedLessonIds(next); }
    sendLearningEvent({ eventType: 'lesson_complete', topic: id, grade, track: track === 'JEE' ? 'JEE_MAIN' : track, metadata: { title } });
    setAdminNotice(`Completed: ${title}. Your progress is saved in this browser${currentUser ? ' and synced to your school account' : ''}.`);
  };
  const handleAuth = async (event: FormEvent) => {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    try {
      const user = authMode === 'bootstrap'
        ? await atlasApi.bootstrap({ token: bootstrapToken, schoolName: authSchool, name: authName, email: authEmail, password: authPassword })
        : await atlasApi.login(authEmail, authPassword);
      setCurrentUser(user); setRole(user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student');
      setAuthModalOpen(false); setAuthPassword(''); setBootstrapToken('');
    } catch (error) { setAuthError((error as Error).message); }
    finally { setAuthBusy(false); }
  };
  const logout = async () => {
    await atlasApi.logout().catch(() => undefined);
    setCurrentUser(null); setRole('Student'); setTeacherAnalytics(null); setTeacherPortfolioItems([]); setMyPortfolioItems([]); changePage('overview');
  };
  const submitTutorQuestion = async (event: FormEvent) => {
    event.preventDefault();
    const question = tutorInput.trim(); if (!question || tutorBusy) return;
    if (!currentUser) { setAuthModalOpen(true); setAuthError('Sign in to use the live AI chemistry tutor.'); return; }
    const nextHistory = [...tutorMessages, { role: 'user' as const, content: question }];
    setTutorMessages(nextHistory); setTutorInput(''); setTutorBusy(true); setTutorError('');
    try {
      const result = await atlasApi.tutor({ question, grade, track: track === 'JEE_ADVANCED' ? 'JEE_ADVANCED' : questionTrack, chapter: currentBoardLesson?.title || currentCourseUnit?.title || activeChapter, history: nextHistory.slice(-7, -1) });
      setTutorMessages((items) => [...items, { role: 'assistant', content: result.answer }]);
    } catch (error) { setTutorError((error as Error).message); }
    finally { setTutorBusy(false); }
  };
  const submitPortfolio = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { setAuthModalOpen(true); return; }
    setPortfolioBusy(true); setPortfolioMessage('');
    try {
      const mediaIds: string[] = [];
      for (const file of portfolioFiles) { const uploaded = await atlasApi.uploadPortfolioFile(file); mediaIds.push(uploaded.media.id); }
      await atlasApi.submitPortfolio({ title: portfolioTitle, category: portfolioCategory, body: portfolioBody, mediaIds });
      const { items } = await atlasApi.myPortfolio(); setMyPortfolioItems(items);
      setPortfolioTitle(''); setPortfolioBody(''); setPortfolioFiles([]); setPortfolioMessage('Submitted to your teacher for review.');
    } catch (error) { setPortfolioMessage((error as Error).message); }
    finally { setPortfolioBusy(false); }
  };
  const downloadPortfolioFile = async (file: { id: string; fileName: string }) => {
    try { const blob = await atlasApi.downloadPortfolioFile(file.id); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.fileName; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000); }
    catch (error) { setPortfolioMessage((error as Error).message); setTeacherLoadError((error as Error).message); }
  };
  const reviewPortfolio = async (item: PortfolioItem, status: 'approved' | 'revision_requested') => {
    try {
      await atlasApi.reviewPortfolio({ id: item.id, status, feedback: teacherFeedback[item.id] || '' });
      const { items } = await atlasApi.reviewQueue(); setTeacherPortfolioItems(items);
    } catch (error) { setTeacherLoadError((error as Error).message); }
  };
  const createSchoolUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await atlasApi.createUser({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole });
      setAdminNotice(`${newUserRole} account created for ${newUserEmail}. Share the initial password securely.`);
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
    } catch (error) { setAdminNotice((error as Error).message); }
  };
  const recordReading = () => {
    setObservations((prev) => [...prev, { volume: Number(baseVolume.toFixed(2)), ph: Number(titration.ph.toFixed(2)) }]);
    setLabNote((prev) => `${prev}${prev ? '\n' : ''}${baseVolume.toFixed(2)} mL base → pH ${titration.ph.toFixed(2)}`);
  };
  const resetLab = () => { setBaseVolume(0); setObservations([]); setLabNote(''); setAcidMolarity(0.1); setBaseMolarity(0.1); setTemperature(25); setConcentration(50); };
  const answerQuiz = (answer: number) => { if (quizAnswer !== null || !practiceQuestions[quizIndex]) return; const question = practiceQuestions[quizIndex]; const correct = answer === question.answer; setQuizAnswer(answer); if (correct) setQuizScore((s) => s + 1); setPracticeAttempts((current) => { const next = [...current, { correct, questionId: question.id, at: Date.now() }].slice(-500); storageSet('chem-atlas-quiz-attempts', JSON.stringify(next)); return next; }); sendLearningEvent({ eventType: 'quiz_attempt', topic: question.unitId, grade, track: track === 'JEE_ADVANCED' ? 'JEE_ADVANCED' : questionTrack, score: correct ? 1 : 0, maxScore: 1, metadata: { questionId: question.id, difficulty: question.difficulty } }); };
  const nextQuestion = () => {
    if (quizIndex >= practiceQuestions.length - 1) { setQuizDone(true); return; }
    setQuizIndex((i) => i + 1); setQuizAnswer(null);
  };
  const restartQuiz = () => { setQuizIndex(0); setQuizAnswer(null); setQuizScore(0); setQuizDone(false); };
  const saveNote = () => { storageSet('chem-atlas-note', noteText); setNoteSaved(true); sendLearningEvent({ eventType: 'note_saved', topic: 'personal-notebook', grade, track: track === 'JEE' ? 'JEE_MAIN' : track }); window.setTimeout(() => setNoteSaved(false), 1800); };
  const handleAtomSelect = useCallback((atom: ModelAtom) => setSelectedAtom(atom), []);

  const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; section?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'learn', label: 'Learning paths', icon: BookOpen, section: 'LEARN' },
    { id: 'models', label: '3D explorer', icon: Atom },
    { id: 'lab', label: 'Virtual laboratory', icon: FlaskConical },
    { id: 'diy', label: 'DIY studio', icon: Lightbulb },
    { id: 'practice', label: 'Practice & tests', icon: Target },
    { id: 'notes', label: 'My notebook', icon: NotebookPen },
    { id: 'portfolio', label: 'My portfolio', icon: FileText },
  ];

  const pageTitle: Record<Page, string> = {
    overview: 'Overview', learn: 'Learning paths', models: '3D explorer', lab: 'Virtual laboratory', diy: 'DIY studio',
    practice: 'Practice & tests', notes: 'My notebook', portfolio: 'Student portfolio', teacher: 'Teaching workspace', admin: 'Platform control', preferences: 'My preferences',
  };

  return <div className={`app-shell ${isLight ? 'light-mode' : ''} theme-${theme} ${motionEnabled ? '' : 'motion-off'}`} data-preset={uiPreset}>
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark"><Atom size={22} strokeWidth={1.7} /></div>
        <div className="brand-copy"><strong>chemistry<span>atlas</span></strong><small>LEARN · EXPLORE · DISCOVER</small></div>
        <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="sidebar-context">
        <div className="context-label">YOUR LEARNING SPACE</div>
        <div className="grade-selector">
          <GraduationCap size={16} />
          <select value={grade} onChange={(e) => selectGrade(e.target.value as Grade)} aria-label="Choose class">
            <option value="10">Class 10</option><option value="11">Class 11</option><option value="12">Class 12</option>
          </select>
          <ChevronDown size={14} />
        </div>
        <div className="track-line"><span className="track-dot" /> {track === 'CISCE' ? (grade === '10' ? 'ICSE' : 'ISC') : track === 'JEE' ? 'JEE Main' : track} curriculum</div>
      </div>
      <nav className="side-nav">
        {navItems.map((item) => <div key={item.id}>
          {item.section && <div className="nav-section-label">{item.section}</div>}
          <button className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => changePage(item.id)}>
            <item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'lab' && <span className="nav-live-dot" />}
          </button>
        </div>)}
        {effectiveRole !== 'student' && <>
          <div className="nav-section-label">WORKSPACE</div>
          <button className={`nav-link ${page === 'teacher' ? 'active' : ''}`} onClick={() => changePage('teacher')}><Users size={18} /><span>Teacher insights</span></button>
          {effectiveRole === 'admin' && <button className={`nav-link ${page === 'admin' ? 'active' : ''}`} onClick={() => changePage('admin')}><ShieldCheck size={18} /><span>Admin console</span></button>}
        </>}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-progress-card">
          <div className="progress-card-top"><span>Learning momentum</span><Sparkles size={15} /></div>
          <div className="progress-card-value">{boardCompletedCount} <small>lessons</small><span>of {boardLessons.length}</span></div>
          <div className="progress-line"><span style={{ width: `${Math.min(100, boardCompletedCount / Math.max(boardLessons.length, 1) * 100)}%` }} /></div>
          <div className="weekdays"><span>Progress is based on lessons you mark complete.</span></div>
        </div>
        <button className="nav-link" onClick={() => changePage(effectiveRole === 'admin' ? 'admin' : 'preferences')}><Settings size={18} /><span>{effectiveRole === 'admin' ? 'Settings & controls' : 'My preferences'}</span></button>
        <div className="sidebar-profile">
          <div className="avatar">{role === 'Admin' ? 'A' : role === 'Teacher' ? 'T' : 'S'}</div>
          <div className="profile-meta"><strong>{currentUser?.displayName || (role === 'Student' ? 'Student explorer' : role === 'Teacher' ? 'Faculty preview' : 'Admin preview')}</strong><small>{currentUser ? `${currentUser.role} · Signed in` : `${role} · Local preview`}</small></div>
          <MoreHorizontal size={17} className="muted" />
        </div>
      </div>
    </aside>
    {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{pageTitle[page]}</strong><span className={`edition-indicator edition-${platformVersion}`}>{platformVersion.toUpperCase()}</span></div>
        </div>
        <div className="topbar-right">
          <div className="top-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chemistry..." /></div>
          <div className="user-theme-select"><select value={theme} onChange={(e) => setTheme(e.target.value as ThemeName)} aria-label="Choose visual theme"><option value="lab">Deep lab</option><option value="minimal">Minimal</option><option value="museum">Museum</option><option value="university">University</option></select><ChevronDown size={12} /></div>
          <button className="icon-button theme-toggle" onClick={() => setIsLight((v) => !v)} title="Toggle light mode" aria-label="Toggle light mode">{isLight ? <Moon size={17} /> : <Sun size={17} />}</button>
          {!currentUser && <div className="role-switcher"><span className="role-label">LOCAL PREVIEW</span><select value={role} onChange={(e) => { setRole(e.target.value as Role); if (e.target.value === 'Admin' || e.target.value === 'Teacher') setPage('teacher'); else setPage('overview'); }}><option>Student</option><option>Teacher</option><option>Admin</option></select><ChevronDown size={13} /></div>}
          {currentUser ? <button className="account-chip" onClick={logout} title="Sign out"><span className="top-avatar">{currentUser.displayName.slice(0,1).toUpperCase()}</span><span>{currentUser.displayName.split(' ')[0]}</span><LogOut size={13} /></button> : <button className="sign-in-button" onClick={() => { setAuthError(''); setAuthMode('login'); setAuthModalOpen(true); }}><LogIn size={14} /> Sign in</button>}
          
        </div>
      </header>

      <div className="content-area">
        {page === 'overview' && <>
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> {todayLabel} <span className="eyebrow-divider" /> YOUR DAILY LAB</div><h1>{greeting}, <em>scientist.</em></h1><p className="lead">Curiosity is your most powerful element. What will you discover today?</p></div>
            <button className="outline-button" onClick={() => changePage('learn')}><BookOpen size={16} /> View study plan <ChevronRight size={15} /></button>
          </div>
          <section className="hero-panel">
            <div className="hero-grid-pattern" />
            <div className="hero-copy"><div className="hero-kicker"><span className="sparkle-mark">✳</span> THE MOLECULAR WORLD AWAITS</div><h2>See the invisible.<br /><span>Understand everything.</span></h2><p>Turn abstract chemistry into something you can see, touch and experiment with.</p><div className="hero-actions"><button className="primary-button" onClick={() => changePage('models')}>Explore 3D models <Atom size={16} /></button><button className="text-button light-text" onClick={() => changePage('lab')}>Enter virtual lab <ChevronRight size={15} /></button></div><div className="hero-footnote"><span><span className="tiny-check">✓</span> Interactive learning</span><span><span className="tiny-check">✓</span> Built for your syllabus</span></div></div>
            <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-orbit orbit-three" /><div className="hero-nucleus"><span>O</span></div><div className="hero-electron e-one" /><div className="hero-electron e-two" /><div className="hero-electron e-three" /><div className="hero-art-label label-atom"><Atom size={14} /> MOLECULAR VIEW</div><div className="hero-art-label label-energy"><Zap size={13} /> ENERGY STATES</div><div className="hero-art-coordinates">06 / 118 ELEMENTS DISCOVERED</div></div>
          </section>
          <div className="section-heading-row"><div><div className="eyebrow muted-eyebrow">YOUR PROGRESS</div><h2 className="section-title">A little progress, every day.</h2></div><button className="text-button" onClick={() => changePage('notes')}>View activity <ChevronRight size={15} /></button></div>
          <div className="stats-grid">
            <StatCard icon={<BookOpen size={18} />} label="Lessons completed" value={String(completedLessonIds.length)} detail="Saved on this device" trend={`${Math.min(100, Math.round(completedLessonIds.length / Math.max(boardLessons.length, 1) * 100))}% of CISCE lessons`} tone="violet" />
            <StatCard icon={<Target size={18} />} label="Practice questions" value={String(practiceAttempts.length)} detail="Answers recorded in this browser" trend={practiceAttempts.length ? `${quizAccuracy}% correct` : 'No attempts yet'} tone="mint" />
            <StatCard icon={<Award size={18} />} label="Question accuracy" value={practiceAttempts.length ? `${quizAccuracy}%` : '—'} detail="Across recorded attempts" trend={practiceAttempts.length ? 'Live local calculation' : 'Start a practice set'} tone="amber" />
            <StatCard icon={<NotebookPen size={18} />} label="Notebook words" value={String(noteWordCount)} detail="Private notes on this device" trend="Auto-saved locally" tone="blue" />
          </div>
          <div className="dashboard-grid">
            <section className="panel continue-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">PICK UP WHERE YOU LEFT OFF</div><h3>Continue learning</h3></div><button className="icon-button subtle" onClick={() => changePage('learn')}><MoreHorizontal size={18} /></button></div><div className="continue-card"><div className="continue-art"><div className="orbit-symbol"><Atom size={48} strokeWidth={1.1} /></div><span className="art-tag">CLASS {grade}</span></div><div className="continue-content"><div className="chapter-meta"><span>{track === 'CISCE' ? 'CISCE BOARD' : `${track} TRACK`}</span><span>{activeUnitComplete ? 'COMPLETED' : 'UP NEXT'}</span></div><h4>{activeUnitTitle}</h4><p>Continue with your selected curriculum unit, its linked explanations and practice questions.</p><div className="progress-line"><span style={{ width: activeUnitComplete ? '100%' : '0%' }} /></div><div className="continue-bottom"><span>{activeUnitComplete ? 'Completed' : 'Not started'}</span><button className="primary-button small" onClick={() => { if (activeUnitId) selectChapter(activeUnitId); else changePage('learn'); }}>Resume lesson <Play size={13} fill="currentColor" /></button></div></div></div></section>
            <section className="panel today-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">A FRESH CHALLENGE</div><h3>Today's discovery</h3></div><span className="pill pill-violet">3 min read</span></div><div className="discovery-visual"><div className="discovery-glow" /><div className="discovery-formula">H₂O <span>→</span> H⁺ + OH⁻</div><div className="discovery-caption">THE AMPHOTERIC NATURE OF WATER</div></div><h4>Water is more than a solvent.</h4><p>One molecule can donate a proton and accept one. Explore how water participates in its own ionisation.</p><button className="text-button" onClick={() => selectChapter('acids')}>Explore the concept <ChevronRight size={14} /></button></section>
          </div>
          <div className="section-heading-row compact-top"><div><div className="eyebrow muted-eyebrow">JUMP RIGHT IN</div><h2 className="section-title">Your chemistry toolkit.</h2></div></div>
          <div className="tool-grid">
            <ToolCard icon={<Atom size={20} />} title="3D molecular explorer" subtitle="Rotate molecules. Inspect every bond." color="violet" action={() => changePage('models')} tag="IMMERSIVE" />
            <ToolCard icon={<FlaskConical size={20} />} title="Virtual laboratory" subtitle="Run experiments without limits." color="mint" action={() => changePage('lab')} tag="HANDS-ON" />
            <ToolCard icon={<Target size={20} />} title="Practice arena" subtitle="Test concepts with instant feedback." color="amber" action={() => changePage('practice')} tag="CHALLENGE" />
            <ToolCard icon={<Lightbulb size={20} />} title="DIY experiment studio" subtitle="Bring chemistry into your world." color="blue" action={() => changePage('diy')} tag="REAL WORLD" />
          </div>
          <section className="quote-strip"><div className="quote-symbol">“</div><p>Nothing is lost, nothing is created, everything is transformed.</p><span>ANTOINE LAVOISIER <i>·</i> CONSERVATION OF MASS</span><div className="quote-decoration"><Atom size={70} strokeWidth={0.7} /></div></section>
        </>}

        {page === 'learn' && <>
          <PageIntro eyebrow="THE KNOWLEDGE MAP" title="Learning paths" description="A connected curriculum, from first principles to senior-secondary chemistry and entrance-exam mastery." />
          <div className="filter-row"><div className="grade-tabs">{(['10', '11', '12'] as Grade[]).map((g) => <button key={g} className={grade === g ? 'selected' : ''} onClick={() => selectGrade(g)}>Class {g}</button>)}</div><div className="track-select"><span>TRACK</span><select value={track} onChange={(e) => selectTrack(e.target.value as Track)}><option value="CISCE">{grade === '10' ? 'ICSE' : 'ISC'} board</option><option value="CBSE">CBSE</option><option value="JEE">JEE Main</option><option value="JEE_ADVANCED">JEE Advanced</option><option value="NEET">NEET</option></select><ChevronDown size={13} /></div><div className="chapter-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a chapter" /></div></div>
          {course && <div className="track-notice"><Sparkles size={16} /><div><strong>{track === 'JEE' ? 'JEE Main 2027' : track === 'JEE_ADVANCED' ? 'JEE Advanced enrichment' : track === 'NEET' ? 'NEET UG · verified 2026 baseline' : 'CBSE 2026–27'} learning track</strong><span>{course.note} The core explanations below are linked to the 28 authored CISCE/ISC lessons wherever concepts overlap; track-specific syllabus points and practice are kept distinct.</span></div></div>}
          <div className="curriculum-overview"><div className="curriculum-ring"><strong>{unitList.length}</strong><span>UNITS</span></div><div className="curriculum-copy"><div className="eyebrow muted-eyebrow">{track === 'CISCE' ? (grade === '10' ? 'ICSE EXAMINATION YEAR 2027' : 'ISC EXAMINATION YEAR 2027') : course?.source}</div><h3>{track === 'CISCE' ? 'Build a strong foundation in every branch.' : `Prepare systematically for ${track === 'JEE' ? 'JEE Main' : track === 'JEE_ADVANCED' ? 'JEE Advanced' : track === 'NEET' ? 'NEET UG' : 'CBSE Chemistry'}.`}</h3><p>Choose a unit to open its lesson notes, learning objectives, worked examples, exam focus and linked practice questions.</p><div className="branch-tags"><span>Physical chemistry</span><span>Inorganic chemistry</span><span>Organic chemistry</span></div></div><div className="curriculum-stat"><strong>{unitList.length.toString().padStart(2,'0')}</strong><span>UNITS IN CLASS {grade}</span><small>{track === 'CISCE' ? 'CISCE mapped' : course?.year}</small></div></div>
          {track === 'CISCE' && currentBoardLesson && <section className="panel authored-lesson">
            <div className="authored-lesson-heading"><div><div className="eyebrow muted-eyebrow">FULL AUTHORED BOARD LESSON · CLASS {currentBoardLesson.grade}</div><h2>{currentBoardLesson.title}</h2><p>{currentBoardLesson.overview}</p></div><span className="pill pill-violet">{currentBoardLesson.minutes} MIN READ</span></div>
            <div className="lesson-objectives"><strong>By the end of this lesson, you should be able to</strong><ul>{currentBoardLesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="authored-sections">{currentBoardLesson.sections.map((section, i) => <article className="authored-section" key={section.heading}><div className="authored-section-number">{String(i + 1).padStart(2,'0')}</div><div><h3>{section.heading}</h3><p>{section.body}</p>{section.equation && <div className="equation-card">{section.equation}</div>}</div></article>)}</div>
            <section className="worked-example"><div className="eyebrow muted-eyebrow">WORKED EXAMPLE</div><h3>{currentBoardLesson.workedExample.prompt}</h3><p>{currentBoardLesson.workedExample.solution}</p></section>
            <div className="lesson-two-column"><section className="lesson-reference-card"><h3>Exam focus</h3><ul>{currentBoardLesson.examFocus.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="lesson-reference-card"><h3>Common misconceptions</h3><ul>{currentBoardLesson.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
            <div className="lesson-checks"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">RETRIEVAL PRACTICE</div><h3>Check your understanding</h3></div><span className="pill">{currentBoardLesson.checks.length} CHECKS</span></div>{currentBoardLesson.checks.map((check, i) => <details key={i} className="lesson-check"><summary>{check.question}</summary><p><strong>Answer:</strong> {check.answer}</p><small>{check.why}</small></details>)}</div>
            <div className="lesson-complete-row"><span><ShieldCheck size={14} /> Your personal completion checklist stays on this device. Signed-in lesson activity is also recorded for teacher analytics.</span><button className="primary-button small" onClick={() => markLessonComplete(currentBoardLesson.id,currentBoardLesson.title)}><Check size={14}/> Mark lesson complete</button></div>
          </section>}
          {track !== 'CISCE' && currentCourseUnit && <section className="panel authored-lesson">
            <div className="authored-lesson-heading"><div><div className="eyebrow muted-eyebrow">{course?.source} · CLASS {currentCourseUnit.grade} · {currentCourseUnit.code}</div><h2>{currentCourseUnit.title}</h2><p>This unit is mapped to the selected examination track. Use the syllabus checklist, linked authored explanations and its own question bank as one study sequence.</p></div><span className="pill pill-violet">{currentCourseUnit.topics.length} TOPICS</span></div>
            <section className="lesson-objectives"><strong>Unit syllabus checklist</strong><ul className="topic-checklist">{currentCourseUnit.topics.map((topic) => <li key={topic}><span className="topic-check-dot" />{topic}</li>)}</ul></section>
            <section className="worked-example"><div className="eyebrow muted-eyebrow">ASSESSMENT SKILL</div><h3>What you must be able to do</h3><p>{currentCourseUnit.assessment}</p></section>
            <div className="lesson-checks"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">LINKED TEACHING MATERIAL</div><h3>Core explanations</h3></div><span className="pill">{selectedUnitLessons.length} LESSONS</span></div>{selectedUnitLessons.map((lesson) => <details className="track-linked-lesson" key={lesson.id}><summary><strong>{lesson.title}</strong><span>Class {lesson.grade} · {lesson.sections.length} sections</span></summary><p>{lesson.overview}</p>{lesson.sections.map((section) => <div className="track-linked-section" key={section.heading}><h4>{section.heading}</h4><p>{section.body}</p></div>)}<div className="track-linked-section"><h4>Worked example</h4><p><strong>{lesson.workedExample.prompt}</strong> {lesson.workedExample.solution}</p></div></details>)}</div>
            <div className="track-question-summary"><div><strong>{questionBank.filter((q) => q.track === questionTrack && q.unitId === currentCourseUnit.code).length}</strong><span>UNIT QUESTIONS</span></div><p>Open Practice & tests for timed, exam-style multiple-choice practice and instant explanations.</p><button className="outline-button compact-button" onClick={() => changePage('practice')}>Open question bank <ChevronRight size={13}/></button></div>
            <div className="lesson-complete-row"><span><ShieldCheck size={14} /> Syllabus is tied to the selected official track version.</span><button className="primary-button small" onClick={() => markLessonComplete(currentCourseUnit.code,currentCourseUnit.title)}><Check size={14}/> Mark unit complete</button></div>
          </section>}
          <div className="chapter-list-heading"><h3>{track === 'CISCE' ? 'Board chapter library' : `${track} unit library`} <span>{filteredChapters.length}</span></h3><span>SELECT A UNIT TO OPEN ITS CONTENT <ChevronRight size={13} /></span></div>
          <div className="chapter-list">{filteredChapters.map((ch, i) => <button className={`chapter-row ${activeChapter === ch.id ? 'selected-chapter-row' : ''}`} key={ch.id} onClick={() => setActiveChapter(ch.id)}><div className="chapter-index">{String(i + 1).padStart(2, '0')}</div><div className="chapter-info"><span className="chapter-group">{ch.group}</span><h4>{ch.title}</h4><p>{ch.description}</p><div className="chapter-mini-meta"><span><BookOpen size={13} /> {ch.lessons} sections / topics</span><span><Clock3 size={13} /> {ch.minutes} min</span></div></div><div className="chapter-progress-area"><span className="not-started">{completedLessonIds.includes(ch.id) ? 'Completed' : 'Open lesson'}</span></div><div className="chapter-arrow"><ChevronRight size={18} /></div></button>)}</div>
          <div className="source-note"><ShieldCheck size={15} /><span>Track sources: {syllabusSources.map((source, i) => <a key={source.label} href={source.url} target="_blank" rel="noreferrer">{source.label}{i < syllabusSources.length - 1 ? ' · ' : ''}</a>)}. Verify the current official circular before a live exam cycle; the NEET track is labelled to its latest verified syllabus baseline.</span></div>
        </>}
        {page === 'models' && <>
          <PageIntro eyebrow="MOLECULES, MADE VISIBLE" title="3D molecular explorer" description="Step inside molecular space. Rotate, zoom and inspect the atoms that build matter." action={<span className="live-chip"><span /> LIVE 3D ENGINE</span>} />
          {isVersionAtLeast(platformVersion, 'v2') && featureFlags['molecular-studio'] !== false && <V2MoleculeStudio edition={platformVersion} showOrbital={featureFlags['orbital-probability-viewer'] !== false} showEvidence={featureFlags['molecule-evidence-cards'] !== false} featureFlags={featureFlags} />}
          <div className="model-layout">
            <section className="model-stage panel"><div className="model-stage-header"><div><div className="eyebrow muted-eyebrow">INTERACTIVE STRUCTURE VIEWER</div><h3>{activeModel.name} <span>{activeModel.formula}</span></h3></div><div className="stage-actions"><span className="pill pill-violet">{allow2D ? '2D mode' : adaptive ? 'Adaptive quality' : 'Cinematic quality'}</span><button className="icon-button subtle" onClick={() => setSelectedAtom(null)} title="Reset selection"><RotateCcw size={16} /></button></div></div>
              <ModelViewer modelId={modelId} allow2D={allow2D} adaptive={adaptive} onAtomSelect={handleAtomSelect} />
              <div className="model-stage-footer"><div className="atom-legend"><span><i style={{ background: '#f06c83' }} /> Oxygen</span><span><i style={{ background: '#303d52' }} /> Carbon</span><span><i style={{ background: '#dfe7f4' }} /> Hydrogen</span><span><i style={{ background: '#6b8dff' }} /> Nitrogen</span></div><div className="model-controls-note"><span>↻</span> Auto-rotate · Drag to inspect</div></div></section>
            <aside className="model-side"><section className="panel model-library"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">MODEL COLLECTION</div><h3>Explore structures</h3></div><span className="count-badge">{modelOptions.length}</span></div><div className="model-search"><Search size={14} /><input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search molecule..." /></div><div className="model-list">{filteredModels.map((m) => <button className={`model-list-item ${modelId === m.id ? 'active' : ''}`} key={m.id} onClick={() => { setModelId(m.id); setSelectedAtom(null); sendLearningEvent({ eventType: 'model_view', topic: m.id, grade, track: track === 'JEE' ? 'JEE_MAIN' : track, metadata: { name: m.name, formula: m.formula } }); }}><div className={`molecule-thumb thumb-${m.id}`}><span>{m.formula}</span></div><div><strong>{m.name}</strong><small>{m.shape}</small></div><ChevronRight size={15} /></button>)}</div></section>
              <section className="panel model-facts"><div className="eyebrow muted-eyebrow">STRUCTURE INSIGHTS</div><h3>{activeModel.formula}</h3><p>{activeModel.detail}</p><div className="fact-metrics"><div><strong>{activeModel.atoms}</strong><span>ATOMS</span></div><div><strong>{activeModel.bonds}</strong><span>BONDS</span></div><div><strong>{activeModel.shape.split('·')[0].trim()}</strong><span>GEOMETRY</span></div></div>{selectedAtom && <div className="selected-atom-note"><span className="element-dot" style={{ background: elementColors[selectedAtom.element] }} /><div><strong>{selectedAtom.name}</strong><small>Tap another sphere to inspect a different atom.</small></div></div>}</section>
            </aside>
          </div>
          <div className="model-bottom-grid"><section className="panel"><div className="panel-heading"><h3>Representation controls</h3><span className="pill pill-mint">Device-aware</span></div><div className="setting-row"><div><strong>Rendering quality</strong><small>Switch between cinematic detail and adaptive performance.</small></div><div className="segmented"><button className={!adaptive ? 'active' : ''} onClick={() => setAdaptive(false)}>Cinematic</button><button className={adaptive ? 'active' : ''} onClick={() => setAdaptive(true)}>Adaptive</button></div></div><div className="setting-row"><div><strong>Animation and motion</strong><small>Ambient molecular rotation and subtle transitions.</small></div><Toggle checked={motionEnabled} onChange={setMotionEnabled} /></div><div className="setting-row"><div><strong>2D classroom diagrams</strong><small>{allow2D ? 'Enabled globally by the administrator.' : '3D is the default. 2D can only be enabled in Admin Console.'}</small></div><span className="restricted-label"><ShieldCheck size={13} /> Admin controlled</span></div></section><section className="panel concept-panel"><div className="eyebrow muted-eyebrow">GO BEYOND THE MODEL</div><h3>Why does shape matter?</h3><p>Molecular geometry influences polarity, intermolecular forces, physical properties and how molecules interact. Use the model to connect electron-pair repulsion to real structure.</p><button className="text-button" onClick={() => selectChapter(grade === '10' ? 'bonding' : grade === '11' ? 'bonding11' : 'coordination12')}>Open bonding lesson <ChevronRight size={14} /></button></section></div>
        </>}

        {page === 'lab' && <>
          <PageIntro eyebrow="EXPERIMENT WITHOUT LIMITS" title="Virtual laboratory" description="A safe digital bench for guided practice and open-ended exploration." action={<span className="lab-status"><span /> SIMULATION MODE</span>} />
          <div className="lab-workspace"><aside className="panel experiment-sidebar"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">EXPERIMENT LIBRARY</div><h3>Choose an experiment</h3></div><span className="count-badge">{experiments.length}</span></div>{experiments.map((exp) => <button className={`experiment-item ${expId === exp.id ? 'active' : ''}`} key={exp.id} onClick={() => { setExpId(exp.id); resetLab(); }}><div className="experiment-icon"><FlaskConical size={18} /></div><div><strong>{exp.title}</strong><small>{exp.category}</small><span>{exp.tag}</span></div><ChevronRight size={15} /></button>)}</aside>
            <section className="panel lab-bench"><div className="lab-bench-top"><div><div className="eyebrow muted-eyebrow">VIRTUAL EXPERIMENT · {activeExp.category.toUpperCase()}</div><h3>{activeExp.title}</h3><p>{activeExp.description}</p></div><div className="segmented mode-segment"><button className={labMode === 'guided' ? 'active' : ''} onClick={() => setLabMode('guided')}>Guided</button><button className={labMode === 'free' ? 'active' : ''} onClick={() => setLabMode('free')}>Free lab</button></div></div>
              {expId === 'titration' ? <>
                <div className="bench-visual"><div className="bench-glow" /><div className="burette-unit"><div className="burette-cap" /><div className="burette-tube"><div className="burette-liquid" style={{ height: `${Math.max(5, 90 - (baseVolume / 45) * 84)}%` }} /></div><div className="burette-tap" /><div className="burette-drop" style={{ opacity: baseVolume > 0 ? 1 : 0.25 }} /></div><div className="flask-wrap"><div className="flask-neck" /><div className="flask-body"><div className={`flask-liquid ${titration.ph >= 8.2 ? 'pink' : ''}`} style={{ height: `${28 + Math.min(baseVolume, 40) * 0.8}%` }} /><div className="flask-bubbles"><i /><i /><i /></div></div></div><div className="beaker-label">ERLENMEYER FLASK<br /><span>25.00 mL ACID SAMPLE</span></div><div className="bench-tag tag-burette">0.100 M NaOH</div><div className="bench-tag tag-indicator">Phenolphthalein</div><div className="bench-grid-line" /></div>
                <div className="lab-readouts"><div><span>LIVE pH</span><strong className={titration.ph >= 8.2 ? 'pink-text' : ''}>{titration.ph.toFixed(2)}</strong><small>{titration.ph < 7 ? 'Acidic solution' : titration.ph > 7 ? 'Basic solution' : 'Neutral point'}</small></div><div><span>EQUIVALENCE VOLUME</span><strong>{titration.equivalence.toFixed(2)} <small>mL</small></strong><small>Calculated from stoichiometry</small></div><div><span>END-POINT STATUS</span><strong className="status-reading">{Math.abs(baseVolume - titration.equivalence) < 0.4 ? 'Reached' : baseVolume > titration.equivalence ? 'Passed' : 'Pending'}</strong><small>Indicator transition near pH 8.2</small></div></div>
                <div className="lab-controls"><div className="control-heading"><div><h4>Experiment controls</h4><p>Change one variable at a time and observe the effect.</p></div><button className="text-button small-text" onClick={resetLab}><RotateCcw size={13} /> Reset</button></div><SliderControl label="Volume of NaOH added" value={baseVolume} min={0} max={45} step={0.25} suffix="mL" onChange={setBaseVolume} /><SliderControl label="Acid concentration" value={acidMolarity} min={0.05} max={0.2} step={0.01} suffix="M" onChange={setAcidMolarity} /><SliderControl label="Base concentration" value={baseMolarity} min={0.05} max={0.2} step={0.01} suffix="M" onChange={setBaseMolarity} /><div className="control-foot"><button className="primary-button small" onClick={recordReading}><Plus size={14} /> Record observation</button><span>Acid sample: 25.00 mL · Room temperature: 25°C</span></div></div>
                <div className="ph-chart-panel"><div className="panel-heading"><div><h4>Titration curve</h4><small>Illustrative pH response as base is added</small></div><span className="pill pill-violet">LIVE DATA</span></div><svg viewBox="0 0 500 165" className="titration-chart" role="img" aria-label="Titration curve showing pH increasing with added base"><defs><linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a18aff" stopOpacity=".25"/><stop offset="100%" stopColor="#a18aff" stopOpacity="0"/></linearGradient></defs><path d="M30 12 V135 H480" fill="none" stroke="#8290aa" strokeOpacity=".4"/><g className="chart-grid"><path d="M30 42 H480 M30 75 H480 M30 108 H480"/><path d="M120 12 V135 M210 12 V135 M300 12 V135 M390 12 V135"/></g><text x="10" y="17">14</text><text x="15" y="79">7</text><text x="15" y="137">0</text><text x="30" y="153">0</text><text x="260" y="153">Volume added →</text><text x="448" y="153">45 mL</text><path d={Array.from({ length: 46 }, (_, i) => { const v = i; const molA = acidMolarity * 0.025; const molB = baseMolarity * v / 1000; const total = (25 + v) / 1000; let ph = 7; if (molA > molB + 1e-8) ph = -Math.log10((molA - molB) / total); else if (molB > molA + 1e-8) ph = 14 + Math.log10((molB - molA) / total); const x = 30 + (v / 45) * 450; const y = 12 + ((14 - Math.max(0, Math.min(14, ph))) / 14) * 123; return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ')} fill="none" stroke="#a18aff" strokeWidth="2.8" strokeLinecap="round"/><path d={`M${30 + baseVolume / 45 * 450} 12 V135`} stroke="#f4b85a" strokeDasharray="3 4"/><circle cx={30 + baseVolume / 45 * 450} cy={12 + ((14 - titration.ph) / 14) * 123} r="4.5" fill="#f4b85a" stroke="#fff" strokeWidth="1.5"/></svg></div>
              </> : <GenericExperiment expId={expId} concentration={concentration} setConcentration={setConcentration} temperature={temperature} setTemperature={setTemperature} />}
              <div className="lab-notebook"><div className="notebook-heading"><div><NotebookPen size={16} /><strong>Digital lab notebook</strong></div><span>{observations.length} observations</span></div><textarea value={labNote} onChange={(e) => setLabNote(e.target.value)} placeholder="Record your hypothesis, observations and conclusion..." rows={3} /><div className="notebook-bottom"><span>Saved locally in this session</span><button className="outline-button compact-button" onClick={() => { const text = `${activeExp.title}\n${labNote}`; const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'chemistry-lab-notes.txt'; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); }}>Export notes <ClipboardList size={13} /></button></div></div>
            </section>
          </div>
          <div className="safety-note"><ShieldCheck size={16} /><div><strong>Simulation safety</strong><span>This is a mathematical learning model, not a substitute for supervised laboratory practice. Real experiments require teacher-approved procedures, suitable PPE and correct chemical handling.</span></div></div>
          <section className="panel experiment-catalog-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">COMPLETE EXPERIMENT LIBRARY</div><h3>Explore {experimentLibrary.length} structured investigations</h3><p>Each entry includes a scientific principle, protocol, variables, expected observations, safety classification and a lab-report template.</p></div><span className="count-badge">{experimentLibrary.length}</span></div><div className="experiment-catalog-search"><Search size={15}/><input value={experimentSearch} onChange={(e)=>setExperimentSearch(e.target.value)} placeholder="Search titration, kinetics, salt analysis..."/></div><div className="experiment-catalog-layout"><div className="experiment-catalog-list">{filteredExperimentLibrary.map((exp)=> <button key={exp.id} className={`experiment-catalog-item ${exp.id===activeAtlasExperimentId?'active':''}`} onClick={()=>setActiveAtlasExperimentId(exp.id)}><span className="catalog-kind">{exp.kind.replaceAll('-',' ')}</span><strong>{exp.title}</strong><small>{exp.category} · {exp.grade} · {exp.duration}</small></button>)}</div><div className="experiment-catalog-detail"><div className="eyebrow muted-eyebrow">{activeAtlasExperiment.category.toUpperCase()} · {activeAtlasExperiment.grade}</div><h3>{activeAtlasExperiment.title}</h3><p>{activeAtlasExperiment.principle}</p><div className="experiment-detail-grid"><section><h4>Protocol</h4><ol>{activeAtlasExperiment.procedure.map((step,i)=><li key={i}>{step}</li>)}</ol></section><section><h4>Variables to control</h4><ul>{activeAtlasExperiment.controls.map((item)=><li key={item}>{item}</li>)}</ul><h4>Expected observations</h4><ul>{activeAtlasExperiment.expected.map((item)=><li key={item}>{item}</li>)}</ul></section></div><div className="experiment-safety"><ShieldCheck size={15}/><div><strong>Safety classification</strong><p>{activeAtlasExperiment.safety}</p></div></div><div className="experiment-report-template"><strong>Lab report template</strong><span>{activeAtlasExperiment.report.join(' · ')}</span><small>{activeAtlasExperiment.accuracyNote}</small></div><button className="primary-button small" onClick={()=>{sendLearningEvent({eventType:'lab_complete',topic:activeAtlasExperiment.id,grade,track:track==='JEE'?'JEE_MAIN':track,metadata:{title:activeAtlasExperiment.title,mode:labMode}});setAdminNotice(`Investigation recorded: ${activeAtlasExperiment.title}.`);}}><Check size={14}/> Record investigation complete</button></div></div></section>
          {isVersionAtLeast(platformVersion, 'v2') && featureFlags['virtual-lab-catalogue'] !== false && <V2VirtualLab featureFlags={featureFlags} />}
          {isVersionAtLeast(platformVersion, 'v5') && featureFlags['equation-balancer'] !== false && <V5EquationBalancer />}
        </>}

        {page === 'diy' && <>
          <PageIntro eyebrow="CHEMISTRY OUTSIDE THE CLASSROOM" title="DIY experiment studio" description="Safe, small-scale explorations that connect classroom ideas to things you can observe." action={<span className="safety-chip"><ShieldCheck size={14} /> SAFETY FIRST</span>} />
          <div className="diy-layout"><div className="diy-library"><div className="eyebrow muted-eyebrow">PROJECT COLLECTION</div><h3>Make science tangible.</h3><p>Choose a guided activity. Read the safety notes before collecting materials or starting.</p>{diyGuides.map((d, i) => <button className={`diy-card ${selectedDIY === d.id ? 'active' : ''}`} key={d.id} onClick={() => setSelectedDIY(d.id)}><div className={`diy-thumb diy-thumb-${i + 1}`}><span>{i === 0 ? 'pH' : i === 1 ? 'Rf' : 'NaCl'}</span></div><div className="diy-card-copy"><span>{d.level.toUpperCase()} <i>·</i> {d.time}</span><strong>{d.title}</strong><small>{d.subtitle}</small></div><ChevronRight size={17} /></button>)}</div>
            <section className="panel diy-detail"><div className="diy-detail-visual"><div className="diy-orb"><span>{selectedDIY === 'indicator' ? 'pH' : selectedDIY === 'chromatography' ? 'Rf' : 'NaCl'}</span></div><div className="diy-detail-meta"><span className="pill pill-mint">{activeDIY.level}</span><span><Clock3 size={13} /> {activeDIY.time}</span></div></div><div className="diy-detail-body"><div className="eyebrow muted-eyebrow">GUIDED PROJECT / {activeDIY.subtitle.toUpperCase()}</div><h3>{activeDIY.title}</h3><p className="diy-science">{activeDIY.science}</p><div className="diy-block"><h4>What you'll need</h4><p>{activeDIY.supplies}</p></div><div className="diy-block"><h4>Method</h4><ol>{activeDIY.steps.map((step, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol></div><div className="diy-safety-box"><ShieldCheck size={17} /><div><strong>Safety & disposal</strong><p>{activeDIY.safety}</p></div></div><button className="outline-button" onClick={() => { const text = `${activeDIY.title}\n\nMaterials: ${activeDIY.supplies}\n\n${activeDIY.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nScience: ${activeDIY.science}\n\nSafety: ${activeDIY.safety}`; const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${activeDIY.id}-experiment-guide.txt`; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); }}>Save experiment guide <Bookmark size={15} /></button></div></section></div>
        </>}

        {page === 'practice' && <>
          <PageIntro eyebrow="RETRIEVE · APPLY · IMPROVE" title="Practice arena" description={`A track-filtered question bank with ${practiceQuestions.length} available questions for Class ${grade}. Results are logged for teacher analytics when signed in.`} action={<span className="pill pill-violet"><Target size={13} /> QUESTION BANK</span>} />
          <div className="filter-row practice-filters"><div className="grade-tabs">{(['10','11','12'] as Grade[]).map((g)=><button key={g} className={grade===g?'selected':''} onClick={()=>selectGrade(g)}>Class {g}</button>)}</div><div className="track-select"><span>TRACK</span><select value={track} onChange={(e)=>selectTrack(e.target.value as Track)}><option value="CISCE">CISCE board</option><option value="CBSE">CBSE</option><option value="JEE">JEE Main</option><option value="JEE_ADVANCED">JEE Advanced</option><option value="NEET">NEET</option></select><ChevronDown size={13}/></div><button className="outline-button compact-button" onClick={restartQuiz}><RotateCcw size={13}/> Reset test</button></div>
          <div className="practice-layout"><section className="panel quiz-panel">{practiceQuestions.length===0 ? <div className="empty-state">No questions are published for this class and track yet. Choose another grade or track.</div> : !quizDone ? <><div className="quiz-top"><div><div className="eyebrow muted-eyebrow">CHEMISTRY MIX / FOUNDATION</div><h3>Quick knowledge check</h3></div><div className="quiz-counter">{String(quizIndex + 1).padStart(2, '0')} <span>/ {String(practiceQuestions.length).padStart(2, '0')}</span></div></div><div className="quiz-progress">{practiceQuestions.map((_, i) => <span key={i} className={i < quizIndex ? 'done' : i === quizIndex ? 'current' : ''} />)}</div><div className="question-kicker">QUESTION {quizIndex + 1} <span>·</span> MULTIPLE CHOICE</div><h2 className="question-text">{practiceQuestions[quizIndex].question}</h2><div className="answer-options">{practiceQuestions[quizIndex].options.map((option, i) => <button key={i} disabled={quizAnswer !== null} onClick={() => answerQuiz(i)} className={`answer-option ${quizAnswer === i ? (i === practiceQuestions[quizIndex].answer ? 'correct' : 'incorrect') : quizAnswer !== null && i === practiceQuestions[quizIndex].answer ? 'reveal-correct' : ''}`}><span className="answer-letter">{String.fromCharCode(65 + i)}</span>{option}{quizAnswer !== null && i === practiceQuestions[quizIndex].answer && <Check size={17} />}{quizAnswer === i && i !== practiceQuestions[quizIndex].answer && <X size={17} />}</button>)}</div>{quizAnswer !== null && <div className={`answer-explanation ${quizAnswer === practiceQuestions[quizIndex].answer ? 'good' : 'needs-review'}`}><div><strong>{quizAnswer === practiceQuestions[quizIndex].answer ? 'Correct. Nice reasoning.' : 'Not quite. Let’s unpack it.'}</strong><p>{practiceQuestions[quizIndex].explanation}</p></div><button className="primary-button small" onClick={nextQuestion}>{quizIndex === practiceQuestions.length - 1 ? 'See results' : 'Next question'} <ChevronRight size={14} /></button></div>}</> : <div className="quiz-result"><div className="result-icon"><Award size={35} /></div><div className="eyebrow muted-eyebrow">CHECKPOINT COMPLETE</div><h2>{quizScore} / {practiceQuestions.length}</h2><p>{quizScore === practiceQuestions.length ? 'Excellent work. Your concepts are looking strong.' : 'Good effort. Review the explanations and try again to strengthen recall.'}</p><div className="result-bar"><span style={{ width: `${(quizScore / practiceQuestions.length) * 100}%` }} /></div><button className="primary-button" onClick={restartQuiz}>Try again <RotateCcw size={15} /></button></div>}</section>
            <aside className="practice-aside"><section className="panel practice-stats"><div className="eyebrow muted-eyebrow">YOUR PRACTICE SNAPSHOT</div><h3>Consistency compounds.</h3><div className="practice-score"><strong>{quizDone ? Math.round((quizScore / Math.max(practiceQuestions.length,1)) * 100) : '—'}<span>{quizDone ? '%' : ''}</span></strong><small>Current session accuracy</small></div><div className="stat-line"><span>Questions in this track</span><strong>{practiceQuestions.length}</strong></div><div className="stat-line"><span>Answered this session</span><strong>{quizIndex + (quizAnswer !== null ? 1 : 0)}</strong></div><div className="stat-line"><span>Correct this session</span><strong>{quizScore}</strong></div></section><section className="panel focus-card"><div className="focus-icon"><Sparkles size={18} /></div><div className="eyebrow muted-eyebrow">RECOMMENDED FOCUS</div><h3>Bonding & geometry</h3><p>Revisit lone-pair repulsion and molecular shapes to improve accuracy on application questions.</p><button className="text-button" onClick={() => selectChapter(grade === '10' ? 'bonding' : 'bonding11')}>Study this topic <ChevronRight size={14} /></button></section></aside></div>
        </>}

        {page === 'notes' && <>
          <PageIntro eyebrow="YOUR PERSONAL KNOWLEDGE BASE" title="My notebook" description="Keep your explanations, observations and questions together. Notes are saved in this browser." action={<span className="pill pill-mint"><Bookmark size={13} /> PRIVATE TO THIS DEVICE</span>} />
          <div className="notes-layout"><section className="panel note-editor"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">QUICK NOTES</div><h3>Capture a thought.</h3></div><span className="saved-status">{noteSaved ? <><Check size={13} /> Saved</> : 'Auto-saved locally'}</span></div><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={'Write a concept in your own words...\n\nExample: In a covalent bond, atoms share electron pairs to achieve a more stable electron arrangement.'} rows={16} /><div className="note-editor-bottom"><span>{noteText.trim() ? noteText.trim().split(/\s+/).length : 0} words · Plain text</span><button className="primary-button small" onClick={saveNote}><Check size={14} /> Save note</button></div></section><aside className="notes-side"><section className="panel note-tip"><div className="tip-icon"><Lightbulb size={18} /></div><div className="eyebrow muted-eyebrow">STUDY TIP</div><h3>Explain it twice.</h3><p>Write one explanation as if teaching a younger student. Then add the precise scientific vocabulary. The gap between the two often reveals what you still need to learn.</p></section><section className="panel note-index"><div className="panel-heading"><h3>Quick formulae</h3><span className="pill">REFERENCE</span></div><div className="formula-row"><span>Moles</span><strong>n = m / M</strong></div><div className="formula-row"><span>Molarity</span><strong>C = n / V</strong></div><div className="formula-row"><span>pH</span><strong>−log₁₀[H⁺]</strong></div><div className="formula-row"><span>Gas law</span><strong>PV = nRT</strong></div></section></aside></div>
        </>}

        {page === 'portfolio' && <>
          <PageIntro eyebrow="YOUR CHEMISTRY JOURNEY · EVIDENCE OF LEARNING" title="Student portfolio" description="Collect lab reports, project write-ups, model explorations and reflections. Your teacher can review each submission and leave feedback." action={<span className="pill pill-violet"><FileText size={13}/> PERSONAL ARCHIVE</span>} />
          {!currentUser ? <section className="panel access-gate"><FileText size={24}/><div><h3>Sign in to sync your portfolio</h3><p>You can browse the portfolio feature, but saved submissions are stored under your school account so only you and authorised school staff can access them.</p><button className="primary-button small" onClick={()=>{setAuthMode('login');setAuthModalOpen(true);}}>Sign in <LogIn size={14}/></button></div></section> : currentUser.role !== 'student' ? <section className="panel access-gate"><ShieldCheck size={24}/><div><h3>Student portfolio workspace</h3><p>Sign in with a student account to submit work. Teachers and administrators can review work from the Teacher workspace.</p></div></section> : <div className="portfolio-layout">
            <section className="panel portfolio-compose"><div className="eyebrow muted-eyebrow">NEW PORTFOLIO ENTRY</div><h3>Show what you discovered.</h3><p>Use this space for a project, experiment report, problem-solving reflection or explanation of a model you explored.</p><form onSubmit={submitPortfolio} className="portfolio-form"><label>Entry title<input value={portfolioTitle} onChange={(e)=>setPortfolioTitle(e.target.value)} required minLength={3} maxLength={120} placeholder="e.g. Investigating the effect of concentration on reaction rate"/></label><label>Entry type<select value={portfolioCategory} onChange={(e)=>setPortfolioCategory(e.target.value)}><option value="experiment-report">Experiment report</option><option value="project">Chemistry project</option><option value="model-exploration">3D model exploration</option><option value="problem-solving">Problem-solving journal</option><option value="reflection">Learning reflection</option></select></label><label>Work, method, observations and conclusion<textarea value={portfolioBody} onChange={(e)=>setPortfolioBody(e.target.value)} required minLength={20} maxLength={12000} rows={8} placeholder="Aim, hypothesis, materials or simulation, variables, observations, calculations, conclusion and sources…"/></label><label>Evidence files (optional)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm" multiple onChange={(e)=>{const files=Array.from(e.target.files||[]).slice(0,8);const tooLarge=files.find((f)=>f.size>(f.type.startsWith('video/')?25:12)*1024*1024);if(tooLarge){setPortfolioMessage(`${tooLarge.name} is over the permitted size.`);return;}setPortfolioFiles(files);setPortfolioMessage('');}}/><small>Up to 8 files · photos, PDF, MP4 or WebM · 12 MB per image/PDF · 25 MB per video. R2 storage must be configured by the administrator.</small></label>{portfolioFiles.length>0 && <div className="portfolio-selected-files">{portfolioFiles.map((file)=><span key={`${file.name}-${file.lastModified}`}><FileText size={13}/>{file.name}<button type="button" onClick={()=>setPortfolioFiles((old)=>old.filter((f)=>f!==file))} aria-label={`Remove ${file.name}`}><X size={12}/></button></span>)}</div>}<div className="portfolio-form-footer"><span>{portfolioBody.length}/12,000 characters · Teacher review required before public sharing.</span><button className="primary-button small" disabled={portfolioBusy || portfolioTitle.trim().length<3 || portfolioBody.trim().length<20}>{portfolioBusy?'Submitting…':'Submit for review'} <Send size={14}/></button></div></form>{portfolioMessage && <div className="inline-notice"><Check size={14}/>{portfolioMessage}</div>}</section>
            <aside className="panel portfolio-history"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">YOUR SUBMISSIONS</div><h3>Portfolio timeline</h3></div><span className="count-badge">{myPortfolioItems.length}</span></div>{myPortfolioItems.length ? myPortfolioItems.map((item)=><article className="portfolio-history-item" key={item.id}><div className="portfolio-history-top"><strong>{item.title}</strong><span className={`review-status ${item.status}`}>{item.status.replaceAll('_',' ')}</span></div><small>{item.category} · {new Date(item.created_at).toLocaleDateString()}</small><p>{item.body}</p>{item.attachments?.length ? <div className="portfolio-attachments">{item.attachments.map((file)=><button key={file.id} className="attachment-download" onClick={()=>downloadPortfolioFile(file)}><FileText size={13}/>{file.fileName}<Download size={12}/></button>)}</div> : null}{item.teacher_feedback && <div className="teacher-feedback"><strong>Teacher feedback</strong><p>{item.teacher_feedback}</p></div>}</article>) : <div className="empty-state">Your portfolio is empty. Submit your first project or experiment report to begin building your chemistry record.</div>}</aside>
          </div>}
        </>}

        {page === 'preferences' && <>
          <PageIntro eyebrow="YOUR PERSONAL LEARNING ENVIRONMENT" title="Make this space feel like yours." description="Choose a visual environment and reading mode. These preferences are saved in this browser." action={<span className="pill pill-violet"><Settings size={13} /> PERSONAL SETTINGS</span>} />
          <div className="preferences-layout"><section className="panel preferences-panel"><div className="eyebrow muted-eyebrow">VISUAL ENVIRONMENT</div><h3>Choose your chemistry world.</h3><p>All themes keep the same content and controls. Only the presentation changes.</p><div className="preference-theme-grid">{([{ id: 'lab', name: 'Deep laboratory', note: 'Midnight blue · violet glow', swatches: ['#121c38', '#7469d9', '#50d6c1'] }, { id: 'minimal', name: 'Minimal studio', note: 'Quiet · bright · focused', swatches: ['#ecf0f6', '#7c8caa', '#81a9a0'] }, { id: 'museum', name: 'Science museum', note: 'Immersive · expressive', swatches: ['#1c1731', '#f0a56e', '#9f8aff'] }, { id: 'university', name: 'University', note: 'Academic · calm · precise', swatches: ['#102a36', '#6fb2ad', '#d9bd83'] }] as { id: ThemeName; name: string; note: string; swatches: string[] }[]).map((t) => <button className={`preference-theme ${theme === t.id ? 'selected' : ''}`} key={t.id} onClick={() => setTheme(t.id)}><div className="preference-preview" style={{ background: `linear-gradient(135deg,${t.swatches[0]},${t.swatches[1]})` }}><span style={{ background: t.swatches[2] }} /><i /><b /></div><div><strong>{t.name}</strong><small>{t.note}</small></div>{theme === t.id && <Check size={16} />}</button>)}</div></section><div className="preferences-side"><section className="panel preferences-panel"><div className="eyebrow muted-eyebrow">DISPLAY</div><h3>Comfort & focus</h3><div className="setting-row"><div><strong>Light reading mode</strong><small>Use a bright interface for well-lit environments.</small></div><Toggle checked={isLight} onChange={setIsLight} /></div><div className="setting-row"><div><strong>Motion effects</strong><small>Keep or reduce ambient motion and transitions.</small></div><Toggle checked={motionEnabled} onChange={setMotionEnabled} /></div></section><section className="panel preferences-note"><Sparkles size={18} /><h3>Your workspace, your pace.</h3><p>Rendering quality and classroom-wide experience policies are controlled separately by teachers and administrators. The 2D teaching mode can only be enabled by an administrator.</p></section></div></div>
        </>}

        {page === 'teacher' && <>
          <PageIntro eyebrow="TEACHER WORKSPACE · LIVE SCHOOL DATA" title="See the whole learning picture." description="Real cohort activity, topic-level practice signals, portfolio moderation and an AI-generated teaching brief based on aggregate evidence." action={<span className="teacher-chip"><Users size={14} /> TEACHER ANALYTICS</span>} />
          {featureFlags['teacher-analytics'] === false ? <section className="panel access-gate"><ShieldCheck size={22}/><div><h3>Teacher analytics are disabled</h3><p>An administrator can re-enable this module from the V5 feature registry. No analytics request is made while this module is off.</p></div></section> : (!currentUser || !['teacher','admin'].includes(currentUser.role)) ? <section className="panel access-gate"><div className="gate-icon"><ShieldCheck size={24}/></div><div><h3>Teacher sign-in required</h3><p>These analytics are private school data. Sign in with a teacher or administrator account. The local preview switch does not grant access to student information.</p><button className="primary-button small" onClick={()=>{setAuthMode('login');setAuthError('');setAuthModalOpen(true);}}>Sign in to teacher workspace <LogIn size={14}/></button></div></section> : <>
            {teacherLoadError && <div className="inline-notice"><X size={15}/>{teacherLoadError}<button onClick={()=>setTeacherLoadError('')}><X size={13}/></button></div>}
            {!teacherAnalytics ? <section className="panel access-gate"><Activity size={22}/><div><h3>Loading school analytics…</h3><p>Only learning events and anonymised cohort aggregates are used for the AI teaching brief.</p></div></section> : <>
              <div className="teacher-alert"><Sparkles size={17}/><div><strong>AI teaching brief · Live aggregate data</strong><p>{teacherAnalytics.aiSummary}</p><small>{teacherAnalytics.privacy} · Activity: last {teacherAnalytics.periods.activityDays} days · Quiz performance: last {teacherAnalytics.periods.quizDays} days.</small></div></div>
              <div className="stats-grid teacher-stats"><StatCard icon={<Users size={18}/>} label="Student accounts" value={String(teacherAnalytics.metrics.students)} detail="Active school accounts" trend="D1 live data" tone="violet"/><StatCard icon={<Activity size={18}/>} label="Active learners" value={String(teacherAnalytics.metrics.active7d)} detail="At least one event in 7 days" trend="Last 7 days" tone="mint"/><StatCard icon={<Target size={18}/>} label="Quiz accuracy" value={`${teacherAnalytics.metrics.meanQuizAccuracy}%`} detail={`${teacherAnalytics.metrics.quizAttempts30d} attempts in 30 days`} trend="Attempt-weighted" tone="amber"/><StatCard icon={<Clock3 size={18}/>} label="Learning actions" value={String(teacherAnalytics.metrics.events7d)} detail="Recorded in 7 days" trend={`${teacherAnalytics.metrics.pendingPortfolioReviews} portfolio reviews pending`} tone="blue"/></div>
              <div className="teacher-grid"><section className="panel cohort-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">COHORT PERFORMANCE</div><h3>Mastery signals by topic</h3></div><span className="pill">REAL ATTEMPTS</span></div>{teacherAnalytics.metrics.topics.length ? teacherAnalytics.metrics.topics.map((x)=><div className="mastery-row" key={`${x.topic}-${x.grade}-${x.track}`}><span>{x.topic} <small>Class {x.grade} · {x.track}</small></span><div className="mastery-track"><i style={{width:`${Math.max(0,Math.min(100,x.accuracy))}%`}}/></div><strong>{x.accuracy}%</strong><small>{x.attempts} attempts</small></div>) : <p className="empty-state">No quiz attempts have been recorded yet. Student practice results will appear here after the first signed-in session.</p>}<div className="cohort-legend"><span><i/> Accuracy is calculated from submitted question attempts.</span></div></section><section className="panel engagement-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">LEARNING ENGAGEMENT</div><h3>Events by type · 7 days</h3></div><span className="pill pill-mint">D1</span></div>{teacherAnalytics.metrics.activity.length ? teacherAnalytics.metrics.activity.map((x)=> <div className="activity-type-row" key={x.type}><span>{x.type.replaceAll('_',' ')}</span><strong>{x.count}</strong></div>) : <p className="empty-state">No activity has been recorded this week.</p>}<div className="engagement-foot"><strong>{teacherAnalytics.metrics.events7d}</strong><span>logged learning actions</span></div></section></div>
              <section className="panel cohort-breakdown"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">CLASS & TRACK BREAKDOWN</div><h3>Where learning activity is happening</h3></div><span className="pill">30-DAY WINDOW</span></div>{teacherAnalytics.cohorts.length ? <div className="cohort-breakdown-table"><div className="cohort-breakdown-head"><span>Class / track</span><span>Learners</span><span>Quiz attempts</span><span>Accuracy</span><span>Events</span></div>{teacherAnalytics.cohorts.map((row)=><div className="cohort-breakdown-row" key={`${row.grade}-${row.track}`}><strong>Class {row.grade} · {row.track}</strong><span>{row.learners}</span><span>{row.quizAttempts}</span><span>{row.quizAttempts ? `${row.accuracy}%` : '—'}</span><span>{row.events}</span></div>)}</div> : <p className="empty-state">Class and track breakdowns appear after students complete lessons or practice while signed in.</p>}</section>
              <section className="panel review-queue"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">STUDENT PORTFOLIOS</div><h3>Submissions awaiting review</h3></div><span className="pill">{teacherAnalytics.metrics.pendingPortfolioReviews} PENDING</span></div>{teacherPortfolioItems.length ? teacherPortfolioItems.map((item)=><div className="portfolio-review-item" key={item.id}><div className="review-file"><FileText size={16}/></div><div className="review-copy"><strong>{item.title}</strong><small>{item.student_name || 'Student'} · {item.category} · {new Date(item.created_at).toLocaleDateString()}</small><p>{item.body}</p>{item.attachments?.length ? <div className="portfolio-attachments">{item.attachments.map((file)=><button key={file.id} className="attachment-download" onClick={()=>downloadPortfolioFile(file)}><FileText size={13}/>{file.fileName}<Download size={12}/></button>)}</div> : null}<textarea rows={2} value={teacherFeedback[item.id]||''} onChange={(e)=>setTeacherFeedback((prev)=>({...prev,[item.id]:e.target.value}))} placeholder="Teacher feedback (visible to this student)"/></div><div className="portfolio-review-actions"><span className={`review-status ${item.status}`}>{item.status.replaceAll('_',' ')}</span>{item.status==='pending' && <><button className="approve-button" onClick={()=>reviewPortfolio(item,'approved')}><Check size={13}/> Approve</button><button className="reject-button" onClick={()=>reviewPortfolio(item,'revision_requested')} title="Request revision"><X size={13}/></button></>}</div></div>) : <p className="empty-state">No portfolio submissions have arrived yet. Students can submit experiment reports and projects from My portfolio.</p>}</section>
              <section className="panel teacher-controls"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">CLASSROOM EXPERIENCE</div><h3>Teaching controls</h3></div><span className="pill pill-violet">LOCAL PREVIEW SETTINGS</span></div><div className="setting-row"><div><strong>Adaptive 3D quality</strong><small>Offer device-aware rendering while keeping the cinematic 3D experience as the default.</small></div><Toggle checked={adaptive} onChange={setAdaptive}/></div><div className="setting-row"><div><strong>Ambient animations</strong><small>Enable subtle motion in models and learning transitions.</small></div><Toggle checked={motionEnabled} onChange={setMotionEnabled}/></div></section>
            </>}
          </>}
          <div className="privacy-note"><ShieldCheck size={15}/><span>Teacher AI summaries use cohort-level aggregates. The analytics prompt excludes student notebook text, portfolio bodies and private tutor conversations. Do not use AI output as the sole basis for high-stakes student decisions.</span></div>
        </>}
        {page === 'admin' && <>
          <PageIntro eyebrow="PLATFORM GOVERNANCE" title="Make the learning space yours." description="Configure the experience, approve content and manage what teachers and learners can access." action={<span className="admin-chip"><ShieldCheck size={14} /> ADMIN CONSOLE</span>} />
          <div className="admin-banner"><div className="admin-banner-icon"><ShieldCheck size={25} /></div><div><strong>Platform controls & account provisioning</strong><p>Visual controls below are browser-local previews. School account creation is handled by the authenticated server API; only the first administrator can provision new users.</p></div><span className="pill pill-amber">MIXED: API + LOCAL PREVIEW</span></div>
          <section className="panel admin-section version-switch-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">EDITION CONTROL · RELEASE CHANNELS</div><h3>Platform version selector</h3></div><span className={`pill ${platformVersion === 'v5' || platformVersion === 'v4' ? 'pill-mint' : 'pill-violet'}`}>ACTIVE: {platformVersion.toUpperCase()}</span></div><p className="v2-intro-copy">All five editions are selectable without deleting learner data. Dedicated static entry points are built at /versions/v1–v5/. V3, V4 and V5 are clearly labelled previews until their complete scientific and engineering release gates pass.</p><div className="edition-choice-grid edition-choice-grid-five">{releaseDefinitions.map((edition) => <button key={edition.id} className={`edition-choice edition-choice-${edition.id} ${platformVersion === edition.id ? 'selected' : ''}`} onClick={() => void changePlatformVersion(edition.id)}><span className="edition-choice-number">{edition.id.toUpperCase()}</span><div><strong>Chemistry Atlas {edition.id.toUpperCase()} · {edition.name}</strong><small>{edition.summary}</small><small className="edition-status-copy">{edition.status.replaceAll('-', ' ').toUpperCase()} · {edition.capabilities.length} capability groups</small></div>{platformVersion === edition.id && <Check size={17}/>}</button>)}</div><div className="edition-published-links">{releaseDefinitions.map((edition) => <a key={edition.id} href={`${appRootPath}versions/${edition.id}/`}><ExternalLink size={12}/> Open published {edition.id.toUpperCase()} entry</a>)}</div><div className="version-save-note"><ShieldCheck size={14}/>{currentUser?.role === 'admin' ? 'School-wide edition is saved through the authenticated Cloudflare admin API when configured. Previous edition settings remain in history.' : 'This is a local preview. Sign in as administrator to synchronise the selected edition school-wide.'}</div></section>
          <section className="panel admin-account-panel"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">SCHOOL ACCOUNT MANAGEMENT</div><h3>Create a student or teacher account</h3></div><span className="pill pill-violet">ADMIN ONLY</span></div>{currentUser?.role==='admin' ? <form className="admin-user-form" onSubmit={createSchoolUser}><label>Full name<input required minLength={2} value={newUserName} onChange={(e)=>setNewUserName(e.target.value)} placeholder="Student or teacher name"/></label><label>Email<input required type="email" value={newUserEmail} onChange={(e)=>setNewUserEmail(e.target.value)} placeholder="account@school.edu"/></label><label>Initial password<input required minLength={12} type="password" value={newUserPassword} onChange={(e)=>setNewUserPassword(e.target.value)} placeholder="At least 12 characters"/></label><label>Role<select value={newUserRole} onChange={(e)=>setNewUserRole(e.target.value as 'student'|'teacher')}><option value="student">Student</option><option value="teacher">Teacher</option></select></label><button className="primary-button small">Create account <Plus size={14}/></button></form> : <div className="admin-api-gate"><ShieldCheck size={18}/><span>Sign in with the first administrator account to create real school users. The local preview switch cannot create accounts.</span><button className="text-button" onClick={()=>{setAuthMode('login');setAuthModalOpen(true);}}>Sign in <ChevronRight size={13}/></button></div>}</section>
          <div className="admin-layout"><div className="admin-main"><section className="panel admin-section"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">VISUAL EXPERIENCE</div><h3>Design & rendering</h3></div><span className="pill pill-violet">GLOBAL DEFAULTS</span></div><div className="admin-control"><div><strong>Experience preset</strong><small>Blend premium science platform, futuristic laboratory, interactive museum and university portal.</small></div><select value={uiPreset} onChange={(e) => setUiPreset(e.target.value)}><option value="balanced">Blended experience</option><option value="immersive">Immersive laboratory</option><option value="editorial">Premium editorial</option><option value="classroom">University classroom</option></select></div><div className="admin-control"><div><strong>3D rendering default</strong><small>Cinematic quality is the main experience; teachers can enable adaptive rendering.</small></div><span className="locked-value"><Sparkles size={13} /> Cinematic</span></div><div className="admin-control"><div><strong>Enable 2D diagrams</strong><small>Only the administrator can enable this alternative representation.</small></div><Toggle checked={allow2D} onChange={setAllow2D} /></div><div className="admin-control"><div><strong>Cross-grade content access</strong><small>Let students browse learning material from other classes, subject to their account permissions.</small></div><Toggle checked={allowCrossGrade} onChange={setAllowCrossGrade} /></div><div className="admin-control"><div><strong>Motion & transitions</strong><small>Allow animated interface details and model motion.</small></div><Toggle checked={motionEnabled} onChange={setMotionEnabled} /></div><div className="admin-control"><div><strong>Student theme selection</strong><small>Allow each learner to choose a visual environment.</small></div><Toggle checked={true} onChange={() => setAdminNotice('Theme selection is currently enabled in this prototype.')} /></div></section>
            <section className="panel admin-section"><div className="panel-heading"><div><div className="eyebrow muted-eyebrow">CURRICULUM & PUBLISHING</div><h3>Content governance</h3></div><span className="pill">TEACHER APPROVAL</span></div><div className="admin-control"><div><strong>Board curriculum</strong><small>ICSE Class 10 + ISC Classes 11–12 as the primary course map.</small></div><span className="locked-value">CISCE · 2027</span></div><div className="admin-control"><div><strong>Competitive tracks</strong><small>Keep CBSE, JEE and NEET as distinct optional tracks.</small></div><Toggle checked={true} onChange={() => setAdminNotice('Competitive tracks remain visible as optional extensions.')} /></div><div className="admin-control"><div><strong>User-generated notes and quizzes</strong><small>Submissions remain private or pending until teacher approval.</small></div><Toggle checked={true} onChange={() => setAdminNotice('Teacher approval remains required in this prototype.')} /></div><div className="admin-control"><div><strong>DIY experiment safety review</strong><small>Require safety notes and teacher review before publishing public activities.</small></div><Toggle checked={true} onChange={() => setAdminNotice('Safety review is a required publishing rule in the production design.')} /></div><div className="content-add-form"><div><strong>Add a content draft</strong><small>Creates a local draft entry for the future content management system.</small></div><input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Lesson or experiment title" /><textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Short description or learning objective" rows={2} /><button className="primary-button small" onClick={() => { if (!contentTitle.trim()) { setAdminNotice('Add a title before saving this draft.'); return; } setAdminNotice(`Draft “${contentTitle.trim()}” created locally. Teacher approval is required before publishing.`); setContentTitle(''); setNewContent(''); }}><Plus size={14} /> Save draft</button></div></section></div>
            <aside className="admin-side"><section className="panel admin-quick"><div className="eyebrow muted-eyebrow">PLATFORM SNAPSHOT</div><div className="admin-number-grid"><div><strong>3</strong><span>GRADE LEVELS</span></div><div><strong>{boardLessons.length}</strong><span>AUTHORED BOARD LESSONS</span></div><div><strong>{experimentLibrary.length}</strong><span>EXPERIMENT GUIDES</span></div><div><strong>3</strong><span>SECURE USER ROLES</span></div></div></section><section className="panel admin-themes"><div className="eyebrow muted-eyebrow">PREVIEW A THEME</div><h3>Visual environment</h3><div className="theme-options">{([{ id: 'lab', name: 'Deep laboratory', swatches: ['#121c38', '#7469d9', '#50d6c1'] }, { id: 'minimal', name: 'Minimal studio', swatches: ['#ecf0f6', '#7c8caa', '#81a9a0'] }, { id: 'museum', name: 'Science museum', swatches: ['#1c1731', '#f0a56e', '#9f8aff'] }, { id: 'university', name: 'University', swatches: ['#102a36', '#6fb2ad', '#d9bd83'] }] as { id: ThemeName; name: string; swatches: string[] }[]).map((t) => <button className={`theme-option ${theme === t.id ? 'selected' : ''}`} key={t.id} onClick={() => setTheme(t.id)}><span className="theme-swatches">{t.swatches.map((c) => <i key={c} style={{ background: c }} />)}</span><strong>{t.name}</strong>{theme === t.id && <Check size={14} />}</button>)}</div></section><section className="panel admin-permissions"><div className="eyebrow muted-eyebrow">ACCESS MODEL</div><h3>Role permissions</h3><div className="permission-line"><ShieldCheck size={15} /><div><strong>Administrator</strong><small>Global appearance, access, publishing and platform controls.</small></div></div><div className="permission-line"><Users size={15} /><div><strong>Teacher</strong><small>Cohort analytics, learning settings and content approval.</small></div></div><div className="permission-line"><GraduationCap size={15} /><div><strong>Student</strong><small>Lessons, simulations, practice, notes and personal theme.</small></div></div></section></aside></div>
          {isVersionAtLeast(platformVersion, 'v5') && <V5FeatureLab flags={featureFlags} onToggle={(id, enabled) => void toggleFeatureFlag(id, enabled)} readOnly={currentUser?.role !== 'admin'} saving={featureFlagsBusy} />}
          {featureFlags['prompt-history'] !== false && <PromptVersionManager currentUser={currentUser} onNotice={setAdminNotice} />}
          <V2ResearchMatrix />
          {isVersionAtLeast(platformVersion, 'v3') && <section className="panel admin-section v3-release-note"><div className="eyebrow muted-eyebrow">V3 · WORLD-CLASS LEARNING PREVIEW</div><h3>Scientific model assurance and learning-engine roadmap</h3><p>V3 builds on V2 with provenance cards, reaction-network validation, spectroscopy pathways, mastery diagnostics and teacher-reviewed content. The complete engine remains in phased development; consult the V3 blueprint for acceptance criteria.</p><a href={`${appRootPath}docs/V3_WORLD_CLASS_BLUEPRINT.md`} target="_blank" rel="noreferrer">Read V3 specification <ChevronRight size={13}/></a></section>}
          {isVersionAtLeast(platformVersion, 'v4') && featureFlags['open-science-registry'] !== false && <V4OpenScienceHub rootPath={appRootPath} featureFlags={featureFlags} />}
          {adminNotice && <div className="inline-notice"><Check size={15} /> {adminNotice}<button onClick={() => setAdminNotice('')}><X size={13} /></button></div>}
        </>}
      </div>
      <footer className="app-footer"><div><span className="footer-brand"><Atom size={15} /> chemistryatlas</span><span>Make the invisible understandable.</span></div><div><span>ICSE / ISC · 2027 mapping baseline</span><span className="footer-dot">·</span><span>Free forever · Non-commercial · No ads</span></div></footer>
    </main>

    {featureFlags['cloud-ai-tutor'] !== false && <button className="atlas-help" onClick={() => setAiTutorOpen((v) => !v)} aria-label="Open Atlas tutor"><MessageCircle size={19} /><span>Ask Atlas</span><i /></button>}
    {featureFlags['cloud-ai-tutor'] !== false && aiTutorOpen && <div className="tutor-popover"><div className="tutor-header"><div className="tutor-avatar"><Sparkles size={17}/></div><div><strong>Atlas · AI chemistry tutor</strong><small>{currentUser ? `Signed in as ${currentUser.displayName}` : 'Sign in required for live tutoring'}</small></div><button className="icon-button subtle" onClick={()=>setAiTutorOpen(false)}><X size={15}/></button></div><div className="tutor-body"><div className="tutor-conversation" aria-live="polite">{tutorMessages.length===0 && <div className="tutor-message">Ask me to explain a concept, solve a numerical step by step, compare reaction pathways or quiz you. I’ll adapt to Class {grade} · {track}.</div>}{tutorMessages.map((message,i)=><div key={i} className={`tutor-message ${message.role==='user'?'user-message':''}`}><small>{message.role==='user'?'YOU':'ATLAS'}</small>{message.content}</div>)}{tutorBusy && <div className="tutor-message"><small>ATLAS</small>Thinking through the chemistry…</div>}</div>{tutorError && <div className="tutor-error">{tutorError}</div>}{currentUser ? <form className="tutor-input-row" onSubmit={submitTutorQuestion}><textarea value={tutorInput} onChange={(e)=>setTutorInput(e.target.value)} rows={2} maxLength={1800} placeholder="Ask a chemistry question…"/><button className="primary-button small" disabled={tutorBusy||!tutorInput.trim()}><Send size={14}/></button></form> : <button className="primary-button small tutor-signin" onClick={()=>{setAuthMode('login');setAuthModalOpen(true);}}>Sign in to ask Atlas <LogIn size={14}/></button>}<div className="tutor-disclaimer">AI-generated learning support. Verify important facts and exam answers against official material and your teacher.</div></div></div>}
    {authModalOpen && <div className="modal-backdrop" onClick={()=>setAuthModalOpen(false)}><section className="auth-modal panel" onClick={(e)=>e.stopPropagation()}><div className="auth-modal-header"><div><div className="eyebrow muted-eyebrow">CHEMISTRY ATLAS ACCOUNT</div><h2>{authMode==='bootstrap'?'Create the first administrator':'Welcome back, scientist.'}</h2><p>{authMode==='bootstrap'?'One-time setup for an empty database. The secret token is checked by the server.':'Sign in to sync learning activity, access the AI tutor and submit portfolio work.'}</p></div><button className="icon-button subtle" onClick={()=>setAuthModalOpen(false)}><X size={17}/></button></div><form className="auth-form" onSubmit={handleAuth}>{authMode==='bootstrap' && <><label>School / organisation<input value={authSchool} onChange={(e)=>setAuthSchool(e.target.value)} required placeholder="Your school name"/></label><label>Administrator name<input value={authName} onChange={(e)=>setAuthName(e.target.value)} required placeholder="Full name"/></label><label>One-time bootstrap token<input value={bootstrapToken} onChange={(e)=>setBootstrapToken(e.target.value)} required type="password" placeholder="Set as BOOTSTRAP_ADMIN_TOKEN in Cloudflare"/></label></>}<label>Email<input value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} required type="email" autoComplete="username" placeholder="you@school.edu"/></label><label>Password<input value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} required type="password" autoComplete={authMode==='login'?'current-password':'new-password'} minLength={authMode==='bootstrap'?12:1} placeholder={authMode==='bootstrap'?'At least 12 characters':'Your password'}/></label>{authError && <div className="auth-error">{authError}</div>}<button className="primary-button auth-submit" disabled={authBusy}>{authBusy?'Please wait…':authMode==='bootstrap'?'Create administrator':'Sign in'} <ChevronRight size={15}/></button></form><div className="auth-modal-footer"><span>{authMode==='login'?'Setting up a new school for the first time?':'Already have an account?'}</span><button className="text-button" onClick={()=>{setAuthError('');setAuthMode(authMode==='login'?'bootstrap':'login');}}> {authMode==='login'?'First-time setup':'Back to sign in'}</button></div><small className="auth-api-note">API endpoint: {((import.meta as any).env?.VITE_API_BASE_URL||'same origin')} · Passwords are hashed server-side; AI provider keys never go to the browser.</small></section></div>}
  </div>;
}

function StatCard({ icon, label, value, detail, trend, tone }: { icon: ReactNode; label: string; value: string; detail: string; trend: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><small>{detail}</small><div className="stat-trend"><span>{trend}</span><i>↗</i></div></div>;
}
function ToolCard({ icon, title, subtitle, color, tag, action }: { icon: ReactNode; title: string; subtitle: string; color: string; tag: string; action: () => void }) {
  return <button className="tool-card" onClick={action}><div className={`tool-icon ${color}`}>{icon}</div><div className="tool-tag">{tag}</div><strong>{title}</strong><span>{subtitle}</span><div className="tool-arrow"><ChevronRight size={16} /></div></button>;
}
function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-intro-action">{action}</div>}</div>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <button className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}><span /></button>;
}
function SliderControl({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  const display = Number.isInteger(step) ? value.toFixed(0) : step < 0.01 ? value.toFixed(2) : value.toFixed(2).replace(/0$/, '');
  return <label className="slider-control"><span>{label}</span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /><strong>{display} {suffix}</strong></label>;
}
function GenericExperiment({ expId, concentration, setConcentration, temperature, setTemperature }: { expId: string; concentration: number; setConcentration: (v: number) => void; temperature: number; setTemperature: (v: number) => void }) {
  const exp = experiments.find((e) => e.id === expId) || experiments[1];
  const rate = Math.max(5, Math.min(99, Math.round(concentration * 0.55 + (temperature - 15) * 1.2)));
  return <><div className="generic-lab-visual"><div className="reaction-vessel"><div className="vessel-liquid" style={{ height: `${22 + concentration / 2}%` }} /><div className="particle p-one" /><div className="particle p-two" /><div className="particle p-three" /><div className="particle p-four" /></div><div className="reaction-arrow">→</div><div className="product-vessel"><div className="product-liquid" style={{ height: `${24 + rate / 2}%` }} /><div className="product-glow" /></div><div className="generic-readout"><span>SIMULATED RESPONSE</span><strong>{rate}<small>%</small></strong><em>relative reaction activity</em></div></div><div className="lab-controls"><div className="control-heading"><div><h4>{exp.title} controls</h4><p>Adjust the conditions and compare the system response.</p></div></div><SliderControl label="Relative concentration" value={concentration} min={10} max={100} step={5} suffix="%" onChange={setConcentration} /><SliderControl label="Temperature" value={temperature} min={15} max={80} step={1} suffix="°C" onChange={setTemperature} /><div className="generic-explanation"><Lightbulb size={15} /><span>{expId === 'kinetics' ? 'Higher concentration and temperature generally increase collision frequency and the fraction of particles with sufficient energy. This simplified model is qualitative.' : expId === 'equilibrium' ? 'Changing concentration or temperature can shift the equilibrium position. This teaching model illustrates direction, not a calibrated equilibrium constant.' : expId === 'electrolysis' ? 'Applied potential drives non-spontaneous electrode reactions. Ion identity and electrode material affect the products.' : expId === 'ph' ? 'Indicator colour depends on the pH range and molecular structure of the indicator. Use the separate pH slider as a conceptual guide.' : 'Crystallisation depends on solubility, temperature and evaporation. This visual is a simplified conceptual model.'}</span></div></div></>;
}

export default App;
