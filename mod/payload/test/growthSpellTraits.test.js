import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './match/harness.js';
import {makeBattle,flatStage} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {Battle} from '../server/sim/Battle.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {installGrowthEconomy} from '../server/match/growthCombat.js';
import {triggerDeathTraits} from '../server/sim/content/garrisons/growthTriggers.js';
import {SHOP_SPELLS} from '../shared/spellCatalog.js';
import {growthTraitView} from '../server/match/growthTraits.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
function prep(growthMode=true,options={}) {
  const h=makeMatch({growthMode,spellShop:true,heroMod:false,fake:true,mode:'solo',difficulty:'FUNNY',...options});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.gd.modeInactiveBonds.clear();h.m.disabledBonds=[];ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.recompute();
  const put=(name,r,c,elite=false)=>{const p=ps.newPiece('chess',id(name,elite),{poolCopies:0});p.dir='RIGHT';ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  return {h,ps,put,data:options.data || DATA};
}
function combat(t,extra={}) {
  const {ps}=t;
  const bonds=Object.fromEntries(Object.entries(ps.bonds).map(([key,v])=>[key,{...v,layers:ps.layers[key] || 0}]));
  // No Aegir devour/revival side effects in these focused replay tests.
  if(bonds.egirShip)bonds.egirShip.active=false;
  const units=[...ps.board].map(([key,p])=>{const [row,col]=key.split(',').map(Number);return {uid:p.uid,chessId:p.id,row,col,dir:p.dir};});
  const f=makeBattle({data:new DataSource(growthData(t.data,true)),flags:{growthMode:true,layerGainsEnabled:true},players:[{playerId:ps.playerId,units,bonds}],autoFinish:false,...extra});
  installGrowthEconomy(t.h.m,f.b);t.h.m.phase='COMBAT';
  f.step();return {...f,unit:p=>f.b.allyUnits.find(u=>u.uid===p.uid)};
}
function done(t,f) {f.b.forceEnd();assert.equal(f.b.result().errors,0,JSON.stringify(f.b.errors));assert.deepEqual(t.h.logs.error,[]);assert.deepEqual(t.h.logs.warn,[]);t.h.m.dispose();}

const spell=(t,name,target=null)=>{const rec=SHOP_SPELLS.find(r=>r.name===name);assert.ok(rec,name);const p=t.ps.acquireItem(rec.id);assert.ok(p);const result=t.ps.castSpell(p.uid,target?.uid);assert.equal(result.ok,true,JSON.stringify(result));};

for(const forge of [false,true])for(const elite of [false,true])test(`four clarified traits have double elite rewards in descriptions, live combat and settlement (${forge?'real Forge':'base'}, ${elite?'elite':'normal'})`,{
 skip:forge&&!process.env.SP_FORGE_PLUGINS_DIR,
},async()=>{
 let data=DATA;
 if(forge) {
  const {createPluginRegistry}=await import('../server/plugins/registry.js'),{buildContentSet}=await import('../server/plugins/contentSet.js'),{ROOT}=await import('../server/data.js');
  const registry=createPluginRegistry({publicDir:`${ROOT}/public`,packsDir:`${ROOT}/packs`,dataDir:`${ROOT}/data`,pluginsDir:process.env.SP_FORGE_PLUGINS_DIR},{recheckMs:0,log:{info(){},warn(){}}});
  const set=buildContentSet({registry,ids:['hero-strategies','spell-shop']});assert.deepEqual(set.problems,[]);data=set.data;
 }
 const t=prep(true,{data}),m=elite?2:1;
 const minimal=t.put('至简',9,3,elite),mixer=t.put('信仰搅拌机',10,3,elite),lem=t.put('蕾缪安',11,3,elite),specter=t.put('归溟幽灵鲨',12,3,elite),other=t.put('小满',9,6);
 const desc=p=>t.ps.gd.garrison(t.ps.gd.chess(p.id).garrisonIds[0]).desc;
 assert.ok(desc(minimal).endsWith(`层数+${m}`));assert.ok(desc(mixer).endsWith(`额外+${m}`));
 assert.ok(desc(lem).includes(`释放${m}次闪亮的戒指`));assert.ok(desc(specter).includes(`单次收益各＋${2*m}`));
 assert.equal(growthTraitView(t.ps,specter).value,2*m);
 const f=combat(t),p=f.b.getPlayer(t.ps.playerId);
 // Enable Indom's layer display after installation, avoiding its unrelated random revival in this fixture.
 p.bonds.indomShip={active:true,count:1,tier:1,layers:0};p.bonds.egirShip={active:true,count:1,tier:1,layers:0};
 f.b.emit('skillStart',{unit:f.unit(minimal)});
 assert.equal(p.bonds.sargonShip.layers,m);assert.equal(p.bonds.skillfulShip.layers,m);
 for(let n=0;n<2;n++)f.b.emit('skillStart',{unit:f.unit(mixer)});
 assert.equal(t.ps.growthState.spellBonus,2*m);assert.equal(growthTraitView(t.ps,mixer).value,2*m);
 for(let n=0;n<9;n++)f.b.emit('ammoUsed',{unit:f.unit(minimal)});
 assert.equal(t.ps.growthState.spellsCast || 0,0);assert.equal(f.unit(lem).growthTraitLive.ammoProgress,9);
 f.b.emit('ammoUsed',{unit:f.unit(minimal)});assert.equal(t.ps.growthState.spellsCast,m);
 assert.deepEqual(f.unit(lem).growthTraitLive,{ammoProgress:0,ammoThreshold:10});
 const aegir=p.bonds.egirShip.layers;f.b.kill(f.unit(other));assert.equal(p.bonds.egirShip.layers-aegir,2*m);
 f.b.emit('dollSwitch',{unit:f.unit(specter)});assert.equal(p.bonds.egirShip.layers-aegir,6*m);
 assert.equal(f.unit(specter).growthTraitLive.value,6*m);
 t.h.m.lastResults=new Map([[t.ps.playerId,{...f.b._pp(t.ps.playerId),leaked:[]}]]);t.h.m.settle(null,null);
 assert.equal(t.ps.layers.sargonShip,m);assert.equal(t.ps.layers.skillfulShip,m);assert.equal(t.ps.layers.egirShip || 0,0);
 assert.equal(t.ps.growthState.spellBonus,2*m,'spell strength persists without being applied twice at settlement');done(t,f);
});

test('Perfumers strengthen every independent spell layer event; permanent purchase grants read current strength and views agree',()=>{
 const t=prep();t.put('角峰',10,3);t.put('录武官',11,3);t.put('艾丝黛尔',12,3);
 t.ps.acquireChess(id('调香师'),{fromPool:false});assert.equal(t.ps.growthState.spellBonus,1);
 const before=t.ps.layers.yanShip || 0;spell(t,'闪亮的戒指');assert.equal(t.ps.layers.yanShip,before+2);
 spell(t,'富足之杖');const slot={kind:'chess',id:id('录武官'),sold:false};t.ps.shop.slots=[slot];
 assert.equal(t.ps.spellPurchaseBonus(slot),2);assert.equal(t.ps.spellEffectViews().find(x=>x.id==='spell_growth').counter,2);
 t.ps.acquireChess(id('调香师',true),{fromPool:false});assert.equal(t.ps.growthState.spellBonus,3);
 assert.equal(t.ps.spellPurchaseBonus(slot),4);assert.equal(t.ps.privateView().shop.slots[0].purchaseBonus,4);
 const old=t.ps.layers.yanShip;t.h.m.dispatch(t.ps,'onBuy',{kind:'chess',piece:{id:slot.id},slot,spellBonus:t.ps.spellPurchaseBonus(slot,{raw:true})});assert.equal(t.ps.layers.yanShip,old+4);
 assert.equal(growthTraitView(t.ps,{id:id('调香师')}).value,3);assert.deepEqual(t.h.logs.error,[]);t.h.m.dispose();
});

test('spell strength cannot create a purchase reward without a grant, affect ordinary growth, or affect disabled growth',()=>{
 const t=prep();t.ps.growthState={spellBonus:7};assert.equal(t.ps.spellPurchaseBonus({kind:'chess',id:id('录武官')}),0);
 t.ps.addLayers('yanShip',2,{reason:'growth'});assert.equal(t.ps.layers.yanShip,2);t.h.m.dispose();
 const off=prep(false);off.ps.growthState={spellBonus:7};off.ps.addLayers('yanShip',2,{reason:'spell'});assert.equal(off.ps.layers.yanShip,2);off.h.m.dispose();
});

for(const elite of [false,true])test(`Surtr's ${elite?'elite':'normal'} defeat bonus and skill bonus persist, with Indre repetition only on defeat`,()=>{
 const t=prep(),surtr=t.put('史尔特尔',10,3,elite),mixer=t.put('信仰搅拌机',11,3,true);t.put('隐德来希',12,3);
 const f=combat(t);triggerDeathTraits(f.b,f.unit(surtr));assert.equal(t.ps.growthState.spellBonus,elite?4:2);
 f.b.emit('skillStart',{unit:f.unit(mixer)});assert.equal(t.ps.growthState.spellBonus,elite?6:4);
 const old=t.ps.growthState.spellBonus;f.b.kill(f.unit(surtr));assert.equal(t.ps.growthState.spellBonus,old+(elite?4:2));
 t.h.m.dispatch(t.ps,'onBattleResult',{result:f.b._pp(t.ps.playerId)});assert.equal(t.ps.growthState.spellBonus,old+(elite?4:2));done(t,f);
});

for(const retain of [0,1,2])test(`ammo auto ring uses current strength and retain grade ${retain}, settles once and records real casts`,()=>{
 const t=prep(),most=t.put('莫斯提马',10,3),shooter=t.put('信仰搅拌机',10,4);if(retain)t.put('圣约送葬人',11,3,retain===2);
 if(retain===2)t.put('圣约送葬人',12,3);t.ps.growthState={spellBonus:2};const f=combat(t);
 const old=t.ps.layers.lateranoShip || 0,live=f.b.getPlayer(t.ps.playerId).bonds.lateranoShip.layers;
 for(let n=0;n<5;n++)f.b.emit('ammoUsed',{unit:f.unit(shooter)});assert.equal(t.ps.growthState.spellsCast || 0,0);
 f.b.emit('ammoUsed',{unit:f.unit(shooter)});
 const members=2+(retain?1:0)+(retain===2?1:0),amount=members*3*(retain || 1);
 assert.equal(f.b.getPlayer(t.ps.playerId).bonds.lateranoShip.layers,live+amount);
 assert.equal(t.ps.layers.lateranoShip || 0,old+(retain?amount:0));assert.equal(t.ps.growthState.spellsCast,1);
 const saved={...t.ps.layers};t.h.m.dispatch(t.ps,'onBattleResult',{result:f.b._pp(t.ps.playerId)});assert.deepEqual(t.ps.layers,saved);assert.deepEqual(f.unit(most).growthTraitLive,{ammoProgress:0,ammoThreshold:6});done(t,f);
});

test('Mostima pools self and four adjacent tiles only; Lemuen pools own live field, grades retain exact cast count',()=>{
 const t=prep(),most=t.put('莫斯提马',10,3,true),lem=t.put('蕾缪安',12,3,true),near=t.put('信仰搅拌机',10,4),far=t.put('角峰',12,6);const f=combat(t);
 for(let n=0;n<6;n++)f.b.emit('ammoUsed',{unit:f.unit(near)});assert.equal(t.ps.growthState.spellsCast,2);
 for(let n=0;n<4;n++)f.b.emit('ammoUsed',{unit:f.unit(far)});assert.equal(t.ps.growthState.spellsCast,4);
 for(let n=0;n<6;n++)f.b.emit('ammoUsed',{unit:f.unit(most)});assert.equal(t.ps.growthState.spellsCast,6);
 assert.equal(f.unit(lem).growthTraitLive.ammoProgress,6);done(t,f);
});

test('an automatic spell preview cannot mutate authoritative spell strength or rewards',()=>{
 const t=prep(),p=t.put('史尔特尔',10,3);t.h.m.BattleClass=Battle;
 const b=t.h.m.newBattle({players:[t.ps.battleInput()],stage:flatStage(),timeLimit:1,autoFinish:false},{preview:true});b.start();triggerDeathTraits(b,b.allyUnits.find(u=>u.uid===p.uid));assert.equal(t.ps.growthState?.spellBonus || 0,0);b.forceEnd();t.h.m.dispose();
});

test('three independent Yan recipients each get the full spell bonus and migrated native layer spells participate',()=>{
 const t=prep();const target=t.put('惊蛰',10,3);t.put('录武官',11,3);t.put('夕',12,3);t.ps.growthState={spellBonus:1};const before=t.ps.layers.yanShip || 0;t.ps.spellBoardLayers(2);assert.equal(t.ps.layers.yanShip,before+9);
 const p=t.ps.acquireItem('chess_item_1_04_e_a');const old=t.ps.layers.yanShip;assert.equal(t.ps.castSpell(p.uid,target.uid).ok,true);assert.equal(t.ps.layers.yanShip,old+4);t.h.m.dispose();
});
