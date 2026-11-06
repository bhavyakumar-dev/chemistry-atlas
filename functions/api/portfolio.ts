import { Ctx, json, options, readJson, requireUser, uid, now, logEvent, safeError } from '../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  try {
    const user=await requireUser(request,env,['student','teacher','admin']);
    if(request.method==='GET') {
      const rows=await env.DB.prepare(`SELECT p.id,p.title,p.category,p.body,p.status,p.teacher_feedback,p.created_at,p.updated_at,
        m.id AS media_id,m.file_name AS media_name,m.content_type AS media_type,m.size_bytes AS media_size
        FROM portfolios p LEFT JOIN portfolio_media m ON m.portfolio_id=p.id
        WHERE p.user_id=? ORDER BY p.created_at DESC,m.created_at ASC LIMIT 300`).bind(user.id).all<any>();
      const map=new Map<string,any>();
      for(const row of rows.results||[]) { if(!map.has(row.id)) map.set(row.id,{id:row.id,title:row.title,category:row.category,body:row.body,status:row.status,teacher_feedback:row.teacher_feedback,created_at:row.created_at,updated_at:row.updated_at,attachments:[]}); if(row.media_id) map.get(row.id).attachments.push({id:row.media_id,fileName:row.media_name,contentType:row.media_type,sizeBytes:row.media_size}); }
      return json(request,env,{items:[...map.values()]});
    }
    if(request.method==='POST') {
      if(user.role!=='student') return json(request,env,{error:'Only student accounts can submit portfolio work.'},403);
      const body=await readJson<{title:string;category:string;body:string;mediaIds?:string[]}>(request,18_000);
      const title=(typeof body.title === 'string' ? body.title : '').trim();
      const content=(typeof body.body === 'string' ? body.body : '').trim();
      const category=(typeof body.category === 'string' ? body.category : 'project').trim().slice(0,40) || 'project';
      if(title.length<3||title.length>120||content.length<20||content.length>12_000) return json(request,env,{error:'Title must be 3–120 characters; portfolio text must be 20–12,000 characters.'},400);
      if (body.mediaIds !== undefined && (!Array.isArray(body.mediaIds) || body.mediaIds.length > 8 || body.mediaIds.some((value) => typeof value !== 'string' || value.length < 1 || value.length > 64))) return json(request,env,{error:'Attach at most eight valid portfolio media IDs.'},400);
      const mediaIds=[...new Set(body.mediaIds || [])];
      if (mediaIds.length !== (body.mediaIds || []).length) return json(request,env,{error:'Duplicate portfolio media IDs are not accepted.'},400);
      for(const mediaId of mediaIds) { const owned=await env.DB.prepare('SELECT id FROM portfolio_media WHERE id=? AND user_id=? AND school_id=? AND portfolio_id IS NULL').bind(mediaId,user.id,user.school_id).first<{id:string}>(); if(!owned) return json(request,env,{error:'One of the selected portfolio files is invalid or already attached.'},400); }
      const id=uid(); const time=now();
      const insertSql = mediaIds.length
        ? `INSERT INTO portfolios(id,school_id,user_id,title,category,body,status,created_at,updated_at)
           SELECT ?,?,?,?,?,?,'pending',?,? WHERE (SELECT COUNT(*) FROM portfolio_media WHERE id IN (${mediaIds.map(() => '?').join(',')}) AND user_id=? AND school_id=? AND portfolio_id IS NULL)=?`
        : `INSERT INTO portfolios(id,school_id,user_id,title,category,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?, 'pending',?,?)`;
      const insertValues = mediaIds.length
        ? [id,user.school_id,user.id,title,category,content,time,time,...mediaIds,user.id,user.school_id,mediaIds.length]
        : [id,user.school_id,user.id,title,category,content,time,time];
      const statements = [env.DB.prepare(insertSql).bind(...insertValues), ...mediaIds.map((mediaId) => env.DB.prepare('UPDATE portfolio_media SET portfolio_id=? WHERE id=? AND user_id=? AND school_id=? AND portfolio_id IS NULL').bind(id,mediaId,user.id,user.school_id))];
      const results = await env.DB.batch(statements);
      if (results[0]?.meta?.changes !== 1) return json(request,env,{error:'One of the selected files was attached by another submission. Refresh your portfolio and try again.'},409);
      await logEvent(env,user,{eventType:'portfolio_submitted',topic:title,metadata:{category}});
      return json(request,env,{item:{id,title,category,status:'pending',created_at:time,attachments:mediaIds}},201);
    }
    return json(request,env,{error:'Method not allowed.'},405);
  } catch(e) { return safeError(request,env,e); }
};
