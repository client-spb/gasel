// =====================================================================
//  ЯДРО: помощники, платформа MAX, сохранения, вёрстка, оверлеи
// =====================================================================
'use strict';
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString('ru-RU');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sign = v => v < 0 ? -1 : 1;
function mulberry(seed) {
  let s = seed >>> 0;
  return function () { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const FONT = '"Russo One", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
const FONT_N = '"PT Sans Narrow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
const FONT_H = '"Caveat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

// ---------------- платформа MAX ----------------
function maxW() { return window.WebApp || null; }
function maxInit() {
  try { const w = maxW(); if (!w) return; if (w.ready) w.ready(); if (w.disableVerticalSwipes) w.disableVerticalSwipes(); } catch (e) {}
}
function maxUser() {
  try { const w = maxW(); return (w && w.initDataUnsafe && w.initDataUnsafe.user) || null; } catch (e) { return null; }
}
let lastHaptic = 0;
function haptic(kind) {
  const now = performance.now(); if (now - lastHaptic < 140) return; lastHaptic = now;
  try {
    const w = maxW(); if (!w || !w.HapticFeedback) return;
    if (kind === 'success' || kind === 'warning' || kind === 'error') w.HapticFeedback.notificationOccurred(kind);
    else w.HapticFeedback.impactOccurred(kind || 'light');
  } catch (e) {}
}
function metrika(fn, extra) { try { if (window.GameMetrika && window.GameMetrika[fn]) window.GameMetrika[fn](extra || {}); } catch (e) {} }

// ---------------- сохранения ----------------
const SAVE = {
  v: 1, money: 0, unlocked: 1, best: {}, stars: {}, up: { engine: 0, susp: 0, tires: 0, tank: 0, lock: 0 }, awd: false,
  horn: 'bip', horns: ['bip'], cos: [], cosOn: [], ach: {}, endlessBest: 0, sound: true, music: true, radio: 1,
  daily: { last: '', streak: 0 }, tut: false, gfx: 'auto',
  st: { deliveries: 0, flips: 0, airMax: 0, shoo: 0, fines: 0, polite: 0, crashes: 0, km: 0, coins: 0, radios: [], cowhits: 0, earned: 0 }
};
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
    const d = JSON.parse(raw); if (!d || typeof d !== 'object') return;
    SAVE.money = Math.max(0, Math.min(1e9, d.money | 0));
    SAVE.unlocked = Math.max(1, Math.min(TOTAL_ROUTES, d.unlocked | 0 || 1));
    if (d.best && typeof d.best === 'object') for (const k in d.best) SAVE.best[k] = Math.max(0, d.best[k] | 0);
    if (d.stars && typeof d.stars === 'object') for (const k in d.stars) SAVE.stars[k] = clamp(d.stars[k] | 0, 0, 3);
    if (d.up && typeof d.up === 'object') for (const k in SAVE.up) SAVE.up[k] = clamp(d.up[k] | 0, 0, 4);
    SAVE.awd = !!d.awd;
    if (Array.isArray(d.horns)) SAVE.horns = d.horns.filter(h => HORNS.some(x => x.key === h)); if (!SAVE.horns.includes('bip')) SAVE.horns.unshift('bip');
    if (typeof d.horn === 'string' && SAVE.horns.includes(d.horn)) SAVE.horn = d.horn;
    if (Array.isArray(d.cos)) SAVE.cos = d.cos.filter(c => COSMETICS.some(x => x.key === c));
    if (Array.isArray(d.cosOn)) SAVE.cosOn = d.cosOn.filter(c => SAVE.cos.includes(c));
    if (d.ach && typeof d.ach === 'object') for (const k in d.ach) if (ACHIEVEMENTS.some(a => a.id === k)) SAVE.ach[k] = true;
    SAVE.endlessBest = Math.max(0, d.endlessBest | 0);
    if (typeof d.sound === 'boolean') SAVE.sound = d.sound;
    if (typeof d.music === 'boolean') SAVE.music = d.music;
    SAVE.radio = clamp(d.radio | 0, 0, RADIO.length - 1);
    if (d.daily && typeof d.daily === 'object') { SAVE.daily.last = String(d.daily.last || ''); SAVE.daily.streak = clamp(d.daily.streak | 0, 0, 999); }
    SAVE.tut = !!d.tut;
    if (['auto', 'fast', 'high'].includes(d.gfx)) SAVE.gfx = d.gfx;
    if (d.st && typeof d.st === 'object') for (const k in SAVE.st) {
      if (k === 'radios') SAVE.st.radios = Array.isArray(d.st.radios) ? d.st.radios.filter(x => typeof x === 'string').slice(0, 10) : [];
      else SAVE.st[k] = Math.max(0, +d.st[k] || 0);
    }
  } catch (e) {}
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
let persistTimer = 0;
function persistSoon() { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 500); }
function totalScore() { let s = 0; for (const k in SAVE.best) s += SAVE.best[k]; return s + SAVE.endlessBest; }
function totalStars() { let s = 0; for (const k in SAVE.stars) s += SAVE.stars[k]; return s; }

// ---------------- рейтинг ----------------
let lastSentScore = 0;
function submitScore() {
  const scoreToSend = Math.floor(totalScore());
  if (scoreToSend <= 0 || scoreToSend === lastSentScore) return;
  if (window.GameSDK && typeof GameSDK.saveScore === 'function') {
    try {
      GameSDK.saveScore(scoreToSend).then(res => {
        if (res && res.ok) {
          lastSentScore = scoreToSend;
          if (res.is_new_record) { toast('Новый рекорд в рейтинге!'); metrika('newRecord'); }
        }
      }).catch(e => console.warn('[Game] saveScore ошибка:', e));
    } catch (e) { console.warn('[Game] saveScore ошибка:', e); }
  }
}

// ---------------- поделиться ----------------
function fullShareText(text) { return text.includes(SHARE_LINK) ? text : text + '\nиграй прямо в Максе без скачиваний ' + SHARE_LINK; }
function shareText(text) {
  const fullText = fullShareText(text);
  metrika('shareClick');
  try { if (window.WebApp && window.WebApp.shareContent) { window.WebApp.shareContent({ text: fullText }); return; } } catch (e) {}
  try { if (navigator.share) { navigator.share({ text: fullText }).catch(() => {}); return; } } catch (e) {}
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(fullText).then(() => toast('Текст со ссылкой скопирован')).catch(() => toast('Поделись с друзьями!')); return; }
  } catch (e) {}
  toast('Поделись с друзьями!');
}
function shareWithCard(text, cardCanvas) {
  if ((window.WebApp && window.WebApp.shareContent) || !navigator.canShare || !window.File || !cardCanvas) return shareText(text);
  try {
    cardCanvas.toBlob(async blob => {
      try {
        if (!blob) return shareText(text);
        const file = new File([blob], 'gazel.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) { metrika('shareClick'); await navigator.share({ files: [file], text: fullShareText(text) }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      shareText(text);
    }, 'image/png');
  } catch (e) { shareText(text); }
}
function openPrivacy() {
  try { if (window.GameSDK && GameSDK.openConsentSettings) { GameSDK.openConsentSettings(); return; } } catch (e) {}
  toast('Настройки доступны в Максе');
}

// ---------------- вёрстка под видимую область ----------------
const app = $('app');
let APPW = 390, APPH = 700, ROT = false, LAND = false, UIK = 1;
function visibleSize() {
  const vv = window.visualViewport;
  let w = window.innerWidth, h = window.innerHeight;
  if (vv && vv.width > 50 && vv.height > 50) { w = Math.min(w, vv.width); h = Math.min(h, vv.height); }
  const de = document.documentElement;
  if (de && de.clientHeight > 50) h = Math.min(h, de.clientHeight);
  return { w: Math.round(w), h: Math.round(h) };
}
function layoutApp() {
  const s = visibleSize(), st = app.style;
  let w = s.w, h = s.h;
  if (w > h * 2.4) w = Math.round(h * 2.4);   // очень широкий монитор — по центру
  st.width = w + 'px'; st.height = h + 'px';
  st.left = Math.round((s.w - w) / 2) + 'px'; st.top = '0px'; st.transform = 'none';
  ROT = false; APPW = w; APPH = h;
  LAND = w > h * 1.05;
  app.classList.toggle('land', LAND);
  fitUI();
}
function fitPanel(p) {
  p.style.scale = '1';
  const k = Math.min(1, (APPW - 16) / p.offsetWidth, (APPH - 16) / p.offsetHeight);
  p.style.scale = String(k);
}
function fitWrap(el, bw, bh) {
  if (!el) return 1;
  const k = Math.min(1.25, APPW / bw, APPH / bh);
  el.style.width = (APPW / k) + 'px'; el.style.height = (APPH / k) + 'px';
  el.style.transformOrigin = '0 0'; el.style.transform = 'scale(' + k + ')';
  return k;
}
function fitUI() {
  const bw = LAND ? 760 : 390, bh = LAND ? 420 : 700;
  UIK = fitWrap($('menuIn'), bw, bh);
  fitWrap($('routesIn'), LAND ? 760 : 390, LAND ? 420 : 700);
  fitWrap($('garageIn'), LAND ? 760 : 390, LAND ? 420 : 700);
  fitWrap($('loadIn'), LAND ? 760 : 390, LAND ? 420 : 700);
  document.querySelectorAll('.overlay.show .panel').forEach(fitPanel);
  const c = Math.max(0.62, Math.min(1.15, Math.min(APPH, APPW * 1.3) / 380));
  document.querySelectorAll('.ctrl-group').forEach(g => { g.style.transform = 'scale(' + c + ')'; });
  const hk = clamp(Math.min(APPW / 390, APPH / 560), 0.72, 1.3);
  document.querySelectorAll('.hud-scale').forEach(g => { g.style.transform = 'scale(' + hk + ')'; });
  if (typeof resizeCanvas === 'function') resizeCanvas();
}
window.addEventListener('resize', layoutApp);
window.addEventListener('orientationchange', () => setTimeout(layoutApp, 200));
if (window.visualViewport) window.visualViewport.addEventListener('resize', layoutApp);

function toGame(e) {
  const r = app.getBoundingClientRect();
  if (ROT) return { x: (e.clientY - r.top) * (APPW / r.height), y: (r.right - e.clientX) * (APPH / r.width) };
  return { x: (e.clientX - r.left) * (APPW / r.width), y: (e.clientY - r.top) * (APPH / r.height) };
}

// своя прокрутка списков с инерцией (свайп не нажимает кнопки)
function makeScroll(el) {
  el.style.touchAction = 'none'; el.style.overscrollBehavior = 'contain';
  let pid = null, y0 = 0, s0 = 0, ly = 0, lt = 0, vel = 0, moved = false, raf = 0;
  const k = () => { const r = el.getBoundingClientRect(); return ((ROT ? r.width : r.height) / el.offsetHeight) || 1; };
  el.addEventListener('pointerdown', e => { pid = e.pointerId; y0 = ly = toGame(e).y; s0 = el.scrollTop; lt = performance.now(); vel = 0; moved = false; cancelAnimationFrame(raf); });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    const y = toGame(e).y;
    if (!moved && Math.abs(y - y0) > 8) { moved = true; try { el.setPointerCapture(pid); } catch (_) {} }
    if (!moved) return;
    el.scrollTop = s0 - (y - y0) / k();
    const t = performance.now(); if (t > lt) vel = (ly - y) / k() / (t - lt); ly = y; lt = t;
  });
  const end = e => {
    if (e.pointerId !== pid) return; pid = null; if (!moved) return;
    let last = performance.now();
    const step = t => { const dt = t - last; last = t; el.scrollTop += vel * dt; vel *= Math.pow(0.995, dt); if (Math.abs(vel) > 0.02) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

// ---------------- экраны, оверлеи, тост ----------------
let SCREEN = 'load';
function showScreen(name) {
  SCREEN = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
  fitUI();
}
function openOverlay(id) {
  const o = $(id); o.classList.add('show');
  const p = o.querySelector('.panel'); if (p) { fitPanel(p); requestAnimationFrame(() => fitPanel(p)); }
}
function closeOverlay(id) { $(id).classList.remove('show'); }
function closeAllOverlays() { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show')); }
function anyOverlay() { return !!document.querySelector('.overlay.show'); }
let toastTimer = 0;
function toast(text) {
  const t = $('toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function svgIcon(id, cls) { return '<svg class="ico ' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
function confirmBox(title, text, okText, onOk) {
  $('cf-title').textContent = title; $('cf-text').textContent = text; $('cf-ok').textContent = okText || 'Да';
  $('cf-ok').onclick = () => { FX.click(); closeOverlay('ov-confirm'); onOk(); };
  openOverlay('ov-confirm');
}
