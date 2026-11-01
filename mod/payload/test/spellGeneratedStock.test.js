import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch,give,checkInvariants} from './match/harness.js';
import {ALL_SPELLS} from '../shared/spellCatalog.js';
import {helpfulRefresh} from '../server/match/spellWisdom.js';

function setup() {
  const h=makeMatch({fake:true,spellShop:true,heroMod:false,humans:2,seed:19});h.start();h.toPrep(1);
  const ps=h.ps('p_0');ps.bandId=null;ps.funds=1000;ps.shop.level=6;ps.rollShop();
  const id=ps.spellChessPool(1,c=>c.position==='MELEE')[0];assert.ok(id);
  return {h,ps,id};
}
function deploy(h,ps,id) {
  const piece=give(h.m,ps,id);
  const [key]=[...ps.deployMap()].find(([key])=>!ps.board.has(key)&&ps._legal(piece,...key.split(',').map(Number)));
  ps._detach(ps.find(piece.uid));ps.board.set(key,piece);ps.recompute();return piece;
}
function cast(ps,name) {
  const spell=ps.acquireItem(ALL_SPELLS.find(c=>c.name===name).id);
  assert.equal(ps.castSpell(spell.uid).ok,true);
}
function done(h){checkInvariants(h.m);assert.deepEqual(h.logs.error,[]);h.m.dispose();}

for(const source of ['touch','wisdom'])test(`${source} golden buys hold no shared copies, retain promotion rewards and never refill sold-out stock`,()=>{
  const {h,ps,id}=setup();
  if(source==='touch'){
    ps.shop.slots=ps.shop.slots.map((_,i)=>i===0?{kind:'chess',id,basePrice:2,sold:false}:null);cast(ps,'点金之触');
  }else{assert.equal(helpfulRefresh(ps,'golden'),'golden');}
  const index=ps.shop.slots.findIndex(s=>s?.spellGoldenReward),slot=ps.shop.slots[index];assert.ok(slot.heroGenerated);
  const base=ps.gd.baseIdOf(slot.id),other=h.ps('p_1');
  for(let n=h.m.pool.left(base);n>0;n--)other.acquireChess(base,{silent:true});
  assert.equal(h.m.pool.left(base),0);
  const offers=ps.offers.length;assert.equal(ps.buy(index).ok,true);
  const piece=ps.allChess().find(p=>p.id===slot.id);assert.equal(piece.poolCopies,0);assert.equal(piece.noPoolTopUp,true);
  assert.equal(ps.offers.length,offers+1);assert.equal(h.m.pool.entries.get(base).left,0);
  assert.equal(ps.sell(piece.uid).ok,true);assert.equal(h.m.pool.entries.get(base).left,0);done(h);
});

test('Wisdom mirrors a sold-out owned identity while ordinary filler purchases still take and return stock',()=>{
  const {h,ps,id}=setup();deploy(h,ps,id);const other=h.ps('p_1');
  for(let n=h.m.pool.left(id);n>0;n--)other.acquireChess(id,{silent:true});
  assert.equal(helpfulRefresh(ps,'mirror'),'mirror');assert.equal(ps.shop.slots[0].id,id);assert.equal(ps.shop.slots[0].heroGenerated,true);
  ps.shop.frozen=true;for(const slot of ps.shop.slots)if(slot)slot.frozen=true;ps.rollShop({keepFrozen:true});
  assert.equal(ps.shop.slots[0].heroGenerated,true,'frozen copied offers retain generated provenance');
  assert.equal(ps.buy(0).ok,true);const copy=ps.allChess().find(p=>p.noPoolTopUp);assert.equal(copy.poolCopies,0);
  assert.equal(h.m.pool.entries.get(id).left,0);assert.equal(ps.sell(copy.uid).ok,true);assert.equal(h.m.pool.entries.get(id).left,0);
  const index=ps.shop.slots.findIndex(s=>s?.kind==='chess'&&!s.heroGenerated&&!s.sold);assert.ok(index>=0);
  const base=ps.gd.baseIdOf(ps.shop.slots[index].id),before=h.m.pool.entries.get(base).left;
  assert.equal(ps.buy(index).ok,true);assert.equal(h.m.pool.entries.get(base).left,before-1);done(h);
});

test('a generated copy merging with two ordinary copies keeps only those two real stock claims',()=>{
  const {h,ps,id}=setup();deploy(h,ps,id);give(h.m,ps,id);
  const before=h.m.pool.entries.get(id).left;assert.equal(helpfulRefresh(ps,'mirror'),'mirror');assert.equal(ps.buy(0).ok,true);
  const elite=ps.allChess().find(p=>p.id===ps.gd.goldenIdOf(id));assert.equal(elite.poolCopies,2);assert.equal(elite.noPoolTopUp,true);
  assert.equal(h.m.pool.entries.get(id).left,before);assert.equal(ps.sell(elite.uid).ok,true);
  assert.equal(h.m.pool.entries.get(id).left,before+2);done(h);
});

test('Wisdom triple completion generates its two missing copies even when the shared identity is sold out',()=>{
  const {h,ps,id}=setup();deploy(h,ps,id);const other=h.ps('p_1');
  for(let n=h.m.pool.left(id);n>0;n--)other.acquireChess(id,{silent:true});
  assert.equal(helpfulRefresh(ps,'triple'),'triple');
  for(const index of [0,1]){
    assert.equal(ps.shop.slots[index].id,id);assert.equal(ps.shop.slots[index].heroGenerated,true);
    assert.equal(ps.buy(index).ok,true);assert.equal(h.m.pool.entries.get(id).left,0);
  }
  const elite=ps.allChess().find(p=>ps.gd.isGolden(p.id));assert.equal(elite.poolCopies,1);assert.equal(elite.noPoolTopUp,true);
  assert.equal(ps.sell(elite.uid).ok,true);assert.equal(h.m.pool.entries.get(id).left,1,'only the original owned copy returns');done(h);
});

test('generated copies stay at zero stock through both promotion and a three-copy merge',()=>{
  const {h,ps,id}=setup();deploy(h,ps,ps.gd.goldenIdOf(id));const before=h.m.pool.entries.get(id).left;
  assert.equal(helpfulRefresh(ps,'mirror'),'mirror');assert.equal(ps.buy(0).ok,true);
  const copy=ps.allChess().find(p=>p.noPoolTopUp);assert.equal(ps.promote(copy),true);assert.equal(copy.poolCopies,0);
  assert.equal(ps.sell(copy.uid).ok,true);assert.equal(h.m.pool.entries.get(id).left,before);
  for(let n=0;n<3;n++){assert.equal(helpfulRefresh(ps,'mirror'),'mirror');assert.equal(ps.buy(0).ok,true);}
  const elite=ps.allChess().find(p=>p.noPoolTopUp);assert.equal(ps.gd.isGolden(elite.id),true);assert.equal(elite.poolCopies,0);
  assert.equal(h.m.pool.entries.get(id).left,before);assert.equal(ps.sell(elite.uid).ok,true);assert.equal(h.m.pool.entries.get(id).left,before);done(h);
});
