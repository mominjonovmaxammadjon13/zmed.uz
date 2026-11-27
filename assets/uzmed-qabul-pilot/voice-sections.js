'use strict';
// Route explicit dictation headings. Preserve dictated facts, numbers and negations.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QabulVoiceSections=api;})(typeof window==='object'?window:globalThis,function(){
 const definitions=[
  ['complaints','Shikoyatlar','field-complaints',['shikoyat(?:lar)?(?:i)?','шикоят(?:лар)?(?:и)?','жалобы']],
  ['history','Kasallik anamnezi','field-history',['kasallik(?:ning)? (?:anamnez(?:i|isi)?|analiz(?:i)?)','anamnesis morbi','касаллик анамнез(?:и)?','анамнез заболевания']],
  ['life','Hayot anamnezi','life',['hayot(?:iy)? (?:anamnez(?:i|isi)?|analiz(?:i)?)','anamnesis vitae','ҳаёт анамнез(?:и)?','хаёт анамнез(?:и)?','анамнез жизни']],
  ['epidemiology','Epid. anamnez','epidemiology',['epid(?:emiologik|emiologiya|emiologik)?\\.? (?:anamnez(?:i|isi)?|analiz(?:i)?)','эпид(?:емиологик|емиологический)?\\.? анамнез(?:и)?','эпидемиологический анамнез']],
  ['medications','Qabul qilayotgan dorilar','field-medications',['qabul qil(?:ayotgan|adigan|gan) dori(?:lar|lari)?','doimiy dori(?:lar|lari)?','принимаемые препараты','принимаемые лекарства']],
  ['allergies','Allergiyalar','field-allergies',['allergologik anamnez(?:i)?','allergiya(?:lar|lari|si)?','аллергологический анамнез','аллергия','аллергии']],
  ['exam','Obyektiv ko‘rik','field-exam',['ob(?:y|\\x27)?ektiv (?:ko\\x27?rik|holat|status)','umumiy ko\\x27?rik','obyektiv','объективный (?:осмотр|статус)','объективно','status praesens']],
  ['neuro','Nevrologik status','neuro',['nevrologik (?:status|ko\\x27?rik|holat)','неврологический статус']],
  ['localis','Status localis','localis',['status (?:localis|lokalis)','mahalliy status','статус локалис','локальный статус']],
  ['comorbid','Hamroh tashxis','comorbid',['hamroh (?:tashxis(?:lar|i)?|kasallik(?:lar|lari)?)','сопутствующ(?:ий|ие) (?:диагноз|заболевания)']],
  ['competing','Raqobatlashuvchi tashxis','competing',['raqobatlashuvchi tashxis(?:lar|i)?','конкурирующий диагноз']],
  ['background','Fon kasalliklari','background',['fon (?:kasallik(?:lar|lari)?|tashxis(?:lar|i)?)','фонов(?:ый диагноз|ое заболевание|ые заболевания)']],
  ['complication','Asoratlar','complication',['asorat(?:lar|lari|i)?','осложнения']],
  ['diagnosis','Asosiy tashxis','field-diagnosis',['asosiy tashxis(?:i)?','tashxis(?:i)?','основной диагноз','диагноз']],
  ['tests','Tekshiruv rejasi','field-tests',['tekshiruv(?:lar|larning)? (?:reja(?:si)?|rejasi)','tekshirish reja(?:si)?','план обследования','обследования']],
  ['treatment','Davolash yozuvi','field-treatment',['davolash(?: reja(?:si)?| yozuvi)?','tayinlov(?:lar|lari)?','план лечения','лечение','назначения']],
  ['advice','Tavsiyalar','field-advice',['tavsiya(?:lar|lari)?','рекомендации']],
  ['followup','Nazorat','field-followup',['qayta (?:qabul|ko\\x27?rik)','nazorat(?: reja(?:si)?)?','контрольный осмотр','повторный (?:прием|приём)','контроль']]
 ];
 // Recognise short spoken headings as well as the longer form labels.
 definitions.find(d=>d[0]==='history')[3].push('anamnez(?:i)?','анамнез');
 definitions.find(d=>d[0]==='exam')[3].push("ko'rik",'кўрик','курик');
 definitions.find(d=>d[0]==='tests')[3].push('tekshiruv(?:lar|lari)?','текширув(?:лар)?');
 const fields=definitions.map(([key,label,id])=>({key,label,id}));
 const weak=new Set(['tashxis','tashxisi','диагноз','obyektiv','davolash','tayinlov','tayinlovlar','tayinlovlari','лечение','назначения','tavsiya','tavsiyalar','tavsiyalari','рекомендации','nazorat','контроль','asorat','asoratlar','asoratlari','asorati','осложнения','allergiya','allergiyalar','allergiyasi','allergiyalari','аллергия','аллергии']);
 // Short labels and follow-up phrases can also be ordinary clinical statements.
 for(const word of ["shikoyat","shikoyatlar","shikoyati","shikoyatlari","жалобы","anamnez","anamnezi","анамнез","ko'rik","кўрик","курик","tekshiruv","tekshiruvlar","tekshiruvlari","текширув","текширувлар","qayta ko'rik","qayta qabul"])weak.add(word);
 // One character in, one character out keeps all offsets valid in the original text.
 function normalized(text){return text.replace(/[‘’ʻʼ`ʹ]/g,"'").toLowerCase();}
 const patterns=definitions.flatMap(([key,, ,aliases])=>aliases.map(alias=>({key,re:new RegExp('(?<![\\p{L}\\p{N}_])(?:'+alias.replace(/ /g,'[ \\t\\r\\n]+')+')(?![\\p{L}\\p{N}_])','giu')})));
 function split(value){
  const text=String(value||''),normal=normalized(text),found=[];
  for(const {key,re}of patterns){re.lastIndex=0;for(const m of normal.matchAll(re)){
   const prefix=normal.slice(0,m.index),suffix=normal.slice(m.index+m[0].length);
   // Generic words can occur in clinical sentences; require a heading position or colon.
   if(weak.has(m[0])){
    const atBeginning=/^\s*$/u.test(prefix),afterBoundary=/[.!?;\n]\s*$/u.test(prefix),hasColon=/^\s*[:：]/u.test(suffix);
    if(!atBeginning&&!afterBoundary&&!hasColon)continue;
    // Clinical prose like "davolash uchun" is not a dictated section title.
    if(/^\s+(?:uchun|vaqtida|jarayonida|bo'yicha|haqida|to'g'risida)\b/iu.test(suffix))continue;
    // A follow-up action without a colon belongs to the current section, not a new heading.
    if(["qayta ko'rik","qayta qabul"].includes(m[0])&&!hasColon)continue;
   }
   found.push({key,start:m.index,end:m.index+m[0].length});
  }}
  found.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
  const headings=[];for(const h of found)if(!headings.length||h.start>=headings.at(-1).end)headings.push(h);
  const chunks=[],unassigned=[];
  if(!headings.length){if(text.trim())unassigned.push(text.trim());return {sections:[],unassigned,headings:0};}
  const initial=text.slice(0,headings[0].start).trim();if(initial&&!/^[\d.)\-–—*#\s]+$/u.test(initial))unassigned.push(initial);
  for(let i=0;i<headings.length;i++){
   const h=headings[i],raw=text.slice(h.end,headings[i+1]?.start??text.length);
   const content=raw.replace(/^\s*[:：,\-–—.]?\s*/u,'').trim();
   if(content)chunks.push({key:h.key,text:content});
  }
  const sections=[];for(const {key,text:content}of chunks){let section=sections.find(s=>s.key===key);if(!section){section={...fields.find(f=>f.key===key),text:''};sections.push(section);}section.text+=(section.text?'\n':'')+content;}
  return {sections,unassigned,headings:headings.length};
 }
 function append(sections,get){
  const writes=[];
  for(const section of sections){const field=get(section.id);if(!field)return {ok:false,error:'missing',label:section.label};
   const before=field.value,after=before+(before.trim()?'\n':'')+section.text;
   if(field.maxLength>0&&after.length>field.maxLength)return {ok:false,error:'overflow',label:section.label};
   writes.push({id:section.id,label:section.label,before,after});
  }
  // Validate every destination before changing any of them.
  for(const w of writes)get(w.id).value=w.after;
  for(const w of writes)get(w.id).dispatchEvent(new Event('input',{bubbles:true}));
  return {ok:true,writes};
 }
 function undo(writes,get){
  if(!writes.length||writes.some(w=>!get(w.id)||get(w.id).value!==w.after))return false;
  for(const w of writes)get(w.id).value=w.before;
  for(const w of writes)get(w.id).dispatchEvent(new Event('input',{bubbles:true}));return true;
 }
 // Conservative recognition of free-form dictation. Never invent clinical content.
 // Uncertain clauses stay visible as unassigned text for the physician to review.
 function inferNatural(value){
  const source=String(value||'').trim();
  const sentences=source.split(/(?<=[.!?;])\s+(?=[^\d\s])/u).map(x=>x.trim()).filter(Boolean);
  const sections=[],unassigned=[];
  function choose(raw){
   const s=normalized(raw);
   // Explicit diagnosis only: never generate a diagnosis from symptoms.
   if(/(?:tashxis(?:i|im)?|diagnoz|диагноз|ташхис)/iu.test(s))return 'diagnosis';
   if(/(?:tavsiya|maslahat|parhez|nazorat|qayta (?:ko'rik|kelish|murojaat)|рекомендац|контроль)/iu.test(s))return 'advice';
   if(/(?:tekshiruv(?:lar)?|qon tahlil|siydik tahlil|laborator|ut[tzi]|u\.t\.t|ekg|mrt|mri|rentgen|rentgеn|uzi|ultratovush|гемоглобин|анализ|обследован)/iu.test(s))return 'tests';
   if(/(?:ko'rikda|ko'rik paytida|ob'ektiv|obyektiv|auskultat|palpats|puls(?:i)?\s*\d|(?:qon bosimi|arterial bosim|a\/b|ab)\s*[:\-]?\s*\d|harorat(?:i)?\s*[:\-]?\s*\d|spo2\s*[:\-]?\s*\d|сатурац|объектив)/iu.test(s))return 'exam';
   if(/(?:davolash|tayinlad|buyurild|ichish(?:i|ni)?\s+kerak|qo'llash|mg\s*(?:dan|kuniga|x\s*\d)|kuniga\s*\d+\s*(?:mahal|marta)|лечени|назначен)/iu.test(s)){
    if(!/(?:ilgari|avval|oldin|hozirgacha|doimiy)\s+.{0,45}(?:qabul|ichgan|dori)/iu.test(s))return 'treatment';
   }
   if(/(?:shikoyat|og'ri|og'r|qusish|qusy|ko'ngil ayn|yo'tal|isitma|holsiz|ich ket|nafas qis|qichish|toshma|shish|bosh aylan|bezovta|боль|кашел|рвот|жалоб)/iu.test(s))return 'complaints';
   if(/(?:anamnez|kasallik .{0,30}boshlan|birinchi marta|ilgari|avval|o'tmishda|(?:kun|hafta|oy|yil)(?:dan)? beri|давно|анамнез|началос|давность)/iu.test(s))return 'history';
   return '';
  }
  for(const sentence of sentences){
   const key=choose(sentence);
   if(!key){unassigned.push(sentence);continue;}
   let slot=sections.find(x=>x.key===key);
   if(!slot){slot={...fields.find(f=>f.key===key),text:''};sections.push(slot);}
   slot.text+=(slot.text?'\n':'')+sentence;
  }
  return {sections,unassigned,headings:0,inferred:true};
 }
 function spokenHeadings(value){
  const text=String(value||''),normal=normalized(text),hits=[];
  const labels=/(shikoyatlar|shikoyati|anamnez|anamnezi|ko'rik|tekshiruvlar|tekshiruv|tashxis|davolash|tavsiyalar|tavsiya)\b/giu;
  const mapping={shikoyatlar:'complaints',shikoyati:'complaints',anamnez:'history',anamnezi:'history',"ko'rik":'exam',tekshiruvlar:'tests',tekshiruv:'tests',tashxis:'diagnosis',davolash:'treatment',tavsiyalar:'advice',tavsiya:'advice'};
  for(const match of normal.matchAll(labels)){
   const prev=normal.slice(0,match.index);
   if(prev&&!/(?:\s|[.!?;:,])$/u.test(prev))continue;
   const next=normal.slice(match.index+match[0].length);
   if(/^\s+(?:qiladi|qilgan|qilmoqda|qo'yildi|qo'yilgan|uchun|bo'yicha|paytida|kerak)/iu.test(next))continue;
   hits.push({key:mapping[match[0]],start:match.index,end:match.index+match[0].length});
  }
  if(hits.length<2||new Set(hits.map(h=>h.key)).size<2)return null;
  // Two headings without punctuation count only if the first label begins the dictation.
  const firstAtStart=/^\s*$/.test(normal.slice(0,hits[0].start));
  if(hits.length<4&&!firstAtStart)return null;
  const sections=[],unassigned=[];
  const intro=text.slice(0,hits[0].start).trim();if(intro)unassigned.push(intro);
  for(let i=0;i<hits.length;i++){
   const h=hits[i],raw=text.slice(h.end,hits[i+1]?.start??text.length);
   const content=raw.replace(/^\s*[:：,.\-–—]?\s*/u,'').trim();if(!content)continue;
   let slot=sections.find(x=>x.key===h.key);
   if(!slot){slot={...fields.find(f=>f.key===h.key),text:''};sections.push(slot);}
   slot.text+=(slot.text?'\n':'')+content;
  }
  return {sections,unassigned,headings:hits.length,spoken:true};
 }
 function smartSplit(value){
  const spoken=spokenHeadings(value);if(spoken)return spoken;
  const exact=split(value),plain=normalized(String(value||''));
  // Several section labels or a literal label followed by a colon indicate structured dictation.
  // Incidental words ("shikoyat qiladi", "tashxis qo'yildi") are not headings.
  const hasLabelColon=/(?:^|[.!?;\n]\s*)(?:shikoyat(?:lar)?(?:i)?|anamnez(?:i)?|kasallik anamnezi|hayot anamnezi|ko'rik|obyektiv ko'rik|tekshiruv(?:lar)?|tashxis|davolash|tavsiyalar?|nazorat)\s*[:：]/iu.test(plain);
  return exact.headings>=3||hasLabelColon?exact:inferNatural(value);
 }
 return {fields,split:smartSplit,append,undo};
});
