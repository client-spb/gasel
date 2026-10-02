// Грузы и бонусы
'use strict';
const IT = {};
IT.watermelon = (ctx, S) => {
  const c = S / 2, r = S * 0.42;
  ellipse(ctx, c, c, r, r * 0.86, 0.2);
  ctx.fillStyle = rg(ctx, c - r * 0.3, c - r * 0.35, r * 0.1, r * 1.1, [[0, '#7fd35a'], [0.6, '#2f8f2a'], [1, '#14501a']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = -4; i <= 4; i++) {
    ctx.strokeStyle = '#123f14'; ctx.lineWidth = S * 0.045; ctx.beginPath();
    for (let t = -1; t <= 1.01; t += 0.1) { const x = c + i * r * 0.24 + Math.sin(t * 7 + i) * S * 0.015 + t * r * 0.15, y = c + t * r; t === -1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(ctx, c - r * 0.35, c - r * 0.4, r * 0.25, r * 0.12, -0.6); ctx.fill();
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = S * 0.03; ctx.beginPath(); ctx.moveTo(c + r * 0.75, c - r * 0.55); ctx.quadraticCurveTo(c + r, c - r * 0.85, c + r * 0.85, c - r); ctx.stroke();
};
IT.eggs = (ctx, S) => {
  const x = S * 0.08, y = S * 0.36, w = S * 0.84, h = S * 0.5;
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#d9c7a4'], [1, '#a68e66']]); rrect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = '#7a6440'; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const ex = x + w * (0.15 + i * 0.235), ey = y - S * 0.02 + j * S * 0.12;
    ellipse(ctx, ex, ey, S * 0.085, S * 0.11); ctx.fillStyle = rg(ctx, ex - 5, ey - 8, 2, S * 0.12, [[0, '#fffaf0'], [1, '#e8d2b0']]); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,50,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  text(ctx, 'ЯЙЦА С0', S / 2, y + h * 0.62, 'bold ' + S * 0.13 + 'px ' + FONT_N, '#5a3d17');
  text(ctx, 'ОСТОРОЖНО!', S / 2, y + h * 0.86, 'bold ' + S * 0.09 + 'px ' + FONT_N, '#b8231a');
};
IT.egg = (ctx, S) => { ellipse(ctx, S / 2, S / 2, S * 0.3, S * 0.4); ctx.fillStyle = rg(ctx, S * 0.4, S * 0.35, 2, S * 0.45, [[0, '#fffdf6'], [1, '#e2c9a2']]); ctx.fill(); ctx.strokeStyle = '#b39a74'; ctx.lineWidth = 2; ctx.stroke(); };
IT.fridge = (ctx, S) => {
  const x = S * 0.22, y = S * 0.04, w = S * 0.56, h = S * 0.92;
  ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#cfd6dc'], [0.3, '#ffffff'], [0.8, '#e3e8ec'], [1, '#9aa4ad']]); rrect(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = '#7d8790'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = '#a5adb5'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.36); ctx.lineTo(x + w, y + h * 0.36); ctx.stroke();
  ctx.fillStyle = '#8a939b'; rrect(ctx, x + w * 0.78, y + h * 0.1, 6, h * 0.18, 3); ctx.fill(); rrect(ctx, x + w * 0.78, y + h * 0.44, 6, h * 0.22, 3); ctx.fill();
  text(ctx, 'Бирюса', x + w * 0.42, y + h * 0.88, 'italic bold ' + S * 0.08 + 'px ' + FONT_N, '#3a6fb0');
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + 6, y + 8, 5, h - 16);
  // магнитик
  ctx.fillStyle = '#e8402f'; rrect(ctx, x + w * 0.2, y + h * 0.5, S * 0.1, S * 0.08, 3); ctx.fill();
  ctx.fillStyle = '#2c7be5'; circle(ctx, x + w * 0.5, y + h * 0.6, S * 0.04); ctx.fill();
};
IT.honey = (ctx, S) => {
  const x = S * 0.2, y = S * 0.22, w = S * 0.6, h = S * 0.72;
  ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#b86a00'], [0.35, '#ffb21a'], [0.7, '#f39a00'], [1, '#9a5200']]); rrect(ctx, x, y, w, h, 18); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; rrect(ctx, x + w * 0.12, y + h * 0.1, w * 0.12, h * 0.7, 6); ctx.fill();
  // крышка в клеточку
  ctx.fillStyle = '#d42a20'; rrect(ctx, x - 6, y - S * 0.12, w + 12, S * 0.16, 6); ctx.fill();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ctx.fillRect(x - 6 + i * (w + 12) / 6, y - S * 0.12 + j * S * 0.08, (w + 12) / 6, S * 0.08);
  ctx.strokeStyle = '#7a4a10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y + S * 0.04); ctx.lineTo(x + w + 6, y + S * 0.04); ctx.stroke();
  ctx.fillStyle = '#fff6dd'; rrect(ctx, x + w * 0.18, y + h * 0.35, w * 0.64, h * 0.32, 6); ctx.fill();
  text(ctx, 'МЁД', S / 2, y + h * 0.51, 'bold ' + S * 0.12 + 'px ' + FONT_T, '#9a5200');
};
IT.cat = (ctx, S, frame) => {
  const f = frame || 0, c = S / 2;
  ctx.save(); ctx.translate(c, c + S * 0.08);
  // хвост
  ctx.strokeStyle = '#d9822b'; ctx.lineWidth = S * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-S * 0.28, 0); ctx.quadraticCurveTo(-S * 0.46, -S * 0.2 - f * S * 0.08, -S * 0.36, -S * 0.36); ctx.stroke();
  // лапы
  ctx.strokeStyle = '#c06d1c'; ctx.lineWidth = S * 0.06;
  const legs = f ? [[-0.2, 0.25], [-0.05, 0.18], [0.12, 0.25], [0.24, 0.16]] : [[-0.18, 0.2], [-0.08, 0.24], [0.14, 0.2], [0.22, 0.24]];
  legs.forEach((l, i) => { ctx.beginPath(); ctx.moveTo(l[0] * S, S * 0.05); ctx.lineTo((l[0] + (i % 2 ? 0.04 : -0.04) * (f ? 2 : 1)) * S, l[1] * S); ctx.stroke(); });
  // тело
  ellipse(ctx, 0, 0, S * 0.3, S * 0.15); ctx.fillStyle = rg(ctx, 0, -S * 0.08, 2, S * 0.32, [[0, '#ffb35c'], [1, '#d9822b']]); ctx.fill();
  ctx.strokeStyle = '#b8641a'; ctx.lineWidth = S * 0.025; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-S * 0.18 + i * S * 0.1, -S * 0.14); ctx.lineTo(-S * 0.14 + i * S * 0.1, -S * 0.04); ctx.stroke(); }
  // голова
  circle(ctx, S * 0.28, -S * 0.12, S * 0.14); ctx.fillStyle = '#f39a3e'; ctx.fill();
  poly(ctx, [[S * 0.17, -S * 0.2], [S * 0.2, -S * 0.36], [S * 0.27, -S * 0.24]]); ctx.fill();
  poly(ctx, [[S * 0.32, -S * 0.24], [S * 0.4, -S * 0.36], [S * 0.41, -S * 0.18]]); ctx.fill();
  ctx.fillStyle = '#fff'; ellipse(ctx, S * 0.3, -S * 0.14, S * 0.035, S * 0.05); ctx.fill(); ellipse(ctx, S * 0.37, -S * 0.15, S * 0.03, S * 0.045); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; circle(ctx, S * 0.31, -S * 0.14, S * 0.018); ctx.fill(); circle(ctx, S * 0.38, -S * 0.15, S * 0.016); ctx.fill();
  ctx.fillStyle = '#e46a8a'; circle(ctx, S * 0.4, -S * 0.08, S * 0.02); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; [[-0.02], [0.02]].forEach(d => { ctx.beginPath(); ctx.moveTo(S * 0.4, -S * 0.07); ctx.lineTo(S * 0.5, -S * (0.08 + d[0])); ctx.stroke(); });
  ctx.restore();
};
IT.box = (ctx, S) => {
  const x = S * 0.12, y = S * 0.2, w = S * 0.76, h = S * 0.66;
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#d7a868'], [1, '#a77a3c']]); rrect(ctx, x, y, w, h, 4); ctx.fill();
  ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(230,220,180,.7)'; ctx.fillRect(x + w * 0.44, y, w * 0.12, h);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y + h * 0.48, w, 3);
  text(ctx, 'ТЁЩИНО', x + w * 0.5, y + h * 0.3, 'bold ' + S * 0.1 + 'px ' + FONT_H, '#3b2a12');
  text(ctx, 'НЕ КАНТОВАТЬ', x + w * 0.5, y + h * 0.75, 'bold ' + S * 0.075 + 'px ' + FONT_N, '#3b2a12');
  ctx.strokeStyle = '#3b2a12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.12, y + h * 0.95); ctx.lineTo(x + w * 0.12, y + h * 0.6); ctx.moveTo(x + w * 0.06, y + h * 0.68); ctx.lineTo(x + w * 0.12, y + h * 0.6); ctx.lineTo(x + w * 0.18, y + h * 0.68); ctx.stroke();
};
IT.carpet = (ctx, S) => {
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(-0.25);
  const w = S * 0.86, h = S * 0.26;
  ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#d64a3a'], [0.5, '#a8241a'], [1, '#6e130c']]); rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
  for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#f0c040' : '#2a5a9a'; ctx.fillRect(-w / 2 + h / 2 + i * w * 0.085, -h / 2 + 3, w * 0.03, h - 6); }
  ellipse(ctx, w / 2 - h / 2, 0, h * 0.3, h / 2); ctx.fillStyle = '#7a1810'; ctx.fill();
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = 2; for (let r = 0.1; r < 0.5; r += 0.12) { ellipse(ctx, w / 2 - h / 2, 0, h * 0.3 * r * 2, h * r); ctx.stroke(); }
  ctx.restore();
};
IT.sack = (ctx, S) => {
  ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.2); ctx.quadraticCurveTo(S * 0.1, S * 0.6, S * 0.2, S * 0.9); ctx.lineTo(S * 0.8, S * 0.9);
  ctx.quadraticCurveTo(S * 0.92, S * 0.6, S * 0.7, S * 0.2); ctx.closePath();
  ctx.fillStyle = lg(ctx, S * 0.15, 0, S * 0.85, 0, [[0, '#8a7448'], [0.4, '#c9b07a'], [1, '#7a6440']]); ctx.fill();
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(80,60,30,.25)'; ctx.lineWidth = 1;
  for (let i = 0; i < S; i += 5) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#5a4a2a'; poly(ctx, [[S * 0.3, S * 0.2], [S * 0.36, S * 0.06], [S * 0.5, S * 0.16], [S * 0.64, S * 0.06], [S * 0.7, S * 0.2]]); ctx.fill();
  ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.22); ctx.lineTo(S * 0.7, S * 0.22); ctx.stroke();
  text(ctx, 'КАРТОФЕЛЬ', S / 2, S * 0.58, 'bold ' + S * 0.09 + 'px ' + FONT_N, '#3a2a12');
  text(ctx, '40 кг', S / 2, S * 0.7, 'bold ' + S * 0.08 + 'px ' + FONT_N, '#3a2a12');
};
IT.potato = (ctx, S) => {
  ellipse(ctx, S / 2, S / 2, S * 0.38, S * 0.28, 0.4); ctx.fillStyle = rg(ctx, S * 0.4, S * 0.4, 2, S * 0.45, [[0, '#e8c27e'], [1, '#a0723a']]); ctx.fill();
  ctx.fillStyle = '#7a5226'; [[0.4, 0.45], [0.6, 0.55], [0.5, 0.35]].forEach(p => { circle(ctx, S * p[0], S * p[1], S * 0.03); ctx.fill(); });
};
IT.goose = (ctx, S, frame) => {
  const f = frame || 0;
  ctx.save(); ctx.translate(S * 0.5, S * 0.58);
  ctx.strokeStyle = '#f08a1a'; ctx.lineWidth = S * 0.035; if (!f) { ctx.beginPath(); ctx.moveTo(-S * 0.04, S * 0.1); ctx.lineTo(-S * 0.04, S * 0.3); ctx.moveTo(S * 0.06, S * 0.1); ctx.lineTo(S * 0.08, S * 0.3); ctx.stroke(); }
  ellipse(ctx, 0, 0, S * 0.28, S * 0.17, -0.1); ctx.fillStyle = rg(ctx, -S * 0.05, -S * 0.08, 2, S * 0.3, [[0, '#ffffff'], [1, '#c7ccd2']]); ctx.fill();
  ctx.strokeStyle = '#9aa1a8'; ctx.lineWidth = 2; ctx.stroke();
  // крыло
  ctx.fillStyle = '#e4e8ec'; ctx.beginPath();
  if (f) { ctx.moveTo(-S * 0.1, -S * 0.05); ctx.quadraticCurveTo(-S * 0.25, -S * 0.5, S * 0.05, -S * 0.45); ctx.quadraticCurveTo(0, -S * 0.2, S * 0.08, -S * 0.05); }
  else { ctx.moveTo(-S * 0.18, -S * 0.02); ctx.quadraticCurveTo(-S * 0.05, -S * 0.16, S * 0.12, -S * 0.05); ctx.quadraticCurveTo(0, S * 0.08, -S * 0.18, -S * 0.02); }
  ctx.fill(); ctx.stroke();
  // шея и голова
  ctx.strokeStyle = '#f4f6f8'; ctx.lineWidth = S * 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(S * 0.2, -S * 0.04); ctx.quadraticCurveTo(S * 0.3, -S * 0.2, S * 0.26, -S * 0.34); ctx.stroke();
  circle(ctx, S * 0.27, -S * 0.36, S * 0.07); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#f08a1a'; poly(ctx, [[S * 0.32, -S * 0.39], [S * 0.44, -S * 0.35], [S * 0.32, -S * 0.32]]); ctx.fill();
  ctx.fillStyle = '#111'; circle(ctx, S * 0.29, -S * 0.38, S * 0.015); ctx.fill();
  ctx.restore();
};
IT.accordion = (ctx, S) => {
  const y = S * 0.25, h = S * 0.5;
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#a2382c'], [1, '#5a1610']]); rrect(ctx, S * 0.06, y, S * 0.22, h, 6); ctx.fill(); rrect(ctx, S * 0.72, y, S * 0.22, h, 6); ctx.fill();
  for (let i = 0; i < 9; i++) { const x = S * 0.28 + i * S * 0.049; ctx.fillStyle = i % 2 ? '#2a2a2e' : '#e0e2e4'; ctx.fillRect(x, y + 4, S * 0.049, h - 8); }
  ctx.fillStyle = '#f2ece0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { circle(ctx, S * 0.12 + j * S * 0.05, y + h * 0.2 + i * h * 0.2, S * 0.018); ctx.fill(); }
  ctx.fillStyle = '#d8b04a'; ctx.fillRect(S * 0.72, y + h * 0.1, S * 0.2, 4); ctx.fillRect(S * 0.72, y + h * 0.88, S * 0.2, 4);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { rrect(ctx, S * 0.76, y + h * 0.18 + i * h * 0.095, S * 0.14, h * 0.06, 2); ctx.fill(); }
};
IT.firtree = (ctx, S) => {
  ctx.fillStyle = '#6a4424'; ctx.fillRect(S * 0.46, S * 0.75, S * 0.08, S * 0.2);
  for (let i = 0; i < 4; i++) {
    const y = S * (0.12 + i * 0.17), w = S * (0.16 + i * 0.1);
    poly(ctx, [[S / 2, y], [S / 2 + w, y + S * 0.25], [S / 2 - w, y + S * 0.25]]);
    ctx.fillStyle = lg(ctx, S / 2 - w, 0, S / 2 + w, 0, [[0, '#1d5a2a'], [0.5, '#2f8a3e'], [1, '#164a22']]); ctx.fill();
  }
  ctx.strokeStyle = '#d8e0e6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S * 0.3, S * 0.4); ctx.lineTo(S * 0.7, S * 0.62); ctx.moveTo(S * 0.68, S * 0.3); ctx.lineTo(S * 0.28, S * 0.7); ctx.stroke();
};
IT.fish = (ctx, S) => {
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(-0.2);
  ctx.beginPath(); ctx.moveTo(S * 0.38, 0); ctx.quadraticCurveTo(S * 0.1, -S * 0.2, -S * 0.25, -S * 0.02); ctx.lineTo(-S * 0.42, -S * 0.16); ctx.lineTo(-S * 0.38, S * 0.14); ctx.lineTo(-S * 0.25, S * 0.04); ctx.quadraticCurveTo(S * 0.1, S * 0.18, S * 0.38, 0); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, -S * 0.15, 0, S * 0.15, [[0, '#7a4a1a'], [0.5, '#d9a050'], [1, '#f0d090']]); ctx.fill(); ctx.strokeStyle = '#5a3412'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#111'; circle(ctx, S * 0.26, -S * 0.03, S * 0.025); ctx.fill();
  ctx.strokeStyle = 'rgba(90,52,18,.5)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(S * (0.12 - i * 0.07), 0, S * 0.08, -1, 1); ctx.stroke(); }
  ctx.restore();
};
IT.samovar = (ctx, S) => {
  const c = S / 2;
  ctx.fillStyle = '#7a4a1a'; rrect(ctx, c - S * 0.2, S * 0.84, S * 0.4, S * 0.08, 4); ctx.fill();
  ctx.fillStyle = lg(ctx, c - S * 0.3, 0, c + S * 0.3, 0, [[0, '#8a5a12'], [0.3, '#ffe08a'], [0.55, '#e0a830'], [1, '#7a4a0a']]);
  ctx.beginPath(); ctx.moveTo(c - S * 0.12, S * 0.84); ctx.quadraticCurveTo(c - S * 0.36, S * 0.6, c - S * 0.26, S * 0.34); ctx.lineTo(c + S * 0.26, S * 0.34); ctx.quadraticCurveTo(c + S * 0.36, S * 0.6, c + S * 0.12, S * 0.84); ctx.closePath(); ctx.fill();
  ctx.fillRect(c - S * 0.12, S * 0.22, S * 0.24, S * 0.12); ctx.fillRect(c - S * 0.05, S * 0.1, S * 0.1, S * 0.12);
  ctx.strokeStyle = '#3a2208'; ctx.lineWidth = S * 0.035; ctx.beginPath(); ctx.arc(c - S * 0.32, S * 0.44, S * 0.06, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(c + S * 0.32, S * 0.44, S * 0.06, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.fillStyle = '#c08a20'; ctx.fillRect(c + S * 0.2, S * 0.66, S * 0.14, S * 0.04);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(ctx, c - S * 0.12, S * 0.55, S * 0.04, S * 0.15); ctx.fill();
};
IT.pickles = (ctx, S) => {
  const x = S * 0.22, y = S * 0.2, w = S * 0.56, h = S * 0.74;
  ctx.fillStyle = 'rgba(200,230,200,.55)'; rrect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.save(); rrect(ctx, x, y, w, h, 14); ctx.clip();
  ctx.fillStyle = 'rgba(190,200,120,.6)'; ctx.fillRect(x, y + h * 0.15, w, h);
  const r = mulberry(3); for (let i = 0; i < 9; i++) { ellipse(ctx, x + w * (0.2 + r() * 0.6), y + h * (0.25 + r() * 0.65), S * 0.06, S * 0.14, r() * 0.6 - 0.3); ctx.fillStyle = i % 2 ? '#4a7a2a' : '#3a6a22'; ctx.fill(); }
  ctx.fillStyle = '#e8d070'; circle(ctx, x + w * 0.7, y + h * 0.4, S * 0.03); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(100,140,110,.8)'; ctx.lineWidth = 3; rrect(ctx, x, y, w, h, 14); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 6, y + 10, 5, h - 20);
  ctx.fillStyle = lg(ctx, 0, y - S * 0.08, 0, y + 4, [[0, '#d8dde2'], [1, '#8a939b']]); rrect(ctx, x - 3, y - S * 0.08, w + 6, S * 0.1, 4); ctx.fill();
};
IT.tv = (ctx, S) => {
  const x = S * 0.1, y = S * 0.18, w = S * 0.8, h = S * 0.62;
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#6a4a2a'], [1, '#3a2412']]); rrect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = rg(ctx, x + w * 0.38, y + h * 0.45, 4, w * 0.45, [[0, '#9ab'], [1, '#234']]); rrect(ctx, x + w * 0.06, y + h * 0.1, w * 0.64, h * 0.8, 16); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(ctx, x + w * 0.25, y + h * 0.3, w * 0.12, h * 0.06, -0.4); ctx.fill();
  ctx.fillStyle = '#c8c0b0'; for (let i = 0; i < 3; i++) { circle(ctx, x + w * 0.84, y + h * (0.25 + i * 0.22), S * 0.035); ctx.fill(); }
  ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S * 0.4, y); ctx.lineTo(S * 0.28, S * 0.02); ctx.moveTo(S * 0.5, y); ctx.lineTo(S * 0.66, S * 0.03); ctx.stroke();
  ctx.fillStyle = '#3a2412'; ctx.fillRect(x + w * 0.15, y + h, S * 0.06, S * 0.12); ctx.fillRect(x + w * 0.78, y + h, S * 0.06, S * 0.12);
  text(ctx, 'Рубин', x + w * 0.38, y + h * 0.96, 'bold ' + S * 0.06 + 'px ' + FONT_N, '#e8c070');
};
// бонусы
IT.canister = (ctx, S) => {
  const x = S * 0.18, y = S * 0.16, w = S * 0.64, h = S * 0.76;
  withShadow(ctx, 'rgba(0,0,0,.4)', 8, 0, 4, () => {
    ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#8a0f08'], [0.3, '#ff4a32'], [0.65, '#d8231a'], [1, '#6e0a05']]);
    ctx.beginPath(); ctx.moveTo(x + w * 0.35, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h * 0.28); ctx.closePath(); ctx.fill();
  });
  ctx.strokeStyle = 'rgba(80,5,2,.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h * 0.45); ctx.lineTo(x + w * 0.9, y + h * 0.88); ctx.moveTo(x + w * 0.9, y + h * 0.45); ctx.lineTo(x + w * 0.1, y + h * 0.88); ctx.stroke();
  ctx.fillStyle = '#5a0a05'; rrect(ctx, x + w * 0.5, y - S * 0.06, w * 0.4, S * 0.1, 4); ctx.fill();
  ctx.fillStyle = lg(ctx, 0, y - S * 0.1, 0, y, [[0, '#ffe080'], [1, '#b08020']]); rrect(ctx, x + w * 0.05, y + h * 0.02 - S * 0.08, w * 0.22, S * 0.12, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + w * 0.08, y + h * 0.35, w * 0.08, h * 0.6);
  text(ctx, '92', x + w * 0.62, y + h * 0.27, 'bold ' + S * 0.13 + 'px ' + FONT_T, '#fff', 'center', '#5a0a05', 4);
};
IT.coin = (ctx, S) => {
  const c = S / 2, r = S * 0.44;
  withShadow(ctx, 'rgba(120,70,0,.5)', 6, 0, 3, () => { circle(ctx, c, c, r); ctx.fillStyle = '#b07a10'; ctx.fill(); });
  circle(ctx, c, c, r * 0.94); ctx.fillStyle = rg(ctx, c - r * 0.35, c - r * 0.4, 2, r * 1.2, [[0, '#fff6c0'], [0.4, '#ffd23a'], [0.85, '#e09a10'], [1, '#a86a00']]); ctx.fill();
  ctx.strokeStyle = 'rgba(140,80,0,.7)'; ctx.lineWidth = S * 0.03; circle(ctx, c, c, r * 0.76); ctx.stroke();
  ctx.save(); ctx.font = 'bold ' + Math.round(S * 0.5) + 'px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#a86a00'; ctx.fillText('₽', c + 2, c + 3); ctx.fillStyle = '#fff1b0'; ctx.fillText('₽', c, c + 1); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ellipse(ctx, c - r * 0.4, c - r * 0.45, r * 0.22, r * 0.1, -0.7); ctx.fill();
};
IT.wrench = (ctx, S) => {
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(-0.75);
  const g = lg(ctx, -S * 0.05, 0, S * 0.05, 0, [[0, '#7a838c'], [0.5, '#f4f6f8'], [1, '#6a737c']]);
  withShadow(ctx, 'rgba(0,0,0,.4)', 6, 2, 3, () => { ctx.fillStyle = g; rrect(ctx, -S * 0.06, -S * 0.3, S * 0.12, S * 0.6, S * 0.04); ctx.fill(); });
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -S * 0.32, S * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, S * 0.32, S * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(-S * 0.05, -S * 0.5, S * 0.1, S * 0.18);
  circle(ctx, 0, S * 0.32, S * 0.065); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#e8402f'; rrect(ctx, -S * 0.07, -S * 0.08, S * 0.14, S * 0.22, 4); ctx.fill();
  ctx.restore();
};
IT.cheburek = (ctx, S) => {
  const c = S / 2;
  withShadow(ctx, 'rgba(90,40,0,.45)', 8, 0, 4, () => {
    ctx.beginPath(); ctx.moveTo(c - S * 0.42, c + S * 0.12); ctx.quadraticCurveTo(c, c - S * 0.62, c + S * 0.42, c + S * 0.12); ctx.closePath();
    ctx.fillStyle = rg(ctx, c - S * 0.08, c - S * 0.1, 4, S * 0.5, [[0, '#ffe2a0'], [0.5, '#f0b050'], [1, '#b8701e']]); ctx.fill();
  });
  // защипы
  ctx.strokeStyle = '#a8601a'; ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const t = i / 8, x = c - S * 0.4 + t * S * 0.8; const y = c + S * 0.12 - Math.sin(t * Math.PI) * S * 0.34; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 8); ctx.stroke(); }
  ctx.strokeStyle = '#c07a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c - S * 0.42, c + S * 0.12); ctx.lineTo(c + S * 0.42, c + S * 0.12); ctx.stroke();
  ctx.fillStyle = 'rgba(160,80,20,.5)'; [[0.4, 0.5], [0.55, 0.4], [0.62, 0.55], [0.35, 0.58]].forEach(p => { circle(ctx, S * p[0], S * p[1], S * 0.03); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(ctx, c - S * 0.12, c - S * 0.12, S * 0.12, S * 0.04, -0.4); ctx.fill();
  // пар
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  [-0.12, 0.04, 0.2].forEach(d => { ctx.beginPath(); ctx.moveTo(c + S * d, c - S * 0.28); ctx.bezierCurveTo(c + S * (d - 0.06), c - S * 0.36, c + S * (d + 0.06), c - S * 0.42, c + S * d, c - S * 0.5); ctx.stroke(); });
};
IT.magnet = (ctx, S) => {
  ctx.save(); ctx.translate(S / 2, S / 2 + S * 0.05); ctx.rotate(0.6);
  ctx.lineWidth = S * 0.18; ctx.strokeStyle = lg(ctx, -S * 0.3, 0, S * 0.3, 0, [[0, '#a8140c'], [0.5, '#ff5040'], [1, '#a8140c']]);
  ctx.beginPath(); ctx.arc(0, 0, S * 0.24, Math.PI, 0, true); ctx.stroke();
  ctx.lineWidth = S * 0.18;
  ctx.beginPath(); ctx.moveTo(-S * 0.24, 0); ctx.lineTo(-S * 0.24, -S * 0.12); ctx.moveTo(S * 0.24, 0); ctx.lineTo(S * 0.24, -S * 0.12); ctx.stroke();
  ctx.fillStyle = '#e8ecf0'; ctx.fillRect(-S * 0.33, -S * 0.32, S * 0.18, S * 0.14); ctx.fillRect(S * 0.15, -S * 0.32, S * 0.18, S * 0.14);
  ctx.restore();
};
