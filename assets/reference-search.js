(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.UZMED_REFERENCE_SEARCH=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var CYR={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'i','ь':'','э':'e','ю':'yu','я':'ya','ў':'o','ғ':'g','қ':'q','ҳ':'h'};
var WORDS={
essensial:'essential',essentsial:'essential',gipertoniya:'hypertension',gipertenziya:'hypertension',gipertenzia:'hypertension',birlamchi:'primary',pervichnaya:'primary',
diabet:'diabetes',qandli:'',qantli:'',mellitus:'',tur:'type',astma:'asthma',pnevmoniya:'pneumonia',pnevmonia:'pneumonia',gipotireoz:'hypothyroidism',migren:'migraine',
temir:'iron',tanqisligi:'deficiency',kamqonligi:'anaemia',anemiyasi:'anaemia',anemiya:'anaemia',anemia:'anaemia',jelezodefitsitnaya:'iron deficiency',
bilan:'with',bez:'without',asoratsiz:'without complications',asoratli:'with complications',aniqlanmagan:'unspecified',aniqlangan:'specified',boshqa:'other',allergik:'allergic',allergicheskiy:'allergic',allergicheski:'allergic',rinit:'rhinitis',otkir:'acute',ostriy:'acute',ostri:'acute',appenditsit:'appendicitis',appenditsita:'appendicitis',pankreatit:'pancreatitis',epilepsiya:'epilepsy',bilak:'forearm',sinishi:'fracture',perelom:'fracture',predplechya:'forearm',
amoxicillin:'amoksitsillin',amoxycillin:'amoksitsillin',amoxicilin:'amoksitsillin',amoksisillin:'amoksitsillin',amoksitsilin:'amoksitsillin',clavulanic:'klavulan',clavulanate:'klavulan',klavulanat:'klavulan',acid:'kislota',kislotasi:'kislota',
parasetamol:'paratsetamol',paracetamol:'paratsetamol',acetaminophen:'paratsetamol',warfarin:'varfarin',rivaroxaban:'rivaroksaban',apixaban:'apiksaban',edoxaban:'edoksaban',amlodipine:'amlodipin',omeprazole:'omeprazol',pantoprazole:'pantoprazol',
loratadine:'loratadin',cetirizine:'setirizin',tsetirizin:'setirizin',budesonide:'budesonid',budezonid:'budesonid',dexamethasone:'deksametazon',dexametazon:'deksametazon',inhalatsiya:'inhalation',ingalyatsiya:'inhalation',inhaled:'inhalation',inhalator:'inhalation',systemic:'systemic',tizimli:'systemic',antitrombotsitar:'antiplatelet',
nitroglycerin:'nitroglitserin',nitroglycerine:'nitroglitserin',levothyroxine:'levotiroksin',ceftriaxone:'seftriakson',tseftriakson:'seftriakson',seftraksion:'seftriakson',seftrakson:'seftriakson',reosorblakt:'reosorbilakt',clarithromycin:'klaritromitsin',azithromycin:'azitromitsin',ciprofloxacin:'siprofloksatsin',doxycycline:'doksitsiklin',fluconazole:'flukonazol',spironolactone:'spironolakton',metoprolol:'metoprolol',enalapril:'enalapril'
};
var STOP=new Set(['of','the','and','or','in','elsewhere','classified','due','to']);
// WHO B08.4 includes hand, foot and mouth disease; these are search aliases only.
var MKB_ALIASES={'B08.4':['HFMD','Hand, foot and mouth disease','Qo‘l-oyoq-og‘iz kasalligi','Qo‘l-oyoq-og‘iz sindromi','Қўл-оёқ-оғиз касаллиги','Болезнь рук ног и рта']};
function normalize(value){
var s=String(value==null?'':value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[а-яёўғқҳ]/g,function(c){return CYR[c]||c;}).replace(/[’‘ʻʼ\x27\x60]/g,'').replace(/[^a-z0-9.]+/g,' ').trim();
s=s.replace(/\binsulinga bogliq bolmagan\b/g,'type 2').replace(/\binsulinga bogliq\b/g,'type 1').replace(/\bnon insulin dependent\b/g,'type 2').replace(/\binsulin dependent\b/g,'type 1');
s=s.replace(/\bsiydik yollari? infeksiyasi\b/g,'urinary tract infection').replace(/\bbilak suyagi sinishi\b/g,'forearm fracture').replace(/\bbronxial astma\b/g,'asthma').replace(/\bbronxial ?naya astma\b/g,'asthma').replace(/\bbronkhial asthma\b/g,'asthma');
return s.split(/\s+/).map(function(w){return Object.prototype.hasOwnProperty.call(WORDS,w)?WORDS[w]:w;}).filter(Boolean).join(' ').replace(/\barterial hypertension\b/g,'hypertension');
}
function tokens(s){return Array.from(new Set(normalize(s).split(/\s+/).filter(function(x){return x&&!STOP.has(x);}))).sort();}
function codeKey(value){return String(value||'').trim().toUpperCase().replace(/\s/g,'');}
function aliasCompatible(title,alias){var n=normalize(title),a=normalize(alias),type=function(s){var m=s.match(/\btype\s+([0-9]+)\b|\b([0-9]+)\s+type\b/);return m&&(m[1]||m[2]);},nt=type(n),at=type(a);if(nt&&at&&nt!==at)return false;if((n.match(/\b(?:with|without)\b/g)||[]).length!==1||(a.match(/\b(?:with|without)\b/g)||[]).length!==1)return true;var markers=function(s){var out=[],re=/\b(without|with)\s+([a-z0-9 ]+)/g,m;while((m=re.exec(s)))out.push({sign:m[1],object:m[2].trim().split(/\s+/).pop()});return out;},ns=markers(n),as=markers(a);if(ns.length===1&&as.length===1&&ns[0].sign!==as[0].sign&&ns[0].object===as[0].object)return false;return true;}
function aliasValues(row){var out=[];function add(v){if(typeof v==='string'&&v.trim()){if(!out.includes(v))out.push(v);}else if(Array.isArray(v))v.forEach(add);}row.slice(1).forEach(add);add(row.localAliases);add(MKB_ALIASES[codeKey(row[0])]);return out;}
function buildMkb(rows,reference){
if(!reference||reference.system!=='WHO ICD-10'||reference.version!=='2019'||!reference.codes)throw new Error('WHO ICD-10 2019 ma’lumotnomasi yuklanmadi.');
var byCode=new Map(),excluded=[],variants=[];
(rows||[]).forEach(function(row){if(!Array.isArray(row))return;var code=codeKey(row[0]);var saved=Array.isArray(row[4])?row[4]:(row.modifierAliases||[]);saved.forEach(function(v){if(v&&typeof v.code==='string'&&v.base===code&&v.code.slice(0,-1)===code&&/[+*†]$/.test(v.code)&&reference.codes[code]&&!variants.some(function(x){return x.code===v.code;}))variants.push({code:v.code,base:code,aliases:aliasValues([v.code,v.aliases||[]])});});if(reference.codes[code]){if(!byCode.has(code))byCode.set(code,[]);byCode.get(code).push(row);}
else if(/[+*†]$/.test(code)&&reference.codes[code.slice(0,-1)])variants.push({code:code,base:code.slice(0,-1),aliases:aliasValues(row)});else excluded.push({code:code,aliases:aliasValues(row)});});
var result=Object.keys(reference.codes).sort().map(function(code){var record=reference.codes[code],aliases=[];(byCode.get(code)||[]).forEach(function(row){aliasValues(row).forEach(function(x){if(x!==record.title&&!aliases.includes(x))aliases.push(x);});});
var row=[code,record.title,''];row.canonicalTitle=record.title;row.localAliases=aliases.filter(function(alias){return aliasCompatible(record.title,alias);});row.excludedLocalAliases=aliases.filter(function(alias){return !aliasCompatible(record.title,alias);});row.aliasesVerified=false;row.reference=reference.system+' '+reference.version;row.category=!!record.category;
row.modifierAliases=variants.filter(function(x){return x.base===code;});return row;});
Object.defineProperty(result,'referenceAudit',{value:{version:reference.version,officialCodes:result.length,excludedRows:excluded,localModifierRows:variants,localAliasesVerified:false},enumerable:false});
return result;
}
var INDEX=new WeakMap();
function indexRows(rows){if(INDEX.has(rows))return INDEX.get(rows);var index=rows.map(function(row){var texts=[row[1]].concat(aliasValues(row).filter(function(x){return x!==row[1]&&aliasCompatible(row[1],x);})).filter(function(x){return typeof x==='string'&&x;});return {row:row,code:codeKey(row[0]),texts:texts.map(tokens),category:row.category!=null?row.category:/^[A-Z]\d{2}$/.test(row[0])};});INDEX.set(rows,index);return index;}
function distance(a,b,bound){
if(Math.abs(a.length-b.length)>bound)return bound+1;var prev=Array.from({length:b.length+1},function(_,i){return i;});
for(var i=1;i<=a.length;i++){var curr=[i],min=i;for(var j=1;j<=b.length;j++){curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));min=Math.min(min,curr[j]);}if(min>bound)return bound+1;prev=curr;}return prev[b.length];
}
function tokenDistance(q,words){if(words.includes(q))return 0;if(q.length>=3&&words.some(function(w){return w.startsWith(q);}))return 1;if(/^\d+$/.test(q)||q.length<5)return 99;var bound=q.length>=9?2:1,best=99;words.forEach(function(w){if(w.length>=4){var d=distance(q,w,bound);if(d<=bound)best=Math.min(best,d);}});return best;}
function wordIndex(index){if(index.wordIndex)return index.wordIndex;var map=new Map();index.forEach(function(item){item.texts.forEach(function(words){words.forEach(function(w){if(!map.has(w))map.set(w,new Set());map.get(w).add(item);});});});Object.defineProperty(index,'wordIndex',{value:map});return map;}
function candidates(index,qt){var map=wordIndex(index),sets=qt.map(function(q){if(map.has(q))return map.get(q);var hits=new Set();if(q.length>=3)map.forEach(function(items,w){if(w.startsWith(q))items.forEach(function(item){hits.add(item);});});if(!hits.size&&q.length>=5&&!/^\d+$/.test(q)){var bound=q.length>=9?2:1;map.forEach(function(items,w){if(w.length>=4&&distance(q,w,bound)<=bound)items.forEach(function(item){hits.add(item);});});}return hits;}).sort(function(a,b){return a.size-b.size;});return Array.from(sets[0]||[]).filter(function(item){return sets.every(function(set){return set.has(item);});});}
function rank(index,q,limit){
if(String(q).length>180)return [];var qt=tokens(q);if(!qt.length||qt.length>16)return [];var ranked=[];candidates(index,qt).forEach(function(item){var best=-Infinity;item.texts.forEach(function(words){var ds=qt.map(function(t){return tokenDistance(t,words);});if(ds.some(function(d){return d===99;}))return;var extras=words.filter(function(w){return !qt.includes(w)&&!['other','specified','unspecified','organism','not','essential','primary'].includes(w);}).length,exactTitle=words.length===qt.length&&ds.every(function(d){return d===0;}),score=100*qt.length-18*ds.reduce(function(a,b){return a+b;},0)-5*extras+(item.category?18:0)+(exactTitle?26:0);best=Math.max(best,score);});if(best!==-Infinity)ranked.push({item:item,score:best});});
return ranked.sort(function(a,b){return b.score-a.score||a.item.code.localeCompare(b.item.code);}).slice(0,Math.min(Math.max(Math.floor(Number(limit)||8),1),index.length)).map(function(x){return x.item.row;});
}
function searchMkb(rows,q,limit){
if(!Array.isArray(rows)||!String(q||'').trim())return [];var key=codeKey(q),idx=indexRows(rows);
if(/^[A-Z]\d{2}(?:\.\d{1,2})?[+*†]?$/.test(key)||/^[A-Z]\d{3,4}$/.test(key)){
var compact=key.replace('.',''),hit=idx.find(function(x){return x.code.replace('.','')===compact;});if(hit)return [hit.row];
var variant=idx.find(function(x){return (x.row.modifierAliases||[]).some(function(v){return v.code===key;});});if(variant){var copy=variant.row.slice();Object.assign(copy,variant.row);copy.requestedCode=key;copy.modifierVerified=false;return [copy];}return [];}
if(/^[A-Z]\d?$/.test(key))return idx.filter(function(x){return x.code.startsWith(key);}).slice(0,Number(limit)||8).map(function(x){return x.row;});
return rank(idx,q,limit);
}
var ATC_ADDITIONS={'amoksitsillin klavulan kislotasi':'J01CR02','salbutamol inhalatsiya':'R03AC02','budesonid inhalatsiya':'R03BA02','loratadin':'R06AX13','setirizin':'R06AE07','deksametazon tizimli':'H02AB02'};
var ATC_CACHE=new WeakMap();
function atcIndex(atc){if(ATC_CACHE.has(atc))return ATC_CACHE.get(atc);var all=Object.assign({},atc,ATC_ADDITIONS),index=Object.keys(all).map(function(drug){var code=String(all[drug]),row={drug:drug,code:code},words=tokens(drug);if(/^B01AC/.test(code))words.push('antiplatelet');return {row:row,code:code,category:false,texts:[words]};});ATC_CACHE.set(atc,index);return index;}
function searchATC(atc,q,limit){if(!atc||!String(q||'').trim())return [];var index=atcIndex(atc),key=codeKey(q);if(/^[A-Z]\d{2}[A-Z]{0,2}\d{0,2}$/.test(key))return index.filter(function(x){return x.code===key||x.code.startsWith(key);}).slice(0,Number(limit)||8).map(function(x){return x.row;});return rank(index,q,limit);}
return {normalize:normalize,buildMkb:buildMkb,searchMkb:searchMkb,searchATC:searchATC,referenceVersion:'WHO ICD-10 2019',atcReferenceVersion:'WHO ATC/DDD 2026',atcReferenceSource:'https://atcddd.fhi.no/atc_ddd_index/'};
});
