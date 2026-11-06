import { Ctx, json, options, requireUser, safeError } from '../../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='GET') return json(request,env,{error:'Method not allowed.'},405);
  try {
    const teacher=await requireUser(request,env,['teacher','admin']);
    const rows=await env.DB.prepare(`SELECT p.id,p.title,p.category,p.body,p.status,p.teacher_feedback,p.created_at,u.display_name AS student_name,
      m.id AS media_id,m.file_name AS media_name,m.content_type AS media_type,m.size_bytes AS media_size
      FROM portfolios p JOIN users u ON u.id=p.user_id LEFT JOIN portfolio_media m ON m.portfolio_id=p.id
      WHERE p.school_id=? ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END,p.created_at DESC,m.created_at ASC LIMIT 300`).bind(teacher.school_id).all<any>();
    const map=new Map<string,any>();
    for(const row of rows.results||[]) { if(!map.has(row.id)) map.set(row.id,{id:row.id,title:row.title,category:row.category,body:row.body,status:row.status,teacher_feedback:row.teacher_feedback,created_at:row.created_at,student_name:row.student_name,attachments:[]}); if(row.media_id) map.get(row.id).attachments.push({id:row.media_id,fileName:row.media_name,contentType:row.media_type,sizeBytes:row.media_size}); }
    return json(request,env,{items:[...map.values()]});
  } catch(e) { return safeError(request,env,e); }
};
