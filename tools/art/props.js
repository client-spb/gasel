// Придорожные объекты: знаки, столбики, рекламные щиты, АЗС, кафе, остановка, склад, препятствия
'use strict';
const PR = {};
function post(ctx, x, h, wdt) {
  ctx.fillStyle = lg(ctx, x - (wdt || 0.05), 0, x + (wdt || 0.05), 0, [[0, '#6a7076'], [0.5, '#e4e8ec'], [1, '#5a6066']]);
  ctx.fillRect(x - (wdt || 0.05), 0, (wdt || 0.05) * 2, h);
}
function triSign(ctx, cx, cy, r, draw) {
  ctx.save(); ctx.translate(cx, cy);
  const pts = [[0, r], [-r * 0.94, -r * 0.6], [r * 0.94, -r * 0.6]];
  poly(ctx, pts); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = '#d2231a'; ctx.lineWidth = r * 0.2; ctx.stroke();
  ctx.save(); poly(ctx, [[0, r * 0.62], [-r * 0.6, -r * 0.38], [r * 0.6, -r * 0.38]]); ctx.clip(); draw(); ctx.restore();
  ctx.restore();
}
PR.sign_speed = (ctx, w, h, P, n) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.9);
  circle(ctx, 0, 2.2, 0.36); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d2231a'; ctx.lineWidth = 0.09; ctx.stroke();
  mtextUp(ctx, String(n || 60), 0, 2.19, 0.34, '#111');
});
PR.sign_bumps = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.8);
  triSign(ctx, 0, 2.15, 0.42, () => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-0.32, -0.25); for (let x = -0.32; x <= 0.32; x += 0.02) ctx.lineTo(x, -0.25 + Math.max(0, Math.sin((x + 0.32) * 15)) * 0.14); ctx.lineTo(0.32, -0.3); ctx.lineTo(-0.32, -0.3); ctx.fill(); });
});
PR.sign_animals = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.8);
  triSign(ctx, 0, 2.15, 0.42, () => {
    ctx.fillStyle = '#111'; ctx.save(); ctx.scale(0.22, 0.22); ctx.translate(0.2, -1.6);
    // силуэт лося
    ctx.beginPath(); ctx.moveTo(-1, 1.6); ctx.lineTo(1, 1.6); ctx.lineTo(1, 1.0); ctx.lineTo(0.9, 0.1); ctx.lineTo(0.75, 0.1); ctx.lineTo(0.7, 0.9); ctx.lineTo(-0.6, 0.9); ctx.lineTo(-0.7, 0.1); ctx.lineTo(-0.85, 0.1); ctx.lineTo(-0.85, 1.0); ctx.lineTo(-1.3, 1.9); ctx.lineTo(-1.6, 1.6); ctx.lineTo(-1.3, 2.1); ctx.lineTo(-1.0, 2.0); ctx.closePath(); ctx.fill();
    ctx.fillRect(-1.3, 2.0, 0.08, 0.6); ctx.fillRect(-1.1, 2.0, 0.08, 0.5);
    ctx.restore();
  });
});
PR.sign_cow = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.8);
  triSign(ctx, 0, 2.15, 0.42, () => {
    ctx.fillStyle = '#111'; ctx.fillRect(-0.24, -0.12, 0.4, 0.16); ctx.fillRect(-0.22, -0.3, 0.05, 0.2); ctx.fillRect(0.1, -0.3, 0.05, 0.2);
    ctx.beginPath(); ctx.ellipse(-0.3, 0.02, 0.09, 0.07, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-0.36, 0.08, 0.03, 0.06); ctx.fillRect(-0.27, 0.08, 0.03, 0.06);
  });
});
PR.sign_works = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.8);
  triSign(ctx, 0, 2.15, 0.42, () => {
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-0.02, 0.08, 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 0.05; ctx.strokeStyle = '#111'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-0.04, 0.02); ctx.lineTo(-0.1, -0.12); ctx.lineTo(-0.02, -0.26); ctx.moveTo(-0.1, -0.12); ctx.lineTo(-0.2, -0.26); ctx.moveTo(-0.06, -0.02); ctx.lineTo(0.1, -0.06); ctx.lineTo(0.18, -0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.14, -0.26); ctx.lineTo(0.32, -0.26); ctx.lineTo(0.22, -0.16); ctx.closePath(); ctx.fill();
  });
});
PR.sign_gas = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, 0, 1.75);
  ctx.fillStyle = '#1d4fb8'; rrect(ctx, -0.36, 1.7, 0.72, 0.9, 0.06); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.03; rrect(ctx, -0.32, 1.74, 0.64, 0.82, 0.04); ctx.stroke();
  ctx.fillStyle = '#fff'; rrect(ctx, -0.24, 1.82, 0.48, 0.66, 0.04); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(-0.14, 1.9, 0.18, 0.36); ctx.fillStyle = '#fff'; ctx.fillRect(-0.11, 2.12, 0.12, 0.1);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(0.04, 2.2); ctx.lineTo(0.12, 2.16); ctx.lineTo(0.12, 1.98); ctx.stroke();
});
PR.kmpost = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = lg(ctx, -0.12, 0, 0.12, 0, [[0, '#c8ccd0'], [0.5, '#ffffff'], [1, '#a8aeb4']]); rrect(ctx, -0.12, 0, 0.24, 1.0, 0.04); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(-0.12, 0.72, 0.24, 0.14);
  ctx.fillStyle = '#d02a1a'; ctx.fillRect(-0.12, 0.92, 0.24, 0.05);
  ctx.fillStyle = '#ff9a1a'; ctx.fillRect(-0.05, 0.5, 0.1, 0.14);
});
PR.city_sign = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, -0.95, 1.6, 0.06); post(ctx, 0.95, 1.6, 0.06);
  ctx.fillStyle = '#111'; rrect(ctx, -1.3, 1.45, 2.6, 0.9, 0.06); ctx.fill();
  ctx.fillStyle = '#fbfbf6'; rrect(ctx, -1.24, 1.51, 2.48, 0.78, 0.04); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-1.24, 1.51, 2.48, 0.1);
});
PR.warehouse = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = lg(ctx, 0, 6, 0, 0, [[0, '#9aa4ae'], [1, '#6a747e']]); ctx.fillRect(-5, 0, 10, 5.2);
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 0.05; for (let x = -4.8; x < 5; x += 0.35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 5.2); ctx.stroke(); }
  ctx.fillStyle = '#4a545e'; mpoly(ctx, [[-5.3, 5.2], [5.3, 5.2], [4.6, 6.1], [-4.6, 6.1]]); ctx.fill();
  ctx.fillStyle = '#d8231a'; ctx.fillRect(-2.6, 4.1, 5.2, 0.8);
  mtextUp(ctx, 'СКЛАД № 7', 0, 4.5, 0.55, '#fff', FONT_T);
  ctx.fillStyle = '#3a3f44'; ctx.fillRect(-1.8, 0, 3.6, 3.4);
  for (let y = 0.2; y < 3.4; y += 0.25) { ctx.fillStyle = y % 0.5 < 0.25 ? '#5a6168' : '#4a5158'; ctx.fillRect(-1.75, y, 3.5, 0.2); }
  ctx.fillStyle = '#ffd03a'; for (let i = 0; i < 8; i++) { mpoly(ctx, [[-1.8 + i * 0.45, 3.4], [-1.58 + i * 0.45, 3.4], [-1.8 + i * 0.45 + 0.44, 3.62], [-1.8 + i * 0.45 + 0.22, 3.62]]); ctx.fill(); }
  ctx.fillStyle = '#111'; ctx.fillRect(-1.8, 3.4, 3.6, 0.04); ctx.fillRect(-1.8, 3.62, 3.6, 0.04);
  ctx.fillStyle = 'rgba(140,190,230,.9)'; [-4.2, -3.2, 2.6, 3.6].forEach(x => { ctx.fillRect(x, 2.6, 0.7, 0.9); });
  ctx.fillStyle = '#ffe9a0'; ctx.fillRect(-4.6, 0, 0.9, 1.9); ctx.fillStyle = '#5a6168'; ctx.fillRect(-4.55, 0.05, 0.8, 1.8);
  ctx.fillStyle = '#ffd34a'; circle(ctx, -3.9, 0.95, 0.05); ctx.fill();
});
PR.azs = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  // навес
  [-2.6, 2.6].forEach(x => post(ctx, x, 3.9, 0.12));
  ctx.fillStyle = lg(ctx, 0, 4.6, 0, 3.9, [[0, '#ffffff'], [1, '#c8ccd0']]); ctx.fillRect(-3.4, 3.9, 6.8, 0.7);
  ctx.fillStyle = '#d8231a'; ctx.fillRect(-3.4, 4.0, 6.8, 0.24); ctx.fillStyle = '#ffd03a'; ctx.fillRect(-3.4, 4.24, 6.8, 0.08);
  mtextUp(ctx, 'АЗС «ПОЕХАЛИ»  92 • 95 • ДТ', 0, 4.46, 0.24, '#d8231a', FONT_T);
  ctx.fillStyle = 'rgba(255,255,230,.8)'; for (let x = -3; x < 3.2; x += 1) ctx.fillRect(x, 3.86, 0.5, 0.05);
  // колонки
  [-1.2, 1.2].forEach(x => {
    ctx.fillStyle = '#d8dde2'; rrect(ctx, x - 0.32, 0, 0.64, 1.55, 0.06); ctx.fill();
    ctx.fillStyle = '#d8231a'; ctx.fillRect(x - 0.32, 1.25, 0.64, 0.3);
    ctx.fillStyle = '#111'; ctx.fillRect(x - 0.22, 0.75, 0.44, 0.34);
    ctx.fillStyle = '#7aff6a'; ctx.fillRect(x - 0.18, 0.92, 0.36, 0.1);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(x + 0.32, 1.1); ctx.quadraticCurveTo(x + 0.6, 0.6, x + 0.42, 0.5); ctx.stroke();
  });
  // стела с ценами
  post(ctx, 4.3, 3.0, 0.08);
  ctx.fillStyle = '#1a2a4a'; rrect(ctx, 3.7, 2.4, 1.2, 2.1, 0.06); ctx.fill();
  ctx.fillStyle = '#d8231a'; ctx.fillRect(3.7, 4.0, 1.2, 0.5);
  mtextUp(ctx, 'ЦЕНЫ', 4.3, 4.25, 0.22, '#fff', FONT_T);
  [['92', '₽ 55'], ['95', '₽ 61'], ['ДТ', '₽ 70']].forEach((r, i) => { mtextUp(ctx, r[0], 3.95, 3.7 - i * 0.42, 0.2, '#ffd03a'); mtextUp(ctx, r[1], 4.5, 3.7 - i * 0.42, 0.2, '#ffd03a'); });
});
PR.cafe = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = lg(ctx, 0, 3, 0, 0, [[0, '#d8b888'], [1, '#a88858']]); ctx.fillRect(-3, 0, 6, 2.9);
  ctx.strokeStyle = 'rgba(90,60,20,.3)'; ctx.lineWidth = 0.04; for (let y = 0.25; y < 2.9; y += 0.25) { ctx.beginPath(); ctx.moveTo(-3, y); ctx.lineTo(3, y); ctx.stroke(); }
  ctx.fillStyle = '#7a2a1a'; mpoly(ctx, [[-3.4, 2.9], [3.4, 2.9], [2.6, 3.9], [-2.6, 3.9]]); ctx.fill();
  ctx.fillStyle = '#2a6a2a'; rrect(ctx, -2.4, 3.15, 4.8, 0.62, 0.08); ctx.fill();
  mtextUp(ctx, 'КАФЕ «У ДОРОГИ»', 0, 3.46, 0.36, '#ffe9a0', FONT_T);
  ctx.fillStyle = 'rgba(255,230,160,.9)'; ctx.fillRect(-2.5, 1.0, 1.4, 1.1); ctx.fillRect(1.1, 1.0, 1.4, 1.1);
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 0.06; ctx.strokeRect(-2.5, 1.0, 1.4, 1.1); ctx.strokeRect(1.1, 1.0, 1.4, 1.1);
  ctx.fillStyle = '#d8231a'; for (let i = 0; i < 6; i++) { mpoly(ctx, [[-2.55 + i * 0.25, 2.2], [-2.3 + i * 0.25, 2.2], [-2.42 + i * 0.25, 2.0]]); ctx.fill(); }
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-0.55, 0, 1.1, 2.1);
  ctx.fillStyle = '#ffd34a'; circle(ctx, 0.35, 1.0, 0.05); ctx.fill();
  // табличка
  ctx.fillStyle = '#fff'; ctx.fillRect(1.2, 0.2, 1.2, 0.6);
  mtextUp(ctx, 'ШАШЛЫК', 1.8, 0.62, 0.18, '#d8231a'); mtextUp(ctx, 'ЧАЙ • ДУШ', 1.8, 0.36, 0.15, '#111');
  // мангал с дымом
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-2.8, 0.5, 0.9, 0.3); ctx.fillRect(-2.75, 0, 0.06, 0.5); ctx.fillRect(-1.99, 0, 0.06, 0.5);
  ctx.fillStyle = '#ff7a1a'; ctx.fillRect(-2.75, 0.76, 0.8, 0.06);
});
PR.busstop = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = lg(ctx, 0, 2.6, 0, 0, [[0, '#7aa0c0'], [1, '#4a7090']]);
  mpoly(ctx, [[-1.6, 0], [-1.6, 2.4], [1.6, 2.6], [1.6, 0]]); ctx.fill();
  // мозаика советская
  const cols = ['#e8b030', '#d84a2a', '#2a8ac8', '#f0e0c0', '#3aa060'];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++) { ctx.fillStyle = cols[(i * 3 + j * 7 + (i * j) % 3) % 5]; ctx.globalAlpha = 0.85; ctx.fillRect(-1.5 + i * 0.25, 0.9 + j * 0.22, 0.22, 0.19); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8b030'; circle(ctx, 0, 1.75, 0.35); ctx.fill();
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-1.3, 0.45, 2.6, 0.1); ctx.fillRect(-1.2, 0, 0.08, 0.45); ctx.fillRect(1.12, 0, 0.08, 0.45);
  ctx.fillStyle = '#fff'; rrect(ctx, 0.9, 2.0, 0.5, 0.4, 0.05); ctx.fill();
  mtextUp(ctx, 'А', 1.15, 2.2, 0.3, '#2aa04a', FONT_T);
});
PR.billboard = (ctx, w, h, P, ad) => mframe(ctx, w, h, P, () => {
  post(ctx, -1.6, 2.6, 0.1); post(ctx, 1.6, 2.6, 0.1);
  ctx.fillStyle = '#2a2d31'; ctx.fillRect(-2.35, 2.4, 4.7, 2.4);
  ctx.fillStyle = ad.bg; ctx.fillRect(-2.25, 2.5, 4.5, 2.2);
  ctx.save(); ctx.translate(0, 3.6); ctx.scale(0.01, -0.01);
  if (ad.draw) { ctx.save(); ctx.scale(100, 100); ad.draw(ctx); ctx.restore(); }
  const fit = (s, px, font) => { ctx.font = 'bold ' + px + 'px ' + font; const m = ctx.measureText(s).width; return m > 420 ? Math.floor(px * 420 / m) : px; };
  const p1 = fit(ad.t1, 46, FONT_T), p2 = fit(ad.t2, 30, FONT_N);
  text(ctx, ad.t1, 0, -48, 'bold ' + p1 + 'px ' + FONT_T, ad.c1 || '#fff', 'center', ad.o1 || 'rgba(0,0,0,.4)', 6);
  text(ctx, ad.t2, 0, 14, 'bold ' + p2 + 'px ' + FONT_N, ad.c2 || '#fff');
  if (ad.t3) text(ctx, ad.t3, 0, 62, 'bold 24px ' + FONT_N, ad.c3 || ad.c2 || '#fff');
  ctx.restore();
  ctx.fillStyle = '#5a6066'; ctx.fillRect(-2.35, 2.25, 4.7, 0.12);
  for (let i = -2; i <= 2; i++) { ctx.fillStyle = '#222'; ctx.fillRect(i * 1.0 - 0.05, 4.78, 0.1, 0.2); ctx.fillStyle = '#ffeec0'; ctx.fillRect(i * 1.0 - 0.15, 4.92, 0.3, 0.08); }
});
PR.cone = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = '#222'; ctx.fillRect(-0.24, 0, 0.48, 0.06);
  mpoly(ctx, [[-0.18, 0.06], [-0.04, 0.75], [0.04, 0.75], [0.18, 0.06]]); ctx.fillStyle = lg(ctx, -0.2, 0, 0.2, 0, [[0, '#c84a10'], [0.5, '#ff7a2a'], [1, '#b03a08']]); ctx.fill();
  ctx.fillStyle = '#fff'; mpoly(ctx, [[-0.13, 0.3], [-0.1, 0.42], [0.1, 0.42], [0.13, 0.3]]); ctx.fill();
});
PR.logs = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.0, y = 0.22 + (i === 2 ? 0.34 : 0), ox = i === 2 ? 0 : (i ? 0.2 : -0.2);
    ctx.fillStyle = lg(ctx, 0, y + 0.22, 0, y - 0.22, [[0, '#a8743a'], [1, '#5a3a1a']]); rrect(ctx, -1.1 + ox, y - 0.2, 2.2, 0.4, 0.2); ctx.fill();
    ellipse(ctx, 1.1 + ox, y, 0.12, 0.2); ctx.fillStyle = '#e8c890'; ctx.fill();
    ctx.strokeStyle = '#a8743a'; ctx.lineWidth = 0.015; for (let r = 0.04; r < 0.2; r += 0.05) { ellipse(ctx, 1.1 + ox, y, r * 0.6, r); ctx.stroke(); }
  }
});
PR.rock = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.beginPath(); ctx.moveTo(-0.7, 0); ctx.bezierCurveTo(-0.8, 0.4, -0.4, 0.7, 0, 0.66); ctx.bezierCurveTo(0.5, 0.7, 0.8, 0.3, 0.7, 0); ctx.closePath();
  ctx.fillStyle = rg(ctx, -0.2, 0.5, 0.05, 0.8, [[0, '#b8b4ac'], [1, '#5e5a54']]); ctx.fill();
  ctx.strokeStyle = 'rgba(40,36,30,.5)'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.2, 0.62); ctx.lineTo(-0.05, 0.3); ctx.lineTo(0.2, 0.25); ctx.stroke();
  ctx.fillStyle = '#5a8a3a'; ellipse(ctx, 0.3, 0.55, 0.2, 0.06); ctx.fill();
});
PR.ramp_sign = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  post(ctx, -0.5, 1.0); post(ctx, 0.5, 1.0);
  ctx.fillStyle = '#fff'; ctx.fillRect(-0.8, 0.7, 1.6, 0.4);
  ctx.save(); ctx.beginPath(); ctx.rect(-0.8, 0.7, 1.6, 0.4); ctx.clip();
  ctx.fillStyle = '#d8231a'; for (let i = -6; i < 6; i++) { mpoly(ctx, [[i * 0.3, 0.7], [i * 0.3 + 0.15, 0.7], [i * 0.3 + 0.55, 1.1], [i * 0.3 + 0.4, 1.1]]); ctx.fill(); }
  ctx.restore();
});
PR.barrier = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  // отбойник-ограждение (тайл 4 м)
  for (let x = -1.8; x <= 1.8; x += 1.8) { ctx.fillStyle = '#5a6066'; ctx.fillRect(x - 0.05, 0, 0.1, 0.75); }
  ctx.fillStyle = lg(ctx, 0, 0.78, 0, 0.5, [[0, '#f4f6f8'], [0.5, '#a8b0b8'], [1, '#e0e4e8']]); ctx.fillRect(-2, 0.5, 4, 0.28);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-2, 0.62, 4, 0.03);
});
PR.bridge_rail = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = '#d8dce0'; ctx.fillRect(-2, 0.95, 4, 0.12);
  for (let x = -2; x < 2; x += 0.25) { ctx.fillStyle = '#b8bec4'; ctx.fillRect(x, 0.05, 0.06, 0.95); }
  ctx.fillStyle = '#e4e8ec'; ctx.fillRect(-2, 0, 4, 0.1);
});
PR.bridge_pillar = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  ctx.fillStyle = lg(ctx, -0.6, 0, 0.6, 0, [[0, '#8a9096'], [0.5, '#c8ced4'], [1, '#7a8086']]); ctx.fillRect(-0.5, 0, 1.0, 6);
  ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-0.8, 5.6, 1.6, 0.4);
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 0.03; for (let y = 0.5; y < 5.5; y += 0.6) { ctx.beginPath(); ctx.moveTo(-0.5, y); ctx.lineTo(0.5, y); ctx.stroke(); }
});
PR.tower = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  // столб ЛЭП
  ctx.strokeStyle = '#5a6066'; ctx.lineWidth = 0.08;
  ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-0.2, 9); ctx.lineTo(0.2, 9); ctx.lineTo(1, 0); ctx.stroke();
  for (let y = 0; y < 9; y += 1.2) { const k = 1 - y / 10; ctx.beginPath(); ctx.moveTo(-k, y); ctx.lineTo(k * 0.9, y + 1.2); ctx.moveTo(k, y); ctx.lineTo(-k * 0.9, y + 1.2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-1.6, 8); ctx.lineTo(1.6, 8); ctx.moveTo(-1.2, 6.8); ctx.lineTo(1.2, 6.8); ctx.stroke();
});
PR.grass = (ctx, w, h, P, kind) => {
  // пучки травы/кустики у обочины — 4 варианта в ряд
  const cols = { summer: ['#3a8a2a', '#5ab03a', '#2a6a1a'], autumn: ['#b8862a', '#d8a83a', '#8a5a1a'], dry: ['#b8a860', '#d0c078', '#8a7a40'], snow: ['#e8f0f8', '#ffffff', '#b8c8d8'], ural: ['#6a8a3a', '#8aa84a', '#4a6a2a'] }[kind];
  for (let v = 0; v < 4; v++) {
    const ox = v * w / 4 + w / 8, r = mulberry(v * 13 + kind.length);
    const n = 14 + v * 3;
    if (kind === 'snow') {
      for (let i = 0; i < 4; i++) { ellipse(ctx, ox + (r() - 0.5) * w * 0.18, h - 8 - r() * 10, 12 + r() * 14, 8 + r() * 8); ctx.fillStyle = cols[i % 3]; ctx.fill(); }
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(ox + (r() - 0.5) * 30, h - 10); ctx.lineTo(ox + (r() - 0.5) * 50, h - 30 - r() * 30); ctx.stroke(); }
      continue;
    }
    for (let i = 0; i < n; i++) {
      const bx = ox + (r() - 0.5) * w * 0.2, hh = h * (0.35 + r() * 0.6), lean = (r() - 0.5) * 30;
      ctx.beginPath(); ctx.moveTo(bx - 3, h); ctx.quadraticCurveTo(bx + lean * 0.3, h - hh * 0.6, bx + lean, h - hh); ctx.quadraticCurveTo(bx + lean * 0.3 + 2, h - hh * 0.5, bx + 3, h); ctx.closePath();
      ctx.fillStyle = cols[i % 3]; ctx.fill();
    }
    if (kind === 'summer' && v % 2 === 0) { for (let i = 0; i < 3; i++) { const fx = ox + (r() - 0.5) * 40, fy = h - h * (0.5 + r() * 0.4); ctx.fillStyle = ['#fff', '#ffd23a', '#8ab0ff'][i]; for (let p = 0; p < 5; p++) { circle(ctx, fx + Math.cos(p * 1.256) * 4, fy + Math.sin(p * 1.256) * 4, 3); ctx.fill(); } ctx.fillStyle = '#ffb000'; circle(ctx, fx, fy, 2.5); ctx.fill(); } }
  }
};
const ADS = [
  { name: 'ad_tire', bg: '#1a1a1e', t1: 'ШИНОМОНТАЖ 24/7', t2: 'Колесо спустило? Мы тут, за поворотом', t3: 'Серёгам — скидка 5%', c1: '#ffd03a', c2: '#fff' },
  { name: 'ad_shashlik', bg: '#7a1a10', t1: 'ШАШЛЫК У АШОТА', t2: 'Мясо вчерашнее, зато душевно', t3: '300 м — направо', c1: '#ffe9a0', c2: '#ffd8c0' },
  { name: 'ad_garage', bg: '#e8e4d8', t1: 'ПРОДАМ ГАРАЖ', t2: 'Тел. 8-900-000-00-00, Валера', t3: 'Без машины. С погребом.', c1: '#1a1a1a', c2: '#3a3a3a', o1: 'rgba(255,255,255,.4)' },
  { name: 'ad_luda', bg: '#c83a6a', t1: 'ЛЮДА, ВЕРНИСЬ!', t2: 'Я всё прощу. Твой Толик', t3: '(и холодильник отдам)', c1: '#fff', c2: '#ffe0ec' },
  { name: 'ad_honey', bg: '#f0a020', t1: 'МЁД ОТ ДЕДА', t2: 'Пчёлы злые, мёд добрый', t3: 'Банка — 500 ₽', c1: '#5a2a00', c2: '#5a2a00', o1: 'rgba(255,255,255,.3)' },
  { name: 'ad_gazel', bg: '#1d4fb8', t1: 'РЕМОНТ ГАЗЕЛЕЙ', t2: 'Дорого. Долго. Но поедет.', t3: 'Наверное.', c1: '#fff', c2: '#ffd03a' },
  { name: 'ad_motel', bg: '#2a5a3a', t1: 'МОТЕЛЬ «ТИШИНА»', t2: 'Фуры гудят только до трёх ночи', t3: 'Wi-Fi есть (в сенях)', c1: '#fff', c2: '#e0f0d0' },
  { name: 'ad_coffee', bg: '#3a2418', t1: 'КОФЕ 3 В 1', t2: 'Бодрит лучше, чем яма на трассе', t3: 'Пирожки с капустой', c1: '#ffcf8a', c2: '#fff' }
];
