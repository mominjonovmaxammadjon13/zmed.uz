/* Reviewed replacements for mixed ingredient/brand rows. Never unlock an unreviewed conflict. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QabulReviewedMedicines=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const nasonex='https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=13696a8b-366a-4a5e-adea-d5b7bff9e46f';
 const elosalic='https://vapris.vvkt.lt/vvkt-web/public/medications/view/16368?lang=en';
 const records={
  nasal:{name:'Mometazon furoat — Nasonex burun spreyi',inn:'mometazon furoat',form:'Dozalangan burun spreyi',dosage:'50 mkg/doza',url:nasonex,
   dosageOptions:['12 yoshdan boshlab: har bir burun teshigiga 2 purkash, kuniga 1 marta','2–11 yosh: har bir burun teshigiga 1 purkash, kuniga 1 marta; katta odam nazoratida'],
   warnings:'2 yoshgacha qo‘llanmaydi. Faqat burunga; ko‘z va og‘izga purkamang. Bolalarda o‘sish sekinlashishi mumkin; eng qisqa zarur muddat. Belgilar 7 kunda yaxshilanmasa qayta baholang. Barcha cheklovlar asl yorliqda.'},
  topical:{name:'Mometazon furoat + salisilat kislotasi — maz',inn:'mometazon furoat + salisilat kislotasi',form:'Maz',dosage:'1 mg/g + 50 mg/g',url:elosalic,
   dosageOptions:['Yupqa qatlam — 12 yoshdan boshlab, shifokor belgilagan tartibda'],
   warnings:'Psoriaz, ayniqsa kuchli qipiqlanish uchun 12 yoshdan boshlab qo‘llanadi. Ko‘z va shilliq qavatga tekkizmang. Infeksiya, yuzdagi yallig‘lanish va homiladorlikning oxirgi trimestri bo‘yicha cheklovlarni asl yo‘riqnomadan tekshiring. Belosalic boshqa tarkibli preparat.'}
 };
 function resolve(row){
  if(/^(?:amlessa|амлесса)[®™\s]*$/i.test(String(row?.name||'').trim())&&/krka/i.test(row.manufacturer||''))return {...row,
   inn:'perindopril erbumin + amlodipin',form:'Tabletka',dosage:'',strengthOptions:['4 mg/5 mg','4 mg/10 mg','8 mg/5 mg','8 mg/10 mg'],
   reviewedReference:true,sourceVersion:'krka-uz-reviewed-20261108',source:'KRKA O‘zbekiston',url:'https://www.krka.uz/ru/produkciya/recepturnye-preparaty/amlessa-tabletki-4-mg-10-mg-blistery/',
   raw:{name:row.name,inn:'perindopril erbumin + amlodipin'},uzbek:{special_instructions:'Perindopril erbumin va amlodipin kombinatsiyasi. Kuchlar ishlab chiqaruvchining O‘zbekiston sahifasidan; boshqa tuz va Co-Amlessa bilan almashtirmang.'}};
  const kind=['local:mometazon','local:mometazon furoat'].includes(row?.key)?'nasal':row?.key==='local:mometazon + salisilat kislotasi'?'topical':'';
  if(!kind)return row;
  const r=records[kind];
  return {...r,key:'reviewed:'+kind,source:'Rasmiy yo‘riqnoma',sourceVersion:'reviewed-20261108',referenceScope:'exact_reference_product',reviewedReference:true,originalKey:row.key,
   uzbek:{dosage_instructions:r.dosageOptions.join('; '),special_instructions:r.warnings},raw:{name:r.name,inn:r.inn},dosageOptions:r.dosageOptions.slice()};
 }
 return Object.freeze({resolve});
});
