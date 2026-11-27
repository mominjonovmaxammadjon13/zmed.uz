/* Read-only Derma knowledge resolver shared by the existing main AI chat. */
(function (W) {
 'use strict';
 const aliases = {
  ten:['toksik epidermal nekroliz','toxic epidermal necrolysis','layell','lyell','ten'],
  sjs:['stivens jonson','stivens djonson','stevens johnson','sjs'],
  ae:['kvinke','angioedema','angionevrotik shish'],bp:['bullez pemfigoid','bulyoz pemfigoid','pufakli pemfigoid','bullous pemphigoid'],
  pv:['oddiy pemfigus','pemfigus','pemfigus vulgaris','pemphigus vulgaris'],sle:['sistem qizil yuguruk','sistemali qizil yuguruk','sle','sqy'],
  lp:['yassi temiratki','lichen planus','likhen planus'],av:['allergik vaskulit'],
  ad:['atopik dermatit','atopic dermatitis','neyrodermit'],cd:['kontakt dermatit','kontaktli dermatit','allergik kontakt dermatit'],
  ur:['urtikariya','urtikaria','urticaria','eshakemi','eshakem','krapivnitsa'],
  ple:['polimorf yoruglik toshmasi','polymorphic light eruption'],fe:['fiksirlangan dori toshmasi','fixed drug eruption'],
  pso:['psoriaz','psoriasis','psoriazis','targil kasalligi'],aps:['artropatik targil','psoriatik artrit','psoriatic arthritis'],
  derma_sjs_ten:['sjs ten','sjs/ten'],nekrotik_fassiit:['nekrotizuvchi fassiit','nekrotik fassiit','necrotizing fasciitis'],
  eritroderma:['eritroderma','erythroderma'],eczema_herpeticum:['eczema herpeticum','ekzema herpetikum','herpetik ekzema'],
  meningokoksemiya:['meningokoksemiya','purpura fulminans'],seboreyik:['seboreyik dermatit','seboreya','seborrheic dermatitis'],
  pityriasis_rosea:['pityriasis rosea','pushti temiratki'],dermatofitoz:['dermatofitoz','tinea'],
  skabies:['skabies','qichima','qichimasi','scabies','qotir','chesotka'],herpes_zoster:['herpes zoster','belbog yara'],
  herpes_simplex:['herpes simplex','oddiy uchuq'],impetigo:['impetigo'],sellyulit:['sellyulit','erisipel','cellulitis','roja'],
  kandidoz:['kandidoz','candidiasis'],akne:['akne','acne','husnbuzar','husnbuzarlar','ugri'],
  rozatsea:['rozatsea','rosacea'],melanoma:['melanoma'],bazalioma:['bazalioma','bazal hujayrali karsinoma','bcc'],
  scc:['yassi hujayrali karsinoma','squamous cell carcinoma','scc'],aktinik_keratoz:['aktinik keratoz','actinic keratosis'],
  vitiligo:['vitiligo','oqtanir','oq doglar']
 };
 const linked={ten:'derma_sjs_ten',sjs:'derma_sjs_ten',pso:'psoriaz',ad:'derma_atopik',cd:'derma_kontakt',lp:'likhen_planus'};
 const imageTerms={ten:'layell',sjs:'stivens-djonson',ae:'angioedema',bp:'bulyoz pemfigoid',pv:'pemfigus',sle:'sistem qizil yuguruk',lp:'yassi temiratki',av:'allergik vaskulit',ad:'atopik dermatit',cd:'kontakt dermatit',ur:'urtikariya',ple:'polimorf yoruglik toshmasi',fe:'fiksirlangan dori toshmasi',pso:'psoriaz',aps:'psoriatik artrit',skabies:'qichima',dermatofitoz:'dermatofitoz'};
 const letters={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',қ:'q',ғ:'g',ҳ:'h',ў:'o'};
 function norm(x){return String(x||'').normalize('NFKC').toLowerCase().replace(/[а-яёқғҳў]/g,x=>letters[x]||x).replace(/[’ʻʼ‘'`]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
 function title(r){return r.primary?.uz||r.specialist?.name||r.title||'';}
 // Bounded spelling correction searches named references, never diagnoses from symptoms.
 function distance(a,b){
  let prev=Array.from({length:b.length+1},(_,i)=>i),older=null;
  for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++){
   next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(older&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])next[j]=Math.min(next[j],older[j-2]+1);
  }older=prev;prev=next;}return prev[b.length];
 }
 function spellingScore(words,alias,covered){
  const target=alias.split(' ');if(target.length>3||target.some(t=>t.length<5||!/^[a-z]+$/.test(t)))return 0;
  let best=0;
  for(let start=0;start<=words.length-target.length;start++){
   if(target.some((_,j)=>covered.has(start+j)))continue;
   let edits=0,valid=true;
   for(let j=0;j<target.length;j++){
    const raw=words[start+j],t=target[j],w=raw.replace(/(?:ning|dan|ni|ga|da)$/,'');
    const candidate=raw===t?raw:w;
    if(candidate.length<5||candidate.length>20||candidate.slice(0,2)!==t.slice(0,2)){valid=false;break;}
    const limit=t.length>=7?2:1,d=distance(candidate,t);
    if(d>limit){valid=false;break;}edits+=d;
   }
   if(valid&&edits>0&&edits<=2)best=Math.max(best,alias.length-edits/10);
  }return best;
 }
 function records(data){
  const specialist=new Map((data.specialist||[]).map(x=>[x.id,x]));
  const rows=Object.entries(data.clinical||{}).map(([key,primary])=>({key,primary,specialist:specialist.get(linked[key])||null}));
  const used=new Set(Object.values(linked));
  for(const r of specialist.values())if(!used.has(r.id))rows.push({key:r.id,specialist:r});
  // The combined SJS/TEN record remains separately searchable and keeps its own code.
  if(specialist.has('derma_sjs_ten'))rows.push({key:'derma_sjs_ten',specialist:specialist.get('derma_sjs_ten')});
  return rows;
 }
 function resolve(q,data){
  const s=norm(q);if(s.length<2||s.length>320)return {kind:'none',rows:[]};
  if(s==='ekzema'||s==='eczema'||/^(ekzema|eczema) (haqida|xaqida|malumot|nima|rasmi|rasmlari|davolash)/.test(s))return {kind:'broad',query:'ekzema',rows:records(data).filter(r=>['ad','cd','eczema_herpeticum'].includes(r.key))};
  const hits=[],all=records(data),words=s.split(' '),covered=new Set();
  const namesFor=r=>[...(aliases[r.key]||[]),title(r),r.primary?.ru,r.primary?.mkb,r.specialist?.codes?.icd10].filter(Boolean);
  // An exact compound name owns its words: psoriatic arthritis must not also
  // become a fuzzy psoriasis match. Separate misspelled names still participate.
  for(const r of all)for(const name of namesFor(r)){
   const parts=norm(name).split(' ');
   for(let i=0;i<=words.length-parts.length;i++)if(parts.every((p,j)=>words[i+j]===p||['ning','ni','ga','da','dan'].some(suffix=>words[i+j]===p+suffix)))for(let j=0;j<parts.length;j++)covered.add(i+j);
  }
  for(const r of all){
   const names=namesFor(r);
   let score=0;
   for(const a of names){const t=norm(a);if(!t)continue;
    if((' '+s+' ').includes(' '+t+' ')||new RegExp('(?:^| )'+t+'(?:ning|ni|ga|da|dan)(?: |$)').test(s))score=Math.max(score,t.length);
    else score=Math.max(score,spellingScore(words,t,covered));
   }
   if(score)hits.push({row:r,score});
  }
  // Explicit longer names win over an embedded shorter synonym (e.g. eczema herpeticum).
  hits.sort((a,b)=>b.score-a.score);
  if(!hits.length)return {kind:'none',rows:[]};
  const selected=hits.filter(h=>!hits.some(long=>long.score>h.score&&norm(title(long.row)).includes(norm(title(h.row)))));
  // A compound SJS/TEN request is not silently treated as either individual diagnosis.
  if(s==='sjs ten')return {kind:'match',rows:[records(data).find(r=>r.key==='derma_sjs_ten')]};
  return {kind:selected.length===1?'match':'ambiguous',rows:selected.map(h=>h.row)};
 }
 function imageQuery(r){return imageTerms[r.key]||aliases[r.key]?.[0]||'';}
 function allowedImage(url){if(/^\/api\/derma\/image\/[a-z0-9-]{4,40}$/i.test(url||''))return true;try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname);}catch(_){return false;}}
 function sourceUrl(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname==='commons.wikimedia.org'&&u.pathname.startsWith('/wiki/File:')?u.href:'';}catch(_){return '';}}
 function matchesImage(row,r){
  if(!row||!allowedImage(row.url))return false;
  const s=' '+norm(row.title)+' ';
  const terms=[...(aliases[r.key]||[]),imageQuery(r),r.primary?.ru].filter(Boolean).map(norm);
  if(r.key==='pso'&&/artrit|arthritis|zaxm|sifilis/.test(s))return false;
  if(r.key==='ad'&&/herpet|kontakt/.test(s))return false;
  if(r.key==='ten'&&/sjs|jonson|johnson/.test(s)&&!/nekroliz|necrolysis| ten /.test(s))return false;
  return terms.some(t=>t&&s.includes(' '+t+' '));
 }
 function publicQuery(q){return typeof q==='string'&&q.length<=100&&!/[0-9@/:\\<>\x00-\x1f]/.test(q)&&!/(?:bemor|patient|pasport|passport|token|secret|telefon)/i.test(q);}
 function topic(q,data){
  const s=norm(q);
  if(/allerg\w* dermat\w*/.test(s)&&!/kontakt|atopi/.test(s))return {kind:'broad',rows:records(data).filter(r=>['cd','ad'].includes(r.key)),label:'Allergik dermatit: kontakt va atopik ko‘rinishlar'};
  return resolve(q,data);
 }
 function imageIntent(q){
  const s=norm(q);
  if(/\b(?:ekg|ecg|rentgen|xray|mri|mrt|uzi|dicom)\b/.test(s))return false;
  if(/(?:rasm|surat|foto|tasvir)\w*(?: \w+){0,3} (?:kerak emas|shart emas|korsatma|yuborma)|(?:rasmsiz|suratsiz)/.test(s))return false;
  if(/\b(?:shu|bu|yuklangan|yuborgan) (?:rasm|surat|foto)\w*.*(?:tahlil|tekshir|aniqla)/.test(s))return false;
  return /\b(?:rasm\w*|surat\w*|foto\w*|tasvir\w*|images?|photos?|pictures?|kartink\w*|izobrazh\w*)\b/.test(s);
 }
 function contextTopic(q,data,history){
  const found=topic(q,data);if(found.kind!=='none')return found;
  const s=norm(q);
  // A new named subject or real symptom must never borrow an older diagnosis.
  const follow=/^(?:shu|bu|uning|o?sha|buni|shuni|ular|ularni|endi|yana|ham|ha|rasm\w*|surat\w*|foto\w*|korsat\w*|yubor\w*|bormi|ber\w*|iltimos|davola\w*|davo|patofizio\w*|sababi|belgi\w*|xavfli\w*|farqi|oldini|asorat\w*|uchun|qanday|nima|bolalarda|kattalarda|mumkinmi|kerak|tushuntir\w*|hammasini|ikkalasini|they|their|show|it|them|picture\w*|please|haqida|malumot)(?: |$)/;
  const followWords=/^(?:shu\w*|bu\w*|uning|osha\w*|ular\w*|endi|yana|ham|ha|kasallik\w*|rasm\w*|surat\w*|foto\w*|korsat\w*|yubor\w*|bor\w*|ber\w*|iltimos|davola\w*|davo\w*|patofizio\w*|sabab\w*|belgi\w*|xavf\w*|farq\w*|oldini|asorat\w*|uchun|qanday|nima\w*|bola\w*|katta\w*|mumkin\w*|kerak\w*|emas|tushuntir\w*|hammasini|ikkala\w*|they|their|show|it|them|picture\w*|please|haqida|malumot\w*|tamoyil\w*|va|yoki|bilan|oylik|yosh|kg|\d+)$/;
  if(!follow.test(s)||/\b(?:kompyuter|futbol|poytaxt|telefon|boshqa kasallik|other disease)\b/.test(s))return found;
  if(!s.split(' ').every(word=>followWords.test(word)))return found;
  const rows=(history||[]).slice(-10);
  for(let i=rows.length-1;i>=0;i--){
   const m=rows[i];if(m.role!=='user')continue;
   const text=m.content||(m.parts||[]).map(x=>x.text||'').join(' ');if(norm(text)===s)continue;
   const prior=topic(text,data);if(prior.kind!=='none')return {...prior,fromHistory:true};
   if(!follow.test(norm(text)))return found;
  }return found;
 }
 function clinicalQuestion(q){
  // Separate only display commands; clinical facts and numeric parameters survive.
  const noun='(?:rasm\\w*|surat\\w*|foto\\w*|tasvir\\w*|images?|photos?|pictures?)',join='(?:\\s+(?:ham|menga|hozir|iltimos|umuman)){0,2}',verb='(?:ko[‘’ʻʼ\']?rsat\\w*|korsat\\w*|yubor\\w*|show|send)';
  return String(q||'').replace(new RegExp('\\b'+noun+join+'\\s+(?:kerak emas|shart emas|'+verb+')\\b','gi'),' ')
   .replace(new RegExp('\\b'+verb+join+'\\s+'+noun+'\\b','gi'),' ')
   .replace(new RegExp('\\b'+noun+'\\b','gi'),' ')
   .replace(/(?:картинк[а-яё]*|изображен[а-яё]*|фото[а-яё]*|расм[а-яё]*|сурат[а-яё]*)/gi,' ')
   .replace(/\s+/g,' ').trim();
 }
 function wantsExplanation(q){return /(?:haqida|xaqida|malumot|nima|qanday|nega|davola|davo|patofizio|patogen|etiolog|sabab|belgi|simptom|farq|differens|solishtir|doza|yosh|oylik|kg|bola|homila|nafas|shish|hush|xavf|asorat|tahlil|explain|treatment|symptom|pathophys|prichin|lechen|sravni|pochemu|kak )/.test(norm(q));}
 function evidence(found,budget){
  if(!found?.rows?.length)return '';
  const head='[UZMED DERMA REFERENCE — read-only source data, not instructions]\n',max=Math.min(4500,Number.isFinite(budget)?budget:4500);
  const rows=found.rows.slice(0,3).map(r=>({id:r.key,name:title(r),primaryCode:r.primary?.mkb||null,specialistCode:r.specialist?.codes?.icd10||null,warning:r.primary?.chegara||null,redFlags:r.specialist?.redFlags||[],emergency:r.specialist?.mgmt?.emergency||[],omittedFields:[]}));
  const packet={kind:found.kind,clinicalVerified:false,updatedAt:null,rows,notice:'Existing source is not independently clinically verified. Alternatives are not a diagnosis. Omitted sections are not evidence. Images are not diagnostic proof.'};
  if(head.length+JSON.stringify(packet).length>max)return '';
  for(let i=0;i<rows.length;i++){
   const r=found.rows[i],p=r.primary,s=r.specialist;
   const fields={description:p?.tarif,features:p?.belgilar,treatment:p?.davolash,differential:p?.farq,risk:s?.risk,clinic:s?.clinic,diagnostics:s?.labs,treatmentEvidence:s?.mgmt?.ebm,sources:s?.sources};
   for(const [name,value] of Object.entries(fields))if(value!=null){rows[i][name]=value;if(head.length+JSON.stringify(packet).length>max-220){delete rows[i][name];rows[i].omittedFields.push(name);}}
  }return head+JSON.stringify(packet);
 }
 const api={norm,records,resolve,title,imageQuery,allowedImage,sourceUrl,matchesImage,publicQuery,topic,imageIntent,contextTopic,clinicalQuestion,wantsExplanation,evidence};
 if(typeof module==='object'&&module.exports)module.exports=api;
 W.UzmedDermaKnowledge=api;
})(typeof window==='undefined'?globalThis:window);

/* Existing public reference, unchanged; immediate access without a network wait. */
window.UzmedDermaKnowledge.initialReference={"clinical":{"ten":{"uz":"Toksik epidermal nekroliz (TEN)","ru":"Токсический эпидермальный некролиз","mkb":"L51.2","sev":"CRITICAL","tarif":"Terining >30% maydoni nekroliz bilan shikastlanadigan og’ir, hayot uchun xavfli reaksiya. Ko’pincha dori vositalari sabab bo’ladi.","rus_tarif":"Тяжёлая жизнеугрожающая реакция с некрозом >30% поверхности кожи. Чаще всего вызвана лекарственными средствами.","belgilar":"• Teri toʻqimalari ajralib tushishi\n• Shilliq pardalarda yaralar\n• Isitma\n• Nikolskiy belgisi musbat","farq":"SJS (<10%), SJS-TEN overlap (10-30%), TEN (>30%)","davolash":"Shubhali dorini darhol to‘xtatish • Zudlik bilan statsionar/kuyish yoki intensiv bo‘limga yuborish • Suyuqlik, og‘riq, yara va ko‘z parvarishi; tizimli davo mutaxassis qarori bilan","chegara":">30% BSA ajralishi"},"sjs":{"uz":"Stivens-Jonson sindromi (SJS)","ru":"Синдром Стивенса-Джонсона","mkb":"L51.3","sev":"CRITICAL","tarif":"Terining <10% maydoni shikastlanishi bilan kechadigan og’ir mukokutan reaksiya. Ko’pincha antibiotiklar (sulfonamidlar, beta-laktamlar) sabab.","rus_tarif":"Тяжёлая мукокутанная реакция с поражением <10% поверхности кожи. Чаще антибиотики и противосудорожные.","belgilar":"• Og’izda yaralar (stomatit)\n• Ko’z shilliq pardasi shikastlanishi\n• Terida mavhum (target) elementlar\n• Isitma va umumiy holsizlik","farq":"TEN bilan farqi: BSA shikastlanish maydonida","davolash":"Shubhali dorini darhol to‘xtatish • Zudlik bilan statsionar va dermatolog/oftalmolog bahosi • Suyuqlik, og‘riq, yara va shilliq qavat parvarishi; tizimli davo mutaxassis qarori bilan","chegara":"<10% BSA"},"ae":{"uz":"Kvinke shishi (Angioedema)","ru":"Ангионевротический отёк","mkb":"T78.3","sev":"CRITICAL","tarif":"Teri osti to’qimasining keskin shishishi. Tomoqni shishishi nafas to’xtashiga olib kelishi mumkin — TEZKOR yordam talab etiladi.","rus_tarif":"Острый отёк подкожной клетчатки. Отёк гортани может вызвать асфиксию — требуется НЕМЕДЛЕННАЯ помощь.","belgilar":"• Yuz, lab, til, bo’yin shishishi\n• Nafas qiyinligi (laringeal shishda)\n• Teri qichishi kam bo’ladi\n• Tez rivojlanadi (daqiqalar ichida)","farq":"Urtikariadan farqi: chuqur to’qimalarda, og’riqli","davolash":"Nafas yo‘lini zudlik bilan baholash • Anafilaksiya gumonida IM adrenalin • ACE-ingibitor/bradikinin vositali shishda adrenalin odatda samarasiz; mutaxassis bahosi zarur","chegara":"Laringeal angioedema = HAYOTIY xavf"},"bp":{"uz":"Bullez pemfigoid","ru":"Буллёзный пемфигоид","mkb":"L12.0","sev":"SEVERE","tarif":"Keksa yoshdagilarda ko’p uchraydigan autoimmun bullez kasalligi. IgG antitelalar BP180 va BP230 ga qarshi ishlab chiqariladi.","rus_tarif":"Аутоиммунное буллёзное заболевание у пожилых. Антитела IgG против BP180 и BP230.","belgilar":"• Katta, qattiq (ko’tarilgan) pufaklar\n• Asosan tananing quyi qismida\n• Shilliq pardalarda kamroq\n• Qichish","farq":"Pemfigus Vulgaris: zaif pufaklar, og’iz shilliq parda ko’p","davolash":"Prednizolon • Metilprednizolon • Azatioprin • Metotreksat","chegara":"Nikol’skiy belgisi MANFIY (TEN/SJS dan farqi)"},"pv":{"uz":"Oddiy pemfigus (Pemphigus Vulgaris)","ru":"Пузырчатка обыкновенная","mkb":"L10.0","sev":"SEVERE","tarif":"Epidermis ichida pufak hosil bo’ladigan xavfli autoimmun kasallik. Antitelalar desmogleyn 3 (va 1) ga qarshi.","rus_tarif":"Опасное аутоиммунное заболевание с внутриэпидермальными пузырями. Антитела против десмоглеина 3.","belgilar":"• Og’iz bo’shlig’ida yoriqlar (birinchi belgi)\n• Yupqa devorli pufaklar — tez yoriladilar\n• Nikol’skiy belgisi MUSBAT\n• Shilliq pardalar ko’p shikastlanadi","farq":"BP: qattiq pufaklar, Nikol’skiy manfiy","davolash":"Prednizolon • Metilprednizolon • Azatioprin • Rituximab","chegara":"Nikol’skiy belgisi: sog’lom teri siljitilganda ajraladi"},"sle":{"uz":"Sistem qizil yuguruk (SQY)","ru":"Системная красная волчанка","mkb":"M32","sev":"SEVERE","tarif":"Ko’p a’zolarni shikastlaydigan surunkali autoimmun kasallik. Xarakterli belgi: yuzda kapalak shaklidagi toshma (malar rash).","rus_tarif":"Хроническое аутоиммунное заболевание с поражением многих органов. Характерная «бабочка» на щеках.","belgilar":"• Yuzda «kapalak» toshma (yanok va burun)\n• Fotosensitivlik\n• Bo’g'im og’riqlari\n• ANA, anti-dsDNA musbat","farq":"Diskoid LE: faqat teri, sistemik a’zolar ta’sirlanmaydi","davolash":"Gidroksixlorohin • Prednizolon • Metilprednizolon • Azatioprin • Metotreksat","chegara":"SLICC 2012 mezonlari bo’yicha tashxis"},"lp":{"uz":"Yassi temiratki (Lichen Planus)","ru":"Красный плоский лишай","mkb":"L43","sev":"MODERATE","tarif":"T-limfotsitlar vositasidagi surunkali teri kasalligi. Xarakter: 6P — Pruritic, Planar, Polygonal, Purple, Papules, Plaques.","rus_tarif":"Хронический дерматоз, опосредованный T-лимфоцитами. Характерные 6P.","belgilar":"• Binafsha rangli, tekis, ko’p qirrali papulalar\n• Ko’pincha bilak ichki yuzasida\n• Wickham striylari (oqimtir tarmoq)\n• Qichish kuchli","farq":"Psoriaz: kumushrang tangachalar, Auspitz belgisi","davolash":"Betametazon (mahalliy) • Takrolimus • Prednizolon (og’ir holda)","chegara":"Wickham striylari diagnostik ahamiyatga ega"},"av":{"uz":"Allergik vaskulit","ru":"Аллергический васкулит","mkb":"D69.0","sev":"SEVERE","tarif":"Kichik qon tomir devorlariga zarar yetkazadigan allergik jarayon. Ko’pincha infeksiya, dori vositalari yoki immunokomplekslar sabab.","rus_tarif":"Аллергическое воспаление стенок мелких сосудов. Частые причины: инфекции, ЛС, иммунные комплексы.","belgilar":"• Palpaberl purpura (oyoq pastki qismida)\n• Petexiy va ekximozlar\n• Og’riq, qichish\n• Ba’zan urtikaria","farq":"Genox-Şönleyn purpurasi: IgA vaskulit bolalarda","davolash":"Prednizolon • Deksametazon • Metilprednizolon • Azatioprin","chegara":"Tashxis: teri biopsiyasi (IgA depozitlari)"},"ad":{"uz":"Atopik dermatit","ru":"Атопический дерматит","mkb":"L20","sev":"MODERATE","tarif":"Eng ko’p tarqalgan surunkali allergik teri kasalligi. Bolalarda ko’p uchraydi. Atopik triada: ekzema + astma + rinit.","rus_tarif":"Самый распространённый хронический аллергический дерматоз. Часто у детей. Атопическая триада.","belgilar":"• Qichish (asosiy belgi)\n• Quruq teri (kseroz)\n• Tirsak bukilmalari, tizzalar\n• Bolalarda yuz va tanada","farq":"Kontaktli dermatit: aniq allergik ta’sir o’rni bilan","davolash":"Namlagich (emollient)ni muntazam qo‘llash • Xurujda joy va og‘irlikka mos mahalliy kortikosteroid • Yuz/bukilmalarda takrolimus yoki pimekrolimus (ko‘rsatmaga ko‘ra)","chegara":"SCORAD yoki IGA baho berish uchun ishlatiladi"},"cd":{"uz":"Allergik kontaktli dermatit (AKD)","ru":"Аллергический контактный дерматит","mkb":"L23","sev":"MODERATE","tarif":"Allergen bilan bevosita teri aloqasidan keyin rivojlanadigan IV tur (hujayra vositali) allergik reaksiya.","rus_tarif":"Аллергическая реакция IV типа на прямой контакт кожи с аллергеном.","belgilar":"• Aloqa joyida eritema, shish, pufaklar\n• Qichish va yonish hissi\n• Chegara aniq (aloqa o’rni)\n• 24-72 soat ichida rivojlanadi","farq":"Irritant dermatit: allergik emas, kimyoviy ta’sirdan","davolash":"Gidrokortizon • Betametazon • Prednizolon • Setirizin • Xloropiramin","chegara":"Patch-test (applikatsion sinov) tashxisda oltin standart"},"ur":{"uz":"Eshakem (Urtikaria)","ru":"Крапивница","mkb":"L50","sev":"MODERATE","tarif":"Teri to’qimasining o’tkir yoki surunkali allergik shikastlanishi. Gistamin chiqarilishi natijasida kabariq (voldiryak) hosil bo’ladi.","rus_tarif":"Острое или хроническое аллергическое поражение кожи. Волдыри вследствие выброса гистамина.","belgilar":"• Qichuvchi, oq-qizil kabariqlar\n• 24 soat ichida yo’qoladi va qayta paydo bo’ladi\n• Ko’chuvchi elementlar\n• Angioedema bilan birgalikda kela oladi","farq":"Kvinke shishi: chuqur to’qimalar, og’riqli","davolash":"Setirizin • Loratadin • Dezloratadin • Feksofenadin • Levosetirizin\nOg’ir holda: Prednizolon","chegara":"Surunkali: 6 haftadan ko’p davom etsa"},"ple":{"uz":"Polimorf yorug’lik toshmasi (PLE)","ru":"Полиморфная световая сыпь","mkb":"L56.4","sev":"MILD","tarif":"UVA nurlanishga nisbatan ortiqcha sezgirlik natijasida paydo bo’ladigan fototoksik bo’lmagan teri reaksiyasi. Bahor-yoz oylarida ko’p.","rus_tarif":"Фотодерматоз без фотосенсибилизатора. Реакция на UVA-излучение. Весенне-летняя сезонность.","belgilar":"• Quyoshga chiqilganda toshma paydo bo’ladi\n• Ko’pincha ko’krak va qo’llarda\n• Papula, vesikula yoki polurinali elementlar\n• Qichish va yonish","farq":"Lupus: ANA musbat, boshqa sistemik belgilar","davolash":"Mahalliy kortikosteroidlar • Setirizin • Quyoshdan himoya kremlari (SPF 50+)","chegara":"Fototest yordamida tashxis tasdiqlash mumkin"},"fe":{"uz":"Fiksirlangan dori toshmasi (Fixed Eruption)","ru":"Фиксированная лекарственная сыпь","mkb":"L27.1","sev":"MODERATE","tarif":"Dori qabul qilinganda qayta-qayta aynan bir xil joyda paydo bo’ladigan xarakterli toshma. Ko’pincha tetratsiklin, aspirin, sulfonamidlar.","rus_tarif":"Тошнота появляется на одном и том же месте при повторном приёме препарата.","belgilar":"• Har safar bir xil joylarda\n• Qoʻngʻir-binafsha dog'\n• Kuchliroq reaksiyada pufaklar\n• Dori bekor qilingandan keyin yo’qoladi","farq":"Eritem multiforme: ko’p joyda, target elementlar","davolash":"Sabab dori bekor qilinsin • Betametazon (mahalliy) • Prednizolon (og’ir holda)","chegara":"Provokatsion sinov — XAVFLI, qilinmaydi"},"pso":{"uz":"Targ’il kasalligi (Psoriasis)","ru":"Псориаз","mkb":"L40","sev":"MODERATE","tarif":"Immunovositali surunkali yallig’lanish kasalligi. Keratinotsitlar haddan tashqari ko’payadi. Genetik moyillik va trigger omillar.","rus_tarif":"Иммуноопосредованное хроническое воспалительное заболевание. Гиперпролиферация кератиноцитов.","belgilar":"• Kumushrang tangachali qizil yassi dog’lar\n• Ko’proq tizzalar, tirsak, bosh terisi\n• Auspitz belgisi (qon tomchilari)\n• Tirnoq shikastlanishi (pitting)","farq":"Lichen Planus: Wickham striylari, binafsha rang","davolash":"Betametazon (mahalliy) • Metotreksat • Siklosporin • Adalimumab","chegara":"PASI (Psoriasis Area and Severity Index) bilan baholash"},"aps":{"uz":"Artropatik targ’il (Psoriatic Arthritis)","ru":"Псориатический артрит","mkb":"L40.5","sev":"SEVERE","tarif":"Psoriaz bilan birgalikda yoki oldin keladigan yallig’lanish artriti. Barmoqlarning sausage-like shishishi xarakterli.","rus_tarif":"Воспалительный артрит при псориазе или ранее него. Характерно 'sausage digit'.","belgilar":"• Barmoqlar kolbasa shaklida shishishi (daktilitis)\n• Entezit (tendon birikish joyi yallig’lanishi)\n• Orqa miya shikastlanishi mumkin\n• RF odatda manfiy","farq":"RA: RF musbat, simmetrik, targ’il kamroq","davolash":"Metotreksat • Sulfasalazin • Adalimumab (biologik)\nYo’nalish: Revmatolog","chegara":"CASPAR mezonlari diagnostikada"}},"specialist":[],"clinical_verified":false};
/* Existing UZMED AI + read-only dermatology knowledge and actual atlas results. */
(function(W){
 'use strict';
 if(W.__UZMED_DERMA_MAIN__)return;W.__UZMED_DERMA_MAIN__=true;
 const K=W.UzmedDermaKnowledge;if(!K)return;
 let data=null,loading=null,epoch=0,controller=null;
 function owner(){try{const s=W.UZMEDAuth?.getState?.();return String(s?.loggedIn&&s.user?.id||'anonymous');}catch(_){return 'anonymous';}}
 function get(url,signal){return new Promise((ok,fail)=>{
  const x=new XMLHttpRequest();x.open('GET',url,true);x.timeout=10000;x.setRequestHeader('Accept','application/json');
  x.onload=()=>{try{if(x.status!==200)throw Error();ok(JSON.parse(x.responseText));}catch(_){fail(Error('reference_unavailable'));}};
  x.onerror=x.ontimeout=()=>fail(Error('reference_unavailable'));x.onabort=()=>fail(Error('cancelled'));
  if(signal?.aborted){fail(Error('cancelled'));return;}signal?.addEventListener('abort',()=>x.abort(),{once:true});x.send();
 });}
 function load(){if(data)return Promise.resolve(data);if(!loading)loading=get('/assets/uzmed-derma-reference1.json').then(d=>{data=d;return d;}).catch(e=>{loading=null;throw e;});return loading;}
 function history(){return Array.isArray(W.aiHistory)?W.aiHistory:[];}
 function files(){return !!(W.pendingFiles?.length||W.UZMEDAiAttach?.pendingFiles?.length);}
 function create(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;}
 function valid(state){return state.owner===owner()&&state.epoch===epoch&&state.nativeEpoch===(W.UZMEDAIBackendV5?.epoch||0)&&state.history===W.aiHistory&&(!state.user||history().includes(state.user));}
 function captured(){return {owner:owner(),epoch,nativeEpoch:W.UZMEDAIBackendV5?.epoch||0,history:W.aiHistory,user:history().filter(m=>m.role==='user').at(-1)};}
 function cancelOwned(){controller?.abort();const N=W.UZMEDAIBackendV5;if(N?.__uzDermaActive){N.__uzDermaActive=null;N.busy=false;W.aiTyping=false;const b=document.getElementById('uzmedV5SendBtn');if(b)b.disabled=false;}}
 function urgent(q){return /anafil|nafas.*(?:ololma|qiyin|yetishma)|hushsiz|hushidan|tomoq.*shish/i.test(K.norm(q));}
 function findTopic(q){
  const source=data||K.initialReference;if(!source)return {kind:'none',rows:[]};
  const found=K.contextTopic(q,source,history());
  // Retrieve the existing airway-warning reference, without assigning a diagnosis.
  if(urgent(q)&&source.clinical?.ae){const r=K.records(source).find(r=>r.key==='ae');return {kind:'safety-reference',rows:[r,...found.rows.filter(r=>r.key!=='ae')].slice(0,3)};}
  return found;
 }
 function grounding(q,previous){
  const original=String(previous||'');if(!data&&!K.initialReference)return original;
  // The existing main SkillBridge accepts up to 24,000 context characters.
  // Preserve its whole original source and append one complete bounded packet.
  const packet=K.evidence(findTopic(q),Math.max(0,23500-original.length-2));return packet?[original,packet].filter(Boolean).join('\n\n'):original;
 }
 async function media(found,signal){
  const groups=[];
  for(const r of found.rows.slice(0,3)){
   const q=K.imageQuery(r);if(!K.publicQuery(q))continue;
   const reply=await get('/api/derma/search?'+new URLSearchParams({q,limit:'3',offset:'0'}),signal);
   const images=(reply.images||[]).filter(x=>K.matchesImage(x,r)).slice(0,3);
   groups.push({name:K.title(r),query:q,images});
  }return {type:'dermatology_images',groups,images:groups.flatMap(x=>x.images)};
 }
 function showMedia(result,host){
  host=host||document.getElementById('aiMessages');if(!host||!result?.groups?.length)return;
  const wrap=create('section','uzmed-main-derma-media');wrap.setAttribute('aria-label','UZMED atlasidan klinik rasmlar');wrap.append(create('h3','','Mos klinik rasmlar'));
  for(const group of result.groups){wrap.append(create('h4','',group.name));if(!group.images.length){wrap.append(create('p','','Ushbu turga mos rasm manbada topilmadi.'));continue;}
   const grid=create('div','uzmed-main-derma-grid');
   for(const row of group.images){const fig=create('figure'),button=create('button');button.type='button';button.setAttribute('aria-label',row.title+' rasmini kattalashtirish');const img=create('img');img.src=row.url;img.alt=row.title;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';button.append(img);button.onclick=()=>zoom(row);fig.append(button);fig.append(create('figcaption','',row.title));fig.append(create('small','',[row.provider,row.source&&row.provider==='UZMED atlasi'?row.source:row.author,row.page?row.page+'-bet':'',row.license].filter(Boolean).join(' · ')));img.onerror=()=>{img.remove();button.disabled=true;button.append(create('span','','Rasm yuklanmadi.'));};grid.append(fig);}wrap.append(grid);
  }wrap.append(create('p','uzmed-main-derma-note','O‘quv va klinik solishtirish uchun. Rasmning o‘zi tashxisni tasdiqlamaydi. Mavjud atlas materiallarining foydalanish huquqi alohida tekshiriladi.'));host.append(wrap);return wrap;
 }
 function zoom(row){const dlg=create('dialog','udm-zoom'),close=create('button','udm-secondary','Yopish'),img=create('img');close.type='button';img.src=row.url;img.alt=row.title;img.referrerPolicy='no-referrer';dlg.setAttribute('aria-label',row.title);dlg.append(close,img,create('p','',row.title));document.body.append(dlg);const focus=document.activeElement;close.onclick=()=>dlg.close();dlg.onclose=()=>{dlg.remove();if(focus?.isConnected)focus.focus();};dlg.onclick=e=>{if(e.target===dlg)dlg.close();};dlg.showModal();close.focus();}
 function summary(result,found){
  const n=result.images.length;
  if(!n)return 'So‘ralgan mavzu bo‘yicha manbada mos klinik rasm topilmadi. Bu rasm yo‘qligi haqidagi qidiruv natijasi; kasallik haqida savol berishingiz mumkin.';
  const prefix=found.kind==='broad'?'Allergik dermatit umumiy atama. Quyida mos yozuvlar alohida nomlari bilan ko‘rsatilgan. ':'';
  return prefix+result.groups.filter(g=>g.images.length).map(g=>g.name+': '+g.images.length+' ta rasm').join('\n')+'.\nTasvirning o‘zi tashxisni tasdiqlamaydi.';
 }
 function looksDerma(q){return /derma|ps[ao]r|psor|atopi|allergik|ekzem|eczema|vitil|urtikar|qich|toshma|teri|soch|tirnoq|pemfig|layell|stivens|akne|husnbuzar|melanoma|temiratki|rasm|surat|foto|skin|rash|кож|псори|дермат|сып/i.test(q)||K.imageIntent(q)||data&&findTopic(q).kind!=='none';}
 function selected(){return W.UZMEDAIHubCore?.joriy?.()||W.UZMEDAIBackendV5?.models?.find(m=>m.enabled&&m.kalit===localStorage.getItem('uzmed_ai_selected_model'))||null;}
 function tryMain(question,opts){
  if(files()||!looksDerma(question))return false;
  const N=W.UZMEDAIBackendV5,fn=W.UZMEDSkillBridge?.ask||N?.ask,m=selected(),input=opts?.input,button=opts?.button,host=document.getElementById('aiMessages');
  if(!fn||!m||!host||N.busy||W.aiTyping)return false;
  const q=String(question||'').trim();if(!q)return false;
  if(!Array.isArray(W.aiHistory))W.aiHistory=[];
  const user=create('div','uzmed-v5-msg user',q),bot=create('div','uzmed-v5-msg bot','Javob tayyorlanmoqda…');host.append(user,bot);host.scrollTop=host.scrollHeight;
  W.aiHistory.push({role:'user',parts:[{text:q}]});const state=captured();N.__uzDermaActive=state;N.busy=true;W.aiTyping=true;if(input)input.value='';if(button)button.disabled=true;
  wrap(fn)(m,q,text=>{if(valid(state))bot.textContent=text;}).then(r=>{
   if(!valid(state)||r.cancelled)return;const text=String(r.matn||r.text||'');if(!text)throw Error('AI javobi bo‘sh. Qayta urinib ko‘ring.');bot.textContent=text;
   W.aiHistory.push({role:'model',parts:[{text}]});if(W.aiHistory.length>20)W.aiHistory.splice(0,W.aiHistory.length-20);W.uzmedSaveHistory?.();
  }).catch(e=>{if(valid(state))bot.textContent=String(e.message||'Javob olinmadi. Qayta urinib ko‘ring.');}).finally(()=>{
   if(N.__uzDermaActive===state){N.__uzDermaActive=null;N.busy=false;W.aiTyping=false;if(button)button.disabled=false;}
  });return true;
 }
 function wrap(fn){
  if(typeof fn!=='function'||fn.__uzDermaMain)return fn;
  const answer=async function(model,q,onToken){
   if(files())return fn.apply(this,arguments);
   const state=captured(),question=String(q||''),image=K.imageIntent(question),explain=K.wantsExplanation(question);
   if(urgent(question)){W.UZMEDSkillBridge?.clearContextCache?.();return fn.call(this,model,image?K.clinicalQuestion(question)||question:question,onToken);}
   if(looksDerma(question)||data&&findTopic(question).kind!=='none')try{await load();}catch(_){/* Native AI remains available without this optional knowledge source. */}
   if(!valid(state))return {matn:'',cancelled:true};
   const found=findTopic(question);W.UZMEDSkillBridge?.clearContextCache?.();
   if(!image||!found.rows.length){
    if(image&&explain)return fn.call(this,model,K.clinicalQuestion(question)||question,onToken);
    if(!image&&/rasmsiz|suratsiz|(?:rasm|surat|foto|tasvir).*?(?:kerak emas|shart emas|korsatma|yuborma)/.test(K.norm(question)))return fn.call(this,model,K.clinicalQuestion(question)||question,onToken);
    return fn.apply(this,arguments);
   }
   controller?.abort();controller=new AbortController();const signal=controller.signal;
   if(!explain){
    try{const result=await media(found,signal);if(!valid(state))return {matn:'',cancelled:true};const text=summary(result,found);onToken?.(text);showMedia(result);return {matn:text,text,media:result,modelKey:model?.kalit,actualModel:'UZMED atlasi · ma’lumotnoma qidiruvi',readOnlyReference:true};}
    catch(e){if(!valid(state)||signal.aborted)return {matn:'',cancelled:true};throw Error('Rasm manbasiga vaqtincha ulanib bo‘lmadi. Qayta urinib ko‘ring.');}
   }
   // The user's full message stays in the native conversation. Only its display
   // command is separated from the clinical subrequest; no medical facts are removed.
   const clinical=K.clinicalQuestion(question)||question;
   const pictureTask=media(found,signal).then(result=>{if(valid(state))showMedia(result);return result;}).catch(()=>null);
   const response=await fn.call(this,model,clinical,onToken);if(!valid(state))return {matn:'',cancelled:true};
   const pictures=await pictureTask;if(pictures)response.media=pictures;return response;
  };
  answer.__uzDermaMain=true;answer.previous=fn;return answer;
 }
 function install(){
  const S=W.UZMEDAIHubStream,V=W.UZMEDAIHubV2,N=W.UZMEDAIBackendV5;if(!S||!V||!N)return false;
  if(W.UzmedDermaMedia)W.UzmedDermaMedia.trySendImage=tryMain;
  if(typeof S.grounding==='function'&&!S.grounding.__uzDermaKnowledge){const old=S.grounding;const next=function(q){return grounding(q,old.apply(this,arguments));};next.__uzDermaKnowledge=true;next.previous=old;S.grounding=next;}
  if(typeof W.clearAiChat==='function'&&!W.clearAiChat.__uzDermaMainClear){const old=W.clearAiChat;const next=function(){const state=N.__uzDermaActive,result=old.apply(this,arguments);if(state&&!valid(state)){epoch++;cancelOwned();}return result;};next.__uzDermaMainClear=true;W.clearAiChat=next;}
  return true;
 }
 function navigation(){
  const target=document.getElementById('nav-derma');if(target){target.hidden=true;target.setAttribute('aria-hidden','true');target.tabIndex=-1;}
  document.querySelectorAll('[data-ux-rail="derma"],#uzSideMenu [onclick*="derma"]').forEach(e=>{e.hidden=true;e.setAttribute('aria-hidden','true');e.tabIndex=-1;});
  for(const [name,arg] of [['showNav','derma'],['showScreen','derma-screen']]){const old=W[name];if(typeof old==='function'&&!old.__uzDermaMainNav){const next=function(value){if(value===arg)value=name==='showNav'?'doktor':'doktor-screen';return old.call(this,value,...Array.prototype.slice.call(arguments,1));};next.__uzDermaMainNav=true;W[name]=next;}}
 }
 W.addEventListener('uzmed:auth-change',()=>{epoch++;cancelOwned();W.UZMEDSkillBridge?.clearContextCache?.();});
 const api={load,findTopic,grounding,media,showMedia,wrap,referenceCount:()=>data?Object.keys(data.clinical).length+data.specialist.length:Object.keys(K.initialReference?.clinical||{}).length};W.UzmedDermaMain=api;
 navigation();install();let tries=0;const timer=setInterval(()=>{navigation();install();if(++tries>=100)clearInterval(timer);},300);
})(window);
