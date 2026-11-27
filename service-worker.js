/* UZMED 2026.09.17 — versioned offline cache, scoped to this application. */
'use strict';
var BASE=new URL('./',self.location.href);
var PREFIX='uzmed-'+encodeURIComponent(BASE.pathname)+'-';
var VERSION=PREFIX+'2026-10-12-files-v21-1';
var SHELL=VERSION+'-shell', DATA=VERSION+'-data';
var SHELL_URL=new URL('index.html',BASE).href;
// Keep first installation lightweight: ~50MB of medical data downloads only when used.
var CORE=['assets/calc-validation.js','assets/reference-search.js'];
function store(name,request,response){return caches.open(name).then(function(c){return c.put(request,response);}).catch(function(){/* A full disk must not break the current response. */});}
function lookup(name,request){return caches.open(name).then(function(c){return c.match(request);});}
self.addEventListener('install',function(event){
 event.waitUntil((async function(){
  // Install only tiny support files; never bulk-prefetch atlases or RAG databases.
  for(var i=0;i<CORE.length;i++){
   var url=new URL(CORE[i],BASE).href;
   var r=await fetch(new Request(url,{cache:'reload'}));
   if(!r.ok)throw new Error('UZMED offline preparation incomplete');
   var cache=await caches.open(DATA);
   await cache.put(url,r);
  }
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',function(event){
 event.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){var ours=k.indexOf(PREFIX)===0||(BASE.pathname==='/'&&/^uzmed-(?:1\.1\.0|2026-09-17-clinical-1)-(shell|data)$/.test(k));return ours&&k!==SHELL&&k!==DATA;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(event){
 var req=event.request;if(req.method!=='GET')return;
 var url=new URL(req.url);if(url.origin!==BASE.origin||url.pathname.indexOf(BASE.pathname)!==0)return;
 if(req.headers&&req.headers.has('authorization')||/[?&](?:key|token|api_key|apikey|access_token|secret|password)=/i.test(url.search))return;
 // A selected Telegram section is network-only; never store it as the ordinary offline home.
 if(req.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname)&&url.searchParams.get('telegram_miniapp')==='1'&&['qabul','patients','bemorlar'].includes(url.searchParams.get('section'))){event.respondWith(fetch(req,{cache:'no-store'}));return;}
 if(req.mode==='navigate'){
  if(url.pathname!==BASE.pathname&&url.pathname!==new URL('index.html',BASE).pathname)return;
  event.respondWith((async function(){
   try{var r=await fetch(req);if(r.ok){
    // Avoid rewriting the entire ~24MB app on every navigation.
    // The first network navigation retains one offline copy for this release.
    var cached=await lookup(SHELL,SHELL_URL);
    if(!cached)event.waitUntil(store(SHELL,SHELL_URL,r.clone()));
    return r;
   }var hit=await lookup(SHELL,SHELL_URL);return hit||r;}
   catch(e){return await lookup(SHELL,SHELL_URL)||new Response('<!doctype html><html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UZMED — oflayn</title><body style="font:16px system-ui;padding:32px;line-height:1.6"><h1>Internetga ulaning</h1><p>UZMED bu qurilmada hali saqlanmagan. Internetga ulanib ilovani bir marta to‘liq oching.</p><button onclick="location.reload()">Qayta urinish</button></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});}
  })());return;
 }
 // Only large, intentionally versioned static knowledge files use cache-first.
 // Ordinary JS must be network-first or redesigned admin/UI code stays stale.
 var isData=/\/assets\/(?:uzmed-image-kb-data|uzmed-rag-data|uzmed-273-grounding)\.js$/.test(url.pathname)||/\/assets\/uzmed-static-v20\/[a-f0-9]{24}\.(?:json|html|js|css|woff2?|svg|png|jpg)$/.test(url.pathname);
 if(isData){event.respondWith((async function(){var c=await caches.open(DATA),hit=await c.match(req);if(hit)return hit;var r=await fetch(req);if(r.ok)event.waitUntil(store(DATA,req,r.clone()));return r;})());return;}
 // Never cache API responses or credential-bearing endpoints.
 if(url.pathname.indexOf(new URL('assets/',BASE).pathname)!==0)return;
 if(!/\.(css|js|woff2?|png|jpe?g|webp|svg|ico)$/.test(url.pathname))return;
 event.respondWith(fetch(req).then(function(r){if(r.ok)event.waitUntil(store(SHELL,req,r.clone()));return r;}).catch(function(){return lookup(SHELL,req).then(function(hit){return hit||Response.error();});}));
});
self.addEventListener('message',function(e){if(e.data==='SKIP_WAITING'||e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
