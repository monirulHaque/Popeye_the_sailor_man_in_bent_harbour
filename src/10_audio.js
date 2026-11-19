// ───────────────────────────── audio: synthesised SFX + a little dockside band
// All tunes are traditional (public domain). Hornpipe settings follow
// Ryan's Mammoth Collection (1883); "Drunken Sailor" is the usual capstan shanty.
const Sfx = (() => {
  let ac = null, master, sfx, music, leadBus, noiseBuf;
  const vol = { music: Store.get('vMusic', 0.6), sfx: Store.get('vSfx', 0.85) };
  let muted = Store.get('muted', false);
  const last = {};
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
    master.connect(comp); comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.connect(master);
    music = ac.createGain(); music.connect(master);
    leadBus = ac.createBiquadFilter(); leadBus.type = 'lowpass'; leadBus.frequency.value = 2600; leadBus.Q.value = 0.6;
    leadBus.connect(music);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVol();
    setInterval(tick, 25);
  }
  function applyVol() {
    if (!ac) return;
    master.gain.value = muted ? 0 : 1;
    sfx.gain.value = vol.sfx; music.gain.value = vol.music * 0.5;
  }
  function tone(type, f0, f1, t, dur, peak, dest, att) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (att || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function hiss(t, dur, peak, type, f0, f1, q, dest, att) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type || 'lowpass';
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    f.Q.value = q || 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (att || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  // rate-limit so pile-ups don't turn into a wall of noise
  function ok(name, gap) {
    if (!ac) return false;
    const t = ac.currentTime;
    if (last[name] && t - last[name] < (gap || 0.04)) return false;
    last[name] = t; return true;
  }
  const P = {
    punch(p = 1) {
      if (!ok('punch', 0.03)) return; const t = ac.currentTime, v = clamp(0.35 + p * 0.25, 0.3, 1);
      tone('sine', 190 + 40 * p, 48, t, 0.16 + 0.04 * p, 0.9 * v);
      hiss(t, 0.07 + 0.03 * p, 0.8 * v, 'lowpass', 2600, 500, 0.7);
      tone('square', 110, 60, t, 0.06, 0.25 * v);
      if (p > 1.5) { hiss(t, 0.3, 0.5, 'bandpass', 900, 200, 0.6); tone('sawtooth', 70, 35, t, 0.3, 0.5); }
    },
    whoosh(p = 1) { if (!ok('whoosh', 0.05)) return; const t = ac.currentTime; hiss(t, 0.14, 0.22 * p, 'bandpass', 500, 2400, 1.4, null, 0.05); },
    wind(c) { if (!ok('wind', 0.11)) return; const t = ac.currentTime; tone('triangle', 300 + c * 420, 340 + c * 500, t, 0.1, 0.12, null, 0.02); },
    wood(v = 1) {
      if (!ok('wood', 0.05)) return; const t = ac.currentTime; v = clamp(v, 0.15, 1);
      tone('sine', 230, 120, t, 0.09, 0.7 * v); tone('triangle', 520, 300, t, 0.05, 0.3 * v);
      hiss(t, 0.05, 0.4 * v, 'bandpass', 1100, 600, 2);
    },
    metal(v = 1, low) {
      if (!ok('metal', 0.06)) return; const t = ac.currentTime; v = clamp(v, 0.15, 1);
      const f = (low ? 95 : 250) * rand(0.92, 1.1), dur = low ? 1.1 : 0.6;
      [1, 2.76, 5.4, 8.93].forEach((r, i) => tone(i ? 'sine' : 'triangle', f * r, f * r * 0.995, t, dur / (1 + i * 0.6), (0.4 * v) / (1 + i * 0.7)));
      hiss(t, 0.04, 0.35 * v, 'highpass', 2500, 0, 0.7);
    },
    crumple(v = 1) {
      if (!ok('crumple', 0.09)) return; const t = ac.currentTime; v = clamp(v, 0.2, 1);
      tone('sawtooth', 130, 42, t, 0.42, 0.3 * v, null, 0.02);
      tone('square', 61, 38, t + 0.03, 0.5, 0.22 * v, null, 0.03);
      hiss(t, 0.35, 0.3 * v, 'bandpass', 1800, 240, 3, null, 0.02);
    },
    creak() { if (!ok('creak', 0.2)) return; const t = ac.currentTime; hiss(t, 0.4, 0.2, 'bandpass', 500, 900, 14, null, 0.1); tone('sawtooth', 95, 140, t, 0.4, 0.07, null, 0.1); },
    bell() {
      if (!ok('bell', 0.3)) return; const t = ac.currentTime, f = 620;
      [1, 2.0, 2.98, 4.2, 5.43].forEach((r, i) => tone('sine', f * r, f * r, t, 2.2 / (1 + i * 0.5), 0.34 / (1 + i)));
      tone('square', f * 2, f * 2, t, 0.03, 0.2);
    },
    splash(v = 1) {
      if (!ok('splash', 0.08)) return; const t = ac.currentTime;
      hiss(t, 0.5, 0.6 * v, 'bandpass', 2400, 350, 0.7, null, 0.02);
      tone('sine', 150, 55, t, 0.25, 0.5 * v); hiss(t + 0.1, 0.6, 0.2 * v, 'highpass', 4000, 0, 0.5, null, 0.1);
    },
    hurt() { if (!ok('hurt', 0.1)) return; const t = ac.currentTime; tone('square', 520, 140, t, 0.22, 0.3); tone('sawtooth', 260, 70, t, 0.22, 0.25); hiss(t, 0.1, 0.5, 'lowpass', 1800, 400); },
    ko() { if (!ok('ko', 0.12)) return; const t = ac.currentTime; tone('sine', 1500, 320, t, 0.55, 0.22, null, 0.03); tone('triangle', 1504, 322, t, 0.55, 0.1, null, 0.03); },
    launch(p = 1) { if (!ok('launch', 0.1)) return; const t = ac.currentTime; tone('sine', 380, 1500 + 500 * p, t, 0.32, 0.2, null, 0.03); },
    boing(v = 1) {
      if (!ok('boing', 0.09)) return; const t = ac.currentTime;
      const o = tone('sine', 110, 190, t, 0.45, 0.3 * clamp(v, 0.2, 1), null, 0.01);
      const l = ac.createOscillator(), g = ac.createGain(); l.frequency.value = 22; g.gain.value = 40;
      l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t + 0.5);
    },
    glass() { if (!ok('glass', 0.05)) return; const t = ac.currentTime; hiss(t, 0.22, 0.45, 'highpass', 5200, 0, 1); [2100, 3300, 4700].forEach((f, i) => tone('sine', f * rand(0.9, 1.1), f, t + i * 0.012, 0.12, 0.12)); },
    foomp() { if (!ok('foomp', 0.2)) return; const t = ac.currentTime; tone('sine', 75, 240, t, 0.2, 0.9, null, 0.01); hiss(t, 0.45, 0.7, 'lowpass', 500, 3000, 0.8, null, 0.03); },
    toot() {
      if (!ok('toot', 0.5)) return; const t = ac.currentTime;
      [[0, 0.16], [0.21, 0.42]].forEach(([d, len]) => {
        [932, 1109].forEach((f) => { const o = tone('sawtooth', f * 0.97, f, t + d, len, 0.14, null, 0.02); o.detune.value = rand(-6, 6); });
        hiss(t + d, len, 0.14, 'bandpass', 3200, 3400, 3, null, 0.02);
      });
      [58, 62, 65, 70, 74, 77, 82].forEach((m, i) => tone('square', mtof(m + 12), mtof(m + 12), t + 0.62 + i * 0.045, 0.14, 0.11));
    },
    powerdown() { if (!ok('pd', 0.5)) return; const t = ac.currentTime; tone('sawtooth', 700, 120, t, 0.6, 0.16, null, 0.03); },
    can() { if (!ok('can', 0.1)) return; const t = ac.currentTime; tone('square', 1200, 1250, t, 0.04, 0.2); tone('triangle', 500, 220, t + 0.02, 0.1, 0.3); },
    blip(hi) { if (!ok('blip', 0.03)) return; const t = ac.currentTime; tone('square', hi ? 880 : 620, hi ? 1320 : 620, t, 0.07, 0.13); },
    stamp() { if (!ok('stamp', 0.06)) return; const t = ac.currentTime; tone('sine', 140, 60, t, 0.12, 0.7); hiss(t, 0.05, 0.4, 'lowpass', 1500, 300); },
    coin() { if (!ok('coin', 0.05)) return; const t = ac.currentTime; tone('square', 1319, 1319, t, 0.06, 0.1); tone('square', 1760, 1760, t + 0.06, 0.16, 0.1); },
    gull() { if (!ok('gull', 0.6)) return; const t = ac.currentTime; [0, 0.17, 0.33].forEach((d) => tone('sawtooth', 1500, 1050, t + d, 0.13, 0.05, null, 0.02)); },
    thunder() { if (!ok('thunder', 1)) return; const t = ac.currentTime; hiss(t, 2.2, 0.55, 'lowpass', 400, 60, 0.6, null, 0.04); tone('sine', 60, 30, t, 1.2, 0.5, null, 0.02); },
    whistle() { if (!ok('whistle', 0.4)) return; const t = ac.currentTime; tone('sine', 1900, 2500, t, 0.5, 0.12, null, 0.05); },
    step() { if (!ok('step', 0.12)) return; const t = ac.currentTime; hiss(t, 0.035, 0.1, 'bandpass', 700, 400, 1.5); },
    chain(n) { if (!ok('chain', 0.03)) return; const t = ac.currentTime; const m = 70 + [0, 2, 4, 7, 9, 12, 14, 16, 19][clamp(n, 0, 8)]; tone('triangle', mtof(m), mtof(m), t, 0.12, 0.16); },
  };

  // ── tune book
  function parseABC(s, keyAcc) {
    const out = [], base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let i = 0, barAcc = {};
    while (i < s.length) {
      let ch = s[i];
      if (ch === '|') { barAcc = {}; i++; continue; }
      let acc = null;
      if (ch === '^' || ch === '_' || ch === '=') { acc = ch === '^' ? 1 : ch === '_' ? -1 : 0; ch = s[++i]; }
      const up = ch ? ch.toUpperCase() : '';
      if (base[up] !== undefined || ch === 'z') {
        let midi = null; i++;
        if (ch !== 'z') {
          let oct = ch === up ? 60 : 72;
          while (s[i] === "'") { oct += 12; i++; }
          while (s[i] === ',') { oct -= 12; i++; }
          if (acc !== null) barAcc[up] = acc;
          midi = oct + base[up] + (barAcc[up] !== undefined ? barAcc[up] : keyAcc[up] || 0);
        }
        let num = ''; while (s[i] >= '0' && s[i] <= '9') num += s[i++];
        out.push({ m: midi, d: num ? +num : 1 });
        continue;
      }
      i++;
    }
    return out;
  }
  function chord(name) {
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let r = base[name[0]], q = name.slice(1);
    if (q[0] === 'b') { r--; q = q.slice(1); } else if (q[0] === '#') { r++; q = q.slice(1); }
    return { root: r, minor: q[0] === 'm' };
  }
  function mkTune(o) {
    const steps = [], chords = [];
    let pos = 0;
    for (const sec of o.form) {
      const part = o.parts[sec];
      for (const n of parseABC(part.abc, o.key)) { if (n.m !== null) (steps[pos] = steps[pos] || []).push(n); pos += n.d; }
      for (const c of part.ch) { const [a, b] = c.split('/'); chords.push([chord(a), chord(b || a)]); }
    }
    return { steps, chords, len: pos, pickup: o.pickup, bpm: o.bpm, swing: o.swing || 0, shift: o.shift || 0 };
  }
  const Bb = { B: -1, E: -1 }, F = { B: -1 }, D = { F: 1, C: 1 };
  const TUNES = {
    // The Sailor's Hornpipe (a.k.a. College Hornpipe)
    sailor: mkTune({ key: Bb, pickup: 2, bpm: 96, swing: 0.14, form: 'AABB', parts: {
      A: { abc: 'dc|B2B,2B,2 FE|DF B2B2 dB|c2C2C2 cB|AFAc f2ga|bagf gfed|edcB BAGF|GBAc Bdce|d2B2B2', ch: ['Bb', 'Bb', 'Cm', 'F', 'Bb/Eb', 'Cm/F', 'Eb/F', 'Bb'] },
      B: { abc: 'FE|DFBF DFBF|G2E2E2 GF|=EGcG EGBG|A2F2F2 ed|e2g2 gfed|edcB BAGF|GBAc Bdce|d2B2B2', ch: ['Bb', 'Eb', 'C', 'F', 'Eb', 'Cm/F', 'Eb/F', 'Bb'] } } }),
    fisher: mkTune({ key: F, pickup: 2, bpm: 100, swing: 0.12, form: 'AABB', parts: {
      A: { abc: 'c2|fcAc BdcB|AcAc BdcB|AFAF BGBG|AFAF G2c2|fcAc BdcB|AcAc BdcB|ABcd efge|f2f2f2', ch: ['F', 'F', 'F/Gm', 'F/C', 'F', 'F', 'F/C', 'F'] },
      B: { abc: 'ef|gece gebg|afcf afba|gece gebg|gfed c2Bc|dBFB dBfd|cAFA cAfc|dgfe dBAG|F2F2F2', ch: ['C', 'F', 'C', 'C', 'Bb', 'F', 'Gm/C', 'F'] } } }),
    liverpool: mkTune({ key: D, pickup: 2, bpm: 84, swing: 0.16, form: 'AABB', parts: {
      A: { abc: 'A2|FDFA dfaf|gefd dcBA|GBGB FAFA|EFGA GFED|FDFA dfaf|gefd dcBA|afdf gecA|d2d2d2', ch: ['D', 'Em/A', 'G/D', 'A', 'D', 'Em/A', 'D/A', 'D'] },
      B: { abc: 'A2|dfdf cece|BdBd BAGF|GBGB FAFA|EFGA GFED|FDFA dfaf|gefd dcBA|afdf gecA|d2d2d2', ch: ['D/A', 'G', 'G/D', 'A', 'D', 'Em/A', 'D/A', 'D'] } } }),
    drunken: mkTune({ key: {}, pickup: 0, bpm: 108, swing: 0, form: 'AABB', parts: {
      A: { abc: 'A2AA A2AA|A2D2 F2A2|G2GG G2GG|G2C2 E2G2|A2AA A2AA|A2B2 c2d2|c2A2 G2E2|D4 D4', ch: ['Dm', 'Dm', 'C', 'C', 'Dm', 'Dm', 'C', 'Dm'] },
      B: { abc: 'A4 A3A|A2D2 F2A2|G4 G3G|G2C2 E2G2|A4 A3A|A2B2 c2d2|c2A2 G2E2|D4 D4', ch: ['Dm', 'Dm', 'C', 'C', 'Dm', 'Dm', 'C', 'Dm'] } } }),
  };

  // ── arranger: every pass through a tune gets a different arrangement
  const MAJ = [0, 2, 4, 5, 7, 9, 11], DOR = [0, 2, 3, 5, 7, 9, 10];
  const INFO = { sailor: { tonic: 10, scale: MAJ }, fisher: { tonic: 5, scale: MAJ }, liverpool: { tonic: 2, scale: MAJ }, drunken: { tonic: 2, scale: DOR, minor: true } };
  for (const k in INFO) Object.assign(TUNES[k], INFO[k]);
  // name, lead voice, harmony, octave, rate, minor, drum pattern, ornaments
  const ARR = [
    { name: 'concertina', lead: 'reed', harm: false, oct: 0, rate: 1, drum: 'march' },
    { name: 'harmony', lead: 'reed', harm: 'whistle', oct: 0, rate: 1, drum: 'march' },
    { name: 'calliope', lead: 'calliope', harm: false, oct: 1, rate: 1.04, drum: 'oompah' },
    { name: 'minor', lead: 'reed', harm: 'reed', oct: 0, rate: 0.94, minor: true, drum: 'toms' },
    { name: 'jig', lead: 'whistle', harm: false, oct: 1, rate: 1.08, drum: 'shuffle', orn: true },
    { name: 'breakdown', lead: 'banjo', harm: false, oct: 0, rate: 1, drum: 'shuffle', orn: true },
  ];
  let cur = null, curName = '', stepIdx = 0, nextT = 0, mode = { drums: true, bass: true, picc: false, rate: 1, oct: 0 }, saved = null;
  let pass = 0, arr = ARR[0], intensity = 0, passOffset = 0;
  const relPc = (m, tonic) => (((m - tonic) % 12) + 12) % 12;
  function toMinor(m, tu) { if (tu.minor) return m; const r = relPc(m, tu.tonic); return r === 4 || r === 9 ? m - 1 : m; }
  function third(m, tu) {
    const sc = tu.scale, pc = relPc(m, tu.tonic), i = sc.indexOf(pc);
    if (i < 0) return null;
    return m - (((pc - sc[(i + 5) % 7]) % 12) + 12) % 12;
  }
  function chordMinor(ch, tu) {
    if (tu.minor) return ch;
    const r = relPc(ch.root, tu.tonic);
    if (r === 0 || r === 5) return { root: ch.root, minor: true };
    if (r === 9) return { root: ch.root - 1, minor: false };
    return ch;
  }
  function env(g, t, v, dur, att, rel) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att);
    g.gain.setValueAtTime(v, t + Math.max(att + 0.005, dur - rel)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  }
  function osc(type, f, det, lv, g, t, dur) { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = lv; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.03); return o; }
  function voice(kind, m, t, dur, v) {
    const f = mtof(m), g = ac.createGain(); g.connect(leadBus);
    if (kind === 'reed') { env(g, t, v, dur, 0.012, 0.03); osc('square', f, 0, 0.5, g, t, dur); osc('sawtooth', f, 9, 0.5, g, t, dur); osc('sawtooth', f, -1195, 0.25, g, t, dur); }
    else if (kind === 'calliope') {
      env(g, t, v * 0.9, dur * 0.7, 0.006, 0.04);
      const a = osc('square', f, -8, 0.45, g, t, dur), b = osc('square', f, 8, 0.45, g, t, dur); osc('sine', f * 2, 0, 0.4, g, t, dur);
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 6.5; lg.gain.value = 14; l.connect(lg); lg.connect(a.detune); lg.connect(b.detune); l.start(t); l.stop(t + dur + 0.03);
    } else if (kind === 'whistle') {
      env(g, t, v * 1.1, dur, 0.02, 0.04); const a = osc('sine', f, 0, 0.8, g, t, dur); osc('triangle', f, 4, 0.35, g, t, dur);
      a.detune.setValueAtTime(-30, t); a.detune.linearRampToValueAtTime(0, t + 0.04);
    } else if (kind === 'banjo') {
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 1.2, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.5, dur + 0.25));
      osc('triangle', f, 0, 0.7, g, t, 0.55); osc('square', f * 2, 3, 0.18, g, t, 0.3);
    }
  }
  function drums(style, p, bar, t, unit) {
    const kick = (v) => tone('sine', 130, 45, t, 0.12, v, music), hat = (v, d) => hiss(t, d || 0.05, v, 'highpass', 6000, 0, 0.7, music);
    const snare = (v) => { hiss(t, 0.11, v, 'bandpass', 1900, 1400, 0.8, music); tone('triangle', 210, 160, t, 0.07, v * 0.5, music); };
    const tom = (f, v) => tone('sine', f, f * 0.55, t, 0.2, v, music);
    if (style === 'march') { if (p === 0 || p === 4) kick(p ? 0.4 : 0.6); if (p === 2 || p === 6) hat(0.16); }
    else if (style === 'oompah') { if (p === 0 || p === 4) kick(0.55); if (p === 2 || p === 6) { hat(0.13); hiss(t, 0.03, 0.1, 'bandpass', 3200, 0, 2, music); } }
    else if (style === 'toms') { if (p === 0) kick(0.65); if (p === 4) tom(110, 0.45); if (p === 6) tom(90, 0.35); if (p % 2 === 1) hat(0.06, 0.03); }
    else if (style === 'shuffle') { if (p === 0 || p === 4) kick(0.5); if (p === 2 || p === 6) snare(0.14); if (p % 2 === 1) hat(0.08, 0.03); }
    // intensity rides on top of whatever the arrangement is doing
    if (intensity > 0.35 && p % 2 === 1) hat(0.05 + intensity * 0.05, 0.025);
    if (intensity > 0.6 && (p === 2 || p === 6)) snare(0.1 + intensity * 0.1);
    if (intensity > 0.45 && bar % 8 === 7 && p >= 4) snare(0.12 + (p - 4) * 0.04);
  }
  function scheduleStep(i, t, unit) {
    const tu = cur, local = i % tu.len, mel = tu.steps[local];
    if (local === 0 && i > 0) { pass++; arr = mode.fixed ? ARR[mode.fixed] : ARR[(pass + passOffset) % ARR.length]; }
    const A = mode.fixed !== undefined ? ARR[mode.fixed] : arr, minor = A.minor || mode.minor;
    const leadKind = mode.lead || A.lead, oct = mode.oct + (mode.calm ? 0 : A.oct);
    if (mel) for (const n of mel) {
      let m = n.m + tu.shift; if (minor) m = toMinor(m, tu);
      const len = n.d * unit;
      if (A.orn && n.d >= 2 && !mode.calm) {   // a quick grace note from the scale step above
        const up = tu.scale.map((s) => (tu.tonic + s) % 12).map((pc) => ((pc - (m % 12)) + 12) % 12).filter((d) => d > 0).sort((a, b) => a - b)[0] || 2;
        voice(leadKind, m + up + 12 * oct, t, len * 0.25, 0.15); voice(leadKind, m + 12 * oct, t + len * 0.25, len * 0.7, 0.2);
      } else voice(leadKind, m + 12 * oct, t, len * 0.92, mode.calm ? 0.15 : 0.2);
      if (A.harm && !mode.calm) { const h = third(m, tu); if (h !== null) voice(A.harm, h + 12 * oct - (A.harm === 'whistle' ? 0 : 12), t, len * 0.9, 0.1); }
      if (mode.picc) tone('sine', mtof(m + 24), mtof(m + 24), t, Math.min(0.2, len), 0.1, music, 0.008);
    }
    const a = (((i - tu.pickup) % tu.len) + tu.len) % tu.len, bar = Math.floor(a / 8), p = a % 8, pair = tu.chords[bar % tu.chords.length];
    let ch = pair[p < 4 ? 0 : 1]; if (minor) ch = chordMinor(ch, tu);
    if (mode.bass && (p === 0 || p === 4)) {
      const fifth = p === 4 && pair[0] === pair[1] ? 7 : 0, m = 36 + ((((ch.root + fifth) % 12) + 12) % 12);
      tone('triangle', mtof(m), mtof(m), t, unit * 2.6, 0.5, music, 0.012);
      tone('sine', mtof(m - 12), mtof(m - 12), t, unit * 2.2, 0.3, music, 0.012);
    }
    if (mode.bass && (A.drum === 'oompah' ? p % 2 === 0 && p % 4 !== 0 : p === 2 || p === 6)) {
      [0, ch.minor ? 3 : 4, 7].forEach((iv) => { const m = 60 + ((((ch.root + iv) % 12) + 12) % 12); tone('square', mtof(m), mtof(m), t, unit * 0.9, 0.045, music, 0.004); });
    }
    if (mode.bass && A.lead === 'banjo' && p % 2 === 1) { const m = 55 + ((((ch.root + (p % 4 === 1 ? 4 - (ch.minor ? 1 : 0) : 7)) % 12) + 12) % 12); tone('triangle', mtof(m), mtof(m), t, unit * 0.8, 0.07, music, 0.003); }
    if (mode.drums) drums(mode.picc ? 'shuffle' : A.drum, p, bar, t, unit);
    if (mode.picc && p % 2 === 1) hiss(t, 0.025, 0.07, 'highpass', 8000, 0, 0.7, music);
  }
  function tick() {
    if (!ac || !cur || ac.state !== 'running') return;
    if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.16) {
      const A = mode.fixed !== undefined ? ARR[mode.fixed] : arr, unit = 60 / (cur.bpm * mode.rate * (mode.calm ? 1 : A.rate) * (1 + intensity * 0.06)) / 4;
      scheduleStep(stepIdx, nextT, unit);
      nextT += unit * (stepIdx % 2 === 0 ? 1 + cur.swing : 1 - cur.swing);
      stepIdx++;
    }
  }
  function play(name, m) {
    const want = Object.assign({ drums: true, bass: true, picc: false, rate: 1, oct: 0 }, m || {});
    if (curName === name && JSON.stringify(want) === JSON.stringify(mode)) return;
    const same = curName === name;
    curName = name; cur = TUNES[name] || null; mode = want;
    if (!same) { stepIdx = 0; pass = 0; passOffset = want.start || 0; arr = ARR[passOffset % ARR.length]; if (ac) nextT = ac.currentTime + 0.12; }
  }
  return Object.assign(P, {
    init, play, stop() { cur = null; curName = ''; },
    // spinach time: the hornpipe breaks into a sprint, piccolo on top
    spinach(on) {
      if (on) { if (!saved) saved = { name: curName, mode: Object.assign({}, mode) }; play('sailor', { rate: 1.42, picc: true, oct: 0, fixed: 0 }); if (ac) { const t = ac.currentTime; for (let i = 0; i < 6; i++) hiss(t + i * 0.03, 0.03, 0.2, 'bandpass', 1900, 0, 0.8, music); } }
      else if (saved) { const s = saved; saved = null; play(s.name, s.mode); }
    },
    get muted() { return muted; },
    toggleMute() { muted = !muted; Store.set('muted', muted); applyVol(); return muted; },
    vol, setVol(k, v) { vol[k] = clamp(v, 0, 1); Store.set(k === 'music' ? 'vMusic' : 'vSfx', vol[k]); applyVol(); },
    get ready() { return !!ac; }, tunes: TUNES, arrangements: ARR,
    setIntensity(v) { intensity = clamp(v, 0, 1); },
    get arrangement() { return (mode.fixed !== undefined ? ARR[mode.fixed] : arr).name; },
  });
})();
