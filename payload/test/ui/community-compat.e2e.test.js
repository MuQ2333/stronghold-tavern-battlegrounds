import {test} from 'node:test';import assert from 'node:assert/strict';
import {startServer} from '../../server/index.js';
const chrome=process.env.CHROME_PATH;
test('independent chat/damage switches, IME, safe text and viewport bounds alongside Bob',{
 skip:process.env.SP_E2E!=='1'||!chrome,timeout:60000,
},async()=>{
 const {default:puppeteer}=await import('puppeteer-core');const srv=await startServer({port:0,quiet:true});let browser;
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
  await page.evaluate(async()=>{document.querySelector('.mockbar')?.classList.add('hidden');const a=await import('/js/ui/communityAddons.js');a.startCommunityAddons();const {net}=await import('/js/net.js');globalThis.chatRequests=[];net.request=async(t,p)=>{globalThis.chatRequests.push({t,...p});return {t:'ok'};};});
  await page.waitForSelector('.chatbub__input');
  for(const [width,height] of [[1600,900],[844,390]]){await page.setViewport({width,height});await page.waitForFunction(()=>{const r=document.querySelector('.chatbub').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});}
  await page.type('.chatbub__input','中文聊天');
  await page.$eval('.chatbub__input',el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>globalThis.chatRequests.length),0);
  await page.$eval('.chatbub__input',el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));
  await page.keyboard.press('Enter');await page.waitForFunction(()=>globalThis.chatRequests.length===1);
  await page.evaluate(async()=>{const {net}=await import('/js/net.js'),{store}=await import('/js/store.js');net._emit('community.chat',{code:store.get().room.code,data:{name:'<b>name</b>',text:'<img src=x onerror=alert(1)>'}});});
  assert.equal(await page.$eval('.chatbub__item',el=>el.querySelectorAll('img').length),0);
  for(const chat of [false,true])for(const damage of [false,true]){
   await page.evaluate(async({chat,damage})=>{const a=await import('/js/ui/communityAddons.js');a.setCommunityEnabled('chat',chat);a.setCommunityEnabled('damage',damage);},{chat,damage});
   assert.equal(!!await page.$('.chatbub'),chat);assert.ok(await page.$('.bob-shopkeeper'));
  }
  await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=RESULT&render=fallback`,{waitUntil:'networkidle0'});
  await page.evaluate(async()=>{const a=await import('/js/ui/communityAddons.js');a.startCommunityAddons();a.setCommunityEnabled('damage',true);});
  await page.waitForSelector('.dmg-board table');assert.equal(await page.$('.chatbub'),null);
  await page.evaluate(async()=>{(await import('/js/ui/communityAddons.js')).setCommunityEnabled('damage',false);});assert.equal(await page.$('.dmg-board'),null);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();for(const c of srv.wss.clients||[])c.terminate();await srv.close();}
});
