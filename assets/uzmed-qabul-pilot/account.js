'use strict';
(function(W,D){
 let host=W,subject='',blocked=false;
 try{if(W.parent!==W&&W.parent.location.origin===W.location.origin)host=W.parent;}catch{}
 if(host===W&&!W.UZMEDAuth){const target=new URL('/',W.location.href);target.search=W.location.search;target.searchParams.set('section','qabul');target.searchParams.set('telegram_miniapp','1');target.hash=W.location.hash;W.location.replace(target.href);return;}
 function identity(){const s=host.UZMEDAuth?.getState?.();return s?.loggedIn?String(s.user?.id||''):'';}
 function assertAccount(id){if(blocked||!id||identity()!==id)throw Error('Akkaunt o‘zgardi. Qabul oynasini qayta oching.');}
 async function api(kind,id,method='GET',value){
  const user=identity();assertAccount(user);if(!subject)subject=user;
  const token=await host.UZMEDAuth?.getAccessToken();assertAccount(user);if(!token)throw Error('Shaxsiy shablonlar uchun UZMED akkauntiga kiring.');
  const response=await fetch('/api/core/entry/templates'+(id?'/'+encodeURIComponent(id):'')+'?kind='+encodeURIComponent(kind),{method,headers:{Authorization:'Bearer '+token,...(value?{'Content-Type':'application/json'}:{})},...(value?{body:JSON.stringify(value)}:{}),cache:'no-store',credentials:'omit',redirect:'error'});
  assertAccount(user);if(!response.ok)throw Error(response.status===401?'UZMED akkauntiga qayta kiring.':'Shablonni serverda saqlash yoki yuklash imkoni bo‘lmadi. Qayta urinib ko‘ring.');
  const data=await response.json();assertAccount(user);return data;
 }
 function changed(){const id=identity();if(subject&&id!==subject){blocked=true;D.body.replaceChildren();const p=D.createElement('p');p.textContent='Akkaunt o‘zgardi. Yangi akkaunt uchun qabul oynasini qayta oching.';D.body.append(p);}else if(id)subject=id;}
 subject=identity();host.addEventListener('uzmed:auth-change',changed);host.addEventListener('storage',changed);
 W.QabulAccount={list:async kind=>(await api(kind)).templates,save:async(kind,value)=>(await api(kind,value.id,'PUT',value)).template,remove:(kind,id)=>api(kind,id,'DELETE')};
})(window,document);
