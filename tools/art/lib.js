// Общие помощники для генерации графики (запускается только в tools, не в игре)
'use strict';
const ART = { list: [], byName: {} };
function asset(name, w, h, draw, opts) {
  const a = Object.assign({ name, w, h, draw, fmt: 'png', q: 0.9, meta: {} }, opts || {});
  ART.list.push(a); ART.byName[name] = a; return a;
}

function mulberry(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6D2B79F5; let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
// периодический 1D шум: period — в узлах решётки
function noise1(x, period, seed) {
  const i = Math.floor(x), f = x - i;
  const a = hash2(((i % period) + period) % period, 0, seed), b = hash2((((i + 1) % period) + period) % period, 0, seed);
  return lerp(a, b, smooth(f));
}
function fbm1(x, period, seed, oct) {
  let v = 0, amp = 0.5, tot = 0, p = period, f = 1;
  for (let o = 0; o < (oct || 5); o++) { v += noise1(x * f, p, seed + o * 17) * amp; tot += amp; amp *= 0.5; f *= 2; p *= 2; }
  return v / tot;
}
function noise2(x, y, px, py, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const w = (v, p) => ((v % p) + p) % p;
  const a = hash2(w(ix, px), w(iy, py), seed), b = hash2(w(ix + 1, px), w(iy, py), seed);
  const c = hash2(w(ix, px), w(iy + 1, py), seed), d = hash2(w(ix + 1, px), w(iy + 1, py), seed);
  const sx = smooth(fx), sy = smooth(fy);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function fbm2(x, y, px, py, seed, oct) {
  let v = 0, amp = 0.5, tot = 0, f = 1;
  for (let o = 0; o < (oct || 5); o++) { v += noise2(x * f, y * f, px * f, py * f, seed + o * 31) * amp; tot += amp; amp *= 0.5; f *= 2; }
  return v / tot;
}
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2);
  return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';
}
function rgba(c, a) { const v = hex(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; }
function shade(c, k) { // k<0 темнее, k>0 светлее
  const v = hex(c);
  return 'rgb(' + v.map(x => Math.round(k < 0 ? x * (1 + k) : x + (255 - x) * k)).join(',') + ')';
}
function lg(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(s => g.addColorStop(s[0], s[1])); return g;
}
function rg(ctx, x, y, r0, r1, stops, x1, y1) {
  const g = ctx.createRadialGradient(x, y, r0, x1 === undefined ? x : x1, y1 === undefined ? y : y1, r1);
  stops.forEach(s => g.addColorStop(s[0], s[1])); return g;
}
function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// гладкая кривая через точки (Catmull-Rom → Безье)
function spline(ctx, pts, closed, move) {
  const n = pts.length; if (n < 2) return;
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  if (move !== false) ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function ellipse(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.abs(r), 0, Math.PI * 2); }
function strokeFill(ctx, fill, stroke, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}
// шум-зерно поверх текущего содержимого (через маленький тайл)
function grain(ctx, w, h, amt, seed, size) {
  const t = document.createElement('canvas'); const S = size || 128; t.width = t.height = S;
  const c = t.getContext('2d'); const d = c.createImageData(S, S); const r = mulberry(seed || 1);
  for (let i = 0; i < S * S; i++) { const v = r() * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255 * amt; }
  c.putImageData(d, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(t, 'repeat');
  ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, w, h); ctx.restore();
}
function withShadow(ctx, color, blur, ox, oy, fn) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = ox || 0; ctx.shadowOffsetY = oy || 0; fn(); ctx.restore();
}
function text(ctx, s, x, y, font, fill, align, stroke, lw) {
  ctx.font = font; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
const FONT_T = '"Russo One", "Segoe UI", Arial, sans-serif';
const FONT_N = '"PT Sans Narrow", "Arial Narrow", Arial, sans-serif';
const FONT_H = '"Caveat", "Comic Sans MS", cursive';
