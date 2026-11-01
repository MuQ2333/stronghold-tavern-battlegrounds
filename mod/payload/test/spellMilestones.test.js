import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './match/harness.js';

for (const growthMode of [false,true]) test(`Perfect Form pays active Foresight milestones immediately, exactly once (growth=${growthMode})`, () => {
  const h=makeMatch({mode:'solo',fake:true,spellShop:true,growthMode,seed:31}).start();
  try {
    h.toPrep(6);const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
    const recs=ps.gd.visibleChess.map(id=>ps.gd.chess(id)).filter(c=>c.bonds.includes('visiShip'));
    const need=ps.gd.bond('visiShip').thresholds[0];
    for(let i=0;i<need;i++)ps.board.set(`10,${3+i}`,ps.newPiece('chess',recs[i].chessId));
    ps.layers.visiShip=0;ps.recompute();assert.equal(ps.bonds.visiShip.active,true);
    const target=[...ps.board.values()][0], before=ps.funds;
    const p=ps.gd.bond('visiShip').buffs.find(b=>b.key==='bond_layer_gain_coin').bb;
    const reward=Math.floor(30/p.layer)*p.count;
    assert.ok(reward>0);
    const cast=()=>{const item=ps.acquireItem('hs_bg28_838',{source:'test'});assert.equal(ps.castSpell(item.uid,target.uid).ok,true);};
    ps.growthState={spellBonus:10};
    cast();assert.equal(ps.layers.visiShip,30);assert.equal(ps.funds,before+reward);
    cast();assert.equal(ps.layers.visiShip,30);assert.equal(ps.funds,before+reward);
    ps.addLayers('visiShip',40,{reason:'test'});const at70=ps.funds;assert.equal(ps.layers.visiShip,70);
    cast();assert.equal(ps.layers.visiShip,30);assert.equal(ps.funds,at70,'lowering layers does not refund or repay');
    ps.addLayers('visiShip',40,{reason:'test'});assert.equal(ps.funds,at70,'already-paid milestones do not pay again');
    assert.equal(h.m.errorCount,0);
  } finally {h.m.dispose();}
});

test('Perfect Form keeps inactive Foresight rewards owed until the alliance activates', () => {
  const h=makeMatch({mode:'solo',fake:true,spellShop:true,growthMode:true,seed:31}).start();
  try {
    h.toPrep(6);const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
    const id=ps.gd.visibleChess.find(id=>ps.gd.chess(id).bonds.includes('visiShip'));
    const target=ps.acquireChess(id,{silent:true});ps._detach(ps.find(target.uid));ps.temp[0]=target;
    ps.hand=ps.hand.map(()=>ps.newPiece('item','hs_bg28_838'));
    ps.layers.visiShip=0;ps.recompute();assert.equal(!!ps.bonds.visiShip?.active,false);
    const before=ps.funds,item=ps.acquireItem('hs_bg28_838',{source:'test'});
    assert.equal(ps.castSpell(item.uid,target.uid).ok,true);assert.equal(ps.layers.visiShip,30);assert.equal(ps.funds,before);
    ps._detach(ps.find(target.uid));ps.board.set('10,3',target);ps.recompute();
    const p=ps.gd.bond('visiShip').buffs.find(b=>b.key==='bond_layer_gain_coin').bb;
    assert.equal(ps.funds,before+Math.floor(30/p.layer)*p.count);
  } finally {h.m.dispose();}
});
