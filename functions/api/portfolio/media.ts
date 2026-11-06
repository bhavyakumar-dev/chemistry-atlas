import { Ctx, corsHeaders, json, options, requireUser, safeError } from '../../_lib';

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  if (request.method !== 'GET') return json(request, env, { error: 'Method not allowed.' }, 405);
  try {
    const user = await requireUser(request, env, ['student', 'teacher', 'admin']);
    if (!env.PORTFOLIOS) return json(request, env, { error: 'Portfolio media storage is not configured.' }, 503);
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id || id.length > 64) return json(request, env, { error: 'A valid media ID is required.' }, 400);
    const media = await env.DB.prepare(`SELECT id,user_id,object_key,file_name,content_type,portfolio_id
      FROM portfolio_media WHERE id=? AND school_id=? LIMIT 1`).bind(id, user.school_id).first<any>();
    if (!media) return json(request, env, { error: 'File not found.' }, 404);
    if (user.role === 'student' && media.user_id !== user.id) return json(request, env, { error: 'You cannot access another student’s file.' }, 403);
    if (user.role !== 'student' && !media.portfolio_id) return json(request, env, { error: 'This file has not been submitted for review.' }, 404);
    const object = await env.PORTFOLIOS.get(media.object_key);
    if (!object) return json(request, env, { error: 'Stored file is unavailable.' }, 404);
    const headers = corsHeaders(request, env);
    headers.set('Content-Type', media.content_type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${String(media.file_name).replace(/["\\\r\n]/g, '_')}"`);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(object.body, { status: 200, headers });
  } catch (error) { return safeError(request, env, error); }
};
