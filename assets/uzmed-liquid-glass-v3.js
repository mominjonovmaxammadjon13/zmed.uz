/* UZMED — Liquid Glass v3 (iOS 26 uslubi) — BARCHA knopkalar uchun
   - Har qanday knopka bosilganda ustida shisha linza paydo bo'ladi: ostidagini kattalashtiradi,
     chetida yorug'likni sindiradi (Chrome/Android WebView'da haqiqiy SVG refraksiya),
     prujina bilan "nafas oladi" va yo'qoladi.
   - Tab/segment/chip guruhlarida linza oldingi faol knopkadan yangisiga uchib o'tadi,
     tezlikka qarab cho'ziladi; gorizontal aylanmaydigan guruhlarda barmoq bilan surish mumkin.
   - JOYLASHUV O'ZGARMAYDI: linza alohida position:fixed qatlamda chiziladi, knopkalarning DOM'iga,
     o'lchamiga, margin/padding/display'iga va transformiga tegilmaydi (v3.1).
   - Mavjud click handlerlar o'zgarmaydi. */
(function(){
  'use strict';
  if (window.__UZMED_LIQUID_GLASS_V3__) return;
  window.__UZMED_LIQUID_GLASS_V3__ = true;

  var NS = window.UZMEDLiquidGlass = window.UZMEDLiquidGlass || {};
  NS.version = '3.1';

  /* ---------- Sozlamalar ---------- */
  var SEL = 'button,[role="button"],[role="tab"],a.btn,.btn,input[type="button"],input[type="submit"],[onclick]';
  var SKIP = '[data-uzm-lg="off"],.uzm-lg-skip';
  var MAX_W = 560, MAX_H = 190, MIN_S = 16;  // linza faqat shu o'lchamdagi elementlarga
  var MAG = 1.16;                             // kattalashtirish
  var GX = 1.06, GY = 1.04;                   // bosilgandagi linza o'sishi
  var FLY_MS = 520, FADE_MS = 170, SETTLE_MS = 420;
  var DRAG_MIN = 8;
  var ua = navigator.userAgent || '';
  var IS_IOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var REFRACT = /Chrome\/\d+|Chromium\/\d+/.test(ua) && !IS_IOS;   // SVG backdrop refraksiya
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  if (reduce || !canAnimate) { NS.disabled = true; return; }

  /* ---------- CSS ---------- */
  var CSS = [
    '#uzm-lg-layer{position:fixed;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646;contain:layout style}',
    '.uzm-lg-lens{position:fixed;left:0;top:0;pointer-events:none;opacity:0;transform-origin:50% 50%;will-change:transform,opacity;',
    ' background:rgba(255,255,255,.035);',
    ' box-shadow:inset 0 1.2px 1px rgba(255,255,255,.85),inset 0 -1px 1px rgba(255,255,255,.30),inset 0 0 0 .75px rgba(255,255,255,.45),',
    '  inset 2.2px 0 3px -1.5px rgba(255,70,150,.40),inset -2.2px 0 3px -1.5px rgba(60,175,255,.45),',
    '  0 8px 22px rgba(12,24,48,.20),0 1.5px 4px rgba(12,24,48,.14)}',
    '.uzm-lg-lens::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;',
    ' background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 45%),radial-gradient(120% 90% at 20% 0%,rgba(255,255,255,.14),transparent 55%)}',
    '.uzm-lg-lens.uzm-lg-soft{background:rgba(255,255,255,.10);-webkit-backdrop-filter:blur(1.5px) saturate(1.8) brightness(1.06);backdrop-filter:blur(1.5px) saturate(1.8) brightness(1.06)}'
  ].join('\n');

  /* ---------- DOM (bundler DOM'ni almashtirsa ham o'zini tiklaydi) ---------- */
  var styleEl, layer, lens, defs;
  function ensureDom(){
    try{
      if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = 'uzm-lg-style-v3'; styleEl.textContent = CSS; }
      if (!styleEl.isConnected) (document.head || document.documentElement).appendChild(styleEl);
      if (!document.body) return false;
      if (!layer){
        layer = document.createElement('div'); layer.id = 'uzm-lg-layer'; layer.setAttribute('aria-hidden', 'true');
        lens = document.createElement('div'); lens.className = 'uzm-lg-lens' + (REFRACT ? '' : ' uzm-lg-soft');
        layer.appendChild(lens);
      }
      /* Qatlam va SVG filtrlar <body> dan TASHQARIDA (html ichida) turadi — ilovaning body kuzatuvchilari ularni sezmaydi */
      if (!layer.isConnected) document.documentElement.appendChild(layer);
      if (REFRACT){
        if (!defs){
          defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true');
          defs.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
          filters = {};
        }
        if (!defs.isConnected){ document.documentElement.appendChild(defs); }
      }
      return true;
    }catch(e){ console.warn('[UZMED liquid-glass]', e); return false; }
  }

  /* ---------- Refraksiya xaritasi (Chromium) ---------- */
  var filters = {}, filterCount = 0;
  function filterFor(w, h, r){
    w = Math.max(8, Math.round(w / 2) * 2); h = Math.max(8, Math.round(h / 2) * 2);
    r = Math.min(Math.round(r), h / 2, w / 2);
    var key = w + 'x' + h + 'r' + r;
    if (filters[key] && filters[key].isConnected) return filters[key].id;
    if (filterCount > 40){ while (defs.firstChild) defs.removeChild(defs.firstChild); filters = {}; filterCount = 0; }
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); if (!cx) return null;
    var img = cx.createImageData(w, h), D = img.data;
    var hw = w / 2, hh = h / 2, rim = Math.min(20, h * 0.45), rimS = Math.min(6, h * 0.14), k = 1 - 1 / MAG;
    var dxs = new Float32Array(w * h), dys = new Float32Array(w * h), maxA = 1;
    for (var j = 0; j < h; j++){
      for (var i = 0; i < w; i++){
        var px = i + 0.5 - hw, py = j + 0.5 - hh;
        var qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        var dist = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
        var idx = j * w + i;
        if (dist > 0){ continue; }
        var depth = -dist, nx, ny;
        if (qx > 0 && qy > 0){ var L = Math.sqrt(qx * qx + qy * qy) || 1; nx = (px < 0 ? -1 : 1) * qx / L; ny = (py < 0 ? -1 : 1) * qy / L; }
        else if (qx > qy){ nx = px < 0 ? -1 : 1; ny = 0; }
        else { nx = 0; ny = py < 0 ? -1 : 1; }
        var t = Math.max(0, 1 - depth / rim), e = rimS * t * t;
        var dx = -px * k - nx * e, dy = -py * k - ny * e;
        dxs[idx] = dx; dys[idx] = dy;
        if (Math.abs(dx) > maxA) maxA = Math.abs(dx);
        if (Math.abs(dy) > maxA) maxA = Math.abs(dy);
      }
    }
    var S = maxA * 2 + 2;
    var CH = Math.min(0.03, 0.7 / maxA);            // xromatik farq: chetda ~0.7px dan oshmaydi
    for (var n = 0; n < w * h; n++){
      D[n * 4] = Math.round(128 + dxs[n] / S * 255);
      D[n * 4 + 1] = Math.round(128 + dys[n] / S * 255);
      D[n * 4 + 2] = 128; D[n * 4 + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    var url = cv.toDataURL('image/png');
    var id = 'uzm-lg-f-' + key;
    var NSV = 'http://www.w3.org/2000/svg';
    var f = document.createElementNS(NSV, 'filter');
    f.setAttribute('id', id);
    [['x', 0], ['y', 0], ['width', w], ['height', h], ['filterUnits', 'userSpaceOnUse'], ['primitiveUnits', 'userSpaceOnUse'], ['color-interpolation-filters', 'sRGB']]
      .forEach(function(a){ f.setAttribute(a[0], a[1]); });
    var fi = document.createElementNS(NSV, 'feImage');
    [['x', 0], ['y', 0], ['width', w], ['height', h], ['preserveAspectRatio', 'none'], ['result', 'map']].forEach(function(a){ fi.setAttribute(a[0], a[1]); });
    fi.setAttribute('href', url);
    fi.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
    f.appendChild(fi);
    /* Xromatik aberratsiya: R/G/B kanallar biroz farqli kuch bilan siljiydi (markazda 0, chetda ~1px) */
    [['r', 1 - CH, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
     ['g', 1.00, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
     ['b', 1 + CH, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']].forEach(function(c){
      var dm = document.createElementNS(NSV, 'feDisplacementMap');
      dm.setAttribute('in', 'SourceGraphic'); dm.setAttribute('in2', 'map');
      dm.setAttribute('scale', (S * c[1]).toFixed(2));
      dm.setAttribute('xChannelSelector', 'R'); dm.setAttribute('yChannelSelector', 'G');
      dm.setAttribute('result', 'd' + c[0]);
      var cm = document.createElementNS(NSV, 'feColorMatrix');
      cm.setAttribute('in', 'd' + c[0]); cm.setAttribute('type', 'matrix'); cm.setAttribute('values', c[2]);
      cm.setAttribute('result', c[0]);
      f.appendChild(dm); f.appendChild(cm);
    });
    var b1 = document.createElementNS(NSV, 'feBlend');
    b1.setAttribute('in', 'r'); b1.setAttribute('in2', 'g'); b1.setAttribute('mode', 'screen'); b1.setAttribute('result', 'rg');
    var b2 = document.createElementNS(NSV, 'feBlend');
    b2.setAttribute('in', 'rg'); b2.setAttribute('in2', 'b'); b2.setAttribute('mode', 'screen'); b2.setAttribute('result', 'rgb');
    var sat = document.createElementNS(NSV, 'feColorMatrix');
    sat.setAttribute('in', 'rgb'); sat.setAttribute('type', 'saturate'); sat.setAttribute('values', '1.18');
    f.appendChild(b1); f.appendChild(b2); f.appendChild(sat);
    defs.appendChild(f);
    filters[key] = f; filterCount++;
    return id;
  }

  /* ---------- Prujina egri chizig'i ---------- */
  function spring(ms, zeta, w){
    var N = 36, T = ms / 1000, out = [], wd = w * Math.sqrt(1 - zeta * zeta), prev = 0;
    for (var k = 0; k <= N; k++){
      var t = k / N * T;
      var p = k === N ? 1 : 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
      out.push({ o:k / N, p:p, v:k ? (p - prev) / (T / N) : 0 });
      prev = p;
    }
    return out;
  }
  var FLY = spring(FLY_MS, 0.66, 15);
  var SETTLE = spring(SETTLE_MS, 0.5, 18);

  /* ---------- Yordamchilar ---------- */
  function rectOf(el){ var r = el.getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height, cx:r.left + r.width / 2, cy:r.top + r.height / 2 }; }
  function onScreen(r){ return r.w > 0 && r.h > 0 && r.x + r.w > 0 && r.y + r.h > 0 && r.x < innerWidth && r.y < innerHeight; }
  function radiusOf(el, r){
    var cs = getComputedStyle(el), v = parseFloat(cs.borderTopLeftRadius) || 0;
    if (/%/.test(cs.borderTopLeftRadius)) v = Math.min(r.w, r.h) * v / 100;
    return Math.max(Math.min(v, r.h / 2, r.w / 2), Math.min(10, r.h / 2));
  }
  function isActive(el){
    var c = el.classList;
    return c.contains('active') || c.contains('is-active') || c.contains('selected') || c.contains('current') ||
      el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true' ||
      (el.getAttribute('aria-current') && el.getAttribute('aria-current') !== 'false');
  }
  function kindOf(el){ return el.tagName + '|' + ((el.className && el.className.baseVal == null ? String(el.className) : '').trim().split(/\s+/)[0] || '') + '|' + (el.getAttribute('role') || ''); }
  function eligible(el){
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    if (el.closest(SKIP) || el.closest('#uzm-lg-layer')) return false;
    if (el.matches('input:not([type=button]):not([type=submit]),textarea,select,[contenteditable="true"]')) return false;
    return true;
  }
  function findGroup(el){
    var par = el.parentElement; if (!par) return null;
    var kind = kindOf(el), items = [], prev = null, r0 = rectOf(el);
    for (var i = 0; i < par.children.length; i++){
      var c = par.children[i];
      if (c !== el && (!c.matches(SEL) || kindOf(c) !== kind)) continue;
      var r = c.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (Math.abs(r.top - r0.y) > 8) continue;              // faqat bir qatordagilar
      items.push(c);
      if (c !== el && isActive(c)) prev = c;
    }
    if (items.length < 2) return null;
    var hasActive = prev || isActive(el) || par.getAttribute('role') === 'tablist';
    if (!hasActive) return null;
    return { par:par, items:items, prev:prev, scroll:par.scrollWidth > par.clientWidth + 2 };
  }

  /* ---------- Linza holati ---------- */
  var L = { on:false, w:0, h:0, r:0, anims:[], x:0, y:0, sx:1, sy:1 };
  function cancel(){ L.anims.forEach(function(a){ try{ a.cancel(); }catch(_){} }); L.anims = []; }
  function base(w, h, r){
    L.w = w; L.h = h; L.r = r;
    lens.style.width = w + 'px'; lens.style.height = h + 'px'; lens.style.borderRadius = r + 'px';
    lens.classList.toggle('uzm-lg-soft', !REFRACT || w * h > 110000);   // katta kartalarga yumshoq shisha (refraksiyasiz)
    if (REFRACT && w * h <= 110000){
      var id = filterFor(w, h, r);
      var v = id ? 'url(#' + id + ')' : 'blur(1.5px) saturate(1.8)';
      lens.style.backdropFilter = v; lens.style.webkitBackdropFilter = v;
    } else { lens.style.backdropFilter = ''; lens.style.webkitBackdropFilter = ''; }
  }
  function T(cx, cy, sx, sy){
    return 'translate(' + (cx - L.w / 2).toFixed(2) + 'px,' + (cy - L.h / 2).toFixed(2) + 'px) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
  }
  function setNow(cx, cy, sx, sy, op){
    lens.style.transform = T(cx, cy, sx, sy);
    if (op != null) lens.style.opacity = op;
    L.x = cx; L.y = cy; L.sx = sx; L.sy = sy;
  }
  function stretch(speed){ var s = 1 + Math.min(speed / 2600, 0.26); return [s, 1 - (s - 1) * 0.5]; }

  /* Paydo bo'lish (rect ustida) */
  function appear(r, rad){
    cancel();
    base(r.w, r.h, rad);
    setNow(r.cx, r.cy, GX, GY, 1);
    L.on = true;
    L.anims.push(lens.animate([
      { opacity:0, transform:T(r.cx, r.cy, 0.86, 0.86) },
      { opacity:1, transform:T(r.cx, r.cy, GX, GY) }
    ], { duration:180, easing:'cubic-bezier(.2,.9,.3,1.25)' }));
  }
  /* Yo'qolish */
  function vanish(fast){
    if (!L.on) return;
    cancel();
    var a = lens.animate([
      { opacity:1, transform:T(L.x, L.y, L.sx, L.sy) },
      { opacity:0, transform:T(L.x, L.y, L.sx * 0.94, L.sy * 0.94) }
    ], { duration:fast ? 110 : FADE_MS, easing:'ease-out', fill:'forwards' });
    L.anims.push(a);
    lens.style.opacity = '0';
    L.on = false;
  }
  /* Joyida prujina bilan "nafas" va yo'qolish (oddiy knopka) */
  function settle(){
    if (!L.on) return;
    cancel();
    var kf = [], total = SETTLE_MS + FADE_MS, m = SETTLE_MS / total;
    var fx = L.sx, fy = L.sy;
    SETTLE.forEach(function(f){
      var sx = fx + (1 - fx) * f.p, sy = fy + (1 - fy) * f.p;
      kf.push({ offset:f.o * m, opacity:1, transform:T(L.x, L.y, sx, sy) });
    });
    kf.push({ offset:1, opacity:0, transform:T(L.x, L.y, 0.95, 0.95) });
    var a = lens.animate(kf, { duration:total, easing:'linear', fill:'forwards' });
    L.anims.push(a);
    lens.style.opacity = '0';
    L.on = false;
  }
  /* A rect'dan B rect'ga uchish (guruhlar) */
  function fly(A, B, radB){
    cancel();
    if (!L.on && !A) A = B;
    var fromX = L.on ? L.x : A.cx, fromY = L.on ? L.y : A.cy;
    var fromW = L.on ? L.w * L.sx / GX : A.w, fromH = L.on ? L.h * L.sy / GY : A.h;
    base(B.w, B.h, radB);
    var dX = B.cx - fromX, dY = B.cy - fromY, dist = Math.sqrt(dX * dX + dY * dY);
    var total = FLY_MS + FADE_MS, m = FLY_MS / total, kf = [];
    FLY.forEach(function(f){
      var cx = fromX + dX * f.p, cy = fromY + dY * f.p;
      var w = fromW + (B.w - fromW) * f.p, h = fromH + (B.h - fromH) * f.p;
      var st = stretch(Math.abs(f.v * dist));
      kf.push({ offset:f.o * m, opacity:1, transform:T(cx, cy, Math.max(.3, w / B.w) * GX * st[0], Math.max(.3, h / B.h) * GY * st[1]) });
    });
    kf.push({ offset:1, opacity:0, transform:T(B.cx, B.cy, 0.95, 0.95) });
    var a = lens.animate(kf, { duration:total, easing:'linear', fill:'forwards' });
    L.anims.push(a);
    L.x = B.cx; L.y = B.cy; L.sx = 0.95; L.sy = 0.95;
    lens.style.opacity = '0';
    L.on = false;
  }

  /* ---------- Bosish holati ---------- */
  var P = null, suppress = { until:0, par:null };
  /* v3.1: ilova knopkasiga HECH QANDAY animatsiya/transform berilmaydi — ayrim ekranlar (masalan doktor sarlavhasi)
     joylashuvni JS bilan knopka oʻlchamidan hisoblaydi, siqilish uni 2px surib qoʻyardi. Bosish hissini linza beradi. */
  function pressScale(){}
  function unpress(){}

  document.addEventListener('pointerdown', function(e){
    try{
      if (e.button) return;
      var el = e.target && e.target.closest && e.target.closest(SEL);
      if (!eligible(el)) return;
      if (!ensureDom()) return;
      var r = rectOf(el);
      if (r.w < MIN_S || r.h < MIN_S) return;
      pressScale(el, r);
      var lensOk = true, small = r.w <= MAX_W && r.h <= MAX_H;
      var g = small ? findGroup(el) : null;
      P = { el:el, id:e.pointerId, x0:e.clientX, y0:e.clientY, lx:e.clientX, lt:performance.now(), v:0,
            drag:false, dead:false, g:g, lens:lensOk, r:r, rad:radiusOf(el, r) };
      if (!lensOk) return;
      var start = r, startRad = P.rad;
      if (g && g.prev){
        var pr = rectOf(g.prev);
        if (onScreen(pr)){ start = pr; startRad = radiusOf(g.prev, pr); }
      }
      appear(start, startRad);
      if (g && !g.scroll && g.par.style.touchAction === ''){
        g.par.style.touchAction = 'pan-y';             // keyingi surishlar uchun (joylashuvga ta'sir yo'q)
      }
    }catch(err){ console.warn('[UZMED liquid-glass]', err); }
  }, { capture:true, passive:true });

  document.addEventListener('pointermove', function(e){
    var p = P; if (!p || e.pointerId !== p.id || p.dead) return;
    var dx = e.clientX - p.x0, dy = e.clientY - p.y0;
    if (!p.drag){
      if (Math.abs(dx) < DRAG_MIN && Math.abs(dy) < DRAG_MIN) return;
      if (p.g && !p.g.scroll && p.lens && Math.abs(dx) > Math.abs(dy)){
        p.drag = true;
        var gr = p.g.par.getBoundingClientRect();
        p.minX = gr.left + L.w / 2 + 2; p.maxX = gr.right - L.w / 2 - 2;
      } else {
        p.dead = true; unpress(p.el); vanish(true);     // aylantirish (scroll) boshlandi
        return;
      }
    }
    var now = performance.now(), dt = Math.max(1, now - p.lt);
    p.v = p.v * 0.6 + ((e.clientX - p.lx) / dt * 1000) * 0.4; p.lx = e.clientX; p.lt = now;
    cancel();
    var st = stretch(Math.abs(p.v));
    var x = Math.max(p.minX, Math.min(p.maxX, e.clientX));
    setNow(x, L.y, GX * st[0], GY * st[1], 1);
    L.on = true;
  }, { capture:true, passive:true });

  function nearestIn(items, x){
    var best = 0, bd = 1e9;
    items.forEach(function(it, k){ var r = it.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd){ bd = d; best = k; } });
    return items[best];
  }
  document.addEventListener('pointerup', function(e){
    var p = P; P = null;
    if (!p || e.pointerId !== p.id) return;
    unpress(p.el);
    if (p.dead || !p.lens) return;
    try{
      if (p.drag){
        var target = nearestIn(p.g.items, e.clientX), tr = rectOf(target);
        fly({ cx:L.x, cy:L.y, w:L.w, h:L.h }, tr, radiusOf(target, tr));
        suppress.until = Date.now() + 450; suppress.par = p.g.par;
        if (target !== p.el || !isActive(target)){
          suppress.until = 0;
          target.click();                                  // mavjud handler ishlaydi
          suppress.until = Date.now() + 450;
        }
        return;
      }
      if (p.g && p.g.prev && p.g.prev !== p.el){
        var r = rectOf(p.el);
        fly(null, r, radiusOf(p.el, r));
      } else {
        settle();
      }
    }catch(err){ console.warn('[UZMED liquid-glass]', err); vanish(true); }
  }, { capture:true, passive:true });

  document.addEventListener('pointercancel', function(e){
    var p = P; P = null;
    if (!p) return;
    unpress(p.el); vanish(true);
  }, { capture:true, passive:true });

  /* Surishdan keyingi brauzer "click"ini yutish (faqat o'sha guruh ichida) */
  document.addEventListener('click', function(e){
    if (Date.now() < suppress.until && suppress.par && suppress.par.contains(e.target)){
      e.stopImmediatePropagation(); e.preventDefault();
    }
  }, true);

  /* Aylantirish: faqat bosilgan knopkaning oʻzi joyidan siljisa linza yashiriladi
     (boshqa konteynerlarning aylanishi yoki silliq scroll qoldigʻi taʼsir qilmaydi).
     Markaz solishtiriladi — "scale" siqilishi markazni oʻzgartirmaydi. */
  window.addEventListener('scroll', function(){
    if (!P || P.drag || P.dead) return;
    var r = P.el.getBoundingClientRect();
    if (Math.abs(r.left + r.width / 2 - P.r.cx) > 4 || Math.abs(r.top + r.height / 2 - P.r.cy) > 4){
      P.dead = true; unpress(P.el); vanish(true);
    }
  }, { capture:true, passive:true });

  /* Aylanmaydigan tab guruhlariga oldindan touch-action:pan-y (birinchi surish ham ishlashi uchun) */
  var scanT = 0;
  function scan(){
    try{
      var act = document.querySelectorAll('.active,.is-active,.selected,[aria-selected="true"],[aria-pressed="true"],[role="tablist"]>*');
      for (var i = 0; i < act.length && i < 400; i++){
        var el = act[i];
        if (!el.matches(SEL)) continue;
        var g = findGroup(el);
        if (g && !g.scroll && g.par.style.touchAction === '') g.par.style.touchAction = 'pan-y';
      }
    }catch(_){}
  }
  function scheduleScan(){ clearTimeout(scanT); scanT = setTimeout(function(){ (window.requestIdleCallback || setTimeout)(scan); }, 1200); }
  var mo = null;
  function startObserver(){
    if (mo || !document.body) return;
    mo = new MutationObserver(scheduleScan);
    mo.observe(document.body, { childList:true, subtree:true });
    scheduleScan();
  }

  var tries = 0;
  (function boot(){
    if (ensureDom()){ startObserver(); return; }
    if (++tries < 60) setTimeout(boot, 250);
  })();
  /* Bundler documentElement'ni almashtirsa — kuzatuvchini qayta ulash */
  setTimeout(function(){ if (mo && !layer.isConnected){ try{ mo.disconnect(); }catch(_){} mo = null; ensureDom(); startObserver(); } }, 4000);

  NS.stop = function(){ if (mo) mo.disconnect(); cancel(); };
})();