# Bent Harbor

A physics-based dockside beat-'em-up in three comic strips. Punch waterfront toughs so they
ricochet off cranes, hulls, bells and each other; eat spinach and your fists bend the level
geometry itself — the pier peels into ramps, booms fold, hulls dent, and the comic panel's own
border takes a knock. Every dent stays for the rest of the strip and goes on the Harbor Master's bill.

## Cast

- **Popeye**, drawn from his 1929 *Thimble Theatre* look (squint, jutting jaw, corncob pipe, huge forearms).
- **Olive Oyl** (1919 strip). She throws Popeye his spinach. Toughs marked with a yellow “!” try to carry her
  off the edge of the panel; one punch makes them drop her. In the last strip she is held in a cargo net.
- **Sindbad the Sailor** (the Arabian Nights rogue, in an original design) sails in during every strip with one aim:
  carry Olive off to his ship. He dodges wind-ups, shrugs off jabs, kicks Popeye aside and, in the last strip, cuts
  Olive's net down. Drive him off and he comes back for her later (once on Deckhand, twice on Sailor, three times on Old Salt).
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

## Story

Each strip opens with a four-panel comic page, original stories set in the world of the 1929 strip:

1. **In Which a Sailor Is Hired.** Castor Oyl needs a sailor for his leaky ship by sundown; Olive finds one,
   and Bragg Haulage's toll collectors find him too.
2. **In Which the Cargo Is Stolen.** A rusty steamer turns up full of Mr. Haddock's stolen fish crates, and
   Barnacle Bragg watches from his crane.
3. **In Which the Landlord Collects.** Bragg's men carry Olive off in a storm and hang her from the gantry.

Tap or press J / Enter to reveal the next panel; Esc (or the pause button) skips. Retrying a strip skips its story.

## Play

Online: **https://monirulhaque.github.io/popeye_the_sailor_man_in_bent_harbour/** (GitHub Pages; works on phones too).

Offline: open `index.html` (or `dist/index.html`) in a browser. No server or install needed.

| | Keyboard | Gamepad |
|---|---|---|
| Move / aim | A D / arrows (hold ↑ or ↓ while punching to aim) | stick / d-pad |
| Jump | Space or K | A |
| Punch (tap: jabs → haymaker; hold: wind-up) | J or Z | X / B |
| Pause · Mute | Esc · M | Start |

On a phone or tablet, open the same page in the browser. You get an on-screen stick (move and aim), JUMP and SOCK
buttons (hold SOCK to wind up), a pause button and a full-screen button. Menus and story pages are tapped directly.
Held upright, the game sits at the top with the controls below; turn the phone sideways for a bigger view.

## Build

    node build.js        # src/*.js + src/page.html  ->  dist/index.html (single self-contained file),
                         # also copied to index.html and docs/index.html for GitHub Pages

No dependencies. `desktop/main.js` is a minimal Electron shell for a desktop build
(`npm i -D electron && npm run desktop`); it has not been run in this repo yet.

## Layout

    src/00_core.js    constants, palette, input (keyboard, gamepad, touch)
    src/10_audio.js   WebAudio synth: SFX and the tune sequencer (ABC-notation tune book)
    src/20_world.js   bendable geometry (plastic + elastic vertex chains) and circle-body physics
    src/30_art.js     ink/halftone rendering, lettering, particles, the rubber-hose character rig
    src/40_actors.js  the sailor, the toughs, barrels, hooks, bottles, the spinach gull
    src/50_levels.js  the three stages, bell, funnel, and the crane boss
    src/55_story.js   the comic-page prologues and Barnacle Bragg's look
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
