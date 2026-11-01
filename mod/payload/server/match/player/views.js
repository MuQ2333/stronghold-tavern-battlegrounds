// server/match/player/views.js — PlayerState methods: the views — pieceView, effectsView (the effects column: 策略 / 机变 /
// 悬赏 …) and m.private (privateView).
// Installed on PlayerState.prototype by server/match/PlayerState.js (a method container: never instantiated; `this` is
// the player state).

import { PHASE } from '../../../shared/constants.js';
import { heroView, heroDescription, heroRefreshPrice, heroUpgradePrice, heroFreeRefresh, heroLockedCards,heroIdentityBand } from '../heroPowers.js';
import { boardOrder, pieceDir } from '../board.js';
import { bondList, offBondCounts } from '../bondsMeta.js';
import { bountyText, bountyCard } from '../choices.js';
import {handLockOf} from '../../../shared/lockedCards.js';
import {growthPurchaseView, growthSellPrice, growthTraitView} from '../growthTraits.js';
import {growthGrantedTraitView} from '../../../shared/growthMode.js';
import {growthSpellStrength,spellPartsAmount,spellLayerParts} from '../growthSpells.js';

export class PlayerViews {
  pieceView(p, rc = null) {
    const rec = p.kind === 'item' ? this.gd.item(p.id) : p.kind === 'token' ? this.gd.token(p.id) : this.gd.chess(p.id);
    // 皮肤 (docs/SKINS.md): skinFor resolves the effective body, including stand-ins and 自选 picks, on every surface.
    const skinId = p.kind === 'chess' ? this.skinFor(rec) : null;
    const v = {
      uid: p.uid,
      kind: p.kind,
      id: p.id,
      golden: !!(rec && rec.isGolden),
      tier: rec && Number.isInteger(rec.tier) ? rec.tier : null,
      items: p.kind === 'chess' ? (p.items || []).map((it) => ({ uid: it.uid, id: it.id })) : [],
      count: p.kind === 'token' ? (p.count || 1) : 1,
      ownerUid: p.kind === 'token' ? p.ownerUid ?? null : null,
      // 皮肤: the prep board / hand / temp views carry it too, so a piece shows its appearance before it is deployed and
      // the deploy wheel's preview matches the model that will actually fight
      ...(skinId ? { skin: skinId } : {}),
    };
    if (p.meta?.spellLockUntil > this.m.round) v.spellLocked = true;
    if (p.meta?.spellTaunt != null) v.spellTaunt = p.meta.spellTaunt;
    if (p.meta?.spellEcho) v.spellEcho = this.m.growthMode?spellPartsAmount(this,spellLayerParts(p.meta.spellEcho,2)):p.meta.spellEcho;
    if (p.meta?.spellShield) v.spellShield = true;
    if (this.m.growthMode && p.kind === 'chess' && rec?.growthTrait?.handler === 'leakSale') v.sellPrice = growthSellPrice(this,p);
    const growth=p.kind==='chess'?growthTraitView(this,p):null;if(growth)v.growthTrait=growth;
    if(this.m.growthMode && p.meta?.growthDeployGrants)v.growthGrantedTraits=growthGrantedTraitView(p.meta.growthDeployGrants);
    if (rc) { v.row = rc[0]; v.col = rc[1]; v.dir = pieceDir(p); }
    if(handLockOf(p))v.handLock={...handLockOf(p)};
    return v;
  }

  effectsView() {
    const out = [];
    const band = this.bandId ? this.gd.band(this.bandId) : null;
    if (band) out.push({ id: band.effectId || band.bandId, name: band.effectName || band.name, desc: heroDescription(this), iconKind: 'band', iconId: band.iconId || band.bandId });
    for (const e of this.effects) {
      if (e.hidden) continue;
      const v = { id: e.id, name: e.name || e.id, desc: e.desc || '', iconKind: e.iconKind || 'choice', iconId: e.iconId || e.id };
      if (e.counter != null) v.counter = e.counter;
      out.push(v);
    }
    for (const b of this.bounties) {
      // the battles the bounty's enemies still come for (an official multi-round card: every battle, no counter) and
      // the card's official rich text (blue "下场作战" / "两场作战", red "每场"; a multi-round card reads as long as it
      // lasts — choices.js bountyText, MULTI_ROUND_BOUNTY_BATTLES) — user playtest #6 item 4
      const left = b.roundsLeft >= 90 ? null : b.roundsLeft;
      const eff = b.card.effectId ? this.gd.effect(b.card.effectId) : null;
      out.push({
        id: b.id, name: b.card.name || '悬赏', desc: bountyText((eff && eff.descRaw) || b.card.desc || '', b.card), iconKind: 'choice', iconId: b.card.effectId || 'bounty', // i18n-ignore: a data-less card's fallback name
        counter: left, counterText: left == null ? '之后的每场作战' : `还剩 ${left} 场作战`, // i18n-ignore: older clients (ui/effectsList.js builds it from counter)
      });
    }
    return [...out, ...this.spellEffectViews()];
  }

  privateView() {
    const slots = this.shop.slots.map((s) => {
      if (!s) return null;
      const v={kind:s.kind,id:s.id,price:this.priceOf(s),basePrice:s.basePrice,sold:!!s.sold,frozen:!!s.frozen,
        ...(this.m.spellShop?{purchaseBonus:this.spellPurchaseBonus(s),spellShield:!!s.spellShield,spellGoldenReward:!!s.spellGoldenReward,currency:this.gd.item(s.id)?.currency||'funds'}:{})};
      if (this.m.growthMode && s.kind==='chess') {
        const growth=growthTraitView(this,s);if(growth)v.growthTrait=growth;
        const rewards=growthPurchaseView(this,s), spell=this.spellPurchaseBonus(s);
        if (spell) for (const id of this.gd.chess(s.id).bonds) {
          const existing=rewards.find(x=>x.bondId===id);
          if (existing) existing.layers+=spell; else rewards.push({bondId:id,layers:spell});
        }
        v.growthPurchaseRewards=rewards;
        v.purchaseBonus=Math.max(0,...rewards.map(x=>x.layers));
      }
      return v;
    });
    const offer = this.offers[0] || null;
    const free = heroFreeRefresh(this) || this.shop.freeRefreshes > 0;
    const board = [];
    for (const { r, c, piece } of boardOrder(this.board)) board.push(this.pieceView(piece, [r, c]));
    // a boss round's prep: the partner's board on its half of the boss field (Match.bossMateView, item 51)
    const bossMate = typeof this.m.bossMateView === 'function' ? this.m.bossMateView(this) : null;
    const lockedCards=heroLockedCards(this);
    return {
      t: 'm.private',
      playerId: this.playerId,
      ...(Number.isInteger(this.aiTakeoverRound) ? { aiTakeoverRound: this.aiTakeoverRound } : {}),
      seat: this.seat,
      alive: this.alive,
      lp: this.lp,
      funds: this.funds,
      ...(this.m.growthMode?{growthSpellBonus:growthSpellStrength(this)}:{}),
      bandId: heroIdentityBand(this),
      ...(heroView(this) ? { heroPower: heroView(this) } : {}),
      ...(lockedCards.length ? {lockedCards} : {}),
      ready: this.ready,
      canReady: this.alive && (this.tempEmpty || this.spellCanReady()) && !this.personalChoice && this.m.phase === PHASE.PREP,
      personalChoice: this.personalChoice ? {
        id: this.personalChoice.id,
        round: this.personalChoice.round,
        sourceItemId: this.personalChoice.sourceItemId,
        cards: this.personalChoice.cards.map((c) => bountyCard(this.gd, c)),
      } : null,
      shop: {
        level: this.shop.level,
        maxLevel: this.gd.maxShopLevel,
        upgradePrice: this.shop.level >= this.gd.maxShopLevel ? 0 : heroUpgradePrice(this),
        refreshPrice: free ? 0 : heroRefreshPrice(this),
        freeRefreshes: this.shop.freeRefreshes + (heroFreeRefresh(this) ? this.heroState.freeRefresh : 0),
        frozen: this.shop.frozen,
        layout: { ...(this.shop.layout || this.gd.shopSlots(this.shop.level)) },
        slots,
        ...(this.m.spellShop ? { spellShop: true, spellUsed: Object.entries(this.spellState?.usedRound || {}).filter(([, round]) => round === this.m.round).map(([id]) => id), layout: { ...this.shop.layout } } : {}),
        // `source` 'merge' = the promotion reward (晋升奖励); any other offer (a strategy, an item, a 特质) carries the
        // `label` the bar shows instead; `queued` = offers waiting behind it (player report #6 after 0.1.0)
        rewardOffer: offer ? { tier: offer.tier, source: offer.source === 'merge' ? 'merge' : 'special', label: offer.label || null, queued: this.offers.length - 1, slots: offer.slots.map((s) => ({ kind: s.kind === 'band' ? 'band' : s.kind === 'item' ? 'item' : 'chess', id: s.id, price: s.price, sold: !!s.sold, ...(this.m.growthMode && s.kind==='chess'?{growthTrait:growthTraitView(this,s)}:{}), ...(offer.spellChoice ? { spellChoice: true } : {}), ...(offer.spellStrategy ? { spellBandChoice: true, unavailable: !this.spellStrategyPool().includes(s.id) } : {}) })) } : null,
      },
      ...(this.m.spellShop ? { spellSupports: (this.spellState?.supports || []).filter(x => x.round === this.m.round).map(x => ({ ...x })), armor: this.spellState?.armor || 0 } : {}),
      hand: this.hand.map((p) => (p ? this.pieceView(p) : null)),
      temp: this.temp.map((p) => (p ? this.pieceView(p) : null)),
      board,
      // The stage's 外勤医疗 reserve medic is present during prep, but is not a draggable board piece.
      prepMapChars: [...this.m.prepMapChars(this), ...this.spellSupportViews()],
      deployCap: this.deployCap,
      deployCount: this.deployCount,
      // + the mode-off bonds it has members of (`off: true`, the strip's grey 本局禁用 discs — bondsMeta.offBondCounts)
      bonds: bondList(this.gd, this.bondsView(), { full: true, off: offBondCounts(this.gd, this) }),
      effects: this.effectsView(),
      nextEnemies: this.m.nextEnemiesFor(this),
      // DESIGN §16: the effective operator loadout ({ [baseChessId]: { skill, module } }; chess not listed use defaults)
      loadout: this.loadout,
      // 0.2.2: the effective per-operator 潜能 / 练度 ({ [charId]: { potential, cultivate } }; operators not listed: 潜能 6,
      // 精英2 Lv.60) — the client's cards compose the numbers from it (shared/potential.js)
      ops: this.ops,
      // 0.2.0 补位: the base chess ids this player fields as their stand-ins in this match (the not-owned list the seat had
      // at the match start; [] = every operator owned) — the client shows these as their stand-ins (cards, pieces, the
      // detail card, with a small 「替补」 mark)
      standIns: this.standIns,
      // 0.2.0 自选编队: this player's 自选 picks in this match ({ [slotBaseId]: { charId, skillIndex, uniEquipId } } — the seat's
      // when the match started; {} = none) — the client composes the operator's record for its own cards and pieces
      // (shared/diy.js diyRecord); `diyBanned`: the slotted slots out of the shop this match (every bond of the operator
      // switched off)
      diy: this.diy,
      diyBanned: this.diyBanned,
      // 最终攻势 / 隐秘核心 prep (community report of 2026-10-06, item 51): `{ playerId, side, units }` — the pair partner's
      // board pieces as UnitInfo on its half of the boss field (mirrored on the right half, as the battle places them);
      // the own prep view draws them beside the own half, read-only. Absent otherwise.
      ...(bossMate ? { bossMate } : {}),
      stats: {
        dmgDealt: Math.round(this.stats.dmgDealt), kills: this.stats.kills, leaks: this.stats.leaks, gold: this.stats.gold,
        refreshes: this.stats.refreshes, merges: this.stats.merges, buys:this.stats.buys, sells:this.stats.sells,
      },
    };
  }
}
