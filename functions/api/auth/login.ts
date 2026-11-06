import { Ctx, json, options, readJson, normaliseEmail, verifyPassword, createSession, setSessionCookie, audit, enforceRateLimit, rejectUntrustedBrowserOrigin, safeError } from '../../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='POST') return json(request,env,{error:'Method not allowed.'},405);
  try {
    const originError = rejectUntrustedBrowserOrigin(request, env); if (originError) return originError;
    const body=await readJson<{email:string;password:string;schoolId?:string}>(request,3000);
    const email=normaliseEmail(body.email||'');
    const password = typeof body.password === 'string' ? body.password : '';
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown-client';
    await enforceRateLimit(env, `login-ip:${ip}`, 40, 900);
    await enforceRateLimit(env,`login:${email}`,8,900);
    if (password.length > 256) return json(request,env,{error:'Email or password is incorrect.'},401);
    const user=await env.DB.prepare(`SELECT id,school_id,email,display_name,role,password_hash,disabled FROM users WHERE email=? ${body.schoolId?'AND school_id=?':''} LIMIT 1`).bind(...(body.schoolId?[email,body.schoolId]:[email])).first<any>();
    if(!user||user.disabled||!await verifyPassword(password,user.password_hash)) return json(request,env,{error:'Email or password is incorrect.'},401);
    const session=await createSession(user.id,request,env); await audit(env,user,'login','');
    const res=json(request,env,{accessToken:session,user:{id:user.id,email:user.email,displayName:user.display_name,role:user.role}});
    res.headers.append('Set-Cookie',setSessionCookie(request,env,session)); return res;
  } catch(e) { return safeError(request, env, e); }
};
