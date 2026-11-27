/* UZMED — Liquid Glass v4 (iOS 26 / Telegram uslubi) — BARCHA knopkalar
   v4 o'zgarishlari:
   - Kattalashtirish endi barcha brauzerlarda bir xil (iPhone Safari ham): knopka (yoki tab guruhi)
     uslublari bilan nusxalanib, linza ichida kattalashtirib ko'rsatiladi; chetida kuchliroq sinish qatlami.
   - Bosilgan knopka ekrandan yo'qolsa/joyi o'zgarsa (menyu yopildi, ekran almashdi) linza darhol yo'qoladi.
   - Klaviatura ochilishi, fokus, sahifa yashirinishi, pointerup kelmay qolishi — linza hech qachon qotib qolmaydi.
   - JOYLASHUV O'ZGARMAYDI: linza alohida position:fixed qatlamda (<html> ichida, <body> dan tashqarida),
     ilova knopkalarining DOM'i, uslubi, transformiga tegilmaydi. Click handlerlar o'zgarmaydi. */
(function(){
  'use strict';
  if (window.__UZMED_LIQUID_GLASS_V4__) return;
  window.__UZMED_LIQUID_GLASS_V4__ = true;

  var NS = window.UZMEDLiquidGlass = window.UZMEDLiquidGlass || {};
  NS.version = '4.0';

  /* ---------- Sozlamalar ---------- */
  var SEL = 'button,[role="button"],[role="tab"],a.btn,.btn,input[type="button"],input[type="submit"],[onclick]';
  var SKIP = '[data-uzm-lg="off"],.uzm-lg-skip';
  var MAX_W = 560, MAX_H = 190, MIN_S = 16;
  var MAG = 1.16, RIM_MAG = 1.42;       // linza ichidagi va chetidagi kattalashtirish
  var GX = 1.07, GY = 1.05;             // bosilgandagi linza o'sishi
  var FLY_MS = 500, FADE_MS = 150, SETTLE_MS = 300;
  var DRAG_MIN = 8, MAX_NODES = 260;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  if (reduce || !canAnimate) { NS.disabled = true; return; }

  /* ---------- CSS ---------- */
  var CSS = [
    '#uzm-lg-layer{position:fixed;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646}',
    '.uzm-lg-lens{position:fixed;left:0;top:0;pointer-events:none;opacity:0;overflow:hidden;transform-origin:50% 50%;will-change:transform,opacity;',
    ' background:rgba(128,140,160,.10);-webkit-backdrop-filter:blur(9px) saturate(1.7);backdrop-filter:blur(9px) saturate(1.7);',
    ' box-shadow:inset 0 1.2px 1px rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.16),inset 0 0 0 .75px rgba(255,255,255,.28),',
    '  inset 2.5px 0 3px -1.5px rgba(255,70,150,.45),inset -2.5px 0 3px -1.5px rgba(60,175,255,.5),',
    '  inset 0 2.5px 3px -2px rgba(255,210,90,.22),0 8px 22px rgba(0,0,0,.32),0 1.5px 4px rgba(0,0,0,.2)}',
    '.uzm-lg-lens::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;',
    ' background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0) 42%),radial-gradient(120% 90% at 18% 0%,rgba(255,255,255,.10),transparent 55%)}',
    '.uzm-lg-clone{position:absolute!important;left:0!important;top:0!important;margin:0!important;transform-origin:0 0;pointer-events:none!important;will-change:transform}',
    '.uzm-lg-clone *{pointer-events:none!important;animation:none!important;transition:none!important}',
    '.uzm-lg-rim{z-index:2;-webkit-mask-image:radial-gradient(ellipse closest-side at 50% 50%,transparent 64%,#000 97%);mask-image:radial-gradient(ellipse closest-side at 50% 50%,transparent 64%,#000 97%)}'
  ].join('\n');

  /* ---------- DOM (o'zini tiklaydi) ---------- */
  var styleEl, layer, lens;
  function ensureDom(){
    try{
      if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = 'uzm-lg-style-v4'; styleEl.textContent = CSS; }
      if (!styleEl.isConnected) (document.head || document.documentElement).appendChild(styleEl);
      if (!document.body) return false;
      if (!layer){
        layer = document.createElement('div'); layer.id = 'uzm-lg-layer'; layer.setAttribute('aria-hidden', 'true');
        lens = document.createElement('div'); lens.className = 'uzm-lg-lens';
        layer.appendChild(lens);
      }
      if (!layer.isConnected) document.documentElement.appendChild(layer);
      return true;
    }catch(e){ console.warn('[UZMED liquid-glass]', e); return false; }
  }

  /* ---------- Nusxa (uslublar bilan) ---------- */
  var PROPS = ['display','box-sizing','width','height','min-width','min-height','max-width',
    'padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left',
    'border-top-width','border-right-width','border-bottom-width','border-left-width',
    'border-top-style','border-right-style','border-bottom-style','border-left-style',
    'border-top-color','border-right-color','border-bottom-color','border-left-color',
    'border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius',
    'background-color','background-image','background-size','background-position','background-repeat','background-clip',
    'color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','word-spacing',
    'text-align','text-transform','text-decoration-line','text-shadow','white-space','text-overflow','overflow-x','overflow-y',
    'flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','order','align-items','align-content','align-self',
    'justify-content','justify-items','row-gap','column-gap','grid-template-columns','grid-template-rows','grid-column-start',
    'grid-column-end','grid-row-start','grid-row-end','grid-auto-flow','position','top','right','bottom','left','z-index',
    'opacity','box-shadow','fill','stroke','stroke-width','vertical-align','object-fit','transform','transform-origin',
    'visibility','-webkit-text-fill-color','-webkit-line-clamp','-webkit-box-orient','filter','list-style-type','float','clear'];
  function inlineStyles(src, dst, count){
    if (count.n++ > MAX_NODES) return;
    var cs = getComputedStyle(src), s = '';
    for (var i = 0; i < PROPS.length; i++){ var v = cs.getPropertyValue(PROPS[i]); if (v !== '') s += PROPS[i] + ':' + v + ';'; }
    dst.setAttribute('style', s);
    dst.removeAttribute('id');
    for (var a = dst.attributes.length - 1; a >= 0; a--){ var nm = dst.attributes[a].name; if (/^on/i.test(nm)) dst.removeAttribute(nm); }
    var sc = src.children, dc = dst.children;
    for (var k = 0; k < sc.length && k < dc.length; k++) inlineStyles(sc[k], dc[k], count);
  }
  function countNodes(el){ return el.getElementsByTagName('*').length + 1; }
  /* src elementning nusxasi: layout o'lchami (transform'siz) va ekrandagi chap-yuqori nuqtasi */
  function makeClone(src){
    var r = src.getBoundingClientRect();
    var ow = src.offsetWidth || r.width, oh = src.offsetHeight || r.height;
    var c = src.cloneNode(true);
    inlineStyles(src, c, { n:0 });
    c.style.setProperty('width', ow + 'px', 'important');
    c.style.setProperty('height', oh + 'px', 'important');
    c.style.setProperty('transform', 'none', 'important');
    c.style.setProperty('transform-origin', '0 0', 'important');
    c.style.setProperty('position', 'absolute', 'important');
    c.style.setProperty('left', '0', 'important');
    c.style.setProperty('top', '0', 'important');
    c.style.setProperty('right', 'auto', 'important');
    c.style.setProperty('bottom', 'auto', 'important');
    c.style.setProperty('margin', '0', 'important');
    c.style.setProperty('opacity', '1', 'important');
    c.style.setProperty('visibility', 'visible', 'important');
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('inert', '');
    return { el:c, x:r.left + (r.width - ow) / 2, y:r.top + (r.height - oh) / 2, sl:src.scrollLeft || 0, st:src.scrollTop || 0 };
  }

  /* ---------- Prujina ---------- */
  function spring(ms, zeta, w){
    var N = 32, T = ms / 1000, out = [], wd = w * Math.sqrt(1 - zeta * zeta), prev = 0;
    for (var k = 0; k <= N; k++){
      var t = k / N * T;
      var p = k === N ? 1 : 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
      out.push({ o:k / N, p:p, v:k ? (p - prev) / (T / N) : 0 });
      prev = p;
    }
    return out;
  }
  var FLY = spring(FLY_MS, 0.66, 15), SETTLE = spring(SETTLE_MS, 0.55, 22);

  /* ---------- Yordamchilar ---------- */
  function rectOf(el){ var r = el.getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height, cx:r.left + r.width / 2, cy:r.top + r.height / 2 }; }
  function onScreen(r){ return r.w > 0 && r.h > 0 && r.x + r.w > 0 && r.y + r.h > 0 && r.x < innerWidth && r.y < innerHeight; }
  function radiusOf(el, r){
    var cs = getComputedStyle(el), v = parseFloat(cs.borderTopLeftRadius) || 0;
    if (/%/.test(cs.borderTopLeftRadius)) v = Math.min(r.w, r.h) * v / 100;
    return Math.max(Math.min(v, r.h / 2, r.w / 2), Math.min(12, r.h / 2));
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
      if (Math.abs(r.top - r0.y) > 8) continue;
      items.push(c);
      if (c !== el && isActive(c)) prev = c;
    }
    if (items.length < 2) return null;
    if (!(prev || isActive(el) || par.getAttribute('role') === 'tablist')) return null;
    return { par:par, items:items, prev:prev, scroll:par.scrollWidth > par.clientWidth + 2 };
  }

  /* ---------- Linza ---------- */
  var L = { on:false, w:0, h:0, x:0, y:0, sx:1, sy:1, anims:[], layers:[], src:null, endT:0 };
  function cancel(){ L.anims.forEach(function(a){ try{ a.cancel(); }catch(_){} }); L.anims = []; clearTimeout(L.endT); }
  function clearLayers(){ L.layers.forEach(function(x){ if (x.el.parentNode) x.el.parentNode.removeChild(x.el); }); L.layers = []; }
  function size(w, h, r){
    L.w = w; L.h = h;
    lens.style.width = w + 'px'; lens.style.height = h + 'px'; lens.style.borderRadius = r + 'px';
  }
  /* manba (knopka yoki tab guruhi) nusxasini linzaga joylash */
  function buildLayers(src){
    clearLayers();
    if (!src || countNodes(src) > MAX_NODES) src = null;
    if (!src) return;
    [[MAG, ''], [RIM_MAG, ' uzm-lg-rim']].forEach(function(cfg){
      var c = makeClone(src);
      c.el.classList.add('uzm-lg-clone');
      if (cfg[1]) c.el.classList.add('uzm-lg-rim');
      lens.appendChild(c.el);
      if (c.sl) c.el.scrollLeft = c.sl;
      if (c.st) c.el.scrollTop = c.st;
      L.layers.push({ el:c.el, s:cfg[0], x:c.x, y:c.y });
    });
  }
  function LT(cx, cy, sx, sy){ return 'translate(' + (cx - L.w / 2).toFixed(2) + 'px,' + (cy - L.h / 2).toFixed(2) + 'px) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')'; }
  function IT(ly, cx, cy){
    var s = ly.s;
    return 'translate(' + (L.w / 2 + s * (ly.x - cx)).toFixed(2) + 'px,' + (L.h / 2 + s * (ly.y - cy)).toFixed(2) + 'px) scale(' + s + ')';
  }
  function setNow(cx, cy, sx, sy, op){
    lens.style.transform = LT(cx, cy, sx, sy);
    if (op != null) lens.style.opacity = op;
    L.layers.forEach(function(ly){ ly.el.style.transform = IT(ly, cx, cy); });
    L.x = cx; L.y = cy; L.sx = sx; L.sy = sy;
  }
  function stretch(speed){ var s = 1 + Math.min(speed / 2600, 0.26); return [s, 1 - (s - 1) * 0.5]; }

  function appear(r, rad, src){
    cancel();
    size(r.w, r.h, rad);
    buildLayers(src);
    setNow(r.cx, r.cy, GX, GY, 1);
    L.on = true; L.src = src;
    L.anims.push(lens.animate([
      { opacity:0, transform:LT(r.cx, r.cy, 0.86, 0.86) },
      { opacity:1, transform:LT(r.cx, r.cy, GX, GY) }
    ], { duration:170, easing:'cubic-bezier(.2,.9,.3,1.25)' }));
  }
  function done(){ lens.style.opacity = '0'; L.on = false; L.endT = setTimeout(function(){ if (!L.on){ cancel(); clearLayers(); } }, 30); }
  function vanish(fast){
    if (!L.on && !L.anims.length) return;
    var x = L.x, y = L.y, sx = L.sx, sy = L.sy;
    cancel();
    var a = lens.animate([
      { opacity:parseFloat(getComputedStyle(lens).opacity) || 1, transform:LT(x, y, sx, sy) },
      { opacity:0, transform:LT(x, y, sx * 0.93, sy * 0.93) }
    ], { duration:fast ? 90 : FADE_MS, easing:'ease-out', fill:'forwards' });
    L.anims.push(a);
    lens.style.opacity = '0'; L.on = false;
    a.onfinish = function(){ if (!L.on){ cancel(); clearLayers(); } };
  }
  function settle(){
    if (!L.on) return;
    cancel();
    var kf = [], total = SETTLE_MS + FADE_MS, m = SETTLE_MS / total, fx = L.sx, fy = L.sy, x = L.x, y = L.y;
    SETTLE.forEach(function(f){ kf.push({ offset:f.o * m, opacity:1, transform:LT(x, y, fx + (1 - fx) * f.p, fy + (1 - fy) * f.p) }); });
    kf.push({ offset:1, opacity:0, transform:LT(x, y, 0.95, 0.95) });
    var a = lens.animate(kf, { duration:total, easing:'linear', fill:'forwards' });
    L.anims.push(a);
    L.sx = 0.95; L.sy = 0.95;
    lens.style.opacity = '0'; L.on = false;
    a.onfinish = function(){ if (!L.on){ cancel(); clearLayers(); } };
  }
  function fly(B, radB){
    if (!L.on) return;
    var fx = L.x, fy = L.y, fw = L.w * L.sx / GX, fh = L.h * L.sy / GY;
    cancel();
    size(B.w, B.h, radB);
    var dX = B.cx - fx, dY = B.cy - fy, dist = Math.sqrt(dX * dX + dY * dY);
    var total = FLY_MS + FADE_MS, m = FLY_MS / total, kl = [], ki = L.layers.map(function(){ return []; });
    FLY.forEach(function(f){
      var cx = fx + dX * f.p, cy = fy + dY * f.p;
      var w = fw + (B.w - fw) * f.p, h = fh + (B.h - fh) * f.p, st = stretch(Math.abs(f.v * dist));
      kl.push({ offset:f.o * m, opacity:1, transform:LT(cx, cy, Math.max(.3, w / B.w) * GX * st[0], Math.max(.3, h / B.h) * GY * st[1]) });
      L.layers.forEach(function(ly, j){ ki[j].push({ offset:f.o * m, transform:IT(ly, cx, cy) }); });
    });
    kl.push({ offset:1, opacity:0, transform:LT(B.cx, B.cy, 0.95, 0.95) });
    L.layers.forEach(function(ly, j){ ki[j].push({ offset:1, transform:IT(ly, B.cx, B.cy) }); });
    var opt = { duration:total, easing:'linear', fill:'forwards' };
    var a = lens.animate(kl, opt);
    L.anims.push(a);
    L.layers.forEach(function(ly, j){ L.anims.push(ly.el.animate(ki[j], opt)); });
    L.x = B.cx; L.y = B.cy; L.sx = 0.95; L.sy = 0.95;
    lens.style.transform = LT(B.cx, B.cy, 0.95, 0.95);
    L.layers.forEach(function(ly){ ly.el.style.transform = IT(ly, B.cx, B.cy); });
    lens.style.opacity = '0'; L.on = false;
    a.onfinish = function(){ if (!L.on){ cancel(); clearLayers(); } };
  }

  /* ---------- Ko'rsatkich hodisalari ---------- */
  var P = null, suppress = { until:0, par:null }, watchdog = 0;
  function kick(){ clearTimeout(watchdog); watchdog = setTimeout(function(){ if (P){ P = null; vanish(true); } }, 2500); }

  document.addEventListener('pointerdown', function(e){
    try{
      if (e.button) return;
      var el = e.target && e.target.closest && e.target.closest(SEL);
      if (!eligible(el) || !ensureDom()) return;
      var r = rectOf(el);
      if (r.w < MIN_S || r.h < MIN_S || !onScreen(r)) return;
      var small = r.w <= MAX_W && r.h <= MAX_H;
      var g = small ? findGroup(el) : null;
      P = { el:el, id:e.pointerId, x0:e.clientX, y0:e.clientY, lx:e.clientX, lt:performance.now(), v:0,
            drag:false, dead:false, g:g, r:r, rad:radiusOf(el, r) };
      var start = r, startRad = P.rad, src = el;
      if (g){
        src = countNodes(g.par) <= MAX_NODES ? g.par : el;
        if (g.prev){ var pr = rectOf(g.prev); if (onScreen(pr)){ start = pr; startRad = radiusOf(g.prev, pr); } }
      }
      appear(start, startRad, src);
      if (g && !g.scroll && g.par.style.touchAction === '') g.par.style.touchAction = 'pan-y';
      kick();
    }catch(err){ console.warn('[UZMED liquid-glass]', err); }
  }, { capture:true, passive:true });

  document.addEventListener('pointermove', function(e){
    var p = P; if (!p || e.pointerId !== p.id || p.dead) return;
    var dx = e.clientX - p.x0, dy = e.clientY - p.y0;
    if (!p.drag){
      if (Math.abs(dx) < DRAG_MIN && Math.abs(dy) < DRAG_MIN) return;
      if (p.g && !p.g.scroll && Math.abs(dx) > Math.abs(dy)){
        p.drag = true;
        var gr = p.g.par.getBoundingClientRect();
        p.minX = gr.left + L.w / 2 + 2; p.maxX = gr.right - L.w / 2 - 2;
      } else { p.dead = true; vanish(true); return; }
    }
    kick();
    var now = performance.now(), dt = Math.max(1, now - p.lt);
    p.v = p.v * 0.6 + ((e.clientX - p.lx) / dt * 1000) * 0.4; p.lx = e.clientX; p.lt = now;
    cancel();
    var st = stretch(Math.abs(p.v)), x = Math.max(p.minX, Math.min(p.maxX, e.clientX));
    setNow(x, L.y, GX * st[0], GY * st[1], 1);
    L.on = true;
  }, { capture:true, passive:true });

  function nearestIn(items, x){
    var best = 0, bd = 1e9;
    items.forEach(function(it, k){ var r = it.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd){ bd = d; best = k; } });
    return items[best];
  }
  /* Knopka bosilgandan keyin ekrandan ketdimi / joyi o'zgardimi (menyu yopildi, ekran almashdi) */
  function gone(el, r0){
    if (!el.isConnected) return true;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return true;
    if (Math.abs(r.left + r.width / 2 - r0.cx) > 4 || Math.abs(r.top + r.height / 2 - r0.cy) > 4) return true;
    var hit = document.elementFromPoint(r0.cx, r0.cy);
    return !!(hit && !el.contains(hit) && !hit.contains(el));
  }
  function release(p, clientX){
    clearTimeout(watchdog);
    if (p.dead) return;
    try{
      if (p.drag){
        var target = nearestIn(p.g.items, clientX), tr = rectOf(target);
        fly(tr, radiusOf(target, tr));
        suppress.until = Date.now() + 450; suppress.par = p.g.par;
        if (target !== p.el || !isActive(target)){ suppress.until = 0; target.click(); suppress.until = Date.now() + 450; }
      } else if (p.g && p.g.prev && p.g.prev !== p.el){
        fly(rectOf(p.el), p.rad);
      } else {
        settle();
      }
      /* click handler ishlagach (keyingi kadrlarda) tekshiramiz: ekran o'zgargan bo'lsa linzani darhol olib tashlaymiz */
      var el = p.el, r0 = p.r, checks = 0;
      (function chk(){
        if (L.on || !L.anims.length) return;
        if (gone(el, r0)){ vanish(true); return; }
        if (++checks < 6) requestAnimationFrame(chk);
      })();
      requestAnimationFrame(function(){ if (gone(el, r0)) vanish(true); });
    }catch(err){ console.warn('[UZMED liquid-glass]', err); vanish(true); }
  }
  document.addEventListener('pointerup', function(e){
    var p = P; if (!p || e.pointerId !== p.id) return;
    P = null; release(p, e.clientX);
  }, { capture:true, passive:true });
  document.addEventListener('pointercancel', function(){ if (P){ P = null; } vanish(true); }, { capture:true, passive:true });
  /* iOS zaxira: pointerup kelmasa touchend orqali yakunlash */
  document.addEventListener('touchend', function(e){
    var t = e.changedTouches && e.changedTouches[0];
    setTimeout(function(){ if (P){ var p = P; P = null; release(p, t ? t.clientX : p.lx); } }, 60);
  }, { capture:true, passive:true });
  document.addEventListener('touchcancel', function(){ setTimeout(function(){ if (P){ P = null; vanish(true); } }, 60); }, { capture:true, passive:true });

  /* Linza qotib qolmasligi uchun: fokus (klaviatura), viewport o'zgarishi, sahifa yashirinishi */
  document.addEventListener('focusin', function(e){
    var t = e.target;
    if (t && t.matches && t.matches('input,textarea,select,[contenteditable="true"]')){ P = null; vanish(true); }
  }, true);
  if (window.visualViewport){
    visualViewport.addEventListener('resize', function(){ if (!(P && P.drag)){ P = null; vanish(true); } });
  }
  window.addEventListener('resize', function(){ P = null; vanish(true); });
  document.addEventListener('visibilitychange', function(){ if (document.hidden){ P = null; vanish(true); } });
  window.addEventListener('blur', function(){ P = null; vanish(true); });

  document.addEventListener('click', function(e){
    if (Date.now() < suppress.until && suppress.par && suppress.par.contains(e.target)){ e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  window.addEventListener('scroll', function(){
    if (P && !P.drag && !P.dead){
      var r = P.el.getBoundingClientRect();
      if (Math.abs(r.left + r.width / 2 - P.r.cx) > 4 || Math.abs(r.top + r.height / 2 - P.r.cy) > 4){ P.dead = true; vanish(true); }
      return;
    }
    if (!P && (L.on || L.anims.length)) vanish(true);
  }, { capture:true, passive:true });

  /* Aylanmaydigan tab guruhlariga oldindan touch-action:pan-y (surish birinchi urinishda ham ishlashi uchun) */
  var scanT = 0, mo = null;
  function scan(){
    try{
      var act = document.querySelectorAll('.active,.is-active,.selected,[aria-selected="true"],[aria-pressed="true"],[role="tablist"]>*');
      for (var i = 0; i < act.length && i < 400; i++){
        var el = act[i]; if (!el.matches(SEL)) continue;
        var g = findGroup(el);
        if (g && !g.scroll && g.par.style.touchAction === '') g.par.style.touchAction = 'pan-y';
      }
    }catch(_){}
  }
  function scheduleScan(){ clearTimeout(scanT); scanT = setTimeout(function(){ (window.requestIdleCallback || setTimeout)(scan); }, 1200); }
  function startObserver(){
    if (mo || !document.body) return;
    mo = new MutationObserver(scheduleScan);
    mo.observe(document.body, { childList:true, subtree:true });
    scheduleScan();
  }
  var tries = 0;
  (function boot(){ if (ensureDom()){ startObserver(); return; } if (++tries < 60) setTimeout(boot, 250); })();
  setTimeout(function(){ if (mo && layer && !layer.isConnected){ try{ mo.disconnect(); }catch(_){} mo = null; ensureDom(); startObserver(); } }, 4000);

  NS.stop = function(){ if (mo) mo.disconnect(); cancel(); clearLayers(); };
})();