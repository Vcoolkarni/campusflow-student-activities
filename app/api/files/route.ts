import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {users,activities,documents,audit,students,participation} from '@/db/schema';
import {eq} from 'drizzle-orm';
import {canEdit} from '@/lib/model';
import {getActor,checkOrigin,staffScope} from '@/lib/server';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 checkOrigin(req);if(Number(req.headers.get('content-length')||0)>11*1024*1024)return Response.json({error:'Choose a file up to 10 MB.'},{status:413});
 const me=await getActor(req);if(!me)return Response.json({error:'Sign in required.'},{status:401});
 const form=await req.formData(),file=form.get('file'),activity=String(form.get('activity')||''),type=String(form.get('type')||'Report');
 const a=(await getDb().select().from(activities).where(eq(activities.id,activity)))[0];
 if(!a||!canEdit(me,a)||a.status==='Archived')return Response.json({error:'Activity access required.'},{status:403});
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return Response.json({error:'Choose a file up to 10 MB.'},{status:400});
 if(!['Activity report','Attendance sheet','Photograph','Certificate','Brochure','Permission letter','Invitation letter','Feedback report','Bill','Sponsorship document','Newspaper cutting','Social media evidence','Other evidence'].includes(type))return Response.json({error:'Choose a supported evidence type.'},{status:400});
 const allowed:Record<string,string>={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','text/csv':'.csv'};
 if(!allowed[file.type])return Response.json({error:'Supported files: PDF, JPG, PNG and CSV.'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());
 if((file.type==='application/pdf'&&String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')||(file.type==='image/png'&&!(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71))||(file.type==='image/jpeg'&&!(bytes[0]===255&&bytes[1]===216)))return Response.json({error:'The file contents do not match its type.'},{status:400});
 const id=crypto.randomUUID(),key=`evidence/${activity}/${id}${allowed[file.type]}`,created=new Date().toISOString();
 await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:file.type}});
 try{await getDb().batch([getDb().insert(documents).values({id,activity,name:file.name.slice(0,200),type:type.slice(0,100),mime:file.type,size:file.size,key,uploadedBy:me.id,created}),getDb().insert(audit).values({id:crypto.randomUUID(),activity,user:me.name,action:'Uploaded evidence',remarks:file.name.slice(0,200),created})]);}catch(e){await env.BUCKET!.delete(key);throw e;}
 return Response.json({ok:true});
 }catch(e){console.error(e);return Response.json({error:(e as {status?:number}).status?(e as Error).message:'Upload failed. Please try again.'},{status:(e as {status?:number}).status||500});}}
export async function GET(req:Request){try{
 const me=await getActor(req);if(!me)return new Response('Sign in required',{status:401});const id=new URL(req.url).searchParams.get('id')||'';
 const d=(await getDb().select().from(documents).where(eq(documents.id,id)))[0];if(!d)return new Response('File not found',{status:404});
 const a=(await getDb().select().from(activities).where(eq(activities.id,d.activity)))[0];if(!a)return new Response('Activity not found',{status:404});
 if(me.role!=='Student'&&!staffScope(me,a))return new Response('Access denied',{status:403});
 if(me.role==='Student'){const mine=(await getDb().select().from(students)).filter(s=>s.email.toLowerCase()===me.email.toLowerCase());const p=await getDb().select().from(participation).where(eq(participation.activity,a.id));if(!['Activity report','Brochure','Invitation letter'].includes(d.type)||!['Completed','Approved','Archived'].includes(a.status)||!mine.some(s=>p.some(r=>r.student===s.id)))return new Response('Participant access required',{status:403});}
 const f=await env.BUCKET!.get(d.key);if(!f)return new Response('File not found',{status:404});
 return new Response(f.body,{headers:{'Content-Type':d.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }catch(e){return new Response((e as Error).message||'Unable to download file',{status:(e as {status?:number}).status||500});}}
