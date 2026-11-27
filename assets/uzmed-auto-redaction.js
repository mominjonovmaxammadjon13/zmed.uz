/* On-device OCR and irreversible pixel masks. No document upload or persistent text cache. */
(function(W){'use strict';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const patient=/^(?:fio|фио|фамилия|имя|отчество|пациент\p{L}*|больно[йя]|заказчик|patient|surname|firstname|fullname|familiya\p{L}*|ism\p{L}*|bemor\p{L}*)$/u;
const stop=/^(?:дата|рождения|возраст|пол|date|birth|age|sex|gender|yosh\p{L}*|jins\p{L}*|sana|тугилган|tugilgan|результат|result|референс|reference|норма|norma|анализ|analysis|гемоглобин|hemoglobin|глюкоза|glucose|hgb|hb|алт|аст|alt|ast|wbc|rbc|plt)$/u;
const personal=/^(?:тел\p{L}*|моб\p{L}*|tel|telefon\p{L}*|phone|mobil\p{L}*|email|почта|адрес|address|manzil|pasport|passport|паспорт)$/u;
const isPatient=s=>patient.test(norm(s))||/^[фf][иi][оo0]$/u.test(norm(s));
const isBirth=s=>/^(?:др|дp|dob|birth|birthdate|dateofbirth|рождения|датарождения|туғилган|туғилгансана|туғилгансанаси|тугилган|тугилгансана|тугилгансанаси|tugilgan|tugilgansana|tugilgansanasi)$/u.test(norm(s));
const isIdentifier=s=>/^(?:id|ид|idпациента|идпациента|patientid|bemorid|кодпациента|серияпаспорта|passport|pasport|паспорт|pinfl|жшшир|jshshir)$/u.test(norm(s));
const readBox=w=>w.readBox||w.bbox;
const labName=/^(?:альбумин|билирубин|гемоглобин|креатинин|инсулин|тропонин|ферритин|протромбин|миоглобин|гепарин|albumin|bilirubin|hemoglobin|creatinine|insulin|troponin|ferritin|prothrombin)$/u;
const surname=s=>{const t=String(s||'').replace(/[^\p{L}]/gu,'');return t.length>=5&&/(?:[ое]в[а]?|ин[а]?|ский|ская|ова|ева|ovich|ovna|ov|ova|ev|eva|yev|yeva|qizi|o[gʻ‘’']?li)$/iu.test(t)&&/^[\p{Lu}]/u.test(t);};
const nameWord=s=>/^[\p{L}][\p{L}'‘’ʻ.-]*$/u.test(String(s||''))&&!stop.test(norm(s))&&!patient.test(norm(s));
function regions(layouts){
 const names=new Set(),out=layouts.map(()=>[]);
 const add=(p,w,remember=false)=>{const b=w?.bbox;if(b&&[b.x0,b.y0,b.x1,b.y1].every(Number.isFinite)&&b.x1>b.x0&&b.y1>b.y0){out[p].push(b);if(remember&&norm(w.text).length>=3)names.add(norm(w.text));}};
 layouts.forEach((layout,p)=>{const lines=layout.lines||[];lines.forEach((line,i)=>{
  const words=line.words||[];
  // Table cells are often emitted in different OCR blocks. Use reading-space
  // geometry, not painted coordinates, to find a value on the same row.
  const rowAfter=anchor=>{const a=readBox(anchor);if(!a)return [];return lines.flatMap(l=>l.words||[]).filter(w=>{const b=readBox(w);if(!b||w===anchor||b.x0<a.x1-3)return false;const overlap=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);return overlap>=Math.min(a.y1-a.y0,b.y1-b.y0)*.45;}).sort((a,b)=>readBox(a).x0-readBox(b).x0);};
  let at=words.findIndex(w=>isPatient(w.text.split(/[:：]/)[0]));
  if(at<0&&/^ф\W*и\W*о\W*/iu.test(words.map(w=>w.text).join(' ')))at=words.findIndex(w=>norm(w.text)==='о');
  if(at>=0){
   let values=/[:：].*\p{L}/u.test(words[at].text)?[{...words[at],text:words[at].text.split(/[:：]/).slice(1).join(':')},...words.slice(at+1)]:words.slice(at+1);
   if(!values.some(w=>nameWord(w.text)))values=rowAfter(words[at]);
   if(!values.some(w=>nameWord(w.text)))values=(lines[i+1]?.words||[]);
   for(const w of values){if(stop.test(norm(w.text))||/[0-9]/.test(w.text)||isBirth(w.text)||isIdentifier(w.text)||personal.test(norm(w.text)))break;if(nameWord(w.text))add(p,w,true);}
  }
  const contact=words.findIndex(w=>personal.test(norm(w.text.split(/[:：]/)[0])));
  if(contact>=0){let values=words.slice(/[:：].+/.test(words[contact].text)?contact:contact+1);if(!values.length)values=rowAfter(words[contact]);for(const w of values){if(stop.test(norm(w.text)))break;add(p,w);}}
  // A birth date or patient ID is identifying data; examination dates and
  // actual age remain available for clinical interpretation.
  for(let start=0;start<words.length;start++)for(let end=Math.min(words.length-1,start+3);end>=start;end--){
   const label=words.slice(start,end+1).map(w=>w.text.split(/[:：]/)[0]).join(' '),birth=isBirth(label),identifier=isIdentifier(label);
   if(!birth&&!identifier)continue;
   let values=words.slice(end+1);if(!values.length)values=rowAfter(words[end]);
   if(!values.length)values=lines[i+1]?.words||[];
   const joinedValue=words[end].text.split(/[:：]/).slice(1).join(':');if(/\d/.test(joinedValue))values=[words[end],...values];
   for(const w of values){if(!/[0-9]/.test(w.text))break;add(p,w);}break;
  }
  if(/^(?:возраст|age|yosh)[\s:：]/iu.test(words.map(w=>w.text).join(' ')))for(const w of words.slice(1))if(/^(?:18|19|20)\d{2}(?:\D|$)/.test(w.text))add(p,w);
  words.forEach((w,j)=>{
   if(!stop.test(norm(w.text))&&!labName.test(norm(w.text))&&surname(w.text)&&(w.confidence==null||w.confidence>=45)){add(p,w,true);for(const x of words.slice(j+1,j+4)){if(!nameWord(x.text)||surname(x.text))break;add(p,x,true);}}
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.text))add(p,w);
  });
  const joined=words.map(w=>w.text).join(' ');let offset=0;const spans=words.map(w=>{const start=offset;offset+=w.text.length+1;return {w,start,end:offset-1};});
  for(const match of joined.matchAll(/\+?\d[\d\s()–—-]{8,}\d/g)){
   const digits=match[0].replace(/\D/g,'');if(digits.length<10||digits.length>15||/(?:^|\s)(?:\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{4})(?:\s|$)/.test(match[0].trim()))continue;
   const selected=spans.filter(s=>s.end>match.index&&s.start<match.index+match[0].length);
   if(selected.every(s=>s.w.confidence==null||s.w.confidence>=45))for(const s of selected)add(p,s.w);
  }
 });});
 layouts.forEach((layout,p)=>{for(const line of layout.lines||[])for(const w of line.words||[])if(names.has(norm(w.text)))add(p,w);});
 return out.map(boxes=>Array.from(new Map(boxes.map(b=>[[b.x0,b.y0,b.x1,b.y1].join(','),b])).values()));
}
function paint(canvas,boxes,layout){if(layout?.width&&layout?.height&&(canvas.width!==layout.width||canvas.height!==layout.height))throw Error('Sahifa o‘lchami o‘zgardi. Berkitishni qayta bajaring.');const g=canvas.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';for(const b of boxes){const pad=Math.max(4,Math.round(canvas.width/350)),x=Math.max(0,Math.floor(b.x0-pad)),y=Math.max(0,Math.floor(b.y0-pad));g.fillRect(x,y,Math.min(canvas.width,Math.ceil(b.x1+pad))-x,Math.min(canvas.height,Math.ceil(b.y1+pad))-y);}g.restore();}
if(typeof module==='object'&&module.exports){module.exports={norm,regions,surname,originalBox,paint};return;}
let loading;
function load(){if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/assets/vendor/uzmed-redaction-v1/tesseract.min.js';s.onload=()=>W.Tesseract?.createWorker?resolve(W.Tesseract):reject(Error('OCR moduli ochilmadi.'));s.onerror=()=>reject(Error('OCR moduli yuklanmadi.'));document.head.append(s);}).catch(e=>{loading=null;throw e;});return loading;}
function canvasAt(source,angle){const c=document.createElement('canvas'),swap=angle%180!==0;c.width=swap?source.height:source.width;c.height=swap?source.width:source.height;const g=c.getContext('2d');if(angle===90)g.translate(c.width,0);if(angle===180)g.translate(c.width,c.height);if(angle===270)g.translate(0,c.height);g.rotate(angle*Math.PI/180);g.drawImage(source,0,0);return c;}
function originalBox(b,angle,w,h){const pts=[[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]].map(([x,y])=>angle===90?[y,h-x]:angle===180?[w-x,h-y]:angle===270?[w-y,x]:[x,y]);return {x0:Math.max(0,Math.min(...pts.map(p=>p[0]))),y0:Math.max(0,Math.min(...pts.map(p=>p[1]))),x1:Math.min(w,Math.max(...pts.map(p=>p[0]))),y1:Math.min(h,Math.max(...pts.map(p=>p[1])))};}
async function create({signal}={}){
 const lib=await load();signal?.throwIfAborted();let worker,closed=false;
 const cancel=()=>{closed=true;worker?.terminate().catch(()=>{});};signal?.addEventListener('abort',cancel,{once:true});
 try{worker=await lib.createWorker('eng+rus+uzb',1,{workerPath:'/assets/vendor/uzmed-redaction-v1/worker.min.js',corePath:'/assets/vendor/uzmed-redaction-v1/core',langPath:'/assets/vendor/uzmed-redaction-v1/lang',workerBlobURL:false,cacheMethod:'none',gzip:true,logger:()=>{}});if(closed){await worker.terminate();throw new DOMException('Bekor qilindi','AbortError');}await worker.setParameters({tessedit_pageseg_mode:'3',user_defined_dpi:'150'});}catch(e){signal?.removeEventListener('abort',cancel);throw e;}
 return {
  async scan(source){const width=source.width,height=source.height;let best={lines:[],score:-1,angle:0};
   const recognize=async(c,angle,{x=0,y=0,scale=1,psm=3}={})=>{
    signal?.throwIfAborted();await worker.setParameters({tessedit_pageseg_mode:String(psm)});
    const {data}=await worker.recognize(c,{}, {text:false,blocks:true});const lines=[];
    for(const block of data.blocks||[])for(const para of block.paragraphs||[])for(const line of para.lines||[])lines.push({words:(line.words||[]).map(w=>{const b=w.bbox,read={x0:b.x0/scale+x,y0:b.y0/scale+y,x1:b.x1/scale+x,y1:b.y1/scale+y};return {text:w.text,confidence:w.confidence,readBox:read,bbox:originalBox(read,angle,width,height)};})});
    return lines;
   };
   for(const angle of [0,90,180,270]){
   signal?.throwIfAborted();if(closed)throw new DOMException('Bekor qilindi','AbortError');const c=canvasAt(source,angle);
   let lines;try{lines=await recognize(c,angle);}finally{c.width=1;c.height=1;}
   const words=lines.flatMap(l=>l.words),score=words.reduce((s,w)=>s+(w.confidence||0)*Math.min(12,(w.text.match(/\p{L}/gu)||[]).length+.2*(w.text.match(/\d/g)||[]).length),0),hasName=words.some(w=>isPatient(w.text.split(/[:：]/)[0]));
   if(score>best.score)best={lines,score,angle};
   // A confident upright page needs no additional rotation passes.
   const avg=words.reduce((s,w)=>s+(w.confidence||0),0)/Math.max(1,words.length);
   if(angle===0&&words.length>=5&&avg>=78&&hasName)break;
   }
   // Dense table headers are often skipped by whole-page segmentation.
   // Re-read the upper half at larger scale as sparse text, in the chosen
   // reading orientation. Map crop offsets and scale before undoing rotation.
   signal?.throwIfAborted();const upright=canvasAt(source,best.angle),crop=document.createElement('canvas');
   const h=Math.ceil(upright.height*.5),scale=Math.min(2,3200/upright.width);crop.width=Math.round(upright.width*scale);crop.height=Math.round(h*scale);
   try{crop.getContext('2d').drawImage(upright,0,0,upright.width,h,0,0,crop.width,crop.height);const extra=await recognize(crop,best.angle,{scale,psm:11});best.lines.push(...extra);}finally{upright.width=1;upright.height=1;crop.width=1;crop.height=1;}
   return {lines:best.lines,width,height};
  },
  async close(){signal?.removeEventListener('abort',cancel);if(!closed){closed=true;await worker.terminate();}}
 };
}
W.UZMEDAutoRedaction={create,regions,paint};
})(typeof window==='object'?window:globalThis);
