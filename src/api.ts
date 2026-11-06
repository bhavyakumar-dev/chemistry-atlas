export type AtlasRole = 'student' | 'teacher' | 'admin';
export type PlatformVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
export type AtlasUser = { id: string; email: string; displayName: string; role: AtlasRole };
export type AnalyticsPayload = {
  metrics: {
    students: number; active7d: number; events7d: number; quizAttempts30d: number;
    meanQuizAccuracy: number; pendingPortfolioReviews: number;
    topics: { topic: string; grade: string; track: string; attempts: number; accuracy: number }[];
    activity: { type: string; count: number }[];
  };
  cohorts: { grade: string; track: string; learners: number; events: number; accuracy: number; quizAttempts: number }[];
  aiSummary: string; periods: { activityDays: number; quizDays: number }; privacy: string;
};
export type PortfolioItem = {
  id: string; title: string; category: string; body: string; status: 'pending' | 'approved' | 'revision_requested';
  teacher_feedback?: string; created_at: string; student_name?: string;
  attachments?: { id: string; fileName: string; contentType: string; sizeBytes: number }[];
};

const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
const TOKEN_KEY = 'chem-atlas-access-token';
export const getAccessToken = (): string => {
  try { return window.sessionStorage.getItem(TOKEN_KEY) || ''; }
  catch { return ''; }
};
export const setAccessToken = (token: string): void => {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* Storage can be blocked; cookie auth may still work for same-site requests. */ }
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (init.body && !(typeof FormData !== 'undefined' && init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include' });
  } catch {
    throw new Error('Could not reach the Chemistry Atlas API. On GitHub Pages, set VITE_API_BASE_URL to your deployed Cloudflare Pages API URL.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload as T;
}

export const atlasApi = {
  async me() { return request<{ user: AtlasUser | null }>('/api/auth/me'); },
  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; user: AtlasUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setAccessToken(result.accessToken); return result.user;
  },
  async bootstrap(input: { token: string; schoolName: string; name: string; email: string; password: string }) {
    const result = await request<{ accessToken: string; user: AtlasUser }>('/api/auth/bootstrap', { method: 'POST', body: JSON.stringify(input) });
    setAccessToken(result.accessToken); return result.user;
  },
  async logout() { try { await request('/api/auth/logout', { method: 'POST', body: '{}' }); } finally { setAccessToken(''); } },
  async tutor(input: { question: string; grade: string; track: string; chapter: string; history: { role: 'user' | 'assistant'; content: string }[] }) {
    return request<{ answer: string; model: string; disclaimer: string }>('/api/tutor', { method: 'POST', body: JSON.stringify(input) });
  },
  async event(input: { eventType: string; topic?: string; grade?: string; track?: string; score?: number; maxScore?: number; durationSeconds?: number; metadata?: unknown }) {
    return request<{ ok: boolean }>('/api/events', { method: 'POST', body: JSON.stringify(input) });
  },
  async analytics() { return request<AnalyticsPayload>('/api/teacher/analytics'); },
  async myPortfolio() { return request<{ items: PortfolioItem[] }>('/api/portfolio'); },
  async uploadPortfolioFile(file: File) {
    const form = new FormData(); form.append('file', file);
    return request<{ media: { id: string; fileName: string; contentType: string; sizeBytes: number } }>('/api/portfolio/upload', { method: 'POST', body: form });
  },
  async downloadPortfolioFile(id: string) {
    const token = getAccessToken(); const headers = new Headers(); if (token) headers.set('Authorization', `Bearer ${token}`);
    let response: Response;
    try {
      response = await fetch(`${base}/api/portfolio/media?id=${encodeURIComponent(id)}`, { headers, credentials: 'include' });
    } catch {
      throw new Error('Could not reach the portfolio file service. Check the Cloudflare API URL and connection.');
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as { error?: string }));
      throw new Error(payload.error || `File download failed (${response.status}).`);
    }
    return response.blob();
  },
  async submitPortfolio(input: { title: string; category: string; body: string; mediaIds?: string[] }) {
    return request<{ item: PortfolioItem }>('/api/portfolio', { method: 'POST', body: JSON.stringify(input) });
  },
  async reviewQueue() { return request<{ items: PortfolioItem[] }>('/api/teacher/portfolios'); },
  async reviewPortfolio(input: { id: string; status: 'approved' | 'revision_requested'; feedback: string }) {
    return request<{ ok: boolean }>('/api/portfolio/review', { method: 'POST', body: JSON.stringify(input) });
  },
  async createUser(input: { name: string; email: string; password: string; role: 'student' | 'teacher' }) {
    return request<{ user: AtlasUser }>('/api/admin/users', { method: 'POST', body: JSON.stringify(input) });
  },
  async adminPlatformSettings() {
    return request<{ platformVersion: PlatformVersion; updatedAt: string | null }>('/api/admin/platform-settings');
  },
  async saveAdminPlatformVersion(platformVersion: PlatformVersion) {
    return request<{ ok: boolean; platformVersion: PlatformVersion; updatedAt: string }>('/api/admin/platform-settings', { method: 'POST', body: JSON.stringify({ platformVersion }) });
  },
  async adminFeatureFlags() {
    return request<{ flags: Record<string, boolean>; updatedAt: string | null }>('/api/admin/feature-flags');
  },
  async saveAdminFeatureFlags(flags: Record<string, boolean>) {
    return request<{ ok: boolean; count: number; updatedAt: string }>('/api/admin/feature-flags', { method: 'POST', body: JSON.stringify({ flags }) });
  },
  async adminPromptVersions() {
    return request<{ versions: { id: string; prompt_key: string; version: string; title: string; prompt_text: string; change_note: string; is_active: boolean; created_at: string }[] }>('/api/admin/prompt-versions');
  },
  async createAdminPromptVersion(input: { promptKey: string; title: string; promptText: string; changeNote?: string }) {
    return request<{ ok: boolean; version: { id: string; prompt_key: string; version: string; title: string; prompt_text: string; change_note: string; is_active: boolean; created_at: string } }>('/api/admin/prompt-versions', { method: 'POST', body: JSON.stringify({ action: 'create', ...input }) });
  },
  async activateAdminPromptVersion(id: string) {
    return request<{ ok: boolean }>('/api/admin/prompt-versions', { method: 'POST', body: JSON.stringify({ action: 'activate', id }) });
  },
};
