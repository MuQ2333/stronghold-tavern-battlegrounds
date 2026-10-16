// Helpful refreshes: Knockoff Wisdomball (BG30_802), two MANUAL refreshes per cast.
// Source card text: HearthstoneJSON; outcome adaptations and probabilities: docs/SPELLS.md.
// [ASSUMED] Eligible outcomes have equal weight. No buddies exist here; utility operators are their analogue.
import { pieceBonds } from './bondsMeta.js';

export const WISDOM_OUTCOMES = Object.freeze(['mirror', 'legendary', 'golden', 'triple', 'bond', 'higher', 'identical', 'utility', 'spells']);

export function helpfulRefresh(ps, forced = null) {
  const gd = ps.gd;
  const all = gd.visibleChess.filter(id => ps.m.pool.entries.has(id) && ps.m.pool.left(id) > 0);
  const normal = all.filter(id => gd.chess(id).tier <= ps.shop.level);
  const board = [...ps.board.values()].filter(p => p.kind === 'chess');
  const mirror = board.map(p => gd.baseIdOf(p.id)).filter(id => all.includes(id));
  const counts = new Map();
  for (const p of board) for (const id of pieceBonds(gd, p)) counts.set(id, (counts.get(id) || 0) + 1);
  const maxCount = Math.max(0, ...counts.values());
  const majority = [...counts].filter(([, n]) => n === maxCount).map(([id]) => id);
  const bonded = normal.filter(id => gd.chess(id).bonds.some(b => majority.includes(b)));
  const higher = all.filter(id => gd.chess(id).tier >= ps.shop.level);
  const rare = all.filter(id => gd.chess(id).rarity === 5);
  const utility = normal.filter(id => gd.chess(id).garrisonIds.some(gid =>
    ['SERVER_GAIN', 'SERVER_PREP_START', 'SERVER_PREP_FIN'].includes(gd.garrison(gid)?.eventType)));
  const triples = [...new Set(ps.allChess().filter(p => !gd.isGolden(p.id) && !(p.meta?.spellLockUntil > ps.m.round)).map(p => gd.baseIdOf(p.id)))]
    .filter(id => normal.includes(id) && ps.countCopies(id) > 0 && gd.mergeCount(id) > 1);
  const eligible = WISDOM_OUTCOMES.filter(mode => {
    if (mode === 'mirror') return mirror.length > 0;
    if (mode === 'legendary') return rare.length > 0;
    if (mode === 'triple') return triples.length > 0;
    if (mode === 'bond') return bonded.length > 0;
    if (mode === 'higher') return higher.length > 0;
    if (mode === 'utility') return utility.length > 0;
    if (mode === 'spells') return ps.spellPool().length > 0;
    return normal.length > 0;
  });
  const mode = forced == null ? ps.spellSample(eligible)[0] : eligible.includes(forced) ? forced : null;
  if (!mode) return null;
  const capacity = gd.shopSlots(ps.shop.level);
  const maxCapacity = gd.shopSlots(gd.maxShopLevel);
  const maxSlots = maxCapacity.chess + maxCapacity.item + 1;
  // Explicit maintainer rule: borrow item/spell positions, never grow beyond the level-six row.
  const n = mode === 'mirror' ? Math.min(maxSlots, Math.max(capacity.chess, mirror.length)) : capacity.chess;
  const slot = id => ({ kind: 'chess', id, basePrice: gd.chessPrice(id), sold: false, frozen: !!ps.shop.frozen });
  const fill = ids => Array.from({ length: n }, () => ids.length ? slot(ps.spellSample(ids)[0]) : null);
  // Keep equipment and spell categories separate for operator refreshes.
  const layout = ps.shop.layout;
  const equipment = ps.shop.slots.slice(layout.chess, layout.chess + layout.item);
  const spells = ps.shop.slots.slice(layout.chess + layout.item, layout.chess + layout.item + (layout.spell || 0));
  let units;
  if (mode === 'spells') {
    const size = capacity.chess + capacity.item + 1;
    ps.shop.slots = Array.from({ length: size }, () => ps._rollItemSlot(true));
    for (const s of ps.shop.slots) if (s) s.frozen = !!ps.shop.frozen;
    ps.shop.layout = { chess: 0, item: 0, spell: size };
    ps.shop.spellOverride = 'spell';
  } else {
    if (mode === 'mirror') units = [...ps.spellSample(mirror, n).map(slot), ...fill(normal)].slice(0, n);
    else if (mode === 'legendary') units = fill(rare);
    else if (mode === 'utility') units = fill(utility);
    else if (mode === 'bond') units = fill(bonded);
    else if (mode === 'higher') units = fill(higher);
    else if (mode === 'identical') { const id = ps.spellSample(normal)[0]; units = Array.from({ length: n }, () => slot(id)); }
    else units = fill(normal);
    if (mode === 'golden') {
      const candidates = units.filter(s => gd.goldenIdOf(s.id));
      const chosen = ps.spellSample(candidates)[0];
      if (chosen) { chosen.id = gd.goldenIdOf(chosen.id); chosen.spellGoldenReward = true; }
    }
    if (mode === 'triple') {
      const id = ps.spellSample(triples)[0];
      const needed = Math.max(1, gd.mergeCount(id) - ps.countCopies(id));
      while (units.length < needed) units.push(slot(id));
      for (let i = 0; i < needed; i++) units[i] = slot(id);
    }
    const equipmentKept = mode === 'mirror' ? equipment.slice(0, Math.max(0, maxSlots - units.length)) : equipment;
    const spellsKept = mode === 'mirror' ? spells.slice(0, Math.max(0, maxSlots - units.length - equipmentKept.length)) : spells;
    ps.shop.slots = [...units, ...equipmentKept, ...spellsKept];
    ps.shop.layout = { chess: units.length, item: equipmentKept.length, spell: spellsKept.length };
    ps.shop.spellOverride = units.length > capacity.chess ? 'wisdom' : null;
  }
  ps.spellData().lastWisdom = mode;
  ps.dirty();
  return mode;
}
