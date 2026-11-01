import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from '../e2e/client.mjs';

for (const forge of [false,true]) test(`live battle speed selector, pause and resync (Forge=${forge})`,{
  skip:process.env.SP_E2E !== '1' || !process.env.CHROME_PATH || (forge && !process.env.SP_FORGE_PLUGINS_DIR),timeout:120000,
}, async () => {
  const {startServer}=await import('../../server/index.js'), puppeteer=(await import('puppeteer-core')).default;
  const old=process.env.SP_TEST_MODE;process.env.SP_TEST_MODE='1';let srv;
  try {srv=await startServer({port:0,host:'127.0.0.1',quiet:true,pluginsDir:forge?process.env.SP_FORGE_PLUGINS_DIR:undefined});}
  finally {if(old===undefined) delete process.env.SP_TEST_MODE;else process.env.SP_TEST_MODE=old;}
  const c=new Client(puppeteer,srv.url,'Speed',{w:1600,h:900});
  try {
    await c.open();await c.enter('Speed');await c.click('.mode-card','独立模拟');await c.click('.diff-card','险境模拟');
    await c.page.waitForSelector('[data-testid="create-test"] input');
    await c.page.click('[data-testid="create-test"] input');await c.click('.proto-start','开始独立模拟');await c.waitFor(s=>!!s.room?.code,'room');
    await c.page.evaluate(async forge => {
      const {net}=await import('/js/net.js');await net.request('room.setTavernMods',{mods:{growth:true,spells:true,heroes:false}});
      if(forge)await net.request('room.setPlugins',{plugins:['hero-strategies','spell-shop','hero-strategies-look'].map(id=>({id}))});
    },forge);
    await c.click('.room-bar__right button','开始模拟');await c.waitFor(s=>s.phase==='INFO_CHECK','briefing');
    await c.click('.brief__foot .btn--primary','准备就绪');await c.waitFor(s=>s.phase==='BAND_DRAFT','draft');
    await c.page.evaluate(async()=>{const {net}=await import('/js/net.js');await net.request('g.test',{cmd:'phase',args:{name:'battleCheck'}});});
    await c.waitFor(s=>s.phase==='PREP','prep');
    const milestone=await c.page.evaluate(async()=>{
      const {net}=await import('/js/net.js'),{data}=await import('/js/data.js');
      await net.request('g.test',{cmd:'timers',args:{on:false}});
      const id=data.list('chess').find(c=>c.visible && !c.isGolden && c.bonds?.includes('visiShip')).chessId;
      await net.request('g.test',{cmd:'chess',args:{id}});
      const state=()=>globalThis.__SP__.store.get();
      const target=[...state().match.private.hand,...state().match.private.temp].find(p=>p?.id===id);
      await net.request('g.test',{cmd:'bond',args:{id:'visiShip',layers:0}});
      const before=state().match.private.funds;
      await net.request('g.test',{cmd:'item',args:{id:'hs_bg28_838'}});
      const item=[...state().match.private.hand,...state().match.private.temp].find(p=>p?.id==='hs_bg28_838');
      await net.request('g.castSpell',{itemUid:item.uid,targetUid:target.uid});
      const b=data.lookup('bonds','visiShip'),bb=b.buffs.find(b=>b.key==='bond_layer_gain_coin').bb;
      return {gain:state().match.private.funds-before,expected:Math.floor(30/bb.layer)*bb.count};
    });
    assert.equal(milestone.gain,milestone.expected,'Perfect Form pays Foresight on the actual UI/Forge path');
    await c.page.evaluate(async()=>{
      const {net}=await import('/js/net.js');await net.request('g.test',{cmd:'timers',args:{on:false}});
      await net.request('g.test',{cmd:'enemies',args:{hp:1000000,atk:0,speed:0}});
      globalThis.__speedFrames=[];net.on('b.snap',m=>globalThis.__speedFrames.push(m));
      await net.request('g.test',{cmd:'phase',args:{name:'combat'}});
    });
    await c.page.waitForSelector('[data-testid="combat-speed"]:not([disabled])');
    await c.page.select('[data-testid="combat-speed"]','8');
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().match.public.combatSpeed===8);
    await c.page.click('[data-testid="pause"]');
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().match.public.paused);
    const frames=await c.page.evaluate(()=>globalThis.__speedFrames.length);
    await c.page.evaluate(async()=>{const {net}=await import('/js/net.js');await net.request('g.combatSpeed',{speed:1});});
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().match.public.combatSpeed===1);
    assert.equal(await c.page.evaluate(()=>globalThis.__speedFrames.length),frames,'no simulation ticks while paused');
    const pub=await c.page.evaluate(()=>globalThis.__SP__.store.get().match.public);
    assert.equal(pub.combatMode,'server');
    fs.mkdirSync('.cache/combat-speed-browser',{recursive:true});
    await c.page.screenshot({path:`.cache/combat-speed-browser/${forge?'forge':'native'}-paused.png`});
    await c.page.evaluate(async()=>{const {net}=await import('/js/net.js');await net.request('g.pause',{on:false});});
    await c.page.waitForFunction(n=>globalThis.__speedFrames.length>n,{},frames);
    await c.page.select('[data-testid="combat-speed"]','4');
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().match.public.combatSpeed===4);
    await c.page.evaluate(async()=>{const s=globalThis.__SP__.store.get(),{net}=await import('/js/net.js');await net.request('g.watch',{fieldId:s.match.field.fieldId});});
    assert.equal(await c.page.$eval('[data-testid="combat-speed"]',e=>e.value),'4');
    await c.page.setViewport({width:844,height:390});
    assert.ok(await c.page.$eval('[data-testid="combat-speed"]',e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));
    await c.page.screenshot({path:`.cache/combat-speed-browser/${forge?'forge':'native'}-narrow.png`});
    assert.deepEqual(c.problems,[]);
  } finally {await c.close();await srv.close();}
});
