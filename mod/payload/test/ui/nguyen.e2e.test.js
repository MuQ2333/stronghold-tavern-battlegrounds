import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';

test('Nguyen displays two strategy cards, confirms once, shares reward queue and fits narrow screens',{
  skip:process.env.SP_E2E!=='1'||!existsSync(process.env.CHROME_PATH||''),timeout:90000,
},async()=>{
  const {startServer}=await import('../../server/index.js');
  const puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});let browser;
  try{
    browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-gpu']});
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewport({width:1600,height:900});
    await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
    await page.waitForSelector('.shopbar__cards .scard');
    await page.evaluate(async()=>{
      const {net}=await import('/js/net.js');globalThis.__heroRequests=[];
      net.request=async(t,fields)=>{globalThis.__heroRequests.push({t,...fields});return {ok:true};};
      document.querySelector('.mockbar').classList.add('hidden');
      globalThis.__MOCK__.mutate(S=>{
        S.priv.bandId='band_hs_nguyen';S.pub.heroMod=true;
        S.priv.heroPower={id:'nguyen',ownerId:'nguyen',temporary:true,name:'风暴之力',desc:'在每个回合开始时，从2个新策略技能中选择一个，仅本回合生效。',round:6,price:0,passive:true,used:false,disabled:false,locked:[],pot:[],targets:[],cooldown:0,canPick:true,
          sequence:61,choices:['band_hs_omu','band_amiya'].map(id=>({kind:'band',id,nguyen:true}))};
      });
    });
    await page.waitForSelector('.scard--band');
    assert.equal(await page.$$('.shopbar__rwcards .scard--band').then(a=>a.length),2);
    assert.ok(await page.$eval('.shopbar__reward',n=>n.textContent.includes('仅本回合生效')));
    assert.equal(await page.$('.hero-power__cost'),null);
    await page.click('.shopbar__rwcards .scard--band');assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),0);
    await page.click('.shopbar__rwcards .scard--band');await page.waitForFunction(()=>globalThis.__heroRequests.length===1);
    assert.deepEqual(await page.evaluate(()=>globalThis.__heroRequests[0]),{t:'g.heroPower',action:'pick',index:0,sequence:61});
    mkdirSync('.cache/nguyen',{recursive:true});await page.screenshot({path:'.cache/nguyen/desktop.png'});
    await page.setViewport({width:844,height:390});
    assert.ok(await page.$eval('.shopbar__reward',n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}));
    await page.screenshot({path:'.cache/nguyen/narrow.png'});
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{
      S.priv.heroPower.id='omu';S.priv.heroPower.name='生根发芽';S.priv.heroPower.desc='在你升级调度中心后，获得2资金。';S.priv.heroPower.choices=[];
    }));
    await page.waitForFunction(()=>!document.querySelector('.shopbar__reward'));
    assert.ok(await page.$eval('.hero-power__source',n=>n.textContent.includes('仅本回合生效')));
    assert.deepEqual(errors,[]);
  }finally{await Promise.race([browser?.close(),new Promise(r=>setTimeout(r,3000))]);browser?.process()?.kill();for(const c of srv.wss.clients||[])c.terminate();await srv.close();}
});
