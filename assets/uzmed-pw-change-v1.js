/* UZMED: profil oynasida "Parolni o'zgartirish" (tail-injected, v1) */
(function (W, D) {
  'use strict';
  var SB = 'https://objvfxcuxtzirnsynxgs.supabase.co';
  var KEY = 'sb_publishable_WR8t8iLJKZgpKuo8TtIZGA_y_ajSQT4';

  function readToken() {
    var stores = [];
    try { stores.push(W.localStorage); } catch (e) {}
    try { stores.push(W.sessionStorage); } catch (e) {}
    var preferred = ['uzmed_supabase_session_v2'];
    for (var s = 0; s < stores.length; s++) {
      var st = stores[s]; if (!st) continue;
      var keys = preferred.slice();
      try { for (var i = 0; i < st.length; i++) { var k = st.key(i); if (k && /supabase|sb-.*auth/i.test(k) && keys.indexOf(k) < 0) keys.push(k); } } catch (e) {}
      for (var j = 0; j < keys.length; j++) {
        try {
          var raw = st.getItem(keys[j]); if (!raw) continue;
          var o = JSON.parse(raw); var t = o && (o.access_token || (o.currentSession && o.currentSession.access_token) || (o.session && o.session.access_token));
          if (t && typeof t === 'string' && t.split('.').length === 3) return t;
        } catch (e) {}
      }
    }
    return '';
  }

  function el(tag, attrs, text) {
    var n = D.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }

  function inputRow(id, label) {
    var wrap = el('div', { 'class': 'uz-auth-field' });
    wrap.appendChild(el('label', { 'class': 'uz-auth-label', 'for': id }, label));
    var inp = el('input', { 'class': 'uz-auth-input', id: id, type: 'password', autocomplete: 'new-password', placeholder: 'Kamida 8 ta belgi' });
    inp.style.paddingLeft = '16px';
    wrap.appendChild(inp);
    return wrap;
  }

  function mount(logout) {
    if (D.getElementById('uzAuthChangePwBtn') || D.getElementById('uzPwChangeBtn')) return;
    var btn = el('button', { 'class': 'uz-auth-btn uz-auth-secondary', type: 'button', id: 'uzPwChangeBtn' }, 'Parolni o‘zgartirish');
    var panel = el('div', { id: 'uzPwChangePanel' });
    panel.hidden = true;
    panel.style.cssText = 'display:grid;gap:10px;margin:4px 0 10px';
    panel.appendChild(inputRow('uzPwNew1', 'Yangi parol'));
    panel.appendChild(inputRow('uzPwNew2', 'Yangi parolni takrorlang'));
    var save = el('button', { 'class': 'uz-auth-btn uz-auth-primary', type: 'button', id: 'uzPwSaveBtn' }, 'Yangi parolni saqlash');
    var msg = el('div', { 'class': 'uz-auth-msg', id: 'uzPwMsg', role: 'status' });
    panel.appendChild(save); panel.appendChild(msg);

    function say(t, kind) { msg.textContent = t; msg.className = 'uz-auth-msg' + (kind ? ' ' + kind : ''); msg.style.display = t ? '' : 'none'; }
    say('');

    btn.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      panel.style.display = panel.hidden ? 'none' : 'grid';
      if (!panel.hidden) { say(''); setTimeout(function () { var i = D.getElementById('uzPwNew1'); if (i) i.focus(); }, 50); }
    });
    panel.style.display = 'none';

    save.addEventListener('click', async function () {
      var a = (D.getElementById('uzPwNew1') || {}).value || '';
      var b = (D.getElementById('uzPwNew2') || {}).value || '';
      if (a.length < 8) return say('Parol kamida 8 ta belgidan iborat bo‘lsin.', 'err');
      if (a !== b) return say('Ikkala parol bir xil emas.', 'err');
      var tk = readToken();
      if (!tk) return say('Sessiya topilmadi. Chiqib, qayta kiring.', 'err');
      save.disabled = true; say('Saqlanmoqda…', 'info');
      try {
        var r = await fetch(SB + '/auth/v1/user', { method: 'PUT', headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: a }), cache: 'no-store' });
        var txt = await r.text(), d = {}; try { d = txt ? JSON.parse(txt) : {}; } catch (e) {}
        if (r.ok) {
          say('Yangi parol saqlandi. Keyingi safar shu parol bilan kirasiz.', 'ok');
          D.getElementById('uzPwNew1').value = ''; D.getElementById('uzPwNew2').value = '';
        } else {
          var code = String(d.error_code || d.code || ''), m = String(d.msg || d.message || d.error_description || '').toLowerCase();
          if (r.status === 401 || code === 'bad_jwt' || code === 'session_not_found') say('Sessiya eskirgan. Chiqib, qayta kiring va yana urinib ko‘ring.', 'err');
          else if (code === 'same_password' || m.indexOf('different from the old') >= 0) say('Yangi parol eskisidan farq qilishi kerak.', 'err');
          else if (code === 'weak_password' || m.indexOf('weak') >= 0 || m.indexOf('pwned') >= 0) say('Bu parol juda oddiy yoki internetda sizib chiqqan. Boshqa parol tanlang.', 'err');
          else if (code === 'reauthentication_needed') say('Xavfsizlik uchun qayta kirish kerak. Chiqib, qayta kiring.', 'err');
          else say('Parolni saqlab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.', 'err');
        }
      } catch (e) {
        say('Internet aloqasini tekshiring va qayta urinib ko‘ring.', 'err');
      } finally { save.disabled = false; }
    });

    logout.parentNode.insertBefore(btn, logout);
    logout.parentNode.insertBefore(panel, logout);
  }

  function scan() { var lo = D.getElementById('uzAuthLogoutBtn'); if (lo && lo.parentNode) mount(lo); }
  function start() {
    scan();
    try { new MutationObserver(function () { scan(); }).observe(D.documentElement, { childList: true, subtree: true }); } catch (e) { setInterval(scan, 1500); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})(window, document);
