import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DATA,makeMatch} from './match/harness.js';
import {makeBattle,enemyRec} from './helpers/battleHarness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {DataSource} from '../server/sim/simdata.js';
import {resolveHit} from '../server/sim/ai.js';
import {hasDeathTrait,triggerDeathTraits} from '../server/sim/content/garrisons/growthTriggers.js';
import {spawnGrowthOperator} from '../server/sim/content/garrisons/growthSpawn.js';
import {parseSkel} from '../tools/assets/skel.mjs';
import {ROOT} from '../server/data.js';
import {createPluginRegistry} from '../server/plugins/registry.js';
import {buildContentSet} from '../server/plugins/contentSet.js';
import {voiceLine} from '../public/js/audio.js';
import {createDataStore} from '../public/js/data.js';
import {operatorVoiceOptions} from '../public/js/ui/operatorVoice.js';
import {withGrowthAssetFallbacks} from '../shared/growthAssets.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const d=growthData(DATA,true),unit=(name,row,col,uid=1,elite=false)=>({chessId:id(name,elite),row,col,uid,dir:'RIGHT'});
const close=h=>{h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify(h.b.errors));};

test('Blue Poison has real paired data, skill choices and assets; Skadi loses only growth Steadfast',()=>{
 assert.equal(GROWTH_ROSTER.length,120);assert.equal(DATA.chess[id('蓝毒')],undefined);
 for(const elite of [false,true]) {
  const c=d.chess[id('蓝毒',elite)];assert.equal(c.charId,'char_129_bluep');assert.equal(c.tier,2);assert.deepEqual(c.bonds,['egirShip']);
  assert.equal(c.skill.skillId,'skchr_bluep_2');assert.equal(c.skills.length,2);assert.ok(c.talents.some(t=>t.name==='神经毒素'));
  assert.equal(c.backup,null);assert.match(d.garrisons[c.garrisonIds[0]].desc,/本干员可以部署在地面上/);
  assert.deepEqual(d.chess[id('斯卡蒂',elite)].bonds,['egirShip','raidShip']);assert.ok(DATA.chess[id('斯卡蒂',elite)].bonds.includes('steadShip'));
 }
 assert.ok(d.bonds.egirShip.members.includes(id('蓝毒')));assert.ok(!d.bonds.steadShip.members.includes(id('斯卡蒂')));
});

test('actual downloaded Blue Poison Front/Back skeletons contain their declared animations',{
 skip:!fs.existsSync('public/assets/growth-bluepoison/spine/op/char_129_bluep/front/char_129_bluep.skel'),
},()=>{
 const art=d.assets.chars.char_129_bluep;
 for(const side of ['front','back']) {
  const model=art.spine[side],file=path.resolve('public',model.skel.slice(1));assert.ok(fs.existsSync(file));
  const sk=parseSkel(fs.readFileSync(file));assert.ok(sk.animations.includes(model.anims.idle));assert.ok(sk.animations.includes(model.anims.attack.loop));
  assert.ok(fs.existsSync(path.resolve('public',model.atlas.slice(1))));for(const page of model.textures)assert.ok(fs.existsSync(path.resolve('public',page.slice(1))));
 }
});

test('Blue Poison voices cover all battle slots and preserve native audio and installed Forge overrides',async()=>{
 const charId='char_129_bluep',slots=['start','faceEnemy','select','place','skill1','skill2','skill3','skill4','resultFour','resultThree','resultTwo','resultLose'];
 assert.deepEqual(d.assets.audio.bgm,DATA.assets.audio.bgm);assert.deepEqual(d.assets.audio.sfx,DATA.assets.audio.sfx);
 assert.deepEqual(d.assets.audio.voice.char_263_skadi,DATA.assets.audio.voice.char_263_skadi);
 for(const lang of ['cn','jp','en','kr'])for(const slot of slots){
  const line=voiceLine(d.assets.audio,charId,slot,lang,()=>0);assert.ok(line,`${lang}/${slot}`);
  assert.ok(line.url.includes(`/voice/${lang}/`));
  if(fs.existsSync('public/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_019.mp3'))assert.ok(fs.statSync(path.resolve('public',line.url.slice(1))).size>500);
 }
 const replaced=withGrowthAssetFallbacks({audio:{...DATA.assets.audio,voice:{...DATA.assets.audio.voice,[charId]:{select:'/p/forge/bluep.mp3'}}}});
 assert.equal(voiceLine(replaced.audio,charId,'select','cn',()=>0).url,'/p/forge/bluep.mp3');
 const store=createDataStore({fetch:async()=>({ok:true,json:async()=>DATA.assets})});await store.load('assets');
 assert.ok(voiceLine(store.get('assets').audio,charId,'select','cn'));
 assert.deepEqual(operatorVoiceOptions(store.get('assets').audio,charId,'').map(r=>r.value),['','cn','jp','en','kr']);
 assert.equal(store.lookup('chess',id('蓝毒')),null,'voice previews do not enable the growth roster');
});

test('Blue Poison joins the actual pool, deploys on ground and high tiles, and merges into her real elite form',t=>{
 const data={...DATA,config:{...DATA.config,modes:Object.fromEntries(Object.entries(DATA.config.modes).map(([k,v])=>[k,{...v,inactiveBondIds:['deputShip']}]))}};
 const h=makeMatch({data,growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true}).start();t.after(()=>h.m.dispose());h.toPrep();
 const ps=h.ps('p_0');ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.bandId=null;ps.recompute();
 ps.tileOverrides={'9,3':'melee','10,4':'ranged'};ps._deployMap=null;
 assert.ok(h.m.pool.entries.has(id('蓝毒')));const p=ps.acquireChess(id('蓝毒'));assert.ok(p);
 for(const kind of ['melee','ranged']) {
  const at=[...ps.deployMap()].find(([,k])=>k===kind);assert.ok(at,kind);const[row,col]=at[0].split(',').map(Number);
  assert.equal(ps.move(p.uid,{area:'board',row,col}).ok,true,kind);
 }
 ps.acquireChess(id('蓝毒'));const elite=ps.acquireChess(id('蓝毒'));assert.equal(elite.id,id('蓝毒',true));
 assert.equal(ps.gd.chess(elite.id).charId,'char_129_bluep');assert.equal(h.m.errorCount,0);
});

function blueField(elite=false,skillIndex=1) {
 const raw={...d,enemies:{...d.enemies,enemy_bluep_dummy:enemyRec({key:'enemy_bluep_dummy',hp:1e8,speed:0,def:0,res:0})}};
 const h=makeBattle({data:new DataSource(raw),flags:{growthMode:true},autoFinish:false,
  units:[{...unit('蓝毒',10,3,1,elite),skillIndex}]});h.step();return h;
}
for(const elite of [false,true])test(`Blue Poison S2 really attacks three targets and applies poison (${elite?'elite':'normal'})`,()=>{
 const h=blueField(elite),u=h.unit(1),targets=[[10,4],[9,4],[11,4]].map(pos=>h.spawn('enemy_bluep_dummy',{pos}));
 assert.equal(u.skill.activate('audit',{free:true}),true);h.run(0.9);
 for(const e of targets){assert.ok(e.hp<e.s.maxHp);assert.equal(e.findBuff('bluep:poison')?.data.amount,elite?85:40);}
 if(elite)assert.ok(u.findBuff('trait:bluepGround'));close(h);
});

test('poison refresh preserves the initial amount and ticking cadence, remains sourceless and expires',()=>{
 const h=blueField(false,0),u=h.unit(1),e=h.spawn('enemy_bluep_dummy',{pos:[10,4]}),hits=[];
 h.b.addBuff(u,{key:'test:pauseAttacks',flags:{disarm:true},persist:true});
 h.b.on('damaged',ctx=>{if(ctx.dmg?.tags?.includes('bluep:poison'))hits.push(ctx);});
 const hit=isSkill=>resolveHit(h.b,u,{...u.profile,atkScale:isSkill?1.4:1},e,{attackId:1,isSkill},e.x,e.y);
 hit(false);assert.equal(e.findBuff('bluep:poison').data.amount,40);h.run(0.4);hit(true);
 assert.equal(e.findBuff('bluep:poison').data.amount,40,'refresh does not replace the earlier normal-shot poison');
 h.run(0.7);assert.equal(hits.length,1);assert.equal(hits[0].source,null);assert.equal(hits[0].credit,u);
 h.run(3);assert.equal(e.findBuff('bluep:poison'),null);close(h);
});

for(const elite of [false,true])for(const mode of ['damage','drain'])test(`Specter first-one-HP observer triggers the front trait without killing it (${elite}/${mode})`,()=>{
 const h=makeBattle({data:new DataSource(d),flags:{growthMode:true},autoFinish:false,
  units:[unit('幽灵鲨',10,3,1,elite),unit('斯卡蒂',10,4,2)]});h.step();const [u,target]=h.b.allyUnits;
 assert.equal(hasDeathTrait(u),false);triggerDeathTraits(h.b,u);assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes||0,0);
 assert.equal(u.skill.activate('audit',{free:true}),true);const hp=target.hp;
 const harm=()=>mode==='damage'?h.b.dealDamage(null,u,{amount:u.s.maxHp*10,type:'true'}):h.b.loseHp(u,u.s.maxHp*10);
 harm();assert.equal(u.hp,1);assert.equal(u.alive,true);assert.equal(target.alive,true);assert.equal(target.hp,hp);
 assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,elite?2:1);
 h.b.heal(null,u,u.s.maxHp);harm();assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,elite?2:1,'only once after healing');
 h.b.retreat(u);assert.equal(h.b.redeploy(u,{free:true}),true);u.skill.activate('audit',{free:true});harm();
 assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,elite?2:1,'redeploy does not reset the battle limit');close(h);
});

test('Specter combines with Indre on the target, consumes the first event even with no front target, and summoned copies work',()=>{
 const h=makeBattle({data:new DataSource(d),flags:{growthMode:true},autoFinish:false,
  units:[unit('幽灵鲨',10,3),unit('斯卡蒂',10,4,2),unit('隐德来希',12,7,3)]});h.step();const[u,target]=h.b.allyUnits;
 u.skill.activate('audit',{free:true});h.b.dealDamage(null,u,{amount:1e8,type:'true'});assert.equal(h.b._pp(u.ownerId).growthFreeRefreshes,2);
 const child=spawnGrowthOperator(h.b,target,id('幽灵鲨'));assert.ok(child);assert.equal(child.def.raw.growthTrait.handler,'frontFirstOneHp');close(h);
 const e=makeBattle({data:new DataSource(d),flags:{growthMode:true},autoFinish:false,units:[unit('幽灵鲨',10,3),unit('斯卡蒂',10,4,2)]});e.step();
 const [a,b]=e.b.allyUnits;e.b.retreat(b);a.skill.activate('audit',{free:true});e.b.dealDamage(null,a,{amount:1e8,type:'true'});
 e.b.redeploy(b,{free:true});e.b.heal(null,a,a.s.maxHp);e.b.dealDamage(null,a,{amount:1e8,type:'true'});assert.equal(e.b._pp(a.ownerId).growthFreeRefreshes||0,0);close(e);
});

test('real installed Forge hero and spell packs retain the new operator kit and trait changes',{
 skip:!process.env.SP_FORGE_PLUGINS_DIR,
},()=>{
 const registry=createPluginRegistry({publicDir:path.join(ROOT,'public'),packsDir:path.join(ROOT,'packs'),dataDir:path.join(ROOT,'data'),pluginsDir:process.env.SP_FORGE_PLUGINS_DIR},{recheckMs:0,log:{info(){},warn(){}}});
 const on=buildContentSet({registry,ids:['hero-strategies','spell-shop']});assert.deepEqual(on.problems,[]);
 const raw=growthData(on.data,true);assert.ok(Object.keys(raw.bands).some(k=>k.startsWith('band_x_hero_strategies_')));
 const h=makeBattle({data:new DataSource(raw),flags:{growthMode:true},autoFinish:false,
  units:[unit('幽灵鲨',10,3),unit('斯卡蒂',10,4,2),unit('蓝毒',11,3,3)]});h.step();
 const [specter,skadi,blue]=h.b.allyUnits;assert.ok(blue.kit&&blue.skill);assert.equal(blue.def.raw.charId,'char_129_bluep');
 assert.equal(hasDeathTrait(blue),true);assert.equal(hasDeathTrait(specter),false);assert.deepEqual(skadi.def.raw.bonds,['egirShip','raidShip']);
 specter.skill.activate('audit',{free:true});h.b.dealDamage(null,specter,{amount:1e8,type:'true'});
 assert.equal(h.b._pp(specter.ownerId).growthFreeRefreshes,1);close(h);
});

for(const kind of ['normal','unite','boss','hidden'])test(`Specter front targeting and per-field reset follow mapped deployment (${kind})`,()=>{
 const p={playerId:'p1',...(kind==='unite'?{colOffset:8}:kind!=='normal'?{mirror:true}:{}),
  units:[unit('幽灵鲨',10,3),unit('斯卡蒂',10,4,2)]};
 for(let field=0;field<2;field++){
  const h=makeBattle({data:new DataSource(d),kind,players:[p],flags:{growthMode:true},autoFinish:false});h.step();
  const u=h.unit(1);u.skill.activate('audit',{free:true});h.b.dealDamage(null,u,{amount:1e8,type:'true'});
  assert.equal(h.b._pp('p1').growthFreeRefreshes,1,`field ${field}`);close(h);
 }
});
