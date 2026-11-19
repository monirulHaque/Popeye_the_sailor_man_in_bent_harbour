// ───────────────────────────── stages: three strips of waterfront
MAT.ink = { c2: 2200, kr: 120, dp: 4, stiff: 1.5, max: 64, cost: 3.2, label: 'Panel border, dented (printer notified)' };
WORDS.ink = ['KLONK!', 'BORDER!', 'TONK!'];
const THEME = {
  morning: { sky: '#efe2c0', dots: 'rgba(44,110,115,.30)', sun: C.mustard, sunX: 980, sunY: 150, far: '#b4cbb9', sea: '#9cc4b6', water: C.teal, cloud: C.white },
  sunset: { sky: '#f4d59c', dots: 'rgba(201,68,44,.36)', sun: C.red, sunX: 420, sunY: 330, far: '#cf9070', sea: '#7fb0a6', water: '#2a666b', cloud: '#fbe9c0' },
  storm: { sky: '#a8b8ad', dots: 'rgba(29,26,22,.34)', sun: '#dfe6d2', sunX: 1010, sunY: 120, far: '#778d86', sea: '#5f8581', water: '#224e54', cloud: '#cfd8cb', rain: true },
};
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mkSkyline(seed, width) {
  const r = mulberry(seed), out = []; let x = -80;
  while (x < width * 0.3 + W) { const w = 50 + r() * 120, h = 26 + r() * 86; out.push({ x, w, h, type: (r() * 6) | 0 }); x += w + r() * 34 - 4; }
  return out;
}
const CLOUDS = [[120, 96, 1.1, 5], [520, 150, 0.8, 3], [860, 70, 1.3, 6], [1260, 180, 0.9, 4], [1560, 110, 1.0, 5]];
function paintSky(st, cam, t) {
  const th = st.theme, hz = 452;
  X.fillStyle = th.sky; X.fillRect(-40, -40, W + 80, H + 80);
  for (let i = 0; i < 4; i++) { X.fillStyle = Pat.dots(th.dots, 3.3 - i * 0.8, 9); X.fillRect(-40, i * 78 - 40, W + 80, i ? 78 : 118); }
  const sx = th.sunX - cam * 0.04;
  ink(circ(sx, th.sunY, 58), th.sun, 3.4); X.save(); X.clip(circ(sx, th.sunY, 58)); X.fillStyle = Pat.dots('rgba(251,246,228,.6)', 2.2, 8); X.fillRect(sx - 60, th.sunY - 10, 120, 80); X.restore();
  for (const [cx, cy, s, v] of CLOUDS) {
    const x = ((((cx - cam * 0.1 + t * v) % 1700) + 1700) % 1700) - 200, blobs = [[0, 0, 26], [28, -12, 30], [60, -2, 24], [-26, 6, 18], [86, 8, 16]];
    X.strokeStyle = C.ink; X.lineWidth = 5.6; for (const [bx, by, br] of blobs) { X.beginPath(); X.arc(x + bx * s, cy + by * s, br * s, 0, TAU); X.stroke(); }
    X.fillStyle = th.cloud; for (const [bx, by, br] of blobs) { X.beginPath(); X.arc(x + bx * s, cy + by * s, br * s, 0, TAU); X.fill(); }
    X.fillStyle = th.cloud; X.fillRect(x - 30 * s, cy + 6 * s, 120 * s, 16 * s); line([[x - 40 * s, cy + 22 * s], [x + 100 * s, cy + 22 * s]], 2.8);
  }
  // far shore
  X.fillStyle = th.far;
  for (const b of st.skyline) {
    const x = b.x - cam * 0.22; if (x > W + 20 || x + b.w < -20) continue;
    X.fillRect(x, hz - b.h, b.w, b.h + 2);
    if (b.type === 1) X.fill(poly([[x - 4, hz - b.h], [x + b.w / 2, hz - b.h - 22], [x + b.w + 4, hz - b.h]]));
    else if (b.type === 2) for (let i = 0; i < 3; i++) X.fill(poly([[x + (i * b.w) / 3, hz - b.h], [x + (i * b.w) / 3, hz - b.h - 16], [x + ((i + 1) * b.w) / 3, hz - b.h]]));
    else if (b.type === 3) { X.fillRect(x + b.w * 0.4, hz - b.h - 46, 5, 46); X.fillRect(x + b.w * 0.7, hz - b.h - 46, 5, 46); X.beginPath(); X.ellipse(x + b.w * 0.58, hz - b.h - 52, 24, 15, 0, 0, TAU); X.fill(); }
    else if (b.type === 4) { X.fillRect(x + b.w * 0.5, hz - b.h - 80, 6, 80); X.fill(poly([[x + b.w * 0.5 - 30, hz - b.h - 62], [x + b.w * 0.5 + 76, hz - b.h - 84], [x + b.w * 0.5 + 76, hz - b.h - 78], [x + b.w * 0.5 - 30, hz - b.h - 56]])); }
    else if (b.type === 5) { X.fillRect(x + b.w * 0.3, hz - b.h - 30, 12, 30); X.fillRect(x + b.w * 0.6, hz - b.h - 38, 12, 38); }
  }
  X.fillStyle = Pat.dots('rgba(251,246,228,.35)', 1.6, 7); X.fillRect(-40, hz - 140, W + 80, 142);
  // open water
  X.fillStyle = th.sea; X.fillRect(-40, hz, W + 80, H - hz + 40);
  X.fillStyle = Pat.dots('rgba(29,26,22,.16)', 1.5, 7); X.fillRect(-40, hz + 60, W + 80, H);
  line([[-40, hz], [W + 40, hz]], 2.6);
  X.strokeStyle = C.ink; X.lineWidth = 2; X.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const y = hz + 14 + ((i * 37) % 180), x = ((((i * 211 - cam * (0.3 + (y - hz) * 0.002) + t * (8 + (i % 5) * 4)) % 1500) + 1500) % 1500) - 100, w = 14 + (i % 4) * 9;
    X.beginPath(); X.moveTo(x, y); X.quadraticCurveTo(x + w / 2, y - 5, x + w, y); X.stroke();
  }
}
function paintRain(t, heavy) {
  X.strokeStyle = 'rgba(29,26,22,.42)'; X.lineWidth = 1.6; X.beginPath();
  for (let i = 0; i < (heavy ? 110 : 70); i++) { const x = (((i * 173 + t * 520) % (W + 200)) + W + 200) % (W + 200) - 100, y = ((i * 97 + t * 1500) % (H + 80)) - 40; X.moveTo(x, y); X.lineTo(x - 10, y + 30); }
  X.stroke();
}
function paintWater(st, t, cam) {
  const y0 = World.waterY, p = new Path2D(); p.moveTo(cam - 30, H + 60);
  for (let x = cam - 30; x <= cam + W + 30; x += 18) p.lineTo(x, y0 + sin(x * 0.021 + t * 2.1) * 3.4 + sin(x * 0.05 - t * 1.4) * 2);
  p.lineTo(cam + W + 30, H + 60); p.closePath();
  X.fillStyle = st.theme.water; X.fill(p);
  X.save(); X.clip(p); X.fillStyle = Pat.dots('rgba(251,246,228,.22)', 1.6, 8); X.fillRect(cam - 30, y0 - 8, W + 60, 30); X.restore();
  X.lineWidth = 3.2; X.strokeStyle = C.ink; X.stroke(p);
  X.strokeStyle = C.tealLt; X.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const x = cam + ((((i * 163 + t * 26) % (W + 80)) + W + 80) % (W + 80)) - 40, y = y0 + 22 + (i % 3) * 16; X.beginPath(); X.moveTo(x, y); X.quadraticCurveTo(x + 14, y - 5, x + 28, y); X.stroke(); }
}
function lattice(x, y0, y1, w, color) {
  ink(poly([[x - w / 2, y1], [x + w / 2, y1], [x + w / 2 - 4, y0], [x - w / 2 + 4, y0]]), color, 3);
  const pts = []; for (let y = y1, i = 0; y > y0; y -= 26, i++) pts.push([x + (i % 2 ? 1 : -1) * (w / 2 - 3), y]);
  line(pts, 2);
}
function crateStack(x, y, rows) {
  X.save(); X.globalAlpha = 0.5;
  for (let r = 0; r < rows.length; r++) for (let i = 0; i < rows[r]; i++) {
    const cx = x + i * 50 + r * 22, cy = y - (r + 1) * 44;
    ink(rrect(cx, cy, 48, 44, 2), r % 2 ? C.woodDk : C.wood, 2.6); line([[cx + 5, cy + 5], [cx + 43, cy + 39]], 1.6); line([[cx + 43, cy + 5], [cx + 5, cy + 39]], 1.6); X.strokeRect(cx + 5, cy + 5, 38, 34);
  }
  X.restore();
}
function bollard(x, y) { ink(rrect(x - 9, y - 22, 18, 22, 4), C.steelDk, 2.6); ink(rrect(x - 13, y - 28, 26, 9, 4), C.steelDk, 2.6); }
function signBoard(x, y, w, h, text, size, fill, col) { ink(rrect(x, y, w, h, 3), fill || C.cream, 2.8); label(text, x + w / 2, y + h / 2 + 2, size, col || C.ink, FONT.sign, 'center'); }
function paintBorder(s) {
  const pts = s.pts.map((p) => [p.x, p.y]), n = pts.length;
  X.fillStyle = C.paper; X.fill(poly(pts.concat([[pts[n - 1][0], -300], [pts[0][0], -300]])));
  line(pts, 7);
}
function mkPier(x0, x1, top) {
  const s = World.addShape({ kind: 'solid', mat: 'wood', pts: [[x0, top], [x1, top], [x1, 800], [x0, 800]], sub: 20, pin: (x, y) => (y > top + 1 ? 0 : clamp(Math.min(x - x0, x1 - x) / 60, 0.12, 1)), draw: paintPier });
  s.pts.forEach((p) => { p.top = p.ry === top; }); s.maxDown = 54; return s;
}
function mkBorder(x0, x1) {
  return World.addShape({ kind: 'beam', mat: 'ink', bend: 'dent', r: 5, pts: [[x0, 14], [x1, 14]], sub: 24, tag: 'border', pin: (x) => clamp(Math.min(x - x0, x1 - x) / 80, 0, 1) });
}

// ── ship's bell: ring it with a body (or a fist) to rattle every tough in earshot
class Bell {
  constructor(shape, i, dy) { this.s = shape; this.i = i; this.dy = dy; this.cd = 0; this.sw = 0; this.t = 0; }
  get x() { return this.s.pts[this.i].x; } get y() { return this.s.pts[this.i].y + this.dy; }
  ring(x) {
    if (this.cd > 0) return; this.cd = 1.4; this.sw = 1; Sfx.bell(); G.event('bell', { x: this.x, y: this.y });
    FX.stamp('DING-DONG!', this.x, this.y - 50, 42, C.mustard, { burst: C.cream }); FX.ring(this.x, this.y, 20, 420, 0.5, C.ink, 5);
    for (const e of G.enemies) if (!e.live && e.hittable && e.state !== 'spawn' && abs(e.b.x - this.x) < 620) { e.state = 'stun'; e.t = 0; e.dur = e.kind === 'bruiser' ? 0.9 : 1.5; }
  }
  update(dt) {
    this.cd -= dt; this.sw *= Math.exp(-dt * 2); this.t += dt;
    for (const e of G.enemies) if (e.live && hypot(e.b.x - this.x, e.b.y - this.y) < 20 + e.b.r) this.ring();
    for (const p of G.props) if (p.hot > 0 && hypot(p.b.x - this.x, p.b.y - this.y) < 20 + p.b.r) this.ring();
  }
  punched(cx, cy, R) { if (hypot(cx - this.x, cy - this.y) < R + 18) { this.ring(); return true; } return false; }
  draw() {
    const x = this.x, y = this.y, base = this.s.pts[this.i];
    line([[x - 22, base.y], [x - 22, y - 26], [x + 2, y - 26]], 5); line([[x - 22, base.y], [x - 22, y - 26], [x + 2, y - 26]], 2, C.woodDk);
    X.save(); X.translate(x, y - 22); X.rotate(sin(this.t * 16) * this.sw * 0.5);
    const b = new Path2D(); b.moveTo(-5, 0); b.bezierCurveTo(-7, 12, -16, 16, -17, 28); b.lineTo(17, 28); b.bezierCurveTo(16, 16, 7, 12, 5, 0); b.closePath();
    ink(b, C.mustard, 2.8); ink(circ(0, 31, 4.5), C.ink, 0); line([[-10, 21], [10, 21]], 1.6); X.restore();
  }
}
// ── a steamer's funnel swallows whatever lands in it and coughs it back across the harbor
class Funnel {
  constructor(shape, x0, x1, top, vx, vy) { this.s = shape; this.x0 = x0; this.x1 = x1; this.top = top; this.vx = vx; this.vy = vy; this.held = []; this.t = 0; this.cough = 0; }
  update(dt) {
    this.t += dt; this.cough = Math.max(0, this.cough - dt * 3);
    const take = (o) => { o.hidden = true; o.b.fixed = true; o.b.ghost = true; this.held.push({ o, t: 0.42 }); Sfx.creak(); FX.puff((this.x0 + this.x1) / 2, this.top, 4, 90, 9, C.steelDk); };
    for (const e of G.enemies) if (e.live && !e.hidden && e.b.x > this.x0 - 6 && e.b.x < this.x1 + 6 && e.b.y + e.b.r > this.top - 10 && e.b.y < this.top + 12 && e.b.vy > -100) take(e);
    for (const p of G.props) if (p instanceof Barrel && !p.hidden && p.b.x > this.x0 && p.b.x < this.x1 && p.b.y + p.b.r > this.top - 8 && p.b.y < this.top + 12) take(p);
    for (const h of this.held) {
      h.t -= dt;
      if (h.t <= 0) {
        const o = h.o, mx = (this.x0 + this.x1) / 2; o.hidden = false; o.b.fixed = false; o.b.ghost = false; o.b.x = mx; o.b.y = this.top - o.b.r - 8;
        if (o instanceof Enemy) { o.takeHit(9, this.vx, this.vy, { super: true, src: 'spout' }); } else { o.b.vx = this.vx; o.b.vy = this.vy; o.hot = 3; }
        Sfx.foomp(); this.cough = 1; G.shake(7); G.event('spout', { x: mx, y: this.top });
        FX.puff(mx, this.top - 10, 12, 260, 14, C.steelDk); FX.stamp('FOOMP!', mx - 30, this.top - 70, 50, C.ink, { color: C.mustard, burst: C.white });
      }
    }
    this.held = this.held.filter((h) => h.t > 0);
    if (this.t % 0.7 < dt) FX.add({ type: 'puff', x: (this.x0 + this.x1) / 2 + rand(-8, 8), y: this.top - 6, vx: rand(10, 40), vy: -rand(40, 70), life: 1.3, size: rand(9, 14), color: C.paperDk, drag: 0.4 });
  }
  draw() {}
}

// ───────────────────────────── STRIP 1 — PIER NINE
function stagePier() {
  const st = { id: 0, strip: 'STRIP No. 1', name: 'PIER NINE', tag: 'In which a quiet morning on the waterfront gets noisy.', width: 1720, minX: -40, maxX: 1770, theme: THEME.morning, start: { x: 420, y: 520 }, safe: [330, 700, 1100], cans: [[170, 1270]], exits: [300, 1320], olive: { x: 640, y: 520, home: [560, 760] }, music: 'sailor', things: [], skyline: mkSkyline(11, 1720) };
  World.waterY = 652;
  const wall = World.addShape({ kind: 'solid', mat: 'brick', pts: [[-200, -260], [96, -260], [96, 800], [-200, 800]], sub: 26, pin: (x, y) => (x < 90 || y > 536 || y < -200 ? 0 : 1), draw: paintBrick });
  wall.deco = () => { signBoard(8, 120, 78, 44, 'PIER', 17, C.cream); signBoard(8, 170, 78, 70, '9', 50, C.red, C.white); };
  mkPier(96, 1330, 560);
  const tug = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1412, 528], [1840, 528], [1840, 800], [1472, 800], [1438, 664]], sub: 22, pin: (x, y) => (x > 1800 || y > 724 ? 0 : 1), draw: paintHull });
  tug.color = C.red; tug.color2 = C.ink; tug.band = 54;
  tug.deco = () => { label('MABEL  T.', 1500, 566, 26, C.cream, FONT.sign); line([[1420, 516], [1560, 516]], 2.4); for (let x = 1424; x < 1560; x += 26) line([[x, 528], [x, 516]], 2); ink(circ(1640, 600, 13), C.navy, 3); ink(circ(1640, 600, 7), C.tealLt, 2); };
  const cab = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1572, 404], [1730, 404], [1730, 528], [1572, 528]], sub: 22, pin: (x, y) => (y > 520 ? 0 : 1), draw: paintPlain });
  cab.color = C.cream; cab.deco = () => { ink(rrect(1590, 428, 34, 40, 3), C.tealLt, 2.6); ink(rrect(1642, 428, 34, 40, 3), C.tealLt, 2.6); ink(rrect(1694, 440, 26, 84, 2), C.woodDk, 2.6); line([[1564, 404], [1738, 404]], 5); ink(circ(1608, 498, 13), C.red, 2.6); ink(circ(1608, 498, 6), C.cream, 2); };
  const fun = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1628, 300], [1676, 300], [1680, 404], [1624, 404]], sub: 20, pin: (x, y) => (y > 396 ? 0 : 1), draw: paintPlain });
  fun.color = C.red; fun.deco = (s) => { const a = s.pts[0], b = s.pts.find((p) => p.rx === 1676 && p.ry === 300); ink(poly([[a.x, a.y], [b.x, b.y], [b.x + 1, b.y + 26], [a.x - 1, a.y + 26]]), C.ink, 2.6); };
  const boom = World.addShape({ kind: 'beam', mat: 'steel', bend: 'hinge', r: 11, pts: [[640, 240], [1170, 206]], sub: 24, pin: (x) => (x > 792 && x < 852 ? 0 : 1), draw: paintTruss });
  boom.color = C.mustard; boom.deco = (s) => { const p = s.pts[0], q = s.pts[1]; X.save(); X.translate(p.x, p.y); X.rotate(Math.atan2(q.y - p.y, q.x - p.x)); ink(rrect(-16, -4, 54, 44, 3), C.steelDk, 3); label('2 TON', 11, 20, 13, C.cream, FONT.sign, 'center'); X.restore(); };
  const lamp = World.addShape({ kind: 'beam', mat: 'steel', bend: 'hinge', r: 5, pts: [[96, 318], [246, 318]], sub: 22, pin: (x) => (x < 100 ? 0 : 1), draw: (s) => {
    line(s.pts.map((p) => [p.x, p.y]), 9); line(s.pts.map((p) => [p.x, p.y]), 4, C.steelDk);
    const e = s.pts[s.pts.length - 1]; line([[e.x - 4, e.y], [e.x - 4, e.y + 14]], 2.4); ink(poly([[e.x - 20, e.y + 30], [e.x - 4, e.y + 12], [e.x + 12, e.y + 30]]), C.teal, 2.6); ink(circ(e.x - 4, e.y + 33, 6), C.cream, 2.2);
  } });
  st.border = mkBorder(-200, 1900);
  G.props.push(new Hook(boom, boom.nearestIndex(1126, 209), 178), new Barrel(600, 530), new Barrel(1040, 530));
  const bell = new Bell(tug, tug.nearestIndex(1478, 528), -62); st.things.push(bell);
  st.onPunch = (cx, cy, R) => bell.punched(cx, cy, R);
  st.spawns = { door: { x: 300, y: 500, vx: 150, vy: -400, fx: 'door' }, boat: { x: 1372, y: 640, vx: -250, vy: -900, ghost: true, fx: 'splash' }, tug: { x: 1540, y: 490, vx: -150, vy: -320, fx: 'puff' } };
  st.waves = [
    [[0, 'rat', 'door'], [0.8, 'rat', 'boat'], [2.4, 'rat', 'door']],
    [[0, 'rat', 'door'], [0.6, 'rat', 'boat'], [1.8, 'chucker', 'tug'], [3.2, 'rat', 'door', 'grab'], [4.6, 'rat', 'boat']],
    [[0, 'bruiser', 'door'], [1.2, 'plank', 'boat'], [2.6, 'rat', 'door'], [3.8, 'chucker', 'tug'], [5.2, 'rat', 'boat', 'grab']],
    [[0, 'rat', 'door'], [0.6, 'rat', 'boat'], [1.8, 'bruiser', 'boat'], [3.2, 'chucker', 'tug'], [4.4, 'plank', 'door'], [5.8, 'rat', 'boat', 'grab'], [7.4, 'rat', 'door'], [9, 'bruiser', 'door'], [10.4, 'plank', 'boat']],
  ];
  st.paintMid = (t) => {
    // the fish shed the toughs keep pouring out of
    ink(poly([[140, 560], [140, 372], [520, 372], [520, 560]]), C.cream, 3.2);
    X.save(); X.clip(poly([[140, 560], [140, 372], [520, 372], [520, 560]])); X.fillStyle = Pat.lines('rgba(29,26,22,.14)', 1.2, 10); X.fillRect(140, 372, 380, 190); X.restore();
    ink(poly([[126, 376], [150, 330], [214, 376], [238, 330], [302, 376], [326, 330], [390, 376], [414, 330], [478, 376], [502, 330], [534, 376]]), C.red, 3.2);
    ink(rrect(258, 452, 88, 108, 2), '#2a2622', 3); line([[250, 448], [354, 448]], 5);
    signBoard(170, 392, 320, 46, 'HADDOCK & SONS', 22); label('FISH  ·  ICE  ·  BAIT', 436, 532, 15, C.ink, FONT.cap, 'center', 1);
    ink(rrect(404, 462, 64, 46, 2), C.tealLt, 2.8); line([[436, 462], [436, 508]], 2); line([[404, 485], [468, 485]], 2);
    ink(circ(196, 494, 20), C.red, 2.8); ink(circ(196, 494, 10), C.cream, 2.2);
    // crane mast and cab
    lattice(822, 232, 560, 44, C.mustard); ink(rrect(790, 250, 66, 58, 3), C.mustard, 3); ink(rrect(800, 260, 30, 24, 2), C.tealLt, 2.4);
    ink(poly([[800, 232], [822, 196], [844, 232]]), C.mustard, 3);
    crateStack(900, 560, [2, 1]); bollard(1296, 560); bollard(150, 560);
    X.save(); X.globalAlpha = 0.5; X.translate(1190, 560); ink(ell(0, -8, 26, 9), C.cream, 2.6); ink(ell(0, -15, 22, 8), C.cream, 2.6); ink(ell(0, -22, 18, 7), C.cream, 2.6); X.restore();
  };
  return st;
}

// ───────────────────────────── STRIP 2 — THE S.S. BILGEWATER
function stageShip() {
  const st = { id: 1, strip: 'STRIP No. 2', name: 'THE S.S. BILGEWATER', tag: 'In which our sailor goes aboard without being invited.', width: 1900, minX: -40, maxX: 1960, theme: THEME.sunset, start: { x: 360, y: 520 }, safe: [330, 620, 1100, 1700], cans: [[150, 740], [970, 1290], [1670, 1780]], exits: [120, 1330], olive: { x: 1150, y: 440, home: [1060, 1290] }, music: 'fisher', things: [], skyline: mkSkyline(23, 1900) };
  World.waterY = 652;
  const stack = World.addShape({ kind: 'solid', mat: 'brick', pts: [[-200, -260], [84, -260], [84, 800], [-200, 800]], sub: 26, pin: (x, y) => (x < 80 || y > 536 || y < -200 ? 0 : 1), draw: paintBrick });
  stack.color = '#a9825a'; stack.deco = () => { signBoard(4, 150, 76, 40, 'BONDED', 11); signBoard(4, 196, 76, 40, 'STORES', 11); };
  mkPier(84, 800, 560);
  const plank = World.addShape({ kind: 'beam', mat: 'wood', bend: 'dent', r: 5, pts: [[750, 557], [940, 493]], sub: 20, max: 50, pin: (x, y, i, n) => (i === 0 || i === n - 1 ? 0 : 1), draw: paintPlank });
  const hull = World.addShape({ kind: 'solid', mat: 'hull', pts: [[905, 500], [2040, 500], [2040, 800], [990, 800], [942, 664]], sub: 22, pin: (x, y) => (x > 1990 || y > 730 ? 0 : 1), draw: paintHull });
  hull.color = C.red; hull.color2 = '#23262b'; hull.band = 84;
  hull.deco = () => {
    label('S. S.  BILGEWATER', 1010, 548, 30, C.cream, FONT.sign);
    for (let x = 1040; x < 1900; x += 120) { ink(circ(x, 610, 12), C.mustard, 3); ink(circ(x, 610, 6.5), C.cream, 2); }
    X.save(); X.translate(960, 590); X.lineWidth = 6; X.strokeStyle = C.ink; X.lineCap = 'round'; X.beginPath(); X.moveTo(0, -22); X.lineTo(0, 16); X.moveTo(-10, -12); X.lineTo(10, -12); X.moveTo(-14, 6); X.quadraticCurveTo(0, 26, 14, 6); X.stroke(); X.restore();
  };
  const cabin = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1330, 356], [1650, 356], [1650, 500], [1330, 500]], sub: 22, pin: (x, y) => (y > 492 ? 0 : 1), draw: paintPlain });
  cabin.color = C.cream; cabin.deco = (s) => {
    ink(rrect(1346, 402, 50, 98, 3), C.woodDk, 2.8); ink(circ(1371, 432, 9), C.tealLt, 2.2);
    for (let x = 1440; x < 1640; x += 62) { ink(circ(x, 432, 15), C.mustard, 2.8); ink(circ(x, 432, 9), C.tealLt, 2); }
    const a = s.pts[0], b = s.pts.find((p) => p.rx === 1650 && p.ry === 356); line([[a.x - 8, a.y], [b.x + 8, b.y]], 6);
    ink(circ(1608, 476, 14), C.red, 2.6); ink(circ(1608, 476, 6.5), C.cream, 2);
  };
  const fun = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1452, 176], [1522, 176], [1530, 356], [1444, 356]], sub: 22, pin: (x, y) => (y > 348 ? 0 : 1), draw: paintPlain });
  fun.color = C.red; fun.deco = (s) => { const a = s.pts[0], b = s.pts.find((p) => p.rx === 1522 && p.ry === 176); ink(poly([[a.x - 3, a.y - 3], [b.x + 3, b.y - 3], [b.x + 4, b.y + 36], [a.x - 4, a.y + 36]]), C.ink, 2.6); line([[a.x - 4, a.y + 62], [b.x + 5, b.y + 62]], 5, C.cream); };
  const aft = World.addShape({ kind: 'solid', mat: 'hull', pts: [[1810, -260], [2040, -260], [2040, 500], [1810, 500]], sub: 24, pin: (x, y) => (x > 1820 || y > 490 || y < -200 ? 0 : 1), draw: paintPlain });
  aft.color = C.navy; aft.deco = () => { for (let y = 110; y < 460; y += 110) { ink(circ(1856, y, 15), C.mustard, 2.8); ink(circ(1856, y, 9), C.cream, 2); } };
  const boom = World.addShape({ kind: 'beam', mat: 'steel', bend: 'hinge', r: 9, pts: [[1186, 186], [900, 270]], sub: 24, pin: (x, y, i) => (i < 2 ? 0 : 1), draw: paintTruss });
  boom.color = C.mustard;
  st.border = mkBorder(-200, 2040);
  G.props.push(new Hook(boom, boom.pts.length - 2, 132, { kind: 'crate', r: 24, m: 5 }), new Barrel(520, 530), new Barrel(1090, 470), new Barrel(1250, 470));
  const bell = new Bell(hull, hull.nearestIndex(990, 500), -64); st.things.push(bell, new Funnel(fun, 1452, 1522, 176, -1050, -620));
  st.onPunch = (cx, cy, R) => bell.punched(cx, cy, R);
  st.spawns = {
    cabin: { x: 1316, y: 468, vx: -220, vy: -380, fx: 'door' }, pier: { x: 130, y: 505, vx: 170, vy: -380, fx: 'puff' },
    boat: { x: 850, y: 640, vx: -240, vy: -930, ghost: true, fx: 'splash' }, roofL: { x: 1392, y: 322, perch: true, fx: 'puff' }, roofR: { x: 1600, y: 322, perch: true, fx: 'puff' },
  };
  st.waves = [
    [[0, 'rat', 'cabin'], [0.8, 'rat', 'pier'], [2, 'chucker', 'roofL'], [3.2, 'rat', 'boat', 'grab'], [4.4, 'plank', 'pier']],
    [[0, 'bruiser', 'cabin'], [1.2, 'rat', 'pier'], [2.4, 'plank', 'boat'], [3.6, 'rat', 'cabin', 'grab'], [5, 'bruiser', 'pier']],
    [[0, 'chucker', 'roofL'], [0.5, 'chucker', 'roofR'], [1.4, 'rat', 'cabin'], [2.4, 'rat', 'boat', 'grab'], [3.6, 'plank', 'pier'], [4.8, 'rat', 'cabin'], [6, 'rat', 'boat']],
    [[0, 'bruiser', 'cabin'], [0.9, 'rat', 'pier'], [2, 'chucker', 'roofR'], [3.1, 'plank', 'boat'], [4.2, 'rat', 'cabin', 'grab'], [5.4, 'bruiser', 'pier'], [6.6, 'rat', 'boat'], [7.8, 'chucker', 'roofL'], [9, 'plank', 'cabin']],
  ];
  st.paintMid = (t) => {
    crateStack(150, 560, [3, 2, 1]); bollard(770, 560); bollard(110, 560);
    line([[430, 560], [430, 372]], 9); line([[430, 560], [430, 372]], 4, C.steelDk); ink(poly([[412, 372], [448, 372], [440, 344], [420, 344]]), C.cream, 2.8); ink(poly([[408, 344], [452, 344], [430, 326]]), C.teal, 2.8);
    // masts and rigging
    line([[1186, 500], [1186, 92]], 13); line([[1186, 500], [1186, 92]], 7, C.woodDk); ink(rrect(1166, 150, 40, 22, 3), C.woodDk, 2.8);
    line([[1186, 100], [960, 500]], 2); line([[1186, 100], [1330, 356]], 2); line([[1186, 100], [1486, 176]], 1.6);
    ink(poly([[1186, 96], [1250, 106], [1186, 118]]), C.red, 2.6);
    line([[1740, 500], [1740, 60]], 11); line([[1740, 500], [1740, 60]], 6, C.woodDk); line([[1740, 70], [1522, 176]], 1.6);
    // ventilator cowls + lifeboat on davits
    for (const x of [1010, 1270]) { line([[x, 500], [x, 456]], 12); line([[x, 500], [x, 456]], 6, C.cream); ink(ell(x - 8, 450, 14, 11, -0.4), C.cream, 2.8); ink(ell(x - 12, 449, 7, 6, -0.4), C.red, 2); }
    line([[1556, 356], [1556, 316], [1574, 306]], 3); line([[1640, 356], [1640, 316], [1622, 306]], 3); ink(poly([[1560, 318], [1636, 318], [1626, 340], [1570, 340]]), C.white, 2.8); line([[1560, 324], [1636, 324]], 1.8);
  };
  return st;
}

// ───────────────────────────── STRIP 3 — THE GANTRY (boss)
class Boss {
  constructor(girder) {
    this.g = girder; this.x = 800; this.hp = 140; this.max = 140; this.state = 'intro'; this.t = 0; this.cycles = 0; this.flash = 0; this.cd = 0; this.gone = false; this.cabY = 212; this.dead = false; this.name = 'BIG BARNACLE BRAGG';
    this.ball = World.addBody({ x: 800, y: 330, r: 34, m: 12, rest: 0.25, fric: 0.5, cat: CAT.PROP, mask: CAT.ENEMY }); this.ball.owner = this; this.ball.tether = { ax: 800, ay: 240, len: 84 };
    this.ball.onBump = (o, sp, cx, cy) => hotBump(this, o, sp, cx, cy);
    this.ball.onHit = (h) => { if (h.speed > 280) { Sfx.metal(1, true); G.shake(clamp(h.speed / 80, 3, 14)); World.kick(h.x, h.y, -h.nx, -h.ny, 200, h.speed * 0.6); FX.dust(h.x, h.y, 1, 4); FX.dust(h.x, h.y, -1, 4); if (this.state === 'drop') this.impact(h); } };
    this.b = this.ball; this.hot = 0; this.say = 0;
  }
  girderY(x) { const P = this.g.pts; for (let i = 0; i < P.length - 1; i++) if (x >= P[i].x && x <= P[i + 1].x) return lerp(P[i].y, P[i + 1].y, (x - P[i].x) / (P[i + 1].x - P[i].x || 1)); return P[0].y; }
  impact(h) {
    if (this.dead) return;
    this.state = 'hold'; this.t = 0; const P = G.player;
    FX.ring(this.ball.x, h.y, 20, 190, 0.3, C.ink, 7); FX.stamp('KA-THOOM!', this.ball.x, h.y - 90, 58, C.red, { burst: C.cream }); Sfx.punch(2.4);
    if (P.b.grounded && abs(P.b.x - this.ball.x) < 130) P.hurt(2, sign(P.b.x - this.ball.x || 1), 560);
    G.shock(this.ball.x, h.y, 150, -500, 0, 0, false, 3);
  }
  damage(d, x, y, word) {
    if (this.dead || this.cd > 0) return; this.cd = 0.25; this.hp -= d; this.flash = 0.25;
    FX.stamp(word || pick(WORDS.steel), x, y - 30, 40 + d, C.red, { burst: C.cream }); FX.sparks(x, y, 0, 1, 10); FX.stars(x, y, 6, 380);
    Sfx.metal(1); Sfx.punch(1.5); G.shake(8 + d * 0.4); G.hitstop(0.07); G.add(d * 30 * G.mult, 'trick'); G.chainUp(x, y);
    if (Math.random() < 0.5) FX.say(this, pick(['HEY! THAT’S RENTED!', 'WHY, YOU LITTLE—', 'MY CRANE!', 'STOP THAT!']), 1.2);
    if (this.hp <= 0) { this.dead = true; this.state = 'dying'; this.t = 0; G.slow(0.3, 1.4); Sfx.stop(); FX.say(this, 'ABANDON CRANE!', 2); }
  }
  punch(lx, ly, power, pl) {
    const b = this.ball; Sfx.metal(1, true);
    if (pl.super) { b.vx = (this.x - b.x) * 2.2; b.vy = -1300; this.returned = 1.2; FX.stamp('RIGHT BACK AT YA!', b.x, b.y - 70, 40, C.green); }
    else { b.vx += lx * 300 * Math.min(power, 2.5); b.vy += ly * 300 * Math.min(power, 2.5) - 80; }
  }
  update(dt) {
    const P = G.player, gy = this.girderY(this.x), ball = this.ball, ph2 = this.hp < 60; this.t += dt; this.flash -= dt; this.cd -= dt; this.say -= dt; this.returned -= dt;
    if (this.dead && this.state !== 'dying') { this.state = 'dying'; this.t = 0; }
    this.cabY = gy + 64; if (ball.tether) { ball.tether.ax = this.x; ball.tether.ay = this.cabY + 34; }
    const speed = ph2 ? 340 : 240, minLen = 84, floor = (World.groundBelow(this.x, this.cabY + 60, 600) || 560);
    if (this.state === 'intro') { if (this.t > 1.6) { this.state = 'patrol'; this.t = 0; FX.say(this, 'I OWN THIS HARBOR, RUNT!', 2); } }
    else if (this.state === 'patrol') {
      this.x = approach(this.x, clamp(P.b.x, 190, 1410), speed * dt);
      if (this.t > (ph2 ? 1.2 : 1.9) * D().cd && abs(this.x - P.b.x) < 70) {
        if (Math.random() < (ph2 ? 0.45 : 0.3)) { this.state = 'sweep'; this.t = 0; this.sweepDir = Math.random() < 0.5 ? 1 : -1; FX.say(this, pick(['DUCK, SWABBIE!', 'BATTER UP!', 'HAW HAW!']), 1.1); Sfx.creak(); }
        else { this.state = 'aim'; this.t = 0; Sfx.whistle(); }
      }
    } else if (this.state === 'aim') { if (this.t > (ph2 ? 0.55 : 0.8)) { this.state = 'drop'; this.t = 0; ball.vy = 900; } }
    else if (this.state === 'drop') { ball.tether.len = Math.min(ball.tether.len + 2000 * dt, floor - ball.tether.ay - ball.r + 14); if (this.t > 1.2) { this.state = 'hold'; this.t = 0; } }
    else if (this.state === 'sweep') {
      // drop the ball to chest height and swing it the length of the pier: jump it
      const target = floor - ball.tether.ay - ball.r - 34;
      ball.tether.len = approach(ball.tether.len, target, 900 * dt);
      if (this.t > 0.6 && this.t < 0.75) ball.vx = this.sweepDir * 1300;
      this.x = approach(this.x, this.x + this.sweepDir * 100, (ph2 ? 260 : 180) * dt);
      if (this.t > 2.6) { this.state = 'reel'; this.t = 0; }
    }
    else if (this.state === 'hold') { if (this.t > (ph2 ? 1.3 : 1.9)) { this.state = 'reel'; this.t = 0; Sfx.creak(); } }
    else if (this.state === 'reel') {
      ball.tether.len = Math.max(minLen, ball.tether.len - 430 * dt);
      if (ball.tether.len <= minLen) {
        this.state = 'patrol'; this.t = 0; this.cycles++;
        if (this.cycles % 2 === 1 || ph2) {
          if (G.enemies.filter((e) => !e.gone && e.state !== 'ko').length < (ph2 ? 4 : 3)) { G.spawn(pick(['rat', 'plank', 'chucker', ph2 ? 'bruiser' : 'rat']), pick(['dropL', 'dropR', 'boatL', 'boatR'])); G.spawn('rat', pick(['boatL', 'boatR'])); if (ph2 && D().tokens > 1) G.spawn(pick(['rat', 'plank']), pick(['dropL', 'dropR'])); }
          if (G.props.filter((p) => p instanceof Barrel && !p.gone).length < 2) { const br = new Barrel(this.x + rand(-30, 30), this.cabY + 70); G.props.push(br); FX.say(this, pick(['SPECIAL DELIVERY!', 'CATCH, SWABBIE!']), 1.2); }
        }
      }
    } else if (this.state === 'dying') {
      if (this.t % 0.16 < dt) { const x = this.x + rand(-60, 60), y = this.cabY + rand(-40, 40); FX.burst(x, y, rand(30, 60), pick([C.mustard, C.red, C.white])); FX.stars(x, y, 4, 400); Sfx.punch(1.5); G.shake(8); World.dent(this.x, gy, 0, 1, 280, 16, 300); Sfx.crumple(0.8); }
      if (this.t > 1.7 && !this.fall) {
        this.fall = World.addBody({ x: this.x, y: this.cabY, r: 44, m: 8, rest: 0.45, fric: 0.4, cat: CAT.PROP, mask: 0 }); this.fall.vx = this.x < 800 ? -260 : 260; this.fall.w = this.fall.vx / 60;
        this.fall.onHit = (h) => { if (h.speed > 200) { Sfx.metal(1, true); G.shake(12); FX.stars(h.x, h.y, 8, 400); World.kick(h.x, h.y, 0, 1, 200, 700); this.fall.vx = sign(this.fall.vx) * Math.max(abs(this.fall.vx), 420); } };
        ball.tether = null; ball.mask = 0; FX.stamp('TIMBER!', this.x, this.cabY - 80, 70, C.red, { burst: C.cream, life: 1.2 });
      }
      if (this.fall && (this.fall.y > World.waterY + 20 || this.t > 7)) { G.splash(this.fall.x, 2); G.splash(this.fall.x + 30, 2); this.fall.dead = true; ball.dead = true; this.gone = true; G.bossDown(); }
      return;
    }
    // things that can hurt the crane: flying toughs, barrels, returned bottles, and its own ball
    const cx = this.x, cy = this.cabY;
    for (const e of G.enemies) if (e.live && !e.hidden && hypot(e.b.x - cx, e.b.y - cy) < 48 + e.b.r && hypot(e.b.vx, e.b.vy) > 320) { this.damage((7 + hypot(e.b.vx, e.b.vy) / 110) * (e.super ? 1.6 : 1), e.b.x, e.b.y); e.b.vy = abs(e.b.vy) * 0.6 + 200; e.b.vx *= -0.5; e.hp -= 12; if (e.hp <= 0) e.ko(); }
    for (const p of G.props) {
      if (p instanceof Barrel && p.hot > 0 && hypot(p.b.x - cx, p.b.y - cy) < 48 + p.b.r && hypot(p.b.vx, p.b.vy) > 320) { this.damage(9 + hypot(p.b.vx, p.b.vy) / 100, p.b.x, p.b.y); p.b.vy = abs(p.b.vy) * 0.5 + 200; p.b.vx *= -0.5; }
      if (p instanceof Bottle && p.back && hypot(p.b.x - cx, p.b.y - cy) < 52) { this.damage(8, p.b.x, p.b.y, 'KRASH!'); p.smash(); }
    }
    if (this.returned > 0 && ball.vy < 0 && hypot(ball.x - cx, ball.y - cy) < 50 + ball.r) { this.damage(30, ball.x, ball.y - 30, 'KLONGGG!'); ball.vy = 300; ball.vx *= 0.3; this.returned = 0; if (!this.dead) { this.state = 'reel'; this.t = 0; } }
    if (hypot(ball.vx, ball.vy) > 380 && hypot(ball.x - P.b.x, ball.y - P.b.y) < ball.r + 18 && this.returned <= 0) P.hurt(this.state === 'drop' ? 2 + D().heavy : 1 + D().heavy, sign(P.b.x - ball.x || 1), 500);
  }
  bent(amt, x) { if (abs(x - this.x) < 190 && amt > 4) this.damage(clamp(amt * 0.18, 4, 16), this.x, this.cabY - 60, 'SKREEK!'); }
  draw() {
    const x = this.x, gy = this.girderY(x), cy = this.cabY, ball = this.ball, sh = this.flash > 0 ? rand(-4, 4) : 0;
    if (this.fall) { X.save(); X.translate(this.fall.x, this.fall.y); X.rotate(this.fall.ang); this.drawCab(0, 0, true); X.restore(); }
    else {
      if (ball.tether) { line([[x, cy + 34], [ball.x, ball.y - ball.r + 4]], 5); line([[x, cy + 34], [ball.x, ball.y - ball.r + 4]], 1.6, C.steel); }
      ink(rrect(x - 40, gy - 22, 80, 16, 4), C.steelDk, 3); ink(circ(x - 26, gy - 16, 7), C.steel, 2.4); ink(circ(x + 26, gy - 16, 7), C.steel, 2.4);
      line([[x - 22, gy + 12], [x - 22, cy - 34]], 6); line([[x + 22, gy + 12], [x + 22, cy - 34]], 6);
      X.save(); X.translate(x + sh, cy + sh); this.drawCab(0, 0, false); X.restore();
      if (this.state === 'aim') { const gyy = World.groundBelow(x, cy + 60, 600) || 560, k = this.t / 0.8; X.save(); X.globalAlpha = 0.5 + 0.4 * sin(G.time * 40); ink(ell(x, gyy + 2, 30 + k * 40, 8 + k * 6), C.red, 2.6, false); X.restore(); sock('!', x, gyy - 120, 50, C.red, 0); }
    }
    if (!ball.dead) { X.save(); X.translate(ball.x, ball.y); ink(circ(0, 0, ball.r), '#3d4648', 3.6); X.save(); X.clip(circ(0, 0, ball.r)); X.fillStyle = Pat.dots('rgba(251,246,228,.3)', 2, 8); X.fillRect(-ball.r, -ball.r, ball.r * 1.2, ball.r * 1.2); X.restore(); ink(rrect(-9, -ball.r - 8, 18, 12, 3), C.steelDk, 2.6); X.restore(); }
  }
  drawCab(x, y, wrecked) {
    const hurt = this.hp < 60;
    ink(rrect(x - 46, y - 36, 92, 72, 6), this.flash > 0 ? C.white : C.red, 3.6);
    ink(rrect(x - 46, y + 20, 92, 16, 3), C.ink, 0); label('BRAGG HAULAGE', x, y + 29, 10, C.cream, FONT.sign, 'center');
    ink(rrect(x - 34, y - 26, 68, 40, 4), C.tealLt, 3);
    X.save(); X.clip(rrect(x - 34, y - 26, 68, 40, 4));
    // the man himself: top hat, walrus moustache, cigar
    ink(ell(x, y, 15, 15), '#eab08a', 2.6); ink(ell(x + 1, y + 1, 4.6, 4), C.red, 2);
    const mo = new Path2D(); mo.moveTo(x - 13, y + 6); mo.quadraticCurveTo(x, y + 1, x + 13, y + 6); mo.quadraticCurveTo(x + 10, y + 15, x, y + 10); mo.quadraticCurveTo(x - 10, y + 15, x - 13, y + 6); mo.closePath(); ink(mo, '#d6d2c4', 2);
    ink(rrect(x - 11, y - 32, 22, 20, 1.5), C.ink, 2); X.fillStyle = C.red; X.fillRect(x - 10, y - 16, 20, 3); line([[x - 18, y - 12], [x + 18, y - 12]], 3.6);
    X.fillStyle = C.ink; if (wrecked || this.flash > 0) { eyeX(x - 6, y - 6, 2.6); eyeX(x + 6, y - 6, 2.6); } else { X.beginPath(); X.arc(x - 6, y - 6, 2, 0, TAU); X.arc(x + 6, y - 6, 2, 0, TAU); X.fill(); line([[x - 11, y - 11], [x - 2, y - 8]], 2.6); line([[x + 11, y - 11], [x + 2, y - 8]], 2.6); }
    line([[x + 4, y + 4], [x + 20, y + 1]], 4.6); line([[x + 4, y + 4], [x + 20, y + 1]], 2, C.woodDk);
    X.restore();
    if (hurt) { line([[x - 30, y - 22], [x - 16, y - 6], [x - 22, y + 4]], 1.8); line([[x + 28, y + 8], [x + 14, y - 2]], 1.8); }
    if (hurt && !wrecked && G.time % 0.3 < 0.02) FX.add({ type: 'puff', x: this.x + rand(-30, 30), y: this.cabY - 40, vy: -70, vx: rand(-20, 20), life: 0.9, size: 10, color: C.steelDk, drag: 0.5 });
  }
}
function stageGantry() {
  const st = { id: 2, strip: 'STRIP No. 3', name: 'THE GANTRY', tag: 'In which the landlord of the harbor comes down to collect.', width: 1600, minX: -30, maxX: 1630, theme: THEME.storm, start: { x: 800, y: 520 }, safe: [420, 800, 1180], cans: [[230, 1370]], exits: [200, 1400], music: 'drunken', things: [], skyline: mkSkyline(37, 1600) };
  World.waterY = 652;
  mkPier(150, 1450, 560);
  const girder = World.addShape({ kind: 'beam', mat: 'steel', bend: 'dent', r: 13, pts: [[30, 150], [1570, 150]], sub: 24, max: 120, pin: (x) => clamp((Math.min(abs(x - 320), abs(x - 1280)) - 16) / 110, 0, 1), draw: paintTruss });
  girder.color = C.red;
  st.border = mkBorder(-200, 1800);
  const boss = new Boss(girder); st.boss = boss;
  st.olive = { x: 1180, y: 300, cage: { shape: girder, i: girder.nearestIndex(1180, 150), len: 190 } }; G.props.push(boss, new Barrel(520, 530), new Barrel(1080, 530));
  st.onBend = (amt, x, y, mat) => { if (mat === 'steel') boss.bent(amt, x); };
  st.spawns = { dropL: { x: 440, y: 190, vx: 0, vy: 100, fx: 'puff' }, dropR: { x: 1160, y: 190, vx: 0, vy: 100, fx: 'puff' }, boatL: { x: 108, y: 640, vx: 250, vy: -930, ghost: true, fx: 'splash' }, boatR: { x: 1492, y: 640, vx: -250, vy: -930, ghost: true, fx: 'splash' } };
  st.waves = [[[1.5, 'rat', 'boatL'], [2.5, 'rat', 'boatR']]];
  st.flashT = 3; st.flash = 0;
  st.update = (dt) => { st.flashT -= dt; st.flash = Math.max(0, st.flash - dt * 4); if (st.flashT <= 0) { st.flashT = rand(4, 9); st.flash = 1; Sfx.thunder(); } };
  st.paintMid = (t) => {
    crateStack(560, 560, [4, 3, 1]); crateStack(900, 560, [2, 2]); bollard(190, 560); bollard(1410, 560);
    for (const x of [320, 1280]) { lattice(x, 160, 560, 58, C.red); ink(rrect(x - 44, 536, 88, 24, 3), C.steelDk, 3); }
  };
  return st;
}
const STAGES = [stagePier, stageShip, stageGantry];
