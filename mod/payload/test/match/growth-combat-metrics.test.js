import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
import {attachFieldMetrics,emitFieldMetrics} from '../../server/match/combatMetrics.js';
import {createMetricArchive} from '../../public/js/battle/metricArchive.js';
import {trackCombat} from '../../shared/combatMetrics.js';
import {SharedBossPool} from '../../server/match/finalAssault.js';
import {FieldRunner} from '../../server/match/fields.js';
import {makeMatch} from './harness.js';

test('growth boss and hidden hits above 300000 land and meter only effective pool loss; native cancels them',()=>{
 for(const kind of ['boss','hidden'])for(const growthMode of [false,true]) {
  const h=makeBattle({defs:{chess:{op:chessRec({id:'op',stats:{atk:0},skill:null})},enemies:{enemy_test:enemyRec({key:'enemy_test',hp:1e10,def:0,speed:0,atk:0})}},units:[{chessId:'op',row:9,col:4}],enemies:[{key:'enemy_test',pos:[9,6]}],content:'none',autoFinish:false,hooks:[]});
  h.b.flags.growthMode=growthMode;h.b.kind=kind;const read=trackCombat(h.b);h.step();
  const e=h.enemy('enemy_test');e.isBoss=true;h.b.sharedBoss=new SharedBossPool(3040000000);e.bossPool=h.b.sharedBoss;
  h.b.dealDamage(h.unit('op'),e,{amount:3000000000,type:'true'});
  assert.equal(h.b.sharedBoss.hp,growthMode?40000000:3040000000);
  assert.equal(read().rows[0].damage,growthMode?3000000000:0);
  if(growthMode){h.b.dealDamage(h.unit('op'),e,{amount:3000000000,type:'true'});assert.equal(h.b.sharedBoss.hp,0);assert.equal(read().rows[0].damage,3040000000);}
  h.b.forceEnd();
 }
});

test('streamed meter samples effective damage, sends owners even offscreen, throttles and sends final frame',()=>{
 const h=makeBattle({defs:{chess:{op:chessRec({id:'op',stats:{atk:0},skill:null})},enemies:{enemy_test:enemyRec({key:'enemy_test',hp:1e10,def:0,speed:0,atk:0})}},units:[{chessId:'op',row:9,col:4}],enemies:[{key:'enemy_test',pos:[9,6]}],content:'none',autoFinish:false,hooks:[]});
 const sent=[],ps={lp:40,shop:{level:3},stats:{},layers:{},board:new Map()};
 const m={growthMode:true,players:new Map([['p1',ps]]),gameSpeed:2,roomCode:'TEST',battlePrefix:'seed',round:2,sendTo:(pid,msg)=>sent.push([pid,msg])};
 const f={battle:h.b,players:['p1'],fieldId:'n:p1',kind:'normal',live:true};attachFieldMetrics(m,f);h.step();
 h.b.dealDamage(h.unit('op'),h.enemy('enemy_test'),{amount:3e9,type:'true'});emitFieldMetrics(m,f);
 assert.equal(sent.length,1);assert.equal(sent[0][0],'p1');assert.equal(sent[0][1].record.rows[0].damage,3e9);
 emitFieldMetrics(m,f);assert.equal(sent.length,1);h.b.time+=2;emitFieldMetrics(m,f);assert.equal(sent.length,2);
 f.live=false;emitFieldMetrics(m,f);assert.equal(sent.length,3);assert.equal(sent[2][1].done,true);
 assert.equal(sent[2][1].record.rows.length,1);h.b.forceEnd();
 const disabled={...f,metricRead:null};attachFieldMetrics({...m,growthMode:false},disabled);assert.equal(disabled.metricRead,null);
});

test('archive replaces cumulative packets, restores history, filters battles and safely exports comparison CSV',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},a=createMetricArchive(storage);
 const msg={matchKey:'m1',battleKey:'2.n',round:2,done:true,modeId:'mode_single_hard',record:{seconds:10,owners:['p1'],rows:[{key:'u',ownerId:'p1',kind:'op',name:'=unsafe',defId:'forge_unit',damage:100,healing:0,types:{phys:100,arts:0,true:0,elemental:0}}]}};
 a.ingest(msg);a.ingest(msg);assert.equal(a.combatMetrics({scope:'match'}).damage,100);
 a.annotate('m1',{main:'kazdelShip',note:'第一次,测试'});
 a.ingest({...msg,battleKey:'3.n',round:3});assert.equal(a.combatMetrics({scope:'match'}).damage,200);
 const restored=createMetricArchive(storage);assert.equal(restored.sessions()[0].main,'kazdelShip');
 assert.equal(restored.combatMetrics({sessionKey:'m1',battleKey:'2.n'}).damage,100);
 assert.match(restored.csv(),/'=unsafe/);assert.match(restored.csv(),/kazdelShip/);
 assert.equal(JSON.parse(restored.json()).sessions[0].battles.length,2);
});

test('forced field ending flushes final metrics before settlement and reconnect replays only the owner history',t=>{
 const h=makeMatch({mode:'solo',growthMode:true,test:true});t.after(()=>h.m.dispose());h.start();h.toPrep();
 const m=h.m,ps=h.ps('p_0'),battle=m._normalBattle(ps);
 const f={fieldId:'n:p_0',kind:'normal',players:['p_0'],battle,live:true};m.fields=[f];
 let done=false;
 const runner=new FieldRunner(m,[f],{onDone(){done=true;assert.equal(h.lastTo('p_0','m.combatMetrics').done,true);}});
 battle.start();battle.time=0.2;runner.forceAll('forced');assert.ok(done);
 const packet=h.lastTo('p_0','m.combatMetrics');assert.equal(packet.result.reason,'forced');
 assert.equal(packet.record.seconds,0.2);assert.equal(m.publicView().combatMetricsMatchKey,packet.matchKey);
 h.sent.length=0;m.onReconnect('p_0');assert.deepEqual(h.lastTo('p_0','m.combatMetrics'),packet);
 h.sent.length=0;m._resync({playerId:'outsider',spectator:true});assert.equal(h.lastTo('outsider','m.combatMetrics'),null);
});

test('telemetry errors cannot abort field completion or gameplay',()=>{
 const h=makeBattle({autoFinish:false}),sent=[],ps={lp:1,shop:{level:1},board:new Map()};
 const m={growthMode:true,players:new Map([['p1',ps]]),gameSpeed:2,sendTo:(pid,msg)=>sent.push(msg),markPublic(){},reportError:assert.fail,sched:{clearInterval(){}}};
 const f={fieldId:'x',kind:'normal',players:['p1'],battle:h.b};let finished=false;
 const runner=new FieldRunner(m,[f],{onDone(){finished=true;}});h.b.start();f.metricRead=()=>{throw new Error('broken observer');};
 assert.doesNotThrow(()=>runner.forceAll());assert.equal(finished,true);
});

test('replayed older rounds sort chronologically, final packets cannot regress, and empty-board rounds remain in CSV',()=>{
 const a=createMetricArchive({getItem:()=>null,setItem(){}});
 const msg={matchKey:'old',battleKey:'3.normal',round:3,kind:'normal',done:true,record:{seconds:10,owners:['p1'],rows:[]}};
 a.ingest(msg);a.ingest({...msg,battleKey:'2.normal',round:2});
 assert.equal(a.sessions()[0].battles.at(-1).round,3);
 a.ingest({...msg,done:false});assert.equal(a.sessions()[0].battles.at(-1).done,true);
 assert.equal(a.csv().split('\r\n').length,3,'one exported row per empty battle');
 a.setCurrent('new');assert.equal(a.combatMetrics({scope:'match'}).damage,0);assert.equal(a.current(),'new');
 a.ingest(msg);assert.equal(a.current(),'new','replayed old match does not replace the active match');
});

test('malformed local battle entries are isolated; unavailable storage reports failure and export remains usable',()=>{
 const broken={key:'bad',coreBonds:{not:'array'},battles:[{battleKey:'x',record:{seconds:10,owners:['p1'],rows:[{}]}}]};
 const a=createMetricArchive({getItem:()=>JSON.stringify([broken]),setItem(){}});
 assert.equal(a.sessions()[0].battles.length,0);assert.doesNotThrow(()=>a.csv());
 const b=createMetricArchive(null);b.ingest({matchKey:'memory',battleKey:'1',round:1,done:true,record:{seconds:1,owners:['p1'],rows:[]}});
 assert.equal(b.storageFailed(),true);assert.equal(JSON.parse(b.json()).sessions.length,1);
});
