import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';

test('growth Blue Poison renders real Front/Back Spine with deploy, attack and skill clips',{
 skip:process.env.RENDER_E2E!=='1'||!process.env.CHROME_PATH||!existsSync('public/assets/growth-bluepoison/spine/op/char_129_bluep/front/char_129_bluep.skel'),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js');
 const puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-first-run','--force-device-scale-factor=1']});
 try {
  const page=await browser.newPage(),problems=[];
  page.on('pageerror',e=>problems.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('growth-bluepoison'))problems.push(`${r.status()} ${r.url()}`);});
  await page.setViewport({width:1400,height:900});
  await page.goto(`${srv.url}/dev/render-demo.html?scene=prep&panel=0&pen=0&board=2d&fx=off`);
  await page.waitForFunction(()=>window.__demo?.ready||window.__demo?.error,{timeout:40000});
  assert.equal(await page.evaluate(()=>window.__demo.error||null),null);
  await page.evaluate(async()=>{
   const {data}=await import('/js/data.js'),{assets}=await import('/js/assets.js');
   data.setGrowthMode(true);await data.loadAll('assets');assets.seed(data.get('assets'));
   window.__demo.view.setPrep({hand:Array(10).fill(null),temp:Array(5).fill(null),nextEnemies:[],board:[
    {uid:901,kind:'chess',id:'chess_char_2_30_a',tier:2,row:10,col:3,dir:'RIGHT',items:[]},
    {uid:902,kind:'chess',id:'chess_char_2_30_b',tier:2,golden:true,row:10,col:6,dir:'UP',items:[]},
   ]},{editable:false});
  });
  await page.waitForFunction(()=>{
   const vs=[...window.__demo.view.debug.views.values()].filter(v=>v.info.defId?.startsWith('chess_char_2_30'));
   return vs.length===2&&vs.every(v=>v.spineReady&&v.actor?.spine);
  },{timeout:30000});
  const got=await page.evaluate(()=>[...window.__demo.view.debug.views.values()].filter(v=>v.info.defId?.startsWith('chess_char_2_30')).map(v=>{
   const sp=v.actor.spine,b=sp.getBounds(),entry=v.actor.entry;
   const clips=['Idle','Start','Attack'].map(name=>{sp.state.setAnimation(0,name,false);sp.update(0.2);return sp.state.tracks[0].animation.name;});
   return {id:v.info.defId,skel:entry.skel,clips,width:b.width,height:b.height,visible:sp.visible,slots:sp.skeleton.slots.filter(s=>(s.currentSprite||s.currentMesh)?.texture?.baseTexture?.valid).length};
  }));
  assert.equal(got.length,2);
  for(const g of got){assert.ok(g.width>10&&g.height>10&&g.visible&&g.slots>0,JSON.stringify(g));assert.deepEqual(g.clips,['Idle','Start','Attack']);}
  assert.ok(got.some(g=>g.skel.includes('/front/')));assert.ok(got.some(g=>g.skel.includes('/back/')));
  mkdirSync('.cache/bluepoison-browser',{recursive:true});await page.screenshot({path:'.cache/bluepoison-browser/models.png'});
  assert.deepEqual(problems,[]);
 }finally{await browser.close();await srv.close();}
});
