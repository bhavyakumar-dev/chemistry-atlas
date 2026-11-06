import { Ctx, json, options, readJson, uid, now, normaliseEmail, hashPassword, createSession, setSessionCookie, audit, enforceRateLimit, constantTimeTextEqual, rejectUntrustedBrowserOrigin, safeError } from '../../_lib';


export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
  try {
    const originError = rejectUntrustedBrowserOrigin(request, env); if (originError) return originError;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown-client';
    await enforceRateLimit(env, `bootstrap:${ip}`, 5, 900);
    const body = await readJson<{ token: string; schoolName: string; name: string; email: string; password: string }>(request, 5000);
    if (!env.BOOTSTRAP_ADMIN_TOKEN || typeof body.token !== 'string' || body.token.length > 512
      || !await constantTimeTextEqual(body.token, env.BOOTSTRAP_ADMIN_TOKEN)) {
      return json(request, env, { error: 'Invalid bootstrap token.' }, 403);
    }

    const email = normaliseEmail(body.email || '');
    const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, 80);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || password.length < 12 || password.length > 256) {
      return json(request, env, { error: 'Provide a valid email, a name of at least two characters and a password of 12–256 characters.' }, 400);
    }

    const schoolId = uid();
    const userId = uid();
    const attemptId = uid();
    const timestamp = now();
    const schoolName = (typeof body.schoolName === 'string' ? body.schoolName : 'Chemistry Atlas School').trim().slice(0, 120) || 'Chemistry Atlas School';
    const passwordHash = await hashPassword(password);
    const statements = [
      env.DB.prepare("INSERT INTO bootstrap_guard(id,owner_token,completed_at) VALUES(1,'',NULL) ON CONFLICT(id) DO NOTHING"),
      env.DB.prepare(`UPDATE bootstrap_guard SET owner_token=?,completed_at=?
        WHERE id=1 AND completed_at IS NULL AND NOT EXISTS (SELECT 1 FROM users)`).bind(attemptId, timestamp),
      env.DB.prepare(`INSERT INTO schools(id,name,created_at)
        SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM bootstrap_guard WHERE id=1 AND owner_token=? AND completed_at=?)`)
        .bind(schoolId, schoolName, timestamp, attemptId, timestamp),
      env.DB.prepare(`INSERT INTO users(id,school_id,email,display_name,role,password_hash,created_at)
        SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM bootstrap_guard WHERE id=1 AND owner_token=? AND completed_at=?)`)
        .bind(userId, schoolId, email, name, 'admin', passwordHash, timestamp, attemptId, timestamp),
    ];
    const results = await env.DB.batch(statements);
    if (results[1]?.meta?.changes !== 1 || results[3]?.meta?.changes !== 1) {
      return json(request, env, { error: 'Bootstrap is closed. An administrator already exists or another first-time setup completed first.' }, 409);
    }

    const user = { id: userId, school_id: schoolId, email, display_name: name, role: 'admin' as const };
    const session = await createSession(userId, request, env);
    await audit(env, user, 'bootstrap_admin', 'First administrator created');
    const response = json(request, env, { accessToken: session, user: { id: userId, email, displayName: name, role: 'admin' } }, 201);
    response.headers.append('Set-Cookie', setSessionCookie(request, env, session));
    return response;
  } catch (error) {
    return safeError(request, env, error);
  }
};
