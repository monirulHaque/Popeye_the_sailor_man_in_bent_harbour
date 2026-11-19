// ───────────────────────────── core: constants, math, palette, input
const W = 1280, H = 720, TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (a) => a[(Math.random() * a.length) | 0];
const hypot = Math.hypot, abs = Math.abs, sin = Math.sin, cos = Math.cos, sign = Math.sign;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const outBack = (t) => { const c = 2.2; t = clamp(t, 0, 1) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const outCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// Four-colour press palette: one paper, one ink, a handful of spot colours.
const C = {
  paper: '#efe2c0', paperDk: '#dccb9f', white: '#fbf6e4', ink: '#1d1a16',
  teal: '#2c6e73', tealLt: '#8dbcb0', sea: '#3d8589',
  red: '#c9442c', redDk: '#8f2c1c', mustard: '#e2a52c', cream: '#f4dc9a',
  green: '#4c9a3b', greenLt: '#a4d466', wood: '#c9995a', woodDk: '#9a6d3a',
  steel: '#8b9a9c', steelDk: '#566769', navy: '#2a4560', brick: '#b8573d', skin: '#f0b98a', skin2: '#e3a06f',
};
const FONT = {
  sfx: '"Luckiest Guy", Impact, "Arial Black", sans-serif',
  sign: '"Holtwood One SC", Rockwell, "Rockwell Extra Bold", Georgia, serif',
  cap: '"Mouse Memoirs", "Arial Narrow", "Helvetica Neue Condensed", Impact, sans-serif',
  type: '"Special Elite", "Courier New", Courier, monospace',
};

const Store = {
  get(k, d) { try { const v = localStorage.getItem('bentharbor.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bentharbor.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};

// ───────────────────────────── input (keyboard + gamepad + touch)
const Input = (() => {
  const keys = new Set();
  const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyZ', 'KeyX', 'Enter', 'Escape', 'KeyP', 'KeyM']);
  const st = { x: 0, y: 0, jump: false, punch: false, jumpP: false, punchP: false, punchR: false, pauseP: false, confirmP: false, muteP: false, upP: false, downP: false, leftP: false, rightP: false, any: false };
  const prev = {};
  const touch = { x: 0, y: 0, jump: false, punch: false, pause: false, active: false };
  let onGesture = null, padSeen = false;
  addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    keys.add(e.code);
    if (onGesture) onGesture();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  const k = (...c) => c.some((x) => keys.has(x));
  function poll() {
    let x = 0, y = 0;
    if (k('ArrowLeft', 'KeyA')) x -= 1;
    if (k('ArrowRight', 'KeyD')) x += 1;
    if (k('ArrowUp', 'KeyW')) y -= 1;
    if (k('ArrowDown', 'KeyS')) y += 1;
    let jump = k('Space', 'KeyK', 'KeyX'), punch = k('KeyJ', 'KeyZ');
    let pause = k('Escape', 'KeyP'), confirm = k('Enter', 'Space', 'KeyJ', 'KeyZ'), mute = k('KeyM');
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      padSeen = true;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      if (abs(ax) > 0.35) x += sign(ax);
      if (abs(ay) > 0.45) y += sign(ay);
      if (b(14)) x -= 1; if (b(15)) x += 1; if (b(12)) y -= 1; if (b(13)) y += 1;
      if (b(0)) { jump = true; confirm = true; }
      if (b(2) || b(1) || b(5) || b(7)) punch = true;
      if (b(2)) confirm = true;
      if (b(9)) pause = true;
      if ((b(0) || b(2) || b(9)) && onGesture) onGesture();
      break;
    }
    if (touch.active) {
      if (abs(touch.x) > 0.3) x += sign(touch.x);
      if (abs(touch.y) > 0.5) y += sign(touch.y);
      jump = jump || touch.jump; punch = punch || touch.punch; pause = pause || touch.pause;
      confirm = confirm || touch.punch || touch.jump;
    }
    x = clamp(x, -1, 1); y = clamp(y, -1, 1);
    const cur = { jump, punch, pause, confirm, mute, up: y < 0, down: y > 0, left: x < 0, right: x > 0 };
    st.x = x; st.y = y; st.jump = jump; st.punch = punch;
    st.jumpP = jump && !prev.jump; st.punchP = punch && !prev.punch; st.punchR = !punch && !!prev.punch;
    st.pauseP = pause && !prev.pause; st.confirmP = confirm && !prev.confirm; st.muteP = mute && !prev.mute;
    st.upP = cur.up && !prev.up; st.downP = cur.down && !prev.down; st.leftP = cur.left && !prev.left; st.rightP = cur.right && !prev.right;
    Object.assign(prev, cur);
    touch.pause = false;
  }
  return { st, poll, touch, keys, setGesture(fn) { onGesture = fn; }, get padSeen() { return padSeen; }, gesture() { if (onGesture) onGesture(); } };
})();
