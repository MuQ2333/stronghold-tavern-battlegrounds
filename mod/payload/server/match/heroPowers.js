// Host support for independently loaded hero strategy records. All state belongs to one player/match.
import { heroPowerId, heroAvailable } from '../../shared/heroPowers.js';
import { spellShopEnabled, spellTarget } from '../../shared/spells.js';
import { ERR } from '../../shared/constants.js';
import { pieceBonds } from './bondsMeta.js';
import {lockHandCard,unlockHandCards,handLockedCards} from './lockedCards.js';
import {isHandLocked} from '../../shared/lockedCards.js';
import { spellBandPool } from '../../shared/spellBands.js';

const passive = new Set(['gallywix','sindragosa','millhouse','mukla','flurgl','nozdormu','omu','guff','tamsin','voone','hoggarr','thelan','yogg','faelin','nguyen']);
const ok = { ok: true };
const fail = (error = ERR.BAD_TARGET) => ({ error });
export const powerOf = ps => ps?.m?.heroMod && heroAvailable(ps.gd.band(ps.bandId), spellShopEnabled(ps.m.spellShop)) ? heroPowerId(ps.gd.band(ps.bandId)) : null;
const initial = () => ({ usedRound:0, uses:0, progress:0, income:0, nextRound:0, discount:0, freeRefresh:0, pot:[], choices:[], sequence:0, previous:[], deaths:[], faelinStep:0 });
const state = ps => ps.heroState ||= initial();
const choose = (ps, list) => list.length ? list[Math.floor(ps.m.rngMeta() * list.length)] : null;
const sample = (ps, list, count=3) => {
  const a = [...new Set(list)], out=[];
  while (a.length && out.length<count) out.push(a.splice(Math.floor(ps.m.rngMeta()*a.length),1)[0]);
  return out;
};
const coin = 'chess_item_1_03_e_a';
const room = ps => ps.hand.some(x=>!x) || ps.temp.some(x=>!x);
function rotateTeammate(ps,s) {
  const mates=ps.m.order.filter(p=>p!==ps&&p.alive&&!p.left);
  const mate=mates.find(p=>p.seat>(s.sourceSeat??-1))||mates[0];
  s.sourcePlayerId=mate?.playerId??null;
  if(mate)s.sourceSeat=mate.seat;
}
function sourceTeammate(ps) { return ps.m.players.get(ps.heroState?.sourcePlayerId)||null; }
// Only installed, implemented spells; equal probability per kind, never per remaining copy.
function spellCandidates(ps,{price=null}={}) {
  return ps.spellPool().map(id=>ps.gd.item(id)).filter(c=>price===null||ps.gd.itemPrice(c.id)===price);
}
function autoSpell(ps) {
  const options=ps.spellSample(spellCandidates(ps),spellCandidates(ps).length);
  for (const rec of options) {
    const mode=spellTarget(rec), targets=mode==='chess'?ps.spellSample(ps.allChess().filter(p=>!isHandLocked(p)) , ps.allChess().length):[null];
    for(const target of targets) {
      const item=ps.newPiece('item',rec.id);
      ps._automaticSpellItem=item;
      let result;
      try {
      if(mode==='tile') {
        for(const [key,kind] of ps.deployMap()) { const [row,col]=key.split(',').map(Number); if(kind==='melee'&&!ps.board.has(key)){result=ps.castSpell(item.uid,null,{row,col},true);if(result.ok)break;} }
      } else result=ps.castSpell(item.uid,target?.uid??null,null,true);
      } finally {delete ps._automaticSpellItem;}
      if(result?.ok)return;
    }
  }
}
function candidates(ps, {tier, maxTier=ps.shop.level, bonds, stock=true}={}) {
  return ps.gd.visibleChess.filter(id => {
    const c=ps.gd.chess(id), pool=ps.poolOf(id);
    return c && !c.isGolden && !c.isDiy && pool.has(id) && (!stock || pool.left(id)>0)
      && (tier == null ? c.tier<=maxTier : c.tier===tier)
      && (!bonds || c.bonds?.some(b=>bonds.includes(b)));
  });
}
function generated(ps,id) { return ps.acquireChess(id,{source:'hero',fromPool:false,noPoolTopUp:true}); }
function give(ps, entry) {
  if (entry.kind==='item') return ps.acquireItem(entry.id,{source:'hero',ignoreStock:entry.generated===true,reservedStock:entry.reservedItem===true});
  if (entry.generated || entry.reserved) return ps.acquireChess(entry.id,{source:'hero',fromPool:false,noPoolTopUp:true,reservedCopies:entry.reserved?1:0});
  if (ps.poolOf(entry.id).left(entry.id)<1) return null;
  return ps.acquireChess(entry.id,{source:'hero'});
}
function offer(ps, ids, options={}) {
  const s=state(ps);
  if (!ids.length) return false;
  s.sequence=ps.heroSequence=Math.max(s.sequence,ps.heroSequence||0)+1;
  s.choices=ids.map(id => typeof id==='string' ? {kind:'chess',id,...options} : {...id,...options});
  return true;
}
function discover(ps, filter, options={}) { return offer(ps,sample(ps,candidates(ps,filter)),options); }
function chestSlot(ps,id,generated=false) {
  return {kind:'chess',id,basePrice:ps.gd.chessPrice(id),frozen:ps.shop.frozen,sold:false,...(generated?{heroGenerated:true}:{})};
}
export function heroRefreshPrice(ps) { return powerOf(ps)==='millhouse'?2:ps.gd.refreshPrice; }
export function heroUpgradePrice(ps) { return Math.max(0,ps.shop.upgradePrice)+(powerOf(ps)==='millhouse'?1:0); }
export function heroSlots(ps,n) { return powerOf(ps)==='sindragosa'?Math.max(0,n-1):n; }
export function heroFreeRefresh(ps) { return powerOf(ps)==='nozdormu' && (ps.heroState?.freeRefresh||0)>0; }
export function heroFirstRoundBlocked(ps) { return powerOf(ps)==='faelin' && ps.m.round===1; }

/** Identity stays Nguyen while battle / meta hooks use the selected strategy's ordinary bandId. */
export function heroIdentityBand(ps) { return ps.nguyenState ? 'band_hs_nguyen' : ps.bandId; }
export function strategyPool(ps, temporary = false) {
  return spellBandPool(ps.gd, { round:ps.m.round, level:ps.shop.level, current:ps.bandId, heroes:!!ps.m.heroMod, temporary,
    taken:[...(ps.nguyenState?['band_hs_nguyen']:[]),...ps.m.order.filter(p=>p!==ps&&p.alive).flatMap(p=>[p.bandId,heroIdentityBand(p)])] });
}

/** Clear unearned progress only. Already gained funds, layers, cards and physical card locks remain owned. */
export function replaceHeroStrategy(ps, bandId, { temporary = false, startRound = false } = {}) {
  for(const key of Object.keys(ps.counters)) if(key.startsWith('band:')) delete ps.counters[key];
  const oldId=powerOf(ps), sequence=Math.max(ps.heroState?.sequence||0,ps.heroSequence||0);
  ps.heroSequence=sequence;
  ps.bandId=bandId;
  ps.heroState={...initial(),sequence};
  if(powerOf(ps)==='sylvanas')ps.heroState.deaths=[...(ps.lastHeroDeaths||[])];
  if(!temporary) delete ps.nguyenState;
  const newId=powerOf(ps);
  // Restore/remove Sindragosa's extra slot without rerolling or touching equipment / spells.
  if(oldId==='sindragosa'||newId==='sindragosa') {
    const layout=ps.shop.layout, old=ps.shop.slots, target=heroSlots(ps,ps.gd.shopSlots(ps.shop.level).chess);
    if(layout && !ps.shop.spellOverride) {
      const units=old.slice(0,layout.chess).slice(0,target);
      while(units.length<target)units.push(null);
      ps.shop.slots=[...units,...old.slice(layout.chess)];ps.shop.layout={...layout,chess:target};
    }
  }
  if(startRound) {
    // Run just the newly selected strategy's hook. No duplicate income, garrisons or other round-start effects.
    ps.m.dispatcher.dispatchBand(ps,'onRoundStart',{round:ps.m.round});
    heroEvent(ps,'onRoundStart',{});
  } else if(newId==='nguyen') heroEvent(ps,'onRoundStart',{});
  else {
    ps.heroState.startedRound=ps.m.round;
    if(newId==='nozdormu')ps.heroState.freeRefresh=1;
    if(newId==='tess'||newId==='scabbs')rotateTeammate(ps,ps.heroState);
  }
  ps.recompute();ps.m.markPublic();
  for(const p of ps.m.order)ps.m.markPrivate(p);
}

/** Expire the previous temporary power before income and the new shop are calculated. */
export function beginHeroRound(ps) {
  if(!ps.nguyenState)return;
  const previous=ps.bandId;
  ps.nguyenState.previous=previous;
  ps.nguyenState.choices=[];
  replaceHeroStrategy(ps,'band_hs_nguyen',{temporary:true});
}

function nguyenOffer(ps) {
  const n=ps.nguyenState ||= {round:0,choices:[],previous:null};
  if(n.round===ps.m.round)return;
  n.round=ps.m.round;
  const ids=strategyPool(ps,true).filter(id=>id!==n.previous);
  // [ASSUMED] equal weights among the eligible adaptation pool; Blizzard's hidden weights are unavailable.
  const choices=sample(ps,ids,2).map(id=>({kind:'band',id,nguyen:true}));
  n.choices=choices;
  offer(ps,choices);
}

/** Adapt hero reservations to the common pending-card view, without exposing pool bookkeeping. */
export function heroLockedCards(ps) {
  return handLockedCards(ps);
}

/** The draft keeps initial counters; in-match text reflects the authoritative current state. */
export function heroDescription(ps) {
  const band=ps.gd.band(ps.bandId),id=powerOf(ps),s=ps.heroState||initial();
  let desc=band?.desc||'';
  if(id==='eudora')desc=desc.replace(/还要挖\d+次/,`还要挖${4-s.progress}次`);
  if(id==='zephrys')desc=desc.replace(/还剩\d+个愿望/,`还剩${Math.max(0,3-s.uses)}个愿望`);
  if(id==='guff')desc=desc.replace(/还剩\d+阶/,`还剩${20-s.progress}阶`);
  if(id==='cookie')desc=desc.replace(/还剩\d+名/,`还剩${3-s.pot.length}名`);
  if(id==='voone')desc=desc.replace(/还剩\d+回合！/,ps.m.round>0&&ps.m.round%3===0?'就是这回合！':`还剩${3-((Math.max(1,ps.m.round)-1)%3)}回合！`);
  if(id==='thelan')desc=desc.replace(/还剩\d+张！/,s.progress===2?'就是这张！':`还剩${2-s.progress}张！`);
  if(id==='voone'&&spellShopEnabled(ps.m.spellShop))desc=desc.replace('干员或装备','干员、装备或法术');
  if(id==='galewing'&&s.flight)desc=desc.split('\n').map((line,index)=>index===s.flight?line.replace(/还剩\d+回合/,`还剩${Math.max(0,s.nextRound-ps.m.round)}回合`):line).join('\n');
  return desc;
}

export function heroEvent(ps,hook,ev) {
  if(hook==='onIncome')ev.income+=ps.permanentHeroIncome||0;
  if(hook==='onPrepEnd') ps.lastHeroLineup=[...ps.board.values()].filter(p=>p.kind==='chess').map(p=>ps.gd.baseIdOf(p.id));
  if(hook==='onBattleResult' && (ps.nguyenState || powerOf(ps)==='sylvanas')) {
    const own=ev.result?.heroDeaths||[], united=ev.unite?.perPlayer?.[ps.playerId]?.heroDeaths||[];
    ps.lastHeroDeaths=[...own,...united].map(uid=>ps.find(uid)?.piece).filter(p=>p?.kind==='chess').map(p=>ps.gd.baseIdOf(p.id));
  }
  const id=powerOf(ps); if (!id) return;
  const s=state(ps), r=ps.m.round;
  if(id==='nguyen' && hook==='onRoundStart') {nguyenOffer(ps);return;}
  if(hook==='onPrice' && id==='thelan' && ev.kind==='item' && spellTarget(ps.gd.item(ev.id)) && s.progress===2) ev.price=0;
  if (hook==='onPrice' && ev.kind==='chess' && ['sindragosa','millhouse'].includes(id)) {
    const disc=ps.counters['bondaddon:visi:disc']||0;
    const discounted=disc>=2 || (disc===1 && ps.gd.chess(ev.id)?.bonds?.includes('visiShip'));
    if (!discounted) ev.price=Math.max(0,ev.price-1);
  }
  if (hook==='onRoundStart') {
    if (s.startedRound===r) return;
    s.startedRound=r;
    if(id==='tess'||id==='scabbs')rotateTeammate(ps,s);
    if(id==='yogg' && r>=3) autoSpell(ps);
    if (id==='gallywix') s.progress=0;
    if (id==='nozdormu') s.freeRefresh++;
    if (id==='togwaggle') s.discount=Math.min(11,s.discount+1);
    if (id==='mukla') for (const p of ps.m.players.values()) if(p.alive) {
      for(let i=0;i<(p===ps?2:1);i++) p.acquireItem('chess_item_1_04_e_a',{source:'hero',ignoreStock:true});
    }
    if (id==='faelin' && !s.faelinStep && !s.choices.length) discover(ps,{tier:6},{faelin:true});
    if (id==='galewing' && s.flight && r>=s.nextRound) {
      const route=s.flight; s.flight=0;
      if(route===1) {
        const items=spellCandidates(ps,{price:1});
        const it=choose(ps,items); if(it) ps.acquireItem(it.id,{source:'hero'});
      } else if(route===2) ps.addFunds(2);
      else discover(ps,{tier:ps.shop.level});
    }
    unlockHandCards(ps);
  }
  if(hook==='onLevelUp') {
    if(id==='omu') ps.addFunds(2);
    unlockHandCards(ps);
  }
  if(hook==='onBattleResult' && id==='sylvanas') {
    s.deaths=[...ps.lastHeroDeaths];
  }
  if(hook==='onSold') {
    if(id==='gallywix') { ps.pendingFunds++; s.progress++; }
    if(id==='flurgl' && ++s.progress>=5) {
      s.progress-=5;
      const highest=Math.max(0,...Object.values(ps.layers));
      const bonds=Object.keys(ps.layers).filter(b=>ps.layers[b]===highest);
      const reward=highest?choose(ps,candidates(ps,{bonds})):null;
      if(reward) give(ps,{kind:'chess',id:reward}); else ps.acquireItem(coin,{source:'hero',ignoreStock:true});
    }
  }
  if(hook==='onBuy') {
    if(id==='thelan' && ev.kind==='item' && spellTarget(ps.gd.item(ev.slot.id))) s.progress=(s.progress+1)%3;
    if(id==='hoggarr' && ev.kind==='chess' && ps.gd.chess(ev.slot.id)?.bonds?.some(b=>['visiShip','miraShip','investShip'].includes(b))) ps.addFunds(1);
    if(id==='guff') {
      s.progress+=(ev.kind==='chess'?ps.gd.chess(ev.slot.id):ps.gd.item(ev.slot.id))?.tier||0;
      while(s.progress>=20) { s.progress-=20; ps.pushRewardOffer('hero'); }
    }
  }
  if(hook==='onPrepEnd') {
    finishHeroChoices(ps);
    s.previous=[...ps.board.values()].filter(p=>p.kind==='chess').map(p=>ps.gd.baseIdOf(p.id));
    if(id==='sindragosa') { ps.shop.frozen=true; for(const slot of ps.shop.slots) if(slot&&!slot.sold) slot.frozen=true; }
    if(id==='voone' && r%3===0) {
      const p=ps.hand[0];
      if(p?.kind==='chess'&&!isHandLocked(p)) generated(ps,ps.gd.baseIdOf(p.id));
      else if(p?.kind==='item'&&!isHandLocked(p)) ps.acquireItem(ps.gd.item(p.id).baseId||p.id,{source:'hero',ignoreStock:true,deferMerge:true});
    }
  }
}
export function finishHeroChoices(ps) {
  if(!powerOf(ps) && !ps.nguyenState)return;
  const s=state(ps);
  if(s.choices[0]?.nguyen) {
    const entry=s.choices.find(e=>strategyPool(ps,true).includes(e.id));
    s.choices=[];
    if(entry)selectNguyen(ps,entry.id);
    else if(ps.nguyenState)ps.nguyenState.choices=[];
    return finishHeroChoices(ps);
  }
  for(let i=0;i<3 && s.choices.length;i++) {
    const entry=s.choices.find(e=>e.generated||e.kind==='item'||ps.poolOf(e.id).left(e.id)>0);
    if(entry?.faelin&&!ps.hand.some(p=>!p))break;
    s.choices=[];
    if(!entry)break;
    if(entry.faelin) {
      ps.poolOf(entry.id).take(entry.id,1);
      lockHandCard(ps,entry,{unlockLevel:ps.gd.tierOf(entry.id),sourceName:ps.gd.band(ps.bandId).effectName});s.faelinStep++;
      if(s.faelinStep<3)discover(ps,{tier:[6,4,2][s.faelinStep]},{faelin:true});
    }else give(ps,entry);
  }
  unlockHandCards(ps);
}

function selectNguyen(ps, bandId) {
  const n=ps.nguyenState;
  if(!n)return false;
  n.choices=[];n.selected=bandId;
  replaceHeroStrategy(ps,bandId,{temporary:true,startRound:true});
  return true;
}
/** A bounded final prep action for AI seats; uses the same validated endpoint as humans. */
export function heroBotTurn(ps) {
  if (!powerOf(ps)) return;
  finishHeroChoices(ps);
  const h=heroView(ps);
  if(!h||h.passive||h.disabled)return;
  const args={action:'use'};
  if(h.id==='galewing') args.route=3;
  if(h.id==='cookie'||h.id==='maiev') {
    const target=h.targets.find(x=>x.slot!==undefined);
    if(!target)return;
    args.slot=target.slot;args.expectedId=target.id;
  }
  useHeroPower(ps,args);
  finishHeroChoices(ps);
}
function pairs(ps) {
  const counts=new Map();
  for(const p of ps.allChess()) if(!isHandLocked(p)&&!ps.gd.isGolden(p.id)) counts.set(p.id,(counts.get(p.id)||0)+1);
  return [...counts].filter(([id,n])=>n>=2 && ps.gd.mergeCount(id)===3).map(([id])=>id);
}
function cost(ps,id,s) {
  if(id==='elise') return 1+s.uses;
  if(id==='togwaggle') return Math.max(0,11-s.discount);
  if(['zephrys','cenarius'].includes(id)) return 3;
  if(id==='sylvanas'||id==='scabbs') return 2;
  return ['cookie','galewing','faelin'].includes(id)?0:1;
}

export function useHeroPower(ps,msg) {
  const gate=ps._gate(); if(gate) return gate;
  const id=powerOf(ps); if(!id) return fail();
  const s=state(ps), r=ps.m.round;
  if(msg.action==='pick') {
    if(msg.sequence!==s.sequence) return fail();
    const entry=s.choices[msg.index]; if(!entry) return fail();
    if(entry.nguyen) {
      if(!ps.nguyenState || !strategyPool(ps,true).includes(entry.id))return fail();
      selectNguyen(ps,entry.id);return ok;
    }
    if(entry.faelin) {
      if(!ps.hand.some(p=>!p))return fail(ERR.HAND_FULL);
      if(ps.poolOf(entry.id).left(entry.id)<1) return fail(ERR.SOLD_OUT);
      ps.poolOf(entry.id).take(entry.id,1);
      lockHandCard(ps,entry,{unlockLevel:ps.gd.tierOf(entry.id),sourceName:ps.gd.band(ps.bandId).effectName});
      s.choices=[]; s.faelinStep++;
      if(s.faelinStep<3) discover(ps,{tier:[6,4,2][s.faelinStep]},{faelin:true});
      unlockHandCards(ps);
    } else {
      if(!room(ps) && !(entry.kind==='chess' && ps.completesChessMerge(entry.id))) return fail(ERR.HAND_FULL);
      if(!give(ps,entry)) return fail(ERR.SOLD_OUT);
      s.choices=[];
    }
    ps.dirty(); return ok;
  }
  if(msg.action!=='use' || passive.has(id) || s.choices.length || s.usedRound===r || r<s.nextRound) return fail();
  if(id==='alexstrasza' && ps.shop.level<4 || id==='sylvanas' && r<3 || id==='zephrys' && s.uses>=3 || id==='faelin') return fail();
  const price=cost(ps,id,s); if(ps.funds<price) return fail(ERR.NO_FUNDS);
  let run;
  if(id==='hollidae') {
    if(!room(ps))return fail(ERR.HAND_FULL);
    const list=spellCandidates(ps);if(!list.length)return fail(ERR.SOLD_OUT);
    run=()=>ps.acquireItem(choose(ps,list).id,{source:'hero'});
  } else if(id==='elise' || id==='alexstrasza') {
    const ids=candidates(ps,id==='elise'?{tier:ps.shop.level}:{bonds:['yanShip']});
    if(!ids.length) return fail(ERR.SOLD_OUT);
    run=()=>offer(ps,sample(ps,ids));
  } else if(id==='zephrys') {
    const ids=pairs(ps); if(!ids.length) return fail();
    run=()=>generated(ps,choose(ps,ids));
  } else if(id==='eudora') {
    const ids=candidates(ps,{stock:false});
    if(s.progress===3 && (!ids.length || !room(ps))) return fail(ERR.HAND_FULL);
    run=()=>{ if(++s.progress===4) { generated(ps,ps.gd.goldenIdOf(choose(ps,ids))); ps.pushRewardOffer('hero'); s.progress=0; } };
  } else if(id==='snakeeyes') run=()=>{ const n=1+Math.floor(ps.m.rngMeta()*6); s.roll=n; s.nextRound=r+n; ps.addFunds(n); };
  else if(id==='cenarius') run=()=>{s.income++;ps.permanentHeroIncome=(ps.permanentHeroIncome||0)+1;};
  else if(id==='toki') run=()=>{
    ps.rollShop();
    const ids=candidates(ps,{tier:Math.min(ps.shop.level+1,ps.gd.maxShopLevel)});
    for(let i=0;i<Math.min(2,ps.shop.layout.chess);i++) {const cid=choose(ps,ids); if(cid) ps.shop.slots[i]=chestSlot(ps,cid);}
    ps.stats.refreshes++; ps.round.refreshes++;
    ps.m.dispatch(ps,'onRefresh',{slots:ps.shop.slots,price,free:false});
  };
  else if(id==='galewing') {
    if(s.flight || ![1,2,3].includes(msg.route)) return fail();
    run=()=>{s.flight=msg.route;s.nextRound=r+msg.route;};
  } else if(id==='tess'||id==='scabbs') {
    const mate=sourceTeammate(ps);
    const ids=mate?.lastHeroLineup;
    if(!mate?.alive || mate.left || mate===ps || !ids?.length) return fail();
    if(msg.playerId!==undefined&&msg.playerId!==mate.playerId)return fail();
    run=id==='scabbs'?()=>offer(ps,sample(ps,ids),{generated:true}):()=>{ const picks=ids.slice(0,ps.shop.layout.chess); for(let i=0;i<ps.shop.layout.chess;i++) ps.shop.slots[i]=picks[i]?chestSlot(ps,picks[i],true):ps._rollChessSlot(); };
  } else if(id==='maiev') {
    if(!ps.hand.some(p=>!p))return fail(ERR.HAND_FULL);
    const slot=ps.shop.slots[msg.slot];
    if(!slot || slot.sold || slot.id!==msg.expectedId || (slot.kind==='item' && !ps.m.itemPool.canGain(slot.id))) return fail();
    if(slot.kind==='chess'&&!slot.heroGenerated && ps.poolOf(slot.id).left(slot.id)<1) return fail(ERR.SOLD_OUT);
    run=()=>{
      slot.sold=true;
      if(slot.kind==='chess'&&!slot.heroGenerated) ps.poolOf(slot.id).take(slot.id,1);
      lockHandCard(ps,{...slot,generated:!!slot.heroGenerated},{unlockRound:r+2,sourceName:ps.gd.band(ps.bandId).effectName});
    };
  } else if(id==='cookie') {
    if ((msg.uid !== undefined) === (msg.slot !== undefined)) return fail();
    const loc=msg.uid?ps.find(msg.uid):null, slot=Number.isInteger(msg.slot)?ps.shop.slots[msg.slot]:null;
    const target=loc?.piece||slot;
    if(isHandLocked(target))return fail();
    if(!target || target.kind!=='chess' || slot?.sold || (slot && slot.id!==msg.expectedId) || (loc && !['board','hand','temp'].includes(loc.area))) return fail();
    if(loc && (target.items||[]).length>ps.hand.filter(x=>!x).length+ps.temp.filter(x=>!x).length+(loc.area==='board'?0:1)) return fail(ERR.HAND_FULL);
    run=()=>{
      s.pot.push(loc?pieceBonds(ps.gd,target):ps.gd.chess(target.id).bonds||[]);
      if(slot) slot.sold=true;
      else { ps._detach(loc);ps.removeTokensOf(target.uid);ps.returnCopies(target);for(const it of target.items||[]) ps.stow(it,{allowTemp:true});ps.checkItemMerges(); }
      if(s.pot.length===3) { const entries=s.pot.map(bonds=>{const cid=choose(ps,candidates(ps,{bonds}));return cid?{kind:'chess',id:cid}:{kind:'item',id:coin,generated:true};});offer(ps,entries);s.pot=[]; }
    };
  } else if(id==='sylvanas') {
    if(!s.deaths.length) return fail();
    run=()=>{
      // Each death is an equally likely ticket; remove a chosen identity to keep discover options distinct.
      let tickets=[...s.deaths];const picks=[];
      while(tickets.length&&picks.length<3){const pick=choose(ps,tickets);picks.push(pick);tickets=tickets.filter(id=>id!==pick);}
      offer(ps,picks,{generated:true});
    };
  } else if(id==='togwaggle') {
    const slots=ps.shop.slots.filter(x=>x&&!x.sold);
    if(!slots.length || !canCollect(ps,slots)) return fail(ERR.HAND_FULL);
    run=()=>{
      // Hold acquire/merge hooks until every shop item has been stowed. A gain-triggered gift
      // must not steal the capacity reserved for another item in this same purchase.
      const queue=[];ps.heroAcquisitionQueue=queue;
      try { for(const slot of slots) {give(ps,{...slot,generated:!!slot.heroGenerated});slot.sold=true;} }
      finally {delete ps.heroAcquisitionQueue;}
      for(const [hook,ev]of queue)ps.m.dispatch(ps,hook,ev);
      s.discount=0;
    };
  } else return fail();
  ps.spend(price);s.usedRound=r;s.uses++;
  run();ps._afterSpend(price,'hero');ps.recompute();ps.dirty();return ok;
}
// Conservative dry run includes operator merges and the equipment returned by those merges.
function canCollect(ps,slots) {
  let free=ps.hand.filter(x=>!x).length+ps.temp.filter(x=>!x).length;
  const held=ps._chessLocations().filter(l=>!isHandLocked(l.piece)).map(l=>({id:l.piece.id,board:l.area==='board',items:l.piece.items?.length||0}));
  const stock=new Map(), itemStock=new Map();
  for(const slot of slots) {
    if(slot.kind==='item') {
      const base=ps.gd.baseIdOf(slot.id), n=(itemStock.get(base)||0)+ps.m.itemPool.need(slot.id);itemStock.set(base,n);
      if(ps.m.itemPool.left(slot.id)<n)return false;
      free--;
    }
    else {
      if(!slot.heroGenerated) {const n=(stock.get(slot.id)||0)+1;stock.set(slot.id,n);if(ps.poolOf(slot.id).left(slot.id)<n)return false;}
      const need=ps.gd.mergeCount(slot.id), matches=held.filter(x=>x.id===slot.id).slice(0,need-1);
      if(matches.length===need-1) {
        for(const p of matches) {free+=(p.board?0:1)-p.items;held.splice(held.indexOf(p),1);}
        if(!matches.some(x=>x.board)) free--;
      } else {free--;held.push({id:slot.id,board:false,items:0});}
    }
    if(free<0)return false;
  }
  return true;
}

export function heroView(ps) {
  const id=powerOf(ps)||(ps.nguyenState?'nguyen':null); if(!id)return null;
  const s=ps.heroState||initial(), band=ps.gd.band(ps.bandId);
  const mate=id==='tess'||id==='scabbs'?sourceTeammate(ps):null;
  const targets=[];
  if(['cookie','maiev'].includes(id)) ps.shop.slots.forEach((x,slot)=>{if(x&&!x.sold&&(id==='maiev'||x.kind==='chess')) targets.push({slot,id:x.id,kind:x.kind});});
  if(id==='cookie') for(const p of ps.allChess().filter(p=>!isHandLocked(p))) targets.push({uid:p.uid,id:p.id,kind:'chess'});
  return {id,name:band.effectName,desc:heroDescription(ps),round:ps.m.round,passive:passive.has(id),price:cost(ps,id,s),used:s.usedRound===ps.m.round,
    remaining:id==='zephrys'?Math.max(0,3-s.uses):null,progress:s.progress,income:s.income,freeRefresh:s.freeRefresh,
    cooldown:Math.max(0,s.nextRound-ps.m.round),locked:handLockedCards(ps).map(p=>({kind:p.kind,id:p.id,round:p.unlockRound,level:p.unlockLevel})),flight:s.flight||0,pot:s.pot,roll:s.roll||0,
    choices:s.choices,sequence:s.sequence,targets,canPick:ps.alive&&!ps.ready&&ps.m.phase==='PREP',
    ...(ps.nguyenState?{ownerId:'nguyen',temporary:true,activeBandId:ps.bandId}:{}),
    teammates:[],sourcePlayer:mate?{playerId:mate.playerId,name:mate.name}:null,
    disabled:!ps.alive||ps.ready||ps.m.phase!=='PREP'||s.usedRound===ps.m.round||ps.funds<cost(ps,id,s)||ps.m.round<s.nextRound
      || id==='alexstrasza'&&ps.shop.level<4 || id==='sylvanas'&&(ps.m.round<3||!s.deaths.length) || id==='zephrys'&&s.uses>=3
      || (id==='tess'||id==='scabbs')&&(!mate?.alive||mate.left||!mate.lastHeroLineup?.length),
  };
}
