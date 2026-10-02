// =====================================================================
//  МИР И ИГРОВАЯ ЛОГИКА: рейс, груз, топливо, трюки, коровы, ДПС
// =====================================================================
'use strict';
const G = {
  state: 'menu', paused: false, mode: 'route', route: null, T: null, truck: null, time: 0, endT: 0,
  cargo: 100, fuel: 40, fuelCap: 40, coins: 0, coinN: 0, stunts: 0, fines: 0, finesN: 0, polite: 0, cowhits: 0,
  airT: 0, rot: 0, wheelieT: 0, boostT: 0, magnetT: 0, doorT: 0, doorAng: 0, dmgCd: 0, lastImpact: 0,
  particles: [], items: [], popups: [], hints: [], maxX: 0, maxV: 0, stuckT: 0, lowFuelSaid: false, chanceUsed: false,
  sayCd: 0, idleT: 0, mood: 'norm', moodT: 0, bubble: null, endReason: '', finished: false, resultShown: false,
  cam: { x: 0, y: 0, ppm: 30, yAvg: 0, shake: 0, zoom: 1 }, theme: 'summer', themePrev: null, themeMix: 1,
  slowmo: 1, flash: 0, ctl: { gas: 0, brake: 0 }, horn: false, hornCd: 0, distBest: 0, wheelieSaid: false
};
const MAX_PARTICLES = 380;

function surfColorDust(s, theme) {
  if (s === 2) return [74, 56, 32]; if (s === 3) return [220, 240, 255]; if (s === 4) return [235, 242, 252];
  if (theme === 'steppe') return [190, 165, 110]; if (theme === 'volga') return [170, 130, 80]; return [150, 130, 100];
}
function spawn(p) {
  if (G.particles.length >= MAX_PARTICLES) G.particles.shift();
  G.particles.push(Object.assign({ life: 1, t: 0, vx: 0, vy: 0, g: 0, size: 0.2, grow: 0, drag: 0.5, rot: 0, vr: 0 }, p));
}
function popup(text, x, y, color, big) {
  G.popups.push({ text, x, y, t: 0, life: big ? 2.2 : 1.5, color: color || '#ffd23a', big: !!big });
  if (G.popups.length > 14) G.popups.shift();
}
function say(cat, mood, force) {
  if (!force && G.sayCd > 0) return;
  const list = SAY[cat]; if (!list) return;
  const text = pick(list);
  G.bubble = { text, t: 0, life: Math.max(2.4, text.length * 0.07) };
  G.sayCd = 3.2; G.idleT = 0;
  setMood(mood || 'norm', 2.2);
  FX.voice(text, mood);
}
function setMood(m, t) { G.mood = m; G.moodT = t || 2; }
function hintBanner(text, dur) { const h = $('hint'); h.textContent = text; h.classList.add('show'); clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove('show'), (dur || 3.2) * 1000); }

// ---------------- старт рейса ----------------
function startRun(mode, route) {
  stopLoop(); closeAllOverlays();
  G.mode = mode; G.route = route || null; G.endlessCargo = pick(Object.keys(CARGO));
  G.T = mode === 'endless' ? buildEndless() : buildRoute(route);
  G.theme = mode === 'endless' ? endlessTheme(0) : route.theme; G.themePrev = null; G.themeMix = 1;
  G.fuelCap = UPG.tank.cap[SAVE.up.tank]; G.fuel = G.fuelCap;
  G.truck = new Truck(truckParams(true)); G.truck.place(G.T, 0);
  Object.assign(G, {
    state: 'intro', paused: false, time: 0, endT: 0, cargo: 100, coins: 0, coinN: 0, stunts: 0, fines: 0, finesN: 0, polite: 0, cowhits: 0,
    airT: 0, rot: 0, wheelieT: 0, boostT: 0, magnetT: 0, doorT: 0, doorAng: 0, dmgCd: 0, particles: [], items: [], popups: [], maxX: 0, maxV: 0,
    stuckT: 0, lowFuelSaid: false, chanceUsed: false, sayCd: 0, idleT: 0, mood: 'norm', moodT: 0, bubble: null, endReason: '', finished: false, resultShown: false,
    slowmo: 1, flash: 0, introT: 0, horn: false, hornCd: 0, wheelieSaid: false, finishT: 0, crashT: 0, lostItems: 0
  });
  G.cam.x = 4; G.cam.y = G.truck.y + 2; G.cam.yAvg = G.cam.y; G.cam.zoom = 1; G.cam.shake = 0;
  // обучение в первом рейсе
  G.hints = [];
  if (mode === 'route' && route.id === 1) {
    G.hints = [
      { x: -1, text: 'Жми ГАЗ справа — Серёга поедет!' },
      { x: 30, text: 'ТОРМОЗ слева. Если стоишь — это задний ход.' },
      { x: 150, text: 'В воздухе: газ задирает нос, тормоз опускает.' },
      { x: 240, text: 'Канистры с бензином — не пропускай!' }
    ];
  }
  if (mode === 'route') {
    const firstCow = G.T.ents.find(e => e.type === 'cow'); if (firstCow && route.id <= 2) G.hints.push({ x: firstCow.x - 60, text: 'Корова на дороге! Жми СИГНАЛ — она уйдёт.' });
    const firstGai = G.T.ents.find(e => e.type === 'gai'); if (firstGai && route.id <= 2) G.hints.push({ x: firstGai.x - 70, text: 'Пост ДПС! Сбавь скорость до 60 км/ч.' });
    G.hints.sort((a, b) => a.x - b.x);
  }
  clearInput();
  showScreen('game'); updateHUD(true);
  $('hud-route').textContent = mode === 'endless' ? 'Бесконечный рейс' : route.from + ' — ' + route.to;
  $('stuck-btn').classList.remove('show');
  FX.engineStart();
  radioMusic(); showRadioTicker(true);
  metrika('gameStart', { mode, route: route ? route.id : 0 });
  startLoop();
  G.introT = 0;
  FX.countdown(false);
}

// ---------------- обновление ----------------
function update(dt) {
  if (G.state === 'menu') return;
  dt *= G.slowmo;
  G.time += dt;
  const T = G.T, tr = G.truck;
  if (G.mode === 'endless') { if (tr.x + 260 > T.cursor) extendEndless(T, T.cursor + 300); updateEndlessTheme(); }
  // управление
  let ctl = { gas: G.ctl.gas, brake: G.ctl.brake };
  if (G.state === 'intro') { G.introT += dt; ctl = { gas: 0, brake: 1 }; if (G.introT > 0.9) { G.state = 'play'; say('start', 'happy', true); FX.countdown(true); if (G.hints.length && G.hints[0].x < 0) { hintBanner(G.hints[0].text, 4); G.hints.shift(); } } }
  if (G.state === 'finish') ctl = { gas: 0, brake: 1 };
  if (G.state === 'crash' || G.state === 'over') ctl = { gas: 0, brake: 0 };
  if (G.fuel <= 0) ctl.gas = 0;
  tr.p.fuelOk = G.fuel > 0;
  tr.boost = G.boostT;
  // физика мелкими шагами
  const sub = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / sub;
  let imp = 0, scrape = 0, sparkAt = null;
  for (let i = 0; i < sub; i++) {
    tr.step(h, ctl, T);
    if (tr.impact > imp) imp = tr.impact;
    if (tr.scrape > scrape) { scrape = tr.scrape; sparkAt = tr.sparkAt; }
  }
  const spd = tr.speed, kmh = Math.abs(spd) * 3.6;
  G.maxV = Math.max(G.maxV, kmh);
  if (tr.x > G.maxX) G.maxX = tr.x;
  // топливо
  if (G.state === 'play') {
    G.fuel = Math.max(0, G.fuel - dt * (0.05 + 0.82 * Math.max(ctl.gas, ctl.brake * 0.4)) * (G.boostT > 0 ? 1.4 : 1));
    if (G.fuel < G.fuelCap * 0.18 && !G.lowFuelSaid) { G.lowFuelSaid = true; say('fuellow', 'scared', true); }
  }
  G.boostT = Math.max(0, G.boostT - dt); G.magnetT = Math.max(0, G.magnetT - dt);
  G.sayCd -= dt; G.idleT += dt; G.moodT -= dt; if (G.moodT <= 0) G.mood = G.boostT > 0 ? 'cool' : 'norm';
  G.hornCd -= dt; G.dmgCd -= dt;
  if (G.bubble) { G.bubble.t += dt; if (G.bubble.t > G.bubble.life) G.bubble = null; }
  if (G.idleT > 28 && G.state === 'play') say('idle', 'norm');
  // подсказки
  while (G.hints.length && tr.x > G.hints[0].x) { hintBanner(G.hints[0].text, 4); G.hints.shift(); }
  // удары и груз
  if (imp > 2.5) onImpact(imp, tr);
  if (scrape > 2.5 && sparkAt) {
    for (let i = 0; i < 2; i++) spawn({ kind: 'spark', x: sparkAt[0], y: sparkAt[1], vx: -spd * 0.3 + rnd(-3, 3), vy: rnd(1, 4), g: -14, life: rnd(0.25, 0.5), size: 0.06 });
  }
  FX.engineSet(clamp(Math.abs(tr.w[0].spin) * TRUCK.wheelR / (tr.p.vmax) * 1.3 + ctl.gas * 0.25, 0, 1.6), G.state === 'play' ? ctl.gas : 0, Math.abs(spd), scrape > 2.5 ? scrape : 0);
  // полёт, сальто, «на дыбы»
  const inAir = !tr.grounded && !tr.contactHull;
  if (inAir && G.state === 'play') {
    if (G.airT === 0) G.rot = 0;
    G.airT += dt; G.rot += tr.va * dt;
    if (G.airT > 0.7 && G.airT - dt <= 0.7) say('air', 'scared');
  } else if (G.airT > 0) {
    const air = G.airT; G.airT = 0;
    if (G.state === 'play') {
      const flips = Math.floor((Math.abs(G.rot) + 0.9) / (Math.PI * 2));
      const upright = Math.cos(tr.a) > 0.6 && !tr.fatal;
      if (flips >= 1 && upright) {
        const b = 600 * flips; G.stunts += b; SAVE.st.flips += flips;
        popup((flips > 1 ? flips + '× ' : '') + 'САЛЬТО! +' + fmt(b) + ' ₽', tr.x, tr.y + 3.5, '#ff6a3a', true);
        FX.stunt(); say('flip', 'happy', true); unlock('flip'); haptic('medium'); G.flash = 0.35;
      } else if (air > 1.0) {
        const b = Math.round(air * air * 90 / 10) * 10; G.stunts += b;
        popup('ПОЛЁТ ' + air.toFixed(1) + ' с  +' + b + ' ₽', tr.x, tr.y + 3.2, '#7ae0ff');
        FX.popup();
      }
      if (air > 2) unlock('air2');
      SAVE.st.airMax = Math.max(SAVE.st.airMax, air);
    }
  }
  const wheelie = tr.w[0].contact && !tr.w[1].contact && !tr.contactHull && tr.a > 0.12 && spd > 2;
  if (wheelie && G.state === 'play') { G.wheelieT += dt; if (G.wheelieT > 1.2 && !G.wheelieSaid) { G.wheelieSaid = true; say('wheelie', 'happy'); } }
  else if (G.wheelieT > 0) {
    if (G.wheelieT > 1.2 && G.state === 'play') { const b = Math.round(G.wheelieT * 120 / 10) * 10; G.stunts += b; popup('НА ДЫБЫ! +' + b + ' ₽', tr.x, tr.y + 3.2, '#b0ff5a'); FX.popup(); if (G.wheelieT > 2) unlock('wheelie'); }
    G.wheelieT = 0; G.wheelieSaid = false;
  }
  if (kmh >= 110) unlock('speed');
  // пыль, брызги, выхлоп
  emitDriving(dt, tr, ctl);
  // двери будки
  if (G.doorT > 0) { G.doorT -= dt; G.doorAng = Math.min(1, G.doorAng + dt * 6); } else G.doorAng = Math.max(0, G.doorAng - dt * 3);
  // сущности на дороге
  updateEntities(dt, tr);
  updateItems(dt);
  updateParticles(dt);
  // смерть, финиш, застревание
  checkEnd(dt, tr, ctl);
  updateCamera(dt);
  updateHUD(false);
}

function onImpact(imp, tr) {
  const strong = imp - G.lastImpact > 2 || G.dmgCd <= 0;
  if (!strong) return;
  G.dmgCd = 0.3; G.lastImpact = imp;
  setTimeout(() => { G.lastImpact = 0; }, 300);
  G.cam.shake = Math.min(1.2, G.cam.shake + imp * 0.06);
  if (imp > 4) { FX.land(imp); haptic(imp > 8 ? 'heavy' : 'medium'); } else FX.bump(imp);
  // облако пыли при приземлении
  const [gx] = tr.toWorld(0, 0), gy = G.T.heightAt(gx), col = surfColorDust(G.T.surfAt(gx), G.theme);
  for (let i = 0; i < Math.min(14, imp * 1.5); i++) spawn({ kind: 'dust', x: gx + rnd(-3, 3), y: gy + 0.1, vx: rnd(-3, 3), vy: rnd(0.3, 2), life: rnd(0.6, 1.2), size: rnd(0.3, 0.7), grow: 1.2, col });
  if (imp > 6) say('land', 'scared');
  if (G.state !== 'play') return;
  const cg = curCargo();
  const dmgK = UPG.susp.dmg[SAVE.up.susp] * UPG.lock.dmg[SAVE.up.lock] * cg.frag;
  if (imp > 3.4) {
    const dmg = Math.pow(imp - 3.4, 1.15) * 1.15 * dmgK;
    damageCargo(dmg);
    if (dmg > 1) popup('Груз −' + Math.round(dmg) + '%', tr.x - 1, tr.y + 2.6, '#ff8a7a');
  }
  if (imp > 6.5 && Math.random() < 0.6 * UPG.lock.door[SAVE.up.lock] && G.doorT <= 0) openDoors(imp > 10 ? 2 : 1);
}
function curCargo() { return CARGO[G.route ? G.route.cargo : G.endlessCargo] || CARGO.watermelon; }
function damageCargo(d) {
  if (G.state !== 'play') return;
  G.cargo = Math.max(0, G.cargo - d);
}
function openDoors(n) {
  G.doorT = 1.3; FX.door();
  const tr = G.truck, cg = curCargo();
  say('lost', 'scared', true);
  for (let i = 0; i < n; i++) {
    const [hx, hy] = tr.toWorld(-3.15, 1.4 + i * 0.4);
    const img = pick(cg.items);
    G.items.push({ img, x: hx, y: hy, vx: tr.vx * 0.4 - rnd(1.5, 4), vy: tr.vy * 0.5 + rnd(1.5, 4), rot: 0, vr: rnd(-6, 6), t: 0, life: 6, size: (cg.single ? cg.size * 0.8 : cg.size) * rnd(0.85, 1.1), mode: cg.eject, splat: cg.splat, sound: cg.sound, bounces: 0, frame: 0 });
    damageCargo(rnd(3, 5));
    G.lostItems++;
  }
  popup('Груз выпал!', tr.x - 3, tr.y + 3, '#ff6a5a', true);
}

function emitDriving(dt, tr, ctl) {
  const spd = tr.speed;
  // выхлоп
  const [ex, ey] = tr.toWorld(-0.48, 0.46);
  if (Math.random() < (0.25 + ctl.gas * 0.8) * dt * 30) {
    const black = ctl.gas > 0.5 && Math.abs(spd) < 12;
    spawn({ kind: 'smoke', x: ex, y: ey, vx: -Math.cos(tr.a) * 1.5 + tr.vx * 0.3, vy: 0.6 + Math.random(), life: rnd(0.7, 1.4), size: rnd(0.15, 0.3), grow: 0.9, col: black ? [40, 40, 44] : [170, 170, 175], a0: black ? 0.55 : 0.35 });
  }
  if (G.boostT > 0) for (let i = 0; i < 2; i++) spawn({ kind: 'flame', x: ex, y: ey, vx: -Math.cos(tr.a) * rnd(4, 8) + tr.vx * 0.6, vy: rnd(-0.5, 0.5), life: rnd(0.15, 0.3), size: rnd(0.15, 0.3), grow: -0.3 });
  // пыль из-под колёс
  for (const w of tr.w) {
    if (!w.contact) continue;
    const slip = Math.abs(w.slip), col = surfColorDust(w.surf, G.theme);
    const rate = (Math.abs(spd) > 3 ? 0.4 : 0) + slip * 0.5;
    if (Math.random() < rate * dt * 20) {
      const kind = w.surf === 2 ? 'mud' : w.surf === 3 || w.surf === 4 ? 'snowp' : 'dust';
      spawn({ kind, x: w.cx - 0.3, y: w.cy - TRUCK.wheelR + 0.05, vx: -Math.sign(w.spin || 1) * rnd(1, 3) - spd * 0.1, vy: rnd(0.5, kind === 'mud' ? 3.5 : 1.8), g: kind === 'dust' ? 0.2 : -9, life: rnd(0.5, 1), size: kind === 'dust' ? rnd(0.2, 0.45) : rnd(0.07, 0.14), grow: kind === 'dust' ? 1 : 0, col });
    }
  }
  // брызги в воде
  G.T.waters.forEach(wt => {
    if (wt.y === null || tr.x < wt.x0 - 3 || tr.x > wt.x1 + 3) return;
    tr.w.forEach(w => { if (w.cy - TRUCK.wheelR < wt.y && w.cx > wt.x0 && w.cx < wt.x1 && Math.abs(spd) > 2 && Math.random() < 0.6) spawn({ kind: 'water', x: w.cx, y: wt.y, vx: rnd(-3, 1) - spd * 0.15, vy: rnd(2, 5), g: -12, life: rnd(0.4, 0.8), size: rnd(0.06, 0.12) }); });
  });
}

// ---------------- сущности ----------------
function truckLocal(x, y) {
  const tr = G.truck, c = Math.cos(tr.a), s = Math.sin(tr.a), dx = x - tr.x, dy = y - tr.y;
  return [dx * c + dy * s + TRUCK.com[0], -dx * s + dy * c + TRUCK.com[1]];
}
function hitsTruck(x, y, pad) {
  const [lx, ly] = truckLocal(x, y);
  return lx > -3.15 - pad && lx < 2.98 + pad && ly > 0.3 - pad && ly < 2.75 + pad;
}
function updateEntities(dt, tr) {
  const ents = G.T.ents, x0 = tr.x - 60, x1 = tr.x + 90;
  for (let i = 0; i < ents.length; i++) {
    const e = ents[i];
    if (e.x < x0 && e.type !== 'dog' && e.type !== 'cow' && e.type !== 'moose') continue;
    if (e.x > x1) break;
    if (e.dead) continue;
    e.t = (e.t || 0) + dt;
    switch (e.type) {
      case 'coin': case 'canister': case 'wrench': case 'cheburek': case 'magnet': {
        if (G.state !== 'play' && G.state !== 'finish') break;
        if (e.type === 'coin' && G.magnetT > 0 && Math.abs(e.x - tr.x) < 14) { const dx = tr.x - e.x, dy = tr.y + 0.6 - e.y, d = Math.hypot(dx, dy) || 1; e.x += dx / d * Math.min(d, 22 * dt); e.y += dy / d * Math.min(d, 22 * dt); }
        if (hitsTruck(e.x, e.y, 0.35)) collect(e);
        break;
      }
      case 'cow': updateCow(e, dt, tr); break;
      case 'moose': updateMoose(e, dt, tr); break;
      case 'bear': updateBear(e, dt, tr); break;
      case 'dog': updateDog(e, dt, tr); break;
      case 'babushka': if (!e.said && tr.x > e.x - 25) { e.said = true; say('babushka', 'happy'); } e.frame = (tr.x > e.x - 30 && tr.x < e.x + 10) ? (Math.floor(e.t * 3) % 2) : 0; break;
      case 'gai': updateGai(e, dt, tr); break;
    }
  }
}
function collect(e) {
  e.dead = true;
  const tr = G.truck;
  switch (e.type) {
    case 'coin': { const v = G.mode === 'endless' ? 10 : 10 + (G.route.id - 1) * 2; G.coins += v; G.coinN++; FX.coin(); for (let i = 0; i < 5; i++) spawn({ kind: 'star', x: e.x, y: e.y, vx: rnd(-2, 2), vy: rnd(-1, 3), life: 0.5, size: 0.12 }); break; }
    case 'canister': G.fuel = Math.min(G.fuelCap, G.fuel + Math.max(20, G.fuelCap * 0.42)); G.lowFuelSaid = false; FX.fuel(); popup('+ бензин', e.x, e.y + 1, '#ffb03a'); say('fuel', 'happy'); haptic('light'); break;
    case 'wrench': { const add = Math.min(100 - G.cargo, 18); G.cargo += add; FX.wrench(); popup('Груз +' + Math.round(add) + '%', e.x, e.y + 1, '#8aff6a'); say('wrench', 'happy'); haptic('light'); break; }
    case 'cheburek': G.boostT = 4.2; FX.boost(); popup('ЧЕБУРЕК! ТУРБО!', e.x, e.y + 1.2, '#ffcf3a', true); say('boost', 'cool', true); setMood('cool', 4.2); haptic('medium'); break;
    case 'magnet': G.magnetT = 10; FX.magnet(); popup('МАГНИТ!', e.x, e.y + 1, '#ff5a5a', true); say('magnet', 'happy'); haptic('light'); break;
  }
}
function honk() {
  if (G.hornCd > 0 || G.state !== 'play') return;
  G.hornCd = SAVE.horn === 'cuca' ? 1.9 : SAVE.horn === 'train' ? 1.1 : 0.6;
  FX.horn(); haptic('light');
  const tr = G.truck;
  G.T.ents.forEach(e => {
    if (e.type === 'cow' && !e.state && e.x > tr.x - 2 && e.x - tr.x < 45) { e.state = 'leave'; e.st = 0; setTimeout(() => FX.moo(0.9 + Math.random() * 0.2), 250); SAVE.st.shoo++; if (SAVE.st.shoo >= 5) unlock('shoo'); setTimeout(() => say('shoo', 'happy', true), 600); }
    if (e.type === 'dog' && e.state === 'run') e.state = 'scared';
  });
  if (Math.random() < 0.3) say('horn', 'happy');
  spawn({ kind: 'note', x: tr.x + 3, y: tr.y + 1.5, vx: 2, vy: 1.5, life: 0.8, size: 0.35 });
}
function updateCow(e, dt, tr) {
  e.frame = e.frame || 0;
  if (!e.state) {
    e.frame = Math.floor(e.t * 0.7) % 3 === 0 ? 0 : 0;
    if (!e.warned && e.x - tr.x < 48 && e.x > tr.x) { e.warned = true; say('cow', 'scared', true); FX.moo(1); }
    if (G.state === 'play' && hitsTruck(e.x - 1.2, G.T.heightAt(e.x) + 1.0, 0.05)) {
      e.state = 'hit'; e.st = 0;
      const v = tr.speed;
      if (v > 0) { tr.vx *= 0.3; tr.vy += 1.5; }
      G.cam.shake = 1; FX.thud(); FX.moo(1.3); haptic('heavy');
      damageCargo(6 * UPG.lock.dmg[SAVE.up.lock]); G.fines += 300; G.cowhits++;
      popup('Компенсация фермеру −300 ₽', e.x, G.T.heightAt(e.x) + 3, '#ff7a6a', true);
      say('cowhit', 'scared', true); unlock('cowhit');
      e.vx = Math.max(6, v * 0.9); e.vy = 7;
    }
  } else if (e.state === 'leave') {
    e.st += dt; e.frame = 1 + Math.floor(e.st * 4) % 2; e.depth = Math.min(1, e.st / 2.2);
    if (e.st > 2.4) e.dead = true;
  } else if (e.state === 'hit') {
    e.st += dt; e.frame = 3; e.x += e.vx * dt; e.vy -= 18 * dt; e.hy = (e.hy || 0) + e.vy * dt; e.spin = (e.spin || 0) + dt * 8; e.depth = Math.min(1, e.st / 1.4);
    if (e.st > 1.6) e.dead = true;
  }
}
function updateMoose(e, dt, tr) {
  if (!e.state) { e.depth = 1; if (e.x - tr.x < 55) { e.state = 'in'; e.st = 0; say('moose', 'scared', true); } return; }
  e.st += dt; e.frame = 1 + Math.floor(e.st * 3.5) % 2;
  if (e.state === 'in') { e.depth = Math.max(0, 1 - e.st / 1.6); if (e.st > 1.6) { e.state = 'stand'; e.st = 0; } }
  else if (e.state === 'stand') { e.depth = 0; e.frame = 0; if (e.st > 2.4 || tr.x > e.x + 3) { e.state = 'out'; e.st = 0; } }
  else if (e.state === 'out') { e.depth = -Math.min(1, e.st / 1.6); if (e.st > 1.7) e.dead = true; }
  if (Math.abs(e.depth) < 0.35 && G.state === 'play' && !e.hit && hitsTruck(e.x - 1.3, G.T.heightAt(e.x) + 1.4, 0.05)) {
    e.hit = true; if (tr.speed > 0) { tr.vx *= 0.2; tr.vy += 2; } G.cam.shake = 1.2; FX.thud(); FX.crash(); haptic('heavy');
    damageCargo(10 * UPG.lock.dmg[SAVE.up.lock]); popup('Лось недоволен! Груз −10%', e.x, G.T.heightAt(e.x) + 3.5, '#ff7a6a', true); say('cowhit', 'scared', true);
    e.state = 'out'; e.st = 0;
  }
}
function updateBear(e, dt, tr) {
  e.frame = e.stole ? 1 : 0;
  if (!e.growl && Math.abs(e.x - tr.x) < 25) { e.growl = true; FX.bear(); say('bear', 'scared', true); }
  if (!e.done && Math.abs(tr.x - e.x) < 4 && G.state === 'play') {
    if (Math.abs(tr.speed) < 6.5) { e.done = true; e.stole = true; damageCargo(10); popup('Медведь стащил груз! −10%', e.x, G.T.heightAt(e.x) + 3.5, '#ff7a6a', true); FX.bear(); say('bear', 'scared', true); unlock('bear'); e.run = 1; }
  }
  if (!e.done && tr.x > e.x + 5) { e.done = true; say('bearok', 'happy'); }
  if (e.run) { e.x -= 5 * dt; e.depth = Math.min(1, (e.depth || 0) + dt * 0.6); if (e.depth >= 1) e.dead = true; }
}
function updateDog(e, dt, tr) {
  if (!e.state) { e.frame = 0; if (tr.x > e.x - 8) { e.state = 'run'; e.st = 0; say('dog', 'happy'); e.bx = e.x; } return; }
  e.st += dt; e.frame = Math.floor(e.st * 10) % 2;
  if (e.state === 'run') {
    const target = tr.x - 5 + Math.sin(e.st * 2) * 1.5, sp = 13;
    e.x += clamp(target - e.x, -sp * dt, sp * dt);
    if (Math.random() < dt * 1.5) { FX.bark(); spawn({ kind: 'text', text: 'ГАВ!', x: e.x + 0.6, y: G.T.heightAt(e.x) + 1.2, vy: 1, life: 0.7, size: 0.4 }); }
    if (e.st > 7 || tr.x - e.x > 25) { e.state = 'sit'; }
  } else if (e.state === 'scared') { e.x -= 8 * dt; e.depth = Math.min(1, (e.depth || 0) + dt); if (e.depth >= 1) e.dead = true; }
  else e.frame = 0;
}
function updateGai(e, dt, tr) {
  e.frame = e.fined ? 1 : 0;
  if (!e.warned && e.x - tr.x < 75 && e.x > tr.x) { e.warned = true; say('gaiwarn', 'scared', true); }
  if (tr.x > e.x - 22 && tr.x < e.x + 4) e.vmax = Math.max(e.vmax || 0, Math.abs(tr.speed) * 3.6);
  if (!e.done && tr.x > e.x + 4 && G.state === 'play') {
    e.done = true;
    if ((e.vmax || 0) > 64) {
      const fine = Math.min(5000, 500 + Math.round(((e.vmax - 60) * 25) / 100) * 100);
      G.fines += fine; G.finesN++; e.fined = true; SAVE.st.fines++;
      FX.whistle(); setTimeout(() => FX.siren(), 400); haptic('warning');
      popup('ШТРАФ ' + fmt(fine) + ' ₽ (' + Math.round(e.vmax) + ' км/ч)', e.x, G.T.heightAt(e.x) + 4, '#ff5a4a', true);
      say('fine', 'scared', true);
      if (SAVE.st.fines >= 3) unlock('fined');
    } else {
      G.stunts += 150; G.polite++; SAVE.st.polite++;
      popup('Вежливый водитель +150 ₽', e.x, G.T.heightAt(e.x) + 4, '#8aff6a');
      say('gaiok', 'happy', true); FX.popup();
      if (SAVE.st.polite >= 5) unlock('polite');
    }
  }
}

// ---------------- выпавший груз ----------------
function updateItems(dt) {
  const T = G.T;
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i]; it.t += dt;
    if (it.mode === 'fly' && it.bounces > 0) { it.vy += (it.vy < 4 ? 14 : 4) * dt; it.vx = lerp(it.vx, -3, dt); it.frame = Math.floor(it.t * 8) % 2; it.x += it.vx * dt; it.y += it.vy * dt; it.rot = lerp(it.rot, 0, dt * 4); if (it.t > it.life) G.items.splice(i, 1); continue; }
    if (it.mode === 'run' && it.bounces > 0) { it.x -= 7 * dt; it.y = T.heightAt(it.x) + it.size * 0.35; it.rot = 0; it.frame = Math.floor(it.t * 10) % 2; if (it.t > it.life) G.items.splice(i, 1); continue; }
    it.vy -= 16 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
    const gh = T.heightAt(it.x) + it.size * 0.4;
    if (it.y < gh) {
      it.y = gh;
      const hard = -it.vy;
      if (it.bounces === 0) playItemSound(it, hard);
      if ((it.mode === 'smash' || (it.mode === 'mixed' && /egg|pickles|tv/.test(it.img))) && hard > 3) { splat(it); G.items.splice(i, 1); continue; }
      if (it.img.startsWith('it_cat')) { it.mode = 'run'; it.img = 'it_cat0'; FX.meow(); it.bounces++; continue; }
      if (it.mode === 'fly') { it.bounces++; FX.honk(); it.vy = 5; continue; }
      it.vy = hard * (it.mode === 'bounce' ? 0.45 : it.mode === 'flop' ? 0.6 : 0.3);
      it.vx *= 0.7; it.vr = it.mode === 'roll' ? -it.vx / Math.max(0.2, it.size * 0.5) : it.vr * 0.6;
      it.bounces++;
      if (it.mode === 'flop') it.vr = rnd(-10, 10);
    }
    if (it.t > it.life) G.items.splice(i, 1);
  }
}
function playItemSound(it, hard) {
  const s = it.sound;
  if (s === 'splat') FX.splat(); else if (s === 'crack') FX.crack(); else if (s === 'glass') FX.glass(); else if (s === 'clang') FX.clang(); else if (s === 'bayan') FX.bayan(); else if (s === 'honk') FX.honk(); else FX.thud();
}
function splat(it) {
  const col = it.splat || '#ffd23a';
  const rgb = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let k = 0; k < 16; k++) spawn({ kind: 'chunk', x: it.x, y: it.y, vx: rnd(-4, 4) + it.vx * 0.3, vy: rnd(1, 6), g: -16, life: rnd(0.5, 1.1), size: rnd(0.06, 0.16), col: rgb });
  spawn({ kind: 'stain', x: it.x, y: G.T.heightAt(it.x) + 0.02, life: 6, size: it.size * 1.3, col: rgb });
  if (it.sound === 'crack') FX.crack(); else if (it.sound === 'glass') FX.glass(); else FX.splat();
}
function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i]; p.t += dt;
    if (p.t >= p.life) { G.particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.vx *= (1 - p.drag * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.size += p.grow * dt; p.rot += p.vr * dt;
    if ((p.kind === 'mud' || p.kind === 'water' || p.kind === 'snowp' || p.kind === 'chunk' || p.kind === 'spark') && p.y < G.T.heightAt(p.x)) { p.y = G.T.heightAt(p.x); p.vy *= -0.2; p.vx *= 0.5; }
  }
  for (let i = G.popups.length - 1; i >= 0; i--) { const p = G.popups[i]; p.t += dt; if (p.t > p.life) G.popups.splice(i, 1); }
}

// ---------------- камера ----------------
function camPPM() { return Math.min(APPW / (LAND ? 23 : 15), APPH / (LAND ? 9.5 : 10)); }
function updateCamera(dt) {
  const tr = G.truck, c = G.cam, sp = tr.speed;
  c.zoom = lerp(c.zoom, 1 - (LAND ? 0.2 : 0.26) * clamp(Math.abs(sp) / 26, 0, 1) - (G.airT > 0.4 ? 0.08 : 0), 1 - Math.exp(-dt * 1.5));
  c.ppm = camPPM() * c.zoom;
  const W = APPW / c.ppm, H = APPH / c.ppm;
  const look = LAND ? clamp(sp * 0.3, -3, 6) : clamp(sp * 0.14, -1.5, 2.6);
  const tx = tr.x + W * (0.5 - (LAND ? 0.32 : 0.36)) + look;
  const ty = tr.y + H * (0.6 - 0.5) * (LAND ? 0.7 : 1) + (LAND ? 0 : H * 0.04);
  const k = 1 - Math.exp(-dt * 5);
  c.x = lerp(c.x, tx, k); c.y = lerp(c.y, ty, 1 - Math.exp(-dt * 3.5));
  // держим машину в кадре по вертикали
  const top = c.y + H * 0.5 - 3.2, bot = c.y - H * 0.5 + 1.5;
  if (tr.y > top) c.y += tr.y - top; if (tr.y < bot) c.y -= bot - tr.y;
  c.yAvg = lerp(c.yAvg, c.y, 1 - Math.exp(-dt * 0.35));
  c.shake = Math.max(0, c.shake - dt * 2.5);
  G.flash = Math.max(0, G.flash - dt * 1.5);
}
function updateEndlessTheme() {
  const th = endlessTheme(G.cam.x + 10);
  if (th !== G.theme) { G.themePrev = G.theme; G.theme = th; G.themeMix = 0; const t = THEMES[th]; hintBanner(t.name + '. ' + pick(['Держись, Серёга!', 'Новая зона!', 'Красота-то какая!']), 2.6); if (t.weather === 'snow') say('snow', 'norm', true); if (t.weather === 'rain') say('rain', 'norm', true); }
  if (G.themeMix < 1) G.themeMix = Math.min(1, G.themeMix + 0.016);
}

// ---------------- конец рейса ----------------
function checkEnd(dt, tr, ctl) {
  if (G.state === 'play') {
    // декор-события «реплика»
    G.T.decor.forEach(d => { if (d.type === 'say' && !d.done && tr.x > d.x) { d.done = true; say(d.say, d.say === 'ice' ? 'scared' : 'norm'); } });
    if (G.mode === 'route' && tr.x >= G.route.len) { G.state = 'finish'; G.finishT = 0; G.finished = true; say('finish', 'happy', true); FX.win(); for (let i = 0; i < 60; i++) spawn({ kind: 'confetti', x: tr.x + rnd(-6, 10), y: tr.y + rnd(3, 8), vx: rnd(-3, 3), vy: rnd(-1, 4), g: -3, drag: 1.2, life: rnd(1.5, 3), size: rnd(0.1, 0.2), vr: rnd(-8, 8), col: pick([[255, 210, 58], [232, 50, 40], [60, 160, 255], [90, 220, 120], [255, 255, 255]]) }); return; }
    if (tr.fatal) { G.state = 'crash'; G.crashT = 0; G.endReason = 'crash'; G.slowmo = 0.35; FX.crash(); haptic('error'); say('crash', 'dizzy', true); setMood('dizzy', 9); G.cam.shake = 1.5; SAVE.st.crashes++; return; }
    if (G.cargo <= 0) { G.state = 'crash'; G.crashT = 0; G.endReason = 'cargo'; FX.lose(); haptic('error'); setMood('dizzy', 9); return; }
    if (G.fuel <= 0 && Math.abs(tr.speed) < 0.4 && tr.grounded) { G.stuckT += dt; if (G.stuckT > 2.2) { G.state = 'crash'; G.crashT = 0; G.endReason = 'fuel'; setMood('scared', 9); say('fuellow', 'scared', true); } }
    else if ((ctl.gas > 0 || ctl.brake > 0) && Math.abs(tr.speed) < 0.5 && G.fuel > 0) { G.stuckT += dt; if (G.stuckT > 3.5 && !$('stuck-btn').classList.contains('show')) { $('stuck-btn').classList.add('show'); say('stuck', 'scared', true); } }
    else { G.stuckT = 0; if (Math.abs(tr.speed) > 2) $('stuck-btn').classList.remove('show'); }
  } else if (G.state === 'finish') {
    G.finishT += dt;
    if (G.finishT > 2.4 && !G.resultShown) { G.resultShown = true; finishRun(true); }
  } else if (G.state === 'crash') {
    G.crashT += dt / Math.max(0.2, G.slowmo);
    if (G.crashT > 0.8) G.slowmo = lerp(G.slowmo, 1, 0.1);
    if (G.crashT > 1.6 && !G.resultShown) { G.resultShown = true; offerChance(); }
  }
}
function chanceCost() { return G.mode === 'endless' ? 500 : 300 + G.route.id * 100; }
function offerChance() {
  if (G.chanceUsed || G.endReason === 'cargo') { finishRun(false); return; }
  const cost = chanceCost();
  $('ch-text').textContent = G.endReason === 'fuel' ? 'Бензин кончился. Кум Валера привезёт канистру и подтолкнёт.' : 'Газель лежит. Кум Валера поставит её на колёса тросом от своего УАЗика.';
  $('ch-cost').textContent = fmt(cost) + ' ₽';
  $('ch-yes').disabled = SAVE.money < cost;
  $('ch-yes').classList.toggle('disabled', SAVE.money < cost);
  $('ch-money').textContent = 'У тебя: ' + fmt(SAVE.money) + ' ₽';
  FX.engineSet(0, 0, 0, 0);
  openOverlay('ov-chance');
}
function useChance(tow) {
  const cost = chanceCost();
  if (SAVE.money < cost) { FX.error(); toast('Не хватает денег'); return; }
  SAVE.money -= cost; persistSoon();
  closeOverlay('ov-chance'); $('stuck-btn').classList.remove('show');
  const tr = G.truck, x = tow ? tr.x + 22 : tr.x + 3;
  tr.fatal = false; tr.place(G.T, x); tr.p.fuelOk = true;
  if (G.endReason === 'fuel' || G.fuel < G.fuelCap * 0.3) G.fuel = Math.max(G.fuel, G.fuelCap * 0.35);
  if (!tow) G.chanceUsed = true;
  G.state = 'play'; G.slowmo = 1; G.resultShown = false; G.stuckT = 0; G.endReason = ''; G.mood = 'norm'; G.moodT = 0;
  FX.buy(); popup('Кум Валера помог!', x, tr.y + 3, '#8aff6a', true);
  G.cam.x = x + 4;
  say('start', 'happy', true);
}
function declineChance() { closeOverlay('ov-chance'); finishRun(false); }

function finishRun(win) {
  FX.engineStop();
  const r = G.route, R = {};
  R.win = win; R.reason = G.endReason;
  R.coins = G.coins; R.stunts = G.stunts; R.fines = G.fines;
  if (G.mode === 'endless') {
    R.dist = Math.floor(G.maxX);
    R.pay = Math.floor(R.dist * 1.5);
    R.total = Math.max(0, R.pay + R.coins + R.stunts - R.fines);
    R.score = R.dist;
    R.newBest = R.dist > SAVE.endlessBest;
    if (R.newBest) SAVE.endlessBest = R.dist;
    if (R.dist >= 2000) unlock('endless');
  } else {
    R.cargo = Math.round(G.cargo); R.time = G.time;
    R.pay = win ? Math.round(r.pay * Math.pow(G.cargo / 100, 1.1)) : 0;
    R.timeBonus = win && G.time <= r.norm ? Math.round(r.pay * 0.15) : 0;
    R.total = Math.max(0, R.pay + R.timeBonus + R.coins + R.stunts - R.fines);
    R.stars = win ? 1 + (G.cargo >= 75 ? 1 : 0) + (G.time <= r.norm ? 1 : 0) : 0;
    R.score = win ? R.total + R.stars * 300 : 0;
    const prevBest = SAVE.best[r.id] || 0;
    R.newBest = R.score > prevBest;
    if (win) {
      if (R.newBest) SAVE.best[r.id] = R.score;
      SAVE.stars[r.id] = Math.max(SAVE.stars[r.id] || 0, R.stars);
      if (r.id >= SAVE.unlocked && r.id < TOTAL_ROUTES) { SAVE.unlocked = r.id + 1; R.unlockedNext = true; }
      SAVE.st.deliveries++;
      unlock('first');
      if (r.cargo === 'eggs' && G.cargo >= 90) unlock('eggs');
      if (G.fuel < G.fuelCap * 0.05) unlock('lastdrop');
      if (Object.values(SAVE.stars).filter(s => s >= 3).length >= 6) unlock('stars');
      if (r.id === TOTAL_ROUTES) { unlock('vlad'); R.final = true; }
    }
  }
  SAVE.money += R.total; SAVE.st.earned += R.total; SAVE.st.km += Math.floor(G.maxX);
  SAVE.st.coins += G.coinN; SAVE.st.cowhits += G.cowhits;
  if (SAVE.money >= 50000) unlock('rich');
  persist();
  submitScore();
  metrika('gameFinish', { mode: G.mode, route: r ? r.id : 0, win, score: R.score });
  G.state = 'over';
  showResult(R);
}

// ---------------- достижения ----------------
function unlock(id) {
  if (SAVE.ach[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
  SAVE.ach[id] = true; SAVE.money += a.reward; persistSoon();
  showAchievementToast(a);
}
