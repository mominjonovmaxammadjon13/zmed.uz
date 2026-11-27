/* UZMED Clinical Color System v1 · 2026-11-25
 * Faqat ko'rinish: rang qatlami CSS faylini <head> ga ulaydi.
 * Tarmoq so'rovi (CSS faylidan tashqari), auth, marshrut, ma'lumot — YO'Q.
 * Bundler document.documentElement.replaceWith() dan keyin <head> yangilanadi,
 * shuning uchun havola cheklangan vaqt davomida qayta tekshiriladi.
 */
(function (W, D) {
  'use strict';
  if (W.__UZMED_COLOR_SYSTEM_V1__) return;
  W.__UZMED_COLOR_SYSTEM_V1__ = true;

  var ID = 'uzmedColorSystemV1';
  var HREF = '/assets/uzmed-color-system-v1.css?v=3';
  var MAX_TRIES = 120;          // 120 x 250ms = 30 soniya, keyin to'xtaydi
  var tries = 0, timer = 0;

  /* Mavzu: asosiy ilovada data-uzmed-ux-theme / body.dark-mode ishlatiladi.
     Alohida sahifalar (Tibbiy huquq, Qabul hujjati) uchun saqlangan
     tanlovni html[data-uzc-theme] ga ko'chiramiz — faqat o'qish. */
  function syncTheme() {
    try {
      var root = D.documentElement;
      if (!root || root.hasAttribute('data-uzmed-ux-theme')) return;
      var t = '';
      try { t = W.localStorage.getItem('uzmed_theme') || W.localStorage.getItem('uzmed.ux.theme') || ''; } catch (e) {}
      if (t !== 'dark' && t !== 'light') {
        t = (W.matchMedia && W.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      }
      if (root.getAttribute('data-uzc-theme') !== t) root.setAttribute('data-uzc-theme', t);
    } catch (e) {}
  }

  /* Alohida sahifalarni belgilash (CSS shu atribut bo'yicha ishlaydi). */
  function markPage() {
    try {
      var path = String(W.location && W.location.pathname || '');
      var page = path.indexOf('/uzmed-qabul-pilot/') >= 0 ? 'qabul'
               : path.indexOf('/uzmed-tibbiy-huquq/') >= 0 ? 'legal' : '';
      if (page && D.documentElement.getAttribute('data-uzc-page') !== page) {
        D.documentElement.setAttribute('data-uzc-page', page);
      }
    } catch (e) {}
  }

  function ensure() {
    try {
      var head = D.head || D.getElementsByTagName('head')[0];
      if (!head) return false;
      var link = D.getElementById(ID);
      if (!link) {
        link = D.createElement('link');
        link.id = ID;
        link.rel = 'stylesheet';
        link.href = HREF;
        head.appendChild(link);
      }
      syncTheme();
      markPage();
      return true;
    } catch (e) {
      try { console.warn('[UZMED color-system]', e); } catch (_) {}
      return false;
    }
  }


  /* Tahlil (AI) moduli shadow DOM ichida ishlaydi va har renderda innerHTML
     yangilanadi. Shuning uchun constructable stylesheet (adoptedStyleSheets)
     ishlatamiz — u innerHTML dan keyin ham saqlanadi. Ranglar var(--uzc-doc-*,
     asl_rang) ko'rinishida: o'zgaruvchi faqat kunduzgi rejimda beriladi. */
  var DOC_CSS = ':host{color:var(--uzc-doc-ink,#edf3ff)!important}\n.w{background:var(--uzc-doc-bg,#0d162b);border-color:var(--uzc-doc-line,#293751)}\n.top{background:var(--uzc-doc-bg2,#131e37);border-bottom-color:var(--uzc-doc-line,#303a56)}\n.brand b{color:var(--uzc-doc-ink,#fff)}\n.brand small{color:var(--uzc-doc-muted,#a3b4d6)}\n.reset{color:var(--uzc-doc-ink2,#d8e4f8);background:var(--uzc-doc-bg3,#27324b)}\n.steps{background:var(--uzc-doc-bg2,#101a31);border-bottom-color:var(--uzc-doc-line,#2c3852)}\n.step{color:var(--uzc-doc-muted,#9aaccf)}\n.step b{background:var(--uzc-doc-bg3,#2a3249);color:var(--uzc-doc-ink2,#c5d3e9)}\n.step.on{color:var(--uzc-doc-softink,#c3bdff)}\n.step.on b{color:#fff}\n.intro{background:var(--uzc-doc-intro,linear-gradient(130deg,#1e2e51,#171f36));border-color:var(--uzc-doc-line,#2c4065)}\nh2{color:var(--uzc-doc-ink,#fff)!important}\nh3{color:var(--uzc-doc-ink,#edf3ff)!important}\np{color:var(--uzc-doc-muted,#a9bad7)!important}\n.choice button{border-color:var(--uzc-doc-line2,#3d4c6a);background:var(--uzc-doc-bg2,#1a233b);color:var(--uzc-doc-ink2,#d4e0f3)}\n.choice button.sel{background:var(--uzc-doc-soft,#282d57)}\n.code{background:var(--uzc-doc-soft,#2f3557);color:var(--uzc-doc-softink,#bbc0ff)}\n.outline{background:var(--uzc-doc-bg,#18243c);border-color:var(--uzc-doc-line2,#445678);color:var(--uzc-doc-ink2,inherit)}\n.back{color:var(--uzc-doc-muted,#a5b8de)}\n.drop{border-color:var(--uzc-doc-line2,#465a7b);background:var(--uzc-doc-bg2,#15203a)}\n.hint{color:var(--uzc-doc-muted,#b0c1df)}\n.viewer{border-color:var(--uzc-doc-line2,#3b4966);background:var(--uzc-doc-viewer,#070d1a)}\n.pages button{background:var(--uzc-doc-bg3,#293553);border-color:var(--uzc-doc-line2,#43577b);color:var(--uzc-doc-ink2,inherit)}\n.controls button{border-color:var(--uzc-doc-line2,#405779);background:var(--uzc-doc-bg2,#20304b);color:var(--uzc-doc-ink2,#dbe7fa)}\n.controls button.sel{background:var(--uzc-doc-soft,#473a93);color:var(--uzc-doc-softink,#dbe7fa)}\n.check{border-color:var(--uzc-doc-line2,#435375);background:var(--uzc-doc-bg2,#18253f);color:var(--uzc-doc-ink2,#d7e3f4)}\n.check textarea{background:var(--uzc-doc-field,#0f1b31);color:var(--uzc-doc-ink,#edf4ff);border-color:var(--uzc-doc-line2,#506486)}\n.error{background:var(--uzc-doc-err-bg,#4d2631);border-color:var(--uzc-doc-err-line,#bb6068);color:var(--uzc-doc-err-ink,#ffeced)}\n.spinner{border-color:var(--uzc-doc-line2,#404769)}\n.tag{background:var(--uzc-doc-bg3,#263451);color:var(--uzc-doc-ink2,#d9e5f9);border-color:var(--uzc-doc-line2,#435576)}\n.report{background:var(--uzc-doc-bg2,#101b30);color:var(--uzc-doc-ink,#ebf3fe);border-color:var(--uzc-doc-line,#324567)}\n.facts{background:var(--uzc-doc-bg3,#182840);color:var(--uzc-doc-ink2,#c1d7f1)}\n.foot{border-top-color:var(--uzc-doc-line,#33415d);color:var(--uzc-doc-muted,#99aed1)}\n.doc-summary>div{background:var(--uzc-doc-bg2,#182741);border-color:var(--uzc-doc-line,#385276)}\n.doc-summary small{color:var(--uzc-doc-muted,#91a6c7)}\n.doc-summary strong{color:var(--uzc-doc-ink,#eff6ff)}\n.doc-result-card{background:var(--uzc-doc-bg,#111f35);border-color:var(--uzc-doc-line,#364867)}\n.doc-result-card h3{color:var(--uzc-doc-ink,#eaf2ff)}\n.doc-empty{color:var(--uzc-doc-muted,#a0b6d3);background:var(--uzc-doc-bg2,#1a2941)}\n.doc-file-row{color:var(--uzc-doc-ink2,#d6e2f9);border-bottom-color:var(--uzc-doc-line,#2b3c57)}\n.doc-file-row small{color:var(--uzc-doc-muted,#9db1d6)}\n.doc-other{color:var(--uzc-doc-ink,#e6eeff)}\n.doc-other small{color:var(--uzc-doc-muted,#a0b5d2)}\n.analysis-notice{background:var(--uzc-doc-warn-bg,#483c1b66);border-color:var(--uzc-doc-warn-line,#bca44a);color:var(--uzc-doc-warn-ink,#ffebae)}';
  var docSheet = null;
  function ensureDocShadow() {
    try {
      var host = D.getElementById('uzmed-doc-v2');
      var root = host && host.shadowRoot;
      if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet !== 'function') return;
      if (!docSheet) { docSheet = new CSSStyleSheet(); docSheet.replaceSync(DOC_CSS); }
      var list = root.adoptedStyleSheets || [];
      for (var i = 0; i < list.length; i++) if (list[i] === docSheet) return;
      root.adoptedStyleSheets = list.concat([docSheet]);
    } catch (e) {}
  }
  /* Kuzatuvchi (observer) yo'q: faqat foydalanuvchi bosganda 2 marta tekshiriladi. */
  D.addEventListener('click', function () {
    W.setTimeout(ensureDocShadow, 60);
    W.setTimeout(ensureDocShadow, 600);
  }, { capture: true, passive: true });

  function tick() {
    ensure();
    ensureDocShadow();
    if (++tries >= MAX_TRIES) { W.clearInterval(timer); timer = 0; }
  }

  ensure();
  timer = W.setInterval(tick, 250);
  D.addEventListener('DOMContentLoaded', ensure);
  W.addEventListener('load', ensure);
  W.addEventListener('pageshow', ensure);
  W.addEventListener('uzmed:auth-change', ensure);
  W.addEventListener('storage', function (e) {
    if (e && (e.key === 'uzmed_theme' || e.key === 'uzmed.ux.theme')) syncTheme();
  });

  W.UZMEDColorSystem = { version: 3, ensure: ensure, ensureDocShadow: ensureDocShadow };
})(window, document);
