// =====================================================================
//  ТРАССА: генерация рельефа, покрытий и объектов вдоль дороги
// =====================================================================
'use strict';
const DX = 0.5, TX0 = -80;
const ADS = ['ad_tire', 'ad_shashlik', 'ad_garage', 'ad_luda', 'ad_honey', 'ad_gazel', 'ad_motel', 'ad_coffee'];

class Terrain {
  constructor(opts) {
    this.h = []; this.hv = []; this.hb = []; this.s = []; this.water = [];
    this.ents = []; this.decor = []; this.occ = []; this.bridges = []; this.waters = [];
    this.opts = opts; this.rng = mulberry(opts.seed);
    this.endless = !!opts.endless; this.genTo = TX0; this.len = opts.len || 1e9;
    this.themeAt = opts.themeAt;
    this.ph = [this.rng() * 6.28, this.rng() * 6.28, this.rng() * 6.28, this.rng() * 6.28];
  }
  idx(x) { return (x - TX0) / DX; }
  heightAt(x) {
    const f = (x - TX0) / DX; let i = Math.floor(f); const n = this.h.length;
    if (i < 0) return this.h[0] || 0; if (i >= n - 1) return this.h[n - 1] || 0;
    const t = f - i; return this.h[i] + (this.h[i + 1] - this.h[i]) * t;
  }
  visAt(x) {
    const f = (x - TX0) / DX; let i = Math.floor(f); const n = this.hv.length;
    if (i < 0) return this.hv[0] || 0; if (i >= n - 1) return this.hv[n - 1] || 0;
    const t = f - i; return this.hv[i] + (this.hv[i + 1] - this.hv[i]) * t;
  }
  slopeAt(x) { return (this.heightAt(x + 0.25) - this.heightAt(x - 0.25)) / 0.5; }
  surfAt(x) { const i = Math.round((x - TX0) / DX); return this.s[clamp(i, 0, this.s.length - 1)] || 0; }
  // расстояние от точки до ломаной дороги (для колёс и корпуса)
  closest(px, py, r) {
    const i0 = Math.max(0, Math.floor((px - r - 0.6 - TX0) / DX)), i1 = Math.min(this.h.length - 2, Math.ceil((px + r + 0.6 - TX0) / DX));
    let best = 1e9, bx = 0, by = 0;
    for (let i = i0; i <= i1; i++) {
      const ax = TX0 + i * DX, ay = this.h[i], cx = ax + DX, cy = this.h[i + 1];
      const vx = cx - ax, vy = cy - ay, wx = px - ax, wy = py - ay;
      let t = (wx * vx + wy * vy) / (vx * vx + vy * vy); t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + vx * t, qy = ay + vy * t, dx = px - qx, dy = py - qy, d = dx * dx + dy * dy;
      if (d < best) { best = d; bx = qx; by = qy; }
    }
    const d = Math.sqrt(best);
    let nx = (px - bx) / (d || 1), ny = (py - by) / (d || 1);
    // точка ниже поверхности — нормаль берём от склона
    if (py < this.heightAt(px)) { const s = this.slopeAt(px), l = Math.hypot(1, s); nx = -s / l; ny = 1 / l; const o = this._q || (this._q = {}); o.d = -d; o.nx = nx; o.ny = ny; return o; }
    if (d < 1e-6) { const s = this.slopeAt(px), l = Math.hypot(1, s); nx = -s / l; ny = 1 / l; }
    const o = this._q || (this._q = {}); o.d = d; o.nx = nx; o.ny = ny; return o;
  }
  // базовый рельеф
  base(x) {
    const o = this.opts, p = this.ph;
    let k = clamp((x - 30) / 80, 0, 1);
    if (!this.endless) k *= clamp((this.len - 30 - x) / 70, 0, 1);
    const hill = this.endless ? o.hillAt(x) : o.gen.hill, L = this.endless ? 65 : o.gen.hillLen;
    return k * hill * (Math.sin(x / L + p[0]) * 0.55 + Math.sin(x / (L * 0.43) + p[1]) * 0.22 + Math.sin(x / (L * 2.3) + p[2]) * 0.9 + Math.sin(x / (L * 6) + p[3]) * 1.2);
  }
  defaultSurf(theme) { return theme === 'steppe' ? 1 : theme === 'taiga' || theme === 'baikal' ? 4 : 0; }
  extendBase(toX) {
    while (TX0 + this.h.length * DX <= toX) {
      const x = TX0 + this.h.length * DX, b = this.base(x);
      this.h.push(b); this.hv.push(b); this.hb.push(b);
      this.s.push(this.defaultSurf(this.themeAt(x)));
    }
  }
  range(x0, x1) { return [Math.max(0, Math.round(this.idx(x0))), Math.min(this.h.length - 1, Math.round(this.idx(x1)))]; }
  add(x0, x1, fn) { const a = Math.max(0, Math.round(this.idx(x0))), b = Math.min(this.h.length, Math.round(this.idx(x1))); for (let i = a; i < b; i++) { const x = TX0 + i * DX, t = clamp((x - x0) / (x1 - x0), 0, 1); const v = fn(t, x); this.h[i] += v; this.hv[i] += v; } }
  flatten(x0, x1, blend) {
    const ya = this.heightAt(x0), yb = this.heightAt(x1), [a, b] = this.range(x0 - blend, x1 + blend);
    for (let i = a; i <= b; i++) {
      const x = TX0 + i * DX; let w = 1;
      if (x < x0) w = smooth01((x - (x0 - blend)) / blend); else if (x > x1) w = smooth01(((x1 + blend) - x) / blend);
      const target = lerp(ya, yb, clamp((x - x0) / (x1 - x0), 0, 1));
      this.h[i] = lerp(this.h[i], target, w); this.hv[i] = this.h[i];
    }
  }
  setSurf(x0, x1, s) { const [a, b] = this.range(x0, x1); for (let i = a; i <= b; i++) this.s[i] = s; }
  free(x0, x1) { return !this.occ.some(r => x1 > r[0] && x0 < r[1]); }
  occupy(x0, x1) { this.occ.push([x0, x1]); }
  ent(o) { this.ents.push(o); return o; }
  dec(o) { this.decor.push(o); return o; }
  coinArc(x0, x1, hTop, n) {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = lerp(x0, x1, t);
      this.ent({ type: 'coin', x, y: this.heightAt(x) + 1.3 + Math.sin(t * Math.PI) * hTop });
    }
  }
  coinLine(x0, n, step) { for (let i = 0; i < n; i++) { const x = x0 + i * step; this.ent({ type: 'coin', x, y: this.heightAt(x) + 1.2 }); } }

  // ---------- особенности рельефа ----------
  feature(type, x, diff) {
    const r = this.rng, th = this.themeAt(x);
    switch (type) {
      case 'potholes': {
        const n = 1 + Math.floor(r() * (2 + diff * 2)); let cx = x + 22;
        this.dec({ type: 'sprite', img: 'sign_bumps', x: x + 2, back: true });
        for (let i = 0; i < n; i++) { const w = 1.2 + r() * 1.1, d = 0.2 + r() * 0.18 + diff * 0.1; this.add(cx, cx + w, t => -d * Math.sin(t * Math.PI)); cx += w + 3 + r() * 4; }
        this.coinLine(x + 20, 4, 3);
        return cx - x + 6;
      }
      case 'bumps': case 'washboard': {
        const L = 16 + r() * 16, wb = type === 'washboard';
        this.dec({ type: 'sprite', img: 'sign_bumps', x: x + 2, back: true });
        const a = wb ? 0.07 + diff * 0.04 : 0.1 + r() * 0.08 + diff * 0.08, wl = wb ? 0.9 : 1.6 + r() * 1.4, ph = r() * 6;
        this.add(x + 18, x + 18 + L, (t, xx) => a * (0.5 + 0.5 * Math.sin(xx / wl * 6.283 + ph)) * Math.sin(t * Math.PI) * (wb ? 1 : 0.6 + 0.4 * Math.sin(xx * 1.7)));
        if (this.defaultSurf(th) === 0) this.setSurf(x + 16, x + 20 + L, 1);
        return L + 24;
      }
      case 'speedbumps': {
        for (let i = 0; i < 2; i++) { const cx = x + 10 + i * 7; this.add(cx, cx + 1.0, t => 0.13 * Math.sin(t * Math.PI)); }
        this.dec({ type: 'sprite', img: 'sign_bumps', x: x + 2, back: true });
        return 26;
      }
      case 'hill': {
        const L = 34 + r() * 36, A = (r() < 0.65 ? 1 : -0.7) * (2 + r() * 3 + diff * 3);
        this.add(x, x + L, t => A * (1 - Math.cos(t * 6.283)) / 2);
        if (A > 0) this.coinArc(x + L * 0.35, x + L * 0.65, 0.4, 5);
        return L + 4;
      }
      case 'climb': {
        const up = 70 + r() * 50, down = 50 + r() * 40, A = 9 + r() * 7 + diff * 8;
        this.add(x, x + up, t => A * (1 - Math.cos(t * Math.PI)) / 2);
        this.add(x + up, x + up + down, t => A * (1 + Math.cos(t * Math.PI)) / 2);
        this.dec({ type: 'rail', x0: x + 10, x1: x + up + down - 10 });
        this.coinLine(x + up - 8, 6, 3);
        if (r() < 0.5) this.ent({ type: 'canister', x: x + up + 6, y: this.heightAt(x + up + 6) + 1.3 });
        return up + down + 4;
      }
      case 'ramp_small': case 'ramp': case 'gap': {
        const big = type !== 'ramp_small', H = big ? 1.4 + r() * 0.6 + diff * 0.4 : 0.6 + r() * 0.25, L = big ? 7 : 4.5;
        this.flatten(x - 4, x + L + (type === 'gap' ? 26 : 16), 6);
        this.dec({ type: 'sprite', img: 'sign_works', x: x - 14, back: true });
        this.dec({ type: 'sprite', img: 'ramp_sign', x: x + 1, back: true });
        this.add(x, x + L, t => H * Math.pow(t, 1.25));
        const drop = x + L;
        if (type === 'gap') {
          const D = 2.6 + diff * 0.8, W = 7 + r() * 3 + diff * 3;
          // кромка трамплина резко обрывается в овраг, на дне вода
          this.add(drop, drop + 0.6, t => H * (1 - t) - D * t);
          this.add(drop + 0.6, drop + 0.6 + W, () => -D);
          this.add(drop + 0.6 + W, drop + 11.6 + W, t => -D * (1 - smooth01(t)));
          this.waters.push({ x0: drop + 0.3, x1: drop + 8.5 + W, y: this.heightAt(drop + 1) + D * 0.35 });
          const [a, b] = this.range(drop + 0.6, drop + 0.6 + W); for (let i = a; i <= b; i++) this.s[i] = 2;
          this.coinArc(drop + 1, drop + W + 4, 2.2 + H, 7);
          this.dec({ type: 'cone', x: x - 2 }); this.dec({ type: 'cone', x: drop + W + 8 });
          return L + W + 24;
        }
        this.add(drop, drop + 0.7, t => H * (1 - t));
        if (big) this.coinArc(drop + 2, drop + 14, 2 + H, 6); else this.coinArc(drop + 1, drop + 7, 1, 4);
        this.dec({ type: 'cone', x: x - 2 });
        return L + 16;
      }
      case 'bridge': {
        const L = 34 + r() * 18;
        this.flatten(x, x + L, 10);
        const deck = this.heightAt(x), depth = 5 + r() * 2;
        const [a, b] = this.range(x - 6, x + L + 6);
        for (let i = a; i <= b; i++) {
          const xx = TX0 + i * DX, t = clamp((xx - (x - 6)) / (L + 12), 0, 1);
          this.hv[i] = this.h[i] - depth * Math.pow(Math.sin(t * Math.PI), 0.6);
        }
        this.setSurf(x - 1, x + L + 1, 5);
        this.bridges.push({ x0: x, x1: x + L, y: deck });
        this.waters.push({ x0: x - 6, x1: x + L + 6, y: deck - depth + 1.4, river: true });
        this.dec({ type: 'say', x: x - 10, say: 'bridge' });
        this.coinLine(x + 6, 6, 4);
        return L + 14;
      }
      case 'mud': {
        const L = 16 + r() * 14;
        this.add(x + 4, x + 4 + L, t => -(0.25 + diff * 0.15) * Math.sin(t * Math.PI));
        this.setSurf(x + 3, x + 5 + L, 2);
        this.waters.push({ x0: x + 4, x1: x + 4 + L, y: null, mud: true });
        this.dec({ type: 'say', x: x - 6, say: 'mud' });
        return L + 10;
      }
      case 'ice': case 'icefield': {
        const L = type === 'icefield' ? 50 + r() * 40 : 24 + r() * 26;
        if (type === 'icefield') this.flatten(x, x + L, 8);
        this.setSurf(x, x + L, 3);
        this.dec({ type: 'say', x: x - 4, say: 'ice' });
        this.coinLine(x + 4, 6, 3.5);
        return L + 6;
      }
      case 'hummocks': {
        const n = 2 + Math.floor(r() * 3); let cx = x + 6;
        for (let i = 0; i < n; i++) { const w = 1.4 + r(), hh = 0.28 + r() * 0.25; this.add(cx, cx + w, t => hh * Math.pow(Math.sin(t * Math.PI), 0.7)); this.dec({ type: 'shard', x: cx + w / 2, h: hh }); cx += w + 2.5 + r() * 3; }
        return cx - x + 4;
      }
      case 'snowdrift': {
        const w = 3 + r() * 2, hh = 0.45 + r() * 0.35;
        this.add(x + 4, x + 4 + w, t => hh * Math.sin(t * Math.PI));
        this.setSurf(x + 3, x + 5 + w, 4);
        return w + 10;
      }
      case 'logs': {
        const n = 1 + Math.floor(r() * 2); let cx = x + 5;
        for (let i = 0; i < n; i++) { const rr = 0.2 + r() * 0.06; this.add(cx - rr, cx + rr, t => rr * Math.sqrt(Math.max(0, 1 - (t * 2 - 1) * (t * 2 - 1)))); this.dec({ type: 'log', x: cx, r: rr }); cx += 2.5 + r() * 3; }
        return cx - x + 4;
      }
      case 'rocks': {
        const n = 1 + Math.floor(r() * 2); let cx = x + 5;
        for (let i = 0; i < n; i++) { const w = 1.3, hh = 0.32 + r() * 0.16; this.add(cx - w / 2, cx + w / 2, t => hh * Math.pow(Math.sin(t * Math.PI), 0.8)); this.dec({ type: 'sprite', img: 'rock', x: cx, sink: 0.08, scale: hh / 0.62 }); cx += 3 + r() * 4; }
        return cx - x + 4;
      }
    }
    return 10;
  }
  // гаишник: знак 60, будка, машина ДПС
  gai(x) {
    this.flatten(x - 30, x + 12, 8); this.occupy(x - 50, x + 16);
    this.dec({ type: 'sprite', img: 'sign_speed', x: x - 42, back: true });
    this.dec({ type: 'sprite', img: 'booth', x: x + 5, back: true, depth: 1 });
    this.dec({ type: 'sprite', img: 'dpscar', x: x - 4, back: true, depth: 1 });
    this.ent({ type: 'gai', x: x + 1, done: false });
  }
  azs(x) {
    this.flatten(x - 6, x + 8, 6); this.occupy(x - 8, x + 10);
    this.dec({ type: 'sprite', img: 'sign_gas', x: x - 26, back: true });
    this.dec({ type: 'sprite', img: 'azs', x: x, back: true, depth: 1 });
    this.ent({ type: 'canister', x: x + 2, y: this.heightAt(x + 2) + 1.3 });
  }
}
function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

// построение трассы рейса
function buildRoute(route) {
  const g = route.gen, diff = (route.id - 1) / 11;
  const T = new Terrain({ seed: route.id * 977 + 13, len: route.len, gen: g, themeAt: () => route.theme });
  T.extendBase(route.len + 140);
  const r = T.rng;
  let x = 70;
  // сначала — посты ДПС и коровы в свободных местах
  const placeN = (n, fn, from, to) => { for (let i = 0; i < n; i++) { for (let tries = 0; tries < 30; tries++) { const px = from + r() * (to - from); if (T.free(px - 60, px + 30)) { fn(px); break; } } } };
  placeN(g.gai || 0, px => T.gai(px), 200, route.len - 120);
  placeN(g.cows || 0, px => { T.flatten(px - 8, px + 8, 6); T.occupy(px - 60, px + 14); T.dec({ type: 'sprite', img: 'sign_cow', x: px - 50, back: true }); T.ent({ type: 'cow', x: px }); }, 130, route.len - 90);
  placeN(g.moose || 0, px => { T.flatten(px - 6, px + 6, 6); T.occupy(px - 60, px + 12); T.dec({ type: 'sprite', img: 'sign_animals', x: px - 55, back: true }); T.ent({ type: 'moose', x: px }); }, 150, route.len - 90);
  placeN(g.bear || 0, px => { T.occupy(px - 10, px + 10); T.ent({ type: 'bear', x: px }); }, 150, route.len - 90);
  placeN(g.babushka || 0, px => { T.flatten(px - 4, px + 4, 5); T.occupy(px - 6, px + 6); T.dec({ type: 'sprite', img: 'busstop', x: px, back: true, depth: 1 }); T.ent({ type: 'babushka', x: px + 1.2 }); }, 100, route.len - 80);
  placeN(g.dog || 0, px => { T.ent({ type: 'dog', x: px }); }, 90, route.len - 80);
  placeN(1, px => { T.flatten(px - 5, px + 5, 6); T.occupy(px - 8, px + 8); T.dec({ type: 'sprite', img: 'cafe', x: px, back: true, depth: 1 }); }, 150, route.len - 150);
  // АЗС и канистры
  for (let cx = g.cans * 0.8; cx < route.len - 80; cx += g.cans * (0.85 + r() * 0.3)) {
    if (r() < 0.35 && T.free(cx - 12, cx + 12)) T.azs(cx);
    else T.ent({ type: 'canister', x: cx, y: T.heightAt(cx) + 1.3 });
  }
  // рельеф
  while (x < route.len - 90) {
    const gap = g.gap[0] + r() * (g.gap[1] - g.gap[0]);
    const type = pick2(r, g.feat);
    if (!T.free(x - 10, x + 40)) { x += 20; continue; }
    const L = T.feature(type, x, diff);
    T.occupy(x - 4, x + L);
    x += L + gap * (0.6 + r() * 0.4);
  }
  // бонусы
  const nCoinsLines = Math.round(route.len / 140 * g.coins);
  for (let i = 0; i < nCoinsLines; i++) { const cx = 60 + r() * (route.len - 140); if (T.free(cx, cx + 20)) T.coinLine(cx, 5 + Math.floor(r() * 4), 2.6); }
  const special = [];
  if (route.id >= 2) special.push('wrench');
  if (route.id >= 4) special.push('wrench');
  special.push('cheburek'); if (route.id >= 3) special.push('magnet'); if (route.id >= 6) special.push('cheburek');
  special.forEach((t, i) => { const cx = route.len * (0.2 + 0.65 * (i + r() * 0.8) / special.length); T.ent({ type: t, x: cx, y: T.heightAt(cx) + 1.4 }); });
  // декор
  decorate(T, 0, route.len, route);
  T.dec({ type: 'city', x: -6, text: route.from.toUpperCase(), start: true });
  T.dec({ type: 'city', x: route.len, text: route.to.toUpperCase(), finish: true });
  T.dec({ type: 'sprite', img: 'warehouse', x: route.len + 26, back: true, depth: 1 });
  T.decor.sort((a, b) => a.x - b.x); T.ents.sort((a, b) => a.x - b.x);
  return T;
}
function pick2(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function decorate(T, x0, x1, route) {
  const r = T.rng;
  for (let x = Math.ceil(x0 / 100) * 100; x < x1; x += 100) if (x > 0) T.dec({ type: 'km', x, km: route ? Math.round(x / route.len * route.km) : Math.round(x / 10) });
  for (let x = x0 + 60 + r() * 60; x < x1 - 40; x += 120 + r() * 120) {
    if (!T.free(x - 3, x + 3)) continue;
    T.dec({ type: 'sprite', img: pick2(r, ADS), x, back: true, depth: 1 });
  }
  // столбы ЛЭП в степи
  for (let x = x0 + 30; x < x1; x += 90 + r() * 40) if (T.themeAt(x) === 'steppe' && r() < 0.6) T.dec({ type: 'sprite', img: 'tower', x, back: true, depth: 2, scale: 0.9 });
}

// бесконечный рейс: зоны сменяются каждые 700 м, сложность растёт
const ENDLESS_ZONE = 700;
function endlessTheme(x) { return THEME_ORDER[Math.floor(Math.max(0, x) / ENDLESS_ZONE) % THEME_ORDER.length]; }
function buildEndless() {
  const T = new Terrain({ seed: (Date.now() & 0xffff) + 7, endless: true, themeAt: endlessTheme, hillAt: x => 2.2 + Math.min(5, x / 900) });
  T.extendBase(260);
  T.cursor = 70; T.decorTo = 0; T.nextCan = 220;
  T.dec({ type: 'city', x: -6, text: 'МОСКВА', start: true });
  extendEndless(T, 400);
  return T;
}
const ENDLESS_FEATS = {
  summer: ['potholes', 'bumps', 'hill', 'ramp_small', 'ramp', 'logs', 'speedbumps'],
  volga: ['potholes', 'hill', 'ramp', 'bridge', 'gap', 'logs'],
  ural: ['climb', 'rocks', 'hill', 'ramp', 'potholes'],
  steppe: ['mud', 'washboard', 'ramp', 'gap', 'bumps'],
  taiga: ['hill', 'snowdrift', 'ice', 'ramp', 'logs', 'climb'],
  baikal: ['ice', 'icefield', 'hummocks', 'ramp', 'gap', 'snowdrift'],
  primorye: ['climb', 'gap', 'ramp', 'potholes', 'rocks', 'bridge', 'hill']
};
function extendEndless(T, toX) {
  if (T.cursor >= toX) return;
  T.extendBase(toX + 160);
  const r = T.rng;
  while (T.cursor < toX) {
    const x = T.cursor, th = endlessTheme(x), diff = Math.min(1, x / 6000);
    const roll = r();
    if (roll < 0.07 && x > 200) { T.gai(x + 40); T.cursor += 80; continue; }
    if (roll < 0.14 && (th === 'summer' || th === 'steppe' || th === 'primorye' || th === 'volga')) { T.flatten(x + 30, x + 46, 6); T.dec({ type: 'sprite', img: 'sign_cow', x: x - 10, back: true }); T.ent({ type: 'cow', x: x + 38 }); T.cursor += 70; continue; }
    if (roll < 0.19 && (th === 'taiga' || th === 'baikal')) { T.flatten(x + 30, x + 42, 6); T.dec({ type: 'sprite', img: 'sign_animals', x: x - 10, back: true }); T.ent({ type: r() < 0.5 ? 'moose' : 'bear', x: x + 36 }); T.cursor += 70; continue; }
    const type = pick2(r, ENDLESS_FEATS[th]);
    const L = T.feature(type, x, diff);
    T.occupy(x - 4, x + L);
    T.cursor += L + (40 - diff * 12) * (0.6 + r() * 0.5);
  }
  while (T.nextCan < toX) {
    const cx = T.nextCan;
    if (T.free(cx - 10, cx + 10) && r() < 0.3) T.azs(cx); else T.ent({ type: 'canister', x: cx, y: T.heightAt(cx) + 1.3 });
    if (r() < 0.25) { const sx = cx + 60 + r() * 60; T.ent({ type: pick2(r, ['wrench', 'cheburek', 'magnet']), x: sx, y: T.heightAt(sx) + 1.4 }); }
    T.nextCan += 230 + Math.min(120, cx / 60) + r() * 60;
  }
  for (let i = 0; i < 3; i++) { const cx = T.decorTo + r() * (toX - T.decorTo); if (T.free(cx, cx + 20)) T.coinLine(cx, 6, 2.6); }
  decorate(T, T.decorTo, toX, null);
  T.decorTo = toX;
  T.decor.sort((a, b) => a.x - b.x); T.ents.sort((a, b) => a.x - b.x);
}
