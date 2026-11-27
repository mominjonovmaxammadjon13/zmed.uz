/* Isolated UZMED qabul pilot navigation: no clinical/API changes. */
(function () {
  'use strict';
  const URL = '/?app=qabul&telegram_miniapp=1';
  let pending=['qabul'].includes(new URLSearchParams(location.search).get('app'))||new URLSearchParams(location.search).get('section')==='qabul',shellSubject='';
  function subject(){const state=window.UZMEDAuth?.getState?.();return state?.loggedIn?String(state.user?.id||''):'';}
  function closeQabul(){document.getElementById('uzmedQabulShell')?.remove();shellSubject='';}
  function openQabul(){
    const user=subject();if(!user){pending=true;window.UZMEDAuth?.open?.();return;}
    pending=false;
    // Same-page navigation: the real UZMED app, user session and sidebar remain mounted.
    const module=window.UZMEDQabulStart;
    if(!module?.open){pending=true;return;}
    module.open();
  }
  function accountChanged(){const user=subject();if(!user||(shellSubject&&user!==shellSubject))closeQabul();if(user&&pending)openQabul();}
  window.addEventListener('uzmed:auth-change',accountChanged);
  window.addEventListener('uzmed:qabul-open',()=>{pending=true;openQabul();});
  function launch(event){event.preventDefault();pending=true;openQabul();}
  function el(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value) node.textContent = value;
    return node;
  }
  function sideMenu() {
    const parent = document.querySelector('#uzSideMenu .uz-menu-body');
    if (!parent) return false;
    if (parent.querySelector('#uzmedQabulMenuEntry')) return true;
    const link = el('a', 'uz-menu-item');
    link.id = 'uzmedQabulMenuEntry';
    link.href = URL;
    link.addEventListener('click',launch);
    link.style.cssText = 'display:flex;color:inherit;text-decoration:none';
    link.setAttribute('aria-label', 'Shifokor qabuli');
    link.appendChild(el('span', 'uz-menu-ico', '🩺'));
    const body = el('span', 'uz-menu-txt');
    body.appendChild(el('span', 'uz-menu-title', 'Shifokor qabuli'));
    body.appendChild(el('span', 'uz-menu-desc', 'Konsultatsiya va hujjatlar · pilot'));
    link.appendChild(body);
    link.appendChild(el('span', 'uz-menu-arrow', '›'));
    const items = Array.from(parent.querySelectorAll('button.uz-menu-item'));
    const neighbor = items.find(item => item.querySelector('.uz-menu-title')?.textContent.trim() === 'UZMED AI');
    if (neighbor) neighbor.insertAdjacentElement('afterend', link);
    else (parent.querySelector('.uz-menu-section') || parent).insertAdjacentElement('afterend', link);
    return true;
  }
  function desktopRail() {
    const rail = document.querySelector('#uzmedWorkspaceRail .ux-rail-nav');
    if (!rail) return false;
    const group = rail.querySelector('[data-ux-group="Ish muhiti"]');
    if (!group) return false;
    if (group.querySelector('#uzmedQabulRailEntry')) return true;
    const link = el('a', 'ux-rail-button');
    link.id = 'uzmedQabulRailEntry';
    link.href = URL;
    link.addEventListener('click',launch);
    link.style.textDecoration = 'none';
    link.setAttribute('aria-label', 'Shifokor qabuli — pilot');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z');
    svg.appendChild(path);
    link.appendChild(svg);
    link.appendChild(el('span', '', 'Shifokor qabuli'));
    const neighbor = group.querySelector('[data-ux-rail="patients"]');
    if (neighbor) neighbor.insertAdjacentElement('afterend', link);
    else group.appendChild(link);
    return true;
  }
  function mount() {
    const mobileMenu = sideMenu();
    const rail = desktopRail();
    return mobileMenu && (rail || !window.matchMedia('(min-width: 1024px)').matches);
  }
  function start() {
    if(pending&&window.UZMEDAuth?.getState?.().loggedIn)openQabul();
    let count = 0;
    if (mount()) return;
    const timer = setInterval(() => { if (mount() || ++count >= 100) clearInterval(timer); }, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('resize', () => requestAnimationFrame(mount), { passive: true });
})();
