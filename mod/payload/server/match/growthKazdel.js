// Kazdel prep mechanics. Only explicit self-harm enters rollback, including growth-mode Desperate Excavation payments.
import {boardOrder} from './board.js';
import {isHandLocked} from '../../shared/lockedCards.js';
import {growthPurchase,growthPurchaseGrants} from './growthTraits.js';
import {growthBoardMap} from './growthCombat.js';
import {spellPurchaseParts,grantSpellPurchase} from './growthSpells.js';

const board=ps=>boardOrder(growthBoardMap(ps)).map(x=>x.piece).filter(p=>p.kind==='chess'&&!isHandLocked(p));
const type=(ps,p)=>ps.gd.chess(p.id)?.growthTrait?.handler;
const mult=(ps,p)=>ps.gd.isGolden(p.id)?2:1;
const state=ps=>ps.growthState ||= {grants:[],grantBonus:0};
export const growthRollbackAvailable=ps=>ps.m.growthMode&&board(ps).some(p=>['selfHarmRollback','shopGainRollback'].includes(type(ps,p)));
export function growthSelfDamage(ps,n) {
  if(!ps.m.growthMode || !ps.alive || !(n>0))return;
  const observers=board(ps).filter(p=>['selfHarmRollback','shopGainRollback'].includes(type(ps,p)));
  const hp=ps.lp,armor=ps.spellState?.armor || 0;
  ps.lp=Math.max(0,ps.lp-ps.spellAbsorb(n));
  if(observers.length) {
    ps.lp=hp;if(ps.spellState)ps.spellState.armor=armor;
    for(const p of observers)if(type(ps,p)==='selfHarmRollback')ps.addLayers('kazdelShip',2*mult(ps,p),{requireActive:true,reason:'growth'});
    else {
      const s=state(ps);
      s.gainGrant=(s.gainGrant || 0)+mult(ps,p)+(s.grantBonus || 0);
    }
  }
  // Maintainer: even after final-team life is pooled, active self-harm belongs only to its owner.
  // Keep the personal debit across later shared-life projections, without reducing the team pool.
  if(ps.m.teamLp!=null && ps.lpAtFinal!=null && ps.lp<hp)state(ps).personalFinalDamage=(state(ps).personalFinalDamage || 0)+(hp-ps.lp);
  ps.dirty();ps.m.markPublic();
  if(ps.lp<=0) {
    ps.m.eliminateBroken();
    if(!ps.m.alivePlayers().length)ps.m.finish({victory:false,reason:'eliminated'});
    else ps.m.onReadyChanged(ps);
  }
}
export function devourPurchaseSnapshot(ps,slot) {
  return {slot,grants:growthPurchaseGrants(ps,slot).map(g=>({...g})),bonus:ps.spellPurchaseBonus(slot,{raw:true}),spellGrants:spellPurchaseParts(ps,slot)};
}
export function grantDevourPurchase(ps,{slot,grants,bonus,spellGrants},repeats=1) {
  for(let r=0;r<repeats;r++) {
    growthPurchase(ps,slot,grants,{devour:true});
    if(bonus)grantSpellPurchase(ps,slot,spellGrants || [{n:bonus,count:1}],{devour:true});
  }
}
export function consumeShop(ps,n,repeats=1,highest=false) {
  for(let i=0;i<n && ps.alive;i++) {
    const slots=ps.shop.slots.filter(s=>s?.kind==='chess'&&!s.sold);
    if(!slots.length)return;
    if(highest)slots.sort((a,b)=>ps.gd.chess(b.id).tier-ps.gd.chess(a.id).tier);
    const slot=highest?slots[0]:ps.m.rngMeta.pick(slots),tier=ps.gd.chess(slot.id).tier;
    // Consume only this displayed card; no acquisition, sale, stock take, onBuy or onGain is fabricated.
    const reward=devourPurchaseSnapshot(ps,slot);
    slot.sold=true;
    grantDevourPurchase(ps,reward,repeats);
    if(highest)for(const b of ['kazdelShip','visiShip'])ps.addLayers(b,tier*repeats,{requireActive:true,reason:'growth'});
  }
  ps.dirty();
}
export function kazdelEvent(ps,hook,ev) {
  if(!ps.m.growthMode || !ps.alive)return;
  if(hook==='onLayers' && ev.bondId==='kazdelShip' && ps.bonds.kazdelShip?.active) {
    const owed=Math.floor(ev.to/100)-(state(ps).kazdelHorns || 0);
    if(owed>0) {
      state(ps).kazdelHorns=Math.floor(ev.to/100);
      for(let i=0;i<owed;i++)ps.acquireItem('chess_item_c_01_e_a',{source:'growth:kazdel'});
    }
  }
  if(hook==='onActiveBonds' && ev.activated?.includes('kazdelShip'))kazdelEvent(ps,'onLayers',{bondId:'kazdelShip',to:ps._growthCombat?.permanentLayers('kazdelShip') ?? ps.layers.kazdelShip ?? 0});
  if(hook==='onGain' && ev.kind==='chess' && ps.gd.chess(ev.piece.id)?.bonds.includes('kazdelShip')) {
    for(const p of board(ps)) {
      if(type(ps,p)==='kazdelGainAura') {
        growthSelfDamage(ps,1);
        if(ps.alive)ps.addLayers('kazdelShip',2*mult(ps,p),{requireActive:true,reason:'growth'});
      }
      if(ps.alive && type(ps,p)==='kazdelConsume')consumeShop(ps,1,mult(ps,p));
      if(!ps.alive)break;
    }
  }
}
export function kazdelGain(ps,p,kind) {
  const m=mult(ps,p);
  if(kind==='selfHarmGain')for(let n=0;n<m;n++)growthSelfDamage(ps,1);
  if(kind==='shopBuyGrant') {
    const s=state(ps),old=s.grants.find(g=>g.kazdelBuy);
    // Suzuran strengthens every subsequent shop purchase grant at assignment time, including Kazdel sources.
    const n=2*m+(s.grantBonus || 0);
    if(old)old.n+=n;else s.grants.push({n,active:false,kazdelBuy:true});
  }
  if(kind==='consumeHighest')consumeShop(ps,1,m,true);
  if(kind==='kazdelDiscover')for(let n=0;n<m;n++) {
    const source=ps.gd.chess(p.id);
    const pool=ps.gd.visibleChess.filter(id=>ps.m.pool.left(id)>0 && ps.gd.chess(id).charId!==source.charId && ps.gd.chess(id).bonds.includes('kazdelShip'));
    const ids=ps.m.rngMeta.shuffle(pool).slice(0,3);
    if(ids.length)ps.offers.push({source:'growth:kazdel',growthSelfDamage:true,label:ps.gd.chess(p.id).name,slots:ids.map(id=>({kind:'chess',id,price:0,sold:false}))});
  }
}
export function kazdelSpell(ps) {
  if(!ps.m.growthMode || !ps.alive)return;
  for(const p of board(ps))if(type(ps,p)==='spellConsume')consumeShop(ps,2,mult(ps,p));
}
