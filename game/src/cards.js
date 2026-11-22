// Emberfall Duel — the card catalogue: 32 cards in 4 courts.
// A court is told apart by colour AND by its drawn glyph, never by text alone.
// Flame (red) = damage. Tide (blue) = draw + heal. Thorn (green) = guardians + poison.
// Stone (amber) = block + armor. Every card carries its own effect fields so the
// engine can resolve it without knowing the card's name.
export const COURTS = {
  flame: { name: 'Flame', color: '#e5484d', dark: '#8f1d20', light: '#ff8a7a', glyph: 'flame', bonus: 'Resonance: +3 damage' },
  tide: { name: 'Tide', color: '#3a86ff', dark: '#163a75', light: '#8ec2ff', glyph: 'drop', bonus: 'Resonance: draw 1, heal 3' },
  thorn: { name: 'Thorn', color: '#43aa5b', dark: '#1d5c2e', light: '#8fe0a4', glyph: 'leaf', bonus: 'Resonance: +2 poison' },
  stone: { name: 'Stone', color: '#e8a33d', dark: '#7a5310', light: '#ffd28a', glyph: 'peak', bonus: 'Resonance: +5 block' },
};
export const COURT_ORDER = ['flame', 'tide', 'thorn', 'stone'];

// kind: 'attack' (needs a target), 'guardian' (summons), 'spell' (no target).
// dmg / heal / block / draw / poison / aoe / freeze: the effect numbers the engine reads.
export const CATALOGUE = [
  // ---- Flame: damage ----
  { id: 'ember-spark', name: 'Ember Spark', court: 'flame', cost: 1, kind: 'attack', dmg: 3, text: 'Deal 3 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', court: 'flame', cost: 2, kind: 'attack', dmg: 5, text: 'Deal 5 damage.' },
  { id: 'cinder-fan', name: 'Cinder Fan', court: 'flame', cost: 2, kind: 'attack', dmg: 2, aoe: 2, text: 'Deal 2 to all foes.' },
  { id: 'pyro-burst', name: 'Pyro Burst', court: 'flame', cost: 3, kind: 'attack', dmg: 7, text: 'Deal 7 damage.' },
  { id: 'flare-imp', name: 'Flare Imp', court: 'flame', cost: 2, kind: 'guardian', atk: 2, hp: 2, text: 'Guardian 2/2.' },
  { id: 'blaze-hound', name: 'Blaze Hound', court: 'flame', cost: 3, kind: 'guardian', atk: 3, hp: 3, text: 'Guardian 3/3.' },
  { id: 'immolate', name: 'Immolate', court: 'flame', cost: 3, kind: 'attack', dmg: 4, poison: 2, text: 'Deal 4. Poison 2.' },
  { id: 'meteor-fall', name: 'Meteor Fall', court: 'flame', cost: 4, kind: 'attack', dmg: 9, text: 'Deal 9 damage.' },
  // ---- Tide: draw + heal ----
  { id: 'tide-surge', name: 'Tide Surge', court: 'tide', cost: 1, kind: 'spell', heal: 4, draw: 1, text: 'Heal 4. Draw 1.' },
  { id: 'springwell', name: 'Springwell', court: 'tide', cost: 2, kind: 'spell', heal: 7, text: 'Heal 7.' },
  { id: 'deep-draw', name: 'Deep Draw', court: 'tide', cost: 2, kind: 'spell', draw: 2, text: 'Draw 2 cards.' },
  { id: 'frostbite', name: 'Frostbite', court: 'tide', cost: 2, kind: 'attack', dmg: 2, freeze: 1, text: 'Deal 2. Freeze a guardian.' },
  { id: 'tidecaller', name: 'Tidecaller', court: 'tide', cost: 2, kind: 'guardian', atk: 1, hp: 4, text: 'Guardian 1/4.' },
  { id: 'reef-guard', name: 'Reef Guard', court: 'tide', cost: 3, kind: 'guardian', atk: 2, hp: 5, text: 'Guardian 2/5.' },
  { id: 'undertow', name: 'Undertow', court: 'tide', cost: 3, kind: 'attack', dmg: 4, draw: 1, text: 'Deal 4. Draw 1.' },
  { id: 'floodtide', name: 'Floodtide', court: 'tide', cost: 4, kind: 'spell', heal: 8, draw: 2, text: 'Heal 8. Draw 2.' },
  // ---- Thorn: guardians + poison ----
  { id: 'thorn-vine', name: 'Thorn Vine', court: 'thorn', cost: 1, kind: 'spell', poison: 3, text: 'Poison 3.' },
  { id: 'spore-burst', name: 'Spore Burst', court: 'thorn', cost: 2, kind: 'attack', dmg: 3, poison: 2, text: 'Deal 3. Poison 2.' },
  { id: 'briar-wolf', name: 'Briar Wolf', court: 'thorn', cost: 2, kind: 'guardian', atk: 3, hp: 2, text: 'Guardian 3/2.' },
  { id: 'root-warden', name: 'Root Warden', court: 'thorn', cost: 3, kind: 'guardian', atk: 3, hp: 5, text: 'Guardian 3/5.' },
  { id: 'venom-thorn', name: 'Venom Thorn', court: 'thorn', cost: 2, kind: 'attack', dmg: 2, poison: 3, text: 'Deal 2. Poison 3.' },
  { id: 'overgrowth', name: 'Overgrowth', court: 'thorn', cost: 3, kind: 'guardian', atk: 4, hp: 4, text: 'Guardian 4/4.' },
  { id: 'strangle-vine', name: 'Strangle Vine', court: 'thorn', cost: 3, kind: 'attack', dmg: 2, poison: 4, text: 'Deal 2. Poison 4.' },
  { id: 'night-bloom', name: 'Night Bloom', court: 'thorn', cost: 4, kind: 'guardian', atk: 4, hp: 4, poison: 2, text: 'Guardian 4/4. Poison 2.' },
  // ---- Stone: block + armor ----
  { id: 'stone-wall', name: 'Stone Wall', court: 'stone', cost: 1, kind: 'spell', block: 6, text: 'Gain 6 block.' },
  { id: 'bulwark', name: 'Bulwark', court: 'stone', cost: 2, kind: 'spell', block: 9, text: 'Gain 9 block.' },
  { id: 'granite-golem', name: 'Granite Golem', court: 'stone', cost: 2, kind: 'guardian', atk: 2, hp: 4, text: 'Guardian 2/4.' },
  { id: 'bastion', name: 'Bastion', court: 'stone', cost: 3, kind: 'guardian', atk: 4, hp: 5, text: 'Guardian 4/5.' },
  { id: 'shield-bash', name: 'Shield Bash', court: 'stone', cost: 2, kind: 'attack', dmg: 3, block: 5, text: 'Deal 3. Gain 5 block.' },
  { id: 'quake', name: 'Quake', court: 'stone', cost: 3, kind: 'attack', dmg: 3, aoe: 3, text: 'Deal 3 to all foes.' },
  { id: 'iron-hide', name: 'Iron Hide', court: 'stone', cost: 3, kind: 'spell', block: 8, heal: 3, text: 'Gain 8 block. Heal 3.' },
  { id: 'avalanche', name: 'Avalanche', court: 'stone', cost: 4, kind: 'attack', dmg: 6, block: 6, text: 'Deal 6. Gain 6 block.' },
];

export const CARD_BY_ID = Object.fromEntries(CATALOGUE.map((c) => [c.id, c]));

/** The three rivals of the campaign, rising difficulty. */
export const RIVALS = [
  { name: 'Ash Kip', title: 'Ember Pup', hp: 24, blunder: 0.35, emberBonus: 0, reward: 20, color: '#e5484d', taunt: 'I bite first, think later.' },
  { name: 'Mirelle', title: 'Tidecaller', hp: 28, blunder: 0.18, emberBonus: 1, reward: 35, color: '#3a86ff', taunt: 'The tide takes what it is owed.' },
  { name: 'Grandmaster Vey', title: 'Stone Sovereign', hp: 32, blunder: 0.05, emberBonus: 2, reward: 50, color: '#e8a33d', taunt: 'I have read every card you hold.' },
];

/** A small deterministic RNG (mulberry32) so scripted shots and tests repeat. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/**
 * A 24-card duel deck: 6 cards of each court, two copies of three cards per court,
 * so every hand can chase a resonance. The rival's deck skews toward its own court.
 */
export function buildDeck(rng, rivalCourt) {
  const picks = [];
  for (const court of COURT_ORDER) {
    const pool = CATALOGUE.filter((c) => c.court === court);
    const chosen = shuffle(pool, rng).slice(0, 3);
    for (const card of chosen) picks.push(card.id, card.id);
  }
  if (rivalCourt) {
    const extra = shuffle(CATALOGUE.filter((c) => c.court === rivalCourt), rng).slice(0, 2);
    for (const card of extra) picks.push(card.id);
    // Trim back to 24 by dropping two non-court cards at random.
    for (let n = 0; n < 2; n += 1) {
      const idx = picks.findIndex((id) => CARD_BY_ID[id].court !== rivalCourt);
      if (idx >= 0) picks.splice(idx, 1);
    }
  }
  return shuffle(picks, rng);
}

export function courtOf(cardId) { return CARD_BY_ID[cardId].court; }
