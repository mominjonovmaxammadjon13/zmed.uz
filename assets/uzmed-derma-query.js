/* Shared reference-image vocabulary and bounded typo/context resolver. No diagnosis. */
(function(root,factory){
 var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UzmedDermaQuery=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 // The existing Derma search registry, shared by backend, bot and browser.
 var topics=[
  {key:'psoriaz',aliases:['psoriaz','psoriasis','psoriazis']},
  {key:'atopik dermatit',aliases:['atopik','atopic','neyrodermit']},
  {key:'kontakt dermatit',aliases:['kontakt dermatit','kontaktli dermatit','contact dermatitis','allergik kontakt dermatit','allergic contact dermatitis','irritant contact dermatitis']},
  {key:'allergik dermatit',aliases:['allergik dermatit']},

  {key:'akne',aliases:['akne','acne','husnbuzar','ugri']},
  {key:'vitiligo',aliases:['vitiligo','oq doglar']},
  {key:'urtikariya',aliases:['urtikariya','urticaria','eshakemi','krapivnitsa']},
  {key:'qichima',aliases:['qichima','chesotka','scabies']},
  {key:'ekzema',aliases:['ekzema','eczema']},
  // Eczema herpeticum is not a generic eczema reference-image request.
  {key:'eczema herpeticum',aliases:['eczema herpeticum','ekzema herpeticum','ekzema herpetikum','gerpetik ekzema']},
  {key:'melanoma',aliases:['melanoma']}
 ];
 var letters={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',қ:'q',ғ:'g',ҳ:'h',ў:'o'};
 function norm(v){return String(v||'').normalize('NFKC').toLowerCase().replace(/[а-яёқғҳў]/g,function(x){return letters[x]||x;}).replace(/[’ʻʼ‘'`]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
 var imageWords='(?:rasm(?:i|ini|ni|lar(?:i|ini|ni)?)?|surat(?:i|ini|ni|lar(?:i|ini|ni)?)?|foto(?:si|sini|lar(?:i|ini)?)?|tasvir(?:i|ini|ni|lar(?:i|ini)?)?|images?|photos?|kartinka|izobrazhenie)';
 var imageRE=new RegExp('\\b'+imageWords+'\\b');
 var stripRE=new RegExp('\\b'+imageWords+'\\b','g');
 var nonDerma=/\b(?:ekg|ecg|mri|mrt|rentgen|xray|ultratovush|ultrasound)\b/;
 function isImageQuestion(q){
  var s=norm(q);if(!s||s.length>320||!imageRE.test(s)||nonDerma.test(s))return false;
  // A request to analyse an uploaded picture stays with the existing file agent.
  if(/\b(?:tahlil|analiz|tekshir|aniqla)\w*\b/.test(s)&&!/\b(?:korsat\w*|bormi|top\w*|qidir\w*|yubor\w*)\b/.test(s))return false;
  return true;
 }
 function cleanQuery(q){
  return norm(q).replace(stripRE,' ').replace(/\b(?:menga|iltimos|uzmed|atlas|derma|kasallik|kasalligi|teri|teridagi|ning|ni|uchun|haqida|korsat\w*|yubor\w*|ber\w*|topib|top|qidir\w*|qani|kerak|bormi|bor|mavjud|mi|shu|shuni|buni|ham|yana|uning|show|send)\b/g,' ').replace(/\s+/g,' ').trim().slice(0,75);
 }
 function distance(a,b){
  var p=Array.from({length:b.length+1},function(_,i){return i;});
  for(var i=1;i<=a.length;i++){var c=[i];for(var j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}
  return p[b.length];
 }
 function skeleton(s){return s.replace(/[aeiouy]/g,'');}
 function resolveTopic(q){
  var s=norm(q),words=s.split(' '),matches=[];
  topics.forEach(function(topic){var score=0;
   // Ignore the generic word only inside the specific condition's phrase;
   // a separately named eczema or another disease remains ambiguous.
   var aliasWords=topic.key==='ekzema'?s.replace(/\b(?:eczema|ekzema)\s+herpeti(?:cum|kum)\b|\bgerpetik\s+ekzema\b/g,' ').trim().split(/\s+/):words;
   topic.aliases.forEach(function(alias){
    var a=norm(alias);
    if(a.includes(' ')){if((' '+s+' ').includes(' '+a+' '))score=1;return;}
    aliasWords.forEach(function(w){
     if(w===a||new RegExp('^'+a+'(?:ni|ning|ga|dan|da)$').test(w)){score=1;return;}
     if(w.length<5||a.length<5||w.length>20)return;
     var similarity=1-distance(w,a)/Math.max(w.length,a.length);
     var sw=skeleton(w),sa=skeleton(a);
     if(sw.length>=3&&sw===sa&&Math.abs(w.length-a.length)<=3)similarity=Math.max(similarity,.94);
     if(similarity>=.78)score=Math.max(score,similarity);
    });
   });if(score)matches.push({query:topic.key,score:score});
  });
  matches.sort(function(a,b){return b.score-a.score;});
  if(!matches.length)return {kind:'none',query:''};
  if(matches[1]&&matches[0].score-matches[1].score<.12)return {kind:'ambiguous',query:''};
  return {kind:'match',query:matches[0].query};
 }
 function rowText(row){return String(row.content||((row.parts||[]).map(function(p){return p.text||'';}).join(' '))).slice(0,4000);}
 function resolveRequest(text,options){
  options=options||{};if(!isImageQuestion(text))return {handled:false,query:''};
  var topic=resolveTopic(text);if(topic.kind==='match')return {handled:true,query:topic.query,from:'current'};
  if(topic.kind==='ambiguous')return {handled:true,query:'',reason:'ambiguous'};
  var cleaned=cleanQuery(text);
  if(cleaned)return {handled:true,query:cleaned,from:'current'};
  var rows=(Array.isArray(options.history)?options.history:[]).slice(-8);
  for(var i=rows.length-1;i>=0;i--){
   if(rows[i].role!=='user')continue;
   var previous=rowText(rows[i]);if(!cleanQuery(previous))continue;
   if(nonDerma.test(norm(previous)))return {handled:false,query:''};
   var found=resolveTopic(previous);
   if(found.kind==='match')return {handled:true,query:found.query,from:'history'};
   // Do not borrow an older disease after the user switched subjects.
   return {handled:true,query:'',reason:'unknown_subject'};
  }
  var hint=options.subject&&resolveTopic(options.subject);
  if(hint&&hint.kind==='match')return {handled:true,query:hint.query,from:'subject'};
  return {handled:true,query:'',reason:'missing_subject'};
 }
 return {topics:topics,norm:norm,cleanQuery:cleanQuery,isImageQuestion:isImageQuestion,resolveTopic:resolveTopic,resolveRequest:resolveRequest};
});
