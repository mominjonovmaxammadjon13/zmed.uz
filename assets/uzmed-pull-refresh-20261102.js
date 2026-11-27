/* UZMED Pull-to-Refresh v1 — 2026-11-02.
   Touch-only, authenticated-only, read-only data refresh; never reload clinical drafts. */
(function (W, D) {
  'use strict';
  if (W.UZMEDPullRefresh) return;
  const VERSION = '20261102-v1';
  const registry = new Map();
  const LIMIT = 118, THRESHOLD = 78;
  let start = null, active = false, busy = false, surface = null, priorTranslate = '', timer = null;
  const reduced = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => (W.matchMedia ? W.matchMedia('(pointer: coarse)').matches : 'ontouchstart' in W) && W.innerWidth <= 1024;
  const auth = () => {
    try {
      const s = W.UZMEDAuth?.getState?.();
      return Boolean(s?.loggedIn && s?.user?.id);
    } catch (_) { return false; }
  };
  const visible = n => {
    if (!n || n.hidden || !n.isConnected) return false;
    const cs = W.getComputedStyle(n);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && n.getClientRects().length > 0;
  };
  const overlayOpen = () => {
    if (D.body?.classList.contains('uz-auth-locked')) return true;
    const login = D.getElementById('uzmedAuthOverlay');
    if (visible(login)) return true;
    return Boolean(D.querySelector('.ubh-visit-mode.active, .modal.show, .modal.active, [role="dialog"][aria-modal="true"]:not([hidden])') &&
      [...D.querySelectorAll('.ubh-visit-mode.active, .modal.show, .modal.active, [role="dialog"][aria-modal="true"]:not([hidden])')].some(visible));
  };
  const currentScreen = () => D.querySelector('.screens > .screen.active, .screen.active');
  const block = target => {
    if (!mobile() || !auth() || busy || overlayOpen()) return true;
    if (!(target instanceof Element)) return true;
    if (target.closest('input,textarea,select,button,a,[contenteditable],[role="textbox"],[data-ptr-ignore],.up-toolbar,.up-patient-form,.ubh-visit-mode,.uz-auth-box,.uzad-sheet,.bottom-nav,.uzad-nb')) return true;
    const sc = currentScreen();
    if (sc && (sc.classList.contains('ubh-visit-mode') ||
        (sc.id === 'patients-screen' && !D.getElementById('upPatientResults')) ||
        sc.querySelector('.ubh-visit-mode, [data-uzmed-dirty="true"]'))) return true;
    if (W.UZMEDAIBackendV5?.busy || W.aiTyping) return true;
    return false;
  };
  const atTop = target => {
    if (W.scrollY > 3 || D.scrollingElement?.scrollTop > 3) return false;
    for (let p = target; p && p !== D.body; p = p.parentElement) {
      if (p.scrollTop > 3) return false;
    }
    return true;
  };
  const shell = () => D.querySelector('.phone-shell') || D.querySelector('.screens');
  const indicator = D.createElement('div');
  indicator.id = 'uzmed-ptr';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');
  indicator.setAttribute('aria-label', 'Yangilash uchun pastga torting');
  indicator.innerHTML = '<span class="uzmed-ptr-disc"><img alt="" draggable="false" src="/assets/uzmed-favicon-round-20261026-v5-192.png"><span class="uzmed-ptr-ring"></span></span><span class="uzmed-ptr-caption" id="uzmed-ptr-caption">Pastga tortib yangilang</span>';
  const css = D.createElement('style');
  css.id = 'uzmed-ptr-style';
  css.textContent = `
    @media (pointer:coarse) and (max-width:1024px) {
      html,body{overscroll-behavior-y:contain}
    }
    #uzmed-ptr{position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;z-index:2147481900;
      display:flex;align-items:center;flex-direction:column;gap:6px;min-width:142px;
      opacity:0;transform:translate3d(-50%,-86px,0) scale(.75);pointer-events:none;
      transition:transform .24s cubic-bezier(.25,1.3,.35,1),opacity .15s ease;
      will-change:transform,opacity;color:#d7eafa;font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #uzmed-ptr.uzmed-ptr-visible{opacity:1;transform:translate3d(-50%,0,0) scale(1)}
    #uzmed-ptr .uzmed-ptr-disc{position:relative;width:48px;height:48px;display:grid;place-items:center;
      background:linear-gradient(155deg,#0d2541,#071526);border:1px solid rgba(96,183,228,.44);
      border-radius:50%;box-shadow:0 8px 26px #0004,0 0 22px #16b8ef25}
    #uzmed-ptr img{width:30px;height:30px;object-fit:contain;border-radius:50%}
    #uzmed-ptr .uzmed-ptr-ring{position:absolute;inset:-3px;border-radius:50%;border:2px solid transparent;
      border-top-color:#40cfeb;border-right-color:#48a8ff;opacity:0}
    #uzmed-ptr[data-state="loading"] .uzmed-ptr-ring{opacity:1;animation:uzmed-ptr-spin .8s linear infinite}
    #uzmed-ptr .uzmed-ptr-caption{white-space:nowrap;border-radius:100px;padding:4px 9px;
      color:#f4fbff;background:rgba(5,22,42,.80);border:1px solid rgba(128,179,211,.2);text-shadow:0 1px 1px #001}
    @keyframes uzmed-ptr-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){#uzmed-ptr,#uzmed-ptr .uzmed-ptr-ring{transition:none!important;animation:none!important}}
  `;
  function boot() {
    if (!D.body || D.getElementById(indicator.id)) return;
    D.head.appendChild(css);
    D.body.appendChild(indicator);
    updateTelegram();
  }
  function setCaption(value) {
    const c = D.getElementById('uzmed-ptr-caption');
    if (c) c.textContent = value;
  }
  function shift(px, animate) {
    if (!surface) return;
    surface.style.transition = animate && !reduced ? 'translate .36s cubic-bezier(.22,1.23,.34,1)' : 'none';
    if (W.CSS?.supports?.('translate', '0 1px')) surface.style.translate = px ? '0 ' + Math.round(px) + 'px' : priorTranslate;
  }
  function reset() {
    W.clearTimeout(timer);
    start = null; active = false;
    shift(0, true);
    timer = W.setTimeout(() => {
      indicator.classList.remove('uzmed-ptr-visible');
      indicator.dataset.state = 'idle';
      if (surface) { surface.style.transition = ''; surface.style.translate = priorTranslate; }
      surface = null;
    }, reduced ? 0 : 360);
  }
  function begin(e) {
    if (!e.touches || e.touches.length !== 1 || block(e.target) || !atTop(e.target)) return;
    W.clearTimeout(timer);
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    active = false;
    surface = shell();
    priorTranslate = surface?.style.translate || '';
    indicator.dataset.state = 'pull';
  }
  function move(e) {
    if (!start || busy || !e.touches || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - start.x, dy = e.touches[0].clientY - start.y;
    if (!active && (dy < 9 || Math.abs(dx) > Math.abs(dy) * .8)) {
      if (dy < -12 || Math.abs(dx) > 18) { start = null; surface = null; }
      return;
    }
    if (!atTop(e.target) || block(e.target)) { reset(); return; }
    if (e.cancelable) e.preventDefault();
    active = true;
    const amount = Math.min(LIMIT, Math.pow(Math.max(0, dy - 6), .84) * 2.05);
    shift(amount, false);
    indicator.classList.add('uzmed-ptr-visible');
    indicator.dataset.state = 'pull';
    setCaption(amount >= THRESHOLD ? 'Qo‘yib yuboring' : 'Yangilash uchun torting');
  }
  function end() {
    if (!start || !active) { start = null; surface = null; return; }
    const amount = surface ? parseFloat(surface.style.translate?.split(' ')[1]) || 0 : 0;
    if (amount < THRESHOLD) { reset(); return; }
    start = null; active = false;
    refresh();
  }
  async function refresh() {
    if (busy || !auth()) { reset(); return; }
    busy = true;
    indicator.dataset.state = 'loading';
    indicator.classList.add('uzmed-ptr-visible');
    setCaption('Yangilanmoqda…');
    shift(50, true);
    try { W.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch (_) {}
    const tasks = [];
    const detail = Object.freeze({source:'pull-to-refresh', add: p => { if (p) tasks.push(Promise.resolve(p)); }});
    const sc = currentScreen();
    if (sc?.id === 'patients-screen' && D.getElementById('upPatientResults') && W.UZMEDPatients?.open) {
      tasks.push(Promise.resolve().then(() => W.UZMEDPatients.open()));
    } else if (sc?.id === 'uzBemorlarHub' && !sc.classList.contains('ubh-visit-mode') && W.UZMEDBemorlar?.open) {
      tasks.push(Promise.resolve().then(() => W.UZMEDBemorlar.open()));
    }
    for (const fn of registry.values()) {
      try { const value = fn({screen:sc?.id||'',source:'pull-to-refresh'}); if (value !== undefined) tasks.push(Promise.resolve(value)); } catch (e) { tasks.push(Promise.reject(e)); }
    }
    W.dispatchEvent(new CustomEvent('uzmed:pull-refresh', {detail}));
    try {
      if (tasks.length) {
        const settled = await Promise.allSettled(tasks);
        if (settled.some(x => x.status === 'rejected')) throw new Error('refresh_error');
        setCaption('Yangilandi');
      } else {
        // Unknown modules keep their current UI and drafts; no destructive document reload.
        setCaption('Sahifa tayyor');
      }
      await new Promise(resolve => W.setTimeout(resolve, reduced ? 80 : 500));
    } catch (_) {
      setCaption('Yangilanmadi. Qayta urinib ko‘ring');
      await new Promise(resolve => W.setTimeout(resolve, 900));
    } finally { busy = false; reset(); }
  }
  function isTelegram() {
    try { return !!W.Telegram?.WebApp?.initData || new URLSearchParams(W.location.search).get('telegram_miniapp') === '1' ||
      new URLSearchParams(W.location.hash.slice(1)).has('tgWebAppData'); } catch (_) { return false; }
  }
  function updateTelegram() {
    const app = W.Telegram?.WebApp;
    if (!isTelegram() || !app) return;
    try {
      if (auth() && mobile()) app.disableVerticalSwipes?.();
      else app.enableVerticalSwipes?.();
    } catch (_) {}
  }
  D.addEventListener('touchstart', begin, {passive:true, capture:true});
  D.addEventListener('touchmove', move, {passive:false, capture:true});
  D.addEventListener('touchend', end, {passive:true, capture:true});
  D.addEventListener('touchcancel', reset, {passive:true, capture:true});
  W.addEventListener('uzmed:auth-change', () => { if (!auth()) reset(); updateTelegram(); });
  W.addEventListener('pagehide', reset);
  W.UZMEDPullRefresh = Object.freeze({
    version:VERSION,
    register(name, handler) { if (typeof name !== 'string' || typeof handler !== 'function') throw new TypeError('name,handler');
      registry.set(name,handler);return () => registry.delete(name); },
    refresh, status: () => ({enabled:auth() && mobile(),busy})
  });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})(window, document);
