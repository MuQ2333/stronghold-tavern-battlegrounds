import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
const chrome=process.env.CHROME_PATH;
test('mobile shop skill badges hide without changing desktop or detail access',{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js');
 const puppeteer=(await import('puppeteer-core')).default;
 const server=await startServer({host:'127.0.0.1',port:0,quiet:true});
 let browser;
 const out=process.env.SHOP_SKILL_AUDIT_OUT||'.cache/shop-skill-layout';mkdirSync(out,{recursive:true});
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});
  for(const [width,height,mobile] of [[844,390,true],[1280,576,true],[844,390,false],[1600,900,false]]){
   const page=await browser.newPage();
   await page.setViewport({width,height,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,isLandscape:true});
   await page.goto(`http://127.0.0.1:${server.port}/dev/game-mock.html?shot=1&phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
   await page.waitForSelector('.shopbar__cards .scard__skill');
   for(const scale of ['auto','120']){
    await page.evaluate(async(scale)=>(await import('/js/ui/settings.js')).updateSettings({uiScale:scale}),scale);
    await new Promise(r=>setTimeout(r,120));
    const badges=await page.$$eval('.shopbar__cards .scard__skill',els=>els.map(el=>({display:getComputedStyle(el).display,title:el.title,card:el.closest('button')!==null})));
    assert.ok(badges.length>0);
    for(const badge of badges){assert.equal(badge.display==='none',mobile,`${width}x${height} ${scale}: mobile-only badge visibility`);assert.ok(badge.title&&badge.card);}
    if(mobile)await page.screenshot({path:`${out}/${width}x${height}-${scale}.png`});
   }
   // Existing first tap still opens the operator detail panel with the skill section.
   await page.click('.shopbar__cards .scard:not(.scard--sold)');
   await page.waitForSelector('.dpanel');
   assert.ok(await page.$('.dpanel .skill-box, .dpanel [data-skill], .dpanel .dpanel__skill')||await page.$eval('.dpanel',el=>el.textContent.includes('技能')));
   await page.close();
  }
 }finally{await browser?.close();for(const c of server.wss.clients||[])c.terminate();await server.close();}
});
