import { Ctx, json, options, readJson, requireUser, logEvent, safeError, enforceRateLimit } from '../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='POST') return json(request,env,{error:'Method not allowed.'},405);
  try {
    const user=await requireUser(request,env,['student','teacher']);
    await enforceRateLimit(env,`events:${user.id}`,90,60);
    const body=await readJson<any>(request,6000);
    await logEvent(env,user,body);
    return json(request,env,{ok:true});
  } catch(e) { return safeError(request,env,e); }
};
