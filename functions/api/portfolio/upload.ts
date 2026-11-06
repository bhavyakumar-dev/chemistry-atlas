import { Ctx, json, options, requireUser, uid, now, safeError, enforceRateLimit, fileSignatureMatches, readBodyBytes } from '../../_lib';

const IMAGE_OR_DOC = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const VIDEO = new Set(['video/mp4', 'video/webm']);
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 100) || 'evidence-file';


export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  if (request.method === 'OPTIONS') return options(request, env);
  if (request.method !== 'POST') return json(request, env, { error: 'Method not allowed.' }, 405);
  try {
    const user = await requireUser(request, env, ['student']);
    await enforceRateLimit(env, `portfolio-upload:${user.id}`, 10, 300);
    if (!env.PORTFOLIOS) return json(request, env, { error: 'Portfolio media storage is not configured. Bind the R2 bucket as PORTFOLIOS.' }, 503);

    const rawBody = await readBodyBytes(request, 26 * 1024 * 1024);
    const boundedHeaders = new Headers(request.headers);
    boundedHeaders.delete('Content-Length');
    const boundedRequest = new Request(request.url, { method: 'POST', headers: boundedHeaders, body: rawBody });
    const form = await boundedRequest.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || typeof (file as File).arrayBuffer !== 'function') return json(request, env, { error: 'Choose a file to upload.' }, 400);
    const item = file as File;
    const isVideo = VIDEO.has(item.type);
    if (!IMAGE_OR_DOC.has(item.type) && !isVideo) return json(request, env, { error: 'Allowed formats: JPG, PNG, WebP, PDF, MP4 and WebM.' }, 415);
    const limit = isVideo ? 25 * 1024 * 1024 : 12 * 1024 * 1024;
    if (item.size < 1 || item.size > limit) return json(request, env, { error: `File exceeds the ${isVideo ? '25 MB' : '12 MB'} limit.` }, 413);

    const fileBytes = await item.arrayBuffer();
    const byteView = new Uint8Array(fileBytes);
    if (!fileSignatureMatches(item.type, byteView)) return json(request, env, { error: 'The file contents do not match the selected file type.' }, 415);
    const id = uid();
    const name = safeName(item.name);
    const objectKey = `${user.school_id}/${user.id}/${id}/${name}`;
    await env.PORTFOLIOS.put(objectKey, fileBytes, {
      httpMetadata: { contentType: item.type },
      customMetadata: { schoolId: user.school_id, userId: user.id, mediaId: id, originalName: name },
    });
    try {
      await env.DB.prepare(`INSERT INTO portfolio_media(id,school_id,user_id,object_key,file_name,content_type,size_bytes,created_at)
        VALUES(?,?,?,?,?,?,?,?)`).bind(id, user.school_id, user.id, objectKey, name, item.type, item.size, now()).run();
    } catch (error) {
      await env.PORTFOLIOS.delete(objectKey).catch(() => undefined);
      throw error;
    }
    return json(request, env, { media: { id, fileName: name, contentType: item.type, sizeBytes: item.size } }, 201);
  } catch (error) { return safeError(request, env, error); }
};
