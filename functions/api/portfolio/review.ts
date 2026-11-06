import { Ctx, json, options, readJson, requireUser, now, audit, safeError } from '../../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='POST') return json(request,env,{error:'Method not allowed.'},405);
  try {
    const teacher=await requireUser(request,env,['teacher','admin']);
    const body=await readJson<{id:string;status:'approved'|'revision_requested';feedback:string}>(request,3000);
    if(typeof body.id !== 'string' || !body.id || body.id.length > 64 || !['approved','revision_requested'].includes(body.status) || (body.feedback !== undefined && typeof body.feedback !== 'string')) return json(request,env,{error:'Invalid review decision.'},400);
    const result=await env.DB.prepare('UPDATE portfolios SET status=?,teacher_feedback=?,reviewed_by=?,updated_at=? WHERE id=? AND school_id=?').bind(body.status,(typeof body.feedback === 'string' ? body.feedback : '').slice(0,1000),teacher.id,now(),body.id,teacher.school_id).run();
    if(!result.meta.changes) return json(request,env,{error:'Portfolio item not found in your school.'},404);
    await audit(env,teacher,'portfolio_review',`${body.id}:${body.status}`);
    return json(request,env,{ok:true});
  } catch(e) { return safeError(request,env,e); }
};
