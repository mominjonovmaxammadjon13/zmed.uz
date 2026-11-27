/* Keep WHO code identity and English search aliases; display Uzbek authoring labels. */
(function(W){
 'use strict';
 let pending;
 async function json(url){const r=await fetch(url,{credentials:'omit'});if(!r.ok)throw Error('MKB ma’lumotnomasi yuklanmadi. Qayta urinib ko‘ring.');return r.json();}
 function localize(reference,labels){
  if(labels.system!=='WHO ICD-10'||labels.version!=='2019'||labels.language!=='uz'||!labels.labels)throw Error('O‘zbekcha MKB nomlari tuzilmasi mos emas.');
  const entries=W.UZMED_REFERENCE_SEARCH.buildMkb([],reference);
  for(const row of entries){const title=labels.labels[row[0]];if(typeof title!=='string'||!title.trim())throw Error(row[0]+' uchun o‘zbekcha nom topilmadi.');row.localAliases=[row[1]];row[1]=title;row.language='uz';}
  return entries;
 }
 function load(){if(!pending)pending=Promise.all([json('/assets/icd10-who-2019.json'),json('/assets/uzmed-qabul-pilot/icd10-uz-labels.json?v=20261105-compact1')]).then(([r,l])=>localize(r,l)).catch(e=>{pending=null;throw e;});return pending;}
 W.QabulReference={load,localize};
})(window);
