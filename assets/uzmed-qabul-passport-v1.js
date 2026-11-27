/* Shared passport form. No browser storage; the authenticated caller owns persistence. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.QabulPassport=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const clean=v=>String(v??'').trim();
 function bmi(height,weight){
  const h=Number(height),w=Number(weight);
  return h>=50&&h<=250&&w>=1&&w<=500?(w/(h/100)**2).toFixed(1):'';
 }
 function names(value){
  const parts=clean(value).split(/\s+/u);
  if(parts.length<2)throw Error('Bemor familiyasi va ismini kiriting.');
  const out={last_name:parts[0],first_name:parts[1],middle_name:parts.slice(2).join(' ')};
  if(Object.values(out).some(v=>v.length>120))throw Error('Ism, familiya yoki ota ismi 120 belgidan oshmasin.');
  return out;
 }
 function validate(values,today=new Date().toLocaleDateString('sv-SE')){
  const patient=names(values.full_name),birth=clean(values.date_of_birth),phone=clean(values.phone);
  function validDate(v){const d=new Date(v+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
  if(birth&&(!validDate(birth)||birth>today||birth<'1850-01-01'))throw Error('Tug‘ilgan sanani tekshiring.');
  if(!validDate(values.date))throw Error('Qabul sanasini kiriting.');
  if(phone&&!/^\+?[\d ()-]{5,32}$/.test(phone))throw Error('Telefon raqamini tekshiring.');
  const weight=clean(values.weight),height=clean(values.height);
  if(height&&(!Number.isFinite(Number(height))||Number(height)<50||Number(height)>250))throw Error('Bo‘y 50–250 sm oralig‘ida bo‘lsin.');
  if(weight&&(!Number.isFinite(Number(weight))||Number(weight)<1||Number(weight)>500))throw Error('Vazn 1–500 kg oralig‘ida bo‘lsin.');
  if(!['male','female','unknown'].includes(values.sex))throw Error('Bemor jinsini tanlang.');
  if(clean(values.address).length>1000||clean(values.patient_note).length>5000||clean(values.allergies).length>5000)throw Error('Pasport matni belgilangan hajmdan oshdi.');
  Object.assign(patient,{date_of_birth:birth||null,sex:values.sex,phone,address:clean(values.address)});
  return {patient,draft:{date:values.date,specialty:clean(values.specialty),height,weight,patient_note:clean(values.patient_note),allergies:clean(values.allergies),sex:values.sex}};
 }
 function render(D,{values={},specialties=[],onSave,onBack,onDirty,submitLabel='Saqlash va qabulni ochish'}={}){
  const el=(tag,cls,text)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const form=el('form','qp-passport');form.setAttribute('aria-label','Bemor pasporti');form.style.border='0';form.style.borderRadius='0';form.style.boxShadow='none';form.style.background='transparent';
  const head=el('header','qp-passport-head'),avatar=el('span','qp-passport-avatar','BM'),identity=el('div'),title=el('strong','','Bemor F.I.O.'),meta=el('span','','Pasport ma’lumotlari');
  identity.append(title,meta);const topSave=el('button','qp-passport-save qp-passport-save-top');topSave.type='submit';topSave.setAttribute('aria-label',submitLabel);topSave.title=submitLabel;topSave.style.cssText='display:inline-flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;min-height:44px;padding:9px';topSave.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8"/></svg>';head.append(avatar,identity);
  if(onBack){const back=el('button','qp-passport-back','←');back.type='button';back.setAttribute('aria-label','Shifokor qabuliga qaytish');back.onclick=onBack;head.append(back);}head.append(topSave);
  const grid=el('div','qp-passport-grid'),controls={};
  function field(key,label,type='text',placeholder='',max=120){
   const box=el('div','qp-passport-field'),lab=el('label','',label),input=el(type==='textarea'?'textarea':'input');
   input.id='qp-'+key;input.name=key;if(type!=='textarea')input.type=type;input.maxLength=max;input.autocomplete='off';input.placeholder=placeholder;lab.htmlFor=input.id;input.value=values[key]||'';box.append(lab,input);controls[key]=input;return box;
  }
  const full=field('full_name','Bemor F.I.O.','text','Familiya, ism, ota ismi',362);controls.full_name.required=true;grid.append(full);
  const dates=el('div','qp-passport-pair');dates.append(field('date','Qabul sanasi','date'),field('date_of_birth','Tug‘ilgan sana','date'));controls.date.required=true;controls.date.value=values.date||new Date().toLocaleDateString('sv-SE');controls.date_of_birth.max=new Date().toLocaleDateString('sv-SE');controls.date_of_birth.min='1850-01-01';grid.append(dates);
  const sex=el('fieldset','qp-passport-sex');sex.append(el('legend','','Jinsi'));const radios=[];
  for(const [value,label]of [['male','Erkak'],['female','Ayol'],['unknown','Aniqlanmagan']]){const lab=el('label'),radio=el('input');radio.type='radio';radio.name='sex';radio.value=value;radio.checked=(values.sex||'unknown')===value;lab.append(radio,el('span','',label));sex.append(lab);radios.push(radio);}grid.append(sex);
  const dimensions=el('div','qp-passport-pair');
  dimensions.append(field('height','Bo‘yi, sm','number','—'),field('weight','Vazni, kg','number','—'));
  Object.assign(controls.height,{min:'50',max:'250',step:'0.1'});
  Object.assign(controls.weight,{min:'1',max:'500',step:'0.1'});
  const index=el('output','qp-passport-status');index.setAttribute('for','qp-height qp-weight');
  grid.append(dimensions,index);
  const spec=el('div','qp-passport-field'),specLabel=el('label','','Mutaxassislik'),select=el('select');select.name='specialty';select.id='qp-specialty';specLabel.htmlFor=select.id;
  for(const item of [{key:'',label:'Umumiy amaliyot'},...specialties]){const o=el('option','',item.label);o.value=item.key;select.append(o);}if(values.specialty&&![...select.options].some(o=>o.value===values.specialty)){const o=el('option','',values.specialty);o.value=values.specialty;select.append(o);}select.value=values.specialty||'';controls.specialty=select;spec.append(specLabel,select);grid.append(spec);
  grid.append(field('phone','Telefon','tel','+998 90 123 45 67',32),field('address','Manzil','text','Shahar, ko‘cha, uy',1000),field('patient_note','Bemor haqida izoh','textarea','Nimani eslab qolish kerak: bog‘lanish usuli, qo‘shimcha ma’lumot',5000),field('allergies','Allergiya / muhim qayd','textarea','Masalan: penitsillinga reaksiya. Ma’lum bo‘lmasa aniqlang.',5000));
  const message=el('p','qp-passport-status');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const save=topSave;
  form.append(head,grid,message);
  function read(){return {...Object.fromEntries(Object.entries(controls).map(([k,n])=>[k,n.value])),sex:radios.find(n=>n.checked)?.value||'unknown'};}
  function update(){title.textContent=controls.full_name.value.trim()||'Bemor F.I.O.';avatar.textContent=title.textContent.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();meta.textContent=radios.find(n=>n.checked)?.parentElement.textContent||'Pasport ma’lumotlari';const value=bmi(controls.height.value,controls.weight.value);index.textContent=value?'Tana vazni indeksi · '+value+' kg/m²':'TVI uchun bo‘y va vaznni kiriting.';onDirty?.();}
  form.addEventListener('input',update);form.addEventListener('change',update);update();
  form.onsubmit=async e=>{e.preventDefault();if(save.disabled||!form.reportValidity())return;try{const data=validate(read());save.disabled=topSave.disabled=true;message.setAttribute('role','status');message.textContent='Saqlanmoqda…';await onSave(data,read());message.textContent='Bemor pasporti saqlandi.';}catch(err){message.setAttribute('role','alert');message.textContent=err.message;}finally{save.disabled=topSave.disabled=false;}};
  return {form,read,controls,save,message,setReadOnly(readOnly){for(const n of [...Object.values(controls),...radios])n.disabled=readOnly;save.hidden=topSave.hidden=readOnly;}};
 }
 return {names,validate,render,bmi};
});
