/* UZMED: shared monochrome presentation for every site entry point. */
(function () {
  'use strict';
  if (window.UZMEDSiteIcons) return;
  var paths = {"flask": "M9 3h6M10 3v6.2L5.6 17.9A2 2 0 0 0 7.4 21h9.2a2 2 0 0 0 1.8-3.1L14 9.2V3M7.6 15h8.8", "search": "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20.5 20.5 16 16", "scan": "M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16M7 12h10", "pill": "M10.6 20.4 3.6 13.4a4.9 4.9 0 0 1 7-7l7 7a4.9 4.9 0 0 1-7 7ZM8.6 8.6l7 7", "tree": "M8.5 3h7a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM3.5 16h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM16.5 16h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM12 8v3M5.5 16v-2a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v2", "calc": "M6 2.5h12a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5ZM8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.8h8", "stetho": "M6 3v5.5a4.5 4.5 0 0 0 9 0V3M4.5 3h3M13.5 3h3M10.5 13v2.6a4 4 0 0 0 8 0V14M18.5 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z", "camera": "M4 7h2.8l1.5-2.2h7.4L17.2 7H20a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 7ZM12 9.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z", "close": "M6.5 6.5l11 11M17.5 6.5l-11 11", "chart": "M3.5 3.5v17h17M7 14.5l3.6-4 3 2.6L20 7", "baby": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.2 10.2h.01M14.8 10.2h.01M9 14.6a4 4 0 0 0 6 0", "syringe": "M21 3l-3 3M17.6 2.6l3.8 3.8M19 7 9 17l-4 1 1-4L16 4M12.6 8.6l2.8 2.8M9.6 11.6l2.8 2.8", "heart": "M12 20.5 4.3 12.8a4.8 4.8 0 0 1 6.8-6.8l.9.9.9-.9a4.8 4.8 0 0 1 6.8 6.8Z", "folder": "M4 19V6a1.5 1.5 0 0 1 1.5-1.5h3.6l2 2h6.4A1.5 1.5 0 0 1 19 8v2M3.5 19.5 6 11.5h15l-2.5 8Z", "book": "M4.5 5A2.5 2.5 0 0 1 7 2.5h12.5v19H7A2.5 2.5 0 0 1 4.5 19ZM4.5 19A2.5 2.5 0 0 1 7 16.5h12.5", "globe": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3.2 12h17.6M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z", "db": "M12 3c-4.4 0-8 1.3-8 3s3.6 3 8 3 8-1.3 8-3-3.6-3-8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3", "clip": "M9 3.5h6a1 1 0 0 1 1 1v1.2H8V4.5a1 1 0 0 1 1-1ZM8 5.7H6.2a1.5 1.5 0 0 0-1.5 1.5v12.6a1.5 1.5 0 0 0 1.5 1.5h11.6a1.5 1.5 0 0 0 1.5-1.5V7.2a1.5 1.5 0 0 0-1.5-1.5H16", "refresh": "M3.5 12a8.5 8.5 0 0 1 14.6-5.9M20.5 12a8.5 8.5 0 0 1-14.6 5.9M18.6 3.2v3h-3M5.4 20.8v-3h3", "cloud": "M17.3 19.5a4.6 4.6 0 0 0 .3-9.2 6.1 6.1 0 0 0-11.7 1.6 3.8 3.8 0 0 0 .8 7.6Z", "bars": "M3 21h18M6.5 21V11M12 21V4.5M17.5 21v-6.5", "pencil": "M17 3.4a2.1 2.1 0 0 1 3 3L8.2 18.2l-4.2 1 1-4.2Z", "warn": "M12 4 2.9 20h18.2ZM12 10v4.2M12 17.4h.01", "info": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v5.2M12 7.9h.01", "check": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.4 12.2l2.6 2.6 4.6-4.8", "xcirc": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6", "gift": "M3.5 8.5h17v4h-17ZM4.7 12.5h14.6V20a1 1 0 0 1-1 1H5.7a1 1 0 0 1-1-1ZM12 8.5V21M12 8.5S10.7 4.5 8.2 4.5a2 2 0 0 0 0 4M12 8.5s1.3-4 3.8-4a2 2 0 0 1 0 4", "people": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", "shield": "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6", "settings": "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6", "mic": "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8", "phone": "M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3l2 5-3 2a16 16 0 0 0 7 7l2-3Z", "lock": "M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2ZM8 10V6a4 4 0 0 1 8 0v4M12 14v3", "chat": "M21 11a9 9 0 0 1-9 9H4l-3 2 2-6a9 9 0 1 1 18-5ZM7 10h10M7 14h6", "robot": "M5 7h14v13H5ZM12 3v4M10 3h4M2 11v5M22 11v5M9 11h.01M15 11h.01M9 16h6", "image": "M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M15 7h.01", "printer": "M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6ZM17 11h.01", "save": "M4 3h14l3 3v15H3V3ZM7 3v6h10V3M7 21v-7h10v7", "trash": "M3 6h18M6 6l1 15h10l1-15M9 6V3h6v3M10 10v7M14 10v7", "paperclip": "M8 12l7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3M6 16 17 5", "scale": "M12 3v18M6 21h12M3 6h18M5 6l-4 8h8ZM19 6l-4 8h8Z", "sun": "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v2M12 21v2M1 12h2M21 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4", "moon": "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z", "menu": "M4 6h16M4 12h16M4 18h16", "plus": "M12 4v16M4 12h16", "send": "M22 2 9 15M22 2l-8 20-5-7-7-5Z", "wallet": "M3 6V4h16v4M3 6l18 2v13H3ZM16 12h5v5h-5ZM17 14.5h.01", "store": "M3 10v11h18V10M2 10l3-7h14l3 7ZM9 21v-7h6v7", "star": "M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z", "tool": "M14 7a5 5 0 0 0-6 6L2 19l3 3 6-6a5 5 0 0 0 6-6l-4 3-2-2Z", "box": "M3 7l9-5 9 5v10l-9 5-9-5ZM3 7l9 5 9-5M12 12v10M7 4l10 6", "monitor": "M2 3h20v14H2ZM12 17v5M7 22h10", "microscope": "M9 3l6 3-4 8-6-3ZM12 14a5 5 0 0 1 1 10M3 21h18M5 16h7M8 2l8 4", "music": "M9 18V5l12-3v13M9 8l12-3M5 16a4 3 0 1 0 0 6 4 3 0 0 0 0-6M17 13a4 3 0 1 0 0 6 4 3 0 0 0 0-6", "person": "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 22v-3a8 8 0 0 1 16 0v3", "spark": "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z", "medical": "M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z", "external": "M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7"};
  var names = {"🧪": "flask", "🔍": "search", "🔎": "search", "🩻": "scan", "💊": "pill", "🌳": "tree", "🧮": "calc", "🩺": "stetho", "⚕": "stetho", "📷": "camera", "✕": "close", "✖": "close", "✗": "close", "❌": "xcirc", "📈": "chart", "📊": "bars", "👶": "baby", "💉": "syringe", "❤": "heart", "♥": "heart", "📂": "folder", "📁": "folder", "🗂": "folder", "📚": "book", "📖": "book", "🌐": "globe", "🧠": "db", "🗄": "db", "📋": "clip", "🔄": "refresh", "☁": "cloud", "✎": "pencil", "✏": "pencil", "⚠": "warn", "🚨": "warn", "⛔": "warn", "ℹ": "info", "✅": "check", "✓": "check", "🎁": "gift", "🎟": "gift", "👥": "people", "🤝": "people", "🛡": "shield", "⚙": "settings", "🎙": "mic", "📞": "phone", "🔐": "lock", "🔒": "lock", "💬": "chat", "🤖": "robot", "🖼": "image", "🖨": "printer", "💾": "save", "🗑": "trash", "🧹": "trash", "📎": "paperclip", "⚖": "scale", "☀": "sun", "☾": "moon", "☰": "menu", "➕": "plus", "✚": "plus", "➤": "send", "✈": "send", "💰": "wallet", "🏪": "store", "👑": "star", "♛": "star", "🧰": "tool", "📦": "box", "🧊": "box", "🖥": "monitor", "🔬": "microscope", "♬": "music", "👨": "person", "♙": "person", "✦": "spark", "♧": "medical", "⭐": "star", "👨‍⚕": "stetho", "👩‍⚕": "stetho", "↗": "external"};
  var labels = {"flask": "Laboratoriya", "search": "Qidirish", "scan": "Tasvir", "pill": "Dori", "tree": "MKB bo‘limlari", "calc": "Hisoblash", "stetho": "Shifokor", "camera": "Kamera", "close": "Yopish", "chart": "O‘sish grafigi", "baby": "Bola", "syringe": "Emlash", "heart": "Yurak", "folder": "Papka", "book": "Kitob", "globe": "Til", "db": "Ma’lumotlar bazasi", "clip": "Hujjat", "refresh": "Yangilash", "cloud": "Bulut", "bars": "Diagramma", "pencil": "Tahrirlash", "warn": "Diqqat", "info": "Ma’lumot", "check": "Tayyor", "xcirc": "Xato", "gift": "Sovg‘a", "people": "Foydalanuvchilar", "shield": "Himoya", "settings": "Sozlamalar", "mic": "Mikrofon", "phone": "Telefon", "lock": "Qulf", "chat": "Suhbat", "robot": "Yordamchi", "image": "Rasm", "printer": "Chop etish", "save": "Saqlash", "trash": "O‘chirish", "paperclip": "Biriktirish", "scale": "Huquq", "sun": "Kun rejimi", "moon": "Tun rejimi", "menu": "Menyu", "plus": "Qo‘shish", "send": "Yuborish", "wallet": "To‘lov", "store": "Dorixona", "star": "Tanlangan", "tool": "Vositalar", "box": "To‘plam", "monitor": "Ekran", "microscope": "Tekshiruv", "music": "Ovoz", "person": "Foydalanuvchi", "spark": "Yordamchi", "medical": "UZMED", "external": "Havolani ochish"};
  var ns = 'http://www.w3.org/2000/svg';
  var skip = 'script,style,title,svg,math,textarea,input,pre,code,[contenteditable]:not([contenteditable="false"])';
  // Match complete flag, keycap, skin-tone and ZWJ sequences before single pictograms.
  var pattern = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}[\uFE0E\uFE0F]?[\u{1F3FB}-\u{1F3FF}]?(?:\u200D\p{Extended_Pictographic}[\uFE0E\uFE0F]?[\u{1F3FB}-\u{1F3FF}]?)*|[☰☾♙♛♥♧♬✎✓✕✗✚✦➤])/gu;
  var count = 0;
  function matches(value) {
    return Array.from(value.matchAll(pattern)).filter(function (m) {
      // Copyright/trademark text is typography, not an interface sticker.
      return !/^[©®™]$/.test(m[0]);
    });
  }
  function icon(symbol) {
    var key = symbol.replace(/[\uFE0E\uFE0F]|[\u{1F3FB}-\u{1F3FF}]/gu, '');
    var name = names[key] || (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(key) ? 'globe' : 'medical');
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20'); svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('data-uzmed-icon', name);
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', labels[name] || 'UZMED ' + name);
    // Preserve textContent for existing handlers/copy/export code; SVG titles are not painted.
    var title = document.createElementNS(ns, 'title'); title.textContent = symbol;
    var path = document.createElementNS(ns, 'path'); path.setAttribute('d', paths[name]);
    svg.append(title, path);
    return svg;
  }
  function replaceText(node) {
    var parent = node.parentElement;
    if (!parent || parent.closest(skip)) return;
    var value = node.nodeValue, found = matches(value);
    if (!found.length) return;
    // Native options cannot contain SVG. Keep their submitted values unchanged.
    if (parent.tagName === 'OPTION') {
      if (!parent.hasAttribute('value')) parent.setAttribute('value', parent.value);
      node.nodeValue = value.replace(pattern, '').trim();
      return;
    }
    var fragment = document.createDocumentFragment(), start = 0;
    found.forEach(function (match) {
      fragment.appendChild(document.createTextNode(value.slice(start, match.index)));
      fragment.appendChild(icon(match[0]));
      start = match.index + match[0].length; count++;
    });
    fragment.appendChild(document.createTextNode(value.slice(start)));
    node.replaceWith(fragment);
  }
  function styles() {
    if (!document.head || document.getElementById('uzmed-site-icons-style')) return;
    var style = document.createElement('style'); style.id = 'uzmed-site-icons-style';
    style.textContent = 'svg[data-uzmed-icon]{display:inline-block!important;width:20px!important;height:20px!important;flex:0 0 20px!important;vertical-align:-.2em;pointer-events:none!important;fill:none!important;stroke:currentColor!important}';
    document.head.appendChild(style);
  }
  function scan(root) {
    if (!root || !root.isConnected) return;
    if (root.nodeType === 3) { replaceText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1 && root.closest(skip)) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(replaceText);
  }
  // Observe the document, not body: the UZMED loader replaces the whole HTML root.
  // Only added/changed text is scanned; no polling, navigation wrappers or time limit.
  var observer = new MutationObserver(function (records) {
    styles();
    records.forEach(function (record) {
      if (record.type === 'characterData') scan(record.target);
      else record.addedNodes.forEach(scan);
    });
  });
  observer.observe(document, { childList: true, subtree: true, characterData: true });
  styles(); scan(document);
  window.UZMEDSiteIcons = {
    version: '20261025-v2',
    scan: function () { styles(); scan(document); return count; },
    count: function () { return count; }
  };
})();
