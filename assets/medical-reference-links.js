(function(){
 'use strict';
 // Public source metadata only. No chat, patient field or clinical result is read.
 const labels={live_adapter:'Ochiq API adapteri',versioned_import:'Versiyali ma’lumot yuklangan',versioned_metadata_index:'Qo‘llanma indeksi · to‘liq matn emas',local_reference:'Mahalliy indeks',partial_local_and_external:'Qisman baza va tashqi manbalar',configured_adapter:'Kalit sozlangan adapter',credentials_required:'API kaliti kerak',license_required:'Litsenziya/ruxsat kerak',reference_link:'Tashqi havola',import_required:'Import hali bajarilmagan'};
 let panel,list,note,version=0,lastSection='';
 function element(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
 function guidelineSearch(section,data){
  if(!['proto','spec','protocols','specialists'].includes(section)||!data.guidelines?.available)return;
  const row=element('li'),form=element('form'),label=element('label','Kasallik nomi yoki MKB kodi — bemor ma’lumotlarini yozmang'),input=element('input'),submit=element('button','Qo‘llanmani topish'),result=element('div');
  input.id='uzmedGuidelineQuery';input.type='search';input.maxLength=180;input.placeholder='Masalan: gipertoniya yoki I10';input.style.cssText='box-sizing:border-box;width:100%;padding:6px;margin:6px 0';label.htmlFor=input.id;submit.type='submit';form.append(label,input,submit);row.append(element('p','SSV: '+(data.guidelines.providers?.ssv?.categoriesIndexed||0)+' yo‘nalish · yangilangan: '+String(data.guidelines.fetchedAt||'').slice(0,10)),form,result);list.prepend(row);
  let revision=0;form.addEventListener('submit',async event=>{event.preventDefault();const query=input.value.trim(),own=++revision;if(!query)return;submit.disabled=true;result.textContent='Indeksdan qidirilmoqda…';
   try{const response=await fetch('/api/medical-sources/guidelines?section='+encodeURIComponent(section)+'&q='+encodeURIComponent(query),{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw Error('unavailable');const j=await response.json();if(own!==revision)return;result.replaceChildren();
    const rows=[...(j.national||[]).slice(0,5),...(j.society||[]).slice(0,3)];for(const item of rows){const url=new URL(item.url);if(url.protocol!=='https:')continue;const p=element('p'),a=element('a',item.provider.toUpperCase()+' · '+item.title);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';p.append(a);result.append(p);}if(!rows.length)result.textContent='Mos hujjat topilmadi; mavjud klinik qidiruv ishlashda davom etadi.';
    result.append(element('small','Bu hujjat indeksi; yuklangan sana tasdiq sanasi yoki amaldalik isboti emas.'));
   }catch{result.textContent='Indeks qidiruvi vaqtincha olinmadi. Asosiy bo‘lim o‘zgarmagan.';}finally{if(own===revision)submit.disabled=false;}
  });
 }
 async function load(){
  if(!panel.open)return;const own=++version;
  const section=window.UZMEDNavigation?.current?.().section||'chat';
  lastSection=section;
  note.textContent='Manbalar holati yuklanmoqda…';list.replaceChildren();
  try{
   const r=await fetch('/api/medical-sources/status?section='+encodeURIComponent(section),{credentials:'same-origin',headers:{Accept:'application/json'}});if(!r.ok)throw Error('unavailable');const data=await r.json();if(own!==version)return;
   note.textContent='API, saqlangan ma’lumot va tashqi havola alohida belgilangan. Bu ro‘yxat javobning klinik tasdig‘i emas.';
   for(const source of data.sources||[]){
    const url=new URL(source.url);if(url.protocol!=='https:')continue;
    const row=element('li'),link=element('a',source.specialty?source.specialty+' · '+source.title:source.title);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
    const state=element('small',(labels[source.status]||'Holat noma’lum')+(source.id==='isic'?' · faqat CC-0 atlas metama’lumoti':''));state.style.display='block';state.style.opacity='.75';row.append(link,state);row.style.margin='10px 0';list.append(row);
   }
   if(!list.childNodes.length)note.textContent='Bu xizmat bo‘limiga tibbiy manba biriktirish talab etilmaydi.';
   guidelineSearch(section,data);
  }catch{if(own===version)note.textContent='Manbalar holatini hozir olib bo‘lmadi. Asosiy bo‘lim ishlashda davom etadi.';}
 }
 function mount(){
  const sidebar=document.getElementById('uzmedSidebar');if(!sidebar)return false;
  if(document.getElementById('uzmedSectionSources'))return true;
  panel=element('details');panel.id='uzmedSectionSources';panel.style.cssText='margin:10px 12px;padding:10px;border:1px solid currentColor;border-radius:10px;font-size:13px;max-height:42vh;overflow:auto';
  const summary=element('summary','📚 Bo‘lim manbalari');summary.style.cursor='pointer';note=element('p');list=element('ul');list.style.paddingLeft='18px';panel.append(summary,note,list);sidebar.append(panel);panel.addEventListener('toggle',load);
  // Observe only the selected navigation control, never app or patient content.
  new MutationObserver(()=>{if(panel.open&&(window.UZMEDNavigation?.current?.().section||'chat')!==lastSection)load();}).observe(sidebar.querySelector('nav')||sidebar,{subtree:true,attributes:true,attributeFilter:['aria-current']});return true;
 }
 if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.body,{childList:true});}
})();
