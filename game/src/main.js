// Emberfall Duel — the game shell: screens, input, animation, pacing, screenshots.
// The rules live in engine.js, the rival brain in ai.js, the pictures in render.js.
// This file only wires them together and runs the frame loop.
import { CARD_BY_ID, RIVALS, makeRng } from './cards.js';
import { createDuel, playCard, endTurn, canPlay, defaultTarget, HAND_CAP } from './engine.js';
import { runAiTurn } from './ai.js';
import { sfx, toggleMute, isMuted } from './audio.js';
import { W, H, drawTable, drawTitle, drawDuel, drawEnd } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
canvas.width = W; canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

// ---- persistent campaign state (this session) ----
let embersBanked = 0;
let bestStreak = 0;
let streak = 0;
let unlocked = 0;

// ---- live view state ----
let screen = 'title'; // 'title' | 'duel' | 'end'
let duel = null;
let selected = null; // selected hand index
let hover = null;
let hint = 'Click a card in your hand to play it.';
let handPos = [];
let floaters = [];
let sparks = [];
let confetti = [];
let aiAt = 0; // timestamp when the foe's turn should resolve
let endWon = false;
let shake = 0;
let shotReady = false;

const endTurnRect = { x: 1060, y: 478, w: 150, h: 52 };
const endButtons = [
  { label: 'NEXT RIVAL', x: 400, y: 448, w: 200, h: 48, primary: true, action: 'next' },
  { label: 'TITLE', x: 680, y: 448, w: 200, h: 48, primary: false, action: 'title' },
];

for (let i = 0; i < 42; i += 1) {
  sparks.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, a: 0.15 + Math.random() * 0.5, color: ['#ff9a3d', '#ff5c3d', '#ffd28a'][i % 3], v: 0.2 + Math.random() * 0.6 });
}

function announce(msg) { if (statusEl) statusEl.textContent = msg; }

function addFloater(x, y, text, color) { floaters.push({ x, y, text, color, life: 1 }); }

function startDuel(rivalIndex) {
  duel = createDuel(rivalIndex, 1000 + rivalIndex * 77 + Math.floor(Math.random() * 900));
  screen = 'duel';
  selected = null; hover = null; floaters = []; confetti = [];
  handPos = duel.player.hand.map(() => ({ x: 640, y: 760 }));
  hint = `${duel.rival.name}: “${duel.rival.taunt}” — your turn.`;
  announce(`Duel against ${duel.rival.name}. Your turn.`);
  sfx('turn');
}

function handTargets() {
  if (!duel) return [];
  const n = duel.player.hand.length;
  const w = 118, gap = 8;
  const total = n * (w + gap) - gap;
  return duel.player.hand.map((_, i) => ({ x: 640 - total / 2 + i * (w + gap), y: 544 }));
}

function finishDuel() {
  endWon = duel.winner === 'player';
  screen = 'end';
  if (endWon) {
    embersBanked += duel.rival.reward;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    unlocked = Math.max(unlocked, Math.min(2, duel.rivalIndex + 1));
    confetti = Array.from({ length: 120 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * 300, color: ['#e5484d', '#3a86ff', '#43aa5b', '#e8a33d', '#ffd28a'][Math.floor(Math.random() * 5)], v: 2 + Math.random() * 3 }));
    sfx('win');
    announce(`Victory over ${duel.rival.name}. ${duel.rival.reward} embers banked.`);
  } else {
    streak = 0;
    sfx('lose');
    announce(`Defeat by ${duel.rival.name}.`);
  }
}

function tryPlay(handIndex, target) {
  if (!duel || duel.turn !== 'player' || duel.winner) return;
  const card = CARD_BY_ID[duel.player.hand[handIndex]];
  if (!card) return;
  if (!canPlay(duel, 'player', handIndex)) { hint = `Not enough embers for ${card.name} (${card.cost}).`; sfx('click'); return; }
  const beforeFoeHp = duel.foe.hp;
  const beforePlayerHp = duel.player.hp;
  const resonant = duel.playedCourts.includes(card.court);
  const tgt = card.kind === 'attack' ? (target || defaultTarget(duel, 'player')) : null;
  if (!playCard(duel, 'player', handIndex, tgt)) return;
  selected = null;
  const tx = tgt && tgt.kind === 'guardian' ? 640 : 300;
  const ty = tgt && tgt.kind === 'guardian' ? 210 : 80;
  if (card.kind === 'guardian') { addFloater(640, 400, `${card.name} summoned!`, '#8fe0a4'); sfx('guardian'); }
  else if (card.dmg) { addFloater(tx, ty, `-${Math.max(0, beforeFoeHp - duel.foe.hp)}`, '#ff7a5c'); sfx('hit'); shake = Math.min(10, 4 + (card.dmg || 0)); }
  else if (card.heal || card.block) { addFloater(300, 520, card.heal ? `+${card.heal} HP` : `+${card.block} block`, '#8ec2ff'); sfx(card.heal ? 'heal' : 'block'); }
  else sfx('play');
  if (resonant) { addFloater(640, 320, 'RESONANCE!', '#ffd28a'); sfx('resonance'); }
  if (card.draw) sfx('draw');
  if (duel.player.hp < beforePlayerHp) addFloater(300, 520, `-${beforePlayerHp - duel.player.hp}`, '#ff7a5c');
  handPos = duel.player.hand.map((_, i) => handPos[i] || { x: 640, y: 760 });
  if (duel.winner) finishDuel();
}

function doEndTurn() {
  if (!duel || duel.turn !== 'player' || duel.winner) return;
  selected = null;
  sfx('turn');
  endTurn(duel);
  if (duel.winner) { finishDuel(); return; }
  aiAt = performance.now() + 900;
  hint = `${duel.rival.name} is thinking…`;
}

function resolveAiTurn() {
  if (!duel || duel.turn !== 'foe' || duel.winner) return;
  const beforeHp = duel.player.hp;
  runAiTurn(duel);
  if (duel.player.hp < beforeHp) { addFloater(300, 520, `-${beforeHp - duel.player.hp}`, '#ff7a5c'); shake = 8; sfx('hit'); }
  if (duel.winner) { finishDuel(); return; }
  hint = 'Your turn — play a card or end the turn.';
  sfx('turn');
}

// ---- input ----
function posOf(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}

function hitHand(p) {
  const targets = handTargets();
  for (let i = targets.length - 1; i >= 0; i -= 1) {
    const t = targets[i];
    if (p.x >= t.x && p.x <= t.x + 118 && p.y >= t.y - 18 && p.y <= t.y + 164) return i;
  }
  return null;
}

function hitFoeGuardian(p) {
  if (!duel) return null;
  const n = duel.foe.guardians.length;
  for (let i = 0; i < n; i += 1) {
    const x = 640 - (n * 110) / 2 + i * 110 + 8;
    if (p.x >= x && p.x <= x + 94 && p.y >= 166 && p.y <= 262) return i;
  }
  return null;
}

function hitFoeHero(p) {
  return p.x >= 24 && p.x <= 460 && p.y >= 30 && p.y <= 120;
}

canvas.addEventListener('click', (e) => {
  const p = posOf(e);
  if (screen === 'title') {
    for (let i = 0; i < RIVALS.length; i += 1) {
      const x = 340 + i * 220, y = 268;
      if (p.x >= x && p.x <= x + 190 && p.y >= y && p.y <= y + 250) {
        if (i > unlocked) { hint = 'Beat the rival before to unlock.'; sfx('click'); return; }
        sfx('click');
        startDuel(i);
        return;
      }
    }
    return;
  }
  if (screen === 'end') {
    for (const b of endButtons) {
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        sfx('click');
        if (b.action === 'title') { screen = 'title'; return; }
        const next = Math.min(2, (duel ? duel.rivalIndex : 0) + (endWon ? 1 : 0));
        startDuel(endWon ? next : (duel ? duel.rivalIndex : 0));
        return;
      }
    }
    return;
  }
  if (!duel || duel.winner) return;
  // Targeting a selected attack card?
  if (selected != null) {
    const card = CARD_BY_ID[duel.player.hand[selected]];
    if (card && card.kind === 'attack') {
      const gi = hitFoeGuardian(p);
      if (gi != null) { tryPlay(selected, { kind: 'guardian', index: gi }); return; }
      if (hitFoeHero(p)) { tryPlay(selected, { kind: 'hero' }); return; }
    } else if (card) {
      // Non-attack: clicking the card again confirms.
      const hi = hitHand(p);
      if (hi === selected) { tryPlay(selected, null); return; }
    }
    // Clicked elsewhere while a card is selected: re-target or cancel.
    const hi = hitHand(p);
    if (hi != null) { selected = hi; sfx('click'); return; }
    selected = null;
    return;
  }
  const hi = hitHand(p);
  if (hi != null) {
    if (duel.turn !== 'player') { hint = 'Wait for the foe to finish.'; return; }
    selected = hi;
    sfx('click');
    return;
  }
  if (p.x >= endTurnRect.x && p.x <= endTurnRect.x + endTurnRect.w && p.y >= endTurnRect.y && p.y <= endTurnRect.y + endTurnRect.h) {
    doEndTurn();
  }
});

canvas.addEventListener('mousemove', (e) => {
  const p = posOf(e);
  hover = screen === 'duel' ? hitHand(p) : null;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') { toggleMute(); hint = isMuted() ? 'Sound muted.' : 'Sound on.'; return; }
  if (screen === 'duel' && duel) {
    if (e.key === 'Escape') { selected = null; return; }
    if (e.key === ' ') { e.preventDefault(); doEndTurn(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= HAND_CAP) {
      const i = n - 1;
      if (duel.player.hand[i]) {
        if (selected === i) { const card = CARD_BY_ID[duel.player.hand[i]]; tryPlay(i, card.kind === 'attack' ? defaultTarget(duel, 'player') : null); }
        else { selected = i; sfx('click'); }
      }
    }
  } else if (screen === 'end' && e.key === 'Enter') {
    const next = Math.min(2, (duel ? duel.rivalIndex : 0) + (endWon ? 1 : 0));
    startDuel(endWon ? next : (duel ? duel.rivalIndex : 0));
  } else if (screen === 'title' && ['1', '2', '3'].includes(e.key)) {
    const i = Number(e.key) - 1;
    if (i <= unlocked) startDuel(i);
  }
});

// ---- screenshot staging: real games, scripted forward, same seed every time ----
function stageShot(name) {
  if (name === 'duel' || name === 'victory' || name === 'defeat') {
    const rng = makeRng(seed);
    duel = createDuel(1, seed);
    // Play three rounds: player fires affordable attacks, foe answers with its brain.
    for (let round = 0; round < 3; round += 1) {
      let guard = 0;
      while (guard < 8 && duel.turn === 'player' && !duel.winner) {
        guard += 1;
        const idx = duel.player.hand.findIndex((id, i) => {
          const c = CARD_BY_ID[id];
          return duel.player.embers >= c.cost && (c.kind !== 'guardian' || duel.player.guardians.length < 3);
        });
        if (idx < 0) break;
        const c = CARD_BY_ID[duel.player.hand[idx]];
        playCard(duel, 'player', idx, c.kind === 'attack' ? defaultTarget(duel, 'player') : null);
      }
      if (duel.winner) break;
      endTurn(duel);
      if (duel.winner) break;
      runAiTurn(duel);
      void rng;
    }
    screen = 'duel';
    handPos = handTargets().map((t) => ({ x: t.x, y: t.y }));
    if (name === 'victory') { duel.winner = 'player'; duel.foe.hp = 0; duel.cardsPlayed = 14; duel.damageDealt = 31; finishDuel(); }
    if (name === 'defeat') { duel.winner = 'foe'; duel.player.hp = 0; duel.cardsPlayed = 9; duel.damageDealt = 18; finishDuel(); }
  }
  // 'title' (or anything else) stays on the title screen.
}

if (shot) stageShot(shot);

// ---- frame loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Sparks drift up; floaters rise and fade; confetti falls.
  for (const p of sparks) { p.y -= p.v * 30 * dt; p.x += Math.sin(now / 900 + p.r * 5) * 0.15; if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; } }
  for (const f of floaters) { f.y -= 34 * dt; f.life -= dt * 0.9; }
  floaters = floaters.filter((f) => f.life > 0);
  for (const p of confetti) { p.y += p.v * 60 * dt; p.x += Math.sin(now / 300 + p.y / 40) * 0.6; if (p.y > H + 10) p.y = -10; }
  if (shake > 0) shake = Math.max(0, shake - dt * 30);
  // Hand cards slide toward their fan positions.
  const targets = handTargets();
  targets.forEach((t, i) => {
    if (!handPos[i]) handPos[i] = { x: t.x, y: 760 };
    handPos[i].x += (t.x - handPos[i].x) * Math.min(1, dt * 10);
    handPos[i].y += (t.y - handPos[i].y) * Math.min(1, dt * 10);
  });
  if (aiAt && now >= aiAt) { aiAt = 0; resolveAiTurn(); }

  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  const view = {
    sparks, floaters, confetti, duel, selected, hover, hint,
    embersBanked, bestStreak, streak, unlocked,
    handPos, endTurnRect, endButtons,
  };
  if (screen === 'title') drawTitle(ctx, view);
  else if (screen === 'duel') drawDuel(ctx, view);
  else if (screen === 'end') { drawDuel(ctx, view); drawEnd(ctx, view, endWon); }
  ctx.restore();
  if (!shotReady) { shotReady = true; window.__shotReady = true; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
