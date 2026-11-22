// Emberfall Duel — canvas rendering. Every picture on screen is drawn here:
// the title table, the duel table, the victory/defeat screens, and every card.
// Courts are told apart by colour AND by a drawn glyph (flame / drop / leaf / peak).
import { COURTS, CARD_BY_ID, RIVALS } from './cards.js';

export const W = 1280;
export const H = 720;

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** Draw a court's glyph centred at (x, y) with the given radius. */
export function drawGlyph(ctx, glyph, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 0.3, x + r * 0.7, y + r * 0.6, x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 0.7, y + r * 0.6, x - r * 0.9, y - r * 0.3, x, y - r);
    ctx.fill();
    ctx.fillStyle = '#ffd28a';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.2);
    ctx.bezierCurveTo(x + r * 0.4, y + r * 0.2, x + r * 0.3, y + r * 0.6, x, y + r * 0.7);
    ctx.bezierCurveTo(x - r * 0.3, y + r * 0.6, x - r * 0.4, y + r * 0.2, x, y - r * 0.2);
    ctx.fill();
  } else if (glyph === 'drop') {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x + r * 0.8, y - r * 0.1, x + r * 0.7, y + r * 0.7, x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 0.7, y + r * 0.7, x - r * 0.8, y - r * 0.1, x, y - r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.2, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x + r, y - r * 0.4, x + r * 0.7, y + r * 0.8, x, y + r);
    ctx.bezierCurveTo(x - r * 0.7, y + r * 0.8, x - r, y - r * 0.4, x, y - r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.8); ctx.lineTo(x, y + r * 0.85); ctx.stroke();
  } else {
    // peak: a mountain in a shield — Stone's glyph.
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.8);
    ctx.lineTo(x - r * 0.35, y - r * 0.5);
    ctx.lineTo(x, y + r * 0.1);
    ctx.lineTo(x + r * 0.4, y - r * 0.9);
    ctx.lineTo(x + r, y + r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.4, y - r * 0.9);
    ctx.lineTo(x + r * 0.15, y - r * 0.35);
    ctx.lineTo(x + r * 0.65, y - r * 0.35);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function hpBar(ctx, x, y, w, h, hp, maxHp, block, poison) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#e5484d'); grad.addColorStop(1, '#ff7a5c');
  ctx.fillStyle = grad;
  if (frac > 0) { roundRect(ctx, x + 2, y + 2, (w - 4) * frac, h - 4, (h - 4) / 2); ctx.fill(); }
  text(ctx, `${hp} / ${maxHp}`, x + w / 2, y + h / 2 + 1, 15, '#fff', 'center', 800);
  let bx = x + w + 8;
  if (block > 0) { text(ctx, `🛡 ${block}`, bx, y + h / 2, 15, '#8ec2ff', 'left', 800); bx += 62; }
  if (poison > 0) { text(ctx, `☠ ${poison}`, bx, y + h / 2, 15, '#8fe0a4', 'left', 800); }
}

function emberRow(ctx, x, y, have, max) {
  for (let i = 0; i < max; i += 1) {
    const cx = x + i * 24;
    ctx.beginPath();
    ctx.moveTo(cx, y - 9); ctx.lineTo(cx + 8, y); ctx.lineTo(cx, y + 9); ctx.lineTo(cx - 8, y);
    ctx.closePath();
    ctx.fillStyle = i < have ? '#ff9a3d' : 'rgba(255,255,255,0.14)';
    ctx.strokeStyle = i < have ? '#ffd28a' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
  }
}

function portrait(ctx, x, y, r, color, initial, name) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, color); grad.addColorStop(1, '#1a1210');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd28a'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, initial, x, y + 2, r * 0.9, '#fff', 'center', 800);
  text(ctx, name, x, y + r + 16, 14, '#f3e2c7', 'center', 700);
}

export function drawTable(ctx, t) {
  // Felt table with ember glow.
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, 760);
  g.addColorStop(0, '#3d2b1a'); g.addColorStop(0.55, '#241a10'); g.addColorStop(1, '#120d08');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,210,138,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 560, 250, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,210,138,0.12)';
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 500, 205, 0, 0, Math.PI * 2); ctx.stroke();
  // Drifting ember sparks.
  for (const p of t.sparks) {
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** One playing card. faceDown draws the card back; selected lifts it. */
export function drawCard(ctx, cardId, x, y, w, h, opts) {
  const o = opts || {};
  if (o.faceDown) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(o.tilt || 0);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#2a1a12'; roundRect(ctx, 0, 0, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(232,163,61,0.5)';
    roundRect(ctx, 6, 6, w - 12, h - 12, 7); ctx.stroke();
    // Neutral ember diamond — the back belongs to no court.
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - 16); ctx.lineTo(w / 2 + 11, h / 2); ctx.lineTo(w / 2, h / 2 + 16); ctx.lineTo(w / 2 - 11, h / 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }
  const card = CARD_BY_ID[cardId];
  const court = COURTS[card.court];
  const lift = o.selected ? -18 : (o.hover ? -10 : 0);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2 + lift);
  ctx.rotate(o.tilt || 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = o.selected ? 22 : 10; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#f7ead2'; roundRect(ctx, 0, 0, w, h, 10); ctx.fill();
  ctx.shadowColor = 'transparent';
  // Court banner.
  ctx.fillStyle = court.color; roundRect(ctx, 0, 0, w, h * 0.34, 10); ctx.fill();
  ctx.fillRect(0, h * 0.24, w, h * 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, h * 0.34, w, 3);
  // Cost gem.
  ctx.fillStyle = '#ff9a3d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(16, 16, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  text(ctx, String(card.cost), 16, 17, 16, '#3a1c00', 'center', 900);
  // Glyph + court name.
  drawGlyph(ctx, court.glyph, w / 2, h * 0.19, 17, 'rgba(255,255,255,0.95)');
  text(ctx, court.name.toUpperCase(), w / 2, h * 0.30, 10, 'rgba(255,255,255,0.9)', 'center', 800);
  // Name.
  ctx.fillStyle = '#241a10';
  ctx.font = `800 ${w > 120 ? 15 : 12}px Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  wrapText(ctx, card.name, w / 2, h * 0.44, w - 12, 15);
  // Power line.
  const power = card.kind === 'guardian' ? `${card.atk} / ${card.hp}` : (card.dmg ? `⚔ ${card.dmg}` : (card.block ? `🛡 ${card.block}` : (card.heal ? `✚ ${card.heal}` : '✦')));
  text(ctx, power, w / 2, h * 0.60, 19, '#241a10', 'center', 900);
  text(ctx, card.kind.toUpperCase(), w / 2, h * 0.70, 9, '#7a5c3a', 'center', 800);
  ctx.fillStyle = '#4a3624';
  ctx.font = `400 ${w > 120 ? 11 : 10}px Georgia, serif`;
  wrapText(ctx, card.text, w / 2, h * 0.84, w - 12, 12);
  // Affordability + resonance ring.
  if (o.selected) { ctx.strokeStyle = '#ffd28a'; ctx.lineWidth = 4; roundRect(ctx, -3, -3, w + 6, h + 6, 12); ctx.stroke(); }
  else if (o.affordable === false) { ctx.fillStyle = 'rgba(20,10,5,0.45)'; roundRect(ctx, 0, 0, w, h, 10); ctx.fill(); }
  ctx.restore();
}

function wrapText(ctx, s, x, y, maxW, lineH) {
  const words = s.split(' ');
  const lines = [''];
  for (const word of words) {
    const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(word);
    else lines[lines.length - 1] = test;
  }
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineH));
}

/** A guardian token on the table. */
export function drawGuardian(ctx, g, x, y, w, h, opts) {
  const o = opts || {};
  const court = COURTS[g.court];
  ctx.save();
  if (o.targetable) { ctx.strokeStyle = '#ffd28a'; ctx.lineWidth = 3; roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 12); ctx.stroke(); }
  ctx.fillStyle = g.frozen > 0 ? '#bfe3ff' : court.dark;
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = court.color; ctx.lineWidth = 2.5; ctx.stroke();
  drawGlyph(ctx, court.glyph, x + w / 2, y + h * 0.32, 16, court.light);
  text(ctx, g.name, x + w / 2, y + h * 0.56, 12, '#fff', 'center', 800);
  text(ctx, `${g.atk} / ${g.hp}`, x + w / 2, y + h * 0.76, 17, '#ffd28a', 'center', 900);
  if (g.sick) text(ctx, '💤 summoning', x + w / 2, y + h * 0.92, 9, 'rgba(255,255,255,0.75)', 'center', 700);
  if (g.frozen > 0) text(ctx, '❄ FROZEN', x + w / 2, y + h * 0.92, 9, '#163a75', 'center', 800);
  ctx.restore();
}

export function drawTitle(ctx, view) {
  drawTable(ctx, view);
  // Banner.
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, 240, 36, 800, 150, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,138,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  drawGlyph(ctx, 'flame', 640, 82, 26, '#ff8a5c');
  text(ctx, 'EMBERFALL DUEL', 640, 122, 54, '#ffd28a', 'center', 900);
  text(ctx, 'A turn-based card battler — four courts, one ember, no mercy.', 640, 158, 16, '#f3e2c7', 'center', 400);
  text(ctx, `Embers banked: ${view.embersBanked}   •   Best streak: ${view.bestStreak}`, 640, 205, 15, '#8fe0a4', 'center', 700);
  text(ctx, 'Choose your rival — click a card to duel', 640, 238, 17, '#fff', 'center', 800);
  // Rival cards.
  RIVALS.forEach((rival, i) => {
    const x = 340 + i * 220, y = 268, w = 190, h = 250;
    const locked = i > view.unlocked;
    ctx.save();
    ctx.fillStyle = locked ? '#241a10' : '#f7ead2';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = rival.color; roundRect(ctx, x, y, w, 86, 12); ctx.fill(); ctx.fillRect(x, y + 70, w, 16);
    portrait(ctx, x + w / 2, y + 58, 26, rival.color, rival.name[0], '');
    text(ctx, rival.name, x + w / 2, y + 122, 21, locked ? '#8a7a68' : '#241a10', 'center', 900);
    text(ctx, rival.title, x + w / 2, y + 148, 13, '#7a5c3a', 'center', 700);
    text(ctx, `♥ ${rival.hp} HP`, x + w / 2, y + 176, 15, '#a33', 'center', 800);
    text(ctx, `Reward ${rival.reward} embers`, x + w / 2, y + 200, 13, '#7a5310', 'center', 800);
    ctx.fillStyle = '#4a3624'; ctx.font = 'italic 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    wrapText(ctx, locked ? 'Beat the rival before to unlock.' : `“${rival.taunt}”`, x + w / 2, y + 226, w - 20, 13);
    if (locked) { ctx.fillStyle = 'rgba(20,10,5,0.5)'; roundRect(ctx, x, y, w, h, 12); ctx.fill(); text(ctx, '🔒 LOCKED', x + w / 2, y + h - 14, 13, '#ffd28a', 'center', 800); }
    ctx.restore();
  });
  // Court legend — suits by colour + shape.
  text(ctx, 'THE FOUR COURTS — match a court twice in one turn for RESONANCE', 640, 556, 14, '#ffd28a', 'center', 800);
  ['flame', 'tide', 'thorn', 'stone'].forEach((courtId, i) => {
    const c = COURTS[courtId];
    const x = 330 + i * 210;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(ctx, x, 576, 190, 58, 10); ctx.fill();
    drawGlyph(ctx, c.glyph, x + 28, 605, 15, c.color);
    text(ctx, c.name, x + 52, 598, 15, '#fff', 'left', 800);
    text(ctx, c.bonus.replace('Resonance: ', ''), x + 52, 618, 11, '#cbb896', 'left', 400);
  });
  text(ctx, 'Click a card to play it • 1–7 hotkeys • Space ends turn • Esc cancels • M mutes', 640, 668, 14, '#cbb896', 'center', 400);
  text(ctx, 'Guardians strike at end of turn — leftmost foe guardian first, then the hero.', 640, 692, 13, '#8a7a68', 'center', 400);
}

export function drawDuel(ctx, view) {
  const duel = view.duel;
  drawTable(ctx, view);
  const foe = duel.foe, player = duel.player;
  // Campaign strip.
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, 16, 10, 300, 30, 8); ctx.fill();
  text(ctx, `Campaign: ${duel.rival.name}  •  Turn ${duel.turnCount}  •  Streak ${view.streak}`, 166, 26, 13, '#ffd28a', 'center', 700);
  // Foe portrait + HP.
  portrait(ctx, 78, 78, 40, duel.rival.color, duel.rival.name[0], duel.rival.name);
  hpBar(ctx, 140, 62, 300, 24, foe.hp, foe.maxHp, foe.block, foe.poison);
  text(ctx, `Foe hand ${foe.hand.length}  •  Deck ${foe.deck.length}`, 140, 104, 13, '#cbb896', 'left', 700);
  emberRow(ctx, 580, 74, foe.embers, Math.max(foe.maxEmbers, 1));
  text(ctx, `${foe.embers} embers`, 580, 96, 12, '#cbb896', 'left', 700);
  // Foe hand (face down).
  foe.hand.forEach((_, i) => {
    const x = 760 + i * 42;
    drawCard(ctx, null, x, 42, 52, 74, { faceDown: true, tilt: (i - foe.hand.length / 2) * 0.04 });
  });
  // Foe guardians.
  text(ctx, 'FOE GUARDIANS', 640, 152, 12, '#cbb896', 'center', 800);
  foe.guardians.forEach((g, i) => {
    const x = 640 - (foe.guardians.length * 110) / 2 + i * 110 + 8;
    drawGuardian(ctx, g, x, 166, 94, 96, { targetable: view.selected != null && view.targeting === 'guardian' });
  });
  if (foe.guardians.length === 0) text(ctx, '— no guardians —', 640, 210, 13, 'rgba(255,255,255,0.35)', 'center', 400);
  // Centre divider + resonance indicator.
  ctx.strokeStyle = 'rgba(255,210,138,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(180, 288); ctx.lineTo(1100, 288); ctx.stroke();
  const played = duel.playedCourts;
  if (played.length > 0) {
    const last = played[played.length - 1];
    const c = COURTS[last];
    const count = played.filter((p) => p === last).length;
    ctx.fillStyle = count >= 2 ? c.color : 'rgba(0,0,0,0.5)';
    roundRect(ctx, 500, 296, 280, 30, 15); ctx.fill();
    drawGlyph(ctx, c.glyph, 522, 311, 10, '#fff');
    text(ctx, count >= 2 ? `RESONANCE! ${c.name} ×${count}` : `${c.name} played — play another ${c.name} for resonance`, 640, 312, 13, '#fff', 'center', 800);
  } else {
    text(ctx, 'Play two cards of one court in a turn to trigger RESONANCE', 640, 312, 13, '#cbb896', 'center', 400);
  }
  // Player guardians.
  text(ctx, 'YOUR GUARDIANS', 640, 340, 12, '#cbb896', 'center', 800);
  player.guardians.forEach((g, i) => {
    const x = 640 - (player.guardians.length * 110) / 2 + i * 110 + 8;
    drawGuardian(ctx, g, x, 354, 94, 96, {});
  });
  if (player.guardians.length === 0) text(ctx, '— no guardians —', 640, 398, 13, 'rgba(255,255,255,0.35)', 'center', 400);
  // Player HP + embers.
  portrait(ctx, 78, 520, 40, '#43aa5b', 'Y', 'You');
  hpBar(ctx, 140, 504, 300, 24, player.hp, player.maxHp, player.block, player.poison);
  text(ctx, `Deck ${player.deck.length}  •  Discard ${player.discard.length}`, 140, 540, 13, '#cbb896', 'left', 700);
  emberRow(ctx, 580, 516, player.embers, Math.max(player.maxEmbers, 1));
  text(ctx, `${player.embers} / ${player.maxEmbers} embers`, 580, 538, 12, '#cbb896', 'left', 700);
  // Duel log.
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, 1000, 150, 264, 300, 10); ctx.fill();
  text(ctx, 'DUEL LOG', 1132, 168, 13, '#ffd28a', 'center', 800);
  ctx.font = '12px Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const lines = duel.log.slice(-13);
  lines.forEach((line, i) => {
    ctx.fillStyle = i === lines.length - 1 ? '#fff' : '#cbb896';
    ctx.fillText(line.slice(0, 42), 1012, 186 + i * 20);
  });
  // End Turn button.
  const et = view.endTurnRect;
  ctx.fillStyle = duel.turn === 'player' && !duel.winner ? '#e8a33d' : '#5a4a38';
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  roundRect(ctx, et.x, et.y, et.w, et.h, 10); ctx.fill();
  ctx.shadowColor = 'transparent';
  text(ctx, duel.turn === 'player' ? 'END TURN' : 'FOE THINKING…', et.x + et.w / 2, et.y + et.h / 2, 16, '#241a10', 'center', 900);
  text(ctx, 'Space', et.x + et.w / 2, et.y + et.h - 12, 10, 'rgba(0,0,0,0.6)', 'center', 700);
  // Targeting hint.
  if (view.selected != null) {
    const card = CARD_BY_ID[player.hand[view.selected]];
    if (card && card.kind === 'attack') text(ctx, `Target ${card.name}: click the foe hero or a foe guardian`, 640, 468, 14, '#ffd28a', 'center', 800);
    else if (card) text(ctx, `${card.name} — click again to confirm, Esc to cancel`, 640, 468, 14, '#ffd28a', 'center', 800);
  } else if (view.hint) {
    text(ctx, view.hint, 640, 468, 14, '#cbb896', 'center', 400);
  }
  // Player hand — fanned, animated positions live in view.handPos.
  player.hand.forEach((cardId, i) => {
    const pos = view.handPos[i] || { x: 0, y: 0 };
    const card = CARD_BY_ID[cardId];
    drawCard(ctx, cardId, pos.x, pos.y, 118, 164, {
      selected: view.selected === i,
      hover: view.hover === i,
      affordable: player.embers >= card.cost && duel.turn === 'player',
      tilt: (i - (player.hand.length - 1) / 2) * 0.03,
    });
    text(ctx, String(i + 1), pos.x + 59, pos.y + 176, 11, '#8a7a68', 'center', 700);
  });
  // Damage floaters.
  for (const f of view.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    text(ctx, f.text, f.x, f.y, 26, f.color, 'center', 900);
  }
  ctx.globalAlpha = 1;
  // Victory / defeat overlays are drawn by drawEnd on top of this table.
}

export function drawEnd(ctx, view, won) {
  const duel = view.duel;
  ctx.fillStyle = 'rgba(10,5,2,0.72)'; ctx.fillRect(0, 0, W, H);
  // Confetti on victory.
  if (won) {
    for (const p of view.confetti) {
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.9;
      ctx.fillRect(p.x, p.y, 8, 5);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = won ? '#f7ead2' : '#2a1a12';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  roundRect(ctx, 340, 130, 600, 440, 18); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = won ? '#e8a33d' : '#e5484d'; ctx.lineWidth = 3; ctx.stroke();
  drawGlyph(ctx, won ? 'flame' : 'peak', 640, 190, 30, won ? '#e5484d' : '#8a7a68');
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 252, 52, won ? '#a33' : '#e5484d', 'center', 900);
  const body = won ? '#4a3624' : '#e8dcc4';
  const dim = won ? '#8a7a68' : '#a89880';
  text(ctx, won ? `${duel.rival.name} has fallen. The ember is yours.` : `${duel.rival.name} stands over your fallen cards.`, 640, 300, 16, body, 'center', 400);
  text(ctx, `Turns: ${duel.turnCount}   •   Cards played: ${duel.cardsPlayed}   •   Damage dealt: ${duel.damageDealt}`, 640, 344, 15, body, 'center', 700);
  if (won) {
    text(ctx, `+${duel.rival.reward} embers banked`, 640, 382, 20, '#7a5310', 'center', 900);
    text(ctx, `Win streak: ${view.streak}   •   Embers banked: ${view.embersBanked}`, 640, 412, 15, body, 'center', 700);
  } else {
    text(ctx, 'Your streak resets. Shuffle up and go again.', 640, 382, 15, body, 'center', 400);
  }
  // Buttons.
  for (const b of view.endButtons) {
    const label = b.action === 'next' && !won ? 'RETRY RIVAL' : b.label;
    ctx.fillStyle = b.primary ? '#e8a33d' : '#d8c9ae';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, label, b.x + b.w / 2, b.y + b.h / 2, 16, '#241a10', 'center', 900);
  }
  text(ctx, 'Click a button — or press Enter for the first one', 640, 540, 12, dim, 'center', 400);
}
