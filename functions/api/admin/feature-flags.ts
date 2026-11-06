import { Ctx, json, options, readJson, requireUser, audit, now, safeError } from '../../_lib';

const ROLLOUT_IDS = new Set([
  'molecular-studio','molecular-representations','atom-measurements','molecule-evidence-cards',
  'curated-molecule-catalogue','orbital-probability-viewer','virtual-lab-catalogue',
  'ideal-gas-calculator','arrhenius-calculator','dilute-acid-ph','lab-notebook-export',
  'teacher-analytics','cloud-ai-tutor','open-science-registry','bounded-open-data-ingest',
  'prompt-history','molecule-share-links','molecule-json-export','molecule-csv-export','equation-balancer',
]);

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  try {
    const user = await requireUser(request, env);
    if (request.method === 'GET') {
      const rows = await env.DB.prepare('SELECT feature_id,is_enabled,updated_at FROM feature_flag_settings WHERE school_id=?')
        .bind(user.school_id).all<{ feature_id: string; is_enabled: number; updated_at: string }>();
      return json(request, env, { flags: Object.fromEntries((rows.results || []).map((row) => [row.feature_id, row.is_enabled === 1])), updatedAt: rows.results?.reduce((latest, row) => row.updated_at > latest ? row.updated_at : latest, '') || null });
    }
    if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
    const admin = await requireUser(request, env, ['admin']);
    const body = await readJson<{ flags: Record<string, unknown> }>(request, 12_000);
    if (!body.flags || typeof body.flags !== 'object' || Array.isArray(body.flags)) return json(request, env, { error: 'A feature flag map is required.' }, 400);
    const entries = Object.entries(body.flags);
    if (entries.length > 50) return json(request, env, { error: 'A maximum of 50 feature flags can be submitted.' }, 400);
    for (const [id, enabled] of entries) {
      if (!ROLLOUT_IDS.has(id)) return json(request, env, { error: `Feature ${id} is not currently eligible for rollout control.` }, 400);
      if (typeof enabled !== 'boolean') return json(request, env, { error: `Feature ${id} must have a boolean value.` }, 400);
    }
    const timestamp = now();
    const statements = entries.map(([id, enabled]) => env.DB.prepare(`INSERT INTO feature_flag_settings(school_id,feature_id,is_enabled,updated_by,updated_at)
      VALUES(?,?,?,?,?) ON CONFLICT(school_id,feature_id) DO UPDATE SET is_enabled=excluded.is_enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
      .bind(admin.school_id, id, enabled ? 1 : 0, admin.id, timestamp));
    if (statements.length) await env.DB.batch(statements);
    await audit(env, admin, 'feature_flags_updated', `${entries.length} rollout flags updated`);
    return json(request, env, { ok: true, updatedAt: timestamp, count: entries.length });
  } catch (error) { return safeError(request, env, error); }
};
