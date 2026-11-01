import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch,DATA} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {DataSource} from '../server/sim/simdata.js';
import {buildBattleSpec,createBattleFromSpec,compactResult,resultDigest} from '../server/sim/spec.js';
import {unitStatsEntry} from '../shared/protocol.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const data=()=>new DataSource(growthData(DATA,true));
function fight(name,elite=false,extra={}) {
  return makeBattle({data:data(),flags:{growthMode:true},units:[{chessId:id(name,elite),row:9,col:4,uid:1}],autoFinish:false,...extra});
}
function enable(b,u,ids) {
  const p=b.getPlayer(u.ownerId);for(const id of ids)p.bonds[id]={active:true,layers:0};return p;
}
const layers=(b,u,id)=>b.getPlayer(u.ownerId).bonds[id]?.layers || 0;
const kills=(h,u,n)=>{for(let i=0;i<n;i++)h.b.kill(h.spawn('enemy_1001_1',{pos:[9,6]}),u);};
function prep() {
  const h=makeMatch({growthMode:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId=null;
  ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.bondCountBonus={};ps.recompute();
  const put=(name,elite=false,r=9,c=3)=>{const p=ps.newPiece('chess',id(name,elite));ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  return {h,ps,put,end:()=>h.m.dispatch(ps,'onPrepEnd',{round:h.m.round}),done:()=>{assert.deepEqual(h.logs.error,[]);h.m.dispose();}};
}

for(const elite of [false,true]) {
  test(`confirmed kill rewards obey first/pair/five rules and survive redeploy (${elite?'elite':'normal'})`,()=>{
    const m=elite?2:1;
    for(const [name,ids,n,expected] of [
      ['送葬人',['lateranoShip','preciShip'],7,[5*m,5*m]],
      ['休谟斯',['raidShip'],7,[6*m]],
      ['伺夜',['siracusaShip','miraShip'],7,[10*m,5*m]],
    ]) {
      const h=fight(name,elite);h.step();const u=h.b.allyUnits[0];enable(h.b,u,ids);
      kills(h,u,1);h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);kills(h,u,n-1);
      for(let i=0;i<ids.length;i++)assert.equal(layers(h.b,u,ids[i]),expected[i],name+':'+ids[i]);
      const before=ids.map(id=>layers(h.b,u,id));h.b.kill(h.spawn('enemy_1001_1',{pos:[9,6]}),null);
      assert.deepEqual(ids.map(id=>layers(h.b,u,id)),before,'unattributed kills do not trigger');
      h.b.forceEnd();const r=h.b.result();assert.equal(r.errors,0);
      for(let i=0;i<ids.length;i++)assert.equal(r.perPlayer[u.ownerId].layerGains[ids[i]],expected[i]);
    }
  });
  test(`Blemishine grants her actual active memberships on every deployment without the old cap (${elite?'elite':'normal'})`,()=>{
    const h=fight('瑕光',elite),u=h.b.allyUnits[0];enable(h.b,u,['kazimierzShip','raidShip']);
    h.step();for(let i=0;i<4;i++){h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);}
    for(const id of ['kazimierzShip','raidShip'])assert.equal(layers(h.b,u,id),25*(elite?2:1));
    h.b.forceEnd();assert.equal(h.b.result().errors,0);
  });
  test(`Eyja's top-bond choice is live and the ramp resets for each battle (${elite?'elite':'normal'})`,()=>{
    const h=fight('纯烬艾雅法拉',elite);h.step();const u=h.b.allyUnits[0],m=elite?2:1;
    const p=enable(h.b,u,['yanShip','kjeragShip']);p.bonds.yanShip.layers=10;p.bonds.kjeragShip.layers=1;
    h.b.emit('skillStart',{unit:u});assert.equal(p.bonds.yanShip.layers,10+3*m);
    p.bonds.kjeragShip.layers=100;h.b.emit('skillStart',{unit:u});assert.equal(p.bonds.kjeragShip.layers,100+6*m);
    h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);h.b.emit('skillStart',{unit:u});
    assert.equal(p.bonds.kjeragShip.layers,100+15*m);assert.equal(unitStatsEntry(u).growthTrait.value,12*m);
    h.b.forceEnd();assert.equal(h.b.result().errors,0);
    const next=fight('纯烬艾雅法拉',elite);assert.equal(next.b.allyUnits[0].growthTraitLive.value,3*m);
  });
  test(`Kroos grants the front operator a skill trait with unique active bonds and no old cap (${elite?'elite':'normal'})`,()=>{
    const h=fight('寒芒克洛丝',elite,{units:[
      {chessId:id('寒芒克洛丝',elite),row:9,col:4,dir:'RIGHT',uid:1},
      {chessId:id('送葬人'),row:9,col:5,uid:2},
      {chessId:id('小满'),row:11,col:5,uid:3},
    ]});
    h.step();const u=h.b.allyUnits[1],other=h.b.allyUnits[2];enable(h.b,u,['preciShip','lateranoShip']);
    for(let i=0;i<15;i++)h.b.emit('skillStart',{unit:u});
    for(const id of ['preciShip','lateranoShip'])assert.equal(layers(h.b,u,id),15*(elite?2:1));
    h.b.emit('skillStart',{unit:other});assert.equal(layers(h.b,u,'preciShip'),15*(elite?2:1));
    h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);h.b.emit('skillStart',{unit:u});
    assert.equal(layers(h.b,u,'preciShip'),16*(elite?2:1));
    const view=unitStatsEntry(u);assert.equal(view.growthGrantedTraits[0].count,1);assert.equal(view.growthGrantedTraits[0].value,elite?2:1);
    h.b.forceEnd();assert.equal(h.b.result().errors,0);
  });
}

test('Vigil keeps native weakness conversion while the old capped kill traits are replaced',()=>{
  const h=fight('伺夜');h.step();const u=h.b.allyUnits[0],e=h.spawn('enemy_1001_1',{pos:[9,6]});
  const before=DATA.chess[id('伺夜')].garrisonIds;
  assert.equal(growthData(DATA,true).chess[id('伺夜')].garrisonIds.length,2);assert.equal(before.length,3);
  h.b.addBuff(e,{key:'test:def',mods:{defFlat:10000}});let observed;
  h.b.on('damaged',ctx=>{if(ctx.source===u&&ctx.target===e)observed=ctx.type;});
  h.b.dealDamage({source:u,target:e,amount:1000,type:'phys',dodgeMode:'ignore'});assert.equal(observed,'arts');h.b.forceEnd();assert.equal(h.b.result().errors,0);
});

test('Far Tooth permanently stacks source-grade copies on the rightmost same-row operator and never on summons',()=>{
  const s=prep(),f=s.put('远牙'),target=s.put('隐现',false,9,5);s.put('小满',false,10,8);
  s.ps.board.set('9,8',{kind:'token',id:'test-token',uid:888,items:[]});
  s.end();s.end();assert.deepEqual(target.meta.growthDeployGrants,{normal:2,elite:0});
  const view=s.ps.pieceView(target);assert.equal(view.growthGrantedTraits[0].value,8);
  assert.equal(s.ps.sell(f.uid).ok,true);s.h.m.startRound(2);s.h.toPrep(2);
  assert.deepEqual(target.meta.growthDeployGrants,{normal:2,elite:0},'selling the giver does not revoke prior grants');
  const input=s.ps.battleInput();assert.deepEqual(input.growthDeployGrants[target.uid],{normal:2,elite:0});
  const spec=buildBattleSpec({kind:'normal',seed:7,players:[input],flags:{growthMode:true},timeLimit:20});
  const b=createBattleFromSpec(spec,data(),{recordEvents:true});const u=b.allyUnits.find(u=>u.uid===target.uid);
  enable(b,u,['kazimierzShip','preciShip']);b.start();
  assert.equal(layers(b,u,'kazimierzShip'),8);assert.equal(layers(b,u,'preciShip'),8);
  b.retreat(u);assert.equal(b.redeploy(u,{free:true}),true);
  assert.equal(layers(b,u,'kazimierzShip'),16,'each redeployment triggers every retained copy');
  b.forceEnd();const result=b.result();assert.equal(result.errors,0);
  assert.equal(result.perPlayer[s.ps.playerId].layerGains.kazimierzShip,16);
  assert.equal(resultDigest(compactResult(result)).hash,resultDigest(result).hash);
  s.done();
});

test('Far Tooth gifts use highest board repeater, source grade, actual row, and remain separate from native traits',()=>{
  const s=prep();s.put('远牙',true);s.put('塞雷娅',true,10,3);const target=s.put('隐现',false,9,5);
  s.end();assert.deepEqual(target.meta.growthDeployGrants,{normal:0,elite:3});
  const grants=s.ps.pieceView(target).growthGrantedTraits;assert.equal(grants[0].value,24);assert.equal(grants[0].count,3);
  assert.equal(s.ps.gd.chess(target.id).growthTrait.handler,'fixedAspd');s.done();
});

test('elite merges keep all permanent granted copies without converting their source grades',()=>{
  const s=prep(),a=s.put('隐现'),b=s.ps.acquireChess(id('隐现'));
  a.meta.growthDeployGrants={normal:2,elite:1};b.meta.growthDeployGrants={normal:1,elite:2};
  const elite=s.ps.acquireChess(id('隐现'));assert.equal(s.ps.gd.isGolden(elite.id),true);
  assert.deepEqual(elite.meta.growthDeployGrants,{normal:3,elite:3});
  assert.deepEqual(s.ps.pieceView(elite).growthGrantedTraits.map(x=>x.value),[12,24]);s.done();
});

test('all six confirmed combat rewards settle permanently; disabled permanent phases do not secretly retain them',()=>{
  const s=prep();
  s.h.m.lastResults=new Map([[s.ps.playerId,{leaked:[],perfect:true,coins:0,layerGains:{lateranoShip:5,preciShip:10,raidShip:4,kazimierzShip:5,siracusaShip:10,miraShip:5},killed:1,damageDealt:0}]]);
  s.h.m.settle(null,null);s.h.m.startRound(2);s.h.toPrep(2);
  for(const [b,n] of Object.entries({lateranoShip:5,preciShip:10,raidShip:4,kazimierzShip:5,siracusaShip:10,miraShip:5}))assert.equal(s.ps.layers[b],n);
  s.done();
  const h=fight('送葬人',false,{kind:'boss',flags:{growthMode:true,layerGainsEnabled:false}});h.step();const u=h.b.allyUnits[0];
  enable(h.b,u,['lateranoShip','preciShip']);kills(h,u,3);h.b.forceEnd();
  assert.deepEqual(h.b.result().perPlayer[u.ownerId].layerGains,{});assert.equal(layers(h.b,u,'preciShip'),0);
});

test('growth-disabled records and battles retain native caps and no granted-trait fields',()=>{
  assert.equal(growthData(DATA),DATA);assert.equal(DATA.garrisons.growth_grant_deploy_normal,undefined);
  const h=makeBattle({data:new DataSource(DATA),units:[{chessId:id('送葬人'),row:9,col:4}],autoFinish:false});
  h.step();const u=h.b.allyUnits[0];enable(h.b,u,['lateranoShip','preciShip']);kills(h,u,7);
  assert.equal(layers(h.b,u,'preciShip'),3);assert.equal('growthGrantedTraits' in unitStatsEntry(u),false);
  h.b.forceEnd();assert.equal(h.b.result().errors,0);
});
