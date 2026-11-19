# Bent Harbor

A physics-based dockside beat-'em-up in three comic strips. Punch waterfront toughs so they
ricochet off cranes, hulls, bells and each other; eat spinach and your fists bend the level
geometry itself — the pier peels into ramps, booms fold, hulls dent, and the comic panel's own
border takes a knock. Every dent stays for the rest of the strip and goes on the Harbor Master's bill.

## Cast

- **Popeye**, drawn from his 1929 *Thimble Theatre* look (squint, jutting jaw, corncob pipe, huge forearms).
- **Olive Oyl** (1919 strip). She throws Popeye his spinach. Toughs marked with a yellow “!” try to carry her
  off the edge of the panel; one punch makes them drop her. In the last strip she is held in a cargo net.
- Original waterfront toughs: rats (jab, combo, lunge, block jabs), bruisers (charge, ground pound),
  bottle-chuckers, and plank men who block frontal punches (uppercut, dive-bomb, hit from behind, or split
  the plank with haymakers). Boss: Big Barnacle Bragg and his wrecking-ball crane.

## Difficulty

Chosen on the title screen. Toughs take turns to attack; harder settings let more of them swing at once,
make them block more, recover faster and hit harder, and make spinach rarer.

| | Anchors | Toughs swinging at once | Spinach |
|---|---|---|---|
| Deckhand | 7 | 1 | frequent, long |
| Sailor | 5 | 2 | normal |
| Old Salt | 4 | 3 | rare, short; extra toughs every panel |

## Music

Every pass through a tune gets a new arrangement: concertina, concertina with a harmony line a third
below, steam calliope, a harmonic-minor version, a tin-whistle jig with grace notes, and a banjo breakdown.
The drums get busier as more toughs crowd the panel and when you are low on anchors.

## Play

Open `dist/index.html` in a browser. No server or install needed.

| | Keyboard | Gamepad |
|---|---|---|
| Move / aim | A D / arrows (hold ↑ or ↓ while punching to aim) | stick / d-pad |
| Jump | Space or K | A |
| Punch (tap: jabs → haymaker; hold: wind-up) | J or Z | X / B |
| Pause · Mute | Esc · M | Start |

Touch devices get an on-screen stick and two buttons.

## Build

    node build.js        # src/*.js + src/page.html  ->  dist/index.html (single self-contained file)

No dependencies. `desktop/main.js` is a minimal Electron shell for a desktop build
(`npm i -D electron && npm run desktop`); it has not been run in this repo yet.

## Layout

    src/00_core.js    constants, palette, input (keyboard, gamepad, touch)
    src/10_audio.js   WebAudio synth: SFX and the tune sequencer (ABC-notation tune book)
    src/20_world.js   bendable geometry (plastic + elastic vertex chains) and circle-body physics
    src/30_art.js     ink/halftone rendering, lettering, particles, the rubber-hose character rig
    src/40_actors.js  the sailor, the toughs, barrels, hooks, bottles, the spinach gull
    src/50_levels.js  the three stages, bell, funnel, and the crane boss
    src/60_game.js    rules, scoring, flow, HUD, menus, main loop

## Rights notes (read before selling this)

- **Not in the game yet.** Wimpy (1931), Bluto (1932), Swee'Pea (1933) and Eugene the Jeep (1936) are still
  under U.S. copyright (Wimpy enters the public domain on 1 Jan 2027, Bluto 2028, Swee'Pea 2029, the Jeep 2032),
  and the 1970s–80s TV designs are newer still. No look-alikes are used either.
- **Character.** Popeye as he appeared in E. C. Segar's 1929 *Thimble Theatre* strips is in the
  U.S. public domain (since 1 Jan 2025). This game draws him fresh from that description and uses
  only original supporting characters. Later additions are *not* free yet — e.g. Bluto (1932) and
  the Fleischer cartoon designs (1933 on) — and terms outside the U.S. differ.
- **Music.** The famous "I'm Popeye the Sailor Man" theme was written in 1933 and is still under
  copyright (until 1 Jan 2029 in the U.S.), and TV-show recordings of it are protected separately, so
  neither is used. The soundtrack is arranged from traditional public-domain tunes:
  the Sailor's (College) Hornpipe, Fisher's Hornpipe and the Liverpool Hornpipe (settings after
  *Ryan's Mammoth Collection*, 1883) and the shanty "Drunken Sailor".
- **Trademark.** "Popeye" is a registered trademark of King Features / Hearst. Copyright expiry does
  not remove it. Before a commercial release, get legal advice on the title, store page and marketing;
  the game is titled *Bent Harbor* partly for that reason.
- **Fonts.** Holtwood One SC, Luckiest Guy, Mouse Memoirs and Special Elite are loaded from Google
  Fonts (open licences). Bundle the font files locally for an offline/desktop build.
