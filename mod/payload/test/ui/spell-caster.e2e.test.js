import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
const chrome=process.env.CHROME_PATH;
test('empty-lineup spells cast on battlefield cells, Galewing uses shop choices, and mod controls scale with the viewport',{
 skip:process.env.SP_E2E!=='1'||!chrome||!existsSync(chrome),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const server=await startServer({host:'127.0.0.1',port:0,quiet:true});let browser;
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-gpu']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1600,height:900});
  await page.goto(`http://127.0.0.1:${server.port}/dev/game-mock.html?phase=PREP&render=fallback`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.ff-piece');
  await page.evaluate(async()=>{
   globalThis.__castingRequests=[];const {net}=await import('/js/net.js');
   net.request=async(t,fields)=>{globalThis.__castingRequests.push({t,...fields});return{ok:true};};
   document.querySelector('.mockbar').classList.add('hidden');
   globalThis.__MOCK__.mutate(S=>{
    S.priv.shop.spellShop=true;S.priv.shop.layout={chess:5,item:1,spell:1};S.priv.shop.rewardOffer=null;
    S.priv.board=[];S.priv.temp=[];S.priv.spellSupports=[];delete S.priv.heroPower;
    S.priv.hand=[{uid:99001,kind:'item',id:'chess_item_1_03_e_a'},{uid:99002,kind:'item',id:'chess_item_1_04_e_a'}];
   });
  });
  await page.waitForSelector('.ff-piece[data-uid="99001"]');
  assert.equal((await page.$$('.spell-caster')).length,0);
  assert.equal((await page.$$('.ff-piece--chess')).length,0);
  const center=selector=>page.$eval(selector,el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
  const drag=async uid=>{
   const from=await center(`.ff-piece[data-uid="${uid}"]`),to=await center(`.ff-tile[data-row="10"][data-col="${uid===99001?0:3}"]`);
   await page.mouse.move(from.x,from.y);await page.mouse.down();
   await page.mouse.move(from.x+20,from.y,{steps:3});await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
  };
  await drag(99001);
  await page.waitForFunction(()=>globalThis.__castingRequests.some(r=>r.t==='g.castSpell'&&r.itemUid===99001));
  assert.deepEqual(await page.evaluate(()=>globalThis.__castingRequests.filter(r=>r.t==='g.castSpell')),[{t:'g.castSpell',itemUid:99001,targetUid:null}]);
  await drag(99002);
  assert.equal(await page.evaluate(()=>globalThis.__castingRequests.filter(r=>r.t==='g.castSpell').length),1);
  assert.equal(await page.evaluate(()=>globalThis.__MOCK__.S().priv.hand.length),2);
  assert.equal((await page.$$('.ff-piece--chess')).length,0);
  mkdirSync('.cache/caster-ui',{recursive:true});await page.screenshot({path:'.cache/caster-ui/empty-lineup.png'});
  await page.evaluate(async()=>{
   const {HERO_BANDS}=await import('/shared/heroCatalog.js');
   globalThis.__MOCK__.mutate(S=>{
    S.priv.hand=Array.from({length:10},(_,i)=>({uid:99100+i,kind:'item',id:'chess_item_1_03_e_a'}));
    S.priv.heroPower={id:'galewing',name:'展翅高飞',desc:HERO_BANDS.band_hs_galewing.desc,round:6,price:0,canPick:true,
      passive:false,used:false,disabled:false,progress:0,cooldown:0,locked:[],pot:[],choices:[],sequence:10,targets:[]};
    S.priv.shop.rewardOffer={source:'merge',tier:2,slots:[{kind:'item',id:'chess_item_1_03_e_a',price:0}]};
   });
  });
  await page.waitForSelector('.hero-power__toggle');await page.click('.hero-power__toggle');
  await page.waitForSelector('#hero-flight-choices');
  assert.equal((await page.$$('.scard--hero-route')).length,3);
  const widths=[];
  for(const [width,height]of [[1600,900],[1280,720],[1067,600],[800,450],[640,360]]){
   await page.setViewport({width,height});
   await page.waitForFunction(()=>document.querySelector('.hero-power__toggle')?.getBoundingClientRect().right<=innerWidth);
   const bounds=await page.evaluate(()=>['.hero-power__toggle','.bob-shopkeeper__avatar','.shopbar__rwcards'].map(selector=>{
    const r=document.querySelector(selector)?.getBoundingClientRect();return{selector,left:r?.left,top:r?.top,right:r?.right,bottom:r?.bottom};
   }));
   for(const r of bounds)assert.ok(r.left>=0&&r.top>=0&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,...r}));
   widths.push(await page.$eval('.hero-power__toggle',el=>el.getBoundingClientRect().width));
   await page.screenshot({path:`.cache/caster-ui/routes-${width}.png`});
  }
  assert.ok(widths.at(-1)<widths[0]*.7,'hero geometry scales with the zoom-equivalent viewport');
  const before=await page.evaluate(()=>globalThis.__castingRequests.length);
  await page.click('.scard--hero-route:nth-child(2)');assert.equal(await page.evaluate(()=>globalThis.__castingRequests.length),before);
  await page.click('.scard--hero-route:nth-child(2)');
  await page.waitForFunction(()=>globalThis.__castingRequests.some(r=>r.t==='g.heroPower'&&r.route===2));
  assert.deepEqual(await page.evaluate(()=>globalThis.__castingRequests.find(r=>r.t==='g.heroPower')),{t:'g.heroPower',action:'use',route:2});
  await page.waitForFunction(()=>!document.querySelector('#hero-flight-choices'));
  assert.ok(await page.evaluate(()=>globalThis.__MOCK__.S().priv.shop.rewardOffer));
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();for(const client of server.wss.clients||[])client.terminate();await server.close();}
});
