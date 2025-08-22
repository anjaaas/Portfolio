// main.js — dynamische Header-Höhe + dezenter Schatten beim Scroll
(() => {
  const hdr  = document.querySelector('header');
  const root = document.documentElement;
  if (!hdr) return;

  const setHeaderHeight = () => {
    const h = hdr.offsetHeight || 0;
    root.style.setProperty('--header-h', `${h}px`);
  };

  // 1) sofort & bei Layout-Änderungen aktualisieren
  setHeaderHeight();
  window.addEventListener('load', setHeaderHeight);
  window.addEventListener('resize', setHeaderHeight);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setHeaderHeight).catch(() => {});
  }
  if (window.ResizeObserver) {
    new ResizeObserver(setHeaderHeight).observe(hdr);
  }

  // 2) optischer Hinweis ab kleinem Scroll (Schatten)
  const onScroll = () => {
    if (window.scrollY > 10) hdr.classList.add('header--scrolled');
    else hdr.classList.remove('header--scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
