# Emberfall Duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/diablosan19/emberfall-duel-2/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/diablosan19/emberfall-duel-2/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original turn-based card battler for the make.fun best-card-game bounty.
Canvas 2D, no libraries, no network, WebAudio synth only. 1280×720.

## How it plays

- **32 cards in 4 courts**, told apart by colour *and* drawn glyph: Flame (red,
  damage), Tide (blue, draw + heal), Thorn (green, guardians + poison), Stone
  (amber, block + armor).
- **Resonance:** play a second card of the same court in one turn and that
  court's bonus fires — Flame +3 damage, Tide draw 1 + heal 3, Thorn +2 poison,
  Stone +5 block. The resonance indicator above the table shows it live.
- **Guardians:** up to 3 per side, summoning sickness, freeze. At end of turn
  each ready guardian strikes the foe's leftmost guardian, then the hero.
- **Campaign:** three rivals of rising difficulty — Ash Kip, Mirelle, Grandmaster
  Vey. The AI checks lethal first, removes your biggest threat, blocks and heals
  when low, and blunders less the harder the rival. Wins bank embers and build
  your streak.
- **Controls:** click to play (click a foe guardian or hero to target), keys
  1–7, Space to end turn, Esc to cancel, M to mute.

## Run it

```sh
node serve.ts   # http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/src/cards.js` — the 32-card catalogue, the four courts, rivals, decks
- `game/src/engine.js` — pure duel rules (resonance, guardians, block, poison)
- `game/src/ai.js` — the rival heuristic (lethal, removal, survival, blunders)
- `game/src/audio.js` — WebAudio synth effects, no audio files
- `game/src/render.js` — all canvas drawing: table, cards, glyphs, screens
- `game/src/main.js` — screens, input, animation, screenshot staging
- `main.ts` — the entry program; `serve.ts` — the local static server
