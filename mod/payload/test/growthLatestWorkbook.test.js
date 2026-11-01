import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './match/harness.js';
import {growthData} from '../shared/growthMode.js';
import {DataSource} from '../server/sim/simdata.js';
import {makeBattle} from './helpers/battleHarness.js';
import {spawnGrowthOperator} from '../server/sim/content/garrisons/growthSpawn.js';

for(const elite of [false,true])test(`Gladiia halves base HP, adds ordinary ATK bonus and retains gain replay (${elite?'elite':'normal'})`,()=>{
 const id=`chess_char_4_12_${elite?'b':'a'}`,d=growthData(DATA,true),rec=d.chess[id];
 assert.equal(rec.stats.maxHp,DATA.chess[id].stats.maxHp*0.5);
 const desc=d.garrisons[rec.garrisonIds[0]].desc;assert.match(desc,/生命上限-50%，攻击力\+100%/);assert.match(desc,/<被击倒时>/);assert.doesNotMatch(desc,/乘区|基础面板/);
 assert.equal(rec.growthTrait.handler,'deathGain');
 const changed=new DataSource(d),native=new DataSource(DATA);
 for(const loadout of [null,{moduleId:'none'},{potential:1}])assert.equal(changed.getChess(id,loadout).stats.maxHp,native.getChess(id,loadout).stats.maxHp*0.5,'module and potential choices preserve base HP reduction');
 const f=makeBattle({data:new DataSource(d),flags:{growthMode:true},autoFinish:false,units:[{uid:1,chessId:id,row:10,col:3}]});f.step();
 const u=f.unit(1);assert.equal(u.base.maxHp,rec.stats.maxHp);assert.equal(u.findBuff('growth:gladiiaAtk').mods.atkPct,1);
 const hp=u.s.maxHp;f.b.addBuff(u,{key:'test:flatHP',mods:{hpFlat:100}});assert.equal(u.s.maxHp-hp,100,'flat HP is added after the base reduction');
 const child=spawnGrowthOperator(f.b,u,id);assert.ok(child);assert.equal(child.base.maxHp,u.base.maxHp);assert.equal(child.findBuff('growth:gladiiaAtk').mods.atkPct,1);
 f.b.forceEnd();assert.equal(f.b.result().errors,0);
});

for(const elite of [false,true])test(`latest workbook Leizi grants actual coins only on sale (${elite?'elite':'normal'})`,t=>{
 const h=makeMatch({mode:'solo',growthMode:true,spellShop:true,fake:true}).start();t.after(()=>h.m.dispose());h.toPrep();
 const ps=h.ps('p_0');ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.bandId=null;ps.recompute();
 const pending=ps.pendingFunds,p=ps.acquireChess(`chess_char_1_03_${elite?'b':'a'}`,{fromPool:false});
 assert.equal(ps.pendingFunds,pending,'the removed gain-income trait no longer fires');
 const value=()=>[...ps.hand,...ps.temp].filter(p=>p?.kind==='item'&&/^chess_item_1_03_e_[ab]$/.test(p.id)).reduce((n,p)=>n+(ps.gd.isGolden(p.id)?2:1),0);
 const before=value();assert.equal(ps.sell(p.uid).ok,true);assert.equal(value()-before,elite?2:1);
 assert.equal(ps.pendingFunds,pending);assert.equal(h.m.errorCount,0);
});

for(const growth of [false,true])for(const elite of [false,true])test(`Caper damage and Gummy SP follow actual ${growth?'growth':'native'} rules (${elite?'elite':'normal'})`,()=>{
 const data=new DataSource(growth?growthData(DATA,true):DATA),grade=elite?'b':'a';
 const f=makeBattle({data,flags:{growthMode:growth},autoFinish:false,units:[
  {uid:1,chessId:`chess_char_1_09_${grade}`,row:10,col:3},
  {uid:2,chessId:`chess_char_1_10_${grade}`,row:10,col:4},
 ]});f.step();
 const caper=f.unit(1),gummy=f.unit(2),enemy=f.spawn('enemy_1001_1',{pos:[5,5]});
 const hurt=tags=>{enemy.def={...enemy.def,tags};const before=enemy.hp;f.b.dealDamage(caper,enemy,{amount:100,type:'true',canDodge:false});return Math.round(before-enemy.hp);};
 assert.equal(hurt([]),growth?(elite?180:140):100);
 assert.equal(hurt(['drone']),growth?(elite?180:140):(elite?200:150));
 const want=growth?(elite?0.5:0.25):(elite?0.3:0.15);
 assert.equal(gummy.s.spRecovery,gummy.base.spRecovery+want);
 if(growth) {
  f.b.retreat(gummy);assert.equal(f.b.redeploy(gummy,{free:true}),true);f.step();assert.equal(gummy.s.spRecovery,gummy.base.spRecovery+want,'redeployment does not double the bonus');
  const child=spawnGrowthOperator(f.b,gummy,gummy.defId);assert.ok(child);assert.equal(child.s.spRecovery,child.base.spRecovery+want,'a mid-battle copy receives the new trait');
 }
 f.b.forceEnd();assert.equal(f.b.result().errors,0);
});
