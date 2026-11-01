import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DATA} from '../match/harness.js';
import {makeBattle} from '../helpers/battleHarness.js';
import {DataSource} from '../../server/sim/simdata.js';
import {setGameData} from '../../server/sim/content/support/index.js';
import {importForge} from '../../server/plugins/forgeImport.js';
import {createPluginRegistry} from '../../server/plugins/registry.js';
import {buildContentSet} from '../../server/plugins/contentSet.js';
import {ROOT} from '../../server/data.js';
import {spawnGrowthOperator} from '../../server/sim/content/garrisons/growthSpawn.js';

test('actual Forge import preserves a late operator kit, namespaced traits and repeated deployment',async t=>{
 const tmpRoot=fs.realpathSync.native(os.tmpdir()),temp=fs.mkdtempSync(path.join(tmpRoot,'forge-dynamic-'));
 t.after(()=>{setGameData(null);assert.ok(path.resolve(temp).startsWith(path.join(tmpRoot,'forge-dynamic-')));fs.rmSync(temp,{recursive:true,force:true});});
 const input=path.join(temp,'input'),pluginsDir=path.join(temp,'plugins');fs.mkdirSync(input);
 const passive={garrisonId:'late_buff',eventType:'IN_BATTLE',effectKey:'GAIN_BUFF',desc:'late passive',bb:{atk:1.5},bbStr:{}};
 const gain={garrisonId:'late_gain',eventType:'IN_BATTLE',effectKey:'act1autochess_gar_event_useskill',desc:'late skill gain',bb:{bond_add_count:2},bbStr:{bond_id:'kjeragShip'}};
 const card={...structuredClone(DATA.chess.chess_char_1_04_a),chessId:'late_a',baseId:'late_a',name:'Dynamic Forge guard',bonds:['kjeragShip'],garrisonIds:['late_buff','late_gain']};
 for(const [name,data] of Object.entries({'pack.json':{id:'dynamic-audit',version:'1.0.0',content:['chess','garrisons'],combat:true},'chess.json':{late_a:card},'garrisons.json':{late_buff:passive,late_gain:gain}}))fs.writeFileSync(path.join(input,name),JSON.stringify(data));
 const imported=await importForge(input,{root:ROOT,pluginsDir,out:path.join(pluginsDir,'dynamic-audit'),officialTables:{offline:true}});
 assert.equal(imported.ok,true,JSON.stringify(imported.report));
 const registry=createPluginRegistry({publicDir:path.join(ROOT,'public'),packsDir:path.join(ROOT,'packs'),dataDir:path.join(ROOT,'data'),pluginsDir},{recheckMs:0,log:{info(){},warn(){}}});
 const on=buildContentSet({registry,ids:['dynamic-audit']});assert.deepEqual(on.problems,[]);
 const rec=Object.values(on.data.chess).find(x=>x.name==='Dynamic Forge guard');assert.ok(rec);assert.notEqual(rec.chessId,'late_a');
 setGameData(on.data);
 const h=makeBattle({data:new DataSource(on.data),units:[{chessId:'chess_char_2_03_a',row:10,col:3}],
   bonds:{kjeragShip:{active:true,count:3,tier:1,layers:10}},autoFinish:false});h.step();
 const p=h.b.players[0],u=h.b._createAllyFromInput(p,{chessId:rec.chessId,row:11,col:3,uid:100});h.b._setupUnit(u);h.b._deploy(u);
 assert.ok(u.kit);assert.ok(u.skill);assert.ok(u.findBuff('bond:kjerag'));
 assert.ok(u.buffs.some(b=>b.key.startsWith('gar:')&&b.mods.atkMul===1.5));
 for(let n=0;n<2;n++){
  const before=p.bonds.kjeragShip.layers;h.b.emit('skillStart',{unit:u,skill:u.skill});assert.equal(p.bonds.kjeragShip.layers,before+2);
  h.b.retreat(u);assert.equal(h.b.redeploy(u),true);
 }
 h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify(h.b.errors));
 const summoned=makeBattle({data:new DataSource(on.data),flags:{growthMode:true},autoFinish:false,
  units:[{uid:1,chessId:'chess_char_2_03_a',row:11,col:7}],
  bonds:{kjeragShip:{active:true,count:1,tier:1,layers:10}}});summoned.step();
 const child=spawnGrowthOperator(summoned.b,summoned.unit(1),rec.chessId);
 assert.ok(child);assert.deepEqual([child.tileR,child.tileC],[10,7],'namespaced Forge operators use the nearest legal tile');
 assert.equal(child.defId,rec.chessId);assert.ok(child.kit);assert.ok(child.skill);
 assert.ok(child.findBuff('bond:kjerag'));assert.ok(child.buffs.some(b=>b.key.startsWith('gar:')&&b.mods.atkMul===1.5));
 summoned.invariants();summoned.b.forceEnd();assert.equal(summoned.b.result().errors,0);
});
