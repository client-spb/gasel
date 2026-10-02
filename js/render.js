// =====================================================================
//  ОТРИСОВКА: параллакс, рельеф, Газель, персонажи, частицы, погода
// =====================================================================
'use strict';
const cv = $('cv'), ctx = cv.getContext('2d');
let DPR = 1;
const IMG = {};
const layerCache = {};
// слой фона, заранее уменьшенный до нужной высоты — копируется без масштабирования
function layerImg(name, h) {
  const img = IMG[name]; if (!img) return null;
  const ph = Math.max(1, Math.round(h * DPR)), key = name + '|' + ph;
  let c = layerCache[key];
  if (!c) {
    for (const k in layerCache) if (k.startsWith(name + '|')) delete layerCache[k];
    c = document.createElement('canvas'); c.height = ph; c.width = Math.max(1, Math.round(img.width * ph / img.height));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
    layerCache[key] = c;
  }
  return c;
}
const V = { x: 0, y: 0, ppm: 30, sx: 0, sy: 0 };
let glowSpr = null;
let QUALITY = 1;   // снижается автоматически, если кадры не успевают
function resizeCanvas() {
  DPR = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1) * QUALITY);
  for (const k in layerCache) delete layerCache[k];
  cv.style.width = APPW + 'px'; cv.style.height = APPH + 'px';
  cv.width = Math.round(APPW * DPR); cv.height = Math.round(APPH * DPR);
}
const SX = x => (x - V.x) * V.ppm + APPW / 2 + V.sx;
const SY = y => APPH / 2 - (y - V.y) * V.ppm + V.sy;
function meta(n) { return (window.ASSET_META && ASSET_META[n]) || null; }
function sprite(name, wx, wy, scale, rot, alpha, flip) {
  const img = IMG[name], m = meta(name); if (!img || !m) return;
  const k = V.ppm / (m.ppm || 100) * (scale || 1);
  const ax = m.ax !== undefined ? m.ax : m.w / 2, ay = m.ay !== undefined ? m.ay : m.h / 2;
  ctx.save(); ctx.translate(SX(wx), SY(wy)); if (rot) ctx.rotate(-rot); ctx.scale(flip ? -k : k, k);
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.drawImage(img, -ax, -ay); ctx.restore();
}
function item(name, wx, wy, size, rot, alpha) {
  const img = IMG[name]; if (!img) return;
  const s = size * V.ppm;
  ctx.save(); ctx.translate(SX(wx), SY(wy)); if (rot) ctx.rotate(-rot); if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
}
// узорная заливка, привязанная к миру
const patCache = {};
function worldPattern(name, metersPerTile) {
  const img = IMG[name]; if (!img) return null;
  let p = patCache[name]; if (!p) { try { p = ctx.createPattern(img, 'repeat'); } catch (e) { p = null; } patCache[name] = p; }
  if (!p) return null;
  const s = metersPerTile * V.ppm / img.width;
  try {
    const tile = img.width * s;
    const e = ((APPW / 2 + V.sx - V.x * V.ppm) % tile + tile) % tile, f = ((APPH / 2 + V.sy + V.y * V.ppm) % tile + tile) % tile;
    p.setTransform(new DOMMatrix([s, 0, 0, s, e, f]));
  } catch (e) {}
  return p;
}
function makeGlow() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,170,.9)'); gr.addColorStop(0.4, 'rgba(255,210,80,.35)'); gr.addColorStop(1, 'rgba(255,200,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}

// ---------------- фоновые слои ----------------
function drawLayers(theme, alpha, camX, vy) {
  const t = THEMES[theme], W = APPW, H = APPH, ppm = V.ppm;
  
  ctx.save(); ctx.globalAlpha = alpha;
  const fh = Math.max(H * 0.84, 240), far = layerImg('bg_' + theme + '_far', fh), fw = far ? far.width / DPR : 2048 * fh / 768;
  const fTop = H * 0.5 - 0.7 * fh + vy * 0.1;
  ctx.fillStyle = t.sky[0]; ctx.fillRect(0, 0, W, fTop + 2);
  if (far) { let off = ((camX * ppm * 0.035) % fw + fw) % fw; for (let x = -off; x < W; x += fw) ctx.drawImage(far, Math.floor(x), Math.round(fTop), fw, fh); }
  else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, t.sky[0]); g.addColorStop(0.6, t.sky[1]); g.addColorStop(1, t.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = t.ground; ctx.fillRect(0, fTop + fh - 1, W, H);
  const mh = Math.max(H * 0.42, 130), mid = layerImg('bg_' + theme + '_mid', mh), mw = mid ? mid.width / DPR : 1, mBot = H * 0.8 + vy * 0.25;
  if (mid) { let off = ((camX * ppm * 0.14) % mw + mw) % mw; for (let x = -off; x < W; x += mw) ctx.drawImage(mid, Math.floor(x), Math.round(mBot - mh), mw, mh); }
  ctx.fillStyle = t.mid; ctx.fillRect(0, mBot - 2, W, H);
  const nh = Math.max(H * 0.27, 90), near = layerImg('bg_' + theme + '_near', nh), nw = near ? near.width / DPR : 1, nBot = H * 0.94 + vy * 0.45;
  if (near) { let off = ((camX * ppm * 0.32) % nw + nw) % nw; for (let x = -off; x < W; x += nw) ctx.drawImage(near, Math.floor(x), Math.round(nBot - nh), nw, nh); }
  ctx.fillStyle = t.near; ctx.fillRect(0, nBot - 2, W, H);
  ctx.restore();
}

// ---------------- рельеф ----------------
const ROADTEX = { 1: 'tex_dirt', 2: 'tex_mud', 3: 'tex_ice', 4: 'tex_snowroad' };
function drawWater(T, x0, x1, theme) {
  const t = THEMES[theme];
  T.waters.forEach(w => {
    if (w.x1 < x0 || w.x0 > x1 || w.mud) return;
    const sx0 = SX(w.x0), sx1 = SX(w.x1), sy = SY(w.y);
    const g = ctx.createLinearGradient(0, sy, 0, sy + 6 * V.ppm);
    g.addColorStop(0, w.river ? t.water : '#5a6a5a'); g.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = g; ctx.fillRect(sx0, sy, sx1 - sx0, APPH - sy + 10);
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
    const tt = performance.now() / 1000;
    for (let i = 0; i < 6; i++) { const yy = sy + 3 + i * 0.35 * V.ppm, ph = (tt * 0.6 + i * 0.37) % 1; ctx.beginPath(); ctx.moveTo(sx0 + (sx1 - sx0) * ph, yy); ctx.lineTo(sx0 + (sx1 - sx0) * ph + 0.9 * V.ppm, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(sx0, sy - 1, sx1 - sx0, 2);
  });
}
function drawGround(T, theme) {
  const t = THEMES[theme], ppm = V.ppm;
  const x0 = V.x - APPW / 2 / ppm - 3, x1 = V.x + APPW / 2 / ppm + 3;
  const i0 = Math.max(0, Math.floor((x0 - TX0) / DX)), i1 = Math.min(T.h.length - 1, Math.ceil((x1 - TX0) / DX));
  if (i1 <= i0) return;
  drawWater(T, x0, x1, theme);
  // земля
  ctx.beginPath(); ctx.moveTo(SX(TX0 + i0 * DX), APPH + 20);
  for (let i = i0; i <= i1; i++) ctx.lineTo(SX(TX0 + i * DX), SY(T.hv[i]));
  ctx.lineTo(SX(TX0 + i1 * DX), APPH + 20); ctx.closePath();
  ctx.fillStyle = worldPattern(t.soil, 3.4) || t.ground; ctx.fill();
  ctx.save(); ctx.clip();
  // тень под дорогой
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.4 * ppm; ctx.lineJoin = 'round';
  ctx.beginPath(); for (let i = i0; i <= i1; i++) { const x = SX(TX0 + i * DX), y = SY(T.h[i] - 0.75); i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  ctx.restore();
  // трава у обочины (позади дороги)
  const gimg = IMG[t.grass];
  if (gimg) {
    const w = 1.5 * ppm, h = w * 96 / 128;
    for (let i = i0 - (i0 % 3); i <= i1; i += 3) {
      if (i < 0 || T.s[i] === 5) continue; const hh = (i * 2654435761 >>> 0) % 100; if (hh < 25) continue;
      const x = TX0 + i * DX + (hh % 7) * 0.1, v = hh % 4;
      ctx.drawImage(gimg, v * 128, 0, 128, 96, SX(x) - w / 2, SY(T.hv[i]) - h + 0.12 * ppm, w, h);
    }
  }
  // дорога: прогоны одинакового покрытия
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  ctx.strokeStyle = t.roadEdge; ctx.lineWidth = 0.6 * ppm;
  ctx.beginPath(); for (let i = i0; i <= i1; i++) { const x = SX(TX0 + i * DX), y = SY(T.h[i] - 0.28); i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  let i = i0;
  while (i < i1) {
    const s = T.s[i]; let j = i; while (j < i1 && T.s[j] === s) j++;
    ctx.beginPath();
    for (let k = Math.max(i0, i - 1); k <= Math.min(i1, j + 1); k++) { const x = SX(TX0 + k * DX), y = SY(T.h[k] - 0.21); k === Math.max(i0, i - 1) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    const texName = s === 0 || s === 5 ? t.road : ROADTEX[s];
    ctx.lineWidth = 0.44 * ppm;
    ctx.strokeStyle = s === 5 ? '#8a9096' : (worldPattern(texName, 2.4) || '#4a4c50');
    ctx.stroke();
    if (s === 2) { ctx.strokeStyle = 'rgba(120,90,50,.35)'; ctx.lineWidth = 0.12 * ppm; ctx.stroke(); }
    if (s === 3) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.06 * ppm; ctx.stroke(); }
    i = j;
  }
  // кромка
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = Math.max(1, 0.04 * ppm);
  ctx.beginPath(); for (let k = i0; k <= i1; k++) { const x = SX(TX0 + k * DX), y = SY(T.h[k]) + 1; k === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  // разметка на асфальте
  if (t.road === 'tex_asphalt') {
    ctx.strokeStyle = 'rgba(240,240,230,.55)'; ctx.lineWidth = Math.max(1, 0.05 * ppm);
    for (let k = i0 - (i0 % 8); k < i1; k += 8) { if (k < 0 || T.s[k] !== 0) continue; ctx.beginPath(); ctx.moveTo(SX(TX0 + k * DX), SY(T.h[k] - 0.2)); ctx.lineTo(SX(TX0 + (k + 4) * DX), SY(T.h[Math.min(T.h.length - 1, k + 4)] - 0.2)); ctx.stroke(); }
  }
  // мосты
  T.bridges.forEach(b => {
    if (b.x1 < x0 || b.x0 > x1) return;
    const sy = SY(b.y), sx0 = SX(b.x0 - 1), sx1 = SX(b.x1 + 1);
    const gg = ctx.createLinearGradient(0, sy, 0, sy + 0.8 * ppm); gg.addColorStop(0, '#9aa0a6'); gg.addColorStop(1, '#4a5056');
    ctx.fillStyle = gg; ctx.fillRect(sx0, sy + 0.42 * ppm, sx1 - sx0, 0.55 * ppm);
    for (let x = b.x0 + 4; x < b.x1; x += 12) sprite('bridge_pillar', x, b.y - 6.3, 1);
    ctx.fillStyle = '#c03a2a'; ctx.fillRect(sx0, sy + 0.42 * ppm, sx1 - sx0, Math.max(2, 0.05 * ppm));
  });
}
function drawBridgeRails(T) {
  const x0 = V.x - APPW / 2 / V.ppm - 4, x1 = V.x + APPW / 2 / V.ppm + 4;
  T.bridges.forEach(b => { if (b.x1 < x0 || b.x0 > x1) return; for (let x = b.x0 + 2; x < b.x1; x += 4) sprite('bridge_rail', x, b.y - 0.05, 1); });
}

// ---------------- декор и персонажи ----------------
function cityText(d) {
  const sx = SX(d.x), sy = SY(G.T.visAt(d.x) + 1.9), w = 2.3 * V.ppm;
  let fs = 0.5 * V.ppm; ctx.font = fs + 'px ' + FONT; const m = ctx.measureText(d.text).width; if (m > w) fs *= w / m;
  ctx.font = fs + 'px ' + FONT; ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.text, sx, sy);
  if (d.start) { ctx.strokeStyle = '#d82a1a'; ctx.lineWidth = 0.09 * V.ppm; ctx.beginPath(); ctx.moveTo(sx - 1.2 * V.ppm, sy + 0.35 * V.ppm); ctx.lineTo(sx + 1.2 * V.ppm, sy - 0.35 * V.ppm); ctx.stroke(); }
}
function drawDecorBack(T) {
  const x0 = V.x - APPW / 2 / V.ppm - 8, x1 = V.x + APPW / 2 / V.ppm + 8;
  for (const d of T.decor) {
    if (d.x < x0 - 6) continue; if (d.x > x1 + 6) break;
    if (d.type === 'sprite' && d.back) {
      const dep = d.depth || 0;
      sprite(d.img, d.x, T.visAt(d.x) - 0.08 + dep * 0.55, (d.scale || 1) * (dep ? 1 - dep * 0.14 : 1));
    } else if (d.type === 'km') {
      sprite('kmpost', d.x, T.visAt(d.x) - 0.05, 0.9);
      ctx.font = Math.max(8, 0.17 * V.ppm) + 'px ' + FONT_N; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(d.km), SX(d.x), SY(T.visAt(d.x) + 0.67));
    } else if (d.type === 'city') {
      sprite('city_sign', d.x, T.visAt(d.x) - 0.05, 1); cityText(d);
    } else if (d.type === 'rail') {
      for (let x = Math.max(d.x0, x0 - 4); x < Math.min(d.x1, x1 + 4); x += 4) sprite('barrier', x, T.visAt(x) - 0.05, 1, Math.atan(T.slopeAt(x)));
    }
  }
}
function drawDecorFront(T) {
  const x0 = V.x - APPW / 2 / V.ppm - 4, x1 = V.x + APPW / 2 / V.ppm + 4;
  for (const d of T.decor) {
    if (d.x < x0) continue; if (d.x > x1) break;
    if (d.type === 'cone') sprite('cone', d.x, T.heightAt(d.x) - 0.05, 1);
    else if (d.type === 'sprite' && !d.back) sprite(d.img, d.x, T.heightAt(d.x) - (d.sink || 0), d.scale || 1);
    else if (d.type === 'log') {
      const r = d.r * V.ppm, sx = SX(d.x), sy = SY(T.heightAt(d.x - d.r - 0.05) + d.r);
      const g = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 1, sx, sy, r); g.addColorStop(0, '#e8c890'); g.addColorStop(0.75, '#b88a50'); g.addColorStop(1, '#5a3a1a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(90,58,26,.6)'; ctx.lineWidth = 1; for (let k = 0.3; k < 1; k += 0.25) { ctx.beginPath(); ctx.arc(sx, sy, r * k, 0, Math.PI * 2); ctx.stroke(); }
    } else if (d.type === 'shard') {
      const sx = SX(d.x), sy = SY(T.heightAt(d.x) - 0.1), h = (d.h + 0.25) * V.ppm, w = 0.6 * V.ppm;
      const g = ctx.createLinearGradient(sx - w, 0, sx + w, 0); g.addColorStop(0, '#e8fbff'); g.addColorStop(0.5, '#8ad8f0'); g.addColorStop(1, '#3a98c0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - w, sy); ctx.lineTo(sx - w * 0.2, sy - h); ctx.lineTo(sx + w * 0.3, sy - h * 0.7); ctx.lineTo(sx + w, sy); ctx.closePath(); ctx.fill();
    }
  }
}
function drawEntities(T, back) {
  const x0 = V.x - APPW / 2 / V.ppm - 5, x1 = V.x + APPW / 2 / V.ppm + 5, t = performance.now() / 1000;
  for (const e of T.ents) {
    if (e.x < x0) continue; if (e.x > x1) break; if (e.dead) continue;
    const dep = e.depth || 0;
    switch (e.type) {
      case 'gai': if (back) sprite('gai' + (e.frame || 0), e.x, T.visAt(e.x) + 0.35, 0.95); break;
      case 'babushka': if (back) sprite('babushka' + (e.frame || 0), e.x, T.visAt(e.x) + 0.45, 0.85); break;
      case 'bear': if (back) sprite('bear' + (e.frame || 0), e.x, T.visAt(e.x) + 0.3 + dep * 1.2, 1 - dep * 0.3, 0, 1 - dep * 0.5); break;
      case 'cow': case 'moose': {
        const inBack = dep > 0.25; if (inBack !== back) break;
        const name = e.type + (e.frame || 0), y = T.heightAt(e.x) + (e.hy || 0) + dep * 1.2;
        sprite(name, e.x, y, 1 - dep * 0.35, e.spin ? Math.sin(e.spin) * 0.6 : 0, 1 - Math.max(0, dep) * 0.5);
        if (e.state === 'hit') for (let k = 0; k < 3; k++) drawStar(SX(e.x - 1 + Math.cos(t * 6 + k * 2.1) * 0.6), SY(y + 1.9 + Math.sin(t * 6 + k * 2.1) * 0.2), 0.12 * V.ppm, '#ffd23a');
        break;
      }
      case 'dog': if (!back) sprite('dog' + (e.frame || 0), e.x, T.heightAt(e.x) + dep * 0.8, 1 - dep * 0.3, 0, 1 - dep * 0.6); break;
      case 'coin': case 'canister': case 'wrench': case 'cheburek': case 'magnet': {
        if (back) break;
        const bob = Math.sin(t * 3 + e.x) * 0.12, sz = e.type === 'coin' ? 0.62 : 0.95;
        if (!glowSpr) glowSpr = makeGlow();
        const gs = sz * 2.1 * V.ppm; ctx.globalAlpha = 0.7; ctx.drawImage(glowSpr, SX(e.x) - gs / 2, SY(e.y + bob) - gs / 2, gs, gs); ctx.globalAlpha = 1;
        if (e.type === 'coin') {
          const s = sz * V.ppm, sc = Math.abs(Math.cos(t * 3.2 + e.x * 0.7)) * 0.85 + 0.15;
          ctx.save(); ctx.translate(SX(e.x), SY(e.y + bob)); ctx.scale(sc, 1); if (IMG.it_coin) ctx.drawImage(IMG.it_coin, -s / 2, -s / 2, s, s); ctx.restore();
        } else item('it_' + e.type, e.x, e.y + bob, sz, Math.sin(t * 2 + e.x) * 0.15);
        break;
      }
    }
  }
}
function drawStar(x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}

// ---------------- Газель ----------------
function drawWheelAt(wx, wy, ang, chrome) {
  const img = chrome ? IMG.wheel_chrome : IMG.wheel; if (!img) return;
  const s = TRUCK.wheelR * 2 * V.ppm * 256 / 250;
  ctx.save(); ctx.translate(SX(wx), SY(wy)); ctx.rotate(ang); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
}
function drawTruckBody(px, py, a, opt) {
  const m = meta('truck_body'); if (!m || !IMG.truck_body) return;
  const P = m.ppm, k = V.ppm / P;
  ctx.save(); ctx.translate(px, py); ctx.rotate(-a); ctx.scale(k, k);
  const ox = -(m.ax + opt.com[0] * P), oy = -(m.ay - opt.com[1] * P);
  const TXp = lx => ox + m.ax + lx * P, TYp = ly => oy + m.ay - ly * P;
  if (IMG.truck_interior) ctx.drawImage(IMG.truck_interior, ox, oy);
  const head = IMG['serega_' + (opt.mood || 'norm')];
  if (head) { const hs = 0.76 * P; ctx.drawImage(head, TXp(1.2) - hs / 2, TYp(1.82) - hs / 2 + (opt.bob || 0), hs, hs); }
  if (opt.cos.includes('tree')) {
    const sw = Math.sin(opt.t * 3) * 0.25 + (opt.swing || 0);
    ctx.save(); ctx.translate(TXp(1.62), TYp(2.08)); ctx.rotate(sw);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.stroke();
    ctx.fillStyle = '#1f8a3a'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(13, 48); ctx.lineTo(-13, 48); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(16, 62); ctx.lineTo(-16, 62); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.drawImage(IMG.truck_body, ox, oy);
  // тюнинг
  if (opt.cos.includes('spoiler')) {
    ctx.fillStyle = '#1a1b1e'; ctx.fillRect(TXp(-4.15), TYp(2.98), 0.06 * P, 0.3 * P); ctx.fillRect(TXp(-3.65), TYp(2.98), 0.06 * P, 0.3 * P);
    const g = ctx.createLinearGradient(0, TYp(3.08), 0, TYp(2.92)); g.addColorStop(0, '#ff5a44'); g.addColorStop(1, '#8a120c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(TXp(-4.4), TYp(3.1)); ctx.lineTo(TXp(-3.45), TYp(3.04)); ctx.lineTo(TXp(-3.45), TYp(2.95)); ctx.lineTo(TXp(-4.4), TYp(2.98)); ctx.closePath(); ctx.fill();
  }
  if (opt.cos.includes('lights')) {
    ctx.fillStyle = '#16171a'; ctx.fillRect(TXp(0.66), TYp(2.40), 0.92 * P, 0.1 * P);
    ctx.fillRect(TXp(0.8), TYp(2.31), 0.05 * P, 0.07 * P); ctx.fillRect(TXp(1.4), TYp(2.31), 0.05 * P, 0.07 * P);
    for (let i = 0; i < 6; i++) {
      const cx = TXp(0.73 + i * 0.155), cy = TYp(2.45);
      const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 11); g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#ffe9a0'); g.addColorStop(1, '#b08a20');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
      if (opt.night) { ctx.fillStyle = 'rgba(255,240,180,.25)'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  if (opt.cos.includes('bullbar')) {
    const g = ctx.createLinearGradient(TXp(2.9), 0, TXp(3.1), 0); g.addColorStop(0, '#7a828a'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#6a727a');
    ctx.strokeStyle = g; ctx.lineWidth = 0.07 * P; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(TXp(2.86), TYp(0.5)); ctx.lineTo(TXp(3.06), TYp(0.55)); ctx.lineTo(TXp(3.08), TYp(1.22)); ctx.lineTo(TXp(2.84), TYp(1.34)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TXp(3.07), TYp(0.88)); ctx.lineTo(TXp(2.9), TYp(0.9)); ctx.stroke();
  }
  if (opt.cos.includes('flag')) {
    const fx = TXp(1.2), fy = TYp(2.70), wv = Math.sin(opt.t * 9) * 6;
    ctx.fillStyle = '#e82a1a'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx - 30, fy + wv - 6, fx - 62, fy + 4 + wv); ctx.lineTo(fx - 58, fy + 30 + wv); ctx.quadraticCurveTo(fx - 30, fy + 22 - wv, fx, fy + 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(fx - 26, fy + 14 + wv * 0.5, 5, 0, Math.PI * 2); ctx.fill();
  }
  // двери будки
  if (opt.door > 0) {
    const ang = opt.door * Math.PI * 0.48, w = Math.sin(ang) * 0.9 * P, h = 1.72 * P;
    ctx.save(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(20,10,8,.85)'; ctx.fillRect(TXp(-4.25), TYp(2.66), 0.08 * P, h - 6);
    if (IMG.door) ctx.drawImage(IMG.door, TXp(-4.25) - w, TYp(2.70), w, h);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * Math.cos(ang)) + ')'; ctx.fillRect(TXp(-4.25) - w, TYp(2.70), w, h);
    ctx.restore();
  }
  // фары в сумерках
  if (opt.night) {
    const hx = TXp(2.86), hy = TYp(1.15);
    const g = ctx.createRadialGradient(hx, hy, 4, hx + 220, hy + 30, 260); g.addColorStop(0, 'rgba(255,250,210,.55)'); g.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx, hy - 8); ctx.lineTo(hx + 520, hy - 90); ctx.lineTo(hx + 520, hy + 170); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawTruck(tr, T) {
  // тень
  const gx = tr.x, gy = T.heightAt(gx), hAbove = Math.max(0, tr.y - gy - 1);
  const sw = (4.0 - Math.min(2.4, hAbove * 0.4)) * V.ppm;
  ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.32 - hAbove * 0.05) + ')';
  ctx.beginPath(); ctx.ellipse(SX(gx), SY(gy) - 2, sw, 0.22 * V.ppm, -Math.atan(T.slopeAt(gx)), 0, Math.PI * 2); ctx.fill();
  const chrome = SAVE.cos.includes('chrome') && SAVE.cosOn.includes('chrome');
  tr.w.forEach(w => drawWheelAt(w.cx, w.cy, w.ang, chrome));
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 13) * 1.2 * Math.min(1, Math.abs(tr.speed) / 8) - clamp(tr.vy * 0.6, -6, 6);
  drawTruckBody(SX(tr.x), SY(tr.y), tr.a, { com: TRUCK.com, mood: G.mood, bob, cos: SAVE.cosOn, t, door: G.doorAng, night: G.theme === 'taiga', swing: clamp(-tr.va * 0.2, -0.6, 0.6) });
}

// ---------------- частицы ----------------
function drawParticles(list) {
  for (const p of list) {
    const k = p.t / p.life, sx = SX(p.x), sy = SY(p.y), r = Math.max(0.5, p.size * V.ppm);
    switch (p.kind) {
      case 'dust': case 'smoke': {
        const c = p.col || [150, 140, 120], a = (p.a0 || 0.38) * (1 - k);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); break;
      }
      case 'mud': case 'chunk': { const c = p.col || [70, 50, 30]; ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (1 - k * 0.6) + ')'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); break; }
      case 'snowp': ctx.fillStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); break;
      case 'water': ctx.fillStyle = 'rgba(190,225,255,' + (0.9 - k * 0.7) + ')'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); break;
      case 'spark': ctx.strokeStyle = 'rgba(255,' + Math.round(220 - k * 120) + ',80,' + (1 - k) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - p.vx * 0.03 * V.ppm, sy + p.vy * 0.03 * V.ppm); ctx.stroke(); break;
      case 'flame': { const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r); g.addColorStop(0, 'rgba(255,255,200,' + (1 - k) + ')'); g.addColorStop(0.4, 'rgba(255,160,40,' + (0.9 - k) + ')'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); break; }
      case 'star': drawStar(sx, sy, r, 'rgba(255,230,90,' + (1 - k) + ')'); break;
      case 'confetti': { const c = p.col; ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot); ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; ctx.fillRect(-r, -r * 0.4, r * 2, r * 0.8); ctx.restore(); break; }
      case 'stain': { const c = p.col; ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.75 * (1 - k)) + ')'; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.18, 0, 0, Math.PI * 2); ctx.fill(); break; }
      case 'note': {
        ctx.fillStyle = 'rgba(40,40,60,' + (1 - k) + ')'; ctx.beginPath(); ctx.ellipse(sx, sy, r * 0.35, r * 0.25, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(sx + r * 0.25, sy - r, Math.max(2, r * 0.1), r); ctx.beginPath(); ctx.moveTo(sx + r * 0.3, sy - r); ctx.quadraticCurveTo(sx + r * 0.8, sy - r * 0.7, sx + r * 0.6, sy - r * 0.3); ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); break;
      }
      case 'text': ctx.font = Math.round(r) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,' + (1 - k) + ')'; ctx.strokeText(p.text, sx, sy); ctx.fillStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.fillText(p.text, sx, sy); break;
    }
  }
}
function drawItems() {
  for (const it of G.items) {
    let name = it.img;
    if (it.mode === 'fly' && it.bounces > 0) name = 'it_goose' + (it.frame || 0);
    if (it.mode === 'run') name = 'it_cat' + (it.frame || 0);
    item(name, it.x, it.y, it.size, it.rot, it.t > it.life - 0.6 ? (it.life - it.t) / 0.6 : 1);
  }
}
function drawPopups() {
  for (const p of G.popups) {
    const k = p.t / p.life, sx = SX(p.x), sy = SY(p.y) - k * 40, sc = p.big ? 1.25 : 1;
    const a = k < 0.8 ? 1 : (1 - k) / 0.2, pop = Math.min(1, p.t * 8);
    const fs = Math.round(clamp(V.ppm * 0.55, 13, 26) * sc * (0.6 + 0.4 * pop));
    ctx.font = fs + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.globalAlpha = a; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,10,5,.85)'; ctx.strokeText(p.text, sx, sy);
    ctx.fillStyle = p.color; ctx.fillText(p.text, sx, sy); ctx.globalAlpha = 1;
  }
}

// ---------------- погода (в координатах экрана) ----------------
const WX = { list: [], kind: null };
function drawWeather(kind, dt, speed) {
  if (!kind) { WX.list.length = 0; WX.kind = null; return; }
  if (WX.kind !== kind) { WX.kind = kind; WX.list = []; const n = kind === 'leaves' ? 26 : 130; for (let i = 0; i < n; i++) WX.list.push({ x: Math.random() * APPW, y: Math.random() * APPH, z: 0.4 + Math.random() * 0.8, r: Math.random() * 6.28 }); }
  const drift = speed * V.ppm * 0.6;
  ctx.save();
  for (const p of WX.list) {
    if (kind === 'rain') {
      p.x -= (drift * p.z + 60) * dt; p.y += 900 * p.z * dt;
      ctx.strokeStyle = 'rgba(200,215,230,' + (0.25 + p.z * 0.25) + ')'; ctx.lineWidth = p.z;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (drift * p.z + 60) * 0.02, p.y - 18 * p.z); ctx.stroke();
    } else if (kind === 'snow') {
      p.x -= (drift * p.z * 0.8 + 20 + Math.sin(p.y * 0.02 + p.r) * 30) * dt; p.y += 70 * p.z * dt;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + p.z * 0.4) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + p.z * 2, 0, Math.PI * 2); ctx.fill();
    } else {
      p.x -= (drift * p.z * 0.7 + 40) * dt; p.y += (50 + Math.sin(p.r) * 40) * p.z * dt; p.r += dt * 3;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.z > 0.8 ? '#e8902a' : '#d8601a';
      ctx.beginPath(); ctx.ellipse(0, 0, 6 * p.z, 3 * p.z, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (p.y > APPH + 20) { p.y = -20; p.x = Math.random() * (APPW + 200); }
    if (p.x < -40) p.x += APPW + 80; if (p.x > APPW + 80) p.x -= APPW + 120;
  }
  ctx.restore();
}

// ---------------- кадр игры ----------------
let lastDraw = performance.now();
function draw() {
  const now = performance.now(), fdt = Math.min(0.05, (now - lastDraw) / 1000); lastDraw = now;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (SCREEN === 'menu' || SCREEN === 'routes' || SCREEN === 'load') { drawMenuScene(fdt); return; }
  if (SCREEN === 'garage') { drawGarageScene(fdt); return; }
  if (!G.T || !G.truck) { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, APPW, APPH); return; }
  const c = G.cam, T = G.T, tr = G.truck;
  const sh = c.shake * c.shake * 10;
  V.x = c.x; V.y = c.y; V.ppm = c.ppm; V.sx = (Math.random() - 0.5) * sh; V.sy = (Math.random() - 0.5) * sh;
  const vy = clamp((c.yAvg - c.y) * c.ppm, -APPH * 0.3, APPH * 0.3);
  if (G.themePrev && G.themeMix < 1) drawLayers(G.themePrev, 1, c.x, vy);
  drawLayers(G.theme, G.themePrev && G.themeMix < 1 ? G.themeMix : 1, c.x, vy);
  drawDecorBack(T);
  drawEntities(T, true);
  drawGround(T, G.theme);
  drawBridgeRails(T);
  drawDecorFront(T);
  drawEntities(T, false);
  drawParticles(G.particles.filter(p => p.kind === 'stain'));
  drawTruck(tr, T);
  drawItems();
  drawParticles(G.particles.filter(p => p.kind !== 'stain'));
  // лось/корова, уходящие «к зрителю»
  for (const e of T.ents) if ((e.type === 'moose') && !e.dead && (e.depth || 0) < -0.05 && Math.abs(e.x - V.x) < 40) { const d = -e.depth; sprite('moose' + (e.frame || 0), e.x, T.heightAt(e.x) - d * 1.8, 1 + d * 0.6, 0, 1 - d); }
  // передняя трава
  const t = THEMES[G.theme], gimg = IMG[t.grass];
  if (gimg) {
    const x0 = V.x - APPW / 2 / V.ppm - 2, x1 = V.x + APPW / 2 / V.ppm + 2, w = 1.7 * V.ppm, h = w * 96 / 128;
    for (let x = Math.floor(x0 / 5.3) * 5.3; x < x1; x += 5.3) { const hh = Math.abs(Math.floor(x * 7.31)) % 4; if (T.surfAt(x) === 5) continue; ctx.drawImage(gimg, hh * 128, 0, 128, 96, SX(x) - w / 2, SY(T.heightAt(x) - 0.42) - h, w, h); }
  }
  drawWeather(t.weather, fdt, G.state === 'play' ? tr.speed : 0);
  if (t.light) { ctx.fillStyle = t.light; ctx.fillRect(0, 0, APPW, APPH); }
  if (G.boostT > 0) { ctx.strokeStyle = 'rgba(255,220,120,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const y = Math.random() * APPH, x = Math.random() * APPW; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 80 - Math.random() * 80, y); ctx.stroke(); } }
  if (G.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.6) + ')'; ctx.fillRect(0, 0, APPW, APPH); }
  if (G.state === 'crash') { ctx.fillStyle = 'rgba(80,0,0,' + Math.min(0.3, G.crashT * 0.2) + ')'; ctx.fillRect(0, 0, APPW, APPH); }
  drawPopups();
  drawRadar(T, tr);
  positionBubble(tr);
}
// индикатор опасности впереди, пока её не видно на экране
const RADAR_IMG = { cow: 'cow0', moose: 'moose0', gai: 'gai0', bear: 'bear0' };
function drawRadar(T, tr) {
  if (G.state !== 'play') return;
  const edge = V.x + (APPW / 2 - 10) / V.ppm;
  let best = null;
  for (const e of T.ents) {
    if (e.x < tr.x) continue; if (e.x - tr.x > 90) break;
    if (e.dead || !RADAR_IMG[e.type] || e.x < edge || e.state || e.done) continue;
    best = e; break;
  }
  if (!best) return;
  const d = Math.round(best.x - tr.x), t = performance.now() / 1000;
  const r = 30, x = APPW - r - 8, y = clamp(SY(T.heightAt(best.x) + 1), 130, APPH - 200);
  ctx.save(); ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = best.type === 'gai' ? '#1d4fb8' : '#d2231a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.95, y + r * 0.6); ctx.lineTo(x - r * 0.95, y + r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  const img = IMG[RADAR_IMG[best.type]], m = meta(RADAR_IMG[best.type]);
  if (img && m) { const k = Math.min(30 / m.w, 26 / m.h); ctx.drawImage(img, x - m.w * k / 2, y + r * 0.45 - m.h * k, m.w * k, m.h * k); }
  ctx.font = '13px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)';
  const label = d + ' м'; ctx.strokeText(label, x, y + r + 6); ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ffcf2e' : '#fff'; ctx.fillText(label, x, y + r + 6);
  ctx.fillStyle = '#ffcf2e'; ctx.beginPath(); ctx.moveTo(APPW - 4, y); ctx.lineTo(APPW - 12, y - 7); ctx.lineTo(APPW - 12, y + 7); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---------------- сцена главного меню ----------------
const MS = { x: 0, wang: 0, parts: [], t: 0, theme: 'summer', cowX: 40 };
function menuTheme() { const r = ROUTES[Math.min(SAVE.unlocked, TOTAL_ROUTES) - 1]; return r ? r.theme : 'summer'; }
function drawFlatRoad(theme, roadY) {
  const t = THEMES[theme], sy = SY(roadY);
  ctx.fillStyle = worldPattern(t.soil, 3.4) || t.ground; ctx.fillRect(0, sy, APPW, APPH - sy);
  const g = ctx.createLinearGradient(0, sy, 0, APPH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,2,.5)'); ctx.fillStyle = g; ctx.fillRect(0, sy, APPW, APPH - sy);
  const gimg = IMG[t.grass];
  if (gimg) { const w = 1.5 * V.ppm, h = w * 96 / 128; for (let x = Math.floor((V.x - APPW / V.ppm) / 1.6) * 1.6; x < V.x + APPW / V.ppm; x += 1.6) { const v = Math.abs(Math.floor(x * 3.7)) % 4; ctx.drawImage(gimg, v * 128, 0, 128, 96, SX(x) - w / 2, sy - h + 0.1 * V.ppm, w, h); } }
  ctx.fillStyle = t.roadEdge; ctx.fillRect(0, sy, APPW, 0.6 * V.ppm);
  ctx.fillStyle = worldPattern(t.road, 2.4) || '#4a4c50'; ctx.fillRect(0, sy, APPW, 0.44 * V.ppm);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(0, sy, APPW, 1.5);
  if (t.road === 'tex_asphalt') { ctx.fillStyle = 'rgba(240,240,230,.55)'; for (let x = Math.floor((V.x - APPW / V.ppm) / 4) * 4; x < V.x + APPW / V.ppm; x += 4) ctx.fillRect(SX(x), sy + 0.18 * V.ppm, 2 * V.ppm, Math.max(1, 0.05 * V.ppm)); }
}
function drawMenuScene(dt) {
  MS.t += dt; MS.theme = menuTheme();
  const spd = 7;
  MS.x += spd * dt; MS.wang += spd / TRUCK.wheelR * dt;
  const ppm = LAND ? Math.min(APPH / 6.2, APPW / 15.5) : Math.min(APPW / 8.6, APPH / 9.5);
  V.ppm = ppm; V.sx = 0; V.sy = 0;
  const roadSY = LAND ? APPH * 0.86 : APPH * 0.88;
  const truckSX = LAND ? APPW * 0.3 : APPW * 0.52;
  V.x = MS.x + (APPW / 2 - truckSX) / ppm; V.y = (roadSY - APPH / 2) / ppm;
  drawLayers(MS.theme, 1, MS.x * 1.6, 0);
  drawFlatRoad(MS.theme, 0);
  // корова идёт по обочине
  MS.cowX -= dt * 0.8; if (SX(MS.cowX + 2) < -50) MS.cowX = MS.x + APPW / ppm * 0.8 + 6;
  sprite('cow' + (1 + Math.floor(MS.t * 3) % 2), MS.cowX, 0.55, 0.7);
  // машина
  const bob = Math.sin(MS.t * 9) * 0.015 + Math.sin(MS.t * 2.3) * 0.01;
  const tx = MS.x, ty = TRUCK.com[1] + bob;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(SX(tx - 0.1), SY(0) - 2, 3.9 * ppm, 0.2 * ppm, 0, 0, Math.PI * 2); ctx.fill();
  TRUCK.wheels.forEach(w => drawWheelAt(tx - TRUCK.com[0] + w.x, TRUCK.wheelR, MS.wang, SAVE.cosOn.includes('chrome')));
  drawTruckBody(SX(tx), SY(ty), Math.sin(MS.t * 1.7) * 0.004, { com: TRUCK.com, mood: Math.sin(MS.t * 0.5) > 0.6 ? 'happy' : 'norm', bob: Math.sin(MS.t * 9) * 1.5, cos: SAVE.cosOn, t: MS.t, door: 0, night: MS.theme === 'taiga' });
  // выхлоп
  if (Math.random() < dt * 14) MS.parts.push({ kind: 'smoke', x: tx - TRUCK.com[0] - 0.48, y: 0.46, vx: -spd * 0.4, vy: 0.5 + Math.random() * 0.4, t: 0, life: 1.2, size: 0.15, grow: 0.7, g: 0, drag: 0.5, col: [180, 180, 185], a0: 0.4 });
  for (let i = MS.parts.length - 1; i >= 0; i--) { const p = MS.parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.size += p.grow * dt; if (p.t > p.life) MS.parts.splice(i, 1); }
  drawParticles(MS.parts);
  drawWeather(THEMES[MS.theme].weather, dt, 3);
  if (THEMES[MS.theme].light) { ctx.fillStyle = THEMES[MS.theme].light; ctx.fillRect(0, 0, APPW, APPH); }
  if (SCREEN === 'routes' || SCREEN === 'load') { ctx.fillStyle = 'rgba(14,16,20,.55)'; ctx.fillRect(0, 0, APPW, APPH); }
}

// ---------------- сцена гаража ----------------
const GS = { t: 0 };
function drawGarageScene(dt) {
  GS.t += dt;
  const W = APPW, H = APPH;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2622'); g.addColorStop(0.6, '#3a332c'); g.addColorStop(1, '#1a1715');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // кирпичи
  const bh = 18, bw = 46; ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2;
  for (let y = 0, r = 0; y < H * 0.72; y += bh, r++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (r % 2) * bw / 2; x < W; x += bw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(120,60,40,.18)'; ctx.fillRect(0, 0, W, H * 0.72);
  // пол
  const floorY = LAND ? H * 0.8 : H * 0.42;
  const fg = ctx.createLinearGradient(0, floorY, 0, H); fg.addColorStop(0, '#5a5650'); fg.addColorStop(1, '#2a2826');
  ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H - floorY);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(W * (LAND ? 0.3 : 0.5), floorY + 30, 120, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,60,.7)'; for (let x = -20; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, floorY + 4); ctx.lineTo(x + 30, floorY + 4); ctx.lineTo(x + 40, floorY + 12); ctx.lineTo(x + 10, floorY + 12); ctx.closePath(); ctx.fill(); }
  // календарь и полка с шинами
  ctx.save(); ctx.translate(W * (LAND ? 0.06 : 0.08), H * (LAND ? 0.12 : 0.05));
  ctx.fillStyle = '#f2ece0'; ctx.fillRect(0, 0, 70, 90); ctx.fillStyle = '#d8231a'; ctx.fillRect(0, 0, 70, 40);
  if (IMG.truck_body) ctx.drawImage(IMG.truck_body, 4, 12, 62, 25);
  ctx.fillStyle = '#333'; ctx.font = '11px ' + FONT_N; ctx.textAlign = 'center'; ctx.fillText('2026', 35, 54);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(6, 62 + i * 7); ctx.lineTo(64, 62 + i * 7); ctx.stroke(); }
  ctx.restore();
  const shelfX = W * (LAND ? 0.86 : 0.8), shelfY = H * (LAND ? 0.25 : 0.12);
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(shelfX - 50, shelfY + 46, 100, 8);
  if (IMG.wheel) for (let i = 0; i < 3; i++) ctx.drawImage(IMG.wheel, shelfX - 48 + i * 30, shelfY, 44, 44);
  // лампа и свет
  const lx = W * (LAND ? 0.3 : 0.5);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();
  ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.moveTo(lx - 22, 40); ctx.lineTo(lx + 22, 40); ctx.lineTo(lx + 10, 26); ctx.lineTo(lx - 10, 26); ctx.closePath(); ctx.fill();
  const flick = 0.92 + Math.sin(GS.t * 37) * 0.02 + (Math.random() < 0.01 ? -0.3 : 0);
  const lg = ctx.createLinearGradient(0, 40, 0, floorY + 40); lg.addColorStop(0, 'rgba(255,240,190,' + 0.35 * flick + ')'); lg.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx - 20, 40); ctx.lineTo(lx + 20, 40); ctx.lineTo(lx + W * 0.45, floorY + 40); ctx.lineTo(lx - W * 0.45, floorY + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(lx, 42, 6, 0, Math.PI * 2); ctx.fill();
  // Газель
  const ppm = LAND ? Math.min(H / 5.2, W * 0.55 / 7.9) : Math.min(W / 8.3, H * 0.34 / 3.3);
  V.ppm = ppm; V.sx = 0; V.sy = 0; V.x = 0; V.y = 0;
  const cx = lx + 0.68 * ppm, cy = floorY + 0.06 * ppm;
  const toS = (lx2, ly2) => [cx + lx2 * ppm, cy - ly2 * ppm];
  TRUCK.wheels.forEach(w => { const [wx, wy] = toS(w.x, TRUCK.wheelR); const s = TRUCK.wheelR * 2 * ppm * 256 / 250; const img = SAVE.cosOn.includes('chrome') ? IMG.wheel_chrome : IMG.wheel; if (img) { ctx.save(); ctx.translate(wx, wy); ctx.rotate(GS.t * 0.3); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore(); } });
  const [bx, by] = toS(TRUCK.com[0], TRUCK.com[1] + Math.sin(GS.t * 2) * 0.004);
  drawTruckBody(bx, by, 0, { com: TRUCK.com, mood: 'cool', bob: 0, cos: SAVE.cosOn, t: GS.t, door: 0, night: false });
}

// карточка для «Поделиться»
function makeShareCard(title, line2) {
  try {
    const c = document.createElement('canvas'); c.width = 800; c.height = 450; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 450); gr.addColorStop(0, '#3d8fe0'); gr.addColorStop(1, '#dff0ff'); g.fillStyle = gr; g.fillRect(0, 0, 800, 450);
    if (IMG.bg_summer_far) g.drawImage(IMG.bg_summer_far, 0, 0, 1200, 450);
    g.fillStyle = '#3a3c40'; g.fillRect(0, 380, 800, 70);
    if (IMG.truck_body) g.drawImage(IMG.truck_body, 300, 200, 480, 197);
    if (IMG.logo) g.drawImage(IMG.logo, 10, 10, 360, 170);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(20, 300, 420, 70);
    g.fillStyle = '#ffd23a'; g.font = '30px ' + FONT; g.fillText(title, 34, 336);
    g.fillStyle = '#fff'; g.font = '22px ' + FONT_N; g.fillText(line2, 34, 362);
    return c;
  } catch (e) { return null; }
}
