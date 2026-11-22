// Emberfall Duel — the rival AI. A readable heuristic, not a search:
// lethal first, remove the biggest threat, block/heal when low, summon when the
// row is empty, and blunder (play a random card) more often for easier rivals.
import { CARD_BY_ID } from './cards.js';
import { canPlay, defaultTarget, endTurn, playCard, playableIndices } from './engine.js';

function scorePlay(duel, side, handIndex) {
  const s = duel[side];
  const foe = duel[side === 'player' ? 'foe' : 'player'];
  const card = CARD_BY_ID[s.hand[handIndex]];
  const resonant = duel.playedCourts.includes(card.court);
  let score = 0;
  const dmg = (card.dmg || 0) + (resonant && card.court === 'flame' ? 3 : 0) + (card.aoe || 0);
  // Lethal: damage that ends the duel beats everything.
  const heroDmg = card.kind === 'attack' && !card.aoe ? dmg : dmg;
  if (heroDmg >= foe.hp && card.kind === 'attack') score += 1000;
  // Removal: killing the biggest enemy guardian is worth its stats.
  if (card.kind === 'attack' && foe.guardians.length > 0) {
    const biggest = Math.max(...foe.guardians.map((g) => g.atk + g.hp));
    score += Math.min(dmg, biggest) * 4;
  } else if (card.kind === 'attack') {
    score += dmg * 3;
  }
  if (card.kind === 'guardian') {
    score += (card.atk + card.hp) * 2.5;
    if (s.guardians.length === 0) score += 4;
    if (foe.guardians.length > 0 && s.guardians.length === 0) score += 3;
  }
  if (card.kind === 'spell' || card.block || card.heal) {
    if (s.hp <= 12) score += (card.block || 0) * 2 + (card.heal || 0) * 3;
    else score += (card.block || 0) * 0.8 + (card.heal || 0) * 0.8;
    score += (card.draw || 0) * 3;
  }
  if (card.poison) score += card.poison * 2 + (foe.poison > 0 ? 2 : 0);
  if (card.draw) score += card.draw * 3;
  if (card.freeze && foe.guardians.length > 0) score += 6;
  if (resonant) score += 8; // resonance is the fun layer — chase it.
  score -= card.cost * 1.5; // prefer cheap, efficient plays.
  return score;
}

/**
 * Play the foe's whole turn through the engine: pick the best-scoring card,
 * play it, repeat while anything affordable remains worth playing, then end.
 * Returns the list of card ids played, for the UI's pacing.
 */
export function runAiTurn(duel) {
  const played = [];
  const rival = duel.rival;
  for (let guard = 0; guard < 12; guard += 1) {
    if (duel.winner || duel.turn !== 'foe') break;
    const options = playableIndices(duel, 'foe');
    if (options.length === 0) break;
    let pick = options[0];
    let best = -Infinity;
    for (const i of options) {
      const sc = scorePlay(duel, 'foe', i);
      if (sc > best) { best = sc; pick = i; }
    }
    // Blunder: easier rivals sometimes play a random card instead of the best.
    if (duel.rng() < rival.blunder) pick = options[Math.floor(duel.rng() * options.length)];
    const card = CARD_BY_ID[duel.foe.hand[pick]];
    if (best < 2 && duel.rng() < 0.5 && duel.foe.embers < 6) break; // hold embers, pass.
    const target = card.kind === 'attack' ? defaultTarget(duel, 'foe') : null;
    if (playCard(duel, 'foe', pick, target)) played.push(card.id);
    else break;
  }
  if (!duel.winner && duel.turn === 'foe') endTurn(duel);
  return played;
}
