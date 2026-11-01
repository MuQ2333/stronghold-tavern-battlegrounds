import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {growthCombatRepeats,triggerDeathTraits} from '../server/sim/content/garrisons/growthTriggers.js';
import {ALL_SPELLS} from '../shared/spellCatalog.js';
import {compactResult,resultDigest} from '../server/sim/spec.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const piece=(name,row,col,elite=false,uid=1)=>({chessId:id(name,elite),row,col,uid});
function fight(units,extra={}) {
  return makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},units,autoFinish:false,...extra});
}
function activate(h,ids) {
  const p=h.b.players[0];for(const id of ids)p.bonds[id]={active:true,tier:1,count:1,layers:0};return p;
}
function done(h) {h.b.forceEnd();assert.equal(h.b.result().errors,0);}

for(const skadiElite of [false,true])test(`elite Skadi alter and Indre multiply ${skadiElite?'elite':'normal'} Skadi refresh rewards`,()=>{
  const h=fight([piece('斯卡蒂',12,3,skadiElite,1),piece('砾',11,3,false,2),piece('浊心斯卡蒂',10,3,true,3),piece('隐德来希',9,7,true,4)]);
  const order=[],repeats=[];
  h.b.on('growth:trait:death',ctx=>{if(ctx.source?.uid===3&&ctx.unit.uid<=2){order.push(ctx.unit.uid);repeats.push(ctx.traitRepeats);}});
  h.step();
  assert.deepEqual(order,[1,1,2,2]);assert.deepEqual(repeats,[3,3,3,3]);
  assert.equal(h.b._pp('p1').growthFreeRefreshes,skadiElite?12:6);done(h);
});

test('Skadi alter reads newly granted death traits when a later original operator is visited',()=>{
  const h=fight([piece('蓝毒',12,3,false,1),piece('归溟幽灵鲨',11,3,false,2),piece('浊心斯卡蒂',10,3,true,3)]);
  const p=activate(h,['egirShip']),order=[];h.b.rng=()=>0;
  h.b.on('growth:trait:death',ctx=>{if(ctx.source?.uid===3&&ctx.unit.uid<=2)order.push(ctx.unit.uid);});
  h.step();
  assert.deepEqual(order,[1,1,2,2]);
  assert.equal(p.bonds.egirShip.layers,24,'two base triggers and both received copies replayed twice');
  assert.equal(h.b.allyUnits[1].growthDeathCopies.normal,2,'artificial replays retain the received copies');done(h);
});

test('normal Skadi alter also reaches a newly granted death trait without a second global sweep',()=>{
  const h=fight([piece('蓝毒',12,3,false,1),piece('归溟幽灵鲨',11,3,false,2),piece('浊心斯卡蒂',10,3,false,3)]);
  const p=activate(h,['egirShip']);h.b.rng=()=>0;h.step();
  assert.equal(p.bonds.egirShip.layers,8,'Blue Poison grants the later target a copy, which triggers on its turn');done(h);
});

test('operators generated during an opening never gain an extra Skadi alter opening activation',()=>{
  const h=fight([piece('浊心斯卡蒂',12,3,false,1),piece('斯卡蒂',11,3,false,2)]);
  let created=false;
  h.b.on('growth:trait:death',ctx=>{
    if(created||ctx.source?.uid!==1)return;created=true;
    const child=h.b._createAllyFromInput(h.b.players[0],{chessId:id('浊心斯卡蒂',true),row:10,col:3,uid:99});
    h.b._setupUnit(child);h.b._deploy(child);
  });
  h.step();assert.equal(created,true);assert.equal(h.b._pp('p1').growthFreeRefreshes,1);done(h);
});

test('every normal/elite Indre adds its own repeat, including later initial deployments; physical deployments stay singular',()=>{
  const h=fight([piece('瑕光',9,3),piece('隐德来希',9,7,false,2),piece('隐德来希',10,7,true,3)]);
  const p=activate(h,['kazimierzShip','raidShip']),u=h.b.allyUnits[0],deploys=[];
  h.b.on('deploy',({unit})=>deploys.push(unit));h.step();
  assert.equal(p.bonds.kazimierzShip.layers,20);assert.equal(p.bonds.raidShip.layers,20);
  assert.equal(deploys.filter(x=>x===u).length,1);assert.equal(growthCombatRepeats(h.b,u),4);
  h.b.retreat(h.b.allyUnits[2]);assert.equal(growthCombatRepeats(h.b,u),2);
  h.b.retreat(u);h.b.redeploy(u,{free:true});assert.equal(p.bonds.kazimierzShip.layers,30);
  h.b.retreat(h.b.allyUnits[1]);h.b.retreat(u);h.b.redeploy(u,{free:true});
  assert.equal(p.bonds.kazimierzShip.layers,35);assert.equal(deploys.filter(x=>x===u).length,3);done(h);
});

test('Gravel ramps repeat as independent trait events and retained result counters',()=>{
  const h=fight([piece('砾',9,3),piece('隐德来希',9,7,true,2)]);
  const p=activate(h,['kazimierzShip','indomShip']);h.step();
  assert.equal(p.bonds.kazimierzShip.layers,6);assert.equal(p.bonds.indomShip.layers,12);
  const u=h.b.allyUnits[0];p.bonds.indomShip.active=false;h.b.kill(u);
  assert.equal(p.bonds.kazimierzShip.layers,21);
  h.b.forceEnd();assert.equal(h.b.result().perPlayer[u.ownerId].growthTraitUses[1],6);
  assert.equal(resultDigest(h.b.result()).hash,resultDigest(compactResult(h.b.result())).hash);assert.equal(h.b.result().errors,0);
});

test('Far Tooth saved copies all receive repeats without multiplying physical deployment',()=>{
  const h=fight([], {players:[{playerId:'p1',units:[piece('瑕光',9,3),piece('隐德来希',9,7,true,2)],
    growthDeployGrants:{1:{normal:2,elite:1}}}]});
  const p=activate(h,['kazimierzShip','preciShip']);h.step();
  assert.equal(p.bonds.kazimierzShip.layers,63,'(own 5 + 2*4 + 8) * 3');
  assert.equal(p.bonds.preciShip.layers,48);done(h);
});

test('artificial replay leaves originals alive and free of Indom, while revival traits deploy inert copies',()=>{
  const h=fight([],{players:[{playerId:'p1',units:[piece('砾',9,3),piece('深巡',10,3,false,2),piece('隐德来希',9,7,false,3)],
    bonds:{indomShip:{active:true,tier:2,count:2,layers:999}}}]});
  const p=activate(h,['kazimierzShip']);h.step();
  const u=h.b.allyUnits[0],reviver=h.b.allyUnits[1];const before={hp:u.hp,seq:u.deploySeq,dp:p.dp,sp:reviver.skill.sp};
  let deaths=0,deploys=0;h.b.on('death',()=>deaths++);h.b.on('deploy',()=>deploys++);
  triggerDeathTraits(h.b,u);triggerDeathTraits(h.b,reviver);
  assert.equal(u.hp,before.hp);assert.equal(u.deploySeq,before.seq);assert.equal(p.dp,before.dp);
  assert.equal(reviver.skill.sp,before.sp);assert.equal(deaths,0);assert.equal(deploys,2);
  const copies=h.b.allyUnits.filter(x=>x.growthSummoner===reviver);assert.equal(copies.length,2);assert.ok(copies.every(x=>x.growthReviveDisabled));
  h.b.kill(reviver);assert.equal(reviver.alive,true,'artificial trigger did not consume the real once-only revival');
  assert.equal(deaths,1);assert.equal(deploys,3);done(h);
});

test('a real indom revival happens once while Indre repeats only the knocked-out trait',()=>{
  const h=fight([],{players:[{playerId:'p1',units:[piece('斯卡蒂',9,3),piece('隐德来希',9,7,true,2)],
    bonds:{indomShip:{active:true,tier:2,count:2,layers:999}}}]});h.step();
  const u=h.b.allyUnits[0];let deploys=0,deaths=0;
  h.b.on('deploy',()=>deploys++);h.b.on('death',()=>deaths++);
  h.b.kill(u);assert.equal(u.alive,true);assert.equal(deploys,1);assert.equal(deaths,1);
  assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,3);done(h);
});

for(const elite of [false,true])test(`Skadi alter triggers own field death traits at battle start (${elite?'elite':'normal'})`,()=>{
  const h=fight([piece('斯卡蒂',9,3),piece('浊心斯卡蒂',10,3,elite,2),piece('隐德来希',9,7,false,3)]);
  h.step();const u=h.b.allyUnits[0],p=h.b._pp(u.ownerId);
  assert.equal(p.growthFreeRefreshes,elite?4:2);assert.equal(u.alive,true);assert.equal(h.hooksOf('death').length,0);
  h.b.retreat(u);assert.equal(p.growthFreeRefreshes,elite?4:2);done(h);
});

for(const elite of [false,true])test(`Mizuki uses only the first skill and chooses right then down among death-trait operators (${elite?'elite':'normal'})`,()=>{
  const h=fight([piece('水月',9,3,elite),piece('砾',9,5,false,2),piece('斯卡蒂',12,5,false,3),piece('小满',9,8,false,4)]);
  h.step();const u=h.b.allyUnits[0],p=h.b._pp(u.ownerId);
  h.b.emit('skillStart',{unit:u});assert.equal(p.growthFreeRefreshes,elite?2:1);
  h.b.emit('skillStart',{unit:u});assert.equal(p.growthFreeRefreshes,elite?2:1);
  assert.ok(h.b.allyUnits.every(x=>x.alive));done(h);
});

test('Blue Poison copies survive repeated artificial triggers, then consume all Indre repetitions on a real knock-out',()=>{
  const h=fight([piece('蓝毒',9,3),piece('乌尔比安',10,3,false,2),piece('隐德来希',9,7,false,3)]);
  h.b.rng=()=>0;
  const p=activate(h,['egirShip']);h.step();const [source,target]=h.b.allyUnits;
  triggerDeathTraits(h.b,source);assert.equal(p.bonds.egirShip.layers,8);
  assert.equal(target.growthDeathCopies.normal,2);
  triggerDeathTraits(h.b,target);assert.equal(p.bonds.egirShip.layers,24,'two copies each trigger twice');
  assert.equal(target.growthDeathCopies.normal,2);assert.equal(source.growthDeathCopies.normal,4);
  triggerDeathTraits(h.b,target);assert.equal(p.bonds.egirShip.layers,40);assert.equal(target.growthDeathCopies.normal,2);
  h.b.kill(target);assert.equal(p.bonds.egirShip.layers,56);assert.equal(target.alive,true);
  assert.equal(target.growthDeathCopies.normal,0,'consumed before actual trait revival');
  assert.equal(source.growthDeathCopies.normal,12);
  h.b.kill(target);assert.equal(p.bonds.egirShip.layers,56,'revival does not restore consumed copies');
  h.b.forceEnd();assert.deepEqual(h.b.result().perPlayer[source.ownerId].layerGains,{});assert.equal(h.b.result().errors,0);
});

test('Blue Poison received copies are battle-local and never enter permanent input or the next field',()=>{
  const units=[piece('蓝毒',9,3),piece('归溟幽灵鲨',10,3,false,2)],before=JSON.stringify(units);
  const h=fight(units);activate(h,['egirShip']);h.step();triggerDeathTraits(h.b,h.b.allyUnits[0]);
  assert.equal(h.b.allyUnits[1].growthDeathCopies.normal,1);done(h);
  assert.equal(JSON.stringify(units),before);
  const next=fight(units);activate(next,['egirShip']);next.step();
  assert.equal(next.b.allyUnits[1].growthDeathCopies,undefined);done(next);
});

for(const kind of ['normal','unite','boss','hidden'])test(`mixed Blue Poison grants survive replays and consume on actual knock-out before Indom (${kind})`,()=>{
  const h=fight([],{kind,players:[{playerId:'p1',units:[piece('蓝毒',12,3,false,1),piece('蓝毒',11,3,true,2),piece('斯卡蒂',10,3,false,3)],
    bonds:{indomShip:{active:true,tier:2,count:3,layers:100000}}}]});
  const p=activate(h,['egirShip']);h.b.rng=()=>0.99;h.step();const [ordinary,elite,target]=h.b.allyUnits;
  triggerDeathTraits(h.b,ordinary);triggerDeathTraits(h.b,elite);
  assert.deepEqual(target.growthDeathCopies,{normal:1,elite:1});
  triggerDeathTraits(h.b,target,{times:2});assert.equal(p.bonds.egirShip.layers,36);
  assert.deepEqual(target.growthDeathCopies,{normal:1,elite:1});
  h.b.kill(target);assert.equal(target.alive,true);assert.equal(p.bonds.egirShip.layers,48);
  assert.deepEqual(target.growthDeathCopies,{normal:0,elite:0});
  h.b.kill(target);assert.equal(p.bonds.egirShip.layers,48,'Indom does not restore the spent grants');
  h.b.forceEnd();assert.deepEqual(h.b.result().perPlayer.p1.layerGains,{});assert.equal(h.b.result().errors,0);
});

test('ally players never borrow each other Indre aura or Skadi alter death triggers',()=>{
  const h=fight([],{kind:'unite',flags:{growthMode:true,layerGainsEnabled:true},players:[
    {playerId:'p1',units:[piece('斯卡蒂',9,3),piece('瑕光',10,3,false,2)]},
    {playerId:'p2',units:[piece('隐德来希',9,15,true,3),piece('浊心斯卡蒂',10,15,true,4)]},
  ]});const p=activate(h,['kazimierzShip']);h.step();
  assert.equal(growthCombatRepeats(h.b,h.b.allyUnits[0]),1);assert.equal(p.bonds.kazimierzShip.layers,5);
  assert.equal(h.b._pp('p1').growthFreeRefreshes || 0,0);done(h);
});

for(const skadiElite of [false,true])test(`artificial ${skadiElite?'elite':'normal'} Skadi refreshes settle through the actual match result path`,()=>{
  const h=fight([piece('斯卡蒂',9,3,skadiElite),piece('浊心斯卡蒂',10,3,false,2)]);h.step();h.b.forceEnd();
  const m=makeMatch({growthMode:true,fake:true,mode:'solo',difficulty:'FUNNY'});m.start();m.toPrep(1);
  const ps=m.ps('p_0'),before=ps.shop.freeRefreshes;
  m.m.dispatch(ps,'onBattleResult',{result:h.b.result().perPlayer['p1']});
  assert.equal(ps.shop.freeRefreshes,before+(skadiElite?2:1));assert.deepEqual(m.logs.error,[]);m.m.dispose();assert.equal(h.b.result().errors,0);
});

function prep(growthMode=true) {
  const h=makeMatch({growthMode,spellShop:true,heroMod:false,fake:true,mode:'solo',difficulty:'FUNNY'});h.start();h.toPrep(1);
  const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.recompute();
  const put=(name,r=9,c=3,elite=false)=>{const p=ps.newPiece('chess',id(name,elite));ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  const spell=name=>ps.acquireItem(ALL_SPELLS.find(s=>s.name===name).id);
  return {h,ps,put,spell,done:()=>{assert.deepEqual(h.logs.error,[]);h.m.dispose();}};
}

test('Rosmontis repeats native and catalogue target effects twice with one consumption/cast, independent of same-name count',()=>{
  const s=prep(),target=s.put('小满');s.put('迷迭香',10,3);s.put('迷迭香',11,3,true);
  const native=s.ps.acquireItem('chess_item_1_04_e_a');
  assert.equal(s.ps.castSpell(native.uid,target.uid).ok,true);assert.equal(s.ps.layers.yanShip,6);
  assert.equal(s.ps.find(native.uid),null);assert.equal(s.ps.growthState.spellsCast,1);
  const arrow=s.spell('尖利箭矢');assert.equal(s.ps.castSpell(arrow.uid,target.uid).ok,true);
  assert.equal(s.ps.layers.yanShip,14);assert.equal(s.ps.growthState.spellsCast,2);
  const coin=s.spell('拼命发掘'),funds=s.ps.funds;assert.equal(s.ps.castSpell(coin.uid,target.uid).ok,true);
  assert.equal(s.ps.funds,funds+1,'a global spell does not double even with a supplied target UID');s.done();
});

test('Rosmontis stops off-field; disabled growth keeps native spell resolution and failed targets remain atomic',()=>{
  for(const growth of [true,false]) {
    const s=prep(growth),target=s.put('小满'),ros=s.ps.acquireChess(id('迷迭香'));
    assert.ok(s.ps.find(ros.uid));const native=s.ps.acquireItem('chess_item_1_04_e_a');
    assert.notEqual(s.ps.castSpell(native.uid,999999).ok,true);assert.ok(s.ps.find(native.uid));
    assert.equal(s.ps.castSpell(native.uid,target.uid).ok,true);assert.equal(s.ps.layers.yanShip,3);s.done();
  }
});

test('Rosmontis choice spell binds its repeat at cast and applies the selected outcome twice after she leaves',()=>{
  const s=prep(),target=s.put('小满'),ros=s.put('迷迭香',10,3);
  const spell=s.spell('森林秘宝');assert.equal(s.ps.castSpell(spell.uid,target.uid).ok,true);
  const choice=s.ps.offers.find(o=>o.spellChoice);assert.equal(choice.spellChoice.growthRepeats,2);
  assert.equal(s.ps.sell(ros.uid).ok,true);assert.equal(s.ps.pickReward(0).ok,true);
  assert.equal(s.ps.layers.yanShip,16);assert.equal(s.ps.growthState.spellsCast,1);s.done();
});

test('Rosmontis never duplicates a consumed target or charges a failed second resolution',()=>{
  const s=prep(),target=s.put('小满');s.put('迷迭香',10,3);s.ps.offers=[];
  const item=s.ps.acquireItem('chess_item_5_04_e_a');assert.equal(s.ps.castSpell(item.uid,target.uid).ok,true);
  assert.equal(s.ps.find(target.uid),null);assert.equal(s.ps.offers.length,1);
  assert.equal(s.ps.growthState.spellsCast,1);s.done();
});
