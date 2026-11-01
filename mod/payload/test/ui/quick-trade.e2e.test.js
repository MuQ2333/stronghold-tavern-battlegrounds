// Real drag input on both render bridges; transport fixture records existing g.sell / g.destroy intents.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Client} from '../e2e/client.mjs';
const enabled=process.env.SP_E2E==='1' && !!process.env.CHROME_PATH;

for(const renderer of ['fallback','engine'])test(`quick trade ${renderer}: explicit zone, cancel outside, funds, item hotkey, and equipment camera stability`,{skip:!enabled,timeout:120000},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--mute-audio']});
 const page=await browser.newPage(),problems=[];page.on('pageerror',e=>problems.push(e.message));
 try {
  await page.setViewport({width:1600,height:900});
  await page.goto(`${srv.url}/dev/game-mock.html?shot=1&render=${renderer}&phase=PREP`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>globalThis.__MOCK__ && globalThis.__SP_VIEW__?.kind && globalThis.__SP_VIEW__.kind!=='loading');
  await page.evaluate(async()=>{
   const {data}=await import('/js/data.js');
   globalThis.__MOCK__.mutate(s=>{
    s.priv.ready=false;s.priv.personalChoice=null;s.priv.shop.rewardOffer=null;s.priv.board=[];s.priv.temp.fill(null);s.priv.hand.fill(null);s.requests=[];
    const op=data.list('chess').find(x=>x.visible&&!x.isGolden),it=data.list('items').find(x=>x.itemType==='EQUIP'&&!x.isGolden&&!x.hideInShop);
    s.priv.hand[0]={uid:9101,kind:'chess',id:op.chessId,items:[],sellPrice:1};
    for(const [i,uid] of [[1,9102],[2,9103],[3,9104]])s.priv.hand[i]={uid,kind:'item',id:it.id};
   });
  });
  await page.waitForFunction(()=>!document.querySelector('.pbanner'));
  const point=async uid=>{const p=await Client.prototype.piecePoint.call({page},uid);assert.ok(p,`piece ${uid} is visible`);return p;};
  const begin=async uid=>{
   const p=await point(uid);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+14,p.y-14,{steps:4});
   await page.waitForSelector('.quick-trade');
  };
  const zone=()=>page.$eval('.quick-trade',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
  const calls=()=>page.evaluate(()=>globalThis.__MOCK__.S().requests.filter(([t])=>['g.sell','g.destroy','g.move','g.equip'].includes(t)));
  const drop=async()=>{const p=await zone();await page.mouse.move(p.x,p.y,{steps:12});await page.waitForSelector('.quick-trade.is-over');await page.mouse.up();await page.waitForSelector('.quick-trade',{hidden:true});};
  await begin(9101);assert.match(await page.$eval('.quick-trade',e=>e.textContent),/拖入出售/);
  const initialFunds=await page.evaluate(()=>globalThis.__MOCK__.S().priv.funds);
  await drop();await page.waitForFunction(()=>globalThis.__MOCK__.S().requests.some(([t,f])=>t==='g.sell'&&f.uid===9101));
  assert.equal(await page.evaluate(()=>globalThis.__MOCK__.S().priv.funds),initialFunds+1);
  await begin(9102);assert.equal(await page.$('.gm.is-collapsed'),null,'equipment pickup does not fold the shop or change its camera');
  const p=await zone();await page.mouse.move(p.x,p.y,{steps:12});await page.waitForSelector('.quick-trade.is-over');
  fs.mkdirSync('.cache/quick-trade-browser',{recursive:true});await page.screenshot({path:`.cache/quick-trade-browser/${renderer}-destroy-hover.png`});
  await page.mouse.up();await page.waitForFunction(()=>globalThis.__MOCK__.S().requests.some(([t,f])=>t==='g.destroy'&&f.uid===9102));
  assert.equal(await page.$('.modal'),null);
  await begin(9103);await page.mouse.move(3,3,{steps:12});await page.mouse.up();await page.waitForSelector('.quick-trade',{hidden:true});
  assert.ok(await page.evaluate(()=>globalThis.__MOCK__.S().priv.hand.some(p=>p?.uid===9103)));
  assert.equal((await calls()).length,2,'dropping elsewhere cancels without sending any intent');
  const last=await point(9104);await page.mouse.move(last.x,last.y);await page.keyboard.press('KeyX');
  await page.waitForFunction(()=>globalThis.__MOCK__.S().requests.some(([t,f])=>t==='g.destroy'&&f.uid===9104));
  assert.deepEqual((await calls()).map(([t,f])=>[t,f.uid]),[['g.sell',9101],['g.destroy',9102],['g.destroy',9104]]);
  await page.setViewport({width:844,height:390});
  await begin(9103);const bounds=await zone();
  assert.ok(bounds.left>=0&&bounds.right<=844&&bounds.top>=0&&bounds.bottom<=390);
  await page.screenshot({path:`.cache/quick-trade-browser/${renderer}-phone-zone.png`});await page.mouse.move(3,3);await page.mouse.up();
  assert.deepEqual(problems,[]);
 }finally{await browser.close();await srv.close();}
});

test('facing wheel accepts down/up in one render frame, maps mirrored directions and commits only once', {skip:!enabled,timeout:60000},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--mute-audio']});
 const page=await browser.newPage();
 try {
  await page.goto(`${srv.url}/dev/game-mock.html?shot=1&render=fallback&phase=PREP`,{waitUntil:'domcontentloaded'});await page.waitForSelector('.ff-piece');
  const result=await page.evaluate(async()=>{
   const {h,render}=await import('/vendor/preact.module.js'),{FacingWheel}=await import('/js/ui/facingWheel.js');
   const {EquipReplaceDialog}=await import('/js/ui/equipReplace.js'),{data}=await import('/js/data.js');
   const host=document.createElement('div');document.body.append(host);const commits=[],cancels=[];
   for(const mirror of [false,true]) {
    render(h(FacingWheel,{key:String(mirror),view:{tileScreen:()=>({x:400,y:300,s:64,mirror}),highlightTiles:()=>{}},row:10,col:3,grid:null,onCommit:d=>commits.push(d),onCancel:()=>cancels.push(1)}),host);
    await new Promise(resolve=>requestAnimationFrame(resolve));const el=host.querySelector('.fwheel');
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:33,button:0,clientX:465,clientY:300}));
    el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:33,button:0,clientX:465,clientY:300}));
    el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:33,button:0,clientX:465,clientY:300}));
   }
   render(null,host);
   const it=data.list('items').find(x=>x.itemType==='EQUIP'&&!x.isGolden),op=data.list('chess').find(x=>x.visible&&!x.isGolden),replaced=[];
   render(h(EquipReplaceDialog,{request:{targetUid:11,targetId:op.chessId,targetName:op.name,item:{uid:12,id:it.id,name:it.name},options:[{uid:31,id:it.id,name:it.name},{uid:32,id:it.id,name:it.name}]},getItem:id=>data.lookup('items',id),onConfirm:uid=>replaced.push(uid),onCancel:()=>{}}),host);
   await new Promise(resolve=>requestAnimationFrame(resolve));const el=host.querySelector('.eqr-host');
   el.dispatchEvent(new KeyboardEvent('keydown',{key:'2',code:'Digit2',bubbles:true}));
   document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   render(null,host);host.remove();return {commits,cancels,replaced};
  });assert.deepEqual(result,{commits:['RIGHT','LEFT'],cancels:[],replaced:[32]});
 }finally{await browser.close();await srv.close();}
});
