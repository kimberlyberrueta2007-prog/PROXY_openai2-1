// client-side script — uses proxy at /api/proxy
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const sizeInput = document.getElementById('size');
const colorInput = document.getElementById('color');
const toolSelect = document.getElementById('tool');
const promptInput = document.getElementById('prompt');
const logEl = document.getElementById('log');

let drawing = false;
let currentStroke = [];
let strokes = [];

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(650 * dpr);
  canvas.style.height = '650px';
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  redraw();
}
window.addEventListener('resize', setupCanvas);
setupCanvas();

function log(msg) {
  const p = document.createElement('div');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(p);
}

function renderStroke(s, preservePush=true) {
  if (!s || !s.points || s.points.length === 0) return;
  ctx.save();
  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = s.color || '#111';
  }

  if (s.tool === 'watercolor') {
    ctx.globalAlpha = s.alpha || 0.35;
    ctx.lineWidth = s.width || 10;
    for (let pass = 0; pass < 3; pass++) {
      ctx.beginPath();
      const jitter = (pass - 1) * 0.9;
      const p0 = s.points[0];
      ctx.moveTo(p0.x + jitter, p0.y + jitter);
      for (let i = 1; i < s.points.length; i++) {
        const p = s.points[i];
        ctx.lineTo(p.x + jitter, p.y + jitter);
      }
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = s.alpha || 1.0;
    ctx.lineWidth = s.width || 4;
    ctx.beginPath();
    const p0 = s.points[0];
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i];
      const prev = s.points[i - 1];
      const midX = (prev.x + p.x) / 2;
      const midY = (prev.y + p.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (preservePush) strokes.push(s);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  for (const s of strokes) {
    renderStroke(s, false);
  }
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  return { x, y };
}

canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  currentStroke = {
    tool: toolSelect.value,
    width: parseFloat(sizeInput.value),
    color: colorInput.value,
    alpha: toolSelect.value === 'watercolor' ? 0.45 : 1.0,
    points: []
  };
  const p = getPointerPos(e);
  currentStroke.points.push(p);
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  const p = getPointerPos(e);
  currentStroke.points.push(p);
  redraw();
  renderStroke(currentStroke, false);
});

canvas.addEventListener('pointerup', (e) => {
  if (!drawing) return;
  drawing = false;
  if (currentStroke.points.length > 0) {
    strokes.push(currentStroke);
    currentStroke = [];
  }
  redraw();
});

document.getElementById('clear').addEventListener('click', () => {
  strokes = [];
  redraw();
  log('Canvas limpiado.');
});
document.getElementById('undo').addEventListener('click', () => {
  strokes.pop();
  redraw();
  log('Deshacer última acción.');
});
document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'diseño_ia.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  log('Imagen descargada.');
});

async function callProxy(prompt, mode='sketch') {
  const resp = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode })
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Proxy error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  return data;
}

function safeParseJSON(text) {
  try { return JSON.parse(text); } catch(e) {
    const start = text.indexOf('{'); const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try { return JSON.parse(text.substring(start, end+1)); } catch(err) {}
    }
    return null;
  }
}

function applyAIJson(obj) {
  if (!obj) return;
  if (obj.mode === 'tutorial' || obj.steps) {
    const steps = obj.steps || obj.tutorial || obj.instructions;
    log('Tutorial recibido:');
    (steps || []).forEach((s,i)=> log(`${i+1}. ${s}`));
    return;
  }
  if (obj.mode !== 'strokes' && !obj.strokes) {
    log('Formato inesperado de IA.');
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const newStrokes = [];
  for (const s of obj.strokes) {
    const pts = (s.points || []).map(p => ({ x: p.x * rect.width, y: p.y * rect.height }));
    newStrokes.push({
      tool: s.tool || 'brush',
      width: s.width || 6,
      color: s.color || '#111111',
      alpha: s.alpha ?? (s.tool === 'watercolor' ? 0.4 : 1.0),
      points: pts
    });
  }
  for (const ns of newStrokes) strokes.push(ns);
  redraw();
  log('Trazos IA aplicados al canvas.');
}

document.getElementById('aiSketch').addEventListener('click', async () => {
  const prompt = promptInput.value.trim() || 'Boceto artístico de flores y rosas, líneas sueltas.';
  log('Solicitando boceto al proxy...');
  try {
    const resp = await callProxy(prompt, 'sketch');
    if (typeof resp === 'string') {
      const obj = safeParseJSON(resp);
      if (!obj) { log('Respuesta no JSON: ' + resp.slice(0,400)); return; }
      applyAIJson(obj);
    } else {
      applyAIJson(resp);
    }
  } catch (err) { log('Error: ' + err.message); }
});

document.getElementById('aiArt').addEventListener('click', async () => {
  const prompt = promptInput.value.trim() || 'Acuarela de rosas y hojas, pinceladas suaves.';
  log('Solicitando obra artística al proxy...');
  try {
    const resp = await callProxy(prompt, 'art');
    if (typeof resp === 'string') {
      const obj = safeParseJSON(resp);
      if (!obj) { log('Respuesta no JSON: ' + resp.slice(0,400)); return; }
      applyAIJson(obj);
    } else {
      applyAIJson(resp);
    }
  } catch (err) { log('Error: ' + err.message); }
});

document.getElementById('aiTutorial').addEventListener('click', async () => {
  const prompt = promptInput.value.trim() || 'Tutorial para dibujar rostro: estructura, proporciones, ojos, nariz, boca, sombreado.';
  log('Solicitando tutorial al proxy...');
  try {
    const resp = await callProxy(prompt, 'tutorial');
    if (typeof resp === 'string') {
      const obj = safeParseJSON(resp);
      if (!obj) { log('Respuesta no JSON: ' + resp.slice(0,400)); return; }
      applyAIJson(obj);
    } else {
      applyAIJson(resp);
    }
  } catch (err) { log('Error: ' + err.message); }
});

function initialGuide() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  ctx.save();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
  ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
  ctx.stroke();
  ctx.restore();
}
initialGuide();
