// ───────────────────────────── world: bendable geometry + circle-body physics
// Every piece of level geometry is a chain of vertices. Each vertex carries
//   rest position + plastic offset (permanent dents) + elastic offset (wobble).
// The elastic part obeys a 1-D wave equation along the chain, so a thump on the
// pier travels down the planking and tosses whoever is standing on it.
const MAT = {
  wood: { c2: 1500, kr: 70, dp: 4.2, stiff: 1, max: 125, cost: 0.55, label: 'Pier planking, re-contoured' },
  steel: { c2: 2600, kr: 50, dp: 2.0, stiff: 1, max: 320, cost: 1.9, label: 'Crane steel, bent' },
  hull: { c2: 1300, kr: 110, dp: 5, stiff: 1.35, max: 95, cost: 1.4, label: 'Hull plating, stove in' },
  brick: { c2: 900, kr: 170, dp: 7, stiff: 2.0, max: 70, cost: 1.0, label: 'Brickwork, rearranged' },
};
const CAT = { PLAYER: 1, ENEMY: 2, PROP: 4, PROJ: 8, PICKUP: 16 };

class Shape {
  constructor(o) {
    this.kind = o.kind || 'solid';          // 'solid' (closed polygon) | 'beam' (thick polyline)
    this.closed = this.kind === 'solid';
    this.mat = o.mat || 'wood';
    this.m = MAT[this.mat];
    this.r = o.r || 0;
    this.bend = o.bend || 'dent';           // beams: 'hinge' (cantilever) | 'dent'
    this.tag = o.tag || '';
    this.draw = o.draw || null;
    this.max = o.max || this.m.max;
    this.stiff = o.stiff || this.m.stiff;
    this.ghost = !!o.ghost;                 // drawn + deformable but no collision
    this.awake = 0; this.bendSum = 0; this.dented = 0;
    const raw = o.pts, n = raw.length, segs = this.closed ? n : n - 1, sub = o.sub || 22;
    this.pts = [];
    const add = (x, y, corner) => this.pts.push({ rx: x, ry: y, x, y, px: 0, py: 0, tx: 0, ty: 0, ex: 0, ey: 0, vx: 0, vy: 0, sx: 0, sy: 0, w: 1, corner, ax: 0, ay: 0 });
    for (let i = 0; i < segs; i++) {
      const a = raw[i], b = raw[(i + 1) % n], k = Math.max(1, Math.round(hypot(b[0] - a[0], b[1] - a[1]) / sub));
      for (let j = 0; j < k; j++) add(lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k), j === 0);
    }
    if (!this.closed) add(raw[n - 1][0], raw[n - 1][1], true);
    if (o.pin) this.pts.forEach((p, i) => { p.w = clamp(o.pin(p.rx, p.ry, i, this.pts.length), 0, 1); });
    this.len = [];
    for (let i = 0; i < this.pts.length - 1; i++) this.len.push(hypot(this.pts[i + 1].rx - this.pts[i].rx, this.pts[i + 1].ry - this.pts[i].ry));
    this.bounds();
  }
  bounds() {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    for (const p of this.pts) { if (p.x < a) a = p.x; if (p.x > c) c = p.x; if (p.y < b) b = p.y; if (p.y > d) d = p.y; }
    this.minx = a - this.r; this.miny = b - this.r; this.maxx = c + this.r; this.maxy = d + this.r;
  }
  update(dt) {
    if (this.awake <= 0) return;
    this.awake -= dt;
    const P = this.pts, n = P.length, m = this.m, k = 1 - Math.exp(-dt * 20);
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const p = P[i];
      let a, b;
      if (this.closed) { a = P[(i + n - 1) % n]; b = P[(i + 1) % n]; } else { a = P[i > 0 ? i - 1 : i]; b = P[i < n - 1 ? i + 1 : i]; }
      p.ax = m.c2 * (a.ex + b.ex - 2 * p.ex) - m.kr * p.ex - m.dp * p.vx;
      p.ay = m.c2 * (a.ey + b.ey - 2 * p.ey) - m.kr * p.ey - m.dp * p.vy;
    }
    for (let i = 0; i < n; i++) {
      const p = P[i];
      p.vx = (p.vx + p.ax * dt) * p.w; p.vy = (p.vy + p.ay * dt) * p.w;
      p.ex += p.vx * dt; p.ey += p.vy * dt;
      const dx = (p.tx - p.px) * k, dy = (p.ty - p.py) * k;
      p.px += dx; p.py += dy;
      p.sx = clamp(p.vx + dx / dt, -1500, 1500); p.sy = clamp(p.vy + dy / dt, -1500, 1500);
      p.x = p.rx + p.px + p.ex; p.y = p.ry + p.py + p.ey;
      energy += abs(p.vx) + abs(p.vy) + abs(p.ex) + abs(p.ey) + abs(dx) * 60 + abs(dy) * 60;
    }
    if (energy > 2 && this.awake < 0.5) this.awake = 0.5;
    if (this.awake <= 0) for (const p of P) { p.sx = p.sy = 0; }
    this.bounds();
  }
  contains(x, y) {
    let inside = false; const P = this.pts, n = P.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const a = P[i], b = P[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }
  // world position of a rest-space anchor that rides vertex i (for decor that must follow dents)
  at(i) { return this.pts[clamp(i, 0, this.pts.length - 1)]; }
  nearestIndex(x, y) { let b = 0, bd = 1e18; this.pts.forEach((p, i) => { const d = (p.rx - x) ** 2 + (p.ry - y) ** 2; if (d < bd) { bd = d; b = i; } }); return b; }
}

class Body {
  constructor(o) {
    this.x = o.x; this.y = o.y; this.vx = o.vx || 0; this.vy = o.vy || 0;
    this.r = o.r || 16; this.m = o.m || 1; this.rest = o.rest === undefined ? 0.4 : o.rest; this.fric = o.fric === undefined ? 0.5 : o.fric;
    this.grav = o.grav === undefined ? 1 : o.grav; this.ang = 0; this.w = 0;
    this.cat = o.cat || CAT.PROP; this.mask = o.mask === undefined ? 0xff : o.mask;
    this.soft = false; this.fixed = false; this.ghost = false; this.dead = false;
    this.grounded = false; this.gnx = 0; this.gny = -1; this.gsx = 0; this.gsy = 0; this.touch = false;
    this.tether = null; this.owner = o.owner || null; this.onHit = null; this.onBump = null; this.maxSpeed = o.maxSpeed || 2600;
  }
}

const World = {
  shapes: [], bodies: [], g: 1500, bill: {}, waterY: 650,
  reset() { this.shapes = []; this.bodies = []; this.bill = {}; },
  addShape(o) { const s = new Shape(o); this.shapes.push(s); return s; },
  addBody(o) { const b = new Body(o); this.bodies.push(b); return b; },

  step(dt, sub) {
    const h = dt / sub;
    for (const b of this.bodies) { b.grounded = false; b.touch = false; }
    for (let k = 0; k < sub; k++) {
      for (const s of this.shapes) s.update(h);
      for (const b of this.bodies) {
        if (b.dead || b.fixed) continue;
        b.vy += this.g * b.grav * h;
        const sp = hypot(b.vx, b.vy); if (sp > b.maxSpeed) { b.vx *= b.maxSpeed / sp; b.vy *= b.maxSpeed / sp; }
        b.x += b.vx * h; b.y += b.vy * h; b.ang += b.w * h;
        if (b.tether) this.solveTether(b);
        if (!b.ghost) for (const s of this.shapes) if (!s.ghost && !(b.noBeam && s.kind === 'beam')) this.collide(b, s);
      }
      const B = this.bodies, n = B.length;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) this.bump(B[i], B[j]);
    }
    if (this.bodies.some((b) => b.dead)) this.bodies = this.bodies.filter((b) => !b.dead);
  },

  solveTether(b) {
    const t = b.tether, ax = t.ax !== undefined ? t.ax : t.shape.pts[t.i].x, ay = t.ay !== undefined ? t.ay : t.shape.pts[t.i].y;
    const dx = b.x - ax, dy = b.y - ay, d = hypot(dx, dy);
    if (d > t.len && d > 0.01) {
      const nx = dx / d, ny = dy / d;
      b.x = ax + nx * t.len; b.y = ay + ny * t.len;
      const vn = b.vx * nx + b.vy * ny;
      if (vn > 0) { b.vx -= vn * nx; b.vy -= vn * ny; }
    }
  },

  collide(b, s) {
    const R = b.r + s.r;
    if (b.x + R < s.minx || b.x - R > s.maxx || b.y + R < s.miny || b.y - R > s.maxy) return;
    const P = s.pts, n = P.length, m = s.closed ? n : n - 1;
    if (s.closed && s.contains(b.x, b.y)) {
      // swallowed (fast body, or the geometry moved onto it): shove out through the nearest face
      let bd = 1e18, bi = 0, bt = 0, bx = 0, by = 0;
      for (let i = 0; i < m; i++) {
        const a = P[i], c = P[(i + 1) % n], ex = c.x - a.x, ey = c.y - a.y, l2 = ex * ex + ey * ey || 1e-6;
        const t = clamp(((b.x - a.x) * ex + (b.y - a.y) * ey) / l2, 0, 1), qx = a.x + ex * t, qy = a.y + ey * t, d = (b.x - qx) ** 2 + (b.y - qy) ** 2;
        if (d < bd) { bd = d; bi = i; bt = t; bx = qx; by = qy; }
      }
      const d = Math.sqrt(bd) || 1e-4, nx = (bx - b.x) / d, ny = (by - b.y) / d;
      b.x = bx + nx * b.r; b.y = by + ny * b.r;
      this.respond(b, s, P[bi], P[(bi + 1) % n], bt, nx, ny);
      return;
    }
    for (let i = 0; i < m; i++) {
      const a = P[i], c = P[(i + 1) % n];
      if (b.x + R < (a.x < c.x ? a.x : c.x) || b.x - R > (a.x > c.x ? a.x : c.x) || b.y + R < (a.y < c.y ? a.y : c.y) || b.y - R > (a.y > c.y ? a.y : c.y)) continue;
      const ex = c.x - a.x, ey = c.y - a.y, l2 = ex * ex + ey * ey || 1e-6;
      const t = clamp(((b.x - a.x) * ex + (b.y - a.y) * ey) / l2, 0, 1), dx = b.x - (a.x + ex * t), dy = b.y - (a.y + ey * t), d2 = dx * dx + dy * dy;
      if (d2 >= R * R) continue;
      const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d;
      b.x += nx * (R - d); b.y += ny * (R - d);
      this.respond(b, s, a, c, t, nx, ny);
    }
  },

  respond(b, s, a, c, t, nx, ny) {
    const sx = a.sx + (c.sx - a.sx) * t, sy = a.sy + (c.sy - a.sy) * t;
    const rvx = b.vx - sx, rvy = b.vy - sy, vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      const e = -vn > 150 ? b.rest : 0, j = -(1 + e) * vn;
      b.vx += j * nx; b.vy += j * ny;
      const tx = -ny, ty = nx, vt = rvx * tx + rvy * ty, jt = clamp(-vt, -b.fric * j, b.fric * j);
      b.vx += jt * tx; b.vy += jt * ty;
      b.w = lerp(b.w, (vt + jt) / b.r, 0.5);
      if (-vn > 60 && b.onHit) b.onHit({ speed: -vn, nx, ny, x: b.x - nx * b.r, y: b.y - ny * b.r, shape: s });
    }
    b.touch = true;
    if (ny < -0.45) { b.grounded = true; b.gnx = nx; b.gny = ny; b.gsx = sx; b.gsy = sy; }
  },

  bump(a, b) {
    if (a.dead || b.dead || a.ghost || b.ghost) return;
    if (!(a.mask & b.cat) || !(b.mask & a.cat)) return;
    const dx = b.x - a.x, dy = b.y - a.y, R = a.r + b.r, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return;
    const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d, pen = R - d;
    if (a.soft && b.soft) { const p = pen * 0.15 * sign(dx || 1); a.vx -= p * 6; b.vx += p * 6; return; }
    const ia = a.fixed ? 0 : 1 / a.m, ib = b.fixed ? 0 : 1 / b.m, it = ia + ib || 1;
    a.x -= nx * pen * (ia / it); a.y -= ny * pen * (ia / it); b.x += nx * pen * (ib / it); b.y += ny * pen * (ib / it);
    const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vn < 0) {
      const j = (-(1 + 0.55) * vn) / it;
      a.vx -= j * nx * ia; a.vy -= j * ny * ia; b.vx += j * nx * ib; b.vy += j * ny * ib;
      if (-vn > 80) {
        const cx = a.x + nx * a.r, cy = a.y + ny * a.r;
        if (a.onBump) a.onBump(b, -vn, cx, cy);
        if (b.onBump) b.onBump(a, -vn, cx, cy);
      }
    }
  },

  // elastic thump: no permanent change, just sets the chain ringing
  kick(x, y, dx, dy, rad, vel) {
    for (const s of this.shapes) {
      if (x + rad < s.minx || x - rad > s.maxx || y + rad < s.miny || y - rad > s.maxy) continue;
      for (const p of s.pts) {
        const d = hypot(p.x - x, p.y - y); if (d > rad || !p.w) continue;
        const f = smooth(1 - d / rad) * p.w; p.vx += dx * vel * f; p.vy += dy * vel * f;
      }
      s.awake = 3;
    }
  },

  // plastic deformation: permanent. returns the "bill" amount for the damages screen.
  dent(x, y, dx, dy, rad, depth, vel) {
    let total = 0;
    for (const s of this.shapes) {
      if (x + rad < s.minx || x - rad > s.maxx || y + rad < s.miny || y - rad > s.maxy) continue;
      let amt = 0;
      if (s.kind === 'beam' && s.bend === 'hinge') amt = this.hinge(s, x, y, dx, dy, rad, depth);
      else {
        for (const p of s.pts) {
          const d = hypot(p.x - x, p.y - y); if (d > rad || !p.w) continue;
          const f = smooth(1 - d / rad) * p.w, a = (depth * f) / s.stiff;
          let nx = p.tx + dx * a, ny = p.ty + dy * a; const l = hypot(nx, ny);
          if (l > s.max) { nx *= s.max / l; ny *= s.max / l; }
          if (s.maxDown !== undefined && ny > s.maxDown) ny = s.maxDown;
          amt += hypot(nx - p.tx, ny - p.ty); p.tx = nx; p.ty = ny;
        }
      }
      if (amt > 0.5) {
        s.awake = 3; s.dented += amt;
        for (const p of s.pts) { const d = hypot(p.x - x, p.y - y); if (d < rad * 1.3 && p.w) { const f = smooth(1 - d / (rad * 1.3)) * p.w; p.vx += dx * vel * f; p.vy += dy * vel * f; } }
        const c = amt * s.m.cost * 0.12; this.bill[s.mat] = (this.bill[s.mat] || 0) + c; total += c;
      }
    }
    return total;
  },

  // cantilever beams fold about a plastic hinge just inboard of the blow
  hinge(s, x, y, dx, dy, rad, depth) {
    const P = s.pts, n = P.length;
    let k = -1, bd = (rad + s.r) ** 2;
    for (let i = 0; i < n; i++) { const d = (P[i].x - x) ** 2 + (P[i].y - y) ** 2; if (d < bd && P[i].w > 0) { bd = d; k = i; } }
    if (k < 0) return 0;
    let a = -1, b = -1; for (let i = 0; i < n; i++) if (P[i].w === 0) { if (a < 0) a = i; b = i; }
    if (a < 0) return 0;
    const dir = k > b ? 1 : k < a ? -1 : 0; if (!dir) return 0;
    const root = dir > 0 ? b : a, h = dir > 0 ? Math.max(root, k - 3) : Math.min(root, k + 3);
    const T = (i) => ({ x: P[i].rx + P[i].tx, y: P[i].ry + P[i].ty });
    const ph = T(h), pk = T(k), arm = Math.max(70, hypot(pk.x - ph.x, pk.y - ph.y));
    const tx = (pk.x - ph.x) / arm, ty = (pk.y - ph.y) / arm;
    let th = clamp((tx * dy - ty * dx) * (depth / arm) * 1.6, -0.5, 0.5);
    if (abs(s.bendSum + th * dir) > 1.25) th = (sign(s.bendSum + th * dir) * 1.25 - s.bendSum) * dir;
    if (abs(th) < 0.004) return 0;
    s.bendSum += th * dir;
    let amt = 0;
    for (let i = h + dir, c = 1; i >= 0 && i < n; i += dir, c++) {
      const q = T(i), w = th * smooth(c / 3), cs = cos(w), sn = sin(w), rx = q.x - ph.x, ry = q.y - ph.y;
      const nx = ph.x + rx * cs - ry * sn, ny = ph.y + rx * sn + ry * cs;
      amt += hypot(nx - q.x, ny - q.y) * 0.35;
      P[i].tx = nx - P[i].rx; P[i].ty = ny - P[i].ry;
    }
    return amt;
  },

  raycast(x0, y0, x1, y1, skip) {
    let best = 1, hit = null; const rx = x1 - x0, ry = y1 - y0;
    const lx = Math.min(x0, x1), hx = Math.max(x0, x1), ly = Math.min(y0, y1), hy = Math.max(y0, y1);
    for (const s of this.shapes) {
      if (s.ghost || s === skip || hx < s.minx || lx > s.maxx || hy < s.miny || ly > s.maxy) continue;
      const P = s.pts, n = P.length, m = s.closed ? n : n - 1;
      for (let i = 0; i < m; i++) {
        const a = P[i], c = P[(i + 1) % n], sx = c.x - a.x, sy = c.y - a.y, den = rx * sy - ry * sx;
        if (abs(den) < 1e-9) continue;
        const t = ((a.x - x0) * sy - (a.y - y0) * sx) / den, u = ((a.x - x0) * ry - (a.y - y0) * rx) / den;
        if (t >= 0 && t < best && u >= 0 && u <= 1) {
          best = t; const l = hypot(sx, sy) || 1; let nx = -sy / l, ny = sx / l;
          if (nx * rx + ny * ry > 0) { nx = -nx; ny = -ny; }
          hit = { x: x0 + rx * t, y: y0 + ry * t, nx, ny, shape: s, t };
        }
      }
    }
    return hit;
  },
  surfaceAt(x, y0, y1) {
    let s = y0;
    for (let k = 0; k < 4; k++) {
      if (this.shapes.some((sh) => sh.closed && !sh.ghost && x > sh.minx && x < sh.maxx && s > sh.miny && s < sh.maxy && sh.contains(x, s))) s -= 70; else break;
    }
    const h = this.raycast(x, s, x, y1); return h ? h.y : null;
  },
  groundBelow(x, y, max) { const h = this.raycast(x, y, x, y + (max || 400)); return h ? h.y : null; },
};
