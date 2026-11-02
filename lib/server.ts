import {env} from 'cloudflare:workers';
import {eq} from 'drizzle-orm';
import {getDb} from '@/db';
import {users,students} from '@/db/schema';
import type {User,Activity} from './model';
export class RequestError extends Error{constructor(message:string,public status=400){super(message)}}
export function ensure(condition:unknown,message:string,status=400):asserts condition{if(!condition)throw new RequestError(message,status)}
export function text(value:unknown,max=200){return String(value??'').trim().slice(0,max)}
export function validEmail(s:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s}
export function academicYear(s:string){s=s.replace('-','–');ensure(/^\d{4}–\d{2}$/.test(s)&&Number(s.slice(-2))===(Number(s.slice(0,4))+1)%100,'Enter a consecutive academic year such as 2026–27.');return s}
export function checkOrigin(req:Request){ensure(!req.headers.get('origin')||req.headers.get('origin')===new URL(req.url).origin,'Invalid request origin.',403);ensure(req.headers.get('sec-fetch-site')!=='cross-site','Cross-site requests are not allowed.',403)}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
export function failure(e:unknown){if(e instanceof RequestError)return json({error:e.message},e.status);console.error(e);if(String(e).includes('UNIQUE constraint'))return json({error:'A record with those unique details already exists. Refresh and try again.'},409);return json({error:'The operation could not be completed. Your previous records are preserved. Please try again.'},500)}
export async function getActor(req:Request):Promise<User>{const id=req.headers.get('oai-authenticated-user-id');ensure(id,'Sign in to access your campus workspace.',401);const db=getDb();let me=(await db.select().from(users).where(eq(users.id,id)))[0];
 if(!me){const email=(req.headers.get('oai-authenticated-user-email')||'').trim().toLowerCase();let name=email.split('@')[0]||'Campus member';try{const full=req.headers.get('oai-authenticated-user-full-name');if(full)name=req.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'?decodeURIComponent(full):full}catch{}
 await env.DB!.prepare(`INSERT OR IGNORE INTO users (id,email,name,role,department,active) SELECT ?,?,?,COALESCE((SELECT role FROM account_assignments WHERE email=?),CASE WHEN EXISTS(SELECT 1 FROM users) THEN 'Student' ELSE 'Administrator' END),COALESCE((SELECT department FROM account_assignments WHERE email=?),''),COALESCE((SELECT active FROM account_assignments WHERE email=?),1)`).bind(id,email,name,email,email,email).run();me=(await db.select().from(users).where(eq(users.id,id)))[0];}
 ensure(me?.active,'This account is inactive. Contact your institute administrator.',403);return me;
}
export function staffScope(me:User,a:Activity){if(me.role==='Faculty Coordinator')return a.owner===me.id&&a.department===me.department;if(me.role==='Head of Department')return a.department===me.department;return me.role!=='Student'}
export async function ownStudents(me:User){return (await getDb().select().from(students)).filter(s=>s.email.toLowerCase()===me.email.toLowerCase())}
export function auditValue(activity:string,me:User,action:string,remarks=''){return {id:crypto.randomUUID(),activity,user:me.name,action,remarks,created:new Date().toISOString()}}
