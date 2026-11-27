(function(root,factory){
 var api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else {root.UZMEDDrugIdentitySafety=api;root.UZMEDDrugIdentitySafetyFull=api;}
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 function conflict(key,record){
  record=record||{};
  if(record.clinical_blocked&&record.identity_conflict)return record.identity_conflict;
  var label=String(key||'')+' '+String(record.name||'')+' '+String(record.inn||'');
  label=label.toLowerCase();
  if(/avamys|авамис/.test(label)&&/mometazon|mometasone|мометазон|flutikazon propionat|fluticasone propionate/.test(label))return {
   code:'brand_ingredient_conflict',reason:'Avamys flutikazon furoatga tegishli. Ushbu kartadagi boshqa faol modda va dozani shu brend uchun qo‘llash bloklandi.',source:'https://www.ema.europa.eu/en/medicines/human/EPAR/avamys'};
  if(/duaklir|дуаклир/.test(label)&&/salbutamol|сальбутамол/.test(label)&&/ipratrop|ипратроп/.test(label))return {
   code:'brand_ingredient_conflict',reason:'Duaklir aklidinium va formoterolga tegishli. Salbutamol–ipratropiy kartasidan shu brend uchun doza olish bloklandi.',source:'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=2eba3089-28b4-4190-9fba-2511246cfd16&type=display'};
  return null;
 }
 function quarantine(database){
  var out={};
  Object.keys(database||{}).forEach(function(key){
   var record=database[key],issue=conflict(key,record);
   if(!issue){out[key]=record;return;}
   var safe={};Object.keys(record||{}).forEach(function(k){safe[k]=record[k];});
   ['dozalash','shakl','korsatmalar','qarshi','yon','talsiruvi','yosh','guruh','atx','dose','dosage'].forEach(function(k){safe[k]=null;});
   safe.clinical_blocked=true;safe.identity_conflict=issue;
   safe.eslatma=issue.reason+' Manba: '+issue.source+' Aniq karta klinik tekshirilmaguncha doza ko‘rsatilmaydi.';
   out[key]=safe;
  });
  return out;
 }
 function marketConflict(brand,ingredient){
  var b=String(brand||'').toLowerCase().trim(),i=String(ingredient||'').toLowerCase().trim();
  if((/дексаметазон|dexamethason|deksametazon|^(?:атнесон|atneson)$/.test(b)&&/алатрофлоксацин|alatrofloxacin/.test(i))||
    (/^(амоксициллин|amoxicillin|amoksitsillin)$/.test(b)&&/ампициллин|ampicillin|ampitsillin/.test(i)))return {code:'catalog_name_ingredient_conflict',reason:'Katalogdagi dori nomi va faol modda bir-biriga mos emas. Tarkib, shakl va narx ushbu yozuvdan tasdiqlanmaydi.'};
  return null;
 }
 function quarantineMarket(rows){
  return (rows||[]).map(function(row){
   var issue=marketConflict(row[0],row[1]);if(!issue)return row;
   var safe=row.slice();safe[1]='Tarkib tekshirilmoqda';safe[3]='Preparat shakli tasdiqlanmagan';safe[4]='';safe[5]=null;
   safe.clinical_blocked=true;safe.identity_conflict=issue;return safe;
  });
 }
 return {conflict:conflict,quarantine:quarantine,marketConflict:marketConflict,quarantineMarket:quarantineMarket};
});
