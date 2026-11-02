export const categories=['Technical','Academic','Cultural','Sports','Skill Development','Professional','Social','Research','Placement','Innovation'];
export const types=['Workshop','Seminar','Guest Lecture','Hackathon','Competition','Industrial Visit','Training','Certification Course','Project Exhibition','Club Activity','Outreach'];
export const roles=['Administrator','IQAC Coordinator','Head of Department','Faculty Coordinator','Student','Management'];
export type Activity={id:string;title:string;category:string;type:string;department:string;year:string;semester:string;class:string;division:string;start:string;end:string;venue:string;mode:string;coordinator:string;resource:string;organization:string;objective:string;outcome:string;description:string;budget:number;sponsor:string;status:string;owner:string;created:string};
export type Student={id:string;name:string;prn:string;email:string;program:string;department:string;class:string;division:string;semester:string;year:string};
export type User={id:string;email:string;name:string;role:string;department:string;active:number};
export type Participation={id:string;activity:string;student:string;attendance:string;responsibility:string;achievement:string;certificate:string};
export type Evidence={id:string;activity:string;name:string;type:string;mime:string;size:number;created:string};
export type Audit={id:string;activity:string;user:string;action:string;remarks:string;created:string};
export type Master={id:string;kind:string;name:string;parent:string;department:string;active:number};
export type Faculty={id:string;name:string;employeeId:string;email:string;department:string;designation:string;active:number};
export type Resource={id:string;name:string;designation:string;organization:string;email:string;mobile:string;address:string;expertise:string;active:number};
export type Target={id:string;activity:string;class:string;division:string;program:string};
export type FacultyLink={id:string;activity:string;faculty:string;responsibility:string};
export type ResourceLink={id:string;activity:string;resource:string;responsibility:string};
export type Assignment={id:string;name:string;email:string;role:string;department:string;active:number};
export type Feedback={id:string;activity:string;student:string;rating:number;comments:string;created:string};
export type Approval={id:string;activity:string;reviewer:string;fromStatus:string;toStatus:string;remarks:string;created:string};
export type Data={me:User;activities:Activity[];students:Student[];participation:Participation[];documents:Evidence[];users:User[];departments:{id:string;name:string;code:string;active:number}[];audit:Audit[];masters:Master[];faculty:Faculty[];resources:Resource[];targets:Target[];facultyLinks:FacultyLink[];resourceLinks:ResourceLink[];assignments:Assignment[];feedback:Feedback[];approvals:Approval[]};
export function canEdit(me:User,a?:Activity){return Boolean(me.active)&&(me.role==='Administrator'||(me.role==='Faculty Coordinator'&&Boolean(me.department)&&(!a||(a.owner===me.id&&a.department===me.department)))||(me.role==='Head of Department'&&Boolean(me.department)&&(!a||a.department===me.department)));}
export function canReview(me:User,a:Activity){return Boolean(me.active)&&(me.role==='Administrator'||me.role==='IQAC Coordinator'||(me.role==='Head of Department'&&Boolean(me.department)&&a.department===me.department));}
export function availableDepartments(data:Pick<Data,'me'|'departments'>,historicalCode=''){
 return data.departments.filter(d=>(Boolean(d.active)||d.code===historicalCode)&&(data.me.role==='Administrator'||d.code===data.me.department));
}
export const masterKinds=['Institute','Academic year','Semester','Program','Class','Division','Category','Activity type'];
export const defaultMasters:Master[]=[...categories.map(name=>({kind:'Category',name,parent:''})),...types.map(name=>({kind:'Activity type',name,parent:''})),...['2026–27','2025–26','2027–28'].map(name=>({kind:'Academic year',name,parent:''})),...['I','II','III','IV','V','VI','VII','VIII'].map(name=>({kind:'Semester',name,parent:''})),...['FY','SY','TY','Final Year'].map(name=>({kind:'Class',name,parent:''})),...['A','B','C','D'].map(name=>({kind:'Division',name,parent:''}))].map((m,i)=>({...m,id:'default-'+i,department:'',active:1}));
export function resolveMasters(custom:Master[]){const overridden=new Set(custom.map(m=>m.kind+'|'+m.name+'|'+m.department));return [...defaultMasters.filter(m=>!overridden.has(m.kind+'|'+m.name+'|'+m.department)),...custom]}
export function options(data:Pick<Data,'masters'>,kind:string,department='',include=''){const values=data.masters.filter(m=>m.kind===kind&&m.active&&(!m.department||m.department===department)).map(m=>m.name);return Array.from(new Set([...values,...(include?[include]:[])]));}
export function currentAcademicYear(){const d=new Date();const y=d.getMonth()>=6?d.getFullYear():d.getFullYear()-1;return `${y}–${String(y+1).slice(-2)}`;}
