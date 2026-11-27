(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.UzmedCalcValidation=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var empty=function(v){return v==null||(typeof v==='string'&&!v.trim());};
function fail(label,text,field){var error=new Error(label+': '+text);error.code='UZMED_CALCULATOR_INPUT';if(field)error.field=field;throw error;}
function bool(v,label,field){if(v===true||v===1||v==='1'||v==='true')return true;if(v===false||v===0||v==='0'||v==='false'||empty(v))return false;return fail(label,'faqat ha yoki yo‘q qiymatini tanlang.',field);}
function validate(item,kind,raw,id){
var out={},fields=kind==='score'?item.f:item.inputs;
if(!Array.isArray(fields))throw new Error('Kalkulyator maydonlari aniqlanmadi.');
fields.forEach(function(f){
var key=f.k,label=f.label||f.lbl||key,type=kind==='score'?f.t:f.type,v=raw[key],optional=(id==='ag'&&key==='alb');
if(type==='chk'){out[key]=bool(v,label,key);return;}
if(type==='sel'){
var opts=kind==='score'?f.o:f.opts,values=(opts||[]).map(function(o){return String(o[kind==='score'?1:0]);});
var unused=(id==='ag'&&key==='albU'&&empty(raw.alb));
if(empty(v)&&unused&&values.length)v=values[0];
if(empty(v)||values.indexOf(String(v))<0)fail(label,'ro‘yxatdagi qiymatni tanlang.',key);
out[key]=String(v);return;
}
if(empty(v)){if(optional){out[key]=undefined;return;}fail(label,'qiymatni kiriting.',key);}
if(typeof v==='boolean'||typeof v==='object')fail(label,'son kiriting.',key);
var num=Number(v);
if(!Number.isFinite(num))fail(label,'chekli son kiriting.',key);
var zeroAllowed=key==='age'||(id==='osm'&&(key==='glu'||key==='urea'));
if(zeroAllowed?num<0:num<=0)fail(label,zeroAllowed?'manfiy bo‘lmagan son kiriting.':'noldan katta son kiriting.',key);
out[key]=num;
});
if(id==='cg'||id==='ckdepi'){if(out.age<18||out.age>120)fail('Yosh','ushbu formula 18–120 yoshdagi kattalar uchun.','age');}
if(id==='framingham'&&(out.age<30||out.age>74))fail('Yosh','ushbu model 30–74 yosh uchun.','age');
if(id==='chadsvasc'&&out.age>=130)fail('Yosh','130 yoshdan kichik qiymat kiriting.','age');
if(id==='parkland'&&out.tbsa>100)fail('Kuyish maydoni','0 dan katta va 100% dan oshmagan qiymat kiriting.','tbsa');
if(id==='map'&&out.sbp<out.dbp)fail('Qon bosimi','sistolik bosim diastolik bosimdan kichik bo‘lmasin.','sbp');
return out;
}
function post(id,v,result,raw){
if(id==='bmi'){var age=raw&&(typeof raw.age==='number'||typeof raw.age==='string')?Number(raw.age):NaN;if(!Number.isFinite(age)||age<18||age>120){result.badge={text:'Yoshga mos klinik talqin talab qilinadi',cls:'warn'};result.extra=result.extra||[];result.extra.push({label:'Talqin chegarasi',value:'Yosh tasdiqlanmagan yoki bemor bola. Kattalar vazn toifasi qo‘llanmaydi; bolada yosh va jinsga mos WHO o‘sish ko‘rsatkichi kerak.'});}}
if(id==='ag'){var ag=v.na-v.cl-v.hco3,hasAlb=Number.isFinite(v.alb),assessed=hasAlb?ag+2.5*(4-(v.albU==='gl'?v.alb/10:v.alb)):ag;result.badge={text:(hasAlb?'Albuminga tuzatilgan AG: ':'AG: ')+(assessed<8?'past (<8)':assessed>12?'yuqori (>12)':'me’yor (8–12)'),cls:assessed<8?'warn':assessed>12?'bad':'ok'};}
if(id==='qtc'){var q=v.qt/Math.sqrt(60/v.hr),limit=v.sex==='f'?470:450,border=v.sex==='f'?450:430;if(q<=limit)result.badge=q>border?{text:'Chegaraviy QTc',cls:'warn'}:{text:'Normal QTc',cls:'ok'};}
if(id==='chadsvasc'){var nonSex=(v.age>=75?2:v.age>=65?1:0)+['chf','htn','dm','vasc'].reduce(function(s,k){return s+(v[k]==='1'?1:0);},0)+(v.stroke==='1'?2:0);if(nonSex===0)result.badge={text:'Past xavf (jinsning o‘zi xavf omili emas)',cls:'ok'};else if(nonSex===1)result.badge={text:'O‘rtacha xavf — individual klinik baholash',cls:'warn'};}
if(id==='epi'){var dose=Math.min(.01*v.wt,.5),text=String(Number(dose.toPrecision(6)));result.primary.value=text;if(Array.isArray(result.extra)&&result.extra[0])result.extra[0].value=text+' mL';}
if(id==='cna'){var g=v.gluU==='mgdl'?v.glu:v.glu*18;if(g<=100){result.extra=result.extra||[];result.extra.push({label:'Izoh',value:'Giperglikemiya bo‘lmagani uchun natriyga tuzatish kiritilmadi.'});}}
if(id==='sofa')result.risk='A’zolar faoliyati buzilishi balli. Sepsisni baholashda infeksiya gumoni va boshlang‘ich ballga nisbatan o‘zgarish hisobga olinadi; individual o‘lim xavfi bu ballning o‘zidan aniqlanmaydi.';
if(id==='heart')result.risk=result.score<=3?'Past xavf. Chiqarish qarori EKG, troponin tekshiruvlari va klinik baholashdan keyin beriladi.':result.score<=6?'O‘rtacha xavf. Klinik baholash va tegishli kuzatuv talab qilinadi.':'Yuqori xavf. Shoshilinch klinik baholash kerak; invaziv davolash ballning o‘zi bilan belgilanmaydi.';
if(id==='qsofa'&&result.score<2)result.risk='qSOFA 2 dan past; sepsisni inkor qilmaydi. Klinik baholashni davom ettiring.';
return result;
}
function assertResult(result,kind){
if(!result||result.err||result.error)throw new Error((result&&(result.err||result.error))||'Hisoblash natijasi olinmadi.');
if(kind==='score'&&!Number.isFinite(Number(result.score)))throw new Error('Chekli ball olinmadi. Kiritilgan qiymatlarni tekshiring.');
[result.primary].concat(result.extra||[]).filter(Boolean).forEach(function(row){if(/\b(?:NaN|Infinity)\b/.test(String(row.value)))throw new Error('Chekli natija olinmadi. Kiritilgan qiymatlarni tekshiring.');});
return result;
}
function wrap(item,kind,explicitId){
if(item.__uzmedValidated)return item;
var id=explicitId||item.id||item.key||item.k;
if(!id||typeof item.run!=='function')throw new Error('Kalkulyator identifikatori yoki funksiyasi aniqlanmadi.');
var original=item.run;
item.run=function(raw){var v=validate(item,kind,raw||{},id),runValues=v;if(id==='cna'&&(v.gluU==='mgdl'?v.glu:v.glu*18)<=100)runValues=Object.assign({},v,{glu:v.gluU==='mgdl'?100:100/18});var result=assertResult(original.call(this,runValues),kind);return assertResult(post(id,v,result,raw),kind);};
Object.defineProperty(item,'__uzmedValidated',{value:true});return item;
}
return {wrap:wrap,validate:validate};
}));
