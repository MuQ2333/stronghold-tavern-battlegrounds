import {readFileSync} from 'node:fs';
import {bossPoolHp,SharedBossPool} from '../server/match/finalAssault.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch,checkInvariants} from './match/harness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {GameData} from '../server/match/gamedata.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {buildNormalWave,buildBossWave} from '../server/match/waves.js';
import {createRng} from '../server/sim/rng.js';
import {PHASE,layerGainRoom} from '../shared/constants.js';
import {bondsWithGains} from '../server/match/bondsMeta.js';
import {helperStats} from '../server/match/unite.js';
import {stripView,playerBonds} from '../public/js/ui/watchBonds.js';
import {parseTestArgs} from '../shared/testMode.js';
import {customSpell} from '../shared/spellCatalog.js';
import {LocalBossPool} from '../server/sim/spec.js';
import {bossFrac,bossPctText,snapHud,fmtNum} from '../public/js/ui/gameLogic/format.js';
import {C2S} from '../shared/protocol.js';

const gd=(raw,mode='mode_single_hard')=>new GameData(raw,mode);
const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;

const curve=JSON.parse(readFileSync(new URL('./fixtures/growth-enemy-curve-20261023.json',import.meta.url),'utf8'));

test('all nine modes match the edited workbook, with native data, defense and movement preserved',()=>{
  const original=JSON.stringify(DATA),changed=growthData(DATA,true);
  for(const key of Object.keys(DATA.config.modes)) {
    const a=gd(DATA,key),b=gd(changed,key),expected=curve.modes[key];
    for(const r of Object.keys(DATA.config.modes[key].enemyScale).map(Number)) {
      const before=a.enemyScale(r),after=b.enemyScale(r),row=expected?.rounds.find(x=>x.round===r);
      if(!row){assert.deepEqual(after,before,key);continue;}
      assert.equal(after.hpMul,row.hp,`${key} R${r} HP`);assert.equal(after.atkMul,row.atk,`${key} R${r} ATK`);
      assert.equal(after.speedMul,before.speedMul);assert.equal(row.def,1);
    }
    for(const id of Object.keys(DATA.bosses))for(const n of [1,2,3,4]) {
      const old=a.bossPoolHp(id,n);let wanted=old;
      if(expected)wanted=old*100;
      assert.equal(b.bossPoolHp(id,n),wanted,`${key}/${id}/${n}`);assert.equal(bossPoolHp(b,id,n),wanted);
    }
  }
  assert.equal(JSON.stringify(DATA),original,'source data remains immutable');
});

test('waves apply edited HP/ATK and early counts while keeping action identity and time windows',()=>{
  for(const key of Object.keys(curve.modes)) {
    const a=gd(DATA,key),b=gd(growthData(DATA,true),key),solo=key.startsWith('mode_single');
    const h=makeMatch({mode:solo?'solo':'coop',difficulty:key.endsWith('abyss')?'ABYSS':'HARD',growthMode:true,fake:true});
    try {
      for(let r=1;r<=15;r++) {
        const build=d=>r<14?buildNormalWave(d,createRng(42),h.m.factions,r):buildBossWave(d,createRng(42),h.m.factions,r,{bossId:r===14?'boss_1':'boss_10',solo});
        const before=build(a),after=build(b);assert.equal(after.spawns.length,before.spawns.length);
        after.spawns.forEach((spawn,i)=>{
          const orig=before.spawns[i],scale=b.enemyScale(r),mods={...spawn.mods};
          if(Object.hasOwn(orig.mods,'hpMul')) {assert.equal(mods.hpMul,scale.hpMul);mods.hpMul=orig.mods.hpMul;}
          assert.equal(mods.atkMul,scale.atkMul);mods.atkMul=orig.mods.atkMul;
          if(Object.hasOwn(orig.mods,'supplyHpMul'))mods.supplyHpMul=orig.mods.supplyHpMul;
          if(r>=2&&r<=5){assert.ok(spawn.count>=1&&spawn.count<=orig.count);assert.ok(Math.abs(spawn.count*spawn.interval-orig.count*orig.interval)<1e-8);}
          assert.deepEqual({...spawn,mods,...(r>=2&&r<=5?{count:orig.count,interval:orig.interval}:{})},orig);
        });
      }
    }finally{h.m.dispose();}
  }
});

test('multi ABYSS separate hit-count durability stays at workbook values in real enemy spawning',()=>{
  const a=gd(DATA,'mode_multi_abyss'),b=gd(growthData(DATA,true),'mode_multi_abyss');
  for(const row of curve.modes.mode_multi_abyss.times) {
    const scale=b.enemyScale(row.round);assert.ok(Math.abs(scale.hpMul/(scale.supplyHpMul||1)-row.hp)<1e-8);
    const spawn=d=>{const h=makeBattle({autoFinish:false});h.step();const e=h.spawn('enemy_1196_msfyin',{pos:[9,8],mods:d.enemyScale(row.round)});h.b.forceEnd();assert.equal(h.b.result().errors,0);return e.s.maxHp;};
    assert.equal(spawn(a),spawn(b));
  }
});

test('growth real final/hidden pools use living-player count and preserve values above signed 32-bit range',()=>{
  for(const difficulty of ['HARD','ABYSS'])for(const hidden of [false,true]) {
    const h=makeMatch({humans:4,difficulty,growthMode:true,fake:true,instant:false}).start();h.toPrep(1);
    const m=h.m;m.onLeave('p_3');m.round=hidden?15:14;m.bossId='boss_1';m.hiddenBossId='boss_10';m.teamLp=50;m._planBossWaves();m.startFinalAssault(hidden);
    const id=hidden?'boss_10':'boss_1',expected=DATA.bosses[id].bloodPoint[difficulty]*3*100;
    assert.equal(m.bossPool.maxHp,expected);m.dispose();
  }
  const max=gd(growthData(DATA,true),'mode_multi_abyss').bossPoolHp('boss_10',4);assert.equal(max,3040000000);
  const pool=new SharedBossPool(max);pool.damage('p1',100000000);assert.equal(pool.hp,2940000000);
});

test('boss client prediction, JSON synchronization and HUD preserve values across both 32-bit boundaries',()=>{
  for(const max of [2147483648,3040000000,4294967296,1000000000000]) {
    assert.equal(C2S['b.progress'].bossDmg(max),true);
    assert.equal(C2S['b.progress'].by({p1:max}),true);
    const server=new SharedBossPool(max),client=new LocalBossPool(max);
    assert.equal(client.damage('p1',1),1);assert.equal(client.hp,max-1);
    server.damage('p1',1);
    const packet=JSON.parse(JSON.stringify({hp:server.hp,max:server.maxHp,acked:client.cum}));
    client.sync(packet.hp,packet.acked);assert.equal(client.hp,max-1);
    const hud=snapHud({boss:packet});assert.equal(hud.boss.hp,max-1);assert.equal(hud.boss.max,max);
    assert.equal(bossFrac(hud.boss),(max-1)/max);assert.equal(bossPctText(bossFrac(hud.boss)),'100%');
    assert.notEqual(fmtNum(max),'—');assert.ok(!fmtNum(max).startsWith('-'));
    const hit=2147483648;assert.equal(client.damage('p1',hit),Math.min(hit,max-1));
    server.damage('p1',hit);client.sync(server.hp,client.cum);assert.equal(client.hp,Math.max(0,max-1-hit));
    if(server.hp>0){client.damage('p1',server.hp);server.damage('p1',server.hp);}
    client.sync(server.hp,client.cum);assert.equal(client.hp,0);assert.equal(server.hp,0);
  }
});

test('growth prep gains, milestones, pending views, helper scoring and invariant checks all pass 999; stock stays capped',()=>{
  for(const growthMode of [false,true]) {
    const h=makeMatch({mode:'solo',growthMode,fake:true});h.start();h.toPrep(1);
    try {
      const ps=h.ps('p_0');ps.bandId=null;ps.layers.yanShip=995;ps.recompute();
      assert.equal(ps.addLayers('yanShip',1005),growthMode?1005:4);
      assert.equal(ps.layers.yanShip,growthMode?2000:999);
      ps.pendingLayerGains={yanShip:25};
      assert.equal(ps.bondsView().yanShip.layers,growthMode?2025:999);
      ps.bonds.yanShip.active=true;
      const score=helperStats(h.m,ps,new Map());assert.ok(score.layers>=(growthMode?2025:999));
      ps.recompute();checkInvariants(h.m);
      assert.equal(layerGainRoom(1200,5,growthMode),growthMode?5:0);
      const args={id:'yanShip',layers:5000};assert.equal(!!parseTestArgs('bond',args,growthMode).args,growthMode);
      assert.equal(bondsWithGains(ps.bonds,{yanShip:10},growthMode).yanShip.layers,growthMode?2010:999);
    } finally {h.m.dispose();}
  }
});

test('actual growth battle and settlement retain all gains above 999 without capping or double credit',()=>{
  const h=makeMatch({mode:'solo',growthMode:true,fake:true,script:b=>b.round===1?{layerGains:{p_0:{yanShip:500}}}:{}}).start();h.toPrep(1);
  try {
    const ps=h.ps('p_0');ps.layers.yanShip=1500;ps.recompute();
    h.drive(()=>h.m.phase===PHASE.SETTLE);assert.equal(ps.layers.yanShip,2000);checkInvariants(h.m);
  } finally {h.m.dispose();}
  for(const growthMode of [false,true]) {
    const f=makeBattle({data:new DataSource(growthMode?growthData(DATA,true):DATA),flags:{growthMode,layerGainsEnabled:true},
      units:[{chessId:id('角峰'),row:10,col:3}],bonds:{yanShip:{active:true,count:3,tier:1,layers:995}},autoFinish:false});
    f.step();assert.equal(f.b.addLayers('p1','yanShip',100),growthMode?100:4);
    assert.equal(f.b.getPlayer('p1').bonds.yanShip.layers,growthMode?1095:999);
    f.b.forceEnd();assert.equal(f.b.result().perPlayer.p1.layerGains.yanShip,growthMode?100:4);assert.equal(f.b.result().errors,0);
  }
});

test('live own and teammate bond strips show uncapped growth counts; native live counts remain capped',()=>{
  for(const growthMode of [false,true]) {
    const base={bondId:'yanShip',active:true,count:3,tier:1,layers:990};
    const pub={growthMode,players:[{playerId:'p1',bonds:[base]}]},priv={bonds:[base]},live={p1:{yanShip:1600}};
    assert.equal(stripView({pub,priv,myId:'p1',live}).bonds[0].layers,growthMode?1600:999);
    assert.equal(playerBonds({pub,priv,myId:'p2',ownerId:'p1',live})[0].layers,growthMode?1600:999);
  }
  assert.doesNotMatch(customSpell('mod_sharing_care',true).desc,/999/);
  assert.match(customSpell('mod_sharing_care').desc,/999/);
});


test('Forge mode inputs keep untouched values and custom bosses use the confirmed pool rule once',()=>{
  const raw=structuredClone(DATA);
  raw.config.modes.mode_single_hard.enemyScale['1']={hp:1.7,atk:1.9,speed:1.3};
  raw.config.modes.mode_multi_abyss.enemyScale['9']={hp:10,atk:7,speed:1.8,supplyHp:2};
  raw.config.modes.mode_forge_probe=structuredClone(raw.config.modes.mode_single_hard);
  raw.bosses.forge_boss={...raw.bosses.boss_1,bloodPoint:{...raw.bosses.boss_1.bloodPoint,HARD:12345}};
  const before=JSON.stringify(raw),modified=growthData(raw,true);
  assert.deepEqual(gd(modified).enemyScale(1),{hpMul:1.7,atkMul:1.9,speedMul:1.3});
  assert.deepEqual(gd(modified,'mode_forge_probe').enemyScale(9),gd(raw,'mode_forge_probe').enemyScale(9));
  const multi=gd(modified,'mode_multi_abyss').enemyScale(9);
  assert.equal(multi.hpMul,8);assert.equal(multi.atkMul,1.8);assert.equal(multi.speedMul,1.8);
  assert.equal(multi.hpMul/multi.supplyHpMul,5,'untouched hit-count durability follows the Forge input');
  const custom=gd(modified);assert.equal(custom.bossPoolHp('forge_boss',1),1234500);assert.equal(bossPoolHp(custom,'forge_boss',1),1234500);
  assert.equal(JSON.stringify(raw),before);
});
