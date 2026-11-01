import { spellShopEnabled, spellTarget } from '../../../shared/spells.js';
import { growthPurchaseGrants, growthLayerBonus } from '../growthTraits.js';
import {isHandLocked} from '../../../shared/lockedCards.js';
import {unlockHandCards} from '../lockedCards.js';
import {growthSpellAmount,spellPurchaseParts} from '../growthSpells.js';
import {growthRollbackAvailable,growthSelfDamage} from '../growthKazdel.js';
// server/match/player/economy.js — PlayerState methods: the economy — funds, spending (onSpend), prep-side bond layer
// gains (clamped by layerGainRoom), the shop (onPrice prices, copy-weighted rolls from the shared pool plus the player's
// own 自选 stock — player/diy.js —, freeze) and its intents: g.buy, g.refresh, g.freeze, g.levelUp, g.sell.
// Installed on PlayerState.prototype by server/match/PlayerState.js (a method container: never instantiated; `this` is
// the player state).

import { ERR, PHASE, layerGainRoom } from '../../../shared/constants.js';
import { ruleOption } from '../../../shared/plugins/rules.js';
import { freeSlot } from '../board.js';
import { computeBonds } from '../bondsMeta.js';
import { OK, fail } from './common.js';
import { heroRefreshPrice, heroUpgradePrice, heroSlots, heroFreeRefresh, heroFirstRoundBlocked } from '../heroPowers.js';

export { spellShopEnabled } from '../../../shared/spells.js';

export class PlayerEconomy {
  addFunds(n, { reason = '' } = {}) {
    if (!Number.isFinite(n) || n === 0) return 0;
    const v = Math.trunc(n);
    const before = this.funds;
    this.funds = Math.max(0, this.funds + v);
    if (v > 0) this.stats.fundsGained += v;
    this.dirty();
    return this.funds - before;
  }

  spend(n) {
    const v = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
    if (v > this.funds) return false;
    this.funds -= v;
    this.stats.gold += v;
    this.round.spent += v;
    this.dirty();
    return true;
  }

  /** onSpend, dispatched once a payment's action is complete (buy / refresh / levelUp / reward / effect). */
  _afterSpend(amount, reason) {
    if (!(amount > 0)) return;
    this.m.dispatch(this, 'onSpend', { amount, reason, total: this.stats.gold });
  }

  /**
   * Bond layer gain (prep-side). `requireActive` = "使已激活的【X】层数+N". Returns layers added: at most the room left
   * under the mode cap (native 999, growth uncapped); a gain at the cap dispatches nothing.
   */
  addLayers(bondId, n, { requireActive = false, reason = '' } = {}) {
    n=growthSpellAmount(this,n,reason);
    if(this._growthCombat)return this._growthCombat.addLayers(bondId,n,{requireActive,reason});
    if (!this.gd.bond(bondId) || !Number.isFinite(n) || n <= 0) return 0;
    if (requireActive && !(this.bonds[bondId] && this.bonds[bondId].active)) return 0;
    n += growthLayerBonus(this,bondId,reason);
    const before = this.layers[bondId] || 0;
    const add = layerGainRoom(before, Math.floor(n), this.m.growthMode);
    if (add <= 0) return 0;
    this.layers[bondId] = before + add;
    this.recompute();
    // A live prep gain, not a view delta: reconnects and combat-result backfill must not replay the cue.
    if ([PHASE.ROUND_START, PHASE.SP_DRAFT, PHASE.PREP].includes(this.m.phase)) {
      this.m.sendTo(this.playerId, { t: 'm.layer', playerId: this.playerId, bondId, add });
    }
    this.m.dispatch(this, 'onLayers', { bondId, from: before, to: before + add, reason });
    return add;
  }

  /** Effective price of a shop slot after onPrice modifiers (never negative). */
  priceOf(slot) {
    if (!slot) return 0;
    if (this.m.spellShop && this.gd.item(slot.id)?.currency === 'life') return this.gd.item(slot.id).price;
    const ev = { slot, kind: slot.kind, id: slot.id, price: slot.basePrice };
    this.m.dispatch(this, 'onPrice', ev, { quiet: true });
    const p = Number(ev.price);
    return Number.isFinite(p) ? Math.max(0, Math.round(p)) : slot.basePrice;
  }

  _rollChessSlot() {
    // the slotted 自选 pieces join the draw once the 调度中心 reaches their slot's level (player/diy.js diyRollEntries)
    const id = this.m.pool.roll(this.m.rngShop, { maxTier: this.shop.level, extra: this.diyRollEntries() });
    return id ? { kind: 'chess', id, basePrice: this.gd.chessPrice(id), frozen: false, sold: false } : null;
  }

  _rollItemSlot(spell = false) {
    if (spell && this.m.spellShop) {
      const id = this.m.rngShop.pick(this.spellPool());
      return id ? { kind: 'item', id, basePrice: this.gd.item(id).price ?? this.gd.itemPrice(id), frozen: false, sold: false } : null;
    }
    const stock = this.m.itemPool;
    const filtered = spellShopEnabled(this.m.spellShop) ? {
      canGain: id => !!spellTarget(this.gd.item(id)) === spell && stock.canGain(id) && this.gd.item(id).tier <= this.shop.level,
      pick: (rng, list) => stock.pick(rng, list),
    } : stock;
    // startRound rolls the shop before recompute, so the cached this.bonds can be one round behind.
    // bondBias therefore calls computeBonds at the roll (no rng). The official rule passes null and
    // does not call it, so the shop's rng stays today's two draws.
    let bias = null;
    if (ruleOption(this.m?.rules, 'shopBias') === 'bondBias') {
      const bonds = computeBonds(this.gd, this);
      bias = new Set();
      for (const [id, st] of Object.entries(bonds)) if (st && st.active) bias.add(id);
    }
    const id = this.m.pool.rollItem(this.m.rngShop, this.shop.level, filtered, bias);
    return id ? { kind: 'item', id, basePrice: this.gd.itemPrice(id), frozen: false, sold: false } : null;
  }

  /**
   * Reroll the shop. keepFrozen → frozen unsold slots survive (round start); otherwise everything is rerolled
   * (manual refresh). Slot counts follow the current level.
   */
  rollShop({ keepFrozen = false } = {}) {
    if (this._consumeTestShop()) return;
    if (this.m.spellShop && keepFrozen && this.shop.spellOverride && this.shop.slots.some(s => s?.frozen && !s.sold)) {
      const layout = this.shop.layout;
      this.shop.slots = this.shop.slots.map((s, i) => s?.frozen && !s.sold ? s : i < layout.chess ? this._rollChessSlot() : this._rollItemSlot(i >= layout.chess + layout.item));
      this.dirty(); return;
    }
    this.shop.spellOverride = null;
    const { chess: baseChess, item: nItem } = this.gd.shopSlots(this.shop.level);
    const nChess = heroSlots(this, baseChess);
    const old = this.shop.slots;
    const layout = this.shop.layout || { chess: old.length, item: 0 };
    const oldChess = old.slice(0, layout.chess);
    const oldItems = old.slice(layout.chess);
    const keep = (s, kind) => (keepFrozen && s && s.kind === kind && !s.sold && s.frozen ? { ...s } : null);
    // frozen slots keep their position; sold / empty / unfrozen positions are rerolled
    const slots = [];
    for (let i = 0; i < nChess; i++) slots.push(keep(oldChess[i], 'chess') ?? this._rollChessSlot());
    for (let i = 0; i < nItem; i++) slots.push(keep(oldItems[i], 'item') ?? this._rollItemSlot());
    const spells = spellShopEnabled(this.m.spellShop);
    if (spells) slots.push(keep(oldItems[layout.item], 'item') ?? this._rollItemSlot(true));
    this.shop.slots = slots;
    this.shop.layout = { chess: nChess, item: nItem, ...(spells ? { spell: 1 } : {}) };
    for (const s of slots) if (s) s.frozen = this.shop.frozen;
    this.dirty();
  }

  /**
   * A test match's queued next shop (g.test shop) replaces this roll once and draws no rng. Queued layouts are validated by the command; level upgrades stay blocked until the roll consumes the queue.
   * The defensive fallback handles only corrupted internal state.
   * [ASSUMED] The queue replaces frozen slots too. Absent on a normal match, so this returns false immediately.
   * @returns {boolean} true when the queue was applied
   */
  _consumeTestShop() {
    const queued = this._testShopNext;
    if (this.m.test !== true || !queued) return false;
    this._testShopNext = null;
    const { chess: nChess, item: nItem } = this.gd.shopSlots(this.shop.level);
    const ok = Array.isArray(queued) && queued.length === nChess + nItem && queued.every((s, i) => {
      const kind = i < nChess ? 'chess' : 'item';
      return !!s && s.kind === kind && (kind === 'chess' ? !!this.gd.chess(s.id) : !!this.gd.item(s.id));
    });
    if (!ok) return false;
    const slots = queued.map((s) => ({
      kind: s.kind, id: s.id,
      basePrice: s.kind === 'chess' ? this.gd.chessPrice(s.id) : this.gd.itemPrice(s.id),
      frozen: false, sold: false,
    }));
    this.shop.slots = slots;
    this.shop.layout = { chess: nChess, item: nItem };
    for (const s of slots) if (s) s.frozen = this.shop.frozen;
    this.dirty();
    return true;
  }

  /**
   * The 调度中心's upgrade opens the new level's extra slots at once — EMPTY: no card is drawn into them (a `null` slot).
   * The next roll (a manual refresh or the round start) fills them with the other unfrozen slots; the cards already shown
   * stay where they are (chess slots keep their index, the item slot stays after them). Official: the footage of a 1→2
   * upgrade (bilibili BV1AXwuzdEys 1:39, GitHub #332 / PR #333 by @2321Robin) shows the new slot appear and stay empty, and
   * the texts only name the slots — the tutorial's 休整期 page 「升级后将出现更多的商品栏位」, PRTS 帮助 「增加刷新栏位」 —,
   * never a card that comes with them. 0.2.0 drew a card into each new slot instead (item 19 of the community report of
   * 2026-10-06, 「升级商店获得新的商店位时用新卡补上，而不是空着」, one uncorroborated remark; its follow-on, that the new card
   * follows the freeze toggle, was [ASSUMED]); until then the extra slots waited for the next roll as well.
   */
  _openLevelSlots() {
    if (this.m.spellShop && this.shop.spellOverride) return;
    const { chess: baseChess, item: nItem } = this.gd.shopSlots(this.shop.level);
    const nChess = heroSlots(this, baseChess);
    const old = this.shop.slots;
    const layout = this.shop.layout || { chess: old.length, item: 0 };
    if (nChess <= layout.chess && nItem <= layout.item) return;
    const chess = old.slice(0, layout.chess);
    const items = old.slice(layout.chess, layout.chess + layout.item);
    const spells = layout.spell ? old.slice(layout.chess + layout.item) : [];
    // loop-cap: validated shop slot counts; one slot is appended per iteration.
    while (chess.length < nChess) chess.push(null);
    // loop-cap: validated equipment-slot count; one slot is appended per iteration.
    while (items.length < nItem) items.push(null);
    this.shop.slots = [...chess, ...items, ...spells];
    this.shop.layout = { chess: chess.length, item: items.length, ...(layout.spell ? { spell: layout.spell } : {}) };
  }

  /** Combat start: unfrozen slots are emptied (research 01 A1). */
  clearUnfrozenShop() {
    this.shop.slots = this.shop.slots.map((s) => (s && s.frozen && !s.sold ? s : null));
    this.dirty();
  }

  /**
   * g.buy {slot}. A full regular hand refuses every purchase, also one whose copy would complete a merge at once (PRTS
   * 卫戍协议/帮助 §手牌区 "当常规手牌区全满无空位时，玩家将无法执行使手牌溢出的操作" — "例如招募/购入等通常情况下会增加手牌的
   * 操作"; BWIKI 盟约 "当整备区达到上限后将无法进行涉及到整备区的操作（购买、撤回等）"; GitHub #82: the reporter's first-hand
   * check in the official game, "哪怕是已经有了两个相同干员情况"). Until 0.1.3 such a purchase was let through.
   */
  buy(slotIdx) {
    if (heroFirstRoundBlocked(this)) return fail(ERR.WRONG_PHASE);
    const g = this._gate(); if (g) return g;
    if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= this.shop.slots.length) return fail(ERR.BAD_TARGET);
    const slot = this.shop.slots[slotIdx];
    if (!slot) return fail(ERR.BAD_TARGET);
    if (slot.sold) return fail(ERR.SOLD_OUT);
    const price = this.priceOf(slot);
    const health = this.m.spellShop && this.gd.item(slot.id)?.currency === 'life';
    const selfHarm=health&&this.m.growthMode&&slot.id==='hs_bg28_571';
    if (health && this.lp + (this.spellState?.armor || 0) <= price && !(selfHarm&&growthRollbackAvailable(this))) return fail(ERR.BAD_TARGET, 'life cost must leave at least one life');
    const spellBonus = this.spellPurchaseBonus(slot,{raw:true});
    const spellGrants = this.m.growthMode?spellPurchaseParts(this,slot):null;
    const growthGrants = growthPurchaseGrants(this, slot).map(g=>({...g}));
    if (!health && this.funds < price) return fail(ERR.NO_FUNDS);
    const handFull = freeSlot(this.hand) < 0;
    let piece;
    if (slot.kind === 'chess') {
      const rec = this.gd.chess(slot.id);
      // a DIY slot sells only as this player's own 自选 piece (a slotted slot's record carries `diyFor`)
      if (!rec || (rec.isDiy && !rec.diyFor)) return fail(ERR.BAD_TARGET);
      // Already displayed operators stay purchasable after stock runs out (#498; 路标月报#2,
      // BV1eLXXBqEgF 2:50–2:57: nine owned + four shop offers => thirteen owned).
      // acquireChess records every copy, including the deficit; future rolls still exclude empty stock.
      if (handFull) return fail(ERR.HAND_FULL);
      this.spend(price);
      slot.sold = true;
      piece = this.acquireChess(slot.id, { source: 'buy', fromPool: !slot.heroGenerated, noPoolTopUp: !!slot.heroGenerated });
    } else {
      if (!this.gd.item(slot.id)) return fail(ERR.BAD_TARGET);
      // Already displayed equipment stays purchasable after stock runs out (#624, maintainer 2026-10-14).
      // acquireItem records the debt. Future rolls still exclude empty stock. SOLD_OUT is only this slot, already sold.
      if (handFull) return fail(ERR.HAND_FULL);
      if (selfHarm)growthSelfDamage(this,price);
      else if (health) { this.lp -= this.spellAbsorb(price); this.m.markPublic(); } else this.spend(price);
      slot.sold = true;
      piece = this.acquireItem(slot.id, { source: 'buy', displayed: true });
    }
    this.stats.buys++;
    this.round.buys++;
    this.m.dispatch(this, 'onBuy', { piece, slot, price: health ? 0 : price, kind: slot.kind, spellBonus, ...(this.m.growthMode ? {growthGrants,spellGrants} : {}) });
    this._afterSpend(health ? 0 : price, 'buy');
    this.recompute();
    return OK;
  }

  refresh() {
    if (heroFirstRoundBlocked(this)) return fail(ERR.WRONG_PHASE);
    const g = this._gate(); if (g) return g;
    const heroFree = heroFreeRefresh(this);
    const free = heroFree || this.shop.freeRefreshes > 0;
    const price = free ? 0 : heroRefreshPrice(this);
    if (!free && this.funds < price) return fail(ERR.NO_FUNDS);
    if (heroFree) this.heroState.freeRefresh--;
    else if (free) this.shop.freeRefreshes--;
    else this.spend(price);
    // A manual refresh cancels the freeze: the new cards are not frozen (official, the owner's play of 2026-10-14;
    // GitHub #584, DESIGN §32.14.7). A refresh that fails (funds, phase) returns above and leaves the freeze on.
    this.shop.frozen = false;
    this.rollShop({ keepFrozen: false });
    this.stats.refreshes++;
    this.round.refreshes++;
    this.m.dispatch(this, 'onRefresh', { slots: this.shop.slots, free, price });
    this._afterSpend(price, 'refresh');
    this.dirty();
    return OK;
  }

  freeze() {
    const g = this._gate(); if (g) return g;
    this.shop.frozen = !this.shop.frozen;
    for (const s of this.shop.slots) if (s && !s.sold) s.frozen = this.shop.frozen;
    this.dirty();
    return OK;
  }

  levelUp() {
    if (this.m.test === true && this._testShopNext) return fail(ERR.WRONG_PHASE);
    if (heroFirstRoundBlocked(this)) return fail(ERR.WRONG_PHASE);
    const g = this._gate(); if (g) return g;
    if (this.shop.level >= this.gd.maxShopLevel) return fail(ERR.MAX_LEVEL);
    const price = heroUpgradePrice(this);
    if (this.funds < price) return fail(ERR.NO_FUNDS);
    this.spend(price);
    this.shop.level++;
    unlockHandCards(this);
    this.shop.upgradePrice = this.gd.upgradeBase(this.shop.level) ?? 0;
    this._openLevelSlots();
    this.m.tickerFor('SHOP_LEVEL', [this.name, String(this.shop.level)], { playerId: this.playerId, param: String(this.shop.level) });
    this.m.dispatch(this, 'onLevelUp', { level: this.shop.level, price });
    this._afterSpend(price, 'levelUp');
    this.dirty();
    return OK;
  }

  sell(uid) {
    const g = this._gate(); if (g) return g;
    const loc = this.find(uid);
    if (!loc) return fail(ERR.BAD_TARGET);
    if (loc.piece.kind !== 'chess') return fail(ERR.BAD_TARGET, loc.piece.kind === 'item' ? 'items cannot be sold' : 'tokens cannot be sold');
    const piece = loc.piece;
    if (piece.meta?.spellLockUntil > this.m.round || isHandLocked(piece)) return fail(ERR.BAD_TARGET);
    // Returned equipment can always wait in the overflow queue, even when all fifteen visible slots are occupied.
    this._detach(loc);
    this.removeTokensOf(piece.uid);
    for (const it of piece.items || []) this.stow(it, { allowTemp: true });
    piece.items = [];
    this.returnCopies(piece);
    const ev = { piece, gain: this.gd.sellPrice(piece.id) };
    this.m.dispatch(this, 'onSold', ev);
    const gain = Number.isFinite(ev.gain) ? Math.max(0, Math.trunc(ev.gain)) : 1;
    this.addFunds(gain, { reason: 'sell' });
    this.stats.sells++;
    this.round.sells++;
    this.checkItemMerges();
    this.recompute();
    return OK;
  }
}
