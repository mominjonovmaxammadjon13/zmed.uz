'use strict';
/* DDI data is read from the current main UZMED source, never a second snapshot. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else {root.QabulSafety=api;root.UZMEDDrugCatalog.request('/api/drugs/ddi-reference').then(value=>{api.setDataset(value);root.dispatchEvent(new root.CustomEvent('qabul:ddi-ready'));}).catch(()=>{root.dispatchEvent(new root.CustomEvent('qabul:ddi-ready'));});}})(typeof window==='object'?window:globalThis,function(){
let DRUGS={},CLASSES={},PAIRS=[],loaded=false,sourceVersion='';
const levels={CONTRA:'Qarshi ko‘rsatma',MAJOR:'Jiddiy',MODERATE:'O‘rtacha',MINOR:'Yengil',MONITOR:'Monitoring'};
const rank={CONTRA:0,MAJOR:1,MODERATE:2,MINOR:3,MONITOR:4};
const aliases=new Map();
const norm=value=>String(value??'').toLowerCase().replace(/[’‘`]/g,"'").replace(/\s+/g,' ').trim();
function setDataset(value){
 if(!value||!value.drugs||!value.classes||!Array.isArray(value.pairs)||!value.sourceVersion)throw Error('Asosiy DDI manbasi ochilmadi.');
 DRUGS=value.drugs;CLASSES=value.classes;PAIRS=value.pairs;sourceVersion=value.sourceVersion;aliases.clear();
 for(const [key,d]of Object.entries(DRUGS))for(const a of [key,d.name,...(d.alias||[])]){const n=norm(a);aliases.set(n,aliases.has(n)&&aliases.get(n)!==key?null:key);}
 loaded=true;
}
function resolve(value){
 const raw=norm(value);if(aliases.has(raw))return aliases.get(raw);
 // Strip only a trailing numeric strength. Combination names remain unknown.
 const base=raw.replace(/\s+\d+(?:[.,]\d+)?\s*(?:mg|мг|g|г|mcg|mkg|мкг|ml|мл|%)\s*$/u,'').trim();
 return aliases.get(base)||null;
}
function check(names){
 if(!loaded)throw Error('Asosiy DDI manbasi hali yuklanmagan. Tekshiruv bajarilmadi.');
 if(!Array.isArray(names)||names.length>30)throw Error('2–30 ta dori bilan tekshiring.');
 const drugs=[],seen=new Set();
 for(const value of names){const raw=String(value??'').trim().slice(0,200);if(!raw)continue;const key=resolve(raw),id=key||'?'+norm(raw);if(seen.has(id))continue;seen.add(id);drugs.push({raw,key,name:key?DRUGS[key].name:raw});}
 const expand=key=>[key,...Object.entries(CLASSES).filter(([,c])=>c.members.includes(key)).map(([k])=>k)];
 const pairs=[],matrix=drugs.map(()=>drugs.map(()=>null));let covered=0;
 for(let i=0;i<drugs.length;i++)for(let j=i+1;j<drugs.length;j++){
  const a=drugs[i],b=drugs[j];if(!a.key||!b.key){matrix[i][j]=matrix[j][i]='unknown';continue;}
  const aa=expand(a.key),bb=expand(b.key);
  const rules=PAIRS.filter(r=>(aa.includes(r.a)&&bb.includes(r.b))||(aa.includes(r.b)&&bb.includes(r.a))).sort((x,y)=>rank[x.level]-rank[y.level]);
  if(rules.length){covered++;pairs.push({a,b,level:rules[0].level,rules});matrix[i][j]=matrix[j][i]=rules[0].level;}
  else matrix[i][j]=matrix[j][i]='unlisted';
 }
 return {drugs,pairs:pairs.sort((a,b)=>rank[a.level]-rank[b.level]),matrix,total:drugs.length*(drugs.length-1)/2,covered,unknown:drugs.filter(d=>!d.key).map(d=>d.raw)};
}
function number(value){if(value===null||value===undefined||String(value).trim()==='')return null;const s=String(value).trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
function egfr({age,sex,creatinine,unit,stable}){
 age=number(age);let c=number(creatinine);
 if(age===null||age<18||age>120||!['M','F'].includes(sex)||c===null||c<=0||stable!==true||!['mg/dL','umol/L'].includes(unit))return null;
 if(unit==='umol/L')c/=88.4;if(c<.1||c>30)return null;
 const k=sex==='F'?.7:.9,alpha=sex==='F'?-.241:-.302,r=c/k;
 return 142*Math.min(r,1)**alpha*Math.max(r,1)**-1.2*.9938**age*(sex==='F'?1.012:1);
}
const sources={
 egfr:'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults',
 spironolakton:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=951b8948-dc0f-4aef-9910-82c252de936d',
 siprofloksatsin:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=686a2ae7-dbc1-ccbf-e053-2991aa0a5525',
 rozuvastatin:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=92a58577-b549-4143-abd0-391a07ed714d',
 indapamid:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a8a4ec2c-9d4b-482b-ad29-88185c96db74',
 fenofibrat:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=d9be3ae3-6da9-47fd-bcfd-e561b9d585ca',
 valsartan:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=62ee362f-3032-4f56-a900-4d2485b8759c'
};
function renal(names,context={}){
 const g=number(context.egfr),valid=g!==null&&g>0&&g<=200;
 return names.map(raw=>{
  const key=resolve(raw),source=sources[key],out={name:String(raw),key,source,level:'unknown',text:'Ushbu preparat uchun mahalliy buyrak/monelik qoidasi yo‘q. Rasmiy yo‘riqnomadan tekshiring.'};
  if(!source)return out;
  out.level='review';
  switch(key){
   case 'spironolakton':out.text='Kaliy va buyrak funksiyasi nazorati zarur. Giperkaliemiya, Addison kasalligi yoki eplerenon bilan qo‘llash — yo‘riqnomadagi moneliklar.';if(valid&&g<30)out.text+=' eGFR <30: yurak yetishmovchiligida boshlash dozasi jadvali bu darajani qamramaydi; mutaxassis bahosi kerak.';else if(valid&&g<=50)out.text+=' Yurak yetishmovchiligida eGFR 30–50 uchun boshlash tartibi alohida; §2.2 ni tekshiring.';break;
   case 'siprofloksatsin':out.text='Oddiy tabletka yo‘riqnomasida doza CrCl bo‘yicha belgilanadi (§2.3). eGFR CrCl o‘rniga avtomatik qo‘llanmaydi. Dori shakli, yosh va dializ holatini tekshiring.';break;
   case 'rozuvastatin':out.text='Og‘ir buyrak yetishmovchiligida, gemodializ olinmasa, alohida boshlash va maksimal doza chegarasi bor (§2.5). Yo‘riqnomadagi CLcr mezonini tekshiring; eGFR asosida tayinlov avtomatik o‘zgarmaydi. Miopatiya belgilari nazorat qilinadi.';break;
   case 'indapamid':out.text='Anuriya — monelik. Og‘ir buyrak kasalligida ehtiyotkorlik va davriy buyrak/elektrolit nazorati zarur; faqat eGFR <30 qiymati asosida avtomatik bekor qilinmaydi.';break;
   case 'fenofibrat':out.text='eGFR <30 yoki dializ — tanlangan fenofibrat yo‘riqnomasida monelik. Preparat shakli va to‘liq yo‘riqnomani tekshiring.';if((valid&&g<30)||context.dialysis===true)out.level='contra';break;
   case 'valsartan':out.text='Buyrak funksiyasi va kaliyni kuzating. Diabetda aliskiren bilan birga qo‘llash monelik; homiladorlik, suvsizlanish va boshqa klinik holatlar alohida tekshiriladi.';break;
  }
  const references={
   spironolakton:'Faqat yurak yetishmovchiligida boshlash (§2.2): K ≤5,0 va eGFR >50 bo‘lsa yo‘riqnomada 25 mg/kun; eGFR 30–50 bo‘lsa 25 mg kunora boshlashni ko‘rib chiqish keltirilgan. Boshqa ko‘rsatmalar va eGFR <30 uchun bu jadvaldan doza chiqarilmaydi. Kaliy va klinik holat bu oynada baholanmagan.',
   siprofloksatsin:'Faqat kattalardagi oddiy peroral tabletka (§2.3): CrCl 30–50 ml/min — 250–500 mg har 12 soatda; 5–29 — 250–500 mg har 18 soatda; gemodializ/peritoneal dializ — 250–500 mg har 24 soatda, dializdan keyin. CrCl >50 da ko‘rsatmaga xos odatiy sxema tekshiriladi. eGFRdan CrCl taxmin qilinmaydi; uzaytirilgan ajralishli tabletka uchun boshqa yo‘riqnoma kerak.',
   rozuvastatin:'Tanlangan yo‘riqnomada og‘ir buyrak yetishmovchiligi (CLcr <30 ml/min/1,73 m²), gemodializ olinmasa: boshlash 5 mg/kun, maksimum 10 mg/kun (§2.5). Bu mezon eGFR maydonidan avtomatik chiqarilmaydi. Dori o‘zaro ta’siri, ko‘rsatma va boshqa cheklovlar alohida tekshiriladi.'
  };
  if(references[key])out.reference=references[key];
  if(!valid)out.text+=' eGFR kiritilmagan yoki yaroqsiz — qiymatga bog‘liq baho bajarilmadi.';
  return out;
 });
}
return {check,resolve,egfr,renal,number,levels,sources,setDataset,ready:()=>loaded,get drugs(){return DRUGS;},get ruleCount(){return PAIRS.length;},get sourceVersion(){return sourceVersion;}};
});
