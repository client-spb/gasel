// Серёга — водитель. Голова и плечи, смотрит вправо, по дороге. Несколько эмоций.
'use strict';
function drawSerega(ctx, S, mood) {
  const k = S / 240;
  ctx.save(); ctx.scale(k, k);
  const skin = '#f0bb92', skinD = '#c98a62', skinL = '#ffd9b8';
  // плечи в тельняшке
  ctx.save();
  ctx.beginPath(); ctx.moveTo(30, 240); ctx.quadraticCurveTo(40, 188, 104, 180); ctx.lineTo(150, 180); ctx.quadraticCurveTo(212, 188, 222, 240); ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f7f7f4'; ctx.fillRect(0, 170, 240, 80);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = '#1f3f8c'; ctx.fillRect(0, 178 + i * 8, 240, 4); }
  ctx.fillStyle = lg(ctx, 30, 0, 222, 0, [[0, 'rgba(0,0,0,.35)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.25)']]); ctx.fillRect(0, 170, 240, 80);
  ctx.restore();
  // куртка-жилетка поверх
  ctx.fillStyle = lg(ctx, 0, 190, 0, 240, [[0, '#3d4a35'], [1, '#232b1e']]);
  ctx.beginPath(); ctx.moveTo(30, 240); ctx.quadraticCurveTo(38, 196, 88, 184); ctx.lineTo(104, 240); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(222, 240); ctx.quadraticCurveTo(214, 196, 166, 184); ctx.lineTo(150, 240); ctx.closePath(); ctx.fill();
  // шея
  ctx.fillStyle = lg(ctx, 100, 0, 156, 0, [[0, skinD], [1, skin]]); rrect(ctx, 102, 150, 52, 40, 12); ctx.fill();
  // ухо
  ellipse(ctx, 62, 112, 15, 22, -0.1); ctx.fillStyle = skinD; ctx.fill();
  ellipse(ctx, 64, 112, 9, 15, -0.1); ctx.fillStyle = '#d99a76'; ctx.fill();
  // лицо
  ctx.beginPath(); ctx.moveTo(70, 70);
  ctx.bezierCurveTo(70, 40, 190, 36, 192, 84);
  ctx.bezierCurveTo(198, 120, 192, 150, 168, 168);
  ctx.bezierCurveTo(144, 184, 96, 182, 80, 160);
  ctx.bezierCurveTo(66, 140, 66, 100, 70, 70); ctx.closePath();
  ctx.fillStyle = rg(ctx, 140, 100, 10, 110, [[0, skinL], [0.55, skin], [1, skinD]], 130, 110); ctx.fill();
  ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 3; ctx.stroke();
  // щетина
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(70,45,30,.22)';
  ctx.beginPath(); ctx.moveTo(78, 128); ctx.quadraticCurveTo(130, 150, 196, 120); ctx.lineTo(196, 190); ctx.lineTo(70, 190); ctx.closePath(); ctx.fill();
  const r = mulberry(7);
  for (let i = 0; i < 260; i++) { const x = 78 + r() * 118, y = 130 + r() * 50; ctx.fillStyle = 'rgba(60,35,20,' + (0.2 + r() * 0.3) + ')'; ctx.fillRect(x, y, 1.6, 1.6); }
  ctx.restore();
  // румянец
  ctx.fillStyle = 'rgba(230,80,60,.25)'; ellipse(ctx, 108, 128, 16, 10); ctx.fill(); ellipse(ctx, 178, 124, 10, 8); ctx.fill();
  // глаза
  const eye = (x, y, rx, ry, px, py, pr) => {
    ellipse(ctx, x, y, rx, ry); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2.5; ctx.stroke();
    circle(ctx, px, py, pr); ctx.fillStyle = '#4a7a2f'; ctx.fill();
    circle(ctx, px, py, pr * 0.55); ctx.fillStyle = '#111'; ctx.fill();
    circle(ctx, px - pr * 0.35, py - pr * 0.4, pr * 0.3); ctx.fillStyle = '#fff'; ctx.fill();
  };
  const brows = (l, rgt) => {
    ctx.strokeStyle = '#4a2e1c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.quadraticCurveTo(l[2], l[3], l[4], l[5]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rgt[0], rgt[1]); ctx.quadraticCurveTo(rgt[2], rgt[3], rgt[4], rgt[5]); ctx.stroke();
  };
  if (mood === 'happy') {
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(122, 100, 12, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(170, 98, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    brows([106, 78, 122, 68, 138, 76], [158, 76, 170, 68, 182, 74]);
  } else if (mood === 'scared') {
    eye(122, 100, 15, 18, 126, 102, 5); eye(170, 98, 11, 15, 173, 100, 4);
    brows([104, 74, 118, 60, 138, 66], [156, 64, 170, 56, 184, 66]);
  } else if (mood === 'dizzy') {
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 3;
    [[122, 100, 12], [170, 98, 9]].forEach(e => { ctx.beginPath(); for (let a = 0; a < 12; a += 0.2) { const rr = a / 12 * e[2]; ctx.lineTo(e[0] + Math.cos(a) * rr, e[1] + Math.sin(a) * rr); } ctx.stroke(); });
    brows([106, 80, 122, 74, 138, 82], [158, 80, 170, 74, 182, 82]);
  } else if (mood === 'cool') {
    brows([106, 82, 122, 78, 138, 84], [158, 82, 170, 78, 182, 84]);
  } else {
    eye(122, 102, 12, 11, 127, 103, 6); eye(170, 100, 9, 9, 174, 101, 5);
    ctx.fillStyle = skin; ctx.fillRect(108, 90, 28, 6); ctx.fillRect(160, 90, 20, 5);
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(110, 96); ctx.lineTo(134, 96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(161, 95); ctx.lineTo(179, 95); ctx.stroke();
    brows([106, 82, 122, 74, 138, 80], [158, 80, 170, 74, 182, 80]);
  }
  // нос — картошкой
  ellipse(ctx, 160, 124, 17, 15, 0.2);
  ctx.fillStyle = rg(ctx, 156, 118, 2, 18, [[0, '#ffd2b4'], [0.6, '#f29e7e'], [1, '#d77058']]); ctx.fill();
  ctx.strokeStyle = '#8a4a32'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(ctx, 154, 117, 5, 3, -0.4); ctx.fill();
  // рот
  if (mood === 'happy') {
    ctx.beginPath(); ctx.moveTo(116, 148); ctx.quadraticCurveTo(150, 186, 186, 144); ctx.quadraticCurveTo(150, 160, 116, 148);
    ctx.fillStyle = '#5a1a12'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(122, 150); ctx.quadraticCurveTo(150, 162, 180, 148); ctx.lineTo(178, 156); ctx.quadraticCurveTo(150, 166, 124, 156); ctx.fill();
    ctx.fillStyle = '#ffd34a'; ctx.fillRect(160, 151, 9, 8); // золотой зуб
    ctx.fillStyle = '#e0605a'; ellipse(ctx, 150, 170, 12, 6); ctx.fill();
  } else if (mood === 'scared') {
    ellipse(ctx, 150, 160, 13, 17); ctx.fillStyle = '#4a120c'; ctx.fill();
    ctx.fillStyle = '#d65a50'; ellipse(ctx, 150, 170, 8, 5); ctx.fill();
    // капля пота
    ctx.fillStyle = 'rgba(140,210,255,.95)'; ctx.beginPath(); ctx.moveTo(194, 64); ctx.quadraticCurveTo(206, 84, 196, 92); ctx.quadraticCurveTo(184, 86, 194, 64); ctx.fill();
    ctx.fillStyle = '#fff'; ellipse(ctx, 194, 84, 2, 3); ctx.fill();
  } else if (mood === 'dizzy') {
    ctx.beginPath(); ctx.moveTo(122, 156); ctx.quadraticCurveTo(150, 146, 178, 158); ctx.strokeStyle = '#4a120c'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#e46a62'; ellipse(ctx, 160, 166, 8, 10, 0.3); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(124, 154); ctx.quadraticCurveTo(152, 168, 180, 150); ctx.strokeStyle = '#4a120c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
  }
  // усы
  ctx.fillStyle = lg(ctx, 0, 132, 0, 156, [[0, '#7a4a2a'], [1, '#4a2a16']]);
  ctx.beginPath(); ctx.moveTo(158, 136);
  ctx.bezierCurveTo(140, 128, 114, 134, 104, 152);
  ctx.bezierCurveTo(118, 146, 132, 150, 158, 146);
  ctx.bezierCurveTo(176, 150, 190, 146, 200, 154);
  ctx.bezierCurveTo(196, 136, 176, 128, 158, 136); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,15,5,.5)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(150 - i * 4, 138 + i * 0.6); ctx.lineTo(140 - i * 4, 148); ctx.stroke(); }
  // кепка
  ctx.fillStyle = lg(ctx, 0, 20, 0, 84, [[0, '#59616c'], [0.6, '#3a4049'], [1, '#22262c']]);
  ctx.beginPath(); ctx.moveTo(62, 86);
  ctx.bezierCurveTo(56, 30, 120, 12, 168, 26);
  ctx.bezierCurveTo(196, 34, 206, 58, 204, 76);
  ctx.lineTo(62, 86); ctx.closePath(); ctx.fill();
  // клинья кепки
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  [[90, 82, 100, 26], [124, 80, 128, 18], [160, 80, 158, 22]].forEach(s => { ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo(s[0] + 4, (s[1] + s[3]) / 2, s[2], s[3]); ctx.stroke(); });
  // клетка
  ctx.save(); ctx.beginPath(); ctx.moveTo(62, 86); ctx.bezierCurveTo(56, 30, 120, 12, 168, 26); ctx.bezierCurveTo(196, 34, 206, 58, 204, 76); ctx.closePath(); ctx.clip();
  ctx.strokeStyle = 'rgba(200,170,120,.18)'; ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 10, 0); ctx.lineTo(40 + i * 10, 100); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 10 + i * 10); ctx.lineTo(240, 10 + i * 10); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ellipse(ctx, 120, 36, 46, 12, -0.15); ctx.fill();
  ctx.restore();
  // пуговка
  circle(ctx, 132, 20, 6); ctx.fillStyle = '#2b2f35'; ctx.fill();
  // козырёк
  ctx.fillStyle = lg(ctx, 0, 70, 0, 92, [[0, '#2e333a'], [1, '#14171b']]);
  ctx.beginPath(); ctx.moveTo(150, 76); ctx.quadraticCurveTo(206, 66, 232, 82); ctx.quadraticCurveTo(210, 94, 150, 88); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(160, 78); ctx.quadraticCurveTo(204, 70, 226, 80); ctx.quadraticCurveTo(200, 76, 160, 81); ctx.fill();
  // бакенбард
  ctx.fillStyle = '#4a2e1c'; ctx.beginPath(); ctx.moveTo(72, 84); ctx.lineTo(86, 84); ctx.lineTo(82, 116); ctx.lineTo(74, 112); ctx.closePath(); ctx.fill();
  // очки для «крутого» режима
  if (mood === 'cool') {
    ctx.fillStyle = '#0d0f12';
    rrect(ctx, 102, 88, 42, 26, 10); ctx.fill(); rrect(ctx, 156, 88, 34, 24, 10); ctx.fill();
    ctx.fillRect(140, 94, 20, 5); ctx.fillRect(72, 92, 32, 5);
    ctx.fillStyle = 'rgba(120,200,255,.5)'; poly(ctx, [[108, 94], [118, 94], [110, 108], [104, 108]]); ctx.fill();
    poly(ctx, [[162, 94], [170, 94], [164, 106], [160, 106]]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(124, 154); ctx.quadraticCurveTo(156, 166, 184, 146); ctx.strokeStyle = '#4a120c'; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.restore();
}
