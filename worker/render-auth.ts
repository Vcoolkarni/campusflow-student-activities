type RenderAuthEnv={
  CAMPUSFLOW_ADMIN_PASSWORD?:string;
  CAMPUSFLOW_SESSION_SECRET?:string;
  CAMPUSFLOW_ADMIN_EMAIL?:string;
  CAMPUSFLOW_ADMIN_NAME?:string;
};

const COOKIE='campusflow_render_session';
const encoder=new TextEncoder();

export async function applyRenderAuth(request:Request,rawEnv:unknown):Promise<Request|Response>{
  const env=rawEnv as RenderAuthEnv;
  if(!env.CAMPUSFLOW_ADMIN_PASSWORD)return request;
  const url=new URL(request.url);
  const publicUrl=publicRequestUrl(request,url);
  if(url.pathname==='/api/health')return Response.json({status:'ok'});
  if(url.pathname==='/signout-with-chatgpt')return redirectWithCookie(publicUrl,'/',expiredCookie());
  if(url.pathname==='/signin-with-chatgpt')return signIn(request,url,env);
  const token=readCookie(request.headers.get('cookie')||'',COOKIE);
  const email=env.CAMPUSFLOW_ADMIN_EMAIL||'admin@campusflow.local';
  if(!env.CAMPUSFLOW_SESSION_SECRET||!token||!(await verifyToken(token,email,env.CAMPUSFLOW_SESSION_SECRET))){
    const target=`${url.pathname}${url.search}`;
    return Response.redirect(new URL(`/signin-with-chatgpt?return_to=${encodeURIComponent(target)}`,publicUrl),302);
  }
  const headers=new Headers(request.headers);
  headers.set('oai-authenticated-user-id',`render:${email.toLowerCase()}`);
  headers.set('oai-authenticated-user-email',email);
  headers.set('oai-authenticated-user-full-name',encodeURIComponent(env.CAMPUSFLOW_ADMIN_NAME||'CampusFlow Administrator'));
  headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');
  return new Request(request,{headers});
}

async function signIn(request:Request,url:URL,env:RenderAuthEnv):Promise<Response>{
  const publicUrl=publicRequestUrl(request,url);
  const returnTo=safeReturnTo(url.searchParams.get('return_to')||'/');
  let error='';
  if(request.method==='POST'){
    const origin=request.headers.get('origin');
    if(origin&&!samePublicOrigin(request,url,origin))return new Response('Invalid request origin.',{status:403});
    const form=await request.formData();
    const password=String(form.get('password')||'');
    const destination=safeReturnTo(String(form.get('return_to')||'/'));
    if(await equalSecret(password,env.CAMPUSFLOW_ADMIN_PASSWORD||'')){
      const email=env.CAMPUSFLOW_ADMIN_EMAIL||'admin@campusflow.local';
      const token=await createToken(email,env.CAMPUSFLOW_SESSION_SECRET||'');
      return redirectWithCookie(publicUrl,destination,`${COOKIE}=${token}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`);
    }
    error='Incorrect administrator password.';
  }else if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  return new Response(loginPage(returnTo,error),{status:error?401:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
}

function loginPage(returnTo:string,error:string){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CampusFlow sign in</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071827;color:#17324d;font:16px Inter,system-ui,sans-serif}.card{width:min(420px,calc(100% - 32px));background:#fff;border-radius:22px;padding:36px;box-shadow:0 24px 70px #0008}.mark{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:#0e766e;color:#fff;font-weight:800;font-size:22px}h1{margin:20px 0 8px;font-size:28px}p{margin:0 0 24px;color:#60758a}.error{padding:12px;border-radius:10px;background:#fff1f2;color:#b42318;margin-bottom:16px}label{display:block;font-weight:700;margin-bottom:8px}input{width:100%;padding:13px 14px;border:1px solid #b7c7d6;border-radius:11px;font:inherit}input:focus{outline:3px solid #86d7cf;border-color:#0e766e}button{width:100%;margin-top:18px;padding:13px;border:0;border-radius:11px;background:#0e766e;color:#fff;font:700 16px inherit;cursor:pointer}small{display:block;margin-top:18px;color:#718397}</style></head><body><main class="card"><div class="mark">CF</div><h1>Welcome to CampusFlow</h1><p>Sign in with the administrator password for this Render deployment.</p>${error?`<div class="error" role="alert">${escapeHtml(error)}</div>`:''}<form method="post"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><label for="password">Administrator password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Sign in</button></form><small>Student Activity Management and Reporting System</small></main></body></html>`}

function safeReturnTo(value:string){if(!value.startsWith('/')||value.startsWith('//'))return'/';try{const u=new URL(value,'https://app.local');return u.origin==='https://app.local'?`${u.pathname}${u.search}${u.hash}`:'/'}catch{return'/'}}
function publicRequestUrl(request:Request,url:URL){const host=(request.headers.get('x-forwarded-host')||request.headers.get('host')||url.host).split(',')[0].trim();const protocol=(request.headers.get('x-forwarded-proto')||url.protocol).split(',')[0].trim().replace(/:$/,'');if(!host||!['http','https'].includes(protocol))return url;return new URL(`${url.pathname}${url.search}`,`${protocol}://${host}`)}
function samePublicOrigin(request:Request,url:URL,origin:string){try{return new URL(origin).origin===publicRequestUrl(request,url).origin}catch{return false}}
function redirectWithCookie(base:URL,path:string,cookie:string){return new Response(null,{status:302,headers:{Location:new URL(path,base).toString(),'Set-Cookie':cookie,'Cache-Control':'no-store'}})}
function expiredCookie(){return`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`}
function readCookie(header:string,name:string){for(const part of header.split(';')){const [key,...rest]=part.trim().split('=');if(key===name)return rest.join('=')}return''}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
function base64url(bytes:Uint8Array){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return base64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value))))}
async function createToken(email:string,secret:string){const payload=base64url(encoder.encode(JSON.stringify({email,expires:Date.now()+604800000})));return`${payload}.${await signature(payload,secret)}`}
async function verifyToken(token:string,email:string,secret:string){const [payload,sig,extra]=token.split('.');if(!payload||!sig||extra)return false;if(!(await equalSecret(sig,await signature(payload,secret))))return false;try{const normalized=payload.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(payload.length/4)*4,'=');const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized),c=>c.charCodeAt(0))));return data.email===email&&Number(data.expires)>Date.now()}catch{return false}}
async function equalSecret(a:string,b:string){const [da,db]=await Promise.all([a,b].map(v=>crypto.subtle.digest('SHA-256',encoder.encode(v))));const aa=new Uint8Array(da),bb=new Uint8Array(db);let diff=aa.length^bb.length;for(let i=0;i<aa.length;i++)diff|=aa[i]^(bb[i]||0);return diff===0}
