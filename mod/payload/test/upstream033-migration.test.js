import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {APP_VERSION} from '../shared/constants.js';
import {DATA,makeMatch} from './match/harness.js';
import {growthData} from '../shared/growthMode.js';
import {tavernModsForVersion,supportsTavernMods} from '../shared/tavernMods.js';
import {createDataStore} from '../public/js/data.js';
import {trackCombat} from '../shared/combatMetrics.js';
import {makeBattle,enemyRec,chessRec} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';

test('0.3.3 keeps current growth rules on the designed roster and rejects cross-period ID reuse',()=>{
 assert.equal(APP_VERSION,'0.3.3');assert.equal(JSON.parse(fs.readFileSync('package.json')).version,'0.3.3');
 assert.equal(supportsTavernMods('act2autochess'),true);
 assert.deepEqual(tavernModsForVersion({spells:true,heroes:true,growth:true},'act2autochess'),{spells:true,heroes:true,growth:true});
 for(const version of ['act1autochess','act1autochess@V1_1','act2autochess@V2_1']){
  assert.equal(supportsTavernMods(version),false);
  assert.deepEqual(tavernModsForVersion({spells:true,heroes:true,growth:true},version),{spells:false,heroes:false,growth:false});
  const data={...DATA,config:{...DATA.config,version:{id:version}}};assert.equal(growthData(data,true),data);
  const h=makeMatch({data,version,growthMode:true,spellShop:true,heroMod:true,fake:true});
  assert.equal(h.m.growthMode,false);assert.equal(h.m.spellShop,false);assert.equal(h.m.heroMod,false);h.m.dispose();
 }
});

test('first-period client records survive growth previews and do not pick up Tavern hero/spell ID overrides',async()=>{
 for(const dir of ['act1autochess','act1autochess-v1_1','act2autochess-v2_1']){
  const files=Object.fromEntries(['config','chess','bands','items','bonds','garrisons'].map(n=>[n,JSON.parse(fs.readFileSync(path.join('data/versions',dir,n+'.json')))]));
  const store=createDataStore({fetch:async u=>({ok:true,json:async()=>files[path.basename(u,'.json')]})});await store.loadAll(Object.keys(files));
  store.setGrowthMode(true);assert.equal(store.get('chess'),files.chess);assert.equal(store.get('bands'),files.bands);
  const id='chess_item_2_03_e_b';assert.deepEqual(store.lookup('items',id),files.items[id]);
  assert.equal(store.forGrowthMode(true).get('chess'),files.chess);assert.equal(store.lookup('chess','chess_char_2_30_a'),files.chess.chess_char_2_30_a??null);
 }
});

test('shared damage meter records the 0.3.3 object healing API without losing legacy healing',()=>{
 const a=chessRec({id:'meter_a',stats:{maxHp:1000}}),b=chessRec({id:'meter_b',stats:{maxHp:1000}});
 const data=new DataSource({chess:{meter_a:a,meter_b:b},enemies:{dummy:enemyRec({key:'dummy',hp:1e6})}});
 const h=makeBattle({data,autoFinish:false,units:[{chessId:'meter_a',uid:1,row:10,col:3},{chessId:'meter_b',uid:2,row:10,col:4}]});h.step();
 const meter=trackCombat(h.b),source=h.unit(1),target=h.unit(2);
 h.b.loseHp(target,400);h.b.heal({source,target,amount:100});h.b.heal(source,target,150);
 assert.equal(meter().rows.find(r=>r.uid===1).healing,250);
 h.b.heal({source,credit:null,target,amount:40});assert.equal(meter().rows.find(r=>r.uid===1).healing,250);
 h.b.heal({source:null,credit:source,target,amount:50});assert.equal(meter().rows.find(r=>r.uid===1).healing,300);
 meter.stop();h.b.forceEnd();assert.equal(h.b.result().errors,0);
});
