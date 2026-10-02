// =====================================================================
//  ВВОД: педали (мультитач), сигнал, клавиатура
// =====================================================================
'use strict';
const INPUT = { gas: new Set(), brake: new Set(), keys: new Set() };
function syncCtl() {
  const k = INPUT.keys;
  G.ctl.gas = (INPUT.gas.size || k.has('ArrowRight') || k.has('KeyD') || k.has('ArrowUp') || k.has('KeyW')) ? 1 : 0;
  G.ctl.brake = (INPUT.brake.size || k.has('ArrowLeft') || k.has('KeyA') || k.has('ArrowDown') || k.has('KeyS')) ? 1 : 0;
  $('pedal-gas').classList.toggle('on', !!G.ctl.gas);
  $('pedal-brake').classList.toggle('on', !!G.ctl.brake);
}
function clearInput() {
  INPUT.gas.clear(); INPUT.brake.clear(); INPUT.keys.clear();
  G.ctl.gas = 0; G.ctl.brake = 0;
  ['pedal-gas', 'pedal-brake', 'horn-btn'].forEach(id => { const e = $(id); if (e) e.classList.remove('on'); });
}
function bindPedal(el, set) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); FX.unlock();
    set.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (_) {}
    syncCtl(); haptic('light');
  });
  const up = e => { if (set.delete(e.pointerId)) syncCtl(); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindPedal($('pedal-gas'), INPUT.gas);
bindPedal($('pedal-brake'), INPUT.brake);
(() => {
  const h = $('horn-btn');
  h.addEventListener('pointerdown', e => { e.preventDefault(); h.classList.add('on'); honk(); });
  const up = () => h.classList.remove('on');
  h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); h.addEventListener('pointerleave', up);
  h.addEventListener('contextmenu', e => e.preventDefault());
})();
// касание по пустому месту игрового экрана: правая половина — газ, левая — тормоз
(() => {
  const scr = $('scr-game');
  cv.addEventListener('pointerdown', e => {
    if (SCREEN !== 'game' || G.paused) return;
    const p = toGame(e); const set = p.x > APPW / 2 ? INPUT.gas : INPUT.brake;
    set.add(e.pointerId); try { cv.setPointerCapture(e.pointerId); } catch (_) {} syncCtl();
  });
  const up = e => { if (INPUT.gas.delete(e.pointerId) | INPUT.brake.delete(e.pointerId)) syncCtl(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  scr.addEventListener('contextmenu', e => e.preventDefault());
})();
window.addEventListener('keydown', e => {
  if (SCREEN !== 'game') { if (e.code === 'Escape' && anyOverlay()) { const o = document.querySelector('.overlay.show'); if (o && o.id !== 'ov-result' && o.id !== 'ov-chance') closeOverlay(o.id); } return; }
  if (e.code === 'Escape' || e.code === 'KeyP') { if (G.paused) resumeGame(); else pauseGame(); e.preventDefault(); return; }
  if (G.paused) return;
  if (e.code === 'Space') { honk(); e.preventDefault(); return; }
  if (e.code === 'KeyR' && !e.repeat) { cycleRadio(); return; }
  if (/Arrow|Key[WASD]/.test(e.code)) { INPUT.keys.add(e.code); syncCtl(); e.preventDefault(); }
});
window.addEventListener('keyup', e => { if (INPUT.keys.delete(e.code)) syncCtl(); });
