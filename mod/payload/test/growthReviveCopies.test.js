import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {triggerDeathTraits,hasDeathTrait} from '../server/sim/content/garrisons/growthTriggers.js';
import {unitInfo} from '../server/sim/snapshot.js';
import {unitStatsEntry} from '../shared/protocol.js';
import {renderInfo} from '../public/js/render/app/info.js';
import {summonedScale} from '../public/js/render/summonedScale.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const active=layers=>({active:true,count:1,tier:1,layers});
const indomBb=growthData(DATA,true).bonds.indomShip.bb;
const indomLayers=(1-indomBb.base_prob)/indomBb.prob_per_stack;
for(const name of ['深巡','乌尔比安'])for(const elite of [false,true])test(`${name}/${elite} artificial replay creates base copies without the revival trait; Indom preserves their remaining traits`,()=>{
 const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},autoFinish:false,
  units:[{uid:1,chessId:id(name,elite),row:10,col:3,items:['chess_item_1_01_e_a']},{uid:2,chessId:id('隐德来希'),row:12,col:5}],
  bonds:{egirShip:active(20),indomShip:active(indomLayers)}});h.step();const source=h.unit(1);
 h.b.addBuff(source,{key:'copy-audit',mods:{atkFlat:777},duration:100});const before=source.s.atk;
 triggerDeathTraits(h.b,source);const copies=h.b.allyUnits.filter(u=>u.growthSummoner===source);
 assert.equal(copies.length,2);assert.equal(source.alive,true);assert.equal(source.s.atk,before);assert.equal(hasDeathTrait(source),true);
 for(const c of copies){
  assert.equal(c.defId,source.defId);assert.deepEqual(c.items,[]);assert.equal(c.findBuff('copy-audit'),null);
  assert.equal(hasDeathTrait(c),false);assert.equal(c.growthReviveDisabled,true);
  const half=c.findBuff('growth:reviveHalf');assert.equal(!!half,name==='深巡'&&!elite);
  if(half)assert.deepEqual(half.mods,{atkMul:0.5,defMul:0.5,hpMul:0.5});
  assert.equal(summonedScale(renderInfo(unitInfo(c))),0.8);assert.equal(unitStatsEntry(c,c.s).growthReviveDisabled,true);
  const count=h.b.allyUnits.length;triggerDeathTraits(h.b,c);assert.equal(h.b.allyUnits.length,count);
 }
 assert.equal(summonedScale(renderInfo(unitInfo(source))),1);
 const c=copies[0];h.b.rng=()=>0.75;h.b.kill(c);assert.equal(c.alive,true,'first Indom succeeds without a trait revival');
 assert.equal(hasDeathTrait(c),false);assert.equal(c.growthReviveDisabled,true);assert.equal(summonedScale(unitInfo(c)),0.8);
 if(name==='乌尔比安'){
  const e=h.spawn('enemy_1001_1',{pos:[10,8]});const hits=[];h.b.on('hit',ctx=>{if(ctx.source===c)hits.push(ctx.dmg.mul);},{priority:-1000});
  h.b.dealDamage(c,e,{amount:1,type:'arts',canDodge:false});assert.ok(hits[0]>1,'damage-growth component survives Indom');
 }
 h.step();h.b.kill(c);assert.equal(c.removed,true,'second Indom fails; no extra trait revival');
 h.b.kill(source);assert.equal(source.alive,true,'original still has its own once-per-battle revival');
 h.invariants();h.b.forceEnd();assert.equal(h.b.result().errors,0);
});

test('copy attempts with no legal position leave the source alive and do not create units',()=>{
 const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},autoFinish:false,
  units:[{uid:1,chessId:id('深巡'),row:10,col:3}]});h.step();
 h.b.grid.canStand=()=>false;triggerDeathTraits(h.b,h.unit(1));assert.equal(h.b.allyUnits.length,1);assert.equal(h.unit(1).alive,true);h.b.forceEnd();assert.equal(h.b.result().errors,0);
});
