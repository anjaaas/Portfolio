// sketch.js – robustes Sizing + Pointer/Maus, keine Galerie-Abhängigkeiten
(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const canvas = $('#sketch');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wrap = document.querySelector('.sketch-canvas-wrap');

  // UI
  const sizeInp  = $('#size');
  const toolBtns = document.querySelectorAll('.btn[data-tool]');
  const colorBtns= document.querySelectorAll('.swatch');

  // State
  let tool = 'pen';
  let color = '#000';
  let size  = parseInt(sizeInp?.value || '4', 10) || 4;
  let drawing = false, last = null;
  const strokes = [], redoStack = [];

  // Helpers
  const getPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawSegment = (a, b, s) => {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s.size;
    if (s.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = s.color;
    }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();
  };

  const redraw = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const s of strokes) for (let i=1;i<s.points.length;i++) drawSegment(s.points[i-1], s.points[i], s);
  };

  // HiDPI + korrektes Sizing (nach redraw-Definition!)
  const fitCanvas = () => {
    if (!wrap) return;
    const dpr  = window.devicePixelRatio || 1;
    const cssW = Math.max(1, wrap.clientWidth);
    const cssH = Math.max(360, Math.round(cssW * 0.5)); // ~2:1 Fläche

    // sichtbare Größe
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';

    // Pixelgröße
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    // auf CSS-Pixel „umstellen“
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);

    redraw();
  };

  // Zeichnen
  const start = (pt) => { drawing = true; last = pt; strokes.push({tool,color,size,points:[pt]}); redoStack.length = 0; };
  const move  = (pt) => { if(!drawing) return; const s=strokes[strokes.length-1]; s.points.push(pt); drawSegment(last, pt, s); last = pt; };
  const end   = () => { drawing = false; last = null; };

  // Pointer + Maus Fallback
  canvas.addEventListener('pointerdown', (e)=>{ e.preventDefault(); canvas.setPointerCapture?.(e.pointerId); start(getPoint(e)); });
  canvas.addEventListener('pointermove',  (e)=>{ if(!drawing) return; e.preventDefault(); move(getPoint(e)); });
  ['pointerup','pointercancel','pointerleave'].forEach(t => canvas.addEventListener(t, (e)=>{ e.preventDefault(); end(); }));
  canvas.addEventListener('mousedown', (e)=>{ e.preventDefault(); start(getPoint(e)); });
  canvas.addEventListener('mousemove', (e)=>{ if(drawing){ e.preventDefault(); move(getPoint(e)); } });
  ['mouseup','mouseleave'].forEach(t => canvas.addEventListener(t, (e)=>{ e.preventDefault(); end(); }));

  // Controls
  sizeInp?.addEventListener('input', ()=> size = parseInt(sizeInp.value,10) || 4);
  toolBtns.forEach(btn => btn.addEventListener('click', ()=> {
    tool = btn.dataset.tool;
    toolBtns.forEach(b => b.setAttribute('aria-pressed', String(b===btn)));
  }));
  colorBtns.forEach(btn => btn.addEventListener('click', ()=> {
    colorBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    color = btn.dataset.color;
  }));

  // Toolbar-Aktionen
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

  // Init
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('orientationchange', fitCanvas);
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(wrap);
  if (document.fonts?.ready) document.fonts.ready.then(fitCanvas);
  fitCanvas();
})();
