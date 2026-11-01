import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('growth damage panel shows shares, nine labels, history and exports after reload on desktop and narrow screens',{
 skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--mute-audio']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out='.cache/balance-meter-browser';fs.mkdirSync(out,{recursive:true});
 try {
  await page.setViewport({width:1600,height:900});await page.goto(`${srv.url}/dev/game-mock.html?phase=COMBAT&render=fallback&shot=1`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.gm__bonds');
  await page.evaluate(async()=>{
   const {data}=await import('/js/data.js'),{metricArchive}=await import('/js/battle/metricArchive.js');data.setGrowthMode(true);
   const mock=globalThis.__MOCK__;clearInterval(mock.S().battle.timer);mock.mutate(s=>{s.pub.growthMode=true;});
   const coreBonds=data.list('bonds').filter(b=>b.isCore).map(b=>({id:b.bondId,name:b.name}));
   const rec=data.list('chess').find(c=>!c.isGolden);
   const record={seconds:10,owners:['p1'],rows:[{key:'1',ownerId:'p1',kind:'op',name:rec.name,defId:rec.chessId,damage:3000000000,healing:500,types:{phys:1000000000,arts:2000000000,true:0,elemental:0}}]};
   metricArchive.ingest({matchKey:'ui-audit',battleKey:'2.n',round:2,modeId:'mode_single_hard',done:true,coreBonds,record});
   metricArchive.ingest({matchKey:'ui-audit',battleKey:'3.n',round:3,modeId:'mode_single_hard',done:true,coreBonds,record:{...record,seconds:20}});
  });
  await page.click('.gm__metrics');await page.waitForSelector('.combat-metrics__row');
  assert.match(await page.$eval('.combat-metrics__body',e=>e.textContent),/100.0%/);
  await page.screenshot({path:`${out}/damage-desktop.png`});
  await page.click('.combat-metrics__archive summary');
  assert.equal(await page.$$eval('select[aria-label="主盟约标记"] option',e=>e.length),10);
  await page.select('select[aria-label="主盟约标记"]','kazdelShip');
  await page.type('input[aria-label="测试备注"]','速本测试');
  await page.select('select[aria-label="战斗记录"]','2.n');
  const exported=await page.evaluate(async()=>{const {metricArchive}=await import('/js/battle/metricArchive.js');return {json:JSON.parse(metricArchive.json()),csv:metricArchive.csv()};});
  assert.equal(exported.json.sessions[0].main,'kazdelShip');assert.equal(exported.json.sessions[0].note,'速本测试');assert.match(exported.csv,/3000000000/);
  await page.goto(srv.url,{waitUntil:'domcontentloaded'});await page.waitForSelector('.combat-archive-launcher > button');await page.click('.combat-archive-launcher > button');
  await page.waitForSelector('.combat-metrics__row');assert.match(await page.$eval('.combat-metrics__body',e=>e.textContent),/3,000,000,000/);
  await page.click('.combat-metrics__archive summary');assert.equal(await page.$eval('select[aria-label="主盟约标记"]',e=>e.value),'kazdelShip');
  await page.setViewport({width:844,height:390});
  await page.waitForFunction(()=>{const r=document.querySelector('.combat-metrics')?.getBoundingClientRect();return r&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
  await page.screenshot({path:`${out}/damage-history-mobile.png`});assert.deepEqual(errors,[]);
 } finally {await browser.close();await srv.close();}
});
