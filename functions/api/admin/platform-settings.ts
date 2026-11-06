import { Ctx, json, options, readJson, requireUser, audit, now, safeError } from '../../_lib';

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  try {
    const user = await requireUser(request, env);
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT setting_value, updated_at FROM platform_settings WHERE school_id=? AND setting_key=? LIMIT 1')
        .bind(user.school_id, 'platform_version').first<{ setting_value: string; updated_at: string }>();
      const allowed = ['v1', 'v2', 'v3', 'v4', 'v5'];
      const saved = row?.setting_value;
      return json(request, env, { platformVersion: allowed.includes(saved || '') ? saved : 'v5', updatedAt: row?.updated_at || null });
    }
    if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
    const admin = await requireUser(request, env, ['admin']);
    const body = await readJson<{ platformVersion: string }>(request, 1000);
    if (!['v1', 'v2', 'v3', 'v4', 'v5'].includes(body.platformVersion)) return json(request, env, { error: 'Platform version must be v1, v2, v3, v4 or v5.' }, 400);
    const timestamp = now();
    await env.DB.prepare(`INSERT INTO platform_settings(school_id,setting_key,setting_value,updated_by,updated_at)
      VALUES(?,?,?,?,?) ON CONFLICT(school_id,setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_by=excluded.updated_by, updated_at=excluded.updated_at`)
      .bind(admin.school_id, 'platform_version', body.platformVersion, admin.id, timestamp).run();
    await audit(env, admin, 'platform_version_changed', body.platformVersion);
    return json(request, env, { ok: true, platformVersion: body.platformVersion, updatedAt: timestamp });
  } catch (error) { return safeError(request, env, error); }
};
