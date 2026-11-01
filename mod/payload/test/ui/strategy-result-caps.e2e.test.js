import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '../e2e/client.mjs';

for(const forge of [false,true])test(`actual strategy spell retains opening result; growth reward caps appear with Forge=${forge}`,{
 skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH||(forge&&!process.env.SP_FORGE_PLUGINS_DIR),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const old=process.env.SP_TEST_MODE;process.env.SP_TEST_MODE='1';let srv;
 try{srv=await startServer({port:0,host:'127.0.0.1',quiet:true,pluginsDir:forge?process.env.SP_FORGE_PLUGINS_DIR:undefined});}
 finally{if(old===undefined)delete process.env.SP_TEST_MODE;else process.env.SP_TEST_MODE=old;}
 const c=new Client(puppeteer,srv.url,'StrategyCaps',{w:1600,h:1000});
 try {
  await c.open('?render=fallback');await c.enter('StrategyCaps');await c.click('.mode-card','独立模拟');await c.click('.diff-card','险境模拟');
  await c.page.waitForSelector('[data-testid="create-test"] input');await c.page.click('[data-testid="create-test"] input');
  await c.click('.proto-start','开始独立模拟');await c.waitFor(s=>!!s.room?.code,'room');
  await c.page.evaluate(async forge=>{
   const {net}=await import('/js/net.js');await net.request('room.setTavernMods',{mods:{growth:true,spells:true,heroes:false}});
   if(forge)await net.request('room.setPlugins',{plugins:['hero-strategies','spell-shop','hero-strategies-look'].map(id=>({id}))});
  },forge);
  await c.click('.room-bar__right button','开始模拟');await c.waitFor(s=>s.phase==='INFO_CHECK','briefing');
  await c.click('.brief__foot .btn--primary','准备就绪');await c.waitFor(s=>s.phase==='BAND_DRAFT','draft');
  await c.page.evaluate(async()=>{const{net}=await import('/js/net.js');await net.request('g.test',{cmd:'phase',args:{name:'battleCheck'}});});
  await c.waitFor(s=>s.phase==='PREP','prep');
  const proof=await c.page.evaluate(async()=>{
   const{net}=await import('/js/net.js'),{data}=await import('/js/data.js');
   const state=()=>globalThis.__SP__.store.get(),self=()=>state().match.public.players.find(p=>p.playerId===state().match.private.playerId)||state().match.public.players[0];
   await net.request('g.test',{cmd:'timers',args:{on:false}});await net.request('g.test',{cmd:'funds',args:{amount:100}});
   const initial=self().bandId;await net.request('g.test',{cmd:'item',args:{id:'mod_identity_revealed'}});
   const item=[...state().match.private.hand,...state().match.private.temp].find(p=>p?.id==='mod_identity_revealed');
   if(!item)throw Error('strategy spell missing');await net.request('g.castSpell',{itemUid:item.uid});
   const chosen=state().match.private.shop.rewardOffer.slots[0].id;await net.request('g.reward',{idx:0});
   await new Promise((resolve,reject)=>{let tries=0;const poll=()=>{if(self().bandId===chosen)return resolve();if(++tries>300)return reject(Error('strategy projection timed out'));setTimeout(poll,20);};poll();});
   const active=self().bandId;if(active!==chosen||active===initial)throw Error('strategy did not replace');
   await data.loadAll('bonds','chess','garrisons');
   const caps=['visiShip','miraShip'].map(id=>data.lookup('bonds',id).desc);
   const edited=['chess_char_1_03_a','chess_char_1_09_a','chess_char_1_10_a'].map(id=>data.lookup('garrisons',data.lookup('chess',id).garrisonIds[0]).desc);
   await net.request('g.test',{cmd:'lp',args:{value:0}});await net.request('g.test',{cmd:'round',args:{round:2}});
   return {initial,active,chosen,caps,edited,cs:state().room.content.cs};
  });
  await c.waitFor(s=>s.result,'result');
  assert.notEqual(proof.initial,proof.active);if(forge)assert.ok(proof.cs);
  assert.match(proof.caps[0],/每回合最多5次/);assert.match(proof.caps[1],/每回合最多1次/);
  assert.match(proof.edited[0],/^<售出时>获得一枚盟约之币/);assert.match(proof.edited[1],/140%/);assert.match(proof.edited[2],/0.25/);
  assert.equal(await c.page.evaluate(()=>globalThis.__SP__.store.get().match.result.players[0].bandId),proof.initial);
  await c.page.reload({waitUntil:'domcontentloaded'});await c.page.waitForFunction(()=>!!globalThis.__SP__?.store);await c.waitFor(s=>s.result,'reconnected result');
  assert.equal(await c.page.evaluate(()=>globalThis.__SP__.store.get().match.result.players[0].bandId),proof.initial);
  assert.deepEqual(c.problems,[]);
 } finally {await c.close();await srv.close();}
});
