import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch,DATA} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {GROWTH_KAZDEL} from '../shared/growthKazdelRoster.js';
import {DataSource} from '../server/sim/simdata.js';
import {kitOf} from '../server/sim/content/index.js';
import {compactResult,resultDigest} from '../server/sim/spec.js';
import {growthSelfDamage} from '../server/match/growthKazdel.js';
import {unitStatsEntry} from '../shared/protocol.js';
import {growthRewardAllowed} from '../server/match/growthRewardPolicy.js';
import {makeCtx} from '../server/match/effectsMeta.js';
import {growthMajority,growthPurchaseGrants,growthPurchaseView} from '../server/match/growthTraits.js';
import {spellTarget} from '../shared/spells.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const names=['红豆','陨星','闪灵','赫德雷','阿斯卡纶','维什戴尔','逻各斯'];
function prep(overrides={}) {
  const data={...DATA,...overrides,config:{...DATA.config,modes:Object.fromEntries(Object.entries(DATA.config.modes).map(([id,m])=>[id,{...m,inactiveBondIds:['deputShip']}]))}};
  const h=makeMatch({data,growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true,seed:52});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.pendingFunds=0;ps.funds=100;ps.bondCountBonus={};ps.recompute();
  const put=(name,elite=false,r=9,c=3)=>{const p=ps.newPiece('chess',id(name,elite));ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  const activate=(...ids)=>{for(const id of ids)ps.bondCountBonus[id]=20;ps.recompute();};
  return {h,ps,put,activate,done:()=>{assert.deepEqual(h.logs.error,[]);h.m.dispose();}};
}
function fight(name,elite=false,extra={}){
  return makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units:[{chessId:id(name,elite),row:9,col:4,uid:1}],autoFinish:false,...extra});
}

for(const source of ['忍冬','安洁莉娜','赫德雷','魔王'])for(const elite of [false,true])for(const boostElite of [false,true])
test(`Suzuran ${boostElite?'elite':'normal'} strengthens future ${source} ${elite?'elite':'normal'} purchase grants without retroactive changes`,()=>{
  const s=prep(),base=({忍冬:3,安洁莉娜:4,赫德雷:2,魔王:1}[source])*(elite?2:1),boost=boostElite?2:1;
  s.put('铃兰',boostElite);s.activate('siracusaShip');
  if(['安洁莉娜','魔王'].includes(source))s.put(source,elite,9,4);
  const assign=()=>{
    if(source==='魔王')growthSelfDamage(s.ps,1);
    else if(source==='安洁莉娜')s.h.m.dispatch(s.ps,'onRefresh',{slots:s.ps.shop.slots});
    else s.ps.acquireChess(id(source,elite),{fromPool:false});
  };
  const slot=()=>({kind:'chess',id:id('拉普兰德'),basePrice:3,sold:false});
  const value=()=>growthPurchaseGrants(s.ps,slot()).reduce((n,g)=>n+g.n,0);
  s.h.m.dispatch(s.ps,'onPrepEnd',{});assign();assert.equal(value(),base+boost);
  assert.equal(growthPurchaseView(s.ps,slot()).find(g=>g.bondId==='siracusaShip').layers,base+boost);
  s.ps.shop.slots=s.ps.shop.slots.map((_,i)=>i===0?slot():null);
  const before=s.ps.layers.siracusaShip||0;assert.equal(s.ps.buy(0).ok,true);
  assert.equal(s.ps.layers.siracusaShip-before,base+boost,'displayed benefit equals actual purchase settlement');
  s.h.m.dispatch(s.ps,'onPrepEnd',{});assert.equal(value(),base+boost,'existing grants do not grow retroactively');
  assign();assert.equal(value(),2*base+3*boost,'each new grant uses the current amplifier exactly once');s.done();
});
test('seven real Kazdel pairs preserve identity, have dedicated kits and enter the real stock; native remains untouched',()=>{
  const d=growthData(DATA,true),s=prep();
  for(const name of names)for(const elite of [false,true]) {
    const r=d.chess[id(name,elite)];assert.equal(r.charId,GROWTH_KAZDEL.chess[id(name,elite)].charId);
    assert.ok(r.bonds.includes('kazdelShip'));assert.equal(r.visible,true);
    const def=new DataSource(d).getChess(r.chessId);assert.equal(typeof kitOf(def),'function');
    if(!elite)assert.ok(s.h.m.pool.entries.has(r.chessId),name+' real stock');
  }
  assert.equal(s.ps.gd.chessPrice(id('红豆')),1);assert.equal(d.chess[id('闪灵')].tier,2);
  assert.deepEqual(d.bonds.kazdelShip.thresholds,[1,3]);assert.equal(DATA.bonds.kazdelShip,undefined);
  for(const name of ['伊内丝','华法琳','魔王','隐德来希'])assert.ok(d.chess[id(name)].bonds.includes('kazdelShip'));
  s.done();
});
test('all seven new operators fight with their real default skill, both forms, with no sim errors',()=>{
  for(const name of names)for(const elite of [false,true]) {
    const h=fight(name,elite,{timeLimit:20,enemies:[{key:'enemy_1001_1',time:0,route:0,count:10,interval:1}]});
    h.step();const u=h.b.allyUnits[0];assert.equal(u.def.charId,GROWTH_KAZDEL.chess[id(name)].charId);
    if(u.skill){u.skill.sp=u.skill.spCost;u.skill.activate();}
    h.run(15);h.b.forceEnd();assert.equal(h.b.result().errors,0,name+':'+elite);
  }
});
test('Vigna self-harm uses real LP and armor; Shining restores both and grants only one reaction per explicit event',()=>{
  for(const elite of [false,true]) {
    const s=prep();s.ps.lp=20;s.ps.spellData().armor=1;
    s.ps.acquireChess(id('红豆',elite));assert.equal(s.ps.spellState.armor,0);assert.equal(s.ps.lp,elite?19:20);
    s.put('闪灵',elite);s.activate('kazdelShip');s.ps.lp=20;s.ps.spellState.armor=1;
    const before=s.ps.layers.kazdelShip || 0;s.ps.acquireChess(id('红豆',elite));
    assert.equal(s.ps.lp,20);assert.equal(s.ps.spellState.armor,1);
    assert.equal(s.ps.layers.kazdelShip-before,(elite?2:1)*(elite?4:2));s.done();
  }
});
test('unprotected self-harm can kill immediately, and ordinary battle losses do not enter rollback',()=>{
  const s=prep();s.ps.lp=1;s.ps.acquireChess(id('红豆'));assert.equal(s.ps.lp,0);assert.equal(s.ps.alive,false);assert.equal(s.h.m.ended,true);s.done();
  const t=prep();t.put('闪灵');t.put('魔王',false,10,3);t.ps.lp=20;
  t.h.m.lastResults=new Map([[t.ps.playerId,{leaked:[{counted:true,damage:1}],perfect:false,coins:0,layerGains:{},killed:0,damageDealt:0}]]);
  t.h.m.settle(null,null);assert.ok(t.ps.lp<20);assert.equal(t.ps.growthState?.gainGrant || 0,0);t.done();
});
test('Meteorite reacts to true Kazdel acquisitions, not purchase-reward replays; a bench Meteorite gives no aura',()=>{
  const s=prep();s.put('陨星');s.activate('kazdelShip');s.ps.lp=50;
  s.ps.acquireChess(id('红豆'));assert.equal(s.ps.lp,48);assert.equal(s.ps.layers.kazdelShip,2);
  s.ps.acquireChess(id('小满'));assert.equal(s.ps.lp,48);s.done();
});
test('Hoederer and King purchase grants persist through refresh and sale, and devour converts main layers at tier two',()=>{
  const s=prep();s.ps.acquireChess(id('赫德雷'));s.put('魔王');s.put('闪灵',false,10,3);s.activate('kazdelShip');
  growthSelfDamage(s.ps,1);assert.equal(s.ps.growthState.gainGrant,1);
  s.ps.shop.slots=[{kind:'chess',id:id('小满'),basePrice:3,sold:false}];
  assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.layers.yanShip,3);assert.equal(s.ps.layers.skillfulShip,3);
  const ines=s.put('伊内丝',false,11,3);s.ps.shop.slots=[{kind:'chess',id:id('惊蛰'),basePrice:3,sold:false}];const before=s.ps.layers.kazdelShip;
  s.h.m.dispatch(s.ps,'onPrepEnd',{});assert.equal(s.ps.shop.slots[0].sold,true);
  assert.equal(s.ps.pendingFunds,0,'consumption does not trigger Jingzhe onGain');
  assert.equal(s.ps.round.gainedChess,2,'only Hoederer and real purchase are acquisitions');
  assert.equal(s.ps.layers.yanShip,3,'the ordinary purchase remains Yan; consumed main layers convert');
  assert.equal(s.ps.layers.kazdelShip-before,4,'Hoederer +2, King +1 and Ines tier +1');
  assert.ok(s.ps.find(ines.uid));s.done();
});
test('Warfarin discovers real stock, charges the chosen tier, and elite queues two discoveries',()=>{
  const s=prep();s.ps.lp=50;s.ps.acquireChess(id('华法琳',true));
  assert.equal(s.ps.offers.filter(x=>x.growthSelfDamage).length,2);
  const o=s.ps.offers[0],chosen=o.slots[0],tier=s.ps.gd.chess(chosen.id).tier;
  assert.ok(o.slots.every(x=>s.ps.gd.chess(x.id).bonds.includes('kazdelShip')));
  assert.equal(s.ps.pickReward(0).ok,true);assert.ok(s.ps.lp<=50-tier);s.done();
});
test('Ascalon and Logos consume only displayed eligible shop cards and replay rewards without creating acquisitions',()=>{
  const s=prep();s.put('阿斯卡纶',true);s.ps.acquireChess(id('赫德雷'));
  s.ps.shop.slots=[{kind:'chess',id:id('惊蛰'),basePrice:2,sold:false},{kind:'item',id:'hs_bg28_168',sold:false}];
  s.ps.lp=50;const gains=s.ps.round.gainedChess;s.ps.acquireChess(id('红豆'));
  assert.equal(s.ps.layers.yanShip,4);assert.equal(s.ps.pendingFunds,0);assert.equal(s.ps.round.gainedChess,gains+1);
  assert.equal(s.ps.shop.slots[1].sold,false);
  s.put('逻各斯',false,10,3);s.ps.shop.slots=[{kind:'chess',id:id('小满'),sold:false},{kind:'chess',id:id('惊蛰'),sold:false}];
  const spell=s.ps.acquireItem('hs_bg28_168');assert.equal(s.ps.castSpell(spell.uid).ok,true);
  assert.ok(s.ps.shop.slots.every(x=>x.sold));s.done();
});
test('Kazdel layer milestones give the source horn once per hundred, including delayed activation, and its stats work',()=>{
  const s=prep();s.ps.addLayers('kazdelShip',200);assert.equal(s.ps.growthState?.kazdelHorns || 0,0);
  s.put('红豆');assert.equal(s.ps.growthState.kazdelHorns,2);
  s.ps.recompute();assert.equal(s.ps.growthState.kazdelHorns,2);
  const items=[...s.ps.hand,...s.ps.temp].filter(p=>p?.kind==='item' && p.id==='chess_item_c_01_e_b');assert.equal(items.length,1,'two horns merge via the native item system');s.done();
  const base=fight('红豆'),horn=fight('红豆',false,{units:[{chessId:id('红豆'),row:9,col:4,items:['chess_item_c_01_e_a']}]});
  base.step();horn.step();assert.ok(horn.b.allyUnits[0].s.atk>base.b.allyUnits[0].s.atk);base.b.forceEnd();horn.b.forceEnd();assert.equal(horn.b.result().errors,0);
});
test('Kazdel source damage uses stationary control predicate and upper-tier true damage never recurses',()=>{
  const h=fight('红豆');h.step();const u=h.b.allyUnits[0],p=h.b.getPlayer(u.ownerId);
  p.bonds.kazdelShip={active:true,count:1,tier:1,layers:100};
  // Installation snapshots activation: build a new battle with active state supplied at construction.
  const a=fight('红豆',false,{bonds:{kazdelShip:{active:true,count:3,tier:2,layers:100}}});a.step();
  const source=a.b.allyUnits[0],enemy=a.spawn('enemy_1001_1',{pos:[9,5]});enemy.moving=false;
  const dmg={amount:10,type:'phys',mul:1};a.b.emit('hit',{source,target:enemy,dmg});assert.ok(Math.abs(dmg.mul-2.1)<1e-9);
  const hp=enemy.hp;a.b.dealDamage(source,enemy,{amount:1,type:'phys',isAttack:true,canDodge:false});
  assert.ok(enemy.hp<hp-1,'attack carries extra true damage');assert.ok(source.s.aspd>=150);
  a.b.forceEnd();h.b.forceEnd();assert.equal(a.b.result().errors,0);
});
test('Wisadel layer growth is once for each source/enemy pair and independent between friendly Kazdel operators',()=>{
  const h=fight('维什戴尔',false,{units:[{chessId:id('维什戴尔'),row:9,col:4},{chessId:id('红豆'),row:11,col:4}],bonds:{kazdelShip:{active:true,count:2,tier:1,layers:0}}});
  h.step();const[a,b]=h.b.allyUnits,e=h.spawn('enemy_1001_1',{pos:[9,5]}),p=h.b.getPlayer(a.ownerId);
  for(const s of [a,a,b,b])h.b.emit('damaged',{source:s,target:e,amount:1});assert.equal(p.bonds.kazdelShip.layers,4);
  h.b.forceEnd();assert.equal(h.b.result().perPlayer[a.ownerId].layerGains.kazdelShip,4);assert.equal(h.b.result().errors,0);
});
test('Gravel grows by initial values across deployment, knock-out, result compaction and permanent settlement',()=>{
  const h=fight('砾',false,{bonds:{kazimierzShip:{active:true,count:1,tier:1,layers:0},indomShip:{active:true,count:0,tier:0,layers:0}}});
  h.step();const u=h.b.allyUnits[0],p=h.b.getPlayer(u.ownerId);p.bonds.indomShip.active=true;
  h.b.kill(u);assert.equal(p.bonds.kazimierzShip.layers,3);assert.equal(h.b.redeploy(u,{free:true}),true);assert.equal(p.bonds.kazimierzShip.layers,6);
  h.b.forceEnd();const result=h.b.result();assert.equal(result.perPlayer[u.ownerId].growthTraitUses[1],3);
  assert.equal(resultDigest(result).hash,resultDigest(compactResult(result)).hash);
  const s=prep(),gravel=s.put('砾');s.h.m.dispatch(s.ps,'onBattleResult',{result:{growthTraitUses:{[gravel.uid]:3}}});
  assert.equal(s.ps.battleInput().growthCounters[gravel.uid].traitUses,3);assert.equal(s.ps.pieceView(gravel).growthTrait.gains[0].layers,4);s.done();
});
test('Specter alter ramp is temporary, grows by its grade-specific initial value and resets on the next battle',()=>{
  for(const elite of [false,true]) {
    const m=elite?2:1;
    const h=fight('归溟幽灵鲨',elite,{flags:{growthMode:true,layerGainsEnabled:false},bonds:{egirShip:{active:true,layers:0},indomShip:{active:true,layers:0}}});h.step();
    const u=h.b.allyUnits[0],p=h.b.getPlayer(u.ownerId);
    h.b.emit('dollSwitch',{unit:u});assert.equal(u.trait.doll,true);
    h.b.removeBuff(u,'trait:substitute');assert.equal(u.trait.doll,false);
    assert.equal(p.bonds.egirShip.layers,6*m);assert.equal(unitStatsEntry(u).growthTrait.value,6*m);
    h.b.forceEnd();assert.deepEqual(h.b.result().perPlayer[u.ownerId].layerGains,{});
    const next=fight('归溟幽灵鲨',elite);assert.equal(next.b.allyUnits[0].growthTraitLive.value,2*m);
  }
});

test('inactive Kazdel excludes self-harm cards before generic rewards, spells and native meta draws, but not ordinary shop purchases',()=>{
  const s=prep();s.ps.lp=30;
  for(const name of ['红豆','华法琳'])assert.equal(growthRewardAllowed(s.ps,id(name)),false);
  assert.equal(growthRewardAllowed(s.ps,id('陨星')),true,'a bench acquisition has no active self-harm trait');
  for(const c of s.h.m.pool.entries.values())c.left=0;
  for(const name of ['红豆','惊蛰','华法琳'])s.h.m.pool.entries.get(id(name)).left=20;
  const ctx=makeCtx(s.h.m,s.ps,{kind:'effect',key:'test'},'onGain',{});
  for(let n=0;n<12;n++)assert.equal(ctx.rollChess({tier:1}),id('惊蛰'));
  assert.deepEqual(s.ps.spellChessPool(1),[id('惊蛰')]);
  const offer=s.ps.pushRewardOffer('merge',{tier:1});assert.ok(offer.slots.every(x=>x.id===id('惊蛰')));
  s.ps.offers=[];s.ps.shop.slots=[{kind:'chess',id:id('红豆'),basePrice:1,sold:false}];
  assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.lp,29,'deliberate buying keeps its original onGain self-harm');
  s.put('红豆');assert.equal(growthRewardAllowed(s.ps,id('红豆')),true);assert.equal(growthRewardAllowed(s.ps,id('华法琳')),true);
  const got=s.ps.spellChessPool(1);assert.ok(got.includes(id('红豆')));s.done();
});

test('the random-reward policy also filters weighted and explicit native chess pools before choosing',()=>{
  const s=prep({choices:{...DATA.choices,pools:{...DATA.choices.pools,
    test_harm_list:{kind:'chess',items:[id('红豆'),id('惊蛰')]},
    test_harm_weight:{kind:'chess',weighted:[[id('红豆'),10000],[id('惊蛰'),1]]},
  }}});
  const ctx=makeCtx(s.h.m,s.ps,{kind:'effect',key:'test'},'onGain',{});
  for(const pool of ['test_harm_list','test_harm_weight'])for(let i=0;i<12;i++)assert.equal(ctx.rollPool(pool).id,id('惊蛰'));
  s.done();
});

test('Tin Man counts only actual field memberships, includes extra bonds, and gives one/two real eligible cards on sale',()=>{
  for(const elite of [false,true]) {
    const s=prep();s.put('深靛');s.put('跃跃',false,10,3);const tin=s.put('锡人',elite,11,3);
    s.ps.hand[0]=s.ps.newPiece('chess',id('小满'));s.ps.hand[1]=s.ps.newPiece('chess',id('惊蛰'));s.ps.recompute();
    assert.deepEqual(growthMajority(s.ps),['preciShip']);
    const gains=[],acquire=s.ps.acquireChess.bind(s.ps);s.ps.acquireChess=(id,...opts)=>{gains.push(id);return acquire(id,...opts);};
    assert.equal(s.ps.sell(tin.uid).ok,true);assert.equal(gains.length,elite?2:1);
    assert.ok(gains.every(id=>s.ps.gd.chess(id).bonds.includes('preciShip')));s.done();
  }
});

test('Blaze alter gives every reward category, one/two each, and random operator gifts honor the self-harm exclusion',()=>{
  for(const elite of [false,true]) {
    const s=prep(),gifts=[],items=[],acquire=s.ps.acquireChess.bind(s.ps),equip=s.ps.acquireItem.bind(s.ps);
    s.ps.acquireChess=(id,...opts)=>{gifts.push(id);return acquire(id,...opts);};
    s.ps.acquireItem=(id,...opts)=>{items.push(id);return equip(id,...opts);};
    for(const e of s.h.m.pool.entries.values())e.left=0;
    s.h.m.pool.entries.get(id('红豆')).left=20;s.h.m.pool.entries.get(id('惊蛰')).left=20;
    s.ps.acquireChess(id('烛煌',elite));const m=elite?2:1;
    assert.equal(gifts.filter(x=>x===id('惊蛰')).length,m);assert.equal(gifts.includes(id('红豆')),false);
    assert.equal(items.filter(id=>s.ps.gd.item(id).itemType==='EQUIP'&&!spellTarget(s.ps.gd.item(id))).length,m);
    assert.equal(items.filter(id=>!!spellTarget(s.ps.gd.item(id))).length,m);s.done();
  }
});

test('Yu spends nine actual funds per reward, each deployed copy counts independently and gifts do not advance it',()=>{
  const s=prep(),a=s.put('余'),b=s.put('余',true,10,3);
  const bench=s.ps.newPiece('chess',id('余',true));s.ps.hand[0]=bench;
  for(const e of s.h.m.pool.entries.values())e.left=0;
  s.h.m.pool.entries.get(id('小满')).left=40;
  const pay=n=>{assert.equal(s.ps.spend(n),true);s.ps._afterSpend(n,'test');};
  const before=s.ps.round.gainedChess;
  pay(8);assert.equal(s.ps.round.gainedChess,before);assert.equal(s.ps.pieceView(a).growthTrait.spent,8);
  pay(1);assert.equal(s.ps.round.gainedChess-before,3);
  assert.equal(a.meta.growthMajoritySpent,0);assert.equal(b.meta.growthMajoritySpent,0);
  assert.equal(bench.meta?.growthMajoritySpent || 0,0);
  pay(20);assert.equal(s.ps.round.gainedChess-before,9);
  assert.equal(s.ps.pieceView(a).growthTrait.spent,2);assert.equal(s.ps.pieceView(b).growthTrait.spent,2);
  s.ps.shop.freeRefreshes=1;assert.equal(s.ps.refresh().ok,true);
  assert.equal(a.meta.growthMajoritySpent,2,'a free refresh does not spend funds');
  s.ps.funds=0;assert.equal(s.ps.spend(1),false);assert.equal(a.meta.growthMajoritySpent,2);
  const desc=s.ps.gd.garrison(s.ps.gd.chess(a.id).garrisonIds[0]).desc;
  assert.match(desc,/每累计消耗9资金/);assert.doesNotMatch(desc,/每获得3名/);s.done();
});

test('Yu progress pauses off-field and an elite merge inherits the highest spending progress',()=>{
  const s=prep(),a=s.put('余'),b=s.put('余',false,10,3);
  a.meta.growthMajoritySpent=8;b.meta.growthMajoritySpent=4;
  const elite=s.ps.acquireChess(id('余'));assert.equal(s.ps.gd.isGolden(elite.id),true);
  assert.equal(elite.meta.growthMajoritySpent,8);
  assert.equal(s.ps.spend(1),true);s.ps._afterSpend(1,'test');
  assert.equal(elite.meta.growthMajoritySpent,0);
  const loc=s.ps.find(elite.uid);s.ps.board.delete(loc.key);s.ps.stow(elite,{allowTemp:true});
  assert.equal(s.ps.spend(8),true);s.ps._afterSpend(8,'test');
  assert.equal(elite.meta.growthMajoritySpent,0);s.done();
});
