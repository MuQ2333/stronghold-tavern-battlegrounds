import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Client,sleep} from '../e2e/client.mjs';

for(const forge of [false,true])test(`combat detail shows live equipment/skill stats and stops polling when closed (Forge=${forge})`,{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH||(forge&&!process.env.SP_FORGE_PLUGINS_DIR),timeout:90000,
},async()=>{
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const old=process.env.SP_TEST_MODE;process.env.SP_TEST_MODE='1';let srv;
  try{srv=await startServer({port:0,host:'127.0.0.1',quiet:true,pluginsDir:forge?process.env.SP_FORGE_PLUGINS_DIR:undefined});}
  finally{if(old===undefined)delete process.env.SP_TEST_MODE;else process.env.SP_TEST_MODE=old;}
  const c=new Client(puppeteer,srv.url,'LiveStats',{w:1600,h:1000});
  const out='.cache/combat-unit-stats-browser';fs.mkdirSync(out,{recursive:true});
  try{
    await c.open('?render=fallback');await c.enter('LiveStats');await c.click('.mode-card','独立模拟');await c.click('.diff-card','险境模拟');
    await c.page.waitForSelector('[data-testid="create-test"] input');await c.page.click('[data-testid="create-test"] input');
    await c.click('.create-box button','开始独立模拟');await c.waitFor(s=>!!s.room?.code,'room');
    await c.page.evaluate(async forge=>{
      const {net}=await import('/js/net.js');await net.request('room.setTavernMods',{mods:{growth:true,spells:true,heroes:false}});
      if(forge)await net.request('room.setPlugins',{plugins:['hero-strategies','spell-shop','hero-strategies-look'].map(id=>({id}))});
    },forge);
    await c.click('.room-bar__right button','开始模拟');await c.waitFor(s=>s.phase==='INFO_CHECK','briefing');
    await c.click('.brief__foot .btn--primary','准备就绪');await c.waitFor(s=>s.phase==='BAND_DRAFT','draft');
    await c.page.evaluate(async()=>{const {net}=await import('/js/net.js');await net.request('g.test',{cmd:'phase',args:{name:'battleCheck'}});});
    await c.waitFor(s=>s.phase==='PREP','prep');
    const setup=await c.page.evaluate(async()=>{
      const {net}=await import('/js/net.js'),{data}=await import('/js/data.js'),{deployMap}=await import('/js/ui/gameLogic/placement.js');
      const state=()=>globalThis.__SP__.store.get();
      await net.request('g.test',{cmd:'timers',args:{on:false}});
      await net.request('g.test',{cmd:'chess',args:{id:'chess_char_4_16_a'}});
      const pieces=()=>[...state().match.private.hand,...state().match.private.temp].filter(Boolean);
      const p=pieces().find(p=>p.id==='chess_char_4_16_a');if(!p)throw Error('Texas missing');
      await net.request('g.test',{cmd:'item',args:{id:'chess_item_3_07_e_a'}});
      const item=pieces().find(p=>p.id==='chess_item_3_07_e_a');await net.request('g.equip',{itemUid:item.uid,targetUid:p.uid});
      const stage=data.lookup('stages',state().match.public.stageId);let deployed=false;
      for(const [key,kind]of deployMap(stage)){
        if(kind!=='melee')continue;const [row,col]=key.split(',').map(Number);
        try{await net.request('g.move',{uid:p.uid,to:{area:'board',row,col},dir:'RIGHT'});deployed=true;break;}catch{/* next legal tile */}
      }
      if(!deployed)throw Error('Texas not deployed');
      await net.request('g.test',{cmd:'enemies',args:{hp:1000000,atk:0,speed:0}});
      globalThis.__liveStatFrames=[];globalThis.__liveStatRequests=[];
      net.on('m.unitStats',m=>{if(m.fieldId)globalThis.__liveStatFrames.push(m);});
      const request=net.request.bind(net);net.request=(t,args)=>{if(t==='g.unitStats'&&args.unitId!=null)globalThis.__liveStatRequests.push(args);return request(t,args);};
      return {uid:p.uid,cs:state().room.content.cs,baseAtk:data.lookup('chess',p.id).stats.atk};
    });
    if(forge)assert.ok(setup.cs,'real Forge content set selected');
    await c.page.evaluate(async()=>{const{net}=await import('/js/net.js');await net.request('g.test',{cmd:'phase',args:{name:'combat'}});});
    // Terrain devices are allied units too; click Texas's avatar rather than the first allied obstruction.
    const target='.ff-unit.is-ally:has(img[src*="texas2"])';
    await c.page.waitForSelector(target);
    await c.page.click(target);
    await c.page.waitForSelector('.dpanel [data-live="battle"]');
    const read=()=>c.page.evaluate(()=>{
      const e=globalThis.__liveStatFrames.at(-1)?.units[0],el=[...document.querySelectorAll('.dpanel .dstat')].find(el=>el.querySelector('.dstat__k')?.textContent==='攻击');
      return {entry:e,atk:el?.querySelector('.dstat__v')?.textContent,requests:globalThis.__liveStatRequests.length,frames:globalThis.__liveStatFrames.length};
    });
    const first=await read();assert.ok(first.entry.atk>first.entry.base.atk,'actual equipment/skill bonus is shown');
    await c.page.waitForFunction(({atk,frames})=>{
      const e=globalThis.__liveStatFrames.at(-1)?.units[0],el=[...document.querySelectorAll('.dpanel .dstat')].find(el=>el.querySelector('.dstat__k')?.textContent==='攻击');
      return globalThis.__liveStatFrames.length>frames&&e&&e.atk!==atk&&el?.querySelector('.dstat__v')?.textContent.replace(/,/g,'')===String(e.atk);
    },{timeout:18000},{atk:first.entry.atk,frames:first.frames});
    const changed=await read();assert.notEqual(changed.entry.atk,first.entry.atk,'skill end updates the open panel');
    await c.page.screenshot({path:`${out}/${forge?'forge':'native'}-live.png`});
    await c.page.keyboard.press('Escape');await c.page.waitForFunction(()=>!document.querySelector('.dpanel'));
    await sleep(350);const count=await c.page.evaluate(()=>globalThis.__liveStatRequests.length);await sleep(800);
    assert.equal(await c.page.evaluate(()=>globalThis.__liveStatRequests.length),count,'closed panel stops querying');
    fs.writeFileSync(`${out}/${forge?'forge':'native'}.json`,JSON.stringify({setup,first,changed,problems:c.problems},null,2));
    assert.deepEqual(c.problems,[]);
  }catch(e){
    await c.page?.screenshot({path:`${out}/${forge?'forge':'native'}-failure.png`}).catch(()=>{});
    fs.writeFileSync(`${out}/${forge?'forge':'native'}-failure.json`,JSON.stringify({error:String(e),text:await c.page?.evaluate(()=>document.body.innerText).catch(()=>''),state:await c.st().catch(()=>null),problems:c.problems},null,2));throw e;
  }finally{await c.close();await srv.close();}
});
