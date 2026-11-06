import { Ctx, json, options, cookieValue, clearSessionCookie } from '../../_lib';
const enc=new TextEncoder();
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='POST') return json(request,env,{error:'Method not allowed.'},405);
  const bearer=request.headers.get('Authorization')||'';
  const token=bearer.startsWith('Bearer ')?bearer.slice(7):cookieValue(request);
  if(token) {
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();
  }
  const res=json(request,env,{ok:true}); res.headers.append('Set-Cookie',clearSessionCookie()); return res;
};
