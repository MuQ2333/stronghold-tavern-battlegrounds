// A metadata-only Forge bond probe verifies namespacing and the shared layer display pipeline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importForge } from '../../server/plugins/forgeImport.js';
import { createPluginRegistry } from '../../server/plugins/registry.js';
import { buildContentSet } from '../../server/plugins/contentSet.js';
import { getData, ROOT } from '../../server/data.js';
import { makeMatch } from '../match/harness.js';
import { liveBondLayers } from '../../server/match/liveLayers.js';
import { validHostMessage } from '../../server/match/host/ipc.js';
import { liveLayerHud } from '../../public/js/ui/liveLayerHud.js';
import { stripView, popupView } from '../../public/js/ui/watchBonds.js';
import { formatLayerCount } from '../../public/js/ui/layerCount.js';
import {settleGrowthLayers} from '../../server/match/growthLayerSettlement.js';

test('imported Forge bond IDs retain live values, uncapped growth, popup identity and isolated-host wire data', async t => {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()), 'forge-layers-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const input = path.join(temp, 'input'), pluginsDir = path.join(temp, 'plugins'); fs.mkdirSync(input);
  fs.writeFileSync(path.join(input, 'pack.json'), JSON.stringify({ id: 'layer-audit', version: '1.0.0', content: ['bonds'], combat: true }));
  const record = { ...structuredClone(getData().bonds.deputShip), bondId: 'auditShip', name: 'Layer audit', isCore: true, members: [], visibleMembers: [], buffs: [], bb: {}, bbStr: {} };
  fs.writeFileSync(path.join(input, 'bonds.json'), JSON.stringify({ auditShip: record }));
  const imported = await importForge(input, { root: ROOT, pluginsDir, out: path.join(pluginsDir, 'layer-audit'), officialTables: { offline: true } });
  assert.equal(imported.ok, true, JSON.stringify(imported.report));
  const registry = createPluginRegistry({ publicDir: path.join(ROOT,'public'), packsDir: path.join(ROOT,'packs'), dataDir: path.join(ROOT,'data'), pluginsDir }, { recheckMs: 0, log: { info() {}, warn() {} } });
  const on = buildContentSet({ registry, ids: ['layer-audit'] }); assert.deepEqual(on.problems, []);
  const id = Object.keys(on.data.bonds).find(id => on.data.bonds[id].name === 'Layer audit');
  assert.ok(id && id !== 'auditShip', 'the actual importer assigned a namespaced ID');
  const h = makeMatch({ mode: 'solo', test: true, growthMode: true, data: on.data }); t.after(() => h.m.dispose());
  const base = [{ bondId: id, layers: 999, active: true, count: 2, tier: 1 }];
  const b = h.m.newBattle({ fieldId: 'n:p_0', kind: 'boss', players: [{ playerId: 'p_0', bonds: { [id]: base[0] }, units: [] }], spawns: [], routes: [], content: 'none', autoFinish: false, flags: { growthMode: true, layerGainsEnabled: false } });
  assert.equal(b.addLayers('p_0',id,20301,'audit',{ temporary: true }),20301);
  h.m.fields = [{ fieldId: 'n:p_0', kind: 'boss', players: ['p_0'], battle: b, live: true }];
  h.m._sendField('p_0','n:p_0');
  const frame = h.sent.filter(([,m]) => m.t === 'b.snap').at(-1)[1];
  assert.deepEqual(frame.bondLayers, liveBondLayers(b));
  assert.ok(validHostMessage({ type: 'send', matchId: on.cs, playerId: 'p_0', msg: frame }));
  const live = liveLayerHud(null, frame).bondLayers;
  const pub = { growthMode: true, players: [{ playerId: 'p_0', bonds: base }] }, priv = { bonds: base };
  const strip = stripView({ pub, priv, myId: 'p_0', fieldId: 'n:p_0', live });
  assert.equal(strip.bonds[0].bondId, id); assert.equal(strip.bonds[0].layers, 21300);
  assert.equal(formatLayerCount(strip.bonds[0].layers),'21.3k');
  assert.equal(popupView({ open: { id, ownerId: 'p_0' }, pub, priv, myId: 'p_0', live }).entry.layers,21300);
  assert.deepEqual(b._pp('p_0').layerGains, {}, 'the imported temporary effect has not become permanent');
  const opening=h.m.newBattle({fieldId:'overflow:p_0',kind:'normal',players:[{playerId:'p_0',units:[],
    bonds:{[id]:{active:true,count:1,tier:1,layers:50},swiftShip:{active:true,count:1,tier:1,layers:1150}}}],
    spawns:[],routes:[],autoFinish:false,flags:{growthMode:true,layerGainsEnabled:false}});
  opening.start();
  assert.equal(opening.getPlayer('p_0').bonds[id].layers,201,'an actually imported Forge main receives full Swift excess');
  assert.equal(opening.getPlayer('p_0').bonds.swiftShip.layers,1150);
  opening.forceEnd();assert.equal(opening.result().errors,0);
  assert.deepEqual(opening.result().perPlayer.p_0.layerGains,{});
  const ps=h.ps('p_0');ps.layers[id]=50;
  for(const kind of ['unite','boss','hidden']) {
    const before=ps.layers[id];
    const field=h.m.newBattle({fieldId:`${kind}:p_0`,kind,players:[{playerId:'p_0',units:[],bonds:{[id]:{active:true,count:1,tier:1,layers:before}}}],
      spawns:[],routes:[],content:'none',autoFinish:false,flags:{growthMode:true,layerGainsEnabled:true}});
    field.start();field.addLayers('p_0',id,7,'forge-permanent');field.addLayers('p_0',id,11,'forge-temporary',{temporary:true});field.forceEnd();
    assert.equal(field.result().errors,0);assert.equal(field.result().perPlayer.p_0.layerGains[id],7);
    settleGrowthLayers(h.m,ps,field.result().perPlayer.p_0);assert.equal(ps.layers[id],before+7,`${kind}: namespaced permanent gains only`);
  }
});
