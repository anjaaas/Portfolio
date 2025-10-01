// sketch.js – Spielwiese ohne lokale Galerie
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const canvas = $('#sketch'); if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sizeInp = $('#size');
  const toolBtns  = document.querySelectorAll('.btn[data-tool]');
  const colorBtns = document.querySelectorAll('.swatch');

  let tool = 'pen';
  let color = '#000';
  let size  = parseInt(sizeInp.value, 10) || 4;
  let drawing = false, last = null;
  const strokes = [], redoStack = [];

  const fitCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssH = Math.max(360, Math.round(cssW * 0.5));
    canvas.style.width = cssW + 'px';
    canvas.style.height= cssH + 'px';
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  };

  const getPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY ?? (e.touches && e.touches[0].clientY)) - rect.top;
    return { x, y };
  };

  const start = (pt) => { drawing = true; last = pt; strokes.push({ tool, color, size, points:[pt] }); redoStack.length=0; };
  const move  = (pt) => { if(!drawing) return; const s=strokes.at(-1); s.points.push(pt); draw(last, pt, s); last=pt; };
  const end   = () => { drawing = false; last = null; };

  const draw = (a,b,s) => {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s.size;
    if (s.tool==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.strokeStyle='rgba(0,0,0,1)'; }
    else { ctx.globalCompositeOperation='source-over'; ctx.strokeStyle=s.color; }
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
  };

  const redraw = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const s of strokes){ for(let i=1;i<s.points.length;i++){ draw(s.points[i-1], s.points[i], s); } }
  };

  // Pointer + Maus Fallback
  const down = (e)=>{ e.preventDefault(); start(getPoint(e)); canvas.setPointerCapture?.(e.pointerId); };
  const moveEv= (e)=>{ e.preventDefault(); move(getPoint(e)); };
  const up   = (e)=>{ e.preventDefault(); end(); };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove',  moveEv);
  ['pointerup','pointercancel','pointerleave'].forEach(t => canvas.addEventListener(t, up));
  canvas.addEventListener('mousedown', (e)=>{ e.preventDefault(); start(getPoint(e)); });
  canvas.addEventListener('mousemove', (e)=>{ if(drawing){ e.preventDefault(); move(getPoint(e)); } });
  ['mouseup','mouseleave'].forEach(t => canvas.addEventListener(t, up));

  // Controls
  sizeInp.addEventListener('input', ()=> size = parseInt(sizeInp.value,10) || 4);
  toolBtns.forEach(btn => btn.addEventListener('click', ()=>{ tool=btn.dataset.tool; toolBtns.forEach(b=>b.setAttribute('aria-pressed', String(b===btn))); }));
  colorBtns.forEach(btn => btn.addEventListener('click', ()=>{ colorBtns.forEach(b=>b.classList.remove('is-active')); btn.classList.add('is-active'); color=btn.dataset.color; }));

  // Toolbar actions
  document.querySelector('.sketch-toolbar')?.addEventListener('click', (e)=>{
    const a = e.target.closest('.btn'); if(!a) return;
    const act = a.dataset.action;
    if (act==='undo'){ if(!strokes.length) return; redoStack.push(strokes.pop()); redraw(); }
    if (act==='redo'){ if(!redoStack.length) return; strokes.push(redoStack.pop()); redraw(); }
    if (act==='clear'){ strokes.length=0; redoStack.length=0; redraw(); }
    if (act==='download'){
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
      link.href = url; link.download = `skizze-${ts}.png`; link.click();
    }
  });

  // Shortcuts: P/E, Ctrl+Z / Ctrl+Shift+Z
  document.addEventListener('keydown', (e)=>{
    if (e.target.closest('input,textarea')) return;
    if (e.key.toLowerCase()==='p'){ tool='pen'; toolBtns[0].click(); }
    if (e.key.toLowerCase()==='e'){ tool='eraser'; toolBtns[1].click(); }
    if (e.key==='z' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); if(e.shiftKey) document.querySelector('[data-action="redo"]').click(); else document.querySelector('[data-action="undo"]').click(); }
  });

  window.addEventListener('resize', fitCanvas);
  if (document.fonts?.ready) document.fonts.ready.then(fitCanvas);
  fitCanvas();
})();
