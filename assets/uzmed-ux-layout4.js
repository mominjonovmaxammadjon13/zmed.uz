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
  var composerControls = new WeakSet();
  var initialFocus = true, initialDeadline = Date.now() + 3000;
  var viewportBase = window.innerHeight, themeOverride = null;
  var nativeThemeInstalled = false, pricesLoading = false;

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
    var dark = nativeThemeInstalled ? document.body.classList.contains('dark-mode') : theme() === 'dark';
    root.setAttribute('data-uzmed-ux-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-uzmed-ux-reduced-motion', reducedMotion.matches ? 'on' : 'off');
    var switchInput = document.getElementById('themeToggle');
    if (switchInput) {
      switchInput.checked = dark;
      switchInput.setAttribute('aria-hidden', 'true');
      var control = switchInput.closest('.soz-toggle');
      if (control) {
        control.setAttribute('role', 'switch');
        control.setAttribute('aria-label', 'Tungi rejim');
        control.setAttribute('aria-checked', String(dark));
        control.tabIndex = 0;
        keyboardControls.add(control);
      }
    }
    document.querySelectorAll('.uzmed-ux-theme-toggle').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish';
      var text = dark ? '☾ Tun' : '☀ Kun';
      if (button.textContent !== text) button.textContent = text;
    });
  }
  function connectNativeTheme() {
    document.querySelectorAll('.uzmed-ux-theme-toggle').forEach(function (button) { button.remove(); });
    if (nativeThemeInstalled || typeof window.applyTheme !== 'function' || !document.getElementById('themeVal')) return;
    var original = window.applyTheme;
    var saved = read(themeKey) || read('uzmed_theme');
    var initial = saved === 'light' || saved === 'dark' ? saved : systemTheme.matches ? 'dark' : 'light';
    window.applyTheme = function () {
      var result = original.apply(this, arguments);
      if (enabled()) {
        write(themeKey, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        updateTheme();
      }
      return result;
    };
    nativeThemeInstalled = true;
    write('uzmed_theme', initial);
    window.applyTheme(initial === 'dark');
  }
  function enhancePrices() {
    if (!window.UZMEDDrugPrices && !pricesLoading && !document.querySelector('script[src*="/assets/drug-prices.js"]')) {
      pricesLoading = true;
      var script = document.createElement('script');
      script.src = '/assets/drug-prices.js?v=1';
      script.addEventListener('load', schedule, { once: true });
      script.addEventListener('error', function () { pricesLoading = false; }, { once: true });
      document.head.appendChild(script);
    }
    if (!document.querySelector('link[data-uz-price-css]')) {
      var style = document.createElement('link');
      style.rel = 'stylesheet'; style.href = '/assets/drug-prices.css?v=1';
      style.setAttribute('data-uz-price-css', '1'); document.head.appendChild(style);
    }
    var host = document.querySelector('#uzSideMenu .uz-menu-body');
    observe(host, false);
    var menu = document.getElementById('uzPriceMenu');
    if (!menu && host && window.UZMEDDrugPrices && typeof window.UZMEDDrugPrices.open === 'function') {
      menu = document.createElement('button');
      menu.id = 'uzPriceMenu'; menu.type = 'button'; menu.className = 'uz-price-menu';
      menu.addEventListener('click', function () { window.UZMEDDrugPrices.open(); });
      var sections = Array.from(host.querySelectorAll('.uz-menu-section'));
      var before = sections.find(function (section) { return /ILOVA/i.test(section.textContent); });
      if (before) host.insertBefore(menu, before); else host.appendChild(menu);
    }
    if (menu && !menu.hasAttribute('data-uzmed-ux-price')) {
      menu.setAttribute('data-uzmed-ux-price', 'on');
      menu.classList.add('uz-menu-item');
      menu.innerHTML = '<span class="uz-menu-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 3 12 12M4 9l5-5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7Z"/><circle cx="18" cy="18" r="4"/><path d="M18 16v4m-1-3h2m-2 2h2"/></svg></span><span class="uz-menu-txt"><span class="uz-menu-title">Dori narxlari</span><span class="uz-menu-desc">Dorixonalardagi narx va mavjudlik</span></span><span class="uz-menu-arrow">›</span>';
    }
    var dialog = document.getElementById('uzPriceDialog');
    if (dialog) {
      observe(dialog, false);
      var title = dialog.querySelector('.uz-price-head b'), description = dialog.querySelector('.uz-price-head small');
      if (title) { title.id = 'uzPriceTitle'; title.setAttribute('role', 'heading'); title.setAttribute('aria-level', '2'); if (title.textContent !== 'Dori narxlari') title.textContent = 'Dori narxlari'; dialog.setAttribute('aria-labelledby', title.id); }
      if (description) { description.id = 'uzPriceDescription'; dialog.setAttribute('aria-describedby', description.id); }
      var status = document.getElementById('uzPriceStatus');
      if (status) { status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); }
    }
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
  function fitComposer(input) {
    if (!enabled() || !visible(input) || document.body.classList.contains('um-compose-expanded')) return;
    var max = Math.max(52, Math.min(160, (window.visualViewport ? window.visualViewport.height : window.innerHeight) * .35));
    input.style.setProperty('height', 'auto', 'important');
    var height = input.value ? Math.max(52, input.scrollHeight) : 52;
    input.style.setProperty('height', Math.min(max, height) + 'px', 'important');
  }
  function enhanceComposer() {
    var wrap = document.querySelector('#doktor-screen .ai-input-wrap');
    observe(wrap, false);
    var labels = { aiAttachBtn: 'Fayl yoki rasm qo‘shish', uzmedV5SendBtn: 'Xabarni yuborish', aiSendBtn: 'Xabarni yuborish', uzmedV5Input: 'Xabar yozish', aiInput: 'Xabar yozish' };
    Object.keys(labels).forEach(function (id) {
      var control = document.getElementById(id);
      if (control && !control.hasAttribute('aria-label')) control.setAttribute('aria-label', labels[id]);
    });
    var model = document.getElementById('uzmedV5ModelBtn');
    if (model) { model.setAttribute('aria-label', 'AI modelni tanlash: ' + model.textContent.trim()); observe(model, false); }
    ['uzmedV5Input', 'aiInput'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input || composerControls.has(input)) return;
      composerControls.add(input);
      input.addEventListener('input', function () { window.requestAnimationFrame(function () { fitComposer(input); }); });
      fitComposer(input);
    });
  }
  function mountAnalysisEntry() {
    var menu = document.getElementById('uzSideMenu');
    var source = document.querySelector('#assosi-screen [data-um-tool="lab"]');
    if (!menu || !source || document.getElementById('uzmedUxLabMenu')) return;
    var anchor = menu.querySelector('[onclick="menuGoDoseCalc()"]');
    if (!anchor) return;
    var button = anchor.cloneNode(true);
    button.id = 'uzmedUxLabMenu';
    button.removeAttribute('onclick');
    button.setAttribute('aria-label', 'Tahlillar — tahlil natijalarini sharhlash');
    var text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT), node;
    while ((node = text.nextNode())) {
      if (node.nodeValue.indexOf('Preparat dozasini hisoblash') !== -1) node.nodeValue = 'Tahlillar';
      if (node.nodeValue.indexOf('Yosh, vazn') !== -1) node.nodeValue = 'Hujjat va tahlil natijalarini sharhlash';
    }
    var icon = button.querySelector('svg');
    if (icon) icon.innerHTML = '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    button.addEventListener('click', function () {
      if (!enabled()) return;
      var target = document.querySelector('#assosi-screen [data-um-tool="lab"]');
      var close = menu.querySelector('.uz-menu-close');
      if (close) close.click();
      if (target) target.click();
    });
    anchor.insertAdjacentElement('afterend', button);
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
    var header = document.querySelector('.header-icons');
    connectNativeTheme();
    enhancePrices();
    mountAnalysisEntry();
    [document.querySelector('.app-header'), document.querySelector('.bottom-nav'), document.getElementById('uzSideMenu')].forEach(function (node) { enhanceLabels(node); observe(node, false); });
    observe(header, false);
    enhanceLabels(document.querySelector('#doktor-screen .ai-header'));
    syncAuth();
    enhanceComposer();
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
    if (active && composerControls.has(active)) fitComposer(active);
  }
  function scheduleViewport() { if (!viewportFrame) viewportFrame = window.requestAnimationFrame(updateViewport); }
  function stopInitialFocus() { initialFocus = false; }
  function boot() {
    if (read(preferenceKey) === 'off' || root.getAttribute('data-uzmed-ux') === 'off') { root.setAttribute('data-uzmed-ux', 'off'); return; }
    root.setAttribute('data-uzmed-ux', 'on');
    enhance();
    updateViewport();
    new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
    document.addEventListener('click', function (event) {
      if (!enabled()) return;
      if (event.target.closest('.uz-auth-eye')) window.requestAnimationFrame(syncPasswordButtons);
      if (event.target.closest('#uzmedV5SendBtn, #aiSendBtn, #nav-doktor, #ugBackChat')) window.requestAnimationFrame(function () {
        fitComposer(document.getElementById('uzmedV5Input') || document.getElementById('aiInput'));
      });
    });
    window.addEventListener('resize', scheduleViewport, { passive: true });
    window.addEventListener('orientationchange', function () { viewportBase = window.innerHeight; scheduleViewport(); }, { passive: true });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', scheduleViewport, { passive: true }); window.visualViewport.addEventListener('scroll', scheduleViewport, { passive: true }); }
    [systemTheme, reducedMotion].forEach(function (query) { if (query.addEventListener) query.addEventListener('change', updateTheme); else query.addListener(updateTheme); });
    window.addEventListener('storage', function (event) {
      if (event.key === themeKey || event.key === 'uzmed_theme') {
        themeOverride = null;
        if (nativeThemeInstalled && (event.newValue === 'dark' || event.newValue === 'light') && document.body.classList.contains('dark-mode') !== (event.newValue === 'dark')) window.applyTheme(event.newValue === 'dark');
        else updateTheme();
      }
      if (event.key === preferenceKey && event.newValue === 'off') { root.setAttribute('data-uzmed-ux', 'off'); document.querySelectorAll('.uzmed-ux-theme-toggle, #uzmedUxLabMenu').forEach(function (button) { button.remove(); }); }
      if (event.key === preferenceKey && event.newValue !== 'off') { root.setAttribute('data-uzmed-ux', 'on'); if (nativeThemeInstalled) write(themeKey, document.body.classList.contains('dark-mode') ? 'dark' : 'light'); enhance(); scheduleViewport(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
