/* UZMED treatment action consolidation: UI only, original handlers stay attached. */
(function (W, D) {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';
  const shapes = {
    pill: 'M10.5 3.5a6 6 0 0 1 8.5 8.5l-7 7a6 6 0 0 1-8.5-8.5z M8 8l8 8',
    template: 'M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8z M14 3v6h6 M7 13h10 M7 17h8',
    groups: 'M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z',
    search: 'M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16 M21 21l-4.3-4.3',
    plus: 'M12 5v14 M5 12h14',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z',
    settings: 'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
    money: 'M4 3h16v18l-4-3-4 3-4-3-4 3z M8 8h8 M8 12h6',
    shield: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z M9 12l2 2 4-4',
    page: 'M7 3h8l5 5v13H7z M15 3v6h5 M10 13h7 M10 17h7',
    calc: 'M5 2h14v20H5z M8 6h8v4H8z M8 14h2 M14 14h2 M8 18h2 M14 18h2',
    back: 'M15 18l-6-6 6-6 M9 12h12',
    close: 'M6 6l12 12 M18 6L6 18',
    list: 'M9 6h12 M9 12h12 M9 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
    trash: 'M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
    up: 'M12 19V5 M5 12l7-7 7 7',
    down: 'M12 5v14 M5 12l7 7 7-7',
    grip: 'M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01'
  };
  function vector(key) {
    const svg = D.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('qcx-svg');
    const p = D.createElementNS(SVG, 'path');
    p.setAttribute('d', shapes[key] || shapes.settings);
    svg.append(p);
    return svg;
  }
  function labelButton(node, key, label, iconOnly) {
    if (!node || node.dataset.qcxDone) return;
    node.dataset.qcxDone = '1';
    const original = node.textContent.trim();
    const full = label || original;
    node.setAttribute('aria-label', full);
    node.setAttribute('title', full);
    node.classList.add('qcx-action');
    const name = D.createElement('span');
    name.className = iconOnly ? 'qcx-visually-hidden' : 'qcx-action-label';
    name.textContent = iconOnly ? full : (label || original);
    node.replaceChildren(vector(key), name);
    if (iconOnly) node.classList.add('qcx-icon-only');
  }
  function detailsTitle(details, key, label) {
    const summary = details?.querySelector(':scope > summary');
    if (!summary || summary.dataset.qcxDone) return;
    summary.dataset.qcxDone = '1';
    summary.setAttribute('aria-label', label);
    const text = D.createElement('span');
    text.textContent = label;
    summary.replaceChildren(vector(key), text);
    summary.classList.add('qcx-summary');
  }
  function mount() {
    const panel = D.getElementById('panel-treatment');
    const stage = D.getElementById('uzmedQabulV3');
    const root = D.getElementById('qdxWorkbench');
    if (!panel || !stage || !root || stage.dataset.qcxMounted) return;
    stage.dataset.qcxMounted = '1';
    stage.classList.add('qcx-compact');
    panel.classList.add('qcx-treatment');
    const nav = {
      plan: ['pill', 'Retsept'],
      templates: ['template', 'Shablonlar'],
      groups: ['groups', 'Guruhlar']
    };
    const navigation=stage.querySelector('.uv3-mobile-nav');
    navigation?.querySelectorAll('.uv3-mobile-button').forEach(button => {
      const def = nav[button.dataset.pane];
      if (def) labelButton(button, def[0], def[1], true);
    });
    const toolbar=panel.closest('[data-focus-section=treatment]')?.closest('#qabulFocus')?.querySelector('.qf-tools');
    if(toolbar&&navigation){
      navigation.classList.add('qt-toolbar');
      navigation.setAttribute('aria-label','Davolash amallari');
      const manual=D.createElement('button');
      manual.type='button';
      manual.onclick=()=>D.getElementById('qcAddMedicine')?.click();
      labelButton(manual,'plus','Dorini qo‘lda qo‘shish',true);
      toolbar.prepend(navigation,manual);
      manual.classList.add('qt-manual');
      const section=panel.closest('[data-focus-section=treatment]');
      const sync=()=>{navigation.hidden=section.hidden;manual.hidden=section.hidden||W.UZMEDVisitBridge?.read().readOnly===true;};
      new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['hidden']});
      W.addEventListener('qabul:session-ready',sync);
      W.addEventListener('qabul:clinical-locked',sync);
      sync();
    }
    labelButton(D.getElementById('findDrug'), 'search', 'Dorilarni qidirish', true);
    labelButton(root.querySelector('.qdx-context .qdx-subtle'), 'edit', 'Tahrir', false);
    root.querySelector('.qdx-context .qdx-subtle')?.setAttribute('aria-label', 'Tashxisni tahrirlash');
    const box = stage.querySelector('.uv3-native-extra');
    const existing = stage.querySelector('.uv3-existing');
    const right = stage.querySelector('.uv3-right');
    const rx = stage.querySelector('.uv3-plan-rows');
    const safety = stage.querySelector('.uv3-safety');
    const tools = panel.querySelector('.qflow-treatment-tools');
    const official = root.querySelector('.qdx-official');
    if (box && existing && right && rx) {
      box.open = false;
      detailsTitle(box, 'settings', 'Asboblar');
      const featureGroup = D.createElement('div');
      featureGroup.className = 'qcx-features';
      if (official) {
        detailsTitle(official, 'money', 'Rasmiy narxlar');
        featureGroup.append(official);
        labelButton(official.querySelector('.qdx-official-content > button'), 'search', 'Narxni tekshirish', false);
      }
      if (tools) {
        tools.open = true;
        tools.classList.add('qcx-tool-actions');
        featureGroup.append(tools);
        for (const b of tools.querySelectorAll(':scope > button')) {
          if (/Hujjatda dorilar/.test(b.textContent)) labelButton(b, 'page', 'Ko‘rinish', false);
          if (/Bo‘sh qator/.test(b.textContent)) labelButton(b, 'plus', 'Bo‘sh qator', false);
          if (/Dori mosligi/.test(b.textContent) && safety?.querySelector('details')) {
            b.hidden = true;
          }
        }
      }
      if (safety) featureGroup.append(safety);
      box.insertBefore(featureGroup, box.querySelector(':scope > summary')?.nextSibling || null);
      right.insertBefore(existing, rx);
    }
    const rec = root.querySelector('.qdx-recommend');
    const recList = root.querySelector('.qdx-rec-list');
    function syncRecommendations() {
      if (!rec || !recList) return;
      const buttons = recList.querySelectorAll('.qdx-rec-pick');
      rec.hidden = buttons.length === 0;
      buttons.forEach(button => {
        if (button.dataset.qcxRow) return;
        button.dataset.qcxRow = '1';
        button.prepend(vector('search'));
      });
    }
    if (recList) {
      new MutationObserver(syncRecommendations).observe(recList, {childList: true});
      syncRecommendations();
    }
    const medList = D.getElementById('rxRows');
    const isReadOnly = () => W.UZMEDVisitBridge?.read?.()?.readOnly === true;
    let deleteTarget = null, triggerButton = null;
    const deleteDialog = D.createElement('dialog');
    deleteDialog.className = 'qcx-delete-dialog';
    deleteDialog.setAttribute('aria-labelledby', 'qcxDeleteTitle');
    const deleteContent = D.createElement('div');
    deleteContent.className = 'qcx-delete-body';
    const deleteTitle = D.createElement('h2');
    deleteTitle.id = 'qcxDeleteTitle';
    deleteTitle.textContent = 'Dorini olib tashlash';
    const deleteDescription = D.createElement('p');
    const deleteActions = D.createElement('div');
    deleteActions.className = 'qcx-delete-actions';
    const cancelDelete = D.createElement('button');
    cancelDelete.type = 'button';
    cancelDelete.textContent = 'Bekor qilish';
    const approveDelete = D.createElement('button');
    approveDelete.type = 'button';
    approveDelete.className = 'qcx-confirm-delete';
    approveDelete.textContent = 'O‘chirish';
    deleteActions.append(cancelDelete, approveDelete);
    deleteContent.append(deleteTitle, deleteDescription, deleteActions);
    deleteDialog.append(deleteContent);
    D.body.append(deleteDialog);
    function forgetTarget() {
      deleteTarget = null;
      const button = triggerButton;
      triggerButton = null;
      if (button?.isConnected) button.focus({preventScroll: true});
    }
    deleteDialog.addEventListener('close', forgetTarget);
    cancelDelete.addEventListener('click', () => deleteDialog.close());
    function removeMedication(row) {
      if (!row?.isConnected || isReadOnly()) return false;
      row.remove();
      for (const id of ['approved', 'rxChecked', 'ddiChecked']) {
        const checkbox = D.getElementById(id);
        if (checkbox) checkbox.checked = false;
      }
      W.UzmedQabul?.render?.();
      W.dispatchEvent(new W.Event('qabul:document-edit'));
      W.QabulFocus?.status?.('Dori qoralamadan olib tashlandi. O‘zgarishni saqlash tugmasini bosing.');
      return true;
    }
    approveDelete.addEventListener('click', () => {
      const row = deleteTarget;
      if (!row || isReadOnly()) {
        deleteDialog.close();
        W.QabulFocus?.status?.('Yopilgan qabuldan dorini olib tashlab bo‘lmaydi.');
        return;
      }
      deleteDialog.close();
      if (removeMedication(row)) {
        (medList?.querySelector('.rx-header .qcx-delete') ||
          D.getElementById('qcAddMedicine'))?.focus?.({preventScroll: true});
      }
    });
    function requestDelete(row, button) {
      if (isReadOnly()) {
        W.QabulFocus?.status?.('Yopilgan qabulni tahrirlab bo‘lmaydi.');
        return;
      }
      deleteTarget = row;
      triggerButton = button;
      const name = row.querySelector('[name="name"]')?.value.trim() || 'Nomi kiritilmagan dori';
      deleteDescription.textContent = '«' + name + '» qabul qoralamasidan olib tashlansinmi? Bu o‘zgarish saqlash tugmasi bosilganda bemor tarixiga yoziladi.';
      if (typeof deleteDialog.showModal === 'function') deleteDialog.showModal();
      else {
        if (W.confirm(deleteDescription.textContent)) removeMedication(row);
        forgetTarget();
      }
    }
    function renderCompactMedication(row) {
      if (!row?.classList.contains('rx-card')) return;
      const head = row.querySelector('.rx-header');
      const grid = row.querySelector('.rx-grid');
      if (!head || !grid) return;
      row.classList.add('qcx-compact-med');
      let summary = row.querySelector(':scope > .qcx-med-summary');
      if (!summary) {
        summary = D.createElement('div');
        summary.className = 'qcx-med-summary';
        head.after(summary);
      }
      const get = key => row.querySelector('[name="'+key+'"]')?.value.trim() || '';
      const facts = D.createElement('div');
      facts.className = 'qcx-med-facts';
      const fields = [
        ['inn','XNN'],['dose','Doza'],['frequency','Qabul vaqti / soni'],['route','Qabul yo‘li'],
        ['food','Ovqatga nisbatan'],['duration','Davomiyligi'],['goal','Maqsadi'],['notes','Izoh']
      ];
      for (const [key, label] of fields) {
        const value = get(key);
        const pill = D.createElement('span');
        pill.className = 'qcx-med-fact'+(value?'':' qcx-med-pending');
        if (['inn','dose','goal','notes'].includes(key)) pill.classList.add('qcx-med-wide');
        const strong = D.createElement('strong');
        strong.textContent = label;
        const text = D.createElement('span');
        text.textContent = value || 'Kiritilmagan';
        pill.append(strong, text);
        facts.append(pill);
      }
      const items = [facts];
      if (['dose','frequency','route','duration'].some(key=>!get(key))) {
        const alert = D.createElement('p');
        alert.className = 'qcx-med-alert';
        alert.textContent = 'Tayinlov to‘liq emas — dozani, qabulni, yo‘lni va muddatni tekshiring.';
        items.push(alert);
      }
      summary.replaceChildren(...items);
    }
    function refreshCardActions() {
      if (!medList) return;
      const rows = Array.from(medList.children).filter(row => row.classList.contains('rx-card'));
      for (const [index, row] of rows.entries()) {
        const head = row.querySelector('.rx-header');
        if (!head) continue;
        const title = head.querySelector(':scope > span');
        const name = row.querySelector('[name="name"]')?.value.trim();
        if (title) title.title = name || 'Dori tayinlovi';
        const edit = head.querySelector('.qc-edit-med');
        if (edit && !edit.dataset.qcxDone) labelButton(edit, 'edit', 'Tahrirlash', true);
        const drag = head.querySelector('.qc-drag-med');
        if (drag && !drag.dataset.qcxDone) {
          labelButton(drag, 'grip', 'Dori tartibini ko‘chirish', true);
          drag.classList.add('qcx-drag');
        }
        const up = head.querySelector('[aria-label="Dori qatorini yuqoriga"]');
        const down = head.querySelector('[aria-label="Dori qatorini pastga"]');
        for (const [button, key, label] of [[up, 'up', 'Yuqoriga'], [down, 'down', 'Pastga']]) {
          if (!button) continue;
          if (!button.dataset.qcxDone) {
            labelButton(button, key, label, true);
            button.setAttribute('aria-label', 'Dori qatorini ' + (key === 'up' ? 'yuqoriga' : 'pastga'));
          }
          button.disabled = isReadOnly() || (key === 'up' ? index === 0 : index === rows.length - 1);
        }
        const remove = head.querySelector('[aria-label="Dori qatorini olib tashlash"]');
        if (remove && !remove.dataset.qcxDeleteReady) {
          remove.dataset.qcxDeleteReady = '1';
          labelButton(remove, 'trash', 'Dorini o‘chirish', true);
          remove.setAttribute('aria-label', 'Dori qatorini olib tashlash');
          remove.classList.add('qcx-delete');
          remove.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            requestDelete(row, remove);
          }, true);
        }
        if (remove) remove.disabled = isReadOnly();
        if (drag) drag.disabled = isReadOnly();
        if (edit) edit.disabled = isReadOnly();
        row.classList.add('qcx-card');
        renderCompactMedication(row);
      }
    }
    if (medList) {
      new MutationObserver(refreshCardActions).observe(medList, {childList:true});
      medList.addEventListener('click', event => {
        if (event.target.closest('[aria-label="Dori qatorini yuqoriga"],[aria-label="Dori qatorini pastga"]')) {
          queueMicrotask(() => W.dispatchEvent(new W.Event('qabul:document-edit')));
        }
      });
      medList.addEventListener('input', event => {
        if (event.target.matches('[name="name"]')) {
          event.target.closest('.rx-card')?.querySelector('.rx-header > span')?.setAttribute('title', event.target.value);
        }
        const changedRow=event.target.closest('.rx-card');
        if(changedRow)renderCompactMedication(changedRow);
      });
      W.addEventListener('qabul:session-ready', refreshCardActions);
      refreshCardActions();
    }

    const decorateMed = () => refreshCardActions();
    if (medList) {
      new MutationObserver(decorateMed).observe(medList, {childList: true});
      decorateMed();
    }
    if (right) right.querySelector('.uv3-quick')?.setAttribute('hidden', '');
    W.addEventListener('qabul:session-ready', () => {
      const addButton = root.querySelector('.qdx-actions .qdx-primary');
      if (addButton) addButton.disabled = W.UZMEDVisitBridge?.read()?.readOnly === true;
    });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})(window, document);
