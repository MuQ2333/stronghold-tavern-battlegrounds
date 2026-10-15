import{test}from'node:test';
import assert from'node:assert/strict';
import{existsSync,mkdirSync}from'node:fs';
const chrome=process.env.CHROME_PATH;
test('bundle controls, hero power, Bob preference and in-hand locks render on desktop and narrow screens',{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),timeout:100000,
},async()=>{
 const{startServer}=await import('../../server/index.js');
 const puppeteer=(await import('puppeteer-core')).default;
 const{makeMatch}=await import('../match/harness.js');
 const{heroEvent,useHeroPower}=await import('../../server/match/heroPowers.js');
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});let browser;
 const h=makeMatch({fake:true,spellShop:true,heroMod:true});h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId='band_hs_maiev';ps.funds=100;ps.shop.level=6;ps.rollShop();heroEvent(ps,'onRoundStart',{});
 const slot=ps.shop.slots.findIndex(s=>s?.kind==='chess');assert.equal(useHeroPower(ps,{action:'use',slot,expectedId:ps.shop.slots[slot].id}).ok,true);
 const view=ps.privateView();h.m.dispose();
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});const page=await browser.newPage(),errors=[],voiceRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/bob/')&&r.url().endsWith('.mp3'))voiceRequests.push(r.url());});
  await page.setViewport({width:1600,height:900});await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.shopbar__cards .scard');
  await page.evaluate(view=>{
   document.querySelector('.mockbar')?.classList.add('hidden');
   const note=document.createElement('div');note.textContent='界面演示 · 非真实对局';note.style.cssText='position:fixed;left:22px;top:88px;z-index:9999;color:#ffe29a;background:#151a19;padding:5px 10px';document.body.append(note);
   globalThis.__MOCK__.mutate(S=>{S.priv.heroPower=view.heroPower;S.priv.hand=view.hand;S.priv.temp=view.temp;S.priv.shop=view.shop;S.priv.funds=view.funds;S.priv.board=[];S.priv.bandId=view.bandId;S.pub.heroMod=true;S.pub.spellHeroesEnabled=true;});
  },view);
  await page.waitForSelector('.hero-power__toggle');await page.waitForSelector('.bob-shopkeeper img');
  assert.ok(await page.$eval('.ff-piece[title] .ff-piece__spell[title]',n=>n.textContent.includes('🔒')));
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');
  assert.equal(await page.$eval('.bob-shopkeeper__menu button',n=>n.textContent),'屏蔽鲍勃');
  await page.click('.bob-shopkeeper__menu button');await page.waitForSelector('.bob-shopkeeper.is-muted img');
  assert.equal(await page.evaluate(()=>localStorage.getItem('sp.tavern.bob.muted')),'true');
  assert.equal(await page.evaluate(()=>localStorage.getItem('sp.tavern.bob.enabled')!=='false'),true,'squelching keeps the module enabled');
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');
  assert.equal(await page.$eval('.bob-shopkeeper__menu button',n=>n.textContent),'取消屏蔽');
  await page.click('.bob-shopkeeper__menu button');await page.waitForFunction(()=>!document.querySelector('.bob-shopkeeper.is-muted'));
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.bob-shopkeeper__menu'));
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('bob-shopkeeper__avatar')),true);
  const clearOfControls=()=>page.$eval('.bob-shopkeeper',n=>{
   const a=n.getBoundingClientRect(),overlap=b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   return [...document.querySelectorAll('.hero-power__control,.scard,.shopbar__tools button,.funds')].every(x=>!overlap(x.getBoundingClientRect()));
  });
  assert.equal(await clearOfControls(),true,'Bob must not cover hero controls or merchandise');
  mkdirSync('.cache/tavern-bundle',{recursive:true});await page.screenshot({path:'.cache/tavern-bundle/desktop.png'});
  await page.setViewport({width:844,height:390});await new Promise(r=>setTimeout(r,300));
  assert.ok(await page.$eval('.bob-shopkeeper',n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
  assert.equal(await clearOfControls(),true,'narrow Bob must not cover hero controls or merchandise');
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');
  assert.ok(await page.$eval('.bob-shopkeeper__menu',n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
  await page.screenshot({path:'.cache/tavern-bundle/bob-menu-narrow.png'});
  await page.mouse.click(200,180);await page.waitForFunction(()=>!document.querySelector('.bob-shopkeeper__menu'));
  assert.equal(await page.$('.modal'),null,'outside-click target is clear of game controls');
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');
  await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.pub.phase='SP_DRAFT';}));
  await page.waitForFunction(()=>!document.querySelector('.bob-shopkeeper__menu'));
  await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.pub.phase='PREP';}));await page.waitForSelector('.bob-shopkeeper__avatar');
  assert.equal(await page.$$('.bob-shopkeeper__menu').then(a=>a.length),0,'a closed phase menu never reopens on return');
  await page.screenshot({path:'.cache/tavern-bundle/narrow.png'});
  await page.setViewport({width:1600,height:900});
  await page.evaluate(async()=>{
   const{render}=await import('/vendor/preact.module.js'),{html}=await import('/js/ui/components.js'),{RoomScreen}=await import('/js/screens/room.js'),{store}=await import('/js/store.js'),{net}=await import('/js/net.js');
   const style=document.createElement('link');style.rel='stylesheet';style.href='/css/screens/room.css';document.head.append(style);
   store.set({room:{code:'ABCD',hostId:'tester',mode:'solo',difficulty:'FUNNY',inMatch:false,seats:[{seat:0,playerId:'tester',name:'博士',connected:true}],spectators:[],tavernMods:{spells:true,heroes:true}},me:{playerId:'tester',name:'博士'},connection:{status:'online'}});
   globalThis.__tavernRequests=[];net.request=async(type,fields)=>{globalThis.__tavernRequests.push({type,...fields});if(type==='room.setTavernMods')store.patch('room',{tavernMods:fields.mods});return{t:'ok'};};
   render(html`<${RoomScreen} />`,document.querySelector('#app'));
  });
  await page.waitForSelector('.tavern-mods input');assert.equal(await page.$$eval('.tavern-mods input',a=>a.length),3);
  assert.ok(await page.$$eval('.tavern-mods input',a=>a.every(n=>n.checked)));
  await page.click('.tavern-mods input');await page.waitForFunction(()=>globalThis.__tavernRequests.length===1);
  assert.deepEqual(await page.evaluate(()=>globalThis.__tavernRequests[0].mods),{spells:false,heroes:true});
  await page.screenshot({path:'.cache/tavern-bundle/room.png'});
  await page.setViewport({width:844,height:390});await new Promise(r=>setTimeout(r,300));
  assert.ok(await page.$$eval('.tavern-mods input',a=>a.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})));
  await page.screenshot({path:'.cache/tavern-bundle/room-narrow.png'});
  assert.deepEqual(voiceRequests,[],'unapproved narration is never downloaded');assert.deepEqual(errors,[]);
 }finally{await Promise.race([browser?.close(),new Promise(r=>setTimeout(r,3000))]);browser?.process()?.kill();for(const c of srv.wss.clients||[])c.terminate();await srv.close();}
});
