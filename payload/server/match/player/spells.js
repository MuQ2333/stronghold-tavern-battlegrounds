// Optional spell shop. User-authored rules; never active in a stock match.
// [ASSUMED] discover = up to three distinct eligible cards; no tier fallback; ties use stable ID order.
import { SHOP_SPELLS, customSpell } from '../../../shared/spellCatalog.js';
import { spellTarget } from '../../../shared/spells.js';
import { ERR } from '../../../shared/constants.js';
import { pieceBonds } from '../bondsMeta.js';
import { boardOrder, tileKey } from '../board.js';
import { OK, fail } from './common.js';
import { N_ } from '../../../shared/i18n.js';
import {strategyPool,replaceHeroStrategy} from '../heroPowers.js';
import { helpfulRefresh } from '../spellWisdom.js';

export class PlayerSpells {
  spellData() {
    return this.spellState ||= { growth: 0, right: 0, conditions: [], income: 0, armor: 0, pending: [], supports: [], attack: 0, sharing: 0, battle: null };
  }
  spellMates() { return this.m.alivePlayers().filter(p => p !== this && !p.left); }
  spellCanReady() { return this.m.spellShop && this.temp.every(p => !p || customSpell(p.id)?.name === '腐蚀的盟约之币'); }
  spellOverflow(piece) {
    if (this.m.spellShop && customSpell(piece.id)?.name === '腐蚀的盟约之币') this.spellData().income += 2;
  }
  spellEffectViews() {
    const s = this.spellState;
    if (!this.m.spellShop || !s) return [];
    const out = [];
    const push = (id, name, desc, counter, params = {}) => out.push({ id, name, desc, counter, params, spellUi: true, iconKind: 'item', iconId: 'spell' });
    if (s.growth) push('spell_growth', N_('商店购买奖励'), N_('每次购买干员后，使其所属盟约各增加显示层数。'), s.growth);
    if (s.right) push('spell_right', N_('最右侧购买奖励'), N_('购买商店最右侧干员的额外盟约层数奖励。'), s.right);
    for (const [i, c] of s.conditions.entries()) {
      push('spell_condition_' + i, N_('同盟约购买奖励'), '', c.n);
      out.at(-1).spellBonds = c.ids;
    }
    if (s.income) push('spell_income', N_('永久额外收入'), N_('每回合开始时额外获得资金。'), s.income);
    if (s.armor) push('spell_armor', N_('护甲'), N_('优先抵扣生命损失及购买法术支付的生命值。'), s.armor);
    for (const x of s.supports) if (x.round === this.m.round) push('spell_support_' + x.uid, N_('支援待部署'), N_('地块 {row},{col}：战斗开始部署嘲讽普通星熊，可参与本轮协防。'), 1, { row: x.row, col: x.col });
    if (s.wisdom) push('spell_wisdom', N_('智慧球'), N_('接下来的主动刷新为有用的刷新。'), s.wisdom);
    if (s.backToBack) push('spell_back_to_back', N_('背靠背'), N_('下一张背靠背使目标所属盟约层数+{layers}。'), s.backToBack, { layers: s.backToBack + 1 });
    if (s.attack) push('spell_attack', N_('诺兹多姆的子嗣'), N_('下一场战斗开始时，最靠右下的干员攻击力翻倍。'), s.attack);
    if (s.sharing) push('spell_sharing', N_('分享关爱'), N_('下一场战斗临时借用队友盟约层数，不占永久层数上限。'), s.sharing);
    return out;
  }
  spellEligible(rec) { return !rec.multiplayerOnly || (!this.m.isSolo && this.spellMates().length > 0); }
  spellPool(tier = this.shop.level, exact = false) {
    const native = Object.keys(this.gd._items).filter(id => {
      const r = this.gd.item(id);
      return !r.spellMod && !r.isGolden && spellTarget(r) && this.m.itemPool.canGain(id);
    });
    return [...native, ...SHOP_SPELLS.filter(c => this.spellEligible(c)).map(c => c.id)]
      .filter(id => exact ? this.gd.item(id).tier === tier : this.gd.item(id).tier <= tier).sort();
  }
  spellChessPool(tier = null, predicate = () => true) {
    return this.gd.visibleChess.filter(id => this.m.pool.entries.has(id) && this.m.pool.left(id) > 0
      && (tier == null ? this.gd.chess(id).tier <= this.shop.level : this.gd.chess(id).tier === tier)
      && predicate(this.gd.chess(id)));
  }
  spellSample(list, n = 1) { return this.m.rngMeta.shuffle([...list]).slice(0, n); }
  spellStrategyPool() {
    return strategyPool(this);
  }
  pickSpellStrategy(offer, idx) {
    const slot = offer.slots[idx];
    if (!slot || !this.spellStrategyPool().includes(slot.id)) return fail(ERR.BAD_TARGET);
    // Resolve an earned hero discover first; the spell offer stays queued and costs nothing more.
    if(this.heroState?.choices?.some(x=>!x.nguyen))return fail(ERR.BAD_TARGET);
    replaceHeroStrategy(this,slot.id);
    if (this.m.draft?.picks) this.m.draft.picks[this.playerId] = slot.id;
    this.offers.shift();
    // Mid-match starting gifts happen once on selection, not by replaying a whole round-start dispatch.
    for (const buff of this.gd.band(slot.id).buffs || []) {
      if (buff.key !== 'preparation_start_gain_chess_from_round' || Number(buff.bb?.round) !== 1) continue;
      const id = buff.bbStr?.chess;
      for (let i = 0; i < (Number(buff.bb?.count) || 1); i++) {
        if (this.gd.item(id)) this.acquireItem(id, { source: 'band' });
        else if (this.gd.chess(id)) this.acquireChess(id, { source: 'band' });
      }
    }
    this.recompute(); this.m.markPublic();
    // A former team strategy (e.g. Touch) may affect every teammate's prep preview.
    for (const ps of this.m.order) this.m.markPrivate(ps);
    return OK;
  }
  spellDiscover(kind, ids, source, extra = {}) {
    if (!ids.length) return false;
    this.offers.push({ tier: null, source: 'spell', label: source, ...extra, slots: this.spellSample([...new Set(ids)], 3).map(id => ({ kind, id, price: 0, sold: false })) });
    this.dirty(); return true;
  }
  spellLayers(piece, n, active = false) {
    const ids = pieceBonds(this.gd, piece).filter(id => !active || this.bonds[id]?.active);
    for (const id of ids) this.addLayers(id, n, { reason: 'spell' });
  }
  spellBoardLayers(n, active = false, eliteExtra = 0) {
    // Snapshot membership and activation before any layer side effects run.
    const work = boardOrder(this.board).filter(x => x.piece.kind === 'chess').map(({ piece }) => ({ ids: pieceBonds(this.gd, piece).filter(id => !active || this.bonds[id]?.active), n: n + (this.gd.isGolden(piece.id) ? eliteExtra : 0) }));
    for (const x of work) for (const id of x.ids) this.addLayers(id, x.n, { reason: 'spell' });
  }
  spellExtraGarrisons(piece, hook, source = piece) {
    if (!this.m.spellShop || hook !== 'onPrepEnd' || !source.meta?.spellEcho) return 0;
    this.spellLayers(piece, source.meta.spellEcho, true);
    return 1;
  }
  spellPurchaseBonus(slot) {
    if (!this.m.spellShop || !slot || slot.kind !== 'chess') return 0;
    const s = this.spellState;
    const ids = this.gd.chess(slot.id)?.bonds || [];
    const right = this.shop.slots.filter(x => x?.kind === 'chess' && !x.sold).at(-1);
    return (slot.spellBonus || 0) + (s?.growth || 0) + (slot === right ? s?.right || 0 : 0)
      + (s?.conditions || []).reduce((n, c) => n + (c.ids.some(id => ids.includes(id)) ? c.n : 0), 0);
  }
  castCatalogSpell(item, rec, targetUid, tile = null, automatic = false) {
    if (!this.spellEligible(rec) || rec.spellOption) return fail(ERR.BAD_TARGET);
    if (rec.oncePerRound && this.spellState?.usedRound?.[rec.id] === this.m.round) return fail(ERR.BAD_TARGET);
    const loc = targetUid == null ? null : this.find(targetUid);
    const target = loc?.piece;
    if (rec.spellTarget === 'chess' && (!target || target.kind !== 'chess')) return fail(ERR.BAD_TARGET);
    if (target?.meta?.spellLockUntil > this.m.round || target?.meta?.handLock || target?.handLock) return fail(ERR.BAD_TARGET);
    if (rec.spellTarget === 'tile') {
      if (!tile || !Number.isInteger(tile.row) || !Number.isInteger(tile.col)) return fail(ERR.BAD_TILE);
      const key = tileKey(tile.row, tile.col);
      if (this.board.has(key) || this.spellData().supports.some(x => x.row === tile.row && x.col === tile.col)
        || this.deployMap().get(key) !== 'melee') return fail(ERR.BAD_TILE);
    }
    // Playing the spell frees its inventory slot before it grants cards.
    const source = this.find(item.uid), deadline = this._tempDue.get(item.uid);
    if(source)this._detach(source);
    if (rec.choices) {
      this.offers.push({ source: 'spell', label: rec.name, spellChoice: { id: rec.id, targetUid }, slots: rec.choices.map((_, i) => ({ kind: 'item', id: rec.id + '_choice' + i, price: 0, sold: false })) });
    } else {
      const result = this.resolveCatalogSpell(rec, target, tile);
      if (result?.error) {
        if(automatic)return result;
        if (source.area === 'hand' && !this.hand[source.idx]) this.hand[source.idx] = item;
        else if (source.area === 'temp' && !this.temp[source.idx]) { this.temp[source.idx] = item; if (deadline != null) this._tempDue.set(item.uid, deadline); }
        else this.stow(item, { allowTemp: true });
        return result;
      }
    }
    if (rec.oncePerRound) (this.spellData().usedRound ||= {})[rec.id] = this.m.round;
    const owned = this.find(item.uid); if (owned) this._detach(owned);
    this.recompute(); return OK;
  }
  pickSpellChoice(offer, idx) {
    const rec = customSpell(offer.spellChoice.id);
    const target = this.find(offer.spellChoice.targetUid)?.piece;
    if (!rec || (rec.spellTarget === 'chess' && idx === 0 && !target)) return fail(ERR.BAD_TARGET);
    // Validate before removing the pending choice; failed choices remain selectable.
    if (rec.name === '无限潜力') {
      const pool = idx === 0 ? this.spellChessPool(this.shop.level) : this.spellPool(this.shop.level, true);
      if (!pool.length) return fail(ERR.BAD_TARGET);
      this.offers.shift();
      this.spellDiscover(idx === 0 ? 'chess' : 'item', pool, rec.name);
    } else {
      this.offers.shift();
      if (rec.name === '时间管理') {
        if (idx === 0) this.spellBoardLayers(2);
        else this.spellData().pending.push({ type: 'time', due: this.m.round + 1 });
      } else if (rec.name === '森林秘宝') {
        if (idx === 0) this.spellLayers(target, 8); else this.spellBoardLayers(2);
      }
    }
    this.recompute(); return OK;
  }
  resolveCatalogSpell(rec, target, tile) {
    const s = this.spellData(), name = rec.name;
    const active = () => this.gd.bondIds.filter(id => this.bonds[id]?.active);
    const normalShop = () => this.shop.slots.filter(x => x?.kind === 'chess' && !x.sold);
    switch (name) {
      case '新生幼苗':
      case '搜寻时光':
      case '猎头招聘':
      case '折价合集': {
        const tier = name === '新生幼苗' ? 1 : name === '搜寻时光' ? this.shop.level : null;
        // The event decides when a trait fires; SERVER_GAIN_* effect names are also used by sale/prep traits.
        const ids = this.spellChessPool(tier, c => name !== '猎头招聘' || (c.garrisonIds || []).some(id => this.gd.garrison(id)?.eventType === 'SERVER_GAIN'));
        if (!this.spellDiscover('chess', ids, name, { spellLock: name === '搜寻时光', spellShare: name === '折价合集' })) return fail(ERR.BAD_TARGET);
        break;
      }
      case '身份揭晓': {
        const ids = this.spellStrategyPool();
        if (!ids.length) return fail(ERR.BAD_TARGET);
        this.spellDiscover('band', ids, name, { spellStrategy: true });
        break;
      }
      case '意外之果': for (const slot of normalShop()) slot.spellBonus = (slot.spellBonus || 0) + 2; break;
      case '富足之杖': s.growth += 1; break;
      case '鲜血宝石弹幕': s.growth++; break;
      case '乘借东风': s.right += 3; break;
      case '艾欧娜尔的眷顾': s.conditions.push({ ids: pieceBonds(this.gd, target), n: 2 }); break;
      case '强固': target.meta.spellTaunt = true; break;
      case '搞怪裤': target.meta.spellTaunt = !(target.meta.spellTaunt ?? ((this.gd.chess(target.id)?.stats?.tauntLevel || 0) > 0)); break;
      case '尖利箭矢': {
        const id = pieceBonds(this.gd, target).find(id => this.gd.bond(id)?.isCore) || pieceBonds(this.gd, target)[0];
        if (id) this.addLayers(id, 4, { reason: 'spell' }); break;
      }
      case '快速浏览': this.shop.freeRefreshes += 2; break;
      case '拼命发掘': this.addFunds(1, { reason: 'spell' }); break;
      case '腐蚀的盟约之币': this.addFunds(2, { reason: 'spell' }); break;
      case '智慧球': s.wisdom = (s.wisdom || 0) + 2; break;
      case '背靠背':
        this.spellLayers(target, (s.backToBack || 0) + 1);
        s.backToBack = (s.backToBack || 0) + 1; break;
      case '回响咆哮': target.meta.spellEcho = (target.meta.spellEcho || 0) + 2; break;
      case '沉睡者之拥':
        if (!(this.gd.chess(target.id)?.garrisonIds || []).some(id => this.gd.garrison(id)?.eventType === 'SERVER_GAIN')) return fail(ERR.BAD_TARGET);
        this.m.dispatcher.triggerGarrisons(this, target, 'SERVER_GAIN', { triggeredBy: rec.id }); break;
      case '赢家的面包': this.spellLayers(target, 3); s.pending.push({ type: 'bread', round: this.m.round, ids: pieceBonds(this.gd, target) }); break;
      case '自负': s.pending.push({ type: 'pride', round: this.m.round }); break;
      case '暴风城之力': for (const x of this.spellSample([...this.board.values()].filter(p => p.kind === 'chess'), 4)) this.spellLayers(x, 2); break;
      case '稳健异变': {
        const ids = this.spellChessPool(this.gd.chess(target.id).tier + 1);
        if (!ids.length) return fail(ERR.BAD_TARGET);
        this.transformChess(target, this.spellSample(ids)[0]); break;
      }
      case '闪亮的戒指': this.spellBoardLayers(1); break;
      case '海鲜乱炖': this.spellLayers(target, 1 + active().length); break;
      case '乱放的茶具': for (const id of active()) this.addLayers(id, 4, { reason: 'spell' }); break;
      case '防御者的仪式': this.spellLayers(target, 3); target.meta.spellTaunt = true; break;
      case '克隆螺号': {
        const id = this.spellSample(this.spellChessPool())[0];
        if (!id) return fail(ERR.BAD_TARGET);
        this.acquireChess(id, { source: 'spell' }); this.acquireChess(id, { source: 'spell' }); break;
      }
      case '寒热骤变':
        // Use the current shop identity; 4_03 is the hidden legacy Kjera and cannot merge with 3_20.
        for (const id of ['chess_char_3_20_a', 'chess_char_4_24_a']) if (!this.gd.chess(id)) return fail(ERR.BAD_TARGET);
        for (const id of ['chess_char_3_20_a', 'chess_char_4_24_a']) this.acquireChess(id, { source: 'spell' });
        break;
      case '武器锻造': {
        const id = SHOP_SPELLS.find(c => c.name === '尖利箭矢').id;
        for (let i = 0; i < 3; i++) this.acquireItem(id, { source: 'spell' }); break;
      }
      case '护甲储备': s.armor = 5; break;
      case '点金之触': {
        const candidates = normalShop().filter(slot => !this.gd.isGolden(slot.id) && this.gd.goldenIdOf(slot.id));
        if (!candidates.length) return fail(ERR.BAD_TARGET);
        const slot = this.spellSample(candidates)[0]; slot.id = this.gd.goldenIdOf(slot.id); slot.spellGoldenReward = true; break;
      }
      case '顶尖好酒': {
        const capacity = this.gd.shopSlots(this.shop.level);
        const n = capacity.chess + capacity.item + 1;
        this.shop.slots = Array.from({ length: n }, () => this._rollItemSlot(true));
        this.shop.layout = { chess: 0, item: 0, spell: n }; this.shop.spellOverride = 'spell'; break;
      }
      case '祈请吞噬者': {
        const id = pieceBonds(this.gd, target)[0], n = this.layers[id] || 0;
        const destinations = active().filter(b => b !== id && this.gd.bond(b)?.isCore);
        const transfer = !this.bonds[id]?.active && destinations.length > 0;
        const result = this.sell(target.uid); if (result.error) return result;
        if (transfer) { this.layers[id] = 0; this.addLayers(this.spellSample(destinations)[0], n, { reason: 'spell' }); }
        break;
      }
      case '腐化糕点': {
        const slots = this.spellSample(normalShop(), 3);
        if (!slots.length) return fail(ERR.BAD_TARGET);
        // Snapshot positional rewards before removing any selected shop card.
        const meals = slots.map(slot => ({ slot, bonus: this.spellPurchaseBonus(slot) }));
        const sum = slots.reduce((n, slot) => n + this.gd.chess(slot.id).tier, 0);
        for (const { slot, bonus } of meals) {
          slot.sold = true;
          const piece = this.newPiece('chess', slot.id);
          this.m.dispatch(this, 'onBuy', { piece, slot, price: 0, kind: 'chess', spellBonus: bonus, source: 'devour' });
        }
        this.spellLayers(target, Math.floor(sum / 2)); break;
      }
      case '诺兹多姆的子嗣': s.attack++; break;
      case '哈缪尔遗失的法杖': {
        const bonds = pieceBonds(this.gd, target);
        const ids = this.spellChessPool(null, c => c.bonds.some(id => bonds.includes(id)));
        if (!ids.length) return fail(ERR.BAD_TARGET);
        const capacity = this.gd.shopSlots(this.shop.level);
        const old = this.shop.layout;
        const equipment = old.item ? this.shop.slots.slice(old.chess, old.chess + old.item) : [];
        const spells = old.spell ? this.shop.slots.slice(old.chess + old.item) : [];
        const units = Array.from({ length: capacity.chess }, () => { const id = this.spellSample(ids)[0]; return { kind: 'chess', id, basePrice: this.gd.chessPrice(id), sold: false, frozen: false }; });
        // Restore missing categories after an all-spell refresh; existing normal categories stay untouched.
        this.shop.slots = [...units, ...Array.from({ length: capacity.item }, (_, i) => old.item ? equipment[i] ?? null : this._rollItemSlot()), old.spell === 1 && old.item ? spells[0] ?? null : this._rollItemSlot(true)];
        this.shop.layout = { chess: capacity.chess, item: capacity.item, spell: 1 }; this.shop.spellOverride = null; break;
      }
      case '大地母亲之眼':
        if (this.gd.chess(target.id).tier > 4 || this.gd.isGolden(target.id)) return fail(ERR.BAD_TARGET);
        this.promote(target); break;
      case '完美形象': for (const id of pieceBonds(this.gd, target)) this.layers[id] = 30; break;
      case '艾泽里特强化': this.spellBoardLayers(4); break;
      case '支援': s.supports.push({ uid: this.m.nextUid(), row: tile.row, col: tile.col, dir: 'RIGHT', round: this.m.round }); break;
      case '分享关爱': if (!this.spellMates().length) return fail(ERR.BAD_TARGET); s.sharing++; break;
      default: return fail(ERR.BAD_TARGET);
    }
    return OK;
  }
  spellHook(hook, ev) {
    if (!this.m.spellShop) return;
    const s = this.spellState;
    if (hook === 'onBuy' && ev.kind === 'chess' && ev.source !== 'devour' && ev.piece && ev.slot.spellGoldenReward) {
      ev.slot.spellGoldenReward = false;
      this.pushRewardOffer('merge');
    }
    if (hook === 'onBuy' && ev.kind === 'chess' && ev.spellBonus > 0) {
      // Use the purchased identity even if acquireChess merged it into an elite.
      this.spellLayers({ id: ev.slot.id, items: [] }, ev.spellBonus);
    }
    if (!s) return;
    if (hook === 'onRefresh' && s.wisdom > 0) {
      if (helpfulRefresh(this)) { s.wisdom--; ev.slots = this.shop.slots; }
    }
    if (hook === 'onBuy' && ev.kind === 'chess' && ev.slot?.spellShield && ev.piece) ev.piece.meta.spellShield = true;
    if (hook === 'onIncome') ev.income += s.income;
    if (hook === 'onBattleResult') {
      const pending = s.pending.filter(x => x.round === this.m.round && (x.type === 'pride' || x.type === 'bread'));
      s.pending = s.pending.filter(x => !pending.includes(x));
      for (const x of pending) {
        if (x.type === 'pride') this.pendingFunds += ev.perfect ? 3 : ev.unite && ev.lpLoss === 0 ? 1 : 0;
        else if (ev.perfect) s.pending.push({ type: 'layers', ids: x.ids, n: 6, due: this.m.round + 1 });
      }
    }
  }
  spellRoundStart(r) {
    if (!this.m.spellShop || !this.spellState) return;
    const s = this.spellState;
    const unlocked = new Set();
    for (const p of this.allChess()) if (p.meta?.spellLockUntil && p.meta.spellLockUntil <= r) {
      delete p.meta.spellLockUntil; unlocked.add(this.gd.baseIdOf(p.id));
    }
    // [ASSUMED] deferred triples merge on unlock without replaying their already-resolved acquisition effects.
    for (const id of unlocked) {
      const need = this.gd.mergeCount(id);
      while (need > 1 && this.countCopies(id) >= need) { if (!this._mergeChess(id, null)) break; }
    }
    const due = s.pending.filter(x => x.due <= r);
    s.pending = s.pending.filter(x => !(x.due <= r));
    s.supports = s.supports.filter(x => x.round >= r);
    s.attack = 0; s.sharing = 0; s.battle = null;
    for (const x of due) {
      if (x.type === 'time') { this.spellBoardLayers(2); this.spellBoardLayers(2); }
      if (x.type === 'layers') for (const id of x.ids) this.addLayers(id, x.n, { reason: 'spell' });
      if (x.type === 'gift') this.acquireChess(x.id, { source: 'spell_gift' });
    }
  }
  spellCommitBattle() {
    if (!this.m.spellShop || !this.spellState) return;
    const s = this.spellState, temporary = {};
    // Roll once at the actual prep deadline, not during unit-stat/rehearsal previews.
    for (let i = 0; i < s.sharing; i++) {
      const ids = this.gd.bondIds.filter(id => (this.layers[id] || 0) < 999).sort((a, b) => (this.layers[b] || 0) - (this.layers[a] || 0) || (a < b ? -1 : a > b ? 1 : 0));
      const mate = this.spellSample(this.spellMates().filter(p => Object.values(p.bonds).some(b => b.active)))[0];
      if (!mate || !ids.length) continue;
      const donor = this.spellSample(mate.gd.bondIds.filter(id => mate.bonds[id]?.active))[0];
      temporary[ids[0]] = (temporary[ids[0]] || 0) + (mate.layers[donor] || 0);
    }
    s.battle = { round: this.m.round, temporary, attack: s.attack };
  }
  spellBattleInput(input, continued = false, carry = null) {
    if (!this.m.spellShop) return input;
    const s = this.spellState;
    const taunts = {}, shields = {};
    for (const p of this.board.values()) if (p.meta?.spellTaunt != null) taunts[p.uid] = p.meta.spellTaunt;
    for (const p of this.board.values()) if (p.meta?.spellShield) shields[p.uid] = true;
    for (const x of s?.supports || []) {
      if ((continued && !carry?.has(x.uid)) || x.round !== this.m.round || this.deployMap().get(tileKey(x.row, x.col)) !== 'melee' || input.units.some(u => u.row === x.row && u.col === x.col)) continue;
      input.units.push({ uid: x.uid, kind: 'chess', chessId: 'chess_char_4_17_a', row: x.row, col: x.col, dir: x.dir || 'RIGHT', items: [], skillIndex: 1, potential: 6, cultivate: 3, moduleId: 'none', ...(continued ? { carryState: { ...carry.get(x.uid) } } : {}) });
      taunts[x.uid] = true;
    }
    const battle = !continued && s?.battle?.round === this.m.round ? s.battle : null;
    const temporary = battle?.temporary || {};
    for (const [id, n] of Object.entries(temporary)) if (input.bonds[id]) input.bonds[id] = { ...input.bonds[id], layers: input.bonds[id].layers + n };
    input.spellTemporaryLayers = { ...temporary };
    // Board rows increase upwards; choose in owner board coordinates before a boss half is mirrored.
    const attackUid = input.units.filter(u => u.kind === 'chess').slice().sort((a,b) => b.col - a.col || a.row - b.row || a.uid - b.uid)[0]?.uid ?? null;
    input.playerEffects.push({ id: 'spell_shop_battle', data: { taunts, shields: continued ? {} : shields, attack: battle?.attack || 0, attackUid } });
    return input;
  }
  spellAbsorb(n) {
    if (!this.m.spellShop || !this.spellState) return n;
    const used = Math.min(n, this.spellState.armor);
    this.spellState.armor -= used;
    if (used) this.dirty();
    return n - used;
  }
  spellSupportViews() {
    if (!this.m.spellShop) return [];
    const rec = SHOP_SPELLS.find(c => c.name === '支援');
    if (!rec) return [];
    return (this.spellState?.supports || []).filter(x => x.round === this.m.round).map(x => ({
      id: x.uid, uid: x.uid, kind: 'item', side: 'ally', ownerId: this.playerId, defId: rec.id,
      area: 'board', name: N_('支援·星熊（待部署）'), tier: 4, golden: false, spellSupport: true,
      icon: rec.artUrl, spell: true,
      x: x.col, y: x.row, dir: x.dir || 'RIGHT', facing: x.dir === 'LEFT' ? -1 : 1,
    }));
  }
}
