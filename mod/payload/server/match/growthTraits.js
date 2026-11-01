// Growth preview prep traits. No combat retention policy is inferred here.
import { boardOrder, parseKey } from './board.js';
import { pieceBonds } from './bondsMeta.js';
import { isHandLocked } from '../../shared/lockedCards.js';
import { GROWTH_EVENTS } from '../../shared/growthMode.js';
import { spellTarget } from '../../shared/spells.js';
import {kazdelEvent,kazdelGain,kazdelSpell} from './growthKazdel.js';
import {growthRewardAllowed} from './growthRewardPolicy.js';
import {growthBoardMap,triggerGrowthDeploy,finishGrowthCombat} from './growthCombat.js';
import {growthStarYield,growthStarOverflow} from './growthStar.js';
import {increaseGrowthSpellStrength,spellPurchaseParts,grantSpellPurchase} from './growthSpells.js';
import {addDevourLayers} from './growthDevour.js';

const hooks = { scribeGrowth:'onGain',pendingFunds: 'onGain', saleCoins:'onSold', gainedLayers: 'onPrepEnd', ownLayersStart: 'onRoundStart',
  topLayers: 'onGain', positionLayers: 'onPrepEnd', oddEquipment: 'onPrepEnd', equipment: 'onPrepEnd',
  ownLayersEnd: 'onPrepEnd', permanentDeployGrant:'onPrepEnd', saleFunds: 'onSold', refreshLayers: 'onPrepEnd', boardLayers: 'onPrepEnd',
  benchLayers: 'onPrepEnd', benchCountLayers: 'onPrepEnd', dusk: 'onPrepEnd', siracusaGift: 'onGain',
  prepEcho: 'onGain', buyGrant: 'onGain', grantAmplifier: 'onPrepEnd', refreshGrant: 'onRefresh', purchaseEcho: 'onRefresh',
  distinctVictoria: 'onPrepEnd', distinctTop: 'onPrepEnd', distinctRoyal: 'onPrepEnd', spendEquipment: 'onSpend', majoritySpend:'onSpend',
  gainExusiai: 'onGain', gainSpell: 'onGain', autoRing: 'onRoundStart',
  spellCountLayers: 'onPrepEnd', kjeragAmplifier: 'onGain', leakSale: 'onSold', recruitSale:'onSold',
  selfHarmGain:'onGain',shopBuyGrant:'onGain',kazdelDiscover:'onGain',consumeHighest:'onPrepEnd',tripleGift:'onGain',majoritySale:'onSold',gainDeploy:'onGain',spellGainBonus:'onGain',starSpend:'onPrepEnd' };

export const growthHook = rec => hooks[rec?.growthTrait?.handler] ?? null;
export const growthEventType = rec => GROWTH_EVENTS[rec?.growthTrait?.handler] ?? null;
export function growthTargetSpellRepeats(ps,target) {
  return ps.m.growthMode && target?.kind==='chess' && board(ps).some(p=>ps.gd.chess(p.id)?.growthTrait?.handler==='repeatTargetSpell')?2:1;
}
const state = ps => ps.growthState ||= { grants: [], grantBonus: 0 };
function grant(ps,g) {
  const list=state(ps).grants;
  const old=list.find(x=>x.target===g.target && x.active===g.active && (x.match||[]).join(',')===(g.match||[]).join(','));
  if (old) old.n+=g.n; else list.push(g);
}
const board = ps => boardOrder(growthBoardMap(ps)).map(x => x.piece).filter(p => p.kind === 'chess' && !isHandLocked(p));
const bonds = (ps, p) => pieceBonds(ps.gd, p);
const add = (ps, ids, n, active = true) => { for (const id of ids) ps.addLayers(id, n, { requireActive: active, reason: 'growth' }); };
const top = ps => ps.gd.bondIds.filter(id => ps.bonds[id]?.active).sort((a,b) => (ps.layers[b] || 0) - (ps.layers[a] || 0))[0];
const distinct = (ps,id) => new Set(board(ps).filter(p=>bonds(ps,p).includes(id)).map(p=>ps.gd.chess(p.id).tier)).size;

/** Maintainer: field only, main and extra bonds. [ASSUMED] Each actual operator counts once for each membership. */
export function growthMajority(ps) {
  const counts=new Map();for(const p of board(ps))for(const id of bonds(ps,p))counts.set(id,(counts.get(id) || 0)+1);
  const max=Math.max(0,...counts.values());return [...counts].filter(([,n])=>n===max).map(([id])=>id);
}
export function gainGrowthMajority(ps,n) {
  for(let i=0;i<n && ps.alive;i++) {
    const top=growthMajority(ps);if(!top.length)return;
    const eligible=top.filter(b=>ps.gd.visibleChess.some(id=>ps.m.pool.left(id)>0 && growthRewardAllowed(ps,id) && ps.gd.chess(id).bonds.includes(b)));
    if(!eligible.length)return;
    const b=ps.m.rngMeta.pick(eligible);
    const id=ps.m.pool.roll(ps.m.rngMeta,{maxTier:6,filter:id=>growthRewardAllowed(ps,id) && ps.gd.chess(id)?.bonds.includes(b)});
    if(id)ps.acquireChess(id,{source:'growth:majority'});
  }
}


export function growthLayerBonus(ps, id, reason) {
  return ps.m.growthMode && id === 'kjeragShip' && reason !== 'battle' ? ps.growthState?.kjeragBonus || 0 : 0;
}
export function recordGrowthSpell(ps) {
  if (ps.m.growthMode) {state(ps).spellsCast = (state(ps).spellsCast || 0) + 1;kazdelSpell(ps);}
}
export function recordGrowthEquipment(ps, rec) {
  if (ps.m.growthMode && rec?.itemType === 'EQUIP' && !spellTarget(rec)) state(ps).equipmentGains=(state(ps).equipmentGains || 0)+1;
}
export function growthBattleInfo(ps, reached) {
  if (!ps.m.growthMode) return {};
  const counters={},deployGrants={};
  for (const p of board(ps)) {
    if(p.meta?.growthDeployGrants)deployGrants[p.uid]={...p.meta.growthDeployGrants};
    const kind=ps.gd.chess(p.id)?.growthTrait?.handler;
    if (kind === 'skillSargonRamp' || kind === 'statusSargonRamp' || kind==='gravelRamp') counters[p.uid]={
      uses:(p.meta?.growthSkillUses || 0)+(reached?(ps.m.lastResults.get(ps.playerId)?.growthSkillUses?.[p.uid] || 0):0),
      statusSteps:p.meta?.growthStatusSteps || 0,
      traitUses:(p.meta?.growthTraitUses || 0)+(reached?(ps.m.lastResults.get(ps.playerId)?.growthTraitUses?.[p.uid] || 0):0),
    };
  }
  return {growthEgirPool:ps.gd.visibleChess.filter(id=>ps.m.pool.entries.has(id) && ps.gd.chess(id)?.bonds.includes('egirShip') && !id.startsWith('chess_char_3_09_')),
    ...(ps.growthState?.kjeragBonus?{growthKjeragBonus:ps.growthState.kjeragBonus}:{}),
    ...(Object.keys(counters).length?{growthCounters:counters}:{}),
    ...(Object.keys(deployGrants).length?{growthDeployGrants:deployGrants}:{})};
}
export function growthSellPrice(ps, piece) {
  if (ps.m.growthMode && ps.gd.chess(piece.id)?.growthTrait?.handler === 'leakSale' && ps.growthState?.lastBattleLeaked) return ps.gd.isGolden(piece.id) ? 10 : 5;
  return ps.gd.sellPrice(piece.id);
}
export const growthRecruitTier = (ps,p) => Math.min(6,(ps.gd.isGolden(p.id)?5:1)+(p.meta?.growthRecruitRounds || 0));

/** Current per-trigger values, computed from authoritative state for owned, shop and reward cards. */
export function growthTraitView(ps, p) {
  if (!ps.m.growthMode) return null;
  const rec=ps.gd.chess(p.id),kind=rec?.growthTrait?.handler;
  if (!kind) return null;
  const m=rec.isGolden?2:1,s=ps.growthState || {}, gains=new Map(),out={};
  const push=(ids,n,active=true)=>{for(const id of ids)if(!active || ps.bonds[id]?.active)gains.set(id,(gains.get(id)||0)+n+(n>0?growthLayerBonus(ps,id,'growth'):0));};
  switch(kind){
    case 'localAmmoSpell':case 'globalAmmoSpell':out.ammoProgress=0;out.ammoThreshold=kind==='localAmmoSpell'?6:10;break;
    case 'starSpend':push(['skillfulShip','arcaneShip'],Math.floor((ps.round.spent || 0)/3)*growthStarYield(ps,p));out.starSpent=p.meta?.growthStarSpent || 0;out.nextValue=growthStarYield(ps,p);out.overflow=growthStarOverflow(ps);break;
    case 'spellGainBonus':case 'spellSkillBonus':case 'spellDeathBonus':out.value=s.spellBonus || 0;break;
    case 'scribeGrowth':push(['yanShip'],6*m*Math.max(1,s.scribeGains || 0),false);push(['miraShip'],3*m*Math.max(1,s.scribeGains || 0),false);break;
    case 'gainedLayers':push(['yanShip'],(ps.round.gainedChess || 0)*3*m);break;
    case 'refreshLayers':push(['siracusaShip','arcaneShip'],(ps.round.refreshes || 0)*2*m);break;
    case 'dusk':push(['yanShip','arcaneShip'],(ps.round.gainedChess || 0)*2*m*(1+Math.floor((ps.round.growthDusk || 0)/4)));break;
    case 'distinctVictoria':push(['victoriaShip'],distinct(ps,'victoriaShip')*2*m*(1+(p.meta?.growthPrepEntries || 0)));break;
    case 'distinctTop':{const id=top(ps);if(id)push([id],distinct(ps,id)*2*m*(1+(s.equipmentGains || 0)));break;}
    case 'distinctRoyal':push(['victoriaShip'],distinct(ps,'victoriaShip')*3*m*(1+(s.equipmentGains || 0)));push(['miraShip'],distinct(ps,'miraShip')*2*m*(1+(s.equipmentGains || 0)));break;
    case 'spellCountLayers':push(Object.keys(ps.bonds),(s.spellsCast || 0)*2*m);break;
    case 'benchCountLayers':push(Object.keys(ps.bonds),ps.hand.filter(x=>x?.kind==='chess'&&!isHandLocked(x)).length*3*m);break;
    case 'benchLayers':for(const x of ps.hand)if(x?.kind==='chess'&&!isHandLocked(x))push(bonds(ps,x),4*m,rec.isGolden);break;
    case 'boardLayers':for(const x of board(ps))push(bonds(ps,x),4*m);break;
    case 'spendEquipment':out.spent=p.meta?.growthSpent || 0;break;
    case 'recruitSale':out.recruitTier=growthRecruitTier(ps,p);break;
    case 'skillSargonRamp':out.value=10*m*(1+(p.meta?.growthSkillUses || 0));break;
    case 'statusSargonRamp':out.value=m*(1+(p.meta?.growthStatusSteps || 0));break;
    case 'skillTopRamp':out.value=3*m;break;
    case 'permanentDeployGrant':out.value=4*m;break;
    case 'gravelRamp':push(['kazimierzShip'],m*(1+(p.meta?.growthTraitUses || 0)));push(['indomShip'],2*m*(1+(p.meta?.growthTraitUses || 0)));break;
    case 'dollRamp':out.value=2*m;break;
    case 'buyGrant':out.value=3*m+(s.grantBonus || 0);break;
    case 'refreshGrant':out.value=(rec.isGolden?8:4)+(s.grantBonus || 0);break;
    case 'kjeragAmplifier':out.value=s.kjeragBonus || 0;break;
    case 'purchaseEcho':out.refreshProgress=(p.meta?.growthRefreshes || 0)%3;break;
    case 'majoritySpend':out.spent=p.meta?.growthMajoritySpent || 0;break;
    case 'leakSale':out.sale=growthSellPrice(ps,p);break;
    default:return null;
  }
  if(gains.size)out.gains=[...gains].map(([bondId,layers])=>({bondId,layers}));
  else if(['gainedLayers','refreshLayers','dusk','distinctVictoria','distinctTop','distinctRoyal','spellCountLayers','benchCountLayers','benchLayers','boardLayers'].includes(kind))out.value=0;
  const repeat=growthRepeat(ps,growthHook(rec));if(repeat>1)out.repeat=repeat;
  return out;
}
function randomEquipment(ps, elite) {
  const exclude = elite ? Object.keys(ps.gd._items).filter(id=>{
    const r=ps.gd.item(id), gid=r.upgradeChessId || r.goldenId;
    return !gid || !ps.m.itemPool.canGain(gid);
  }) : [];
  const id=ps.m.rollItemId({maxTier:ps.shop.level,exclude});
  if (id) { const r=ps.gd.item(id); ps.acquireItem(elite ? r.upgradeChessId || r.goldenId : id,{source:'growth',deferMerge:ps._deferItemMerge>0}); }
}

export function growthPurchaseGrants(ps, slot) {
  if (!ps.m.growthMode || slot?.kind !== 'chess') return [];
  const ids = ps.gd.chess(slot.id)?.bonds ?? [];
  const grants=(ps.growthState?.grants ?? []).filter(g => !g.match || g.match.some(id => ids.includes(id)));
  // Legacy field name: the maintainer changed King's granted effect from gain to purchase.
  if(ps.growthState?.gainGrant>0)grants.push({n:ps.growthState.gainGrant,active:false});
  return grants;
}
export function growthPurchase(ps, slot, grants = growthPurchaseGrants(ps, slot), {devour=false}={}) {
  for (const g of grants)for(const id of g.target ? [g.target] : ps.gd.chess(slot.id).bonds) {
    const options={requireActive:g.active,reason:'growth'};
    if(devour)addDevourLayers(ps,id,g.n,options);else ps.addLayers(id,g.n,options);
  }
}
export function growthPurchaseView(ps, slot) {
  const totals = new Map();
  for (const g of growthPurchaseGrants(ps,slot)) {
    const ids=g.target?[g.target]:ps.gd.chess(slot.id).bonds;
    for (const id of ids) if (!g.active || ps.bonds[id]?.active) totals.set(id,(totals.get(id)||0)+g.n);
  }
  return [...totals].map(([bondId,layers])=>({bondId,layers}));
}
export function recordGrowthAcquisition(ps, rec) {
  if (ps.m.growthMode && rec.bonds.some(id=>id==='yanShip' || id==='arcaneShip')) ps.round.growthDusk = (ps.round.growthDusk || 0)+1;
  if (ps.m.growthMode && rec.growthTrait?.handler==='scribeGrowth') state(ps).scribeGains=(state(ps).scribeGains || 0)+1;
}
export function growthEvent(ps, hook, ev) {
  if (!ps.m.growthMode) return;
  kazdelEvent(ps,hook,ev);
  if(!ps.alive)return;
  if (hook === 'onRoundStart') for (const p of ps.allChess()) if (!isHandLocked(p) && ps.gd.chess(p.id)?.growthTrait?.handler === 'recruitSale') {
    p.meta ||= {};p.meta.growthRecruitRounds=(p.meta.growthRecruitRounds || 0)+1;
  }
  if (hook === 'onPrepStart') for (const p of board(ps)) if (ps.gd.chess(p.id)?.growthTrait?.handler === 'distinctVictoria') {
    p.meta ||= {}; p.meta.growthPrepEntries = (p.meta.growthPrepEntries || 0)+1;
  }
  if (hook === 'onPrepEnd') for (const p of board(ps)) if (ps.gd.chess(p.id)?.growthTrait?.handler === 'statusSargonRamp') {
    p.meta ||= {}; p.meta.growthStatusSteps = (p.meta.growthStatusSteps || 0)+1;
  }
  if(hook==='onSpend' && ev.amount>0)for(const p of board(ps))if(ps.gd.chess(p.id)?.growthTrait?.handler==='starSpend') {
    p.meta ||= {};p.meta.growthStarSpent=(p.meta.growthStarSpent || 0)+ev.amount;ps.dirty();
  }
  if (hook === 'onSpend') for (const p of board(ps)) if (ps.gd.chess(p.id)?.growthTrait?.handler === 'spendEquipment' || ps.gd.chess(p.id)?.growthTrait?.handler === 'majoritySpend') runGrowthTrait(ps.m.dispatcher,ps,p,hook,ev,'board');
  if (hook === 'onBuy' && ev.kind === 'chess') growthPurchase(ps, ev.slot, ev.growthGrants ?? []);
  if (hook === 'onBattleResult') {
    state(ps).lastBattleLeaked = (ev.result?.leaked || []).some(l=>l && l.counted !== false);
    // Skadi's earned refreshes persist across rounds, including her owner's unite battle.
    for (const result of [ev.result, ev.unite?.perPlayer?.[ps.playerId]]) {
      const n = result?.growthFreeRefreshes;
      if (Number.isFinite(n) && n > 0) ps.shop.freeRefreshes += Math.trunc(n);
      for (const [uid,uses] of Object.entries(result?.growthSkillUses || {})) {
        const p=ps.find(Number(uid))?.piece;
        if (!p || ps.gd.chess(p.id)?.growthTrait?.handler !== 'skillSargonRamp' || !Number.isFinite(uses) || uses <= 0) continue;
        p.meta ||= {}; p.meta.growthSkillUses=(p.meta.growthSkillUses || 0)+Math.trunc(uses);
      }
      for(const [uid,uses] of Object.entries(result?.growthTraitUses || {})) {
        const p=ps.find(Number(uid))?.piece;
        if(p && ps.gd.chess(p.id)?.growthTrait?.handler==='gravelRamp' && Number.isFinite(uses) && uses>0) {
          p.meta ||= {};p.meta.growthTraitUses=(p.meta.growthTraitUses || 0)+Math.trunc(uses);
        }
      }
    }
  }
  if (hook === 'onBattleResult') for (const result of [ev.result,ev.unite?.perPlayer?.[ps.playerId]]) for (const elite of result?.growthEquipment ?? []) {
    const exclude = elite ? Object.keys(ps.gd._items).filter(id=>{
      const r=ps.gd.item(id), gid=r.upgradeChessId || r.goldenId;
      return !gid || !ps.m.itemPool.canGain(gid);
    }) : [];
    const id = ps.m.rollItemId({maxTier:ps.shop.level,exclude});
    if (id) {
      const r=ps.gd.item(id);
      ps.acquireItem(elite ? r.upgradeChessId || r.goldenId : id,{source:'growth:battle'});
    }
  }
  if(hook==='onBattleResult')finishGrowthCombat(ps,{eliteGain:true});
}

export function growthRepeat(ps, hook) {
  if (!ps.m.growthMode) return 1;
  const kind = {onGain:'repeatGain',onRoundStart:'repeatStart',onPrepEnd:'repeatEnd'}[hook];
  if (!kind) return 1;
  return board(ps).reduce((n,p)=>ps.gd.chess(p.id)?.growthTrait?.handler === kind ? Math.max(n,ps.gd.isGolden(p.id)?3:2) : n,1);
}

/** Return true for a replaced trait, including hooks on which it does nothing. */
export function runGrowthTrait(dispatcher, ps, piece, hook, ev, where, repeat = 1) {
  if (dispatcher.preview && ps.m.growthMode && ps.gd.chess(piece.id)?.growthTrait) return true;
  try { return executeGrowthTrait(dispatcher, ps, piece, hook, ev, where, repeat); }
  catch (e) { dispatcher._report('growth:'+piece.id,hook,e); return true; }
}
function executeGrowthTrait(dispatcher, ps, piece, hook, ev, where, repeat) {
  const rec = ps.gd.chess(piece.id), kind = rec?.growthTrait?.handler;
  if (!ps.m.growthMode || !kind) return false;
  if(!ps.alive)return true;
  if (growthHook(rec) !== hook || isHandLocked(piece)) return true;
  // Persistent pieces act from the board, matching the native conditionkey convention.
  if (!['onGain','onSold'].includes(hook) && where !== 'board') return true;
  const mult = rec.isGolden ? 2 : 1;
  const active = ps.gd.bondIds.filter(id => ps.bonds[id]?.active);
  const s = state(ps);
  for (let i = 0; i < repeat; i++) {
    switch (kind) {
      case 'starSpend':add(ps,['skillfulShip','arcaneShip'],Math.floor((ps.round.spent || 0)/3)*growthStarYield(ps,piece));break;
      case 'spellGainBonus':increaseGrowthSpellStrength(ps,mult);break;
      case 'gainDeploy':
        for(let n=0;n<mult;n++)for(const target of board(ps))if(ps.gd.chess(target.id)?.growthTrait?.handler!=='gainDeploy')triggerGrowthDeploy(ps,target);
        break;
      case 'selfHarmGain':case 'shopBuyGrant':case 'kazdelDiscover':case 'consumeHighest':kazdelGain(ps,piece,kind);break;
      case 'majoritySale':gainGrowthMajority(ps,mult);break;
      case 'tripleGift': {
        for(let n=0;n<mult && ps.alive;n++) {
          const id=ps.m.pool.roll(ps.m.rngMeta,{maxTier:6,filter:id=>growthRewardAllowed(ps,id)});
          if(id)ps.acquireChess(id,{source:'growth'});
          if(!ps.alive)break;
          randomEquipment(ps,false);
          if(ps.m.spellShop){const spell=ps.spellSample(ps.spellPool(6),1)[0];if(spell)ps.acquireItem(spell,{source:'growth'});}
        }
        break;
      }
      case 'scribeGrowth': {
        const count=ev.growthScribeCount ?? Math.max(1,state(ps).scribeGains || 0);
        add(ps,['yanShip'],6*mult*count,false);add(ps,['miraShip'],3*mult*count,false);break;
      }
      case 'pendingFunds': ps.pendingFunds += mult; ps.dirty(); break;
      case 'saleCoins':
        for(let n=0;n<mult;n++)ps.acquireItem('chess_item_1_03_e_a',{source:'growth'});
        break;
      case 'gainedLayers': add(ps, ['yanShip'], (ps.round.gainedChess || 0) * 3 * mult); break;
      case 'ownLayersStart': add(ps, bonds(ps, piece), 3 * mult); break;
      case 'topLayers': if (top(ps)) add(ps, [top(ps)], 4 * mult); break;
      case 'ownLayersEnd': add(ps, bonds(ps, piece), 8 * mult); break;
      case 'permanentDeployGrant': {
        const loc=ps._growthCombat?.find(piece.uid) ?? ps.find(piece.uid);
        if(loc?.area!=='board')break;
        const [r]=parseKey(loc.key);
        const target=boardOrder(growthBoardMap(ps)).filter(x=>x.r===r && x.piece.kind==='chess' && !isHandLocked(x.piece)).sort((a,b)=>b.c-a.c)[0]?.piece;
        if(!target)break;
        target.meta ||= {};
        const grants=target.meta.growthDeployGrants ||= {normal:0,elite:0};
        grants[rec.isGolden?'elite':'normal']++;
        ps._growthCombat?.grantDeploy(target,grants);ps.dirty();break;
      }
      case 'saleFunds': ps.pendingFunds += 4 * mult; ps.dirty(); break;
      case 'leakSale': ev.gain = growthSellPrice(ps,piece); break;
      case 'recruitSale': {
        const tier=growthRecruitTier(ps,piece),ids=[];
        for(let n=0;n<ps.gd.rewardOffer().count;n++) {
          const id=ps.m.pool.roll(ps.m.rngShop,{tier,filter:id=>!ids.includes(id) && growthRewardAllowed(ps,id),extra:ps.diyStockEntries()});
          if(id)ids.push(id);
        }
        if(ids.length)ps.pushRewardOffer('growth',{tier,ids,label:rec.name});break;
      }
      case 'distinctVictoria': add(ps,['victoriaShip'],distinct(ps,'victoriaShip')*2*mult*(1+(piece.meta?.growthPrepEntries || 0))); break;
      case 'distinctTop': {
        const id=top(ps); if (id) add(ps,[id],distinct(ps,id)*2*mult*(1+(s.equipmentGains || 0))); break;
      }
      case 'distinctRoyal':
        add(ps,['victoriaShip'],distinct(ps,'victoriaShip')*3*mult*(1+(s.equipmentGains || 0)));
        add(ps,['miraShip'],distinct(ps,'miraShip')*2*mult*(1+(s.equipmentGains || 0))); break;
      case 'majoritySpend': {
        piece.meta ||= {};
        const total=(piece.meta.growthMajoritySpent || 0)+ev.amount;
        piece.meta.growthMajoritySpent=total%9;
        gainGrowthMajority(ps,Math.floor(total/9)*mult);break;
      }
      case 'spendEquipment': {
        piece.meta ||= {};
        const total=(piece.meta.growthSpent || 0)+ev.amount;
        piece.meta.growthSpent=total%9;
        for (let n=0;n<Math.floor(total/9);n++) randomEquipment(ps,rec.isGolden);
        break;
      }
      case 'gainExusiai': for(let n=0;n<mult;n++) ps.acquireChess('chess_char_3_01_a',{source:'growth',fromPool:false}); break;
      case 'gainSpell': {
        if (!ps.m.spellShop) break;
        for(let n=0;n<mult;n++) { const id=ps.spellSample(ps.spellPool(6),1)[0]; if(id)ps.acquireItem(id,{source:'growth'}); }
        break;
      }
      case 'autoRing': {
        if (!ps.m.spellShop) break;
        for(let n=0;n<mult;n++) {
          const previous=ps._automaticSpellItem, item=ps.newPiece('item','hs_bg28_168');
          ps._automaticSpellItem=item;
          try { ps.castSpell(item.uid,null,null,true); } finally { if(previous)ps._automaticSpellItem=previous;else delete ps._automaticSpellItem; }
        }
        break;
      }
      case 'spellCountLayers': add(ps,active,(s.spellsCast || 0)*2*mult); break;
      case 'kjeragAmplifier': s.kjeragBonus=(s.kjeragBonus || 0)+mult; break;
      case 'positionLayers': {
        const loc = ps._growthCombat?.find(piece.uid) ?? ps.find(piece.uid);
        if (loc?.area !== 'board') break;
        // Native behindPiece follows facing, rather than assuming a fixed grid direction.
        const dirs = { RIGHT: [0,-1], LEFT: [0,1], UP: [-1,0], DOWN: [1,0] };
        const [dr,dc] = dirs[ps._growthCombat?.direction(piece) || piece.dir || 'RIGHT'];
        const [r,c] = parseKey(loc.key);
        const behind = boardOrder(growthBoardMap(ps)).find(x => x.r === r+dr && x.c === c+dc)?.piece;
        for (const p of [piece,behind].filter(p => p?.kind === 'chess')) add(ps, bonds(ps,p), 4*mult);
        break;
      }
      case 'oddEquipment':
        if (!rec.isGolden && ps.m.round % 2 === 0) break;
        // fall through: the elite grants one every round, not two.
      case 'equipment': {
        const count = kind === 'oddEquipment' ? 1 : mult;
        for (let n=0;n<count;n++) {
          const id = ps.m.rollItemId({ maxTier: ps.shop.level });
          if (id) ps.acquireItem(id, { source: 'growth', deferMerge: ps._deferItemMerge > 0 });
        }
        break;
      }
      case 'refreshLayers': add(ps, ['siracusaShip','arcaneShip'], (ps.round.refreshes || 0)*2*mult); break;
      case 'boardLayers': for (const p of board(ps)) add(ps,bonds(ps,p),4*mult); break;
      case 'benchLayers': for (const p of ps.hand) if (p?.kind === 'chess' && !isHandLocked(p)) add(ps,bonds(ps,p),4*mult,rec.isGolden); break;
      case 'benchCountLayers': add(ps,active,ps.hand.filter(p=>p?.kind==='chess' && !isHandLocked(p)).length*3*mult); break;
      case 'dusk': add(ps,['yanShip','arcaneShip'],(ps.round.gainedChess || 0)*2*mult*(1+Math.floor((ps.round.growthDusk || 0)/4))); break;
      case 'siracusaGift':
        for (let n=0;n<mult;n++) {
          const id = ps.m.pool.roll(ps.m.rngMeta,{maxTier:6,filter:id=>growthRewardAllowed(ps,id) && ps.gd.chess(id)?.bonds.includes('siracusaShip')});
          if (id) ps.acquireChess(id,{source:'growth'});
        }
        break;
      case 'prepEcho': {
        const target = boardOrder(growthBoardMap(ps)).filter(x=>x.piece.uid!==piece.uid && x.piece.kind==='chess')
          .filter(x=>growthHook(ps.gd.chess(x.piece.id))==='onPrepEnd' || ps.gd.chess(x.piece.id).garrisonIds.some(id=>ps.gd.garrison(id)?.eventType==='SERVER_PREP_FIN'))
          .sort((a,b)=>b.c-a.c || a.r-b.r)[0]?.piece;
        if (target) for (let n=0;n<mult;n++) dispatcher.triggerGarrisons(ps,target,'SERVER_PREP_FIN');
        break;
      }
      case 'buyGrant': grant(ps,{match:['siracusaShip','swiftShip'],n:3*mult+s.grantBonus,active:false}); break;
      case 'grantAmplifier': s.grantBonus += mult; break;
      case 'refreshGrant': grant(ps,rec.isGolden
        ? {match:['siracusaShip'],target:'siracusaShip',n:8+s.grantBonus,active:true}
        : {match:['siracusaShip'],n:4+s.grantBonus,active:false}); break;
      case 'purchaseEcho': {
        piece.meta ||= {};
        piece.meta.growthRefreshes = (piece.meta.growthRefreshes || 0)+1;
        if (piece.meta.growthRefreshes % 3) break;
        const candidates=[];
        for(const slot of ps.shop.slots.filter(x=>x?.kind==='chess' && !x.sold)) {
          for(const grant of growthPurchaseGrants(ps,slot))if(grant.n>0)candidates.push({slot,n:grant.n,grant});
          const raw=ps.spellPurchaseBonus(slot,{raw:true});
          if(raw>0)candidates.push({slot,n:ps.spellPurchaseBonus(slot),raw,spellGrants:spellPurchaseParts(ps,slot)});
        }
        const highest=Math.max(0,...candidates.map(x=>x.n));
        if(!highest)break;
        const chosen=ps.m.rngMeta.pick(candidates.filter(x=>x.n===highest));
        for(let n=0;n<mult;n++) {
          if(chosen.grant)growthPurchase(ps,chosen.slot,[chosen.grant]);
          else grantSpellPurchase(ps,chosen.slot,chosen.spellGrants);
        }
        break;
      }
    }
  }
  return true;
}
