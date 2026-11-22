// Emberfall Duel — the duel engine. Pure rules, no DOM, no canvas, no sound.
// The browser UI and the headless tests both drive duels through this module.
// A duel is a plain object; every function below mutates it and appends to its log.
import { CARD_BY_ID, RIVALS, buildDeck, makeRng, shuffle } from './cards.js';

export const HAND_CAP = 7;
export const MAX_GUARDIANS = 3;
export const MAX_EMBERS = 10;
export const PLAYER_MAX_HP = 30;

function makeSide(hp, deck) {
  return { hp, maxHp: hp, block: 0, poison: 0, deck, hand: [], discard: [], guardians: [], embers: 0, maxEmbers: 0 };
}

export function createDuel(rivalIndex, seed) {
  const rng = makeRng(seed ?? 1234);
  const rival = RIVALS[rivalIndex];
  const duel = {
    rng, rivalIndex, rival,
    player: makeSide(PLAYER_MAX_HP, buildDeck(rng, null)),
    foe: makeSide(rival.hp, buildDeck(rng, rivalIndex === 0 ? 'flame' : rivalIndex === 1 ? 'tide' : 'stone')),
    turn: 'player', turnCount: 1, playedCourts: [], winner: null,
    log: [`Duel begins — ${rival.name}, ${rival.title}.`],
    cardsPlayed: 0, damageDealt: 0, embersEarned: 0,
  };
  drawCards(duel, 'player', 4);
  drawCards(duel, 'foe', 4);
  startTurn(duel, 'player');
  return duel;
}

export function otherSide(side) { return side === 'player' ? 'foe' : 'player'; }

export function drawCards(duel, side, count) {
  const s = duel[side];
  for (let i = 0; i < count; i += 1) {
    if (s.hand.length >= HAND_CAP) { duel.log.push(`${side === 'player' ? 'You' : 'Foe'} hand is full — card burned.`); break; }
    if (s.deck.length === 0) {
      if (s.discard.length === 0) break;
      s.deck = shuffle(s.discard, duel.rng); s.discard = [];
      duel.log.push(`${side === 'player' ? 'Your' : 'Foe'} discard reshuffled into the deck.`);
    }
    s.hand.push(s.deck.pop());
  }
}

/** Poison ticks, embers refill, fresh guardians wake. Called when a side's turn opens. */
export function startTurn(duel, side) {
  const s = duel[side];
  s.block = 0;
  if (s.poison > 0) {
    dealDamage(duel, side, s.poison, 'poison');
    duel.log.push(`${side === 'player' ? 'You take' : 'Foe takes'} ${s.poison} poison.`);
    s.poison = Math.max(0, s.poison - 1);
  }
  s.maxEmbers = Math.min(MAX_EMBERS, 2 + Math.floor((duel.turnCount + (side === 'foe' ? 1 : 0)) / 2) + (side === 'foe' ? duel.rival.emberBonus : 0));
  if (side === 'player') s.maxEmbers = Math.min(MAX_EMBERS, 3 + Math.floor((duel.turnCount - 1) / 2));
  s.embers = s.maxEmbers;
  duel.playedCourts = [];
  for (const g of s.guardians) { g.sick = false; if (g.frozen > 0) g.frozen -= 1; }
  drawCards(duel, side, side === 'player' ? 2 : 2);
  if (duel.winner) return;
  duel.log.push(`${side === 'player' ? 'Your' : 'Foe'} turn — ${s.embers} embers.`);
}

export function dealDamage(duel, side, amount, source) {
  if (amount <= 0 || duel.winner) return 0;
  const s = duel[side];
  let left = amount;
  if (s.block > 0) { const absorbed = Math.min(s.block, left); s.block -= absorbed; left -= absorbed; }
  if (left > 0) s.hp -= left;
  if (side === 'foe') duel.damageDealt += amount;
  if (s.hp <= 0) {
    s.hp = 0;
    duel.winner = side === 'foe' ? 'player' : 'foe';
    duel.log.push(`${side === 'player' ? 'You fall' : `${duel.rival.name} falls`} (${source}).`);
  }
  return amount;
}

function damageGuardian(duel, side, index, amount) {
  const s = duel[side];
  const g = s.guardians[index];
  if (!g) return;
  g.hp -= amount;
  duel.log.push(`${g.name} takes ${amount}.`);
  if (g.hp <= 0) { duel.log.push(`${g.name} is shattered.`); s.guardians.splice(index, 1); }
}

export function canPlay(duel, side, handIndex) {
  const s = duel[side];
  const card = CARD_BY_ID[s.hand[handIndex]];
  if (!card || duel.turn !== side || duel.winner) return false;
  return s.embers >= card.cost;
}

/**
 * Play a hand card. target: { kind: 'hero' } or { kind: 'guardian', index }.
 * Attack cards need a target; guardians and spells do not. Returns true on success.
 * Resonance: the second card of the same court in one turn fires that court's bonus.
 */
export function playCard(duel, side, handIndex, target) {
  const s = duel[side];
  const foe = duel[otherSide(side)];
  const cardId = s.hand[handIndex];
  const card = CARD_BY_ID[cardId];
  if (!card || duel.turn !== side || duel.winner) return false;
  if (s.embers < card.cost) return false;
  if (card.kind === 'attack' && !target) return false;
  if (card.kind === 'guardian' && s.guardians.length >= MAX_GUARDIANS) { duel.log.push('Guardian row is full.'); return false; }

  const resonant = duel.playedCourts.includes(card.court);
  s.embers -= card.cost;
  s.hand.splice(handIndex, 1);
  s.discard.push(cardId);
  duel.playedCourts.push(card.court);
  duel.cardsPlayed += 1;
  const who = side === 'player' ? 'You play' : 'Foe plays';
  duel.log.push(`${who} ${card.name}${resonant ? ' — RESONANCE!' : ''}`);

  let dmg = card.dmg || 0;
  let block = card.block || 0;
  let heal = card.heal || 0;
  let draw = card.draw || 0;
  let poison = card.poison || 0;
  if (resonant) {
    if (card.court === 'flame') dmg += 3;
    if (card.court === 'tide') { draw += 1; heal += 3; }
    if (card.court === 'thorn') poison += 2;
    if (card.court === 'stone') block += 5;
  }
  if (card.kind === 'guardian') {
    const bonus = resonant && card.court === 'thorn' ? 1 : 0;
    const g = { id: card.id, name: card.name, atk: (card.atk || 0) + bonus, hp: (card.hp || 0) + bonus, maxHp: (card.hp || 0) + bonus, sick: true, frozen: 0, court: card.court };
    s.guardians.push(g);
    if (poison > 0) { foe.poison += poison; duel.log.push(`Foe poisoned (${foe.poison}).`); }
  } else if (card.kind === 'attack') {
    if (card.aoe) {
      // AoE hits every enemy guardian and the hero.
      for (let i = foe.guardians.length - 1; i >= 0; i -= 1) damageGuardian(duel, otherSide(side), i, card.aoe);
      dealDamage(duel, otherSide(side), dmg, card.name);
    } else if (target.kind === 'guardian') {
      const idx = Math.min(target.index, foe.guardians.length - 1);
      if (idx < 0) { dealDamage(duel, otherSide(side), dmg, card.name); }
      else damageGuardian(duel, otherSide(side), idx, dmg);
      if (card.freeze) { const g = foe.guardians[idx]; if (g) { g.frozen = 1; duel.log.push(`${g.name} is frozen.`); } }
    } else {
      dealDamage(duel, otherSide(side), dmg, card.name);
    }
    if (poison > 0 && !card.aoe) { foe.poison += poison; duel.log.push(`Foe poisoned (${foe.poison}).`); }
    if (card.freeze && target.kind === 'hero') { const g = foe.guardians[0]; if (g) { g.frozen = 1; duel.log.push(`${g.name} is frozen.`); } }
    if (block > 0) s.block += block;
    if (heal > 0) s.hp = Math.min(s.maxHp, s.hp + heal);
    if (draw > 0) drawCards(duel, side, draw);
  } else {
    if (block > 0) s.block += block;
    if (heal > 0) s.hp = Math.min(s.maxHp, s.hp + heal);
    if (poison > 0) { foe.poison += poison; duel.log.push(`Foe poisoned (${foe.poison}).`); }
    if (draw > 0) drawCards(duel, side, draw);
  }
  return true;
}

/** End-of-turn guardian strikes, then hand the turn over. */
export function endTurn(duel) {
  if (duel.winner) return;
  const side = duel.turn;
  const foeSide = otherSide(side);
  // Each ready guardian strikes the foe's leftmost guardian, else the hero.
  for (const g of duel[side].guardians.slice()) {
    if (duel.winner) break;
    if (g.sick || g.frozen > 0) continue;
    const foe = duel[foeSide];
    if (foe.guardians.length > 0) damageGuardian(duel, foeSide, 0, g.atk);
    else dealDamage(duel, foeSide, g.atk, `${g.name} strike`);
    duel.log.push(`${g.name} strikes for ${g.atk}.`);
  }
  if (duel.winner) return;
  duel.turn = foeSide;
  if (foeSide === 'player') duel.turnCount += 1;
  startTurn(duel, foeSide);
}

/** First playable target for an attack card: leftmost guardian, else the hero. */
export function defaultTarget(duel, side) {
  const foe = duel[otherSide(side)];
  return foe.guardians.length > 0 ? { kind: 'guardian', index: 0 } : { kind: 'hero' };
}

export function playableIndices(duel, side) {
  const out = [];
  for (let i = 0; i < duel[side].hand.length; i += 1) if (canPlay(duel, side, i)) out.push(i);
  return out;
}
