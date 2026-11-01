import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch,legalTileFor} from './match/harness.js';
import {planUnite} from '../server/match/unite.js';
import {GROWTH_ROSTER} from '../shared/growthMode.js';
import {growthTraitView} from '../server/match/growthTraits.js';

const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;
const blank=()=>({leaked:[],perfect:true,coins:0,layerGains:{},killed:0,total:0,damageDealt:0,unitsEnd:[]});

for(const growthMode of [false,true])test(`normal to unite ${growthMode?'growth':'native'} carries prior layers once and settles only new permanent gains`,t=>{
 const h=makeMatch({mode:'coop',humans:2,difficulty:'HARD',growthMode});t.after(()=>h.m.dispose());h.start();h.toPrep();
 const m=h.m,ps=h.ps('p_0');ps.bandId=null;ps.layers={sargonShip:100};ps.bondCountBonus={sargonShip:20};ps.recompute();
 const own={...blank(),layerGains:{sargonShip:10}};
 const leak={...blank(),perfect:false,leaked:[{enemyKey:'enemy_1007_slime',counted:true,lpr:1}]};
 m.lastResults=new Map([['p_0',own],['p_1',leak]]);ps.pendingLayerGains={sargonShip:10};
 const plan=planUnite(m,m.lastResults);assert.ok(plan);const opts=m._uniteOpts(plan,30);
 assert.equal(opts.flags.layerGainsEnabled,growthMode);
 const b=m.newBattle(opts);b.start();assert.equal(b.getPlayer(ps.playerId).bonds.sargonShip.layers,110);
 assert.equal(b.addLayers(ps.playerId,'sargonShip',7,'audit'),growthMode?7:0);
 b.addLayers(ps.playerId,'sargonShip',100,'temporary',{temporary:true});
 b.forceEnd('timeout');const result=b.result();assert.equal(result.errors,0);
 assert.equal(result.perPlayer[ps.playerId].layerGains.sargonShip,growthMode?7:undefined);
 m.settle(plan,result);assert.equal(ps.layers.sargonShip,growthMode?117:110);
 m.afterSettle();assert.equal(ps.layers.sargonShip,growthMode?117:110,'round transition does not settle the same delta again');
 assert.deepEqual(h.logs.error,[]);
});

for(const growthMode of [false,true])test(`final and hidden ${growthMode?'growth':'native'} fields retain new layers without retaining temporary stacks`,t=>{
 const h=makeMatch({mode:'solo',difficulty:'HARD',growthMode});t.after(()=>h.m.dispose());h.start();h.toPrep();
 const m=h.m,ps=h.ps('p_0');ps.bandId=null;ps.layers={sargonShip:100};ps.bondCountBonus={sargonShip:20};ps.recompute();
 for(const hidden of [false,true]) {
  m.round=hidden?15:14;m.bossId='boss_1';m.hiddenBossId='boss_10';m.teamLp=40;m._planBossWaves();m.startFinalAssault(hidden);
  const b=m.fields[0].battle;b.start();assert.equal(b.flags.layerGainsEnabled,growthMode);
  assert.equal(b.addLayers(ps.playerId,'sargonShip',9,'audit'),growthMode?9:0);
  b.addLayers(ps.playerId,'sargonShip',200,'temporary',{temporary:true});
  const runner=m.runner;m.bossPool.hp=0;runner.forceAll('forced');
  assert.equal(ps.layers.sargonShip,growthMode?(hidden?118:109):100);
 }
 assert.deepEqual(h.logs.error,[]);
});

test('promoting Reed and Lappland keeps maximum unpaid progress, not total past spending or refreshes',t=>{
 const h=makeMatch({mode:'solo',growthMode:true,fake:true});t.after(()=>h.m.dispose());h.start();h.toPrep();
 const ps=h.ps('p_0');ps.bandId=null;ps.hand.fill(null);ps.temp.fill(null);ps.board.clear();
 for(const [name,key,counts,want] of [['焰影苇草','growthSpent',[2,5,8],8],['荒芜拉普兰德','growthRefreshes',[9,10,8],2]]) {
  ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
  counts.forEach((n,i)=>{const p=ps.newPiece('chess',id(name));p.meta[key]=n;ps.board.set(`9,${i+3}`,p);});
  const elite=ps._mergeChess(id(name),null);assert.ok(elite);assert.equal(elite.meta[key],want);
  const tile=legalTileFor(h.m,ps,elite.id);assert.ok(tile);
  assert.deepEqual(h.m.handle(ps.playerId,{t:'g.move',uid:elite.uid,to:{area:'board',row:tile[0],col:tile[1]}}),{ok:true});
  const view=growthTraitView(ps,elite);assert.equal(key==='growthSpent'?view.spent:view.refreshProgress,want);
  if(key==='growthSpent') {
   const items=()=>[...ps.hand,...ps.temp].filter(p=>p?.kind==='item').length;
   const before=items();ps.recompute();h.m.dispatch(ps,'onSpend',{amount:1});
   assert.equal(items(),before+1);assert.equal(elite.meta.growthSpent,0);
   assert.ok([...ps.hand,...ps.temp].some(p=>p?.kind==='item'&&ps.gd.item(p.id).isGolden));
  }else {h.m.dispatch(ps,'onRefresh',{price:1,free:false});assert.equal(elite.meta.growthRefreshes%3,0);}
 }
 assert.deepEqual(h.logs.error,[]);
});
