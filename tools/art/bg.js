// Фоны зон: дальний план (JPG с небом), средний и ближний (PNG с прозрачностью), текстуры земли и дороги.
'use strict';
const BGW = 2048;
// рисовать с учётом бесшовной склейки по горизонтали
function wrap(W, x, pad, fn) { fn(x); if (x < pad) fn(x + W); if (x > W - pad) fn(x - W); }
function ridge(ctx, W, H, baseY, amp, period, seed, color, oct, sharp) {
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    let n = fbm1(x / W * period, period, seed, oct || 5);
    if (sharp) n = 1 - Math.abs(n * 2 - 1);
    ctx.lineTo(x, baseY - n * amp);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function ridgeY(x, W, baseY, amp, period, seed, oct, sharp) {
  let n = fbm1(((x % W) + W) % W / W * period, period, seed, oct || 5); if (sharp) n = 1 - Math.abs(n * 2 - 1); return baseY - n * amp;
}
// горная гряда из отдельных пиков: освещённый и теневой склон, снежная шапка
function peaks(ctx, W, baseY, n, hMin, hMax, seed, lit, dark, snowLine, snowCol) {
  const r = mulberry(seed);
  const list = [];
  for (let i = 0; i < n; i++) list.push({ x: (i + r() * 0.8) * W / n, h: hMin + r() * (hMax - hMin), w: 0.9 + r() * 0.8, sk: (r() - 0.5) * 0.4 });
  list.sort((a, b) => a.h - b.h);
  list.forEach(p => wrap(W, p.x, p.h * 2, x => {
    const top = [x + p.h * p.sk * 0.5, baseY - p.h], L = [x - p.h * 1.3 * p.w, baseY + 4], R = [x + p.h * 1.3 * p.w, baseY + 4];
    const mid = [top[0] + (r() - 0.5) * p.h * 0.2, baseY];
    poly(ctx, [top, L, mid]); ctx.fillStyle = lg(ctx, L[0], 0, top[0], 0, [[0, shade(lit, -0.1)], [1, lit]]); ctx.fill();
    poly(ctx, [top, mid, R]); ctx.fillStyle = lg(ctx, top[0], 0, R[0], 0, [[0, dark], [1, shade(dark, -0.15)]]); ctx.fill();
    if (p.h > snowLine) {
      const k = 1 - snowLine / p.h * 0.75;
      const sl = [lerp(top[0], L[0], k * 0.55), lerp(top[1], L[1], k * 0.55)], sr = [lerp(top[0], R[0], k * 0.5), lerp(top[1], R[1], k * 0.5)];
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(sl[0], sl[1]);
      const steps = 6; for (let i = 1; i <= steps; i++) { const t = i / steps; ctx.lineTo(lerp(sl[0], sr[0], t), lerp(sl[1], sr[1], t) - (i % 2 ? p.h * 0.06 : -p.h * 0.03)); }
      ctx.closePath(); ctx.fillStyle = snowCol; ctx.fill();
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(sr[0], sr[1]); ctx.lineTo(lerp(top[0], mid[0], k * 0.5), lerp(top[1], mid[1], k * 0.5)); ctx.closePath(); ctx.fillStyle = 'rgba(120,150,190,.45)'; ctx.fill();
    }
  }));
}
function sky(ctx, W, H, stops) { ctx.fillStyle = lg(ctx, 0, 0, 0, H, stops); ctx.fillRect(0, 0, W, H); }
function sun(ctx, x, y, r, col, glow) {
  ctx.fillStyle = rg(ctx, x, y, r * 0.5, r * 6, [[0, glow], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  circle(ctx, x, y, r); ctx.fillStyle = col; ctx.fill();
}
function cloud(ctx, x, y, s, col, shadow) {
  const r = mulberry(Math.floor(x * 7 + y * 13));
  const blobs = []; for (let i = 0; i < 7; i++) blobs.push([x + (i - 3) * s * 0.35 + (r() - 0.5) * s * 0.2, y - Math.sin(i / 6 * Math.PI) * s * 0.35 + (r() - 0.5) * s * 0.1, s * (0.28 + r() * 0.2)]);
  blobs.forEach(b => { circle(ctx, b[0], b[1] + s * 0.08, b[2]); ctx.fillStyle = shadow; ctx.fill(); });
  blobs.forEach(b => { circle(ctx, b[0], b[1], b[2]); ctx.fillStyle = rg(ctx, b[0] - b[2] * 0.3, b[1] - b[2] * 0.4, b[2] * 0.1, b[2] * 1.1, [[0, '#ffffff'], [1, col]]); ctx.fill(); });
}
function fir(ctx, x, y, h, c1, c2, snow) {
  const w = h * 0.36;
  ctx.fillStyle = '#3a2412'; ctx.fillRect(x - h * 0.025, y - h * 0.12, h * 0.05, h * 0.14);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const ty0 = y - h * 0.1 - i * h * 0.17, tw = w * (1 - i * 0.17), th = h * 0.32;
    ctx.beginPath(); ctx.moveTo(x, ty0 - th);
    ctx.lineTo(x + tw, ty0); ctx.lineTo(x + tw * 0.5, ty0 - th * 0.08); ctx.lineTo(x, ty0 + th * 0.02); ctx.lineTo(x - tw * 0.5, ty0 - th * 0.08); ctx.lineTo(x - tw, ty0); ctx.closePath();
    ctx.fillStyle = lg(ctx, x - tw, 0, x + tw, 0, [[0, c2], [0.45, c1], [1, c2]]); ctx.fill();
    if (snow) { ctx.beginPath(); ctx.moveTo(x, ty0 - th); ctx.lineTo(x + tw * 0.7, ty0 - th * 0.25); ctx.quadraticCurveTo(x + tw * 0.3, ty0 - th * 0.3, x, ty0 - th * 0.22); ctx.quadraticCurveTo(x - tw * 0.3, ty0 - th * 0.3, x - tw * 0.7, ty0 - th * 0.25); ctx.closePath(); ctx.fillStyle = snow; ctx.fill(); }
  }
}
function blobTree(ctx, x, y, h, cols, trunk, seed) {
  const r = mulberry(seed || Math.floor(x * 3 + h));
  ctx.strokeStyle = trunk || '#4a3220'; ctx.lineWidth = h * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * h * 0.06, y - h * 0.55); ctx.stroke();
  ctx.lineWidth = h * 0.025; ctx.beginPath(); ctx.moveTo(x, y - h * 0.35); ctx.lineTo(x - h * 0.15, y - h * 0.55); ctx.moveTo(x, y - h * 0.4); ctx.lineTo(x + h * 0.14, y - h * 0.6); ctx.stroke();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = r() * h * 0.22;
    const bx = x + Math.cos(a) * d * 1.2, by = y - h * 0.65 + Math.sin(a) * d, br = h * (0.13 + r() * 0.1);
    circle(ctx, bx, by, br);
    ctx.fillStyle = rg(ctx, bx - br * 0.4, by - br * 0.5, br * 0.1, br * 1.2, [[0, cols[0]], [0.6, cols[1]], [1, cols[2]]]); ctx.fill();
  }
}
function birch(ctx, x, y, h, cols, seed) {
  const r = mulberry(seed || Math.floor(x + h));
  ctx.fillStyle = '#f2efe6'; ctx.fillRect(x - h * 0.02, y - h * 0.8, h * 0.04, h * 0.8);
  ctx.fillStyle = '#2a2622'; for (let i = 0; i < 9; i++) ctx.fillRect(x - h * 0.02 + (r() < 0.5 ? 0 : h * 0.02), y - h * (0.05 + r() * 0.72), h * 0.02, h * 0.012);
  for (let i = 0; i < 10; i++) {
    const bx = x + (r() - 0.5) * h * 0.4, by = y - h * (0.55 + r() * 0.4), br = h * (0.08 + r() * 0.07);
    ellipse(ctx, bx, by, br, br * 1.3); ctx.fillStyle = rg(ctx, bx - br * 0.3, by - br * 0.4, br * 0.1, br * 1.3, [[0, cols[0]], [0.7, cols[1]], [1, cols[2]]]); ctx.fill();
  }
}
function pine(ctx, x, y, h, cols) {
  ctx.strokeStyle = '#a8582a'; ctx.lineWidth = h * 0.04; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + h * 0.03, y - h * 0.8); ctx.stroke();
  ctx.lineWidth = h * 0.02; ctx.beginPath(); ctx.moveTo(x + h * 0.02, y - h * 0.65); ctx.lineTo(x - h * 0.12, y - h * 0.8); ctx.moveTo(x + h * 0.03, y - h * 0.72); ctx.lineTo(x + h * 0.18, y - h * 0.85); ctx.stroke();
  [[-0.12, -0.82, 0.13], [0.16, -0.86, 0.12], [0.03, -0.95, 0.15], [-0.05, -0.88, 0.1]].forEach(b => {
    ellipse(ctx, x + b[0] * h, y + b[1] * h, b[2] * h * 1.4, b[2] * h * 0.6); ctx.fillStyle = lg(ctx, 0, y + (b[1] - b[2]) * h, 0, y + (b[1] + b[2]) * h, [[0, cols[0]], [1, cols[1]]]); ctx.fill();
  });
}
function izba(ctx, x, y, s, wall, roof, seed) {
  const r = mulberry(seed || 5);
  const w = s, h = s * 0.62;
  ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = Math.max(1, s * 0.02); for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * i / 6); ctx.lineTo(x + w / 2, y - h * i / 6); ctx.stroke(); }
  poly(ctx, [[x - w * 0.6, y - h], [x, y - h - s * 0.5], [x + w * 0.6, y - h]]); ctx.fillStyle = roof; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; poly(ctx, [[x, y - h - s * 0.5], [x + w * 0.6, y - h], [x + w * 0.1, y - h]]); ctx.fill();
  ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x - w * 0.3, y - h * 0.7, w * 0.18, h * 0.32); ctx.fillRect(x + w * 0.1, y - h * 0.7, w * 0.18, h * 0.32);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.strokeRect(x - w * 0.3, y - h * 0.7, w * 0.18, h * 0.32); ctx.strokeRect(x + w * 0.1, y - h * 0.7, w * 0.18, h * 0.32);
  if (r() < 0.7) { ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x + w * 0.2, y - h - s * 0.4, s * 0.08, s * 0.25); }
}
function church(ctx, x, y, s, wall, dome) {
  ctx.fillStyle = wall; ctx.fillRect(x - s * 0.5, y - s * 0.7, s, s * 0.7); ctx.fillRect(x - s * 0.2, y - s * 1.1, s * 0.4, s * 0.4);
  ctx.fillRect(x + s * 0.55, y - s * 1.3, s * 0.25, s * 1.3);
  const onion = (cx, cy, r) => {
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 2.2); ctx.bezierCurveTo(cx + r * 0.3, cy - r * 1.6, cx + r * 1.3, cy - r * 1.2, cx + r, cy); ctx.lineTo(cx - r, cy); ctx.bezierCurveTo(cx - r * 1.3, cy - r * 1.2, cx - r * 0.3, cy - r * 1.6, cx, cy - r * 2.2); ctx.closePath();
    ctx.fillStyle = dome; ctx.fill();
    ctx.strokeStyle = dome; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.moveTo(cx, cy - r * 2.2); ctx.lineTo(cx, cy - r * 3); ctx.moveTo(cx - r * 0.3, cy - r * 2.7); ctx.lineTo(cx + r * 0.3, cy - r * 2.7); ctx.stroke();
  };
  onion(x, y - s * 1.1, s * 0.2); onion(x + s * 0.675, y - s * 1.3, s * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - s * 0.08, y - s * 0.45, s * 0.16, s * 0.3);
}
function fence(ctx, x0, x1, y, h, col) {
  ctx.fillStyle = col; for (let x = x0; x < x1; x += h * 0.18) ctx.fillRect(x, y - h, h * 0.12, h);
  ctx.fillRect(x0, y - h * 0.75, x1 - x0, h * 0.08); ctx.fillRect(x0, y - h * 0.3, x1 - x0, h * 0.08);
}
function haze(ctx, W, y0, y1, col) { ctx.fillStyle = lg(ctx, 0, y0, 0, y1, [[0, rgba(col, 0)], [1, rgba(col, 0.55)]]); ctx.fillRect(0, y0, W, y1 - y0); }

const THEMES = {
  summer: {
    name: 'Подмосковье', sky: ['#3d8fe0', '#8cc4f0', '#dff0ff'], ground: '#5a8a2e', soil: 'soil', road: 'asphalt', grass: 'summer', fog: '#cfe6f5',
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#3d8fe0'], [0.5, '#8cc4f0'], [0.75, '#dff0ff'], [1, '#e8f4ff']]);
      sun(ctx, 1500, 150, 50, '#fffbe0', 'rgba(255,250,210,.55)');
      [[200, 150, 120], [700, 220, 90], [1150, 120, 140], [1800, 230, 100]].forEach(c => wrap(W, c[0], 300, x => cloud(ctx, x, c[1], c[2], '#e4eef8', 'rgba(150,175,205,.35)')));
      ridge(ctx, W, H, 560, 120, 3, 11, '#9cb8d0', 5);
      ridge(ctx, W, H, 600, 90, 5, 12, '#7fa0b8', 5);
      // далёкие сталинские высотки и церковь
      [[300, 1.0], [1240, 0.8]].forEach(t => {
        const x = t[0], y = ridgeY(x, W, 600, 90, 5, 12), s = 40 * t[1];
        ctx.fillStyle = '#6a89a2'; ctx.fillRect(x - s, y - s * 3, s * 2, s * 3); ctx.fillRect(x - s * 0.6, y - s * 4.2, s * 1.2, s * 1.4); ctx.fillRect(x - s * 0.25, y - s * 5.2, s * 0.5, s); ctx.fillRect(x - 2, y - s * 6, 4, s * 0.9);
        ctx.fillRect(x - s * 1.8, y - s * 1.8, s * 0.9, s * 1.8); ctx.fillRect(x + s * 0.9, y - s * 1.8, s * 0.9, s * 1.8);
      });
      ridge(ctx, W, H, 650, 60, 7, 13, '#5f8a5a', 5);
      // кромка леса
      for (let x = 0; x < W; x += 9) { const y = ridgeY(x, W, 650, 60, 7, 13); circle(ctx, x, y + 4, 9 + hash2(x, 1, 3) * 8); ctx.fillStyle = hash2(x, 2, 3) < 0.5 ? '#4f7a48' : '#5a8a50'; ctx.fill(); }
      ctx.fillStyle = '#4c7a3e'; ctx.fillRect(0, 690, W, H - 690);
      haze(ctx, W, 480, 700, '#dff0ff');
    },
    mid(ctx, W, H) {
      const base = H - 70;
      ctx.fillStyle = '#4e8a30'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 50, 4, 21));
      ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(31);
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y = ridgeY(x, W, base, 50, 4, 21) + 8, h = 120 + r() * 140;
        wrap(W, x, 120, xx => r() < 0.55 ? birch(ctx, xx, y, h, ['#b8e070', '#6aa83a', '#3a7020'], i + 1) : blobTree(ctx, xx, y, h, ['#8ac850', '#4a8a2a', '#2a5a1a'], '#4a3220', i + 7));
      }
      [[380, '#c8a060', '#3a6a9a'], [460, '#9ac0e0', '#a83a2a'], [1500, '#e8d8a0', '#4a7a3a'], [1600, '#b8806a', '#5a4a6a']].forEach((d, i) => {
        const y = ridgeY(d[0], W, base, 50, 4, 21) + 14; izba(ctx, d[0], y, 70 + i * 6, d[1], d[2], i + 3);
        fence(ctx, d[0] - 60, d[0] + 60, y + 6, 26, '#8a6a4a');
      });
      const cy = ridgeY(1000, W, base, 50, 4, 21) + 10; church(ctx, 1000, cy, 80, '#f4efe2', '#e8b830');
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#3f7a24'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 26, 6, 41));
      ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(51);
      for (let i = 0; i < 38; i++) {
        const x = r() * W, y = ridgeY(x, W, base, 26, 6, 41) + 10;
        wrap(W, x, 140, xx => { if (r() < 0.3) blobTree(ctx, xx, y, 200 + r() * 60, ['#7ab840', '#3a7a20', '#1f4a12'], '#3a2818', i + 99); else for (let k = 0; k < 4; k++) { circle(ctx, xx + (k - 1.5) * 18, y - 18 - r() * 14, 22 + r() * 10); ctx.fillStyle = k % 2 ? '#4a8a2a' : '#3a7020'; ctx.fill(); } });
      }
      // подсолнухи
      for (let i = 0; i < 24; i++) { const x = 1200 + i * 22 + r() * 8, y = ridgeY(x, W, base, 26, 6, 41) + 14; ctx.strokeStyle = '#3a6a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 60); ctx.stroke(); for (let p = 0; p < 10; p++) { const a = p / 10 * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 9, y - 62 + Math.sin(a) * 9, 6, 3, a); ctx.fillStyle = '#ffc81a'; ctx.fill(); } circle(ctx, x, y - 62, 6); ctx.fillStyle = '#5a3a12'; ctx.fill(); }
    }
  },
  volga: {
    name: 'Поволжье', sky: ['#5a9ad8', '#b8d8f0', '#f8ecd0'], ground: '#9a7a32', soil: 'clay', road: 'asphalt', grass: 'autumn', fog: '#f3e6cc',
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#5a9ad8'], [0.55, '#b8d8f0'], [0.8, '#f8ecd0'], [1, '#f8ecd0']]);
      [[300, 180, 110], [1000, 130, 90], [1600, 200, 130]].forEach(c => wrap(W, c[0], 300, x => cloud(ctx, x, c[1], c[2], '#f2ece2', 'rgba(190,170,150,.35)')));
      ridge(ctx, W, H, 520, 80, 3, 61, '#a8b4c0', 5);
      // кремль на дальнем берегу
      const kx = 700, ky = ridgeY(kx, W, 520, 80, 3, 61) + 20;
      ctx.fillStyle = '#e8e2d4'; ctx.fillRect(kx - 160, ky - 24, 320, 24);
      [-160, -60, 60, 160].forEach(d => { ctx.fillRect(kx + d - 10, ky - 50, 20, 50); poly(ctx, [[kx + d - 12, ky - 50], [kx + d, ky - 72], [kx + d + 12, ky - 50]]); ctx.fillStyle = '#4a7a5a'; ctx.fill(); ctx.fillStyle = '#e8e2d4'; });
      ctx.fillRect(kx - 14, ky - 110, 28, 86); poly(ctx, [[kx - 16, ky - 110], [kx, ky - 150], [kx + 16, ky - 110]]); ctx.fillStyle = '#4a7a5a'; ctx.fill();
      ctx.fillStyle = '#5a9a7a'; circle(ctx, kx + 90, ky - 46, 18); ctx.fill(); ctx.fillStyle = '#e8b830'; circle(ctx, kx + 90, ky - 62, 6); ctx.fill();
      // минарет
      ctx.fillStyle = '#f4f0e8'; ctx.fillRect(kx + 120, ky - 120, 10, 96); poly(ctx, [[kx + 118, ky - 120], [kx + 125, ky - 150], [kx + 132, ky - 120]]); ctx.fillStyle = '#3a8ac8'; ctx.fill();
      // Волга
      ctx.fillStyle = lg(ctx, 0, 560, 0, 660, [[0, '#7aa6c8'], [1, '#4a7aa0']]); ctx.fillRect(0, 560, W, 100);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; const r = mulberry(5); for (let i = 0; i < 80; i++) { const x = r() * W, y = 570 + r() * 85; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + r() * 30, y); ctx.stroke(); }
      // теплоход
      const sx = 1350; ctx.fillStyle = '#fff'; poly(ctx, [[sx - 90, 590], [sx + 100, 590], [sx + 80, 610], [sx - 80, 610]]); ctx.fill(); ctx.fillRect(sx - 60, 572, 120, 18); ctx.fillRect(sx - 40, 558, 70, 14);
      ctx.fillStyle = '#c83a2a'; ctx.fillRect(sx - 80, 602, 160, 5); ctx.fillStyle = '#3a6a9a'; for (let i = 0; i < 9; i++) ctx.fillRect(sx - 55 + i * 12, 577, 7, 6);
      ridge(ctx, W, H, 690, 40, 6, 62, '#b88a3a', 4);
      ctx.fillStyle = '#a8782a'; ctx.fillRect(0, 700, W, H);
      haze(ctx, W, 460, 600, '#f8ecd0');
    },
    mid(ctx, W, H) {
      const base = H - 70;
      ctx.fillStyle = '#a8862e'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 60, 4, 71)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(73);
      const pal = [['#ffd84a', '#e8a018', '#9a5a10'], ['#ff8a3a', '#d84a18', '#8a2a0a'], ['#e8c040', '#b88a20', '#6a4a10'], ['#c8d050', '#8a9a28', '#4a5a18']];
      for (let i = 0; i < 44; i++) {
        const x = r() * W, y = ridgeY(x, W, base, 60, 4, 71) + 8, h = 120 + r() * 150, p = pal[Math.floor(r() * 4)];
        wrap(W, x, 130, xx => r() < 0.45 ? birch(ctx, xx, y, h, p, i + 3) : blobTree(ctx, xx, y, h, p, '#4a3220', i + 11));
      }
      [[600, '#c8b098', '#6a4a3a'], [1700, '#a8c0d0', '#8a3a2a']].forEach((d, i) => { const y = ridgeY(d[0], W, base, 60, 4, 71) + 14; izba(ctx, d[0], y, 76, d[1], d[2], i + 9); fence(ctx, d[0] - 70, d[0] + 70, y + 6, 26, '#7a5a3a'); });
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#8a6a22'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 24, 6, 81)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(83);
      for (let i = 0; i < 40; i++) { const x = r() * W, y = ridgeY(x, W, base, 24, 6, 81) + 10; wrap(W, x, 100, xx => { for (let k = 0; k < 4; k++) { circle(ctx, xx + (k - 1.5) * 18, y - 18 - r() * 16, 22 + r() * 10); ctx.fillStyle = ['#d87a20', '#c85a18', '#e8a828', '#a8641a'][k]; ctx.fill(); } }); }
    }
  },
  ural: {
    name: 'Урал', sky: ['#3a6ac0', '#9ab8e0', '#ffd8a8'], ground: '#5a6a3a', soil: 'rock', road: 'asphalt', grass: 'ural', fog: '#e8d0b8',
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#3a6ac0'], [0.45, '#9ab8e0'], [0.75, '#ffd8a8'], [1, '#ffcf98']]);
      sun(ctx, 400, 300, 46, '#fff4d0', 'rgba(255,220,160,.6)');
      peaks(ctx, W, 560, 9, 200, 340, 91, '#a8b4cc', '#6a7898', 220, '#f4f6fa');
      peaks(ctx, W, 600, 12, 120, 220, 94, '#8a96ae', '#5a6680', 190, '#e8ecf4');
      ridge(ctx, W, H, 600, 200, 6, 92, '#6a7a90', 6, true);
      ridge(ctx, W, H, 680, 120, 8, 93, '#4a5a5a', 5);
      for (let x = 0; x < W; x += 7) { const y = ridgeY(x, W, 680, 120, 8, 93, 5); poly(ctx, [[x - 6, y + 10], [x, y - 14 - hash2(x, 4, 4) * 10], [x + 6, y + 10]]); ctx.fillStyle = '#3a4a42'; ctx.fill(); }
      ctx.fillStyle = '#3a4a3a'; ctx.fillRect(0, 720, W, H);
      haze(ctx, W, 380, 700, '#ffd8a8');
    },
    mid(ctx, W, H) {
      const base = H - 90;
      ctx.fillStyle = '#6a6a5a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, ridgeY(x, W, base, 170, 5, 101, 5, true)); ctx.lineTo(W, H); ctx.fill();
      // скальные пласты
      ctx.save(); ctx.clip(); const r = mulberry(103);
      for (let i = 0; i < 60; i++) { ctx.strokeStyle = 'rgba(40,36,30,' + (0.15 + r() * 0.2) + ')'; ctx.lineWidth = 2 + r() * 3; const x = r() * W, y = base - r() * 160; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + r() * 80, y + 10 + r() * 20); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,200,140,.15)'; for (let x = 0; x < W; x += 6) { const y = ridgeY(x, W, base, 170, 5, 101, 5, true); ctx.fillRect(x, y, 6, 30); }
      ctx.restore();
      const r2 = mulberry(107);
      for (let i = 0; i < 40; i++) { const x = r2() * W, y = ridgeY(x, W, base, 170, 5, 101, 5, true) + 30 + r2() * 60, h = 100 + r2() * 110; wrap(W, x, 100, xx => r2() < 0.5 ? pine(ctx, xx, y, h, ['#3a6a3a', '#1f4a26']) : fir(ctx, xx, y, h, '#2f5a36', '#1a3a22')); }
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#4a5a32'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 30, 6, 111)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(113);
      for (let i = 0; i < 22; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 6, 111) + 12, s = 40 + r() * 50; wrap(W, x, 100, xx => { ctx.beginPath(); ctx.moveTo(xx - s, y); ctx.bezierCurveTo(xx - s, y - s * 0.9, xx + s, y - s * 1.1, xx + s * 1.1, y); ctx.closePath(); ctx.fillStyle = rg(ctx, xx - s * 0.3, y - s * 0.7, 2, s * 1.4, [[0, '#a8a498'], [1, '#4a4842']]); ctx.fill(); }); }
      for (let i = 0; i < 26; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 6, 111) + 12; wrap(W, x, 100, xx => fir(ctx, xx, y, 160 + r() * 80, '#2a5230', '#16321c')); }
    }
  },
  steppe: {
    name: 'Степь', sky: ['#6a7a8a', '#a8b4b8', '#d8d8c8'], ground: '#a89a5a', soil: 'sand', road: 'dirt', grass: 'dry', fog: '#c8c8b8', rain: true,
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#5a6a7a'], [0.5, '#98a4ac'], [0.78, '#d0d0c4'], [1, '#d8d4c4']]);
      { const r = mulberry(125); for (let i = 0; i < 70; i++) { const x = r() * W, y = 40 + r() * 330, rw = 120 + r() * 220, rh = 18 + r() * 30; wrap(W, x, rw, xx => { ellipse(ctx, xx, y + rh * 0.4, rw, rh); ctx.fillStyle = 'rgba(70,80,92,.22)'; ctx.fill(); ellipse(ctx, xx, y, rw, rh); ctx.fillStyle = lg(ctx, 0, y - rh, 0, y + rh, [[0, 'rgba(200,206,210,.55)'], [1, 'rgba(120,130,140,.45)']]); ctx.fill(); }); } }
      // полосы дождя вдали
      ctx.strokeStyle = 'rgba(110,120,130,.25)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 5) { ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x - 30, 600); ctx.stroke(); }
      ridge(ctx, W, H, 620, 30, 3, 121, '#a8a890', 4);
      // элеваторы и качалки
      [[300, 1], [1400, 0.8]].forEach(e => { const x = e[0], y = 610, s = 30 * e[1]; ctx.fillStyle = '#9a9a92'; for (let k = 0; k < 4; k++) ctx.fillRect(x + k * s * 0.9, y - s * 4, s * 0.8, s * 4); ctx.fillRect(x + s * 3.6, y - s * 5.5, s * 1.2, s * 5.5); ctx.fillRect(x - s, y - s * 1.2, s * 6, s * 1.2); });
      [[800, 1], [1050, 0.7], [1800, 0.9]].forEach(p => { const x = p[0], y = 618, s = 26 * p[1]; ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = s * 0.15; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 1.6); ctx.lineTo(x + s, y); ctx.stroke(); ctx.lineWidth = s * 0.22; ctx.beginPath(); ctx.moveTo(x - s * 1.8, y - s * 1.4); ctx.lineTo(x + s * 1.4, y - s * 1.9); ctx.stroke(); ctx.fillStyle = '#5a5a58'; ctx.fillRect(x - s * 2.2, y - s * 1.8, s * 0.6, s * 1.1); });
      // ЛЭП
      ctx.strokeStyle = '#6a6a68'; ctx.lineWidth = 2; for (let x = 60; x < W; x += 256) { ctx.beginPath(); ctx.moveTo(x - 12, 630); ctx.lineTo(x, 560); ctx.lineTo(x + 12, 630); ctx.moveTo(x - 18, 570); ctx.lineTo(x + 18, 570); ctx.stroke(); }
      ctx.lineWidth = 1; for (let x = 60; x < W; x += 256) { ctx.beginPath(); ctx.moveTo(x - 18, 570); ctx.quadraticCurveTo(x + 110, 590, x + 238, 570); ctx.stroke(); }
      ctx.fillStyle = lg(ctx, 0, 630, 0, H, [[0, '#b8a868'], [1, '#9a8a48']]); ctx.fillRect(0, 630, W, H);
      ctx.strokeStyle = 'rgba(120,100,40,.35)'; for (let y = 640; y < H; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      haze(ctx, W, 450, 660, '#c8c8b8');
    },
    mid(ctx, W, H) {
      const base = H - 60;
      ctx.fillStyle = '#c8b060'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 30, 3, 131)); ctx.lineTo(W, H); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(150,120,40,.4)'; ctx.lineWidth = 2; for (let x = -200; x < W + 200; x += 14) { ctx.beginPath(); ctx.moveTo(x, base - 40); ctx.lineTo(x + 60, H); ctx.stroke(); } ctx.restore();
      const r = mulberry(133);
      for (let i = 0; i < 18; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 3, 131) + 10, s = 50 + r() * 30; wrap(W, x, 80, xx => { ctx.beginPath(); ctx.moveTo(xx - s, y); ctx.quadraticCurveTo(xx - s, y - s * 1.3, xx, y - s * 1.35); ctx.quadraticCurveTo(xx + s, y - s * 1.3, xx + s, y); ctx.closePath(); ctx.fillStyle = lg(ctx, xx - s, 0, xx + s, 0, [[0, '#a88a3a'], [0.4, '#e8c86a'], [1, '#8a6a2a']]); ctx.fill(); ctx.strokeStyle = 'rgba(100,80,30,.4)'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(xx - s * 0.8 + k * s * 0.4, y); ctx.lineTo(xx - s * 0.4 + k * s * 0.2, y - s); ctx.stroke(); } }); }
      // телеграфные столбы
      for (let x = 100; x < W; x += 340) { const y = ridgeY(x, W, base, 30, 3, 131) + 6; ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 4, y - 200, 8, 200); ctx.fillRect(x - 30, y - 190, 60, 6); ctx.strokeStyle = 'rgba(40,40,40,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 26, y - 186); ctx.quadraticCurveTo(x + 150, y - 160, x + 314, y - 186 + (ridgeY(x + 340, W, base, 30, 3, 131) - ridgeY(x, W, base, 30, 3, 131))); ctx.stroke(); }
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#9a8a48'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 20, 6, 141)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(143);
      for (let i = 0; i < 300; i++) { const x = r() * W, y = ridgeY(x, W, base, 20, 6, 141) + 14, h = 30 + r() * 50; ctx.strokeStyle = ['#c8b068', '#a8904a', '#e0c880'][i % 3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (r() - 0.5) * 20, y - h * 0.6, x + (r() - 0.5) * 30, y - h); ctx.stroke(); }
      for (let i = 0; i < 12; i++) { const x = r() * W, y = ridgeY(x, W, base, 20, 6, 141) + 12; wrap(W, x, 60, xx => { for (let k = 0; k < 6; k++) { ctx.strokeStyle = '#7a6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + (k - 2.5) * 10, y - 40 - k % 2 * 10); ctx.stroke(); } circle(ctx, xx, y - 34, 26); ctx.fillStyle = 'rgba(150,130,70,.6)'; ctx.fill(); }); }
    }
  },
  taiga: {
    name: 'Тайга', sky: ['#24305a', '#7a6a9a', '#f0a8a0'], ground: '#e8eef6', soil: 'snow', road: 'snowroad', grass: 'snow', fog: '#d8c8d8', snow: true,
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#1c2650'], [0.4, '#5a5a8a'], [0.68, '#d8909a'], [0.85, '#f8c8a8'], [1, '#f8d8c0']]);
      sun(ctx, 1100, 470, 40, '#ffe6c8', 'rgba(255,180,160,.6)');
      const r = mulberry(151); for (let i = 0; i < 120; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; circle(ctx, r() * W, r() * 220, r() * 1.6 + 0.4); ctx.fill(); }
      ridge(ctx, W, H, 560, 140, 4, 153, '#8a8ab0', 5);
      ridge(ctx, W, H, 600, 110, 6, 154, '#6a6a94', 5);
      for (let x = 0; x < W; x += 8) { const y = ridgeY(x, W, 600, 110, 6, 154, 5); poly(ctx, [[x - 7, y + 12], [x, y - 18 - hash2(x, 5, 5) * 14], [x + 7, y + 12]]); ctx.fillStyle = '#4a4a74'; ctx.fill(); }
      ridge(ctx, W, H, 680, 60, 7, 155, '#c8cce0', 4);
      for (let x = 0; x < W; x += 10) { const y = ridgeY(x, W, 680, 60, 7, 155, 4); if (hash2(x, 6, 6) < 0.6) { poly(ctx, [[x - 8, y + 10], [x, y - 26], [x + 8, y + 10]]); ctx.fillStyle = '#2a3048'; ctx.fill(); } }
      ctx.fillStyle = '#d8dcec'; ctx.fillRect(0, 720, W, H);
      haze(ctx, W, 480, 720, '#e8c0c0');
    },
    mid(ctx, W, H) {
      const base = H - 70;
      ctx.fillStyle = '#dfe6f2'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 60, 4, 161)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(163);
      for (let i = 0; i < 70; i++) { const x = r() * W, y = ridgeY(x, W, base, 60, 4, 161) + 10, h = 140 + r() * 160; wrap(W, x, 80, xx => fir(ctx, xx, y, h, '#24423a', '#122a22', 'rgba(240,244,255,.95)')); }
      ctx.fillStyle = 'rgba(230,236,250,.6)'; for (let x = 0; x < W; x += 6) { const y = ridgeY(x, W, base, 60, 4, 161); ctx.fillRect(x, y + 8, 6, 14); }
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#eef2fa'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 30, 6, 171)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(173);
      for (let i = 0; i < 30; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 6, 171) + 12; wrap(W, x, 120, xx => fir(ctx, xx, y, 200 + r() * 100, '#1e3a32', '#0e221c', '#ffffff')); }
      for (let i = 0; i < 30; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 6, 171) + 16; ellipse(ctx, x, y, 40 + r() * 40, 14 + r() * 10); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    }
  },
  baikal: {
    name: 'Байкал', sky: ['#2a7ad8', '#8ac4f0', '#e8f6ff'], ground: '#dde8f4', soil: 'snow', road: 'ice', grass: 'snow', fog: '#e0f0fa', snow: true,
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#2a7ad8'], [0.55, '#8ac4f0'], [0.8, '#e8f6ff'], [1, '#f0f8ff']]);
      sun(ctx, 300, 160, 44, '#ffffff', 'rgba(255,255,255,.5)');
      [[900, 130, 100], [1600, 190, 80]].forEach(c => wrap(W, c[0], 250, x => cloud(ctx, x, c[1], c[2], '#e8f2fa', 'rgba(150,180,210,.35)')));
      peaks(ctx, W, 585, 11, 140, 260, 181, '#c8d8ec', '#7a94b8', 120, '#ffffff');
      ridge(ctx, W, H, 580, 90, 7, 182, '#5a7aa0', 5);
      // гладь льда
      ctx.fillStyle = lg(ctx, 0, 590, 0, H, [[0, '#a8d8f0'], [0.4, '#6ab8e0'], [1, '#3a90c8']]); ctx.fillRect(0, 590, W, H - 590);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; const r = mulberry(185);
      for (let i = 0; i < 60; i++) { let x = r() * W, y = 600 + r() * 160; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += 10 + r() * 30; y += (r() - 0.5) * 12; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 30; i++) { ellipse(ctx, r() * W, 610 + r() * 150, 30 + r() * 60, 3 + r() * 4); ctx.fill(); }
      haze(ctx, W, 420, 600, '#e8f6ff');
    },
    mid(ctx, W, H) {
      const base = H - 60;
      ctx.fillStyle = '#cfe4f2'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 30, 5, 191)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(193);
      // торосы
      for (let i = 0; i < 34; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 5, 191) + 14, s = 30 + r() * 60; wrap(W, x, 100, xx => { for (let k = 0; k < 3; k++) { const ox = xx + (k - 1) * s * 0.6, hh = s * (0.8 + r() * 0.9); poly(ctx, [[ox - s * 0.4, y], [ox - s * 0.1 + (r() - 0.5) * s * 0.3, y - hh], [ox + s * 0.4, y]]); ctx.fillStyle = lg(ctx, ox - s * 0.4, 0, ox + s * 0.4, 0, [[0, '#e8fbff'], [0.5, '#8ad8f0'], [1, '#3a98c0']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke(); } }); }
      for (let i = 0; i < 10; i++) { const x = r() * W, y = ridgeY(x, W, base, 30, 5, 191) + 10; wrap(W, x, 80, xx => fir(ctx, xx, y, 150 + r() * 80, '#2a4a42', '#14302a', '#fff')); }
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#f2f7fc'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 34, 6, 201)); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = 'rgba(160,200,230,.35)'; for (let x = 0; x < W; x += 6) { const y = ridgeY(x, W, base, 34, 6, 201); ctx.fillRect(x, y + 10, 6, 20); }
      const r = mulberry(203);
      for (let i = 0; i < 20; i++) { const x = r() * W, y = ridgeY(x, W, base, 34, 6, 201) + 12; wrap(W, x, 60, xx => { ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + (k - 2) * 14, y - 50 - (k % 2) * 20); ctx.stroke(); } }); }
    }
  },
  primorye: {
    name: 'Приморье', sky: ['#3a2a6a', '#e86a5a', '#ffd08a'], ground: '#4a7a3a', soil: 'soil', road: 'asphalt', grass: 'summer', fog: '#f8c8a0',
    far(ctx, W, H) {
      sky(ctx, W, H, [[0, '#2a2060'], [0.35, '#8a3a7a'], [0.6, '#f07a5a'], [0.78, '#ffc07a'], [1, '#ffd89a']]);
      sun(ctx, 1000, 520, 70, '#fff0c0', 'rgba(255,200,120,.65)');
      [[300, 200, 140], [1500, 260, 120], [1900, 140, 90]].forEach(c => wrap(W, c[0], 300, x => cloud(ctx, x, c[1], c[2], '#f8a0a0', 'rgba(120,40,90,.35)')));
      // море
      ctx.fillStyle = lg(ctx, 0, 560, 0, H, [[0, '#d87a6a'], [0.3, '#7a4a7a'], [1, '#2a3a6a']]); ctx.fillRect(0, 560, W, H - 560);
      ctx.fillStyle = 'rgba(255,220,150,.7)'; for (let y = 565; y < 760; y += 6) { const w = 140 - (y - 560) * 0.3 + Math.sin(y) * 30; ctx.fillRect(1000 - w / 2 + Math.sin(y * 3) * 20, y, w, 2); }
      // острова
      [[200, 60], [1500, 90], [1750, 50]].forEach(p => { ctx.beginPath(); ctx.moveTo(p[0] - p[1] * 2, 565); ctx.quadraticCurveTo(p[0], 565 - p[1], p[0] + p[1] * 2, 565); ctx.fillStyle = '#5a3a6a'; ctx.fill(); });
      // вантовый мост
      const bx = 520, by = 540; ctx.strokeStyle = '#4a2a5a'; ctx.lineWidth = 4;
      [[bx, 0], [bx + 420, 0]].forEach(t => { ctx.beginPath(); ctx.moveTo(t[0] - 30, by + 30); ctx.lineTo(t[0], by - 170); ctx.lineTo(t[0] + 30, by + 30); ctx.stroke(); ctx.lineWidth = 1.2; for (let k = 1; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(t[0], by - 160 + k * 6); ctx.lineTo(t[0] - k * 26, by); ctx.moveTo(t[0], by - 160 + k * 6); ctx.lineTo(t[0] + k * 26, by); ctx.stroke(); } ctx.lineWidth = 4; });
      ctx.fillStyle = '#4a2a5a'; ctx.fillRect(bx - 250, by, 920, 6);
      // судно
      const sx = 1300; ctx.fillStyle = '#3a2a4a'; poly(ctx, [[sx - 120, 585], [sx + 130, 585], [sx + 110, 605], [sx - 110, 605]]); ctx.fill(); ctx.fillRect(sx + 60, 555, 40, 30);
      ['#c84a3a', '#3a7ac8', '#e8b830', '#4a9a5a'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(sx - 100 + i * 38, 570, 34, 15); });
      haze(ctx, W, 420, 600, '#ffc890');
    },
    mid(ctx, W, H) {
      const base = H - 70;
      ctx.fillStyle = '#3a5a3a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 150, 4, 211)); ctx.lineTo(W, H); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,170,110,.25)'; for (let x = 0; x < W; x += 6) ctx.fillRect(x, ridgeY(x, W, base, 150, 4, 211), 6, 40); ctx.restore();
      const r = mulberry(213);
      for (let i = 0; i < 60; i++) { const x = r() * W, y = ridgeY(x, W, base, 150, 4, 211) + 20 + r() * 80, h = 90 + r() * 90; wrap(W, x, 80, xx => blobTree(ctx, xx, y, h, ['#8ab060', '#4a7a3a', '#2a4a2a'], '#3a2818', i + 5)); }
      // маяк
      const lx = 1650, ly = ridgeY(lx, W, base, 150, 4, 211) + 30;
      ctx.fillStyle = '#f4f0e8'; poly(ctx, [[lx - 18, ly], [lx - 10, ly - 140], [lx + 10, ly - 140], [lx + 18, ly]]); ctx.fill();
      ctx.fillStyle = '#d83a2a'; for (let k = 0; k < 3; k++) ctx.fillRect(lx - 16 + k * 2, ly - 40 - k * 40, 32 - k * 4, 16);
      ctx.fillStyle = '#ffe080'; ctx.fillRect(lx - 9, ly - 160, 18, 20); ctx.fillStyle = '#3a2a2a'; poly(ctx, [[lx - 13, ly - 160], [lx, ly - 176], [lx + 13, ly - 160]]); ctx.fill();
    },
    near(ctx, W, H) {
      const base = H - 50;
      ctx.fillStyle = '#2f5a2a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, ridgeY(x, W, base, 28, 6, 221)); ctx.lineTo(W, H); ctx.fill();
      const r = mulberry(223);
      for (let i = 0; i < 34; i++) { const x = r() * W, y = ridgeY(x, W, base, 28, 6, 221) + 10; wrap(W, x, 140, xx => { if (r() < 0.35) blobTree(ctx, xx, y, 220 + r() * 60, ['#6a9a4a', '#2f6a2a', '#1a3a1a'], '#2a1a10', i + 77); else for (let k = 0; k < 4; k++) { circle(ctx, xx + (k - 1.5) * 18, y - 18 - r() * 14, 22 + r() * 10); ctx.fillStyle = k % 2 ? '#3a6a2a' : '#2a5a22'; ctx.fill(); } }); }
    }
  }
};

// ---------- текстуры земли (бесшовные 512×512) ----------
function texture(ctx, S, base, dark, light, opt) {
  const img = ctx.createImageData(S, S); const d = img.data;
  const B = hex(base), D = hex(dark), L = hex(light);
  const sc = opt.scale || 8, seed = opt.seed || 1;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let n = fbm2(x / S * sc, y / S * sc, sc, sc, seed, 5);
    if (opt.strata) n = n * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin((y / S) * Math.PI * 2 * opt.strata + fbm2(x / S * 4, y / S * 4, 4, 4, seed + 9, 3) * 6));
    const g = hash2(x, y, seed) * (opt.grain || 0.15);
    const t = clamp(n + g - (opt.grain || 0.15) / 2, 0, 1);
    const c = t < 0.5 ? B.map((v, i) => lerp(D[i], v, t * 2)) : B.map((v, i) => lerp(v, L[i], (t - 0.5) * 2));
    const k = (y * S + x) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (opt.stones) {
    const r = mulberry(seed + 5);
    for (let i = 0; i < opt.stones; i++) {
      const x = r() * S, y = r() * S, rr = 3 + r() * (opt.stoneR || 12), c = opt.stoneCol[Math.floor(r() * opt.stoneCol.length)];
      wrap(S, x, rr * 2, xx => [0, S, -S].forEach(dy => { ellipse(ctx, xx, y + dy, rr, rr * (0.6 + r() * 0.3), r() * 3); ctx.fillStyle = rg(ctx, xx - rr * 0.3, y + dy - rr * 0.3, 1, rr * 1.2, [[0, shade(c, 0.3)], [1, shade(c, -0.3)]]); ctx.fill(); }));
    }
  }
  if (opt.roots) {
    const r = mulberry(seed + 7); ctx.strokeStyle = opt.roots; ctx.lineWidth = 1.5;
    for (let i = 0; i < 25; i++) { let x = r() * S, y = r() * S; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 30; y += r() * 18; ctx.lineTo(x, y); } ctx.stroke(); }
  }
  if (opt.sparkle) { const r = mulberry(seed + 9); for (let i = 0; i < opt.sparkle; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + r() * 0.5) + ')'; ctx.fillRect(r() * S, r() * S, 1.5, 1.5); } }
  if (opt.cracks) { const r = mulberry(seed + 11); ctx.strokeStyle = opt.cracks; ctx.lineWidth = 1.2; for (let i = 0; i < 22; i++) { let x = r() * S, y = r() * S; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; ctx.lineTo(x, y); } ctx.stroke(); } }
}
const TEX = {
  soil: { base: '#6a4a2a', dark: '#3a2614', light: '#8a6a42', scale: 6, seed: 3, stones: 70, stoneCol: ['#8a8278', '#a89a88', '#6a625a'], roots: 'rgba(40,24,10,.5)' },
  clay: { base: '#8a4a2a', dark: '#4a2414', light: '#b06a3a', scale: 6, seed: 4, stones: 50, stoneCol: ['#a88a70', '#c8a888'], strata: 6 },
  rock: { base: '#6a6660', dark: '#3a3834', light: '#9a948a', scale: 5, seed: 5, stones: 40, stoneR: 20, stoneCol: ['#8a8680', '#5a5650', '#a8a49a'], strata: 8 },
  sand: { base: '#a8884a', dark: '#6a5428', light: '#d0b070', scale: 7, seed: 6, stones: 30, stoneR: 6, stoneCol: ['#8a7a5a', '#c8b088'], strata: 10 },
  snow: { base: '#dce6f2', dark: '#a8b8d0', light: '#ffffff', scale: 5, seed: 7, grain: 0.06, sparkle: 300 },
  asphalt: { base: '#4a4c50', dark: '#2a2b2e', light: '#6a6c70', scale: 12, seed: 8, grain: 0.5, stones: 160, stoneR: 2.5, stoneCol: ['#7a7c80', '#5a5c60', '#8a8478'], cracks: 'rgba(20,20,22,.6)' },
  dirt: { base: '#7a6038', dark: '#4a3820', light: '#9a8050', scale: 9, seed: 9, grain: 0.4, stones: 120, stoneR: 4, stoneCol: ['#8a8070', '#a89a80', '#6a6050'] },
  snowroad: { base: '#c8d2de', dark: '#8a96a8', light: '#eef2f8', scale: 9, seed: 10, grain: 0.3, sparkle: 200 },
  ice: { base: '#8ac8e8', dark: '#4a90c0', light: '#d8f2ff', scale: 4, seed: 11, grain: 0.08, cracks: 'rgba(255,255,255,.7)', sparkle: 120 },
  mud: { base: '#4a3820', dark: '#2a1e10', light: '#6a5030', scale: 6, seed: 12, grain: 0.2 }
};
