'use strict';
(function(){
 const kit=window.UzmedQabul,$=id=>document.getElementById(id);
 if(!kit||!$('field-patient'))return;
 const tabs=['patient','history','diagnosis','tests','treatment','finish'];
 let current='patient',dirty=false,allowLeave=false,recording=false;
 const refresh=()=>{kit.render();if($('testPresets')?.children.length)syncLabChoices();};
 function elt(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
 for(const [id] of kit.fieldNames){const slot=$('slot-'+id);if(slot)slot.appendChild($('field-'+id).parentElement);}
 $('fields').remove();
 $('field-patient').placeholder='Mahalliy ID, masalan: B-001';
 $('field-age').placeholder='Masalan: 45 yosh / 6 oy';
 $('field-complaints').placeholder='Bemorning shikoyatlari, boshlanishi va davomiyligi';
 $('field-history').placeholder='Kasallikning boshlanishi va rivojlanishi, oldingi davolash';
 $('field-exam').placeholder='Umumiy holat, qon bosimi, puls, harorat va ko‘rik natijalari';
 $('field-diagnosis').placeholder='Asosiy klinik tashxis';
 $('field-treatment').placeholder='Dorisiz davolash va qo‘shimcha tayinlovlar';
 $('field-treatment').previousElementSibling.textContent='Davolash bo‘yicha qo‘shimcha yozuv';
 const extraNames=[['comorbid','Hamroh tashxis'],['competing','Raqobatlashuvchi tashxis'],['background','Fon kasalliklari'],['complication','Asoratlar']];
 for(const [key,title] of extraNames){
  const wrap=elt('div','field');wrap.id='extra-'+key;wrap.hidden=key!=='comorbid';
  const label=elt('label','',title);label.htmlFor=key;
  const input=elt('textarea');input.id=key;input.maxLength=5000;input.placeholder=title+' (mavjud bo‘lsa)';wrap.append(label,input);$('diagnosisExtras').append(wrap);
 }
 const rxKeys=[['name','Dori nomi va kuchi'],['inn','INN / ta’sir etuvchi modda'],['dose','Bir martalik doza'],['frequency','Qabul soni / vaqti'],['route','Qabul yo‘li'],['duration','Davomiylik'],['food','Ovqatga bog‘liqligi'],['notes','Izoh / nazorat'],['goal','Davolash maqsadi']];
 function rxData(){return [...$('rxRows').children].map(row=>Object.fromEntries(rxKeys.map(([k])=>[k,row.querySelector('[name="'+k+'"]').value.trim()]))).filter(x=>Object.values(x).some(Boolean));}
 function rxText(){return rxData().map((x,i)=>(i+1)+'. '+(x.name||'[dori nomi kiritilmagan]')+'; '+rxKeys.slice(1).map(([k,title])=>title+': '+(x[k]||'[kiritilmagan]')).join('; ')).join('\n');}
 kit.markSaved=()=>{dirty=false;};kit.allowClose=()=>{dirty=false;allowLeave=true;};
 let lastClinical='';
 kit.enrich=function(d){
  const rx=rxText();if(rx)d.treatment=[d.treatment,rx].filter(Boolean).join('\n');
  d.extra={sex:$('sex').value,life:$('life').value,diagnoses:extraNames.map(([k,t])=>[t,$(k).value.trim()])};const signature=JSON.stringify([d.template,d.specialty,d.customSpecialty,d.documentKind,...kit.fieldNames.map(([key])=>d[key]),d.labs,d.extra]);if(lastClinical&&signature!==lastClinical){d.approved=false;$('approved').checked=false;}lastClinical=signature;return d;
 };
 const baseBuild=kit.buildNote;
 kit.buildNote=function(d){
  let note=baseBuild(d);const e=d.extra;if(!e)return note;
  if(e.sex)note=note.replace('Yosh: '+(kit.clean(d.age)||'[kiritilmagan]'),'Yosh: '+(kit.clean(d.age)||'[kiritilmagan]')+'\nJinsi: '+e.sex);
  if(kit.clean(e.life))note=note.replace('Qabul qilayotgan dorilar:', 'Hayot anamnezi: '+kit.clean(e.life)+'\n\nQabul qilayotgan dorilar:');
  const extra=e.diagnoses.filter(x=>x[1]).map(([t,v])=>t+': '+kit.clean(v)).join('\n\n');
  if(extra)note=note.replace('MKB-10 kodi (tekshirilgan):',extra+'\n\nMKB-10 kodi (tekshirilgan):');
  return note;
 };
 function showTab(key,focus=false){
  if(!tabs.includes(key))return;current=key;
  for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==key;
  for(const b of document.querySelectorAll('[data-tab]')){const on=b.dataset.tab===key;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
  $('previousStep').disabled=key===tabs[0];$('nextStep').textContent=key===tabs.at(-1)?'Hujjat ko‘rinishi ↗':'Keyingi →';$('stepLabel').textContent=(tabs.indexOf(key)+1)+' / 6';
  if(focus){const h=$('panel-'+key).querySelector('h2');h.tabIndex=-1;h.focus({preventScroll:true});if(matchMedia('(max-width:700px)').matches){$('panel-'+key).scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('[data-tab="'+key+'"]').scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});}}
 }
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab,true)));
 $('previousStep').onclick=()=>showTab(tabs[Math.max(0,tabs.indexOf(current)-1)],true);
 $('nextStep').onclick=()=>current==='finish'?preview():showTab(tabs[tabs.indexOf(current)+1],true);
 function preview(){if(recognition&&recording)recognition.stop();$('previewPane').scrollIntoView({behavior:'smooth',block:'start'});$('previewPane').classList.add('flash');setTimeout(()=>$('previewPane').classList.remove('flash'),1200);}
 $('previewToggle').onclick=preview;$('showFinalPreview').onclick=preview;
 function theme(mode,save=true){
  document.documentElement.dataset.theme=mode;$('themeToggle').textContent=mode==='dark'?'☀':'☾';$('themeToggle').setAttribute('aria-label',mode==='dark'?'Kun rejimiga o‘tish':'Tun rejimiga o‘tish');$('themeToggle').setAttribute('aria-pressed',String(mode==='dark'));
  document.querySelector('meta[name="theme-color"]').content=mode==='dark'?'#0c1821':'#f5f8fa';
  if(save)try{localStorage.setItem('uzmed_theme',mode);}catch(_){}
 }
 theme(document.documentElement.dataset.theme,false);
 $('themeToggle').onclick=()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark');
 window.addEventListener('storage',e=>{if(e.key==='uzmed_theme')theme(e.newValue==='dark'?'dark':'light',false);});
 $('back').onclick=()=>{
  if(dirty&&!confirm('Qoralama hali yuklab olinmagan bo‘lishi mumkin. Sahifadan chiqilsinmi?'))return;
  allowLeave=true;if(recognition&&recording)recognition.abort();
  let ref;try{ref=new URL(document.referrer);}catch(_){}
  if(ref&&ref.origin===location.origin&&!ref.pathname.startsWith('/assets/uzmed-qabul-pilot')&&history.length>1)history.back();else location.assign('/');
 };
 window.addEventListener('qabul:document-edit',()=>{dirty=true;});
 window.addEventListener('beforeunload',e=>{if(dirty&&!allowLeave){e.preventDefault();e.returnValue='';}});
 document.querySelectorAll('a[href="/"]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey)return;if(dirty&&!confirm('Qoralama yopiladi. Bosh sahifaga qaytilsinmi?')){e.preventDefault();return;}allowLeave=true;}));
 function selectGroup(selector,button){document.querySelectorAll(selector).forEach(b=>b.classList.toggle('selected',b===button));}
 document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{selectGroup('[data-history]',b);$('slot-history').hidden=b.dataset.history!=='history';$('lifeWrap').hidden=b.dataset.history!=='life';});
 document.querySelectorAll('[data-diagnosis]').forEach(b=>b.onclick=()=>{selectGroup('[data-diagnosis]',b);extraNames.forEach(([k])=>$('extra-'+k).hidden=k!==b.dataset.diagnosis);});
 document.querySelectorAll('[data-tests]').forEach(b=>b.onclick=()=>{selectGroup('[data-tests]',b);$('testPlan').hidden=b.dataset.tests!=='plan';$('testResults').hidden=b.dataset.tests!=='results';});
 const labGroups = [["Umumiy tahlillar",["Umumiy qon tahlili","Umumiy siydik tahlili","Umumiy najas tahlili","Glyukoza","Glyukoza (och qoringa)","HbA1c","Qon guruhi va Rh omil","ECHT (SOE)","C-reaktiv oqsil (CRP)","Prokalsitonin","Umumiy oqsil","Albumin"]],["Gematologiya",["Gemoglobin","Eritrotsitlar (RBC)","Leykotsitlar (WBC)","Trombotsitlar (PLT)","Gematokrit","MCV","MCH","MCHC","RDW","Retikulotsitlar","Leykotsitar formula","Periferik qon surtmasi","Ferritin","Temir (Fe)","Transferrin","Transferrin to‘yinganligi","TIBC","Vitamin B12","Folat","Gaptoglobin","LDH","Gemoglobin elektroforezi"]],["Biokimyo va buyrak",["Kreatinin","Mochevina (urea)","Siydik kislotasi","eGFR","Sistatin C","ALT","AST","GGT","Ishqoriy fosfataza (ALP)","Umumiy bilirubin","To‘g‘ri bilirubin","Bilvosita bilirubin","Amilaza","Lipaza","CK (KFK)","CK-MB","Laktat","Ammiak","Osmolyarlik (qon)","Beta-2 mikroglobulin","Mikroalbuminuriya","Albumin/kreatinin nisbati (ACR)","24 soatlik proteinuriya"]],["Elektrolitlar va minerallar",["Elektrolitlar","Natriy","Kaliy","Xlor","Kalsiy (umumiy)","Kalsiy (ionlangan)","Magniy","Fosfor","Bikarbonat","Qon gazlari (ABG)","pH","pCO2","pO2","Anion farqi","Laktat (qon gazlari)","Serum osmolyarligi"]],["Lipidlar va metabolizm",["Umumiy xolesterin","LDL xolesterin","HDL xolesterin","Triglitseridlar","Non-HDL xolesterin","Apolipoprotein A1","Apolipoprotein B","Lipoprotein(a)","Insulin","C-peptid","HOMA-IR hisoblash","Og‘iz orqali glyukoza tolerantlik testi (OGTT)","Ketonlar (qon)","Beta-gidroksibutirat","Fruktozamin"]],["Koagulologiya",["Protrombin vaqti (PT)","INR","APTT","Fibrinogen","D-dimer","Trombin vaqti","Antitrombin III","Protein C","Protein S","Lupus antikoagulyanti","Von Villebrand faktori","Faktor VIII","Faktor IX","Trombotsitlar agregatsiyasi"]],["Gormonlar",["TSH","Erkin T4 (FT4)","Erkin T3 (FT3)","Umumiy T4","Umumiy T3","Anti-TPO","Anti-TG","TSH-retseptor antitanalari (TRAb)","Kortizol (qon)","ACTH","Aldosteron","Renin","Aldosteron/renin nisbati","Paratgormon (PTH)","Kaltsitonin","Somatotrop gormon (GH)","IGF-1","Prolaktin","FSH","LH","Estradiol","Progesteron","Testosteron (umumiy)","Testosteron (erkin)","SHBG","DHEA-S","17-OH progesteron","AMH","Beta-hCG","Homiladorlik testi (hCG)"]],["Yurak markerlari",["Troponin I","Troponin T","Yuqori sezgir troponin (hs-cTn)","BNP","NT-proBNP","Mioglobin","Homotsistein"]],["Vitamin va mikroelementlar",["Vitamin D (25-OH)","Vitamin D (1,25-OH2)","Vitamin A","Vitamin E","Vitamin K","Vitamin B1","Vitamin B6","Vitamin B12 (faol)","Folat (eritrotsit)","Rux","Mis","Selen","Yod (siydik)","Qo‘rg‘oshin (qon)","Simob (qon)"]],["Immunologiya",["Immunoglobulin IgG","Immunoglobulin IgA","Immunoglobulin IgM","Immunoglobulin IgE","IgG subklasslari","Komplement C3","Komplement C4","CH50","ANA","Anti-dsDNA","Anti-Sm","Anti-RNP","Anti-SSA/Ro","Anti-SSB/La","Anti-Scl-70","Anti-Jo-1","Revmatoid faktor (RF)","Anti-CCP","HLA-B27","ANCA (c-ANCA, p-ANCA)","Anti-MPO","Anti-PR3","Anti-GBM","Antikardiolipin IgG/IgM","Anti-beta2-GPI","Anti-tTG IgA","Umumiy IgA (seliakiya)"]],["Allergologiya",["Umumiy IgE","Spetsifik IgE (individual allergen)","Spetsifik IgE inhalatsion panel","Spetsifik IgE oziq-ovqat paneli","Molekulyar allergodiagnostika (komponent IgE)","Bazofil faollashuv testi (BAT)","Triptaza","Eozinofillar (absolyut)","Eozinofil kation oqsili (ECP)","Prick-test","Patch-test (epikutan)","Dori allergiyasi tekshiruvi (mutaxassis nazorati)","C1-ingibitor miqdori","C1-ingibitor funksiyasi","Komplement C4 (angioedema)"]],["Infeksiyalar",["HIV Ag/Ab (4-avlod)","HBsAg","Anti-HBs","Anti-HBc IgM","Anti-HBc total","HBeAg","Anti-HBe","HBV DNK PCR","Anti-HCV","HCV RNK PCR","HAV IgM","HEV IgM","Sifilis RPR/VDRL","TPHA/TPPA","TORCH IgM/IgG","Toksoplazma IgM/IgG","Qizilcha IgM/IgG","CMV IgM/IgG","EBV VCA IgM/IgG","HSV 1/2 IgG","HSV PCR","COVID-19 PCR","Gripp A/B PCR","RSV PCR","Sil kasalligi IGRA (Quantiferon)","GeneXpert MTB/RIF","Helicobacter pylori najas antigeni","H. pylori nafas testi","Streptokokk A tezkor test"]],["Mikrobiologiya va parazitologiya",["Qon ekmasi (gemokultura)","Siydik ekmasi","Balg‘am ekmasi","Tomoq surtmasi ekmasi","Yara ajralmasi ekmasi","Antibiotik sezuvchanlik (antibiogramma)","Gram bo‘yash","Mikobakteriya mikroskopiyasi (AFB)","Mikobakteriya ekmasi","Najas ekmasi","Najasda gelmint tuxumlari","Najasda protozoylar","Giardia antigeni","Cryptosporidium antigeni","Clostridioides difficile toksin/PCR","Kandida ekmasi","Zamburug‘ mikroskopiyasi","PCR panel (respirator)","PCR panel (ichak infeksiyasi)","Urogenital PCR (xlamidiya, gonoreya)"]],["Siydik, najas va suyuqliklar",["Siydik mikroskopiyasi","Siydikda oqsil","Siydikda glyukoza","Siydikda keton","Siydikda nitrit","Siydikda leykotsit","Siydik pH","Siydik nisbiy zichligi","Siydik natriy","Siydik osmolyaligi","Siydikda kalsiy","Siydikda kortizol (24 soat)","Najas yashirin qon (FIT)","Najas kalprotektin","Najas elastaza","Koprogramma","Orqa miya suyuqligi (CSF) umumiy","CSF oqsil va glyukoza","Plevra suyuqligi tahlili","Assit suyuqligi tahlili","Sinovial suyuqlik tahlili"]],["Onkomarkerlar",["PSA umumiy","PSA erkin","CEA","CA 19-9","CA 125","CA 15-3","AFP","Beta-hCG (o‘sma markeri)","HE4","ROMA indeksi","CYFRA 21-1","NSE","S100","Tireoglobulin","Beta-2 mikroglobulin (gematologiya)","LDH (onkologiya)","Kalsitonin (qalqonsimon)"]],["Reproduktiv va prenatal",["Spermogramma","Spermatozoidlar morfologiyasi","ASAT (antisperm antitanalar)","AMH (fertillik)","Progesteron (sikl)","Prenatal birinchi trimestr skriningi","PAPP-A","Erkin beta-hCG","Ikkinchi trimestr biokimyoviy skrining","NIPT (prenatal DNK skrining)","Prenatal UTT","B guruh streptokokk skriningi","Bachadon bo‘yni PAP-test","HPV DNK testi","HPV genotiplash"]],["Genetika",["Kariotiplash","FISH tekshiruvi","NGS genetik panel","BRCA1/BRCA2","Faktor V Leiden","Protrombin G20210A","JAK2 V617F","BCR-ABL1 PCR","HLA tiplash","G6PD faolligi","Alfa-1 antitripsin","Ter testi (xlorid)","Fenilketonuriya skriningi"]],["Instrumental va funksional",["EKG","24 soatlik Holter EKG","24 soatlik ABPM (SMAD)","Exokardiografiya (EhoKG)","Yuklama EKG testi","Spirometriya","Bronxodilatator sinamasi","Pikfloumetriya","FeNO","Pulsoksimetriya","Ultratovush tekshiruvi","Qorin bo‘shlig‘i UTT","Buyrak UTT","Qalqonsimon bez UTT","Doppler ultratovush","Rentgen","Kompyuter tomografiya (KT)","Magnit-rezonans tomografiya (MRT)","EEG","ENMG","Gastroskopiya (FGDS)","Kolonoskopiya","Densitometriya (DEXA)","Audiometriya","Ko‘rish o‘tkirligi tekshiruvi","Oftalmoskopiya","Mammografiya"]],["Toksikologiya",["Etanol (qon)","Karbon monoksid gemoglobini (COHb)","Metgemoglobin","Paratsetamol (qon)","Salitsilatlar (qon)","Litiy darajasi","Digoksin darajasi","Valproat darajasi","Fenitoin darajasi","Vankomitsin darajasi","Takrolimus darajasi","Siklosporin darajasi","Toksikologik siydik skriningi"]]];
 const catalog=$('testPresets'),testField=$('field-tests'),labChoices=[];
 const searchRow=elt('div','qf-lab-search'),searchInput=elt('input');
 searchInput.type='search';searchInput.placeholder='Tahlil nomini qidiring…';searchInput.setAttribute('aria-label','Tahlilni qidirish');
 const selectedCount=elt('span','qf-lab-selected','0 ta tanlangan');searchRow.append(searchInput,selectedCount);catalog.before(searchRow);
 for(const [groupName,tests] of labGroups){
  const group=elt('details','qf-lab-group'),head=elt('summary');
  head.append(elt('span','',groupName),elt('small','',tests.length+' ta'));
  const grid=elt('div','preset-grid');group.append(head,grid);catalog.append(group);
  for(const name of tests){
   const label=elt('label'),check=elt('input');check.type='checkbox';check.dataset.testName=name;
   label.append(check,document.createTextNode(name));grid.append(label);labChoices.push({name,label,check,group});
   check.onchange=()=>{
    let lines=testField.value.split('\n').map(x=>x.trim()).filter(Boolean);
    if(check.checked){if(!lines.includes(name))lines.push(name);}
    else lines=lines.filter(x=>x!==name);
    testField.value=lines.join('\n');dirty=true;refresh();syncLabChoices();
   };
  }
 }
 catalog.firstElementChild.open=true;
 function syncLabChoices(){
  const chosen=new Set(testField.value.split('\n').map(x=>x.trim()).filter(Boolean));
  for(const {name,check} of labChoices)check.checked=chosen.has(name);
  selectedCount.textContent=chosen.size+' ta tanlangan';
 }
 let searching=false;
 function filterLabs(){
  const query=searchInput.value.toLocaleLowerCase('uz').trim();
  if(query&&!searching)for(const group of catalog.children)group.dataset.wasOpen=String(group.open);
  for(const group of catalog.children){
   let visible=0;
   for(const {name,label,group:parent} of labChoices){
    if(parent!==group)continue;
    const show=!query||name.toLocaleLowerCase('uz').includes(query);
    label.hidden=!show;if(show)visible++;
   }
   group.hidden=!!query&&!visible;
   if(query)group.open=visible>0;
   else if(searching)group.open=group.dataset.wasOpen==='true';
  }
  searching=!!query;
 }
 searchInput.addEventListener('input',filterLabs);
 testField.addEventListener('input',syncLabChoices);
 syncLabChoices();
  function addRx(name='',inn=''){
  if($('rxRows').children.length>=30){$('status').textContent='Ko‘pi bilan 30 ta dori qatori.';return;}
  const card=elt('div','rx-card'),header=elt('div','rx-header'),title=elt('span','','Dori tayinlovi'),rm=elt('button','','×');rm.type='button';rm.setAttribute('aria-label','Dori qatorini olib tashlash');const up=elt('button','','↑'),down=elt('button','','↓');up.type=down.type='button';up.setAttribute('aria-label','Dori qatorini yuqoriga');down.setAttribute('aria-label','Dori qatorini pastga');up.onclick=()=>{const prev=card.previousElementSibling;if(prev){card.parentElement.insertBefore(card,prev);dirty=true;refresh();}};down.onclick=()=>{const next=card.nextElementSibling;if(next){card.parentElement.insertBefore(next,card);dirty=true;refresh();}};header.append(title,up,down,rm);const grid=elt('div','rx-grid');
  for(const [k,labelText] of rxKeys){const wrap=elt('div','field'+(k==='name'?' full':'')),label=elt('label','',labelText),input=elt('input');input.name=k;input.maxLength=200;input.autocomplete='off';input.placeholder=k==='name'?'Dori nomi va kuchi':'Shifokor belgilaydi';if(k==='name')input.value=name;if(k==='inn')input.value=inn;label.append(input);wrap.append(label);grid.append(wrap);}
  card.append(header,grid);$('rxRows').append(card);rm.onclick=()=>{if([...card.querySelectorAll('input')].some(x=>x.value)&&!confirm('Ushbu dori qatori o‘chirilsinmi?'))return;card.remove();dirty=true;$('approved').checked=false;$('rxChecked').checked=false;$('ddiChecked').checked=false;refresh();};dirty=true;$('approved').checked=false;$('rxChecked').checked=false;$('ddiChecked').checked=false;refresh();
 }
 const sourceKeys=['sourceKey','source','sourceUrl','sourceVersion'];
 function clearSource(row){for(const key of [...sourceKeys,'sourceName','sourceInn'])delete row.dataset[key];row.querySelector('.rx-source')?.remove();row.removeAttribute('title');}
 kit.bindSource=function(row,source){
  clearSource(row);for(const key of sourceKeys)if(source[key])row.dataset[key]=source[key];
  row.dataset.sourceName=row.querySelector('[name=name]').value;row.dataset.sourceInn=row.querySelector('[name=inn]').value;
  if(!row.dataset.sourceKey)return;const button=elt('button','rx-source','Manba: '+(source.source||'UZMED')+' · ma’lumot');button.type='button';
  button.onclick=async()=>{try{
   if(row.dataset.sourceKey.startsWith('fda:')&&/^https:\/\/dailymed\.nlm\.nih\.gov\/dailymed\/drugInfo\.cfm\?setid=[a-f0-9-]+$/i.test(row.dataset.sourceUrl)){
    window.open(row.dataset.sourceUrl,'_blank','noopener,noreferrer');return;
   }
   const key=row.dataset.sourceKey,r={key,name:row.querySelector('[name=name]').value,inn:row.querySelector('[name=inn]').value,source:row.dataset.source,sourceVersion:row.dataset.sourceVersion,slug:key.slice(key.indexOf(':')+1),url:row.dataset.sourceUrl};const full=await window.UZMEDDrugWorkspace.details(r);window.UZMEDDrugWorkspace.openProduct(full,full.name+' haqida');}catch(e){$('status').textContent='Preparat manbasini ochib bo‘lmadi: '+e.message;}};
  row.append(button);row.title='Manba: '+source.source+' · '+source.sourceKey;
 };
 $('rxRows').addEventListener('input',e=>{if(['name','inn'].includes(e.target.name))clearSource(e.target.closest('.rx-card'));});
 window.addEventListener('qabul:document-edit',()=>{for(const row of $('rxRows').children)if(row.dataset.sourceKey&&(row.dataset.sourceName!==row.querySelector('[name=name]').value||row.dataset.sourceInn!==row.querySelector('[name=inn]').value))clearSource(row);});
 $('addRx').onclick=()=>addRx();
 function labLabels(){for(const row of $('labs').children){for(const input of row.querySelectorAll('input'))input.inputMode=input.name==='value'||input.name==='low'||input.name==='high'?'decimal':'text';if(!row.querySelector('output'))row.append(elt('output','lab-status'));}}
 function labStatuses(){labLabels();for(const row of $('labs').children){const d=Object.fromEntries([...row.querySelectorAll('input')].map(x=>[x.name,x.value]));const a=kit.assessLab(d),out=row.querySelector('output');out.textContent=d.name||d.value?'Natija: '+a.status:'';out.classList.toggle('abnormal',a.status==='past'||a.status==='yuqori');}}
 new MutationObserver(()=>labStatuses()).observe($('labs'),{childList:true});$('labs').addEventListener('input',labStatuses);labStatuses();
 function progress(){const values=ids=>ids.some(id=>$(id)?.value.trim());const checks=[values(['field-patient','field-age','field-date']),values(['field-complaints','field-history','field-exam']),values(['field-diagnosis','field-icd']),values(['field-tests'])||[...$('labs').querySelectorAll('input')].some(x=>x.value.trim()),values(['field-treatment','field-advice'])||rxData().length>0,$('approved').checked];const n=checks.filter(Boolean).length;$('progressBar').style.width=n/6*100+'%';$('progressLabel').textContent=n+' / 6 bosqichda ma’lumot bor';$('draftBadge').textContent=$('approved').checked?'Ko‘rib chiqilgan':'Qoralama';$('previewDate').textContent=$('field-date').value;}
 document.addEventListener('input',e=>{if(e.target.matches('input:not([type=checkbox]),textarea,select')&&!e.target.closest('.qd-toolbar,#templateDialog')&&!['drugSearch','icdSearch','height','weight'].includes(e.target.id)){dirty=true;$('approved').checked=false;if(e.target.id==='field-icd'||e.target.id==='field-diagnosis')$('icdChecked').checked=false;if(e.target.closest('#rxRows')||['field-treatment','field-medications'].includes(e.target.id)){$('rxChecked').checked=false;$('ddiChecked').checked=false;}refresh();}progress();});
 document.addEventListener('change',e=>{if(e.target.matches('input,textarea,select')){dirty=true;refreshFromExtra(e.target);}progress();});
 function refreshFromExtra(target){if(target.id.startsWith('field-')||target.closest('#labs'))return;refresh();}
 let resetPending=false;
 $('clear').addEventListener('click',()=>{ // Original handler has already asked for confirmation and cleared the core fields.
  if($('status').textContent!=='Qoralama tozalandi. Ma’lumot serverda saqlanmagan.')return;
  resetPending=true;voiceField=null;if(recognition&&recording)recognition.abort();++icdSeq;++drugSeq;clearTimeout(icdTimer);if(drugController)drugController.abort();$('rxRows').replaceChildren();for(const id of ['sex','life',...extraNames.map(x=>x[0]),'height','weight','icdSearch','drugSearch'])$(id).value='';for(const c of $('testPresets').querySelectorAll('input'))c.checked=false;
  $('icdResults').replaceChildren();$('drugResults').replaceChildren();$('bmi').textContent='Bo‘y va vaznni kiriting.';dirty=false;refresh();dirty=false;progress();resetPending=false;
 });
 // Clear status before core confirmation so a cancelled later reset cannot clear extra fields.
 $('clear').addEventListener('click',()=>$('status').textContent='',true);
 for(const id of ['height','weight'])$(id).addEventListener('input',()=>{const h=Number($('height').value),w=Number($('weight').value);$('bmi').textContent=h>=50&&h<=250&&w>=1&&w<=500?'TVI = '+(w/((h/100)**2)).toFixed(1)+' kg/m²':'Bo‘y (50–250 sm) va vaznni (1–500 kg) to‘g‘ri kiriting.';});
 // Public WHO reference only; no clinical case text is sent.
 let icdPromise=null,icdSeq=0,icdTimer;
 async function findIcd(){const q=$('icdSearch').value.trim(),seq=++icdSeq;$('icdResults').replaceChildren();if(q.length<2)return;$('icdResults').append(elt('p','','WHO bazasi yuklanmoqda…'));
  try{if(!icdPromise)icdPromise=(window.QabulReference?window.QabulReference.load():fetch('/assets/icd10-who-2019.json',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('http');return r.json();}).then(d=>{if(!d.codes)throw Error('format');return window.UZMED_REFERENCE_SEARCH.buildMkb([],d);})).catch(e=>{icdPromise=null;throw e;});
   const entries=await icdPromise;if(seq!==icdSeq)return;
   const matches=window.UZMED_REFERENCE_SEARCH.searchMkb(entries,q,12).map(row=>[row[0],{title:row[1]}]);
   $('icdResults').replaceChildren();if(!matches.length)$('icdResults').append(elt('p','','Mos kod topilmadi. MKB kodi yoki o‘zbekcha nom bilan qidiring.'));
   for(const [code,value] of matches){const b=elt('button','',code+' · '+value.title);b.type='button';b.append(elt('small','','WHO ICD-10 · 2019 · Asosiy tashxisga qo‘shish'));b.onclick=()=>{$('field-icd').value=code;if(!$('field-diagnosis').value.trim())$('field-diagnosis').value=value.title;$('icdChecked').checked=false;dirty=true;refresh();$('icdResults').replaceChildren();$('icdSearch').value=code+' · '+value.title;};$('icdResults').append(b);}
  }catch(_){if(seq===icdSeq){$('icdResults').replaceChildren(elt('p','','MKB bazasini yuklab bo‘lmadi. Qayta qidiring yoki tekshirilgan kodni qo‘lda kiriting.'));}}
 }
 $('icdSearch').addEventListener('input',()=>{if($('qcDiagnoses'))return;++icdSeq;clearTimeout(icdTimer);icdTimer=setTimeout(findIcd,300);});
 let drugSeq=0,drugController,drugTimer;
 const drugLatinMap=Object.fromEntries(Array.from('абвгдеёжзийклмнопрстуфхцчшщъыьэюяўқғҳ').map((letter,i)=>[letter,['a','b','v','g','d','e','yo','j','z','i','y','k','l','m','n','o','p','r','s','t','u','f','x','ts','ch','sh','shch','','i','','e','yu','ya','o‘','q','g‘','h'][i]]));
 const drugLatin=value=>String(value||'').replace(/[а-яёўқғҳ]/gi,c=>{const mapped=drugLatinMap[c.toLowerCase()];return c===c.toLowerCase()?mapped:mapped.charAt(0).toUpperCase()+mapped.slice(1);});
 const referenceName=value=>value.length>=3&&value.length<=80&&/^[a-z]+(?:[ -][a-z]+){0,5}$/i.test(value);
 async function findDrug(){
  const q=$('drugSearch').value.trim(),seq=++drugSeq;if(drugController)drugController.abort();$('drugResults').replaceChildren();if(q.length<2)return;
  drugController=new AbortController();const controller=drugController;$('drugResults').append(elt('p','','Dorilar bilan umumiy manbalardan qidirilmoqda…'));
  try{
   const name=drugLatin(q).trim(),bridge=window.UZMEDVisitBridge;
   const rows={official:[],local:[],apteka:[],prices:[]},sourcesState={official:{status:'loading'},local:{status:'loading'},apteka:{status:'loading'},prices:{status:'loading'}};
   function renderMatches(result){if(seq!==drugSeq)return;const scroll=$('drugResults').scrollTop;$('drugResults').replaceChildren();
   const sources=Object.entries(result.sources).map(([key,value])=>window.UZMEDDrugCatalog.sourceNames[key]+': '+(value.status==='error'?'javob bermadi':value.status==='loading'?'qidirilmoqda':(value.total>value.count?value.count+' / '+value.total:value.count)));$('drugResults').append(elt('p','minor',sources.join(' · ')));
   const pending=Object.values(result.sources).some(value=>value.status==='loading');
   if(!result.rows.length){
     $('drugResults').append(elt('p','',pending?'Qolgan dori manbalari tekshirilmoqda…':'Ushbu yozilishda dori topilmadi. Nomini tekshiring.'));
     {
       const key=q.toLowerCase().replace(/\s+/g,'').replace(/[ʻʼ‘’]/g,"'");
       const suggestions={beradual:'Berodual',beroduol:'Berodual',berodval:'Berodual',palmikort:'Pulmicort',pulmekort:'Pulmicort'};
       const suggested=suggestions[key];
       if(suggested){
         const option=elt('button','qrx-try-name','Yaqin nomni qidirish: '+suggested);
         option.type='button';
         option.onclick=()=>{$('drugSearch').value=suggested;clearTimeout(drugTimer);findDrug();};
         $('drugResults').append(option);
       }
     }
   } else if(!pending && Object.values(result.sources).some(value=>value.status==='done'&&value.total>value.count)){
     $('drugResults').append(elt('p','qrx-availability','Ko‘proq natija mavjud. Savdo nomi, doza yoki dori shaklini aniqroq yozib qidiring; barcha yozuvlar bir vaqtda yuklanmaydi.'));
   }
       const seenMedicines=new Set();
    for(const original of result.rows){const item=window.QabulReviewedMedicines?.resolve(original)||original;if(!item.name||seenMedicines.has(item.key))continue;seenMedicines.add(item.key);
    const card=elt('div','vf-drug-result qt-drug-result'),identity=elt('div','qt-drug-identity');
    const actions=elt('div','qt-drug-actions'),choose=elt('button','qt-drug-pick','+ Qo‘shish'),info=elt('button','qt-drug-info','Manba');
    const title=drugLatin(item.name).trim(),inn=drugLatin(item.inn).trim(),ingredient=inn.toLowerCase();
    if(!title)continue;
    choose.type=info.type='button';
    identity.append(elt('strong','',title),elt('small','',[item.inn,item.dosage,item.form,item.manufacturer].filter(Boolean).map(drugLatin).join(' · ')),elt('small','qt-drug-source',[item.source,item.photoEvidence?'Qadoq rasmi':''].filter(Boolean).join(' · ')));
    const checkIngredient=/^[a-z]+(?:[ -][a-z]+){0,5}$/.test(ingredient)&&ingredient.length>=3&&ingredient.length<=80?ingredient:'';
    const readOnly=()=>window.UZMEDVisitBridge?.read().readOnly===true;
    choose.disabled=readOnly();if(item.clinicalBlock){choose.textContent='Tekshirish';choose.title=item.clinicalBlock.reason||'Tarkibni manbadan tekshiring';}
    choose.setAttribute('aria-label',title+(item.clinicalBlock?' — tarkibni tekshirish':' — qoralamaga qo‘shish'));
    choose.onclick=()=>{
     if(seq!==drugSeq||readOnly())return;if(item.clinicalBlock){info.click();return;}
     if(title.length>200||inn.length>200){window.QabulFocus?.status('Dori nomi yoki XNN 200 belgidan uzun. Manbani ochib tekshiring.');return;}
     const source={sourceKey:item.key,source:item.source,sourceUrl:item.url,sourceVersion:item.sourceVersion};
     const clearSearch=()=>{
      if(seq!==drugSeq)return;
      ++drugSeq;controller.abort();$('drugResults').replaceChildren();$('drugSearch').value='';
      
     };
     if(kit.openDrugDraft){
      kit.openDrugDraft({name:title,inn,catalogRecord:{...item,sourceVariants:item.reviewedReference?undefined:result.rows.filter(r=>!r.clinicalBlock&&r.key!==item.key&&r.name===item.name&&r.inn&&r.inn===item.inn&&r.manufacturer===item.manufacturer&&r.source===item.source)},packageDetails:[item.dosage,item.form].filter(Boolean).map(drugLatin).join(' · '),source,checkIngredient,product:{form:drugLatin(item.form||title).slice(0,240),strength:drugLatin(item.dosage||item.form||title).slice(0,240)}},clearSearch);
      return;
     }
     const before=$('rxRows').children.length;addRx(title,inn);
     if($('rxRows').children.length===before)return;
     kit.bindSource($('rxRows').lastElementChild,source);
     clearSearch();
    };
    info.setAttribute('aria-label',title+' — manba');
    info.onclick=()=>{
     if(item.key?.startsWith('uzreg:')&&/^https:\/\/www\.uzpharm-control\.uz\/registry\/drugs\/\d+$/.test(item.url))window.open(item.url,'_blank','noopener,noreferrer');
     else if(item.key?.startsWith('fda:')&&/^https:\/\/dailymed\.nlm\.nih\.gov\/dailymed\/drugInfo\.cfm\?setid=[a-f0-9-]+$/i.test(item.url))window.open(item.url,'_blank','noopener,noreferrer');
     else window.UZMEDDrugWorkspace.openProduct(item,title+' haqida');
    };
    actions.append(choose,info);card.append(identity,actions);
    if(item.clinicalBlock)card.append(elt('p','minor',item.clinicalBlock.reason||'Katalogdagi dori ma’lumotini tekshirish kerak. Manbani oching.'));
    else if(!inn)card.append(elt('p','minor','XNN manbada ko‘rsatilmagan. Qoralamada tekshirib kiriting.'));
    $('drugResults').append(card);
   }
   $('drugResults').scrollTop=scroll;
   }
   const partial=()=>({rows:rows.official.concat(rows.local,rows.apteka,rows.prices),sources:sourcesState});
   const timeout=setTimeout(()=>controller.abort(),7000);
   let result;
   try{result=await window.UZMEDDrugWorkspace.lookup(q,{limit:12,signal:controller.signal,onSource:(key,values,status)=>{rows[key]=values;sourcesState[key]=status;renderMatches(partial());}});}
   catch(error){
    if(!controller.signal.aborted||seq!==drugSeq)throw error;
    for(const value of Object.values(sourcesState))if(value.status==='loading')value.status='error';
    result=partial();
   }finally{clearTimeout(timeout);}
   if(seq!==drugSeq)return;
   const hasMarket=result.rows.some(row=>row.name&&!row.clinicalBlock);
   if(!hasMarket&&referenceName(name)&&(bridge?.drugReferences||bridge?.treatmentLabels)){
    $('drugResults').append(elt('p','minor','Ochiq dori yo‘riqnomalari tekshirilmoqda…'));
    const official=await (bridge.drugReferences
      ?bridge.drugReferences('references',name).then(data=>data.rows)
      :bridge.treatmentLabels(name)).catch(()=>[]);
    if(seq!==drugSeq)return;
    if(Array.isArray(official))result.rows=result.rows.concat(official);
   }
   renderMatches(result);
  }catch(e){if(seq===drugSeq)$('drugResults').replaceChildren(elt('p','','Umumiy dori manbalari ochilmadi. Qayta qidiring.'));}
 }
 $('findDrug').onclick=()=>{clearTimeout(drugTimer);findDrug();};$('drugSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(drugTimer);findDrug();}});$('drugSearch').addEventListener('input',()=>{++drugSeq;if(drugController)drugController.abort();$('drugResults').replaceChildren();clearTimeout(drugTimer);if($('drugSearch').value.trim().length>=2)drugTimer=setTimeout(findDrug,240);});
 // VoiceLab adapter preserves existing cancel/back/clear lifecycle hooks.
 let voiceField=null;
 const recognition={stop:()=>window.QabulVoice?.stop(),abort:()=>window.QabulVoice?.cancel()};
 window.addEventListener('qabul:voice-state',e=>{recording=e.detail?.active===true;});
 const iconPaths=['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0','M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01','M12 8v8 M8 12h8 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0','M9 3h6 M10 3v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3 M8 15h8','M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z','M20 6 9 17l-5-5'];document.querySelectorAll('.section-icon').forEach((e,i)=>{e.textContent='';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','20');svg.setAttribute('height','20');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',iconPaths[i]);svg.append(p);e.append(svg);});
 window.addEventListener('qabul:restored',()=>{refresh();progress();});
 showTab('patient');refresh();dirty=false;progress();
})();
