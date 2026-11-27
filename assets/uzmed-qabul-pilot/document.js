'use strict';
(function(){
 const kit=window.UzmedQabul,focus=window.QabulFocus,$=id=>document.getElementById(id);
 if(!kit?.collect||!focus)return;
 const esc=kit.escapeHtml;
 const defaults={font:'Times New Roman',size:10.5,density:'compact',lab:'text',med:'text',order:'original',borders:'all',bold:false,italic:false,institution:''};
 let settings={...defaults};
 let output={paper:'A4',kind:'full',specialty:'auto',customSpecialty:'',design:'hospital'};
 const reportTypes=[['full','Shifokor ko‘rigi'],['extract','Tibbiy ko‘chirma'],['epicrisis','Epikriz'],['consult','Mutaxassis konsultatsiyasi'],['certificate','Tibbiy ma’lumotnoma'],['rx','Retsept'],['referral','Tekshiruv yo‘llanmasi'],['protocol','Tekshiruv bayonnomasi']];
 const specialties=[['allergolog','Allergolog'],['immunolog','Immunolog'],['allergolog-immunolog','Allergolog-immunolog'],['uash','Umumiy amaliyot shifokori'],['terapevt','Terapevt'],['pediatr','Pediatr'],['neonatolog','Neonatolog'],['kardiolog','Kardiolog'],['nevrolog','Nevrolog'],['pulmonolog','Pulmonolog'],['dermatolog','Dermatolog'],['dermatovenerolog','Dermatovenerolog'],['gastroenterolog','Gastroenterolog'],['endokrinolog','Endokrinolog'],['nefrolog','Nefrolog'],['urolog','Urolog'],['androlog','Androlog'],['akusher-ginekolog','Akusher-ginekolog'],['ginekolog','Ginekolog'],['jarroh','Jarroh'],['travmatolog','Travmatolog-ortoped'],['revmatolog','Revmatolog'],['lor','Otorinolaringolog (LOR)'],['oftalmolog','Oftalmolog'],['infeksionist','Infeksionist'],['gematolog','Gematolog'],['onkolog','Onkolog'],['ftiziatr','Ftiziatr'],['psixiatr','Psixiatr'],['psixoterapevt','Psixoterapevt'],['neyroxirurg','Neyroxirurg'],['kardiojarroh','Kardiojarroh'],['anesteziolog','Anesteziolog-reanimatolog'],['reanimatolog','Reanimatolog'],['radiolog','Radiolog'],['uzi','UTT mutaxassisi'],['funksional','Funksional diagnostika mutaxassisi'],['stomatolog','Stomatolog'],['proktolog','Koloproktolog'],['mammolog','Mammolog'],['genetik','Tibbiy genetik'],['geriatr','Geriatr'],['dietolog','Dietolog'],['reabilitolog','Reabilitolog'],['fizioterapevt','Fizioterapevt'],['endoskopist','Endoskopist'],['epidemiolog','Epidemiolog'],['boshqa','Boshqa mutaxassis']];
 const availableKinds=reportTypes.map(x=>x[0]);
 function specialistName(d){
  if(output.specialty==='boshqa')return output.customSpecialty.trim()||'Mutaxassis';
  if(output.specialty.startsWith('registered:')){
   const opt=[...($('specialty')?.options||[])].find(x=>x.value===output.specialty.slice(11));
   return opt?.textContent?.trim().slice(0,100)||kit.specialtyName(d)||'Shifokor';
  }
  if(output.specialty!=='auto')return specialties.find(x=>x[0]===output.specialty)?.[1]||'Shifokor';
  return kit.specialtyName(d)||'Shifokor';
 }
 function reportTitle(d){
  const spec=specialistName(d).replace(/\s+ko['‘’]rigi$/i,'').trim();
  if(output.kind==='full')return (spec==='Shifokor'?'SHIFOKOR':spec.toLocaleUpperCase('uz'))+' KO‘RIGI';
  if(output.kind==='consult')return spec.toLocaleUpperCase('uz')+' KONSULTATSIYASI';
  return ({extract:'TIBBIY KO‘CHIRMA',epicrisis:'EPIKRIZ',certificate:'TIBBIY MA’LUMOTNOMA',rx:'RETSEPT QORALAMASI',referral:'TEKSHIRUV YO‘LLANMASI',protocol:'TEKSHIRUV BAYONNOMASI'})[output.kind]||'SHIFOKOR KO‘RIGI';
 }
 function reportSubtitle(){return ({full:'BAYONNOMA',extract:'KASALLIK TARIXIDAN KO‘CHIRMA',epicrisis:'KLINIK EPIKRIZ QORALAMASI',consult:'KONSULTATIV XULOSA',certificate:'SHIFOKOR QAYDI',rx:'DORI TAYINLOVI',referral:'TIBBIY YO‘LLANMA',protocol:'TEKSHIRUV NATIJALARI'})[output.kind]||'BAYONNOMA';}
 const pageSize=()=>output.paper==='A5'?[148,210]:[210,297];
 try{const s=JSON.parse(localStorage.getItem('uzmed_qabul_print_v1')||'{}');for(const k of ['font','density','lab','med','order','borders'])if(typeof s[k]==='string')settings[k]=s[k];if(Number.isFinite(s.size)&&s.size>=8&&s.size<=16)settings.size=s.size;for(const k of ['bold','italic'])if(typeof s[k]==='boolean')settings[k]=s[k];}catch(_){}
 try{const v=JSON.parse(localStorage.getItem('uzmed_qabul_print_v1')||'{}');if(typeof v.institution==='string')settings.institution=v.institution.slice(0,160);}catch(_){}
 const allowed={font:['Arial','Times New Roman','Calibri','Georgia'],density:['dense','compact','normal'],lab:['table','text'],med:['table','group','text'],order:['original','name','time'],borders:['all','rows','none']};for(const [k,vs]of Object.entries(allowed))if(!vs.includes(settings[k]))settings[k]=defaults[k];
 const dialog=focus.dialog('documentDialog','Qabul hujjati');dialog.classList.add('qd-dialog');
 const controls=document.createElement('div');controls.className='qd-toolbar';
 controls.innerHTML='<div class="qd-toolbar-actions"><button type="button" id="docPrint" class="qd-primary">🖨 Printerga chop etish</button><button type="button" id="docPrintView">Chop varag‘ini ochish</button><button type="button" id="docWord">↓ Word (.docx)</button><button type="button" id="docCopy">⧉ Hujjatdan nusxa olish</button><button type="button" id="docZoom" aria-pressed="false">100%</button><button type="button" id="docEditInPlace" aria-pressed="false">Hujjat ichida tahrirlash</button><button type="button" id="docEdit">← Tahrirlash</button></div><details id="docOptions"><summary>Hujjat ko‘rinishini sozlash</summary><div class="qd-options"><label class="qd-institution">Muassasa / klinika nomi<input id="docInstitution" maxlength="160" placeholder="Ixtiyoriy"></label><label>Shrift<select id="docFont"><option>Arial</option><option>Times New Roman</option><option>Calibri</option><option>Georgia</option></select></label><label>O‘lcham<select id="docSize">'+[8,9,9.5,10,10.5,11,12,14,16].map(n=>'<option value="'+n+'">'+n+' pt</option>').join('')+'</select></label><label>Zichlik<select id="docDensity"><option value="dense">Zich</option><option value="compact">O‘rtacha</option><option value="normal">Keng</option></select></label><label>Laboratoriya<select id="docLab"><option value="table">Jadval</option><option value="text">Matn</option></select></label><label>Davolash<select id="docMed"><option value="table">Jadval</option><option value="group">Guruhlar</option><option value="text">Matn</option></select></label><label>Dorilar tartibi<select id="docOrder"><option value="original">Kiritilgan tartib</option><option value="name">Nomi bo‘yicha</option><option value="time">Qabul vaqti bo‘yicha</option></select></label><label>Jadval chegarasi<select id="docBorders"><option value="all">Barcha chegaralar</option><option value="rows">Gorizontal</option><option value="none">Chegarasiz</option></select></label><button type="button" id="docBold" aria-pressed="false"><b>Qalin</b></button><button type="button" id="docItalic" aria-pressed="false"><i>Kursiv</i></button><button type="button" id="docReset">Qaytarish</button></div></details><p class="qd-help">Printer uchun «Printerga chop etish»ni bosing va qurilmani tanlang. iPhone ichki brauzerida oyna chiqmasa, «Chop varag‘ini ochish» orqali Ulashish → Chop etish ni tanlang. PDF uchun ham chop etish oynasidan saqlashni tanlash mumkin. Matn A4 varaq hoshiyalari ichiga joylashadi. Sig‘magan matn avtomatik keyingi A4 sahifaga o‘tadi.</p><p id="docStatus" role="status"></p>';
 const pageCount=document.createElement('p');pageCount.id='docPageCount';pageCount.className='qd-page-count';controls.append(pageCount);
 const stage=document.createElement('div');stage.className='qd-stage';const page=document.createElement('article');page.id='documentPage';page.className='docPage';const paper=document.createElement('div');paper.className='qd-paper';paper.append(page);stage.append(paper);dialog.append(controls,stage);
 const holder=document.createElement('div');holder.className='qd-paper-holder';stage.replaceChildren(holder);holder.append(paper);
 const printRoot=document.createElement('div');printRoot.id='qabulPrint';document.body.append(printRoot);
 const printTools=document.createElement('div');printTools.id='qabulPrintTools';printTools.setAttribute('role','region');printTools.setAttribute('aria-label','Chop etish boshqaruvi');
 printTools.innerHTML='<div><strong>🖨 Printerga chop etish</strong><p>A4 · To‘liq tibbiy hujjat · Sahifalar avtomatik bo‘linadi.</p></div><div class="qd-print-tool-actions"><button type="button" id="qdNativePrint">🖨 Chop etish oynasi</button><button type="button" id="qdReturnPrint">← Qabulga qaytish</button></div><p id="qdPrintHelp" role="status">iPhone’da printer oynasi ochilmasa, pastdagi brauzerning Ulashish (↑) tugmasidan «Chop etish»ni tanlang. Printer va telefon bitta Wi-Fi tarmog‘ida bo‘lsin.</p>';
 document.body.append(printTools);
 const style=document.createElement('style');style.id='qabulPageSettings';document.head.append(style);
 function editable(t,target){return '<span data-qabul-field="'+esc(target)+'">'+lines(t)+'</span>';}
 function cell(value){if(value&&typeof value==='object')return editable(value.text,value.target);return lines(value);}
 function lines(t){return esc(kit.clean(t)).replace(/\n/g,'<br>');}
 function para(t,cls='',target=''){const value=cls==='docCompactList'?String(t||'').replace(/\r?\n+/g,'; '):t;return kit.clean(value)?'<p'+(cls?' class="'+cls+'"':'')+'>'+(target?editable(value,target):lines(value))+'</p>':'';}
 function labeled(title,t,target=''){return kit.clean(t)?'<p><strong>'+esc(title)+': </strong>'+(target?editable(t,target):lines(t))+'</p>':'';}
 function section(title,body){if(output.kind==='rx'&&title!=='Davolash')return '';if(output.kind==='referral'&&!['Asosiy tashxis','Tekshiruv rejasi','Tekshiruvlar bo‘yicha qaydlar'].includes(title))return '';if(output.kind==='certificate'&&!['Asosiy tashxis','Tavsiyalar'].includes(title))return '';if(output.kind==='protocol'&&!['Tekshiruv rejasi','Tekshiruvlar bo‘yicha qaydlar','Laboratoriya natijalari','Obyektiv ko‘rik'].includes(title))return '';if(!body)return '';const heading='<strong class="docHeading"><em>'+esc(title)+':</em> </strong>';return '<section class="docSection">'+(/^<p(?:\s|>)/.test(body)?body.replace(/^(<p[^>]*>)/,'$1'+heading):'<h2>'+esc(title)+'</h2>'+body)+'</section>';}
 function proseRows(labels,rows){return rows.map((row,i)=>'<p>'+row.map((value,j)=>(j?'<strong>'+esc(labels[j])+': </strong>':'<strong>'+(i+1)+'. </strong>')+cell(value)).join('; ')+'</p>').join('');}
 function table(head,rows,widths){return rows.length?'<table class="docTable">'+(widths?'<colgroup>'+widths.map(w=>'<col style="width:'+w+'%">').join('')+'</colgroup>':'')+(head.length?'<thead><tr>'+head.map(s=>'<th scope="col">'+esc(s)+'</th>').join('')+'</tr></thead>':'')+'<tbody>'+rows.map(r=>'<tr>'+r.map(s=>'<td>'+cell(s)+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'';}
 function rx(){return [...$('rxRows').children].map((row,index)=>({...Object.fromEntries([...row.querySelectorAll('input[name]')].map(e=>[e.name,e.value.trim()])),index})).filter(x=>['name','inn','dose','frequency','route','duration','food','notes','goal'].some(k=>x[k]));}
 function snapshot(){const d=kit.collect();d.rx=rx();d.treatmentNotes=$('field-treatment').value;return d;}
 function make(d){
  const missing='________________';
  let out='<header class="docBand"><div class="docFormalMasthead">'+(['formal','modern'].includes(output.design)?'<div class="docFormalLogo">UZMED<small>TIBBIY HUJJAT</small></div>':'')+'<div class="docFormalOrg">UZMED · TIBBIY HUJJAT'+(settings.institution?'<p class="docInstitution">'+esc(settings.institution)+'</p>':'')+'</div>'+(['formal','modern'].includes(output.design)?'<div class="docFormalStamp">MUASSASA<small> / MUHR JOYI</small></div>':'')+'</div><div class="docFormalDivider"></div><h1 class="docFormalTitle">'+esc(reportTitle(d))+'</h1><p class="docFormalSubtitle">'+esc(reportSubtitle())+'</p><p class="docType">'+esc([specialistName(d),kit.templates[d.template]||kit.templates.initial].filter(Boolean).join(' · '))+'</p><p class="docIdentityLine"><strong>Bemor F.I.Sh. / ID: </strong>'+editable(d.patient||missing,'field-patient')+'</p><p class="docIdentityLine"><strong>Yosh / jinsi: </strong>'+lines([d.age,d.extra?.sex].filter(Boolean).join(' / ')||missing)+' · <strong>Qabul sanasi: </strong>'+editable(d.date||missing,'field-date')+'</p><p class="docIdentityLine"><strong>Shifokor: </strong>'+editable(d.doctor||missing,'field-doctor')+'</p></header>';
  out+=section('Shikoyatlar',para(d.complaints,'','field-complaints'));
  out+=section(kit.clean(d.history)?'Kasallik anamnezi':'Anamnez',para(d.history,'','field-history')+labeled('Hayot anamnezi',d.extra?.life,'life')+labeled('Epidemiologik anamnez',d.extra?.epidemiology,'epidemiology')+labeled('Qabul qilayotgan dorilar',d.medications,'field-medications')+labeled('Allergiya',d.allergies,'field-allergies'));
  out+=section(kit.clean(d.exam)?'Obyektiv ko‘rik':'Ko‘rik',para(d.exam,'','field-exam')+labeled('Nevrologik status',d.extra?.neuro,'neuro')+labeled('Status localis',d.extra?.localis,'localis'));
  out+=section('Asosiy tashxis',para(d.diagnosis,'','field-diagnosis')+labeled('MKB-10',d.icd,'field-icd')+(d.extra?.diagnoses||[]).map(([t,v],i)=>labeled(t,v,['comorbid','competing','background','complication'][i])).join(''));
  out+=section('Differensial tashxis',para(d.extra?.differential,'','qc-differential'));out+=section('Aniqlashtirish rejasi',para(d.extra?.diagnostic_plan,'','qc-diagnostic_plan'));
  out+=section('Tekshiruv rejasi',para(d.tests,'docCompactList','field-tests'));out+=section('Tekshiruvlar bo‘yicha qaydlar',para(d.extra?.test_notes,'','qc-test_notes'));
  const labs=(d.labs||[]).map((x,i)=>({...x,index:i})).filter(x=>x.name||x.value||x.unit||x.low||x.high).map(x=>{const a=kit.assessLab(x),edit=(key,text)=>({text,target:'lab:'+x.index+':'+key});return [edit('docname',x.docname||x.name||'[nomi kiritilmagan]'),edit('date',x.date||''),edit('value',x.value||'[qiymat kiritilmagan]'),edit('unit',x.unit||'—'),[x.low||'?',x.high||'?'].join('–'),a.status];});
  const labColumns=['Ko‘rsatkich','Sana','Natija','Birlik','Referens','Holat'];
  out+=section('Laboratoriya natijalari',settings.lab==='table'?table(labColumns,labs,[24,16,12,12,16,20]):proseRows(labColumns,labs));
  let meds=d.rx.map(x=>({...x}));if(settings.order==='name')meds.sort((a,b)=>a.name.localeCompare(b.name));if(settings.order==='time')meds.sort((a,b)=>(a.frequency||'').localeCompare(b.frequency||''));
  const medColumns=['Dori nomi','Doza','Qabul soni / vaqti','Yo‘l','Davomiylik','Ovqat','Izoh / maqsad'];
  const medCell=(row,key,fallback='—')=>editable(row[key]||fallback,'rx:'+row.index+':'+key);
  const medRows=rows=>rows.map(x=>[{text:x.name||'—',target:'rx:'+x.index+':name'},...['dose','frequency','route','duration','food'].map(k=>({text:x[k]||'—',target:'rx:'+x.index+':'+k})),[x.notes,x.goal].filter(Boolean).join(' / ')||'—']);
  let med='';if(settings.med==='text')med=meds.map((row,index)=>{
   const inn=row.inn&&row.inn.toLowerCase()!==(row.name||'').toLowerCase()?' ('+medCell(row,'inn')+')':'';
   const regimen=['dose','frequency','route','food','duration'].filter(key=>row[key]).map(key=>medCell(row,key));
   const details=[['goal','Maqsad'],['notes','Izoh']].filter(([key])=>row[key]);
   const missing=[['dose','Doza'],['frequency','Qabul vaqti / soni'],['route','Qabul yo‘li'],['duration','Davomiylik']].filter(([key])=>!row[key]);
   const extras=[...details,...missing].map(([key,label])=>' <strong>'+label+' · </strong>'+medCell(row,key,'kiritilmagan')+'.').join('');
   return '<p><strong>'+(index+1)+'. '+medCell(row,'name','Nomi kiritilmagan dori')+'</strong>'+inn+' — '+(regimen.join(', ')||'Qabul tartibi kiritilmagan')+'.'+extras+'</p>';
  }).join('');
  else if(settings.med==='group'){const groups=new Map();for(const m of meds){const key=m.frequency||'Qabul vaqti kiritilmagan';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}for(const [title,rows]of groups)med+='<h3>'+esc(title)+'</h3>'+table(medColumns,medRows(rows),[23,10,14,9,11,13,20]);}
  else med=table(medColumns,medRows(meds),[23,10,14,9,11,13,20]);
  const ingredients=settings.med==='text'?'':meds.filter(x=>x.inn).map(x=>labeled((x.name||'Dori')+' · INN',x.inn,'rx:'+x.index+':inn')).join('');
  out+=section('Davolash',med+ingredients+labeled('Qo‘shimcha yozuv',d.treatmentNotes,'field-treatment'));out+=section('Tavsiyalar',para(d.advice,'','field-advice')+labeled('Nazorat / qayta ko‘rik',d.followup,'field-followup'));
  const checks=[['MKB',d.icdChecked],['Tayinlov',d.rxChecked],['DDI',d.ddiChecked]].map(([t,v])=>t+': '+(v?'shifokor tekshirganini belgiladi':'tekshirilmagan')).join(' · ');
  const warnings=kit.warnings(d);out+='<section class="docReview"><p><strong>'+(d.approved?'Shifokor ko‘rib chiqqan qoralama':'Qoralama · shifokor tekshiruvi zarur')+'</strong></p><p>'+esc(checks)+'</p>'+(warnings.length?'<p>Tekshirish eslatmalari: '+warnings.map(esc).join(' • ')+'</p>':'')+(d.rx.some(x=>['name','dose','frequency','route','duration','food'].some(k=>!x[k]))?'<p>Jadvaldagi — belgisi: ma’lumot kiritilmagan.</p>':'')+'Bu qoralama elektron imzo yoki tasdiqlangan retsept emas.</p>'+(output.kind==='epicrisis'?'<p>Epikriz uchun statsionar davolanish va chiqarilish ma’lumotlari shifokor tomonidan alohida tekshirilishi shart.</p>':'')+'</section><footer class="docSign"><div><strong>'+esc(d.doctor||'Shifokor F.I.Sh. kiritilmagan')+'</strong></div><div>Shifokor imzosi / muhr</div></footer>';
  return out;
 }
 function applySettings(el){el.style.fontFamily=settings.font+', Arial, sans-serif';el.style.fontSize=settings.size+'pt';el.style.lineHeight=({dense:1.15,compact:1.3,normal:1.45})[settings.density];el.style.fontWeight=settings.bold?'700':'400';el.style.fontStyle=settings.italic?'italic':'normal';el.dataset.borders=settings.borders;el.dataset.density=settings.density;el.dataset.design=output.design;}
 let fullPreview=false,rawHtml='',pages=[],editing=false;
 const editedFields=new Set();
 function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
 function sourceField(target){const m=/^(lab|rx):(\d+):([a-z]+)$/.exec(target);if(m){const parent=$(m[1]==='lab'?'labs':'rxRows');return parent?.children[Number(m[2])]?.querySelector('[name="'+m[3]+'"]');}return $(target);}
 paper.addEventListener('input',e=>{const span=e.target.closest('[data-qabul-field]');if(!editing||!span)return;e.stopPropagation();const target=sourceField(span.dataset.qabulField);if(!target)return;const value=(span.innerText||'').replace(/\u0000/g,'').slice(0,target.maxLength>0?target.maxLength:5000);if(target.type==='date'&&value&&!validDate(value)){ $('docStatus').textContent='Sana YYYY-MM-DD shaklida bo‘lsin.';return;}target.value=value;editedFields.add(target);$('approved').checked=false;if(span.dataset.qabulField.startsWith('rx:')||target.id==='field-treatment'){$('ddiChecked').checked=false;$('rxChecked').checked=false;}if(target.id==='field-icd'||target.id==='field-diagnosis')$('icdChecked').checked=false;window.dispatchEvent(new CustomEvent('qabul:document-edit'));});
 paper.addEventListener('focusout',e=>{if(!e.target.closest('[data-qabul-field]'))return;if(paper.contains(e.relatedTarget))return;const fields=[...editedFields];editedFields.clear();for(const field of fields){field.dispatchEvent(new Event('input',{bubbles:true}));}});
 $('docEditInPlace').onclick=()=>{editing=!editing;$('docEditInPlace').setAttribute('aria-pressed',String(editing));$('docEditInPlace').textContent=editing?'Tahrirni yakunlash':'Hujjat ichida tahrirlash';refresh();};
 const measureHost=document.createElement('div');
 measureHost.style.cssText='position:fixed;left:-20000px;top:0;width:210mm;visibility:hidden;pointer-events:none';
 document.body.append(measureHost);
 const documentSource=document.createElement('article');
 const margins={dense:'9mm 10mm 16mm 14mm',compact:'11mm 12mm 17mm 16mm',normal:'14mm 14mm 18mm 20mm'};
 function fitPreview(){
  if(!dialog.open)return;
  const available=stage.clientWidth-parseFloat(getComputedStyle(stage).paddingLeft)-parseFloat(getComputedStyle(stage).paddingRight);
  if(available<=0)return;
  const scale=fullPreview?1:Math.min(1,available/page.offsetWidth);
  paper.style.transform='scale('+scale+')';holder.style.width=(page.offsetWidth*scale)+'px';holder.style.height=(paper.offsetHeight*scale)+'px';
 }
 $('docZoom').onclick=()=>{fullPreview=!fullPreview;$('docZoom').textContent=fullPreview?'Varaqqa moslash':'100%';$('docZoom').setAttribute('aria-pressed',String(fullPreview));fitPreview();};
 window.addEventListener('resize',fitPreview);
 let body;
 function newPage(){
  const el=pages.length?page.cloneNode(false):page;el.innerHTML='';
  if(el!==page)el.removeAttribute('id');
  el.style.transform='';el.dataset.paper=output.paper;const [width,height]=pageSize();el.style.cssText+=';width:'+width+'mm;min-width:'+width+'mm;max-width:'+width+'mm;height:'+height+'mm;min-height:'+height+'mm;max-height:'+height+'mm';el.style.padding=margins[settings.density];applySettings(el);
  body=document.createElement('div');body.className='docBody';
  const [top,right,bottom,left]=margins[settings.density].split(' ');
  body.style.height='calc('+pageSize()[1]+'mm - '+top+' - '+bottom+' - 2mm)';
  el.append(body);
  const folio=document.createElement('div');folio.className='docFolio';folio.style.left=left;folio.style.right=right;el.append(folio);
  if(el!==page)paper.append(el);
  pages.push(el);return el;
 }
 function fits(){return body.scrollHeight<=body.clientHeight+2;}
 function switchPage(){newPage();}
 function insertStandalone(node){
  const clone=node.cloneNode(true);body.append(clone);
  if(fits())return;
  clone.remove();
  if(body.children.length)switchPage();
  body.append(clone);
 }
 function appendSection(root){
  const first=root.firstElementChild,head=first?.tagName==='H2'?first:null;
  let wrap;
  function openWrap(){
   wrap=root.cloneNode(false);if(head)wrap.append(head.cloneNode(true));body.append(wrap);
  }
  function place(node){
   const x=node.cloneNode(true);wrap.append(x);
   if(fits())return true;
   x.remove();return false;
  }
  function nextWrap(){
   if(wrap.children.length===(head?1:0))wrap.remove();
   switchPage();openWrap();
  }
  function splitText(node){
   const content=(node.innerText||node.textContent||'').replace(/\r/g,'');
   let at=0;
   while(at<content.length){
    // Preserve all characters even when one clinical paragraph spans many sheets.
    let low=0,high=content.length-at,good=0;
    const test=document.createElement(node.tagName.toLowerCase());test.className=node.className;test.style.whiteSpace='pre-line';
    wrap.append(test);
    while(low<=high){
     const mid=Math.floor((low+high)/2);test.textContent=content.slice(at,at+mid);
     if(fits()){good=mid;low=mid+1;}else high=mid-1;
    }
    if(good===0){
     test.remove();
     if(wrap.children.length>(head?1:0)){nextWrap();continue;}
     // A single unbreakable glyph should never be silently discarded.
     good=1;wrap.append(test);
    }
    if(at+good<content.length&&good>10){
     const prefix=content.slice(at,at+good),breakAt=Math.max(prefix.lastIndexOf(' '),prefix.lastIndexOf('\n'));
     if(breakAt>good/2)good=breakAt+1;
    }
    test.textContent=content.slice(at,at+good);
    at+=good;
    if(at<content.length)nextWrap();
   }
  }
  function splitTable(node){
   const rows=[...node.querySelectorAll('tbody tr')];
   if(!rows.length){splitText(node);return;}
   let tableEl,tbody;
   function startTable(){
    tableEl=node.cloneNode(false);
    for(const c of [...node.children])if(c.tagName!=='TBODY')tableEl.append(c.cloneNode(true));
    tbody=document.createElement('tbody');tableEl.append(tbody);wrap.append(tableEl);
   }
   startTable();
   for(const row of rows){
    const copy=row.cloneNode(true);tbody.append(copy);
    if(fits())continue;
    copy.remove();
    if(!tbody.children.length){tableEl.remove();nextWrap();}
    else{nextWrap();}
    startTable();tbody.append(copy);
    if(!fits()){
     copy.remove();tableEl.remove();
     const labels=[...node.querySelectorAll('thead th')].map(c=>c.textContent);
     const text=[...row.cells].map((c,i)=>(labels[i]||'Maydon')+': '+c.textContent).join('; ');
     splitText(Object.assign(document.createElement('p'),{textContent:text}));
     startTable();
    }
   }
   if(!tbody.children.length)tableEl.remove();
  }
  openWrap();
  for(const child of [...root.children]){
   if(child===head)continue;
   if(place(child))continue;
   // Oversized text or tables use the free space on this sheet before continuing.
   if(child.tagName==='TABLE'){splitTable(child);continue;}
   if((child.tagName==='P'||child.tagName==='DIV')&&child.textContent.length>700){splitText(child);continue;}
   nextWrap();
   if(place(child))continue;
   splitText(child);
  }
  if(!wrap.children.length || (head&&wrap.children.length===1))wrap.remove();
 }
 function appendClosing(review,signature){
  const group=document.createElement('div');group.className='docClosing';group.append(review.cloneNode(true),signature.cloneNode(true));body.append(group);
  if(fits())return;group.remove();if(body.children.length)switchPage();body.append(group);
  if(fits())return;
  // Very long warning text still uses the existing lossless section splitting.
  group.remove();appendSection(review);insertStandalone(signature);
 }
 function paginate(html){
  pages=[];paper.replaceChildren(page);page.innerHTML='';newPage();
  const source=document.createElement('div');source.innerHTML=html;
  const children=[...source.children];
  for(let i=0;i<children.length;i++){
   const child=children[i];
   if(child.classList.contains('docReview')&&children[i+1]?.classList.contains('docSign')){appendClosing(child,children[++i]);continue;}
   if(child.classList.contains('docSection')||child.classList.contains('docReview'))appendSection(child);
   else insertStandalone(child);
  }
  for(let i=0;i<pages.length;i++)pages[i].querySelector('.docFolio').textContent='UZMED · Qabul qoralamasi · '+output.paper+' · '+(i+1)+' / '+pages.length;
  printRoot.replaceChildren(...pages.map(el=>{const c=el.cloneNode(true);c.removeAttribute('id');return c;}));
 }
 function refresh(){
  const d=snapshot();rawHtml=make(d);
  documentSource.innerHTML=rawHtml;applySettings(documentSource);
  page.classList.toggle('qd-editing-paper',editing);paper.classList.toggle('qd-editable',editing);
  if(editing){paper.replaceChildren(page);page.innerHTML='<div class="docBody">'+rawHtml+'</div>';applySettings(page);for(const span of page.querySelectorAll('[data-qabul-field]')){span.contentEditable='plaintext-only';span.setAttribute('role','textbox');span.setAttribute('aria-label','Hujjat maydoni: '+span.dataset.qabulField);} $('docPageCount').textContent='Matnni hujjat ichida tahrirlang. Chop etishda matn A4 sahifalarga avtomatik bo‘linadi.';requestAnimationFrame(fitPreview);return;}
  measureHost.append(paper);
  try{paginate(rawHtml);}finally{holder.append(paper);}
  style.textContent='@page { size:'+output.paper+'; margin:0; }';
  const message=$('docPageCount');
  if(message)message.textContent=pages.length+' ta '+output.paper+' sahifa · Matn hoshiyalar ichida to‘liq joylashtirilgan';
  requestAnimationFrame(fitPreview);
 }
 function sync(){$('docInstitution').value=settings.institution;for(const [id,key]of [['docFont','font'],['docSize','size'],['docDensity','density'],['docLab','lab'],['docMed','med'],['docOrder','order'],['docBorders','borders']])$(id).value=String(settings[key]);$('docBold').setAttribute('aria-pressed',String(settings.bold));$('docItalic').setAttribute('aria-pressed',String(settings.italic));}
 const medicalPreset=document.createElement('button');medicalPreset.type='button';medicalPreset.id='docMedical';medicalPreset.textContent='Tibbiy varaqa';medicalPreset.title='Ixcham matn va qalin bo‘lim nomlari bilan A4 tibbiy hujjat';controls.querySelector('.qd-toolbar-actions').prepend(medicalPreset);
 medicalPreset.onclick=()=>{settings={...defaults,institution:settings.institution};sync();save();$('docStatus').textContent='Tibbiy varaqa uslubi qo‘llandi. Ma’lumotlar o‘zgartirilmadi.';};
 function save(){try{localStorage.setItem('uzmed_qabul_print_v1',JSON.stringify(settings));}catch(_){}refresh();}
 for(const [id,key]of [['docFont','font'],['docSize','size'],['docDensity','density'],['docLab','lab'],['docMed','med'],['docOrder','order'],['docBorders','borders']])$(id).onchange=()=>{settings[key]=key==='size'?Number($(id).value):$(id).value;if(key==='density'){settings.size={dense:9,compact:10,normal:11}[settings.density];sync();}save();};
 for(const [id,key]of [['docBold','bold'],['docItalic','italic']])$(id).onclick=()=>{settings[key]=!settings[key];sync();save();};$('docReset').onclick=()=>{settings={...defaults};sync();save();};
 $('docInstitution').onchange=()=>{settings.institution=$('docInstitution').value.trim().slice(0,160);save();};
 function open(kind){if(availableKinds.includes(kind))output.kind=kind;refresh();syncOutput();sync();focus.openDialog(dialog);requestAnimationFrame(fitPreview);}
 function printView(){
  editing=false;$('docEditInPlace').setAttribute('aria-pressed','false');$('docEditInPlace').textContent='Hujjat ichida tahrirlash';
  refresh();
  if(dialog.open)dialog.close();
  document.body.classList.add('qd-print-view');
  const w=printRoot.querySelector('.docPage')?.offsetWidth||794;
  const zoom=Math.min(1,Math.max(.25,(window.innerWidth-24)/w));
  printRoot.style.setProperty('--qd-print-scale',String(zoom));
  window.scrollTo(0,0);
  $('qdPrintHelp').textContent='iPhone ichki brauzerida oynasi ochilmasa, brauzerning Ulashish (↑) → Chop etish ni tanlang. A4 formatini tekshiring; printer va telefon bir Wi-Fi tarmog‘ida bo‘lsin.';
 }
 function nativePrint(){
  try{
   if(typeof window.print!=='function')throw new Error('unsupported');
   // Must be called directly from the button interaction for browser print permission.
   window.print();
  }catch(_){$('qdPrintHelp').textContent='Bu brauzer chop etish oynasini ochmadi. Ulashish (↑) → Chop etish ni tanlang yoki Safari orqali oching.';}
 }
 let printExport=null,printBusy=false;
 function setPrintExport(handler){printExport=typeof handler==='function'?handler:null;}
 async function print(){
  if(!printExport){printView();nativePrint();return;}
  if(printBusy)return;printBusy=true;$('docPrint').disabled=true;
  try{
   editing=false;refresh();$('docStatus').textContent='A4 hujjat chop etish uchun tayyorlanmoqda…';
   await printExport(printRoot);
   $('docStatus').textContent='Hujjat brauzerda ochiladi. Printer oynasi chiqmasa, u yerdagi Chop etish tugmasini bosing.';
  }catch(e){$('docStatus').textContent='Chop etish ochilmadi: '+e.message;}
  finally{printBusy=false;$('docPrint').disabled=false;}
 }
 function leavePrint(){
  document.body.classList.remove('qd-print-view');printRoot.style.removeProperty('--qd-print-scale');
  if(!dialog.open)open();
 }
 $('qdNativePrint').onclick=nativePrint;
 $('qdReturnPrint').onclick=leavePrint;
 $('docPrintView').onclick=printView;
 $('docPrint').onclick=print;
 $('docEdit').onclick=()=>dialog.close();
 window.addEventListener('resize',()=>{if(!document.body.classList.contains('qd-print-view'))return;const w=printRoot.querySelector('.docPage')?.offsetWidth||794;printRoot.style.setProperty('--qd-print-scale',String(Math.min(1,Math.max(.25,(window.innerWidth-24)/w))));});
 $('docCopy').onclick=async()=>{try{refresh();const html='<div style="font:10pt Times New Roman;color:#111">'+rawHtml+'</div>';
 const text=plainText();
 if(navigator.clipboard?.write&&window.ClipboardItem){
  await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]);
 }else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
 else{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();if(!document.execCommand('copy'))throw Error('copy blocked');t.remove();}
 $('docStatus').textContent='Hujjatning to‘liq matni nusxalandi (mos qurilmalarda format bilan).';}catch(_){$('docStatus').textContent='Nusxalashga ruxsat berilmadi. Hujjat matnini belgilang.';}};
 function plainText(){function text(n){if(n.tagName==='TABLE')return [...n.rows].map(r=>[...r.cells].map(c=>c.textContent).join(' | ')).join('\n');if(['P','H1','H2','H3'].includes(n.tagName)||n.classList.contains('docBrand')||n.classList.contains('docSign'))return n.textContent;return [...n.children].map(text).join('\n');}return text(documentSource).trim();}
 function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
 let telegramExport=null,wordBusy=false;
 function setTelegramExport(handler){telegramExport=typeof handler==='function'?handler:null;for(const id of ['docWord','word'])$(id).textContent=telegramExport?'Word → Telegram':'Word (.docx)';}
 async function word(){
  if(wordBusy)return;
  refresh();if(!window.QabulDocx){$('docStatus').textContent='Word eksporti yuklanmadi. Sahifani tekshiring.';return;}
  wordBusy=true;for(const id of ['docWord','word'])$(id).disabled=true;
  try{
   const bytes=window.QabulDocx.create(documentSource,{...settings,paper:output.paper,design:output.design,kind:output.kind}, !telegramExport);
   if(telegramExport){$('docStatus').textContent='Word hujjati o‘z Telegram bot chatingizga yuborilmoqda…';await telegramExport(bytes);$('docStatus').textContent='Word hujjati o‘z Telegram bot chatingizga yuborildi.';}
   else{download(bytes,'uzmed-'+output.kind+'-qoralama.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');$('docStatus').textContent='Word (.docx) yuklash brauzerga topshirildi.';}
  }catch(e){$('docStatus').textContent='Word chiqarilmadi: '+e.message;}
  finally{wordBusy=false;for(const id of ['docWord','word'])$(id).disabled=false;}
 }
 $('docWord').onclick=word;
 for(const [id,fn]of [['word',word],['pdf',print]])$(id).addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();fn();},true);

 const outputBar=document.createElement('div');outputBar.className='qc-output-bar';
 outputBar.innerHTML='<div class="qd-selection-title"><strong>Hujjat turini tanlang</strong><small>Bir xil qabul ma’lumotlaridan turli hujjat ko‘rinishlarini tayyorlang.</small></div><div class="qd-document-choice"><label>Hujjat turi<select id="docOutputKind">'+reportTypes.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label><label>Mutaxassislik<select id="docSpecialty"></select></label><label>Ko‘rinish<select id="docDesign"><option value="hospital">Shifoxona hujjati (namunadagi)</option><option value="formal">Rasmiy bayonnoma</option><option value="modern">Zamonaviy UZMED</option><option value="compact">Ixcham</option></select></label><label id="docSpecialtyOtherWrap" hidden>Boshqa mutaxassislik nomi<input id="docSpecialtyOther" type="text" maxlength="100" autocomplete="off" placeholder="Masalan: Bolalar allergologi"></label></div><div class="qc-chips qd-choice-actions"><span>Qog‘oz:</span><button type="button" id="docA4">A4</button><button type="button" id="docA5">A5</button><button type="button" id="docPreview">Ko‘rish</button><button type="button" id="docFormats">Eksport formatlari</button></div><p class="qd-choice-help">Bu hujjat qoralamasi. Mutaxassislik tanlovi bemorning klinik tashxisini yoki imzoni tasdiqlamaydi.</p>';
 controls.prepend(outputBar);
 const specialistSelect=$('docSpecialty');
 specialistSelect.append(new Option('Qabuldagi mutaxassislik (avtomatik)','auto'));
 for(const [code,label]of specialties)specialistSelect.append(new Option(label,code));
 // Mirror the authenticated UZMED specialist registry after the visit context loads.
 function syncRegisteredSpecialists(){
  for(const item of [...($('specialty')?.options||[])]){
   if(!item.value||!item.textContent.trim())continue;
   const value='registered:'+item.value;
   if([...specialistSelect.options].some(o=>o.value===value))continue;
   specialistSelect.append(new Option('UZMED: '+item.textContent.trim().slice(0,100),value));
  }
  if(output.specialty.startsWith('registered:'))specialistSelect.value=output.specialty;
 }
 syncRegisteredSpecialists();
 window.addEventListener('qabul:session-ready',syncRegisteredSpecialists);
 const formats=document.createElement('div');formats.id='docFormatCards';formats.className='qc-format-cards';formats.hidden=true;outputBar.after(formats);
 function syncOutput(){specialistSelect.value=output.specialty;if(!specialistSelect.value)specialistSelect.value='auto';$('docDesign').value=output.design;$('docSpecialtyOther').value=output.customSpecialty;$('docSpecialtyOtherWrap').hidden=output.specialty!=='boshqa';for(const paper of ['A4','A5'])$('doc'+paper).setAttribute('aria-pressed',String(output.paper===paper));$('docOutputKind').value=output.kind;printTools.querySelector('p').textContent=output.paper+' · '+$('docOutputKind').selectedOptions[0].textContent;}
 for(const paper of ['A4','A5'])$('doc'+paper).onclick=()=>{output.paper=paper;syncOutput();refresh();window.dispatchEvent(new CustomEvent('qabul:document-edit'));};
 $('docOutputKind').onchange=()=>{output.kind=$('docOutputKind').value;syncOutput();refresh();window.dispatchEvent(new CustomEvent('qabul:document-edit'));};
 specialistSelect.onchange=()=>{output.specialty=specialistSelect.value;syncOutput();refresh();window.dispatchEvent(new CustomEvent('qabul:document-edit'));};
 $('docSpecialtyOther').oninput=()=>{output.customSpecialty=$('docSpecialtyOther').value.slice(0,100);refresh();window.dispatchEvent(new CustomEvent('qabul:document-edit'));};
 $('docDesign').onchange=()=>{output.design=$('docDesign').value;syncOutput();refresh();window.dispatchEvent(new CustomEvent('qabul:document-edit'));};
 $('docFormats').onclick=()=>{formats.hidden=false;stage.hidden=true;};$('docPreview').onclick=()=>{formats.hidden=true;stage.hidden=false;refresh();};
 for(const [title,kind,action]of [['PDF saqlash',null,'pdf'],['Shifokor ko‘rigi (chop etish)','full','print'],['Microsoft Word (.docx)',null,'word'],['Tibbiy ko‘chirma (chop etish)','extract','print'],['Epikriz (chop etish)','epicrisis','print'],['Mutaxassis konsultatsiyasi','consult','print'],['Retsept blanki (chop etish)','rx','print'],['Retsept Word (.docx)','rx','word'],['Tekshiruv yo‘llanmasi (chop etish)','referral','print'],['Yo‘llanma Word (.docx)','referral','word'],['Matnni nusxalash',null,'copy'],['Matn fayli (.txt)',null,'txt']]){const b=document.createElement('button');b.type='button';b.textContent=title;b.onclick=()=>{if(kind)output.kind=kind;syncOutput();refresh();if(action==='word')word();else if(action==='copy')$('docCopy').click();else if(action==='txt')download(plainText(),'uzmed-'+output.kind+'.txt','text/plain;charset=utf-8');else{if(action==='pdf')$('docStatus').textContent='Ochilgan chop oynasidan «PDF sifatida saqlash»ni tanlang.';print();}};formats.append(b);}
 const pdfButton=document.createElement('button');pdfButton.type='button';pdfButton.id='docPDF';pdfButton.textContent='PDF saqlash';pdfButton.onclick=()=>{print();$('docStatus').textContent='Chop oynasidan «PDF sifatida saqlash»ni tanlang.';};controls.querySelector('.qd-toolbar-actions').prepend(pdfButton);
 syncOutput();

 window.QabulDocument={open,refresh,snapshot,outputSettings:()=>({...output}),restoreOutput:value=>{if(['A4','A5'].includes(value?.paper))output.paper=value.paper;if(availableKinds.includes(value?.kind))output.kind=value.kind;if(value?.specialty==='auto'||value?.specialty==='boshqa'||specialties.some(x=>x[0]===value?.specialty)||String(value?.specialty||'').startsWith('registered:'))output.specialty=value.specialty;if(typeof value?.customSpecialty==='string')output.customSpecialty=value.customSpecialty.slice(0,100);if(['hospital','formal','modern','compact'].includes(value?.design))output.design=value.design;syncOutput();refresh();},restoreSettings:value=>{for(const [k,vs]of Object.entries(allowed))if(vs.includes(value[k]))settings[k]=value[k];if(Number.isFinite(value.size)&&value.size>=8&&value.size<=16)settings.size=value.size;for(const k of ['bold','italic'])if(typeof value[k]==='boolean')settings[k]=value[k];if(typeof value.institution==='string')settings.institution=value.institution.slice(0,160);sync();refresh();},settings:()=>({...settings}),setTelegramExport,setPrintExport,print,word,element:()=>documentSource};sync();refresh();
})();
