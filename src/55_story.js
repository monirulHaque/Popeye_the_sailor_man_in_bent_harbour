// ───────────────────────────── comic-page prologues, one before each strip
// Original stories set in the world of the 1929 strip: Castor Oyl's leaky ship,
// his sister Olive, and a one-eyed sailor hired off the docks.

// Barnacle Bragg, owner of Bragg Haulage: top hat, walrus moustache, monocle, a belly full of other people's money.
STYLE.bragg = {
  shirt: '#2a2622', sleeve: '#2a2622', sleeveDk: '#1c1915', pants: '#7d7f78', pantsDk: '#62645e', skin: '#eab08a', shoe: C.ink,
  legW: 7, armW: 7, torsoW: 21, fist: 7.6, hip: 22, torsoL: 28, neck: 10,
  deco(hx, hy, sx, sy) {
    X.fillStyle = C.mustard; X.fillRect(hx - 9, sy - 2, 18, hy - sy + 2);
    X.strokeStyle = C.ink; X.lineWidth = 1.4; X.strokeRect(hx - 9, sy - 2, 18, hy - sy + 2);
    X.strokeStyle = C.cream; X.lineWidth = 1.6; X.beginPath(); X.moveTo(hx - 8, hy - 14); X.quadraticCurveTo(hx, hy - 6, hx + 8, hy - 14); X.stroke();
    X.fillStyle = C.ink; for (let i = 0; i < 3; i++) { X.beginPath(); X.arc(hx, sy + 6 + i * 7, 1.4, 0, TAU); X.fill(); }
  },
  head(expr) {
    ink(circ(-9, 1, 3.4), '#d69a74', 2.2);
    ink(ell(1, 1, 11, 12), '#eab08a', 2.6);
    ink(ell(9.5, -0.5, 4.6, 4), C.red, 2.2);                                   // a nose that has seen a lot of port
    // walrus moustache
    const m = new Path2D(); m.moveTo(-2, 4); m.quadraticCurveTo(6, 1, 15, 4.6); m.quadraticCurveTo(14, 12, 9, 9.4); m.quadraticCurveTo(6, 13, 3, 9.4); m.quadraticCurveTo(-1, 12, -2, 4); m.closePath();
    ink(m, '#d6d2c4', 2.2);
    if (expr === 'laugh') { X.lineWidth = 2; X.strokeStyle = C.ink; X.beginPath(); X.arc(2.5, -4, 2.4, Math.PI * 1.1, Math.PI * 1.9); X.stroke(); X.beginPath(); X.arc(8, -5, 2, Math.PI * 1.1, Math.PI * 1.9); X.stroke(); }
    else {
      X.fillStyle = C.ink; X.beginPath(); X.arc(3, -4, 1.6, 0, TAU); X.fill();
      ink(circ(8, -4.6, 3.4), 'rgba(220,240,240,.6)', 1.6, false); X.fillStyle = C.ink; X.beginPath(); X.arc(8.4, -4.4, 1.3, 0, TAU); X.fill();   // monocle
      line([[11, -2], [12.5, 6]], 0.9, C.mustard);
      line([[-1, -8], [5, expr === 'mad' ? -6 : -8.4]], 2.4);
    }
    line([[12, 7.4], [22, 4]], 4.4); line([[12, 7.4], [22, 4]], 2, C.woodDk);   // cigar
    // top hat
    ink(rrect(-9.5, -27, 19, 18, 1.5), C.ink, 2.2); X.fillStyle = C.red; X.fillRect(-9, -14, 18, 3.4);
    line([[-15, -9.5], [15, -10.5]], 3.6);
  },
};

const STORIES = [
  { title: 'IN WHICH A SAILOR IS HIRED', theme: 'morning', panels: [
    { bg: 'shed', cap: 'The waterfront, 1929. Castor Oyl has bought a leaky ship on credit and must find a sailor by sundown.',
      actors: [{ who: 'olive', x: 330, pose: 'read' }], props: [{ type: 'notice', x: 400, y: 120, text: ['SAILOR WANTED', 'NO EXPERIENCE', 'NO QUESTIONS'] }],
      say: [{ a: 0, text: 'Brother says to hire the first sailor who walks by. Any sailor at all!', dx: -150 }] },
    { bg: 'pier', cap: 'One walked by.',
      actors: [{ who: 'olive', x: 150, pose: 'point' }, { who: 'popeye', x: 420, pose: 'walk', flip: true }],
      say: [{ a: 0, text: 'You there! Are you a sailor?', dx: 30 }, { a: 1, text: 'Lady, I been a sailor since before the sea was wet.', dx: -50 }] },
    { bg: 'shed', cap: 'But Pier Nine belongs to Bragg Haulage, and Bragg’s boys take a toll from anyone who works it.',
      actors: [{ who: 'rat', x: 100, pose: 'mad' }, { who: 'rat', x: 185, pose: 'fists' }, { who: 'popeye', x: 470, pose: 'stand', flip: true }],
      say: [{ a: 0, text: 'New sailors pay double. Cough it up!', dx: 20 }, { a: 2, text: 'The only coin I carries is knuckles.', dx: -70 }] },
    { bg: 'pier', cap: 'So the sailor’s first job began before he had even signed on.',
      actors: [{ who: 'olive', x: 110, pose: 'scared' }, { who: 'popeye', x: 300, pose: 'fists' }, { who: 'rat', x: 500, pose: 'fists', flip: true }],
      say: [{ a: 1, text: 'Stand behind me, Miss Oyl. This won’t take long.', dx: 20 }] },
  ] },
  { title: 'IN WHICH THE CARGO IS STOLEN', theme: 'sunset', panels: [
    { bg: 'pier', cap: 'At dusk a rusty steamer tied up at the end of the pier, low in the water and smelling of fish.',
      actors: [{ who: 'olive', x: 170, pose: 'point' }, { who: 'popeye', x: 360, pose: 'stand' }], props: [{ type: 'steamer', x: 470 }],
      say: [{ a: 0, text: 'Those are Mr. Haddock’s fish crates! Stolen last week!', dx: 40 }, { a: 1, text: 'Then I’ll un-steal ’em.', dx: 20 }] },
    { bg: 'crane', cap: 'High over the harbor, in the cab of his crane, Barnacle Bragg was watching.',
      actors: [{ who: 'bragg', x: 220, pose: 'scope' }],
      say: [{ a: 0, text: 'A one-eyed sailor, knocking my boys into the drink? Bad for business.', dx: 170 }] },
    { bg: 'deck', cap: 'The crew of the S.S. Bilgewater did not care for visitors.',
      actors: [{ who: 'chucker', x: 130, pose: 'mad' }, { who: 'rat', x: 220, pose: 'fists' }, { who: 'popeye', x: 440, pose: 'fist', flip: true }],
      say: [{ a: 0, text: 'Nobody boards without a ticket!', dx: 40 }, { a: 2, text: 'I brung me own ticket.', dx: -40 }] },
    { bg: 'deck', cap: 'Olive came too. Nobody could have stopped her.',
      actors: [{ who: 'popeye', x: 220, pose: 'stand' }, { who: 'olive', x: 380, pose: 'can', flip: true }],
      say: [{ a: 1, text: 'I packed spinach, in case you get peckish.', dx: -30 }, { a: 0, text: 'Good thinkin’, Olive.', dx: -20 }] },
  ] },
  { title: 'IN WHICH THE LANDLORD COLLECTS', theme: 'storm', panels: [
    { bg: 'storm', cap: 'That night a storm rolled in, and Bragg’s men came for the one thing the sailor cared about.',
      actors: [{ who: 'rat', x: 220, pose: 'carry' }, { who: 'rat', x: 330, pose: 'carry' }, { who: 'olive', x: 330, y: -84, pose: 'carried', rot: -1.45 }],
      say: [{ a: 2, text: 'Put me down, you overgrown barnacles!', dx: 0 }] },
    { bg: 'gantry', cap: 'They hung her from the gantry, forty feet above the pier.',
      actors: [{ who: 'olive', x: 170, y: -64, pose: 'scared', net: true }, { who: 'bragg', x: 430, pose: 'laugh', flip: true }],
      say: [{ a: 1, text: 'Come and get her, sailor! The view is lovely from up there!', dx: -60 }] },
    { bg: 'storm', cap: 'Popeye had one can of spinach left.',
      actors: [{ who: 'popeye', x: 290, pose: 'can' }],
      say: [{ a: 0, text: 'Nobody hangs Olive Oyl out to dry.', dx: 30 }] },
    { bg: 'crane', cap: 'The tallest crane. The meanest landlord on the waterfront. The last strip.',
      actors: [{ who: 'bragg', x: 240, pose: 'laugh' }],
      say: [{ a: 0, text: 'Let him come! I own this harbor!', dx: 160 }], storm: true },
  ] },
];

const STORY_SCALE = { popeye: 1.5, olive: 1.35, rat: 1.4, bruiser: 1.7, chucker: 1.35, plank: 1.45, bragg: 1.45 };
const STORY_HEAD = { popeye: 84, olive: 98, rat: 74, bruiser: 72, chucker: 74, plank: 72, bragg: 82 };

function wrapText(text, maxW, size, font) {
  X.font = `${size}px ${font}`; const out = []; let cur = '';
  for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (X.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}
function storyPose(name, who, t) {
  const tall = who === 'olive', base = tall ? { lf: [-5, 0], rf: [5, 0], lh: [-9, -44 + sin(t * 2) * 1.2], rh: [10, -45] } : { lf: [-7, 0], rf: [7, 0], lh: [-12, -27 + sin(t * 2.4)], rh: [13, -28] };
  const p = Object.assign({ lean: 0.04, bob: 0, expr: '' }, base);
  const ph = t * 7;
  switch (name) {
    case 'walk': p.lf = [-5 + cos(ph) * 10, -Math.max(0, sin(ph)) * 7]; p.rf = [5 - cos(ph) * 10, -Math.max(0, -sin(ph)) * 7]; p.lh = [-10 - cos(ph) * 9, -28]; p.rh = [12 + cos(ph) * 9, -29]; p.bob = -abs(sin(ph)) * 2; p.lean = 0.12; p.puff = (t * 0.6) % 1; break;
    case 'read': p.rh = [8, -70]; p.lh = [14, -60]; p.expr = ''; break;
    case 'point': p.rh = [38, -74]; p.expr = 'cheer'; break;
    case 'scared': p.expr = tall ? 'scared' : 'ow'; p.lh = [-14, tall ? -88 : -52]; p.rh = [14, tall ? -90 : -54]; if (tall) { p.lh[1] += sin(t * 20) * 3; p.rh[1] += cos(t * 20) * 3; } break;
    case 'fists': p.lh = [18, -40]; p.rh = [26, -44]; p.fistL = p.fistR = 1.3; p.expr = who === 'popeye' ? 'grit' : 'mad'; p.lean = -0.05; p.bob = sin(t * 6) * 1; break;
    case 'fist': p.rh = [30, -56]; p.fistR = 1.8; p.bendR = -4; p.expr = 'grit'; break;
    case 'mad': p.lh = [-14, -30]; p.rh = [30, -36]; p.fistR = 1.3; p.expr = 'mad'; p.lean = 0.12; break;
    case 'carry': p.lh = [-4, -62]; p.rh = [8, -64]; p.lean = 0.18; p.expr = 'mad'; p.lf = [-5 + cos(ph) * 7, -Math.max(0, sin(ph)) * 5]; p.rf = [5 - cos(ph) * 7, -Math.max(0, -sin(ph)) * 5]; break;
    case 'carried': p.expr = 'scared'; p.lh = [-14, -88]; p.rh = [14, -90]; p.lf = [-8 + sin(t * 18) * 8, -6]; p.rf = [8 - sin(t * 18) * 8, -10]; p.skirtK = 0.8; break;
    case 'can': p.rh = [22, tall ? -58 : -40]; p.expr = who === 'popeye' ? 'grit' : 'cheer'; break;
    case 'scope': p.rh = [26, -60]; p.lh = [18, -56]; p.lean = -0.05; break;
    case 'laugh': p.lh = [-10, -22]; p.rh = [12, -24]; p.expr = 'laugh'; p.lean = -0.12; p.bob = abs(sin(t * 9)) * -2; p.tilt = -0.15; break;
  }
  return p;
}
function storyBg(kind, th, w, h, t) {
  const gy = h - 44;
  const sky = (a) => { X.fillStyle = th.sky; X.fillRect(0, 0, w, h); X.fillStyle = Pat.dots(th.dots, 2.6, 9); X.fillRect(0, 0, w, h * (a || 0.6)); };
  const sea = (y) => { X.fillStyle = th.sea; X.fillRect(0, y, w, h - y); line([[0, y], [w, y]], 2); X.strokeStyle = C.ink; X.lineWidth = 1.6; for (let i = 0; i < 7; i++) { const x = (i * 97 + t * 14) % (w + 40) - 20, yy = y + 12 + (i % 3) * 12; X.beginPath(); X.moveTo(x, yy); X.quadraticCurveTo(x + 10, yy - 4, x + 20, yy); X.stroke(); } };
  const deck = () => { ink(rrect(-10, gy, w + 20, 70, 0), C.wood, 3); for (let x = 30; x < w; x += 60) line([[x, gy], [x, gy + 10]], 1.4); X.fillStyle = Pat.lines('rgba(29,26,22,.18)', 1.2, 9); X.fillRect(0, gy, w, 50); };
  if (kind === 'pier' || kind === 'shed') {
    sky(0.55); ink(circ(w - 90, 70, 34), th.sun, 2.6);
    X.fillStyle = th.far; [[40, 50, 60], [120, 40, 90], [260, 60, 50], [380, 30, 70]].forEach(([x, bw, bh]) => X.fillRect(x, h * 0.55 - bh, bw, bh));
    sea(h * 0.55); deck();
    if (kind === 'shed') {
      ink(poly([[-10, gy], [-10, gy - 150], [270, gy - 150], [270, gy]]), C.cream, 3); X.save(); X.clip(poly([[-10, gy], [-10, gy - 150], [270, gy - 150], [270, gy]])); X.fillStyle = Pat.lines('rgba(29,26,22,.12)', 1.2, 10); X.fillRect(0, gy - 150, 280, 150); X.restore();
      ink(poly([[-20, gy - 146], [10, gy - 186], [70, gy - 146], [100, gy - 186], [160, gy - 146], [190, gy - 186], [250, gy - 146], [280, gy - 146]]), C.red, 3);
      ink(rrect(30, gy - 92, 54, 92, 2), '#2a2622', 3);
    }
  } else if (kind === 'deck') {
    sky(0.6); ink(circ(90, 80, 40), th.sun, 2.6); sea(h * 0.5);
    ink(rrect(-10, gy - 10, w + 20, 80, 0), '#23262b', 3); ink(rrect(-10, gy - 10, w + 20, 12, 0), C.wood, 2.4);
    line([[0, gy - 46], [w, gy - 46]], 3); for (let x = 20; x < w; x += 46) line([[x, gy - 46], [x, gy - 10]], 2.2);
    ink(poly([[w - 120, gy - 10], [w - 112, gy - 200], [w - 50, gy - 200], [w - 42, gy - 10]]), C.red, 3); ink(rrect(w - 116, gy - 200, 70, 26, 2), C.ink, 0);
  } else if (kind === 'storm' || kind === 'gantry') {
    sky(0.7); paintRainLocal(w, h, t); sea(h * 0.55); deck();
    X.fillStyle = 'rgba(29,26,22,.18)'; X.fillRect(0, 0, w, h);
    if (kind === 'gantry') { ink(rrect(-10, 20, w + 20, 22, 0), C.red, 3); const z = []; for (let x = 0; x < w; x += 22) z.push([x, (x / 22) % 2 ? 22 : 40]); line(z, 2); ink(rrect(w - 90, 40, 34, gy - 40, 0), C.red, 3); }
  } else if (kind === 'crane') {
    sky(0.8); if (th.rain) paintRainLocal(w, h, t);
    ink(rrect(-10, -10, w + 20, h + 20, 0), '#3a2e26', 0);     // inside the cab
    ink(rrect(60, 30, w - 120, h - 110, 8), th.sky, 4);
    X.save(); X.clip(rrect(60, 30, w - 120, h - 110, 8)); X.fillStyle = Pat.dots(th.dots, 2.6, 9); X.fillRect(0, 0, w, h); X.fillStyle = th.far; [[80, 60, 70], [170, 40, 100], [300, 70, 60], [420, 40, 90]].forEach(([x, bw, bh]) => X.fillRect(x, h - 80 - bh, bw, bh)); X.fillStyle = th.sea; X.fillRect(0, h - 80, w, 80); if (th.rain) paintRainLocal(w, h, t); X.restore();
    line([[w / 2, 30], [w / 2, h - 80]], 4); ink(rrect(-10, gy - 4, w + 20, 60, 0), '#2a2622', 3);
    ink(rrect(w - 140, gy - 50, 14, 50, 2), C.steel, 2.4); ink(circ(w - 133, gy - 54, 8), C.red, 2.4); ink(rrect(w - 100, gy - 40, 14, 40, 2), C.steel, 2.4); ink(circ(w - 93, gy - 44, 8), C.mustard, 2.4);
  }
}
function paintRainLocal(w, h, t) {
  X.strokeStyle = 'rgba(29,26,22,.4)'; X.lineWidth = 1.5; X.beginPath();
  for (let i = 0; i < 40; i++) { const x = ((i * 137 + t * 300) % (w + 60)) - 30, y = ((i * 89 + t * 900) % (h + 40)) - 20; X.moveTo(x, y); X.lineTo(x - 8, y + 24); }
  X.stroke();
}
function storyProp(pr, gy, t) {
  if (pr.type === 'notice') {
    const x = pr.x, y = pr.y, bw = 168, bh = 92;
    line([[x + 26, y + bh], [x + 26, gy]], 6); line([[x + bw - 26, y + bh], [x + bw - 26, gy]], 6);
    ink(rrect(x, y, bw, bh, 3), C.white, 3);
    pr.text.forEach((s, i) => { let size = i ? 15 : 18; while (size > 9 && textW(s, size, FONT.sign) > bw - 18) size -= 0.5; label(s, x + bw / 2, y + 22 + i * 25, size, i ? C.ink : C.red, FONT.sign, 'center'); });
  } else if (pr.type === 'steamer') {
    const x = pr.x, y = gy - 30; ink(poly([[x, y - 30], [x + 200, y - 30], [x + 200, y + 40], [x + 30, y + 40]]), '#23262b', 3); ink(rrect(x + 70, y - 100, 40, 70, 2), C.red, 3);
    label('BILGEWATER', x + 115, y - 8, 16, C.cream, FONT.sign, 'center');
    for (let i = 0; i < 3; i++) ink(rrect(x + 130 + i * 4, y - 66 + i * 20, 46, 18, 2), C.wood, 2);
    X.fillStyle = 'rgba(239,226,192,.8)'; for (let i = 0; i < 3; i++) { X.beginPath(); X.arc(x + 90 + i * 14 + sin(t + i) * 4, y - 110 - i * 18, 8 + i * 3, 0, TAU); X.fill(); }
  }
}
function storyBalloon(x, y, lines, tx, ty, k) {
  const size = 21, lh = 23, w = Math.max(...lines.map((l) => textW(l, size))) + 34, h = lines.length * lh + 18;
  X.save(); X.translate(x, y); X.scale(k, k); X.translate(-x, -y);
  const box = new Path2D(); box.ellipse(x, y, w / 2 + 8, h / 2 + 6, 0, 0, TAU);
  const ang = Math.atan2(ty - y, tx - x), bx = x + cos(ang) * (w / 2 - 4) * 0.8, by = y + sin(ang) * (h / 2) * 0.8, nx = -sin(ang) * 9, ny = cos(ang) * 9;
  const tail = poly([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]]);
  ink(tail, C.white, 2.4); ink(box, C.white, 2.6); X.fillStyle = C.white; X.fill(poly([[bx + nx * 0.7, by + ny * 0.7], [lerp(bx, tx, 0.3), lerp(by, ty, 0.3)], [bx - nx * 0.7, by - ny * 0.7]]));
  lines.forEach((l, i) => label(l, x, y - (lines.length - 1) * lh / 2 + i * lh + 1, size, C.ink, FONT.cap, 'center'));
  X.restore();
}
function drawStoryPanel(st, pn, x, y, w, h, t, k) {
  const th = THEME[st.theme], gy = h - 44;
  X.save(); X.translate(x, y);
  const frame = rrect(0, 0, w, h, 2);
  X.save(); X.clip(frame);
  storyBg(pn.bg, th, w, h, t);
  if (pn.storm) paintRainLocal(w, h, t);
  for (const pr of pn.props || []) storyProp(pr, gy, t);
  const heads = [];
  pn.actors.forEach((a) => {
    const s = STORY_SCALE[a.who], ay = gy + (a.y || 0), p = storyPose(a.pose, a.who, t + a.x * 0.01);
    X.save(); X.translate(a.x, ay); if (a.rot) X.rotate(a.rot); X.scale((a.flip ? -1 : 1) * s, s);
    rig(STYLE[a.who], p, t); X.restore();
    if (a.pose === 'can') { const hx = a.x + (a.flip ? -1 : 1) * p.rh[0] * s, hy = ay + p.rh[1] * s - 14; drawCan(hx, hy, 1.1); }
    if (a.pose === 'scope') { X.save(); X.translate(a.x + 30 * s, ay - 62 * s); X.rotate(-0.25); ink(rrect(0, -6, 70, 12, 3), C.mustard, 2.4); ink(rrect(60, -8, 16, 16, 2), C.steel, 2.2); X.restore(); }
    if (a.net) { const nx = a.x, top = ay - 150, bot = ay + 14; line([[nx, -10], [nx, top]], 3); const net = new Path2D(); net.moveTo(nx, top); net.quadraticCurveTo(nx - 60, ay - 60, nx - 36, bot); net.quadraticCurveTo(nx, bot + 18, nx + 36, bot); net.quadraticCurveTo(nx + 60, ay - 60, nx, top); X.lineWidth = 2.2; X.strokeStyle = C.ink; X.stroke(net); X.save(); X.clip(net); X.globalAlpha = 0.7; X.beginPath(); for (let i = -8; i <= 8; i++) { X.moveTo(nx + i * 12 - 90, top); X.lineTo(nx + i * 12 + 90, bot + 30); X.moveTo(nx + i * 12 + 90, top); X.lineTo(nx + i * 12 - 90, bot + 30); } X.stroke(); X.restore(); }
    const hh = STORY_HEAD[a.who] * s;
    heads.push(a.rot ? [a.x + sin(a.rot) * hh * 0.85, ay - cos(a.rot) * hh * 0.85] : [a.x + (a.flip ? -1 : 1) * 8 * s, ay - hh]);
  });
  // narration box
  const capLines = wrapText(pn.cap, w - 40, 17, FONT.type), ch = capLines.length * 20 + 14;
  ink(rrect(8, 8, Math.min(w - 16, Math.max(...capLines.map((l) => textW(l, 17, FONT.type))) + 24), ch, 2), C.cream, 2.4);
  capLines.forEach((l, i) => label(l, 20, 8 + 17 + i * 20, 17, C.ink, FONT.type));
  // balloons, one after the other
  // place every balloon first (so later ones dodge earlier ones), then draw them in turn
  // try a handful of spots per balloon and keep the one that hides no face and no earlier balloon
  const placed = [], top = ch + 16;
  const area = (a, b) => Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + 8) * Math.max(0, Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2) + 6);
  (pn.say || []).forEach((sb) => {
    const [hx, hy] = heads[sb.a], lines = wrapText(sb.text, 200, 21, FONT.cap), bh = lines.length * 23 + 22, bw = Math.max(...lines.map((l) => textW(l, 21))) + 50;
    let best = null;
    for (const ox of [sb.dx || 0, 0, -(bw / 2 + 24), bw / 2 + 24, -(bw * 0.8 + 30), bw * 0.8 + 30]) for (const oy of [0, 26, 52, 80]) {
      const r = { x: clamp(hx + ox, bw / 2 + 12, w - bw / 2 - 12), y: clamp(Math.max(hy - 30 - bh / 2 + (sb.dy || 0) + oy, top + bh / 2), top + bh / 2, h - bh / 2 - 10), w: bw, h: bh, lines, hx, hy };
      let pen = abs(ox - (sb.dx || 0)) * 0.08 + oy * 0.4;
      for (const q of placed) pen += area(r, q) > 0 ? 3000 + area(r, q) : 0;
      for (const [fx, fy] of heads) if (abs(fx - r.x) < bw / 2 + 22 && fy + 56 > r.y - bh / 2 && fy - 4 < r.y + bh / 2) pen += 5000;   // covers a face (head top down to the chin)
      if (!best || pen < best.pen) best = Object.assign(r, { pen });
    }
    placed.push(best);
  });
  placed.forEach((r, i) => { const kk = clamp((k - 0.25 - i * 0.55) * 3, 0, 1); if (kk > 0) storyBalloon(r.x, r.y, r.lines, r.hx, r.hy - 4, outBack(kk)); });
  X.restore();
  X.lineWidth = 4; X.strokeStyle = C.ink; X.stroke(frame);
  X.restore();
}
