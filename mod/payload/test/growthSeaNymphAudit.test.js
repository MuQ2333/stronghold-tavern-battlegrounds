import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {triggerDeathTraits} from '../server/sim/content/garrisons/growthTriggers.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const active=(layers=0,tier=1)=>({active:true,count:tier===2?3:1,tier,layers});
const raw=growthData(DATA,true);
const indomBb=raw.bonds.indomShip.bb;
const indomLayers=(1-indomBb.base_prob)/indomBb.prob_per_stack;
function setup(candidate,{elite=false,extra=[],bonds={},kind='normal'}={}) {
  const h=makeBattle({data:new DataSource(raw),kind,flags:{growthMode:true,layerGainsEnabled:true},autoFinish:false,
    players:[{playerId:'p1',units:[{uid:1,chessId:id('海霓',elite),row:10,col:3,dir:'RIGHT'},
      ...extra.map((name,i)=>({uid:i+2,chessId:id(name.replace('精锐',''),name.startsWith('精锐')),row:12,col:3+i*2,dir:'RIGHT'}))],
      bonds,growthEgirPool:[id(candidate)]}]});
  h.step();const parent=h.unit(1);
  const summon=()=>{const n=h.b.allyUnits.length;triggerDeathTraits(h.b,parent);return h.b.allyUnits.slice(n).filter(u=>u.growthSummoner===parent);};
  return {h,parent,summon};
}
function done(h){h.invariants();h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify(h.b.errors));}

for(const elite of [false,true])test(`all nine Sea Nymph candidates (${elite?'elite':'normal'}) cast their own real skill and receive live alliance updates`,()=>{
  const candidates=GROWTH_ROSTER.filter(r=>r.main==='阿戈尔'&&r.name!=='海霓');assert.equal(candidates.length,9);
  for(const row of candidates) {
    const {h,summon}=setup(row.name,{elite,bonds:{egirShip:active(200),steadShip:active(20),deputShip:active(20)}});
    const [u]=summon();assert.ok(u,row.name);assert.equal(u.defId,id(row.name,elite));
    assert.equal(u.skill.id,raw.chess[u.defId].skill.skillId);
    assert.ok(u.kit.skill||u.kit.skills,row.name);assert.ok(u.findBuff('bond:egir'));assert.ok(u.findBuff('bond:steadShip'));assert.ok(u.findBuff('bond:deputShip'));
    const before=u.findBuff('bond:egir').mods.atkPct;
    h.b.addLayers('p1','egirShip',100,'audit',{temporary:true});h.step(2);
    assert.ok(u.findBuff('bond:egir').mods.atkPct>before,row.name);
    if(u.skill.active)u.skill.end('audit');
    const foe=h.spawn('enemy_1001_1',{pos:[u.tileR,u.tileC+1]});
    foe.base.maxHp=1000000;foe.base.atk=0;foe.base.moveSpeed=0;foe.markDirty();foe.hp=foe.s.maxHp;h.step();
    const casts=h.hooksOf('skillStart').filter(c=>c.unit===u).length;
    u.skill.activate('audit',{free:true});
    assert.ok(h.hooksOf('skillStart').filter(c=>c.unit===u).length>casts||u.skill.active,`${row.name} casts its real skill`);
    h.run(3);assert.ok(u.stats.dmg>0,`${row.name} deals real attack or skill damage`);done(h);
  }
});

test('a fielded Skadi talent reaches later Sea Nymph summons',()=>{
  const {h,summon}=setup('幽灵鲨',{extra:['斯卡蒂']});const [u]=summon();
  assert.ok(u.findBuff('talent:skadi_predator'),'late hunter receives the existing team talent');done(h);
});

test('a summoned Specter alter applies her team HP talent to existing and later hunters',()=>{
  const {h,summon}=setup('归溟幽灵鲨',{extra:['幽灵鲨']});const [u]=summon();
  assert.ok(u.findBuff('ghost2:abyss'),'new source receives her own team HP');
  assert.ok(h.unit(2).findBuff('ghost2:abyss'),'existing hunter receives the new team HP');
  h.b.getPlayer('p1').input.growthEgirPool=[id('乌尔比安')];const [later]=summon();
  assert.ok(later.findBuff('ghost2:abyss'),'later hunter receives the team HP');done(h);
});

test('a fielded Specter alter team HP talent reaches later hunters',()=>{
  const {h,summon}=setup('幽灵鲨',{extra:['归溟幽灵鲨']});const [u]=summon();
  assert.ok(u.findBuff('ghost2:abyss'));done(h);
});

test('multiple Indre copies multiply summons and summoned Skadi death traits, but not successful Indom revival',()=>{
  const {h,parent}=setup('斯卡蒂',{extra:['隐德来希','精锐隐德来希'],bonds:{indomShip:active(indomLayers,2)}});
  h.b.kill(parent);const children=h.b.allyUnits.filter(u=>u.growthSummoner===parent);assert.equal(children.length,4);
  assert.equal(new Set(children.map(u=>`${u.tileR},${u.tileC}`)).size,4);
  for(const u of children){h.b.kill(u);assert.equal(u.alive,true);}
  assert.equal(h.b._pp('p1').growthFreeRefreshes,16);
  assert.equal(parent.alive,false);assert.equal(parent.growthIndomPending,true);
  const first=children[0];h.b.retreat(first,{permanent:true});h.step();
  assert.equal(parent.alive,true);assert.equal(parent.growthIndomPending,undefined);done(h);
});

test('summoned operators have independent Indom decay; a failed second roll removes only that summon',()=>{
  const {h,summon}=setup('斯卡蒂',{bonds:{indomShip:active(indomLayers)}});
  const [a]=summon(),[b]=summon();h.b.rng=()=>0.75;
  h.b.kill(a);assert.equal(a.alive,true);h.step();h.b.kill(a);assert.equal(a.removed,true);
  h.b.kill(b);assert.equal(b.alive,true,'its first chance was not reduced by the other copy');done(h);
});

for(const name of ['深巡','乌尔比安'])test(`summoned ${name} uses its one-shot trait before Indom, despite Indre repetition`,()=>{
  const {h,summon}=setup(name,{extra:['精锐隐德来希'],bonds:{indomShip:active(indomLayers)}});const [u]=summon();
  const stats={atk:u.s.atk,def:u.s.def,hp:u.s.maxHp};h.b.rng=()=>0.75;
  h.b.kill(u);assert.equal(u.alive,true);
  for(const [key,stat] of [['atk','atk'],['def','def'],['hp','maxHp']])assert.equal(u.s[stat],stats[key]*(name==='深巡'?0.5:1));
  h.step();h.b.kill(u);assert.equal(u.alive,true,'first Indom still has full chance after trait revive');
  h.step();h.b.kill(u);assert.equal(u.removed,true,'next Indom chance halved');done(h);
});

test('a summoned Skadi alter does not replay battle-start traits in mid-combat',()=>{
  const {h,summon}=setup('浊心斯卡蒂',{extra:['斯卡蒂']});const before=h.b._pp('p1').growthFreeRefreshes||0;
  summon();h.step();assert.equal(h.b._pp('p1').growthFreeRefreshes||0,before);done(h);
});


test('summoned Blue Poison spreads independent death traits, completes Indre repeats before consuming copies, and can revive',()=>{
  const {h,summon}=setup('蓝毒',{extra:['隐德来希'],bonds:{egirShip:active(20),indomShip:active(indomLayers)}});
  const [a,b]=summon();h.b.rng=()=>0.99;
  h.b.kill(a);assert.equal(a.alive,true);assert.equal(b.growthDeathCopies.normal,2);
  assert.equal(h.b.players[0].bonds.egirShip.layers,28);
  h.b.kill(b);assert.equal(b.alive,true);assert.equal(b.growthDeathCopies.normal,0);
  assert.equal(h.b.players[0].bonds.egirShip.layers,52,'own trait plus two copies, each repeated twice');
  h.b.forceEnd();assert.deepEqual(h.b.result().perPlayer.p1.layerGains,{});assert.equal(h.b.result().errors,0);
});

test('summoned Specter alter skill switches preserve its observer ramp and banked Indom without Indre multiplication',()=>{
  const {h,summon}=setup('归溟幽灵鲨',{extra:['精锐隐德来希'],bonds:{egirShip:active(20),indomShip:active(indomLayers)}});
  const [u,...others]=summon();for(const a of others)h.b.retreat(a,{permanent:true});
  assert.equal(u.growthTraitLive.value,2);assert.equal(u.skill.activate('audit',{free:true}),true);
  u.skill.end('normal');assert.equal(u.trait.doll,true);assert.equal(u.mem.indomFreeDeploy,true);
  assert.equal(h.b.players[0].bonds.egirShip.layers,22);assert.equal(u.growthTraitLive.value,4);
  h.b.removeBuff(u,'trait:substitute');assert.equal(u.trait.doll,false);
  assert.equal(h.b.players[0].bonds.egirShip.layers,26);assert.equal(u.growthTraitLive.value,6);
  h.b.rng=()=>0.75;h.step();h.b.kill(u);assert.equal(u.alive,true,'banked grant is consumed without reroll');
  assert.equal(u.mem.indomFreeDeploy,false);assert.equal(u.growthTraitLive.value,8);
  h.step();h.b.kill(u);assert.equal(u.removed,true,'one success has already halved this operator chance');done(h);
});

test('Indom tier-two SP rewards include late summoned recipients',()=>{
  const {h,summon}=setup('幽灵鲨',{extra:['隐德来希'],bonds:{indomShip:active(indomLayers,2)}});
  const [a,b]=summon();b.skill.setSpTotal(0);h.b.kill(a);
  assert.equal(b.skill.sp,5,'SP reward happens once per actual defeat, not once per Indre repetition');done(h);
});


test('summoned Skadi participates in an already-active Raid relocation and its stat buff',()=>{
  const {h,summon}=setup('斯卡蒂',{extra:['斯卡蒂'],bonds:{raidShip:active(999)}});const [u]=summon();
  const foe=h.spawn('enemy_1001_1',{pos:[9,8]});foe.base.maxHp=1000000;foe.base.atk=0;foe.base.moveSpeed=0;foe.markDirty();foe.hp=foe.s.maxHp;
  assert.ok(u.findBuff('bond:raidShip:aspd'));u.skill.setSpTotal(u.skill.spCost);
  const seq=u.deploySeq;h.run(1);assert.ok(u.deploySeq>seq);assert.ok(u.findBuff('bond:raidShip'));done(h);
});

test('summoned Mizuki receives active Solo stats and deployment SP',()=>{
  const {h,summon}=setup('水月',{extra:['水月'],bonds:{soloShip:active()}});const [u]=summon();
  assert.deepEqual(u.findBuff('bond:soloShip').mods,h.unit(2).findBuff('bond:soloShip').mods);
  assert.equal(u.skill.sp,Math.min(u.skill.spCost,u.skill.def.initSp+DATA.bonds.soloShip.bb.sp));done(h);
});

test('a summoned operator consumes one remaining Aegir upper-tier revival on its first defeat',()=>{
  const {h,summon}=setup('幽灵鲨',{bonds:{egirShip:active(20,2)}});const [u]=summon();
  h.b.kill(u);assert.equal(u.alive,true);h.step();h.b.kill(u);assert.equal(u.removed,true);done(h);
});
