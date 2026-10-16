// Real responsive layout and touch scrolling; the match state is a mock, not a live game.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
const chrome=process.env.CHROME_PATH;
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test('hero details fit short content and scroll long content without an empty phone panel',{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js');
 const puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});let browser;
 const out='.cache/hero-panel-layout';mkdirSync(out,{recursive:true});const results=[];
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await page.createCDPSession();
  for(const cfg of [{width:844,height:390,touch:true,scale:'auto'},{width:844,height:390,touch:true,scale:'120'},{width:1280,height:576,touch:true,scale:'auto'},{width:1280,height:576,touch:true,scale:'120'},{width:1600,height:900,touch:false,scale:'auto'}]){
   await page.setViewport({width:cfg.width,height:cfg.height,isMobile:cfg.touch,hasTouch:cfg.touch,isLandscape:true});
   await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback&shot=1`,{waitUntil:'networkidle0'});
   await page.waitForSelector('.shopbar');
   await page.evaluate(async scale=>{
    (await import('/js/ui/settings.js')).updateSettings({uiScale:scale});
    const {HERO_BANDS}=await import('/shared/heroCatalog.js'),band=HERO_BANDS.band_hs_gallywix;
    globalThis.__MOCK__.mutate(S=>{S.priv.heroPower={id:'gallywix',name:band.effectName,desc:band.desc,price:0,passive:true,disabled:false,used:false,locked:[],pot:[],choices:[],targets:[],teammates:[]};});
   },cfg.scale);
   await page.waitForSelector('.hero-power__toggle');
   await page.click('.hero-power__toggle');await page.waitForSelector('.hero-power__panel');await pause(350);
   const measure=()=>page.$eval('.hero-power__panel',el=>{
    const s=el.querySelector('.hero-power__scroll'),r=el.getBoundingClientRect(),cs=getComputedStyle(s);
    const contentBottom=Math.max(...[...s.children].map(x=>x.getBoundingClientRect().bottom));
    const close=el.querySelector('.hero-power__close'),cr=close.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,blank:r.bottom-contentBottom-parseFloat(cs.paddingBottom),scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,closeHit:close.contains(document.elementFromPoint(cr.x+cr.width/2,cr.y+cr.height/2))};
   });
   const short=await measure(),label=`${cfg.width}-${cfg.scale}`;results.push({cfg,short});
   await page.screenshot({path:`${out}/${label}-short.png`});
   assert.ok(short.blank<12,`${label}: short content leaves ${short.blank}px empty`);
   assert.ok(short.height<cfg.height*.5,`${label}: short details should not fill the screen`);
   assert.ok(short.x>=0&&short.y>=0&&short.bottom<=cfg.height,`${label}: viewport bounds`);
   assert.ok(short.closeHit,`${label}: close is reachable`);
   await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.desc=Array.from({length:40},(_,i)=>`第${i+1}项：获得资金后可继续调度干员，并按本局规则结算。`).join('\n');}));
   await pause(200);const long=await measure();results.at(-1).long=long;
   assert.ok(long.scrollHeight>long.clientHeight+100,`${label}: long details scroll internally`);
   assert.ok(long.bottom<=cfg.height&&long.closeHit,`${label}: long panel remains bounded`);
   if(cfg.touch){
    const p=await page.$eval('.hero-power__scroll',e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.bottom-10,dy:Math.min(90,r.height-30)};});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});
    for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y-p.dy*i/6}]});await pause(25);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>document.querySelector('.hero-power__scroll').scrollTop>0);
   }
   await page.screenshot({path:`${out}/${label}-long.png`});
   await page.click('.hero-power__close');await page.waitForFunction(()=>!document.querySelector('.hero-power__panel'));
  }
  assert.deepEqual(errors,[]);
 }finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser?.close();await srv.close();}
});
