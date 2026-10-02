// =====================================================================
//  ЗВУК: синтез эффектов (Web Audio), мотор, гудки, голос Серёги,
//  сэмплы животных, музыка меню и радио (HTMLAudio)
// =====================================================================
'use strict';
const FX = (() => {
  let ctx = null, master = null, sfxBus = null, noiseBuf = null, revIn = null;
  const samples = {};
  let engine = null;
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 0.85;
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // простое эхо для фанфар
      try {
        revIn = ctx.createGain(); revIn.gain.value = 0.25;
        const dl = ctx.createDelay(1); dl.delayTime.value = 0.23; const fb = ctx.createGain(); fb.gain.value = 0.35;
        const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2500;
        revIn.connect(dl); dl.connect(lpf); lpf.connect(fb); fb.connect(dl); lpf.connect(master);
      } catch (e) { revIn = null; }
      decodeSamples();
    }
    if (ctx.state === 'suspended' && !document.hidden) { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function decodeSamples() {
    if (!window.SFX_DATA) return;
    Object.keys(SFX_DATA).forEach(k => {
      try {
        const bin = atob(SFX_DATA[k]); const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const p = ctx.decodeAudioData(buf.buffer, b => { samples[k] = b; }, () => {});
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    });
  }
  function tone(freq, dur, type, vol, delay, slide, echo) {
    const ac = audio(); if (!ac || !SAVE.sound) return;
    try {
      const t = ac.currentTime + (delay || 0);
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(sfxBus); if (echo && revIn) gain.connect(revIn);
      osc.start(t); osc.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function noise(dur, vol, cutoff, delay, type, q, endCut) {
    const ac = audio(); if (!ac || !SAVE.sound) return;
    try {
      const t = ac.currentTime + (delay || 0);
      const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
      const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.Q.value = q || 0.8;
      f.frequency.setValueAtTime(cutoff, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(60, endCut || cutoff * 0.2), t + dur);
      const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(sfxBus);
      s.start(t, Math.random()); s.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function sample(name, vol, rate, delay) {
    const ac = audio(); if (!ac || !SAVE.sound || !samples[name]) return false;
    try {
      const s = ac.createBufferSource(); s.buffer = samples[name]; s.playbackRate.value = rate || 1;
      const g = ac.createGain(); g.gain.value = vol || 0.6; s.connect(g); g.connect(sfxBus);
      s.start(ac.currentTime + (delay || 0)); return true;
    } catch (e) { return false; }
  }
  // ---------------- мотор Газели ----------------
  function engineStart() {
    const ac = audio(); if (!ac || engine) return;
    try {
      const out = ac.createGain(); out.gain.value = 0;
      const lpf = ac.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 600; lpf.Q.value = 2.5;
      const o1 = ac.createOscillator(); o1.type = 'sawtooth';
      const o2 = ac.createOscillator(); o2.type = 'square';
      const o3 = ac.createOscillator(); o3.type = 'sine';
      const g1 = ac.createGain(); g1.gain.value = 0.5; const g2 = ac.createGain(); g2.gain.value = 0.25; const g3 = ac.createGain(); g3.gain.value = 0.6;
      // «стук» цилиндров — амплитудная модуляция
      const lfo = ac.createOscillator(); lfo.type = 'square'; const lfoG = ac.createGain(); lfoG.gain.value = 0.25;
      const am = ac.createGain(); am.gain.value = 0.75;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      o1.connect(g1); o2.connect(g2); o3.connect(g3); g1.connect(lpf); g2.connect(lpf); g3.connect(am); lpf.connect(am); am.connect(out);
      const ns = ac.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
      const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 400; nf.Q.value = 0.7;
      const ng = ac.createGain(); ng.gain.value = 0.05; ns.connect(nf); nf.connect(ng); ng.connect(out);
      // ветер на скорости
      const ws = ac.createBufferSource(); ws.buffer = noiseBuf; ws.loop = true;
      const wf = ac.createBiquadFilter(); wf.type = 'highpass'; wf.frequency.value = 900;
      const wg = ac.createGain(); wg.gain.value = 0; ws.connect(wf); wf.connect(wg); wg.connect(master);
      // скрежет/занос
      const ss = ac.createBufferSource(); ss.buffer = noiseBuf; ss.loop = true;
      const sf = ac.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 2200; sf.Q.value = 3;
      const sg = ac.createGain(); sg.gain.value = 0; ss.connect(sf); sf.connect(sg); sg.connect(master);
      out.connect(master);
      [o1, o2, o3, lfo, ns, ws, ss].forEach(n => n.start());
      engine = { out, lpf, o1, o2, o3, lfo, ng, wg, sg, sf, nodes: [o1, o2, o3, lfo, ns, ws, ss] };
    } catch (e) { engine = null; }
  }
  function engineSet(rpm, thr, speed, scrape) {
    if (!engine || !ctx) return;
    const t = ctx.currentTime;
    const f = 32 + rpm * 70;
    try {
      engine.o1.frequency.setTargetAtTime(f, t, 0.05); engine.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05); engine.o3.frequency.setTargetAtTime(f * 0.5, t, 0.05);
      engine.lfo.frequency.setTargetAtTime(f * 0.25, t, 0.05);
      engine.lpf.frequency.setTargetAtTime(380 + thr * 900 + rpm * 500, t, 0.06);
      engine.out.gain.setTargetAtTime(SAVE.sound ? 0.10 + thr * 0.12 : 0, t, 0.08);
      engine.ng.gain.setTargetAtTime(SAVE.sound ? 0.03 + thr * 0.06 : 0, t, 0.1);
      engine.wg.gain.setTargetAtTime(SAVE.sound ? Math.min(0.08, speed * speed * 0.00009) : 0, t, 0.2);
      engine.sg.gain.setTargetAtTime(SAVE.sound ? Math.min(0.12, scrape * 0.03) : 0, t, 0.05);
    } catch (e) {}
  }
  function engineStop() {
    if (!engine) return;
    try { engine.out.gain.value = 0; engine.wg.gain.value = 0; engine.sg.gain.value = 0; engine.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); } catch (e) {}
    engine = null;
  }
  // ---------------- голос Серёги («бубнёж») ----------------
  function voice(text, mood) {
    const ac = audio(); if (!ac || !SAVE.sound) return;
    const n = Math.min(10, Math.max(3, Math.round(text.length / 6)));
    const base = mood === 'scared' ? 260 : mood === 'happy' ? 200 : 150;
    for (let i = 0; i < n; i++) {
      const t = i * 0.085 + Math.random() * 0.02, f = base * (0.85 + Math.random() * 0.5);
      try {
        const tt = ac.currentTime + t;
        const o = ac.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(f, tt); o.frequency.linearRampToValueAtTime(f * (0.9 + Math.random() * 0.25), tt + 0.07);
        const bpf = ac.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 700 + Math.random() * 900; bpf.Q.value = 3;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(0.11, tt + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.075);
        o.connect(bpf); bpf.connect(g); g.connect(sfxBus); o.start(tt); o.stop(tt + 0.09);
      } catch (e) {}
    }
  }
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  return {
    ctx: audio, tone, noise, sample, engineStart, engineSet, engineStop, voice,
    unlock() { audio(); },
    suspend() { try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch (e) {} },
    resume() { try { if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume(); } catch (e) {} },
    click() { tone(900, 0.05, 'sine', 0.07); tone(1400, 0.04, 'sine', 0.03, 0.02); },
    tab() { tone(600, 0.05, 'triangle', 0.06); },
    buy() { [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, i * 0.06)); noise(0.2, 0.05, 8000, 0.05, 'highpass'); },
    error() { tone(220, 0.15, 'square', 0.06); tone(180, 0.22, 'square', 0.06, 0.12); },
    coin() { tone(1318, 0.07, 'square', 0.04); tone(1760, 0.14, 'square', 0.04, 0.06); tone(2637, 0.1, 'sine', 0.03, 0.06); },
    fuel() { for (let i = 0; i < 5; i++) tone(220 + i * 40, 0.08, 'sine', 0.12, i * 0.06, 160 + i * 40); tone(660, 0.2, 'triangle', 0.06, 0.32); },
    wrench() { tone(1800, 0.06, 'square', 0.05); tone(2400, 0.08, 'triangle', 0.05, 0.08); noise(0.08, 0.1, 5000, 0.04, 'bandpass', 4); tone(1200, 0.12, 'sine', 0.06, 0.18); },
    boost() { noise(0.9, 0.18, 400, 0, 'bandpass', 1.2, 4000); tone(110, 0.8, 'sawtooth', 0.08, 0, 330); tone(523, 0.1, 'square', 0.05, 0.1); tone(784, 0.15, 'square', 0.05, 0.2); },
    magnet() { tone(400, 0.4, 'sine', 0.08, 0, 1600); tone(800, 0.3, 'triangle', 0.05, 0.1, 2400); },
    bump(v) { tone(70, 0.18, 'sine', Math.min(0.3, 0.08 + v * 0.03), 0, 40); noise(0.12, Math.min(0.15, v * 0.03), 600); },
    land(v) { tone(55, 0.35, 'sine', Math.min(0.4, 0.15 + v * 0.03), 0, 30); noise(0.3, Math.min(0.3, 0.06 + v * 0.03), 900); noise(0.15, 0.06, 4000, 0.02, 'bandpass', 2); },
    scrape() { noise(0.25, 0.12, 3000, 0, 'bandpass', 3, 1500); },
    crash() { noise(1.0, 0.35, 2500, 0, 'lowpass', 1, 200); tone(90, 0.8, 'sawtooth', 0.12, 0, 35); for (let i = 0; i < 6; i++) tone(1200 + Math.random() * 2400, 0.25, 'square', 0.03, 0.05 + i * 0.07); },
    door() { tone(180, 0.35, 'sawtooth', 0.05, 0, 520); tone(240, 0.3, 'sawtooth', 0.03, 0.05, 140); noise(0.1, 0.12, 1800, 0.3); },
    splat() { noise(0.3, 0.25, 1400, 0, 'lowpass', 1, 200); tone(140, 0.12, 'sine', 0.12, 0, 60); },
    crack() { for (let i = 0; i < 3; i++) noise(0.05, 0.15, 6000, i * 0.03, 'highpass'); },
    glass() { for (let i = 0; i < 5; i++) tone(2400 + Math.random() * 2400, 0.3, 'sine', 0.04, i * 0.03); noise(0.2, 0.1, 8000, 0, 'highpass'); },
    clang() { [523, 1046, 1567, 2217].forEach((f, i) => tone(f * (0.98 + Math.random() * 0.04), 0.6 - i * 0.1, 'triangle', 0.06, 0)); noise(0.06, 0.1, 6000); },
    thud() { tone(90, 0.2, 'sine', 0.15, 0, 50); noise(0.15, 0.1, 700); },
    bayan() { [57, 60, 64].forEach(n => { tone(NOTE(n + 12), 0.6, 'sawtooth', 0.025); tone(NOTE(n + 12) * 1.004, 0.6, 'sawtooth', 0.02); }); },
    honk() { if (!sample('honk', 0.5, 0.95 + Math.random() * 0.2)) { tone(420, 0.18, 'square', 0.06, 0, 360); tone(420, 0.18, 'square', 0.06, 0.25, 360); } },
    moo(r) { if (!sample('moo', 0.65, r || 1)) { tone(140, 1.1, 'sawtooth', 0.08, 0, 100); } },
    meow() { if (!sample('meow', 0.5, 1)) tone(700, 0.5, 'triangle', 0.07, 0, 500); },
    bark() { if (!sample('bark', 0.45, 0.9 + Math.random() * 0.2)) noise(0.12, 0.2, 1200, 0, 'bandpass', 3); },
    bear() { if (!sample('bear', 0.6, 1)) tone(80, 0.8, 'sawtooth', 0.1, 0, 60); },
    whistle() { for (let i = 0; i < 8; i++) tone(i % 2 ? 2600 : 3000, 0.07, 'sine', 0.08, i * 0.06); tone(2800, 0.45, 'sine', 0.08, 0.5); },
    siren() { for (let i = 0; i < 4; i++) { tone(700, 0.18, 'square', 0.035, i * 0.36, 1100); tone(1100, 0.18, 'square', 0.035, i * 0.36 + 0.18, 700); } },
    horn(kind) {
      const h = kind || SAVE.horn;
      if (h === 'cuca') { [67, 67, 67, 72, 76, 67, 67, 67, 72, 76].forEach((n, i) => { const t = [0, .12, .24, .36, .66, 1.02, 1.14, 1.26, 1.38, 1.68][i]; tone(NOTE(n), 0.11, 'square', 0.06, t); tone(NOTE(n + 4), 0.11, 'square', 0.04, t); }); }
      else if (h === 'train') { [0, 0.55].forEach(d => [311, 370, 466].forEach(f => { tone(f, 0.5, 'sawtooth', 0.045, d, f * 0.98); })); }
      else if (h === 'cow') { if (!sample('moo', 0.8, 1.2)) tone(160, 0.8, 'sawtooth', 0.08, 0, 120); tone(330, 0.3, 'square', 0.04); }
      else { tone(415, 0.16, 'square', 0.07); tone(523, 0.16, 'square', 0.05); tone(415, 0.24, 'square', 0.07, 0.2); tone(523, 0.24, 'square', 0.05, 0.2); }
    },
    radioSwitch() { noise(0.35, 0.12, 6000, 0, 'bandpass', 0.6, 2000); tone(1000, 0.04, 'sine', 0.05, 0.3); },
    star(i) { tone(880 * Math.pow(1.26, i), 0.35, 'triangle', 0.1, 0, null, true); tone(1760 * Math.pow(1.26, i), 0.25, 'sine', 0.05, 0.03, null, true); },
    achieve() { [784, 988, 1175, 1568].forEach((f, i) => { tone(f, 0.25, 'triangle', 0.09, i * 0.09, null, true); }); tone(392, 0.6, 'sine', 0.1, 0.27, null, true); },
    popup() { tone(660, 0.08, 'sine', 0.05); tone(990, 0.1, 'sine', 0.04, 0.05); },
    stunt() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.045, i * 0.05)); },
    countdown(go) { tone(go ? 1046 : 523, go ? 0.5 : 0.18, 'square', 0.07); tone(go ? 2092 : 1046, go ? 0.4 : 0.12, 'sine', 0.04); },
    win() {
      const seqN = [60, 64, 67, 72, 67, 72, 76, 79];
      seqN.forEach((n, i) => { tone(NOTE(n), 0.22, 'square', 0.06, i * 0.1, null, true); tone(NOTE(n - 12), 0.25, 'triangle', 0.08, i * 0.1); });
      [72, 76, 79, 84].forEach(n => { tone(NOTE(n), 1.6, 'sawtooth', 0.025, 0.85, null, true); tone(NOTE(n) * 1.005, 1.6, 'sawtooth', 0.02, 0.85); });
      tone(NOTE(36), 1.6, 'sine', 0.22, 0.85); tone(NOTE(48), 1.2, 'triangle', 0.1, 0.85);
      noise(0.6, 0.1, 9000, 0.85, 'highpass'); noise(0.3, 0.08, 3000, 0.85);
      [0, 0.2, 0.4].forEach(d => tone(NOTE(96), 0.2, 'sine', 0.03, 1.2 + d, null, true));
    },
    lose() {
      [67, 66, 65, 64].forEach((n, i) => { tone(NOTE(n), 0.36, 'sawtooth', 0.07, i * 0.3); tone(NOTE(n - 12), 0.4, 'triangle', 0.08, i * 0.3); });
      [52, 55, 58, 61].forEach(n => tone(NOTE(n), 1.8, 'sawtooth', 0.03, 1.25, null, true));
      tone(NOTE(28), 2.0, 'sine', 0.25, 1.25); noise(1.0, 0.1, 700, 1.25);
      tone(NOTE(64), 0.15, 'square', 0.05, 2.6); tone(NOTE(60), 0.6, 'square', 0.05, 2.75, NOTE(55));
    }
  };
})();
document.addEventListener('pointerdown', () => FX.unlock(), true);
document.addEventListener('keydown', () => FX.unlock(), true);

// ---------------- музыка: меню и радио ----------------
const MUSIC = (() => {
  const els = {};
  let current = null, want = null, vol = 0.55;
  function el(file) {
    if (!els[file]) { const a = new Audio(); a.src = file; a.loop = true; a.preload = 'auto'; a.volume = vol; els[file] = a; }
    return els[file];
  }
  function play(file) {
    want = file;
    if (current && current !== file) { try { els[current].pause(); } catch (e) {} }
    current = file;
    if (!file || !SAVE.music || document.hidden) return;
    try { const a = el(file); a.volume = vol; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }
  function stop() { want = null; if (current) { try { els[current].pause(); } catch (e) {} } current = null; }
  function pauseAll() { Object.keys(els).forEach(k => { try { els[k].pause(); } catch (e) {} }); }
  function resume() { if (want && SAVE.music && !document.hidden) play(want); }
  function setVol(v) { vol = v; if (current && els[current]) els[current].volume = v; }
  return { play, stop, pauseAll, resume, setVol, get want() { return want; } };
})();
function menuMusic() { MUSIC.setVol(0.5); MUSIC.play('audio/menu_garage.mp3'); }
function radioMusic() {
  const st = RADIO[SAVE.radio];
  MUSIC.setVol(0.42);
  if (!st || !st.file) MUSIC.stop(); else MUSIC.play(st.file);
}
