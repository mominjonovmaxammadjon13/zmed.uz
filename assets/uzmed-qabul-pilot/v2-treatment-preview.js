/* UZMED Qabul v2 ISOLATED PREVIEW. No auth, backend, storage or live page modifications. */
(function () {
  'use strict';
  const DATA_URL='/assets/uzmed-qabul-pilot/v2-drug-groups.json';
  const $=id=>document.getElementById(id);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function mount(){
    const panel=$('panel-treatment');
    if(!panel||$('uzmedTreatmentV2'))return;
    const root=make('section','uv2-wrap');
    root.id='uzmedTreatmentV2';
    root.innerHTML='<div class="uv2-head"><div><div class="uv2-kicker">UZMED • KLINIK ISH MAYDONI</div><h2>Davolash</h2><p>Tekshiriladigan manbalardan preparat tanlash va qabul hujjatiga kiritish</p></div><div class="uv2-heading-actions"><button type="button" id="uv2Plan">Davolash rejasi</button><button type="button" id="uv2Document" class="uv2-primary">Qabul hujjati</button></div></div><div class="uv2-flow"><span>1–5. Shikoyat → Tashxis</span><b>6. Davolash</b><span>7. Tavsiyalar → Hujjat</span></div><div class="uv2-tabs"><button type="button" id="uv2GroupsTab" aria-pressed="true">Dori guruhlari</button><button type="button" id="uv2ListTab" aria-pressed="false">Preparatlar</button><button type="button" id="uv2ReviewTab" aria-pressed="false">Davolash rejasi</button></div><div id="uv2GroupSection"><div class="uv2-search"><label for="uv2GroupSearch">Dori guruhini yoki preparatni qidiring</label><input id="uv2GroupSearch" type="search" autocomplete="off" maxlength="100" placeholder="Masalan: glyukokortikosteroid, antihistamin..."></div><p id="uv2GroupCount" class="uv2-meta" role="status">Mavjud guruhlar yuklanmoqda…</p><div id="uv2Groups" class="uv2-groups"></div><button id="uv2More" type="button" hidden>Yana guruhlarni ko‘rsatish</button></div><div id="uv2DrugSection" hidden><button id="uv2Back" type="button" class="uv2-back">← Barcha guruhlar</button><h3 id="uv2CurrentGroup"></h3><div class="uv2-grid"><div><p id="uv2DrugCount" class="uv2-meta"></p><div id="uv2Drugs" class="uv2-drugs"></div></div><div id="uv2Detail" class="uv2-detail"><p>Preparatni tanlang. Ma’lumotlar UZMED API orqali tekshiriladi.</p></div></div></div><div class="uv2-foot"><strong>Ma’lumot manbasi:</strong> UZMED klinik reyestri va mavjud dori API. Dori nomi yoki toifasi tayinlov emas; doza, yo‘l, davomiylik, yoshga moslik, allergiya, DDI va qarshi ko‘rsatmalar shifokor tomonidan tasdiqlanadi.</div>';
    const anchor=panel.querySelector('.search-field')||panel.firstChild;
    panel.insertBefore(root,anchor);
    const status=$('uv2GroupCount'),groupHost=$('uv2Groups'),drugHost=$('uv2Drugs'),detailHost=$('uv2Detail');
    let dataset=null,all=[],active=null,selected=null,more=false,seq=0;
    function statusText(t){status.textContent=t;}
    function setTab(type){
      const group=type==='groups',review=type==='review';
      $('uv2GroupSection').hidden=!group;
      $('uv2DrugSection').hidden=type!=='drugs';
      for(const [id,on] of [['uv2GroupsTab',group],['uv2ListTab',type==='drugs'],['uv2ReviewTab',review]])$(id).setAttribute('aria-pressed',String(on));
      if(review){$('uv2DrugSection').hidden=false;$('uv2GroupSection').hidden=true;$('uv2CurrentGroup').textContent='Saqlanadigan dori tayinlovlari';drugHost.replaceChildren();detailHost.replaceChildren();const rows=$('rxRows');const count=rows?.children.length||0;detailHost.append(make('p','',count?count+' ta tayinlov qatori mavjud. Quyidagi muharrirda doza, yo‘l, davomiylik va klinik tasdiqni to‘ldiring.':'Hozircha tayinlov qo‘shilmagan. Dori guruhidan preparat tanlang.'));rows?.scrollIntoView({block:'nearest',behavior:'smooth'});}
    }
    const normalize=s=>String(s||'').toLocaleLowerCase('uz').trim();
    function groupList(){
      if(!dataset)return;
      const q=normalize($('uv2GroupSearch').value);
      const filtered=all.filter(g=>normalize(g.name).includes(q)||g.items.some(x=>normalize(x.name).includes(q)||normalize(x.inn).includes(q)));
      const shown=more||q?filtered:filtered.slice(0,24);
      groupHost.replaceChildren();
      for(const group of shown){
        const btn=make('button','uv2-group');btn.type='button';btn.append(make('span','',group.name),make('small','',group.items.length+' ta reyestr yozuvi'));
        btn.addEventListener('click',()=>openGroup(group));groupHost.append(btn);
      }
      statusText(filtered.length+' ta guruh topildi • '+dataset.itemCount+' ta guruhlangan dori yozuvi • UZMED bazasi');
      $('uv2More').hidden=!!q||more||filtered.length<=shown.length;
      if(!filtered.length)groupHost.append(make('p','uv2-meta','Mos guruh topilmadi. Quyidagi umumiy dori qidiruvidan foydalaning.'));
    }
    function openGroup(group){
      active=group;selected=null;seq++;
      $('uv2CurrentGroup').textContent=group.name;
      $('uv2DrugCount').textContent=group.items.length+' ta klinik reyestr yozuvi • Preparatga tegib, manbani tekshiring';
      drugHost.replaceChildren();detailHost.replaceChildren(make('p','','Preparatni tanlang. Tafsilotlar mavjud API orqali tekshiriladi.'));
      for(const item of group.items){
        const btn=make('button','uv2-drug');btn.type='button';btn.append(make('strong','',item.name),make('small','',item.inn));
        btn.addEventListener('click',()=>showDetails(item,btn));drugHost.append(btn);
      }
      setTab('drugs');
    }
    const fields=[['description','Guruh va ta’siri'],['indications','Qo‘llanilishi'],['dosage_instructions','Dozalash yo‘riqnomasi'],['contraindications','Qarshi ko‘rsatmalar'],['interactions','O‘zaro ta’sir'],['adverse_effects','Nojo‘ya ta’sir'],['special_instructions','Maxsus ko‘rsatmalar']];
    async function showDetails(item,button){
      const n=++seq; selected=null;
      [...drugHost.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      detailHost.replaceChildren(make('p','uv2-meta','Haqiqiy dori API’dan ma’lumot tekshirilmoqda…'));
      try{
        const response=await fetch('/api/drugs/catalog?key='+encodeURIComponent(item.key),{credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
        if(!response.ok)throw Error('API HTTP '+response.status);
        const record=await response.json();
        if(n!==seq)return;
        if(!record||record.key!==item.key||record.sourceVersion!==dataset.version)throw Error('Reyestr yangilangan. Guruhlar ro‘yxatini yangilash kerak.');
        selected=record;
        detailHost.replaceChildren(make('h3','',record.name||item.name));
        detailHost.append(make('p','uv2-meta','INN: '+(record.inn||'manbada ko‘rsatilmagan')+' • Manba: '+(record.source||'UZMED')));
        const data=record.uzbek||{};
        for(const [key,label] of fields){
          const section=make('section','uv2-fact');section.append(make('strong','',label),make('p','',String(data[key]||'Manbada ma’lumot keltirilmagan.')));detailHost.append(section);
        }
        const note=make('p','uv2-caution','Preparatni qabulga qo‘shish shifokor tasdig‘i hisoblanmaydi. Doza, davomiylik va xavfsizlik tekshiruvini alohida bajaring.');detailHost.append(note);
        const add=make('button','uv2-primary','+ Davolash rejasiga qo‘shish');add.type='button';
        if(record.clinicalBlock){add.disabled=true;note.textContent='Klinik manba tekshiruvi bloklangan. Ushbu preparatni tayinlovga qo‘shish mumkin emas.';}
        add.addEventListener('click',()=>addToPlan(record));detailHost.append(add);
      }catch(e){if(n===seq)detailHost.replaceChildren(make('p','uv2-error','Preparat ma’lumotini tekshirib bo‘lmadi: '+e.message));}
    }
    function addToPlan(record){
      const add=$('addRx'),rows=$('rxRows');
      if(!record||record.clinicalBlock||!rows||!add||add.disabled){detailHost.append(make('p','uv2-error','Tayinlov muharriri hozir faol emas.'));return;}
      const before=rows.children.length;add.click();
      if(rows.children.length!==before+1){detailHost.append(make('p','uv2-error','Yangi dori qatori ochilmadi.'));return;}
      const row=rows.lastElementChild,name=row.querySelector('[name=name]'),inn=row.querySelector('[name=inn]');
      name.value=record.name||'';inn.value=record.inn||'';
      name.dispatchEvent(new Event('input',{bubbles:true}));
      inn.dispatchEvent(new Event('input',{bubbles:true}));
      window.UzmedQabul?.bindSource?.(row,{sourceKey:record.key,source:record.source,sourceVersion:record.sourceVersion});
      $('approved')&&($('approved').checked=false);
      window.UzmedQabul?.render?.();
      detailHost.append(make('p','uv2-success','Preparat qoralama rejasiga qo‘shildi. Doza va boshqa maydonlarni shifokor to‘ldirishi kerak.'));
      row.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
    $('uv2GroupSearch').addEventListener('input',groupList);
    $('uv2More').addEventListener('click',()=>{more=true;groupList();});
    $('uv2Back').addEventListener('click',()=>setTab('groups'));
    $('uv2GroupsTab').addEventListener('click',()=>setTab('groups'));
    $('uv2ListTab').addEventListener('click',()=>active?openGroup(active):setTab('groups'));
    $('uv2ReviewTab').addEventListener('click',()=>setTab('review'));
    $('uv2Plan').addEventListener('click',()=>setTab('review'));
    $('uv2Document').addEventListener('click',()=>{if(typeof window.QabulDocument?.open==='function')window.QabulDocument.open();else detailHost.append(make('p','uv2-error','Hujjat moduli yuklanmagan.'));});
    fetch(DATA_URL,{cache:'no-store',credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Manba mavjud emas');return r.json();}).then(d=>{
      if(!Array.isArray(d.groups)||!d.version)throw Error('Manba tuzilmasi noto‘g‘ri');
      dataset=d;all=d.groups;groupList();
    }).catch(e=>statusText('Guruh ma’lumotlarini yuklab bo‘lmadi: '+e.message));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
