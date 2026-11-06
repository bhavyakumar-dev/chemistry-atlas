import { Ctx, json, options, currentUser } from '../../_lib';
export const onRequest = async ({request,env}:Ctx):Promise<Response> => {
  if(request.method==='OPTIONS') return options(request,env);
  const user=await currentUser(request,env);
  return json(request,env,{user:user?{id:user.id,email:user.email,displayName:user.display_name,role:user.role}:null});
};
