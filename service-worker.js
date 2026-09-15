/* ════════════════════════════════════════════════════════════════
   UZMED — Service Worker (hosting uchun hamroh fayl)
   index.html HTTPS da 'service-worker.js' ni ro'yxatdan o'tkazadi.
   Bu fayl paketda yo'q edi — Netlify da 404 berardi va oflayn
   rejim ishlamasdi.

   Strategiya:
     • navigatsiya (HTML)  → network-first, keyin cache (yangilanish darrov keladi)
     • assets/*.js (RAG)   → cache-first (60 MB, statik, bir marta yuklanadi)
     • qolgani             → network-first, keyin cache
     • tashqi domenlar     → TEGILMAYDI (Gemini/OpenRouter har doim tarmoqdan)

   Kesh yozuvlari QUOTA xatosida ham javobni buzmaydi.
   ════════════════════════════════════════════════════════════════ */
'use strict';

var VERSION = 'uzmed-1.1.0';
var SHELL = VERSION + '-shell';
var DATA = VERSION + '-data';
var SHELL_URL = './index.html';

/* Kesh yozuvi hech qachon javobni buzmasin (mobil qurilmada quota tugashi mumkin) */
function safePut(cacheName, req, res) {
  try {
    caches.open(cacheName).then(function (c) {
      return c.put(req, res);
    }).catch(function () { /* quota / opaque — e'tiborsiz */ });
  } catch (e) { /* e'tiborsiz */ }
}

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== SHELL && k !== DATA) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    }).catch(function () { })
  );
});

function isRagAsset(url) {
  return url.pathname.indexOf('/assets/') === 0 && /\.js$/.test(url.pathname);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* Tashqi domenlar (Gemini API, OpenRouter, CDN) — SW aralashmaydi */
  if (url.origin !== self.location.origin) return;

  /* ── 1. Navigatsiya: network-first ───────────────────────────── */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (net) {
        if (net && net.ok) safePut(SHELL, SHELL_URL, net.clone());
        return net;
      }).catch(function () {
        return caches.match(SHELL_URL).then(function (hit) {
          return hit || new Response(
            '<!doctype html><meta charset="utf-8">' +
            '<p style="font:16px system-ui;padding:24px">UZMED oflayn keshda topilmadi. ' +
            'Internetga ulanib bir marta oching.</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  /* ── 2. Katta RAG assetlar: cache-first ──────────────────────── */
  if (isRagAsset(url)) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (net) {
          if (net && net.ok) safePut(DATA, req, net.clone());
          return net;
        });
      })
    );
    return;
  }

  /* ── 3. Qolgani: network-first ───────────────────────────────── */
  event.respondWith(
    fetch(req).then(function (net) {
      if (net && net.ok) safePut(SHELL, req, net.clone());
      return net;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || Response.error();
      });
    })
  );
});

/* Admin paneldagi "SW yangilash" tugmasi uchun */
self.addEventListener('message', function (e) {
  var d = e.data;
  if (d === 'SKIP_WAITING' || (d && d.type === 'SKIP_WAITING')) self.skipWaiting();
});
