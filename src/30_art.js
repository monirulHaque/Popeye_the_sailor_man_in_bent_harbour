// ───────────────────────────── art: ink + spot-colour rendering, lettering, particles
// Look: a 1929 Sunday strip. Flat spot colours printed slightly off-register
// under heavy ink, halftone screens for shade, paper grain over everything.
let X = null;                       // the 2D context everything draws to
const REG = { x: 2.4, y: 1.7 };     // colour-plate misregistration

const Pat = (() => {
  const cache = {};
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
  return {
    dots(color, r, s) {
      const key = 'd' + color + r + s;
      if (!cache[key]) {
        const c = mk(s, s, (g) => { g.fillStyle = color; [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); });
        cache[key] = X.createPattern(c, 'repeat');
      }
      return cache[key];
    },
    lines(color, w, s) {
      const key = 'l' + color + w + s;
      if (!cache[key]) {
        const c = mk(s, s, (g) => { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.moveTo(-1, s + 1); g.lineTo(s + 1, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(s - 1, s + 1); g.lineTo(s + 1, s - 1); g.stroke(); });
        cache[key] = X.createPattern(c, 'repeat');
      }
      return cache[key];
    },
    bricks() {
      if (!cache.bricks) {
        const c = mk(44, 28, (g) => { g.strokeStyle = 'rgba(29,26,22,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0.8); g.lineTo(44, 0.8); g.moveTo(0, 14.8); g.lineTo(44, 14.8); g.moveTo(10, 0); g.lineTo(10, 14); g.moveTo(32, 14); g.lineTo(32, 28); g.stroke(); });
        cache.bricks = X.createPattern(c, 'repeat');
      }
      return cache.bricks;
    },
    grain: null,
    makeGrain() {
      this.grain = mk(512, 512, (g) => {
        const im = g.createImageData(512, 512), d = im.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random(); d[i] = d[i + 1] = d[i + 2] = v < 0.5 ? 60 : 255; d[i + 3] = v < 0.5 ? (0.5 - v) * 34 : (v - 0.5) * 22; }
        g.putImageData(im, 0, 0);
        g.strokeStyle = 'rgba(90,70,40,.10)'; g.lineWidth = 1;
        for (let i = 0; i < 70; i++) { const x = rand(512), y = rand(512), a = rand(TAU), l = rand(6, 22); g.beginPath(); g.moveTo(x, y); g.lineTo(x + cos(a) * l, y + sin(a) * l); g.stroke(); }
      });
    },
  };
})();

// path helpers
const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
const ell = (x, y, rx, ry, rot) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot || 0, 0, TAU); return p; };
const poly = (pts, open) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); if (!open) p.closePath(); return p; };
const rrect = (x, y, w, h, r) => { const p = new Path2D(); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p; };
// fill (knocked out of the background, colour slightly off-register) then ink
function ink(path, fill, lw, knock) {
  if (fill) {
    if (knock !== false) { X.fillStyle = C.paper; X.fill(path); }
    X.save(); X.translate(REG.x, REG.y); X.fillStyle = fill; X.fill(path); X.restore();
  }
  if (lw !== 0) { X.lineWidth = lw || 2.8; X.strokeStyle = C.ink; X.lineJoin = 'round'; X.lineCap = 'round'; X.stroke(path); }
}
function line(pts, lw, color) { X.lineWidth = lw || 2.5; X.strokeStyle = color || C.ink; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(poly(pts, true)); }
function hose(x0, y0, x1, y1, bend, w, color) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = hypot(dx, dy) || 1;
  const p = new Path2D(); p.moveTo(x0, y0); p.quadraticCurveTo(mx - (dy / l) * bend, my + (dx / l) * bend, x1, y1);
  X.lineCap = 'round'; X.strokeStyle = C.ink; X.lineWidth = w + 4.6; X.stroke(p);
  X.strokeStyle = color; X.lineWidth = w; X.stroke(p);
}
function starPath(x, y, r, n, inner, rot) {
  const p = new Path2D();
  for (let i = 0; i < n * 2; i++) { const a = (rot || 0) + (i * Math.PI) / n, rr = i % 2 ? r * inner : r; i ? p.lineTo(x + cos(a) * rr, y + sin(a) * rr) : p.moveTo(x + cos(a) * rr, y + sin(a) * rr); }
  p.closePath(); return p;
}
// comic lettering: fat ink outline, off-register colour
function sock(text, x, y, size, fill, rot, font, align) {
  X.save(); X.translate(x, y); if (rot) X.rotate(rot);
  X.font = `${size}px ${font || FONT.sfx}`; X.textAlign = align || 'center'; X.textBaseline = 'middle'; X.lineJoin = 'round';
  X.strokeStyle = C.ink; X.lineWidth = Math.max(4, size * 0.24); X.strokeText(text, 0, 0);
  X.fillStyle = C.white; X.fillText(text, 0, 0);
  X.fillStyle = fill || C.red; X.fillText(text, REG.x * 0.8, REG.y * 0.8);
  X.lineWidth = Math.max(1, size * 0.03); X.strokeText(text, 0, 0);
  X.restore();
}
function label(text, x, y, size, color, font, align, spacing) {
  X.font = `${size}px ${font || FONT.cap}`; X.textAlign = align || 'left'; X.textBaseline = 'middle'; X.fillStyle = color || C.ink;
  if (spacing && 'letterSpacing' in X) X.letterSpacing = spacing + 'px';
  X.fillText(text, x, y);
  if (spacing && 'letterSpacing' in X) X.letterSpacing = '0px';
}
function textW(text, size, font) { X.font = `${size}px ${font || FONT.cap}`; return X.measureText(text).width; }
// narration box, as in the top-left corner of a strip panel
function caption(x, y, text, size, fill, align) {
  size = size || 24; const w = textW(text, size) + 26, h = size + 14;
  const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ink(rrect(bx, y, w, h, 3), fill || C.cream, 2.6);
  label(text, bx + 13, y + h / 2 + 1, size, C.ink);
  return w;
}
function balloon(x, y, text, t) {
  const size = 21, w = textW(text, size) + 30, h = 38, s = outBack(t * 6);
  X.save(); X.translate(x, y); X.scale(s, s);
  const p = new Path2D();
  p.ellipse(0, -h / 2 - 16, w / 2, h / 2, 0, 0, TAU);
  const tail = poly([[-10, -22], [0, 0], [8, -24]]);
  ink(tail, C.white, 2.6); ink(p, C.white, 2.6);
  X.fillStyle = C.white; X.fill(poly([[-9, -24], [0, -3], [7, -25]]));
  label(text, 0, -h / 2 - 15, size, C.ink, FONT.cap, 'center');
  X.restore();
}

// ───────────────────────────── particles and stamps
const FX = {
  parts: [], stamps: [], balloons: [], trails: [],
  reset() { this.parts = []; this.stamps = []; this.balloons = []; this.trails = []; },
  add(o) { if (this.parts.length < 420) this.parts.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 0.5, t: 0, size: 6, rot: rand(TAU), vr: 0, color: C.paper, drag: 0 }, o)); },
  puff(x, y, n, sp, size, color) { for (let i = 0; i < (n || 5); i++) { const a = rand(TAU), v = rand(0.3, 1) * (sp || 120); this.add({ type: 'puff', x, y, vx: cos(a) * v, vy: sin(a) * v - 30, life: rand(0.3, 0.6), size: rand(0.6, 1.2) * (size || 9), color: color || C.white, drag: 3 }); } },
  dust(x, y, dir, n) { for (let i = 0; i < (n || 3); i++) this.add({ type: 'puff', x: x + rand(-6, 6), y: y - rand(4), vx: -dir * rand(40, 120), vy: -rand(20, 70), life: rand(0.25, 0.45), size: rand(4, 8), color: C.paperDk, drag: 3 }); },
  stars(x, y, n, sp, color) { for (let i = 0; i < (n || 5); i++) { const a = rand(TAU), v = rand(0.5, 1) * (sp || 300); this.add({ type: 'star', x, y, vx: cos(a) * v, vy: sin(a) * v - 80, g: 600, life: rand(0.4, 0.8), size: rand(6, 12), vr: rand(-10, 10), color: color || C.mustard, drag: 1.5 }); } },
  chips(x, y, nx, ny, n, color, sp) { for (let i = 0; i < (n || 6); i++) { const a = Math.atan2(ny, nx) + rand(-1.1, 1.1), v = rand(0.4, 1) * (sp || 380); this.add({ type: 'chip', x, y, vx: cos(a) * v, vy: sin(a) * v, g: 1300, life: rand(0.5, 0.9), size: rand(5, 11), vr: rand(-18, 18), color: color || C.wood }); } },
  sparks(x, y, nx, ny, n) { for (let i = 0; i < (n || 6); i++) { const a = Math.atan2(ny, nx) + rand(-1.2, 1.2), v = rand(0.5, 1) * 520; this.add({ type: 'spark', x, y, vx: cos(a) * v, vy: sin(a) * v, g: 900, life: rand(0.15, 0.35), size: rand(8, 16), color: C.mustard }); } },
  drops(x, y, n, sp) { for (let i = 0; i < (n || 12); i++) { const a = -Math.PI / 2 + rand(-0.8, 0.8), v = rand(0.4, 1) * (sp || 620); this.add({ type: 'drop', x: x + rand(-14, 14), y, vx: cos(a) * v, vy: sin(a) * v, g: 1700, life: rand(0.5, 0.9), size: rand(3, 7), color: C.tealLt }); } },
  leaves(x, y, n) { for (let i = 0; i < (n || 10); i++) { const a = rand(TAU), v = rand(120, 420); this.add({ type: 'leaf', x, y, vx: cos(a) * v, vy: sin(a) * v - 160, g: 500, life: rand(0.6, 1.1), size: rand(6, 11), vr: rand(-8, 8), color: pick([C.green, C.greenLt]), drag: 2 }); } },
  ring(x, y, r0, r1, life, color, lw) { this.add({ type: 'ring', x, y, size: r0, r1, life: life || 0.3, color: color || C.ink, lw: lw || 4 }); },
  burst(x, y, size, color) { this.add({ type: 'burst', x, y, size, life: 0.11, color: color || C.white, rot: rand(TAU) }); },
  glass(x, y) { for (let i = 0; i < 8; i++) { const a = rand(TAU), v = rand(120, 380); this.add({ type: 'chip', x, y, vx: cos(a) * v, vy: sin(a) * v - 120, g: 1300, life: rand(0.35, 0.6), size: rand(3, 7), vr: rand(-20, 20), color: C.tealLt }); } },
  stamp(text, x, y, size, color, o) { this.stamps.push(Object.assign({ text, x, y, size: size || 44, color: color || C.red, t: 0, life: 0.75, rot: rand(-0.22, 0.22), vy: -34 }, o || {})); if (this.stamps.length > 14) this.stamps.shift(); },
  say(who, text, life) { this.balloons = this.balloons.filter((b) => b.who !== who); this.balloons.push({ who, text, t: 0, life: life || 1.5 }); },
  trail(x, y, r, color) { this.trails.push({ x, y, r, t: 0, color }); if (this.trails.length > 90) this.trails.shift(); },
  update(dt) {
    for (const p of this.parts) { p.t += dt; p.vy += p.g * dt; if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; } p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const s of this.stamps) { s.t += dt; s.y += s.vy * dt; }
    this.stamps = this.stamps.filter((s) => s.t < s.life);
    for (const b of this.balloons) b.t += dt;
    this.balloons = this.balloons.filter((b) => b.t < b.life && !b.who.gone);
    for (const t of this.trails) t.t += dt;
    this.trails = this.trails.filter((t) => t.t < 0.22);
  },
  drawTrails() {
    for (const t of this.trails) { const k = 1 - t.t / 0.22; X.fillStyle = t.color; X.globalAlpha = 0.5 * k; X.beginPath(); X.arc(t.x, t.y, t.r * (0.5 + 0.5 * k), 0, TAU); X.fill(); }
    X.globalAlpha = 1;
  },
  draw() {
    for (const p of this.parts) {
      const k = p.t / p.life;
      if (p.type === 'puff') ink(circ(p.x, p.y, p.size * (0.6 + k * 0.9) * (1 - k * k)), p.color, 2.2);
      else if (p.type === 'star') ink(starPath(p.x, p.y, p.size * (1 - k * 0.6), 4, 0.42, p.rot), p.color, 2);
      else if (p.type === 'chip') { X.save(); X.translate(p.x, p.y); X.rotate(p.rot); ink(poly([[-p.size, -2], [p.size * 0.8, -3], [p.size, 2.5], [-p.size * 0.7, 3]]), p.color, 1.8, false); X.restore(); }
      else if (p.type === 'spark') { const l = p.size * (1 - k) / (hypot(p.vx, p.vy) || 1); line([[p.x, p.y], [p.x - p.vx * l, p.y - p.vy * l]], 3.2, C.ink); line([[p.x, p.y], [p.x - p.vx * l * 0.8, p.y - p.vy * l * 0.8]], 1.6, p.color); }
      else if (p.type === 'drop') ink(circ(p.x, p.y, p.size * (1 - k * 0.5)), p.color, 1.8, false);
      else if (p.type === 'leaf') { X.save(); X.translate(p.x, p.y); X.rotate(p.rot); ink(ell(0, 0, p.size, p.size * 0.5), p.color, 1.8, false); line([[-p.size, 0], [p.size, 0]], 1.2); X.restore(); }
      else if (p.type === 'ring') { X.lineWidth = p.lw * (1 - k); X.strokeStyle = p.color; X.beginPath(); X.arc(p.x, p.y, lerp(p.size, p.r1, outCubic(k)), 0, TAU); X.stroke(); }
      else if (p.type === 'burst') ink(starPath(p.x, p.y, p.size * (0.7 + k * 0.5), 9, 0.52, p.rot), p.color, 3);
    }
  },
  drawStamps() {
    for (const s of this.stamps) {
      const k = s.t / s.life, sc = outBack(s.t * 9) * (k > 0.8 ? 1 - (k - 0.8) * 5 : 1);
      if (sc <= 0.02) continue;
      if (s.burst) { X.save(); X.translate(s.x, s.y); X.rotate(s.rot * 2); ink(starPath(0, 0, s.size * 1.25 * sc, 11, 0.66, 0.3), s.burst, 3); X.restore(); }
      sock(s.text, s.x, s.y, s.size * sc, s.color, s.rot);
    }
  },
};

// ───────────────────────────── geometry painters (all follow the live, bent vertices)
function shapePath(s) { return poly(s.pts.map((p) => [p.x, p.y]), !s.closed); }
function paintPier(s) {
  const top = s.pts.filter((p) => p.top), path = shapePath(s);
  ink(path, '#243f44', 0);
  X.save(); X.clip(path);
  // pilings and cross-bracing in the gloom under the deck
  const x0 = s.pts[0].rx, x1 = top[top.length - 1].rx;
  for (let x = x0 + 46; x < x1 - 20; x += 168) {
    ink(poly([[x - 13, 500], [x + 13, 500], [x + 15, 780], [x - 15, 780]]), C.woodDk, 2.6, false);
    line([[x + 15, 640], [x + 153, 700]], 5, C.ink); line([[x + 15, 640], [x + 153, 700]], 2.4, C.woodDk);
  }
  X.fillStyle = Pat.dots('rgba(20,18,15,.55)', 1.5, 7); X.fillRect(s.minx, s.miny, s.maxx - s.minx, s.maxy - s.miny);
  X.restore();
  // the deck slab
  const slab = top.map((p) => [p.x, p.y]).concat(top.slice().reverse().map((p) => [p.x - p.px * 0.12, p.y + 30]));
  const sp = poly(slab); ink(sp, C.wood, 0);
  X.save(); X.clip(sp); X.fillStyle = Pat.lines('rgba(29,26,22,.20)', 1.2, 9); X.fillRect(s.minx, s.miny, s.maxx - s.minx, 400); X.restore();
  X.lineWidth = 3.2; X.strokeStyle = C.ink; X.stroke(sp);
  line(top.map((p) => [p.x, p.y + 11]), 1.8);
  for (let i = 0; i < top.length; i++) {
    const p = top[i];
    if (i % 2 === 0) { line([[p.x, p.y], [p.x - p.px * 0.05, p.y + 11]], 1.8); X.fillStyle = C.ink; X.fillRect(p.x + 4, p.y + 4, 2, 2); }
    // sprung planks where the deck has been badly bent
    const strain = i > 0 && i < top.length - 1 ? abs(top[i - 1].py + top[i + 1].py - 2 * p.py) : 0;
    if (strain > 9) { const d = i % 2 ? 1 : -1; ink(poly([[p.x - 3, p.y + 2], [p.x + d * 15, p.y - 9 - strain * 0.35], [p.x + d * 19, p.y - 5 - strain * 0.3], [p.x + 5, p.y + 3]]), C.wood, 2, false); }
  }
  line(top.map((p) => [p.x, p.y]), 3.6);
}
function paintHull(s) {
  const path = shapePath(s);
  ink(path, s.color || C.red, 0);
  X.save(); X.clip(path);
  X.fillStyle = s.color2 || C.ink; X.fillRect(s.minx - 5, s.miny - 5, s.maxx - s.minx + 10, (s.band || 60) + (s.pts[0].y - s.miny) + 5);
  X.fillStyle = Pat.dots('rgba(20,18,15,.38)', 1.6, 8); X.fillRect(s.minx, s.maxy - (s.maxy - s.miny) * 0.45, s.maxx - s.minx, 400);
  X.restore();
  X.lineWidth = 3.6; X.strokeStyle = C.ink; X.lineJoin = 'round'; X.stroke(path);
  // rivets ride the plating
  const P = s.pts, n = P.length; X.fillStyle = C.cream;
  for (let i = 0; i < n; i += 2) {
    const a = P[(i + n - 1) % n], b = P[(i + 1) % n], p = P[i], l = hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l;
    if (p.y > World.waterY + 8) continue;
    X.beginPath(); X.arc(p.x + nx * 8, p.y + ny * 8, 1.7, 0, TAU); X.fill();
  }
  if (s.deco) s.deco(s);
}
function paintBrick(s) {
  const path = shapePath(s);
  ink(path, s.color || C.brick, 0);
  X.save(); X.clip(path); X.fillStyle = Pat.bricks(); X.fillRect(s.minx, s.miny, s.maxx - s.minx, s.maxy - s.miny);
  X.fillStyle = Pat.dots('rgba(20,18,15,.3)', 1.5, 8); X.fillRect(s.minx, s.miny, 46, s.maxy - s.miny); X.restore();
  X.lineWidth = 3.6; X.strokeStyle = C.ink; X.stroke(path);
  if (s.deco) s.deco(s);
}
function paintPlain(s) {
  const path = shapePath(s);
  ink(path, s.color || C.steel, 3.4);
  if (s.deco) s.deco(s);
}
function paintTruss(s) {
  const P = s.pts, n = P.length, r = s.r, up = [], dn = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l;
    up.push([P[i].x - nx * r, P[i].y - ny * r]); dn.push([P[i].x + nx * r, P[i].y + ny * r]);
  }
  const body = poly(up.concat(dn.slice().reverse()));
  ink(body, s.color || C.mustard, 0);
  const lace = []; for (let i = 0; i < n; i++) lace.push(i % 2 ? up[i] : dn[i]);
  line(lace, 2.2);
  X.lineWidth = 3.4; X.strokeStyle = C.ink; X.stroke(body);
  if (s.deco) s.deco(s);
}
function paintPlank(s) {
  const P = s.pts, n = P.length, r = s.r, up = [], dn = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l;
    up.push([P[i].x - nx * r, P[i].y - ny * r]); dn.push([P[i].x + nx * r, P[i].y + ny * r]);
  }
  ink(poly(up.concat(dn.slice().reverse())), s.color || C.wood, 3);
  for (let i = 1; i < n - 1; i += 2) line([up[i], dn[i]], 1.6);
}

// ───────────────────────────── the rubber-hose rig shared by every character
function drawArm(sx, sy, hx, hy, st, fs, front, bend) {
  hose(sx, sy, hx, hy, bend, st.armW, front ? st.sleeve : st.sleeveDk || st.sleeve);
  const dx = hx - sx, dy = hy - sy, l = hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  if (st.forearm) {
    const fl = Math.min(l * 0.36, 15), cx = hx - ux * (fl + 2), cy = hy - uy * (fl + 2), a = Math.atan2(dy, dx);
    ink(ell(cx, cy, fl + 3, st.forearm * (0.75 + fs * 0.25), a), st.skin, 2.6);
    if (st.tattoo && front) {
      X.save(); X.translate(cx, cy); X.rotate(a + Math.PI / 2); X.lineWidth = 1.5; X.strokeStyle = C.navy; X.beginPath();
      X.moveTo(0, -5); X.lineTo(0, 5); X.moveTo(-3, -3); X.lineTo(3, -3); X.moveTo(-4.5, 2); X.quadraticCurveTo(0, 8, 4.5, 2); X.stroke(); X.restore();
    }
  }
  const fr = st.fist * fs;
  ink(circ(hx, hy, fr), st.skin, 2.6);
  if (fr > 6) { line([[hx + ux * fr * 0.2 - uy * fr * 0.5, hy + uy * fr * 0.2 + ux * fr * 0.5], [hx + ux * fr * 0.2 + uy * fr * 0.5, hy + uy * fr * 0.2 - ux * fr * 0.5]], 1.4); }
}
function rig(st, p, time) {
  const lean = p.lean || 0, hipX = lean * 10, hipY = -(st.hip || 24) + (p.bob || 0), tl = st.torsoL || 25;
  const shX = hipX + sin(lean) * tl, shY = hipY - cos(lean) * tl;
  const hdX = shX + 3 + lean * 5 + (p.hx || 0), hdY = shY - (st.neck || 13) + (p.hy || 0);
  drawArm(shX - 6, shY + 5, p.lh[0], p.lh[1], st, p.fistL || 1, false, p.bendL === undefined ? -6 : p.bendL);
  const ss = st.shoeS || 1;
  hose(hipX - 5, hipY - 2, p.lf[0], p.lf[1], -4, st.legW, st.pantsDk || st.pants);
  ink(ell(p.lf[0] + 4 * ss, p.lf[1] - 3.5 * ss, 9 * ss, 5 * ss), st.shoe || C.ink, 2.4);
  hose(hipX + 5, hipY - 2, p.rf[0], p.rf[1], -4, st.legW, st.pants);
  ink(ell(p.rf[0] + 4 * ss, p.rf[1] - 3.5 * ss, 9 * ss, 5 * ss), st.shoe || C.ink, 2.4);
  if (st.skirt) st.skirt(hipX, hipY, lean, p);
  if (st.neckW) hose(shX + 1, shY + 2, hdX - 1, hdY + 4, 0, st.neckW, st.skin);
  const tp = ell((hipX + shX) / 2, (hipY + shY) / 2 + 1, st.torsoW, tl * 0.5 + 7, lean);
  ink(tp, st.shirt, 2.8);
  if (st.deco) { X.save(); X.clip(tp); st.deco(hipX, hipY, shX, shY); X.restore(); X.lineWidth = 2.8; X.strokeStyle = C.ink; X.stroke(tp); }
  if (st.collar) st.collar(shX, shY, lean);
  X.save(); X.translate(hdX, hdY); X.rotate(p.tilt || 0); if (st.headS) X.scale(st.headS, st.headS); st.head(p.expr || '', time, p); X.restore();
  drawArm(shX + 6, shY + 5, p.rh[0], p.rh[1], st, p.fistR || 1, true, p.bendR === undefined ? 6 : p.bendR);
}
function eyeX(x, y, r) { line([[x - r, y - r], [x + r, y + r]], 1.8); line([[x - r, y + r], [x + r, y - r]], 1.8); }

const STYLE = {
  // Olive Oyl as she was drawn in 1919: a broom handle in a long skirt, bun, enormous boots.
  olive: {
    shirt: C.red, sleeve: C.red, sleeveDk: C.redDk, pants: C.skin, pantsDk: C.skin2, skin: C.skin, shoe: '#2a2622',
    legW: 3.2, armW: 3.2, torsoW: 6.8, torsoL: 25, fist: 3.6, hip: 40, neck: 16, neckW: 3, headS: 1.22, shoeS: 1.5,
    deco(hx, hy, sx, sy) { X.fillStyle = C.white; X.fillRect(sx - 8, sy - 3, 16, 6); },
    skirt(hx, hy, lean, p) {
      const k = (p.skirtK || 0), y1 = -9;
      const sk = poly([[hx - 7, hy - 4], [hx + 7, hy - 4], [hx + 17 + k * 6, y1], [hx - 16 - k * 6, y1 + 1]]);
      ink(sk, '#2a2622', 2.6); line([[hx - 15 - k * 6, y1 - 4], [hx + 16 + k * 6, y1 - 5]], 1.6, C.red);
    },
    head(expr, t, p) {
      ink(circ(-8.8, -6, 4.4), C.ink, 2);                                      // the bun
      ink(ell(0.5, -1, 6.6, 10.4, 0.06), C.skin, 2.3);                          // long face
      const hair = new Path2D(); hair.moveTo(-6, -3); hair.bezierCurveTo(-7.5, -13.5, 5, -15.5, 7, -6); hair.quadraticCurveTo(1, -10.5, -6, -3); hair.closePath(); ink(hair, C.ink, 1.6, false);
      ink(ell(7.6, 0.8, 2.3, 3.2, 0.2), C.skin, 1.9);                           // nose
      if (expr === 'ow' || expr === 'scared') {
        ink(circ(3.8, -3, 2.3), C.white, 1.3, false); X.fillStyle = C.ink; X.beginPath(); X.arc(4.3, -2.9, 1, 0, TAU); X.fill();
        ink(ell(4.6, 6.2, 2.2, 2.9), C.ink, 0);
      } else {
        X.fillStyle = C.ink; X.beginPath(); X.arc(3.8, -2.8, 1.25, 0, TAU); X.fill();
        line([[3, -5.4], [3.4, -6.9]], 1); line([[4.4, -5.2], [5.2, -6.6]], 1); line([[5.6, -4.8], [6.8, -5.8]], 1);   // lashes
        X.lineWidth = 1.6; X.strokeStyle = C.ink; X.beginPath(); X.moveTo(1.8, 5.4); X.quadraticCurveTo(4.6, expr === 'cheer' ? 9 : 6.8, 7.4, 5); X.stroke();
      }
    },
  },
  // Popeye as Segar drew him in 1929: bald dome, one eye screwed shut, a jaw like a
  // ship's prow, corncob pipe, skinny upper arms over huge forearms, little sailor cap.
  popeye: {
    shirt: '#22303f', sleeve: C.skin, sleeveDk: C.skin2, pants: '#3d6f9a', pantsDk: '#2f5878', skin: C.skin, shoe: '#4b2e1a',
    legW: 4.6, armW: 3.2, torsoW: 13, torsoL: 22, forearm: 13, fist: 9.4, tattoo: true, headS: 1.42, neck: 10, hip: 21, shoeS: 1.4,
    deco(hx, hy, sx, sy) {
      X.fillStyle = C.mustard; for (let i = 0; i < 2; i++) { X.beginPath(); X.arc(lerp(hx, sx, 0.42 + i * 0.26) + 6, lerp(hy, sy, 0.42 + i * 0.26), 2, 0, TAU); X.fill(); }
      X.fillStyle = C.ink; X.fillRect(hx - 18, hy - 6, 36, 5); X.fillStyle = C.mustard; X.fillRect(hx + 4, hy - 6, 6, 5);
    },
    collar(sx, sy, lean) {
      X.save(); X.translate(sx, sy); X.rotate(lean);
      ink(poly([[-15, 1], [-13, 10], [-2, 7], [3, 13], [8, 4]]), C.red, 2.4);
      X.restore();
    },
    head(expr, t, p) {
      // union of a round skull and a big puffy lower face: stroke both, then fill both, so no seam shows
      const skull = new Path2D(); skull.arc(-0.5, -6.5, 9.2, 0, TAU);
      const jowl = new Path2D(); jowl.ellipse(5.2, 3.6, 11.4, 8.6, -0.12, 0, TAU);
      const ear = new Path2D(); ear.ellipse(-8.8, -1.6, 3, 3.8, 0, 0, TAU);
      X.lineJoin = 'round'; X.strokeStyle = C.ink; X.lineWidth = 4.6;
      X.stroke(ear); X.stroke(skull); X.stroke(jowl);
      X.fillStyle = C.skin2; X.fill(ear);
      X.fillStyle = C.skin; X.fill(skull); X.fill(jowl);
      X.save(); X.globalAlpha = 0.5; X.fillStyle = C.skin2; X.beginPath(); X.ellipse(1.5, 7.5, 6, 3.4, -0.2, 0, TAU); X.fill(); X.restore();   // cheek shade
      X.lineCap = 'round';
      // cheek crease running down from the nose
      X.lineWidth = 1.4; X.beginPath(); X.moveTo(9.4, 0.6); X.quadraticCurveTo(6.4, 3, 6.6, 6.6); X.stroke();
      if (expr === 'ow') {
        eyeX(3, -6.2, 2.1); eyeX(9.2, -7.4, 1.4);
        ink(ell(10.2, 7.6, 3, 3.6), C.ink, 0);
      } else {
        // the squint: heavy brow pressed down onto a shut eye
        X.lineWidth = 2.2; X.beginPath(); X.moveTo(-0.6, -5.8); X.quadraticCurveTo(2.8, -3.6, 6.4, -5.6); X.stroke();
        X.lineWidth = 1.2; X.beginPath(); X.moveTo(-1, -6.6); X.lineTo(-3.2, -7.8); X.moveTo(-1, -5); X.lineTo(-3.2, -4.2); X.stroke();
        X.lineWidth = 2; X.beginPath(); X.moveTo(-1, -9.6); X.quadraticCurveTo(2.6, expr === 'grit' ? -7.6 : -10.6, 6.6, -8.6); X.stroke();
        // the open eye
        ink(ell(9.4, -7.2, 1.7, 2.3), C.white, 1.3, false);
        X.fillStyle = C.ink; X.beginPath(); X.arc(9.8, -6.9, expr === 'flex' ? 1.2 : 1, 0, TAU); X.fill();
        // the grin: a long line pushed up into the pipe cheek, lower lip under it
        X.lineWidth = 2; X.beginPath(); X.moveTo(3.4, 6.4); X.quadraticCurveTo(10, expr === 'flex' ? 6 : 9, 15.8, 4.6); X.stroke();
        X.lineWidth = 1.3; X.beginPath(); X.moveTo(7.4, 10.4); X.quadraticCurveTo(10.6, 11.6, 13.6, 9.8); X.stroke();
        if (expr === 'grit') { X.lineWidth = 1.2; X.beginPath(); X.moveTo(6.6, 7.6); X.lineTo(12.6, 7.6); X.stroke(); }
      }
      // ball of a nose, sitting proud of the face
      X.lineWidth = 2.2; const nose = new Path2D(); nose.arc(13.6, -3.4, 3.7, 0, TAU);
      X.stroke(nose); X.fillStyle = C.skin; X.fill(nose);
      X.fillStyle = C.white; X.beginPath(); X.arc(12.6, -4.6, 1, 0, TAU); X.fill();
      const pa = expr === 'flex' ? -0.75 : expr === 'ow' ? 0.55 : -0.42;       // corncob pipe
      X.save(); X.translate(15.6, 4.6); X.rotate(pa);
      line([[0, 0], [8.6, 0]], 3.8); line([[0, 0], [8.6, 0]], 1.4, C.woodDk);
      ink(rrect(7, -8, 6.4, 9, 1.8), C.mustard, 1.9); line([[8, -5], [12.4, -5]], 0.9); line([[8, -2.2], [12.4, -2.2]], 0.9);
      X.restore();
      if (p && p.puff) { const k = p.puff; X.save(); X.translate(15.6 + cos(pa) * 10, 4.6 + sin(pa) * 10 - 11); ink(circ(2, -k * 16, 3 + k * 4), C.white, 1.6); ink(circ(7, -k * 26 - 4, 2 + k * 5), C.white, 1.6); X.restore(); }
      // sailor cap: white crown, dark band, perched on top and tipped back
      X.save(); X.translate(-1.2, -14.8); X.rotate(-0.24);
      const crown = new Path2D(); crown.moveTo(-8.6, 1); crown.bezierCurveTo(-9.4, -7.6, 8.8, -8.4, 8.6, 1); crown.closePath();
      ink(crown, C.white, 2); ink(rrect(-9.2, 0, 18.4, 3.4, 1.4), C.navy, 1.8);
      X.restore();
    },
  },
  rat: {
    shirt: C.cream, sleeve: C.cream, sleeveDk: '#d9c385', pants: C.teal, pantsDk: '#235a5e', skin: '#e9c79a', shoe: C.ink,
    legW: 5.5, armW: 4.6, torsoW: 10, fist: 5.6, hip: 25, torsoL: 23,
    deco(hx, hy, sx, sy) { X.strokeStyle = C.ink; X.lineWidth = 2.6; for (let i = -1; i < 7; i++) { const y = lerp(hy, sy, i / 5); X.beginPath(); X.moveTo(hx - 20, y); X.lineTo(hx + 20, y - 2); X.stroke(); } },
    head(expr) {
      ink(circ(-7.5, 1, 2.8), '#d8b384', 2);
      ink(poly([[5, -3], [18, 1.5], [6, 5.5]]), '#e9c79a', 2.4);
      ink(circ(0, 0, 9.5), '#e9c79a', 2.6);
      X.fillStyle = '#e9c79a'; X.fillRect(5, -1.5, 5, 5);
      X.fillStyle = C.ink; [[-3, 6], [0, 7.5], [3, 6.5], [-1, 4.5]].forEach(([x, y]) => X.fillRect(x, y, 1.4, 1.4));
      if (expr === 'ko' || expr === 'ow') { eyeX(3.5, -2, 2.2); ink(ell(5, 6.5, 2.6, 3.4), C.ink, 0); if (expr === 'ko') ink(ell(6.5, 9.5, 2, 3.2), C.red, 1.6, false); }
      else { X.beginPath(); X.arc(4, -1.6, 1.6, 0, TAU); X.fill(); line([[0.5, -5.5], [7.5, expr === 'mad' ? -2.6 : -4.2]], 2.2); line([[3, 5.5], [8, expr === 'mad' ? 6.5 : 4.5]], 1.8); }
      ink(ell(0, -8, 12.5, 4.6, -0.08), C.red, 2.4); ink(ell(9, -6.6, 7, 2.3, 0.12), C.redDk, 2.2);
      X.fillStyle = C.ink; X.beginPath(); X.arc(-1, -11.6, 1.6, 0, TAU); X.fill();
    },
  },
  bruiser: {
    shirt: C.red, sleeve: C.red, sleeveDk: C.redDk, pants: '#3b3a3a', pantsDk: '#2a2928', skin: '#e2a47a', shoe: C.ink,
    legW: 8, armW: 8, torsoW: 20, forearm: 8, fist: 8.5, hip: 21, torsoL: 27, neck: 12,
    deco(hx, hy, sx, sy) { X.strokeStyle = C.ink; X.lineWidth = 3; X.beginPath(); X.moveTo(hx - 9, hy + 4); X.lineTo(sx - 6, sy - 6); X.moveTo(hx + 11, hy + 4); X.lineTo(sx + 9, sy - 6); X.stroke(); X.fillStyle = C.mustard; X.beginPath(); X.arc(hx - 8, hy - 2, 2, 0, TAU); X.arc(hx + 11, hy - 2, 2, 0, TAU); X.fill(); },
    head(expr, t) {
      ink(circ(-8.5, 0, 3.4), '#cf8f66', 2.2);
      ink(ell(2, 6.5, 11, 7.6), '#e2a47a', 2.6);
      ink(circ(0, -1, 9.2), '#e2a47a', 2.6);
      X.fillStyle = '#e2a47a'; X.beginPath(); X.ellipse(1.5 + REG.x, 3 + REG.y, 8, 4, 0, 0, TAU); X.fill();
      ink(circ(8.5, 1, 3.4), '#e2a47a', 2.2);
      if (expr === 'ko' || expr === 'ow' || expr === 'dizzy') { eyeX(4, -3, 2); if (expr === 'dizzy') { X.lineWidth = 1.6; X.beginPath(); for (let a = 0; a < 9; a += 0.4) X.lineTo(-2 + cos(a + t * 9) * a * 0.5, -3 + sin(a + t * 9) * a * 0.5); X.stroke(); } }
      else { X.fillStyle = C.ink; X.beginPath(); X.arc(4.2, -2.6, 1.4, 0, TAU); X.fill(); line([[0, -6.4], [8, expr === 'mad' ? -2.6 : -4.4]], 2.8); }
      // handlebar moustache
      X.lineWidth = 3; X.strokeStyle = C.ink; X.beginPath(); X.moveTo(9, 5); X.quadraticCurveTo(3, 9, -2, 4.5); X.moveTo(9, 5); X.quadraticCurveTo(13, 9, 15, 4); X.stroke();
      if (expr === 'mad') { ink(rrect(3, 8, 7, 3.4, 1), C.white, 1.4, false); }
      // derby
      const d = new Path2D(); d.moveTo(-9, -8); d.bezierCurveTo(-9, -22, 9, -22, 9, -9); d.closePath(); ink(d, '#3b3a3a', 2.6);
      line([[-13, -8], [13, -9.4]], 3.6);
    },
  },
  plank: {
    shirt: C.mustard, sleeve: C.mustard, sleeveDk: '#bb8520', pants: C.navy, pantsDk: '#1f344a', skin: '#e7b48c', shoe: C.ink,
    legW: 6, armW: 5, torsoW: 12, fist: 6.2, hip: 23, torsoL: 24,
    deco(hx, hy, sx, sy) { X.strokeStyle = C.ink; X.lineWidth = 2.4; X.beginPath(); X.moveTo(hx - 8, hy + 4); X.lineTo(sx - 5, sy - 4); X.moveTo(hx + 9, hy + 4); X.lineTo(sx + 7, sy - 4); X.stroke(); X.fillStyle = C.navy; X.fillRect(hx - 12, hy - 14, 24, 14); },
    head(expr) {
      ink(circ(-8, 1, 3), '#d39e78', 2);
      ink(rrect(-8.5, -9, 17, 19, 6), '#e7b48c', 2.6);
      X.fillStyle = 'rgba(29,26,22,.35)'; for (let i = 0; i < 9; i++) X.fillRect(-3 + (i % 3) * 3.4, 4.5 + Math.floor(i / 3) * 1.8, 1.2, 1.2);   // stubble
      ink(circ(8.6, 0, 3), '#e7b48c', 2.2);
      if (expr === 'ko' || expr === 'ow') { eyeX(3.5, -3, 2); ink(ell(4.5, 6, 2.4, 2.8), C.ink, 0); }
      else { X.fillStyle = C.ink; X.beginPath(); X.arc(3.8, -2.6, 1.5, 0, TAU); X.fill(); line([[-0.5, -6], [7, expr === 'mad' ? -3.6 : -5.4]], 2.4); line([[2, 6], [8, 6]], 1.8); }
      ink(poly([[-10, -7], [-6, -14], [9, -13], [15, -8], [9, -6.5]]), '#5b4a3a', 2.4);   // flat cap
      line([[-9, -8.5], [10, -8]], 1.4);
    },
  },
  chucker: {
    shirt: C.teal, sleeve: C.teal, sleeveDk: '#235a5e', pants: C.mustard, pantsDk: '#bb8520', skin: '#eab892', shoe: C.ink,
    legW: 5, armW: 4.4, torsoW: 9.5, fist: 5.4, hip: 26, torsoL: 22,
    deco(hx, hy, sx, sy) { X.fillStyle = C.cream; X.fillRect(sx - 14, sy - 2, 28, 7); X.strokeStyle = C.ink; X.lineWidth = 1.6; X.strokeRect(sx - 14, sy - 2, 28, 7); },
    head(expr) {
      ink(circ(-7, 1, 2.8), '#d9a57e', 2);
      ink(circ(0, 0, 9), '#eab892', 2.6);
      ink(circ(8.5, 1.5, 3), '#eab892', 2.2);
      if (expr === 'ko' || expr === 'ow') { eyeX(3.5, -1.5, 2.2); ink(ell(4.5, 5.5, 2.6, 3), C.ink, 0); }
      else {
        ink(circ(3.6, -1.6, 3.2), C.white, 1.8, false); X.fillStyle = C.ink; X.beginPath(); X.arc(4.6, -1.4, 1.4, 0, TAU); X.fill();
        ink(rrect(1.5, 3.8, 7.5, 3.6, 1.2), C.white, 1.6, false); line([[4, 3.8], [4, 7.4]], 1); line([[6.5, 3.8], [6.5, 7.4]], 1);
      }
      const b = new Path2D(); b.moveTo(-9.6, -3); b.bezierCurveTo(-10, -18, 10, -18, 9.6, -4.5); b.closePath(); ink(b, C.mustard, 2.6);
      line([[-9.6, -4.6], [9.6, -6]], 2.2); ink(circ(0, -15.5, 3), C.red, 2);
    },
  },
};

// ───────────────────────────── Popeye: a dedicated, clean-line drawing (no misregistered fills)
const PC = { skin: '#f2c194', skinDk: '#d99a6c', shirt: '#fbf8ee', shirtDk: '#ddd6c2', collar: '#fbf8ee', stripe: '#2f4f86', pants: '#f6f1e2', pantsDk: '#d8d0ba', shoe: '#1d1a16', cap: '#fbf8ee', band: '#e9e2cf', pipe: '#e2a52c', stem: '#7a5230', tie: '#1d1a16' };
function pInk(path, fill, lw) { if (fill) { X.fillStyle = fill; X.fill(path); } if (lw) { X.lineWidth = lw; X.strokeStyle = C.ink; X.lineJoin = 'round'; X.lineCap = 'round'; X.stroke(path); } }
function pLine(pts, lw, col) { X.lineWidth = lw; X.strokeStyle = col || C.ink; X.lineCap = 'round'; X.lineJoin = 'round'; const q = new Path2D(); pts.forEach((v, i) => (i ? q.lineTo(v[0], v[1]) : q.moveTo(v[0], v[1]))); X.stroke(q); }
function popeyeArm(sx, sy, hx, hy, fs, bend, front) {
  const dx = hx - sx, dy = hy - sy, l = hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const ex = sx + dx * 0.4 - uy * bend, ey = sy + dy * 0.4 + ux * bend;           // elbow
  // skinny upper arm with a short sleeve
  pLine([[sx, sy], [ex, ey]], 6.4, C.ink); pLine([[sx, sy], [ex, ey]], 3.4, front ? PC.skin : PC.skinDk);
  pLine([[sx, sy], [lerp(sx, ex, 0.38), lerp(sy, ey, 0.38)]], 7.4, C.ink); pLine([[sx, sy], [lerp(sx, ex, 0.35), lerp(sy, ey, 0.35)]], 4.6, front ? PC.shirt : PC.shirtDk);
  // the forearm: a great ham of a thing, widest just short of the wrist
  const fx = hx - ex, fy = hy - ey, fl = hypot(fx, fy) || 1, a = Math.atan2(fy, fx), w = 8 * (1 + (fs - 1) * 0.55);
  X.save(); X.translate(ex, ey); X.rotate(a);
  const fa = new Path2D(); fa.moveTo(0, -2.6); fa.bezierCurveTo(fl * 0.3, -w * 0.9, fl * 0.62, -w * 1.25, fl * 0.86, -w * 0.8); fa.lineTo(fl * 0.86, w * 0.8);
  fa.bezierCurveTo(fl * 0.62, w * 1.25, fl * 0.3, w * 0.9, 0, 2.6); fa.closePath();
  pInk(fa, front ? PC.skin : PC.skinDk, 2.2);
  if (front && fl > 9) {   // anchor tattoo
    X.save(); X.translate(fl * 0.52, 0); X.rotate(Math.PI / 2); X.lineWidth = 1.1; X.strokeStyle = PC.stripe; X.beginPath();
    X.moveTo(0, -3.4); X.lineTo(0, 3); X.moveTo(-2, -2); X.lineTo(2, -2); X.moveTo(-2.8, 1.4); X.quadraticCurveTo(0, 4.6, 2.8, 1.4); X.stroke(); X.restore();
  }
  X.restore();
  // fist
  const r = 6 * fs, fist = new Path2D(); fist.ellipse(hx, hy, r * 1.05, r, a, 0, TAU);
  pInk(fist, front ? PC.skin : PC.skinDk, 2.2);
  X.lineWidth = 1; X.strokeStyle = C.ink; X.beginPath();
  for (let i = -1; i <= 1; i++) { const ox = -uy * i * r * 0.42, oy = ux * i * r * 0.42; X.moveTo(hx + ux * r * 0.25 + ox, hy + uy * r * 0.25 + oy); X.lineTo(hx + ux * r * 0.85 + ox, hy + uy * r * 0.85 + oy); }
  X.stroke();
}
function popeyeLeg(hx, hy, f, col) {
  pLine([[hx, hy], [f[0], f[1] - 4]], 8.6, C.ink); pLine([[hx, hy], [f[0], f[1] - 4]], 5.6, col);
  const cuff = new Path2D(); cuff.moveTo(f[0] - 5.4, f[1] - 3.6); cuff.lineTo(f[0] + 5.4, f[1] - 3.6); cuff.lineTo(f[0] + 4, f[1] - 9); cuff.lineTo(f[0] - 4, f[1] - 9); cuff.closePath(); pInk(cuff, col, 1.8);
  const shoe = new Path2D(); shoe.moveTo(f[0] - 6, f[1]); shoe.bezierCurveTo(f[0] - 7, f[1] - 9, f[0] + 9, f[1] - 10, f[0] + 13, f[1] - 3); shoe.quadraticCurveTo(f[0] + 14, f[1] + 0.5, f[0] + 9, f[1] + 0.5); shoe.closePath();
  pInk(shoe, PC.shoe, 2.2); X.fillStyle = 'rgba(255,255,255,.25)'; X.beginPath(); X.ellipse(f[0] + 4, f[1] - 6, 3, 1.4, -0.2, 0, TAU); X.fill();
}
function popeyeHead(expr, p) {
  const ow = expr === 'ow', happy = expr === 'flex';
  // ear
  const ear = new Path2D(); ear.ellipse(-10.5, -13, 3.4, 4.4, 0, 0, TAU); pInk(ear, PC.skinDk, 2);
  // one silhouette: domed skull, pipe cheek, and the chin that sails out ahead of him
  const h = new Path2D();
  h.moveTo(-8, -3);
  h.bezierCurveTo(-15, -9, -15, -30, -1, -31);
  h.bezierCurveTo(9, -31.5, 13, -25, 12.5, -18);
  h.bezierCurveTo(12.5, -14, 15, -10, 18.5, -6.5);
  h.bezierCurveTo(24, -4, 26, 4.5, 20.5, 7.6);
  h.bezierCurveTo(15, 10.6, 6, 10, 0.5, 6.5);
  h.bezierCurveTo(-3, 4.2, -5.6, 0, -8, -3);
  h.closePath();
  pInk(h, PC.skin, 2.4);
  X.save(); X.clip(h); X.fillStyle = 'rgba(217,154,108,.32)'; X.beginPath(); X.ellipse(4, 11, 16, 5, -0.12, 0, TAU); X.fill(); X.restore();   // soft shade under the jaw
  X.lineCap = 'round'; X.strokeStyle = C.ink;
  // cheek line from the nose round the pipe side
  X.lineWidth = 1.3; X.beginPath(); X.moveTo(12.2, -9); X.quadraticCurveTo(8.6, -6.4, 9, -2.4); X.stroke();
  if (ow) {
    eyeX(3, -17, 2.2); eyeX(10, -18.4, 1.5);
    const m = new Path2D(); m.ellipse(13.5, -1, 3, 3.8, 0, 0, TAU); pInk(m, C.ink, 0);
  } else {
    // the squint: lid shut tight under a heavy, crooked brow
    X.lineWidth = 2.2; X.beginPath(); X.moveTo(-0.6, -16.8); X.quadraticCurveTo(3, -14.4, 6.6, -16.6); X.stroke();
    X.lineWidth = 1.1; X.beginPath(); X.moveTo(-1.2, -17.8); X.lineTo(-3.6, -19); X.moveTo(-1.2, -15.8); X.lineTo(-3.6, -14.8); X.stroke();
    X.lineWidth = 2.4; X.beginPath(); X.moveTo(-1.4, -21.4); X.quadraticCurveTo(3, expr === 'grit' ? -19 : -22.6, 7.4, -20.4); X.stroke();
    // the open eye, small and beady, tucked behind the nose
    const e = new Path2D(); e.ellipse(10.6, -18.4, 1.9, 2.6, 0, 0, TAU); pInk(e, '#fff', 1.2);
    X.fillStyle = C.ink; X.beginPath(); X.arc(11.1, -18, happy ? 1.25 : 1.05, 0, TAU); X.fill();
    X.lineWidth = 1.6; X.beginPath(); X.moveTo(8.6, -22.6); X.lineTo(12.4, -22); X.stroke();
    if (happy) {
      // open grin
      const g = new Path2D(); g.moveTo(5.4, -4.6); g.quadraticCurveTo(12.5, -6.4, 19.4, -5.4); g.quadraticCurveTo(16, 4.4, 9, 1.6); g.closePath();
      pInk(g, '#5a1a14', 1.8); X.save(); X.clip(g); X.fillStyle = '#c9442c'; X.beginPath(); X.ellipse(11.5, 1.2, 4.4, 2.4, 0, 0, TAU); X.fill(); X.restore();
    } else {
      X.lineWidth = 2; X.beginPath(); X.moveTo(5.2, -3.4); X.quadraticCurveTo(12, expr === 'grit' ? -3.6 : -1.2, 19.2, -5.6); X.stroke();
      X.lineWidth = 1.3; X.beginPath(); X.moveTo(10.4, 1.6); X.quadraticCurveTo(14, 3, 17.4, 0.6); X.stroke();
      if (expr === 'grit') { X.lineWidth = 1.1; X.beginPath(); X.moveTo(8, -2.2); X.lineTo(15, -3.2); X.stroke(); }
    }
  }
  // the nose: a round knob
  const n = new Path2D(); n.ellipse(16.6, -11.4, 4.4, 3.8, -0.15, 0, TAU); pInk(n, PC.skin, 2);
  X.fillStyle = 'rgba(255,255,255,.7)'; X.beginPath(); X.arc(15.4, -12.8, 1.1, 0, TAU); X.fill();
  // corncob pipe
  const pa = happy ? -0.8 : ow ? 0.5 : -0.45;
  X.save(); X.translate(19, -5.2); X.rotate(pa);
  pLine([[0, 0], [9, 0]], 4, C.ink); pLine([[0, 0], [9, 0]], 1.8, PC.stem);
  const bowl = new Path2D(); bowl.moveTo(7.6, 1); bowl.lineTo(7.2, -8.4); bowl.quadraticCurveTo(10.4, -9.6, 13.6, -8.4); bowl.lineTo(13.2, 1); bowl.quadraticCurveTo(10.4, 2.4, 7.6, 1); bowl.closePath();
  pInk(bowl, PC.pipe, 1.8); X.lineWidth = 0.8; X.beginPath(); X.moveTo(8, -5.4); X.lineTo(12.8, -5.4); X.moveTo(8, -2.4); X.lineTo(12.8, -2.4); X.stroke();
  X.restore();
  if (p && p.puff) { const k = p.puff; X.save(); X.translate(19 + cos(pa) * 10, -5 + sin(pa) * 10 - 12); pInk(circ(2, -k * 16, 3 + k * 4), '#fff', 1.4); pInk(circ(7, -k * 26 - 4, 2 + k * 5), '#fff', 1.4); X.restore(); }
  // sailor cap, tipped back on the dome
  X.save(); X.translate(-1.4, -29); X.rotate(-0.2);
  const crown = new Path2D(); crown.moveTo(-10.6, 1.2); crown.bezierCurveTo(-11.6, -8.6, 10.4, -9.6, 10.4, 1.2); crown.closePath();
  pInk(crown, PC.cap, 2.1);
  X.fillStyle = 'rgba(29,26,22,.12)'; X.beginPath(); X.ellipse(-4, -3, 4, 2.2, -0.3, 0, TAU); X.fill();
  const band = new Path2D(); band.moveTo(-11.2, 0.2); band.quadraticCurveTo(0, -1.6, 11, 0.2); band.lineTo(11, 3.8); band.quadraticCurveTo(0, 2.2, -11.2, 4); band.closePath();
  pInk(band, PC.band, 1.8);
  X.restore();
}
function drawPopeye(p, t) {
  const lean = p.lean || 0, hipX = lean * 10, hipY = -23 + (p.bob || 0), tl = 24;
  const lf = [p.lf[0] * 1.25 - 1, p.lf[1]], rf = [p.rf[0] * 1.25 + 1, p.rf[1]];
  const shX = hipX + sin(lean) * tl, shY = hipY - cos(lean) * tl;
  // back arm, legs
  popeyeArm(shX - 10, shY + 5, p.lh[0], p.lh[1], p.fistL || 1, p.bendL === undefined ? -7 : p.bendL, false);
  popeyeLeg(hipX - 5.5, hipY, lf, PC.pantsDk);
  popeyeLeg(hipX + 5.5, hipY, rf, PC.pants);
  // torso: barrel chest in a dark jumper
  X.save(); X.translate(hipX, hipY); X.rotate(lean);
  const pants = new Path2D(); pants.moveTo(-10.4, -4); pants.lineTo(10.4, -4); pants.lineTo(9.6, 3); pants.quadraticCurveTo(0, 5.4, -9.6, 3); pants.closePath(); pInk(pants, PC.pants, 2.2);
  const body = new Path2D(); body.moveTo(-9.4, 0); body.bezierCurveTo(-15.6, -8, -18, -20, -14.2, -25.6); body.lineTo(14.4, -25.6); body.bezierCurveTo(18.2, -20, 15.8, -8, 9.4, 0); body.closePath();
  pInk(body, PC.shirt, 2.4);
  X.save(); X.clip(body); X.fillStyle = PC.shirtDk; X.beginPath(); X.ellipse(-12, -10, 6, 16, 0.1, 0, TAU); X.fill(); X.restore(); X.lineWidth = 2.4; X.strokeStyle = C.ink; X.stroke(body);
  X.lineWidth = 1.2; X.beginPath(); X.moveTo(-9.6, -1.6); X.lineTo(9.6, -1.6); X.stroke();   // waistband
  // sailor collar with a stripe
  const col = new Path2D(); col.moveTo(-14.6, -25.6); col.lineTo(-16, -17); col.lineTo(-4, -19.2); col.lineTo(0.6, -12); col.lineTo(4.6, -19.4); col.lineTo(15.4, -18); col.lineTo(14.6, -25.6); col.closePath();
  pInk(col, PC.collar, 1.8);
  X.lineWidth = 1.2; X.strokeStyle = PC.stripe; X.beginPath(); X.moveTo(-14.6, -19.2); X.lineTo(-5.4, -21); X.moveTo(5.6, -21.2); X.lineTo(14, -20); X.stroke();
  const knot = new Path2D(); knot.moveTo(-2.2, -14.6); knot.lineTo(3.4, -14.6); knot.lineTo(2.6, -11.4); knot.lineTo(-1.4, -11.4); knot.closePath(); pInk(knot, PC.tie, 1);
  pInk(poly([[-1.4, -11.6], [-3.6, -5.6], [-0.6, -6.6]]), PC.tie, 1); pInk(poly([[2.6, -11.6], [4.8, -5.8], [1.8, -6.6]]), PC.tie, 1);
  X.restore();
  // head
  X.save(); X.translate(shX + 2 + lean * 4, shY - 0.5); X.rotate(p.tilt || 0); X.scale(0.86, 0.86); popeyeHead(p.expr || '', p); X.restore();
  // front arm
  popeyeArm(shX + 10, shY + 5, p.rh[0], p.rh[1], p.fistR || 1, p.bendR === undefined ? 7 : p.bendR, true);
}
