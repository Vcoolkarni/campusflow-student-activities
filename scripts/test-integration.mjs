import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/,'Run only against the local test workspace.');
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
assert.ok(cookie,'Local development sign-in must supply a session.');
async function req(body,extra={}){return fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json',Origin:base}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});}
async function save(body,status=200){const r=await req(body);const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
assert.equal((await fetch(base+'/api/manage')).status,401);console.log('PASS anonymous access denied');
let data=await (await req()).json();assert.equal(data.me.role,'Administrator');
if(!data.departments.length){await save({action:'seed'});data=await(await req()).json();}
const suffix=Date.now(),values={title:'QA Activity '+suffix,category:'Technical',type:'Workshop',department:data.departments[0].code,year:'2026–27',semester:'I',class:'TY',division:'A',start:'2026-11-20',end:'2026-11-20',venue:'Test Laboratory',mode:'Offline',coordinator:'QA Coordinator',resource:'Test Speaker',organization:'Test Institute',objective:'Verify complete workflow',outcome:'',description:'Local test record',budget:100};
await save({action:'activity',values:{...values,end:'2026-11-19'}},400);console.log('PASS date range validation');
const {id}=await save({action:'activity',values});await save({action:'activity',values},400);console.log('PASS create activity and duplicate rejection');
const student={name:'QA Student '+suffix,prn:'QA'+suffix,email:'qa'+suffix+'@example.edu',department:values.department,class:'TY',division:'A',semester:'I',year:'2026–27'};
await save({action:'students',rows:[student]});await save({action:'students',rows:[student]},400);console.log('PASS student creation and unique PRN validation');
data=await(await req()).json();const s=data.students.find(s=>s.prn===student.prn);assert.ok(s);
await save({action:'participation',activity:id,rows:[{student:s.id,attendance:'Registered',responsibility:'Participant'}]});
await save({action:'participation',activity:id,rows:[{student:s.id,attendance:'Present',responsibility:'Winner',achievement:'First place',certificate:'QA-CERT'}]});
data=await(await req()).json();const pp=data.participation.filter(p=>p.activity===id);assert.equal(pp.length,1);assert.equal(pp[0].attendance,'Present');console.log('PASS attendance upsert and achievement persistence');
const upload=new FormData();upload.set('activity',id);upload.set('type','Attendance sheet');upload.set('file',new Blob(['name,attendance\nQA Student,Present'],{type:'text/csv'}),'qa-attendance.csv');
const uploaded=await fetch(base+'/api/files',{method:'POST',headers:{Cookie:cookie,Origin:base},body:upload});assert.equal(uploaded.status,200,await uploaded.text());
data=await(await req()).json();const doc=data.documents.find(d=>d.activity===id);assert.ok(doc);const downloaded=await fetch(base+'/api/files?id='+doc.id,{headers:{Cookie:cookie}});assert.equal(downloaded.status,200);assert.match(await downloaded.text(),/QA Student,Present/);assert.equal((await fetch(base+'/api/files?id='+doc.id)).status,401);console.log('PASS file upload, download and access protection');
await save({action:'transition',id,status:'Approved'},400);await save({action:'transition',id,status:'Submitted'});await save({action:'transition',id,status:'Rejected',remarks:'Please update the learning outcomes.'});await save({action:'activity',id,values:{...values,outcome:'Workflow successfully verified.'}});await save({action:'transition',id,status:'Submitted'});await save({action:'transition',id,status:'Verified'});await save({action:'transition',id,status:'Approved'});await save({action:'activity',id,values},400);await save({action:'transition',id,status:'Completed'});await save({action:'transition',id,status:'Archived'});console.log('PASS full workflow, corrections, immutable approved details and archival');
await save({action:'user',id:data.me.id,role:'Student',active:true},400);assert.equal((await req({action:'seed'},{Origin:'https://untrusted.example'})).status,403);console.log('PASS self-demotion prevention and cross-origin rejection');
data=await(await req()).json();assert.equal(data.activities.find(a=>a.id===id).status,'Archived');assert.ok(data.audit.some(e=>e.activity===id&&e.action==='Approved'));console.log('PASS database persistence and audit trail');
console.log('All integration checks passed. Local QA records are retained for inspection.');
