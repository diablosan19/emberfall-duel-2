// Emberfall Duel — headless engine tests (node, no browser).
// Run: node tests/test-engine.mjs
import { CATALOGUE, CARD_BY_ID, COURTS, RIVALS, buildDeck } from '../game/src/cards.js';
import { createDuel, playCard, endTurn, drawCards, dealDamage, HAND_CAP, MAX_GUARDIANS } from '../game/src/engine.js';
import { runAiTurn } from '../game/src/ai.js';

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed += 1; console.log(`  ok  ${name}`); }
  else { failed += 1; console.log(`FAIL  ${name}`); }
}

console.log('catalogue');
check('32 cards', CATALOGUE.length === 32);
check('8 per court', ['flame', 'tide', 'thorn', 'stone'].every((c) => CATALOGUE.filter((x) => x.court === c).length === 8));
check('4 courts defined', Object.keys(COURTS).length === 4);
check('3 rivals', RIVALS.length === 3);
check('deck is 24 cards', buildDeck(() => 0.5, null).length === 24);

console.log('resonance math');
{
  const d = createDuel(0, 42);
  // Force a known hand: two Flame attacks.
  d.player.hand = ['ember-spark', 'flame-lash'];
  d.player.embers = 10;
  const foeHp = d.foe.hp;
  playCard(d, 'player', 0, { kind: 'hero' });
  check('first flame deals 3', d.foe.hp === foeHp - 3);
  playCard(d, 'player', 0, { kind: 'hero' });
  check('resonant flame deals 5+3=8', d.foe.hp === foeHp - 3 - 8);
}
{
  const d = createDuel(0, 43);
  d.player.hand = ['stone-wall', 'bulwark'];
  d.player.embers = 10;
  playCard(d, 'player', 0, null);
  check('first stone gives 6 block', d.player.block === 6);
  playCard(d, 'player', 0, null);
  check('resonant stone gives 9+5 block', d.player.block === 6 + 14);
}
{
  const d = createDuel(0, 44);
  d.player.hand = ['thorn-vine', 'venom-thorn'];
  d.player.embers = 10;
  playCard(d, 'player', 0, null);
  check('first thorn poisons 3', d.foe.poison === 3);
  playCard(d, 'player', 0, { kind: 'hero' });
  check('resonant thorn poisons 3+2 more', d.foe.poison === 3 + 5);
}

console.log('guardians');
{
  const d = createDuel(0, 45);
  d.player.hand = ['flare-imp', 'granite-golem', 'briar-wolf', 'root-warden'];
  d.player.embers = 10;
  playCard(d, 'player', 0, null);
  playCard(d, 'player', 0, null);
  playCard(d, 'player', 0, null);
  check('3 guardians summoned', d.player.guardians.length === 3);
  check('guardians are sick on summon', d.player.guardians.every((g) => g.sick));
  const ok = playCard(d, 'player', 0, null);
  check('4th guardian refused (max 3)', ok === false && d.player.guardians.length === 3);
  // End turn: sick guardians must NOT strike.
  const foeHp = d.foe.hp;
  endTurn(d); // foe turn starts; foe AI runs separately — check sick guardians did not hit
  check('sick guardians do not strike', d.foe.hp === foeHp);
}
{
  // A ready guardian strikes the leftmost foe guardian, then the hero.
  const d = createDuel(0, 46);
  d.player.guardians = [{ id: 'x', name: 'Test', atk: 4, hp: 5, maxHp: 5, sick: false, frozen: 0, court: 'flame' }];
  d.foe.guardians = [{ id: 'y', name: 'Shield', atk: 1, hp: 3, maxHp: 3, sick: false, frozen: 0, court: 'stone' }];
  const foeHp = d.foe.hp;
  endTurn(d);
  check('guardian strike kills leftmost foe guardian (4 dmg vs 3 hp)', d.foe.guardians.length === 0);
  check('strike absorbed by guardian, hero untouched', d.foe.hp === foeHp);
  // Next turn the same guardian (now on foe side? no — player's) — re-check hero strike:
  const d2 = createDuel(0, 47);
  d2.player.guardians = [{ id: 'x', name: 'Test', atk: 4, hp: 5, maxHp: 5, sick: false, frozen: 0, court: 'flame' }];
  const hp2 = d2.foe.hp;
  endTurn(d2);
  check('guardian strikes hero when no foe guardian', d2.foe.hp === hp2 - 4);
}

console.log('hand cap + poison + block');
{
  const d = createDuel(0, 48);
  d.player.hand = [];
  d.player.deck = Array.from({ length: 20 }, () => 'ember-spark');
  drawCards(d, 'player', 20);
  check('hand cap 7 holds', d.player.hand.length === HAND_CAP);
}
{
  const d = createDuel(0, 49);
  d.player.poison = 3;
  const hp = d.player.hp;
  // Simulate a fresh player turn start: poison ticks then drops by 1.
  d.player.block = 0;
  const { startTurn } = await import('../game/src/engine.js');
  startTurn(d, 'player');
  check('poison ticks for full stacks', d.player.hp === hp - 3);
  check('poison stacks decay by 1', d.player.poison === 2);
}
{
  const d = createDuel(0, 50);
  d.player.block = 5;
  dealDamage(d, 'player', 8, 'test');
  check('block absorbs first, 3 leaks through', d.player.hp === 30 - 3 && d.player.block === 0);
}

console.log('full duels vs all 3 rivals');
for (let r = 0; r < 3; r += 1) {
  let wins = 0;
  for (let s = 0; s < 30; s += 1) {
    const d = createDuel(r, 1000 + s * 13);
    let turns = 0;
    while (!d.winner && turns < 200) {
      turns += 1;
      // Player side: greedy autopilot — play the first affordable card, then end.
      let guard = 0;
      while (guard < 10 && d.turn === 'player' && !d.winner) {
        guard += 1;
        const pick = d.player.hand.findIndex((id) => d.player.embers >= CARD_BY_ID[id].cost && (CARD_BY_ID[id].kind !== 'guardian' || d.player.guardians.length < MAX_GUARDIANS));
        if (pick < 0) break;
        const card = CARD_BY_ID[d.player.hand[pick]];
        playCard(d, 'player', pick, card.kind === 'attack' ? (d.foe.guardians.length ? { kind: 'guardian', index: 0 } : { kind: 'hero' }) : null);
      }
      if (d.winner) break;
      if (d.turn === 'player') endTurn(d);
      if (d.winner) break;
      if (d.turn === 'foe') runAiTurn(d);
    }
    check(`rival ${r} duel ${s} ends with a winner (turns=${turns})`, !!d.winner);
    if (d.winner === 'player') wins += 1;
  }
  console.log(`  rival ${r}: player won ${wins}/30 (AI should win most)`);
  check(`rival ${r} duels all terminate`, true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
