(function (W, D) {
  'use strict';
  if (W.UZMEDBrain) { W.UZMEDBrain.mount(); return; }

  const S = { owner: '', epoch: 0, capabilities: {}, enabled: false, records: new Map(), requests: new Set(), dialog: null, timer: null, sequence: 0, loading: false, privateConversation: false, checkedOwner: null };
  function node(tag, cls, text) { const n = D.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = String(text); return n; }
  function button(text, action, cls) { const b = node('button', 'ub-btn ' + (cls || ''), text); b.type = 'button'; if (action) b.addEventListener('click', action); return b; }
  function owner() { try { return String(W.UZMEDAuth?.getState()?.user?.id || ''); } catch (_) { return ''; } }
  function patientMode() { return D.body.classList.contains('up-patients-view') || D.getElementById('patients-screen')?.classList.contains('active'); }
  function active(record) { return record && record.epoch === S.epoch && record.owner === S.owner && record.owner === owner() && !patientMode(); }
  function sensitive(text) {
    return /(?:\+?998[\s()-]*(?:\d[\s()-]*){9}|\b\d{14}\b|\b(?:patient_id|visit_id|passport|pasport|pinfl|jshshir)\b|(?:F\.?\s*I\.?\s*Sh\.?|ism[-\s]*familiya|tug[‘'’]?ilgan sana|date_of_birth|manzil|telefon)\s*[:=]|\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b)/i.test(String(text || ''));
  }
  function safeUrl(raw) { try { const u = new URL(String(raw || '')); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : null; } catch (_) { return null; } }
  function closeDialog() { if (!S.dialog) return; const { overlay, previousFocus } = S.dialog; overlay.remove(); S.dialog = null; if (previousFocus?.isConnected) previousFocus.focus(); }
  function clear() {
    S.epoch++; S.requests.forEach(x => x.abort()); S.requests.clear(); S.records.clear(); S.capabilities = {}; S.enabled = false; S.loading = false; S.checkedOwner = null; S.privateConversation = false;
    D.querySelectorAll('[data-brain-record], #ubMenuLink').forEach(n => n.remove()); closeDialog();
  }
  function dialog(title) {
    closeDialog(); const overlay = node('div', 'ub-overlay'), box = node('section', 'ub-dialog'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ubDialogTitle');
    const head = node('header', 'ub-dialog-head'), h = node('h2', '', title); h.id = 'ubDialogTitle'; const x = button('×', closeDialog, 'ub-close'); x.setAttribute('aria-label', 'Yopish'); head.append(h, x); box.append(head); overlay.append(box);
    const previousFocus = D.activeElement; D.body.append(overlay); S.dialog = { overlay, box, previousFocus };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
    overlay.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeDialog(); } if (e.key === 'Tab') { const f = [...box.querySelectorAll('button:not(:disabled),input,textarea,select,a[href]')].filter(n => !n.hidden); if (!f.length) return; if (e.shiftKey && D.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && D.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } } });
    x.focus(); return box;
  }
  function message(box, value, error) { let p = box.querySelector('.ub-message'); if (!p) { p = node('p', 'ub-message'); box.append(p); } p.textContent = value; p.setAttribute('role', error ? 'alert' : 'status'); }
  async function api(path, method = 'GET', body) {
    const actor = owner(), epoch = S.epoch; if (!actor || actor !== S.owner) throw Error('UZMED akkauntingizga qayta kiring.');
    const token = await W.UZMEDAuth.getAccessToken(); if (!token || owner() !== actor || epoch !== S.epoch) throw Error('Sessiya tugagan. Akkauntingizga qayta kiring.');
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest(); S.requests.add(x); x.open(method, '/api/brain' + path, true); x.timeout = 45000; x.setRequestHeader('Authorization', 'Bearer ' + token); if (body !== undefined) x.setRequestHeader('Content-Type', 'application/json');
      x.onload = () => { S.requests.delete(x); if (owner() !== actor || S.epoch !== epoch) return reject(Error('Akkaunt o‘zgargan.')); let r; try { r = JSON.parse(x.responseText || '{}'); } catch (_) { r = {}; } if (x.status >= 200 && x.status < 300) resolve(r); else { const e = Error(r.error?.message || r.message || (typeof r.error === 'string' ? r.error : 'So‘rov bajarilmadi (' + x.status + ').')); e.status = x.status; reject(e); } };
      x.onerror = x.ontimeout = () => { S.requests.delete(x); reject(Error('Brain serveri javob bermadi. Qayta urinib ko‘ring.')); }; x.onabort = () => { S.requests.delete(x); reject(Error('So‘rov yopildi.')); }; x.send(body === undefined ? null : JSON.stringify(body));
    });
  }
  function appendSources(footer, knowledge) {
    if (!knowledge || !Array.isArray(knowledge.sources) || !knowledge.sources.length) return;
    const sources = knowledge.sources.slice(0, 8), cited = new Set(Array.isArray(knowledge.citedSourceIds) ? knowledge.citedSourceIds.map(String) : []);
    const selected = cited.size ? sources.filter(s => cited.has(String(s.id || s.source_id))) : sources;
    if (!selected.length) return;
    const wrap = node('details', 'ub-sources'), summary = node('summary', '', cited.size ? 'Foydalanilgan manbalar' : 'Taqdim etilgan manbalar'); wrap.append(summary);
    selected.forEach(s => { const row = node('div', 'ub-source'), title = String(s.source_name || s.title || 'UZMED Knowledge Base').slice(0, 180), version = String(s.source_version || s.version || '').slice(0, 40), url = safeUrl(s.url || s.source_url), label = title + (version ? ' · ' + version : ''); if (url) { const link = node('a', '', label); link.href = url; link.rel = 'noopener noreferrer'; link.target = '_blank'; row.append(link); } else row.append(node('span', '', label)); wrap.append(row); });
    footer.append(wrap);
  }
  function updateSaveButtons() { D.querySelectorAll('[data-brain-save]').forEach(b => { const record = S.records.get(b.dataset.brainSave); b.hidden = !S.enabled || !S.capabilities.editor || !active(record) || !record.saveEligible || S.privateConversation; }); }
  function preview(record) {
    if (!active(record) || !S.capabilities.editor || !S.enabled || !record.saveEligible || S.privateConversation) return;
    const box = dialog('Obsidian’ga saqlash'); const copy = node('p', 'ub-muted', 'Faqat umumiy tibbiy bilimni saqlang. Bemor ismi, telefoni, shaxsiy tahlili va individual kartasi umumiy bilimlar bazasiga kiritilmaydi. Yozuv avval draft bo‘ladi; tekshiruvdan keyin klinik qidiruvga ruxsat beriladi.'); box.append(copy);
    const form = node('form', 'ub-form'), titleLabel = node('label', 'ub-field', 'Sarlavha'), title = node('input'); title.name = 'title'; title.required = true; title.maxLength = 180; title.value = 'UZMED klinik bilim'; title.autocomplete = 'off'; titleLabel.append(title);
    const contentLabel = node('label', 'ub-field', 'Saqlanadigan bilim'), content = node('textarea'); content.name = 'content'; content.required = true; content.maxLength = 50000; content.rows = 12; content.value = record.text; contentLabel.append(content);
    const confirmLabel = node('label', 'ub-confirm'), confirm = node('input'); confirm.type = 'checkbox'; confirm.required = true; confirmLabel.append(confirm, node('span', '', 'Bu yozuvda bemorga oid shaxsiy ma’lumot yo‘q.'));
    const controls = node('div', 'ub-actions'), submit = button('Draft sifatida saqlash', null, 'ub-primary'); submit.type = 'submit'; controls.append(button('Bekor qilish', closeDialog), submit); form.append(titleLabel, contentLabel, confirmLabel, controls); box.append(form);
    function validate() { const blocked = sensitive(title.value + '\n' + content.value); submit.disabled = blocked; if (blocked) message(box, 'Shaxsiy identifikator aniqlangan. Umumiy bilim sifatida qayta yozing.', true); else box.querySelector('.ub-message')?.remove(); }
    form.addEventListener('input', validate); validate();
    form.addEventListener('submit', async e => { e.preventDefault(); if (!form.reportValidity() || !active(record) || S.privateConversation || sensitive(title.value + '\n' + content.value)) return; submit.disabled = true; try { const result = await api('/notes', 'POST', { title: title.value.trim(), content: content.value.trim(), originContext: 'chat' }); if (!active(record) || S.dialog?.box !== box) return; const duplicate = result.duplicate || result.status === 'duplicate'; form.remove(); message(box, duplicate ? 'Draft saqlandi. Mavjud yozuv bilan o‘xshashlik aniqlandi; takroriy bilimni tekshiring.' : 'Draft saqlandi. Tekshiruv tasdiqlanmaguncha klinik javoblarga qo‘shilmaydi.'); box.append(button('Yopish', closeDialog, 'ub-primary')); } catch (err) { if (active(record) && S.dialog?.box === box) { message(box, err.message, true); submit.disabled = false; } } });
  }
  function receiveAnswer(detail) {
    if (!detail || detail.originContext !== 'chat' || detail.owner !== (owner() || 'anonymous') || patientMode() || !String(detail.text || '').trim()) return;
    if (detail.epoch !== undefined && detail.epoch !== (W.UZMEDAIBackendV5?.epoch || 0)) return;
    const record = { id: 'brain-' + (++S.sequence), owner: owner(), epoch: S.epoch, text: String(detail.text).slice(0, 50000), knowledge: detail.knowledge, saveEligible: detail.knowledge?.saveEligible !== false && !sensitive(detail.text) };
    // The existing chat renderer finishes in its promise continuation.
    W.setTimeout(() => {
      if (!active(record)) return; const host = D.getElementById('aiMessages'); if (!host) return;
      const footer = node('div', 'ub-answer-actions'); footer.dataset.brainRecord = record.id;
      appendSources(footer, record.knowledge); const save = button('Obsidian’ga saqlash', () => preview(record), 'ub-save'); save.dataset.brainSave = record.id; footer.append(save); host.append(footer); S.records.set(record.id, record);
      while (S.records.size > 12) { const id = S.records.keys().next().value; S.records.delete(id); D.querySelector('[data-brain-record="' + id + '"]')?.remove(); } updateSaveButtons();
    }, 0);
  }
  function number(value) { return typeof value === 'number' && Number.isFinite(value) ? String(value) : '—'; }
  function date(value) { const d = new Date(value); return value && Number.isFinite(d.getTime()) ? d.toLocaleString('uz-UZ') : '—'; }
  async function openHealth() {
    if (!S.capabilities.admin) return; W.closeMenu?.(); const epoch = S.epoch, box = dialog('Knowledge Brain holati'); message(box, 'Holat yuklanmoqda…');
    try { const data = await api('/health'); if (epoch !== S.epoch || S.dialog?.box !== box) return; box.querySelector('.ub-message')?.remove(); const h = data.health || data, c = h.counts || h; const statusMap = { ready: 'Ishlayapti', disabled: 'O‘chirilgan', unavailable: 'Ulanmagan', stale_index: 'Indeks eskirgan — mavjud UZMED manbalari ishlatilmoqda', lexical_degraded: 'Qisman ishlayapti', degraded: 'Qisman ishlayapti' };
      box.append(node('p', 'ub-health-status', statusMap[h.status] || h.status || 'Holat aniqlanmagan'));
      const vaultStatus = h.vault?.status || h.vaultStatus || h.vault_status, vector = h.vector_db || h.vector;
      const vaultLabel = h.vault?.available === true || h.vault_available === true || ['available', 'ready'].includes(vaultStatus) ? 'Mavjud' : h.vault?.available === false || h.vault_available === false || vaultStatus === 'unavailable' ? 'Ulanmagan' : statusMap[vaultStatus] || vaultStatus || '—';
      const vectorLabel = vector?.healthy === true ? (vector.configured === false ? 'Embedding ulanmagan' : 'Ishlayapti') : vector?.healthy === false ? 'Xato' : vector?.status || h.vectorHealth || h.vector_db_health || '—';
      const dl = node('dl', 'ub-health-grid'), rows = [['Vault', vaultLabel], ['Indexlangan yozuvlar', number(c.indexedNotes ?? c.indexed_notes ?? c.notes)], ['Verified', number(c.verifiedNotes ?? c.verified_notes ?? c.verified)], ['Draft', number(c.draftNotes ?? c.draft_notes ?? c.draft)], ['Arxiv', number(c.archivedNotes ?? c.archived_notes ?? c.archived)], ['Fragmentlar', number(c.totalChunks ?? c.total_chunks ?? c.chunks)], ['Embeddinglar', number(c.embeddingCount ?? c.embedding_count ?? c.embeddings)], ['Xatoli fayllar', number(c.failedFiles ?? c.failed_files ?? c.failed)], ['Kutilayotgan fayllar', number(c.pendingFiles ?? c.pending_files ?? c.pending)], ['Qarama-qarshiliklar', number(c.conflicts)], ['Takroriy yozuvlar', number(c.duplicates)], ['Oxirgi indeks', date(h.lastIndex ?? h.last_index)], ['Oxirgi muvaffaqiyatli sync', h.sync_configured === false ? 'Sozlanmagan' : date(h.lastSuccessfulSync ?? h.last_successful_sync)], ['Vector indeks', vectorLabel]];
      rows.forEach(([label, value]) => { const row = node('div'); row.append(node('dt', '', label), node('dd', '', value)); dl.append(row); }); box.append(dl, node('p', 'ub-muted', 'Bu panel yozuvlar matni, vault manzili yoki bemor ma’lumotini ko‘rsatmaydi.'));
    } catch (err) { if (epoch === S.epoch && S.dialog?.box === box) message(box, err.message, true); }
  }
  function mount() {
    if (!S.capabilities.admin || !S.enabled) D.getElementById('ubMenuLink')?.remove();
    const menu = D.querySelector('#uzSideMenu .uz-menu-body'); if (menu && S.capabilities.admin && S.enabled && !D.getElementById('ubMenuLink')) { const b = button('Knowledge Brain', openHealth); b.id = 'ubMenuLink'; b.className = 'uz-menu-item'; const icon = node('span', 'uz-menu-ico', '◈'), copy = node('span', 'uz-menu-txt'); copy.append(node('span', 'uz-menu-title', 'Knowledge Brain'), node('span', 'uz-menu-desc', 'Bilimlar indeksi va tekshiruv holati')); b.replaceChildren(icon, copy, node('span', 'uz-menu-arrow', '›')); menu.append(b); } updateSaveButtons(); return !!menu;
  }
  async function refresh(force = false) {
    const current = owner(); if (current !== S.owner) { clear(); S.owner = current; } if (!current || S.loading || (!force && S.checkedOwner === current)) { mount(); return; }
    const epoch = S.epoch; S.loading = true; S.checkedOwner = current;
    try { const status = await api('/auth/status'); if (epoch !== S.epoch || owner() !== current) return; S.capabilities = status.capabilities || {}; S.enabled = status.enabled !== false && status.features?.brain !== false; mount(); } catch (_) { if (epoch === S.epoch) { S.capabilities = {}; S.enabled = false; mount(); } } finally { if (epoch === S.epoch) S.loading = false; }
  }
  W.UZMEDBrain = { version: '1.0', mount, refresh: () => refresh(true), receiveAnswer, openHealth };
  W.addEventListener('uzmed:ai-answer', e => receiveAnswer(e.detail));
  W.addEventListener('uzmed:auth-changed', () => refresh(true));
  D.addEventListener('click', e => { if (e.target?.closest('#aiClearBtn, [data-ai-clear], [onclick*="clearAiChat"]')) { S.privateConversation = false; S.records.clear(); D.querySelectorAll('[data-brain-record]').forEach(n => n.remove()); } });
  D.addEventListener('change', e => { if (e.target?.matches('#aiChatFileInput') && e.target.files?.length) { S.privateConversation = true; updateSaveButtons(); if (S.dialog?.box.querySelector('.ub-form')) closeDialog(); } }, true);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', () => refresh(), { once: true }); else refresh();
  S.timer = W.setInterval(() => { refresh(); if ((patientMode() || S.privateConversation) && S.dialog?.box.querySelector('.ub-form')) closeDialog(); }, 1000);
})(window, document);
