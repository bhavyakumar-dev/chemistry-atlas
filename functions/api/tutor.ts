import { Ctx, json, options, readJson, requireUser, logEvent, safeError, enforceRateLimit, buildTutorMessages } from '../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  if(request.method!=='POST') return json(request,env,{error:'Method not allowed.'},405);
  try {
    const user=await requireUser(request,env,['student','teacher','admin']);
    await enforceRateLimit(env,`tutor:${user.id}`,12,60);
    if(!env.AI) return json(request,env,{error:'AI service is not configured. Bind Workers AI as AI in the Cloudflare Pages project.'},503);
    const body=await readJson<{question:string;grade?:string;track?:string;chapter?:string;history?:{role:'user'|'assistant';content:string}[]}>(request,7000);
    const question=(typeof body.question === 'string' ? body.question : '').trim();
    if(question.length<2||question.length>1800) return json(request,env,{error:'Question must contain 2–1,800 characters.'},400);
    const messages = buildTutorMessages({ question, grade: body.grade, track: body.track, chapter: body.chapter, history: body.history });
    const result=await env.AI.run(env.AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fp8',{messages,max_tokens:900,temperature:0.25});
    const answer=result?.response||result?.choices?.[0]?.message?.content||result?.result?.response||'';
    if(!answer) return json(request,env,{error:'The AI service returned no answer. Try again or review the AI model binding.'},502);
    await logEvent(env,user,{eventType:'tutor_question',topic:typeof body.chapter === 'string' ? body.chapter : 'general',grade:typeof body.grade === 'string' ? body.grade : undefined,track:typeof body.track === 'string' ? body.track : undefined,metadata:{questionLength:question.length}});
    return json(request,env,{answer:String(answer),model:env.AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fp8',disclaimer:'AI-generated explanation: verify exam-critical details against your official syllabus and teacher.'});
  } catch(e) { return safeError(request,env,e); }
};
