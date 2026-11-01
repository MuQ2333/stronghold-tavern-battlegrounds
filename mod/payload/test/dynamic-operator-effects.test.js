import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {makeBattle,chessRec,enemyRec} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData} from '../shared/growthMode.js';
import {setGameData} from '../server/sim/content/support/index.js';

afterEach(()=>setGameData(null));
const active=(layers=10)=>({active:true,count:6,tier:2,layers});
function setup(bond,{growth=false,extra={},record={}}={}){
 const a=chessRec({id:'dynamic_base',bonds:[bond],skill:null,stats:{atk:100}});
 const u={...chessRec({id:'dynamic_late',bonds:[bond],skill:null,stats:{atk:100}}),...record};
 const base=growth?growthData(DATA,true):DATA;
 const data={...base,...extra,chess:{...base.chess,[a.chessId]:a,[u.chessId]:u},enemies:{...base.enemies,dummy:enemyRec({key:'dummy',hp:1e8,atk:0,def:0,res:0,speed:0})}};
 setGameData(data);
 const h=makeBattle({data:new DataSource(data),flags:{growthMode:growth},units:[{chessId:a.chessId,row:10,col:3}],bonds:{[bond]:active()},autoFinish:false,captureNoisy:true});h.step();
 const late=(items=[])=>{const p=h.b.players[0],x=h.b._createAllyFromInput(p,{chessId:u.chessId,row:11,col:3,uid:100,items});h.b._setupUnit(x);assert.equal(h.b._deploy(x),true);return x;};
 return {h,late};
}
const done=h=>{h.invariants();h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify(h.b.errors));};

for(const growth of [false,true])test(`late Kjerag cold amplification survives revival and movement exactly once (growth=${growth})`,()=>{
 const {h,late}=setup('kjeragShip',{growth}),u=late(),e=h.spawn('dummy',{pos:[10,7]});h.b.applyStatus(e,'cold',{duration:60});
 const hit=()=>{const before=e.hp;h.b.dealDamage(u,e,{amount:100,type:'arts',canDodge:false});return before-e.hp;};
 assert.ok(Math.abs(hit()-145)<1e-6);
 for(let i=0;i<3;i++){h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);assert.ok(Math.abs(hit()-145)<1e-6);}
 assert.equal(h.b.moveRedeploy(u,11,4),true);assert.ok(Math.abs(hit()-145)<1e-6);done(h);
});

test('late Siracusa receives the real extra damage proc rather than only the deployment buff',()=>{
 const {h,late}=setup('siracusaShip',{growth:true}),u=late(),e=h.spawn('dummy',{pos:[10,7]});h.b.rng=()=>0;
 const before=e.hp;h.b.dealDamage(u,e,{amount:100,type:'phys',isAttack:true,canDodge:false});
 assert.ok(before-e.hp>100);assert.ok(e.findBuff('fear'));done(h);
});

test('late Kazimierz receives true damage and later redeploys do not duplicate the callback',()=>{
 const {h,late}=setup('kazimierzShip',{growth:true}),u=late(),e=h.spawn('dummy',{pos:[10,7]});
 const hit=()=>{const start=h.hooksOf('damaged').length;h.b.dealDamage({source:u,target:e,amount:100,type:'phys',attackType:'NORMAL',dodgeMode:'ignore'});return h.hooksOf('damaged').slice(start).filter(c=>c.source===null&&c.credit===u&&c.dmg.tags?.includes('bond:kazimierz')).length;};
 assert.equal(hit(),1);h.b.retreat(u);h.b.redeploy(u);assert.equal(hit(),1);done(h);
});

test('late Laterano member inherits the already accumulated ammo ATK bonus',()=>{
 const {h,late}=setup('lateranoShip',{growth:true}),a=h.b.allyUnits[0];
 for(let i=0;i<3;i++)h.b.emit('ammoUsed',{unit:a});const u=late();
 assert.deepEqual(u.findBuff('bond:laterano:ammo').mods,a.findBuff('bond:laterano:ammo').mods);done(h);
});

test('late Victoria member receives equipment multiplier, upper-tier ATK and the actual equipped item',()=>{
 const {h,late}=setup('victoriaShip',{growth:true}),u=late(['chess_item_1_01_e_a']);
 assert.ok(u.findBuff('bond:victoria'));assert.ok(u.findBuff('bond:victoria:atk'));
 assert.ok(u.buffs.some(b=>b.key.includes('item')),'equipped effects are installed before deployment');done(h);
});

for(const growth of [false,true])test(`late namespaced native-style garrisons initialize once and keep firing after redeploy (growth=${growth})`,()=>{
 const passive={garrisonId:'forge:late:passive',eventType:'IN_BATTLE',effectKey:'GAIN_BUFF',bb:{atk:1.5},bbStr:{}};
 const skill={garrisonId:'forge:late:skill',eventType:'IN_BATTLE',effectKey:'act1autochess_gar_event_useskill',bb:{bond_add_count:2},bbStr:{bond_id:'yanShip'}};
 const {h,late}=setup('yanShip',{growth,extra:{garrisons:{...DATA.garrisons,[passive.garrisonId]:passive,[skill.garrisonId]:skill}},record:{garrisonIds:[passive.garrisonId,skill.garrisonId]}});
 const u=late();assert.equal(u.findBuff('gar:forge:late:passive').mods.atkMul,1.5);
 const layers=()=>h.b.players[0].bonds.yanShip.layers;const before=layers();
 h.b.emit('skillStart',{unit:u,skill:u.skill});assert.equal(layers(),before+2);
 h.b.retreat(u);h.b.redeploy(u);h.b.emit('skillStart',{unit:u,skill:u.skill});assert.equal(layers(),before+4);done(h);
});

test('Forge DSL deploy talents fire on each real deployment without duplicate kit installation',()=>{
 const {h,late}=setup('deputShip',{record:{pluginId:'late-audit',dsl:{dsl:1,talents:[{when:'deploy',do:[{dp:{amount:2}}]},{when:'always',do:[{dp:{amount:3}}]}]}}});
 const before=h.b.players[0].dp,u=late();assert.ok(Math.abs(h.b.players[0].dp-before-5)<1e-7);
 h.b.retreat(u);const next=h.b.players[0].dp;h.b.redeploy(u);assert.ok(Math.abs(h.b.players[0].dp-next-2)<1e-7);
 const move=h.b.players[0].dp;h.b.moveRedeploy(u,11,4);assert.ok(Math.abs(h.b.players[0].dp-move-2)<1e-7);done(h);
});
