// Логотип, педали, бумага путевого листа, печать
'use strict';
function drawLogo(ctx, W, H) {
  // полосы скорости
  ctx.save(); ctx.globalAlpha = 0.9;
  for (let i = 0; i < 7; i++) { const y = 70 + i * 26, w = 140 + (i % 3) * 70; ctx.fillStyle = lg(ctx, 40, 0, 40 + w, 0, [[0, 'rgba(255,210,60,0)'], [1, 'rgba(255,210,60,.85)']]); rrect(ctx, 30, y, w, 9, 4); ctx.fill(); }
  ctx.restore();
  // ГАЗЕЛЬ — объёмные буквы
  const word = 'ГАЗЕЛЬ', fs = 200;
  ctx.font = fs + 'px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cx = W / 2 + 40, by = 250;
  ctx.save(); ctx.translate(cx, by); ctx.transform(1, 0, -0.12, 1, 0, 0);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a0503'; ctx.lineWidth = 46; ctx.strokeText(word, 10, 16);
  for (let d = 16; d > 0; d -= 1) { ctx.fillStyle = d > 12 ? '#2a0603' : mix('#5a0a05', '#9a1208', 1 - d / 16); ctx.fillText(word, d * 0.7, d); }
  ctx.strokeStyle = '#fff8ea'; ctx.lineWidth = 22; ctx.strokeText(word, 0, 0);
  ctx.strokeStyle = '#1a0503'; ctx.lineWidth = 6; ctx.strokeText(word, 0, 0);
  ctx.fillStyle = lg(ctx, 0, -fs * 0.75, 0, 10, [[0, '#ff8a6a'], [0.25, '#ff3a26'], [0.6, '#d8180e'], [1, '#8a0a05']]);
  ctx.fillText(word, 0, 0);
  // блик по верху букв
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-W, -fs * 0.75, W * 2, fs * 0.22);
  ctx.restore();
  ctx.restore();
  // номерной знак «СЕРЁГИ»
  const px = W / 2 - 260 + 30, py = 290, pw = 520, ph = 118;
  withShadow(ctx, 'rgba(0,0,0,.5)', 18, 0, 10, () => { ctx.fillStyle = '#111'; rrect(ctx, px - 8, py - 8, pw + 16, ph + 16, 18); ctx.fill(); });
  ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(-0.025); ctx.translate(-px - pw / 2, -py - ph / 2);
  ctx.fillStyle = lg(ctx, 0, py, 0, py + ph, [[0, '#ffffff'], [1, '#e2e4e6']]); rrect(ctx, px, py, pw, ph, 12); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 7; rrect(ctx, px + 6, py + 6, pw - 12, ph - 12, 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px + pw - 132, py + 6); ctx.lineTo(px + pw - 132, py + ph - 6); ctx.stroke();
  ctx.font = '92px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111';
  ctx.fillText('СЕРЁГИ', px + (pw - 132) / 2 + 4, py + ph / 2 + 6);
  ctx.font = '54px ' + FONT_T; ctx.fillText('777', px + pw - 66, py + 44);
  ctx.font = 'bold 22px ' + FONT_N; ctx.fillText('RUS', px + pw - 86, py + 92);
  ['#fff', '#2a5ab8', '#d8231a'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(px + pw - 56, py + 82 + i * 7, 30, 7); });
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(px + pw - 56, py + 82, 30, 21);
  [[px + 26, py + ph / 2], [px + pw - 150, py + ph / 2]].forEach(b => { circle(ctx, b[0], b[1] - 40, 6); ctx.fillStyle = '#9aa0a6'; ctx.fill(); });
  ctx.restore();
  // подзаголовок
  ctx.save(); ctx.translate(W / 2 + 40, 462); ctx.rotate(-0.03);
  ctx.font = '58px ' + FONT_H; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2a0a05'; ctx.lineWidth = 12; ctx.strokeText('дальнобой по-русски', 0, 0);
  ctx.fillStyle = '#ffd23a'; ctx.fillText('дальнобой по-русски', 0, 0);
  ctx.restore();
}
function drawPedal(ctx, W, H, kind) {
  const gas = kind === 'gas';
  const x = 18, y = 14, w = W - 36, h = H - 40;
  // рычаг
  ctx.fillStyle = lg(ctx, W / 2 - 14, 0, W / 2 + 14, 0, [[0, '#4a4e54'], [0.5, '#c8ccd2'], [1, '#3a3e44']]);
  ctx.fillRect(W / 2 - 12, H - 40, 24, 40);
  withShadow(ctx, 'rgba(0,0,0,.55)', 16, 0, 8, () => { ctx.fillStyle = '#26282c'; rrect(ctx, x, y, w, h, gas ? 26 : 30); ctx.fill(); });
  ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#55595f'], [0.12, '#d8dce2'], [0.5, '#8a9098'], [0.88, '#d8dce2'], [1, '#4a4e54']]);
  rrect(ctx, x, y, w, h, gas ? 26 : 30); ctx.fill();
  // резиновая накладка
  const ix = x + 12, iy = y + 12, iw = w - 24, ih = h - 24;
  ctx.fillStyle = lg(ctx, 0, iy, 0, iy + ih, [[0, '#3a3c40'], [1, '#141518']]); rrect(ctx, ix, iy, iw, ih, gas ? 18 : 22); ctx.fill();
  ctx.save(); rrect(ctx, ix, iy, iw, ih, gas ? 18 : 22); ctx.clip();
  const step = gas ? 22 : 24;
  for (let yy = iy + 14; yy < iy + ih - 6; yy += step) {
    ctx.fillStyle = '#0a0b0c'; rrect(ctx, ix + 12, yy, iw - 24, step * 0.45, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(ctx, ix + 12, yy + step * 0.45, iw - 24, 3, 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(ix, iy, iw * 0.3, ih);
  ctx.restore();
  // надпись
  const lbl = gas ? 'ГАЗ' : 'ТОРМОЗ';
  ctx.font = (gas ? 46 : 38) + 'px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.strokeText(lbl, W / 2, iy + ih / 2);
  ctx.fillStyle = gas ? '#7dff5a' : '#ff5a4a'; ctx.fillText(lbl, W / 2, iy + ih / 2);
  // стрелка
  ctx.fillStyle = gas ? 'rgba(125,255,90,.8)' : 'rgba(255,90,74,.8)';
  if (gas) poly(ctx, [[W / 2 - 22, iy + 40], [W / 2 + 22, iy + 40], [W / 2, iy + 16]]); else poly(ctx, [[W / 2 - 22, iy + ih - 40], [W / 2 + 22, iy + ih - 40], [W / 2, iy + ih - 16]]);
  ctx.fill();
  // заклёпки
  [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]].forEach(p => { circle(ctx, p[0], p[1], 5); ctx.fillStyle = rg(ctx, p[0] - 1, p[1] - 2, 0.5, 6, [[0, '#fff'], [1, '#5a5e64']]); ctx.fill(); });
}
function drawPaper(ctx, S) {
  texture(ctx, S, '#f2e8cf', '#e0d0a8', '#fbf6e8', { scale: 6, seed: 21, grain: 0.12 });
  const r = mulberry(22);
  ctx.strokeStyle = 'rgba(140,110,60,.10)'; ctx.lineWidth = 1;
  for (let i = 0; i < 300; i++) { const x = r() * S, y = r() * S, a = r() * Math.PI, l = 4 + r() * 12; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  // пятно от кружки чая
  ctx.strokeStyle = 'rgba(150,100,40,.18)'; ctx.lineWidth = 5; circle(ctx, S * 0.72, S * 0.3, 60); ctx.stroke();
  ctx.lineWidth = 2; circle(ctx, S * 0.72, S * 0.3, 54); ctx.stroke();
}
function drawStamp(ctx, W, H, txt, sub, col) {
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.18);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.globalAlpha = 0.85;
  ctx.lineWidth = 8; rrect(ctx, -W * 0.44, -H * 0.36, W * 0.88, H * 0.72, 14); ctx.stroke();
  ctx.lineWidth = 3; rrect(ctx, -W * 0.40, -H * 0.29, W * 0.80, H * 0.58, 10); ctx.stroke();
  let fs = 52; ctx.font = fs + 'px ' + FONT_T; const m = ctx.measureText(txt).width; if (m > W * 0.72) fs = Math.floor(fs * W * 0.72 / m);
  ctx.font = fs + 'px ' + FONT_T; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, -10);
  ctx.font = 'bold 22px ' + FONT_N; ctx.fillText(sub, 0, 32);
  // потёртости
  ctx.globalCompositeOperation = 'destination-out'; const r = mulberry(txt.length * 7);
  for (let i = 0; i < 260; i++) { ctx.globalAlpha = r() * 0.8; circle(ctx, (r() - 0.5) * W, (r() - 0.5) * H, r() * 3 + 0.5); ctx.fill(); }
  ctx.restore();
}
asset('logo', 1100, 520, (ctx, w, h) => drawLogo(ctx, w, h));
asset('pedal_gas', 200, 320, (ctx, w, h) => drawPedal(ctx, w, h, 'gas'));
asset('pedal_brake', 240, 260, (ctx, w, h) => drawPedal(ctx, w, h, 'brake'));
asset('paper', 512, 512, (ctx, w) => drawPaper(ctx, w), { fmt: 'jpg', q: 0.86 });
asset('stamp_ok', 420, 200, (ctx, w, h) => drawStamp(ctx, w, h, 'ДОСТАВЛЕНО', 'ИП «СЕРЁГА И КО» • ПРИНЯТО', '#c8201a'));
asset('stamp_fail', 420, 200, (ctx, w, h) => drawStamp(ctx, w, h, 'НЕ ДОЕХАЛ', 'ДИСПЕТЧЕРСКАЯ • ПЕРЕЗВОНИТЬ', '#2a4ab0'));
asset('stamp_final', 420, 200, (ctx, w, h) => drawStamp(ctx, w, h, 'ВЛАДИВОСТОК!', '9 300 КМ • ГАЗЕЛЬ ЖИВА', '#1a8a3a'));
