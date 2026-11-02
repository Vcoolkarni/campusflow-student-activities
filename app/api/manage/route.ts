import { env } from 'cloudflare:workers';
import { getDb } from '@/db';
import { activities,users,students,participation,documents,departments,audit,masterData,faculty,resources,activityTargets,activityFaculty,activityResources,invitations,approvals,feedback } from '@/db/schema';
import { eq,and } from 'drizzle-orm';
import { canEdit,canReview,categories,types,roles,resolveMasters,options,type User,type Activity } from '@/lib/model';
import {getActor,staffScope,checkOrigin,json,failure,ensure,text,validDate,academicYear,auditValue} from '@/lib/server';
export const dynamic='force-dynamic';
const uid=()=>crypto.randomUUID(), now=()=>new Date().toISOString();
const fail=(message:string,status=400)=>Response.json({error:message},{status});
function log(a:string,me:User,action:string,remarks=''){return getDb().insert(audit).values(auditValue(a,me,action,remarks));}
export async function GET(req:Request){try{
 const me=await getActor(req),db=getDb();const [all,ss0,pp0,docs,uu,deps,logs,mm,ff,rr,tt,fl,rl,assignments,reviews,fb]=await Promise.all([db.select().from(activities),db.select().from(students),db.select().from(participation),db.select({id:documents.id,activity:documents.activity,name:documents.name,type:documents.type,mime:documents.mime,size:documents.size,created:documents.created}).from(documents),me.role==='Administrator'?db.select().from(users):Promise.resolve([]),db.select().from(departments),me.role==='Student'?Promise.resolve([]):db.select().from(audit),db.select().from(masterData),db.select().from(faculty),db.select().from(resources),db.select().from(activityTargets),db.select().from(activityFaculty),db.select().from(activityResources),me.role==='Administrator'?db.select().from(invitations):Promise.resolve([]),db.select().from(approvals),db.select().from(feedback)]);
 const mine=ss0.filter(s=>s.email.toLowerCase()===me.email.toLowerCase()),mineIds=new Set(mine.map(s=>s.id));
 const aa=all.filter(a=>me.role==='Student'?(['Approved','Completed','Archived'].includes(a.status)&&(mine.some(s=>s.department===a.department)||pp0.some(p=>p.activity===a.id&&mineIds.has(p.student)))):staffScope(me,a)),ids=new Set(aa.map(a=>a.id));
 const pp=pp0.filter(p=>ids.has(p.activity)&&(me.role!=='Student'||mineIds.has(p.student))),participantIds=new Set(pp.map(p=>p.student));
 const ss=me.role==='Student'?mine:ss0.filter(s=>!['Head of Department','Faculty Coordinator'].includes(me.role)||s.department===me.department||participantIds.has(s.id));
 const studentActivityIds=new Set(pp.map(p=>p.activity));
 return json({me,activities:aa,students:ss,participation:pp,documents:docs.filter(d=>ids.has(d.activity)&&(me.role!=='Student'||studentActivityIds.has(d.activity)&&['Activity report','Brochure','Invitation letter'].includes(d.type))),users:uu,departments:deps,audit:logs.filter(e=>ids.has(e.activity)||!e.activity&&['Administrator','IQAC Coordinator','Management'].includes(me.role)),masters:resolveMasters(mm),faculty:me.role==='Student'?[]:ff.filter(f=>!['Head of Department','Faculty Coordinator'].includes(me.role)||f.department===me.department),resources:me.role==='Student'?[]:rr,targets:tt.filter(t=>ids.has(t.activity)),facultyLinks:me.role==='Student'?[]:fl.filter(l=>ids.has(l.activity)),resourceLinks:me.role==='Student'?[]:rl.filter(l=>ids.has(l.activity)),assignments,approvals:me.role==='Student'?[]:reviews.filter(r=>ids.has(r.activity)),feedback:fb.filter(f=>ids.has(f.activity)&&(me.role!=='Student'||mineIds.has(f.student)))});
 }catch(e){return failure(e)}}
export async function POST(req:Request){try{
 checkOrigin(req);
 const me=await getActor(req);
 const db=getDb();let b:Record<string,any>;try{b=await req.json() as Record<string,any>}catch{return fail('Send valid JSON.')}if(!b||typeof b!=='object'||Array.isArray(b))return fail('Invalid request.');const action=b.action;
 if(action==='seed'){
 if(me.role!=='Administrator')return fail('Administrator access required.',403);
 if((await db.select().from(activities)).length||(await db.select().from(students)).length||(await db.select().from(departments)).length)return fail('Sample data is available only for an empty workspace.');
 const deps=[['CSE','Computer Science'],['IT','Information Technology'],['ECE','Electronics & Communication'],['ME','Mechanical Engineering'],['CE','Civil Engineering'],['MBA','Management Studies']];
 const names=['Aarav Sharma','Ananya Deshmukh','Vihaan Patel','Isha Kulkarni','Arjun Reddy','Diya Nair','Aditya Joshi','Saanvi Shah','Rohan Mehta','Kavya Iyer','Krish Verma','Meera Rao','Ishaan Gupta','Aditi Singh','Vivaan Kumar','Tara Menon','Dev Malhotra','Nisha Jain'];
 const ss=names.map((name,i)=>({id:uid(),name,prn:`2026${String(i+1).padStart(5,'0')}`,email:name.toLowerCase().replaceAll(' ','.')+'@example.edu',department:deps[i%6][0],class:['FY','SY','TY','Final Year'][i%4],division:i%2?'B':'A',semester:i%2?'II':'I',year:'2026–27'}));
 const specs=[['AI & Machine Learning Bootcamp','Technical','Workshop','CSE','2026-10-28', 'Completed','Dr. Priya Sharma','Innovation Lab'],['Design Thinking for Innovators','Skill Development','Workshop','IT','2026-10-26','Submitted','Prof. Rahul Desai','Seminar Hall A'],['Interdepartmental Sports Meet','Sports','Competition','ME','2026-10-24','Completed','Prof. Amit Patil','Sports Ground'],['Industry Connect: Future of IoT','Academic','Guest Lecture','ECE','2026-10-22','Verified','Dr. Neha Kulkarni','Auditorium'],['Campus Hackathon 2026','Technical','Hackathon','CSE','2026-11-06','Approved','Dr. Priya Sharma','Innovation Hub'],['Expressions: Cultural Evening','Cultural','Club Activity','MBA','2026-11-10','Submitted','Prof. Sneha Rao','Open Amphitheatre'],['Green Campus, Better Tomorrow','Social','Outreach','CE','2026-11-14','Draft','Prof. Vivek Joshi','Campus Garden'],['Cloud Computing Essentials','Technical','Certification Course','IT','2026-10-18','Completed','Prof. Rahul Desai','Computer Lab 2'],['Research to Real-World Impact','Research','Seminar','ECE','2026-09-15','Completed','Dr. Neha Kulkarni','Conference Hall'],['Career Ready: Interview Skills','Placement','Training','MBA','2026-09-20','Completed','Prof. Sneha Rao','Seminar Hall B'],['Robotics & Automation Showcase','Technical','Project Exhibition','ME','2026-08-21','Completed','Prof. Amit Patil','Workshop Block'],['Sustainable Cities Symposium','Academic','Seminar','CE','2026-07-24','Completed','Prof. Vivek Joshi','Auditorium']];
 const aa=specs.map((s,i)=>({id:uid(),title:s[0],category:s[1],type:s[2],department:s[3],start:s[4],end:s[4],status:s[5],coordinator:s[6],venue:s[7],year:'2026–27',semester:'I',class:'TY',division:'A',mode:i%3?'Offline':'Hybrid',resource:['Dr. Anil Mehta','Ms. Riya Kapoor','Mr. Sanjay Rao'][i%3],organization:'Industry & Academic Partners',objective:'Build practical skills through hands-on learning and expert guidance.',description:'A collaborative learning experience bringing students and experts together.',outcome:s[5]==='Completed'?'Students demonstrated applied learning through guided projects and interactive sessions.':'',budget:5000+i*1200,owner:me.id,created:now()}));
 const pp=aa.flatMap((a,i)=>ss.filter((_,j)=>(j+i)%3!==0).map((s,j)=>({id:uid(),activity:a.id,student:s.id,attendance:a.status==='Completed'?(j%5?'Present':'Absent'):'Registered',responsibility:j===0?'Volunteer':'Participant',achievement:j===1&&a.type==='Competition'?'First place':'',certificate:a.status==='Completed'?`CF-26-${i+1}-${j+1}`:''})));
 await db.batch([db.insert(departments).values(deps.map(d=>({id:uid(),code:d[0],name:d[1]}))),...ss.map(s=>db.insert(students).values(s)),...aa.map(a=>db.insert(activities).values(a)),...pp.map(p=>db.insert(participation).values(p)),db.insert(audit).values({id:uid(),activity:'',user:me.name,action:'Loaded sample workspace',remarks:'Illustrative data for exploration',created:now()})]);return Response.json({ok:true});
 }
 if(action==='activity'){
 const existing=b.id?(await db.select().from(activities).where(eq(activities.id,b.id)))[0]:undefined;
 if(b.id&&!existing)return fail('Activity not found.',404);
 if(!canEdit(me,existing))return fail('You cannot edit this activity.',403);
 if(existing&&!['Draft','Rejected'].includes(existing.status))return fail('Only drafts and returned activities can be edited.');
 const v=b.values||{};const fields=['title','category','type','department','year','semester','class','division','start','end','venue','mode','coordinator','resource','organization','objective','outcome','description','sponsor'];
 const clean:any=Object.fromEntries(fields.map(k=>[k,String(v[k]||'').trim().slice(0,4000)]));
 if(['title','department','year','type','start','end','coordinator','venue'].some(k=>!clean[k]))return fail('Complete all required fields.');
 if(me.role!=='Administrator'&&clean.department!==me.department)return fail('Select your assigned department.',403);
 if(![clean.start,clean.end].every((d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)||clean.start>clean.end)return fail('Enter a valid date range.');
 const masters=resolveMasters(await db.select().from(masterData));if(!options({masters},'Category',clean.department,existing?.category).includes(clean.category)||!options({masters},'Activity type',clean.department,existing?.type).includes(clean.type)||!['Online','Offline','Hybrid'].includes(clean.mode))return fail('Invalid category, type or mode.');const typeMaster=masters.find(m=>m.kind==='Activity type'&&m.name===clean.type&&m.active);if(typeMaster?.parent&&typeMaster.parent!==clean.category)return fail('Choose an activity type in the selected category.');for(const [field,kind]of [['semester','Semester'],['class','Class'],['division','Division']])if(!options({masters},kind,clean.department,existing?.[field as 'semester'|'class'|'division']).includes(clean[field]))return fail('Choose a valid '+field+'.');
 if(!(await db.select().from(departments)).some(d=>d.code===clean.department&&(d.active||existing?.department===d.code)))return fail('Select an existing department.');
 
 clean.year=academicYear(clean.year);ensure(options({masters},'Academic year','',existing?.year).includes(clean.year),'Define this academic year in Academic setup first.');
 const duplicate=(await db.select().from(activities)).find(a=>a.id!==b.id&&a.title.toLowerCase()===clean.title.toLowerCase()&&a.start===clean.start&&a.department===clean.department);if(duplicate)return fail('This activity already exists for that department and date.');
 clean.duplicateKey=JSON.stringify([clean.title.toLowerCase(),clean.department,clean.start]);
 clean.budget=Number(v.budget||0);if(!Number.isSafeInteger(clean.budget)||clean.budget<0||clean.budget>1000000000)return fail('Budget must be a positive number or zero.');
 const id=b.id||uid();await db.batch([existing?db.update(activities).set(clean).where(eq(activities.id,id)):db.insert(activities).values({...clean,id,status:'Draft',owner:me.id,created:now()}),db.insert(audit).values(auditValue(id,me,existing?'Updated activity':'Created activity'))]);return Response.json({ok:true,id});
 }
 if(action==='outcome'){
 const a=(await db.select().from(activities).where(eq(activities.id,b.id)))[0];if(!a||!canEdit(me,a))return fail('Activity access required.',403);if(a.status==='Archived')return fail('Completed and archived participation records are read-only.');const outcome=String(b.outcome||'').trim().slice(0,4000);await db.batch([db.update(activities).set({outcome}).where(eq(activities.id,a.id)),db.insert(audit).values({id:uid(),activity:a.id,user:me.name,action:'Updated learning outcomes',remarks:'',created:now()})]);return Response.json({ok:true});
 }
 if(action==='transition'){
 const a=(await db.select().from(activities).where(eq(activities.id,b.id)))[0];if(!a)return fail('Activity not found.',404);
 const allowed:Record<string,string[]>={Draft:['Submitted'],Rejected:['Submitted'],Submitted:['Verified','Rejected'],Verified:['Approved','Rejected'],Approved:['Completed'],Completed:['Archived']};
 if(!allowed[a.status]?.includes(b.status))return fail('This workflow transition is unavailable.');
 if(['Submitted','Completed','Archived'].includes(b.status)?!canEdit(me,a):!canReview(me,a))return fail('You do not have permission for this action.',403);
 const remarks=text(b.remarks,2000);if(b.status==='Rejected'&&!remarks)return fail('Enter a reason for returning this activity.');
 if(b.status==='Submitted'&&!a.objective.trim())return fail('Record the activity objectives before submission.');
 if(b.status==='Completed'){if(!a.outcome.trim())return fail('Record the learning outcomes before marking the activity completed.');const ps=await db.select().from(participation).where(eq(participation.activity,a.id));if(ps.some(p=>p.attendance==='Registered'))return fail('Finish recording attendance before completing this activity.');}
 const created=now();const result=await env.DB!.batch([
 env.DB!.prepare('INSERT INTO activity_approvals (id,activity,reviewer,from_status,to_status,remarks,created) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM activities WHERE id=? AND status=?)').bind(uid(),a.id,me.name,a.status,b.status,remarks,created,a.id,a.status),
 env.DB!.prepare('UPDATE activities SET status=? WHERE id=? AND status=?').bind(b.status,a.id,a.status),
 env.DB!.prepare('INSERT INTO audit (id,activity,user,action,remarks,created) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(uid(),a.id,me.name,b.status,remarks,created)]);
 if(result[1].meta.changes!==1)return fail('Another reviewer changed this record. Refresh before continuing.',409);return json({ok:true});
 }
 if(action==='students'){
 if(!['Administrator','Faculty Coordinator','Head of Department'].includes(me.role))return fail('Student management permission required.',403);
 const rows=b.rows;if(!Array.isArray(rows)||!rows.length||rows.length>500)return fail('Provide 1–500 students.');
 const known=await db.select().from(students),deps=await db.select().from(departments);const seen=new Set<string>();
 const vals=[];for(const r of rows){const v:any={};for(const k of ['name','prn','email','department','class','division','semester','year'])v[k]=String(r[k]||'').trim().slice(0,200);
 if(Object.values(v).some(x=>!x)||!/^\S+@\S+\.\S+$/.test(v.email))return fail('Every student needs all fields and a valid email.');
 if(seen.has(v.prn)||known.some(s=>s.prn===v.prn&&s.id!==b.id))return fail('PRN must be unique: '+v.prn);seen.add(v.prn);
 v.year=academicYear(v.year);const masters=resolveMasters(await db.select().from(masterData));for(const [field,kind]of [['year','Academic year'],['semester','Semester'],['class','Class'],['division','Division']])ensure(options({masters},kind,v.department).includes(v[field]),'Choose a configured '+field+'.');
 v.program=text(r.program);if(v.program)ensure(options({masters},'Program',v.department).includes(v.program),'Choose a configured program.');v.email=v.email.toLowerCase();
 if(!deps.some(d=>d.code===v.department&&d.active))return fail('Unknown department: '+v.department);
 if(me.role!=='Administrator'&&v.department!==me.department)return fail('Students must belong to your department.',403);vals.push({...v,id:b.id||uid()});}
 if(b.id&&rows.length!==1)return fail('Edit one student at a time.');
 if(b.id){const s=known.find(s=>s.id===b.id);if(!s)return fail('Student not found.',404);if(me.role!=='Administrator'&&s.department!==me.department)return fail('Department access required.',403);await db.update(students).set(vals[0]).where(eq(students.id,b.id));}else await db.batch([db.insert(students).values(vals[0]),...vals.slice(1).map(v=>db.insert(students).values(v))]);
 await log('',me,b.id?'Updated student':`Added ${vals.length} students`);return Response.json({ok:true});
 }
 if(action==='participation'){
 const a=(await db.select().from(activities).where(eq(activities.id,b.activity)))[0];if(!a||!canEdit(me,a))return fail('Activity management permission required.',403);
 if(['Completed','Archived'].includes(a.status))return fail('Completed and archived participation records are read-only.');
 const rows=b.rows;if(!Array.isArray(rows)||!rows.length||rows.length>500)return fail('Select 1–500 students.');const known=await db.select().from(students);
 for(const r of rows){const student=known.find(s=>s.id===r.student);if(!student)return fail('Student not found.');if(me.role!=='Administrator'&&student.department!==me.department)return fail('Student department access required.',403);if(!['Registered','Present','Absent'].includes(r.attendance)||!['Participant','Volunteer','Winner','Runner-up'].includes(r.responsibility))return fail('Invalid attendance or participation role.');}
 const statements=rows.map((r:any)=>db.insert(participation).values({id:uid(),activity:a.id,student:r.student,attendance:r.attendance,responsibility:r.responsibility,achievement:String(r.achievement||'').slice(0,500),certificate:String(r.certificate||'').slice(0,200)}).onConflictDoUpdate({target:[participation.activity,participation.student],set:{attendance:r.attendance,responsibility:r.responsibility,achievement:String(r.achievement||'').slice(0,500),certificate:String(r.certificate||'').slice(0,200)}}));await db.batch([statements[0],...statements.slice(1)]);
 await log(a.id,me,`Updated ${rows.length} participation records`);return Response.json({ok:true});
 }
 if(action==='department'){
 if(me.role!=='Administrator')return fail('Administrator access required.',403);const name=String(b.name||'').trim(),code=String(b.code||'').trim().toUpperCase();if(!name||!/^[A-Z0-9-]{2,12}$/.test(code))return fail('Enter a name and a 2–12 character department code.');if((await db.select().from(departments)).some(d=>d.code===code))return fail('Department code already exists.');await db.insert(departments).values({id:uid(),name:name.slice(0,200),code});await log('',me,'Added department',name);return Response.json({ok:true});
 }
 if(action==='user'){
 if(me.role!=='Administrator')return fail('Administrator access required.',403);if(!roles.includes(b.role))return fail('Unknown role.');if(!(await db.select().from(users)).some(u=>u.id===b.id))return fail('Account not found.',404);if(b.id===me.id&&(b.role!=='Administrator'||!b.active))return fail('You cannot remove your own administrator access.');if(['Head of Department','Faculty Coordinator'].includes(b.role)&&!(await db.select().from(departments)).some(d=>d.code===b.department&&d.active))return fail('Assign an existing department to this role.');await db.update(users).set({role:b.role,department:String(b.department||''),active:b.active?1:0}).where(eq(users.id,b.id));await log('',me,'Updated user permissions',b.id);return Response.json({ok:true});
 }
 return fail('Unknown operation.');
 }catch(e){return failure(e)}}
