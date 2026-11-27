/* Field choices, not a dosing recommendation. Product text stays with its source. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.QabulMedicineOptions=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const routes=['Og‘iz orqali','Til ostiga','Lunj shilliq qavatiga','Vena ichiga','Mushak orasiga','Teri ostiga','Teri ichiga','Ingalatsiya orqali','Burun orqali','Ko‘zga','Quloqqa','Teriga mahalliy','Shilliq qavatga mahalliy','Rektal','Vaginal'];
 const presets={
  frequency:['Kuniga 1 marta','Kuniga 2 marta','Kuniga 3 marta','Kuniga 4 marta','Har 4 soatda','Har 6 soatda','Har 8 soatda','Har 12 soatda','Har 24 soatda','Ertalab','Kunduzi','Kechqurun','Uyqu oldidan','Zarurat bo‘lganda','Haftasiga 1 marta'],
  duration:['1 kun','3 kun','5 kun','7 kun','10 kun','14 kun','21 kun','28 kun','30 kun','6 hafta','2 oy','3 oy','Shifokor nazoratigacha'],
  goal:['Simptomlarni yengillashtirish','Asosiy kasallikni davolash','Profilaktika','O‘rnini bosuvchi davolash','Yordamchi davolash'],
  notes:['Nazorat ko‘rigida qayta baholash','Nojo‘ya ta’sir bo‘lsa shifokorga murojaat qiling','O‘zboshimchalik bilan dozani o‘zgartirmang']
 };
 const clean=s=>typeof s==='string'?s.normalize('NFKC').trim().replace(/\s+/g,' '):'';
 function strengths(raw){
  let text=clean(raw);if(!text||text.length>12000)return [];
  text=text.split(/в\s+комплекте|комплект\s+с|в\s+компл\./i)[0]
   .replace(/международн(?:ая|ые|ых)\s+единиц(?:а|ы)?/gi,'ME')
   .replace(/микрограмм(?:а|ов)?(?![\p{L}])/giu,'mkg').replace(/миллиграмм(?:а|ов)?(?![\p{L}])/giu,'mg').replace(/грамм(?:а|ов)?(?![\p{L}])/giu,'g');
  const n='\\d+(?: \\d{3})*(?:[.,]\\d+)?',u='(?:(?:тыс\\.?|млн\\.?)\\s*)?(?:анти[- ]?(?:Ха|Xa)\\s*)?(?:micrograms?|milligrams?|mcg|mkg|[µμ]g|mg|mmol|mEq|[kMG]?Bq|[кМГ]?Бк|IU|ME|ED|мкг|мг|АТрЕ|ATpE|АТЕ|КИЕ|КЕД|МЕ|ЕД|ТЕ|TE|АЕ|ЛЕ|ФНЕ|г|g|%)';
  const denominator='(?:\\s*[/／]\\s*(?:'+n+'\\s*)?(?:ml|мл|g|г|doza|dose|spray|actuation|доза|дозу|vial|флакон(?:е)?|h|ч|час(?:а|ов)?)(?![\\p{L}]))?';
  const atom='(?:'+n+'(?:\\s*[/／+]\\s*'+n+')*\\s*'+u+'(?![\\p{L}])'+denominator+')';
  const pattern=new RegExp(atom+'(?:\\s*[+/／]\\s*'+atom+')*','giu');
  const matches=[...text.matchAll(pattern)],out=[];
  for(let i=0;i<matches.length;i++){const m=matches[i];
   if(/[\d+/／]\s*$/.test(text.slice(0,m.index))||/^\s*[+/／]/.test(text.slice(m.index+m[0].length)))continue;
   // A trailing package mass is not a new strength of a cream/ointment.
   if(matches.some(x=>/%|mg\s*\/\s*g/i.test(x[0]))&&/^\d+(?:[.,]\d+)?\s*(?:g|г)$/i.test(m[0]))continue;
   let value=m[0];const next=matches[i+1];
   if(next&&/^\s*\(\s*$/.test(text.slice(m.index+m[0].length,next.index))&&/^\s*\)/.test(text.slice(next.index+next[0].length))){value+=' ('+next[0]+')';i++;}
   out.push(value.replace(/мкг|[µμ]g|mcg|micrograms?/gi,'mkg').replace(/мг|milligrams?/gi,'mg').replace(/мл/gi,'ml').replace(/доза|дозу/gi,'doza').replace(/г(?![\p{L}])/giu,'g').replace(/(\d)(?=(?:mg|mkg|mcg|g)(?![\p{L}]))/giu,'$1 ').replace(/\s*\+\s*/g,' + ').replace(/\s*[/／]\s*/g,'/').trim());
  }
  return [...new Set(out)].filter(v=>v.length<=200);
 }
 function strength(selected){
  const values=strengths(selected?.product?.strength||selected?.packageDetails);
  return values.length===1?values[0]:'';
 }
 function combination(value){const text=clean(value).replace(/мкг|[µμ]g|mcg|micrograms?/gi,'mkg').replace(/мг|milligrams?/gi,'mg').replace(/г(?![\p{L}])/giu,'g');return /\+|\d\s*\/\s*\d|(?:mg|mkg|g|%|IU|ME|ED|МЕ|ЕД|КЕД)\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|mkg|g|%|IU|ME|ED|МЕ|ЕД|КЕД)(?![\p{L}])/iu.test(text);}
 function options(key,selected,diagnosis=''){
  if(key==='frequency'&&Array.isArray(selected?.referenceRecord?.frequencyOptions)){const record=selected.referenceRecord;if(record.clinicalBlock||record.raw?.clinical_blocked)return [];return record.frequencyOptions.map(clean).filter(v=>v&&v.length<=200);}
  if(key==='dose'){
   const instructions=instructionChoices(selected?.referenceRecord,selected?.product);
   const value=strength(selected);
   // Concentrations (including topical %) do not specify the amount to administer.
   return [...new Set([...instructions,...(value&&(!/[%/／]/.test(value)||combination(value)&&!/%|\/(?:\d+(?:[.,]\d+)?\s*)?(?:ml|g|doza|dose|spray|actuation|h|ч|час(?:а|ов)?)(?![\p{L}])/iu.test(value))?[value]:[])])];
  }
  if(key==='route'){
   if(selected?.product?.routeUnspecified)return routes.slice();
   if(Array.isArray(selected?.product?.routeOptions)){const explicit=selected.product.routeOptions.filter(x=>routes.includes(x));if(explicit.length)return [...new Set(explicit)];}
   const form=clean(selected?.product?.form||selected?.packageDetails).toLowerCase();
   if(/ko‘z|ko'z|oftal|ophthal|глаз/.test(form)&&/quloq|otic|ушн/.test(form))return ['Ko‘zga','Quloqqa'];
   if(/intraven|vena ichiga|внутривен|в\/в/.test(form))return ['Vena ichiga'];
   if(/intramus|mushak orasiga|внутримыш|в\/м/.test(form))return ['Mushak orasiga'];
   if(/subcut|teri ostiga|подкож/.test(form))return ['Teri ostiga'];
   if(/subling|til ost|подъязы/.test(form))return ['Til ostiga'];
   if(/buccal|bukkal|буккал/.test(form))return ['Lunj shilliq qavatiga'];
   if(/oftal|ophthal|ko‘z|ko'z|glaz|глаз/.test(form))return ['Ko‘zga'];
   if(/quloq|otic|ushn|ушн|ушн/.test(form))return ['Quloqqa'];
   if(/nazal|nasal|burun|назал|назал/.test(form))return ['Burun orqali'];
   if(/ingal|inhal|nebul|ингал/.test(form))return ['Ingalatsiya orqali'];
   if(/vaginal|вагин/.test(form))return ['Vaginal'];
   if(/rektal|rectal|рект/.test(form))return ['Rektal'];
   if(/transder|plastir|krem|cream|maz\b|gel\b|surtma|мазь|крем|гель/.test(form))return ['Teriga mahalliy'];
   if(/tablet|kapsul|capsul|sirop|syrup|oral|draje|pastilka|таблет|капсул|сироп|приема внутрь|приёма внутрь/.test(form))return ['Og‘iz orqali'];
   return routes.slice();
  }
  if(key==='goal')return [...new Set([clean(diagnosis),...presets.goal].filter(v=>v&&v.length<=200))];
  return (presets[key]||[]).slice();
 }
 function forms(record){
  if(Array.isArray(record?.sourceVariants)){const variants=[record,...record.sourceVariants].flatMap(r=>forms({...r,sourceVariants:undefined}));return variants.filter((v,i,a)=>a.findIndex(x=>x.form===v.form&&x.strength===v.strength)===i);}
  if(Array.isArray(record?.productOptions))return record.productOptions.filter(p=>p&&typeof p.form==='string'&&typeof p.strength==='string'&&p.form.length<=200&&p.strength.length<=200).map(p=>({...p,label:p.form+(p.strength?' · '+p.strength:'')}));
  const text=clean(record?.form||record?.raw?.shakl),dosage=clean(record?.dosage);
  if(!text)return [];
  const names=[['Tabletka',/(?:\b(?:tablet\w*|tab|tabl)\b|таблет)/i],['Kapsula',/(?:\b(?:capsul\w*|kapsul\w*)\b|капсул)/i],['Sirop',/syrup|sirop|сироп/i],['Suspenziya',/suspension|suspenziya|суспенз/i],['Krem',/cream|krem|крем/i],['Maz',/ointment|\bmaz\b|мазь/i],['Gel',/\bgel\b|гель/i],['Pastilka',/пастил|lozenge/i],['Lotyon',/lotion|lotyon|лосьон/i],['Burun spreyi',/nazal|nasal|burun|назал/i],['Ingalatsiya',/inhal|ingal|nebul|ингал|небул|twisthaler|\bMDI\b/i],['Ko‘z tomchisi',/oftal|ophthal|glaz|глаз|ko‘z|ko'z/i],['Quloq tomchisi',/quloq|otic|ushn|ушн/i],['Shamcha',/supposit|shamcha|суппоз|свечи/i],['Inyeksiya',/inject|inyeksi|in.eksi|инъек|иньек/i]];
  // Generic registered forms apply only when a more specific route/form did not match.
  const generalNames=[['Eritma',/раствор|solution|eritma/i],['Kukun',/порош|powder|kukun/i],['Liofilizat',/лиоф|lyophil/i],['Granula',/гранул|granul/i],['Tomchi',/капли|drops|tomchi/i],['Sprey',/спрей|spray|sprey/i],['Aerozol',/аэроз|aerosol/i],['Emulsiya',/эмуль|emulsi/i],['Pasta',/паста|paste/i],['Moy',/масло|oil/i],['Nastoyka',/настойка|tincture/i],['Ekstrakt',/экстракт|extract/i],['Dorivor yig‘ma',/сбор|yigma/i],['Tibbiy gaz',/газ медицин|medical gas/i],['Draje',/драже/i],['Liniment',/линимент/i],['Plastir',/пластырь|plaster/i],['Dorivor o‘simlik xomashyosi',/лекарственное растительное сырь[её]/i],['Shampun',/шампунь/i],['Tirnoq uchun lak',/лак для ногтей/i],['Implantat',/имплантат/i],['Pessariy',/пессари/i],['Vaginal halqa',/кольцо вагиналь/i],['Og‘izda dispersiyalanuvchi plyonka',/пленки диспергируемые в полости рта/i],['Balzam',/бальзам/i],['Vazelin',/вазелин/i],['Kataplazma',/катаплазма/i],['Suyuqlik',/жидкость/i],['Mikrosfera',/микросфер/i]];
  const result=[];
  // A semicolon is an explicit alternative in the source, e.g. tablet; syrup.
  let inherited=null;
  const main=text.split(/в\s+комплекте|комплект\s+с|в\s+компл\./i)[0];
  for(const part of main.split(';').map(clean).filter(Boolean)){
   let matched=names.filter(([,pattern])=>pattern.test(part));
   if(!matched.length)matched=generalNames.filter(([,pattern])=>pattern.test(part)).slice(0,1);
   if(!matched.length&&inherited&&strengths(part).length)matched=inherited.names;
   const has=n=>matched.some(([name])=>name===n);
   if(has('Kapsula')&&has('Ingalatsiya'))matched=[['Ingalatsiya uchun kapsula',/./]];
   else if(has('Kapsula')&&has('Tabletka')&&/мини-таблет/i.test(part))matched=[['Kapsula (mini-tabletkalar)',/./]];
   else if(has('Ko‘z tomchisi')&&has('Burun spreyi'))matched=[['Ko‘z va burun tomchisi',/./]];
   else if(has('Ko‘z tomchisi')&&has('Suspenziya'))matched=[['Ko‘z tomchisi (suspenziya)',/./]];
   else if(has('Burun spreyi')&&has('Suspenziya'))matched=[['Burun spreyi (suspenziya)',/./]];
   else if(has('Ingalatsiya')&&has('Suspenziya'))matched=[['Ingalatsiya uchun suspenziya',/./]];
   else if(has('Ingalatsiya')&&has('Inyeksiya'))matched=[['Inyeksiya va ingalatsiya uchun eritma',/./]];
   if(has('Ko‘z tomchisi')&&has('Quloq tomchisi'))matched=[['Ko‘z va quloq tomchisi',/./]];
   else if(has('Burun spreyi')&&has('Maz'))matched=[['Burun mazi',/./]];
   else if(has('Ko‘z tomchisi')&&has('Gel'))matched=[['Ko‘z geli',/./]];
   else if(has('Inyeksiya')&&has('Suspenziya'))matched=[['Inyeksiya uchun suspenziya',/./]];
   // Preserve the manufactured powder/lyophilisate rather than its reconstituted solution.
   if(/порош|лиоф/i.test(part)&&/для приготовления/i.test(part))matched=[[/лиоф/i.test(part)?'Liofilizat':'Kukun',/./]];
   if(/концентрат|concentrate|konsentrat/i.test(part))matched=[['Konsentrat',/./]];
   if(matched.some(([n])=>n==='Ko‘z tomchisi')&&matched.some(([n])=>n==='Maz'))matched=[['Ko‘z mazi',/./]];
   const ownModifier=(part.match(/\b(?:xr|sr|cr|er|dr|mr|xl|retard|modified|extended|delayed|prolonged|dispersible|chewable|sublingual|orodispersible|effervescent)\b|пролонгированного действия|кишечнорастворим\p{L}*|жевательн\p{L}*|для рассасывания/giu)||[]).join(' ');
   const modifier=ownModifier||(matched===inherited?.names?inherited.modifier:'');
   if(matched.length>1&&!matched.every(([name])=>['Krem','Maz','Lotyon'].includes(name)))continue;
   const strengthText=strength({product:{strength:dosage||part},inn:record?.inn});
   let declared=Array.isArray(record.strengthOptions)?record.strengthOptions.flatMap(strengths):strengths(dosage||part);
   // A tube/jar/herbal pack mass is not an active concentration, even when no % is printed.
   const bulk=matched.some(([name])=>['Krem','Maz','Gel','Pasta','Balzam','Liniment','Shampun','Vazelin','Dorivor o‘simlik xomashyosi','Dorivor yig‘ma'].includes(name))||matched.some(([name])=>['Kukun','Granula'].includes(name))&&/саше|пакет|банка|контейнер/i.test(part);
   if(bulk)declared=declared.filter(v=>!/^\d+(?:[.,]\d+)?\s*g$/i.test(v));
   const sourceContext=matched===inherited?.names?inherited.context:part;
   if(matched.length)inherited={names:matched,modifier,context:sourceContext};
   if(matched.length){for(const [name]of matched)for(const quantity of declared.length?declared:[bulk?'':strengthText]){
    const context=name==='Shamcha'?(/vaginal/i.test(part)?'Vaginal ': /rektal|rectal/i.test(part)?'Rektal ':''):'';
    const injection=name==='Inyeksiya'?(part.match(/intravenous|intramuscular|subcutaneous|vena ichiga|mushak orasiga|teri ostiga/i)?.[0]||''):'';
    const form=[context+name,modifier,injection].filter(Boolean).join(' ');
    const routeOptions=routesFromSource(sourceContext),routeUnspecified=/инъек|иньек/i.test(sourceContext)&&/ингал/i.test(sourceContext);
    result.push({form,strength:quantity,label:form+(quantity?' · '+quantity:''),...(routeOptions.length?{routeOptions}:{}),...(routeUnspecified?{routeUnspecified:true}:{})});
   }}
   // Unknown form descriptors remain in the source text, never in the form selector.
  }
  return result.filter((v,i,a)=>v.label.length<=200&&a.findIndex(x=>x.label===v.label)===i);
 }
 function routesFromSource(text){
  const found=[];for(const [route,pattern]of [
   ['Vena ichiga',/внутривенн|в\/в|intraven/i],['Mushak orasiga',/внутримыш|в\/м|intramus/i],['Teri ostiga',/подкож|subcut/i],['Teri ichiga',/внутрикож|intraderm/i],
   ['Og‘iz orqali',/для приема внутрь|для приёма внутрь|перорал|oral/i],['Til ostiga',/подъязыч|сублингвал|subling/i],['Burun orqali',/назаль|nasal/i],['Ko‘zga',/глазн|офтальм|ophthal/i],['Quloqqa',/ушн|otic/i],['Ingalatsiya orqali',/ингал|inhal/i],['Rektal',/ректаль|rectal/i],['Vaginal',/вагиналь|vaginal/i],['Teriga mahalliy',/наружн|cutaneous|трансдерм/i]
  ])if(pattern.test(text))found.push(route);return found;
 }
 function instructionChoices(record,product){
  if(!record||record.clinicalBlock||record.raw?.clinical_blocked)return [];
  const text=clean(record.uzbek?.dosage_instructions||record.raw?.dozalash||record.raw?.dosage_instructions);
  const rows=Array.isArray(record.dosageOptions)?record.dosageOptions:text.split(/;|\n/);
  const kind=options('route',{product})[0];
  return [...new Set(rows.map(clean).filter(value=>{
   if(!value||value.length>200||/[<>][a-z]/i.test(value))return false;
   if(kind==='Teriga mahalliy'&&!/qatlam|surt|nanos|skin|apply|teri|shilliq qavat/i.test(value))return false;
   if(kind==='Burun orqali'&&!/burun|purka|spray|nostril|nazal/i.test(value))return false;
   return true;
  }))].slice(0,12);
 }
 return Object.freeze({options,strength,strengths,combination,forms,instructionChoices});
});
