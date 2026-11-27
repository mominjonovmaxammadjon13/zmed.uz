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
    var script = document.createElement('script'); script.src = '/assets/uzmed-drug-workspace2.js';
    script.onload = function () { drugWorkspaceLoading = false; if (!window.UZMEDDrugWorkspace) document.documentElement.setAttribute('data-uzmed-drug-workspace', 'failed'); schedule(); };
    script.onerror = function () { drugWorkspaceLoading = false; document.documentElement.setAttribute('data-uzmed-drug-workspace', 'failed'); };
    document.head.appendChild(script);
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
      var target = event.target.closest && event.target.closest('#uzPriceMenu, #nav-dorilar, [data-ux-rail="drugs"], #uzSideMenu [onclick*="dorilar"], .drug-card, [onclick*="showAllergyDrugDetail"]');
      if (!target) return;
      if (target.id === 'uzPriceMenu' && root.getAttribute('data-uzmed-drug-workspace') === 'failed') return;
      if (target.matches('#nav-dorilar,[data-ux-rail="drugs"]') && root.getAttribute('data-uzmed-drug-workspace') === 'failed') root.removeAttribute('data-uzmed-drug-workspace');
      window.__uzmedDrugWorkspaceRequested = true;
      if (target.id === 'uzPriceMenu') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (typeof window.closeMenu === 'function') window.closeMenu();
        var nativeDrugs = document.getElementById('nav-dorilar');
        if (nativeDrugs) nativeDrugs.click();
      }
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
