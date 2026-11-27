/* UZMED Qabul: optional clinician-authored quick phrases. No patient data is sent or inferred. */
(function(W,D){
 'use strict';
 const entries=[
  {id:'field-advice',title:'Tayyor tavsiyalar',groups:{
   Nazorat:['Nazorat ko‘rigi sanasi: ____','Tayinlangan davoning samarasi va nojo‘ya ta’sirini kuzatish.','Shikoyatlar kuchaysa qayta ko‘rikka murojaat qilish.','Bemor bilan dori qabul qilish tartibi muhokama qilindi.'],
   Profilaktika:['Aniqlangan allergen bilan kontaktni kamaytirish bo‘yicha tavsiya berildi.','Chekish/tutun ta’sirini kamaytirish tavsiya etildi.','Yetarli suyuqlik va individual ovqatlanish rejimi muhokama qilindi.'],
   Ogohlantirish:['Nafas qiyinlashishi yoki hush buzilishida shoshilinch tibbiy yordamga murojaat qilish.','Og‘ir allergik reaksiya belgilari paydo bo‘lsa tez yordam chaqirish.']}}
 ];
 for(const entry of entries){const groups=W.UZMEDClinicalPhraseCatalog?.sections?.[entry.id]||{};for(const [name,phrases]of Object.entries(groups)){entry.groups[name]=[...new Set([...(entry.groups[name]||[]),...phrases])];}}
 const norm=v=>String(v||'').toLocaleLowerCase('uz').replace(/['ʻ‘’\u02bb]/g,'').trim();
 function mount(){
  const root=D.getElementById('qabulFocus');if(!root||D.getElementById('qfQuickPhrasesMounted'))return;
  const marker=D.createElement('span');marker.id='qfQuickPhrasesMounted';marker.hidden=true;root.append(marker);
  const locked=()=>{try{return !!W.UZMEDVisitBridge?.read?.().readOnly;}catch{return true;}};
  for(const cfg of entries){
   const field=D.getElementById(cfg.id);if(!field)continue;
   const details=D.createElement('details');details.className='qf-helper-library';
   const heading=D.createElement('summary');heading.textContent='✦ '+cfg.title;details.append(heading);
   const hint=D.createElement('p');hint.className='minor';hint.textContent='Tayyor matnni faqat ko‘rikdan keyin tanlang; bo‘sh joylarni bemor ma’lumoti bilan to‘ldiring.';details.append(hint);
   const filter=D.createElement('input');filter.type='search';filter.className='qf-helper-search';filter.placeholder='Ma’lumotni qidirish…';filter.setAttribute('aria-label',cfg.title+' ichidan qidirish');details.append(filter);
   const groups=D.createElement('div');groups.className='qf-helper-categories';groups.setAttribute('role','group');groups.setAttribute('aria-label','Ma’lumot toifalari');details.append(groups);
   const options=D.createElement('div');options.className='qf-helper-options';details.append(options);
   const names=['Barchasi',...Object.keys(cfg.groups)];let selected='Barchasi';
   function render(){
    options.replaceChildren();const q=norm(filter.value);let shown=0;
    for(const [group,phrases]of Object.entries(cfg.groups)){
     if(selected!=='Barchasi'&&group!==selected)continue;
     for(const phrase of phrases){
      if(q&&!norm(phrase).includes(q))continue;
      const b=D.createElement('button');b.type='button';b.className='qf-helper-phrase';b.textContent=phrase;
      b.title='Maydonga qo‘shish: '+phrase;
      b.onclick=()=>{
       if(locked()){W.QabulFocus?.status?.('Tasdiqlangan qabulni tahrirlash mumkin emas.');return;}
       const lines=field.value.split(/\r?\n/).map(x=>x.trim());if(lines.includes(phrase))return;
       const value=[field.value.trim(),phrase].filter(Boolean).join('\n');
       if(field.maxLength>0&&value.length>field.maxLength){W.QabulFocus?.status?.('Matn maydoni chegarasi oshdi.');return;}
       field.value=value;field.dispatchEvent(new W.Event('input',{bubbles:true}));W.UzmedQabul?.render?.();b.classList.add('qf-helper-added');b.setAttribute('aria-label',phrase+' — qo‘shildi');
      };
      options.append(b);shown++;if(shown>=150)break;
     }
     if(shown>=150)break;
    }
    if(!shown){const text=D.createElement('p');text.className='minor';text.textContent='Mos matn topilmadi. Qo‘lda yozishingiz mumkin.';options.append(text);}
   }
   for(const name of names){
    const b=D.createElement('button');b.type='button';b.className='qf-helper-category';b.textContent=name;b.setAttribute('aria-pressed',String(name===selected));
    b.onclick=()=>{selected=name;for(const x of groups.children)x.setAttribute('aria-pressed',String(x===b));render();};groups.append(b);
   }
   filter.oninput=render;render();
   field.insertAdjacentElement('afterend',details);
  }
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
