import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch} from './match/harness.js';
import {settleGrowthLayers} from '../server/match/growthLayerSettlement.js';

function setup(t,growthMode=true) {
  const h=makeMatch({mode:'coop',humans:2,growthMode,fake:true,seed:31}).start();
  t.after(()=>h.m.dispose());h.toPrep();
  for(const ps of h.m.order) {
    ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
    ps.layers={};ps.counters={};ps.funds=0;ps.pendingFunds=0;
    ps.bondCountBonus={visiShip:20,miraShip:20};ps.recompute();
  }
  return {h,m:h.m,ps:h.ps('p_0'),mate:h.ps('p_1')};
}
const gold=ps=>ps.funds+ps.pendingFunds;

test('growth fund caps count each threshold, cap large jumps, and preserve discounts and free refreshes',t=>{
  const {m,ps}=setup(t);
  ps.addLayers('visiShip',49);assert.equal(gold(ps),8);
  ps.addLayers('visiShip',1);assert.equal(gold(ps),10);
  ps.addLayers('visiShip',150);assert.equal(gold(ps),10);
  assert.equal(ps.counters['bondaddon:visi:disc'],1,'growth retains only the Foresight-member discount');
  ps.addLayers('miraShip',99);assert.equal(gold(ps),10);
  ps.addLayers('miraShip',1);assert.equal(gold(ps),20);
  ps.addLayers('miraShip',900);assert.equal(gold(ps),20);
  ps.shop.freeRefreshes=0;m.rngMeta=()=>0.4;m.dispatch(ps,'onRefresh',{});
  assert.equal(ps.shop.freeRefreshes,1,'free refresh is independent of the funds quota');
  assert.equal(m.errorCount,0);
});

test('prep, normal, unite and leader gains share quotas; the next round only pays newly earned milestones',t=>{
  const {m,ps}=setup(t);
  ps.addLayers('visiShip',30);ps.addLayers('miraShip',100);assert.equal(gold(ps),16);
  m.dispatch(ps,'onPrepEnd',{});ps.addLayers('visiShip',10);
  assert.equal(ps.funds,16);assert.equal(ps.pendingFunds,2,'prep-end rewards retain their existing delayed payment');
  for(const phase of ['COMBAT','UNITE','FINAL_ASSAULT','HIDDEN_CORE']) {
    m.phase=phase;settleGrowthLayers(m,ps,{layerGains:{visiShip:100,miraShip:100}});
    assert.equal(gold(ps),20);
  }
  m.phase='PREP';m.round++;
  m.dispatch(ps,'onRoundStart',{});m.dispatch(ps,'onPrepStart',{});
  assert.equal(gold(ps),20,'capped milestones are not banked for the next round');
  ps.addLayers('visiShip',10);ps.addLayers('miraShip',100);assert.equal(gold(ps),32);
  assert.deepEqual(m.errorCount,0);
});

test('deactivation and repeated hooks cannot reset funds quotas; player and alliance quotas are independent',t=>{
  const {m,ps,mate}=setup(t);ps.addLayers('visiShip',50);
  ps.bondCountBonus={};ps.recompute();ps.addLayers('visiShip',100);
  ps.bondCountBonus={visiShip:20,miraShip:20};ps.recompute();
  for(const hook of ['onActiveBonds','onRoundStart','onPrepStart','onBuy','onGain','onSold','onMerge'])m.dispatch(ps,hook,{});
  assert.equal(gold(ps),10);
  ps.addLayers('miraShip',100);mate.addLayers('visiShip',100);mate.addLayers('miraShip',200);
  assert.equal(gold(ps),20);assert.equal(gold(mate),20);
});

test('inactive layer catch-up is subject to the current round quota and cannot repay after lowering layers',t=>{
  const {m,ps}=setup(t);ps.bondCountBonus={};ps.recompute();
  ps.addLayers('visiShip',100);ps.addLayers('miraShip',300);assert.equal(gold(ps),0);
  ps.bondCountBonus={visiShip:20,miraShip:20};ps.recompute();assert.equal(gold(ps),20);
  m.round++;ps.layers={visiShip:0,miraShip:0};ps.recompute();
  ps.addLayers('visiShip',100);ps.addLayers('miraShip',300);assert.equal(gold(ps),20);
  ps.addLayers('visiShip',10);ps.addLayers('miraShip',100);assert.equal(gold(ps),32);
});

test('native milestone rewards retain unlimited catch-up within their original layer cap',t=>{
  const {ps}=setup(t,false);ps.addLayers('visiShip',200);ps.addLayers('miraShip',300);
  assert.equal(gold(ps),40+60);
});

for(const growthMode of [false,true])test(`Foresight 150-layer global discount is removed only in growth mode (growth=${growthMode})`,t=>{
  const {ps}=setup(t,growthMode);
  const own=ps.gd.visibleChess.find(id=>ps.gd.chess(id).bonds.includes('visiShip'));
  const other=ps.gd.visibleChess.find(id=>!ps.gd.chess(id).bonds.includes('visiShip')&&ps.gd.chess(id).name==='隐现');
  const a={kind:'chess',id:own,basePrice:5},b={kind:'chess',id:other,basePrice:5};
  const baseline=[ps.priceOf(a),ps.priceOf(b)];
  ps.addLayers('visiShip',79);assert.deepEqual([ps.priceOf(a),ps.priceOf(b)],baseline);
  ps.addLayers('visiShip',1);assert.deepEqual([ps.priceOf(a),ps.priceOf(b)],[baseline[0]-1,baseline[1]]);
  ps.addLayers('visiShip',70);assert.deepEqual([ps.priceOf(a),ps.priceOf(b)],[baseline[0]-1,baseline[1]-(growthMode?0:1)]);
  if(growthMode) {
    ps.addLayers('visiShip',10000);ps.counters['bondaddon:visi:disc']=2;
    assert.deepEqual([ps.priceOf(a),ps.priceOf(b)],[baseline[0]-1,baseline[1]],'stale global-discount counters cannot restore the removed effect');
  }
});
