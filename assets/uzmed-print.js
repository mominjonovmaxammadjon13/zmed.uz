(function () {
  'use strict';
  const token = location.hash.slice(1), status = document.getElementById('printStatus'), button = document.getElementById('qdNativePrint'), root = document.getElementById('qabulPrint');
  history.replaceState(null, '', location.pathname);
  function fit() { const width=root.querySelector('.docPage')?.offsetWidth||794;root.style.setProperty('--qd-print-scale', String(Math.min(1, (innerWidth-24)/width))); }
  function print() { try { window.print(); } catch (_) { status.textContent = 'Brauzerning Ulashish → Chop etish amalini tanlang.'; } }
  button.onclick = print;
  window.addEventListener('resize', fit);
  window.addEventListener('pagehide', () => { root.replaceChildren(); button.disabled = true; });
  (async () => {
    try {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw Error('Havola eskirgan. UZMED’dan qayta chop eting.');
      const response = await fetch('/api/patients/print-document', { method:'POST', credentials:'omit', cache:'no-store', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token}) });
      const data = await response.json();
      if (!response.ok) throw Error(data.message || 'Hujjat ochilmadi.');
      // The server renders an allowlisted document tree; raw client HTML is never accepted.
      root.innerHTML = data.html;
      if(root.querySelector('.docCard')){
        const style=document.createElement('style');
        style.textContent='@page{size:A4;margin:16mm}@media print{#qabulPrint .docCard{width:100%!important;min-width:0!important;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important}}';
        document.head.append(style);
      }
      const paper=[...root.querySelectorAll('.docFolio')].some(n=>/· A5 ·/.test(n.textContent))?'A5':'A4';
      if(paper==='A5'){const style=document.createElement('style');style.textContent='@page{size:A5;margin:0}#qabulPrint .docPage{width:148mm!important;min-width:148mm!important;max-width:148mm!important;height:210mm!important;min-height:210mm!important;max-height:210mm!important}#qabulPrint .docPage[data-density=dense]>.docBody{height:calc(210mm - 9mm - 16mm - 2mm)}#qabulPrint .docPage[data-density=compact]>.docBody{height:calc(210mm - 11mm - 17mm - 2mm)}#qabulPrint .docPage[data-density=normal]>.docBody{height:calc(210mm - 14mm - 18mm - 2mm)}';document.head.append(style);}
      document.querySelector('#qabulPrintTools strong').textContent='UZMED · '+paper+' hujjat';
      button.disabled = false; fit();
      status.textContent = paper+' hujjat tayyor. Printer, nusxalar va sahifalarni chop etish oynasida tanlang.';
      await document.fonts.ready;
      requestAnimationFrame(() => requestAnimationFrame(print));
    } catch (error) { status.textContent = error.message; }
  })();
})();
