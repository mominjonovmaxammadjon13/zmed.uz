/* Additive UZMED presentation/accessibility layer. No application or API state. */
(function () {
  'use strict';
  var root = document.documentElement;
  var preferenceKey = 'uzmed.ux.modern';
  var themeKey = 'uzmed.ux.theme';
  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 768px)');
  var scheduled = 0, viewportFrame = 0, overlay = null, wasOpen = false, opener = null;
  var observed = new WeakSet(), keyboardControls = new WeakSet();
  var initialFocus = true, initialDeadline = Date.now() + 3000;
  var viewportBase = window.innerHeight, themeOverride = null;

  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function enabled() { return root.getAttribute('data-uzmed-ux') === 'on'; }
  function visible(node) {
    if (!node || !node.isConnected || node.hidden) return false;
    var style = window.getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
  }
  function editable(node) {
    return node && node.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]');
  }
  function theme() {
    if (themeOverride) return themeOverride;
    var saved = read(themeKey);
    return saved === 'light' || saved === 'dark' ? saved : systemTheme.matches ? 'dark' : 'light';
  }
  function updateTheme() {
    if (!enabled()) return;
    var dark = theme() === 'dark';
    root.setAttribute('data-uzmed-ux-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-uzmed-ux-reduced-motion', reducedMotion.matches ? 'on' : 'off');
    document.querySelectorAll('.uzmed-ux-theme-toggle').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish';
      var text = dark ? '☾ Tun' : '☀ Kun';
      if (button.textContent !== text) button.textContent = text;
    });
  }
  function mountTheme(container, kind, after) {
    if (!container || document.querySelector('[data-uzmed-ux-theme-control="' + kind + '"]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'uzmed-ux-theme-toggle uzmed-ux-' + kind + '-theme';
    button.setAttribute('data-uzmed-ux-theme-control', kind);
    button.setAttribute('aria-label', 'Tungi rejim');
    button.addEventListener('click', function () {
      if (!enabled()) return;
      themeOverride = root.getAttribute('data-uzmed-ux-theme') === 'dark' ? 'light' : 'dark';
      write(themeKey, themeOverride);
      updateTheme();
    });
    if (after) container.insertAdjacentElement('afterend', button);
    else container.appendChild(button);
  }
  function enhanceLabels(container) {
    if (!container) return;
    container.querySelectorAll('button[title], input[placeholder], textarea[placeholder], select[title]').forEach(function (node) {
      if (node.hasAttribute('aria-label') || node.hasAttribute('aria-labelledby') || (node.labels && node.labels.length)) return;
      if (node.tagName === 'BUTTON' && node.textContent.trim()) return;
      var label = node.getAttribute('title') || node.getAttribute('placeholder');
      if (label) node.setAttribute('aria-label', label);
    });
    container.querySelectorAll('[onclick]').forEach(function (node) {
      if (node.matches('button, a, input, select, textarea, summary') || node.hasAttribute('onkeydown') || node.onkeydown || node.hasAttribute('tabindex')) return;
      node.setAttribute('role', 'button');
      node.tabIndex = 0;
      keyboardControls.add(node);
    });
  }
  function syncPasswordButtons() {
    ['uzAuthPassword', 'uzAuthRegPassword', 'uzAuthNewPassword'].forEach(function (id) {
      var input = document.getElementById(id), button = document.getElementById(id + 'Eye');
      if (!input || !button) return;
      var shown = input.type === 'text';
      button.setAttribute('aria-controls', id);
      button.setAttribute('aria-pressed', String(shown));
      button.setAttribute('aria-label', shown ? 'Parolni yashir' : 'Parolni ko‘rsat');
    });
  }
  function authOpen() { return overlay && overlay.getAttribute('aria-hidden') !== 'true' && visible(overlay); }
  function syncAuth() {
    var next = document.getElementById('uzmedAuthOverlay');
    if (next) { overlay = next; observe(next, true); }
    if (!overlay) return;
    var box = overlay.querySelector('.uz-auth-box');
    if (box && !box.hasAttribute('aria-labelledby') && document.getElementById('uzmedAuthTitle')) box.setAttribute('aria-labelledby', 'uzmedAuthTitle');
    if (box && !box.hasAttribute('tabindex')) box.tabIndex = -1;
    ['uzAuthMsg', 'uzAuthProfileMsg'].forEach(function (id) {
      var message = document.getElementById(id);
      if (message && !message.hasAttribute('aria-live')) message.setAttribute('aria-live', 'polite');
    });
    enhanceLabels(overlay);
    var subtitle = overlay.querySelector('.uz-auth-subtitle');
    if (subtitle && subtitle.textContent.trim() === 'Supabase orqali xavfsiz kirish') subtitle.textContent = 'Hisobingizga xavfsiz kiring';
    syncPasswordButtons();
    var open = authOpen();
    if (open && !wasOpen) {
      opener = overlay.contains(document.activeElement) ? null : document.activeElement;
      if (box && document.activeElement === document.body) box.focus({ preventScroll: true });
    } else if (!open && wasOpen && opener && opener.isConnected && (overlay.contains(document.activeElement) || document.activeElement === document.body)) {
      opener.focus({ preventScroll: true });
      opener = null;
    }
    wasOpen = open;
    var email = document.getElementById('uzAuthEmail');
    if (email && mobile.matches && initialFocus && Date.now() < initialDeadline) {
      email.removeAttribute('autofocus');
      if (open && document.activeElement === email) { email.blur(); if (box) box.focus({ preventScroll: true }); }
    }
  }
  function fixManifest() {
    document.querySelectorAll('link[rel="manifest"]').forEach(function (link) {
      var href = link.getAttribute('href') || '', repeated = window.location.origin + window.location.origin;
      if (href.indexOf(repeated + '/') === 0) link.setAttribute('href', href.slice(window.location.origin.length));
    });
  }
  function schedule() {
    if (!enabled() || scheduled) return;
    scheduled = window.requestAnimationFrame(function () { scheduled = 0; enhance(); });
  }
  function observe(node, auth) {
    if (!node || observed.has(node)) return;
    observed.add(node);
    new MutationObserver(schedule).observe(node, auth ? { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden', 'style', 'class', 'type'] } : { childList: true });
  }
  function enhance() {
    if (!enabled()) return;
    var header = document.querySelector('.header-icons'), settingsCard = document.getElementById('uzmedAuthCard');
    mountTheme(header, 'header');
    mountTheme(document.querySelector('#uzmedAuthOverlay .uz-auth-head'), 'auth');
    mountTheme(settingsCard, 'settings', true);
    [document.querySelector('.app-header'), document.querySelector('.bottom-nav'), document.getElementById('uzSideMenu')].forEach(function (node) { enhanceLabels(node); observe(node, false); });
    observe(header, false);
    syncAuth();
    updateTheme();
    fixManifest();
  }
  function updateViewport() {
    viewportFrame = 0;
    if (!enabled()) return;
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight, offset = viewport ? viewport.offsetTop : 0;
    if (!editable(document.activeElement)) viewportBase = Math.max(viewportBase, window.innerHeight);
    var keyboard = mobile.matches && editable(document.activeElement) && (!viewport || Math.abs(viewport.scale - 1) < 0.05) ? Math.max(0, viewportBase - height - offset) : 0;
    root.style.setProperty('--uzmed-ux-viewport-height', Math.round(height) + 'px');
    root.style.setProperty('--uzmed-ux-viewport-offset-top', Math.round(offset) + 'px');
    root.style.setProperty('--uzmed-ux-keyboard-height', Math.round(keyboard) + 'px');
    root.setAttribute('data-uzmed-ux-keyboard', keyboard > 120 ? 'open' : 'closed');
    var active = document.activeElement;
    if (keyboard > 120 && active && editable(active)) {
      var rect = active.getBoundingClientRect();
      if (rect.bottom > height + offset - 16 || rect.top < offset + 16) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }
  }
  function scheduleViewport() { if (!viewportFrame) viewportFrame = window.requestAnimationFrame(updateViewport); }
  function stopInitialFocus() { initialFocus = false; }
  function boot() {
    if (read(preferenceKey) === 'off' || root.getAttribute('data-uzmed-ux') === 'off') { root.setAttribute('data-uzmed-ux', 'off'); return; }
    root.setAttribute('data-uzmed-ux', 'on');
    enhance();
    updateViewport();
    new MutationObserver(schedule).observe(document.body, { childList: true });
    new MutationObserver(schedule).observe(document.head, { childList: true });
    document.addEventListener('pointerdown', stopInitialFocus, { capture: true, passive: true });
    document.addEventListener('touchstart', stopInitialFocus, { capture: true, passive: true });
    document.addEventListener('keydown', function (event) {
      stopInitialFocus();
      if (!enabled() || event.defaultPrevented) return;
      if ((event.key === 'Enter' || event.key === ' ') && keyboardControls.has(event.target)) { event.preventDefault(); event.target.click(); return; }
      if (event.key !== 'Tab' || !authOpen()) return;
      var box = overlay.querySelector('.uz-auth-box[aria-modal="true"]');
      if (!box) return;
      var controls = Array.from(box.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')).filter(function (node) { return node.tabIndex >= 0 && !node.disabled && visible(node); });
      if (!controls.length) return;
      var active = document.activeElement, first = controls[0], last = controls[controls.length - 1];
      if (!box.contains(active) && active.closest('[role="dialog"], #uaConfirm, #uaModal')) return;
      if (!box.contains(active) || (event.shiftKey ? active === first || active === box : active === last)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    });
    document.addEventListener('focusin', function (event) {
      if (enabled() && mobile.matches && initialFocus && Date.now() < initialDeadline && event.target.id === 'uzAuthEmail' && authOpen()) {
        event.target.blur(); var box = overlay.querySelector('.uz-auth-box'); if (box) box.focus({ preventScroll: true });
      }
      scheduleViewport();
    });
    document.addEventListener('focusout', scheduleViewport);
    document.addEventListener('click', function (event) { if (enabled() && event.target.closest('.uz-auth-eye')) window.requestAnimationFrame(syncPasswordButtons); });
    window.addEventListener('resize', scheduleViewport, { passive: true });
    window.addEventListener('orientationchange', function () { viewportBase = window.innerHeight; scheduleViewport(); }, { passive: true });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', scheduleViewport, { passive: true }); window.visualViewport.addEventListener('scroll', scheduleViewport, { passive: true }); }
    [systemTheme, reducedMotion].forEach(function (query) { if (query.addEventListener) query.addEventListener('change', updateTheme); else query.addListener(updateTheme); });
    window.addEventListener('storage', function (event) {
      if (event.key === themeKey) { themeOverride = null; updateTheme(); }
      if (event.key === preferenceKey && event.newValue === 'off') { root.setAttribute('data-uzmed-ux', 'off'); document.querySelectorAll('.uzmed-ux-theme-toggle').forEach(function (button) { button.remove(); }); }
      if (event.key === preferenceKey && event.newValue !== 'off') { root.setAttribute('data-uzmed-ux', 'on'); enhance(); scheduleViewport(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
