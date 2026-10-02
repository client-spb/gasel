#!/usr/bin/env python3
# Генератор музыки для «Газели Серёги»: синтез на numpy, кодирование в MP3 через ffmpeg.
# Запуск: python3 tools/music.py  → audio/*.mp3 и js/sfxdata.js
import numpy as np, subprocess, os, sys, base64
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
rng = np.random.default_rng(7)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12.0)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def nm(s):
    """'C#5' → midi"""
    base = NOTE[s[0]]; i = 1; acc = 0
    while i < len(s) and s[i] in '#b':
        acc += 1 if s[i] == '#' else -1; i += 1
    return base + acc + 12 * (int(s[i:]) + 1)
def seq(text, start=0.0):
    """'E5 1, B4 .5, - 1' → [(beat, dur, midi|None)]"""
    out = []; t = start
    for tok in text.replace('\n', ' ').split(','):
        tok = tok.strip()
        if not tok: continue
        n, d = tok.split(); d = float(d)
        out.append((t, d, None if n == '-' else nm(n))); t += d
    return out

def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR * 0.45) / (SR / 2), 'low', output='sos'), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), 'high', output='sos'), x)
def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], 'band', output='sos'), x)

def tvec(dur): return np.arange(int(dur * SR)) / SR
def env(n, a, d, s, r, hold):
    """ADSR: hold — длительность до отпускания (с)"""
    t = np.arange(n) / SR; e = np.zeros(n)
    a = max(a, 1e-4); d = max(d, 1e-4)
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = t > hold
    if rel.any():
        lvl = np.interp(hold, t, e) if hold < t[-1] else s
        e = np.where(rel, lvl * np.exp(-(t - hold) / max(r, 1e-3) * 4.6), e)
    return e
def saw(f, t, ph=0.0): return 2 * ((f * t + ph) % 1.0) - 1
def sq(f, t, duty=0.5): return np.where((f * t) % 1.0 < duty, 1.0, -1.0)
def tri(f, t): return 2 * np.abs(saw(f, t)) - 1

# ---------- блочные рекурсивные фильтры (быстро) ----------
def comb(x, D, g):
    y = np.concatenate([x, np.zeros(D)]).astype(np.float64)
    for k in range(D, len(y), D):
        e = min(k + D, len(y)); y[k:e] += g * y[k - D:e - D]
    return y[:len(x)]
def allpass(x, D, g):
    n = len(x); xin = np.concatenate([np.zeros(D), x]); y = np.zeros(n + D)
    for k in range(D, n + D, D):
        e = min(k + D, n + D)
        y[k:e] = -g * xin[k:e] + xin[k - D:e - D] + g * y[k - D:e - D]
    return y[D:]
def reverb(x, size=1.0, damp=4000):
    combs = [1557, 1617, 1491, 1422, 1277, 1356]
    out = np.zeros_like(x)
    for c in combs: out += comb(lp(x, damp, 1), int(c * size), 0.80)
    out /= len(combs)
    for a in [225, 556, 441]: out = allpass(out, a, 0.5)
    return out

def ks(f, dur, bright=0.5, decay=0.996, pick=None):
    """Карплус-Стронг: гитара, балалайка"""
    N = max(2, int(SR / f)); n = int(dur * SR)
    burst = rng.uniform(-1, 1, N)
    burst = lp(burst, 1500 + bright * 9000, 1)
    y = np.zeros(n + N + 1); y[:N] = burst
    a = decay
    for k in range(N + 1, n + N + 1, N):
        e = min(k + N, n + N + 1)
        y[k:e] += a * 0.5 * (y[k - N:e - N] + y[k - N - 1:e - N - 1])
    return y[:n]

# ---------- инструменты ----------
def bayan(m, dur, vel=1.0):
    f = midi(m); t = tvec(dur + 0.15)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 5.6 * t)
    s = saw(f, t) + 0.8 * saw(f * 1.0045, t, 0.3) + 0.6 * saw(f * 0.9962, t, 0.6) + 0.35 * sq(f * 0.5, t, 0.4)
    s = lp(s, 2600) * trem
    return s * env(len(t), 0.03, 0.1, 0.85, 0.12, dur) * 0.16 * vel
def guitar(m, dur, vel=1.0, bright=0.45):
    return ks(midi(m), dur + 0.3, bright, 0.995) * env(int((dur + 0.3) * SR), 0.002, 0.05, 1.0, 0.15, dur + 0.15) * 0.5 * vel
def strum(ms, dur, vel=1.0, gap=0.012, bright=0.45, down=True):
    L = int((dur + 0.4 + gap * len(ms)) * SR); out = np.zeros(L)
    order = ms if down else ms[::-1]
    for i, m in enumerate(order):
        g = guitar(m, dur, vel * (0.9 + 0.1 * rng.random()), bright); o = int(i * gap * SR); out[o:o + len(g)] += g[:L - o]
    return out
def balalaika(m, dur, vel=1.0):
    # тремоло-щипки 16-ми
    step = 0.065; L = int((dur + 0.3) * SR); out = np.zeros(L); t = 0.0
    while t < dur:
        g = ks(midi(m), 0.25, 0.85, 0.990) * 0.35 * vel; o = int(t * SR); e = min(L, o + len(g)); out[o:e] += g[:e - o]; t += step
    return hp(out, 200)
def bass(m, dur, vel=1.0, kind='round'):
    f = midi(m); t = tvec(dur + 0.1)
    if kind == 'synth':
        s = 0.6 * saw(f, t) + 0.5 * sq(f * 0.5, t)
        fe = env(len(t), 0.003, 0.18, 0.15, 0.05, dur)
        s = lp(s, 300) * (1 - fe) + lp(s, 1800) * fe
    elif kind == 'tuba':
        s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * saw(f, t)
        s = lp(s, 900)
    else:
        s = np.sin(2 * np.pi * f * t) + 0.3 * tri(f * 2, t) + 0.15 * saw(f, t)
        s = lp(s, 1200)
    return s * env(len(t), 0.005, 0.2, 0.6, 0.08, dur) * 0.42 * vel
def epiano(m, dur, vel=1.0):
    f = midi(m); t = tvec(dur + 0.6)
    I = 1.6 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t)) + 0.2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
    s *= 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return s * env(len(t), 0.004, 0.6, 0.35, 0.3, dur) * 0.16 * vel
def pad(m, dur, vel=1.0, cut=1600):
    f = midi(m); t = tvec(dur + 0.8)
    s = sum(saw(f * (1 + d), t, i * 0.21) for i, d in enumerate([-0.007, -0.003, 0, 0.003, 0.007]))
    return lp(s, cut) * env(len(t), 0.35, 0.3, 0.8, 0.7, dur) * 0.05 * vel
def lead(m, dur, vel=1.0, kind='square'):
    f = midi(m); t = tvec(dur + 0.2)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1)
    ph = np.cumsum(f * vib) / SR
    s = (2 * ((ph % 1.0) < 0.5) - 1) * 0.7 + 0.5 * (2 * (ph % 1.0) - 1) if kind == 'square' else np.sin(2 * np.pi * ph) + 0.3 * np.sin(4 * np.pi * ph)
    s = lp(s, 3200)
    return s * env(len(t), 0.01, 0.1, 0.8, 0.1, dur) * 0.11 * vel
def bell(m, dur, vel=1.0):
    f = midi(m); t = tvec(dur + 1.2)
    I = 2.5 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * 3.5 * t))
    return s * np.exp(-t * 2.2) * env(len(t), 0.002, 0.1, 1, 0.5, dur + 1.0) * 0.14 * vel
def whistle(m, dur, vel=1.0):
    f = midi(m); t = tvec(dur + 0.2)
    vib = 1 + 0.01 * np.sin(2 * np.pi * 6 * t) * np.clip(t * 2, 0, 1)
    ph = np.cumsum(f * vib) / SR
    s = np.sin(2 * np.pi * ph) + 0.08 * bp(rng.uniform(-1, 1, len(t)), f * 0.9, f * 1.2)
    return s * env(len(t), 0.04, 0.1, 0.8, 0.12, dur) * 0.09 * vel
def dist_guitar(ms, dur, vel=1.0, mute=False):
    t = tvec(dur + 0.15); s = np.zeros(len(t))
    for i, m in enumerate(ms):
        f = midi(m); s += saw(f, t, i * 0.3) + 0.6 * saw(f * 1.003, t, i * 0.5)
    s = np.tanh(s * 3.5)
    s = lp(hp(s, 90), 3000 if not mute else 1400)
    e = env(len(t), 0.003, 0.08 if mute else 0.3, 0.2 if mute else 0.7, 0.05, dur * (0.6 if mute else 1.0))
    return s * e * 0.13 * vel

# ---------- ударные ----------
def kick(vel=1.0):
    t = tvec(0.45); f = 45 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s[:200] += rng.uniform(-1, 1, 200) * 0.3 * np.linspace(1, 0, 200)
    return s * 0.75 * vel
def snare(vel=1.0, tail=0.18):
    t = tvec(tail + 0.1); n = bp(rng.uniform(-1, 1, len(t)), 1200, 9000) * np.exp(-t / tail * 4)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (n * 0.55 + tone * 0.4) * vel
def clap(vel=1.0):
    t = tvec(0.3); n = bp(rng.uniform(-1, 1, len(t)), 900, 5000)
    e = np.zeros(len(t))
    for o in [0, 0.011, 0.022]: e += np.where(t >= o, np.exp(-(t - o) * 60), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) * 12), 0) * 0.6
    return n * e * 0.45 * vel
def hat(vel=1.0, open_=False):
    t = tvec(0.35 if open_ else 0.08); n = hp(rng.uniform(-1, 1, len(t)), 7000)
    return n * np.exp(-t * (8 if open_ else 55)) * 0.22 * vel
def tamb(vel=1.0):
    t = tvec(0.2); n = hp(rng.uniform(-1, 1, len(t)), 5500) * (1 + 0.5 * np.sin(2 * np.pi * 70 * t))
    return n * np.exp(-t * 18) * 0.25 * vel
def brush(vel=1.0):
    t = tvec(0.25); n = bp(rng.uniform(-1, 1, len(t)), 1500, 7000)
    return n * np.minimum(t * 60, 1) * np.exp(-t * 14) * 0.18 * vel
def crash(vel=1.0):
    t = tvec(1.6); n = hp(rng.uniform(-1, 1, len(t)), 4000)
    return n * np.exp(-t * 2.5) * 0.25 * vel

class Mix:
    def __init__(self, beats, bpm, tail=3.0):
        self.bpm = bpm; self.spb = 60.0 / bpm
        self.loop = int(beats * self.spb * SR)
        n = self.loop * 2 + int(tail * SR)
        self.L = np.zeros(n); self.R = np.zeros(n)
        self.sendL = np.zeros(n); self.sendR = np.zeros(n)
    def add(self, sig, beat, pan=0.0, gain=1.0, send=0.25):
        for rep in (0, 1):  # дважды — чтобы хвост реверберации зациклился бесшовно
            o = int(beat * self.spb * SR) + rep * self.loop
            if o >= len(self.L): continue
            e = min(len(self.L), o + len(sig)); s = sig[:e - o] * gain
            gl = np.cos((pan + 1) * np.pi / 4); gr = np.sin((pan + 1) * np.pi / 4)
            self.L[o:e] += s * gl; self.R[o:e] += s * gr
            self.sendL[o:e] += s * gl * send; self.sendR[o:e] += s * gr * send
    def render(self, rsize=1.0, rdamp=4000, rgain=0.9):
        rl = reverb(self.sendL, rsize, rdamp); rr = reverb(self.sendR, rsize * 1.03, rdamp)
        L = self.L + rl * rgain; R = self.R + rr * rgain
        L = L[self.loop:self.loop * 2]; R = R[self.loop:self.loop * 2]
        st = np.stack([L, R], 1)
        st = st / (np.max(np.abs(st)) + 1e-9) * 0.92
        st = np.tanh(st * 1.15) / np.tanh(1.15)
        return st

def save_mp3(st, name, kbps=160):
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2').tobytes()
    out = os.path.join(ROOT, 'audio', name + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', out], input=pcm, check=True)
    print(name, round(len(st) / SR, 1), 's', os.path.getsize(out) // 1024, 'KB')

CH = {  # аккорды
    'Am': ['A3', 'C4', 'E4'], 'Dm': ['D3', 'F3', 'A3', 'D4'], 'E': ['E3', 'G#3', 'B3', 'E4'], 'A7': ['A3', 'C#4', 'E4', 'G4'],
    'Gm': ['G3', 'Bb3', 'D4', 'G4'], 'D7': ['D3', 'F#3', 'A3', 'C4'], 'C': ['C4', 'E4', 'G4'], 'G': ['G3', 'B3', 'D4', 'G4'],
    'F': ['F3', 'A3', 'C4', 'F4'], 'Em': ['E3', 'G3', 'B3', 'E4'], 'D': ['D3', 'F#3', 'A3', 'D4'], 'Dm7': ['D3', 'F3', 'A3', 'C4'],
    'E7': ['E3', 'G#3', 'B3', 'D4']
}
def chord(name): return [nm(x) for x in CH[name]]
def root(name, octv=2):
    r = name[0] + ('b' if len(name) > 1 and name[1] == 'b' else '#' if len(name) > 1 and name[1] == '#' else '')
    return nm(r + str(octv))

# ======================= ТРЕКИ =======================
def track_garage():
    """Меню: «Гаражный вальс» — ре минор, 3/4"""
    bpm = 104; prog = ['Dm', 'Dm', 'Gm', 'Gm', 'A7', 'A7', 'Dm', 'Dm', 'Gm', 'Gm', 'Dm', 'Dm', 'A7', 'A7', 'Dm', 'D7']
    mel = seq('''D5 1, F5 1, A5 1, A5 2, G5 .5, F5 .5, G5 1, Bb5 1, G5 1, D5 3,
      E5 1, G5 1, Bb5 1, A5 2, G5 .5, E5 .5, F5 1, E5 1, D5 1, A4 3,
      Bb4 1, D5 1, G5 1, G5 2, F5 .5, E5 .5, F5 1, A5 1, D6 1, D6 2, C6 .5, Bb5 .5,
      A5 1, G5 1, E5 1, C#5 1, E5 1, G5 1, F5 1.5, E5 .5, D5 1, D5 2, - 1''')
    bars = len(prog) * 2; M = Mix(bars * 3, bpm)
    for rep in range(2):
        b0 = rep * len(prog) * 3
        for i, c in enumerate(prog):
            b = b0 + i * 3; ch = chord(c)
            M.add(bass(root(c, 2), 0.9, 0.9), b, -0.1, 1.0, 0.1)
            M.add(strum(ch[1:] if len(ch) > 3 else ch, 0.35, 0.55, bright=0.4), b + 1, 0.3, 0.7, 0.25)
            M.add(strum(ch[1:] if len(ch) > 3 else ch, 0.35, 0.5, bright=0.4, down=False), b + 2, 0.3, 0.7, 0.25)
            M.add(brush(0.6), b + 1, 0.2); M.add(brush(0.5), b + 2, -0.2)
            M.add(pad(root(c, 3) + 12, 2.8, 0.7, 1200), b, -0.4, 0.9, 0.4)
        for (t, d, m) in mel:
            if m is None: continue
            if rep == 0: M.add(bayan(m, d * M.spb * 0.95), b0 + t, -0.15, 1.0, 0.35)
            else:
                M.add(bayan(m - 12, d * M.spb * 0.95, 0.8), b0 + t, -0.25, 0.9, 0.35)
                M.add(whistle(m, d * M.spb * 0.9), b0 + t, 0.25, 1.0, 0.5)
    return M.render(1.1, 3500, 0.8)

def track_chanson():
    bpm = 112; prog = ['Am', 'Am', 'Dm', 'Dm', 'E', 'E', 'Am', 'A7', 'Dm', 'Dm', 'Am', 'Am', 'E', 'E', 'Am', 'Am']
    mel = seq('''A4 .5, C5 .5, E5 1, E5 .5, D5 .5, C5 1, B4 .5, C5 .5, A4 3,
      D5 .5, F5 .5, A5 1, A5 .5, G5 .5, F5 1, E5 .5, F5 .5, D5 3,
      B4 .5, D5 .5, E5 1, G#5 1, E5 1, F5 .5, E5 .5, D5 .5, C5 .5, B4 2,
      C5 .5, B4 .5, A4 1, E5 1, C5 1, A4 2, C#5 1, G5 1,
      F5 1.5, E5 .5, D5 1, A5 1, F5 2, D5 2, E5 1.5, D5 .5, C5 1, E5 1, A4 2, C5 1, E5 1,
      D5 1, C5 .5, B4 .5, G#4 1, B4 1, E5 2, D5 1, B4 1, C5 1, B4 .5, A4 .5, E5 1, C5 1, A4 4''')
    M = Mix(len(prog) * 4 * 2, bpm)
    for rep in range(2):
        b0 = rep * len(prog) * 4
        for i, c in enumerate(prog):
            b = b0 + i * 4; ch = chord(c); r = root(c, 2)
            M.add(bass(r, 0.45), b, -0.1, 1.0, 0.05); M.add(bass(r + 7, 0.45), b + 2, -0.1, 1.0, 0.05)
            for k in (1, 3): M.add(strum(ch, 0.22, 0.6, 0.008, 0.5), b + k, 0.35, 0.8, 0.2)
            M.add(strum(ch, 0.15, 0.35, 0.006, 0.6, False), b + 3.5, 0.35, 0.6, 0.2)
            M.add(kick(0.7), b, 0, 0.8, 0.02); M.add(kick(0.6), b + 2, 0, 0.8, 0.02)
            M.add(snare(0.5, 0.12), b + 1, 0.1, 0.6, 0.3); M.add(snare(0.55, 0.12), b + 3, 0.1, 0.6, 0.3)
            for k in range(8): M.add(hat(0.4 + 0.2 * (k % 2 == 0)), b + k * 0.5, 0.3, 0.6, 0.05)
            M.add(pad(root(c, 3) + 12, 3.8, 0.8, 1800), b, -0.5, 0.8, 0.4)
            for x in ch[:3]: M.add(pad(x + 12, 3.8, 0.4, 2200), b, 0.5, 0.6, 0.4)
        for (t, d, m) in mel:
            if m is None: continue
            M.add(bayan(m, d * M.spb * 0.92, 1.0 if rep == 0 else 0.9), b0 + t, -0.2, 1.0, 0.3)
            if rep == 1: M.add(bayan(m - 12, d * M.spb * 0.92, 0.6), b0 + t, 0.2, 0.8, 0.3)
    return M.render(1.0, 4500, 0.7)

def track_pop():
    bpm = 122; prog = ['C', 'G', 'Am', 'F'] * 8
    hook = seq('''E5 .5, G5 .5, G5 .5, A5 .5, G5 1, E5 1, D5 .5, G5 .5, G5 .5, A5 .5, B5 1, G5 1,
      C6 .5, B5 .5, A5 .5, G5 .5, E5 1, C5 1, D5 .5, E5 .5, F5 .5, E5 .5, D5 1, C5 .5, D5 .5,
      E5 1.5, C5 .5, G5 2, B4 .5, D5 .5, G5 1, F5 1, D5 1, E5 .5, A5 .5, C6 1, B5 .5, A5 .5, G5 1, G5 3, - 1''')
    M = Mix(len(prog) * 4, bpm)
    for i, c in enumerate(prog):
        b = i * 4; ch = chord(c); r = root(c, 2)
        for k in range(4):
            M.add(kick(0.9), b + k, 0, 1.0, 0.02)
            M.add(hat(0.6, True), b + k + 0.5, 0.25, 0.7, 0.1)
        if i >= 2:
            M.add(clap(0.8), b + 1, -0.1, 1.0, 0.3); M.add(clap(0.8), b + 3, -0.1, 1.0, 0.3)
        for k in range(8): M.add(bass(r + (12 if k % 2 else 0), 0.22, 0.9, 'synth'), b + k * 0.5, 0, 0.9, 0.02)
        if i >= 4:
            for k, off in enumerate([0, 1.5, 2.5]):
                for x in ch: M.add(epiano(x + 12, 0.5, 0.7), b + off, 0.35 if k % 2 else -0.35, 0.8, 0.3)
        if 12 <= i < 20:
            for x in ch: M.add(pad(x + 12, 3.8, 0.9, 2400), b, 0, 0.8, 0.4)
            arp = [ch[0], ch[1], ch[2], ch[-1]]
            for k in range(8): M.add(bell(arp[k % 4] + 24, 0.2, 0.55), b + k * 0.5, 0.5 if k % 2 else -0.5, 0.7, 0.4)
    for start in (16, 80):
        for (t, d, m) in hook:
            if m: M.add(lead(m, d * M.spb * 0.9), start + t, -0.05, 1.0, 0.3)
    for (t, d, m) in hook:
        if m: M.add(lead(m + 12, d * M.spb * 0.9, 0.6, 'sine'), 80 + t, 0.3, 0.8, 0.4)
    for b in (0, 16, 48, 80): M.add(crash(0.8), b, 0.4, 0.8, 0.2)
    return M.render(0.9, 5000, 0.6)

def track_retro():
    bpm = 118; prog = ['Em', 'C', 'G', 'D'] * 8
    mel = seq('''E5 1, G5 1, B5 1.5, A5 .5, G5 1, E5 1, C5 2, D5 1, G5 1, B5 1, A5 .5, G5 .5, F#5 3, D5 1,
      E5 .5, F#5 .5, G5 1, B5 1, E6 1, D6 1, C6 1, B5 1, G5 1, A5 1, G5 1, D5 1, G5 1, F#5 2, A5 2''')
    M = Mix(len(prog) * 4, bpm)
    for i, c in enumerate(prog):
        b = i * 4; ch = chord(c); r = root(c, 2)
        M.add(kick(1.0), b, 0, 1.0, 0.03); M.add(kick(0.8), b + 2.5, 0, 0.9, 0.03); M.add(kick(0.9), b + 2, 0, 0.9, 0.03)
        M.add(snare(0.9, 0.35), b + 1, 0, 0.9, 0.7); M.add(snare(0.9, 0.35), b + 3, 0, 0.9, 0.7)
        for k in range(16): M.add(hat(0.35 + 0.25 * (k % 4 == 2)), b + k * 0.25, 0.3, 0.6, 0.05)
        for k in range(8): M.add(bass(r + (12 if k in (3, 7) else 0), 0.24, 1.0, 'synth'), b + k * 0.5, 0, 0.9, 0.02)
        for x in ch: M.add(pad(x + 12, 3.9, 1.0, 1400 + 400 * (i % 4)), b, (x % 3 - 1) * 0.4, 0.9, 0.5)
        if i >= 4:
            arp = [ch[0], ch[1], ch[2], ch[1]]
            for k in range(8): M.add(epiano(arp[k % 4] + 24, 0.2, 0.5), b + k * 0.5, -0.4, 0.6, 0.35)
    for start in (16, 48, 80, 112):
        for (t, d, m) in mel:
            if m: M.add(bell(m, d * M.spb, 0.9), start + t, 0.2, 1.0, 0.5)
            if m and start >= 80: M.add(lead(m, d * M.spb * 0.9, 0.5, 'sine'), start + t, -0.2, 0.8, 0.5)
    return M.render(1.25, 4000, 0.9)

def track_rock():
    bpm = 140
    riff = [('E', 'm'), ('E', 'm'), ('E', 'm'), ('G', 'o'), ('E', 'm'), ('E', 'm'), ('A', 'o'), ('G', 'o')]
    roots = {'E': nm('E2'), 'G': nm('G2'), 'A': nm('A2'), 'D': nm('D3'), 'C': nm('C3'), 'B': nm('B2')}
    bridge = [('C', 'o'), ('C', 'm'), ('D', 'o'), ('D', 'm'), ('E', 'o'), ('E', 'm'), ('E', 'm'), ('E', 'm')]
    sections = [riff] * 8 + [bridge] * 4 + [riff] * 8 + [bridge] * 4 + [riff] * 8
    M = Mix(len(sections) * 4, bpm)
    lead_line = seq('''B4 1, D5 .5, E5 1.5, G5 1, E5 1, D5 .5, B4 .5, A4 1, B4 3''')
    for s, pat in enumerate(sections):
        b = s * 4
        for k, (n, kind) in enumerate(pat):
            r = roots[n]; ms = [r, r + 7, r + 12]
            M.add(dist_guitar(ms, 0.5 * M.spb * (0.9 if kind == 'o' else 0.5), 0.9 if kind == 'o' else 0.7, kind == 'm'), b + k * 0.5, -0.45, 1.0, 0.12)
            M.add(dist_guitar([m + 0.07 for m in ms], 0.5 * M.spb * (0.9 if kind == 'o' else 0.5), 0.8 if kind == 'o' else 0.6, kind == 'm'), b + k * 0.5 + 0.01, 0.45, 1.0, 0.12)
            M.add(bass(r, 0.2, 1.0, 'synth'), b + k * 0.5, 0, 0.9, 0.02)
        M.add(kick(1.0), b, 0, 1.0, 0.03); M.add(kick(0.9), b + 1.5, 0, 1.0, 0.03); M.add(kick(1.0), b + 2, 0, 1.0, 0.03)
        M.add(snare(1.0, 0.2), b + 1, 0, 1.0, 0.25); M.add(snare(1.0, 0.2), b + 3, 0, 1.0, 0.25)
        for k in range(8): M.add(hat(0.6), b + k * 0.5, 0.35, 0.7, 0.05)
        if s % 4 == 0: M.add(crash(1.0), b, -0.3, 1.0, 0.2)
        if (12 <= s < 20 or 28 <= s < 32) and s % 2 == 0:
            for (t, d, m) in lead_line:
                if m: M.add(np.tanh(lead(m + 12, d * M.spb * 0.95, 1.4, 'sine') * 6) * 0.08, b + t, 0.1, 1.0, 0.4)
    return M.render(0.8, 6000, 0.5)

def track_folk():
    bpm = 150
    A = '''E5 1, B4 .5, C5 .5, D5 1, C5 .5, B4 .5, A4 1, A4 .5, C5 .5, E5 1, D5 .5, C5 .5,
      B4 1.5, C5 .5, D5 1, E5 1, C5 1, A4 1, A4 2,
      - .5, D5 1, F5 .5, A5 1, G5 .5, F5 .5, E5 1.5, C5 .5, E5 1, D5 .5, C5 .5,
      B4 1, B4 .5, C5 .5, D5 1, E5 1, C5 1, A4 1, A4 2'''
    melA = seq(A)
    progA = ['Am', 'Am', 'E', 'Am', 'Dm', 'Am', 'E', 'Am']
    M = Mix(len(progA) * 4 * 5, bpm)
    for rep in range(5):
        var = [0, 1, 2, 1, 2][rep]
        b0 = rep * 32
        for i, c in enumerate(progA):
            b = b0 + i * 4; ch = chord(c); r = root(c, 2)
            for k in range(4):
                M.add(bass(r if k % 2 == 0 else r + 7, 0.3, 1.0, 'tuba'), b + k, -0.1, 1.0, 0.05)
                M.add(bayan(ch[0] + 12, 0.18, 0.55) + bayan(ch[1] + 12, 0.18, 0.5) + bayan(ch[2] + 12, 0.18, 0.5), b + k + 0.5, 0.35, 0.8, 0.2)
                M.add(tamb(0.8), b + k + 0.5, 0.4, 0.8, 0.1); M.add(kick(0.6), b + k, 0, 0.7, 0.02)
            if var == 2: M.add(snare(0.6, 0.1), b + 1, 0, 0.6, 0.2); M.add(snare(0.6, 0.1), b + 3, 0, 0.6, 0.2)
        for (t, d, m) in melA:
            if m is None: continue
            dur = d * M.spb * 0.95
            if var == 0: M.add(balalaika(m, dur, 1.0), b0 + t, -0.25, 1.0, 0.25)
            elif var == 1: M.add(bayan(m, dur, 1.0), b0 + t, -0.2, 1.0, 0.3); M.add(balalaika(m - 12, dur, 0.6), b0 + t, 0.3, 0.9, 0.25)
            else: M.add(balalaika(m + 12, dur, 0.8), b0 + t, -0.3, 1.0, 0.25); M.add(bayan(m, dur, 0.9), b0 + t, 0.25, 1.0, 0.3); M.add(whistle(m + 12, dur, 0.7), b0 + t, 0, 0.8, 0.4)
    return M.render(0.9, 5000, 0.55)

# ======================= ЗВУКИ =======================
def sfx_moo():
    d = 1.5; t = tvec(d)
    f0 = 135 - 30 * (t / d) + 6 * np.sin(2 * np.pi * 4 * t)
    ph = np.cumsum(f0) / SR
    src = saw(1, ph) * 0.8 + 0.2 * rng.uniform(-1, 1, len(t))
    mouth = np.clip(t / 0.5, 0, 1)  # «м» → «у»
    s = bp(src, 200, 450, 2) * (1.2 - 0.6 * mouth) + bp(src, 500, 1000, 2) * (0.2 + 0.8 * mouth) * 0.8
    s *= env(len(t), 0.12, 0.3, 0.85, 0.35, d - 0.4)
    return s / np.max(np.abs(s)) * 0.9
def sfx_meow():
    d = 0.7; t = tvec(d)
    f0 = 600 + 300 * np.sin(np.pi * t / d) - 150 * (t / d)
    ph = np.cumsum(f0) / SR
    src = saw(1, ph)
    k = np.sin(np.pi * t / d)
    s = bp(src, 800, 1800) * (0.3 + k) + bp(src, 2500, 4000) * k * 0.5
    s *= env(len(t), 0.03, 0.1, 0.9, 0.15, d - 0.15)
    return s / np.max(np.abs(s)) * 0.85
def sfx_honk():
    out = np.zeros(int(0.7 * SR))
    for o in (0, 0.28):
        d = 0.22; t = tvec(d); f0 = 420 - 60 * t / d
        src = sq(1, np.cumsum(f0) / SR, 0.3) + 0.4 * saw(1, np.cumsum(f0 * 2.01) / SR)
        s = bp(src, 500, 2200) * env(len(t), 0.01, 0.05, 0.8, 0.05, d - 0.05)
        i = int(o * SR); out[i:i + len(s)] += s
    return out / np.max(np.abs(out)) * 0.85
def sfx_bark():
    out = np.zeros(int(0.6 * SR))
    for o in (0, 0.25):
        d = 0.16; t = tvec(d); f0 = 380 * np.exp(-t * 4)
        src = saw(1, np.cumsum(f0) / SR) + 0.6 * rng.uniform(-1, 1, len(t))
        s = bp(src, 400, 2500) * np.exp(-t * 18) * np.minimum(t * 200, 1)
        i = int(o * SR); out[i:i + len(s)] += s
    return out / np.max(np.abs(out)) * 0.9
def sfx_bear():
    d = 1.0; t = tvec(d); f0 = 85 + 20 * np.sin(2 * np.pi * 3 * t)
    src = saw(1, np.cumsum(f0) / SR) + 0.8 * rng.uniform(-1, 1, len(t))
    s = lp(src, 700) * (1 + 0.5 * np.sin(2 * np.pi * 23 * t)) * env(len(t), 0.1, 0.2, 0.9, 0.3, d - 0.3)
    return s / np.max(np.abs(s)) * 0.9

def mp3_b64(sig, kbps=96):
    pcm = (np.clip(sig, -1, 1) * 32767).astype('<i2').tobytes()
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', '-f', 'mp3', '-'], input=pcm, capture_output=True, check=True)
    return base64.b64encode(r.stdout).decode()

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'audio'), exist_ok=True)
    only = sys.argv[1:]
    tracks = {'menu_garage': track_garage, 'radio_chanson': track_chanson, 'radio_pop': track_pop,
              'radio_retro': track_retro, 'radio_rock': track_rock, 'radio_folk': track_folk}
    for k, fn in tracks.items():
        if only and k not in only and 'sfx' not in only: pass
        if only and k not in only: continue
        save_mp3(fn(), k, 192)
    if not only or 'sfx' in only:
        sfx = {'moo': sfx_moo(), 'meow': sfx_meow(), 'honk': sfx_honk(), 'bark': sfx_bark(), 'bear': sfx_bear()}
        with open(os.path.join(ROOT, 'js', 'sfxdata.js'), 'w') as f:
            f.write('// Звуки животных (сгенерированы tools/music.py), MP3 в base64 — работают и при открытии с диска\n')
            f.write('window.SFX_DATA = {\n' + ',\n'.join(f"  {k}: '{mp3_b64(v)}'" for k, v in sfx.items()) + '\n};\n')
        print('sfx ok')
