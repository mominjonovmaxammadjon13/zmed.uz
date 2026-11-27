/* Shared source contract for Dorilar, Qabul and WebMCP. No patient data accepted. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.UZMEDDrugCatalog=factory();})(typeof window==='object'?window:globalThis,function(customRequest){
 'use strict';
 const products=new Map();
 const names={local:'UZMED baza',apteka:'Apteka.uz',prices:'ArzonApteka'};
 function request(path,signal){
  if(customRequest)return customRequest(path,signal);
  return new Promise((resolve,reject)=>{const x=new XMLHttpRequest();let done=false;function cleanup(){signal?.removeEventListener('abort',abort);}function bad(){if(done)return;done=true;cleanup();reject(Error('Manba javob bermadi.'));}function abort(){x.abort();bad();}if(signal?.aborted)return bad();x.open('GET',path,true);x.setRequestHeader('Accept','application/json');x.timeout=55000;x.onload=()=>{if(done)return;try{const data=JSON.parse(x.responseText||'{}');if(x.status<200||x.status>=300||data.status==='error'||data.configured===false||data.status==='setup_required')return bad();done=true;cleanup();resolve(data.data&&typeof data.data==='object'?data.data:data);}catch{bad();}};x.onerror=x.ontimeout=x.onabort=bad;signal?.addEventListener('abort',abort,{once:true});x.send();});
 }
 function url(value){try{const u=new URL(String(value));return u.protocol==='https:'&&/^(?:[a-z0-9-]+\.)*(?:apteka\.uz|arzonapteka\.uz|fda\.gov)$/.test(u.hostname)?u.href:'';}catch{return '';}}
 function term(value){const s=String(value||'').trim();if(/\b(?:mening|bemorim|homiladorman|emizayapman)\b|\d+(?:[.,]\d+)?\s*(?:yosh|oylik|kg)\b/i.test(s))return '';return s.split(/\s+(?:nima|uchun|haqida|qanday|ta[’']sir|tushuntir)\b|[?]/i)[0].trim().slice(0,160);}
 function map(source,x,data){
  if(source==='local')return x;
  if(source==='apteka')return {source:names.apteka,key:'apteka:'+x.slug,name:x.name,inn:x.active_ingredient||'',dosage:x.dosage||'',form:x.dosage_form||x.form||'',manufacturer:x.manufacturer||'',slug:x.slug,url:url(x.source_url||x.product_url||x.url),raw:x,uzbek:x};
  return {source:names.prices,key:'price:'+x.slug,name:x.name,inn:x.active_ingredient||'',dosage:x.dosage||'',form:x.form||'',manufacturer:x.manufacturer||'',slug:x.slug,url:url(x.product_url),price:x.min_price,currency:x.currency,inStock:x.in_stock,offers:x.offers_count,scope:data.location_filter_applied===false?'Hudud bo‘yicha tasdiqlanmagan umumiy narx':[data.selected_region?.name,data.selected_district?.name].filter(Boolean).join(' · ')||data.scope_label||'Butun O‘zbekiston',raw:x};
 }
 async function search(query,{signal,region='',district='',limit=8,onSource}={}){
  const q=term(query);if(q.length<2)return {rows:[],sources:{},query:q};limit=Math.min(12,Math.max(1,Number(limit)||8));
  const p=new URLSearchParams({q,limit:String(limit)});if(region)p.set('region',region);if(district)p.set('district',district);
  const sources={},rows={local:[],apteka:[],prices:[]};
  await Promise.allSettled([['local','/api/drugs/catalog?q='+encodeURIComponent(q)+'&limit='+limit],['apteka','/api/drugs/search?q='+encodeURIComponent(q)+'&limit='+limit],['prices','/api/drug-prices/search?'+p]].map(async([key,path])=>{
   try{const data=await request(path,signal);if(!Array.isArray(data.results))throw Error('Natija tuzilmasi noto‘g‘ri.');rows[key]=data.results.map(x=>map(key,x,data));for(const row of rows[key]){products.set(row.key,row);if(products.size>500)products.delete(products.keys().next().value);}sources[key]={status:'done',count:rows[key].length,total:data.total??rows[key].length,version:data.sourceVersion||''};}
   catch{sources[key]={status:'error',count:0};}
   if(!signal?.aborted)onSource?.(key,rows[key],sources[key]);
  }));
  if(signal?.aborted)throw Error('Qidiruv bekor qilindi.');
  return {rows:rows.local.concat(rows.apteka,rows.prices),sources,query:q};
 }
 async function detail(row,{signal}={}){
  if(products.has(row.key))row={...products.get(row.key),...row};
  if(row.key?.startsWith('local:')||row.key?.startsWith('market:')||row.key?.startsWith('kb:')||row.key?.startsWith('photo:'))return request('/api/drugs/catalog?key='+encodeURIComponent(row.key)+'&version='+encodeURIComponent(row.sourceVersion||''),signal);
  if(row.source==='Apteka.uz'&&row.slug){const full=await request('/api/drugs/'+encodeURIComponent(row.slug),signal);return {...row,raw:full,uzbek:full};}
  if(row.source==='ArzonApteka'&&row.slug){if(!row.name)throw Error('Aynan shu narx yozuvini qayta qidiring.');const data=await request('/api/drug-prices/search?q='+encodeURIComponent(row.name)+'&limit=12',signal),exact=(data.results||[]).find(x=>x.slug===row.slug);if(!exact)throw Error('Aynan shu mahsulot manbada topilmadi. Qayta qidiring.');return map('prices',exact,data);}
  return row;
 }
 return {version:'1',search,detail,request,term,sourceNames:names};
});
