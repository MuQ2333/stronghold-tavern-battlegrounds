// Real GameScreen input with a controlled delayed mock transport: distinct pieces must remain operable.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('direct item destruction and rapid sales keep per-piece protection without blocking other pieces',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:90000,
},async()=>{
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
  const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--mute-audio']});
  const page=await browser.newPage(),problems=[];
  page.on('pageerror',e=>problems.push(e.message));
  try {
    await page.setViewport({width:1600,height:900});
    await page.goto(`${srv.url}/dev/game-mock.html?shot=1&render=fallback&phase=PREP`,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.ff-piece');
    await page.evaluate(async()=>{
      const {data}=await import('/js/data.js'),{net}=await import('/js/net.js');
      globalThis.__operationCalls=[];
      const original=net.request.bind(net);let release;
      const gate=new Promise(resolve=>{release=resolve;});globalThis.__releaseOperations=release;
      net.request=async(t,f)=>{
        if(['g.destroy','g.sell','g.move'].includes(t)){globalThis.__operationCalls.push({t,uid:f.uid});await gate;}
        return original(t,f);
      };
      globalThis.__MOCK__.mutate(s=>{
        s.priv.ready=false;s.priv.personalChoice=null;s.priv.shop.rewardOffer=null;s.priv.temp.fill(null);
        const items=data.list('items').filter(x=>x.itemType==='EQUIP'&&!x.isGolden&&!x.hideInShop);
        const ops=data.list('chess').filter(x=>x.visible&&!x.isGolden);
        s.priv.hand.fill(null);
        s.priv.hand[0]={uid:9001,kind:'item',id:items[0].id};
        s.priv.hand[1]={uid:9002,kind:'item',id:items[1].id};
        s.priv.hand[2]={uid:9003,kind:'chess',id:ops[0].chessId,items:[]};
        s.priv.hand[3]={uid:9004,kind:'chess',id:ops[1].chessId,items:[]};
      });
    });
    await page.waitForFunction(()=>!document.querySelector('.pbanner'));
    await page.click('.ff-piece[data-uid="9001"]');await page.waitForSelector('.uframe__btn--destroy');
    // Two clicks before Preact rerenders still send exactly one request for this item.
    await page.$eval('.uframe__btn--destroy',b=>{b.click();b.click();});
    assert.deepEqual(await page.evaluate(()=>globalThis.__operationCalls),[{t:'g.destroy',uid:9001}]);
    assert.equal(await page.$('.modal'),null,'no destruction confirmation dialog');
    await page.click('.ff-piece[data-uid="9002"]');await page.waitForSelector('.uframe__btn--destroy:not([disabled])');
    await page.click('.uframe__btn--destroy');
    await page.hover('.ff-piece[data-uid="9003"]');await page.keyboard.press('KeyX');await page.keyboard.press('KeyX');
    await page.hover('.ff-piece[data-uid="9004"]');await page.keyboard.press('KeyX');
    assert.deepEqual(await page.evaluate(()=>globalThis.__operationCalls),[
      {t:'g.destroy',uid:9001},{t:'g.destroy',uid:9002},{t:'g.sell',uid:9003},{t:'g.sell',uid:9004},
    ]);
    await page.evaluate(()=>globalThis.__releaseOperations());
    await page.waitForFunction(()=>![9001,9002,9003,9004].some(uid=>globalThis.__MOCK__.S().priv.hand.some(p=>p?.uid===uid)));
    assert.deepEqual(problems,[]);
    fs.mkdirSync('.cache/growth-browser',{recursive:true});await page.screenshot({path:'.cache/growth-browser/direct-destroy.png'});
  }finally{await browser.close();await srv.close();}
});
