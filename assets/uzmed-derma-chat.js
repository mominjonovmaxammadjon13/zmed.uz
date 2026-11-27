/* Shared reference-image route. It does not diagnose or process attached patient files. */
(function(W){
 'use strict';
 var busy=false, run=0;
 function isImageQuestion(text){
  var s=String(text||'').toLowerCase().replace(/[’‘ʻʼ']/g,'');
  if(s.length>240||!/(?:^|\s)(?:rasm\w*|surat\w*|foto\w*|tasvir\w*|image\w*|photo\w*)(?:\s|[?.!,]|$)/.test(s))return false;
  return /\b(?:derma\w*|psoria\w*|psoriaz\w*|psoriasis|vitiligo|akne|acne|husnbuzar\w*|ugri|atopik|atopic|ekzema|eczema|urtikariya|urticaria|eshakemi|qichima|scabies|melanoma|temiratki|tinea|rosacea|rozatsea|impetigo|alopetsi\w*|alopecia|lichen|pemfig\w*|pemphig\w*|scleroderma|skleroderm\w*|sebore\w*|seborr\w*|toshma\w*)\b/.test(s)||/\b(?:teri|teridagi|terining|skin)\b/.test(s);
 }
 function find(q,options){
  options=options||{};
  return new Promise(function(resolve,reject){
   var xhr=new XMLHttpRequest();
   xhr.open('GET','/api/derma/search?q='+encodeURIComponent(String(q||'').trim().slice(0,140))+'&offset='+Math.max(0,Number(options.offset)||0)+'&limit=4',true);
   xhr.timeout=12000;xhr.setRequestHeader('Accept','application/json');
   xhr.onload=function(){
    if(xhr.status!==200){reject(Error('Derma qidiruvi vaqtincha ishlamayapti'));return;}
    try{var body=JSON.parse(xhr.responseText);if(!body||!Array.isArray(body.images))throw Error();resolve(body);}
    catch(_){reject(Error('Rasm qidiruvi javobi noto‘g‘ri'));}
   };
   xhr.onerror=xhr.ontimeout=function(){reject(Error('Rasm qidiruviga ulanib bo‘lmadi'));};
   xhr.send();
  });
 }
 function allowedUrl(url){
  if(typeof url!=='string')return false;
  if(/^\/api\/derma\/image\/[a-z0-9-]{4,40}$/i.test(url))return true;
  try{var u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['upload.wikimedia.org','thumb.wikimedia.org'].indexOf(u.hostname)!==-1;}
  catch(_){return false;}
 }
 function sourceUrl(url){
  try{var u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname==='commons.wikimedia.org'&&u.pathname.indexOf('/wiki/File:')===0?u.href:'';}
  catch(_){return '';}
 }
 function create(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=String(text);return el;}
 function display(result,target){
  var host=target||document.getElementById('aiMessages');if(!host)return false;
  var row=create('div','ai-msg-row'),holder=create('div','uzmed-v5-msg bot uzmed-derma-media');
  holder.appendChild(create('div','uzmed-derma-media-heading','🩺 Dermatologiya atlasidan rasmlar'));
  var items=Array.isArray(result.images)?result.images.filter(function(x){return x&&allowedUrl(x.url);}).slice(0,4):[];
  if(!items.length)holder.appendChild(create('p','','Mos ishonchli rasm topilmadi. Teri kasalligi nomini aniqroq yozing.'));
  else{
   var grid=create('div','uzmed-derma-media-grid');
   items.forEach(function(item){
    var fig=create('figure','uzmed-derma-media-card'),img=create('img');
    img.src=item.url;img.alt=item.title||'Dermatologik rasm';img.loading='eager';img.decoding='async';img.referrerPolicy='no-referrer';
    img.onerror=function(){img.remove();fig.prepend(create('p','','Rasm yuklanmadi.'));};
    fig.appendChild(img);fig.appendChild(create('figcaption','',item.title||'Dermatologik rasm'));
    fig.appendChild(create('small','',item.provider==='UZMED atlasi'?(item.source||'UZMED atlasi')+(item.page?', '+item.page+'-bet':''):'Wikimedia Commons · '+(item.author?item.author+' · ':'')+(item.license||'')));
    var ref=item.provider==='Wikimedia Commons'?sourceUrl(item.source):'';
    if(ref){var a=create('a','','Manba va litsenziya');a.href=ref;a.rel='noopener noreferrer';a.target='_blank';fig.appendChild(a);}
    grid.appendChild(fig);
   });holder.appendChild(grid);
   if(result.has_more&&Number.isFinite(Number(result.next_offset))){
     var more=create('button','uzmed-derma-more','🖼 Yana yangi rasmlar');
     more.type='button';
     more.style.cssText='display:block;width:100%;margin:12px 0;padding:12px;border-radius:10px;background:#e0f2ef;color:#096e60;font-weight:700;border:1px solid #91cac0;cursor:pointer';
     more.onclick=function(){
       more.disabled=true;more.textContent='⏳ Rasmlar yuklanmoqda...';
       find(result.query||'',{offset:result.next_offset}).then(function(next){
         more.remove();
         if(next.images&&next.images.length)display(next,host);
         else{
           var notice=create('p','','Boshqa referens rasm mavjud emas.');
           holder.appendChild(notice);
         }
       }).catch(function(){
         more.disabled=false;more.textContent='🖼 Yana yangi rasmlar';
       });
     };
     holder.appendChild(more);
   }
  }
  holder.appendChild(create('p','uzmed-derma-media-note','Tasvir o‘quv maqsadida. Rasmning o‘zi tashxisni tasdiqlamaydi.'));
  row.appendChild(holder);host.appendChild(row);host.scrollTop=host.scrollHeight;return true;
 }
 function hasFiles(){
  return !!((W.pendingFiles&&W.pendingFiles.length)||(W.UZMEDAiAttach&&W.UZMEDAiAttach.pendingFiles&&W.UZMEDAiAttach.pendingFiles.length));
 }
 function owner(){try{var s=W.UZMEDAuth&&W.UZMEDAuth.getState&&W.UZMEDAuth.getState();return String(s&&s.user&&s.user.id||'anonymous');}catch(_){return 'anonymous';}}
 function trySendImage(){return false;} // AI gateway selects and executes the MCP tool.

 W.UzmedDermaMedia={isImageQuestion:isImageQuestion,find:find,display:display,trySendImage:trySendImage,allowedUrl:allowedUrl,sourceUrl:sourceUrl};
})(window);
