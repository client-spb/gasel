// =====================================================================
//  ЗАПУСК: загрузка картинок, игровой цикл, кнопки, платформа
// =====================================================================
'use strict';
let lastTs = 0, rafId = 0, running = false, sDt = 1 / 60;
function frame(ts) {
  rafId = requestAnimationFrame(frame);
  const raw = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  // сглаживаем шаг времени: одиночный «долгий» кадр не дёргает картинку
  sDt += (raw - sDt) * (Math.abs(raw - sDt) > 0.012 ? 0.35 : 0.15);
  const dt = sDt;
  autoQuality(raw);
  if (running && !G.paused && SCREEN === 'game') { try { update(dt); } catch (e) { console.error(e); } }
  try { draw(); } catch (e) { console.error(e); }
}
// если кадры не успевают — уменьшаем разрешение холста
const AQ = { acc: 0, n: 0, cool: 0 };
function autoQuality(dt) {
  if (document.hidden) return;
  AQ.n++; if (AQ.n <= 0) return; AQ.acc += dt;
  if (AQ.n < 90) return;
  const avg = AQ.acc / AQ.n; AQ.acc = 0; AQ.n = 0;
  if (avg > 0.021) {
    if (QUALITY > 0.67) { QUALITY = Math.max(0.67, QUALITY - 0.17); resizeCanvas(); }
    else if (!AUTO_LOW && SAVE.gfx === 'auto') { AUTO_LOW = true; resizeCanvas(); }
  }
}
function startLoop() { running = true; lastTs = performance.now(); sDt = 1 / 60; AQ.acc = 0; AQ.n = -60; }
function stopLoop() { running = false; }

// ---------------- загрузка ----------------
function loadAssets(onProgress) {
  const names = Object.keys(window.ASSET_META || {});
  let done = 0;
  return new Promise(resolve => {
    if (!names.length) { resolve(); return; }
    names.forEach(n => {
      const img = new Image();
      const fin = ok => { if (ok) IMG[n] = img; done++; onProgress(done / names.length); if (done === names.length) resolve(); };
      img.onload = () => fin(true); img.onerror = () => fin(false);
      img.src = ASSET_META[n].file;
    });
    setTimeout(resolve, 20000); // не ждём вечно на плохой сети
  });
}
function bootProgress(p) {
  const pc = Math.round(p * 100);
  $('load-fill').style.width = pc + '%'; $('load-truck').style.left = (pc * 3) + 'px';
  $('load-text').textContent = (pc < 40 ? 'Прогреваем двигатель… ' : pc < 80 ? 'Грузим будку… ' : 'Заправляемся… ') + pc + '%';
}

// ---------------- кнопки ----------------
function on(id, fn, sound) { const e = $(id); if (!e) return; e.addEventListener('click', ev => { if (sound !== false) FX.click(); fn(ev); }); }
on('b-go', () => { const r = nextRoute(); openBrief(r); });
on('b-routes', openRoutes);
on('b-garage', openGarage);
on('b-endless', () => { if (SAVE.unlocked < 3) { FX.error(); toast('Бесконечный рейс откроется после 2-го рейса'); return; } startRun('endless'); });
on('b-ach', openAchievements);
on('b-lb', openLeaderboard);
on('b-share', () => shareText('Катаю красную Газель Серёги по всей России! Уже ' + totalStars() + ' звёзд и ' + fmt(SAVE.money) + ' ₽ в кармане.'));
on('b-sound', toggleSound, false);
on('b-music', toggleMusic, false);
on('b-settings', () => { updateSoundIcons(); openOverlay('ov-settings'); });
on('r-back', () => { showScreen('menu'); renderMenu(); });
on('g-back', () => { showScreen('menu'); renderMenu(); });
on('br-back', () => closeOverlay('ov-brief'));
on('b-pause', pauseGame);
on('pz-resume', resumeGame);
on('pz-restart', () => confirmBox('Начать заново?', 'Текущий рейс будет сорван, заработанное в нём пропадёт.', 'Заново', restartRun));
on('pz-menu', () => confirmBox('Выйти в меню?', 'Груз останется недоставленным. Серёга расстроится.', 'Выйти', goMenu));
on('pz-sound', toggleSound, false);
on('pz-music', toggleMusic, false);
on('pz-radio', () => { cycleRadio(); MUSIC.pauseAll(); toast(RADIO[SAVE.radio].name); });
on('radio-btn', cycleRadio, false);
on('rs-retry', restartRun);
on('rs-garage', () => { closeAllOverlays(); stopLoop(); G.state = 'menu'; openGarage(); menuMusic(); });
on('rs-menu', goMenu);
on('rs-share', shareResult);
on('ch-yes', () => useChance(false), false);
on('ch-no', declineChance);
on('stuck-btn', () => {
  const cost = chanceCost();
  if (SAVE.money < cost) { FX.error(); toast('Куму надо ' + fmt(cost) + ' ₽, а у тебя ' + fmt(SAVE.money)); return; }
  confirmBox('Позвать кума Валеру?', 'Дотянет Газель тросом на 20 метров вперёд за ' + fmt(cost) + ' ₽.', 'Звоню!', () => useChance(true));
});
on('lb-close', () => closeOverlay('ov-leaderboard'));
on('ach-close', () => closeOverlay('ov-ach'));
on('st-close', () => closeOverlay('ov-settings'));
on('st-sound', toggleSound, false);
on('st-music', toggleMusic, false);
on('st-privacy', openPrivacy);
on('st-gfx', () => { SAVE.gfx = SAVE.gfx === 'auto' ? 'fast' : SAVE.gfx === 'fast' ? 'high' : 'auto'; AUTO_LOW = false; QUALITY = 1; persist(); updateSoundIcons(); resizeCanvas(); });
on('st-howto', () => { closeOverlay('ov-settings'); openOverlay('ov-howto'); });
on('how-close', () => { closeOverlay('ov-howto'); SAVE.tut = true; persistSoon(); });
on('st-reset', () => confirmBox('Сбросить прогресс?', 'Деньги, рейсы, гараж и награды обнулятся. Газель снова станет стоковой.', 'Сбросить', () => {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  const keep = { sound: SAVE.sound, music: SAVE.music };
  Object.assign(SAVE, { money: 0, unlocked: 1, best: {}, stars: {}, up: { engine: 0, susp: 0, tires: 0, tank: 0, lock: 0 }, awd: false, horn: 'bip', horns: ['bip'], cos: [], cosOn: [], ach: {}, endlessBest: 0, radio: 1, tut: false,
    daily: { last: '', streak: 0 }, st: { deliveries: 0, flips: 0, airMax: 0, shoo: 0, fines: 0, polite: 0, crashes: 0, km: 0, coins: 0, radios: [], cowhits: 0, earned: 0 } }, keep);
  persist(); closeAllOverlays(); renderMenu(); toast('Прогресс сброшен. Новая жизнь Серёги!');
}));
on('cf-no', () => closeOverlay('ov-confirm'));
// списки с собственной прокруткой
['route-list', 'g-list', 'lb-list', 'ach-list'].forEach(id => makeScroll($(id)));
document.querySelectorAll('.how-list').forEach(makeScroll);

// ---------------- видимость вкладки ----------------
function onHide() {
  if (SCREEN === 'game' && G.state !== 'over' && !G.paused && G.state !== 'menu') pauseGame();
  clearInput(); MUSIC.pauseAll(); FX.engineSet(0, 0, 0, 0); FX.suspend(); persist();
}
function onShow() {
  if (document.hidden) return;
  FX.resume(); lastTs = performance.now();
  if (SCREEN === 'menu' || SCREEN === 'routes' || SCREEN === 'garage') MUSIC.resume();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) onHide(); else onShow(); });
window.addEventListener('pagehide', onHide);
window.addEventListener('blur', onHide);
window.addEventListener('focus', onShow);

// ---------------- старт ----------------
loadSave();
layoutApp();
maxInit();
$('load-tip').textContent = pick(TIPS);
requestAnimationFrame(t => { lastTs = t; rafId = requestAnimationFrame(frame); });
(async () => {
  const fontWait = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  await Promise.all([loadAssets(bootProgress), fontWait]);
  bootProgress(1);
  setTimeout(() => {
    renderMenu(); showScreen('menu');
    // музыка меню стартует с первого касания (политика автозапуска)
    const startMusic = () => { if (SCREEN !== 'game') menuMusic(); document.removeEventListener('pointerdown', startMusic, true); };
    document.addEventListener('pointerdown', startMusic, true);
    if (!checkDaily() && !SAVE.tut && SAVE.st.deliveries === 0) openOverlay('ov-howto');
  }, 250);
})();
if (window.GameSDK && GameSDK.init) {
  try {
    GameSDK.init(GAME_NAME, function () {
      console.log('[Game] GameSDK инициализирован для игры:', GAME_NAME);
      if (SCREEN === 'menu') renderMenu();
      submitScore();
    });
  } catch (e) { console.warn('[Game] GameSDK init error:', e); }
}
