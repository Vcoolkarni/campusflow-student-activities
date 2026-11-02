'use client';
import {useId,useState} from 'react';
import {Plus,LoaderCircle} from 'lucide-react';
import {availableDepartments,type Data} from '@/lib/model';

export function DepartmentPicker({data,value,onChange,refresh,historicalCode=''}:{data:Data;value:string;onChange:(code:string)=>void;refresh:()=>Promise<unknown>;historicalCode?:string}){
 const id=useId(),eligible=availableDepartments(data,historicalCode),admin=data.me.role==='Administrator';
 const [adding,setAdding]=useState(admin&&!eligible.length),[name,setName]=useState(''),[code,setCode]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [created,setCreated]=useState<Data['departments'][number]|null>(null);
 const choices=created&&!eligible.some(d=>d.code===created.code)?[...eligible,created]:eligible;
 async function save(){if(saving)return;const departmentName=name.trim(),departmentCode=code.trim().toUpperCase();if(!departmentName||!/^[A-Z0-9-]{2,12}$/.test(departmentCode)){setError('Enter a department name and a code of 2–12 letters or digits.');return}setSaving(true);setError('');try{
 const response=await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'department',values:{name:departmentName,code:departmentCode,active:true}}),signal:AbortSignal.timeout(20000)});
 const result:any=await response.json();if(!response.ok)throw Error(result.error||'Unable to create the department.');
 setCreated({id:result.id,name:departmentName,code:departmentCode,active:1});await refresh();onChange(departmentCode);setAdding(false);setName('');setCode('');
 }catch(e){setError((e as Error).message)}finally{setSaving(false)}}
 return <div className="field department-picker"><label htmlFor={id}>Department *</label><select id={id} name="department" value={value} onChange={e=>onChange(e.target.value)} required aria-describedby={!choices.length?id+'-hint':undefined}><option value="">{choices.length?'Select department':'No departments configured'}</option>{choices.map(d=><option key={d.id} value={d.code}>{d.code} — {d.name}{d.active?'':' (inactive)'}</option>)}</select>
 {!choices.length&&<p id={id+'-hint'} className="department-hint">{admin?'Add your institute’s department below to continue.':'No active department is assigned to your account. Ask your administrator to activate and assign your department.'}</p>}
 {admin&&!adding&&<button type="button" className="link-btn" onClick={()=>{setAdding(true);setError('')}}><Plus size={13}/>Add department</button>}
 {admin&&adding&&<div className="inline-department"><label htmlFor={id+'-name'}>Department name<input id={id+'-name'} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Computer Science and Engineering" maxLength={200} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void save()}}}/></label><label htmlFor={id+'-code'}>Department code<input id={id+'-code'} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. CSE" maxLength={12} autoCapitalize="characters" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void save()}}}/></label>{error&&<p className="department-error" role="alert">{error}</p>}<div className="row"><button type="button" className="btn" disabled={saving||!name.trim()||!code.trim()} onClick={()=>void save()}>{saving?<LoaderCircle className="spin" size={13}/>:<Plus size={13}/>}Save department</button>{choices.length>0&&<button type="button" className="link-btn" disabled={saving} onClick={()=>setAdding(false)}>Cancel</button>}</div><p className="department-hint">Saved departments become available across activities, students, and faculty. Your current form stays open.</p></div>}
 </div>
}
