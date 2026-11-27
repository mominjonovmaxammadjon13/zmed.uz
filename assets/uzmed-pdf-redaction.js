/* Local PDF rendering and image-only PDF reconstruction; no original PDF bytes leave this module. */
(function(W){'use strict';
const MAX_PAGES=100,MAX_BYTES=9500000,ascii=s=>new TextEncoder().encode(s);
function rasterPdf(pages){
 if(!Array.isArray(pages)||!pages.length||pages.length>MAX_PAGES)throw Error('PDF sahifalari soni 1–100 bo‘lsin.');
 const chunks=[],offsets=[0];let size=0;
 const push=b=>{b=typeof b==='string'?ascii(b):b;chunks.push(b);size+=b.byteLength;if(size>MAX_BYTES)throw Error('Yangi PDF juda katta. Hujjatni qismlarga ajrating; hech bir sahifa tashlab yuborilmadi.');};
 const object=(id,body)=>{offsets[id]=size;push(id+' 0 obj\n');push(body);push('\nendobj\n');};
 push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
 pages.forEach((p,i)=>{
  if(!(p.bytes instanceof Uint8Array)||!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<1||p.height<1||p.bytes[0]!==255||p.bytes[1]!==216)throw Error('PDF sahifasi JPEG shaklida tayyorlanmadi.');
  const id=3+i*3,w=612,h=Number((612*p.height/p.width).toFixed(3));
  object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+w+' '+h+'] /Resources << /XObject << /Im0 '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
  offsets[id+1]=size;push((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.width+' /Height '+p.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n');push(p.bytes);push('\nendstream\nendobj\n');
  const command='q\n'+w+' 0 0 '+h+' 0 0 cm\n/Im0 Do\nQ\n';object(id+2,'<< /Length '+ascii(command).length+' >>\nstream\n'+command+'endstream');
 });
 const xref=size,count=3+pages.length*3;push('xref\n0 '+count+'\n0000000000 65535 f \n');
 for(let i=1;i<count;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 push('trailer\n<< /Size '+count+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
 return new Blob(chunks,{type:'application/pdf'});
}
if(typeof module==='object'&&module.exports){module.exports={rasterPdf,MAX_PAGES,MAX_BYTES};return;}
let libPromise;
async function library(){if(!libPromise)libPromise=import('/assets/vendor/v19/pdf-v19.js').then(m=>{m.GlobalWorkerOptions.workerSrc='/assets/vendor/v19/pdf-worker-v19.js';return m;}).catch(e=>{libPromise=null;throw Error('PDF moduli ochilmadi. Qayta urinib ko‘ring.');});return libPromise;}
const jpeg=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF sahifasi tayyorlanmadi.')),'image/jpeg',.94));
async function fromBlob(blob){const url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return c;}finally{URL.revokeObjectURL(url);}}
async function open(file){
 const lib=await library(),loading=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,enableXfa:false,stopAtErrors:true,wasmUrl:'/assets/vendor/v19/pdf-resources/wasm/',standardFontDataUrl:'/assets/vendor/v19/pdf-resources/standard_fonts/'});
 let pdf;try{pdf=await loading.promise;}catch(e){if(e.name==='PasswordException')throw Error('PDF parol bilan himoyalangan. Parolsiz nusxasini tanlang.');throw Error('PDF ochilmadi yoki buzilgan.');}
 if(pdf.numPages>MAX_PAGES){await loading.destroy?.();throw Error('PDF 100 sahifadan katta. Qismlarga ajrating; sahifalar kesilmadi.');}
 const saved=new Map(),reviewed=new Set();let closed=false;
 return {
  pages:pdf.numPages,
  reviewedCount:()=>reviewed.size,
  unreview:n=>reviewed.delete(n),
  async render(n){
   if(closed||n<1||n>pdf.numPages)throw Error('PDF sahifasi topilmadi.');
   if(saved.has(n))return fromBlob(saved.get(n).blob);
   const page=await pdf.getPage(n),base=page.getViewport({scale:1}),scale=Math.min(2,1800/Math.max(base.width,base.height)),view=page.getViewport({scale});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
   try{await page.render({canvasContext:canvas.getContext('2d'),viewport:view,background:'#fff'}).promise;return canvas;}finally{page.cleanup();}
  },
  async save(n,canvas,confirmed=false){
   if(closed||n<1||n>pdf.numPages||!canvas?.width)throw Error('Sahifani ochib tekshiring.');
   const blob=await jpeg(canvas);if(closed)throw Error('PDF yopildi.');
   saved.set(n,{blob,width:canvas.width,height:canvas.height});if(confirmed)reviewed.add(n);
  },
  async images(){
   if(closed||reviewed.size!==pdf.numPages)throw Error('PDFning har bir sahifasini tekshirib tasdiqlang.');
   const out=[];for(let n=1;n<=pdf.numPages;n++){const p=saved.get(n);out.push({mime:'image/jpeg',data:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('Sahifa tayyorlanmadi.'));r.readAsDataURL(p.blob);})});}return out;
  },
  async export(){
   if(closed||reviewed.size!==pdf.numPages)throw Error('PDFning har bir sahifasini tekshirib tasdiqlang.');
   const rows=[];for(let n=1;n<=pdf.numPages;n++){const p=saved.get(n);if(!p)throw Error('PDF sahifasi tayyorlanmagan.');rows.push({bytes:new Uint8Array(await p.blob.arrayBuffer()),width:p.width,height:p.height});}
   return rasterPdf(rows);
  },
  destroy(){closed=true;saved.clear();reviewed.clear();try{Promise.resolve(loading.destroy?.()).catch(()=>{});}catch{}}
 };
}
W.UZMEDPdfRedaction={open,rasterPdf,MAX_PAGES};
})(typeof window==='object'?window:globalThis);

