/* UZMED — Liquid Glass v5.2 (iOS 26 / Telegram uslubi) — iPhone-xavfsiz, hamma uchun
   v4 dagi xato: iPhone Safari (WebKit ContentChangeObserver) teginish paytida yangi "bosiladigan" element
   (button/a/input...) ko'rinib qolsa, click'ni bekor qiladi. v4 linza ichiga knopkalarning aynan nusxasini qo'yardi.
   v5 qoidalari:
   1) Linza ichidagi nusxa faqat bosilmaydigan <div>/<span>/<img>/<svg> dan quriladi (knopka, havola, input YO'Q),
      hech qanday hodisa ishlovchisi, onclick, href, role, tabindex, contenteditable yo'q.
   2) Teginish davomida <=400ms li setTimeout qo'yilmaydi (iOS ularni kutadi); faqat requestAnimationFrame.
   3) CSS transition ishlatilmaydi (faqat Web Animations).
   4) Juda katta elementlarga linza chiqmaydi.
   5) v5.1: hamma uchun doim yoqilgan (yoqib-o'chirish yo'q). Faqat tizimda "harakatni kamaytirish" yoqilgan bo'lsa ishlamaydi.
   6) v5.2: linza ichidagi matn knopkadagidek o'rtada; linza tagi orqa fon rangida (ikki qavat matn ko'rinmaydi);
      guruhdagi faol bo'lmagan elementlar linza ostida ko'k bo'ladi; barmoq ushlab turilsa linza 8 soniyagacha turadi.
   Joylashuv o'zgarmaydi: qatlam <html> ichida, <body> dan tashqarida; ilova elementlariga tegilmaydi. */
(function(){
  'use strict';
  if (window.__UZMED_LIQUID_GLASS_V5__) return;
  window.__UZMED_LIQUID_GLASS_V5__ = true;

  /* ---------- Doim yoqilgan (sinov rejimi olib tashlandi) ---------- */
  try{ localStorage.removeItem('uzm_lg_test'); }catch(_){}   /* eski sinov belgisini tozalash */
  var NS = window.UZMEDLiquidGlass = window.UZMEDLiquidGlass || {};
  NS.version = '5.4'; NS.enabled = true;

  /* ---------- Sozlamalar ---------- */
  var SEL = 'button,[role="button"],[role="tab"],a.btn,.btn,input[type="button"],input[type="submit"],[onclick]';
  /* v5.4: yon menyu, modal oynalar va matn kiritish joylari linzasiz (u yerda linza qotib qolardi) */
  var SKIP = '[data-uzm-lg="off"],.uzm-lg-skip,#uzmedSidebar,#uzmedSidebarBackdrop,[aria-modal="true"],dialog,.qrx-overlay';
  /* v5.3: katta kartalar (bosh sahifa menyusi) linzadan chiqarildi — faqat knopka/tab o'lchamidagilar */
  var MAX_W = 420, MAX_H = 100, MIN_S = 16, MAX_AREA_FRAC = 0.30;
  var MAG = 1.16, RIM_MAG = 1.42, GX = 1.07, GY = 1.05;
  var FLY_MS = 500, FADE_MS = 150, SETTLE_MS = 300, DRAG_MIN = 8, MAX_NODES = 220;
  var ACCENT = '#4c8dff';
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  if (reduce || !canAnimate) { NS.disabled = true; return; }

  /* ---------- CSS (transition yo'q) ---------- */
  var CSS = [
    '#uzm-lg-layer{position:fixed;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646}',
    '#uzm-lg-layer *{pointer-events:none!important;cursor:default!important;-webkit-user-select:none!important;user-select:none!important}',
    '.uzm-lg-lens{position:fixed;left:0;top:0;opacity:0;overflow:hidden;transform-origin:50% 50%;will-change:transform,opacity;',
    ' background:rgba(128,140,160,.10);-webkit-backdrop-filter:blur(9px) saturate(1.7);backdrop-filter:blur(9px) saturate(1.7);',
    ' box-shadow:inset 0 1.2px 1px rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.16),inset 0 0 0 .75px rgba(255,255,255,.28),',
    '  inset 2.5px 0 3px -1.5px rgba(255,70,150,.45),inset -2.5px 0 3px -1.5px rgba(60,175,255,.5),',
    '  inset 0 2.5px 3px -2px rgba(255,210,90,.22),0 8px 22px rgba(0,0,0,.32),0 1.5px 4px rgba(0,0,0,.2)}',
    '.uzm-lg-sheen{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:inherit;z-index:3;',
    ' background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0) 42%),radial-gradient(120% 90% at 18% 0%,rgba(255,255,255,.10),transparent 55%)}',
    '.uzm-lg-copy{position:absolute!important;left:0!important;top:0!important;margin:0!important;transform-origin:0 0!important;will-change:transform}',
    '.uzm-lg-copy *{animation:none!important;transition:none!important}',
    '.uzm-lg-rim{z-index:2;-webkit-mask-image:radial-gradient(ellipse closest-side at 50% 50%,transparent 64%,#000 97%);mask-image:radial-gradient(ellipse closest-side at 50% 50%,transparent 64%,#000 97%)}',
    '.uzm-lg-tint,.uzm-lg-tint *{color:' + ACCENT + '!important;-webkit-text-fill-color:' + ACCENT + '!important}'
  ].join('\n');

  /* ---------- DOM (o'zini tiklaydi; faqat bosilmaydigan div'lar) ---------- */
  var styleEl, layer, lens, sheen;
  function ensureDom(){
    try{
      if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = 'uzm-lg-style-v5'; styleEl.textContent = CSS; }
      if (!styleEl.isConnected) (document.head || document.documentElement).appendChild(styleEl);
      if (!document.body) return false;
      if (!layer){
        layer = document.createElement('div'); layer.id = 'uzm-lg-layer'; layer.setAttribute('aria-hidden', 'true');
        lens = document.createElement('div'); lens.className = 'uzm-lg-lens';
        sheen = document.createElement('div'); sheen.className = 'uzm-lg-sheen';
        lens.appendChild(sheen);
        layer.appendChild(lens);
      }
      if (!layer.isConnected) document.documentElement.appendChild(layer);
      if (mo && moBody !== document.body){ try{ mo.disconnect(); }catch(_){} mo = null; startObserver(); }   /* bundler body ni almashtirgan bo'lsa */
      return true;
    }catch(e){ console.warn('[UZMED liquid-glass]', e); return false; }
  }

  /* ---------- Bosilmaydigan "ko'rinish nusxasi" ---------- */
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
    'opacity','box-shadow','vertical-align','object-fit','transform','transform-origin','visibility',
    '-webkit-line-clamp','-webkit-box-orient','filter','list-style-type','float','clear'];
  var SVG_PROPS = ['fill','stroke','stroke-width','opacity','color'];
  /* bosiladigan yoki faol teglar -> oddiy div/span */
  var CONVERT = { BUTTON:1, A:1, INPUT:1, SELECT:1, TEXTAREA:1, LABEL:1, SUMMARY:1, DETAILS:1, IFRAME:1, VIDEO:1, AUDIO:1,
                  OBJECT:1, EMBED:1, CANVAS:1, FORM:1, OPTION:1, DIALOG:1, AREA:1, MAP:1 };
  var DROP = { SCRIPT:1, STYLE:1, TEMPLATE:1, NOSCRIPT:1, LINK:1, META:1 };
  var budget = 0;
  function styleString(cs, list){
    var s = '';
    for (var i = 0; i < list.length; i++){ var v = cs.getPropertyValue(list[i]); if (v !== '') s += list[i] + ':' + v + ';'; }
    return s;
  }
  function copySvg(src, tint, itemColor){
    var c = src.cloneNode(true);
    var so = [src].concat([].slice.call(src.querySelectorAll('*')));
    var co = [c].concat([].slice.call(c.querySelectorAll('*')));
    for (var i = 0; i < co.length; i++){
      var el = co[i];
      for (var a = el.attributes.length - 1; a >= 0; a--){
        var nm = el.attributes[a].name.toLowerCase();
        if (/^on/.test(nm) || nm === 'id' || nm === 'tabindex' || nm === 'role' || nm === 'href' && el.tagName.toLowerCase() === 'a') el.removeAttribute(el.attributes[a].name);
      }
      if (so[i] && so[i].nodeType === 1){
        var cs = getComputedStyle(so[i]), s = styleString(cs, SVG_PROPS);
        if (tint){
          ['fill','stroke'].forEach(function(p){ var v = cs.getPropertyValue(p); if (v && v === itemColor) s += p + ':' + ACCENT + ';'; });
          if (cs.getPropertyValue('color') === itemColor) s += 'color:' + ACCENT + ';';
        }
        if (i === 0) s += styleString(cs, ['display','width','height','vertical-align','margin-top','margin-right','margin-bottom','margin-left','flex-shrink','flex-grow','position','top','left','right','bottom']);
        el.setAttribute('style', s);
      }
    }
    budget += co.length;
    return c;
  }
  function build(src, tintSet, itemColor){
    if (budget++ > MAX_NODES) return null;
    if (src.nodeType === 3) return document.createTextNode(src.nodeValue);
    if (src.nodeType !== 1) return null;
    var tag = src.tagName;
    if (DROP[tag]) return null;
    var cs = getComputedStyle(src);
    if (cs.display === 'none') return null;
    var tint = tintSet && tintSet.indexOf(src) >= 0 ? true : !!itemColor;
    var myColor = itemColor || (tint ? cs.color : null);
    if (src.namespaceURI === 'http://www.w3.org/2000/svg') return copySvg(src, tint, myColor);
    var out;
    if (tag === 'IMG'){
      out = document.createElement('img');
      if (src.currentSrc || src.src) out.src = src.currentSrc || src.src;
      out.alt = '';
      out.setAttribute('style', styleString(cs, PROPS));
      return out;
    }
    var inline = /^inline/.test(cs.display);
    out = document.createElement(CONVERT[tag] ? (inline && tag !== 'BUTTON' ? 'span' : 'div') : (tag === 'SPAN' || tag === 'B' || tag === 'I' || tag === 'STRONG' || tag === 'EM' || tag === 'SMALL' || tag === 'SUP' || tag === 'SUB' ? tag.toLowerCase() : 'div'));
    var cls = src.getAttribute('class');
    if (cls) out.setAttribute('class', cls);              /* ::before/::after ikonkalari uchun */
    var st = styleString(cs, PROPS), host = out;
    /* <button> ichidagi matn brauzerda vertikal o'rtada turadi; <div> da esa yo'q. Shuni takrorlaymiz. */
    var btnLike = tag === 'BUTTON' || (tag === 'INPUT' && /^(button|submit|reset)$/i.test(src.type || ''));
    var centerIt = btnLike && !/flex|grid|contents|none/.test(cs.display);
    if (centerIt) st += 'display:' + (inline ? 'inline-flex' : 'flex') + ';flex-direction:row;align-items:center;justify-content:center;';
    out.setAttribute('style', st);
    if (centerIt){
      host = document.createElement('div');
      host.setAttribute('style', 'display:block;width:100%;min-width:0;margin:0;padding:0;text-align:' + (cs.textAlign || 'center') + ';');
      out.appendChild(host);
    }
    if (tint && !itemColor) out.classList.add('uzm-lg-tint');
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'){
      var txt = tag === 'SELECT' ? (src.options && src.selectedIndex >= 0 ? src.options[src.selectedIndex].text : '') : (src.value || src.placeholder || '');
      if (src.type === 'password') txt = txt.replace(/./g, '•');
      host.textContent = txt;
      return out;
    }
    if (tag === 'IFRAME' || tag === 'VIDEO' || tag === 'AUDIO' || tag === 'CANVAS' || tag === 'OBJECT' || tag === 'EMBED') return out;
    for (var n = src.firstChild; n; n = n.nextSibling){
      var c = build(n, tintSet, tint ? myColor : null);
      if (c) host.appendChild(c);
      if (budget > MAX_NODES) break;
    }
    return out;
  }
  function countNodes(el){ return el.getElementsByTagName('*').length + 1; }
  function makeCopy(src, tintSet){
    budget = 0;
    var r = src.getBoundingClientRect();
    var ow = src.offsetWidth || r.width, oh = src.offsetHeight || r.height;
    var c = build(src, tintSet, null);
    if (!c || c.nodeType !== 1) return null;
    ['width:' + ow + 'px','height:' + oh + 'px','transform:none','position:absolute','left:0','top:0','right:auto','bottom:auto','margin:0','opacity:1','visibility:visible']
      .forEach(function(d){ var i = d.indexOf(':'); c.style.setProperty(d.slice(0, i), d.slice(i + 1), 'important'); });
    c.classList.add('uzm-lg-copy');
    c.setAttribute('aria-hidden', 'true');
    return { el:c, x:r.left + (r.width - ow) / 2, y:r.top + (r.height - oh) / 2, sl:src.scrollLeft || 0, st:src.scrollTop || 0 };
  }
  /* Xavfsizlik tekshiruvi: linza ichida bosiladigan narsa qolmaganiga ishonch hosil qilish */
  var UNSAFE = 'button,a,input,select,textarea,label,summary,iframe,video,audio,object,embed,[onclick],[href],[tabindex],[contenteditable],[role]';
  function isSafe(node){ return !(node.matches && node.matches(UNSAFE)) && !(node.querySelector && node.querySelector(UNSAFE)); }

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
    if (el.querySelector && el.querySelector('input:not([type=button]):not([type=submit]),textarea,select,[contenteditable="true"]')) return false;
    return true;
  }
  /* Element orqasidagi ko'rinadigan fon rangi (ota elementlar ranglarini qo'shib hisoblash) */
  function parseRGBA(v){
    var m = /rgba?\(([^)]+)\)/.exec(v || ''); if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    if (p.length < 3 || p.some(isNaN)) return null;
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function bgBehind(el){
    var layers = [], e = el && el.parentElement;
    while (e && layers.length < 24){
      var c = parseRGBA(getComputedStyle(e).backgroundColor);
      if (c && c[3] > 0.02){ layers.push(c); if (c[3] >= 0.97) break; }
      e = e.parentElement;
    }
    if (!layers.length || layers[layers.length - 1][3] < 0.97){
      var root = parseRGBA(getComputedStyle(document.documentElement).backgroundColor) || [0, 0, 0, 0];
      layers.push(root[3] >= 0.5 ? [root[0], root[1], root[2], 1] : (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? [12, 16, 24, 1] : [245, 247, 250, 1]));
    }
    var r = 0, g = 0, b = 0;
    for (var i = layers.length - 1; i >= 0; i--){ var a = layers[i][3]; r = layers[i][0] * a + r * (1 - a); g = layers[i][1] * a + g * (1 - a); b = layers[i][2] * a + b * (1 - a); }
    return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',.9)';
  }
  function transparentBg(el){
    var m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor || '');
    if (!m) return true;
    var p = m[1].split(','); return p.length === 4 && parseFloat(p[3]) < 0.25;
  }
  function findGroup(el){
    var par = el.parentElement; if (!par) return null;
    var kind = kindOf(el), items = [], prev = null, r0 = rectOf(el);
    for (var i = 0; i < par.children.length; i++){
      var c = par.children[i];
      if (c !== el && (!c.matches(SEL) || kindOf(c) !== kind)) continue;
      var r = c.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || Math.abs(r.top - r0.y) > 8) continue;
      items.push(c);
      if (c !== el && isActive(c)) prev = c;
    }
    if (items.length < 2) return null;
    if (!(prev || isActive(el) || par.getAttribute('role') === 'tablist')) return null;
    return { par:par, items:items, prev:prev, scroll:par.scrollWidth > par.clientWidth + 2 };
  }

  /* ---------- Linza ---------- */
  var L = { on:false, w:0, h:0, x:0, y:0, sx:1, sy:1, anims:[], layers:[] };
  function cancel(){ L.anims.forEach(function(a){ try{ a.cancel(); }catch(_){} }); L.anims = []; }
  function clearLayers(){ L.layers.forEach(function(x){ if (x.el.parentNode) x.el.parentNode.removeChild(x.el); }); L.layers = []; }
  function size(w, h, r){ L.w = w; L.h = h; lens.style.width = w + 'px'; lens.style.height = h + 'px'; lens.style.borderRadius = r + 'px'; }
  function buildLayers(src, tintSet){
    clearLayers();
    if (!src || countNodes(src) > MAX_NODES) return;
    [[MAG, ''], [RIM_MAG, 'uzm-lg-rim']].forEach(function(cfg){
      var c = makeCopy(src, tintSet);
      if (!c) return;
      if (cfg[1]) c.el.classList.add(cfg[1]);
      if (!isSafe(c.el)) return;                          /* qat'iy qoida: bosiladigan narsa bo'lsa, qo'yilmaydi */
      lens.insertBefore(c.el, sheen);
      if (c.sl) c.el.scrollLeft = c.sl;
      if (c.st) c.el.scrollTop = c.st;
      L.layers.push({ el:c.el, s:cfg[0], x:c.x, y:c.y });
    });
  }
  function LT(cx, cy, sx, sy){ return 'translate(' + (cx - L.w / 2).toFixed(2) + 'px,' + (cy - L.h / 2).toFixed(2) + 'px) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')'; }
  function IT(ly, cx, cy){ var s = ly.s; return 'translate(' + (L.w / 2 + s * (ly.x - cx)).toFixed(2) + 'px,' + (L.h / 2 + s * (ly.y - cy)).toFixed(2) + 'px) scale(' + s + ')'; }
  function setNow(cx, cy, sx, sy, op){
    lens.style.transform = LT(cx, cy, sx, sy);
    if (op != null) lens.style.opacity = op;
    L.layers.forEach(function(ly){ ly.el.style.transform = IT(ly, cx, cy); });
    L.x = cx; L.y = cy; L.sx = sx; L.sy = sy;
  }
  function stretch(speed){ var s = 1 + Math.min(speed / 2600, 0.26); return [s, 1 - (s - 1) * 0.5]; }
  function endAnim(a){ a.onfinish = function(){ if (!L.on){ cancel(); clearLayers(); if (lens){ lens.style.opacity = '0'; lens.style.transform = 'translate(-9999px,-9999px)'; } } }; }

  /* v5.4: linza ko'rinib turgan har kadrda tekshiruv — element siljisa, yopilsa yoki ustini menyu/oyna qoplasa
     (iOS bunda pointerup/pointercancel yubormaydi) linza darhol yo'qoladi. Faqat requestAnimationFrame. */
  var mon = 0, last = null;
  function monitor(){
    mon = 0;
    var visible = L.on || L.anims.length;
    if (!visible){ last = null; return; }
    var t = P && !P.drag ? P : (!P ? last : null);
    if (t && t.el && gone(t.el, t.r)){
      if (P){ P.dead = true; P = null; clearTimeout(watchdog); }
      last = null; hardReset(); return;
    }
    mon = requestAnimationFrame(monitor);
  }
  function watch(){ if (!mon) mon = requestAnimationFrame(monitor); }
  function appear(r, rad, src, tintSet){
    cancel();
    size(r.w, r.h, rad);
    try{ lens.style.backgroundColor = src ? bgBehind(src) : ''; }catch(_){ lens.style.backgroundColor = ''; }
    buildLayers(src, tintSet);
    setNow(r.cx, r.cy, GX, GY, 1);
    L.on = true;
    L.anims.push(lens.animate([
      { opacity:0, transform:LT(r.cx, r.cy, 0.86, 0.86) },
      { opacity:1, transform:LT(r.cx, r.cy, GX, GY) }
    ], { duration:170, easing:'cubic-bezier(.2,.9,.3,1.25)' }));
  }
  function vanish(fast){
    if (!L.on && !L.anims.length) return;
    var x = L.x, y = L.y, sx = L.sx, sy = L.sy, op = parseFloat(getComputedStyle(lens).opacity) || 1;
    cancel();
    var a = lens.animate([
      { opacity:op, transform:LT(x, y, sx, sy) },
      { opacity:0, transform:LT(x, y, sx * 0.93, sy * 0.93) }
    ], { duration:fast ? 90 : FADE_MS, easing:'ease-out', fill:'forwards' });
    L.anims.push(a); lens.style.opacity = '0'; L.on = false; endAnim(a);
  }
  function settle(){
    if (!L.on) return;
    cancel();
    var kf = [], total = SETTLE_MS + FADE_MS, m = SETTLE_MS / total, fx = L.sx, fy = L.sy, x = L.x, y = L.y;
    SETTLE.forEach(function(f){ kf.push({ offset:f.o * m, opacity:1, transform:LT(x, y, fx + (1 - fx) * f.p, fy + (1 - fy) * f.p) }); });
    kf.push({ offset:1, opacity:0, transform:LT(x, y, 0.95, 0.95) });
    var a = lens.animate(kf, { duration:total, easing:'linear', fill:'forwards' });
    L.anims.push(a); L.sx = 0.95; L.sy = 0.95; lens.style.opacity = '0'; L.on = false; endAnim(a);
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
    lens.style.opacity = '0'; L.on = false; endAnim(a);
  }

  /* ---------- Hodisalar (teginish davomida qisqa taymer YO'Q) ---------- */
  var P = null, suppress = { until:0, par:null }, watchdog = 0;
  function kick(){ clearTimeout(watchdog); watchdog = setTimeout(function(){ if (P){ P = null; vanish(true); } }, 2500); }  /* 8000ms > 400ms: iOS kuzatmaydi; ushlab turganda linza turadi */

  document.addEventListener('pointerdown', function(e){
    try{
      if (e.button) return;
      var el = e.target && e.target.closest && e.target.closest(SEL);
      if (!eligible(el) || !ensureDom()) return;
      var r = rectOf(el);
      if (r.w < MIN_S || r.h < MIN_S || !onScreen(r)) return;
      if (r.w > MAX_W || r.h > MAX_H || r.w * r.h > innerWidth * innerHeight * MAX_AREA_FRAC) return;   /* katta elementga linza yo'q */
      var g = findGroup(el);
      P = { el:el, id:e.pointerId, x0:e.clientX, y0:e.clientY, lx:e.clientX, lt:performance.now(), v:0,
            drag:false, dead:false, g:g, r:r, rad:radiusOf(el, r) };
      var start = r, startRad = P.rad, src = el, tintSet = null;
      if (g){
        if (countNodes(g.par) <= MAX_NODES){
          src = g.par;
          /* Telegram kabi: linza ostidagi faol bo'lmagan (shaffof fonli) elementlar ko'k bo'ladi */
          tintSet = g.items.filter(function(it){ return !isActive(it); });
        }
        if (g.prev){ var pr = rectOf(g.prev); if (onScreen(pr)){ start = pr; startRad = radiusOf(g.prev, pr); } }
      }
      appear(start, startRad, src, tintSet);
      last = P; watch();
      if (g && !g.scroll && g.par.style.touchAction === '') g.par.style.touchAction = 'pan-y';
      kick();
    }catch(err){ console.warn('[UZMED liquid-glass]', err); }
  }, { capture:true, passive:true });

  document.addEventListener('pointermove', function(e){
    var p = P; if (!p || e.pointerId !== p.id || p.dead) return;
    var dx = e.clientX - p.x0, dy = e.clientY - p.y0;
    if (!p.drag){
      if (Math.abs(dx) < DRAG_MIN && Math.abs(dy) < DRAG_MIN) return;
      if (p.g && !p.g.scroll && Math.abs(dx) > Math.abs(dy) * 1.5){
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
      var el = p.el, r0 = p.r, checks = 0;
      (function chk(){
        if (L.on || !L.anims.length) return;
        if (gone(el, r0)){ vanish(true); return; }
        if (++checks < 8) requestAnimationFrame(chk);
      })();
    }catch(err){ console.warn('[UZMED liquid-glass]', err); vanish(true); }
  }
  document.addEventListener('pointerup', function(e){
    var p = P; if (!p || e.pointerId !== p.id) return;
    P = null; release(p, e.clientX);
  }, { capture:true, passive:true });
  document.addEventListener('pointercancel', function(){ P = null; vanish(true); }, { capture:true, passive:true });
  /* v5.4: iOS barmoq harakatini menyu surish/aylantirishga aylantirsa pointermove kelmaydi — touchmove bilan ham tekshiriladi */
  document.addEventListener('touchmove', function(e){
    var p = P, t = e.touches && e.touches[0]; if (!p || p.drag || p.dead || !t) return;
    if (Math.abs(t.clientX - p.x0) >= DRAG_MIN || Math.abs(t.clientY - p.y0) >= DRAG_MIN){
      if (p.g && !p.g.scroll && Math.abs(t.clientX - p.x0) > Math.abs(t.clientY - p.y0) * 1.5) return;   /* guruh ichida surish — pointermove boshqaradi */
      p.dead = true; P = null; clearTimeout(watchdog); vanish(true);
    }
  }, { capture:true, passive:true });
  /* iOS zaxira: pointerup kelmasa — taymersiz, keyingi kadrda */
  document.addEventListener('touchend', function(e){
    var t = e.changedTouches && e.changedTouches[0];
    requestAnimationFrame(function(){ if (P){ var p = P; P = null; release(p, t ? t.clientX : p.lx); } });
  }, { capture:true, passive:true });
  document.addEventListener('touchcancel', function(){ requestAnimationFrame(function(){ if (P){ P = null; vanish(true); } }); }, { capture:true, passive:true });

  /* v5.3: linza "qotib qolmasin" — sahifa almashganda/qaytganda (iOS bfcache) to'liq tozalash */
  function hardReset(){
    try{ P = null; clearTimeout(watchdog); cancel(); clearLayers(); L.on = false;
      if (lens){ lens.style.opacity = '0'; lens.style.transform = 'translate(-9999px,-9999px)'; } }catch(_){}
  }
  NS.reset = hardReset;
  window.addEventListener('pagehide', hardReset);
  window.addEventListener('pageshow', hardReset);
  window.addEventListener('popstate', hardReset);
  window.addEventListener('hashchange', hardReset);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) hardReset(); });
  document.addEventListener('focusin', function(e){
    var t = e.target;
    if (t && t.matches && t.matches('input,textarea,select,[contenteditable="true"]')){ P = null; vanish(true); }
  }, true);
  if (window.visualViewport) visualViewport.addEventListener('resize', function(){ if (!(P && P.drag)){ P = null; vanish(true); } });
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

  /* Aylanmaydigan tab guruhlariga touch-action:pan-y (surish birinchi urinishda ham ishlashi uchun) */
  var scanT = 0, mo = null, moBody = null;
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
  function startObserver(){ if (mo || !document.body) return; moBody = document.body; mo = new MutationObserver(scheduleScan); mo.observe(document.body, { childList:true, subtree:true }); scheduleScan(); }

  var tries = 0;
  (function boot(){
    if (ensureDom()){ startObserver(); return; }
    if (++tries < 60) setTimeout(boot, 250);
  })();
  setTimeout(function(){ if (mo && layer && !layer.isConnected){ try{ mo.disconnect(); }catch(_){} mo = null; ensureDom(); startObserver(); } }, 4000);

  NS.stop = function(){ if (mo) mo.disconnect(); cancel(); clearLayers(); };
  NS.isSafe = isSafe;
})();