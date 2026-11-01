import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch,DATA} from './match/harness.js';
import {GROWTH_ROSTER,growthData} from '../shared/growthMode.js';
import {consumeShop,growthSelfDamage} from '../server/match/growthKazdel.js';
import {growthPurchaseView} from '../server/match/growthTraits.js';
import {richTextPlain} from '../public/js/ui/richText.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
function prep(t,{growthMode=true,data=DATA}={}) {
 const h=makeMatch({data,mode:'solo',growthMode,spellShop:true,heroMod:false,fake:true,seed:52}).start();t.after(()=>h.m.dispose());h.toPrep();
 const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.funds=100;ps.bondCountBonus={};ps.growthState={grants:[],grantBonus:0};ps.recompute();
 const put=(name,elite=false)=>{const p=ps.newPiece('chess',id(name,elite));ps.board.set(`10,${ps.board.size+2}`,p);ps.recompute();return p;};
 const tier=n=>{ps.bondCountBonus.kazdelShip=n;ps.recompute();assert.equal(ps.bonds.kazdelShip.tier,n>=3?2:1);};
 return {h,ps,put,tier};
}
const slot=(name='小满')=>({kind:'chess',id:id(name),basePrice:3,sold:false});
const cast=(ps,spell,target=null)=>{const p=ps.acquireItem(spell,{silent:true});assert.ok(p);assert.equal(ps.castSpell(p.uid,target?.uid).ok,true);};

for(const elite of [false,true])test(`King grants a true purchase effect shared by buying and Logos (${elite?'elite':'normal'})`,t=>{
 const s=prep(t);s.put('魔王',elite);s.put('山',true);growthSelfDamage(s.ps,1);
 const n=elite?2:1;s.ps.shop.slots=[slot()];
 assert.deepEqual(growthPurchaseView(s.ps,s.ps.shop.slots[0]),[{bondId:'yanShip',layers:n},{bondId:'skillfulShip',layers:n}]);
 s.ps.acquireChess(id('小满'),{fromPool:false});assert.equal(s.ps.layers.yanShip||0,0,'a free gain does not trigger the purchase grant');
 assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.layers.yanShip,n);assert.equal(s.ps.layers.skillfulShip,n,'Mountain does not repeat purchase effects');
 s.put('逻各斯');s.ps.shop.slots=[slot()];cast(s.ps,'hs_bg28_571');
 assert.equal(s.ps.layers.yanShip,2*n);assert.equal(s.ps.layers.skillfulShip,2*n);
 assert.match(s.ps.gd.garrison(s.ps.gd.chess(id('魔王',elite)).garrisonIds[0]).desc,/〈购买时〉/);
});

for(const tier of [1,3])test(`all consumed main layer sources convert only at Kazdel three members (count=${tier})`,t=>{
 const s=prep(t);s.tier(tier);s.ps.growthState={grants:[{n:2,active:false}],gainGrant:3};
 s.ps.spellData().growth=1;s.ps.shop.slots=[slot()];const gained=s.ps.round.gainedChess;
 consumeShop(s.ps,1,2);
 assert.equal(s.ps.layers.yanShip||0,tier===3?0:12);assert.equal(s.ps.layers.kazdelShip||0,tier===3?12:0);
 assert.equal(s.ps.layers.skillfulShip,12,'secondary layers retain their original alliance');
 assert.equal(s.ps.round.gainedChess,gained);assert.equal(s.ps.shop.slots[0].sold,true);
});

test('ordinary purchase does not convert, while Logos, Ascalon and Ines share devour routing',t=>{
 const s=prep(t);s.ps.growthState={grants:[{n:2,active:false}]};s.tier(3);
 s.ps.shop.slots=[slot()];assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.layers.yanShip,2);
 for(const name of ['逻各斯','阿斯卡纶','伊内丝']) {
  s.ps.board.clear();s.put(name);s.ps.recompute();s.ps.shop.slots=[slot('惊蛰')];const before=s.ps.layers.kazdelShip||0;
  if(name==='逻各斯')cast(s.ps,'hs_bg28_571');
  else if(name==='阿斯卡纶')s.ps.acquireChess(id('赫德雷'),{fromPool:false});
  else s.h.m.dispatcher.triggerGarrisons(s.ps,[...s.ps.board.values()][0],'SERVER_PREP_FIN');
  assert.ok(s.ps.shop.slots[0].sold,name);assert.equal(s.ps.layers.yanShip,2,name);
  assert.ok(s.ps.layers.kazdelShip>before,name);
 }
});

test('Corrupted Cupcakes include growth and King purchase grants, retain positional spell bonuses and convert target main rewards',t=>{
 const s=prep(t);s.tier(3);const target=s.put('小满');
 s.ps.growthState={grants:[{n:2,active:false}],gainGrant:3};s.ps.spellData().growth=1;s.ps.spellData().right=3;
 s.ps.shop.slots=[slot(),slot(),slot()];const gained=s.ps.round.gainedChess,buys=s.ps.round.buys;
 cast(s.ps,'hs_bg28_607',target);
 // Three tier-two cards: each +6, original rightmost +3, target receives floor(6/2)=3.
 assert.equal(s.ps.gd.chess(id('小满')).tier,2);
 assert.equal(s.ps.layers.yanShip||0,0);assert.equal(s.ps.layers.kazdelShip,24);assert.equal(s.ps.layers.skillfulShip,24);
 assert.equal(s.ps.round.gainedChess,gained);assert.equal(s.ps.round.buys,buys);assert.ok(s.ps.shop.slots.every(x=>x.sold));
});

for(const observer of ['闪灵','魔王'])test(`Desperate Excavation life purchase rolls back via ${observer}, including armor and low life`,t=>{
 const s=prep(t);s.put(observer);s.tier(1);s.ps.lp=1;s.ps.spellData().armor=1;
 s.ps.shop.slots=[{kind:'item',id:'hs_bg28_571',basePrice:3,sold:false}];const funds=s.ps.funds;
 assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.lp,1);assert.equal(s.ps.spellState.armor,1);assert.equal(s.ps.funds,funds);
 if(observer==='闪灵')assert.equal(s.ps.layers.kazdelShip,2);else assert.equal(s.ps.growthState.gainGrant,1);
 const p=[...s.ps.hand,...s.ps.temp].find(p=>p?.id==='hs_bg28_571');assert.ok(p);assert.equal(s.ps.castSpell(p.uid).ok,true);assert.equal(s.ps.funds,funds+1);
 assert.equal(s.ps.lp,1);assert.equal(s.ps.spellState.armor,1,'casting does not pay or roll back twice');
});

for(const growthMode of [false,true])test(`without rollback, life purchase retains affordability and armor rules (growth=${growthMode})`,t=>{
 const s=prep(t,{growthMode});s.ps.lp=3;s.ps.shop.slots=[{kind:'item',id:'hs_bg28_571',basePrice:3,sold:false}];
 assert.ok(s.ps.buy(0).error);assert.equal(s.ps.lp,3);assert.equal(s.ps.shop.slots[0].sold,false);
 s.ps.lp=5;s.ps.spellData().armor=1;assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.lp,3);assert.equal(s.ps.spellState.armor,0);
});

for(const elite of [false,true])test(`Warfarin never discovers either grade of herself (${elite?'elite':'normal'})`,t=>{
 const s=prep(t);s.ps.lp=100;
 for(let n=0;n<12;n++)s.ps.acquireChess(id('华法琳',elite),{fromPool:false});
 const offers=s.ps.offers.filter(o=>o.growthSelfDamage);assert.ok(offers.length);
 for(const offer of offers)assert.ok(offer.slots.every(x=>s.ps.gd.chess(x.id).charId!==s.ps.gd.chess(id('华法琳')).charId));
});

test('Warfarin has no discovery when only her own copies remain in the pool',t=>{
 const s=prep(t);for(const [key,e]of s.h.m.pool.entries)e.left=key===id('华法琳')?20:0;
 s.ps.acquireChess(id('华法琳',true),{fromPool:false});assert.equal(s.ps.offers.length,0);assert.equal(s.h.m.errorCount,0);
});

test('actual Forge packages share King purchase rewards, devour conversion and life-payment rollback',{
 skip:!process.env.SP_FORGE_PLUGINS_DIR,
},async t=>{
 const {createPluginRegistry}=await import('../server/plugins/registry.js'),{buildContentSet}=await import('../server/plugins/contentSet.js'),{ROOT}=await import('../server/data.js');
 const registry=createPluginRegistry({publicDir:`${ROOT}/public`,packsDir:`${ROOT}/packs`,dataDir:`${ROOT}/data`,pluginsDir:process.env.SP_FORGE_PLUGINS_DIR},{recheckMs:0,log:{info(){},warn(){}}});
 const set=buildContentSet({registry,ids:['hero-strategies','spell-shop']});assert.deepEqual(set.problems,[]);
 const s=prep(t,{data:set.data});s.put('魔王');s.put('逻各斯');s.tier(3);s.ps.lp=5;
 s.ps.shop.slots=[{kind:'item',id:'hs_bg28_571',basePrice:3,sold:false}];assert.equal(s.ps.buy(0).ok,true);assert.equal(s.ps.lp,5);
 assert.equal(s.ps.growthState.gainGrant,1);s.ps.shop.slots=[slot()];cast(s.ps,'hs_bg28_571');
 assert.equal(s.ps.layers.yanShip||0,0);assert.equal(s.ps.layers.kazdelShip,1);assert.equal(s.ps.layers.skillfulShip,1);assert.equal(s.h.m.errorCount,0);
});

for(const elite of [false,true])test(`actual Forge purchase previews and spell devour include Suzuran with both Kazdel grants (${elite?'elite':'normal'})`,{
 skip:!process.env.SP_FORGE_PLUGINS_DIR,
},async t=>{
 const {createPluginRegistry}=await import('../server/plugins/registry.js'),{buildContentSet}=await import('../server/plugins/contentSet.js'),{ROOT}=await import('../server/data.js');
 const registry=createPluginRegistry({publicDir:`${ROOT}/public`,packsDir:`${ROOT}/packs`,dataDir:`${ROOT}/data`,pluginsDir:process.env.SP_FORGE_PLUGINS_DIR},{recheckMs:0,log:{info(){},warn(){}}});
 const set=buildContentSet({registry,ids:['hero-strategies','spell-shop']});assert.deepEqual(set.problems,[]);
 const s=prep(t,{data:set.data}),m=elite?2:1;
 s.put('铃兰',elite);s.h.m.dispatch(s.ps,'onPrepEnd',{});
 s.put('魔王',elite);s.put('逻各斯');s.tier(3);
 s.ps.acquireChess(id('赫德雷',elite),{fromPool:false});growthSelfDamage(s.ps,1);
 assert.equal(s.ps.growthState.gainGrant,2*m);s.ps.shop.slots=[slot()];
 assert.deepEqual(growthPurchaseView(s.ps,s.ps.shop.slots[0]),[{bondId:'yanShip',layers:5*m},{bondId:'skillfulShip',layers:5*m}]);
 cast(s.ps,'hs_bg28_571');
 assert.equal(s.ps.layers.yanShip||0,0);assert.equal(s.ps.layers.kazdelShip,5*m);assert.equal(s.ps.layers.skillfulShip,5*m);
 assert.equal(s.h.m.errorCount,0);
});

test('Kazdel conversion description stays on the three-member line in plain and rich views',()=>{
 const b=growthData(DATA,true).bonds.kazdelShip;
 for(const text of [b.desc,b.effectDesc,richTextPlain(b.descRaw),richTextPlain(b.effectDescRaw)])assert.match(text,/<在场3名[^\n]+你通过吞噬获得的主盟约层数会全部转为【卡兹戴尔】/);
});
