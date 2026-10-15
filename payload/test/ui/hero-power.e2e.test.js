import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';

const chrome=process.env.CHROME_PATH;
test('hero button uses directly, aims at cards, supports touch inspection and sequential shop discovery',{
  skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),
},async()=>{
  const {startServer}=await import('../../server/index.js');
  const puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true,workshopDir:'.cache/hero-empty'});let browser,page;
  try {
    browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});
    page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewport({width:1600,height:900});
    await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0',timeout:90000});
    await page.waitForSelector('.shopbar__cards .scard');
    await page.evaluate(async()=>{
      globalThis.__heroRequests=[];
      const {net}=await import('/js/net.js');net.request=async(t,fields)=>{globalThis.__heroRequests.push({t,...fields});return {ok:true};};
      document.querySelector('.mockbar').classList.add('hidden');
      globalThis.__MOCK__.mutate(S=>{
        const slot=S.priv.shop.slots.findIndex(x=>x?.kind==='chess'),id=S.priv.shop.slots[slot].id;
        S.priv.heroPower={id:'cookie',name:'搅动汤锅',desc:'将一名干员投入你的锅中。当你集齐3名干员时，从它们的盟约类型中发现一名干员。（还剩3名！）',price:0,canPick:true,passive:false,used:false,disabled:false,remaining:null,progress:0,cooldown:0,locked:[],pot:[],choices:[],sequence:1,targets:[{slot,id,kind:'chess'}],teammates:[]};
      });
    });
    await page.waitForSelector('.hero-power__toggle');
    await page.hover('.hero-power__toggle');await page.waitForSelector('.hero-power__panel .dskill');
    assert.equal(await page.$eval('.hero-power__toggle',b=>b.hasAttribute('title')),false);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),0);
    await page.hover('.hero-power__panel');
    assert.ok(await page.$('.hero-power__description'));
    mkdirSync('.cache/hero-strategies',{recursive:true});
    await page.screenshot({path:'.cache/hero-strategies/hero-skill-hover-desktop.png'});
    await page.mouse.move(10,500);await page.waitForFunction(()=>!document.querySelector('.hero-power__panel'));
    await page.focus('.hero-power__toggle');await page.waitForSelector('.hero-power__description');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.hero-power__panel'));
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),0);
    await page.click('.hero-power__toggle');
    assert.equal(await page.$eval('.hero-power__toggle',b=>b.title.includes('长按')),false);
    await page.waitForSelector('.hero-power__panel');
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),0);
    await page.waitForSelector('.scard.is-hero-target');
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.hero-power__panel button')].some(b=>b.textContent.includes('确认'))),false);
    await page.click('.scard.is-hero-target');
    await page.waitForFunction(()=>globalThis.__heroRequests.length===1);
    const req=await page.evaluate(()=>globalThis.__heroRequests[0]);assert.equal(req.t,'g.heroPower');assert.equal(req.action,'use');assert.ok(req.expectedId);
    await page.waitForFunction(()=>!document.querySelector('.gm.is-hero-targeting'));
    await page.click('.hero-power__toggle');await page.waitForSelector('.gm.is-hero-targeting');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.gm.is-hero-targeting'));
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),1);
    await page.click('.hero-power__toggle');await page.waitForSelector('.gm.is-hero-targeting');
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.disabled=true;}));
    await page.waitForFunction(()=>!document.querySelector('.gm.is-hero-targeting'));
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.disabled=false;}));
    await page.waitForSelector('.hero-power__toggle.is-available');
    assert.equal(await page.$('.gm.is-hero-targeting'),null);
    // Many owned candidates no longer create a scrolling list; an unlocked hand card is a direct target.
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{
      const h=S.priv.heroPower,id=h.targets[0].id;
      S.priv.hand[0]={uid:900000,kind:'chess',id,items:[]};
      h.targets.push(...Array.from({length:30},(_,i)=>({uid:900000+i,id,kind:'chess'})));
      h.pot=[['miraShip']];
    }));
    await page.click('.hero-power__toggle');await page.waitForSelector('.gm.is-hero-targeting');
    assert.equal((await page.$$('.hero-power__ingredient')).length,3);
    assert.equal((await page.$$('.hero-power__panel button')).length,1);
    await page.keyboard.press('r');assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),1);
    mkdirSync('.cache/hero-strategies',{recursive:true});await page.screenshot({path:'.cache/hero-strategies/cookie-direct-target.png'});
    await page.click('.ff-piece[data-uid="900000"]');await page.waitForFunction(()=>globalThis.__heroRequests.length===2);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[1].uid),900000);
    assert.equal(await page.$('.uframe__btn--sell'),null);
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{const h=S.priv.heroPower;h.id='elise';h.name='探险者领队';h.desc='发现一名当前调度中心等级的干员。每次使用后消耗的资金增加<@autochess.dgreen>1</>。';h.choices=[{kind:'chess',id:h.targets[0].id}];h.sequence=7;}));
    await page.waitForSelector('.shopbar__reward .scard');await page.click('.shopbar__reward .scard');
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),2);
    await page.waitForSelector('.scard.is-armed');await page.click('.shopbar__reward .scard');
    await page.waitForFunction(()=>globalThis.__heroRequests.length===3);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[2].sequence),7);
    mkdirSync('.cache/hero-strategies',{recursive:true});await page.screenshot({path:'.cache/hero-strategies/desktop.png'});
    await page.setViewport({width:844,height:390});
    const bounds=await page.$eval('.shopbar__reward',el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});
    assert.ok(bounds.left>=0&&bounds.right<=bounds.width+1);
    await page.screenshot({path:'.cache/hero-strategies/narrow.png'});assert.deepEqual(errors,[]);
    // A mobile long press opens effect text without using the active power on release.
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.choices=[];}));
    await page.waitForFunction(()=>!document.querySelector('.hero-power__panel'));
    await page.$eval('.hero-power__toggle',b=>b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:10,clientY:10})));
    await page.waitForSelector('.hero-power__description');
    assert.equal(await page.$eval('.hero-power__description .rt-mint',e=>e.textContent),'1');
    assert.equal(await page.$eval('.hero-power__toggle',b=>b.title.includes('<@')),false);
    const panelBounds=await page.$eval('.hero-power__panel',el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});
    assert.ok(panelBounds.left>=0&&panelBounds.right<=panelBounds.width&&panelBounds.bottom<=panelBounds.height);
    await page.screenshot({path:'.cache/hero-strategies/hero-skill-detail-narrow.png'});
    await page.setViewport({width:1600,height:900});
    await page.screenshot({path:'.cache/hero-strategies/hero-skill-detail-desktop.png'});
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.desc=('较长的技能说明，用于检查正文滚动和关闭按钮。\n').repeat(25);}));
    await page.waitForFunction(()=>{const el=document.querySelector('.hero-power__scroll');return el&&el.scrollHeight>el.clientHeight;});
    const closeBounds=await page.$eval('.hero-power__close',el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};});
    assert.ok(closeBounds.top>=0&&closeBounds.bottom<=closeBounds.height);
    await page.$eval('.hero-power__toggle',b=>{b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}));b.click();});
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),3);
    await page.click('.hero-power__toggle');await page.waitForFunction(()=>globalThis.__heroRequests.length===4);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[3].action),'use');
    // Faelin presents exactly one tier at a time in the shop, with server choice sequences.
    await page.setViewport({width:1600,height:900});
    for(const [step,tier] of [6,4,2].entries()){
      await page.evaluate(async({step,tier})=>{
        const {data}=await import('/js/data.js');const candidates=Object.values(data.get('chess')).filter(x=>x.tier===tier&&!x.isGolden).slice(0,3);
        globalThis.__MOCK__.mutate(S=>{const h=S.priv.heroPower;h.id='faelin';h.name='探险计划';h.passive=false;h.choices=candidates.map(x=>({id:x.chessId,kind:'chess',faelin:true}));h.sequence=31+step;});
      },{step,tier});
      await page.waitForFunction(tier=>document.querySelector('.shopbar__reward')?.textContent.includes(`发现${tier}阶`),{},tier);
      assert.equal(await page.$('.hero-power__panel'),null);
      assert.equal(await page.$('.hero-power__cost'),null);
      assert.equal(await page.$eval('.hero-power__status',el=>el.textContent.includes('发动')),false);
      if(step===0){
        await page.setViewport({width:844,height:390});
        const box=await page.$eval('.shopbar__reward',el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth};});
        assert.ok(box.left>=0&&box.right<=box.width+1);
        await page.screenshot({path:'.cache/hero-strategies/faelin-shop-narrow.png'});
      }
      assert.equal((await page.$$('.shopbar__rwcards .scard')).length,3);
      await page.click('.shopbar__reward .scard');assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),4+step);
      await page.click('.shopbar__reward .scard');await page.waitForFunction(n=>globalThis.__heroRequests.length===n,{},5+step);
      assert.equal(await page.evaluate(()=>globalThis.__heroRequests.at(-1).sequence),31+step);
      await page.setViewport({width:1600,height:900});
    }
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.choices=[];}));
    await page.waitForFunction(()=>document.querySelector('.hero-power__status')?.textContent==='被动技能');
    await page.click('.hero-power__toggle');await page.waitForSelector('.hero-power__description');
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),7);
    assert.equal(await page.$('.hero-power__cost'),null);
    await page.screenshot({path:'.cache/hero-strategies/faelin-passive-v019.png'});
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{const h=S.priv.heroPower;h.id='tess';h.passive=false;h.name='鲍勃的豪夺';h.choices=[];h.targets=[];h.sourcePlayer={playerId:'p_1',name:'轮换队友'};}));
    await page.waitForFunction(()=>document.querySelector('.hero-power__source')?.textContent.includes('轮换队友'));
    await page.click('.hero-power__toggle');
    await page.waitForFunction(()=>globalThis.__heroRequests.length===8);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[7].playerId),undefined);
    // Cookie uses the same cards and two-tap confirmation; a native promotion waits independently behind it.
    await page.evaluate(async()=>{
      const {data}=await import('/js/data.js');const choices=Object.values(data.get('chess')).filter(x=>x.tier===3&&!x.isGolden).slice(0,3).map(x=>({kind:'chess',id:x.chessId}));
      globalThis.__MOCK__.mutate(S=>{const h=S.priv.heroPower;h.id='cookie';h.name='搅动汤锅';h.choices=choices;h.sequence=87;S.priv.shop.rewardOffer={source:'merge',tier:3,slots:choices.map(x=>({...x,price:0,sold:false}))};});
    });
    await page.waitForFunction(()=>document.querySelector('.rwtag__title')?.textContent==='搅动汤锅');
    assert.equal(await page.$('.hero-power__panel'),null);
    await page.click('.rwtag__later');await page.waitForSelector('.rewardpill');
    assert.ok(await page.$eval('.rewardpill',e=>e.textContent.includes('搅动汤锅')));
    await page.click('.rewardpill');await page.waitForSelector('.shopbar__reward');
    await page.screenshot({path:'.cache/hero-strategies/cookie-shared-discovery.png'});
    await page.click('.shopbar__reward .scard');
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.sequence=88;}));
    await page.waitForFunction(()=>!document.querySelector('.shopbar__reward .scard.is-armed'));
    await page.click('.shopbar__reward .scard');assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),8);
    await page.click('.shopbar__reward .scard');await page.waitForFunction(()=>globalThis.__heroRequests.length===9);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[8].sequence),88);
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{S.priv.heroPower.choices=[];}));
    await page.waitForFunction(()=>document.querySelector('.rwtag__title')?.textContent==='晋升奖励');
    await page.click('.shopbar__reward .scard');assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),9);
    await page.click('.shopbar__reward .scard');await page.waitForFunction(()=>globalThis.__heroRequests.length===10);
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests[9].t),'g.reward');
    // Physical hand cards carry the shared lock hint without a separate lock area or hero button.
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{
      delete S.priv.heroPower;S.priv.shop.rewardOffer=null;S.pub.round=6;S.priv.shop.level=3;
      const chess=S.priv.shop.slots.find(x=>x?.kind==='chess').id,item=S.priv.shop.slots.find(x=>x?.kind==='item').id;
      S.priv.hand[0]={uid:900001,kind:'chess',id:chess,handLock:{sourceName:'测试来源',unlockRound:8},items:[]};
      S.priv.hand[1]={uid:900002,kind:'item',id:item,handLock:{sourceName:'测试来源',unlockLevel:4}};
    }));
    await page.setViewport({width:1600,height:900});
    await page.waitForSelector('.ff-piece__hand-lock');assert.equal(await page.$('.locked-cards'),null);
    assert.equal((await page.$$('.ff-piece__hand-lock')).length,2);
    await page.click('.ff-piece[data-uid="900001"]');
    await page.waitForSelector('.hand-lock-hint');assert.ok(await page.$eval('.hand-lock-hint',e=>e.textContent.includes('第8回合解锁')));
    assert.equal(await page.$('.uframe__btn--sell'),null);
    await page.screenshot({path:'.cache/hero-strategies/hand-lock-desktop.png'});
    await page.setViewport({width:844,height:390});await page.screenshot({path:'.cache/hero-strategies/hand-lock-narrow.png'});
    assert.equal(await page.evaluate(()=>globalThis.__heroRequests.length),10);
    await page.evaluate(()=>globalThis.__MOCK__.mutate(S=>{delete S.priv.hand[0].handLock;delete S.priv.hand[1].handLock;}));
    await page.waitForFunction(()=>!document.querySelector('.ff-piece__hand-lock'));
    assert.deepEqual(errors,[]);
  }catch(e){await page?.screenshot({path:'.cache/hero-strategies/ui-failure.png'});console.log(await page?.evaluate(()=>({requests:globalThis.__heroRequests,heading:document.querySelector('.shopbar__reward')?.textContent})));throw e;}finally{await browser?.close();await srv.close();}
});
