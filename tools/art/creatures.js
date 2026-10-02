// Персонажи у дороги: корова, гаишник, лось, медведь, собака, бабушка, машина ДПС
'use strict';
const CR = {};
// фабрика: холст в метрах, начало координат — у ног по центру
function mframe(ctx, w, h, P, fn) { ctx.save(); ctx.translate(w / 2, h - 6); ctx.scale(P, -P); fn(); ctx.restore(); }
// хелперы в метрах (ось Y вверх)
function mpoly(ctx, pts) { poly(ctx, pts); }
// текст в метровой системе: рисуем в масштабе 1/100, чтобы браузер не округлял крошечный кегль
function mtextUp(ctx, s, x, y, size, color, font, stroke, lw) {
  ctx.save(); ctx.translate(x, y); ctx.scale(0.01, -0.01);
  ctx.font = 'bold ' + Math.round(size * 100) + 'px ' + (font || FONT_N); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = (lw || 0.05) * 100; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = color; ctx.fillText(s, 0, 0); ctx.restore();
}

CR.cow = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0; // 0 стоит, 1-2 шаги, 3 — оглушена
  const leg = (x, sw) => {
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(x - 0.07 + sw, 0.06, 0.14, 0.62);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 0.08 + sw, 0, 0.16, 0.1);
  };
  const s = f === 1 ? 0.08 : f === 2 ? -0.08 : 0;
  leg(-0.62, -s); leg(0.48, s);
  // хвост
  ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.86, 1.22); ctx.quadraticCurveTo(1.08 + s, 0.9, 0.98 + s, 0.55); ctx.stroke();
  ctx.fillStyle = '#2a1a10'; ellipse(ctx, 0.98 + s, 0.5, 0.06, 0.1); ctx.fill();
  // тело
  ctx.beginPath(); ctx.moveTo(-0.78, 1.25); ctx.bezierCurveTo(-0.8, 1.45, 0.75, 1.45, 0.88, 1.22);
  ctx.bezierCurveTo(0.95, 0.95, 0.85, 0.66, 0.6, 0.62); ctx.lineTo(-0.62, 0.62); ctx.bezierCurveTo(-0.85, 0.66, -0.9, 1.0, -0.78, 1.25); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, 1.4, 0, 0.6, [[0, '#c27a3e'], [1, '#8a4e22']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#f4ede2';
  ellipse(ctx, 0.1, 1.0, 0.32, 0.22, 0.3); ctx.fill(); ellipse(ctx, 0.6, 1.25, 0.2, 0.14); ctx.fill(); ellipse(ctx, -0.45, 0.75, 0.22, 0.12); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5a3216'; ctx.lineWidth = 0.025; ctx.stroke();
  leg(-0.42, s); leg(0.68, -s);
  // вымя
  ctx.fillStyle = '#f2a0a8'; ellipse(ctx, 0.3, 0.6, 0.16, 0.1); ctx.fill();
  ctx.fillRect(0.22, 0.45, 0.04, 0.08); ctx.fillRect(0.34, 0.45, 0.04, 0.08);
  // шея и голова (смотрит влево)
  ctx.fillStyle = '#a8662e'; mpoly(ctx, [[-0.6, 1.25], [-0.95, 1.3], [-1.0, 0.95], [-0.7, 0.85]]); ctx.fill();
  // колокольчик
  ctx.strokeStyle = '#5a3216'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(-0.72, 1.12); ctx.quadraticCurveTo(-0.85, 0.92, -0.98, 1.05); ctx.stroke();
  ctx.fillStyle = lg(ctx, -0.92, 0, -0.78, 0, [[0, '#b8860b'], [0.5, '#ffe070'], [1, '#a07008']]);
  mpoly(ctx, [[-0.9, 0.97], [-0.8, 0.97], [-0.77, 0.82], [-0.93, 0.82]]); ctx.fill();
  // голова
  ctx.beginPath(); ctx.moveTo(-0.92, 1.45); ctx.bezierCurveTo(-0.7, 1.5, -0.72, 1.1, -0.95, 0.98);
  ctx.bezierCurveTo(-1.2, 0.85, -1.38, 0.98, -1.34, 1.15); ctx.bezierCurveTo(-1.3, 1.35, -1.1, 1.45, -0.92, 1.45); ctx.closePath();
  ctx.fillStyle = lg(ctx, -0.9, 1.45, -1.2, 1.0, [[0, '#c27a3e'], [1, '#9a5a28']]); ctx.fill();
  ctx.fillStyle = '#f4ede2'; mpoly(ctx, [[-1.0, 1.44], [-0.94, 1.44], [-1.12, 1.05], [-1.2, 1.1]]); ctx.fill();
  // морда
  ellipse(ctx, -1.25, 1.02, 0.17, 0.13, 0.3); ctx.fillStyle = '#f2b0a8'; ctx.fill();
  ctx.fillStyle = '#7a3a3a'; circle(ctx, -1.33, 1.04, 0.025); ctx.fill(); circle(ctx, -1.22, 0.98, 0.025); ctx.fill();
  // травинка во рту
  ctx.strokeStyle = '#5a9a2a'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.moveTo(-1.18, 0.92); ctx.lineTo(-1.4, 0.82); ctx.moveTo(-1.25, 0.9); ctx.lineTo(-1.36, 0.74); ctx.stroke();
  // рога и уши
  ctx.fillStyle = '#efe6cc'; mpoly(ctx, [[-0.98, 1.44], [-1.0, 1.62], [-0.92, 1.46]]); ctx.fill(); mpoly(ctx, [[-0.86, 1.44], [-0.8, 1.6], [-0.8, 1.42]]); ctx.fill();
  ctx.fillStyle = '#9a5a28'; ellipse(ctx, -0.74, 1.36, 0.14, 0.06, -0.4); ctx.fill();
  ctx.fillStyle = '#f2a0a8'; ellipse(ctx, -0.74, 1.36, 0.09, 0.03, -0.4); ctx.fill();
  // глаз
  if (f === 3) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(-1.08, 1.32); ctx.lineTo(-0.98, 1.22); ctx.moveTo(-0.98, 1.32); ctx.lineTo(-1.08, 1.22); ctx.stroke();
  } else {
    ellipse(ctx, -1.03, 1.26, 0.07, 0.08); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 0.015; ctx.stroke();
    circle(ctx, -1.06, 1.25, 0.035); ctx.fillStyle = '#111'; ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 0.015; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-1.08 + i * 0.04, 1.33); ctx.lineTo(-1.1 + i * 0.05, 1.38); ctx.stroke(); }
  }
});

CR.gai = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0; // 0 стоит с радаром, 1 машет жезлом
  // ноги
  ctx.fillStyle = '#20283a'; ctx.fillRect(-0.16, 0.06, 0.13, 0.8); ctx.fillRect(0.03, 0.06, 0.13, 0.8);
  ctx.fillStyle = '#0d0d0f'; rrect(ctx, -0.22, 0, 0.2, 0.09, 0.03); ctx.fill(); rrect(ctx, 0.0, 0, 0.2, 0.09, 0.03); ctx.fill();
  // туловище — светоотражающий жилет
  ctx.fillStyle = '#2a3550'; rrect(ctx, -0.24, 0.8, 0.48, 0.66, 0.1); ctx.fill();
  ctx.fillStyle = lg(ctx, -0.24, 0, 0.24, 0, [[0, '#a8d81a'], [0.5, '#d8ff3a'], [1, '#98c810']]);
  rrect(ctx, -0.22, 0.86, 0.44, 0.52, 0.08); ctx.fill();
  ctx.fillStyle = '#e8eef2'; ctx.fillRect(-0.22, 1.0, 0.44, 0.05); ctx.fillRect(-0.22, 1.16, 0.44, 0.05);
  mtextUp(ctx, 'ДПС', 0, 1.3, 0.1, '#1a2a6a', FONT_T);
  // живот :)
  ctx.fillStyle = 'rgba(0,0,0,.1)'; ellipse(ctx, -0.02, 1.0, 0.2, 0.14); ctx.fill();
  // руки
  ctx.strokeStyle = '#2a3550'; ctx.lineWidth = 0.11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.2, 1.36); ctx.lineTo(0.32, 1.06); ctx.stroke();
  if (f) { ctx.beginPath(); ctx.moveTo(-0.2, 1.36); ctx.lineTo(-0.42, 1.62); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-0.2, 1.36); ctx.lineTo(-0.38, 1.2); ctx.lineTo(-0.5, 1.32); ctx.stroke(); }
  // жезл
  ctx.save();
  if (f) { ctx.translate(-0.44, 1.64); ctx.rotate(0.5); } else { ctx.translate(0.32, 1.04); ctx.rotate(-0.25); }
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(-0.02, -0.02 + i * 0.07, 0.045, 0.07); }
  ctx.restore();
  // радар-«фен»
  if (!f) {
    ctx.fillStyle = '#1a1c20'; rrect(ctx, -0.66, 1.26, 0.22, 0.12, 0.03); ctx.fill(); ctx.fillRect(-0.53, 1.12, 0.05, 0.16);
    ctx.fillStyle = '#ff3a2a'; circle(ctx, -0.64, 1.32, 0.025); ctx.fill();
    ctx.fillStyle = '#8be04a'; ctx.fillRect(-0.58, 1.3, 0.1, 0.04);
  }
  // голова
  ctx.fillStyle = '#e8b48a'; rrect(ctx, -0.05, 1.42, 0.1, 0.08, 0.02); ctx.fill();
  ellipse(ctx, 0, 1.6, 0.16, 0.17); ctx.fillStyle = rg(ctx, -0.04, 1.64, 0.02, 0.2, [[0, '#ffd6b4'], [1, '#d99a70']]); ctx.fill();
  ctx.fillStyle = '#111'; circle(ctx, -0.07, 1.62, 0.02); ctx.fill(); circle(ctx, 0.05, 1.62, 0.02); ctx.fill();
  ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(-0.11, 1.68); ctx.lineTo(-0.03, 1.66); ctx.moveTo(0.02, 1.66); ctx.lineTo(0.1, 1.68); ctx.stroke();
  ctx.fillStyle = '#d97a62'; ellipse(ctx, -0.01, 1.57, 0.035, 0.03); ctx.fill();
  ctx.strokeStyle = '#4a2416'; ctx.lineWidth = 0.02; ctx.beginPath(); if (f) ctx.arc(-0.01, 1.53, 0.05, Math.PI * 1.15, Math.PI * 1.85); else { ctx.moveTo(-0.06, 1.5); ctx.lineTo(0.04, 1.5); } ctx.stroke();
  ctx.fillStyle = '#3a2416'; ellipse(ctx, -0.01, 1.535, 0.08, 0.02); ctx.fill();
  // фуражка
  ctx.fillStyle = '#1e2a4a'; ellipse(ctx, 0, 1.78, 0.2, 0.07); ctx.fill();
  ctx.fillStyle = '#2a3a62'; rrect(ctx, -0.15, 1.72, 0.3, 0.07, 0.02); ctx.fill();
  ctx.fillStyle = '#c8202a'; ctx.fillRect(-0.15, 1.72, 0.3, 0.025);
  ctx.fillStyle = '#0d0f14'; ellipse(ctx, -0.06, 1.71, 0.16, 0.025); ctx.fill();
  ctx.fillStyle = '#ffd24a'; circle(ctx, 0, 1.76, 0.03); ctx.fill();
});

CR.dpscar = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  // ВАЗ-«семёрка» ДПС, смотрит влево
  const body = [[-2.0, 0.35], [-2.02, 0.75], [-1.2, 0.86], [-0.8, 1.34], [0.75, 1.34], [1.2, 0.86], [2.0, 0.82], [2.02, 0.35]];
  ctx.fillStyle = '#1a1a1c'; circle(ctx, -1.25, 0.3, 0.3); ctx.fill(); circle(ctx, 1.3, 0.3, 0.3); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; circle(ctx, -1.25, 0.3, 0.14); ctx.fill(); circle(ctx, 1.3, 0.3, 0.14); ctx.fill();
  poly(ctx, body); ctx.fillStyle = lg(ctx, 0, 1.34, 0, 0.35, [[0, '#ffffff'], [0.6, '#e8ecef'], [1, '#aab2b8']]); ctx.fill();
  ctx.strokeStyle = '#5a6268'; ctx.lineWidth = 0.025; ctx.stroke();
  ctx.fillStyle = '#1d4fb8'; ctx.fillRect(-2.02, 0.5, 4.04, 0.14);
  mtextUp(ctx, 'ДПС', 0.1, 0.78, 0.22, '#1d4fb8', FONT_T);
  ctx.fillStyle = 'rgba(80,130,180,.75)'; poly(ctx, [[-1.05, 0.9], [-0.72, 1.28], [-0.05, 1.28], [-0.05, 0.9]]); ctx.fill(); poly(ctx, [[0.05, 0.9], [0.05, 1.28], [0.7, 1.28], [1.0, 0.9]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; poly(ctx, [[-0.8, 0.95], [-0.6, 1.22], [-0.5, 1.22], [-0.7, 0.95]]); ctx.fill();
  // мигалка
  ctx.fillStyle = '#222'; ctx.fillRect(-0.4, 1.34, 0.8, 0.06);
  ctx.fillStyle = '#2a5aff'; rrect(ctx, -0.38, 1.4, 0.36, 0.12, 0.04); ctx.fill();
  ctx.fillStyle = '#ff2a2a'; rrect(ctx, 0.02, 1.4, 0.36, 0.12, 0.04); ctx.fill();
  ctx.fillStyle = '#fff8c0'; ctx.fillRect(-2.04, 0.68, 0.08, 0.1);
  ctx.fillStyle = '#c03020'; ctx.fillRect(1.96, 0.66, 0.07, 0.1);
});

CR.booth = (ctx, w, h, P) => mframe(ctx, w, h, P, () => {
  // будка поста ДПС
  ctx.fillStyle = lg(ctx, -1.1, 0, 1.1, 0, [[0, '#c8ccd0'], [0.5, '#f4f6f8'], [1, '#b0b6bc']]); ctx.fillRect(-1.1, 0, 2.2, 2.2);
  ctx.fillStyle = '#2a5ab8'; ctx.fillRect(-1.1, 1.62, 2.2, 0.22);
  mtextUp(ctx, 'ДПС', 0, 1.73, 0.18, '#fff', FONT_T);
  ctx.fillStyle = '#3a4a5a'; ctx.fillRect(-1.25, 2.2, 2.5, 0.12);
  ctx.fillStyle = 'rgba(120,170,210,.85)'; ctx.fillRect(-0.9, 0.8, 0.8, 0.7); ctx.fillRect(0.15, 0.8, 0.75, 0.7);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; mpoly(ctx, [[-0.8, 0.85], [-0.6, 0.85], [-0.4, 1.45], [-0.6, 1.45]]); ctx.fill();
  ctx.strokeStyle = '#5a6a7a'; ctx.lineWidth = 0.04; ctx.strokeRect(-0.9, 0.8, 0.8, 0.7); ctx.strokeRect(0.15, 0.8, 0.75, 0.7);
  ctx.fillStyle = '#8a9298'; ctx.fillRect(-1.1, 0, 2.2, 0.12);
});

CR.moose = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0, s = f === 1 ? 0.12 : f === 2 ? -0.12 : 0;
  const leg = (x, sw, c) => { ctx.strokeStyle = c; ctx.lineWidth = 0.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 1.1); ctx.lineTo(x + sw * 0.5, 0.55); ctx.lineTo(x + sw, 0.06); ctx.stroke(); };
  leg(-0.6, -s, '#3a2412'); leg(0.55, s, '#3a2412');
  ctx.beginPath(); ctx.moveTo(-0.8, 1.6); ctx.bezierCurveTo(-0.6, 1.95, 0.6, 1.8, 0.85, 1.55); ctx.bezierCurveTo(0.95, 1.3, 0.8, 1.05, 0.55, 1.02); ctx.lineTo(-0.6, 1.02); ctx.bezierCurveTo(-0.85, 1.1, -0.9, 1.4, -0.8, 1.6); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, 1.9, 0, 1.0, [[0, '#7a5232'], [1, '#4a2e18']]); ctx.fill();
  leg(-0.4, s, '#5a3a1e'); leg(0.7, -s, '#5a3a1e');
  // шея и голова
  ctx.fillStyle = '#5a3a1e'; mpoly(ctx, [[-0.65, 1.75], [-1.0, 1.95], [-1.15, 1.7], [-0.75, 1.4]]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.0, 2.0); ctx.bezierCurveTo(-1.2, 2.05, -1.55, 1.75, -1.5, 1.55); ctx.bezierCurveTo(-1.45, 1.45, -1.3, 1.5, -1.05, 1.65); ctx.closePath();
  ctx.fillStyle = '#6a4426'; ctx.fill();
  ctx.fillStyle = '#3a2412'; ellipse(ctx, -1.45, 1.55, 0.12, 0.1); ctx.fill();
  ctx.fillStyle = '#111'; circle(ctx, -1.12, 1.86, 0.03); ctx.fill();
  ctx.fillStyle = '#4a2e18'; mpoly(ctx, [[-1.0, 1.55], [-0.95, 1.3], [-1.1, 1.5]]); ctx.fill();
  // рога-лопаты
  ctx.fillStyle = lg(ctx, 0, 2.5, 0, 1.95, [[0, '#f0e2c0'], [1, '#bfa47a']]);
  ctx.beginPath(); ctx.moveTo(-0.95, 2.0); ctx.bezierCurveTo(-0.7, 2.1, -0.4, 2.2, -0.3, 2.5); ctx.lineTo(-0.4, 2.42); ctx.lineTo(-0.45, 2.55); ctx.lineTo(-0.55, 2.4); ctx.lineTo(-0.62, 2.52); ctx.lineTo(-0.7, 2.36); ctx.lineTo(-0.8, 2.45); ctx.bezierCurveTo(-0.85, 2.25, -0.95, 2.15, -1.0, 2.05); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.05, 2.02); ctx.bezierCurveTo(-1.2, 2.15, -1.3, 2.3, -1.25, 2.5); ctx.lineTo(-1.2, 2.38); ctx.lineTo(-1.12, 2.48); ctx.lineTo(-1.08, 2.3); ctx.lineTo(-0.98, 2.38); ctx.bezierCurveTo(-1.0, 2.2, -1.0, 2.1, -1.0, 2.04); ctx.closePath(); ctx.fill();
});

CR.bear = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0; // 0 стоит, 1 машет лапой / хватает
  ctx.fillStyle = '#4a2e1a';
  ellipse(ctx, -0.18, 0.12, 0.16, 0.12); ctx.fill(); ellipse(ctx, 0.2, 0.12, 0.16, 0.12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.38, 0.2); ctx.bezierCurveTo(-0.55, 0.9, -0.45, 1.5, 0, 1.55); ctx.bezierCurveTo(0.45, 1.5, 0.55, 0.9, 0.38, 0.2); ctx.closePath();
  ctx.fillStyle = rg(ctx, -0.1, 1.0, 0.05, 0.8, [[0, '#8a5a32'], [1, '#4a2e1a']]); ctx.fill();
  ctx.fillStyle = '#c8a070'; ellipse(ctx, 0, 0.75, 0.22, 0.35); ctx.fill();
  // лапы
  ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 0.16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.3, 1.25); ctx.lineTo(0.5, 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.3, 1.25); if (f) ctx.lineTo(-0.62, 1.7); else ctx.lineTo(-0.55, 0.95); ctx.stroke();
  // бочонок мёда, если схватил
  if (f) { ctx.fillStyle = '#f0a020'; rrect(ctx, -0.8, 1.68, 0.3, 0.3, 0.06); ctx.fill(); ctx.fillStyle = '#d42a20'; ctx.fillRect(-0.82, 1.92, 0.34, 0.08); }
  // голова
  circle(ctx, 0, 1.7, 0.3); ctx.fillStyle = rg(ctx, -0.08, 1.78, 0.05, 0.32, [[0, '#9a6a3a'], [1, '#5a3820']]); ctx.fill();
  circle(ctx, -0.24, 1.95, 0.1); ctx.fill(); circle(ctx, 0.24, 1.95, 0.1); ctx.fill();
  ctx.fillStyle = '#c8a070'; ellipse(ctx, -0.04, 1.6, 0.14, 0.11); ctx.fill();
  ctx.fillStyle = '#1a1010'; ellipse(ctx, -0.05, 1.65, 0.06, 0.04); ctx.fill();
  circle(ctx, -0.12, 1.78, 0.03); ctx.fill(); circle(ctx, 0.08, 1.78, 0.03); ctx.fill();
  ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.arc(-0.05, 1.58, 0.06, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  // ушанка!
  ctx.fillStyle = '#3a3a3e'; ellipse(ctx, 0, 1.94, 0.3, 0.12); ctx.fill(); rrect(ctx, -0.26, 1.92, 0.52, 0.2, 0.08); ctx.fill();
  ctx.fillStyle = '#5a5a60'; rrect(ctx, -0.28, 1.88, 0.56, 0.08, 0.03); ctx.fill();
  ctx.fillStyle = '#d42a20'; circle(ctx, 0, 2.04, 0.04); ctx.fill();
});

CR.dog = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0;
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.07; ctx.lineCap = 'round';
  const a = f ? 0.18 : -0.12;
  ctx.beginPath(); ctx.moveTo(-0.25, 0.32); ctx.lineTo(-0.25 - a, 0.04); ctx.moveTo(-0.15, 0.32); ctx.lineTo(-0.15 + a, 0.04); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.2, 0.32); ctx.lineTo(0.2 + a, 0.04); ctx.moveTo(0.28, 0.32); ctx.lineTo(0.28 - a, 0.04); ctx.stroke();
  ellipse(ctx, 0, 0.38, 0.34, 0.13); ctx.fillStyle = lg(ctx, 0, 0.5, 0, 0.25, [[0, '#c8a070'], [1, '#8a6a42']]); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; ellipse(ctx, -0.05, 0.45, 0.12, 0.06); ctx.fill();
  ctx.strokeStyle = '#8a6a42'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(-0.32, 0.42); ctx.quadraticCurveTo(-0.45, 0.6 + (f ? 0.08 : 0), -0.4, 0.68); ctx.stroke();
  circle(ctx, 0.36, 0.55, 0.13); ctx.fillStyle = '#c8a070'; ctx.fill();
  ellipse(ctx, 0.48, 0.52, 0.09, 0.06); ctx.fill();
  ctx.fillStyle = '#111'; circle(ctx, 0.56, 0.54, 0.025); ctx.fill(); circle(ctx, 0.4, 0.6, 0.02); ctx.fill();
  ctx.fillStyle = '#5a3a1a'; mpoly(ctx, [[0.28, 0.64], [0.22, 0.48], [0.33, 0.6]]); ctx.fill();
  if (f) { ctx.fillStyle = '#e4606a'; ellipse(ctx, 0.5, 0.44, 0.04, 0.03); ctx.fill(); }
});

CR.babushka = (ctx, w, h, P, frame) => mframe(ctx, w, h, P, () => {
  const f = frame || 0;
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-0.14, 0, 0.1, 0.25); ctx.fillRect(0.04, 0, 0.1, 0.25);
  // пальто
  ctx.beginPath(); ctx.moveTo(-0.26, 0.2); ctx.lineTo(-0.2, 1.1); ctx.quadraticCurveTo(0, 1.2, 0.2, 1.1); ctx.lineTo(0.28, 0.2); ctx.closePath();
  ctx.fillStyle = lg(ctx, -0.3, 0, 0.3, 0, [[0, '#4a3a6a'], [0.5, '#6a5a8a'], [1, '#3a2a5a']]); ctx.fill();
  ctx.fillStyle = '#c8b090'; for (let i = 0; i < 3; i++) { circle(ctx, 0.02, 0.4 + i * 0.22, 0.025); ctx.fill(); }
  // сумки-тележка
  ctx.fillStyle = '#7a2a1a'; rrect(ctx, 0.32, 0.12, 0.26, 0.42, 0.05); ctx.fill();
  ctx.fillStyle = '#e8c070'; for (let i = 0; i < 3; i++) ctx.fillRect(0.32, 0.2 + i * 0.12, 0.26, 0.03);
  ctx.fillStyle = '#111'; circle(ctx, 0.4, 0.08, 0.06); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(0.55, 0.5); ctx.lineTo(0.5, 0.8); ctx.stroke();
  // рука машет
  ctx.strokeStyle = '#4a3a6a'; ctx.lineWidth = 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-0.15, 1.0); ctx.lineTo(f ? -0.42 : -0.38, f ? 1.4 : 1.32); ctx.stroke();
  ctx.fillStyle = '#f0c8a0'; circle(ctx, f ? -0.44 : -0.4, f ? 1.44 : 1.36, 0.05); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.15, 1.0); ctx.lineTo(0.45, 0.78); ctx.stroke();
  // голова в платке
  circle(ctx, 0, 1.28, 0.15); ctx.fillStyle = '#f0c8a0'; ctx.fill();
  ctx.fillStyle = '#111'; circle(ctx, -0.05, 1.3, 0.017); ctx.fill(); circle(ctx, 0.05, 1.3, 0.017); ctx.fill();
  ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 0.015; ctx.beginPath(); ctx.arc(0, 1.24, 0.04, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.19, 1.24); ctx.quadraticCurveTo(-0.2, 1.5, 0, 1.48); ctx.quadraticCurveTo(0.2, 1.5, 0.19, 1.24); ctx.quadraticCurveTo(0.15, 1.36, 0, 1.4); ctx.quadraticCurveTo(-0.15, 1.36, -0.19, 1.24); ctx.closePath();
  ctx.fillStyle = '#d83a2a'; ctx.fill();
  ctx.fillStyle = '#fff'; [[-0.1, 1.42], [0.06, 1.45], [0.13, 1.36], [-0.15, 1.33]].forEach(p => { circle(ctx, p[0], p[1], 0.015); ctx.fill(); });
  mpoly(ctx, [[0.12, 1.2], [0.2, 1.08], [0.06, 1.15]]); ctx.fillStyle = '#d83a2a'; ctx.fill();
});
