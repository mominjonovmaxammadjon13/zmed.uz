'use strict';
/* Core local draft and export controls. Public reference search is in workspace.js. */
(function(){
 const kit=window.UzmedQabul;
 if(!kit)return;
 const $=id=>document.getElementById(id);
 const common=['uash','family','allergologist','pediatrics','derma','therapist','cardiologist','neurologist'];
 for(const [title,keys]of [['Ko‘p tanlanadiganlar',common],['Boshqa mutaxassislar',Object.keys(kit.specialties).filter(k=>!common.includes(k)).sort((a,b)=>kit.specialties[a].localeCompare(kit.specialties[b]))]]){
  const group=document.createElement('optgroup');group.label=title;
  for(const key of keys){const option=document.createElement('option');option.value=key;option.textContent=key==='uash'?'UASH — '+kit.specialties[key]:kit.specialties[key];group.append(option);}$('specialty').append(group);
 }
 const customOption=document.createElement('option');customOption.value='other';customOption.textContent='Boshqa mutaxassis — nomini kiritish';$('specialty').append(customOption);
 const single=new Set(['patient','age','date','icd','doctor']);
 const fields=$('fields'),labs=$('labs'),status=$('status');
 const setStatus=s=>{status.textContent=s;};
 for(const [id,title] of kit.fieldNames){
  const div=document.createElement('div');div.className='field';
  const label=document.createElement('label');label.htmlFor='field-'+id;label.textContent=title;
  const input=document.createElement(single.has(id)?'input':'textarea');
  input.id='field-'+id;input.maxLength=5000;
  if(id==='date'){input.type='date';}
  else if(single.has(id)){input.type='text';}
  if(id==='patient')input.placeholder='Maxfiylik uchun to‘liq ism o‘rniga mahalliy ID ishlatish mumkin';
  if(id==='allergies')input.placeholder='Noma’lum / aniqlanmagan / tasdiqlangan allergiya';
  if(id==='icd')input.placeholder='MKB-10 bo‘limida tekshirilgan kod';
  if(id==='treatment')input.placeholder='Dori nomi, kuchi, birlik, yo‘l, davomiylik — faqat shifokor belgilaydi';
  input.autocomplete='off';input.addEventListener('input',render);
  div.append(label,input);fields.appendChild(div);
 }
 const labKeys=[['name','Tahlil'],['value','Qiymat'],['unit','Birlik'],['low','Min'],['high','Max'],['date','Natija sanasi'],['docname','Hujjatdagi nomi (ixtiyoriy)']];
 function addLab(values={}){
  if(labs.children.length>=50){setStatus('50 tadan ortiq laboratoriya qatori mumkin emas.');return;}
  const row=document.createElement('div');row.className='labRow';
  for(const [name,label] of labKeys){
   const input=document.createElement('input');
   input.name=name;if(name==='date')input.type='date';if(name==='date'||name==='docname')input.className='vf-lab-meta';input.placeholder=label;input.value=kit.clean(values[name]||'',100);
   input.maxLength=100;input.setAttribute('aria-label',label);
   input.addEventListener('input',render);row.appendChild(input);
  }
  const rm=document.createElement('button');rm.type='button';rm.textContent='×';rm.title='Qatorni olib tashlash';
  rm.setAttribute('aria-label','Qatorni olib tashlash');
  rm.addEventListener('click',()=>{row.remove();render();});
  row.appendChild(rm);labs.appendChild(row);render();
 }
 function collect(){
  const out={template:$('template').value,specialty:$('specialty').value,customSpecialty:$('customSpecialty').value,documentKind:$('documentKind').value};
  for(const [key] of kit.fieldNames)out[key]=$('field-'+key).value;
  for(const key of ['icdChecked','ddiChecked','rxChecked','approved'])out[key]=$(key).checked;
  out.labs=[...labs.children].map(row=>{
   const o={};
   for(const input of row.querySelectorAll('input'))o[input.name]=input.value;
   return o;
  });
  return kit.enrich ? kit.enrich(out) : out;
 }
 function render(){
  const d=collect();
  $('note').textContent=kit.buildNote(d);
  const issues=kit.warnings(d);
  $('issues').textContent=issues.length?'To‘ldirish kerak bo‘lgan bandlar:\n• '+issues.join('\n• '):'';
 }
 kit.render=render;
 kit.collect=collect; kit.addLab=addLab;
 function download(filename,content,mime){
  const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
 }
 $('template').addEventListener('change',render);
 for(const id of ['specialty','customSpecialty','documentKind'])$(id).addEventListener('change',()=>{$('customSpecialtyField').hidden=$('specialty').value!=='other';$('approved').checked=false;render();});
 for(const id of ['icdChecked','ddiChecked','rxChecked','approved'])$(id).addEventListener('change',render);
 $('addLab').addEventListener('click',()=>addLab());
 $('word').addEventListener('click',()=>{
  download('uzmed-qabul-qoralama.doc',kit.wordHtml(kit.buildNote(collect())),'application/msword;charset=utf-8');
  setStatus('Word bilan ochiladigan .doc qoralamasi yaratildi.');
 });
 $('pdf').addEventListener('click',()=>{setStatus('Brauzer chop etish oynasida “PDF sifatida saqlash”ni tanlang.');window.print();});
 $('copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(kit.buildNote(collect()));setStatus('Qoralama matni nusxalandi.');}
  catch(_){setStatus('Brauzer nusxalashga ruxsat bermadi. Matnni qo‘lda belgilang.');}
 });
 $('ics').addEventListener('click',()=>{
  const ics=kit.calendarIcs($('reminder').value);
  if(!ics){setStatus('Eslatma uchun to‘g‘ri sana va vaqt kiriting.');return;}
  download('uzmed-qayta-korik.ics',ics,'text/calendar;charset=utf-8');
  setStatus('Bemor ismisiz kalendar fayli yaratildi. Telegram eslatmasi yuborilmadi.');
 });
 $('clear').addEventListener('click',()=>{
  if(!window.confirm('Qoralamadagi kiritilgan ma’lumotlar o‘chiriladi. Davom etilsinmi?'))return;
  for(const [key] of kit.fieldNames)$('field-'+key).value='';
  for(const id of ['icdChecked','ddiChecked','rxChecked','approved'])$(id).checked=false;
  $('template').value='initial';$('specialty').value='';$('customSpecialty').value='';$('customSpecialtyField').hidden=true;$('documentKind').value='exam';$('reminder').value='';labs.replaceChildren();addLab();
  setStatus('Qoralama tozalandi. Ma’lumot serverda saqlanmagan.');
 });
 addLab();render();
})();

