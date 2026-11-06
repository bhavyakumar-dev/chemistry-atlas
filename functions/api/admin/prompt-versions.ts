import { Ctx, json, options, readJson, requireUser, audit, now, safeError, uid } from '../../_lib';

type PromptRow = { id: string; prompt_key: string; version_major: number; version_minor: number; title: string; prompt_text: string; change_note: string; is_active: number; created_at: string };

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  try {
    const admin = await requireUser(request, env, ['admin']);
    if (request.method === 'GET') {
      const result = await env.DB.prepare(`SELECT id,prompt_key,version_major,version_minor,title,prompt_text,change_note,is_active,created_at
        FROM prompt_versions WHERE school_id=? ORDER BY prompt_key,version_major DESC,version_minor DESC LIMIT 500`)
        .bind(admin.school_id).all<PromptRow>();
      return json(request, env, { versions: (result.results || []).map((row) => ({ ...row, is_active: Boolean(row.is_active), version: `${row.version_major}.${row.version_minor}` })) });
    }
    if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
    const body = await readJson<{ action: 'create' | 'activate'; id?: string; promptKey?: string; title?: string; promptText?: string; changeNote?: string }>(request, 24_000);
    if (body.action === 'activate') {
      if (!body.id) return json(request, env, { error: 'A version ID is required.' }, 400);
      const row = await env.DB.prepare('SELECT id,prompt_key FROM prompt_versions WHERE id=? AND school_id=? LIMIT 1').bind(body.id, admin.school_id).first<{ id: string; prompt_key: string }>();
      if (!row) return json(request, env, { error: 'Prompt version not found.' }, 404);
      await env.DB.batch([
        env.DB.prepare('UPDATE prompt_versions SET is_active=0 WHERE school_id=? AND prompt_key=?').bind(admin.school_id, row.prompt_key),
        env.DB.prepare('UPDATE prompt_versions SET is_active=1 WHERE id=? AND school_id=?').bind(body.id, admin.school_id),
      ]);
      await audit(env, admin, 'prompt_version_activated', `${row.prompt_key}:${body.id}`);
      return json(request, env, { ok: true });
    }
    if (body.action !== 'create') return json(request, env, { error: 'Unsupported prompt action.' }, 400);
    const promptKey = (typeof body.promptKey === 'string' ? body.promptKey : '').trim().toUpperCase();
    const title = (typeof body.title === 'string' ? body.title : '').trim();
    const promptText = (typeof body.promptText === 'string' ? body.promptText : '').trim();
    const changeNote = (typeof body.changeNote === 'string' ? body.changeNote : '').trim();
    if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(promptKey) || title.length < 3 || promptText.length < 10 || promptText.length > 20000) {
      return json(request, env, { error: 'Enter a valid prompt key, title and prompt text (10–20,000 characters).' }, 400);
    }
    const latest = await env.DB.prepare(`SELECT version_major,version_minor FROM prompt_versions
      WHERE school_id=? AND prompt_key=? ORDER BY version_major DESC,version_minor DESC LIMIT 1`)
      .bind(admin.school_id, promptKey).first<{ version_major: number; version_minor: number }>();
    const major = latest?.version_major ?? 1;
    const minor = latest ? latest.version_minor + 1 : 0;
    const id = uid(); const timestamp = now();
    await env.DB.batch([
      env.DB.prepare('UPDATE prompt_versions SET is_active=0 WHERE school_id=? AND prompt_key=?').bind(admin.school_id, promptKey),
      env.DB.prepare(`INSERT INTO prompt_versions(id,school_id,prompt_key,version_major,version_minor,title,prompt_text,change_note,is_active,created_by,created_at)
        VALUES(?,?,?,?,?,?,?,?,1,?,?)`).bind(id, admin.school_id, promptKey, major, minor, title, promptText, changeNote.slice(0, 1000), admin.id, timestamp),
    ]);
    await audit(env, admin, 'prompt_version_created', `${promptKey}:${major}.${minor}`);
    return json(request, env, { ok: true, version: { id, prompt_key: promptKey, version_major: major, version_minor: minor, version: `${major}.${minor}`, title, prompt_text: promptText, change_note: changeNote, is_active: true, created_at: timestamp } }, 201);
  } catch (error) { return safeError(request, env, error); }
};
