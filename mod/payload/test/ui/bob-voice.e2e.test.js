import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import {BOB_VOICE_MANIFEST as bank} from '../../public/js/ui/bobVoiceManifest.js';
const chrome=process.env.CHROME_PATH;
for(const [width,height]of [[1600,900],[844,390]])test(`Bob audio, fixed portrait and squelch at ${width}x${height}`,{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome)||!existsSync('public'+bank.triple[0].url),timeout:60000,
},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const server=await startServer({host:'127.0.0.1',port:0,quiet:true});let browser;
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage(),errors=[],requests=[],responses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/assets/bob/voices/'))requests.push(new URL(r.url()).pathname);});
  page.on('response',r=>{if(r.url().includes('/assets/bob/voices/'))responses.push(r.status());});
  await page.setViewport({width,height});
  await page.goto(`http://127.0.0.1:${server.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
  await page.evaluate(()=>document.querySelector('.mockbar')?.classList.add('hidden'));
  assert.equal(requests.length,0,'mount must not replay a prior action');
  await page.evaluate(async()=>{(await import('/js/ui/bobShopkeeper.js')).setBobEnabled(true);});
  await page.click('.bob-shopkeeper__avatar');await page.keyboard.press('Escape');
  const avatarBounds=()=>page.$eval('.bob-shopkeeper__avatar',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const beforeSpeaking=await avatarBounds();
  await page.evaluate(async()=>{const {audio}=await import('/js/audio.js');const {BobSpeechGate}=await import('/shared/bobShopkeeper.js');const consider=BobSpeechGate.prototype.consider;BobSpeechGate.prototype.consider=function(cue,now,round){return consider.call(this,cue,now,round,()=>0);};audio.setVolumes({voice:0.8,muted:false});globalThis.__MOCK__.mutate(S=>{S.priv.stats.merges++;});});
  await page.waitForFunction(()=>document.querySelector('.bob-shopkeeper__line')?.textContent==='哦吼！你又前进了一大步！');
  await page.waitForFunction(async()=>typeof(await import('/js/audio.js')).audio.stopNarrator==='function');
  assert.deepEqual(await avatarBounds(),beforeSpeaking,'caption must not move or resize Bob');
  assert.ok(await page.$eval('.bob-shopkeeper__line',el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),'speech bubble fits viewport');
  await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.pub.phase='COMBAT';}));
  await page.waitForFunction(text=>document.querySelector('.bob-shopkeeper__line')?.textContent===text,{},bank.combat[0].text);
  assert.equal(await page.evaluate(async()=>!!(await import('/js/audio.js')).audio.stopNarrator),true,'combat replaces the prior line during cooldown');
  await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.pub.phase='PREP';S.pub.round++;}));
  await page.waitForSelector('.gm--prep');
  await page.waitForFunction(text=>document.querySelector('.bob-shopkeeper__line')?.textContent===text,{},bank.prep[0].text);
  await page.waitForSelector('.bob-shopkeeper__avatar');
  await page.waitForFunction(()=>{const a=document.querySelector('.bob-shopkeeper__avatar'),r=a?.getBoundingClientRect();return r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.bob-shopkeeper__avatar');});
  await page.click('.bob-shopkeeper__avatar');await page.waitForSelector('.bob-shopkeeper__menu');
  await page.click('.bob-shopkeeper__menu [role="menuitem"]');
  await page.waitForFunction(()=>!document.querySelector('.bob-shopkeeper__line'));
  assert.equal(await page.evaluate(async()=>!!(await import('/js/audio.js')).audio.stopNarrator),false);
  const before=requests.length;
  await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.shop.level++;S.priv.stats.refreshes++;}));
  await page.waitForFunction(()=>document.querySelector('.bob-shopkeeper.is-muted'));
  await page.click('.bob-shopkeeper__avatar');
  assert.equal(await page.$$eval('.bob-shopkeeper__menu button',es=>es.length),1);
  mkdirSync('.cache/bob-voice',{recursive:true});await page.screenshot({path:'.cache/bob-voice/installed-menu.png'});
  assert.equal(requests.length,before);
  assert.ok(requests.includes(bank.triple[0].url));assert.ok(requests.includes(bank.combat[0].url));
  const allowed=new Set(Object.values(bank).flat().map(l=>l.url));assert.ok(requests.every(url=>allowed.has(url)));assert.ok(responses.every(s=>s===200));
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();for(const client of server.wss.clients||[])client.terminate();await server.close();}
});
