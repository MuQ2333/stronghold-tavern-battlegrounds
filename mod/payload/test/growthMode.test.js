import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch, DATA} from './match/harness.js';
import {growthData, GROWTH_ROSTER} from '../shared/growthMode.js';
import {createDataStore} from '../public/js/data.js';
import {DataSource} from '../server/sim/simdata.js';
import {buildBattleSpec,createBattleFromSpec,resultDigest,compactResult} from '../server/sim/spec.js';
import {makeBattle} from './helpers/battleHarness.js';
import {validateClientResult} from '../server/match/fields.js';
import {unitStatsEntry} from '../shared/protocol.js';

const row = name => GROWTH_ROSTER.find(r=>r.name===name);
const id = (name,elite=false) => row(name).id.replace(/_a$/,elite?'_b':'_a');
function setup() {
  // Isolate card rewards from the new one-member Deputy prep-end aura.
  const data={...DATA,config:{...DATA.config,modes:Object.fromEntries(Object.entries(DATA.config.modes).map(([id,m])=>[id,{...m,inactiveBondIds:['deputShip']}]))}};
  const h=makeMatch({data,growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true,seed:52});
  h.start();h.toPrep(1);
  const ps=h.ps('p_0');
  ps.board.clear();ps.hand.fill(null);ps.temp.length=0;ps.temp.length=5;
  ps.bandId=null;ps.layers={};ps.pendingFunds=0;ps.funds=100;ps.bondCountBonus={};ps.recompute();
  const put=(name,elite=false,r=9,c=3)=>{
    const p=ps.newPiece('chess',id(name,elite));
    ps.board.set(`${r},${c}`,p);ps.recompute();return p;
  };
  const activate=(...ids)=>{for(const id of ids)ps.bondCountBonus[id]=20;ps.recompute();};
  const L=b=>ps.layers[b]||0;
  const end=()=>h.m.dispatch(ps,'onPrepEnd',{round:h.m.round});
  const start=()=>h.m.dispatch(ps,'onRoundStart',{round:h.m.round});
  const done=()=>{assert.deepEqual(h.logs.error,[]);h.m.dispose();};
  return {h,ps,put,activate,L,end,start,done};
}

test('growth is opt-in, immutable, tier changes preserve identity and unchanged traits stay native',()=>{
  assert.equal(growthData(DATA),DATA);
  const changed=growthData(DATA,true);
  assert.equal(growthData(DATA,true),changed);
  assert.equal(growthData(changed,true),changed);
  assert.equal(DATA.chess[id('风笛')].tier,4);
  assert.equal(changed.chess[id('风笛')].tier,3);
  assert.equal(changed.chess[id('风笛',true)].tier,3);
  assert.equal(changed.chess[id('铃兰')].price,3,'tier-five to tier-four also updates the ordinary purchase price');
  assert.deepEqual(changed.chess[id('雷蛇')].garrisonIds,DATA.chess[id('雷蛇')].garrisonIds);
  assert.equal(changed.chess[id('山')].bonds.includes('investShip'),false);
  assert.doesNotMatch(changed.bonds.indomShip.desc,/地面干员|近战干员/);
  assert.match(DATA.bonds.indomShip.desc,/地面干员/);
  for(const id of Object.keys(DATA.chess))assert.ok(changed.chess[id],'every existing operator is retained');
  assert.equal(Object.keys(changed.chess).length,Object.keys(DATA.chess).length+16,'seven real Kazdel pairs and Blue Poison are added');
  const h=makeMatch({fake:true});assert.equal(h.m.growthMode,false);assert.equal(h.m.data.growthPreview,undefined);h.m.dispose();
});

test('UI get/list/lookup agree and turning growth off restores the exact original records',async()=>{
  const d=createDataStore({fetch:async url=>({ok:true,json:async()=>DATA[String(url).split('/').at(-1).replace('.json','')]})});
  await d.loadAll('chess','garrisons','config');
  const original=d.lookup('chess',id('夕'));
  d.setGrowthMode(true);
  const current=d.lookup('chess',id('夕'));
  assert.ok(current.growthTrait);
  assert.equal(d.get('chess')[id('夕')],current);
  assert.equal(d.list('chess').find(c=>c.chessId===id('夕')),current);
  assert.match(d.lookup('garrisons',current.garrisonIds[0]).desc,/休整期/);
  assert.equal(d.getRaw('chess'),DATA.chess);
  d.setGrowthMode(false);assert.equal(d.lookup('chess',id('夕')),original);
});

for(const elite of [false,true]) test(`prep layer and income traits use ${elite?'elite':'normal'} values`,()=>{
  const mult=elite?2:1;
  for(const [name,run,expected] of [
    ['灰毫','gain',{yanShip:4*mult}],
    ['小满','end',{yanShip:21*mult}],['莱恩哈特','end',{swiftShip:8*mult,preciShip:8*mult}],
    ['蒂比','start',{swiftShip:3*mult,skillfulShip:3*mult}],
  ]){
    const s=setup();s.activate('yanShip','swiftShip','preciShip','skillfulShip');s.ps.round.gainedChess=7;
    if(run==='gain')s.ps.acquireChess(id(name,elite));else{s.put(name,elite);s[run]();}
    for(const [b,n] of Object.entries(expected))assert.equal(b==='pending'?s.ps.pendingFunds:s.L(b),n,name+':'+b);
    s.done();
  }
  const s=setup(),p=s.put('泥岩',elite);assert.equal(s.ps.sell(p.uid).ok,true);assert.equal(s.ps.pendingFunds,4*mult);s.done();
});

test('Aruma has no old six-layer cap and counts actual paid/free refreshes',()=>{
  const s=setup();s.put('阿罗玛');s.activate('siracusaShip','arcaneShip');
  s.ps.shop.freeRefreshes=3;
  for(let i=0;i<8;i++)assert.equal(s.ps.refresh().ok,true);
  s.end();assert.equal(s.L('siracusaShip'),16);assert.equal(s.L('arcaneShip'),16);s.done();
});

test('Dusk uses all genuine gains and one initial-value increment per four qualifying gains',()=>{
  for(const elite of [false,true]){
    const s=setup();s.put('夕',elite);s.activate('yanShip','arcaneShip');
    s.ps.round.gainedChess=0;s.ps.round.growthDusk=0;
    for(let i=0;i<4;i++)s.ps.acquireChess(id('惊蛰'));
    for(let i=0;i<4;i++)s.ps.acquireChess(id('深巡'));
    assert.equal(s.ps.round.gainedChess,8);assert.equal(s.ps.round.growthDusk,4);
    s.end();assert.equal(s.L('yanShip'),elite?64:32);assert.equal(s.L('arcaneShip'),elite?64:32);
    const before=s.ps.round.gainedChess;
    s.h.m.dispatcher.triggerGarrisons(s.ps,[...s.ps.board.values()][0],'SERVER_PREP_FIN');
    assert.equal(s.ps.round.gainedChess,before,'replaying a trait is not acquiring another card');s.done();
  }
});

test('position and board rewards count shared bonds once per recipient',()=>{
  const s=setup();s.put('断崖',false,9,4);s.put('小满',false,9,3);s.activate('yanShip','skillfulShip');s.ps.round.gainedChess=0;
  s.end();assert.equal(s.L('skillfulShip'),8);assert.equal(s.L('yanShip'),4);s.done();
  const t=setup();t.put('引星棘刺');t.put('小满',false,9,4);t.activate('swiftShip','miraShip','yanShip','skillfulShip');t.ps.round.gainedChess=0;
  t.end();for(const b of ['swiftShip','miraShip','yanShip','skillfulShip'])assert.equal(t.L(b),4,b);t.done();
});

test('Lumen and Nymph honor bench membership and explicit activation wording',()=>{
  for(const elite of [false,true]){
    const s=setup();s.ps.gd.modeInactiveBonds.add('preciShip');s.put('流明',elite);s.ps.hand[0]=s.ps.newPiece('chess',id('深靛'));s.activate('arcaneShip');
    s.end();assert.equal(s.L('arcaneShip'),elite?8:4);assert.equal(s.L('preciShip'),elite?0:4);s.done();
  }
  const s=setup();s.put('妮芙');s.ps.hand[0]=s.ps.newPiece('chess',id('深靛'));s.ps.hand[1]=s.ps.newPiece('chess',id('跃跃'));
  s.activate('swiftShip','arcaneShip');s.end();assert.equal(s.L('swiftShip'),6);assert.equal(s.L('arcaneShip'),6);s.done();
});

test('same-name repeaters use the highest board form and selling them stops the aura',()=>{
  const s=setup();const a=s.put('山',false,9,3),b=s.put('山',false,9,4),c=s.put('山',true,9,5);
  const refresh=s.ps.shop.freeRefreshes;s.ps.acquireChess(id('普罗旺斯'));assert.equal(s.ps.shop.freeRefreshes-refresh,3,'highest elite is three, not 2*2*3');
  for(const p of [a,b,c])assert.equal(s.ps.sell(p.uid).ok,true);
  s.ps.acquireChess(id('普罗旺斯'));assert.equal(s.ps.shop.freeRefreshes-refresh,4);s.done();
  for(const [name,phase] of [['白面鸮','start'],['塞雷娅','end']]){
    const t=setup();t.put(name,false,9,3);t.put(name,true,9,4);t.put(phase==='start'?'蒂比':'莱恩哈特',false,9,5);
    t.activate('swiftShip','skillfulShip','preciShip');t[phase]();assert.equal(t.L('swiftShip'),phase==='start'?9:24,name);t.done();
  }
});

test('Siracusa grants persist after sale, do not retroactively reward the granting purchase and scale future grants',()=>{
  const s=setup();
  s.ps.shop.slots=[{kind:'chess',id:id('忍冬'),basePrice:3,sold:false}];
  assert.equal(s.ps.buy(0).ok,true);assert.equal(s.L('siracusaShip'),0);
  const giver=s.ps.allChess().find(p=>p.id===id('忍冬'));assert.equal(s.ps.sell(giver.uid).ok,true);
  s.ps.shop.slots=[{kind:'chess',id:id('拉普兰德'),basePrice:3,sold:false}];
  assert.equal(s.ps.buy(0).ok,true);assert.equal(s.L('siracusaShip'),3);
  s.ps.shop.slots=[{kind:'chess',id:id('拉普兰德'),basePrice:3,sold:false}];
  assert.deepEqual(s.ps.privateView().shop.slots[0].growthPurchaseRewards,[{bondId:'siracusaShip',layers:3}]);
  s.put('铃兰');s.end();s.ps.acquireChess(id('忍冬'));
  assert.deepEqual(s.ps.privateView().shop.slots[0].growthPurchaseRewards,[{bondId:'siracusaShip',layers:7}],'Suzuran improves future grants, not past purchase rewards');
  s.done();
});

test('Angelina grants on each refresh; Lappland echoes the highest available purchase reward every third refresh',()=>{
  const s=setup();s.put('安洁莉娜');s.put('荒芜拉普兰德',false,9,4);
  s.ps.rollShop=()=>{s.ps.shop.slots=[{kind:'chess',id:id('拉普兰德'),basePrice:3,sold:false}];};
  for(let i=0;i<3;i++)assert.equal(s.ps.refresh().ok,true);
  assert.equal(s.ps.privateView().shop.slots[0].growthPurchaseRewards[0].layers,12);assert.equal(s.L('siracusaShip'),12);
  assert.equal(s.ps.round.gainedChess,0,'an echoed purchase reward does not buy/gain the shop card');
  assert.equal(s.ps.shop.slots[0].sold,false);s.done();
});

test('Hoshiguma chooses rightmost then lowest, not native topmost priority',()=>{
  const s=setup();s.put('小满',false,10,5);s.put('阿罗玛',false,9,5);s.activate('yanShip','siracusaShip','arcaneShip');
  s.ps.round.gainedChess=7;s.ps.round.refreshes=2;s.ps.acquireChess(id('星熊'));
  assert.equal(s.L('siracusaShip'),4);assert.equal(s.L('yanShip'),0);s.done();
});

test('equipment givers retain ownership and Harlod elite gives one on even rounds',()=>{
  for(const elite of [false,true])for(const round of [3,4]){
    const s=setup();s.put('哈洛德',elite);s.h.m.round=round;
    const calls=[],acquire=s.ps.acquireItem.bind(s.ps);s.ps.acquireItem=(...a)=>{calls.push(a[0]);return acquire(...a);};
    s.end();assert.equal(calls.length,elite || round===3?1:0);s.done();
  }
  const s=setup();s.put('凯瑟琳',true);const calls=[],acquire=s.ps.acquireItem.bind(s.ps);s.ps.acquireItem=(...a)=>{calls.push(a[0]);return acquire(...a);};
  s.end();assert.equal(calls.length,2);s.done();
});

test('growth battle data suppresses replaced native traits on both server and client without changing the base',()=>{
  const units=[{chessId:id('哈洛德'),row:9,col:3,uid:8}];
  const spec=buildBattleSpec({flags:{growthMode:true},players:[{playerId:'p',units}],timeLimit:1});
  const a=createBattleFromSpec(spec,new DataSource(growthData(DATA,true)));
  const b=createBattleFromSpec(spec,new DataSource(DATA));
  assert.deepEqual(a.allyUnits[0].def.raw.garrisonIds,b.allyUnits[0].def.raw.garrisonIds);
  assert.notDeepEqual(a.allyUnits[0].def.raw.garrisonIds,DATA.chess[id('哈洛德')].garrisonIds);
  a.step();b.step();a.forceEnd();b.forceEnd();assert.equal(resultDigest(a.result()).hash,resultDigest(b.result()).hash);
});

test('Bagpipe earns one persistent normal/elite equipment, does not reset on redeploy and client reports cannot grant it',()=>{
  for(const elite of [false,true]){
    const s=setup();
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id('风笛',elite),row:9,col:4}],autoFinish:false});
    h.step();const u=h.b.allyUnits[0];
    h.b.emit('kill',{killer:u,victim:{side:'enemy'}});u.deploySeq++;
    h.b.emit('kill',{killer:u,victim:{side:'enemy'}});h.b.forceEnd();
    const result=h.b.result().perPlayer[u.ownerId];assert.deepEqual(result.growthEquipment,[elite]);
    assert.deepEqual(compactResult(h.b.result()).perPlayer[u.ownerId].growthEquipment,[elite]);
    s.h.m.dispatch(s.ps,'onBattleResult',{result});
    const items=[...s.ps.hand,...s.ps.temp].filter(p=>p?.kind==='item');
    assert.equal(items.length,1);assert.equal(s.ps.gd.item(items[0].id).isGolden,elite);
    s.done();
  }
  assert.equal(validateClientResult({flags:{growthMode:true}},{perPlayer:{}}).reason,'growth rewards require server authority');
});

test('Bagpipe equipment from the owner normal and unite battles both settles, without taking teammate rewards',()=>{
  const s=setup(),results=[];
  for(const [kind,elite] of [['normal',false],['unite',true]]) {
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),kind,flags:{growthMode:true,layerGainsEnabled:kind==='normal'},
      players:[{playerId:s.ps.playerId,units:[{chessId:id('风笛',elite),row:9,col:4}]}],autoFinish:false});
    h.step();const u=h.b.allyUnits[0];h.b.emit('kill',{killer:u,victim:{side:'enemy'}});
    u.deploySeq++;h.b.emit('kill',{killer:u,victim:{side:'enemy'}});h.b.forceEnd();
    const result=h.b.result().perPlayer[s.ps.playerId];assert.deepEqual(result.growthEquipment,[elite]);results.push(result);
  }
  s.h.m.lastResults=new Map([[s.ps.playerId,results[0]]]);
  s.h.m.settle(null,{perPlayer:{[s.ps.playerId]:results[1],other:{growthEquipment:[true,true,true]}}});
  const items=[...s.ps.hand,...s.ps.temp].filter(p=>p?.kind==='item');
  assert.equal(items.length,2);assert.equal(items.filter(p=>s.ps.gd.item(p.id).isGolden).length,1);
  const before=items.map(p=>p.uid);s.h.m.afterSettle();
  assert.deepEqual([...s.ps.hand,...s.ps.temp].filter(p=>p?.kind==='item').map(p=>p.uid),before,'round transition does not grant rewards again');s.done();
});

test('Skadi earns 1/2 refreshes per actual knock-out across battle kinds, never on retreat',()=>{
  for(const elite of [false,true]) for(const kind of ['normal','unite','boss','hidden']) {
    const h=makeBattle({kind,data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id('斯卡蒂',elite),row:9,col:4}],autoFinish:false});
    h.step();const u=h.b.allyUnits[0],amount=elite?2:1;
    const row=h.b.data.raw.garrisons?.[u.def.raw.garrisonIds[0]] || growthData(DATA,true).garrisons[u.def.raw.garrisonIds[0]];
    assert.match(row.desc,new RegExp(`获得${amount}次免费的刷新`));
    h.b.retreat(u);assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,undefined);
    assert.equal(h.b.redeploy(u),true);
    h.b.kill(u);h.b.kill(u);
    assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,amount,'an already down unit cannot be knocked out again');
    assert.equal(h.b.redeploy(u),true);h.b.kill(u);h.b.forceEnd();
    const res=h.b.result();assert.equal(res.perPlayer[u.ownerId].growthFreeRefreshes,2*amount);
    assert.deepEqual(res.perPlayer[u.ownerId].layerGains,{},'the replaced native layer trait does not run');
    const compact=compactResult(res);assert.equal(compact.perPlayer[u.ownerId].growthFreeRefreshes,2*amount);
    const before=resultDigest(compact).hash;compact.perPlayer[u.ownerId].growthFreeRefreshes++;
    assert.notEqual(resultDigest(compact).hash,before,'earned refreshes participate in the deterministic digest');
    assert.equal(res.errors,0);
  }
  const native=makeBattle({data:new DataSource(DATA),units:[{chessId:id('斯卡蒂'),row:9,col:4}],autoFinish:false});
  native.step();const u=native.b.allyUnits[0];native.b.kill(u);native.b.forceEnd();
  assert.equal(native.b.result().perPlayer[u.ownerId].growthFreeRefreshes,undefined);
});

test('Skadi refreshes settle for their owner across normal/unite and persist until spent in later rounds',()=>{
  const s=setup();s.ps.shop.freeRefreshes=1;
  s.h.m.lastResults=new Map([['p_0',{leaked:[],perfect:true,coins:0,layerGains:{},killed:0,damageDealt:0,growthFreeRefreshes:2}]]);
  s.h.m.settle(null,{perPlayer:{p_0:{growthFreeRefreshes:3},other:{growthFreeRefreshes:99}}});
  assert.equal(s.ps.shop.freeRefreshes,6);
  s.h.m.startRound(2);s.h.toPrep(2);assert.equal(s.ps.shop.freeRefreshes,6);
  const funds=s.ps.funds;assert.equal(s.ps.refresh().ok,true);
  assert.equal(s.ps.funds,funds);assert.equal(s.ps.shop.freeRefreshes,5);
  s.h.m.startRound(3);s.h.toPrep(3);assert.equal(s.ps.shop.freeRefreshes,5,'unused free refreshes survive another round');s.done();
});

test('Kjerag freeze gains are deterministic, global/local ranges differ, refreshes do not count again',()=>{
  for(const [name,expected] of [['初雪',2],['银灰',4]]) {
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id(name,true),row:9,col:4}],autoFinish:false});
    h.step();const u=h.b.allyUnits[0],p=h.b.getPlayer(u.ownerId);p.bonds.kjeragShip={active:true,layers:0};
    const near=h.spawn('enemy_1001_1',{pos:[9,5]}),far=h.spawn('enemy_1001_1',{pos:[12,18]});
    h.b.applyStatus(near,'freeze',{duration:5});h.b.applyStatus(near,'freeze',{duration:5});
    h.b.applyStatus(far,'freeze',{duration:5});
    assert.equal(p.bonds.kjeragShip.layers,expected,name);h.b.forceEnd();
    assert.equal(h.b.result().perPlayer[u.ownerId].layerGains.kjeragShip,expected,'earned permanent layer result');
    assert.equal(h.b.result().errors,0);
  }
});

test('Saint Pramanix emits separate gains for frozen targets and repeats them in elite form',()=>{
  for(const elite of [false,true]){
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id('圣聆初雪',elite),row:9,col:4}],autoFinish:false});
    h.step();const u=h.b.allyUnits[0],p=h.b.getPlayer(u.ownerId);p.bonds.kjeragShip={active:true,layers:0};
    const enemy=h.spawn('enemy_1001_1',{pos:[9,5]});h.b.applyStatus(enemy,'freeze',{duration:5});
    h.b.emit('damaged',{source:u,target:enemy,amount:1});
    assert.equal(p.bonds.kjeragShip.layers,elite?4:2);h.b.forceEnd();assert.equal(h.b.result().errors,0);
  }
});

test('Kjerag gains cross actual settlement and survive into the following preparation',()=>{
  const s=setup();s.activate('kjeragShip');
  s.h.m.lastResults=new Map([['p_0',{leaked:[],perfect:true,coins:0,layerGains:{kjeragShip:7},killed:0,damageDealt:0}]]);
  s.h.m.settle(null,null);assert.equal(s.L('kjeragShip'),7);
  s.h.m.startRound();assert.equal(s.L('kjeragShip'),7);s.done();
});

test('Miracle stops at fifty percent and pays ten per hundred layers only in growth mode',()=>{
  const s=setup();s.activate('miraShip');
  const before=s.ps.funds+s.ps.pendingFunds;s.ps.addLayers('miraShip',200);
  assert.equal(s.ps.funds+s.ps.pendingFunds-before,10);
  s.ps.layers.miraShip=999;s.ps.recompute();s.ps.shop.freeRefreshes=0;
  s.h.m.rngMeta=()=>0.6;s.h.m.dispatch(s.ps,'onRefresh',{free:false,price:1});
  assert.equal(s.ps.shop.freeRefreshes,0);
  s.h.m.rngMeta=()=>0.4;s.h.m.dispatch(s.ps,'onRefresh',{free:false,price:1});
  assert.equal(s.ps.shop.freeRefreshes,1);
  assert.equal(DATA.bonds.miraShip.bb.count,20);s.done();
});

test('growth thresholds update activation, upper-tier execution and descriptions without changing native data',()=>{
  const d=growthData(DATA,true);
  for(const b of Object.values(d.bonds)){
    assert.equal(b.activeCount,1);assert.equal(b.thresholds[0],1);
    if(b.thresholds.length>1)assert.equal(b.thresholds[1],b.isCore?3:2);
  }
  assert.deepEqual(d.bonds.yanShip.thresholds,[1,3,6]);
  assert.equal(d.bonds.yanShip.bb.power_bond_char_cnt,3);assert.equal(d.bonds.yanShip.buffs[0].bb.ex_bond_char_cnt,6);
  assert.match(d.bonds.yanShip.desc,/<在场3名/);assert.match(d.bonds.yanShip.desc,/<在场6名/);
  assert.match(d.bonds.egirShip.desc,/<在场3名/);assert.match(d.bonds.indomShip.desc,/<在场2名/);
  assert.deepEqual(DATA.bonds.yanShip.thresholds,[3,6,9]);assert.equal(DATA.bonds.indomShip.bb.power_bond_char_cnt,3);
  const s=setup();s.put('惊蛰');assert.equal(s.ps.bonds.yanShip.tier,1);
  s.put('小满',false,9,4);assert.equal(s.ps.bonds.yanShip.tier,1);
  s.put('夕',false,9,5);assert.equal(s.ps.bonds.yanShip.tier,2);s.done();
  for(const [count,tier,expected]of [[1,1,0],[3,2,1],[6,3,2]]){
    const h=makeBattle({data:new DataSource(d),flags:{growthMode:true},units:[{chessId:id('惊蛰'),row:9,col:4}],bonds:{yanShip:{active:true,count,tier,layers:0}},autoFinish:false});
    h.step();assert.equal(h.b.allyUnits.filter(u=>u.mem.bondYan).length,expected,`Yan threshold ${count}`);
    h.b.forceEnd();assert.equal(h.b.result().errors,0);
  }
});

test('Victoria traits count distinct current tiers and grow by initial values, excluding spells from equipment gains',()=>{
  const s=setup();const mint=s.put('薄绿');s.put('焰影苇草',false,9,4);s.put('号角',false,9,5);s.activate('victoriaShip');
  s.end();assert.equal(s.L('victoriaShip'),8,'Mint and Horn each count two tiers (4 and 5)');
  s.h.m.dispatch(s.ps,'onPrepStart',{});s.end();assert.equal(s.L('victoriaShip'),20,'Mint gains its initial two per tier, Horn stays at base');
  s.ps.acquireItem('hs_bg28_168');assert.equal(s.ps.growthState.equipmentGains || 0,0);
  s.ps.acquireItem('chess_item_6_09_e_a',{requirePool:false,silent:true});assert.equal(s.ps.growthState.equipmentGains,1,'real silent acquisitions count, triggering a trait is not another acquisition');
  s.ps.layers.victoriaShip=0;s.ps.recompute();s.end();assert.equal(s.L('victoriaShip'),16,'one real equipment doubles Horn, not Mint');
  assert.equal(mint.meta.growthPrepEntries,1);s.done();
  const v=setup();v.put('维娜·维多利亚');v.put('风笛',false,9,4);v.activate('victoriaShip','miraShip');
  v.ps.acquireItem('chess_item_6_09_e_a',{requirePool:false});v.end();
  assert.equal(v.L('victoriaShip'),12);assert.equal(v.L('miraShip'),4);v.done();
});

test('Reed counts actual paid actions in nine-fund steps, giving normal or elite equipment and no bench aura',()=>{
  for(const elite of [false,true]){
    const s=setup();const p=s.put('焰影苇草',elite);
    for(let i=0;i<8;i++)assert.equal(s.ps.refresh().ok,true);
    assert.equal(s.ps.hand.filter(x=>x?.kind==='item').length,0);
    assert.equal(s.ps.refresh().ok,true);
    const items=s.ps.hand.filter(x=>x?.kind==='item');assert.equal(items.length,1);assert.equal(s.ps.gd.item(items[0].id).isGolden,elite);
    s.ps.shop.freeRefreshes=1;s.ps.refresh();assert.equal(p.meta.growthSpent,0,'free actions add no spent gold');
    s.ps.board.clear();s.ps.hand[1]=p;s.ps.recompute();
    s.h.m.dispatch(s.ps,'onSpend',{amount:9});assert.equal(s.ps.hand.filter(x=>x?.kind==='item').length,1);s.done();
  }
});

test('Exusiai gifts real spells, her alter gifts her real identity, and Archetto casts feed Arturia only on success',()=>{
  for(const elite of [false,true]){
    const s=setup();s.ps.acquireChess(id('能天使',elite));
    assert.equal([...s.ps.hand,...s.ps.temp].filter(p=>p?.kind==='item').length,elite?2:1);s.done();
  }
  const n=setup();n.ps.acquireChess(id('新约能天使'));
  assert.ok(n.ps.allChess().some(p=>p.id===id('能天使')));assert.equal(n.ps.pendingFunds,0);n.done();
  const s=setup();s.put('空弦',true);s.put('塑心',false,9,5);s.put('惊蛰',false,9,4);s.activate('lateranoShip','yanShip');
  s.start();assert.equal(s.ps.growthState.spellsCast,2);
  const before=s.L('lateranoShip');s.end();assert.equal(s.L('lateranoShip')-before,4);
  const spell=s.ps.acquireItem('hs_bg28_168');assert.equal(s.ps.castSpell(spell.uid).ok,true);assert.equal(s.ps.growthState.spellsCast,3);
  assert.equal(s.ps.castSpell(spell.uid).ok,undefined);assert.equal(s.ps.growthState.spellsCast,3,'failed recast is not another spell');s.done();
});

test('Kjerag acquisition amplifier is permanent and combat amplifier adds without recursion or settlement doubling',()=>{
  const s=setup();s.ps.acquireChess(id('凛御银灰',true));assert.equal(s.ps.growthState.kjeragBonus,2);
  s.ps.addLayers('kjeragShip',1);assert.equal(s.L('kjeragShip'),3);
  const input=s.ps.battleInput();assert.equal(input.growthKjeragBonus,2);
  s.h.m.lastResults=new Map([['p_0',{leaked:[],perfect:true,coins:0,layerGains:{kjeragShip:5}}]]);s.h.m.settle(null,null);
  assert.equal(s.L('kjeragShip'),8,'already amplified combat gains settle once');s.done();
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id('灵知',true),row:9,col:4}],bonds:{kjeragShip:{active:true,count:1,tier:1,layers:0}},autoFinish:false});
  h.step();const u=h.b.allyUnits[0],ps=h.b.getPlayer(u.ownerId);ps.input.growthKjeragBonus=2;
  assert.equal(h.b.addLayers(u.ownerId,'kjeragShip',1,'growth',{source:u}),5);
  h.b.kill(u);assert.equal(h.b.addLayers(u.ownerId,'kjeragShip',1,'growth'),3,'down Gnosis stops the aura');
  h.b.forceEnd();assert.equal(h.b.result().errors,0);
});

test('confirmed Sargon traits use the revised amounts, activation and normal permanent settlement',()=>{
  for(const [name,bonds,expected]of [['菲莱',['sargonShip'],[16]],['至简',['sargonShip','skillfulShip'],[2,2]],['异客',['sargonShip','swiftShip','preciShip'],[2,2,2]]]){
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id(name,true),row:9,col:4}],bonds:Object.fromEntries(bonds.map(id=>[id,{active:true,count:1,tier:1,layers:0}])),autoFinish:false});
    h.step();const u=h.b.allyUnits[0];h.b.emit('skillStart',{unit:u,skill:u.skill});h.b.forceEnd();
    const r=h.b.result().perPlayer[u.ownerId];assert.deepEqual(bonds.map(id=>r.layerGains[id]),expected);
    const s=setup();s.h.m.lastResults=new Map([['p_0',{...r,leaked:[]}]]);s.h.m.settle(null,null);s.h.m.startRound(2);
    for(let i=0;i<bonds.length;i++)assert.equal(s.L(bonds[i]),expected[i]);s.done();
    assert.equal(h.b.result().errors,0);
  }
});

test('Cuora leak sale uses the total price, resets on a clean battle and exposes the authoritative price',()=>{
  for(const elite of [false,true]){
    const s=setup();const p=s.put('蛇屠箱',elite);s.h.m.dispatch(s.ps,'onBattleResult',{result:{leaked:[{counted:true}]}});
    assert.equal(s.ps.pieceView(p).sellPrice,elite?10:5);
    const before=s.ps.funds;s.ps.sell(p.uid);assert.equal(s.ps.funds-before,elite?10:5);
    const next=s.put('蛇屠箱',elite);s.h.m.dispatch(s.ps,'onBattleResult',{result:{leaked:[{counted:false}]}});
    assert.equal(s.ps.pieceView(next).sellPrice,s.ps.gd.sellPrice(next.id));s.done();
  }
});

test('Shenxun revival halves only ATK DEF HP, fires once before indom and Ulpian keeps his damage growth',()=>{
  for(const name of ['深巡','乌尔比安'])for(const elite of [false,true]){
    const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id(name,elite),row:9,col:4}],bonds:{indomShip:{active:true,count:2,tier:2,layers:999},egirShip:{active:true,count:1,tier:1,layers:20}},autoFinish:false});
    h.step();const u=h.b.allyUnits[0],before={atk:u.s.atk,def:u.s.def,hp:u.s.maxHp,aspd:u.s.aspd,res:u.s.res};
    let rolls=0;h.b.rng=()=>{rolls++;return 0;};h.b.kill(u);assert.equal(u.alive,true);assert.equal(rolls,0,'trait revival skips the lower-priority indom roll');
    const half=name==='深巡'&&!elite?0.5:1;
    assert.equal(u.s.atk,before.atk*half);assert.equal(u.s.def,before.def*half);assert.equal(u.s.maxHp,before.hp*half);
    assert.equal(u.s.aspd,before.aspd);assert.equal(u.s.res,before.res);
    if(name==='乌尔比安'){
      const dmg={type:'phys',amount:100,mul:1};h.b.emit('hit',{source:u,target:h.spawn('enemy_1001_1',{pos:[9,5]}),dmg});
      assert.equal(dmg.mul,elite?1.2:1.1,'damage passive survives revival');
    }
    h.b.kill(u);assert.equal(rolls,1,'a second knock-out uses the ordinary indom rule');h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify([...h.b._errKeys]));
  }
});

test('trait revival leaves the native Aegir revival charge available for the following knock-out',()=>{
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id('深巡',true),row:9,col:4}],bonds:{egirShip:{active:true,count:3,tier:2,layers:0}},autoFinish:false});
  h.step();const u=h.b.allyUnits[0];h.b.kill(u);assert.equal(u.alive,true,'own trait revives first');
  h.b.kill(u);assert.equal(u.alive,true,'native Aegir charge was not marked spent by the trait');
  h.b.kill(u);assert.equal(u.alive,false,'each personal and bond revival is used once for this unit');
  h.b.forceEnd();assert.equal(h.b.result().errors,0);
});

test('Gavial skill growth continues across redeployment, unite carry and permanent settlement',()=>{
  const s=setup(),p=s.put('百炼嘉维尔');p.meta.growthSkillUses=2;
  const input=s.ps.battleInput();assert.equal(input.growthCounters[p.uid].uses,2);
  const h=makeBattle({data:new DataSource(s.h.m.data),flags:{growthMode:true},players:[input],autoFinish:false});
  h.step();const u=h.b.allyUnits[0];h.b.emit('skillStart',{unit:u,skill:u.skill});
  h.b.retreat(u);assert.equal(h.b.redeploy(u),true);h.b.emit('skillStart',{unit:u,skill:u.skill});h.b.forceEnd();
  const res=h.b.result(),r=res.perPlayer[s.ps.playerId];assert.equal(r.layerGains.sargonShip,70);
  assert.equal(unitStatsEntry(u,u.s).growthTrait.value,50,'live battle detail shows the next real per-cast amount');
  assert.deepEqual(r.growthSkillUses,{[p.uid]:2});assert.deepEqual(compactResult(res).perPlayer[s.ps.playerId].growthSkillUses,r.growthSkillUses);
  s.h.m.lastResults=new Map([['p_0',r]]);
  assert.equal(s.ps.battleInput({reached:true}).growthCounters[p.uid].uses,4,'unite sees normal-battle uses before settlement');
  s.h.m.settle(null,null);assert.equal(p.meta.growthSkillUses,4);assert.equal(s.L('sargonShip'),70);
  s.h.m.startRound(2);assert.equal(s.ps.battleInput().growthCounters[p.uid].uses,4);s.done();assert.equal(res.errors,0);
});

test('Titi grows at prep end by the initial value and counts only fresh in-range sleep or stun entries',()=>{
  for(const elite of [false,true]){
    const s=setup(),p=s.put('缇缇',elite,9,4);s.end();assert.equal(p.meta.growthStatusSteps,1);
    const h=makeBattle({data:new DataSource(s.h.m.data),flags:{growthMode:true},players:[s.ps.battleInput()],autoFinish:false});
    h.step();const target=h.spawn('enemy_1001_1',{pos:[9,5]});
    h.b.applyStatus(target,'sleep',{duration:3});h.b.applyStatus(target,'sleep',{duration:3});h.b.applyStatus(target,'stun',{duration:3});
    const far=h.spawn('enemy_1001_1',{pos:[12,18]});h.b.applyStatus(far,'stun',{duration:3});h.b.forceEnd();
    const r=h.b.result().perPlayer[s.ps.playerId];assert.equal(r.layerGains.sargonShip,elite?8:4);assert.equal(r.layerGains.preciShip,elite?8:4);
    s.end();assert.equal(p.meta.growthStatusSteps,2);assert.equal(s.ps.battleInput().growthCounters[p.uid].statusSteps,2);
    s.done();assert.equal(h.b.result().errors,0);
  }
});

test('Mint Gavial and Titi inherit only the highest accumulated progress when merging',()=>{
  for(const [name,key]of [['薄绿','growthPrepEntries'],['百炼嘉维尔','growthSkillUses'],['缇缇','growthStatusSteps']]){
    const s=setup(),a=s.ps.acquireChess(id(name)),b=s.ps.acquireChess(id(name));
    a.meta[key]=3;b.meta[key]=7;s.ps.acquireChess(id(name));
    const elite=s.ps.allChess().find(p=>p.id===id(name,true));assert.ok(elite);assert.equal(elite.meta[key],7);s.done();
  }
});

test('Pinecone recruitment starts when acquired, grows while held, caps at six and offers the displayed tier',()=>{
  for(const elite of [false,true]){
    const s=setup();s.h.m.round=5;const p=s.ps.acquireChess(id('松果',elite));
    assert.equal(s.ps.pieceView(p).growthTrait.recruitTier,elite?5:1,'a late acquisition starts at its own initial tier');
    s.h.m.dispatch(s.ps,'onRoundStart',{round:6});assert.equal(s.ps.pieceView(p).growthTrait.recruitTier,elite?6:2);
    p.meta.growthRecruitRounds=20;assert.equal(s.ps.pieceView(p).growthTrait.recruitTier,6);
    p.meta.growthRecruitRounds=elite?1:2;const shown=s.ps.pieceView(p).growthTrait.recruitTier;
    assert.equal(s.ps.sell(p.uid).ok,true);const offer=s.ps.offers.at(-1);assert.equal(offer.tier,shown);
    assert.ok(offer.slots.length);assert.ok(offer.slots.every(x=>s.ps.gd.chess(x.id).tier===shown));s.done();
  }
});

test('owned and shop current values update from real gains and previews do not mutate progress',()=>{
  const s=setup(),p=s.put('夕');s.activate('yanShip','arcaneShip');
  assert.ok(s.ps.pieceView(p).growthTrait.gains.every(x=>x.layers===0));
  for(let n=0;n<4;n++)s.ps.acquireChess(id('惊蛰'));
  assert.deepEqual(s.ps.pieceView(p).growthTrait.gains,[{bondId:'yanShip',layers:16},{bondId:'arcaneShip',layers:16}]);
  s.ps.shop.slots[0]={kind:'chess',id:id('松果'),price:3,basePrice:3,sold:false};
  assert.equal(s.ps.privateView().shop.slots[0].growthTrait.recruitTier,1);
  const pine=s.ps.acquireChess(id('松果'));pine.meta.growthRecruitRounds=3;
  assert.equal(s.ps.pieceView(pine).growthTrait.recruitTier,4);
  assert.equal(s.ps.privateView().shop.slots[0].growthTrait.recruitTier,1,'new shop copies have no inherited holding time');
  const before=JSON.stringify(pine.meta);s.ps.privateView();s.ps.privateView();assert.equal(JSON.stringify(pine.meta),before);s.done();
});

test('meta previews cannot grow owned cards, gain real gifts or advance the match random stream',()=>{
  const s=setup();const p=s.ps.acquireChess(id('松果'));s.put('空弦');s.put('焰影苇草',false,9,4);
  const before=JSON.stringify({meta:p.meta,hand:s.ps.hand,temp:s.ps.temp,growth:s.ps.growthState});
  const rng=s.h.m.rngMeta.state();
  s.h.m.dispatch(s.ps,'onRoundStart',{preview:true});s.h.m.dispatch(s.ps,'onSpend',{amount:9,preview:true});
  assert.equal(JSON.stringify({meta:p.meta,hand:s.ps.hand,temp:s.ps.temp,growth:s.ps.growthState}),before);
  assert.deepEqual(s.h.m.rngMeta.state(),rng);s.done();
});

test('Blue Poison copies stack independently, only reach living owned Aegir operators and are consumed after triggering',()=>{
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[
    {chessId:id('蓝毒'),row:9,col:3},{chessId:id('斯卡蒂'),row:11,col:3},{chessId:id('菲莱'),row:9,col:5},
  ],bonds:{egirShip:{active:true,count:2,tier:1,layers:0}},autoFinish:false});
  h.step();const [ghost,skadi,other]=h.b.allyUnits,pid=ghost.ownerId;let triggers=0;
  h.b.on('layerGain',ev=>{if(ev.temporary)triggers++;});
  h.b.kill(ghost);assert.equal(skadi.growthDeathCopies.normal,1);assert.equal(other.growthDeathCopies,undefined);
  h.b.redeploy(ghost);h.b.kill(ghost);assert.equal(skadi.growthDeathCopies.normal,2);
  h.b.redeploy(ghost);h.b.kill(skadi);
  assert.equal(h.b.getPlayer(pid).bonds.egirShip.layers,16);assert.equal(triggers,4,'the two received copies fire as separate layer events');
  assert.equal(ghost.growthDeathCopies.normal,2);assert.equal(unitStatsEntry(skadi,skadi.s).growthDeathCopies.normal,0);
  h.b.redeploy(skadi);h.b.kill(skadi);assert.equal(h.b.getPlayer(pid).bonds.egirShip.layers,16,'used copied traits do not fire again after revival');
  h.b.forceEnd();const r=h.b.result().perPlayer[pid];assert.deepEqual(r.layerGains,{});
  const s=setup();s.h.m.lastResults=new Map([['p_0',r]]);s.h.m.settle(null,null);assert.equal(s.L('egirShip'),0);s.done();assert.equal(h.b.result().errors,0);
});

test('Blue Poison elite copies retain their source value and temporary layers work without enabling permanent boss gains',()=>{
  const h=makeBattle({kind:'boss',data:new DataSource(growthData(DATA,true)),flags:{growthMode:true,layerGainsEnabled:false},units:[
    {chessId:id('蓝毒',true),row:9,col:3},{chessId:id('斯卡蒂'),row:11,col:3},
  ],bonds:{egirShip:{active:true,count:2,tier:1,layers:0}},autoFinish:false});
  h.step();const [ghost,skadi]=h.b.allyUnits,pid=ghost.ownerId;h.b.kill(ghost);
  assert.equal(skadi.growthDeathCopies.elite,1);h.b.redeploy(ghost);h.b.kill(skadi);
  assert.equal(h.b.getPlayer(pid).bonds.egirShip.layers,16);assert.equal(h.b.addLayers(pid,'egirShip',5,'ordinary'),0);
  h.b.forceEnd();assert.deepEqual(h.b.result().perPlayer[pid].layerGains,{});assert.equal(h.b.result().errors,0);
});

test('Blue Poison copied traits are consumed before indom revival and no non-Aegir fallback target is selected',()=>{
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[
    {chessId:id('蓝毒'),row:9,col:3},{chessId:id('斯卡蒂'),row:11,col:3},
  ],bonds:{egirShip:{active:true,count:2,tier:1,layers:0},indomShip:{active:true,count:2,tier:2,layers:999}},autoFinish:false});
  h.step();h.b.rng=()=>0;const [ghost,skadi]=h.b.allyUnits;h.b.kill(ghost);h.b.kill(skadi);
  assert.equal(skadi.alive,true);h.b.kill(skadi);assert.equal(h.b.getPlayer(ghost.ownerId).bonds.egirShip.layers,8);
  h.b.forceEnd();assert.equal(h.b.result().errors,0);
  const empty=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[
    {chessId:id('蓝毒'),row:9,col:3},{chessId:id('菲莱'),row:11,col:3},
  ],bonds:{egirShip:{active:true,count:1,tier:1,layers:0}},autoFinish:false});
  empty.step();let rolls=0;empty.b.rng=()=>{rolls++;return 0;};empty.b.kill(empty.b.allyUnits[0]);
  assert.equal(rolls,0);assert.equal(empty.b.allyUnits[1].growthDeathCopies,undefined);empty.b.forceEnd();assert.equal(empty.b.result().errors,0);
});

test('growth mode completes real natural-LP matches with either requested combat backend',{
  skip:process.env.SP_GROWTH_FULLMATCH!=='1',timeout:180000,
},t=>{
  for(const clientCombat of [false,true]){
    const h=makeMatch({growthMode:true,spellShop:true,heroMod:true,mode:'solo',difficulty:'NORMAL',seed:153,
      clientCombat,captureFrames:false,botRehearsal:0});
    try{
      h.autoHumans().start();h.runToEnd({maxSteps:5000000});h.invariants();
      assert.deepEqual(h.logs.error,[]);assert.equal(h.m.errorCount,0);assert.equal(h.endedCount,1);
      assert.ok(h.m.round>1);
      assert.equal(h.m.clientCombat,false);
      t.diagnostic(JSON.stringify({requestedClientCombat:clientCombat,combatMode:'server',round:h.m.round,phase:h.m.phase,errors:h.m.errorCount}));
    }finally{h.m.dispose();}
  }
});
