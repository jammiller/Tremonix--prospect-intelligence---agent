import {createClient} from '@supabase/supabase-js';
import {score,summary,parseCSV} from './scoring.js';
const $=id=>document.getElementById(id), key='tremonix-pia-v1';
let prospects=[],editing=null;
const client=__SUPABASE_URL__ && __SUPABASE_KEY__ ? createClient(__SUPABASE_URL__,__SUPABASE_KEY__) : null;
let user=null, savedIds=new Set(), savedData=new Map(), saving=false;
async function load(){
 const {data,error}=await client.from('prospects').select('id,data').eq('user_id',user.id).order('id').limit(10000);
 if(error)throw error;
 prospects=data.map(row=>({...row.data,id:row.id}));savedIds=new Set(data.map(row=>row.id));savedData=new Map(prospects.map(p=>[p.id,JSON.stringify(p)]));render();
 if(data.length===10000)$('message').textContent='Showing the first 10,000 records. Larger workspaces need pagination.';
}
function locked(value){document.querySelectorAll('main button,main input,main select').forEach(e=>e.disabled=value);}
const fields={companyName:'Company name',industry:'Industry',location:'Location',employees:'Employee count',revenue:'Revenue estimate',website:'Website',firstName:'First name',lastName:'Last name',title:'Contact title',email:'Email',phone:'Phone',linkedin:'LinkedIn URL',nextAction:'Next action'};
for(const [name,label] of Object.entries(fields)){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.name=name;input.required=name==='companyName';input.type=name==='email'?'email':['website','linkedin'].includes(name)?'url':'text';l.append(input);$('fields').append(l);}
async function persist(){
 if(!user || saving)return false;
 saving=true;locked(true);$('message').textContent='Saving…';
 try {
 const rows=prospects.filter(p=>savedData.get(p.id)!==JSON.stringify(p)).map(p=>({id:p.id,user_id:user.id,data:p,updated_at:new Date().toISOString()}));
 // Upsert changed workspace records; never delete rows created on another device.
 if(rows.length){const {error}=await client.from('prospects').upsert(rows);if(error)throw error;}
 const removed=[...savedIds].filter(id=>!prospects.some(p=>p.id===id));
 if(removed.length){const {error}=await client.from('prospects').delete().eq('user_id',user.id).in('id',removed);if(error)throw error;}
 savedIds=new Set(prospects.map(p=>p.id));savedData=new Map(prospects.map(p=>[p.id,JSON.stringify(p)]));$('message').textContent='Saved to database.';return true;
 }catch(error){$('message').textContent=`Save failed: ${error.message}. Reloading saved records.`;try{await load();}catch(e){$('message').textContent+=` Reload failed: ${e.message}`;}return false;}
 finally{saving=false;locked(false);}
}
function text(tag,value,parent){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
function action(p){return p.nextAction|| (score(p).total>=60?'Verify contact and prepare outreach':'Research product fit and buying signals');}
function render(){
 $('metrics').replaceChildren();for(const [label,value] of [['Prospects',prospects.length],['Hot leads',prospects.filter(p=>score(p).status==='Hot').length],['Warm leads',prospects.filter(p=>score(p).status==='Warm').length],['Contacts',prospects.filter(p=>p.email||p.firstName).length]]){const d=document.createElement('div');text('strong',value,d);text('span',label,d);$('metrics').append(d);}
 $('prospects').replaceChildren();const q=$('search').value.toLowerCase(),filter=$('filter').value;
 const visible=prospects.filter(p=>[p.companyName,p.industry,p.location].join(' ').toLowerCase().includes(q)&&(filter==='All priorities'||score(p).status===filter)).sort((a,b)=>score(b).total-score(a).total);
 for(const p of visible){const row=document.createElement('tr');for(const value of [p.companyName,p.industry||'—',score(p).status,score(p).total,action(p)])text('td',value,row);const cell=text('td','',row),button=text('button','Open',cell);button.onclick=()=>detail(p);$('prospects').append(row);}
 if(!visible.length){const row=text('tr','',$('prospects'));const cell=text('td','No prospects found. Add a company or import a CSV.',row);cell.colSpan=6;}
}
function clear(){editing=null;$('form').reset();$('formTitle').textContent='Add prospect';}
function detail(p){const d=$('detail');d.replaceChildren();text('h2',p.companyName,d);text('p',`${p.firstName||''} ${p.lastName||''} · ${p.title||'Contact not identified'}`,d);text('p',[p.email,p.phone].filter(Boolean).join(' · ')||'No contact details supplied',d);for(const name of ['website','linkedin']){if(p[name]){try{const url=new URL(p[name]);if(['http:','https:'].includes(url.protocol)){const a=text('a',`${name}: ${url.hostname}`,d);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';text('br','',d);}}catch{}}}
 text('h3',`Opportunity score: ${score(p).total}/100 · ${score(p).status}`,d);const list=text('ul','',d);for(const [name,value] of Object.entries(score(p).factors))text('li',`${name.replace(/([A-Z])/g,' $1')}: ${value}`,list);
 text('h3','Fact-based summary (not AI-generated)',d);text('p',summary(p),d);text('h3','Next action',d);text('p',action(p),d);
 text('h3','Outreach templates — review before sending',d);const select=document.createElement('select');select.setAttribute('aria-label','Outreach template');for(const label of ['Cold email','LinkedIn message','Follow-up email','Call script','Meeting request']){const o=text('option',label,select);o.value=label;}d.append(select);const draft=document.createElement('textarea');draft.setAttribute('aria-label','Editable outreach draft');d.append(draft);
 const update=()=>{const greeting=`Hi ${p.firstName||'there'},`;const pitch=`I'm reaching out about workforce training and competency management at ${p.companyName}. Would reducing training administration or improving visibility into workforce skills be useful to your team?`;const templates={'Cold email':`Subject: Workforce development at ${p.companyName}\n\n${greeting}\n\n${pitch}\n\nWould you be open to a short conversation?\n\n[Your name]`,'LinkedIn message':`${greeting} ${pitch} Happy to connect if this is relevant.`,'Follow-up email':`${greeting}\n\nFollowing up on my previous note about workforce training at ${p.companyName}. Is this a current priority, or is there someone else I should speak with?\n\n[Your name]`,'Call script':`Introduce yourself and ask permission to speak.\nAsk: How does ${p.companyName} track workforce competencies today?\nExplore training administration, compliance, and skill gaps.\nIf relevant, offer a discovery meeting. Do not claim unverified outcomes.`,'Meeting request':`${greeting}\n\nWould you have 15 minutes to discuss your workforce development priorities at ${p.companyName}? We can explore whether PulseOS training and competency solutions are a fit.\n\n[Proposed times]\n[Your name]`};draft.value=templates[select.value];};select.onchange=update;update();text('p','If budget or an existing LMS is an objection, ask about priorities and integration requirements; do not assume a replacement is needed.',d);
 const edit=text('button','Edit prospect',d);edit.onclick=()=>{clear();editing=p.id;for(const [k,v]of Object.entries(p)){const input=$('form').elements.namedItem(k);if(input){if(input.type==='checkbox')input.checked=!!v;else input.value=v;}}$('formTitle').textContent='Edit prospect';$('form').scrollIntoView({behavior:'smooth'});};const remove=text('button','Delete prospect',d);remove.style.marginLeft='10px';remove.onclick=async ()=>{if(confirm(`Delete ${p.companyName}?`)){prospects=prospects.filter(x=>x.id!==p.id);if(!await persist())return;render();d.replaceChildren();text('h2','Prospect deleted',d);if(editing===p.id)clear();}};
}
$('form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));for(const k of ['fit','budget','growth','engaged'])data[k]=e.target.elements[k].checked;data.companyName=data.companyName.trim();if(!data.companyName)return;data.signals=Math.max(0,Math.min(3,Number(data.signals)||0));data.id=editing||crypto.randomUUID();data.lastActivity=new Date().toISOString();const i=prospects.findIndex(p=>p.id===data.id);if(i>=0)prospects[i]=data;else prospects.push(data);if(await persist()){clear();render();detail(data);}};
$('cancel').onclick=clear;$('search').oninput=render;$('filter').onchange=render;
$('csv').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('CSV must be smaller than 2 MB');const rows=parseCSV(await file.text());let count=0;for(const row of rows){if(!row.companyName.trim())continue;const p={id:crypto.randomUUID(),lastActivity:new Date().toISOString()};for(const k of Object.keys(fields))p[k]=(row[k]||'').trim();for(const k of ['fit','budget','growth','engaged'])p[k]=String(row[k]).toLowerCase()==='true';p.signals=Math.max(0,Math.min(3,Number(row.signals)||0));prospects.push(p);count++;}if(!await persist())return;render();$('message').textContent=`Imported ${count} prospects. Facts are not independently verified; repeat imports create duplicates.`;}catch(error){$('message').textContent=error.message;}finally{e.target.value='';}};
$('export').onclick=()=>{const headers=[...Object.keys(fields),'fit','signals','budget','growth','engaged','score','status','lastActivity'];const quote=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';const csv=[headers.map(quote).join(','),...prospects.map(p=>headers.map(h=>quote(h==='score'?score(p).total:h==='status'?score(p).status:p[h])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='pia-prospects.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('sample').onclick=async ()=>{if(prospects.some(p=>p.sample))return;prospects.push({id:crypto.randomUUID(),sample:true,companyName:'Example Construction (fictional)',industry:'Construction',location:'Florida',employees:'250',fit:true,signals:2,budget:true,growth:true,engaged:false,nextAction:'Confirm training priorities with the workforce lead'},{id:crypto.randomUUID(),sample:true,companyName:'Example College (fictional)',industry:'Higher education',fit:true,signals:1,budget:false,growth:false,engaged:false});await persist();render();};render();

$('migrate').onclick=async()=>{try{const old=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(old))throw new Error('Invalid local data');const rows=old.filter(p=>p.companyName&&!prospects.some(x=>x.id===p.id));if(!confirm(`Import ${rows.length} browser records into this account?`))return;prospects.push(...rows.map(p=>({...p,id:p.id||crypto.randomUUID()})));if(await persist()){render();$('message').textContent='Browser records imported. Original local backup retained.';}}catch(e){$('message').textContent=e.message;}};
const authMessage=value=>$('authStatus').textContent=value;
async function authenticate(operation){
 if(!client)return;const email=$('authEmail').value.trim(),password=$('authPassword').value;
 try{if(!email || password.length<8)throw new Error('Enter an email and a password of at least 8 characters.');
 const {error}=await client.auth[operation]({email,password});if(error)throw error;
 if(operation==='signUp')authMessage('Account requested. Check your email to confirm, then sign in.');
 }catch(e){authMessage(e.message);}
}
$('authForm').onsubmit=e=>{e.preventDefault();authenticate('signInWithPassword');};
$('signup').onclick=()=>authenticate('signUp');
$('signout').onclick=async()=>{if(saving){authMessage('Wait for the current save to finish.');return;}const {error}=await client.auth.signOut();if(error)authMessage(error.message);};
$('resetPassword').onclick=async()=>{if(!client)return;const email=$('authEmail').value.trim();if(!email){authMessage('Enter your email address first.');return;}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin});authMessage(error?error.message:'If the account exists, check your email for a password reset link.');};
$('updatePassword').onclick=async()=>{const password=$('authPassword').value;if(password.length<8){authMessage('Use at least 8 characters.');return;}const {error}=await client.auth.updateUser({password});authMessage(error?error.message:'Password updated.');if(!error){$('updatePassword').hidden=true;$('authForm').hidden=true;}};
async function sessionChanged(session,recovery=false){
 user=session?.user||null;prospects=[];savedIds.clear();savedData.clear();clear();render();$('detail').replaceChildren();document.querySelector('main').hidden=!user;$('signout').hidden=!user;$('authForm').hidden=!!user&&!recovery;$('updatePassword').hidden=!recovery;$('authPassword').value='';
 if(user){authMessage(recovery?'Enter and save your new password.':`Signed in as ${user.email}`);locked(true);try{await load();locked(false);}catch(e){authMessage(`Database unavailable: ${e.message}. Apply the schema and reload. Writing is disabled.`);}}
 else authMessage('Sign in or create an account. Records are private to each account.');
}
if(!client){authMessage('Setup required: connect Supabase and configure the public URL/key environment variables. See repository SETUP.md.');$('authForm').hidden=true;}
else{client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>sessionChanged(session,event==='PASSWORD_RECOVERY'),0);});}
