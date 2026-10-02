// Красная Газель с красной будкой: кузов, салон, колёса, двери, Серёга
'use strict';
const TK = { P: 160, M: 24, X0: -3.12, X1: 2.95, Y1: 2.80 };
TK.W = Math.round((TK.X1 - TK.X0) * TK.P + TK.M * 2);
TK.H = Math.round(TK.Y1 * TK.P + TK.M * 2);
TK.ax = TK.M - TK.X0 * TK.P; TK.ay = TK.M + TK.Y1 * TK.P;   // пиксель точки (0,0) — земля под началом координат
const tx = x => TK.ax + x * TK.P, ty = y => TK.ay - y * TK.P, tp = (x, y) => [tx(x), ty(y)];
const GEO = {
  wheelR: 0.37, rearX: -1.25, frontX: 1.65, wheelY: 0.37,
  boxX0: -3.05, boxX1: 0.40, boxY0: 0.98, boxY1: 2.70,
  head: [1.18, 1.80], exhaust: [-0.48, 0.46], hingeX: -3.05
};
const RED = '#d8231a', RED_L = '#ff5a44', RED_D = '#8a120c';

function cabPath(ctx) {
  const A = GEO.frontX, ar = 0.56;
  const dx = Math.sqrt(ar * ar - (0.80 - GEO.wheelY) ** 2);
  ctx.beginPath();
  ctx.moveTo(tx(0.50), ty(0.80));
  ctx.lineTo(tx(0.50), ty(2.06));
  ctx.quadraticCurveTo(tx(0.50), ty(2.24), tx(0.68), ty(2.24));
  ctx.lineTo(tx(1.50), ty(2.26));
  ctx.quadraticCurveTo(tx(1.66), ty(2.26), tx(1.72), ty(2.16));
  ctx.lineTo(tx(2.12), ty(1.56));
  ctx.quadraticCurveTo(tx(2.18), ty(1.50), tx(2.30), ty(1.48));
  ctx.lineTo(tx(2.62), ty(1.40));
  ctx.quadraticCurveTo(tx(2.84), ty(1.34), tx(2.86), ty(1.16));
  ctx.lineTo(tx(2.88), ty(0.90));
  ctx.quadraticCurveTo(tx(2.88), ty(0.80), tx(2.78), ty(0.80));
  ctx.lineTo(tx(A + dx), ty(0.80));
  const a0 = Math.atan2(0.80 - GEO.wheelY, dx), a1 = Math.PI - a0;
  ctx.arc(tx(A), ty(GEO.wheelY), ar * TK.P, -a0, -a1, true);
  ctx.lineTo(tx(0.50), ty(0.80));
  ctx.closePath();
}
function windowPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(tx(0.74), ty(1.50));
  ctx.lineTo(tx(0.74), ty(1.98));
  ctx.quadraticCurveTo(tx(0.74), ty(2.10), tx(0.88), ty(2.11));
  ctx.lineTo(tx(1.48), ty(2.13));
  ctx.lineTo(tx(1.98), ty(1.50));
  ctx.closePath();
}
function windshieldPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(tx(1.58), ty(2.20)); ctx.lineTo(tx(1.70), ty(2.17));
  ctx.lineTo(tx(2.11), ty(1.56)); ctx.lineTo(tx(2.03), ty(1.53)); ctx.closePath();
}

function drawTruckBody(ctx, opt) {
  opt = opt || {};
  const P = TK.P;
  // ---------- рама ----------
  ctx.fillStyle = lg(ctx, 0, ty(0.95), 0, ty(0.70), [[0, '#3a3d42'], [0.5, '#22252a'], [1, '#121418']]);
  rrect(ctx, tx(-2.95), ty(0.95), (2.45 + 2.95) * P, 0.25 * P, 6); ctx.fill();
  for (let x = -2.8; x < 0.3; x += 0.62) { ctx.fillStyle = '#16181c'; ctx.fillRect(tx(x), ty(1.0), 0.14 * P, 0.08 * P); }
  // заднее противоподкатное — полосатое
  ctx.fillStyle = '#2a2d31'; ctx.fillRect(tx(-2.92), ty(0.92), 0.06 * P, 0.42 * P); ctx.fillRect(tx(-2.62), ty(0.92), 0.06 * P, 0.42 * P);
  ctx.save(); rrect(ctx, tx(-3.14), ty(0.58), 0.62 * P, 0.16 * P, 5); ctx.clip();
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#f4f4f0' : '#e0261b'; poly(ctx, [[tx(-3.2 + i * 0.12), ty(0.42)], [tx(-3.2 + i * 0.12 + 0.12), ty(0.42)], [tx(-3.2 + i * 0.12 + 0.24), ty(0.6)], [tx(-3.2 + i * 0.12 + 0.12), ty(0.6)]]); ctx.fill(); }
  ctx.fillStyle = lg(ctx, 0, ty(0.58), 0, ty(0.42), [[0, 'rgba(255,255,255,.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.35)']]);
  ctx.fillRect(tx(-3.2), ty(0.6), P, 0.2 * P); ctx.restore();
  // бензобак
  ctx.fillStyle = lg(ctx, 0, ty(0.86), 0, ty(0.48), [[0, '#4a4e55'], [0.35, '#2b2e33'], [1, '#101215']]);
  rrect(ctx, tx(-0.62), ty(0.86), 0.98 * P, 0.38 * P, 14); ctx.fill();
  ctx.strokeStyle = '#0a0b0d'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#6a6e75'; [-0.45, 0.15].forEach(x => ctx.fillRect(tx(x), ty(0.87), 0.06 * P, 0.40 * P));
  ctx.fillStyle = '#8b9097'; circle(ctx, tx(0.24), ty(0.80), 0.05 * P); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(ctx, tx(-0.58), ty(0.84), 0.9 * P, 0.06 * P, 6); ctx.fill();
  // выхлопная труба
  ctx.strokeStyle = '#2e2f31'; ctx.lineWidth = 0.07 * P; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(tx(0.42), ty(0.62)); ctx.quadraticCurveTo(tx(0.1), ty(0.46), tx(-0.40), ty(0.46)); ctx.stroke();
  ctx.strokeStyle = '#6b6153'; ctx.lineWidth = 0.035 * P; ctx.stroke();
  ctx.fillStyle = '#111'; ellipse(ctx, tx(-0.42), ty(0.46), 0.02 * P, 0.04 * P); ctx.fill();
  // ящик ЗИП
  ctx.fillStyle = lg(ctx, 0, ty(0.9), 0, ty(0.6), [[0, '#3d4148'], [1, '#1b1d21']]);
  rrect(ctx, tx(-2.45), ty(0.90), 0.55 * P, 0.30 * P, 4); ctx.fill();
  ctx.fillStyle = '#8a8f96'; ctx.fillRect(tx(-2.22), ty(0.80), 0.1 * P, 0.03 * P);

  // ---------- задний подкрылок + брызговик ----------
  const R = GEO.rearX;
  ctx.fillStyle = '#16171a';
  ctx.beginPath(); ctx.arc(tx(R), ty(GEO.wheelY), 0.53 * P, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(tx(R + 0.53), ty(0.98)); ctx.lineTo(tx(R - 0.53), ty(0.98)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#26282c'; ctx.beginPath(); ctx.arc(tx(R), ty(GEO.wheelY), 0.53 * P, Math.PI * 1.02, Math.PI * 1.98); ctx.arc(tx(R), ty(GEO.wheelY), 0.47 * P, Math.PI * 1.98, Math.PI * 1.02, true); ctx.closePath(); ctx.fill();
  // брызговик с надписью
  ctx.fillStyle = lg(ctx, tx(R - 0.72), 0, tx(R - 0.56), 0, [[0, '#0d0e10'], [1, '#2a2c30']]);
  rrect(ctx, tx(R - 0.74), ty(0.86), 0.17 * P, 0.66 * P, 3); ctx.fill();
  ctx.save(); ctx.translate(tx(R - 0.655), ty(0.53)); ctx.rotate(-Math.PI / 2);
  text(ctx, 'ГАЗ', 0, 0, 'bold ' + (0.09 * P) + 'px ' + FONT_T, '#c9ccd1'); ctx.restore();

  // ---------- будка ----------
  const bx0 = tx(GEO.boxX0), bx1 = tx(GEO.boxX1), by0 = ty(GEO.boxY1), by1 = ty(GEO.boxY0);
  // подрамник
  ctx.fillStyle = '#1b1c20'; ctx.fillRect(bx0 + 10, by1 - 4, bx1 - bx0 - 20, 0.06 * P);
  // тень/контур
  withShadow(ctx, 'rgba(0,0,0,.35)', 10, 0, 4, () => { ctx.fillStyle = RED_D; rrect(ctx, bx0, by0, bx1 - bx0, by1 - by0, 8); ctx.fill(); });
  // основной цвет с градиентом
  ctx.fillStyle = lg(ctx, 0, by0, 0, by1, [[0, '#ff6a52'], [0.08, '#f2392a'], [0.45, RED], [0.85, '#b5170f'], [1, '#7d0f09']]);
  rrect(ctx, bx0 + 4, by0 + 4, bx1 - bx0 - 8, by1 - by0 - 8, 6); ctx.fill();
  // сэндвич-панели: вертикальные швы с заклёпками
  const seams = [-2.18, -1.30, -0.42];
  seams.forEach(x => {
    ctx.fillStyle = 'rgba(80,6,3,.55)'; ctx.fillRect(tx(x) - 2, by0 + 8, 4, by1 - by0 - 16);
    ctx.fillStyle = 'rgba(255,140,120,.35)'; ctx.fillRect(tx(x) + 2, by0 + 8, 2, by1 - by0 - 16);
    for (let y = GEO.boxY0 + 0.12; y < GEO.boxY1 - 0.06; y += 0.16) {
      ctx.fillStyle = '#6e0c07'; circle(ctx, tx(x) - 7, ty(y), 2.6); ctx.fill(); circle(ctx, tx(x) + 9, ty(y), 2.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,190,.6)'; circle(ctx, tx(x) - 7.6, ty(y) - 0.8, 1.1); ctx.fill(); circle(ctx, tx(x) + 8.4, ty(y) - 0.8, 1.1); ctx.fill();
    }
  });
  // отражение неба по верху и блик
  ctx.save(); rrect(ctx, bx0 + 4, by0 + 4, bx1 - bx0 - 8, by1 - by0 - 8, 6); ctx.clip();
  ctx.fillStyle = lg(ctx, 0, by0, 0, by0 + 0.5 * P, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(bx0, by0, bx1 - bx0, 0.5 * P);
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
  poly(ctx, [[tx(-2.6), by0], [tx(-2.1), by0], [tx(-2.9), by1], [tx(-3.4), by1]]); ctx.fill();
  poly(ctx, [[tx(-1.75), by0], [tx(-1.62), by0], [tx(-2.42), by1], [tx(-2.55), by1]]); ctx.fill();
  ctx.globalAlpha = 1;
  // белая полоса + тёмная полоса снизу
  ctx.fillStyle = '#fbf6ec'; ctx.fillRect(bx0, ty(1.30), bx1 - bx0, 0.10 * P);
  ctx.fillStyle = '#2b1714'; ctx.fillRect(bx0, ty(1.17), bx1 - bx0, 0.05 * P);
  ctx.fillStyle = '#ffcf3f'; ctx.fillRect(bx0, ty(1.11), bx1 - bx0, 0.025 * P);
  ctx.restore();
  // алюминиевые профили по краям
  const alu = (x, y, w, h, vert) => {
    ctx.fillStyle = vert ? lg(ctx, x, 0, x + w, 0, [[0, '#7c828a'], [0.35, '#eef1f4'], [0.6, '#b9bec4'], [1, '#5c6168']])
      : lg(ctx, 0, y, 0, y + h, [[0, '#eef1f4'], [0.5, '#a7adb4'], [1, '#5c6168']]);
    rrect(ctx, x, y, w, h, 3); ctx.fill();
  };
  alu(bx0, by0, bx1 - bx0, 0.07 * P, false);
  alu(bx0, by1 - 0.07 * P, bx1 - bx0, 0.07 * P, false);
  alu(bx0, by0, 0.07 * P, by1 - by0, true);
  alu(bx1 - 0.07 * P, by0, 0.07 * P, by1 - by0, true);
  // петли задних дверей
  [1.25, 1.95, 2.48].forEach(y => { ctx.fillStyle = '#3d4045'; rrect(ctx, bx0 - 6, ty(y) - 9, 20, 18, 4); ctx.fill(); ctx.fillStyle = '#9aa0a7'; circle(ctx, bx0 + 3, ty(y), 3); ctx.fill(); });
  // габаритные огни на крыше будки
  const lamp = (x, y, col, glow) => {
    withShadow(ctx, glow, 12, 0, 0, () => { ctx.fillStyle = lg(ctx, 0, y - 9, 0, y + 9, [[0, '#fff'], [0.3, col], [1, shade(col, -0.4)]]); rrect(ctx, x - 12, y - 8, 24, 14, 4); ctx.fill(); });
    ctx.fillStyle = '#222'; ctx.fillRect(x - 3, y + 6, 6, 6);
  };
  lamp(tx(0.25), by0 - 6, '#ffb000', 'rgba(255,170,0,.8)');
  lamp(tx(-2.92), by0 - 6, '#ff2a1a', 'rgba(255,30,10,.8)');
  // боковые катафоты
  for (let x = -2.7; x < 0.3; x += 0.9) { ctx.fillStyle = lg(ctx, 0, ty(1.06), 0, ty(0.99), [[0, '#ffd27a'], [1, '#e08a00']]); rrect(ctx, tx(x), ty(1.065), 18, 9, 3); ctx.fill(); }
  // задний фонарь
  ctx.fillStyle = '#26272b'; rrect(ctx, tx(-3.14), ty(0.98), 0.24 * P, 0.15 * P, 4); ctx.fill();
  withShadow(ctx, 'rgba(255,30,0,.9)', 10, 0, 0, () => { ctx.fillStyle = lg(ctx, 0, ty(0.96), 0, ty(0.86), [[0, '#ff6b5b'], [1, '#b10f05']]); rrect(ctx, tx(-3.12), ty(0.965), 0.10 * P, 0.11 * P, 3); ctx.fill(); });
  ctx.fillStyle = '#ffae2b'; rrect(ctx, tx(-3.01), ty(0.965), 0.06 * P, 0.11 * P, 3); ctx.fill();

  // надписи на будке
  if (!opt.plain) {
    const cx = (bx0 + bx1) / 2;
    ctx.save();
    ctx.font = (0.30 * P) + 'px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#5a0905'; ctx.lineWidth = 12; ctx.strokeText('ГРУЗОПЕРЕВОЗКИ', cx, ty(2.30));
    ctx.fillStyle = lg(ctx, 0, ty(2.45), 0, ty(2.15), [[0, '#ffffff'], [0.55, '#fff4d6'], [1, '#ffd36a']]);
    ctx.fillText('ГРУЗОПЕРЕВОЗКИ', cx, ty(2.30));
    ctx.font = (0.27 * P) + 'px ' + FONT_H; ctx.strokeStyle = '#5a0905'; ctx.lineWidth = 8;
    ctx.strokeText('Серёга. По всей России!', cx, ty(1.92)); ctx.fillStyle = '#fff'; ctx.fillText('Серёга. По всей России!', cx, ty(1.92));
    ctx.font = (0.15 * P) + 'px ' + FONT_N; ctx.lineWidth = 5;
    const ph = '8-900-ГАЗ-ЕЛЬ-0  •  недорого  •  аккуратно*';
    ctx.strokeText(ph, cx, ty(1.62)); ctx.fillStyle = '#ffe9a6'; ctx.fillText(ph, cx, ty(1.62));
    ctx.font = (0.085 * P) + 'px ' + FONT_N; ctx.fillStyle = 'rgba(255,230,220,.85)';
    ctx.fillText('*как дорога позволит', tx(-0.62), ty(1.47));
    ctx.restore();
  }

  // ---------- кабина ----------
  withShadow(ctx, 'rgba(0,0,0,.4)', 12, 0, 5, () => { cabPath(ctx); ctx.fillStyle = RED_D; ctx.fill(); });
  cabPath(ctx);
  ctx.fillStyle = lg(ctx, 0, ty(2.26), 0, ty(0.80), [[0, '#ff7a62'], [0.1, '#f0402e'], [0.42, RED], [0.75, '#bf1a10'], [1, '#7a0e08']]);
  ctx.fill();
  ctx.save(); cabPath(ctx); ctx.clip();
  // блики на кабине
  ctx.fillStyle = lg(ctx, tx(0.5), ty(2.2), tx(1.2), ty(1.4), [[0, 'rgba(255,255,255,.35)'], [0.4, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(tx(0.4), ty(2.3), 2.6 * P, 1.6 * P);
  ctx.fillStyle = 'rgba(255,255,255,.22)'; poly(ctx, [[tx(2.3), ty(1.47)], [tx(2.7), ty(1.38)], [tx(2.74), ty(1.33)], [tx(2.3), ty(1.42)]]); ctx.fill();
  // линия кузова по борту
  ctx.strokeStyle = 'rgba(90,8,4,.75)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(tx(0.5), ty(1.30)); ctx.lineTo(tx(2.86), ty(1.20)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,170,150,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(tx(0.5), ty(1.325)); ctx.lineTo(tx(2.86), ty(1.225)); ctx.stroke();
  // нижний молдинг
  ctx.fillStyle = lg(ctx, 0, ty(0.98), 0, ty(0.80), [[0, '#2a2c30'], [1, '#0f1012']]);
  ctx.fillRect(tx(0.4), ty(0.98), 2.6 * P, 0.2 * P);
  ctx.restore();
  // дверь
  ctx.strokeStyle = 'rgba(70,5,2,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(tx(0.64), ty(0.98)); ctx.lineTo(tx(0.64), ty(2.17)); ctx.lineTo(tx(1.52), ty(2.19)); ctx.lineTo(tx(2.0), ty(1.47));
  ctx.lineTo(tx(2.0), ty(1.18)); ctx.quadraticCurveTo(tx(1.92), ty(0.98), tx(1.74), ty(0.98)); ctx.stroke();
  // стекло двери (полупрозрачное): сначала вырезаем окно, чтобы был виден Серёга
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; windowPath(ctx); ctx.fill(); ctx.restore();
  windowPath(ctx);
  ctx.fillStyle = lg(ctx, tx(0.74), ty(2.1), tx(1.9), ty(1.5), [[0, 'rgba(170,215,240,.42)'], [0.5, 'rgba(110,160,200,.22)'], [1, 'rgba(70,110,150,.38)']]);
  ctx.fill();
  ctx.save(); windowPath(ctx); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.38)';
  poly(ctx, [[tx(1.10), ty(2.2)], [tx(1.26), ty(2.2)], [tx(0.92), ty(1.4)], [tx(0.76), ty(1.4)]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  poly(ctx, [[tx(1.34), ty(2.2)], [tx(1.40), ty(2.2)], [tx(1.06), ty(1.4)], [tx(1.0), ty(1.4)]]); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#1b1c1f'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; windowPath(ctx); ctx.stroke();
  // лобовое стекло (видимый край)
  windshieldPath(ctx); ctx.fillStyle = lg(ctx, tx(1.6), ty(2.2), tx(2.1), ty(1.5), [[0, 'rgba(200,235,255,.85)'], [1, 'rgba(60,100,140,.85)']]); ctx.fill();
  ctx.strokeStyle = '#151618'; ctx.lineWidth = 3; ctx.stroke();
  // дворник
  ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx(2.06), ty(1.55)); ctx.lineTo(tx(1.96), ty(1.80)); ctx.stroke();
  // ручка двери
  ctx.fillStyle = lg(ctx, 0, ty(1.40), 0, ty(1.34), [[0, '#f0f2f4'], [1, '#6c7178']]); rrect(ctx, tx(0.74), ty(1.40), 0.16 * P, 0.05 * P, 4); ctx.fill();
  // замок
  ctx.fillStyle = '#9aa0a7'; circle(ctx, tx(0.95), ty(1.375), 4); ctx.fill();
  // ступенька
  ctx.fillStyle = lg(ctx, 0, ty(0.80), 0, ty(0.70), [[0, '#55595f'], [1, '#1a1b1e']]); rrect(ctx, tx(0.72), ty(0.80), 0.48 * P, 0.09 * P, 3); ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#0d0e10'; ctx.fillRect(tx(0.76 + i * 0.07), ty(0.79), 3, 0.07 * P); }
  // зеркало
  ctx.strokeStyle = '#1c1d20'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx(1.96), ty(1.60)); ctx.lineTo(tx(2.12), ty(1.74)); ctx.lineTo(tx(2.12), ty(1.80)); ctx.stroke();
  ctx.fillStyle = lg(ctx, tx(2.06), 0, tx(2.22), 0, [[0, '#3a3c40'], [1, '#0c0d0f']]); rrect(ctx, tx(2.07), ty(2.04), 0.13 * P, 0.36 * P, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(tx(2.09), ty(2.0), 3, 0.28 * P);
  // подкрылок переднего колеса
  const A = GEO.frontX;
  ctx.strokeStyle = '#141518'; ctx.lineWidth = 0.07 * P;
  ctx.beginPath(); ctx.arc(tx(A), ty(GEO.wheelY), 0.59 * P, Math.PI * 1.09, Math.PI * 1.91); ctx.stroke();
  // повторитель поворота и шильдик
  withShadow(ctx, 'rgba(255,160,0,.8)', 8, 0, 0, () => { ctx.fillStyle = lg(ctx, 0, ty(1.17), 0, ty(1.09), [[0, '#ffe38a'], [1, '#ff8a00']]); rrect(ctx, tx(2.36), ty(1.17), 0.12 * P, 0.07 * P, 5); ctx.fill(); });
  ctx.font = 'italic ' + (0.10 * P) + 'px ' + FONT_T; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5c0704'; ctx.fillText('ГАЗель', tx(2.17) + 1, ty(1.035) + 1);
  ctx.fillStyle = lg(ctx, 0, ty(1.09), 0, ty(0.98), [[0, '#ffffff'], [0.5, '#b8bdc3'], [1, '#eef0f2']]); ctx.fillText('ГАЗель', tx(2.17), ty(1.035));
  // фара (торец)
  ctx.fillStyle = '#1d1e21'; rrect(ctx, tx(2.70), ty(1.26), 0.19 * P, 0.22 * P, 6); ctx.fill();
  withShadow(ctx, 'rgba(255,250,200,.9)', 14, 0, 0, () => { ctx.fillStyle = lg(ctx, tx(2.72), 0, tx(2.88), 0, [[0, '#d7e6f0'], [0.6, '#ffffff'], [1, '#fff6c8']]); rrect(ctx, tx(2.73), ty(1.235), 0.14 * P, 0.17 * P, 5); ctx.fill(); });
  // решётка радиатора (торец)
  ctx.fillStyle = '#121315'; rrect(ctx, tx(2.82), ty(1.07), 0.07 * P, 0.22 * P, 3); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#b9bec5'; ctx.fillRect(tx(2.83), ty(1.05 - i * 0.05), 0.05 * P, 2); }
  // бампер
  ctx.fillStyle = lg(ctx, 0, ty(0.84), 0, ty(0.50), [[0, '#4a4d52'], [0.25, '#2b2d31'], [1, '#0d0e10']]);
  rrect(ctx, tx(2.50), ty(0.84), 0.47 * P, 0.32 * P, 10); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; rrect(ctx, tx(2.54), ty(0.82), 0.38 * P, 0.04 * P, 4); ctx.fill();
  // противотуманка
  withShadow(ctx, 'rgba(255,240,180,.8)', 8, 0, 0, () => { ctx.fillStyle = '#fff3c4'; rrect(ctx, tx(2.86), ty(0.70), 0.08 * P, 0.08 * P, 4); ctx.fill(); });
  // номер-заглушка спереди не виден сбоку; буксировочный крюк
  ctx.strokeStyle = '#2a2b2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(tx(2.98), ty(0.56), 9, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  // общий контур кабины
  ctx.strokeStyle = 'rgba(60,4,2,.9)'; ctx.lineWidth = 3; cabPath(ctx); ctx.stroke();
  // антенна-ус на крыше
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx(1.42), ty(2.25)); ctx.lineTo(tx(1.20), ty(2.70)); ctx.stroke();
  ctx.fillStyle = '#111'; circle(ctx, tx(1.20), ty(2.70), 4); ctx.fill();
}

function drawTruckInterior(ctx) {
  const P = TK.P;
  ctx.save(); windowPath(ctx); ctx.lineWidth = 10; ctx.strokeStyle = '#141619'; ctx.stroke(); ctx.clip();
  ctx.fillStyle = lg(ctx, 0, ty(2.15), 0, ty(1.5), [[0, '#3a4652'], [1, '#161b21']]);
  ctx.fillRect(tx(0.6), ty(2.3), 1.6 * P, 1.0 * P);
  // задняя стенка кабины и окошко
  ctx.fillStyle = '#20262d'; ctx.fillRect(tx(0.6), ty(2.3), 0.22 * P, 1.0 * P);
  // спинка сиденья
  ctx.fillStyle = lg(ctx, tx(0.78), 0, tx(1.05), 0, [[0, '#2f2924'], [1, '#4a3f35']]);
  rrect(ctx, tx(0.80), ty(2.02), 0.24 * P, 0.62 * P, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(tx(0.82), ty(1.95 - i * 0.12)); ctx.lineTo(tx(1.02), ty(1.95 - i * 0.12)); ctx.stroke(); }
  // руль
  ctx.strokeStyle = '#0c0d0f'; ctx.lineWidth = 0.05 * P;
  ellipse(ctx, tx(1.66), ty(1.66), 0.05 * P, 0.20 * P, -0.35); ctx.stroke();
  ctx.lineWidth = 0.035 * P; ctx.beginPath(); ctx.moveTo(tx(1.66), ty(1.66)); ctx.lineTo(tx(1.86), ty(1.48)); ctx.stroke();
  // торпедо
  ctx.fillStyle = '#121417'; poly(ctx, [[tx(1.70), ty(1.56)], [tx(2.1), ty(1.62)], [tx(2.1), ty(1.4)], [tx(1.70), ty(1.4)]]); ctx.fill();
  ctx.restore();
}

function drawWheel(ctx, S, chrome) {
  const c = S / 2, R = S / 2 - 3, P = R / GEO.wheelR;
  // тень протектора
  // протектор — блоки по окружности
  ctx.save(); ctx.translate(c, c);
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = '#141414'; rrect(ctx, -R * 0.07, -R - 1, R * 0.14, R * 0.12, 3); ctx.fill();
    ctx.restore();
  }
  // шина
  circle(ctx, 0, 0, R * 0.95);
  ctx.fillStyle = rg(ctx, -R * 0.2, -R * 0.25, R * 0.3, R * 1.0, [[0, '#3a3a3c'], [0.65, '#232325'], [0.9, '#121213'], [1, '#050505']]); ctx.fill();
  // боковина: кольца и надпись
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 2; circle(ctx, 0, 0, R * 0.86); ctx.stroke(); circle(ctx, 0, 0, R * 0.74); ctx.stroke();
  ctx.font = 'bold ' + Math.round(R * 0.11) + 'px ' + FONT_T; ctx.fillStyle = 'rgba(210,210,210,.35)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const label = 'КАМА  ВЛИ-5  185/75 R16C  •  ВСЕСЕЗОН  •  ';
  for (let i = 0; i < label.length; i++) { ctx.save(); ctx.rotate(i / label.length * Math.PI * 2); ctx.fillText(label[i], 0, -R * 0.80); ctx.restore(); }
  // диск
  const rr = R * 0.62;
  circle(ctx, 0, 0, rr);
  ctx.fillStyle = chrome ? rg(ctx, -rr * 0.3, -rr * 0.4, 2, rr * 1.1, [[0, '#ffffff'], [0.35, '#d6dce3'], [0.7, '#8a929c'], [1, '#e9edf1']])
    : rg(ctx, -rr * 0.3, -rr * 0.4, 2, rr * 1.1, [[0, '#b9bec4'], [0.5, '#7d838b'], [1, '#3f4349']]);
  ctx.fill();
  ctx.strokeStyle = '#2a2d31'; ctx.lineWidth = 3; ctx.stroke();
  // вентиляционные окна
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    ctx.save(); ctx.rotate(a); ellipse(ctx, 0, -rr * 0.66, rr * 0.13, rr * 0.2);
    ctx.fillStyle = chrome ? '#3a4048' : '#141518'; ctx.fill(); ctx.restore();
  }
  // ступица
  circle(ctx, 0, 0, rr * 0.42); ctx.fillStyle = chrome ? rg(ctx, -5, -6, 1, rr * 0.45, [[0, '#fff'], [1, '#9aa3ad']]) : rg(ctx, -5, -6, 1, rr * 0.45, [[0, '#9ca2a9'], [1, '#33373c']]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const x = Math.cos(a) * rr * 0.3, y = Math.sin(a) * rr * 0.3;
    circle(ctx, x, y, rr * 0.065); ctx.fillStyle = '#d9dde2'; ctx.fill(); ctx.strokeStyle = '#25282c'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  circle(ctx, 0, 0, rr * 0.14); ctx.fillStyle = chrome ? '#e8402f' : '#1b1d20'; ctx.fill();
  // отметка, чтобы вращение было видно
  ctx.fillStyle = chrome ? '#ff3b2a' : '#e8c34a'; rrect(ctx, -rr * 0.05, -rr * 0.98, rr * 0.1, rr * 0.18, 2); ctx.fill();
  // общий блик
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ellipse(ctx, -R * 0.3, -R * 0.35, R * 0.35, R * 0.22, -0.6); ctx.fill();
  ctx.restore();
}

function drawBackDoor(ctx, w, h) {
  ctx.fillStyle = lg(ctx, 0, 0, w, 0, [[0, '#8a120c'], [0.3, '#e0281d'], [0.7, '#c91d13'], [1, '#76100a']]);
  rrect(ctx, 2, 2, w - 4, h - 4, 6); ctx.fill();
  ctx.strokeStyle = '#c8cdd2'; ctx.lineWidth = 6; rrect(ctx, 5, 5, w - 10, h - 10, 5); ctx.stroke();
  // запорные штанги
  [0.3, 0.7].forEach(k => {
    ctx.fillStyle = lg(ctx, w * k - 5, 0, w * k + 5, 0, [[0, '#6c7178'], [0.5, '#f3f5f7'], [1, '#6c7178']]);
    ctx.fillRect(w * k - 5, 8, 10, h - 16);
    ctx.fillStyle = '#3c3f44'; ctx.fillRect(w * k - 9, h * 0.52, 18, 22);
    ctx.fillStyle = '#d8dce0'; ctx.fillRect(w * k - 2, h * 0.52 + 20, 4, 30);
  });
  ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(w * 0.13) + 'px ' + FONT_N; ctx.textAlign = 'center';
  ctx.fillText('НЕ', w / 2, h * 0.17); ctx.fillText('ОБГОНЯЙ', w / 2, h * 0.24);
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(10, 10, w * 0.2, h - 20);
}
