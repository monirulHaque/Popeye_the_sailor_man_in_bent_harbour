// ───────────────────────────── actors: the sailor, the waterfront toughs, loose cargo
const G = {};   // live game state, filled in by game.js
// difficulty: how many toughs may swing at once, how often, how hard, how stingy the spinach is
const DIFFS = [
  { name: 'DECKHAND', hp: 7, tokens: 1, cd: 1.4, aggro: 0.7, block: 0.1, fill: 1, spin: 9, extra: 0, heavy: 0, note: 'Gentle. For learning the ropes.' },
  { name: 'SAILOR', hp: 5, tokens: 2, cd: 1, aggro: 1, block: 0.3, fill: 0.7, spin: 7.5, extra: 0, heavy: 0, note: 'The harbor as intended.' },
  { name: 'OLD SALT', hp: 4, tokens: 3, cd: 0.72, aggro: 1.3, block: 0.45, fill: 0.55, spin: 6.5, extra: 1, heavy: 1, note: 'Toughs gang up, block more and hit harder.' },
];
const D = () => DIFFS[G.diffIdx === undefined ? 1 : G.diffIdx];
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const WORDS = {
  jab: ['BIFF!', 'SOCK!', 'BOP!', 'WHAP!', 'POW!', 'PAF!'], hay: ['WHAM!', 'KA-POW!', 'WALLOP!', 'BLAMMO!'],
  wood: ['THUNK!', 'KLUNK!', 'BONK!', 'KNOCK!'], steel: ['CLANG!', 'KLONG!', 'BWONG!', 'TANG!'], hull: ['BONG!', 'DOINK!', 'GONG!'], brick: ['THUD!', 'WHUMP!', 'SMACK!'],
  bend: ['KA-RUNCH!', 'SKREEEK!', 'GROINK!', 'WRENCH!'],
};

class Player {
  constructor(x, y) {
    this.b = World.addBody({ x, y, r: 26, m: 1, rest: 0, fric: 0, cat: CAT.PLAYER, mask: 0, grav: 1.45, maxSpeed: 1900 });
    this.face = 1; this.maxHp = D().hp; this.hp = this.maxHp; this.inv = 0; this.stun = 0; this.spin = 0; this.flex = 0;
    this.pn = null; this.combo = 0; this.comboT = 0; this.buf = 0; this.coyote = 0; this.jbuf = 0; this.jumping = false;
    this.walk = 0; this.land = 0; this.t = 0; this.dead = false; this.puff = 0; this.wasGround = false; this.stepT = 0;
  }
  get x() { return this.b.x; } get y() { return this.b.y; }
  get super() { return this.spin > 0; }
  update(dt) {
    const I = Input.st, b = this.b; this.t += dt;
    if (this.dead) { b.vx *= 0.98; return; }
    this.inv = Math.max(0, this.inv - dt); this.land = Math.max(0, this.land - dt); this.puff = Math.max(0, this.puff - dt * 1.4);
    if (this.spin > 0) { this.spin -= dt; if (this.spin <= 0) { this.spin = 0; Sfx.powerdown(); Sfx.spinach(false); FX.say(this, pick(['PHEW!', 'THAT’S ME LUNCH GONE.', 'WHO’S GOT ANOTHER CAN?'])); } }
    const ground = b.grounded; this.coyote = ground ? 0.09 : Math.max(0, this.coyote - dt);
    if (ground && !this.wasGround && b.vy > -50) { this.land = 0.12; FX.dust(b.x, b.y + b.r, 1, 2); FX.dust(b.x, b.y + b.r, -1, 2); }
    this.wasGround = ground;
    if (this.flex > 0) { this.flex -= dt; b.vx *= 0.8; return; }
    if (this.stun > 0) { this.stun -= dt; b.vx *= ground ? 0.92 : 0.99; return; }
    // run
    const pn = this.pn, slow = pn && pn.phase === 'wind' ? 0.45 : pn && pn.phase === 'strike' ? 0.25 : 1;
    const sp = (this.super ? 390 : 340) * slow;
    b.vx = approach(b.vx, I.x * sp, (ground ? 3600 : 2000) * dt);
    if (I.x && !(pn && pn.phase !== 'wind')) this.face = sign(I.x);
    if (ground && abs(b.vx) > 60) { this.walk += abs(b.vx) * dt * 0.045; this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.2; Sfx.step(); } }
    // jump
    this.jbuf = I.jumpP ? 0.12 : Math.max(0, this.jbuf - dt);
    if (this.jbuf > 0 && this.coyote > 0 && !(pn && pn.phase === 'slam')) {
      b.vy = -770; b.y -= 2; this.jbuf = 0; this.coyote = 0; this.jumping = true; b.grounded = false;
      FX.dust(b.x, b.y + b.r, 1, 2); FX.dust(b.x, b.y + b.r, -1, 2); Sfx.whoosh(0.5);
    } else if (ground && !this.jumping && b.gsy > -200) b.vy = Math.max(b.vy, 90);
    if (this.jumping && !I.jump && b.vy < -280) { b.vy = -280; this.jumping = false; }
    if (b.vy >= 0) this.jumping = false;
    // punch
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.buf = I.punchP ? 0.14 : Math.max(0, this.buf - dt);
    if (!pn && this.buf > 0) { this.buf = 0; this.strike(0); }
    else if (pn) {
      pn.t += dt;
      if (pn.phase === 'wind') {
        pn.charge = clamp(pn.t / 0.7, 0, 1);
        if (pn.t % 0.1 < dt) Sfx.wind(pn.charge);
        if (!I.punch || pn.t > 1.6) this.strike(pn.charge);
      } else if (pn.phase === 'strike') {
        if (pn.t < 0.1) this.hitScan(pn);
        if (pn.t > 0.13) { pn.phase = 'recover'; pn.t = 0; }
      } else if (pn.phase === 'slam') {
        b.vx *= 0.9; this.hitScan(pn);
        if (b.grounded || b.touch && pn.t > 0.05 || pn.t > 1.2) this.slamLand(pn);
      } else if (pn.phase === 'recover') {
        if (pn.t > pn.rec) { this.pn = null; if (I.punch && pn.kind !== 'slam') this.pn = { phase: 'wind', t: 0, charge: 0 }; }
      }
    }
  }
  strike(charge) {
    const I = Input.st, b = this.b; let ax = I.x, ay = I.y;
    if (ax) this.face = sign(ax);
    const ground = b.grounded || this.coyote > 0;
    if (ay > 0 && ground) ay = 0;
    const spin = this.super ? 1.6 : 1;
    if (ay > 0) {   // dive-bomb slam
      this.pn = { phase: 'slam', t: 0, kind: 'slam', ax: 0, ay: 1, lx: 0, ly: 1, power: (1.3 + charge) * spin, hit: new Set(), rec: 0.26, charge, arm: 1 };
      b.vy = 1500; b.vx *= 0.4; Sfx.whoosh(1.2); return;
    }
    let kind = 'jab', power = 1;
    if (charge > 0.12) { kind = 'hay'; power = 1.35 + 1.25 * charge; this.combo = 0; }
    else { this.combo = this.comboT > 0 ? this.combo + 1 : 1; if (this.combo >= 3) { kind = 'hay'; power = 1.4; this.combo = 0; } }
    this.comboT = 0.55;
    let lx, ly;
    if (ay < 0 && !ax) { ax = 0; ay = -1; lx = this.face * 0.16; ly = -1; }
    else if (ay < 0) { ax = sign(ax) * 0.72; ay = -0.7; lx = ax; ly = ay; }
    else { ax = this.face; ay = 0; lx = this.face * 0.95; ly = -0.32; }
    const l = hypot(lx, ly); lx /= l; ly /= l;
    this.pn = { phase: 'strike', t: 0, kind, ax, ay, lx, ly, power: power * spin, hit: new Set(), geo: false, rec: kind === 'hay' ? 0.24 : 0.1, charge, arm: this.combo % 2, upper: ay < 0 && ground };
    Sfx.whoosh(0.7 + power * 0.3);
    if (!ground) b.vy = Math.min(b.vy, -120);     // a little hang-time for air punches
    else b.vx += this.face * (kind === 'hay' ? 160 : 60);
  }
  hitScan(pn) {
    const b = this.b, big = pn.kind !== 'jab' || this.super, reach = 52, R = big ? 52 : 42;
    const cx = b.x + pn.ax * reach, cy = b.y - 12 + pn.ay * reach + (pn.kind === 'slam' ? 24 : 0);
    let landed = false;
    for (const e of G.enemies) {
      if (pn.hit.has(e) || !e.hittable) continue;
      if (hypot(e.b.x - cx, e.b.y - cy) > R + e.b.r) continue;
      pn.hit.add(e); landed = true;
      let lx = pn.lx, ly = pn.ly;
      if (pn.kind === 'slam') { lx = sign(e.b.x - b.x || this.face) * 0.75; ly = 0.66; }
      const speed = clamp(((800 + e.dmg * 7) * pn.power) / Math.sqrt(e.b.m), 300, 2500);
      const res = e.takeHit(6 * pn.power, lx * speed, ly * speed, { super: this.super, src: 'punch', big: pn.kind !== 'jab', ay: pn.ay, slam: pn.kind === 'slam', from: b.x });
      const hx = lerp(cx, e.b.x, 0.6), hy = lerp(cy, e.b.y, 0.6);
      if (res === 'block') { G.blockFx(hx, hy, e); b.vx = -sign(e.b.x - b.x || this.face) * 300; if (pn.phase === 'strike') { pn.phase = 'recover'; pn.t = 0; pn.rec = 0.34; } this.combo = 0; landed = true; continue; }
      G.punchFx(hx, hy, pn.power, res === 'flinch');
      G.event('hit', { x: hx, y: hy });
      if (pn.power > 2 && res !== 'flinch') Sfx.launch(pn.power / 3);
    }
    for (const p of G.props) {
      if (pn.hit.has(p) || !p.punch) continue;
      if (hypot(p.b.x - cx, p.b.y - cy) > R + p.b.r) continue;
      pn.hit.add(p); landed = true; p.punch(pn.lx, pn.ly, pn.power, this);
      G.punchFx(lerp(cx, p.b.x, 0.6), lerp(cy, p.b.y, 0.6), pn.power * 0.7, false);
    }
    if (G.stage.onPunch && G.stage.onPunch(cx, cy, R, pn)) landed = true;
    if (!pn.geo && pn.kind !== 'slam' && pn.t > 0.03) {
      pn.geo = true;
      const ox = b.x, oy = b.y - 12, h = World.raycast(ox, oy, ox + pn.ax * (reach + R + 8), oy + pn.ay * (reach + R + 8));
      if (h) {
        const mat = h.shape.mat;
        if (this.super) {
          const amt = World.dent(h.x, h.y, pn.ax, pn.ay, 100, 58 * Math.min(pn.power, 3.2) * 0.5, 560);
          G.bend(amt, h.x, h.y, mat);
        } else {
          World.kick(h.x, h.y, pn.ax, pn.ay, 90, 300 * pn.power);
          (mat === 'steel' || mat === 'hull') ? Sfx.metal(0.5, mat === 'hull') : Sfx.wood(0.6);
          mat === 'steel' || mat === 'hull' ? FX.sparks(h.x, h.y, h.nx, h.ny, 4) : FX.chips(h.x, h.y, h.nx, h.ny, 3, mat === 'brick' ? C.brick : C.wood, 240);
        }
        b.vx -= pn.ax * 120;
      }
      // spinach uppercut peels the deck up into a ramp
      if (this.super && pn.upper) {
        const gx = b.x + this.face * 72, gy = World.groundBelow(gx, b.y - 40, 220);
        if (gy !== null) {
          const amt = World.dent(gx, gy, this.face * 0.2, -0.98, 108, 84, 520);
          G.bend(amt, gx, gy, 'wood'); G.shock(gx, gy, 118, -1150, this.face * 220, 9, true);
        }
      }
    }
    if (landed && pn.kind !== 'slam') this.b.vx *= 0.3;
  }
  slamLand(pn) {
    const b = this.b, big = this.super, gy = b.y + b.r;
    pn.phase = 'recover'; pn.t = 0;
    G.shock(b.x, gy, big ? 250 : 150, big ? -1250 : -760, 0, big ? 14 : 6, big, 1);
    FX.ring(b.x, gy, 20, big ? 240 : 140, 0.3, C.ink, 6); FX.dust(b.x, gy, 1, 5); FX.dust(b.x, gy, -1, 5);
    if (big) { const amt = World.dent(b.x, gy, 0, 1, 150, 78, 950); G.bend(amt, b.x, gy, 'wood'); G.hitstop(0.09); }
    else { World.kick(b.x, gy, 0, 1, 170, 620); Sfx.wood(1); Sfx.boing(0.6); FX.stamp('WHUMP!', b.x, gy - 50, 40, C.mustard); }
    G.shake(big ? 16 : 8); Sfx.punch(big ? 2 : 1.2);
  }
  hurt(n, dir, kb) {
    if (this.inv > 0 || this.super || this.dead || this.flex > 0) return false;
    this.hp -= n; this.inv = 1.0; this.stun = 0.36; this.pn = null;
    this.b.vx = dir * (kb || 420); this.b.vy = -400; this.b.grounded = false; this.b.y -= 2;
    Sfx.hurt(); G.shake(9); G.hitstop(0.08); FX.stars(this.b.x, this.b.y - 20, 6, 320); FX.burst(this.b.x, this.b.y - 14, 34, C.red);
    G.breakChain(); G.hurtFlash = 0.25;
    if (this.hp <= 0) { this.dead = true; G.playerDown(); }
    return true;
  }
  eat() {
    this.spin = D().spin; this.spinMax = this.spin; this.hp = Math.min(this.maxHp, this.hp + 1); this.flex = 0.6; this.pn = null; this.inv = 0.3; this.puff = 1;
    Sfx.can(); Sfx.toot(); Sfx.spinach(true);
    FX.leaves(this.b.x, this.b.y - 20, 16); FX.ring(this.b.x, this.b.y, 30, 320, 0.45, C.green, 10);
    FX.stamp('SPINACH!', this.b.x, this.b.y - 110, 76, C.green, { life: 1.3, burst: C.greenLt, rot: -0.08, vy: -10 });
    FX.say(this, pick(['NOW YER FER IT!', 'THAT’S THE STUFF!', 'STAND BACK, HARBOR!']), 1.6);
    G.shock(this.b.x, this.b.y, 200, -500, 0, 2, false, 2); G.shake(10); G.slow(0.3, 0.5); G.meter = 0;
  }
  pose() {
    const b = this.b, pn = this.pn, t = this.t, ground = b.grounded || this.coyote > 0.04, f = this.face;
    const sp = clamp(abs(b.vx) / 340, 0, 1), ph = this.walk;
    const p = { lean: sp * 0.14, bob: 0, expr: '', lf: [-8, 0], rf: [8, 0], lh: [-13, -27 + sin(t * 3) * 1.5], rh: [14, -29 + sin(t * 3 + 1) * 1.5], fistL: 1, fistR: 1, puff: this.puff };
    if (this.super) { p.fistL = p.fistR = 1.35; }
    if (ground && sp > 0.15) {
      p.lf = [-6 + cos(ph) * 11, -Math.max(0, sin(ph)) * 8]; p.rf = [6 - cos(ph) * 11, -Math.max(0, -sin(ph)) * 8];
      p.lh = [-10 - cos(ph) * 10, -30]; p.rh = [12 + cos(ph) * 10, -30]; p.bob = abs(sin(ph)) * -2.5;
    } else if (!ground) { p.lf = [-9, -9 + clamp(b.vy * 0.008, -6, 6)]; p.rf = [8, -3 + clamp(b.vy * 0.01, -4, 8)]; p.lh = [-17, -44]; p.rh = [17, -46]; p.lean = 0.08; }
    else p.bob = sin(t * 3) * 0.8;
    if (this.land > 0) p.bob += this.land * 40;
    if (this.flex > 0) { const k = sin(clamp(1 - this.flex / 0.6, 0, 1) * Math.PI); p.lh = [-34, -50 - k * 6]; p.rh = [34, -52 - k * 6]; p.fistL = p.fistR = 1.3 + k * 0.5; p.expr = 'flex'; p.bendL = -16; p.bendR = 16; p.lean = 0; }
    else if (this.dead || this.stun > 0) { p.expr = 'ow'; p.lean = -0.35; p.lh = [-20, -52]; p.rh = [8, -56]; p.lf = [-4, -4]; p.rf = [12, -8]; }
    else if (pn) {
      const sx = 6, sy = -44, ax = pn.ax * f, ay = pn.ay;      // rig space faces +x
      if (pn.phase === 'wind') {
        const a = t * (16 + pn.charge * 26), r = 12 + pn.charge * 5;
        p.rh = [sx - 16 + cos(a) * r, sy - 2 + sin(a) * r]; p.fistR = 1.2 + pn.charge * 0.7; p.lean = -0.16; p.expr = 'grit'; p.lh = [14, -34]; p.wind = { a, r, c: pn.charge, x: sx - 16, y: sy - 2 };
      } else if (pn.phase === 'strike' || (pn.phase === 'recover' && pn.kind !== 'slam')) {
        const e = pn.phase === 'strike' ? outCubic(pn.t / 0.05) : 1 - smooth(pn.t / pn.rec);
        const ext = 16 + 40 * e, fs = (pn.kind === 'hay' ? 1.9 : 1.45) * (this.super ? 1.25 : 1);
        const hand = [sx + ax * ext, sy + 4 + ay * ext];
        if (pn.arm) { p.rh = hand; p.fistR = 1 + (fs - 1) * e; p.lh = [-14, -36]; p.bendR = 0; }
        else { p.lh = hand; p.fistL = 1 + (fs - 1) * e; p.rh = [-4, -34]; p.bendL = 0; }
        p.lean = ax * 0.3 * e; p.expr = 'grit'; if (ay < 0) p.bob -= 5 * e;
        if (pn.phase === 'strike') p.smear = { x: hand[0], y: hand[1], ax, ay, r: STYLE.popeye.fist * fs };
      } else if (pn.phase === 'slam') { p.lh = [-6, 4]; p.rh = [8, 6]; p.fistL = p.fistR = 1.7; p.lf = [-10, -22]; p.rf = [10, -24]; p.expr = 'grit'; p.lean = 0.1; }
      else { p.lh = [-12, -8]; p.rh = [12, -8]; p.bob += 5; }
    }
    return p;
  }
  draw() {
    const b = this.b, p = this.pose();
    if (this.inv > 0 && !this.super && Math.floor(this.inv * 18) % 2) return;
    if (b.grounded) groundShadow(b.x, b.y + b.r, b.r);
    X.save(); X.translate(b.x, b.y + b.r); X.scale(this.face * 1.2, 1.2);
    if (this.super) { X.save(); X.globalAlpha = 0.5 + 0.3 * sin(this.t * 22); ink(starPath(0, -36, 58 + sin(this.t * 30) * 4, 12, 0.72, this.t * 2), C.greenLt, 0, false); X.restore(); }
    if (p.wind) { X.strokeStyle = C.ink; X.lineWidth = 2; for (let i = 1; i <= 3; i++) { X.beginPath(); X.arc(p.wind.x, p.wind.y, p.wind.r + i * 4, p.wind.a - 0.5 - i * 0.7, p.wind.a - i * 0.7 + 0.4); X.stroke(); } }
    if (p.smear) { X.strokeStyle = C.ink; X.lineWidth = 2.4; X.lineCap = 'round'; for (let i = -1; i <= 1; i++) { const ox = -p.smear.ay * i * 7, oy = p.smear.ax * i * 7; X.beginPath(); X.moveTo(p.smear.x - p.smear.ax * 18 + ox, p.smear.y - p.smear.ay * 18 + oy); X.lineTo(p.smear.x - p.smear.ax * (34 + (i ? 0 : 12)) + ox, p.smear.y - p.smear.ay * (34 + (i ? 0 : 12)) + oy); X.stroke(); } }
    rig(STYLE.popeye, p, this.t);
    X.restore();
  }
}

const FOES = {
  rat: { r: 24, m: 1, hp: 30, speed: 165, s: 1.18, pay: 100, cry: ['GET ’IM!', 'HE’S MINE!', 'C’MERE, SWABBIE!', 'SURROUND ’IM!'] },
  bruiser: { r: 36, m: 2.6, hp: 78, speed: 100, s: 1.62, pay: 250, heavy: true, cry: ['OUTTA MY WAY!', 'I’LL FLATTEN YA!'] },
  chucker: { r: 22, m: 0.85, hp: 22, speed: 140, s: 1.12, pay: 120, cry: ['HEADS UP!', 'CATCH!'] },
  plank: { r: 27, m: 1.5, hp: 44, speed: 112, s: 1.26, pay: 180, cry: ['TRY GETTIN’ PAST THIS!', 'KNOCK KNOCK!'] },
};
const MELEE = { rat: 1, bruiser: 1, plank: 1 };
class Enemy {
  constructor(kind, x, y, o) {
    o = o || {};
    this.kind = kind; this.cfg = FOES[kind];
    this.b = World.addBody({ x, y, r: this.cfg.r, m: this.cfg.m, rest: 0, fric: 0, cat: CAT.ENEMY, mask: CAT.ENEMY | CAT.PROP | CAT.PROJ, vx: o.vx || 0, vy: o.vy || 0 });
    this.b.owner = this; this.b.soft = true; this.b.ghost = !!o.ghost;
    this.b.onHit = (h) => { if ((this.state === 'fly' || this.state === 'ko') && h.speed > 230) G.ricochet(this, h); };
    this.b.onBump = (o2, sp, cx, cy) => this.bumped(o2, sp, cx, cy);
    this.hp = this.cfg.hp; this.dmg = 0; this.state = 'spawn'; this.t = 0; this.face = x < G.player.x ? 1 : -1; this.cd = rand(0.3, 0.9) * D().cd;
    this.super = false; this.bounces = 0; this.lastRic = -1; this.restT = 0; this.stuck = 0; this.walk = rand(6); this.sq = 0;
    this.perch = !!o.perch; this.gone = false; this.age = 0; this.flinch = 0; this.didHit = false;
    this.role = o.role || ''; this.token = false; this.move = ''; this.feint = rand(TAU); this.shield = kind === 'plank' ? 3 : 0; this.combo = 0;
  }
  get hittable() { return !this.gone && !this.hidden && this.state !== 'ko' && this.state !== 'getup' && !(this.state === 'spawn' && this.b.ghost); }
  get live() { return this.state === 'fly' || this.state === 'ko'; }
  setStand() { const b = this.b; b.soft = true; b.fric = 0; b.rest = 0; }
  groundAhead(dir, d) { const y = World.groundBelow(this.b.x + dir * (d || 34), this.b.y - 10, 150); return y !== null && y < World.waterY - 10; }
  release() { this.token = false; }
  grabToken() {
    if (this.token) return true;
    if (G.enemies.filter((e) => e.token && !e.gone).length >= D().tokens) return false;
    this.token = true; return true;
  }
  begin(move, dur) { this.state = 'wind'; this.move = move; this.t = 0; this.dur = dur; }
  steer(dir, speed, dt) {
    const b = this.b;
    if (dir && this.descend === undefined && !this.groundAhead(dir)) {
      if (b.grounded && this.groundAhead(dir, 150) && sign(G.player.b.x - b.x) === dir) { b.vy = -620; b.vx = dir * 330; b.grounded = false; b.y -= 2; }
      else if (b.grounded) dir = 0;
    }
    if (b.grounded || b.touch) b.vx = approach(b.vx, dir * speed, 1500 * dt);
    if (dir && abs(b.vx) < 24 && b.grounded) { this.stuck += dt; if (this.stuck > 0.3) { b.vy = -640; b.y -= 2; this.stuck = 0; } } else this.stuck = 0;
    if (abs(b.vx) > 20) this.walk += abs(b.vx) * dt * 0.06;
  }
  update(dt) {
    const b = this.b, P = G.player, c = this.cfg, Dd = D(); this.t += dt; this.age += dt; this.sq = Math.max(0, this.sq - dt * 5); this.flinch = Math.max(0, this.flinch - dt);
    const dx = P.b.x - b.x, dy = P.b.y - b.y, adx = abs(dx);
    if (b.y > World.waterY + 14) { G.dunk(this); return; }
    if (b.x < G.stage.minX - 60 || b.x > G.stage.maxX + 60 || b.y > 900) { G.outOfPanel(this); return; }
    if (this.state !== 'wind' && this.state !== 'attack' && this.state !== 'walk' && this.state !== 'guard') this.release();
    if (this.state !== 'carry' && this.carrying) this.carrying = null;
    switch (this.state) {
      case 'spawn':
        if (this.t > 0.18) b.ghost = false;
        if ((b.grounded && this.t > 0.2) || this.t > 1.6) { this.state = 'walk'; this.t = 0; if (Math.random() < 0.3) FX.say(this, pick(c.cry), 1.1); }
        break;
      case 'walk': {
        const ol = G.olive, wantOlive = this.role === 'grab' && ol && ol.free;
        if (this.role === 'grab' && !wantOlive && !(ol && ol.state === 'carried')) this.role = '';
        // the player turning his back on you is an invitation
        this.cd -= dt * (P.face === sign(b.x - P.b.x) ? 1 : 1.8) * Dd.aggro;
        let dir = 0;
        if (wantOlive) {
          const ox = ol.b.x - b.x; this.face = sign(ox) || 1; dir = abs(ox) > 26 ? this.face : 0;
          if (abs(ox) < 34 && abs(ol.b.y - b.y) < 60 && b.grounded) { this.state = 'carry'; this.t = 0; this.carrying = ol; ol.grab(this); this.exitX = G.stage.exits.reduce((a, x) => (abs(x - P.b.x) > abs(a - P.b.x) ? x : a)); FX.say(this, pick(['GOTCHA, SISTER!', 'COMIN’ WITH ME!', 'SHE’S OURS NOW!']), 1.2); Sfx.whistle(); }
          this.steer(dir, c.speed * 1.05, dt); break;
        }
        this.face = dx > 0 ? 1 : -1;
        if (this.kind === 'chucker') {
          if (this.perch && this.age > 13 && b.grounded) { this.perch = false; this.descend = b.y; FX.say(this, 'I’M COMIN’ DOWN!', 1); }
          if (this.descend !== undefined) { dir = this.face; if (b.y > this.descend + 50 || adx < 60) this.descend = undefined; }
          else if (!this.perch) { if (adx < 260) dir = -this.face; else if (adx > 520) dir = this.face; }
          if (this.cd <= 0 && adx < 780 && b.grounded) this.begin(Math.random() < 0.3 * Dd.aggro ? 'fan' : 'throw', 0.48);
          this.steer(dir, c.speed, dt); break;
        }
        const ready = this.cd <= 0 && adx < 300 && this.grabToken();
        if (ready) {
          // close in and pick a move
          if (this.kind === 'rat') {
            if (adx > 140 && adx < 250 && abs(dy) < 60 && b.grounded && Math.random() < 0.035 * Dd.aggro * 60 * dt) { this.begin('lunge', 0.42); FX.say(this, 'HYAAH!', 0.6); }
            else if (adx < 78 && abs(dy) < 70 && b.grounded) this.begin('jab', 0.3 / Math.sqrt(Dd.aggro));
            else dir = this.face;
          } else if (this.kind === 'bruiser') {
            if (adx < 140 && abs(dy) < 80 && b.grounded) { this.begin('pound', 0.62); FX.say(this, pick(['TIMBER!', 'HUP!']), 0.7); Sfx.creak(); }
            else if (adx < 460 && abs(dy) < 80 && b.grounded) { this.begin('charge', 0.7); FX.say(this, pick(['GRRR!', 'CHAAARGE!', 'HERE I COME!']), 0.9); Sfx.creak(); }
            else dir = this.face;
          } else if (this.kind === 'plank') {
            if (adx < 96 && abs(dy) < 70 && b.grounded) this.begin('swing', 0.52 / Math.sqrt(Dd.aggro));
            else dir = this.face;
          }
        } else {
          // no turn to swing yet: hang back at a respectful distance and look menacing
          const ring = (this.kind === 'bruiser' ? 230 : 160) + (G.enemies.indexOf(this) % 3) * 46, wob = sin(this.age * 2.2 + this.feint) * 34;
          const want = ring + wob;
          if (adx > want + 30) dir = this.face; else if (adx < want - 30) dir = -this.face;
          if (this.kind === 'plank' && adx > 120) dir = this.face;   // shield men just keep coming
        }
        this.steer(dir, c.speed * (ready ? 1.1 : 0.75), dt);
        if (b.grounded && dy < -90 && adx < 160 && Math.random() < dt * 1.5) { b.vy = -700; b.y -= 2; }
        break;
      }
      case 'carry': {
        const ol = this.carrying; if (!ol || ol.carrier !== this) { this.state = 'walk'; this.role = ''; break; }
        const ex = this.exitX - b.x; this.face = sign(ex) || 1;
        this.steer(abs(ex) > 12 ? this.face : 0, c.speed * 0.78, dt);
        if (abs(ex) < 18) G.kidnapped(this, ol);
        break;
      }
      case 'guard':
        b.vx = approach(b.vx, 0, 1800 * dt); this.face = dx > 0 ? 1 : -1;
        if (this.t > 0.3) { if (adx < 95) { this.token = true; this.begin('jab', 0.14); } else { this.state = 'walk'; this.t = 0; } }
        break;
      case 'wind': {
        b.vx = approach(b.vx, 0, 1600 * dt);
        if (this.move !== 'fan' && this.move !== 'throw') this.face = this.move === 'charge' || this.move === 'lunge' ? this.face : dx > 0 ? 1 : -1;
        if (this.t > this.dur) {
          this.state = 'attack'; this.t = 0; this.didHit = false;
          if (this.move === 'jab') { b.vx = this.face * 470; Sfx.whoosh(0.6); }
          else if (this.move === 'lunge') { b.vx = this.face * 560; b.vy = -380; b.y -= 2; b.grounded = false; Sfx.whoosh(0.9); }
          else if (this.move === 'charge') { b.vx = this.face * 600; Sfx.whoosh(1.2); }
          else if (this.move === 'pound') { this.poundHit(); }
          else if (this.move === 'swing') { Sfx.whoosh(1); }
          else { G.throwBottle(this, this.move === 'fan' ? 3 : 1); this.state = 'recover'; this.dur = 0.4; this.cd = rand(1.4, 2.4) * Dd.cd; }
        }
        break;
      }
      case 'attack':
        if (this.move === 'jab') {
          if (!this.didHit && hypot(b.x + this.face * 30 - P.b.x, b.y - 4 - P.b.y) < 58) this.didHit = P.hurt(1, this.face) || true;
          b.vx = approach(b.vx, 0, 900 * dt);
          if (this.t > 0.2) {
            if (this.combo < 1 && Math.random() < 0.4 * Dd.aggro && adx < 110) { this.combo++; this.begin('jab', 0.16); }
            else { this.combo = 0; this.end(0.5, rand(0.9, 1.6)); }
          }
        } else if (this.move === 'lunge') {
          if (!this.didHit && hypot(b.x - P.b.x, b.y - P.b.y) < b.r + 28) { this.didHit = true; if (P.hurt(1, this.face, 520)) FX.stamp('OOF!', P.b.x, P.b.y - 70, 40, C.red); }
          if ((b.grounded && this.t > 0.12) || this.t > 1.2) this.end(0.55, rand(1.2, 2));
        } else if (this.move === 'charge') {
          b.vx = this.face * 600;
          if (this.t % 0.08 < dt) FX.dust(b.x, b.y + b.r, this.face, 1);
          if (!this.didHit && hypot(b.x - P.b.x, b.y - P.b.y) < b.r + 30) { if (P.hurt(2 + Dd.heavy, this.face, 680)) FX.stamp('OOF!', P.b.x, P.b.y - 70, 46, C.red); this.didHit = true; }
          const wall = World.raycast(b.x, b.y - 6, b.x + this.face * (b.r + 12), b.y - 6);
          if (wall && this.t > 0.1) {
            this.state = 'stun'; this.t = 0; this.dur = 1.3; b.vx = -this.face * 160; b.vy = -260; G.shake(8); Sfx.wood(1); Sfx.boing(0.7);
            FX.stamp('BONK!', b.x + this.face * 20, b.y - 60, 46, C.mustard); FX.stars(b.x + this.face * 24, b.y - 20, 6); World.kick(wall.x, wall.y, this.face, 0, 100, 500);
          } else if (this.t > 0.85) this.end(0.7, rand(1.2, 2));
        } else if (this.move === 'pound') { if (this.t > 0.6) this.end(0.4, rand(1.4, 2.2)); }
        else if (this.move === 'swing') {
          if (!this.didHit && this.t > 0.05 && adx < 98 && abs(dy) < 80 && sign(dx) === this.face) { this.didHit = true; if (P.hurt(2 + Dd.heavy, this.face, 560)) { FX.stamp('THWACK!', P.b.x, P.b.y - 70, 44, C.red); World.kick(P.b.x, P.b.y + P.b.r, 0, 1, 90, 400); } }
          if (this.t > 0.2) this.end(0.75, rand(1.1, 1.8));
        }
        break;
      case 'recover': b.vx = approach(b.vx, 0, 1400 * dt); if (this.t > this.dur) { this.state = 'walk'; this.t = 0; } break;
      case 'stun': b.vx = approach(b.vx, 0, 600 * dt); if (this.t > this.dur) { this.state = 'walk'; this.t = 0; this.cd = 0.6; } break;
      case 'fly': case 'ko': {
        const sp = hypot(b.vx, b.vy);
        if (this.super && sp > 300) FX.trail(b.x, b.y, b.r, C.greenLt);
        if (sp > 900 && this.t % 0.05 < dt) FX.add({ type: 'spark', x: b.x, y: b.y, vx: -b.vx * 0.2, vy: -b.vy * 0.2, life: 0.18, size: 26, color: C.white });
        this.restT = b.grounded && sp < 120 ? this.restT + dt : 0;
        if (this.state === 'ko') { if (this.restT > 0.35 || this.t > 3.6) { FX.puff(b.x, b.y, 8, 160, 12); FX.stars(b.x, b.y, 4, 220); this.remove(); } }
        else if (this.restT > 0.2) { this.state = 'down'; this.t = 0; this.dur = rand(0.55, 0.9) / Dd.aggro; this.super = false; b.fric = 0.9; b.rest = 0; b.w = 0; }
        break;
      }
      case 'down': if (this.t > this.dur) { this.state = 'getup'; this.t = 0; this.setStand(); b.ang = 0; } break;
      case 'getup':
        b.vx = approach(b.vx, 0, 900 * dt);
        if (this.t > 0.32) {
          this.state = 'walk'; this.t = 0; this.cd = rand(0.4, 1) * Dd.cd;
          // wake-up swing if you're standing over them
          if (MELEE[this.kind] && adx < 90 && abs(dy) < 70 && Math.random() < 0.6 * Dd.aggro) { this.token = true; this.face = sign(dx) || 1; this.begin(this.kind === 'bruiser' ? 'pound' : this.kind === 'plank' && this.shield > 0 ? 'swing' : 'jab', 0.22); }
        }
        break;
    }
  }
  end(rec, cd) { this.state = 'recover'; this.t = 0; this.dur = rec; this.cd = cd * D().cd; this.release(); }
  poundHit() {
    const b = this.b, P = G.player, gy = b.y + b.r;
    G.shake(10); Sfx.punch(1.6); Sfx.wood(1); FX.ring(b.x, gy, 20, 200, 0.35, C.ink, 6); FX.dust(b.x, gy, 1, 6); FX.dust(b.x, gy, -1, 6);
    FX.stamp('KA-BOOM!', b.x, gy - 90, 46, C.red, { burst: C.cream }); World.kick(b.x, gy, 0, 1, 220, 700);
    if (P.b.grounded && abs(P.b.x - b.x) < 200 && abs(P.b.y - b.y) < 90) P.hurt(2 + D().heavy, sign(P.b.x - b.x) || 1, 520);
    for (const p of G.props) if (p instanceof Barrel && abs(p.b.x - b.x) < 200) { p.b.vy = -520; p.b.y -= 3; }
  }
  takeHit(d, vx, vy, o) {
    o = o || {};
    const facing = o.from !== undefined && sign(o.from - this.b.x) === this.face, standing = !this.live && this.state !== 'stun' && this.state !== 'down' && this.state !== 'spawn';
    if (o.src === 'punch' && !o.super && standing && facing) {
      // a rat that sees a jab coming puts his dukes up
      if (this.kind === 'rat' && !o.big && (this.state === 'walk' || this.state === 'recover' || this.state === 'guard') && Math.random() < D().block) { this.state = 'guard'; this.t = 0; this.sq = 0.6; return 'block'; }
      // the plank stops anything thrown straight at it
      if (this.kind === 'plank' && this.shield > 0 && !o.slam && !(o.ay < 0) && this.state !== 'attack') {
        if (o.big) { this.shield--; if (this.shield <= 0) { FX.chips(this.b.x + this.face * 20, this.b.y - 20, this.face, -1, 14, C.wood, 520); FX.stamp('KRAK!', this.b.x, this.b.y - 80, 48, C.mustard, { burst: C.cream }); Sfx.crumple(0.8); this.flinch = 0.3; G.event('strike', { x: this.b.x, y: this.b.y }); return 'flinch'; } }
        this.b.vx -= this.face * (o.big ? 260 : 120); this.sq = 0.5; return 'block';
      }
    }
    if (this.carrying) { this.carrying.drop(); this.carrying = null; }
    this.release();
    this.dmg += d; this.hp -= d; this.sq = 1;
    const armored = this.kind === 'bruiser' && !this.live && this.state !== 'stun' && this.state !== 'down';
    if (armored && this.hp > 0 && hypot(vx, vy) < 620 && !o.super) { this.b.vx += vx * 0.3; this.flinch = 0.22; if (this.state === 'wind') this.t = Math.max(0, this.t - 0.12); return 'flinch'; }
    this.launch(vx, vy, o.super);
    if (this.hp <= 0) this.ko();
    return 'launch';
  }
  launch(vx, vy, sup) {
    const b = this.b; if (this.state !== 'ko') { this.state = 'fly'; this.t = 0; }
    b.vx = vx; b.vy = vy; b.w = rand(8, 16) * sign(vx || 1); b.soft = false; b.fric = 0.35; b.rest = 0.74; b.ghost = false;
    b.grounded = false; this.restT = 0; this.bounces = 0; this.super = !!sup || this.super; this.perch = false; b.y -= 3;
  }
  ko() { if (this.state === 'ko') return; this.state = 'ko'; this.t = 0; this.b.vx *= 1.12; this.b.vy = this.b.vy * 1.12 - 80; G.onKO(this); }
  bumped(o, sp, cx, cy) {
    if (!this.live || sp < 300) return;
    const e = o.owner;
    if (e instanceof Enemy && !e.live && e.hittable && e.state !== 'spawn') {
      e.takeHit(sp / 42, e.b.vx, e.b.vy - 220 - sp * 0.15, { super: this.super, src: 'body' });
      G.event('strike', { x: cx, y: cy }); G.punchFx(cx, cy, clamp(sp / 900, 0.6, 1.6), false, true);
      const d = sp / 80; this.hp -= d; this.dmg += d; if (this.hp <= 0) this.ko();
    }
  }
  remove() { this.gone = true; this.b.dead = true; }
  pose() {
    const b = this.b, t = this.age, s = this.state, moving = abs(b.vx) > 20 && b.grounded, ph = this.walk;
    const p = { lean: 0.06, bob: 0, expr: '', lf: [-7, 0], rf: [7, 0], lh: [-12, -26], rh: [13, -27] };
    if (moving) { p.lf = [-5 + cos(ph) * 9, -Math.max(0, sin(ph)) * 7]; p.rf = [5 - cos(ph) * 9, -Math.max(0, -sin(ph)) * 7]; p.lh = [-9 - cos(ph) * 8, -27]; p.rh = [11 + cos(ph) * 8, -28]; p.bob = -abs(sin(ph)) * 2; p.lean = 0.14; }
    if (s === 'spawn' || (!b.grounded && s === 'walk')) { p.lh = [-16, -46]; p.rh = [16, -48]; p.lf = [-8, -8]; p.rf = [8, -3]; }
    if (this.kind === 'chucker' && (s === 'walk' || s === 'recover')) p.rh = [12, -30];
    if (s === 'carry') { p.lh = [-6, -62]; p.rh = [8, -64]; p.lean = 0.25; p.expr = 'mad'; }
    else if (s === 'guard') { p.lh = [14, -46]; p.rh = [20, -40]; p.fistL = p.fistR = 1.3; p.lean = -0.12; p.expr = 'mad'; }
    else if (s === 'wind' && this.move === 'lunge') { const k = clamp(this.t / this.dur, 0, 1); p.bob = 10 * k; p.lean = 0.5 * k; p.lh = [-20, -20]; p.rh = [-14, -18]; p.expr = 'mad'; }
    else if (s === 'attack' && this.move === 'lunge') { p.lean = 0.7; p.rh = [42, -30]; p.lh = [36, -26]; p.fistR = 1.5; p.lf = [-16, -4]; p.rf = [-4, -10]; p.expr = 'mad'; }
    else if (s === 'wind' && this.move === 'pound') { const k = clamp(this.t / this.dur, 0, 1); p.lh = [-6, -70 - k * 8]; p.rh = [8, -72 - k * 8]; p.fistL = p.fistR = 1.4 + k * 0.3; p.lean = -0.15; p.bob = sin(t * 50) * k; p.expr = 'mad'; }
    else if (s === 'attack' && this.move === 'pound') { p.lh = [18, -6]; p.rh = [26, -8]; p.fistL = p.fistR = 1.6; p.lean = 0.5; p.bob = 8; p.expr = 'mad'; }
    else if (this.kind === 'plank' && (s === 'wind' || s === 'attack')) { const k = s === 'wind' ? clamp(this.t / this.dur, 0, 1) : 1; p.lh = [4, -60 - 10 * k]; p.rh = [10, -62 - 10 * k]; p.lean = s === 'attack' ? 0.45 : -0.2 * k; p.expr = 'mad'; if (s === 'attack') { p.lh = [30, -40]; p.rh = [36, -42]; } }
    else if (s === 'wind') {
      const k = clamp(this.t / this.dur, 0, 1), sh = sin(t * 60) * 1.5 * k; p.expr = 'mad';
      if (this.kind === 'bruiser') { p.lean = -0.2 + k * 0.1; p.lh = [-20 + sh, -22]; p.rh = [-6 + sh, -24]; p.lf = [-10 + sin(t * 24) * 6, -Math.max(0, sin(t * 24)) * 5]; p.bob = sh; }
      else if (this.kind === 'chucker') { p.rh = [-10 - k * 8, -50 - k * 6]; p.lean = -0.2 * k; p.bottle = true; }
      else { p.rh = [-12 - k * 8 + sh, -34]; p.lean = -0.25 * k; p.fistR = 1.3; }
    } else if (s === 'attack') {
      p.expr = 'mad';
      if (this.kind === 'bruiser') { p.lean = 0.55; p.lh = [14, -20]; p.rh = [22, -30]; p.lf = [-8 + cos(t * 30) * 12, -Math.max(0, sin(t * 30)) * 9]; p.rf = [8 - cos(t * 30) * 12, -Math.max(0, -sin(t * 30)) * 9]; }
      else { p.rh = [40, -32]; p.lean = 0.4; p.fistR = 1.6; p.bendR = 0; }
    } else if (s === 'recover' && this.kind === 'chucker') { p.rh = [24, -18]; p.lean = 0.3; }
    else if (s === 'stun') { p.expr = 'dizzy'; p.lean = sin(t * 6) * 0.15; p.lh = [-16, -20]; p.rh = [16, -20]; }
    else if (this.live) { const f = t * 26; p.expr = s === 'ko' ? 'ko' : 'ow'; p.lh = [-18 + sin(f) * 7, -40 + cos(f * 1.3) * 12]; p.rh = [18 + cos(f * 1.1) * 7, -40 + sin(f) * 12]; p.lf = [-10 + sin(f * 0.9) * 6, -4 + cos(f) * 6]; p.rf = [10 + cos(f) * 6, -4 + sin(f * 1.2) * 6]; }
    else if (s === 'down') { p.expr = 'ow'; p.lh = [-22, -34]; p.rh = [22, -38]; p.lf = [-12, -2]; p.rf = [12, -4]; }
    else if (s === 'getup') { const k = this.t / 0.35; p.bob = (1 - k) * 14; p.lean = (1 - k) * 0.5; p.expr = 'mad'; }
    if (this.kind === 'plank' && this.shield > 0 && (s === 'walk' || s === 'recover' || s === 'spawn')) { p.lh = [16, -34]; p.rh = [18, -26]; }
    if (this.flinch > 0) { p.expr = 'ow'; p.lean = -0.25; }
    return p;
  }
  draw() {
    const b = this.b, c = this.cfg, p = this.pose(), st = STYLE[this.kind];
    if (b.grounded && !this.live) groundShadow(b.x, b.y + b.r, b.r);
    X.save(); X.translate(b.x, b.y);
    if (this.live) { X.rotate(b.ang); const v = clamp(hypot(b.vx, b.vy) / 2600, 0, 0.3); X.scale(1 + v - this.sq * 0.15, 1 - v * 0.6 + this.sq * 0.25); }
    else if (this.state === 'down') X.rotate((Math.PI / 2) * -this.face * 0.92);
    X.translate(0, this.state === 'down' ? b.r * 0.2 : b.r); X.scale(this.face * c.s, c.s);
    if (this.kind === 'plank' && this.shield > 0 && !this.live && this.state !== 'down') drawPlank(this, p, false);
    rig(st, p, this.age);
    if (this.kind === 'plank' && this.shield > 0 && !this.live && this.state !== 'down') drawPlank(this, p, true);
    if (p.bottle) drawBottle(p.rh[0] + 4, p.rh[1] - 6, -0.5);
    X.restore();
    if (this.role === 'grab' && this.state === 'walk') sock('!', b.x, b.y - c.r - 66 * c.s, 30, C.mustard, -0.1);
    if (this.state === 'guard') FX.stamp && this.t < 0.02 && FX.stamp('BLOCK!', b.x, b.y - 80, 32, C.steel);
    if (this.state === 'wind' && this.kind !== 'chucker') { const k = outBack(this.t * 7); sock('!', b.x + this.face * 4, b.y - c.r - 62 * c.s, 34 * k, C.red, 0.1); }
    if (this.state === 'stun') for (let i = 0; i < 3; i++) { const a = this.age * 5 + (i * TAU) / 3; ink(starPath(b.x + cos(a) * 20, b.y - c.r - 50 * c.s + sin(a) * 6, 6, 4, 0.42, a), C.mustard, 1.8); }
    if (this.kind === 'bruiser' && this.state === 'wind' && this.t % 0.12 < 0.03) FX.puff(b.x - this.face * 8, b.y - 78, 1, 60, 6);
  }
}
function drawPlank(e, p, front) {
  const s = e.state, raised = s === 'wind' || s === 'attack';
  if (raised !== front) return;     // held in front: drawn over the body; overhead: drawn over too, but after the arms
  X.save();
  if (!raised) { X.translate(24, -40); X.rotate(-0.06); }
  else if (s === 'wind') { X.translate(6, -74); X.rotate(-1.35 - clamp(e.t / e.dur, 0, 1) * 0.35); }
  else { X.translate(34, -40); X.rotate(-0.1 + Math.min(1, e.t / 0.06) * 1.1); }
  ink(rrect(-5, -34, 12, 72, 2), C.wood, 2.6); line([[-2, -24], [4, -24]], 1.4); line([[-2, 20], [4, 20]], 1.4);
  for (let i = 0; i < 3 - e.shield; i++) line([[-4, -10 + i * 10], [2, -4 + i * 10], [6, -8 + i * 10]], 1.4);
  X.restore();
}
function groundShadow(x, y, r) { X.fillStyle = 'rgba(29,26,22,.28)'; X.beginPath(); X.ellipse(x, y + 2, r * 1.05, 5, 0, 0, TAU); X.fill(); }
function drawBottle(x, y, rot) {
  X.save(); X.translate(x, y); X.rotate(rot);
  ink(rrect(-4.5, -4, 9, 14, 2.5), C.green, 2); ink(rrect(-2, -12, 4, 9, 1), C.green, 2); X.fillStyle = C.cream; X.fillRect(-3.5, 1, 7, 5);
  X.restore();
}

// ───────────────────────────── props
class Barrel {
  constructor(x, y) {
    this.b = World.addBody({ x, y, r: 25, m: 1.5, rest: 0.5, fric: 0.5, cat: CAT.PROP, mask: CAT.ENEMY | CAT.PROP }); this.b.owner = this; this.lastRic = -1; this.gone = false; this.hot = 0;
    this.b.onHit = (h) => { if (h.speed > 260 && G.time - this.lastRic > 0.08) { this.lastRic = G.time; Sfx.wood(h.speed / 1000); FX.chips(h.x, h.y, h.nx, h.ny, 2, C.wood, 200); World.kick(h.x, h.y, -h.nx, -h.ny, 70, h.speed * 0.25); if (this.hot > 0) G.event('ricochet', { x: h.x, y: h.y }); } };
    this.b.onBump = (o, sp, cx, cy) => hotBump(this, o, sp, cx, cy);
  }
  punch(lx, ly, power, pl) { const v = (1000 * Math.min(power, 3)) / Math.sqrt(this.b.m); this.b.vx = lx * v; this.b.vy = ly * v - 60; this.b.grounded = false; this.b.y -= 2; this.hot = 3; this.super = pl.super; Sfx.wood(1); }
  update(dt) { this.hot -= dt; if (this.b.y > World.waterY + 14) { G.splash(this.b.x); this.gone = true; this.b.dead = true; } if (this.b.x < G.stage.minX - 80 || this.b.x > G.stage.maxX + 80) { this.gone = true; this.b.dead = true; } }
  draw() {
    const b = this.b; X.save(); X.translate(b.x, b.y); X.rotate(b.ang);
    ink(circ(0, 0, b.r), C.wood, 3); X.lineWidth = 2; X.strokeStyle = C.ink; X.beginPath(); X.arc(0, 0, b.r - 6, 0, TAU); X.stroke();
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4; X.beginPath(); X.moveTo(cos(a) * (b.r - 6), sin(a) * (b.r - 6)); X.lineTo(-cos(a) * (b.r - 6), -sin(a) * (b.r - 6)); X.globalAlpha = 0.35; X.stroke(); X.globalAlpha = 1; }
    ink(circ(0, 0, 4), C.woodDk, 1.8, false); X.restore();
  }
}
function hotBump(self, o, sp, cx, cy) {
  if (sp < 280) return; const e = o.owner;
  if (e instanceof Enemy && !e.live && e.hittable && e.state !== 'spawn') {
    e.takeHit(sp / 36, e.b.vx, e.b.vy - 240 - sp * 0.15, { super: self.super, src: 'prop' });
    G.event('strike', { x: cx, y: cy }); G.punchFx(cx, cy, clamp(sp / 800, 0.6, 1.8), false, true);
  }
}
// crane hook / cargo sling: a heavy pendulum that rides the (bendable) boom
class Hook {
  constructor(shape, i, len, o) {
    o = o || {}; const a = shape.pts[i];
    this.b = World.addBody({ x: a.x, y: a.y + len, r: o.r || 17, m: o.m || 5, rest: 0.3, fric: 0.2, cat: CAT.PROP, mask: CAT.ENEMY });
    this.b.tether = { shape, i, len }; this.b.owner = this; this.kind = o.kind || 'hook'; this.gone = false;
    this.b.onBump = (o2, sp, cx, cy) => { hotBump(this, o2, sp, cx, cy); if (sp > 300) Sfx.metal(0.5); };
    this.b.onHit = (h) => { if (h.speed > 300) { Sfx.metal(h.speed / 1200); FX.sparks(h.x, h.y, h.nx, h.ny, 4); } };
  }
  punch(lx, ly, power, pl) { const v = 560 * Math.min(power, 3.2); this.b.vx = lx * v; this.b.vy = ly * v; this.super = pl.super; Sfx.metal(0.8); Sfx.creak(); }
  update() {}
  draw() {
    const b = this.b, t = b.tether, a = t.shape.pts[t.i];
    line([[a.x, a.y], [b.x, b.y - b.r + 2]], 3.4); line([[a.x, a.y], [b.x, b.y - b.r + 2]], 1.2, C.steel);
    X.save(); X.translate(b.x, b.y); X.rotate(Math.atan2(b.x - a.x, -(b.y - a.y)) * -1 + Math.PI);
    if (this.kind === 'hook') {
      ink(rrect(-8, -b.r, 16, 15, 3), C.steel, 2.8);
      X.lineCap = 'round'; X.strokeStyle = C.ink; X.lineWidth = 10; X.beginPath(); X.arc(0, 4, 10, -0.3, Math.PI * 1.1); X.stroke();
      X.strokeStyle = C.steel; X.lineWidth = 5; X.beginPath(); X.arc(0, 4, 10, -0.3, Math.PI * 1.1); X.stroke();
    } else {
      ink(rrect(-b.r, -b.r, b.r * 2, b.r * 2, 3), C.wood, 3); line([[-b.r, -b.r], [b.r, b.r]], 2); line([[b.r, -b.r], [-b.r, b.r]], 2);
      line([[-b.r, -b.r], [0, -b.r - 12], [b.r, -b.r]], 2.4); label('FRAGILE', 0, 1, 12, C.ink, FONT.sign, 'center');
    }
    X.restore();
  }
}
class Bottle {
  constructor(x, y, vx, vy) {
    this.b = World.addBody({ x, y, r: 8, m: 0.3, rest: 0.2, fric: 0.3, cat: CAT.PROJ, mask: 0, vx, vy }); this.b.owner = this; this.b.w = 12; this.back = false; this.gone = false;
    this.b.onHit = () => this.smash();
    this.b.onBump = (o) => { const e = o.owner; if (this.back && e instanceof Enemy && e.hittable) { e.takeHit(14, this.b.vx * 0.5, -420, { src: 'bottle', super: true }); G.event('return', { x: this.b.x, y: this.b.y }); this.smash(); } };
  }
  punch(lx, ly, power, pl) { this.back = true; this.b.vx = lx * 1100; this.b.vy = ly * 1100 - 120; this.b.mask = CAT.ENEMY; this.b.grav = 0.5; FX.stamp('RETURN TO SENDER!', this.b.x, this.b.y - 40, 30, C.teal); Sfx.blip(true); }
  smash() { if (this.gone) return; this.gone = true; this.b.dead = true; FX.glass(this.b.x, this.b.y); Sfx.glass(); }
  update() {
    const b = this.b, P = G.player;
    if (!this.back && hypot(b.x - P.b.x, b.y - P.b.y) < b.r + P.b.r - 2) { if (P.hurt(1, sign(b.vx || 1), 300)) this.smash(); }
    if (b.y > World.waterY + 10 || b.x < G.stage.minX - 100 || b.x > G.stage.maxX + 100) { this.gone = true; b.dead = true; }
  }
  draw() { drawBottle(this.b.x, this.b.y, this.b.ang); }
}
class Can {
  constructor(x, y) { this.b = World.addBody({ x, y, r: 13, m: 0.5, rest: 0.45, fric: 0.6, cat: CAT.PICKUP, mask: 0, vy: 60 }); this.b.noBeam = true; this.gone = false; this.t = 0; this.b.onHit = (h) => { if (h.speed > 150) Sfx.can(); }; }
  update(dt) {
    this.t += dt; const b = this.b, P = G.player;
    if (hypot(b.x - P.b.x, b.y - (P.b.y - 14)) < 56 && !P.dead) { this.gone = true; b.dead = true; P.eat(); G.canOut = false; return; }
    if (b.y > World.waterY + 10 || b.x < G.stage.minX || b.x > G.stage.maxX) { this.gone = true; b.dead = true; G.canOut = false; G.splash(b.x); G.gullT = 2.5; }
  }
  draw() {
    const b = this.b, k = 1 + sin(this.t * 8) * 0.06;
    X.save(); X.translate(b.x, b.y);
    X.save(); X.rotate(this.t * 1.5); X.globalAlpha = 0.9; ink(starPath(0, 0, 30 * k, 10, 0.6, 0), C.greenLt, 2.2, false); X.restore();
    X.rotate(b.ang); drawCan(0, 0, 1); X.restore();
    if (b.grounded && Math.floor(this.t * 2) % 2) sock('EAT ME', b.x, b.y - 44, 20, C.green, 0);
  }
}
function drawCan(x, y, s) {
  X.save(); X.translate(x, y); X.scale(s, s);
  ink(rrect(-10, -13, 20, 26, 3), C.steel, 2.6); X.fillStyle = C.green; X.fillRect(-10 + REG.x, -6 + REG.y, 20, 13);
  X.strokeStyle = C.ink; X.lineWidth = 1.6; X.strokeRect(-10, -6, 20, 13);
  ink(ell(0, 0.5, 5.5, 3.6, -0.4), C.greenLt, 1.4, false); line([[-8, -10], [8, -10]], 1.4); line([[-8, 10], [8, 10]], 1.4);
  X.restore();
}
// the gull is the spinach delivery service
class Gull {
  constructor(dropX) { this.dropX = dropX; this.x = G.cam.x - 80; this.y = 90; this.t = 0; this.dropped = false; this.gone = false; Sfx.gull(); }
  update(dt) {
    this.t += dt; this.x += 420 * dt; this.y = 96 + sin(this.t * 5) * 12;
    if (!this.dropped && this.x >= this.dropX) { this.dropped = true; G.props.push(new Can(this.x, this.y + 26)); Sfx.whistle(); }
    if (this.x > G.cam.x + W + 100) this.gone = true;
  }
  draw() {
    const f = sin(this.t * 14); X.save(); X.translate(this.x, this.y);
    ink(poly([[-16, 0], [-34, -4 - f * 16], [-8, -6]]), C.white, 2.2); ink(ell(0, 0, 18, 8), C.white, 2.6);
    ink(poly([[-4, -4], [-14, -8 - f * 22], [10, -6]]), C.white, 2.2); ink(circ(15, -5, 6.5), C.white, 2.4);
    ink(poly([[20, -6], [31, -3], [20, -1]]), C.mustard, 2); X.fillStyle = C.ink; X.beginPath(); X.arc(16.5, -6.5, 1.5, 0, TAU); X.fill();
    if (!this.dropped) { line([[2, 7], [2, 16]], 1.6); drawCan(2, 28, 0.9); }
    X.restore();
  }
}

// ───────────────────────────── Olive Oyl: tosses the spinach, gets carried off if you let her
class Olive {
  constructor(x, y, o) {
    o = o || {};
    this.b = World.addBody({ x, y, r: 20, m: 1, rest: 0, fric: 0.9, cat: CAT.PICKUP, mask: 0 }); this.b.noBeam = true;
    this.home = o.home || [x - 80, x + 80]; this.state = o.cage ? 'caged' : 'idle'; this.cage = o.cage || null;
    this.t = 0; this.age = 0; this.face = 1; this.carrier = null; this.cheerT = 0; this.scared = 0; this.sayT = rand(4, 8); this.tossT = 0; this.walk = 0;
    if (this.cage) { this.b.fixed = true; this.b.ghost = true; }
  }
  get free() { return this.state === 'idle' && this.b.grounded; }
  get canToss() { return (this.state === 'idle' && this.b.grounded) || this.state === 'caged'; }
  grab(e) { this.carrier = e; this.state = 'carried'; this.b.fixed = true; this.b.ghost = true; FX.say(this, 'HELP! HELP!', 1.6); Sfx.whistle(); }
  drop() {
    if (this.state !== 'carried') return;
    this.carrier = null; this.state = 'idle'; this.b.fixed = false; this.b.ghost = false; this.b.vy = -360; this.b.vx = rand(-60, 60); this.b.y -= 4;
    FX.say(this, pick(['WELL, I NEVER!', 'MY HERO!', 'AND STAY DOWN!']), 1.4); G.add(150 * G.mult, 'trick'); G.chainUp();
  }
  lose() { this.carrier = null; this.state = 'gone'; this.t = 0; this.b.fixed = true; this.b.ghost = true; }
  free_() { this.state = 'idle'; this.cage = null; this.b.fixed = false; this.b.ghost = false; this.b.vy = -200; FX.say(this, 'OH, MY HERO!', 2.2); }
  cheer() { if (this.state === 'idle' || this.state === 'caged') { this.cheerT = 0.9; if (Math.random() < 0.25) FX.say(this, pick(['SOCK HIM ONE!', 'THAT’S TELLING HIM!', 'OOH, RIGHT IN THE KISSER!', 'ANOTHER ONE!']), 1.2); } }
  toss() {
    const P = G.player, b = this.b, T = 0.85, sx = b.x, sy = b.y - 60, dx = P.b.x + P.b.vx * 0.25 - sx, dy = P.b.y - 30 - sy;
    const can = new Can(sx, sy); can.b.vx = dx / T; can.b.vy = (dy - 0.5 * World.g * T * T) / T; G.props.push(can);
    this.tossT = 0.5; FX.say(this, pick(['CATCH, SAILOR!', 'HERE! EAT YOUR GREENS!', 'SPINACH! QUICK!']), 1.3); Sfx.whoosh(0.6);
  }
  update(dt) {
    const b = this.b; this.t += dt; this.age += dt; this.cheerT -= dt; this.tossT -= dt; this.sayT -= dt;
    if (this.state === 'caged') { const a = this.cage.shape.pts[this.cage.i]; b.x = a.x; b.y = a.y + this.cage.len; b.vx = b.vy = 0; return; }
    if (this.state === 'carried') {
      const c = this.carrier; if (!c || c.gone || c.state !== 'carry') { this.drop(); return; }
      b.x = c.b.x - c.face * 4; b.y = c.b.y - c.b.r - 40; b.vx = b.vy = 0; this.face = -c.face;
      if (this.sayT <= 0) { this.sayT = 1.8; FX.say(this, pick(['HELP! HELP!', 'PUT ME DOWN, YOU BRUTE!', 'SAILOR! OVER HERE!']), 1.4); }
      return;
    }
    if (this.state === 'gone') {
      if (this.t > 7) { this.state = 'idle'; this.b.fixed = false; this.b.ghost = false; b.x = (this.home[0] + this.home[1]) / 2; b.y = 180; b.vy = 0; FX.say(this, 'HMPH! THEY THREW ME BACK!', 1.8); FX.puff(b.x, b.y, 8, 140, 10); }
      return;
    }
    if (b.y > World.waterY + 10) { G.splash(b.x); b.x = (this.home[0] + this.home[1]) / 2; b.y = 180; b.vy = 0; FX.say(this, 'BRRR! THAT WATER’S COLD!', 1.6); }
    // shy away from trouble, drift home otherwise
    let dir = 0, threat = null, td = 1e9;
    for (const e of G.enemies) if (!e.gone && !e.hidden && e.state !== 'ko') { const d = abs(e.b.x - b.x); if (d < td && abs(e.b.y - b.y) < 90) { td = d; threat = e; } }
    this.scared = threat && td < 150 ? 1 : Math.max(0, this.scared - dt * 2);
    if (threat && td < 150 && b.grounded) dir = -sign(threat.b.x - b.x) || 1;
    else if (b.x < this.home[0]) dir = 1; else if (b.x > this.home[1]) dir = -1;
    if (dir && b.grounded) { const g = World.groundBelow(b.x + dir * 30, b.y - 10, 150); if (g === null || g > World.waterY - 10) dir = 0; }
    b.vx = approach(b.vx, dir * (this.scared ? 105 : 70), 900 * dt);
    if (abs(b.vx) > 15) { this.walk += abs(b.vx) * dt * 0.07; this.face = sign(b.vx); } else this.face = sign(G.player.b.x - b.x) || 1;
  }
  pose() {
    const t = this.age, s = this.state, ph = this.walk, p = { lean: 0, bob: 0, expr: '', lf: [-5, 0], rf: [5, 0], lh: [-9, -44 + sin(t * 2) * 1.2], rh: [10, -45], skirtK: 0 };
    if (abs(this.b.vx) > 15) { p.lf = [-4 + cos(ph) * 10, -Math.max(0, sin(ph)) * 7]; p.rf = [4 - cos(ph) * 10, -Math.max(0, -sin(ph)) * 7]; p.skirtK = abs(cos(ph)) * 0.6; p.lean = 0.08; }
    if (s === 'carried' || s === 'caged' || this.scared > 0.3) { p.expr = 'scared'; p.lh = [-14, -88 + sin(t * 20) * 4]; p.rh = [14, -90 + cos(t * 20) * 4]; }
    if (s === 'carried') { const k = sin(t * 18); p.lf = [-8 + k * 8, -6]; p.rf = [8 - k * 8, -10]; p.skirtK = 0.8; }
    if (this.cheerT > 0 && s !== 'carried') { p.expr = 'cheer'; p.lh = [-16, -86]; p.rh = [16, -88]; p.bob = -abs(sin(t * 14)) * 5; }
    if (this.tossT > 0) { p.rh = [24, -70]; p.lean = 0.15; p.expr = 'cheer'; }
    return p;
  }
  draw() {
    if (this.state === 'gone') return;
    const b = this.b, p = this.pose();
    if (this.state === 'caged') {
      const a = this.cage.shape.pts[this.cage.i]; line([[a.x, a.y], [b.x, b.y - 72]], 3); line([[a.x, a.y], [b.x, b.y - 72]], 1.2, C.steel);
    } else if (b.grounded) groundShadow(b.x, b.y + b.r, b.r);
    X.save(); X.translate(b.x, b.y + b.r);
    if (this.state === 'carried') { X.translate(0, -40); X.rotate(this.face * 1.35); X.translate(0, 40); }
    X.scale(this.face * 1.18, 1.18); rig(STYLE.olive, p, this.age); X.restore();
    if (this.state === 'caged') {   // cargo net
      const x = b.x, y = b.y + b.r, w = 34, top = y - 104;
      X.save(); X.strokeStyle = C.ink; X.lineWidth = 2;
      const net = new Path2D(); net.moveTo(x, top); net.quadraticCurveTo(x - w * 1.3, y - 40, x - w * 0.8, y + 6); net.quadraticCurveTo(x, y + 22, x + w * 0.8, y + 6); net.quadraticCurveTo(x + w * 1.3, y - 40, x, top);
      X.stroke(net); X.clip(net);
      X.beginPath(); for (let i = -6; i <= 6; i++) { X.moveTo(x + i * 10 - 60, top); X.lineTo(x + i * 10 + 60, y + 30); X.moveTo(x + i * 10 + 60, top); X.lineTo(x + i * 10 - 60, y + 30); } X.globalAlpha = 0.75; X.stroke(); X.restore();
    }
  }
}
