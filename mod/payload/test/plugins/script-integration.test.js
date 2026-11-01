import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {scriptFixture} from '../helpers/scriptFixtures.js';
import {createContentSets} from '../../server/plugins/contentSets.js';
import {createMatchHosts} from '../../server/match/host/index.js';
import {buildContentSet,contentSetFiles} from '../../server/plugins/contentSet.js';
import {getData,ROOT} from '../../server/data.js';
import {loadBrowserSim} from '../../public/js/battle/runner.js';
import {loadContentSet} from '../../public/js/content.js';
import {makeBattle} from '../helpers/battleHarness.js';
import {buildBattleSpec,resultDigest} from '../../server/sim/spec.js';
import {DATA_SHIM_JS} from '../../server/http/static.js';
import {createTrustedRuntime} from '../../server/plugins/trustedRuntime.js';
import {importForge} from '../../server/plugins/forgeImport.js';
import {nodeSha256} from '../../server/plugins/identity.js';
import {applyForgeMatchWrappers,FORGE_MATCH_MARKER} from '../../server/plugins/trustedApi.js';
const quiet={info(){},warn(){},error(){}};
const timeout=(ms)=>new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),ms);timer.unref();});
function template(f){
 const dir=path.join(ROOT,'plugins/_template/script');
 return f.put('script-demo',fs.readFileSync(path.join(dir,'sim/index.js'),'utf8'),JSON.parse(fs.readFileSync(path.join(dir,'plugin.json'))),{
  'sim/index.js':fs.readFileSync(path.join(dir,'sim/index.js'),'utf8'),
  'guard.json':JSON.parse(fs.readFileSync(path.join(dir,'guard.json'))),
 });
}
test('same script battle is bit-identical in match child and loadBrowserSim, spectator fetches no scripts',async t=>{
 const f=scriptFixture(t);template(f);
 const built=buildContentSet({registry:f.registry,ids:['script-demo']});assert.deepEqual(built.problems,[]);
 const calls=[], served=contentSetFiles(built);
 const fetch=async url=>{
  calls.push(url);let body;
  if(url.startsWith('/cs/'))body=served.get(url.split('/').slice(3).join('/'))?.body;
  else body=fs.readFileSync(path.join(ROOT,url.split('?')[0].slice(1)));
  return {ok:!!body,arrayBuffer:async()=>new Uint8Array(body).buffer};
 };
 const spectator=await loadContentSet(built.cs,{fetch,retryDelays:[]});assert.equal(spectator.canSim,false);assert.equal(spectator.scripts.length,0);assert.ok(!calls.some(x=>x.includes('/scripts/')));
 const accepted=await loadContentSet(built.cs,{fetch,consent:true,retryDelays:[]});assert.equal(accepted.scripts.length,1);
 const runtime=path.join(f.root,'runtime');fs.mkdirSync(path.join(runtime,'server'),{recursive:true});
 // as the browser gets /sim/: no Node loader (by file name: cpSync passes `\` paths on Windows), else a cyclic import
 // simdata.js → nodeData.js → the data.js shim → simdata.js deadlocks loadBrowserSim
 fs.cpSync('server/sim',path.join(runtime,'server/sim'),{recursive:true,filter:src=>path.basename(src)!=='nodeData.js'});
 assert.equal(fs.existsSync(path.join(runtime,'server/sim/nodeData.js')),false);
 fs.cpSync('shared',path.join(runtime,'shared'),{recursive:true});
 fs.writeFileSync(path.join(runtime,'package.json'),'{"type":"module"}');fs.writeFileSync(path.join(runtime,'server/data.js'),DATA_SHIM_JS);
 const base=pathToFileURL(path.join(runtime,'server/sim')).href+'/';
 const sim=await loadBrowserSim({base,data:built.data,cs:built.cs,bounds:built.bounds,scripts:accepted.scripts,hashInput:built.index});
 const h=makeBattle({stageId:'act1autochess_m01',units:[],timeLimit:3});
 const spec=buildBattleSpec({...h.b.opts,cs:built.cs,stageId:'act1autochess_m01',players:[{playerId:'p1',seat:0,units:[{uid:'guard',chessId:'chess_x_script_demo_guard_a',row:9,col:5}]}]});
 const browser=sim.spec.createBattleFromSpec(spec,sim.ds);browser.start();for(let i=0;i<90;i++)browser.step();
 assert.equal(browser.allyUnits[0].kit.generic,undefined);assert.ok(browser.allyUnits[0].s.atk>200);
 const contents=createContentSets({registry:f.registry,vanillaData:getData()});const set=contents.resolve(['script-demo']);assert.ok(set.ok,JSON.stringify(set));
 const hosts=createMatchHosts({contents,log:quiet,options:{matchOptions:{scriptSpec:spec},matchModule:fileURLToPath(new URL('./fixtures/scriptBattleMatch.js',import.meta.url))}});t.after(()=>hosts.close());
 let resolve;const message=new Promise(r=>{resolve=r;});
 const m=hosts.create(built.cs,{roomCode:'TEST',seats:[],scriptSpec:spec,broadcast:resolve,send(){},onEnd(){}});m.start();
 const result=await Promise.race([message,timeout(15000)]);
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.snapshot,browser.snapshot());assert.deepEqual(result.digest,resultDigest(browser.result()));m.dispose();
});
test('all-bot match completes with script content and meta effects in production child', {timeout:120000},async t=>{
 const f=scriptFixture(t);f.put('training',`export default sp => {
 sp.content.register({install(b){b.on('battleStart',()=>{for(const u of b.allyUnits)b.addBuff(u,{key:'test',mods:{atkFlat:2}});});}});
 sp.meta.register('global:training',{onRoundStart(ctx){ctx.addFunds(1);}});
 }`,{permissions:['sim.code','meta.code'],entry:{sim:'index.js',meta:'index.js'}});
 const contents=createContentSets({registry:f.registry,vanillaData:getData()});const r=contents.resolve(['training']);assert.ok(r.ok,JSON.stringify(r));
 const hosts=createMatchHosts({contents,log:quiet,options:{virtualTime:true,matchOptions:{botRehearsal:0}}});t.after(()=>hosts.close());
 let end;const done=new Promise(resolve=>{end=resolve;});
 const match=hosts.create(r.set.cs,{roomCode:'BOTS',mode:'coop',difficulty:'NORMAL',modeId:'mode_multi_normal',
  seats:Array.from({length:4},(_,i)=>({seat:i,playerId:'ai_'+i,name:'Bot '+i,isBot:true,connected:true})),spectators:[],seed:7,matchNo:1,cs:r.set.cs,requireCs:true,
  broadcast(){},send(){return true;},onEnd:end});match.start();
 const summary=await Promise.race([done,timeout(100000)]);assert.equal(typeof summary.victory,'boolean');
 const d=await match.diag();assert.equal(d.errorCount,0,JSON.stringify(d.errors));assert.equal(d.simErrors,0);match.dispose();
});
test('trusted activate routes, immutable lobby copies and health run in a child',async t=>{
 const f=scriptFixture(t);f.put('service','export default () => {};',{class:'trusted',scope:['server'],permissions:['trusted.server'],entry:{server:'server.js'}},{'server.js':`
 export function activate(api){let joined=0;api.http.route('/x/service/status',()=>({joined}));
 api.lobby.on('playerJoined',e=>{if(!Object.isFrozen(e.room))throw Error('mutable');joined++;api.health.extend({joined});});api.health.extend({joined});}
 `});
 const runtime=await createTrustedRuntime({registry:f.registry,log:quiet});assert.ok(runtime);t.after(()=>runtime.close());
 runtime.event('playerJoined',{room:{code:'TEST'}});
 const response=await new Promise(resolve=>{runtime.route({url:'/x/service/status',method:'GET'},{writeHead(){},end:body=>resolve(JSON.parse(body))});});
 assert.deepEqual(response,{joined:1});assert.deepEqual(runtime.health.service,{joined:1});
});
test('trusted Forge matchClass wrapper runs only in its selected isolated match host', {timeout:60000},async t=>{
 const f=scriptFixture(t), sourceDir=path.join(f.root,'forge-source');
 fs.mkdirSync(path.join(sourceDir,'server'),{recursive:true});
 fs.writeFileSync(path.join(sourceDir,'pack.json'),JSON.stringify({id:'forge-wrap',name:'Forge wrapper',version:'1.0.0',combat:true,
  matchKinds:[{id:'z_kind',seats:{min:6,max:6}},{id:'a_kind',label:' Test '}],
  server:{modules:[{id:'main',entry:'server/main.mjs',uses:['matchClass']}]}}));
 fs.writeFileSync(path.join(sourceDir,'server/main.mjs'),`globalThis.__forgeImportProbe = 1;
 export function registerServer(host){
  const kinds=host.matchKinds();
  if(!Object.isFrozen(kinds) || !Object.isFrozen(kinds[0])) throw Error('match kinds must be immutable');
  if(host.module!=='main')throw Error('wrong module id');
  try{host.healthz(()=>({}));throw Error('undeclared hook accepted');}catch(e){if(e.code!=='MODULE_USE_UNDECLARED')throw e;}
  host.matchClass(Base=>class extends Base {
   constructor(opts){if(!opts.mods?.packs.some(p=>p.id===host.pack))throw Error('missing opts.mods');super(opts);if(!this.mods?.digest)throw Error('missing match mods');}
   start(){ this.broadcastFn({t:'m.ticker',value:host.pack,kinds}); return super.start(); }
  });
 }`);
 const output=path.join(f.pluginsDir,'forge-wrap');
 const imported=await importForge(sourceDir,{root:ROOT,pluginsDir:f.pluginsDir,out:output,officialTables:{offline:true}});
 assert.equal(imported.ok,true,imported.markdown);
 assert.equal(globalThis.__forgeImportProbe,undefined,'import must not execute workshop code');
 assert.equal(imported.report.products[0].class,'trusted');
 assert.ok(!imported.report.skipped.some(row=>row.path==='pack.json:server'));
 assert.equal(imported.report.needsManualAdaptation,true,'custom match seats and other server uses remain explicit');
 f.registry.rescan();
 assert.equal(f.registry.plugin('forge-wrap')?.status,'disabled','unapproved code remains disabled');
 assert.ok(buildContentSet({registry:f.registry,ids:['forge-wrap']}).problems.length);
 f.pins['forge-wrap']=nodeSha256(fs.readFileSync(path.join(output,'plugin.lock.json')));
 fs.writeFileSync(path.join(f.pluginsDir,'config.json'),JSON.stringify({trusted:f.pins,classes:{trusted:true}}));
 f.registry.rescan();
 assert.equal(f.registry.plugin('forge-wrap')?.status,'loaded',JSON.stringify(f.registry.plugin('forge-wrap')));
 const runtime=await createTrustedRuntime({registry:f.registry,log:quiet});
 assert.equal(runtime,null,'room-only wrapper is not run at server startup');
 assert.equal(globalThis.__forgeImportProbe,undefined);
 const contents=createContentSets({registry:f.registry,vanillaData:getData()});
 const r=contents.resolve(['forge-wrap']);assert.ok(r.ok,JSON.stringify(r));
 const notes=[];const hosts=createMatchHosts({contents,log:{info:(...a)=>notes.push(a.join(' ')),warn:(...a)=>notes.push(a.join(' ')),error:(...a)=>notes.push(a.join(' '))},options:{virtualTime:true,matchOptions:{botRehearsal:0}}});t.after(()=>hosts.close());
 let receive;const got=new Promise(resolve=>{receive=resolve;});
 let end;const done=new Promise(resolve=>{end=resolve;});
 const match=hosts.create(r.set.cs,{roomCode:'FORGE',mode:'coop',difficulty:'NORMAL',modeId:'mode_multi_normal',
  seats:Array.from({length:4},(_,i)=>({seat:i,playerId:`ai_${i}`,name:'Bot',isBot:true,connected:true})),spectators:[],seed:7,matchNo:1,cs:r.set.cs,requireCs:true,
  broadcast:message=>{if(message.t==='m.ticker')receive(message);},send(){return true;},onEnd:end});
 match.start();
 const result=await Promise.race([got,timeout(15000)]).catch(e=>{throw new Error(`${e.message}: ${notes.join(' | ')}`);});
 assert.deepEqual(result,{t:'m.ticker',value:'forge-wrap',kinds:[{id:'a_kind',label:'Test'},{id:'z_kind',seats:{min:6,max:6}}]});
 const summary=await Promise.race([done,timeout(45000)]);assert.equal(typeof summary.victory,'boolean');
 match.dispose();
 const alternate=path.join(f.root,'forge-alternate');fs.mkdirSync(path.join(alternate,'server'),{recursive:true});
 fs.writeFileSync(path.join(alternate,'pack.json'),JSON.stringify({id:'forge-alt',name:'Forge alternate',version:'1.0.0',combat:true,
  server:{modules:[{id:'main',entry:'server/main.mjs',uses:['matchClass']}]}}));
 fs.writeFileSync(path.join(alternate,'server/main.mjs'),`export function registerServer(host){host.matchClass(()=>class {
  constructor(opts){this.opts=opts;}
  start(){this.opts.broadcast({t:'m.ticker',value:this.opts.mods.packs[0].id});}
  dispose(){}
 });}`);
 const altDir=path.join(f.pluginsDir,'forge-alt');
 const alt=await importForge(alternate,{root:ROOT,pluginsDir:f.pluginsDir,out:altDir,officialTables:{offline:true}});
 assert.equal(alt.ok,true,alt.markdown);
 f.pins['forge-alt']=nodeSha256(fs.readFileSync(path.join(altDir,'plugin.lock.json')));
 fs.writeFileSync(path.join(f.pluginsDir,'config.json'),JSON.stringify({trusted:f.pins,classes:{trusted:true}}));
 f.registry.rescan();
 const other=contents.resolve(['forge-alt']);assert.ok(other.ok,JSON.stringify(other));
 let receiveAlt;const gotAlt=new Promise(resolve=>{receiveAlt=resolve;});
 const m2=hosts.create(other.set.cs,{roomCode:'ALT',mode:'coop',difficulty:'NORMAL',modeId:'mode_multi_normal',
  seats:[{seat:0,playerId:'p1',name:'P',isBot:false,connected:true}],spectators:[],seed:8,matchNo:1,cs:other.set.cs,requireCs:true,
  broadcast:message=>{if(message.t==='m.ticker')receiveAlt(message);},send(){return true;},onEnd(){}});
 m2.start();assert.deepEqual(await Promise.race([gotAlt,timeout(15000)]),{t:'m.ticker',value:'forge-alt'});m2.dispose();
});
test('Forge match wrappers keep source pack order and never execute sandbox or unrelated entries',async()=>{
 const script=(id,cls='trusted',source=FORGE_MATCH_MARKER)=>({id,class:cls,execution:cls==='trusted'?'trusted':'sandbox',
  manifestSource:JSON.stringify({permissions:['trusted.server'],entry:{server:'s.js'}}),sources:{'s.js':source}});
 const seen=[];
 const load=async (_source,id)=>({__spForge:{packId:id,matchKinds:[]},registerServer(host){
  host.matchClass(Base=>class extends Base { order(){return [...super.order(),id];} });
 }});
 class Base {order(){return [];}}
 const wrapped=await applyForgeMatchWrappers(Base,[script('z'),script('ignored','script'),script('a'),script('other','trusted','unrelated')],
  {importModule:async (source,id)=>{seen.push(id);return load(source,id);}});
 assert.deepEqual(new wrapped().order(),['a','z']);
 assert.deepEqual(seen.sort(),['a','z']);
 await assert.rejects(()=>applyForgeMatchWrappers(Base,[script('bad')],{importModule:async()=>({__spForge:{packId:'bad',matchKinds:[]},registerServer(host){host.matchClass(()=>({}));}})}),/match class/);
 const independent=await applyForgeMatchWrappers(Base,[script('independent')],{importModule:async()=>({__spForge:{packId:'independent',matchKinds:[]},registerServer(host){host.matchClass(()=>class {order(){return ['custom'];}});}})});
 assert.deepEqual(new independent().order(),['custom']);
});
test('unsupported Forge server module dependencies are reported without execution',async t=>{
 const f=scriptFixture(t), sourceDir=path.join(f.root,'source');fs.mkdirSync(path.join(sourceDir,'server'),{recursive:true});
 fs.writeFileSync(path.join(sourceDir,'pack.json'),JSON.stringify({id:'needs-import',name:'Unsupported',version:'1.0.0',combat:true,
  server:{modules:[{id:'main',entry:'server/main.mjs',uses:['matchClass']}]}}));
 fs.writeFileSync(path.join(sourceDir,'server/main.mjs'),`export function registerServer(host){import('node:fs');host.matchClass(Base=>Base);}`);
 const got=await importForge(sourceDir,{root:ROOT,pluginsDir:f.pluginsDir,out:path.join(f.pluginsDir,'needs-import'),officialTables:{offline:true}});
 assert.equal(got.ok,true,got.markdown);
 assert.equal(got.report.needsManualAdaptation,true);
 assert.ok(got.report.skipped.some(row=>row.path==='pack.json:server'));
 assert.ok(!got.report.products.some(p=>p.class==='trusted'));
});
test('trusted Forge lifecycle module runs after listen and before shutdown', {timeout:60000},async t=>{
 const f=scriptFixture(t), sourceDir=path.join(f.root,'lifecycle-source');fs.mkdirSync(path.join(sourceDir,'server'),{recursive:true});
 fs.writeFileSync(path.join(sourceDir,'pack.json'),JSON.stringify({id:'forge-life',name:'Lifecycle',version:'1.0.0',
  server:{modules:[{id:'lifecycle',entry:'server/main.mjs',uses:['boot','shutdown','healthz']}]}}));
 fs.writeFileSync(path.join(sourceDir,'server/main.mjs'),`globalThis.__forgeLifecycleProbe = 1;
 let checks=0;export function registerServer(host){
  host.onBoot(config=>host.log.info('forge-boot',config.port,Object.isFrozen(config),Object.isFrozen(config.env)));
  host.onShutdown(()=>host.log.info('forge-shutdown'));
  host.healthz(()=>{checks++;return checks===3?{invalid:{nested:true}}:{checks,pack:host.pack};});
 }`);
 const output=path.join(f.pluginsDir,'forge-life');
 const imported=await importForge(sourceDir,{root:ROOT,pluginsDir:f.pluginsDir,out:output,officialTables:{offline:true}});
 assert.equal(imported.ok,true,imported.markdown);
 assert.equal(imported.report.products[0].class,'trusted');
 assert.equal(globalThis.__forgeLifecycleProbe,undefined,'import must not execute module source');
 f.registry.rescan();assert.equal(f.registry.plugin('forge-life')?.status,'disabled');
 f.pins['forge-life']=nodeSha256(fs.readFileSync(path.join(output,'plugin.lock.json')));
 fs.writeFileSync(path.join(f.pluginsDir,'config.json'),JSON.stringify({trusted:f.pins,classes:{trusted:true}}));
 const previous=process.env.SP_PLUGIN_SCRIPTS;process.env.SP_PLUGIN_SCRIPTS='trusted';
 t.after(()=>{if(previous===undefined)delete process.env.SP_PLUGIN_SCRIPTS;else process.env.SP_PLUGIN_SCRIPTS=previous;});
 const lines=[];const log={info:(...a)=>lines.push(a.join(' ')),warn:(...a)=>lines.push(a.join(' ')),error:(...a)=>lines.push(a.join(' ')),debug(){}};
 const {startServer}=await import('../../server/index.js');
 const server=await startServer({host:'127.0.0.1',port:0,pluginsDir:f.pluginsDir,assetIndex:false,studio:false,log});
 t.after(()=>server.close());
 assert.ok(lines.some(s=>s.includes(`forge-boot ${new URL(server.url).port} true true`)),lines.join('\n'));
 assert.equal(lines.filter(s=>s.includes('forge-boot')).length,1);
 const first=await (await fetch(`${server.url}/healthz`)).json();
 const second=await (await fetch(`${server.url}/healthz`)).json();
 assert.deepEqual(first.modHealth['forge-life'],{checks:1,pack:'forge-life'});
 assert.deepEqual(second.modHealth['forge-life'],{checks:2,pack:'forge-life'});
 const invalid=await (await fetch(`${server.url}/healthz`)).json();
 assert.equal(invalid.modHealth,undefined);
 assert.ok(lines.some(s=>s.includes('invalid Forge health fields')));
 await server.close();
 assert.equal(lines.filter(s=>s.includes('forge-shutdown')).length,1);
});
test('CLI test runs the template harness with composed data',t=>{
 const f=scriptFixture(t);const dir=template(f);
 fs.mkdirSync(path.join(dir,'test'));let source=fs.readFileSync('plugins/_template/script/test/guard.test.js','utf8');
 source=source.replace('../../../test/helpers/battleHarness.js',pathToFileURL(path.join(ROOT,'test/helpers/battleHarness.js')).href);
 fs.writeFileSync(path.join(dir,'test/guard.test.js'),source);
 fs.symlinkSync(path.join(ROOT,'data'),path.join(f.root,'data'),process.platform==='win32'?'junction':'dir');fs.symlinkSync(path.join(ROOT,'server'),path.join(f.root,'server'),process.platform==='win32'?'junction':'dir');fs.symlinkSync(path.join(ROOT,'shared'),path.join(f.root,'shared'),process.platform==='win32'?'junction':'dir');
 // This explicit local command ignores both server mode and the pin (even after test files changed).
 fs.writeFileSync(path.join(f.pluginsDir,'config.json'),JSON.stringify({trusted:{'script-demo':'wrong-pin'}}));
 const env={...process.env,SP_PLUGIN_SCRIPTS:'sandbox'};delete env.NODE_TEST_CONTEXT;
 const r=spawnSync(process.execPath,['tools/plugin.mjs','test','script-demo','--root',f.root],{encoding:'utf8',timeout:20000,env});
 assert.equal(r.status,0,r.stdout+r.stderr);assert.match(r.stdout,/ℹ pass 1\b/); // spec on every Node version
});
