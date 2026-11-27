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
  var wideWorkspace = window.matchMedia('(min-width: 1024px)');
  var railFrame = 0;
  var tableContainers = new WeakSet();
  var drugWorkspaceLoading = false, drugScreens = new WeakSet();

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function railSource(definition) {
    if (definition.selector) return document.querySelector(definition.selector);
    return Array.from(document.querySelectorAll('#uzSideMenu .uz-menu-item')).find(function (node) {
      return definition.match.test(node.querySelector('.uz-menu-title') ? node.querySelector('.uz-menu-title').textContent : node.textContent);
    });
  }
  var railItems = [
    { key: 'chat', label: 'AI Chat', group: 'Ish muhiti', selector: '#nav-doktor', screen: 'doktor-screen' },
    { key: 'patients', label: 'Bemorlar', group: 'Ish muhiti', match: /Bemorlar|Kasallar/ },
    { key: 'specialists', label: 'Mutaxassislar', group: 'Ish muhiti', match: /Mutaxassislar/, panel: 'uia-sp-panel' },
    { key: 'analysis', label: 'Klinik tahlil', group: 'Ish muhiti', selector: '#uzmedUxLabMenu', panel: 'tahlilPanel' },
    { key: 'protocols', label: 'Klinik protokollar', group: 'Klinik vositalar', selector: '#nav-assosi', screen: 'assosi-screen' },
    { key: 'calculate', label: 'Hisoblash', group: 'Klinik vositalar', selector: '#uzSideMenu [onclick="menuGoDoseCalc()"]', panel: 'doseCalcPanel' },
    { key: 'drugs', label: 'Dori ma’lumotlari', group: 'Klinik vositalar', selector: '#nav-dorilar', screen: 'dorilar-screen' },
    { key: 'mkb', label: 'MKB-10', group: 'Klinik vositalar', selector: '#uzSideMenu [onclick="menuGoScreen(\'mkb-db-screen\')"]', screen: 'mkb-db-screen' },
    { key: 'derma', label: 'Dermatologiya', group: 'Klinik vositalar', selector: '#nav-derma', screen: 'derma-screen' },
    { key: 'history', label: 'AI tarixi', group: 'Shaxsiy', selector: '#uzSideMenu [onclick="menuGoScreen(\'ai-tarix-screen\')"]', screen: 'ai-tarix-screen' },
    { key: 'settings', label: 'Sozlamalar', group: 'Shaxsiy', selector: '#nav-sozlamalar', screen: 'sozlamalar-screen' }
  ];
  function syncWorkspaceRail() {
    railFrame = 0;
    var rail = document.getElementById('uzmedWorkspaceRail');
    if (!rail || !enabled()) return;
    var selectedPanel = ['uia-sp-panel', 'tahlilPanel', 'doseCalcPanel'].find(function (id) { return visible(document.getElementById(id)); });
    var activeScreens = Array.from(document.querySelectorAll('.screens > .screen.active')).filter(visible);
    activeScreens.sort(function (a, b) { return (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0); });
    var topScreen = activeScreens[activeScreens.length - 1];
    railItems.forEach(function (definition) {
      var button = rail.querySelector('[data-ux-rail="' + definition.key + '"]');
      if (!button) return;
      var screen = definition.screen && document.getElementById(definition.screen);
      var current = definition.panel ? definition.panel === selectedPanel : !!(!selectedPanel && screen && screen === topScreen);
      if (current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
  }
  function scheduleRail() { if (!railFrame) railFrame = requestAnimationFrame(syncWorkspaceRail); }
  function mountWorkspaceRail() {
    if (!document.getElementById('uzmedMobile')) return;
    var rail = document.getElementById('uzmedWorkspaceRail');
    if (!wideWorkspace.matches) { root.removeAttribute('data-ux-workspace'); return; }
    root.setAttribute('data-ux-workspace', 'wide');
    if (!rail) {
      rail = element('aside', 'ux-workspace-rail'); rail.id = 'uzmedWorkspaceRail';
      rail.setAttribute('aria-label', 'Klinik ish muhiti navigatsiyasi');
      var mark = element('div', 'ux-rail-brand', 'UZMED');
      mark.appendChild(element('span', '', 'Klinik ish muhiti')); rail.appendChild(mark);
      var nav = element('nav', 'ux-rail-nav'); nav.setAttribute('aria-label', 'Asosiy bo‘limlar'); rail.appendChild(nav);
      document.body.appendChild(rail);
      document.querySelectorAll('.screen').forEach(function (screen) {
        new MutationObserver(scheduleRail).observe(screen, { attributes: true, attributeFilter: ['class'] });
      });
    }
    var nav = rail.querySelector('nav');
    railItems.forEach(function (definition) {
      if(definition.key==='patients')return; // Qabul > Mening bemorlarim replaces duplicate main nav
      var source = railSource(definition);
      if (!source || nav.querySelector('[data-ux-rail="' + definition.key + '"]')) return;
      var group = nav.querySelector('[data-ux-group="' + definition.group + '"]');
      if (!group) {
        group = element('div', 'ux-rail-group'); group.setAttribute('data-ux-group', definition.group);
        group.appendChild(element('p', 'ux-rail-group-title', definition.group)); nav.appendChild(group);
      }
      var button = element('button', 'ux-rail-button'); button.type = 'button';
      button.setAttribute('data-ux-rail', definition.key);
      var icon = source.querySelector('svg');
      if (icon) icon = icon.cloneNode(true);
      else {
        var paths = { analysis: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8', calculate: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 7h8M8 12h2m4 0h2m-8 5h2m4 0h2', mkb: 'M4 3h14a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V3ZM4 17h16M8 7h8m-8 4h6', history: 'M3 11a9 9 0 1 1 3 8M3 4v7h7m2-5v6l4 2' };
        icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', paths[definition.key] || paths.mkb); icon.appendChild(path);
      }
      icon.setAttribute('aria-hidden', 'true'); button.appendChild(icon);
      button.appendChild(element('span', '', definition.label));
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var currentSource = railSource(definition);
        if (enabled() && currentSource && !currentSource.disabled) currentSource.click();
        scheduleRail();
      });
      group.appendChild(button);
    });
    syncWorkspaceRail();
  }
  function enhanceDermaReading() {
    var modal = document.getElementById('dermaModal'), body = document.getElementById('modalBody');
    if (!modal || !body) return;
    observe(modal, true);
    if (!modal.classList.contains('open') || body.querySelector('.ux-clinical-toc')) return;
    var sections = Array.from(body.querySelectorAll(':scope > .modal-section'));
    if (!sections.length) return;
    var gallery = sections.find(function (section) { return section.querySelector('img'); });
    var clinical = sections.filter(function (section) { return section !== gallery; });
    var order = [/Ta[’'‘]rif/i, /Описание/, /Klinik belgilar/i, /Differensial/i, /Davolash/i, /Muhim/i];
    clinical.sort(function (a, b) {
      var rank = function (section) { var text = section.querySelector('.modal-section-title')?.textContent || ''; var index = order.findIndex(function (name) { return name.test(text); }); return index < 0 ? 99 : index; };
      return rank(a) - rank(b);
    });
    var toc = element('nav', 'ux-clinical-toc'); toc.setAttribute('aria-label', 'Klinik ma’lumot bo‘limlari');
    clinical.forEach(function (section, index) {
      section.id = 'ux-derma-section-' + index;
      var title = section.querySelector('.modal-section-title');
      if (!title) return;
      title.setAttribute('role', 'heading'); title.setAttribute('aria-level', '3');
      if (/Muhim/.test(title.textContent)) section.classList.add('ux-clinical-warning');
      var button = element('button', '', title.textContent.trim()); button.type = 'button';
      button.addEventListener('click', function () { section.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' }); });
      toc.appendChild(button);
      body.appendChild(section);
    });
    var tags = body.querySelector('.modal-tags-row');
    if (tags) tags.insertAdjacentElement('afterend', toc); else body.prepend(toc);
    var source = element('p', 'ux-clinical-source', 'Etiologiya, patogenez, diagnostika, manba va yangilanish sanasi ushbu yozuvda alohida ko‘rsatilmagan.');
    body.appendChild(source);
    if (gallery) {
      var disclosure = element('details', 'ux-atlas-disclosure');
      disclosure.appendChild(element('summary', '', 'Mavjud atlas tasvirini ko‘rish'));
      disclosure.appendChild(element('p', 'ux-clinical-source', 'Tasvirning klinik mosligi va foydalanish huquqlari mustaqil tekshirilmagan.'));
      disclosure.appendChild(gallery); body.appendChild(disclosure);
    }
  }
  function enhanceClinicalTables() {
    var messages = document.getElementById('aiMessages');
    if (!messages) return;
    if (!tableContainers.has(messages)) {
      tableContainers.add(messages);
      new MutationObserver(schedule).observe(messages, { childList: true, subtree: true });
    }
    messages.querySelectorAll('.uzmed-v5-msg.bot table, .ai-bubble.bot table').forEach(function (table) {
      if (table.parentElement.classList.contains('ux-table-scroll')) return;
      var wrapper = element('div', 'ux-table-scroll'); wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', 'Klinik jadval — gorizontal aylantirish');
      table.before(wrapper); wrapper.appendChild(table);
    });
  }

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
    document.querySelectorAll('#ugTheme').forEach(function (button) { button.remove(); });
    document.querySelectorAll('#lgThemeBtn').forEach(function (button) {
      if (!button.hidden) button.hidden = true;
      if (button.getAttribute('aria-hidden') !== 'true') button.setAttribute('aria-hidden', 'true');
      if (button.tabIndex !== -1) button.tabIndex = -1;
      if (button.style.getPropertyValue('display') !== 'none' || button.style.getPropertyPriority('display') !== 'important') button.style.setProperty('display', 'none', 'important');
    });
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
  function mountDrugWorkspace() {
    var screen = document.getElementById('dorilar-screen');
    if (!screen) return;
    if (!drugScreens.has(screen)) {
      drugScreens.add(screen);
      new MutationObserver(schedule).observe(screen, { attributes: true, attributeFilter: ['class'] });
    }
    if (window.UZMEDDrugWorkspace || drugWorkspaceLoading || document.documentElement.getAttribute('data-uzmed-drug-workspace') === 'failed') return;
    if (!screen.classList.contains('active') && !window.__uzmedDrugWorkspaceRequested) return;
    drugWorkspaceLoading = true;
    function failed() { drugWorkspaceLoading = false; document.documentElement.setAttribute('data-uzmed-drug-workspace', 'failed'); }
    function loadWorkspace() {
      if (!window.UZMEDDrugIdentitySafetyFull) { failed(); return; }
      var script = document.createElement('script'); script.src = '/assets/uzmed-drug-workspace-shared-20261025.js?v=20261025-guard2';
      script.onload = function () { drugWorkspaceLoading = false; if (!window.UZMEDDrugWorkspace) document.documentElement.setAttribute('data-uzmed-drug-workspace', 'failed'); schedule(); };
      script.onerror = failed;
      document.head.appendChild(script);
    }
    if (window.UZMEDDrugIdentitySafetyFull) loadWorkspace();
    else {
      var guard = document.createElement('script'); guard.src = '/assets/drug-identity-safety.js?v=20261025-guard2';
      guard.onload = loadWorkspace; guard.onerror = failed; document.head.appendChild(guard);
    }
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
    mountWorkspaceRail();
    mountDrugWorkspace();
    enhanceDermaReading();
    enhanceClinicalTables();
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
    document.addEventListener('click', function (event) {
      var target = event.target.closest && event.target.closest('#nav-dorilar, [data-ux-rail="drugs"], #uzSideMenu [onclick*="dorilar"], .drug-card, [onclick*="showAllergyDrugDetail"]');
      if (!target) return;
      if (target.matches('#nav-dorilar,[data-ux-rail="drugs"]') && root.getAttribute('data-uzmed-drug-workspace') === 'failed') root.removeAttribute('data-uzmed-drug-workspace');
      window.__uzmedDrugWorkspaceRequested = true;
      mountDrugWorkspace(); schedule();
    }, true);
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
    if (wideWorkspace.addEventListener) wideWorkspace.addEventListener('change', function () { if (enabled()) { mountWorkspaceRail(); scheduleViewport(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

/* Safe clinical Markdown presentation. Raw response/history remains untouched. */
(function(W){
 'use strict';
 function cells(line){return line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(s=>s.trim().replace(/\\\|/g,'|'));}
 function parse(raw){var lines=String(raw).replace(/\r\n/g,'\n').split('\n'),out=[],i=0;
  while(i<lines.length){var line=lines[i],m;if(!line.trim()){i++;continue;}
   if(/^```/.test(line)){var code=[],language=line.slice(3).trim();i++;while(i<lines.length&&!/^```/.test(lines[i]))code.push(lines[i++]);if(i<lines.length)i++;out.push({type:'code',text:code.join('\n'),language:language});continue;}
   if(i+1<lines.length&&line.includes('|')&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){var headers=cells(line),rows=[];i+=2;while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))rows.push(cells(lines[i++]));out.push({type:'table',headers:headers,rows:rows});continue;}
   if((m=/^(#{1,6})\s+(.+)$/.exec(line))){out.push({type:'heading',level:m[1].length,text:m[2]});i++;continue;}
   if((m=/^\s*([-*+]\s+|\d+[.)]\s+)(.+)$/.exec(line))){var ordered=/\d/.test(m[1]),items=[];while(i<lines.length&&(m=/^\s*([-*+]\s+|\d+[.)]\s+)(.+)$/.exec(lines[i]))&&/\d/.test(m[1])===ordered){items.push(m[2]);i++;}out.push({type:'list',ordered:ordered,items:items});continue;}
   if((m=/^>\s?(.*)$/.exec(line))){out.push({type:'quote',text:m[1]});i++;continue;}
   var paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(?:#{1,6}\s|```|>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i])&&!(i+1<lines.length&&lines[i].includes('|')&&lines[i+1].includes('---')))paragraph.push(lines[i++]);out.push({type:'paragraph',text:paragraph.join('\n')});
  }return out;
 }
 function safeLink(value){try{var u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch(_){return null;}}
 var api={parse:parse,cells:cells,safeLink:safeLink};if(typeof module==='object'&&module.exports){module.exports=api;return;}W.UZMEDChatReading=api;
 function inline(host,text){var regex=/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g,last=0,m;
  while((m=regex.exec(text))){host.append(document.createTextNode(text.slice(last,m.index)));var token=m[0],n;if(token[0]==='`'){n=document.createElement('code');n.textContent=token.slice(1,-1);}else if(token.startsWith('**')){n=document.createElement('strong');n.textContent=token.slice(2,-2);}else{var link=/^\[([^\]]+)\]\(([^)]+)\)$/.exec(token),url=safeLink(link[2]);if(url){n=document.createElement('a');n.href=url;n.target='_blank';n.rel='noopener noreferrer';n.textContent=link[1];}else{n=document.createTextNode(token);}}host.append(n);last=regex.lastIndex;}host.append(document.createTextNode(text.slice(last)));
 }
 function render(host,text){var content=document.createElement('div');content.className='uxn-clinical-answer';parse(text).forEach(block=>{var n;
  if(block.type==='table'){var wrapper=document.createElement('div');wrapper.className='ux-table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Klinik jadval — gorizontal aylantirish');var table=document.createElement('table'),thead=table.createTHead(),row=thead.insertRow();block.headers.forEach(v=>{var cell=document.createElement('th');cell.scope='col';inline(cell,v);row.append(cell);});var body=table.createTBody();block.rows.forEach(values=>{var r=body.insertRow();values.forEach(v=>inline(r.insertCell(),v));});wrapper.append(table);content.append(wrapper);return;}
  if(block.type==='list'){n=document.createElement(block.ordered?'ol':'ul');block.items.forEach(t=>{var item=document.createElement('li');inline(item,t);n.append(item);});}
  else if(block.type==='code'){n=document.createElement('pre');var code=document.createElement('code');code.textContent=block.text;n.append(code);}
  else {n=document.createElement(block.type==='heading'?'h'+Math.min(6,block.level+1):block.type==='quote'?'blockquote':'p');inline(n,block.text);}content.append(n);
 });
 var copy=document.createElement('button');copy.type='button';copy.className='uxn-copy-answer';copy.textContent='Nusxa olish';copy.setAttribute('aria-label','AI javobini nusxa olish');copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);copy.textContent='Nusxa olindi';}catch(_){copy.textContent='Nusxalash imkoni bo‘lmadi';}setTimeout(()=>{if(copy.isConnected)copy.textContent='Nusxa olish';},2500);};content.append(copy);host.replaceChildren(content);
 }
 function boot(){var host=document.getElementById('aiMessages');if(!host)return false;var frame=0,timer;
  function update(){frame=0;if(document.documentElement.dataset.uzmedUx!=='on')return;if(W.aiTyping||W.UZMEDAIBackendV5?.busy){clearTimeout(timer);timer=setTimeout(schedule,150);return;}host.querySelectorAll('.uzmed-v5-msg.bot').forEach(node=>{if(node.children.length)return;var raw=node.textContent;if(!raw||raw==='Javob tayyorlanmoqda…')return;render(node,raw);});}
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}new MutationObserver(schedule).observe(host,{subtree:true,childList:true,characterData:true});schedule();return true;
 }
 if(!boot()){var count=0,t=setInterval(()=>{if(boot()||++count>60)clearInterval(t);},100);}
})(typeof window==='object'?window:globalThis);

/* UZMED sidebar: presentation adapter over existing controls. No API, auth or clinical state changes. */
(function () {
  'use strict';
  var root=document.documentElement, desktop=matchMedia('(min-width:1024px)'), sidebar, app, heading, menuButton, action, search, status;
  var opened=false, opener=null, dispatching=false, replaying=false, scheduled=0, active='chat', lastScreen='', collapsed=false, originalInert=false;
  var key='uzmedWorkspaceV12', preference='uzmed.sidebar.collapsed';
  var position=Number.isSafeInteger(history.state?.[key]?.index)?history.state[key].index:0,activationUntil=0;
  var definitions=[
    {key:'home',label:'Asosiy menyu',group:'Asosiy ish maydoni',source:'#uzmedHomeOpen',screen:'uzmed-home-screen',icon:'clipboard'},
    {key:'chat',label:'Chat',group:'Asosiy ish maydoni',source:'#nav-doktor',screen:'doktor-screen',icon:'chat'},
    {key:'calculate',label:'Hisoblash',group:'Asosiy ish maydoni',source:'#uzSideMenu [onclick="menuGoDoseCalc()"]',screen:'doktor-screen',panel:'doseCalcPanel',icon:'calc'},
    {key:'analysis',label:'Tahlil',group:'Asosiy ish maydoni',source:'#uzmedUxLabMenu',screen:'doktor-screen',panel:'tahlilPanel',icon:'lab'},
    {key:'differential',label:'Differensial',group:'Asosiy ish maydoni',source:'#uzddxTab, #uzdx2Tab',screen:'doktor-screen',panel:'uzdx2Wrap',icon:'branches',prepareChat:true},
    {key:'specialists',label:'Mutaxassislar',group:'Asosiy ish maydoni',source:'#urMenuSpecialist',screen:'doktor-screen',panel:'uia-sp-panel',icon:'doctor'},
    {key:'mkb',label:'MKB-10',group:'Klinik ma’lumotnoma',source:'#uzSideMenu [onclick="menuGoScreen(\'mkb-db-screen\')"]',screen:'mkb-db-screen',icon:'book'},
    {key:'drugs',label:'Dorilar',group:'Klinik ma’lumotnoma',source:'#nav-dorilar',screen:'dorilar-screen',icon:'pill'},
    {key:'interactions',label:'Dorilarning o‘zaro ta’siri',group:'Klinik ma’lumotnoma',source:'[data-um-tool="ddi"]',screen:'assosi-screen',panel:'uzdp-panel',icon:'shield'},
    {key:'protocols',label:'Tashxis va protokollar',group:'Klinik ma’lumotnoma',source:'#nav-assosi',screen:'assosi-screen',icon:'clipboard'},
    {key:'derma',label:'Dermatologiya · AI',group:'Klinik ma’lumotnoma',source:'#nav-doktor',screen:'doktor-screen',icon:'image',alias:true},
    {key:'scores',label:'Klinik shkalalar',group:'Klinik ma’lumotnoma',source:'[data-um-tool="scores"]',screen:'assosi-screen',panel:'ucs-title',icon:'chart'},
    {key:'growth',label:'Pediatriya · o‘sish',group:'Klinik ma’lumotnoma',source:'[data-um-tool="growth"]',screen:'assosi-screen',panel:'ugr-go',icon:'chart'},
    {key:'patients',label:'Mening bemorlarim',group:'Shifokor ish jarayoni',source:'#upMenuLink',screen:'patients-screen',icon:'patients'},
    {key:'prices',label:'Dorixona va narxlar',group:'Shifokor ish jarayoni',source:'#uzPriceMenu',screen:'dorilar-screen',panel:'uzPriceDialog',icon:'pharmacy'},
    {key:'history',label:'Suhbatlar tarixi',group:'Hisob va sozlamalar',source:'.app-header [onclick="openAiTarix()"]',screen:'ai-tarix-screen',icon:'history'},
    {key:'models',label:'AI modelni tanlash',group:'Hisob va sozlamalar',source:'#uzmedV5ModelBtn',screen:'doktor-screen',panel:'uzmedV5Modal',icon:'spark',prepareChat:true},
    {key:'search',label:'Umumiy qidiruv',group:'Hisob va sozlamalar',source:'#uzSideMenu [onclick="menuGoScreen(\'search-screen\')"]',screen:'search-screen',icon:'search'},
    {key:'profile',label:'Akkaunt va profil',group:'Hisob va sozlamalar',source:'#uzmedAuthCard',screen:'sozlamalar-screen',icon:'user'},
    {key:'settings',label:'Sozlamalar',group:'Hisob va sozlamalar',source:'#nav-sozlamalar',screen:'sozlamalar-screen',icon:'settings'}
  ];
  var paths={chat:'M4 4h16v12H8l-4 4V4Z',calc:'M6 3h12v18H6V3Zm3 4h6M9 12h1m4 0h1m-6 5h1m4 0h1',lab:'M9 3h6m-5 0v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8',branches:'M5 3v12h14M5 7h14m0-3v6m0 2v6M5 18v3',doctor:'M8 3v4a4 4 0 0 0 8 0V3M12 11v5a5 5 0 0 0 10 0v-2M19 11h3v3h-3v-3Z',book:'M4 3h16v18H6a2 2 0 0 1-2-2V3Zm0 14h16M8 7h8m-8 4h6',pill:'m8 5 11 11M4 10l6-6a5 5 0 0 1 7 7l-6 6a5 5 0 0 1-7-7Z',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',clipboard:'M8 4H5v17h14V4h-3M8 2h8v4H8V2Zm0 9h8m-8 4h6',image:'M3 3h18v18H3V3Zm0 15 6-6 4 4 3-3 5 5M15 7h2',chart:'M4 3v18h17M8 16v-5m5 5V6m5 10V9',patients:'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9v-3a6 6 0 0 1 12 0v3m2-17a4 4 0 0 1 0 8m2 9v-3a6 6 0 0 0-2-4',pharmacy:'M3 9h18L19 3H5L3 9Zm1 0v12h16V9M9 13h6m-3-3v6',history:'M3 11a9 9 0 1 1 3 8M3 4v7h7m2-5v6l4 2',spark:'m12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-3a7 7 0 0 1 14 0v3',settings:'M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1 1-4Zm3 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6',menu:'M4 6h16M4 12h16M4 18h16',close:'m6 6 12 12M6 18 18 6',collapse:'M9 3v18M16 8l-4 4 4 4M3 3h18v18H3V3Z',plus:'M12 4v16M4 12h16',compose:'M15 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M14 14l-5 1 1-5L19 1l4 4-9 9Z'};
  function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function icon(name){var n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');var p=document.createElementNS(n.namespaceURI,'path');p.setAttribute('d',paths[name]||paths.book);n.appendChild(p);return n;}
  function button(label,name,cls){var n=el('button',cls);n.type='button';n.setAttribute('aria-label',label);n.title=label;n.appendChild(icon(name));return n;}
  function enabled(){return root.dataset.uzmedUx==='on';}
  function visible(n){return !!(n&&n.getClientRects().length&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden');}
  function panelVisible(d){
    var panel=document.getElementById(d.panel);if(!visible(panel))return false;
    if(d.key==='interactions'||d.key==='differential')return panel.classList.contains('on');
    if(d.key==='scores')return !!panel.closest('.ucs-ov.open');
    if(d.key==='growth')return !!panel.closest('.ugr-ov.open');
    if(d.key==='models')return panel.getAttribute('aria-hidden')==='false';
    if(d.key==='prices')return panel.open===true;
    return true;
  }
  function authOpen(){return document.body.classList.contains('uz-auth-locked')||visible(document.getElementById('uzmedAuthOverlay'));}
  function source(d){return document.querySelector(d.source);}
  function norm(s){return String(s||'').toLowerCase().replace(/[’‘ʻʼ`']/g,'').trim();}
  var statusTimer;function announce(text){clearTimeout(statusTimer);status.textContent=text;statusTimer=setTimeout(()=>{status.textContent='';},5000);}
  function screen(){return Array.from(document.querySelectorAll('.screens>.screen.active')).map(n=>n.id).pop()||'assosi-screen';}
  function snapshot(drawer){return {version:12,screen:screen(),section:active,drawer:!!drawer,index:position};}
  function state(payload){var s=Object.assign({},history.state||{});s[key]=payload;return s;}
  function record(replace){if(replaying||authOpen())return;var previous=history.state&&history.state[key],next=snapshot(false);if(previous&&!previous.drawer&&previous.screen===next.screen&&previous.section===next.section)return;if(!replace)next.index=++position;history[replace?'replaceState':'pushState'](state(next),'');}
  function closeVisual(restoreFocus){if(!opened)return;opened=false;root.removeAttribute('data-uzmed-drawer');sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');sidebar.inert=!desktop.matches;sidebar.setAttribute('aria-hidden',String(!desktop.matches));menuButton.setAttribute('aria-expanded','false');app.inert=originalInert;if(restoreFocus&&opener?.isConnected)opener.focus({preventScroll:true});}
  function close(){if(!opened)return;var own=history.state&&history.state[key];closeVisual(true);if(!dispatching&&own?.drawer)history.back();}
  function open(){if(!enabled()||authOpen())return;if(desktop.matches){toggleCollapse();return;}if(opened){close();return;}opener=document.activeElement;originalInert=app.inert;opened=true;root.setAttribute('data-uzmed-drawer','open');sidebar.inert=false;sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-hidden','false');menuButton.setAttribute('aria-expanded','true');app.inert=true;history.pushState(state(snapshot(true)),'');sidebar.querySelector('.uxn-close').focus({preventScroll:true});}
  function toggleCollapse(){collapsed=!collapsed;root.setAttribute('data-uzmed-sidebar-size',collapsed?'compact':'full');try{localStorage.setItem(preference,String(collapsed));}catch(_){}syncLabels();}
  function syncLabels(){var b=sidebar.querySelector('.uxn-close');b.setAttribute('aria-label',desktop.matches?(collapsed?'Menyuni kengaytirish':'Menyuni yig‘ish'):'Menyuni yopish');b.title=b.getAttribute('aria-label');b.firstChild.replaceWith(icon(desktop.matches?'collapse':'close'));menuButton.setAttribute('aria-label',desktop.matches?(collapsed?'Menyuni kengaytirish':'Menyuni yig‘ish'):'Menyuni ochish');}
  function back(){
    if(authOpen())return;
    if(opened){close();return;}
    activationUntil=0;sync();
    if(position>0&&history.state?.[key]){history.back();return;}
    if(screen()!=='uzmed-home-screen'){activate('home',true);record(true);}
  }
  function closeOtherPanels(section){
    // Use native close controls so each panel also releases its own focus/scroll state.
    [['interactions','#uzdp-panel .uzdp-x'],['scores','.ucs-ov.open .ucs-x'],
     ['growth','.ugr-ov.open .ugr-x'],['models','#uzmedV5Close'],['prices','#uzPriceClose']]
      .forEach(function(entry){var close=document.querySelector(entry[1]);if(entry[0]!==section&&visible(close))close.click();});
    window.UZMEDGlass?.closeTools?.();
  }
  function activate(section,fromHistory,onActivate){var d=definitions.find(x=>x.key===section),s=d&&source(d);if(!d||!s||s.disabled){announce('Ushbu bo‘lim hozir ochilmadi. Qayta urinib ko‘ring.');return false;}var drawerEntry=!!(history.state&&history.state[key]?.drawer),before=history.length;dispatching=true;activationUntil=Date.now()+250;closeVisual(false);
    // The legacy differential dialog pushes its own entry even when restoring history.
    var nativePush;if(fromHistory&&section==='differential'){nativePush=history.pushState;history.pushState=function(payload){if(payload?.uzdx2===1)return;return nativePush.apply(this,arguments);};}
    try{if(typeof window.closeMenu==='function')window.closeMenu();closeOtherPanels(section);if(d.prepareChat||section==='chat'||d.screen!=='doktor-screen')window.switchAiMode?.('chat');if(window.UZMEDDdxUI2?.ochiqmi?.()&&section!=='differential')window.UZMEDDdxUI2.yop(true);if(d.screen&&screen()!==d.screen&&document.getElementById(d.screen)&&typeof window.showScreen==='function')window.showScreen(d.screen);if(d.prepareChat&&screen()!=='doktor-screen')document.querySelector('#nav-doktor')?.click();s=source(d)||s;if(typeof onActivate==='function')onActivate();else s.click();active=section;lastScreen=screen();sync();if(!fromHistory){var consumed=drawerEntry||history.length>before||!history.state?.[key]&&history.state?.uzdx2;if(consumed)position++;record(!!consumed);}setTimeout(schedule,260);if(d.alias){announce('Dermatologiya savoli va rasm so‘rovini shu UZMED AI chatida yozing.');document.getElementById('uzmedV5Input')?.focus({preventScroll:true});}}finally{if(nativePush)history.pushState=nativePush;dispatching=false;}return true;}
  function sync(){if(!sidebar)return;if(authOpen()){closeVisual(false);return;}var current=screen();var selected=definitions.find(x=>x.panel&&x.screen===current&&panelVisible(x));var previousDefinition=definitions.find(x=>x.key===active);if(selected&&!dispatching&&!replaying&&(Date.now()>=activationUntil||selected.key===active)){var changed=active!==selected.key;active=selected.key;if(changed||current!==lastScreen){lastScreen=current;var nativeEntry=!history.state?.[key]&&history.state?.uzdx2;if(nativeEntry)position++;record(!!nativeEntry);}}if(!dispatching&&!replaying&&!selected&&Date.now()>=activationUntil&&(current!==lastScreen||previousDefinition?.panel)){var d=definitions.find(x=>x.screen===current&&!x.panel&&!x.prepareChat&&!x.alias&& !['prices','interactions','scores','growth','profile'].includes(x.key));if(d)active=d.key;lastScreen=current;record(false);}definitions.forEach(d=>{var n=sidebar.querySelector('[data-uzmed-section="'+d.key+'"]');if(!n)return;var available=!!source(d);n.hidden=!available;if(active===d.key)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});var d=definitions.find(x=>x.key===active);heading.textContent=d?.label||'UZMED';action.setAttribute('aria-label','Yangi chat ochish');action.title='Yangi chat ochish';filter();}
  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(()=>{scheduled=0;sync();});}
  function filter(){var q=norm(search.value),found=0;sidebar.querySelectorAll('.uxn-group').forEach(group=>{var any=false;group.querySelectorAll('[data-uzmed-section]').forEach(n=>{var d=definitions.find(x=>x.key===n.dataset.uzmedSection),ok=!!source(d)&&(!q||norm(d.label+' '+d.group).includes(q));n.hidden=!ok;if(ok){any=true;found++;}});group.hidden=!any;});sidebar.querySelector('.uxn-empty').hidden=found>0;}
  function newChat(){if(authOpen())return;if(window.UZMEDConversations)return window.UZMEDConversations.newChat();activate('chat');var original=document.querySelector('#doktor-screen .ai-clear-btn');if(original)original.click();else announce('Yangi chat tugmasi hozir mavjud emas.');}
  function resize(){if(opened){closeVisual(false);record(true);}sidebar.inert=!desktop.matches;sidebar.setAttribute('aria-hidden',String(!desktop.matches));syncLabels();}
  function mountHistoryFilter(){var list=document.getElementById('aiTarixList');if(!list||document.getElementById('uzmedHistorySearch'))return;var wrapper=el('div','uxn-history-search'),label=el('label','','Saqlangan savollarni qidirish'),input=el('input');input.id='uzmedHistorySearch';input.type='search';input.placeholder='Savol yoki javob bo‘yicha';label.htmlFor=input.id;wrapper.append(label,input);var empty=el('p','uxn-history-empty','Mos yozishma topilmadi.');empty.setAttribute('role','status');empty.hidden=true;wrapper.append(empty);list.before(wrapper);function apply(){var q=norm(input.value),rows=Array.from(list.children).filter(n=>n.hasAttribute('onclick')),matched=0;rows.forEach(n=>{n.classList.add('uxn-history-item');var hidden=!!q&&!norm(n.textContent).includes(q);if(n.hidden!==hidden)n.hidden=hidden;if(!hidden)matched++;});empty.hidden=!q||!rows.length||matched>0;}input.addEventListener('input',apply);new MutationObserver(apply).observe(list,{childList:true});window.addEventListener('uzmed:auth-change',()=>{input.value='';apply();});apply();}
  function boot(){app=document.querySelector('.phone-shell');if(!app||!document.getElementById('nav-doktor'))return false;
    try{collapsed=localStorage.getItem(preference)==='true';}catch(_){}root.setAttribute('data-uzmed-sidebar-size',collapsed?'compact':'full');
    sidebar=el('aside','uxn-sidebar');sidebar.id='uzmedSidebar';sidebar.setAttribute('aria-label','UZMED bo‘limlari');var top=el('div','uxn-sidebar-top'),brand=el('a','uxn-brand','UZMED');brand.href='#';brand.setAttribute('aria-label','UZMED — chatga o‘tish');brand.addEventListener('click',e=>{e.preventDefault();activate('chat');});top.appendChild(brand);var collapse=button('Menyuni yopish','close','uxn-icon-button uxn-close');collapse.addEventListener('click',()=>desktop.matches?toggleCollapse():close());top.appendChild(collapse);sidebar.appendChild(top);
    var fresh=button('Yangi chat ochish','compose','uxn-new-chat uxn-compose');fresh.appendChild(el('span','','Chat'));fresh.addEventListener('click',newChat);top.insertBefore(fresh,collapse);
    var searchBox=el('div','uxn-search');searchBox.appendChild(icon('search'));search=el('input');search.type='search';search.placeholder='Bo‘limni qidirish';search.setAttribute('aria-label','Menyu bo‘limlarini qidirish');search.addEventListener('input',filter);searchBox.appendChild(search);sidebar.appendChild(searchBox);
    var nav=el('nav','uxn-nav');nav.setAttribute('aria-label','Asosiy navigatsiya');definitions.forEach(d=>{if(d.key==='patients')return;var group=Array.from(nav.children).find(n=>n.dataset.group===d.group);if(!group){group=el('section','uxn-group');group.dataset.group=d.group;group.appendChild(el('h2','uxn-group-title',d.group));nav.appendChild(group);}var n=button(d.label,d.icon,'uxn-nav-button');n.dataset.uzmedSection=d.key;n.appendChild(el('span','uxn-nav-label',d.label));n.addEventListener('click',()=>activate(d.key));group.appendChild(n);});var empty=el('p','uxn-empty','Bo‘lim topilmadi. Boshqa nom bilan qidiring.');empty.hidden=true;nav.appendChild(empty);sidebar.appendChild(nav);sidebar.appendChild(el('p','uxn-footnote','UZMED · Klinik ish muhiti'));document.body.appendChild(sidebar);
    var shade=button('Menyuni yopish','close','uxn-backdrop');shade.id='uzmedSidebarBackdrop';shade.tabIndex=-1;shade.addEventListener('click',close);document.body.appendChild(shade);
    var header=el('header','uxn-header');header.id='uzmedWorkspaceHeader';menuButton=button('Menyuni ochish','menu','uxn-icon-button');menuButton.id='uzmedSidebarToggle';menuButton.setAttribute('aria-controls','uzmedSidebar');menuButton.setAttribute('aria-expanded','false');menuButton.addEventListener('click',open);header.appendChild(menuButton);var title=el('div','uxn-heading');title.appendChild(el('span','uxn-heading-brand','UZMED'));heading=el('span','uxn-heading-section','Chat');title.appendChild(heading);header.appendChild(title);action=button('Yangi chat ochish','compose','uxn-compose');action.id='uzmedWorkspaceAction';action.appendChild(el('span','','Chat'));action.addEventListener('click',newChat);header.appendChild(action);app.prepend(header);
    status=el('div','uxn-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.appendChild(status);
    mountHistoryFilter();root.setAttribute('data-uzmed-navigation','sidebar-v12');lastScreen=screen();active=definitions.find(x=>x.screen===lastScreen&&!x.panel)?.key||'chat';resize();sync();if(!history.state?.[key])history.replaceState(state({version:12,screen:'uzmed-home-screen',section:'home',drawer:false,index:0}),'');
    window.goBack=back;
    document.addEventListener('keydown',e=>{if(!opened||!enabled()||document.querySelector('dialog[open]'))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key==='Tab'){var focusable=Array.from(sidebar.querySelectorAll('button,a,input,[tabindex]')).filter(n=>!n.hidden&&!n.disabled&&n.tabIndex>=0&&visible(n));var first=focusable[0],last=focusable[focusable.length-1];if(!sidebar.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last){e.preventDefault();(e.shiftKey?last:first)?.focus();}}},true);
    window.addEventListener('popstate',e=>{var destination=e.state&&e.state[key];if(opened&&!destination?.drawer)closeVisual(true);if(!destination||destination.version!==12||authOpen()){schedule();return;}position=Number.isSafeInteger(destination.index)?destination.index:0;if(destination.drawer){if(!opened&&!desktop.matches){opened=true;opener=menuButton;originalInert=app.inert;root.setAttribute('data-uzmed-drawer','open');sidebar.inert=false;sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-hidden','false');menuButton.setAttribute('aria-expanded','true');app.inert=true;sidebar.querySelector('.uxn-close').focus();}return;}replaying=true;try{if(destination.section!==active||destination.screen!==screen()){if(definitions.some(d=>d.key===destination.section)&&definitions.find(d=>d.key===destination.section).screen===destination.screen)activate(destination.section,true);else if(document.getElementById(destination.screen)&&typeof window.showScreen==='function'){window.showScreen(destination.screen);active=destination.section;lastScreen=screen();sync();}}}finally{requestAnimationFrame(()=>{replaying=false;});}});
    // Close a routed overlay by returning to the view that actually opened it.
    var closeSelector='#uzdp-panel .uzdp-x,.ucs-ov .ucs-x,.ugr-ov .ugr-x,#uzmedV5Close,#uzPriceClose,#uzdx2Wrap .uzdx2-x';
    document.addEventListener('click',function(event){
      if(dispatching||replaying||!event.target.closest?.(closeSelector))return;
      var d=definitions.find(x=>x.key===active);if(!d?.panel||!panelVisible(d))return;
      event.preventDefault();event.stopImmediatePropagation();back();
    },true);
    document.addEventListener('keydown',function(event){
      if(event.key!=='Escape'||opened||dispatching||replaying)return;
      var d=definitions.find(x=>x.key===active);
      if(!d?.panel||!['interactions','scores','growth','models','prices','differential'].includes(active)||!panelVisible(d))return;
      event.preventDefault();event.stopImmediatePropagation();back();
    },true);
    var watched=new Set(['uzmedAuthOverlay','doseCalcPanel','tahlilPanel','uia-sp-panel','uzdx2Wrap','uzdp-panel','uzmedV5Modal']);document.addEventListener('click',schedule);new MutationObserver(records=>{if(records.some(r=>r.target.classList?.contains('screen')||watched.has(r.target.id)||r.target===document.body||r.type==='childList'&&r.target===document.body))schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});
    desktop.addEventListener('change',resize);window.addEventListener('uzmed:auth-change',()=>{closeVisual(false);schedule();});
    window.UZMEDNavigation={version:12,open:open,close:close,activate:activate,back:back,definitions:definitions.map(d=>({key:d.key,label:d.label,group:d.group,source:d.source,screen:d.screen})),current:()=>snapshot(opened)};return true;
  }
  if(!boot()){var attempts=0,timer=setInterval(()=>{if(boot()||++attempts>60)clearInterval(timer);},100);}
})();
