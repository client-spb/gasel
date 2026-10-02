// =====================================================================
//  ИНТЕРФЕЙС: меню, путевые листы, гараж, HUD, результат, рейтинг
// =====================================================================
'use strict';
function setIcon(btn, id) { const u = btn.querySelector('use'); if (u) u.setAttribute('href', '#' + id); }
function nextRoute() { return ROUTES[Math.min(SAVE.unlocked, TOTAL_ROUTES) - 1]; }
function timeStr(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

// ---------------- главное меню ----------------
function renderMenu() {
  $('m-money').querySelector('span').textContent = fmt(SAVE.money);
  $('m-stars').querySelector('span').textContent = totalStars() + ' / ' + TOTAL_ROUTES * 3;
  const r = nextRoute();
  const allDone = SAVE.stars[TOTAL_ROUTES] > 0;
  $('b-go-sub').textContent = allDone ? 'Все рейсы пройдены. Ещё разок?' : 'Рейс ' + r.id + ': ' + r.from + ' — ' + r.to;
  $('b-endless').classList.toggle('locked', SAVE.unlocked < 3);
  $('guest').classList.toggle('show', !maxUser());
  updateSoundIcons();
  const q = $('m-quote'); q.textContent = pick(SAY.idle.concat(SAY.start));
  q.style.animation = 'none'; void q.offsetWidth; q.style.animation = '';
}
function updateSoundIcons() {
  setIcon($('b-sound'), SAVE.sound ? 'i-sound' : 'i-mute'); $('b-sound').classList.toggle('off', !SAVE.sound);
  setIcon($('b-music'), SAVE.music ? 'i-music' : 'i-nomusic'); $('b-music').classList.toggle('off', !SAVE.music);
  setIcon($('pz-sound'), SAVE.sound ? 'i-sound' : 'i-mute'); $('pz-sound').classList.toggle('off', !SAVE.sound);
  setIcon($('pz-music'), SAVE.music ? 'i-music' : 'i-nomusic'); $('pz-music').classList.toggle('off', !SAVE.music);
  $('st-sound-v').textContent = SAVE.sound ? 'Вкл' : 'Выкл'; $('st-music-v').textContent = SAVE.music ? 'Вкл' : 'Выкл';
}
function toggleSound() { SAVE.sound = !SAVE.sound; persist(); updateSoundIcons(); if (SAVE.sound) FX.click(); if (!SAVE.sound) FX.engineSet(0, 0, 0, 0); }
function toggleMusic() {
  SAVE.music = !SAVE.music; persist(); updateSoundIcons(); FX.click();
  if (!SAVE.music) MUSIC.pauseAll(); else if (SCREEN === 'game') radioMusic(); else menuMusic();
}
function goMenu() {
  stopLoop(); FX.engineStop(); G.state = 'menu'; G.paused = false; clearInput();
  closeAllOverlays(); renderMenu(); showScreen('menu'); menuMusic();
}

// ---------------- путевые листы ----------------
function openRoutes() {
  const list = $('route-list'); list.innerHTML = '';
  $('r-stars').textContent = totalStars() + ' / ' + TOTAL_ROUTES * 3;
  ROUTES.forEach((r, i) => {
    const locked = r.id > SAVE.unlocked;
    const card = document.createElement('button'); card.className = 'r-card'; card.style.animationDelay = (i * 0.04) + 's';
    const thumb = document.createElement('img'); thumb.className = 'r-thumb'; thumb.src = 'img/thumb_' + r.theme + '.jpg'; thumb.alt = '';
    const info = document.createElement('div'); info.className = 'r-info';
    const no = document.createElement('div'); no.className = 'r-no'; no.textContent = 'Рейс № ' + r.id + ' • ' + r.km + ' км • ' + THEMES[r.theme].name;
    const title = document.createElement('div'); title.className = 'r-title'; title.textContent = r.from + ' — ' + r.to;
    const metaEl = document.createElement('div'); metaEl.className = 'r-meta';
    const ci = document.createElement('img'); ci.src = 'img/' + CARGO[r.cargo].icon + '.png'; ci.alt = '';
    const cn = document.createElement('span'); cn.textContent = CARGO[r.cargo].name;
    metaEl.append(ci, cn);
    const st = document.createElement('div'); st.className = 'r-stars';
    const s = SAVE.stars[r.id] || 0;
    for (let k = 0; k < 3; k++) st.insertAdjacentHTML('beforeend', svgIcon(k < s ? 'i-star' : 'i-star-empty'));
    if (SAVE.best[r.id]) { const b = document.createElement('span'); b.className = 'r-best'; b.textContent = 'Рекорд ' + fmt(SAVE.best[r.id]); st.appendChild(b); }
    info.append(no, title, metaEl, st);
    card.append(thumb, info);
    if (locked) { const l = document.createElement('div'); l.className = 'r-lock'; l.innerHTML = svgIcon('i-lock'); const t = document.createElement('span'); t.textContent = 'Сначала рейс № ' + (r.id - 1); l.appendChild(t); card.appendChild(l); }
    card.addEventListener('click', () => { if (locked) { FX.error(); toast('Сначала доставь груз в ' + ROUTES[r.id - 2].to); return; } FX.click(); openBrief(r); });
    list.appendChild(card);
  });
  // мини-карта маршрута
  const map = $('r-map'); map.innerHTML = '';
  ROUTES.forEach((r, i) => {
    const d = document.createElement('div'); d.className = 'rm-dot' + (r.id < SAVE.unlocked || SAVE.stars[r.id] ? ' done' : '') + (r.id === SAVE.unlocked ? ' cur' : '');
    d.style.left = (12 + i / (TOTAL_ROUTES - 1) * 76) + '%'; map.appendChild(d);
  });
  const tk = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tk.setAttribute('viewBox', '0 0 64 36'); tk.setAttribute('class', 'rm-truck');
  tk.innerHTML = '<use href="#i-truck"/>'; tk.style.left = (12 + (Math.min(SAVE.unlocked, TOTAL_ROUTES) - 1) / (TOTAL_ROUTES - 1) * 76) + '%'; map.appendChild(tk);
  showScreen('routes');
  list.scrollTop = Math.max(0, (Math.min(SAVE.unlocked, TOTAL_ROUTES) - 2) * 116);
}
function openBrief(r) {
  const cg = CARGO[r.cargo];
  $('br-no').textContent = 'Путевой лист № ' + String(r.id).padStart(3, '0');
  const d = new Date(); $('br-date').textContent = d.toLocaleDateString('ru-RU');
  $('br-from').textContent = r.from; $('br-to').textContent = r.to;
  $('br-cargo-img').src = 'img/' + cg.icon + '.png'; $('br-cargo').textContent = cg.name;
  $('br-frag').textContent = cg.frag >= 1.2 ? 'Очень хрупкое!' : cg.frag >= 0.95 ? 'Хрупкое' : cg.frag >= 0.7 ? 'Средней хрупкости' : 'Крепкий груз';
  $('br-km').textContent = r.km + ' км'; $('br-pay').textContent = fmt(r.pay) + ' ₽'; $('br-norm').textContent = timeStr(r.norm); $('br-zone').textContent = THEMES[r.theme].name;
  $('br-client').textContent = r.client; $('br-note').textContent = '«' + r.note + '»';
  $('br-go').onclick = () => { FX.click(); closeOverlay('ov-brief'); startRun('route', r); };
  openOverlay('ov-brief');
}

// ---------------- гараж ----------------
const G_TABS = [
  { key: 'engine', icon: 'i-engine' }, { key: 'susp', icon: 'i-spring' }, { key: 'tires', icon: 'i-tire' }, { key: 'tank', icon: 'i-fuel' },
  { key: 'lock', icon: 'i-chain' }, { key: 'awd', icon: 'i-awd' }, { key: 'tune', icon: 'i-paint' }
];
let gTab = 'engine';
function openGarage() { renderGarage(); showScreen('garage'); }
function renderGarage() {
  $('g-money').querySelector('span').textContent = fmt(SAVE.money);
  const tabs = $('g-tabs'); tabs.innerHTML = '';
  G_TABS.forEach(t => {
    const b = document.createElement('button'); b.className = 'g-tab' + (t.key === gTab ? ' on' : ''); b.innerHTML = svgIcon(t.icon);
    b.addEventListener('click', () => { FX.tab(); gTab = t.key; renderGarage(); }); tabs.appendChild(b);
  });
  const panel = tabs.parentElement;
  panel.querySelectorAll('.g-title,.g-desc').forEach(e => e.remove());
  const list = $('g-list'); list.innerHTML = '';
  const title = document.createElement('div'); title.className = 'g-title';
  const desc = document.createElement('div'); desc.className = 'g-desc';
  panel.insertBefore(desc, list); panel.insertBefore(title, desc);
  const up = UPGRADES.find(u => u.key === gTab);
  if (up) {
    title.textContent = up.name; desc.textContent = up.desc;
    const cur = SAVE.up[up.key];
    up.levels.forEach((name, i) => {
      const c = document.createElement('div'); c.className = 'u-card' + (i <= cur ? ' owned' : '') + (i === cur ? ' cur' : '');
      const lv = document.createElement('div'); lv.className = 'u-lvl'; lv.textContent = i + 1;
      const nm = document.createElement('div'); nm.className = 'u-name'; nm.textContent = name;
      const sm = document.createElement('small'); sm.textContent = upgradeStat(up.key, i); nm.appendChild(sm);
      c.append(lv, nm);
      if (i <= cur) { const s = document.createElement('div'); s.className = 'u-state'; s.textContent = i === cur ? 'Стоит' : 'Было'; c.appendChild(s); }
      else if (i === cur + 1) c.appendChild(buyBtn(up.cost[i], () => { SAVE.up[up.key] = i; }));
      else { const s = document.createElement('div'); s.className = 'u-state'; s.style.color = '#8a9098'; s.textContent = fmt(up.cost[i]) + ' ₽'; c.appendChild(s); }
      list.appendChild(c);
    });
  } else if (gTab === 'awd') {
    title.textContent = 'Полный привод 4×4'; desc.textContent = 'Как у «Соболя»: тянут оба моста. В гору, в грязь и по снегу — заметно увереннее.';
    const c = document.createElement('div'); c.className = 'u-card' + (SAVE.awd ? ' owned cur' : '');
    const lv = document.createElement('div'); lv.className = 'u-lvl'; lv.innerHTML = svgIcon('i-awd');
    const nm = document.createElement('div'); nm.className = 'u-name'; nm.textContent = 'Раздатка и передний мост';
    const sm = document.createElement('small'); sm.textContent = 'Тяга на все колёса, +12% сцепления в грязи и снегу'; nm.appendChild(sm);
    c.append(lv, nm);
    if (SAVE.awd) { const s = document.createElement('div'); s.className = 'u-state'; s.textContent = 'Стоит'; c.appendChild(s); }
    else c.appendChild(buyBtn(AWD_COST, () => { SAVE.awd = true; }));
    list.appendChild(c);
  } else {
    title.textContent = 'Тюнинг и сигналы'; desc.textContent = 'Сигнал прогоняет коров. Украшения — для души и для гаишников.';
    HORNS.forEach(h => {
      const owned = SAVE.horns.includes(h.key), on = SAVE.horn === h.key;
      const c = document.createElement('div'); c.className = 'u-card' + (owned ? ' owned' : '') + (on ? ' cur' : '');
      const lv = document.createElement('div'); lv.className = 'u-lvl'; lv.innerHTML = svgIcon('i-horn');
      const nm = document.createElement('div'); nm.className = 'u-name'; nm.textContent = 'Сигнал «' + h.name + '»';
      const sm = document.createElement('small'); sm.textContent = h.desc; nm.appendChild(sm);
      c.append(lv, nm);
      const test = document.createElement('button'); test.className = 'ibtn'; test.style.width = test.style.height = '40px'; test.innerHTML = svgIcon('i-play');
      test.addEventListener('click', () => FX.horn(h.key)); c.appendChild(test);
      if (!owned) c.appendChild(buyBtn(h.cost, () => { SAVE.horns.push(h.key); SAVE.horn = h.key; }));
      else if (!on) { const b = document.createElement('button'); b.className = 'sign sign-blue u-buy'; b.innerHTML = '<span>Выбрать</span>'; b.addEventListener('click', () => { SAVE.horn = h.key; persist(); FX.horn(h.key); renderGarage(); }); c.appendChild(b); }
      else { const s = document.createElement('div'); s.className = 'u-state'; s.textContent = 'Стоит'; c.appendChild(s); }
      list.appendChild(c);
    });
    COSMETICS.forEach(cs => {
      const owned = SAVE.cos.includes(cs.key), on = SAVE.cosOn.includes(cs.key);
      const c = document.createElement('div'); c.className = 'u-card' + (owned ? ' owned' : '') + (on ? ' cur' : '');
      const lv = document.createElement('div'); lv.className = 'u-lvl'; lv.innerHTML = svgIcon('i-paint');
      const nm = document.createElement('div'); nm.className = 'u-name'; nm.textContent = cs.name;
      const sm = document.createElement('small'); sm.textContent = cs.desc; nm.appendChild(sm);
      c.append(lv, nm);
      if (!owned) c.appendChild(buyBtn(cs.cost, () => { SAVE.cos.push(cs.key); SAVE.cosOn.push(cs.key); if (COSMETICS.every(x => SAVE.cos.includes(x.key))) unlock('tuning'); }));
      else { const b = document.createElement('button'); b.className = 'sign u-buy ' + (on ? 'sign-white' : 'sign-blue'); b.innerHTML = '<span>' + (on ? 'Снять' : 'Надеть') + '</span>'; b.addEventListener('click', () => { FX.click(); if (on) SAVE.cosOn = SAVE.cosOn.filter(k => k !== cs.key); else SAVE.cosOn.push(cs.key); persist(); renderGarage(); }); c.appendChild(b); }
      list.appendChild(c);
    });
  }
}
function upgradeStat(key, i) {
  if (key === 'engine') return 'Тяга ' + Math.round(UPG.engine.force[i] / 100) / 10 + ' кН • до ' + Math.round(UPG.engine.vmax[i] * 3.6) + ' км/ч';
  if (key === 'susp') return 'Урон грузу −' + Math.round((1 - UPG.susp.dmg[i]) * 100) + '%';
  if (key === 'tires') return 'Сцепление ×' + UPG.tires.mu[i].toFixed(2) + (i >= 3 ? ' • держит на льду' : '');
  if (key === 'tank') return 'Объём ' + UPG.tank.cap[i] + ' л';
  if (key === 'lock') return 'Урон −' + Math.round((1 - UPG.lock.dmg[i]) * 100) + '% • двери ' + (i === 0 ? 'хлопают' : 'надёжнее на ' + Math.round((1 - UPG.lock.door[i]) * 100) + '%');
  return '';
}
function buyBtn(cost, apply) {
  const b = document.createElement('button'); b.className = 'sign sign-green u-buy' + (SAVE.money < cost ? ' disabled' : '');
  b.innerHTML = svgIcon('i-coin') + '<span>' + fmt(cost) + '</span>';
  b.addEventListener('click', () => {
    if (SAVE.money < cost) { FX.error(); haptic('error'); toast('Не хватает ' + fmt(cost - SAVE.money) + ' ₽. Ещё пара рейсов!'); return; }
    SAVE.money -= cost; apply(); persist(); FX.buy(); haptic('success'); toast('Куплено! Серёга доволен.'); renderGarage();
  });
  return b;
}

// ---------------- HUD ----------------
const HUD = {};
function updateHUD(force) {
  if (!G.truck) return;
  const tr = G.truck;
  const earn = Math.max(0, G.coins + G.stunts - G.fines);
  if (force || HUD.earn !== earn) { $('hud-money').textContent = fmt(earn); if (!force && HUD.earn !== undefined && earn > HUD.earn) { const ch = $('hud-money').parentElement; ch.classList.remove('flash'); void ch.offsetWidth; ch.classList.add('flash'); } HUD.earn = earn; }
  const cg = Math.round(G.cargo);
  if (force || HUD.cg !== cg) {
    HUD.cg = cg; $('hud-cargo-t').textContent = cg + '%'; const f = $('hud-cargo'); f.style.width = cg + '%';
    f.className = 'bar-fill' + (cg < 35 ? ' low' : cg < 70 ? ' mid' : '');
    if (!force) { const ch = $('hud-cargo-chip'); ch.classList.remove('flash'); void ch.offsetWidth; ch.classList.add('flash'); }
  }
  const fu = Math.round(G.fuel / G.fuelCap * 100);
  if (force || HUD.fu !== fu) { HUD.fu = fu; $('gauge-needle').style.transform = 'rotate(' + (-80 + fu * 1.6) + 'deg)'; $('gauge').classList.toggle('low', fu < 18); }
  const sp = Math.round(Math.abs(tr.speed) * 3.6);
  if (force || HUD.sp !== sp) { HUD.sp = sp; $('hud-speed').textContent = sp; }
  let prog, kmText;
  if (G.mode === 'endless') { prog = (G.maxX % ENDLESS_ZONE) / ENDLESS_ZONE; kmText = fmt(Math.floor(G.maxX)) + ' м • ' + THEMES[G.theme].name + (SAVE.endlessBest ? ' • рекорд ' + fmt(SAVE.endlessBest) : ''); }
  else { prog = clamp(tr.x / G.route.len, 0, 1); kmText = Math.round(prog * G.route.km) + ' из ' + G.route.km + ' км • ' + timeStr(G.time); }
  const pr = Math.round(prog * 200);
  if (force || HUD.pr !== pr) { HUD.pr = pr; $('hp-fill').style.width = (prog * 100) + '%'; $('hp-truck').style.left = (prog * 100) + '%'; }
  if (force || HUD.km !== kmText) { HUD.km = kmText; $('hp-km').textContent = kmText; }
  const bo = G.boostT > 0, mg = G.magnetT > 0;
  $('tm-boost').classList.toggle('show', bo); $('tm-magnet').classList.toggle('show', mg);
  if (bo) $('tm-boost-f').style.width = (G.boostT / 4.2 * 100) + '%';
  if (mg) $('tm-magnet-f').style.width = (G.magnetT / 10 * 100) + '%';
}
function positionBubble(tr) {
  const b = $('bubble');
  if (!G.bubble || SCREEN !== 'game') { if (b.classList.contains('show')) b.classList.remove('show'); return; }
  if (b._text !== G.bubble.text) { b._text = G.bubble.text; $('bubble-t').textContent = G.bubble.text; b.classList.remove('show'); void b.offsetWidth; }
  b.classList.add('show');
  const [hx, hy] = tr.toWorld(1.0, 2.5);
  let x = SX(hx) - 26, y = SY(hy) - b.offsetHeight - 14;
  x = clamp(x, 6, APPW - b.offsetWidth - 6); y = clamp(y, LAND ? 60 : 120, APPH - b.offsetHeight - 150);
  b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(y) + 'px';
}
// радио
let djTimer = 0, djHide = 0;
function showRadioTicker(withDJ) {
  const st = RADIO[SAVE.radio];
  $('radio-name').textContent = st.freq ? st.name + ' ' + st.freq : st.name;
  if (withDJ) showDJ(pick(st.dj));
  clearInterval(djTimer);
  djTimer = setInterval(() => { if (SCREEN === 'game' && G.state === 'play' && !G.paused && RADIO[SAVE.radio].key !== 'off') showDJ(pick(RADIO[SAVE.radio].dj)); }, 42000);
}
function showDJ(text) { const d = $('dj'); $('dj-t').textContent = text; d.classList.add('show'); clearTimeout(djHide); djHide = setTimeout(() => d.classList.remove('show'), 4200); }
function cycleRadio() {
  SAVE.radio = (SAVE.radio + 1) % RADIO.length; persistSoon();
  FX.radioSwitch(); haptic('light');
  const k = RADIO[SAVE.radio].key;
  if (k !== 'off' && !SAVE.st.radios.includes(k)) { SAVE.st.radios.push(k); if (SAVE.st.radios.length >= RADIO.length - 1) unlock('radio'); }
  if (!SAVE.music && k !== 'off') toast('Музыка выключена в настройках');
  radioMusic(); showRadioTicker(true);
}

// ---------------- пауза ----------------
function pauseGame() {
  if (SCREEN !== 'game' || G.paused || G.state === 'over' || G.state === 'menu') return;
  if (anyOverlay()) return;
  G.paused = true; clearInput(); MUSIC.pauseAll(); FX.engineSet(0, 0, 0, 0);
  updateSoundIcons(); openOverlay('ov-pause');
}
function resumeGame() {
  if (!G.paused) return;
  G.paused = false; lastTs = performance.now(); closeOverlay('ov-pause'); FX.resume(); radioMusic();
}
function restartRun() {
  closeAllOverlays(); G.paused = false;
  if (G.mode === 'endless') startRun('endless'); else startRun('route', G.route);
}

// ---------------- результат ----------------
let lastResult = null;
function showResult(R) {
  lastResult = R;
  const r = G.route;
  $('rs-no').textContent = G.mode === 'endless' ? 'Бесконечный рейс' : 'Путевой лист № ' + String(r.id).padStart(3, '0');
  $('rs-route').textContent = G.mode === 'endless' ? THEMES[G.theme].name : r.from + ' — ' + r.to;
  const title = $('rs-title'); title.classList.toggle('fail', !R.win && G.mode !== 'endless');
  const reasons = { crash: 'Газель на боку!', fuel: 'Кончился бензин!', cargo: 'Груз потерян!' };
  if (G.mode === 'endless') title.textContent = 'Пройдено ' + fmt(R.dist) + ' м';
  else title.textContent = R.win ? (R.final ? 'ВЛАДИВОСТОК!' : 'Доставлено!') : (reasons[R.reason] || 'Рейс сорван');
  const stars = $('rs-stars'); stars.innerHTML = '';
  if (G.mode === 'route') {
    for (let k = 0; k < 3; k++) stars.insertAdjacentHTML('beforeend', svgIcon(k < R.stars ? 'i-star' : 'i-star-empty'));
    stars.querySelectorAll('.ico').forEach((s, k) => { s.style.animationDelay = (0.3 + k * 0.25) + 's'; if (k < R.stars) setTimeout(() => FX.star(k), 300 + k * 250); });
    stars.style.display = 'flex';
  } else stars.style.display = 'none';
  $('rs-stamp').src = 'img/' + (R.final ? 'stamp_final' : (R.win || G.mode === 'endless') ? 'stamp_ok' : 'stamp_fail') + '.png';
  const rows = $('rs-rows'); rows.innerHTML = '';
  const row = (label, val, neg) => {
    const d = document.createElement('div'); d.className = 'rs-row';
    const l = document.createElement('span'); l.textContent = label; const dots = document.createElement('span'); dots.className = 'dots';
    const b = document.createElement('b'); b.textContent = (neg ? '−' : '') + fmt(val) + ' ₽'; if (neg) b.className = 'neg';
    d.append(l, dots, b); rows.appendChild(d);
  };
  if (G.mode === 'endless') row('За километраж', R.pay);
  else if (R.win) { row('Доставка (груз ' + R.cargo + '%)', R.pay); if (R.timeBonus) row('Премия за скорость ' + timeStr(R.time), R.timeBonus); }
  row('Монеты на трассе', R.coins); if (R.stunts) row('Трюки и вежливость', R.stunts); if (R.fines) row('Штрафы и убытки', R.fines, true);
  $('rs-total').textContent = '+' + fmt(R.total) + ' ₽';
  $('rs-best').textContent = R.newBest && (R.win || G.mode === 'endless') ? 'Новый личный рекорд!' : (R.unlockedNext ? 'Открыт новый рейс!' : '');
  const nx = $('rs-next');
  if (G.mode === 'endless') { $('rs-next-t').textContent = 'Ещё рейс'; nx.onclick = () => { FX.click(); restartRun(); }; }
  else if (R.win && r.id < TOTAL_ROUTES) { $('rs-next-t').textContent = 'Дальше: ' + ROUTES[r.id].to; nx.onclick = () => { FX.click(); closeAllOverlays(); openBrief(ROUTES[r.id]); }; }
  else if (R.win) { $('rs-next-t').textContent = 'Бесконечный рейс'; nx.onclick = () => { FX.click(); startRun('endless'); }; }
  else { $('rs-next-t').textContent = 'Попробовать ещё'; nx.onclick = () => { FX.click(); restartRun(); }; }
  MUSIC.stop();
  if (R.win || G.mode === 'endless') { if (G.mode === 'endless') FX.win(); haptic('success'); } else { FX.lose(); haptic('error'); }
  setTimeout(() => openOverlay('ov-result'), 150);
}
function shareResult() {
  const R = lastResult; let t;
  if (!R) t = 'Катаю красную Газель Серёги по всей России!';
  else if (G.mode === 'endless') t = 'Я проехал ' + fmt(R.dist) + ' м в бесконечном рейсе на красной Газели Серёги!';
  else if (R.win) t = 'Довёз «' + CARGO[G.route.cargo].name + '» по трассе ' + G.route.from + ' — ' + G.route.to + ' на красной Газели! Заработал ' + fmt(R.total) + ' ₽, звёзд: ' + R.stars + ' из 3.';
  else t = 'Пытался довезти «' + CARGO[G.route.cargo].name + '» до города ' + G.route.to + ', но Газель не выдержала. А ты сможешь?';
  shareWithCard(t, makeShareCard('Газель Серёги', R ? (G.mode === 'endless' ? fmt(R.dist) + ' м' : fmt(R.total) + ' ₽') : 'Дальнобой по-русски'));
}

// ---------------- рейтинг ----------------
async function openLeaderboard() {
  openOverlay('ov-leaderboard');
  $('lb-me').innerHTML = '';
  const me = document.createElement('span'); me.textContent = 'Твой счёт: ' + fmt(totalScore());
  const st = document.createElement('span'); st.textContent = 'Звёзды: ' + totalStars();
  $('lb-me').append(me, st);
  const list = $('lb-list');
  list.innerHTML = '<div class="lb-empty">Загрузка рейтинга…</div>';
  if (window.GameSDK && GameSDK.getLeaderboard) {
    try {
      const res = await GameSDK.getLeaderboard(20);
      renderLeaderboard(res && res.ok && res.leaderboard ? res.leaderboard : []);
    } catch (e) { list.innerHTML = '<div class="lb-empty">Ошибка загрузки. Попробуйте позже.</div>'; }
  } else renderLeaderboard([]);
  fitPanel($('ov-leaderboard').querySelector('.panel'));
}
function renderLeaderboard(players) {
  const list = $('lb-list'); list.innerHTML = '';
  if (!players || players.length === 0) { list.innerHTML = '<div class="lb-empty">Пока нет рекордов. Будьте первым!</div>'; return; }
  const me = maxUser();
  players.forEach((p, i) => {
    const row = document.createElement('div'); row.className = 'lb-row';
    if (i === 0) row.classList.add('top-1'); else if (i === 1) row.classList.add('top-2'); else if (i === 2) row.classList.add('top-3');
    if (me && p.id && String(p.id) === String(me.id)) row.classList.add('me');
    const medal = document.createElement('div'); medal.className = 'lb-medal';
    if (i === 0) { medal.textContent = '1'; medal.classList.add('gold'); } else if (i === 1) { medal.textContent = '2'; medal.classList.add('silver'); } else if (i === 2) { medal.textContent = '3'; medal.classList.add('bronze'); } else medal.textContent = '#' + (i + 1);
    row.appendChild(medal);
    const avatar = document.createElement('div'); avatar.className = 'lb-avatar';
    const displayName = p.name || p.nickname || 'Игрок';
    avatar.textContent = displayName.charAt(0).toUpperCase();
    if (p.photo_url) { const img = document.createElement('img'); img.src = p.photo_url; img.alt = ''; img.onerror = function () { this.remove(); }; avatar.appendChild(img); }
    row.appendChild(avatar);
    const name = document.createElement('div'); name.className = 'lb-name'; name.textContent = displayName; row.appendChild(name);
    const score = document.createElement('div'); score.className = 'lb-score'; score.textContent = fmt(p.score || 0); row.appendChild(score);
    list.appendChild(row);
  });
}

// ---------------- награды ----------------
function openAchievements() {
  const st = $('ach-stats'); st.innerHTML = '';
  [['Рейсов', SAVE.st.deliveries], ['Пройдено, м', fmt(SAVE.st.km)], ['Сальто', SAVE.st.flips], ['Коров прогнал', SAVE.st.shoo], ['Штрафов', SAVE.st.fines], ['Заработано', fmt(SAVE.st.earned)]].forEach(s => {
    const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = s[1]; d.appendChild(b); d.appendChild(document.createTextNode(s[0])); st.appendChild(d);
  });
  const list = $('ach-list'); list.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const got = !!SAVE.ach[a.id];
    const r = document.createElement('div'); r.className = 'a-row' + (got ? '' : ' locked');
    r.insertAdjacentHTML('beforeend', svgIcon(got ? 'i-medal' : 'i-lock'));
    const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = a.name; const s = document.createElement('span'); s.textContent = a.desc; d.append(b, s);
    const i = document.createElement('i'); i.textContent = got ? 'Получено' : '+' + fmt(a.reward) + ' ₽';
    r.append(d, i); list.appendChild(r);
  });
  openOverlay('ov-ach');
}
let achQueue = [], achShowing = false;
function showAchievementToast(a) {
  achQueue.push(a); if (achShowing) return;
  const next = () => {
    const x = achQueue.shift(); if (!x) { achShowing = false; return; }
    achShowing = true; $('at-name').textContent = x.name; $('at-desc').textContent = x.desc + ' • +' + fmt(x.reward) + ' ₽';
    $('ach-toast').classList.add('show'); FX.achieve(); haptic('success');
    setTimeout(() => { $('ach-toast').classList.remove('show'); setTimeout(next, 450); }, 2600);
  };
  next();
}

// ---------------- ежедневная премия ----------------
function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function checkDaily() {
  const today = dayKey(new Date());
  if (SAVE.daily.last === today) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = SAVE.daily.last === dayKey(y) ? SAVE.daily.streak + 1 : 1;
  const sum = 300 + 200 * Math.min(streak, 7);
  $('dl-text').textContent = streak > 1 ? 'Ты на трассе ' + streak + ' дн. подряд. Диспетчер ценит!' : 'За верность трассе и красной Газели';
  $('dl-sum').textContent = '+' + fmt(sum) + ' ₽';
  $('dl-take').onclick = () => {
    SAVE.daily.last = today; SAVE.daily.streak = streak; SAVE.money += sum; persist();
    FX.buy(); haptic('success'); closeOverlay('ov-daily'); renderMenu();
  };
  openOverlay('ov-daily');
  return true;
}
