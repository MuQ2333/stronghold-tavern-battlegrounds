import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDataStore } from '../../public/js/data.js';
import { getData, ROOT } from '../../server/data.js';
import { importForge } from '../../server/plugins/forgeImport.js';
import { buildContentSet } from '../../server/plugins/contentSet.js';
import { createPluginRegistry } from '../../server/plugins/registry.js';

const files = ['chess','garrisons','config','bonds','tokens','items','assets'];
async function catalog() {
  const data = createDataStore({ fetch: async url => ({ ok: true, json: async () => JSON.parse(readFileSync(path.join(ROOT,'data',String(url).split('/').pop()),'utf8')) }) });
  await data.loadAll(files);
  return data;
}

test('explicit catalogs compare tiers, memberships, both-grade traits and bond effects without changing live data', async () => {
  const data = await catalog(), native = data.forGrowthMode(false), growth = data.forGrowthMode(true);
  const bagpipe = native.list('chess').find(c => c.name === '风笛' && !c.isGolden);
  assert.equal(bagpipe.tier,4); assert.equal(growth.lookup('chess',bagpipe.chessId).tier,3);
  for (const id of [bagpipe.chessId, bagpipe.goldenId]) {
    const c = growth.lookup('chess',id);
    assert.ok(c.growthTrait);
    assert.match(growth.lookup('garrisons',c.garrisonIds[0]).desc,/战后保留/);
    assert.notDeepEqual(c.garrisonIds,native.lookup('chess',id).garrisonIds);
  }
  assert.deepEqual(native.lookup('bonds','yanShip').thresholds,[3,6,9]);
  assert.deepEqual(growth.lookup('bonds','yanShip').thresholds,[1,3,6]);
  assert.match(growth.lookup('bonds','egirShip').desc,/攻击力/);
  assert.match(native.lookup('bonds','egirShip').desc,/生命值/);
  assert.ok(growth.lookup('chess','chess_char_9_02_a'));
  assert.equal(native.lookup('chess','chess_char_9_02_a'),null);
  assert.equal(data.lookup('chess',bagpipe.chessId).tier,4);
  let notifications = 0; data.subscribe(() => notifications++);
  growth.list('chess'); native.get('bonds'); assert.equal(notifications,0);
  data.setGrowthMode(true);
  assert.equal(data.lookup('chess',bagpipe.chessId).tier,3);
  assert.equal(native.lookup('chess',bagpipe.chessId).tier,4);
  assert.equal(native.lookup('bands','constructor'),null);
});

test('catalogs follow actual imported Forge content and removal, preserving custom records and cosmetic views', async t => {
  const temp = mkdtempSync(path.join(realpathSync.native(os.tmpdir()),'forge-catalog-'));
  t.after(() => rmSync(temp,{recursive:true,force:true}));
  const input = path.join(temp,'input'), pluginsDir = path.join(temp,'plugins'); mkdirSync(input);
  const base = getData();
  const card = { ...structuredClone(base.chess.chess_char_1_04_a), chessId:'catalog_a', baseId:'catalog_a', goldenId:null,
    name:'Forge catalog guard', tier:5, bonds:['catalogShip'], garrisonIds:['catalogTrait'] };
  const trait = { garrisonId:'catalogTrait',eventType:'IN_BATTLE',effectKey:'GAIN_BUFF',desc:'Forge custom trait',
    descRaw:'Forge <@ba.vup>custom</> <$ba.stun>trait</>',bb:{atk:1.5},bbStr:{} };
  const bond = { ...structuredClone(base.bonds.deputShip),bondId:'catalogShip',name:'Forge catalog alliance',desc:'Forge custom effect',
    descRaw:'Forge <@ba.vup>custom</> effect',effectDesc:'Forge scaled {0:0}',effectDescRaw:'Forge scaled <@ba.vup>{0:0}</>',effectDescParams:[{index:0,base:'base',perStack:'per'}],
    thresholds:[2,4],members:[],visibleMembers:[],buffs:[],bb:{base:1,per:2},bbStr:{} };
  for (const [file,value] of Object.entries({'pack.json':{id:'catalog-audit',version:'1.0.0',content:['chess','garrisons','bonds'],combat:true},'chess.json':{catalog_a:card},'garrisons.json':{catalogTrait:trait},'bonds.json':{catalogShip:bond}})) writeFileSync(path.join(input,file),JSON.stringify(value));
  const imported = await importForge(input,{root:ROOT,pluginsDir,out:path.join(pluginsDir,'catalog-audit'),officialTables:{offline:true}});
  assert.equal(imported.ok,true,JSON.stringify(imported.report));
  const registry = createPluginRegistry({publicDir:path.join(ROOT,'public'),packsDir:path.join(ROOT,'packs'),dataDir:path.join(ROOT,'data'),pluginsDir},{recheckMs:0,log:{info(){},warn(){}}});
  const composed = buildContentSet({registry,ids:['catalog-audit']}); assert.deepEqual(composed.problems,[]);
  const data = await catalog(), views = [data.forGrowthMode(false),data.forGrowthMode(true)];
  data.setContent({id:composed.cs,values:composed.data});
  const c = Object.values(composed.data.chess).find(c => c.name === card.name);
  assert.notEqual(c.chessId,'catalog_a');
  for (const [i,view] of views.entries()) {
    assert.equal(view.lookup('chess',c.chessId).tier,5);
    assert.deepEqual(view.lookup('chess',c.chessId).bonds,c.bonds);
    assert.equal(view.lookup('garrisons',c.garrisonIds[0]).desc,trait.desc);
    assert.equal(view.lookup('garrisons',c.garrisonIds[0]).descRaw,trait.descRaw);
    assert.equal(view.lookup('bonds',c.bonds[0]).desc,bond.desc);
    assert.equal(view.lookup('bonds',c.bonds[0]).descRaw,bond.descRaw);
    assert.equal(view.lookup('bonds',c.bonds[0]).effectDescRaw,bond.effectDescRaw);
    assert.deepEqual(view.lookup('bonds',c.bonds[0]).thresholds,i === 0 ? [2,4] : [1,2]);
  }
  data.setView('assets',a => ({...a,catalogCosmetic:true}));
  assert.ok(views.every(v => v.get('assets').catalogCosmetic));
  data.setContent(null);
  assert.ok(views.every(v => v.lookup('chess',c.chessId) === null));
});
