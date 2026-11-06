import { Ctx, json, options, readJson, requireUser, uid, now, normaliseEmail, hashPassword, audit, safeError } from '../../_lib';

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
  try {
    const admin = await requireUser(request, env, ['admin']);
    const body = await readJson<{ name: string; email: string; password: string; role: 'student' | 'teacher' }>(request, 5000);
    const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, 80);
    const email = normaliseEmail(body.email);
    const role = body.role;
    const password = typeof body.password === 'string' ? body.password : '';
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !['student', 'teacher'].includes(role) || password.length < 12 || password.length > 256) {
      return json(request, env, { error: 'Provide a name, valid email, student/teacher role and password of 12–256 characters.' }, 400);
    }
    const existing = await env.DB.prepare('SELECT id FROM users WHERE school_id=? AND email=? LIMIT 1').bind(admin.school_id, email).first<{ id: string }>();
    if (existing) return json(request, env, { error: 'An account with this email already exists in this school.' }, 409);
    const id = uid();
    await env.DB.prepare('INSERT INTO users(id,school_id,email,display_name,role,password_hash,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(id, admin.school_id, email, name, role, await hashPassword(password), now()).run();
    await audit(env, admin, 'account_created', `${role}:${email}`);
    return json(request, env, { user: { id, email, displayName: name, role } }, 201);
  } catch (error) { return safeError(request, env, error); }
};
