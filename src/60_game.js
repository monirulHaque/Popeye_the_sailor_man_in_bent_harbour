// ───────────────────────────── game: rules, scoring, flow, HUD, screens
const PAY = { hit: 10, ricochet: 25, strike: 60, drink: 150, bell: 250, spout: 200, return: 120, panel: 200 };
const FILL = { hit: 0.022, ricochet: 0.034, strike: 0.06, drink: 0.05, bell: 0.08, spout: 0.08, return: 0.06, panel: 0.05 };
const RANKS = [[0, 'DECKHAND'], [8000, 'ABLE SEAMAN'], [18000, 'BOSUN'], [32000, 'SKIPPER'], [50000, 'TERROR OF THE WATERFRONT']];
const rankOf = (n) => RANKS.filter((r) => n >= r[0]).pop()[1];
const anchorOf = (w) => (w instanceof Boss ? [w.x, w.cabY - 46] : [w.b.x, w.b.y - w.b.r - (w.cfg ? 58 * w.cfg.s : 82)]);

Object.assign(G, {
  mode: 'boot', time: 0, clock: 0, enemies: [], props: [], player: null, stage: null, stageIdx: 0, cam: { x: 0 }, shakeAmt: 0, zoom: 1, hitstopT: 0, slowT: 0, slowK: 1,
  score: 0, total: 0, cats: {}, chain: 0, chainT: 0, bestChain: 0, mult: 1, multPulse: 0, meter: 0, canOut: false, gullT: 0, gull: null, hurtFlash: 0, stats: {},
  banner: null, hintQ: [], hint: null, menu: 0, sc: 1, unlocked: Store.get('unlocked', 0), best: Store.get('best', 0), seen: {}, diffIdx: Store.get('diff', 1),

  // ── feel
  gate(k, gap) { const g = this.gates || (this.gates = {}); if (g[k] !== undefined && this.clock - g[k] < gap) return false; g[k] = this.clock; return true; },
  hitstop(s) { this.hitstopT = Math.max(this.hitstopT, s); },
  shake(a) { this.shakeAmt = Math.min(26, Math.max(this.shakeAmt, a)); },
  slow(k, dur) { this.slowK = k; this.slowT = dur; },
  say(text, life, size) { this.banner = { text, t: 0, life: life || 1.5, size: size || 96 }; },
  tip(id, text, dur) { if (this.seen[id]) return; this.seen[id] = 1; this.hintQ.push({ text, dur: dur || 6 }); },
  punchFx(x, y, power, flinch, quiet) {
    if (flinch) { FX.burst(x, y, 24, C.white); Sfx.punch(0.6); FX.stamp('TUNK!', x, y - 30, 26, C.steel); this.hitstop(0.03); this.tip('armor', 'THE BIG LUGS SHRUG OFF JABS — WIND UP A TWISTER (HOLD ' + this.keyName('punch') + ') OR BANK SOMEBODY INTO THEM', 7); return; }
    const big = power > 1.3;
    FX.burst(x, y, 26 + power * 16, big ? C.mustard : C.white); FX.stars(x, y, (3 + power * 2) | 0, 260 + power * 120);
    if (!quiet) { Sfx.punch(power); this.hitstop(power > 2 ? 0.14 : big ? 0.09 : 0.045); }
    this.shake(3 + power * 4); if (big) this.zoom = 1 + Math.min(0.05, power * 0.015);
    FX.stamp(pick(big ? WORDS.hay : WORDS.jab), x + rand(-10, 10), y - 34 - power * 8, 26 + power * 14, big ? C.red : C.mustard, power > 1.9 ? { burst: C.cream } : null);
  },
  // ── scoring
  add(amt, cat) { amt = Math.round(amt); this.score += amt; this.cats[cat] = (this.cats[cat] || 0) + amt; },
  popup(amt, x, y) { FX.stamp(money(amt), x, y - 26, 24, C.cream, { rot: 0, life: 0.85, vy: -70 }); },
  chainUp() {
    this.chain++; this.chainT = 2.8; if (this.chain > this.bestChain) this.bestChain = this.chain;
    const m = 1 + Math.min(5, Math.floor(this.chain / 8));
    if (m > this.mult) { this.mult = m; this.multPulse = 1; Sfx.chain(m); }
  },
  breakChain() { this.chain = 0; this.mult = 1; this.chainT = 0; },
  feed(type) { if (!this.player.super && !this.canOut && this.gullT <= 0) this.meter = Math.min(1, this.meter + FILL[type] * D().fill); },
  event(type, d) {
    this.chainUp(); const amt = PAY[type] * this.mult;
    this.add(amt, type === 'hit' ? 'hit' : type === 'drink' || type === 'panel' ? 'drink' : 'trick'); this.feed(type);
    if (amt >= 100) this.popup(amt, d.x, d.y);
  },
  ricochet(e, h) {
    if (this.time - e.lastRic < 0.07) return; e.lastRic = this.time;
    const sp = h.speed, mat = h.shape.mat, hard = mat === 'steel' || mat === 'hull' || mat === 'ink';
    e.bounces++; e.sq = 1; const d = Math.max(0, sp - 260) / 58; e.hp -= d; e.dmg += d;
    hard ? Sfx.metal(sp / 1300, mat === 'hull') : Sfx.wood(sp / 1100);
    hard ? FX.sparks(h.x, h.y, h.nx, h.ny, 5) : FX.chips(h.x, h.y, h.nx, h.ny, 4, mat === 'brick' ? C.brick : C.wood, 300);
    FX.puff(h.x, h.y, 3, 100, 7);
    if (sp > 620 && this.gate('ric', 0.16)) { FX.stamp(pick(WORDS[mat] || WORDS.wood), h.x + h.nx * 30, h.y + h.ny * 30 - 10, clamp(sp / 26, 24, 52), hard ? C.teal : C.mustard); this.shake(clamp(sp / 180, 2, 10)); if (sp > 1100) { this.hitstop(0.04); Sfx.boing(0.5); } }
    World.kick(h.x, h.y, -h.nx, -h.ny, 86, sp * 0.3);
    if (e.super || (e.cfg.heavy && sp > 700)) { const amt = World.dent(h.x, h.y, -h.nx, -h.ny, 60 + e.b.r, clamp(sp / 24, 8, 50) * (e.super ? 1 : 0.5), sp * 0.25); this.bend(amt, h.x, h.y, mat, true); }
    if (mat === 'ink') this.tip('border', 'YES, THAT WAS THE EDGE OF THE PANEL.', 4);
    this.event('ricochet', { x: h.x, y: h.y });
    if (e.hp <= 0 && e.state !== 'ko') e.ko();
  },
  onKO(e) {
    if (this.olive) this.olive.cheer();
    this.stats.kos++; const amt = e.cfg.pay * this.mult; this.add(amt, 'ko'); this.chainUp(); this.feed('strike'); Sfx.ko(); this.popup(amt, e.b.x, e.b.y - 30);
    if (e.bounces >= 3) FX.stamp('GRAND TOUR!', e.b.x, e.b.y - 80, 44, C.teal, { burst: C.cream, life: 1.1 });
    else if (e.bounces === 2) FX.stamp('DOUBLE BANK!', e.b.x, e.b.y - 80, 38, C.teal, { life: 1 });
    else if (e.bounces === 1) FX.stamp('BANK SHOT!', e.b.x, e.b.y - 80, 34, C.teal, { life: 1 });
    if (e.bounces >= 1) this.add(e.bounces * 75 * this.mult, 'trick');
    const left = this.enemies.filter((o) => !o.gone && o.state !== 'ko').length;
    if (!left && !this.queue.length && !this.stage.boss) { this.slow(0.25, 0.7); this.zoom = 1.06; }
    if (Math.random() < 0.22) FX.say(this.player, pick(['WHO’S NEXT?', 'MIND THE STEP!', 'ONE-WAY TICKET TO THE BRINY!', 'THAT’S FER SCUFFIN’ ME DECK!', 'G’NIGHT, MATEY!']), 1.3);
    if (this.stage.id === 0) this.tip('aim', 'HOLD ↑ WHEN YOU PUNCH FOR AN UPPERCUT · HOLD ' + this.keyName('punch') + ' TO WIND UP A TWISTER', 7);
  },
  splash(x, k) { Sfx.splash(k || 1); FX.drops(x, World.waterY, 16 * (k || 1), 640); FX.ring(x, World.waterY, 10, 70, 0.4, C.white, 5); },
  dunk(e) {
    this.splash(e.b.x); this.stats.dunks++; if (e.state !== 'ko') { e.hp = 0; e.state = 'ko'; this.onKO(e); }
    this.event('drink', { x: e.b.x, y: World.waterY - 30 }); FX.stamp('IN THE DRINK!', clamp(e.b.x, this.cam.x + 160, this.cam.x + W - 160), World.waterY - 80, 42, C.teal, { burst: C.white, life: 1.1 }); e.remove();
  },
  outOfPanel(e) {
    if (e.state !== 'ko') { e.hp = 0; e.state = 'ko'; this.onKO(e); }
    const x = clamp(e.b.x, this.cam.x + 200, this.cam.x + W - 200), y = clamp(e.b.y, 120, 520);
    this.event('panel', { x, y }); FX.stamp('CLEAN OUT OF THE PANEL!', x, y, 36, C.red, { burst: C.cream, life: 1.2 }); e.remove();
  },
  bend(amt, x, y, mat, quiet) {
    if (amt < 0.5) return; const d = amt * 4 * this.mult; this.add(d, 'm:' + mat); this.stats.bends++;
    Sfx.crumple(clamp(amt / 30, 0.4, 1)); this.shake(clamp(amt / 4, 4, 14));
    mat === 'wood' || mat === 'brick' ? FX.chips(x, y, 0, -1, 8, mat === 'brick' ? C.brick : C.wood, 520) : FX.sparks(x, y, 0, -1, 9);
    if ((!quiet || amt > 14) && this.gate('bend', 0.3)) FX.stamp(pick(WORDS.bend), x, y - 46, clamp(26 + amt * 0.8, 30, 56), C.green, { burst: C.greenLt });
    if (d > 60 && this.gate('bendpop', 0.2)) this.popup(d, x, y - 70);
    if (this.stage.onBend) this.stage.onBend(amt, x, y, mat);
  },
  shock(x, y, rad, vy, vx, dmg, sup, mode) {
    for (const e of this.enemies) {
      if (!e.hittable || e.hidden) continue;
      const dx = e.b.x - x, d = hypot(dx, e.b.y - y); if (d > rad + e.b.r) continue;
      if (mode !== 2 && abs(e.b.y + e.b.r - y) > 100) continue;
      const k = 1 - (d / (rad + e.b.r)) * 0.5;
      if (mode === 2) e.takeHit(dmg, sign(dx || 1) * 460 * k, vy * k, {});
      else if (mode === 3) { if (!e.live) e.takeHit(3, sign(dx || 1) * 320, vy * k, { super: true }); }
      else { e.takeHit(dmg, sign(dx || 1) * 280 * k + vx, vy * k, { super: sup }); this.event('hit', { x: e.b.x, y: e.b.y }); }
    }
    if (mode === 2) return;
    for (const p of this.props) if (p instanceof Barrel && hypot(p.b.x - x, p.b.y - y) < rad + 30) { p.b.vy = vy * 0.8; p.b.vx += sign(p.b.x - x || 1) * 160 + vx; p.b.y -= 3; p.hot = 3; p.super = sup; }
  },
  throwBottle(e, n) {
    const P = this.player, sx = e.b.x + e.face * 12, sy = e.b.y - 40;
    for (let i = 0; i < (n || 1); i++) {
      const T = 0.8 + i * 0.16, lead = i === 1 ? 0.6 : i === 2 ? -0.2 : 0.3, dx = P.b.x + P.b.vx * lead - sx, dy = P.b.y - 12 - sy;
      this.props.push(new Bottle(sx, sy, dx / T, (dy - 0.5 * World.g * T * T) / T));
    }
    Sfx.whoosh(0.8);
  },
  blockFx(x, y, e) {
    FX.burst(x, y, 22, C.steel); Sfx.wood(0.8); Sfx.punch(0.4); this.hitstop(0.05); this.shake(4);
    FX.stamp(e.kind === 'plank' ? 'TUNK!' : 'BLOCKED!', x, y - 34, 30, C.steel);
    this.tip(e.kind === 'plank' ? 'plank' : 'block', e.kind === 'plank' ? 'HE’S HIDING BEHIND THAT PLANK: UPPERCUT (↑ + ' + this.keyName('punch') + '), DIVE-BOMB, OR HIT HIM FROM BEHIND. HAYMAKERS SPLIT IT.' : 'HE BLOCKED YOUR JAB. WIND UP A HAYMAKER, UPPERCUT, OR GET ROUND THE BACK OF HIM.', 7);
  },
  kidnapped(e, ol) {
    const P = this.player; e.remove(); ol.lose(); this.splash(e.b.x, 1);
    FX.stamp('SHANGHAIED!', clamp(e.b.x, this.cam.x + 180, this.cam.x + W - 180), 300, 64, C.red, { burst: C.cream, life: 1.6 });
    this.breakChain(); this.meter = Math.max(0, this.meter - 0.35); this.hurtFlash = 0.3; Sfx.hurt(); this.shake(10);
    if (!P.super && !P.dead) { P.hp -= 1; if (P.hp <= 0) { P.dead = true; this.playerDown(); } }
    this.tip('olive', 'DON’T LET THEM CARRY OLIVE OFF! ONE PUNCH MAKES THEM DROP HER.', 7);
  },
  spawn(kind, key, role) {
    const s = this.stage.spawns[key], e = new Enemy(kind, s.x + rand(-12, 12), s.y, { vx: s.vx, vy: s.vy, ghost: s.ghost, perch: s.perch, role });
    if (role === 'grab') this.tip('grab', 'A TOUGH WITH A YELLOW “!” IS AFTER OLIVE. STOP HIM BEFORE HE REACHES THE EDGE.', 7);
    this.enemies.push(e);
    if (s.fx === 'splash') this.splash(s.x, 0.6); else FX.puff(s.x, s.y, 7, 150, 11);
    if (s.fx === 'door') Sfx.wood(0.7);
    if (kind === 'bruiser') this.tip('bruiser', 'HE CHARGES IN A STRAIGHT LINE. STAND BY THE EDGE AND STEP ASIDE.', 6);
    if (kind === 'chucker') this.tip('chucker', 'PUNCH A FLYING BOTTLE TO SEND IT BACK WHERE IT CAME FROM', 6);
    return e;
  },
  keyName(k) { return Input.touch.active ? { punch: 'SOCK', jump: 'JUMP' }[k] : Input.padSeen ? { punch: 'Ⓧ', jump: 'Ⓐ' }[k] : { punch: 'J', jump: 'SPACE' }[k]; },

  // ── flow
  loadStage(i) {
    World.reset(); FX.reset(); this.enemies = []; this.props = []; this.stageIdx = i;
    this.stage = STAGES[i](); this.player = new Player(this.stage.start.x, this.stage.start.y);
    Object.assign(this, { score: 0, cats: {}, chain: 0, chainT: 0, bestChain: 0, mult: 1, meter: i ? 0.35 : 0, canOut: false, gullT: 0, gull: null, waveIdx: -1, queue: [], waveClock: 0, between: 1.6, cleared: false, clearT: 0, overT: 0, time: 0, hint: null, hintQ: [], banner: null, hitstopT: 0, slowT: 0, shakeAmt: 0, zoom: 1, hurtFlash: 0 });
    this.stats = { kos: 0, dunks: 0, bends: 0 };
    this.olive = this.stage.olive ? new Olive(this.stage.olive.x, this.stage.olive.y, this.stage.olive) : null;
    this.cam.x = clamp(this.player.b.x - W / 2, 0, this.stage.width - W);
    this.mode = 'card'; this.cardT = 0; Sfx.stop();
  },
  startPlay() {
    this.mode = 'play'; Sfx.play(this.stage.music, this.stage.id === 2 ? { oct: -1, start: 3 } : { start: this.stage.id * 2 });
    if (this.stage.id === 0) this.tip('move', Input.touch.active ? 'STICK TO MOVE AND AIM · JUMP AND SOCK ARE ON THE RIGHT' : 'A / D TO MOVE · ' + this.keyName('jump') + ' TO JUMP · ' + this.keyName('punch') + ' TO SOCK ’EM', 8);
    if (this.stage.id === 1) this.tip('spout', 'KNOCK A TOUGH DOWN THE SHIP’S FUNNEL AND SEE WHAT COMES OUT', 7);
    if (this.stage.id === 2) this.tip('boss', 'BANK TOUGHS AND BARRELS UP INTO THE CAB — OR EAT YOUR SPINACH AND UPPERCUT THE WRECKING BALL HOME', 9);
  },
  playerDown() { this.slow(0.25, 1.4); this.overT = 1.9; this.say('KNOCKED FLAT!', 1.8, 90); Sfx.spinach(false); Sfx.stop(); Sfx.ko(); },
  bossDown() { if (this.olive) this.olive.free_(); this.stageClear(); },
  stageClear() {
    if (this.cleared) return; this.cleared = true; this.clearT = 2.6; this.say(this.stage.boss ? 'HARBOR’S YOURS!' : 'STRIP CLEARED!', 2.4, 92); this.slow(0.4, 0.8);
    Sfx.spinach(false); Sfx.stop(); Sfx.toot();
  },
  toBill() {
    this.mode = 'bill'; this.billT = 0; this.total += this.score; Sfx.play('liverpool', { drums: false });
    if (this.stageIdx + 1 > this.unlocked) { this.unlocked = Math.min(STAGES.length - 1, this.stageIdx + 1); Store.set('unlocked', this.unlocked); }
    const L = [];
    for (const k of Object.keys(this.cats)) if (k.startsWith('m:')) L.push([MAT[k.slice(2)].label, this.cats[k]]);
    if (this.cats.ko) L.push(['Henchmen flattened  × ' + this.stats.kos, this.cats.ko]);
    if (this.cats.drink) L.push(['Laundry: toughs sent swimming or clean out of the panel', this.cats.drink]);
    if (this.cats.trick) L.push(['Bank shots, bells and sundry trick work', this.cats.trick]);
    if (this.cats.hit) L.push(['Socks, bops and wallops, assorted', this.cats.hit]);
    this.billLines = L; this.billShown = 0;
    if (this.stageIdx === STAGES.length - 1 && this.total > this.best) { this.best = this.total; Store.set('best', this.best); this.newBest = true; }
  },

  tick(dt) {
    const I = Input.st; this.clock += dt;
    if (I.muteP) Sfx.toggleMute();
    this.shakeAmt *= Math.exp(-dt * 9); this.zoom = lerp(this.zoom, 1, 1 - Math.exp(-dt * 7)); this.multPulse = Math.max(0, this.multPulse - dt * 2.5); this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.life) this.banner = null; }
    switch (this.mode) {
      case 'title': this.tickMenu(this.titleItems(), I); break;
      case 'how': if (I.confirmP || I.pauseP) { this.mode = 'title'; Sfx.blip(); } break;
      case 'card': this.cardT += dt; if ((I.confirmP && this.cardT > 0.4) || this.cardT > 3.4) this.startPlay(); break;
      case 'play': this.tickPlay(dt, I); break;
      case 'pause': if (I.pauseP) { this.mode = 'play'; Sfx.blip(); } else this.tickMenu(this.pauseItems(), I); break;
      case 'over': this.tickMenu(this.overItems(), I); break;
      case 'bill': {
        this.billT += dt; const n = Math.min(this.billLines.length + 2, Math.floor(this.billT / 0.42));
        if (n > this.billShown) { this.billShown = n; n > this.billLines.length ? Sfx.stamp() : Sfx.coin(); if (n === this.billLines.length + 2) this.shake(8); }
        if (I.confirmP) {
          if (this.billShown < this.billLines.length + 2) this.billT = 99;
          else if (this.stageIdx + 1 < STAGES.length) { Sfx.blip(true); this.loadStage(this.stageIdx + 1); }
          else { this.mode = 'end'; this.endT = 0; Sfx.play('sailor', {}); }
        }
        break;
      }
      case 'end': this.endT += dt; if (I.confirmP && this.endT > 1) { this.toTitle(); } break;
    }
  },
  toTitle() { this.mode = 'title'; this.menu = 0; this.total = 0; this.newBest = false; Sfx.play('sailor', { drums: false, rate: 0.82 }); },
  titleItems() {
    const it = [['CAST OFF', () => { this.total = 0; this.loadStage(0); }], ['DIFFICULTY: ' + D().name, () => { this.diffIdx = ((this.diffIdx === undefined ? 1 : this.diffIdx) + 1) % DIFFS.length; Store.set('diff', this.diffIdx); }]];
    if (this.unlocked > 0) it.push(['SKIP TO STRIP ' + (this.unlocked + 1), () => { this.total = 0; this.loadStage(this.unlocked); }]);
    it.push(['HOW TO BRAWL', () => { this.mode = 'how'; }], ['SOUND: ' + (Sfx.muted ? 'OFF' : 'ON'), () => Sfx.toggleMute()]);
    return it;
  },
  pauseItems() { return [['BACK TO IT', () => { this.mode = 'play'; }], ['START THIS STRIP OVER', () => this.loadStage(this.stageIdx)], ['SOUND: ' + (Sfx.muted ? 'OFF' : 'ON'), () => Sfx.toggleMute()], ['QUIT TO TITLE', () => this.toTitle()]]; },
  overItems() { return [['TRY THAT STRIP AGAIN', () => this.loadStage(this.stageIdx)], ['QUIT TO TITLE', () => this.toTitle()]]; },
  tickMenu(items, I) {
    if (I.downP) { this.menu = (this.menu + 1) % items.length; Sfx.blip(); }
    if (I.upP) { this.menu = (this.menu + items.length - 1) % items.length; Sfx.blip(); }
    this.menu = clamp(this.menu, 0, items.length - 1);
    if (I.confirmP) { Sfx.blip(true); const m = this.menu; this.menu = 0; items[m][1](); if (this.mode === 'title' || this.mode === 'pause' || this.mode === 'how') this.menu = m; }
  },
  tickPlay(dt, I) {
    if (I.pauseP && !this.cleared && !this.player.dead) { this.mode = 'pause'; this.menu = 0; Sfx.blip(); return; }
    if (this.hitstopT > 0) { this.hitstopT -= dt; return; }
    let d = dt; if (this.slowT > 0) { this.slowT -= dt; d *= this.slowK; }
    this.time += d; const P = this.player, st = this.stage;
    P.update(d);
    for (const e of this.enemies) if (!e.hidden) e.update(d);
    for (const p of this.props) if (!p.hidden) p.update(d);
    for (const t of st.things) t.update(d);
    if (st.update) st.update(d);
    if (this.gull) { this.gull.update(d); if (this.gull.gone) this.gull = null; }
    if (this.olive) this.olive.update(d);
    World.step(d, 4);
    this.enemies = this.enemies.filter((e) => !e.gone); this.props = this.props.filter((p) => !p.gone);
    // the sailor and the sea
    P.b.x = clamp(P.b.x, st.minX + 30, st.maxX - 30);
    if (P.b.y > World.waterY + 24) {
      this.splash(P.b.x, 1.2); FX.stamp('SPLOOSH!', clamp(P.b.x, this.cam.x + 120, this.cam.x + W - 120), World.waterY - 70, 46, C.teal);
      if (!P.super) { P.hp -= 1; this.breakChain(); Sfx.hurt(); this.hurtFlash = 0.25; }
      if (P.hp <= 0 && !P.dead) { P.dead = true; this.playerDown(); }
      const sx = st.safe.reduce((a, b) => (abs(b - P.b.x) < abs(a - P.b.x) ? b : a));
      P.b.x = sx; P.b.y = 250; P.b.vx = 0; P.b.vy = 0; P.inv = 1.8; P.pn = null; P.stun = 0;
    }
    // waves
    if (!this.cleared && !P.dead) {
      const alive = this.enemies.filter((e) => e.state !== 'ko').length;
      if (this.between > 0) {
        this.between -= d;
        if (this.between <= 0) {
          this.waveIdx++; this.queue = st.waves[this.waveIdx].map((a) => a.slice()); this.waveClock = 0;
          if (D().extra && !st.boss) { const last = this.queue[this.queue.length - 1]; this.queue.push([last[0] + 1.6, pick(['rat', 'rat', 'plank']), last[2]]); }
          this.say(st.boss ? 'THE CRANE KING' : this.waveIdx === st.waves.length - 1 ? 'LAST PANEL!' : 'PANEL ' + (this.waveIdx + 1), 1.1, st.boss ? 64 : 72);
          if (st.id === 0 && this.waveIdx === 1) { this.meter = 1; }
        }
      } else {
        if (alive < 6) this.waveClock += d;
        while (this.queue.length && this.queue[0][0] <= this.waveClock) { const q = this.queue.shift(); this.spawn(q[1], q[2], q[3]); }
        if (!st.boss && !this.queue.length && alive === 0) { if (this.waveIdx + 1 < st.waves.length) this.between = 1.7; else this.stageClear(); }
      }
    }
    // spinach service
    if (this.meter >= 1 && !this.canOut && !this.gull && !P.super && !P.dead) {
      this.canOut = true;
      const ol = this.olive;
      if (ol && ol.canToss && abs(ol.b.x - P.b.x) < 900) { ol.toss(); this.tip('can', 'OLIVE’S THROWN YOU A CAN — GRAB IT!', 5); }
      else { const z = st.cans.reduce((a, b) => (Math.max(b[0] - P.b.x, P.b.x - b[1], 0) < Math.max(a[0] - P.b.x, P.b.x - a[1], 0) ? b : a)); this.gull = new Gull(clamp(P.b.x + P.face * 30, z[0], z[1]));
      this.tip('can', 'SPINACH INCOMING — GRAB THAT CAN!', 5); }
    }
    // the band plays harder the busier the panel gets
    const busy = this.enemies.filter((e) => !e.gone && e.state !== 'ko').length, lowHp = P.hp <= 2 ? 0.3 : 0;
    Sfx.setIntensity(this.cleared ? 0 : clamp(busy / 6 + lowHp + (st.boss && st.boss.hp < 60 ? 0.35 : 0), 0, 1));
    if (this.gullT > 0) { this.gullT -= d; if (this.gullT <= 0) this.meter = 1; }
    if (P.super) this.tip('bend', 'SPINACH FISTS BEND THE HARBOR:  ↑ + ' + this.keyName('punch') + ' PEELS UP A RAMP  ·  ↓ + ' + this.keyName('punch') + ' IN MID-AIR DIGS A CRATER  ·  PUNCH A WALL TO DENT IT', 9);
    if (st.id === 0 && this.waveIdx === 2) this.tip('slam', 'JUMP, THEN ↓ + ' + this.keyName('punch') + ' FOR A DIVE-BOMB THAT SHAKES THE WHOLE PIER', 7);
    if (this.chainT > 0) { this.chainT -= d; if (this.chainT <= 0) this.breakChain(); }
    // hints
    if (this.hint) { this.hint.t += dt; if (this.hint.t > this.hint.dur) this.hint = null; }
    else if (this.hintQ.length) { this.hint = this.hintQ.shift(); this.hint.t = 0; }
    // camera: follow the sailor, lean toward whoever is currently airborne
    let fx = P.b.x + P.face * 70, best = 500;
    for (const e of this.enemies) if (e.live) { const s = hypot(e.b.vx, e.b.vy); if (s > best) { best = s; fx = P.b.x * 0.58 + e.b.x * 0.42; } }
    if (st.boss && !st.boss.gone) fx = fx * 0.75 + st.boss.x * 0.25;
    this.cam.x = lerp(this.cam.x, clamp(fx - W / 2, 0, st.width - W), 1 - Math.exp(-d * 4.5));
    FX.update(d);
    if (this.cleared) { this.clearT -= dt; if (this.clearT <= 0) this.toBill(); }
    if (this.overT > 0) { this.overT -= dt; if (this.overT <= 0) { this.mode = 'over'; this.menu = 0; } }
  },

  // ───────────────────────────── drawing
  draw() {
    const sc = this.sc; X.setTransform(sc, 0, 0, sc, 0, 0); X.globalAlpha = 1;
    X.fillStyle = C.paper; X.fillRect(0, 0, W, H);
    const m = this.mode;
    if (m === 'play' || m === 'pause' || m === 'over') this.drawWorld();
    else if (m === 'title' || m === 'how') this.drawTitle();
    else if (m === 'card') this.drawCard();
    else if (m === 'bill') this.drawBill();
    else if (m === 'end') this.drawEnd();
    if (m === 'pause') this.drawMenu('PAUSED', this.pauseItems(), 'The harbor will wait.');
    if (m === 'over') this.drawMenu('KNOCKED FLAT!', this.overItems(), 'Damages so far this strip: ' + money(this.score));
    if (m === 'how') this.drawHow();
    // paper grain + a little press vignette over everything
    X.setTransform(sc, 0, 0, sc, 0, 0);
    if (Pat.grain) { X.fillStyle = this.grainPat || (this.grainPat = X.createPattern(Pat.grain, 'repeat')); X.fillRect(0, 0, W, H); }
    const v = X.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(60,40,10,0)'); v.addColorStop(1, 'rgba(60,40,10,.16)');
    X.fillStyle = v; X.fillRect(0, 0, W, H);
  },
  frame(top) {
    X.fillStyle = C.paper; X.fillRect(-40, -40, 50, H + 80); X.fillRect(W - 10, -40, 50, H + 80); X.fillRect(-40, H - 10, W + 80, 50);
    if (top) X.fillRect(-40, -40, W + 80, 54);
    line(top ? [[10, 14], [10, H - 10], [W - 10, H - 10], [W - 10, 14], [10, 14], [10, 30]] : [[10, 12], [10, H - 10], [W - 10, H - 10], [W - 10, 12]], 7);
  },
  drawWorld() {
    const st = this.stage, P = this.player, t = this.time, cam = this.cam.x;
    const sx = rand(-1, 1) * this.shakeAmt, sy = rand(-1, 1) * this.shakeAmt;
    X.save(); X.translate(sx, sy);
    paintSky(st, cam, t);
    X.save(); X.translate(W / 2, H / 2 + 80); X.scale(this.zoom, this.zoom); X.translate(-W / 2 - cam, -H / 2 - 80);
    st.paintMid(t);
    for (const s of World.shapes) if (s.draw) s.draw(s);
    for (const th of st.things) th.draw();
    FX.drawTrails();
    for (const p of this.props) if (!p.hidden) p.draw();
    for (const e of this.enemies) if (!e.hidden) e.draw();
    if (this.olive) this.olive.draw();
    P.draw();
    if (this.gull) this.gull.draw();
    FX.draw();
    paintWater(st, t, cam);
    paintBorder(st.border);
    FX.drawStamps();
    for (const b of FX.balloons) { const [bx, by] = anchorOf(b.who); balloon(clamp(bx, cam + 120, cam + W - 120), Math.max(by, 120), b.text, Math.min(b.t, b.life - b.t)); }
    X.restore();
    if (st.theme.rain) { paintRain(this.clock, st.boss && st.boss.hp < 60); if (st.flash > 0) { X.fillStyle = `rgba(251,246,228,${st.flash * 0.7})`; X.fillRect(-40, -40, W + 80, H + 80); } }
    if (P.super) { const g = X.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 760); g.addColorStop(0, 'rgba(76,154,59,0)'); g.addColorStop(1, `rgba(76,154,59,${0.36 + 0.1 * sin(t * 12)})`); X.fillStyle = g; X.fillRect(-40, -40, W + 80, H + 80); X.fillStyle = Pat.dots('rgba(164,212,102,.55)', 2.6, 10); X.fillRect(-40, H - 70, W + 80, 110); }
    if (this.hurtFlash > 0) { X.fillStyle = Pat.dots(`rgba(201,68,44,${(Math.ceil(this.hurtFlash * 16) / 16) * 1.8})`, 2.6, 10); X.fillRect(-40, -40, W + 80, H + 80); }
    this.frame(false);
    this.drawHUD();
    X.restore();
  },
  drawHUD() {
    const P = this.player, st = this.stage, t = this.clock;
    // lumps left (anchors)
    ink(rrect(24, 22, 252, 52, 3), C.cream, 2.8); label('POPEYE', 36, 49, 26, C.ink, FONT.cap);
    for (let i = 0; i < P.maxHp; i++) drawAnchor(112 + i * 27, 48, 0.9, i < P.hp, i === P.hp && this.hurtFlash > 0);
    // spinach gauge
    const gx = 288, full = this.meter >= 1 && !P.super, pulse = full ? 1 + 0.06 * sin(t * 10) : 1;
    ink(rrect(gx, 22, 206, 52, 3), P.super ? C.greenLt : C.cream, 2.8);
    X.save(); X.translate(gx + 26, 48); X.scale(pulse, pulse); ink(rrect(-14, -19, 28, 38, 4), C.steel, 2.6);
    const lvl = P.super ? P.spin / (P.spinMax || 9.5) : this.meter; X.save(); X.clip(rrect(-14, -19, 28, 38, 4)); X.fillStyle = C.green; X.fillRect(-14, 19 - 38 * lvl, 28, 38 * lvl); X.restore();
    X.lineWidth = 2.6; X.strokeStyle = C.ink; X.stroke(rrect(-14, -19, 28, 38, 4)); line([[-11, -13], [11, -13]], 1.4); line([[-11, 13], [11, 13]], 1.4); X.restore();
    label(P.super ? 'SPINACH TIME!' : full ? (this.canOut ? 'GRAB THE CAN!' : 'GULL’S ON HIS WAY') : 'SPINACH', gx + 50, 40, 22, C.ink, FONT.cap);
    ink(rrect(gx + 50, 53, 142, 10, 2), C.white, 2); X.fillStyle = P.super ? C.green : full ? C.green : C.teal; X.fillRect(gx + 51, 54, 140 * clamp(lvl, 0, 1), 8);
    // damages
    const txt = money(this.score), w = Math.max(190, textW(txt, 30, FONT.sign) + 40);
    ink(rrect(W - 24 - w, 22, w, 52, 3), C.cream, 2.8); label('DAMAGES', W - 24 - w + 12, 36, 17, C.ink, FONT.cap, 'left', 1.5); label(txt, W - 36, 55, 30, C.red, FONT.sign, 'right');
    // chain
    if (this.chain > 1) {
      const k = 1 + this.multPulse * 0.5;
      sock('×' + this.mult, W / 2 - 54, 52, 50 * k, this.mult > 3 ? C.red : C.mustard, -0.08);
      label('CHAIN ' + this.chain, W / 2 - 12, 42, 26, C.ink, FONT.cap); ink(rrect(W / 2 - 12, 56, 120, 9, 2), C.white, 2); X.fillStyle = C.red; X.fillRect(W / 2 - 11, 57, 118 * clamp(this.chainT / 2.8, 0, 1), 7);
    }
    if (!st.boss && this.waveIdx >= 0) caption(24, H - 54, st.name + '  ·  PANEL ' + (this.waveIdx + 1) + ' OF ' + st.waves.length, 20, C.cream);
    if (st.boss && !st.boss.gone && st.boss.state !== 'intro') {
      const b = st.boss, bw = 520, bx = W / 2 - bw / 2, by = H - 52;
      ink(rrect(bx - 8, by - 24, bw + 16, 50, 3), C.cream, 2.8); label(b.name, W / 2, by - 8, 20, C.ink, FONT.sign, 'center');
      ink(rrect(bx, by + 4, bw, 14, 2), C.white, 2.2); X.fillStyle = b.flash > 0 ? C.mustard : C.red; X.fillRect(bx + 1, by + 5, (bw - 2) * clamp(b.hp / b.max, 0, 1), 12);
      for (let i = 1; i < 10; i++) line([[bx + (bw * i) / 10, by + 4], [bx + (bw * i) / 10, by + 18]], 1.4);
    }
    const ol = this.olive;
    if (ol && ol.state === 'carried') {
      const sx = ol.b.x - this.cam.x, on = sx > 40 && sx < W - 40;
      if (!on) { const x = sx < 0 ? 46 : W - 46, d = sx < 0 ? -1 : 1; X.save(); X.translate(x, 300 + sin(t * 10) * 4); ink(poly([[d * 22, 0], [-d * 6, -18], [-d * 6, 18]]), C.red, 3); X.restore(); label('OLIVE!', x - d * 30, 336, 22, C.red, FONT.cap, d < 0 ? 'left' : 'right'); }
    }
    if (this.hint) {
      const k = Math.min(1, this.hint.t * 5, (this.hint.dur - this.hint.t) * 5), size = textW(this.hint.text, 24) > W - 140 ? 20 : 24;
      X.save(); X.translate(W / 2, H - (st.boss ? 132 : 108) + (1 - k) * 16); X.globalAlpha = k; caption(0, 0, this.hint.text, size, C.white, 'center'); X.restore();
    }
    if (this.banner) {
      const b = this.banner, k = outBack(b.t * 5) * (b.t > b.life - 0.2 ? (b.life - b.t) * 5 : 1);
      if (k > 0.02) { X.save(); X.translate(W / 2, 250); X.rotate(-0.04); ink(starPath(0, 0, (b.size * 0.9 + textW(b.text, b.size, FONT.sign) * 0.5) * k, 18, 0.84, 0.1), C.cream, 4); X.restore(); sock(b.text, W / 2, 250, b.size * k, C.red, -0.04, FONT.sign); }
    }
  },
  drawMenu(title, items, sub) {
    X.fillStyle = Pat.dots('rgba(29,26,22,.6)', 3, 8); X.fillRect(0, 0, W, H);
    const h = 190 + items.length * 54;
    X.save(); X.translate(W / 2, H / 2); X.rotate(-0.012);
    ink(rrect(-300, -h / 2, 600, h, 6), C.cream, 5);
    sock(title, 0, -h / 2 + 62, 58, C.red, 0, FONT.sign);
    label(sub, 0, -h / 2 + 114, 19, C.ink, FONT.type, 'center');
    items.forEach((it, i) => { const y = -h / 2 + 168 + i * 54, on = i === this.menu; if (on) { ink(rrect(-230, y - 23, 460, 46, 4), C.mustard, 3); drawFist(-256 + sin(this.clock * 9) * 5, y, 1); } label(it[0], 0, y + 2, 32, C.ink, FONT.cap, 'center', 1); });
    X.restore();
  },
  drawTitle() {
    const t = this.clock, st = this.titleSt || (this.titleSt = { theme: THEME.morning, skyline: mkSkyline(5, 1600) });
    paintSky(st, 60 + sin(t * 0.1) * 60, t);
    // a slab of pier, bent by the title
    const top = []; for (let x = -20; x <= W + 20; x += 20) top.push([x, 640 - 72 * Math.exp(-(((x - 1050) / 130) ** 2)) + 10 * Math.exp(-(((x - 760) / 90) ** 2))]);
    ink(poly(top.concat([[W + 20, H + 20], [-20, H + 20]])), '#243f44', 0); const slab = poly(top.concat(top.slice().reverse().map((p) => [p[0], p[1] + 30])));
    ink(slab, C.wood, 3.2); for (let i = 0; i < top.length; i += 2) line([top[i], [top[i][0], top[i][1] + 30]], 1.8);
    X.fillStyle = Pat.dots('rgba(20,18,15,.5)', 1.5, 7); X.fillRect(0, 672, W, 60);
    // lettering
    caption(96, 62, 'POPEYE THE SAILOR  in', 30, C.cream);
    const word = (s, x, y, size, col, sag) => { let cx = x; X.font = `${size}px ${FONT.sign}`; for (let i = 0; i < s.length; i++) { const w = X.measureText(s[i]).width, u = i / (s.length - 1), dy = sag * sin(u * Math.PI), rot = sag * 0.0026 * cos(u * Math.PI); sock(s[i], cx + w / 2, y + dy + sin(t * 2 + i) * 2, size, col, rot, FONT.sign); cx += w + 4; } };
    word('BENT', 92, 184, 128, C.red, 0); word('HARBOR', 92, 310, 128, C.mustard, 34);
    ink(starPath(470, 392, 46, 10, 0.55, t * 0.4), C.white, 3); sock('KA-RUNCH!', 470, 392, 22, C.green, -0.1);
    label('A DOCKSIDE KNOCKABOUT IN THREE STRIPS', 100, 446, 28, C.ink, FONT.cap, 'left', 2);
    // the man himself
    X.save(); X.translate(1050, 569); X.scale(3.1, 3.1);
    const k = 0.5 + 0.5 * sin(t * 2.2);
    drawPopeye({ lean: 0.02, bob: sin(t * 2.2) * 0.8, expr: 'flex', lf: [-10, 0], rf: [10, 0], lh: [-34, -48 - k * 5], rh: [34, -50 - k * 5], fistL: 1.5 + k * 0.2, fistR: 1.5 + k * 0.2, bendL: -15, bendR: 15, puff: (t * 0.5) % 1 }, t);
    X.restore(); drawCan(880, 596, 1.7);
    if (this.mode === 'title') {
      const items = this.titleItems();
      items.forEach((it, i) => { const y = 492 + i * 40, on = i === this.menu; if (on) { ink(rrect(132, y - 19, 380, 38, 4), C.mustard, 3); drawFist(104 + sin(t * 9) * 5, y, 1); } label(it[0], 150, y + 2, 28, C.ink, FONT.cap, 'left', 1.5); });
      if (this.best) caption(W - 40, 30, 'RECORD DAMAGES  ' + money(this.best), 22, C.cream, 'right');
      label('Popeye as he first appeared in E. C. Segar’s 1929 newspaper strip. Music: traditional hornpipes and shanties.', W / 2, H - 28, 15, C.white, FONT.type, 'center');
    }
    this.frame(true);
  },
  drawHow() {
    X.fillStyle = Pat.dots('rgba(29,26,22,.6)', 3, 8); X.fillRect(0, 0, W, H);
    X.save(); X.translate(W / 2, H / 2); X.rotate(0.008); ink(rrect(-470, -300, 940, 600, 6), C.cream, 5);
    sock('HOW TO BRAWL', 0, -244, 54, C.red, 0, FONT.sign);
    const rows = [
      [['A', 'D'], 'WALK THE PLANKS', 'or the arrow keys'], [['SPACE'], 'JUMP', 'also K'], [['J'], 'SOCK ’EM', 'three quick ones end in a haymaker'],
      [['HOLD J'], 'WIND UP A TWISTER', 'let go to send somebody across the harbor'], [['↑', 'J'], 'UPPERCUT', 'aim any punch by holding a direction'], [['↓', 'J'], 'DIVE-BOMB', 'in mid-air: shakes the whole pier'],
    ];
    rows.forEach((r, i) => { const y = -180 + i * 50; let x = -430; for (const key of r[0]) { const w = Math.max(40, textW(key, 22, FONT.sign) + 22); ink(rrect(x, y - 19, w, 38, 5), C.white, 2.8); label(key, x + w / 2, y + 2, 20, C.ink, FONT.sign, 'center'); x += w + 8; } label(r[1], -230, y + 1, 30, C.ink, FONT.cap, 'left', 1); label(r[2], 40, y + 2, 17, C.ink, FONT.type); });
    ink(rrect(-430, 132, 860, 104, 4), C.greenLt, 3); drawCan(-388, 184, 1.5);
    label('SPINACH', -350, 158, 30, C.ink, FONT.cap, 'left', 1);
    label('Keep a chain going and a gull brings a can. For a few seconds your fists bend the', -350, 188, 16.5, C.ink, FONT.type);
    label('harbor itself: ↑+J peels up a ramp, ↓+J digs a crater, and walls, hulls and cranes dent.', -350, 212, 16.5, C.ink, FONT.type);
    label('Every ricochet goes on the bill.   ·   Gamepad works too.   ·   ' + (Input.touch.active ? 'TAP' : 'J / ENTER') + ' — BACK', 0, 268, 16, C.ink, FONT.type, 'center');
    X.restore();
  },
  drawCard() {
    const st = this.stage, k = outCubic(this.cardT * 2.2);
    X.fillStyle = st.theme.sky; X.fillRect(0, 0, W, H); X.fillStyle = Pat.dots(st.theme.dots, 3, 9); X.fillRect(0, 0, W, H);
    X.save(); X.translate(W / 2, H / 2); X.rotate(-0.02); ink(starPath(0, 0, 560 * k, 20, 0.82, 0.05), C.cream, 5);
    caption(0, -150, st.strip, 34, C.mustard, 'center');
    sock(st.name, 0, -30, st.name.length > 12 ? 78 : 110, C.red, 0, FONT.sign);
    label(st.tag, 0, 70, 22, C.ink, FONT.type, 'center');
    X.restore();
    label((Input.touch.active ? 'TAP' : 'J / ENTER') + ' — BEGIN', W / 2, H - 60, 24, C.ink, FONT.cap, 'center', 2);
    this.frame(true);
  },
  drawBill() {
    X.fillStyle = C.teal; X.fillRect(0, 0, W, H); X.fillStyle = Pat.dots('rgba(29,26,22,.25)', 2.4, 9); X.fillRect(0, 0, W, H);
    const sx = rand(-1, 1) * this.shakeAmt, L = this.billLines, n = this.billShown;
    X.save(); X.translate(W / 2 + sx, H / 2); X.rotate(-0.014);
    X.fillStyle = 'rgba(29,26,22,.35)'; X.fillRect(-398, -296, 820, 624);
    ink(rrect(-410, -310, 820, 624, 2), C.white, 3);
    label('OFFICE OF THE HARBOR MASTER', 0, -268, 30, C.ink, FONT.sign, 'center');
    label('BILL OF DAMAGES  —  ' + this.stage.strip + ',  “' + this.stage.name + '”', 0, -232, 19, C.ink, FONT.type, 'center');
    line([[-370, -208], [370, -208]], 3); line([[-370, -202], [370, -202]], 1.2);
    label('Rendered to:  one (1) sailor, squint-eyed, pipe-smoking, answering to POPEYE', -370, -176, 16, C.ink, FONT.type);
    for (let i = 0; i < Math.min(n, L.length); i++) {
      const y = -130 + i * 38; label(L[i][0], -370, y, 18, C.ink, FONT.type);
      const w1 = textW(L[i][0], 18, FONT.type), amt = money(L[i][1]), w2 = textW(amt, 20, FONT.type);
      X.fillStyle = C.ink; for (let x = -370 + w1 + 10; x < 370 - w2 - 10; x += 9) X.fillRect(x, y + 5, 2, 2);
      label(amt, 370, y, 20, C.ink, FONT.type, 'right');
    }
    if (n > L.length) {
      const y = -130 + L.length * 38 + 16; line([[120, y - 14], [370, y - 14]], 2.4);
      label('TOTAL DAMAGES', -370, y + 14, 26, C.ink, FONT.sign); label(money(this.score), 370, y + 14, 34, C.red, FONT.sign, 'right');
      label('Longest chain: ' + this.bestChain + '      Harbor re-shaped ' + this.stats.bends + ' time' + (this.stats.bends === 1 ? '' : 's'), -370, y + 58, 16, C.ink, FONT.type);
    }
    if (n > L.length + 1) {
      X.save(); X.translate(220, 210); X.rotate(-0.2); X.globalAlpha = 0.9; X.strokeStyle = C.red; X.lineWidth = 5; X.stroke(rrect(-170, -44, 340, 88, 8)); X.lineWidth = 2; X.stroke(rrect(-162, -36, 324, 72, 5));
      label('PAID IN KNUCKLES', 0, -10, 24, C.red, FONT.sign, 'center'); label('RANK: ' + rankOf(this.score), 0, 20, 17, C.red, FONT.sign, 'center'); X.restore();
      label((Input.touch.active ? 'TAP' : 'J / ENTER') + ' — ' + (this.stageIdx + 1 < STAGES.length ? 'NEXT STRIP' : 'FINIS'), -370, 280, 20, C.ink, FONT.cap, 'left', 2);
    }
    X.restore(); this.frame(true);
  },
  drawEnd() {
    const t = this.endT, st = this.titleSt || (this.titleSt = { theme: THEME.morning, skyline: mkSkyline(5, 1600) });
    paintSky(st, 200, this.clock); paintWater({ theme: THEME.morning }, this.clock, 0);
    X.save(); X.translate(W / 2, 250); X.rotate(-0.03); ink(starPath(0, 0, 420 * outBack(t * 1.5), 18, 0.8, 0.1), C.cream, 5); X.restore();
    sock('THE END', W / 2, 220, 130 * outBack(t * 1.5), C.red, -0.03, FONT.sign);
    label('…and the harbor was never quite the same shape again.', W / 2, 320, 22, C.ink, FONT.type, 'center');
    caption(W / 2, 380, 'TOTAL DAMAGES, ALL STRIPS:  ' + money(this.total), 34, C.mustard, 'center');
    caption(W / 2, 446, (this.newBest ? 'A NEW RECORD  ·  ' : '') + 'RANK: ' + rankOf(this.total / 2.4), 26, C.cream, 'center');
    X.save(); X.translate(W / 2 - 40, 668); X.scale(1.75, 1.75); const k = 0.5 + 0.5 * sin(this.clock * 3);
    drawPopeye({ lean: 0, bob: 0, expr: 'flex', lf: [-10, 0], rf: [10, 0], lh: [-34, -48 - k * 5], rh: [34, -50 - k * 5], fistL: 1.6, fistR: 1.6, bendL: -15, bendR: 15, puff: (this.clock * 0.6) % 1 }, this.clock); X.restore();
    X.save(); X.translate(W / 2 + 120, 668); X.scale(-1.6, 1.6); rig(STYLE.olive, { lean: 0, bob: -abs(sin(this.clock * 6)) * 3, expr: 'cheer', lf: [-5, 0], rf: [5, 0], lh: [-16, -86], rh: [16, -88] }, this.clock); X.restore();
    if (t > 1) label((Input.touch.active ? 'TAP' : 'J / ENTER') + ' — BACK TO THE TITLE', W / 2, H - 40, 22, C.ink, FONT.cap, 'center', 2);
    this.frame(true);
  },
});
function drawAnchor(x, y, s, on, lost) {
  X.save(); X.translate(x, y); X.scale(s, s); if (lost) X.rotate(rand(-0.3, 0.3));
  X.lineCap = 'round'; X.strokeStyle = on ? C.ink : 'rgba(29,26,22,.22)'; X.lineWidth = 4.2;
  X.beginPath(); X.moveTo(0, -8); X.lineTo(0, 12); X.moveTo(-6, -3); X.lineTo(6, -3); X.moveTo(-9, 4); X.quadraticCurveTo(0, 18, 9, 4); X.stroke();
  X.beginPath(); X.arc(0, -11, 3, 0, TAU); X.lineWidth = 3; X.stroke();
  if (on) { X.strokeStyle = C.red; X.lineWidth = 1.6; X.beginPath(); X.moveTo(0, -7); X.lineTo(0, 11); X.stroke(); }
  X.restore();
}
function drawFist(x, y, s) {
  X.save(); X.translate(x, y); X.scale(s, s);
  ink(ell(-12, 0, 13, 9), C.skin, 2.6); ink(circ(4, 0, 11), C.skin, 2.8); line([[8, -6], [8, 6]], 1.6); line([[3, -9], [3, -2]], 1.4);
  X.restore();
}

// ───────────────────────────── boot
function boot() {
  const cv = document.getElementById('game'), wrap = cv.parentElement;
  X = cv.getContext('2d'); Pat.makeGrain();
  function resize() {
    const r = wrap.getBoundingClientRect(), w = Math.max(160, Math.min(r.width, (r.height * W) / H)), dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.width = Math.floor(w) + 'px'; cv.style.height = Math.floor((w * H) / W) + 'px';
    const sc = clamp((w * dpr) / W, 0.4, 2); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc); G.sc = sc; G.grainPat = null;
  }
  addEventListener('resize', resize); resize();
  Input.setGesture(() => Sfx.init());
  addEventListener('pointerdown', () => Sfx.init());
  // touch controls
  const tc = document.getElementById('touch');
  if (tc) {
    const on = () => { Input.touch.active = true; if (tc.hidden) { tc.hidden = false; resize(); } };
    addEventListener('touchstart', on, { passive: true });
    const stick = document.getElementById('tc-stick'), nub = document.getElementById('tc-nub');
    const mv = (e) => { const r = stick.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); Input.touch.x = clamp(dx, -1, 1); Input.touch.y = clamp(dy, -1, 1); nub.style.transform = `translate(${clamp(dx, -1, 1) * 30}px,${clamp(dy, -1, 1) * 30}px)`; };
    const end = () => { Input.touch.x = Input.touch.y = 0; nub.style.transform = ''; };
    stick.addEventListener('pointerdown', (e) => { stick.setPointerCapture(e.pointerId); mv(e); e.preventDefault(); }); stick.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') mv(e); });
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    const btn = (id, key) => { const el = document.getElementById(id); el.addEventListener('pointerdown', (e) => { Input.touch[key] = true; e.preventDefault(); Sfx.init(); }); const up = () => { if (key !== 'pause') Input.touch[key] = false; }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); };
    btn('tc-punch', 'punch'); btn('tc-jump', 'jump'); btn('tc-pause', 'pause');
    cv.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') on(); if (e.pointerType === 'touch' && G.mode !== 'play') { Input.touch.punch = true; setTimeout(() => { Input.touch.punch = false; }, 80); } });
  }
  const STEP = 1 / 60; let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now; let n = 0;
    while (acc >= STEP && n++ < 5) { Input.poll(); G.tick(STEP); acc -= STEP; }
    if (n >= 5) acc = 0;
    G.draw(); requestAnimationFrame(loop);
  }
  const go = () => { G.toTitle(); requestAnimationFrame((t) => { last = t; loop(t); }); };
  const fonts = ['72px "Holtwood One SC"', '40px "Luckiest Guy"', '24px "Mouse Memoirs"', '18px "Special Elite"'];
  let started = false; const start = () => { if (!started) { started = true; go(); } };
  if (document.fonts && document.fonts.load) Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => 0))).then(start, start);
  setTimeout(start, 1800);
}
window.__bh = { G, World, Input, Sfx, FX, rig: (...a) => rig(...a), drawPopeye: (...a) => drawPopeye(...a), STYLE, setX: (c) => { X = c; } };
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
