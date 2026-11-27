/* Public Uzbek medicine registrations. Product strengths are read from the registered trade label, not an excipient dosage field. */
(function(W){
'use strict';
const workspace=W.UZMEDDrugWorkspace,catalog=W.UZMEDDrugCatalog;
if(!workspace?.lookup||!catalog)return;
const originalLookup=workspace.lookup,originalDetail=workspace.details;
const norm=v=>W.UZMED_REFERENCE_SEARCH.normalize(String(v||''));
let loading=null,index=null,version='';const guides=new Map();
function readIndex(){
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET','/assets/uzmed-qabul-pilot/official-active-drugs-v4.json?v=20261108-archive6',true);x.timeout=15000;x.setRequestHeader('Accept','application/json');x.onload=()=>{try{
  if(x.status!==200)throw Error('registry_unavailable');const data=JSON.parse(x.responseText);
  if(data.schema!==1||typeof data.registry_update_date!=='string'||!Array.isArray(data.rows)||data.rows.length!==data.count||data.count<1||data.count>100000||data.rows.some(r=>!Array.isArray(r)||r.length!==8)||new Set(data.rows.map(r=>r[0])).size!==data.count)throw Error('registry_invalid');
  const evidence=data.archiveEvidence;
  if(evidence&&(!Array.isArray(evidence.products)||!evidence.rows||typeof evidence.version!=='string'))throw Error('archive_evidence_invalid');
  version=data.registry_update_date+(evidence?'+'+evidence.version:'');
  index=data.rows.map(r=>{if(!Number.isSafeInteger(r[0])||r[0]<1||r.slice(1).some(x=>typeof x!=='string'))throw Error('registry_record_invalid');
   const title=r[3],match=/\s+(?=(?:таблет|капсул|раствор|порош|лиоф|суспенз|сироп|мазь|крем|гель|капли|спрей|суппоз|аэроз|эмуль|таблет|гранул|tablet|capsul|solution|syrup|cream|ointment|сусп|настой|сбор|экстракт|паст|масло|tincture))/i.exec(title);
   const name=match?title.slice(0,match.index).trim():title;
   const declared=evidence&&evidence.products[evidence.rows[r[0]]];
   if(declared&&(declared.registration!==r[2]||declared.title!==title||declared.manufacturer!==r[4]))throw Error('archive_identity_mismatch');
   const labels=(declared?.options||[]).map(p=>p.label||[p.form,p.strength].join(' '));
   return {id:r[0],externalId:r[1],registration:r[2],name,title,form:match?title.slice(match.index).trim():'',manufacturer:r[4],country:r[5],inn:r[6],atc:r[7],declared,search:norm([title,r[4],r[6],r[2],...labels].join(' ')),family:r[4]&&r[6]&&!/комбинир|kombinir|combination/i.test(r[6])?norm([name,r[4],r[6]].join(' | ')):'id:'+r[0]};
  });resolve(index);
 }catch(e){loading=null;reject(e);}};x.onerror=x.ontimeout=()=>{loading=null;reject(Error('registry_unavailable'));};x.send();});return loading;
}
function row(r){const entry=r.declared;return {key:'uzreg:'+r.id,source:'O‘zbekiston davlat reyestri',sourceVersion:version,registryVersion:version,name:r.name,inn:r.inn,form:r.form,manufacturer:r.manufacturer,url:'https://www.uzpharm-control.uz/registry/drugs/'+r.id,referenceScope:'registered_product',registryTitle:r.title,registration:r.registration,
 ...(entry?.options?.length?{productOptions:entry.options}:{}),
 ...(entry?.dosageOptions?{dosageOptions:entry.dosageOptions,frequencyOptions:entry.frequencyOptions,manufacturerSource:entry.manufacturerSource}:{}),
 ...(entry?.state==='archive_strengths'?{archiveNotice:'Shakl va kuchlar 2026-yil davlat reyestri arxividan, ro‘yxat raqami va ishlab chiqaruvchi mosligi bilan olingan.'}:entry?.state==='manufacturer_strengths'?{archiveNotice:'Kuch va shartli qabul variantlari ishlab chiqaruvchining yo‘riqnomasidan tekshirilgan. Qarshi ko‘rsatma va ehtiyot choralarini hisobga oling.'}:entry?{archiveNotice:'Arxivda ushbu shakl uchun kuch to‘liq tasdiqlanmadi. Miqdorni asl yo‘riqnomadan tekshiring.'}:{}),
 ...(entry?.state==='cancelled_conflict'?{clinicalBlock:{reason:'Arxivdagi bekor qilingan ro‘yxat va joriy karta o‘rtasida ziddiyat bor. Mahsulot maqomini asl manbadan tekshiring.'}}:{}),
 raw:{name:r.name,inn:r.inn,registeredTradeName:r.title,registration:r.registration},_officialFamily:r.family};}
function guidance(id){
 if(guides.has(id))return guides.get(id);
 const pending=new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET','/api/drugs/catalog?registration_id='+id,true);x.timeout=11000;x.setRequestHeader('Accept','application/json');x.onload=()=>{try{if(x.status!==200)throw Error('guide_unavailable');const d=JSON.parse(x.responseText);if(d.key!=='uzreg:'+id)throw Error('guide_identity');resolve(d);}catch(e){reject(e);}};x.onerror=x.ontimeout=()=>reject(Error('guide_unavailable'));x.send();});
 guides.set(id,pending);pending.catch(()=>guides.delete(id));return pending;
}
async function search(query){
 const words=norm(query).split(' ').filter(Boolean);if(!words.length)return {rows:[],total:0};const all=await readIndex();
 const matches=all.filter(r=>words.every(w=>r.search.includes(w))).sort((a,b)=>Number(norm(b.name).startsWith(words.join(' ')))-Number(norm(a.name).startsWith(words.join(' ')))||a.id-b.id);
 return {rows:matches.slice(0,12).map(row),total:matches.length};
}
catalog.sourceNames.official='Davlat reyestri';
workspace.lookup=async function(query,options={}){
 let primary=[],primarySource={status:'loading',count:0,total:0};
 const emit=()=>{if(!options.signal?.aborted)options.onSource?.('official',primary,primarySource);};
 emit();
 const official=search(query).then(result=>{
  primary=result.rows.map(r=>({...r,clinicalBlock:workspace.clinicalBlock(r)}));
  primarySource={status:'done',count:primary.length,total:result.total};emit();
 }).catch(()=>{primarySource={status:'error',count:0,total:0};emit();});
 const legacy=originalLookup.call(workspace,query,options);
 const results=await Promise.allSettled([legacy,official]);
 if(options.signal?.aborted)throw Error('Qidiruv bekor qilindi.');
 const old=results[0].status==='fulfilled'?results[0].value:{rows:[],sources:{local:{status:'error'},apteka:{status:'error'},prices:{status:'error'}}};
 return {...old,rows:[...primary,...old.rows],sources:{official:primarySource,...old.sources}};
};
workspace.details=async function(record,options){
 if(!String(record?.key||'').startsWith('uzreg:'))return originalDetail.call(workspace,record,options);
 const all=await readIndex(),r=all.find(r=>'uzreg:'+r.id===record.key);if(!r||(record.registryVersion||record.sourceVersion)!==version)throw Error('Reyestr yozuvi yangilandi. Dorini qayta qidiring.');
 const exact=row(r),variants=all.filter(v=>v.family===r.family).map(row).filter(v=>!workspace.clinicalBlock(v));
 const sourceGuidance=await guidance(r.id).catch(()=>({available:false,reason:'unavailable'}));
 return {...(record.reviewedReference?record:exact),sourceVariants:record.reviewedReference?undefined:variants,sourceGuidance,uzbek:{...(record.reviewedReference?record.uzbek:{}),special_instructions:'Davlat reyestri: '+r.registration+'. Asl mahsulot nomi: '+r.title+'. Ro‘yxat shakl va kuch ma’lumotnomasi; bemorga beriladigan miqdorni shifokor belgilaydi.'}};
};
W.QabulOfficialRegistry={search,version:()=>version};
readIndex().catch(()=>{});
})(window);
