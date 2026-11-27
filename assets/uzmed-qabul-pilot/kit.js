'use strict';
/* UZMED Shifokor Qabuli data and document helpers. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.UzmedQabul=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const MAX=12000;
 const fieldNames=[
  ['patient','Bemor identifikatori (ixtiyoriy)'],
  ['age','Yosh'],['date','Qabul sanasi'],['complaints','Shikoyatlar'],
  ['history','Kasallik anamnezi'],['medications','Qabul qilayotgan dorilar'],
  ['allergies','Allergiya (aniqlanmagan bo‘lsa shunday yozing)'],
  ['exam','Obyektiv ko‘rik / vital ko‘rsatkichlar'],
  ['diagnosis','Klinik taxmin / tashxis (shifokor tasdiqlaydi)'],
  ['icd','MKB-10 kodi (tekshirilgan)'],
  ['tests','Tekshiruvlar'],['treatment','Davolash va tayinlov (shifokor tasdiqlaydi)'],
  ['advice','Tavsiyalar / xavf belgilari'],['followup','Nazorat / qayta ko‘rik'],
  ['doctor','Shifokor F.I.Sh.']
 ];
 const templates=Object.freeze({
  initial:'Birlamchi qabul',repeat:'Takroriy qabul',
  pediatrics:'Pediatriya',derma:'Dermatologiya'
 });
 const specialties=Object.freeze({"uash":"Umumiy amaliyot shifokori","family":"Oilaviy shifokor","allergologist":"Allergolog","immunologist":"Immunolog","pediatrics":"Pediatr","derma":"Dermatolog","dermatovenerologist":"Dermatovenerolog","therapist":"Terapevt","cardiologist":"Kardiolog","arrhythmologist":"Aritmolog","rheumatologist":"Revmatolog","pulmonologist":"Pulmonolog","gastroenterologist":"Gastroenterolog","hepatologist":"Gepatolog","endocrinologist":"Endokrinolog","diabetologist":"Diabetolog","nephrologist":"Nefrolog","urologist":"Urolog","andrologist":"Androlog","neurologist":"Nevrolog","neurosurgeon":"Neyroxirurg","epileptologist":"Epileptolog","psychiatrist":"Psixiatr","psychotherapist":"Psixoterapevt","narcologist":"Narkolog","infectiologist":"Infeksionist","hematologist":"Gematolog","oncologist":"Onkolog","oncohematologist":"Onkogematolog","radiotherapist":"Radioterapevt","phthisiatrist":"Ftiziatr","ent":"Otorinolaringolog (LOR)","ophthalmologist":"Oftalmolog","audiologist":"Surdolog","dentist":"Stomatolog","orthodontist":"Ortodont","maxillofacial":"Yuz-jag‘ jarrohi","surgeon":"Jarroh","cardiosurgeon":"Kardiojarroh","vascular":"Qon tomir jarrohi","thoracic":"Torakal jarroh","plastic":"Plastik jarroh","transplantologist":"Transplantolog","proctologist":"Proktolog","trauma":"Travmatolog-ortoped","sports":"Sport tibbiyoti shifokori","rehabilitation":"Reabilitolog","physiotherapist":"Fizioterapevt","reflexotherapist":"Refleksoterapevt","obgyn":"Akusher-ginekolog","gynecologist":"Ginekolog","reproductologist":"Reproduktolog","mammologist":"Mammolog","neonatologist":"Neonatolog","anesthesiologist":"Anesteziolog-reanimatolog","emergency":"Shoshilinch tibbiy yordam shifokori","radiologist":"Radiolog","sonographer":"Ultratovush diagnostikasi shifokori","functional":"Funksional diagnostika shifokori","endoscopist":"Endoskopist","pathologist":"Patologoanatom","laboratory":"Laboratoriya diagnostikasi shifokori","geneticist":"Tibbiy genetik","nutritionist":"Diyetolog","geriatrician":"Geriatr","occupational":"Kasb kasalliklari shifokori","epidemiologist":"Epidemiolog","hygienist":"Gigiyena shifokori","forensic":"Sud-tibbiyot eksperti","palliative":"Palliativ yordam shifokori","pediatric-allergy":"Bolalar allergologi","pediatric-neurology":"Bolalar nevrologi","pediatric-cardiology":"Bolalar kardiologi","pediatric-endocrinology":"Bolalar endokrinologi","pediatric-gastro":"Bolalar gastroenterologi","pediatric-nephrology":"Bolalar nefrologi","pediatric-urology":"Bolalar urologi","pediatric-surgery":"Bolalar jarrohi","pediatric-orthopedics":"Bolalar travmatolog-ortopedi","pediatric-hematology":"Bolalar gematologi","pediatric-psychiatry":"Bolalar psixiatri"});
 function specialtyName(d={}){
  const key=d.specialty||(['pediatrics','derma'].includes(d.template)?d.template:'');
  if(key==='other')return clean(d.customSpecialty,80).replace(/\s+/g,' ');
  return Object.hasOwn(specialties,key)?specialties[key]:'';
 }
 function documentTitle(d={}){
  if(d.documentKind==='certificate')return 'Tibbiy ma’lumotnoma';
  return (specialtyName(d)||'Shifokor')+(d.documentKind==='conclusion'?' xulosasi':' ko‘rigi');
 }
 function clean(s,max=MAX){return String(s??'').replace(/\u0000/g,'').trim().slice(0,max);}
 function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function num(v){
  const s=clean(v,60).replace(',','.');if(!/^[+-]?\d+(?:\.\d+)?$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)?n:null;
 }
 function assessLab(x){
  const name=clean(x.name,100), unit=clean(x.unit,60);
  const value=num(x.value), lo=num(x.low), hi=num(x.high);
  const raw=clean(x.value,60);
  if(!name||!raw)return {name,raw,unit,status:'to‘ldirilmagan',usable:false};
  if(value===null)return {name,raw,unit,status:'son xato',usable:false};
  if(!unit||lo===null||hi===null)return {name,raw,unit,status:'referens/birlik yetishmaydi',usable:false};
  if(lo>hi)return {name,raw,unit,status:'referens xato',usable:false};
  return {name,raw,unit,status:value<lo?'past':value>hi?'yuqori':'berilgan referens doirasida',usable:true,reference:clean(x.low,50)+'–'+clean(x.high,50)};
 }
 function warnings(d){
  const o=[];
  if(!clean(d.complaints))o.push('Shikoyatlar kiritilmagan.');
  if(!clean(d.exam))o.push('Obyektiv ko‘rik kiritilmagan; normal deb qabul qilinmaydi.');
  if(!clean(d.allergies))o.push('Allergiya holati noma’lum.');
  if(clean(d.treatment)&&!d.rxChecked)o.push('Tayinlov mustaqil tekshirildi belgisi qo‘yilmagan.');
  if(clean(d.icd)&&!d.icdChecked)o.push('MKB-10 kodi tasdiqlanmagan.');
  for(const x of (d.labs||[])){const r=assessLab(x);if(r.name&&r.status!=='berilgan referens doirasida'&&r.status!=='past'&&r.status!=='yuqori')o.push('Tahlil “'+r.name+'”: '+r.status);}
  return o;
 }
 function buildNote(d={}){
  const rows=['UZMED — '+documentTitle(d).toUpperCase()+' — QORALAMA',
   'Bu tasdiqlangan tibbiy hujjat, elektron imzo yoki avtomatik retsept emas.',
   'Qabul turi: '+(templates[d.template]||templates.initial)];
  if(specialtyName(d))rows.push('Mutaxassis: '+specialtyName(d));
  for(const [key,label] of fieldNames){
   const value=clean(d[key],key==='treatment'?100000:MAX);rows.push(label+': '+(value||'[kiritilmagan]'));
  }
  if((d.template==='pediatrics'||d.specialty==='pediatrics'))rows.push('Pediatriya: vazn, rivojlanish, yoshga mos me’yorlar alohida tekshirilishi shart.');
  if((d.template==='derma'||d.specialty==='derma'))rows.push('Dermatologiya: lokalizatsiya, morfologiya va shaxsiy ko‘rik tasdig‘i talab etiladi.');
  const labs=(d.labs||[]).filter(x=>clean(x.name)||clean(x.value));
  if(labs.length){
   rows.push('Laboratoriya ko‘rsatkichlari (foydalanuvchi kiritgan referens bo‘yicha):');
   labs.slice(0,50).forEach(x=>{
    const a=assessLab(x);
    rows.push('• '+clean(x.docname||x.name,100)+(clean(x.date,10)?' ['+clean(x.date,10)+']':'')+': '+clean(x.value,60)+' '+clean(x.unit,60)+'; referens '+clean(x.low,50)+'–'+clean(x.high,50)+'; '+a.status);
   });
  }
  rows.push('Dori-dori o‘zaro ta’siri: '+(d.ddiChecked?'Shifokor UZMED DDI bo‘limida alohida tekshirganini belgiladi.':'TEKSHIRILMAGAN — dori xavfsizligi avtomatik baholanmadi.'));
  rows.push('Klinik ma’lumotlarning yakuniy tekshiruvi: '+(d.approved?'Shifokor tomonidan tasdiqlandi (elektron imzo emas).':'QORALAMA — shifokor tekshiruvi zarur.'));
  const issues=warnings(d);if(issues.length)rows.push('To‘ldirish uchun eslatmalar:\n'+issues.map(x=>'• '+x).join('\n'));
  return rows.join('\n\n');
 }
 function wordHtml(text){
  return '<!doctype html><html><head><meta charset="utf-8"><title>UZMED hujjat</title></head><body style="font-family:Arial,sans-serif;font-size:12pt">'+
   String(text??'').split('\n').map(line=>'<p style="margin:6px 0">'+(escapeHtml(line)||'&nbsp;')+'</p>').join('')+'</body></html>';
 }
 function calendarIcs(localDate){
  const d=clean(localDate,20),m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(d);
  if(!m)return '';
  const dt=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]));
  if(Number.isNaN(dt.getTime())||dt.getFullYear()!==Number(m[1])||dt.getMonth()+1!==Number(m[2])||dt.getDate()!==Number(m[3])||dt.getHours()!==Number(m[4])||dt.getMinutes()!==Number(m[5]))return '';
  const stamp=t=>[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('')+'T'+String(t.getHours()).padStart(2,'0')+String(t.getMinutes()).padStart(2,'0')+'00';
  const end=new Date(dt.getTime()+30*60000);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UZMED//Qabul Pilot//UZ','BEGIN:VEVENT','UID:uzmed-local-'+stamp(dt)+'@calendar.invalid',
   'DTSTART:'+stamp(dt),'DTEND:'+stamp(end),'SUMMARY:UZMED qayta ko‘rik','DESCRIPTION:Shifokor tomonidan belgilangan nazorat uchrashuvi','END:VEVENT','END:VCALENDAR',''].join('\r\n');
 }
 return {fieldNames,templates,specialties,specialtyName,documentTitle,clean,escapeHtml,num,assessLab,warnings,buildNote,wordHtml,calendarIcs};
});
