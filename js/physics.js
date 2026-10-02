// =====================================================================
//  ФИЗИКА ГАЗЕЛИ: подвеска, сцепление колёс, привод, корпус
//  Единицы — метры, килограммы, секунды. Ось Y вверх.
// =====================================================================
'use strict';
const TRUCK = {
  M: 2000, I: 6700, G: 9.81,
  com: [-0.25, 1.0],                     // центр масс в координатах кузова (земля под машиной — y=0)
  wheelR: 0.37, mountY: 0.82, L0: 0.58, Lmin: 0.27, Iw: 3.2,
  wheels: [{ x: -1.25, k: 1.4, drive: true }, { x: 1.65, k: 0.76, drive: false }],
  hull: [
    [-3.10, 0.52, 0], [-3.06, 1.6, 0], [-3.05, 2.70, 2], [-1.3, 2.72, 2], [0.40, 2.70, 2], [0.62, 2.24, 1], [1.55, 2.26, 1], [1.18, 2.02, 1],
    [2.12, 1.52, 0], [2.84, 1.30, 0], [2.96, 0.72, 0], [2.86, 0.48, 0], [1.0, 0.62, 0], [0.30, 0.47, 0], [-0.9, 0.62, 0], [-2.2, 0.62, 0]
  ],
  airTorque: 7600, brake: 15000
};

class Truck {
  constructor(p) {
    this.p = p; this.x = 0; this.y = 0; this.a = 0; this.vx = 0; this.vy = 0; this.va = 0;
    this.w = TRUCK.wheels.map(d => ({ lx: d.x, kMul: d.k, drive: d.drive || p.awd, s: TRUCK.L0, c: 0, spin: 0, ang: 0, contact: false, nx: 0, ny: 1, surf: 0, cx: 0, cy: 0, slip: 0, load: 0 }));
    this.contactHull = false; this.impact = 0; this.scrape = 0; this.fatal = false; this.sparks = [];
    this.air = 0; this.boost = 0;
  }
  place(T, x) {
    this.a = 0; this.vx = this.vy = this.va = 0;
    const ga = T.heightAt(x + TRUCK.wheels[0].x), gb = T.heightAt(x + TRUCK.wheels[1].x);
    this.a = Math.atan2(gb - ga, TRUCK.wheels[1].x - TRUCK.wheels[0].x);
    this.x = x; this.y = Math.max(ga, gb) + TRUCK.com[1] + 0.05;
    this.w.forEach(w => { w.s = TRUCK.L0 - 0.1; w.c = 0.1; w.spin = 0; });
  }
  // локальная точка кузова → мир
  toWorld(lx, ly) {
    const c = Math.cos(this.a), s = Math.sin(this.a), dx = lx - TRUCK.com[0], dy = ly - TRUCK.com[1];
    return [this.x + dx * c - dy * s, this.y + dx * s + dy * c];
  }
  get speed() { return this.vx * Math.cos(this.a) + this.vy * Math.sin(this.a); }
  step(dt, ctl, T) {
    const P = this.p, M = TRUCK.M, R = TRUCK.wheelR, Iw = TRUCK.Iw;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const dX = s, dY = -c;                      // «вниз» в системе кузова
    let Fx = 0, Fy = -M * TRUCK.G, tau = 0;
    let anyContact = false;
    const fwd = this.speed;
    // тяга мотора
    const boost = this.boost > 0;
    const fmax = P.force * (boost ? 1.55 : 1), vmax = P.vmax + (boost ? 8 : 0);
    let driveF = 0, brakeT = 0, reverse = false;
    if (ctl.gas > 0 && P.fuelOk) {
      const vw = Math.max(0, this.w[0].spin * R);
      driveF = ctl.gas * fmax * clamp(1 - Math.pow(vw / vmax, 2), 0, 1);
    }
    if (ctl.brake > 0) {
      if (fwd < 0.8 && this.w[0].spin * R < 1.0 && ctl.gas === 0) {
        reverse = true;
        const vr = Math.max(0, -this.w[0].spin * R);
        if (P.fuelOk) driveF = -ctl.brake * fmax * 0.5 * clamp(1 - Math.pow(vr / 6, 2), 0, 1);
      } else brakeT = ctl.brake * TRUCK.brake * R * 0.5;
    }
    if (ctl.gas === 0 && ctl.brake === 0) brakeT = 260;   // торможение двигателем
    const nDrive = this.w.filter(w => w.drive).length;
    this.impact = 0; this.scrape = 0;
    for (const w of this.w) {
      const [mx, my] = this.toWorld(w.lx, TRUCK.mountY);
      // ищем длину подвески, при которой колесо касается дороги
      let q = T.closest(mx + dX * TRUCK.L0, my + dY * TRUCK.L0, R);
      let len = TRUCK.L0, pen = 0;
      if (q.d >= R) { w.contact = false; }
      else {
        let qa = T.closest(mx + dX * TRUCK.Lmin, my + dY * TRUCK.Lmin, R);
        if (qa.d < R) { len = TRUCK.Lmin; q = qa; pen = R - qa.d; }
        else {
          let lo = TRUCK.Lmin, hi = TRUCK.L0;
          for (let k = 0; k < 11; k++) { const mid = (lo + hi) * 0.5; const qm = T.closest(mx + dX * mid, my + dY * mid, R); if (qm.d < R) hi = mid; else { lo = mid; q = qm; } }
          len = lo; q = T.closest(mx + dX * lo, my + dY * lo, R + 0.02);
        }
        w.contact = true;
      }
      const comp = TRUCK.L0 - len, cdot = (comp - w.c) / dt;
      w.c = comp; w.s = len;
      const cx = mx + dX * len, cy = my + dY * len; w.cx = cx; w.cy = cy;
      if (w.contact) {
        anyContact = true;
        const nx = q.nx, ny = q.ny; w.nx = nx; w.ny = ny;
        let Fs = P.k * w.kMul * comp + P.c * w.kMul * cdot;
        if (Fs < 0) Fs = 0;
        const cosA = -(nx * dX + ny * dY);
        let N = Fs / Math.max(0.3, cosA);
        if (pen > 0) {
          const vpx = this.vx - this.va * (cy - this.y), vpy = this.vy + this.va * (cx - this.x);
          const vn = vpx * nx + vpy * ny;
          N += 380000 * pen - 24000 * Math.min(0, vn);
          if (cdot > 2.2) this.impact = Math.max(this.impact, cdot);
        }
        if (cdot > 5) this.impact = Math.max(this.impact, (cdot - 5) * 0.7 + 2.5);
        N = Math.min(N, 160000); w.load = N;
        // трение по касательной
        const tx = ny, ty = -nx;
        const vcx = this.vx - this.va * (cy - this.y), vcy = this.vy + this.va * (cx - this.x);
        const vt = vcx * tx + vcy * ty;
        const slip = vt - w.spin * R; w.slip = slip;
        const surf = T.surfAt(cx); w.surf = surf;
        let mu = P.mu * SURF[surf].mu;
        if (surf === 3) mu = P.mu * Math.max(SURF[3].mu, P.iceF);
        if (surf === 2) mu *= P.mudF / 0.6 * 0.95;
        if (P.awd && (surf === 2 || surf === 4)) mu *= 1.12;
        const mEff = 1 / (1 / (M * 0.5) + R * R / Iw);
        let Tf = -slip * mEff / dt;
        const lim = mu * N; if (Tf > lim) Tf = lim; else if (Tf < -lim) Tf = -lim;
        const fx = N * nx + Tf * tx, fy = N * ny + Tf * ty;
        Fx += fx; Fy += fy; tau += (cx - this.x) * fy - (cy - this.y) * fx;
        w.spin += -Tf * R / Iw * dt;
        // сопротивление качению
        const roll = SURF[surf].roll * (surf === 2 ? 1.6 - P.mudF * 0.6 : 1) * N * R;
        const dspin = Math.min(Math.abs(w.spin), roll / Iw * dt); w.spin -= Math.sign(w.spin) * dspin;
      } else { w.load = 0; w.slip = 0; }
      // привод
      if (w.drive && driveF !== 0) {
        const Td = driveF * R / nDrive;
        w.spin += Td / Iw * dt; tau += Td;
      }
      // тормоз
      if (brakeT > 0 && w.spin !== 0) {
        const ds = -Math.sign(w.spin) * Math.min(Math.abs(w.spin), brakeT / Iw * dt);
        w.spin += ds; if (w.contact) tau += Iw * ds / dt * 0.6;
      }
      if (!w.contact) w.spin *= (1 - 0.6 * dt);
      w.ang += w.spin / R * dt;
    }
    // корпус о землю
    this.contactHull = false; let hullFatal = false;
    for (let i = 0; i < TRUCK.hull.length; i++) {
      const hp = TRUCK.hull[i];
      const [px, py] = this.toWorld(hp[0], hp[1]);
      const gh = T.heightAt(px);
      if (py >= gh) continue;
      const sl = T.slopeAt(px), l = Math.hypot(1, sl), nx = -sl / l, ny = 1 / l;
      const pen = (gh - py) * ny;
      const vpx = this.vx - this.va * (py - this.y), vpy = this.vy + this.va * (px - this.x);
      const vn = vpx * nx + vpy * ny, tx = ny, ty = -nx, vt = vpx * tx + vpy * ty;
      let Fn = 520000 * pen - 26000 * vn; if (Fn < 0) Fn = 0;
      const Ft = -Math.sign(vt) * Math.min(0.55 * Fn, Math.abs(vt) * M * 0.4 / dt);
      const fx = Fn * nx + Ft * tx, fy = Fn * ny + Ft * ty;
      Fx += fx; Fy += fy; tau += (px - this.x) * fy - (py - this.y) * fx;
      this.contactHull = true;
      if (vn < -1.8) this.impact = Math.max(this.impact, -vn * 1.25);
      if (Math.abs(vt) > 2.5) { this.scrape = Math.max(this.scrape, Math.abs(vt)); this.sparkAt = [px, py]; }
      if (hp[2] === 1) hullFatal = true;
      if (hp[2] === 2 && Math.abs(Math.atan2(Math.sin(this.a), Math.cos(this.a))) > 1.25) hullFatal = true;
    }
    if (hullFatal) this.fatal = true;
    // управление в воздухе
    if (!anyContact && !this.contactHull) {
      tau += (ctl.gas - ctl.brake) * TRUCK.airTorque;
    }
    // сопротивление воздуха
    const v = Math.hypot(this.vx, this.vy);
    Fx -= 2.0 * this.vx * v; Fy -= 2.0 * this.vy * v;
    tau -= this.va * 900;
    this.vx += Fx / M * dt; this.vy += Fy / M * dt; this.va += tau / TRUCK.I * dt;
    this.va = clamp(this.va, -7, 7);
    this.x += this.vx * dt; this.y += this.vy * dt; this.a += this.va * dt;
    this.grounded = anyContact; this.reverse = reverse;
  }
}

// параметры машины из прокачки
function truckParams(fuelOk) {
  const u = SAVE.up;
  return {
    force: UPG.engine.force[u.engine], vmax: UPG.engine.vmax[u.engine],
    mu: UPG.tires.mu[u.tires], iceF: UPG.tires.ice[u.tires], mudF: UPG.tires.mud[u.tires],
    k: UPG.susp.k[u.susp], c: UPG.susp.c[u.susp], awd: SAVE.awd, fuelOk: fuelOk !== false
  };
}
