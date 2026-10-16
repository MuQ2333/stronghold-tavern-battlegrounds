// Desktop Chrome emulation checks page containment and delayed recovery, not native Android system UI.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
const chrome=process.env.CHROME_PATH;
test('basic mobile fullscreen retains root containment, list scroll and editing after delayed recovery',{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),timeout:60000,
},async()=>{
 const {startServer}=await import('../../server/index.js');
 const puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});let browser;
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:844,height:390,isMobile:true,hasTouch:true,isLandscape:true});
  await page.goto(`http://127.0.0.1:${srv.port}/`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.app-root');
  await page.evaluate(()=>{const b=document.createElement('button');b.id='viewport-fullscreen-test';b.textContent='Fullscreen';b.style.cssText='position:fixed;top:100px;left:100px;z-index:99999';b.onclick=()=>document.documentElement.requestFullscreen();document.body.append(b);});
  await page.click('#viewport-fullscreen-test');await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.evaluate(()=>document.querySelector('#viewport-fullscreen-test').remove());
  const cdp=await page.createCDPSession();
  await cdp.send('Input.synthesizeScrollGesture',{x:420,y:30,yDistance:160,speed:500,gestureSourceType:'touch'});
  await page.evaluate(()=>{scrollTo(20,90);dispatchEvent(new Event('scroll'));});
  await page.waitForFunction(()=>scrollX===0&&scrollY===0&&document.scrollingElement.scrollTop===0);
  await page.evaluate(async()=>{(await import('/js/screens/title.js')).enterSession('视口回归');});
  await page.waitForSelector('.lobby-screen .spell-preview-entry');
  mkdirSync('.cache/viewport-basic',{recursive:true});await page.screenshot({path:'.cache/viewport-basic/lobby.png'});
  await page.click('.spell-preview-entry');
  await page.waitForSelector('.spell-preview-row');
  await new Promise(r=>setTimeout(r,300));
  const list=await page.$eval('.lo-list',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.bottom-25,overflow:el.scrollHeight-el.clientHeight};});
  assert.ok(list.overflow>50,'real spell list overflows');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:list.x,y:list.y}]});
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:list.x,y:list.y-i*12}]});await new Promise(r=>setTimeout(r,20));}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>document.querySelector('.lo-list').scrollTop>0);
  await new Promise(r=>setTimeout(r,500));
  const before=await page.$eval('.lo-list',el=>el.scrollTop);
  // Getter injection models an event followed by a late metric change only; it cannot recreate OS bars.
  await page.evaluate(()=>{globalThis.__testHeight=visualViewport.height;Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>globalThis.__testHeight});visualViewport.dispatchEvent(new Event('resize'));setTimeout(()=>{globalThis.__testHeight=350;},180);});
  await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--sp-vh').trim()==='3.5px');
  assert.equal(await page.$eval('.lo-list',el=>el.scrollTop),before,'recovery preserves inner scroll');
  await page.click('.spell-preview__search input');await page.keyboard.type('背靠背');
  await page.evaluate(()=>document.dispatchEvent(new Event('touchend')));
  await page.waitForFunction(()=>document.activeElement===document.querySelector('.spell-preview__search input'));
  assert.equal(await page.$eval('.spell-preview__search input',el=>el.value),'背靠背');
  await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await page.waitForFunction(()=>Math.abs(document.querySelector('.app-root').getBoundingClientRect().height-visualViewport.height)<1);
  mkdirSync('.cache/viewport-basic',{recursive:true});await page.screenshot({path:'.cache/viewport-basic/fullscreen-preview.png'});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await srv.close();}
});
