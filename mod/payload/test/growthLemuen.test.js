import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {makeBattle,enemyRec} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData} from '../shared/growthMode.js';
import {richTextPlain} from '../public/js/ui/richText.js';

test('both Lemuen skill descriptions explain groups while native and other skills remain unchanged',()=>{
 const d=growthData(DATA,true);
 for(const grade of ['a','b']) {
  const id=`chess_char_6_01_${grade}`,c=d.chess[id];
  assert.match(c.skill.desc,/每锁定5发.*未满5发/);assert.match(c.skill.desc,/受攻击速度影响/);assert.equal(richTextPlain(c.skill.descRaw),c.skill.desc);
  assert.equal(c.skills[2].desc,c.skill.desc);
  for(const n of [0,1])assert.deepEqual(c.skills[n],DATA.chess[id].skills[n]);
  assert.doesNotMatch(DATA.chess[id].skill.desc,/每锁定5发/);
 }
});

function field({ammo=5,growth=true,elite=false,raw=DATA}={}) {
 const id=`chess_char_6_01_${elite?'b':'a'}`,base=growth?growthData(raw,true):raw;
 const shots=[],ends=[];
 const data=new DataSource({...base,enemies:{...base.enemies,enemy_growth_target:enemyRec({key:'enemy_growth_target',hp:1e12,speed:0})}});
 const h=makeBattle({data,flags:{growthMode:growth},autoFinish:false,timeLimit:200,
  units:[{uid:1,chessId:id,row:10,col:3,carryState:{sp:999}}],enemies:[{key:'enemy_growth_target',pos:[10,5]}],
  setup(b){
   b.on('skillStart',({unit,skill})=>{if(unit.defId===id){skill.ammoLeft=ammo;skill.ammoMax=ammo;}});
   b.on('skillEnd',({unit,reason})=>{if(unit.defId===id)ends.push(reason);});
   b.on('damaged',ctx=>{if(ctx.dmg?.tags?.includes('bombard'))shots.push({t:b.time,n:ctx.amount});});
  },
 });
 return {h,u:h.unit(1),shots,ends};
}
const done=f=>{f.h.b.forceEnd();assert.equal(f.h.b.result().errors,0);};

test('growth aiming responds to current attack speed, native aiming stays fixed',()=>{
 const first=(growth,aspd)=>{
  const f=field({growth,ammo:100});f.h.b.addBuff(f.u,{key:'test:aspd',mods:{aspd:aspd-100},persist:true,allowDead:true});
  if(growth){assert.ok(f.h.runUntil(()=>f.shots.length>0,5));const time=f.shots[0].t;done(f);return time;}
  f.h.run(2);const left=f.u.skill.ammoLeft;done(f);return left;
 };
 const slow=first(true,100),fast=first(true,200),max=first(true,600);
 assert.ok(fast<slow-0.8);assert.ok(max<fast-0.5);assert.equal(first(false,100),first(false,600));
 const f=field({ammo:100});assert.ok(f.h.runUntil(()=>f.u.skill.ammoLeft===99,2));
 f.h.b.addBuff(f.u,{key:'test:liveAspd',mods:{aspd:100},persist:true});
 const before=f.u.skill.ammoLeft;f.h.run(1);assert.equal(before-f.u.skill.ammoLeft,4);
 f.h.b.removeBuff(f.u,'test:liveAspd');const remaining=f.u.skill.ammoLeft;f.h.run(1);assert.equal(remaining-f.u.skill.ammoLeft,2);done(f);
});

for(const elite of [false,true])test(`growth Lemuen first damage no longer waits for the entire ammo stock (${elite?'elite':'normal'})`,()=>{
 const first=[];
 for(const ammo of [5,100,1000]) {
  const f=field({ammo,elite});assert.ok(f.h.runUntil(()=>f.shots.length>0,5));first.push(f.shots[0].t);
  if(ammo>5){assert.equal(f.u.skill.active,true);assert.ok(f.u.skill.ammoLeft>0);assert.equal(f.ends.length,0);}
  assert.ok(f.u.mem.lemLocks?.length<5 || f.u.mem.lemLocks==null);done(f);
 }
 assert.equal(first[0],first[1]);assert.equal(first[1],first[2]);
});

test('full batches and the last partial batch fire every spent bullet exactly once',()=>{
 for(const ammo of [3,5,7,12,40]) {
  const f=field({ammo});assert.ok(f.h.runUntil(()=>f.ends.length>0,30));f.u.skill.paused=true;f.h.run(2);
  assert.equal(f.shots.length,ammo,`ammo ${ammo}: no discarded or duplicate bombardment`);assert.equal(f.u.mem.lemLocks,null);done(f);
 }
});

test('native Lemuen still waits for the full magazine and keeps the native shell-window cap',()=>{
 const f=field({ammo:40,growth:false});f.h.run(5);assert.equal(f.shots.length,0);assert.equal(f.u.skill.active,true);
 assert.ok(f.h.runUntil(()=>f.ends.length>0,30));f.u.skill.paused=true;f.h.run(11);assert.equal(f.shots.length,33);done(f);
});

test('knockout drops pending locks and unfired shells without firing a second batch',()=>{
 const f=field({ammo:100});assert.ok(f.h.runUntil(()=>f.shots.length>0,5));const before=f.shots.length;
 f.h.b.kill(f.u);f.h.run(2);assert.ok(f.shots.length<=before+1,'only an already airborne shell can still land');done(f);
});

test('actual imported Forge content uses grouped bombardment and the current growth edits',{
 skip:!process.env.SP_FORGE_PLUGINS_DIR,
},async()=>{
 const {createPluginRegistry}=await import('../server/plugins/registry.js'),{buildContentSet}=await import('../server/plugins/contentSet.js'),{ROOT}=await import('../server/data.js');
 const registry=createPluginRegistry({publicDir:`${ROOT}/public`,packsDir:`${ROOT}/packs`,dataDir:`${ROOT}/data`,pluginsDir:process.env.SP_FORGE_PLUGINS_DIR},{recheckMs:0,log:{info(){},warn(){}}});
 const set=buildContentSet({registry,ids:['hero-strategies','spell-shop']});assert.deepEqual(set.problems,[]);
 const f=field({raw:set.data,ammo:100});assert.ok(f.h.runUntil(()=>f.shots.length>0,5));assert.equal(f.u.skill.active,true);done(f);
 const d=growthData(set.data,true),glad=d.chess.chess_char_4_12_a;
 assert.equal(glad.stats.maxHp,set.data.chess.chess_char_4_12_a.stats.maxHp*0.5);
 for(const [id,handler] of [['chess_char_1_03_a','saleCoins'],['chess_char_1_09_a','allEnemyAttack'],['chess_char_1_10_a','fixedSpRecovery']])assert.equal(d.chess[id].growthTrait.handler,handler);
});
