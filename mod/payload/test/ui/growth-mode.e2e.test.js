import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Client} from '../e2e/client.mjs';

test('growth trait replays yield the same result in actual Chrome and Node',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {DATA}=await import('../match/harness.js');
  const {growthData,GROWTH_ROSTER}=await import('../../shared/growthMode.js');
  const {DataSource}=await import('../../server/sim/simdata.js');
  const {flatStage}=await import('../helpers/battleHarness.js');
  const {buildBattleSpec,createBattleFromSpec,resultDigest}=await import('../../server/sim/spec.js');
  const names=['砾','斯卡蒂','隐德来希','浊心斯卡蒂','归溟幽灵鲨'];
  // Leave each Aegir's front tile empty so opening devour does not add unrelated real deaths/switches.
  const tiles=[[9,3],[9,5],[11,3],[11,5],[12,8]];
  const units=names.map((name,i)=>({chessId:GROWTH_ROSTER.find(r=>r.name===name).id,row:tiles[i][0],col:tiles[i][1],uid:i+1}));
  const raw={...DATA,stages:{...DATA.stages,growth_parity_flat:flatStage({id:'growth_parity_flat'})}};
  const spec=buildBattleSpec({kind:'normal',stageId:'growth_parity_flat',seed:153,timeLimit:10,flags:{growthMode:true},players:[{playerId:'p1',units,
    bonds:{swiftShip:{active:true,tier:1,layers:1150},kazimierzShip:{active:true,tier:1,layers:0},egirShip:{active:true,count:1,tier:1,layers:10}}}]});
  const b=createBattleFromSpec(spec,new DataSource(growthData(raw,true)),{recordEvents:true});b.start();
  const ghost=b.allyUnits[4];assert.equal(ghost.growthTraitLive.value,2,'Skadi alter does not replay the combat observer');
  const atkBefore=ghost.s.atk;
  b.emit('dollSwitch',{unit:ghost});b.kill(b.allyUnits[0]);b.removeBuff(ghost,'trait:substitute');b.step();
  assert.equal(ghost.growthTraitLive.value,8);assert.equal(b.players[0].bonds.egirShip.layers,173);
  assert.ok(ghost.s.atk>atkBefore,'temporary Aegir growth changes actual attack');
  b.forceEnd();
  const expected=resultDigest(b.result());assert.equal(b.result().errors,0);assert.equal(b.result().perPlayer.p1.growthFreeRefreshes,2);
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true}),c=new Client(puppeteer,srv.url,'GrowthReplay',{w:1280,h:900});
  try {
    await c.open();
    const result=await c.page.evaluate(async({spec,raw})=>{
      const {loadBrowserSim}=await import('/js/battle/simLoader.js');
      const {growthData}=await import('/shared/growthMode.js');
      const sim=await loadBrowserSim({data:growthData(raw,true)});
      const b=sim.spec.createBattleFromSpec(spec,sim.ds,{recordEvents:true});b.start();
      const ghost=b.allyUnits[4];b.emit('dollSwitch',{unit:ghost});b.kill(b.allyUnits[0]);b.removeBuff(ghost,'trait:substitute');b.step();b.forceEnd();
      return {digest:sim.spec.resultDigest(b.result()),errors:b.result().errors,layers:b.players[0].bonds.egirShip.layers,nextValue:ghost.growthTraitLive.value};
    },{spec,raw});
    assert.equal(result.errors,0);assert.equal(result.layers,173);assert.equal(result.nextValue,8);
    assert.deepEqual(result.digest,expected);assert.deepEqual(c.problems,[]);
  } finally {await c.close();await srv.close();}
});

test('growth mode is off by default, uses the real room toggle and restores the base UI data when disabled',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {startServer}=await import('../../server/index.js');
  const puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
  const c=new Client(puppeteer,srv.url,'GrowthMode',{w:1600,h:900});
  try {
    await c.open();await c.enter('GrowthMode');
    await c.createCoop();
    await c.waitFor(s=>!!s.room?.code,'room');
    const snapshot=()=>c.page.evaluate(async()=>{
      const {data}=await import('/js/data.js');await data.loadAll('chess','garrisons','config','bonds','items','tokens','assets');
      const {store}=await import('/js/store.js');
      const bagpipe=data.list('chess').find(x=>x.name==='风笛'&&!x.isGolden);
      const dusk=data.list('chess').find(x=>x.name==='夕'&&!x.isGolden);
      return {room:store.get().room,bagpipe:{tier:bagpipe.tier,id:bagpipe.chessId},dusk:!!dusk.growthTrait,
        yan:data.lookup('bonds','yanShip').thresholds,indom:data.lookup('bonds','indomShip').thresholds,
        kazdel:!!data.lookup('bonds','kazdelShip'),meteo:!!data.lookup('chess','chess_char_9_02_a'),
        meteoArt:!!data.get('assets').chars.char_219_meteo,horn:!!data.lookup('items','chess_item_c_01_e_a'),
        jian:data.lookup('garrisons',data.lookup('chess','chess_char_6_19_a').garrisonIds[0]).desc,
        gladiia:data.lookup('chess','chess_char_4_12_a').growthTrait?.handler || null,
        revisedTraits:['chess_char_3_13','chess_char_4_01','chess_char_6_01','chess_char_5_13'].map(id=>['a','b'].map(grade=>{
          const rec=data.lookup('chess',`${id}_${grade}`);return data.lookup('garrisons',rec.garrisonIds[0]).desc;
        })),
        finalTraits:['chess_char_2_14_a','chess_char_3_09_a','chess_char_4_01_a','chess_char_4_02_a','chess_char_5_01_a','chess_char_5_07_a','chess_char_6_01_a','chess_char_6_16_a'].map(id=>data.lookup('chess',id).growthTrait?.handler || null)};
    });
    const before=await snapshot();assert.equal(before.room.tavernMods.growth,false);assert.equal(before.bagpipe.tier,4);assert.equal(before.dusk,false);
    const toggle=await c.page.$$('.tavern-mod input');assert.equal(toggle.length,4);
    await toggle[2].click();
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().room?.tavernMods?.growth===true);
    const on=await snapshot();assert.equal(on.bagpipe.tier,3);assert.equal(on.dusk,true);
    assert.deepEqual(on.yan,[1,3,6]);assert.deepEqual(on.indom,[1,2]);
    assert.ok(on.kazdel && on.meteo && on.meteoArt && on.horn);
    assert.match(on.jian,/每张每场战斗限一次/);assert.equal(on.gladiia,'deathGain');assert.deepEqual(on.finalTraits,['spellGainBonus','deathSummon','spellSkillBonus','localAmmoSpell','spellRetain','spellDeathBonus','globalAmmoSpell','starSpend']);
    for(const [i,pair]of on.revisedTraits.entries())for(const [grade,desc]of pair.entries()) {
      const m=grade?2:1;
      assert.ok(desc.includes(i===0?`层数+${m}`:i===1?`额外+${m}`:i===2?`释放${m}次闪亮的戒指`:`单次收益各＋${2*m}`));
    }
    const art=await c.page.evaluate(async()=>{
      const {data}=await import('/js/data.js'),a=data.get('assets').chars.char_219_meteo;
      const urls=[a.avatar,a.portrait,a.spine.front.skel,a.spine.front.atlas,...a.spine.front.textures,a.spine.back.skel];
      return Promise.all(urls.map(async url=>{const r=await fetch(url);return r.ok && (await r.arrayBuffer()).byteLength>0;}));
    });assert.ok(art.every(Boolean),'Meteorite has actual portraits and both battle models');
    assert.equal(srv.lobby.getRoom(on.room.code).tavernMods.growth,true);
    fs.mkdirSync('.cache/growth-browser',{recursive:true});
    await c.page.screenshot({path:'.cache/growth-browser/room-enabled.png'});
    await c.page.setViewport({width:844,height:390});
    assert.ok(await c.page.$$eval('.tavern-mod input',nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})));
    await c.page.screenshot({path:'.cache/growth-browser/room-narrow.png'});
    await (await c.page.$$('.tavern-mod input'))[2].click();
    await c.page.waitForFunction(()=>globalThis.__SP__.store.get().room?.tavernMods?.growth===false);
    const off=await snapshot();assert.equal(off.bagpipe.tier,4);assert.equal(off.dusk,false);
    assert.deepEqual(off.yan,[3,6,9]);assert.deepEqual(off.indom,[2,3]);
    assert.equal(off.kazdel,false);assert.equal(off.meteo,false);assert.equal(off.meteoArt,true,'added media stays available to the lobby preview without enabling its gameplay record');assert.equal(off.horn,false);
    assert.doesNotMatch(off.jian,/每张每场战斗限一次/);assert.equal(off.gladiia,null);
    assert.deepEqual(c.problems,[]);
  }finally{await c.close();await srv.close();}
});

test('current-value blocks render real server projections and an already-open shop detail reads fresh state',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {makeMatch}=await import('../match/harness.js');
  const {GROWTH_ROSTER}=await import('../../shared/growthRoster.js');
  const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;
  const h=makeMatch({growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'NORMAL',fake:true});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId=null;
  const pine=ps.acquireChess(id('松果'));ps.round.gainedChess=0;ps.round.growthDusk=0;
  const yu=ps.newPiece('chess',id('余'));ps.board.set('10,3',yu);ps.recompute();
  ps.shop.slots[0]={kind:'chess',id:id('夕'),price:4,basePrice:4,sold:false};
  const project=()=>({pine:ps.pieceView(pine),yu:ps.pieceView(yu),shop:ps.privateView().shop.slots[0]});
  const before=project();
  h.m.dispatch(ps,'onRoundStart',{round:2});for(let i=0;i<4;i++)ps.acquireChess(id('惊蛰'));
  const yan=ps.allChess().find(p=>ps.gd.baseIdOf(p.id)===id('惊蛰'));
  const [tile]=[...ps.deployMap()].find(([,kind])=>kind==='ranged' || kind==='all');
  const [row,col]=tile.split(',').map(Number);assert.equal(ps.move(yan.uid,{area:'board',row,col}).ok,true);
  ps.funds=8;assert.equal(ps.spend(8),true);ps._afterSpend(8,'test');
  const after=project();
  const gs=[id('松果'),id('夕'),id('余')].map(id=>ps.gd.garrison(ps.gd.chess(id).garrisonIds[0]));
  const {startServer}=await import('../../server/index.js'), puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});const c=new Client(puppeteer,srv.url,'GrowthValues',{w:1280,h:900});
  try{
    await c.open();await c.enter('GrowthValues');
    await c.page.evaluate(async({before,gs})=>{
      const {data}=await import('/js/data.js');await data.loadAll('chess','garrisons','bonds');data.setGrowthMode(true);
      const {h,render}=await import('/vendor/preact.module.js');
      const {GarrisonBlock,resolveDetail}=await import('/js/ui/detailPanel.js');
      const host=document.createElement('aside');host.id='growth-current-proof';host.style.cssText='position:fixed;right:20px;top:24px;width:440px;z-index:10000;padding:20px;background:#12201f;color:#fff;border:1px solid #497b70';document.body.append(host);
      globalThis.__growthRender=cur=>{
        data.setGrowthMode(true);
        const detail=resolveDetail({kind:'chess',id:cur.shop.id,shopCard:{slot:0,reward:false}},new Map(),{priv:{shop:{slots:[cur.shop]}}});
        render(h('div',{},h(GarrisonBlock,{garrison:gs[0],growth:cur.pine.growthTrait}),h(GarrisonBlock,{garrison:gs[1],growth:detail.growthInfo}),h(GarrisonBlock,{garrison:gs[2],growth:cur.yu.growthTrait})),host);
      };
      globalThis.__growthRender(before);
    },{before,gs});
    await c.page.waitForFunction(()=>document.querySelector('#growth-current-proof')?.textContent.includes('当前特殊招募：1阶'));
    await c.page.evaluate(after=>globalThis.__growthRender(after),after);
    await c.page.waitForFunction(()=>{const s=document.querySelector('#growth-current-proof')?.textContent || '';return s.includes('当前特殊招募：2阶')&&s.includes('+16')&&s.includes('消费进度：8/9')&&s.includes('每累计消耗9资金');});
    fs.mkdirSync('.cache/growth-browser',{recursive:true});await c.page.screenshot({path:'.cache/growth-browser/trait-current.png'});
    assert.deepEqual(h.logs.error,[]);assert.deepEqual(c.problems,[]);
  }finally{h.m.dispose();await c.close();await srv.close();}
});

test('permanent deployment grants render alongside the recipient native trait and live skill grants',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {makeMatch}=await import('../match/harness.js'),{GROWTH_ROSTER}=await import('../../shared/growthRoster.js');
  const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;
  const h=makeMatch({growthMode:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
  const far=ps.newPiece('chess',id('远牙')),target=ps.newPiece('chess',id('隐现'));
  ps.board.set('9,3',far);ps.board.set('9,5',target);ps.recompute();
  h.m.dispatch(ps,'onPrepEnd',{});h.m.dispatch(ps,'onPrepEnd',{});const piece=ps.pieceView(target);
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true}),c=new Client(puppeteer,srv.url,'GrowthGrants',{w:1280,h:900});
  try {
    await c.open();await c.enter('GrowthGrants');
    await c.page.evaluate(async piece=>{
      const {data}=await import('/js/data.js');await data.loadAll('chess','garrisons','bonds','assets','backups','effects');data.setGrowthMode(true);
      const {h,render}=await import('/vendor/preact.module.js'),{ChessDetail}=await import('/js/ui/detailPanel.js');
      const host=document.createElement('aside');host.id='growth-grants-proof';host.style.cssText='position:fixed;right:20px;top:24px;width:480px;height:840px;overflow:auto;z-index:10000;padding:20px;background:#12201f;color:#fff;border:1px solid #497b70';document.body.append(host);
      globalThis.__renderGrowthGrants=live=>{
        data.setGrowthMode(true);render(h(ChessDetail,{chess:data.lookup('chess',piece.id),piece,bonds:[],editable:false,live}),host);
      };
      globalThis.__renderGrowthGrants(null);
    },piece);
    await c.page.waitForFunction(()=>{const s=document.querySelector('#growth-grants-proof')?.textContent || '';return s.includes('攻击速度+40')&&s.includes('当前效果 +8')&&s.includes('特质触发次数：2');});
    const live={growthGrantedTraits:[...piece.growthGrantedTraits,{garrisonId:'growth_grant_skill_elite',count:1,value:2}]};
    await c.page.evaluate(live=>globalThis.__renderGrowthGrants(live),live);
    await c.page.waitForFunction(()=>{const s=document.querySelector('#growth-grants-proof')?.textContent || '';return s.includes('当前效果 +8')&&s.includes('当前效果 +2')&&s.includes('自身所属盟约');});
    fs.mkdirSync('.cache/growth-browser',{recursive:true});await c.page.screenshot({path:'.cache/growth-browser/granted-traits.png'});
    assert.deepEqual(c.problems,[]);assert.deepEqual(h.logs.error,[]);
  } finally {h.m.dispose();await c.close();await srv.close();}
});

test('spell ammo and Star spending/overflow values render and refresh from authoritative projections',{
 skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
 const {makeMatch}=await import('../match/harness.js'),{GROWTH_ROSTER}=await import('../../shared/growthRoster.js');
 const {makeBattle}=await import('../helpers/battleHarness.js'),{DataSource}=await import('../../server/sim/simdata.js'),{unitStatsEntry}=await import('../../shared/protocol.js');
 const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;
 const h=makeMatch({growthMode:true,heroMod:false,spellShop:true,fake:true,mode:'solo',difficulty:'FUNNY'});h.start();h.toPrep(1);
 const ps=h.ps('p_0');ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.gd.modeInactiveBonds.clear();
 const star=ps.newPiece('chess',id('溯光星源'));ps.board.set('10,3',star);ps.recompute();ps._afterSpend(12,'test');ps.layers.skillfulShip=995;ps.addLayers('skillfulShip',10);
 const f=makeBattle({data:new DataSource(h.m.data),flags:{growthMode:true},units:[{chessId:id('莫斯提马'),row:10,col:3}],autoFinish:false});f.step();const most=f.b.allyUnits[0];
 for(let n=0;n<5;n++)f.b.emit('ammoUsed',{unit:most});
 const project=()=>({ammo:unitStatsEntry(most).growthTrait,star:ps.pieceView(star).growthTrait});
 const before=project();f.b.emit('ammoUsed',{unit:most});ps._afterSpend(8,'test');const after=project();
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true}),c=new Client(puppeteer,srv.url,'GrowthSpells',{w:1280,h:900});
 try {
  await c.open();await c.enter('GrowthSpells');
  await c.page.evaluate(async({before})=>{
   const {data}=await import('/js/data.js');await data.loadAll('chess','garrisons','bonds');data.setGrowthMode(true);
   const {h,render}=await import('/vendor/preact.module.js'),{GarrisonBlock}=await import('/js/ui/detailPanel.js');
   const host=document.createElement('aside');host.id='growth-spells-proof';host.style.cssText='position:fixed;right:20px;top:24px;width:480px;padding:20px;background:#12201f;color:#fff;z-index:10000';document.body.append(host);
   const gar=id=>data.lookup('garrisons',data.lookup('chess',id).garrisonIds[0]);
   globalThis.__growthSpellRender=cur=>render(h('div',{},h(GarrisonBlock,{garrison:gar('chess_char_4_02_a'),growth:cur.ammo}),h(GarrisonBlock,{garrison:gar('chess_char_6_16_a'),growth:cur.star})),host);
   globalThis.__growthSpellRender(before);
  },{before});
  await c.page.waitForFunction(()=>{const s=document.querySelector('#growth-spells-proof')?.textContent || '';return s.includes('弹药进度：5/6')&&s.includes('累计在场消费：12；当前每3资金：+2层')&&s.includes('开战临时转移：6层');});
  await c.page.evaluate(after=>globalThis.__growthSpellRender(after),after);
  await c.page.waitForFunction(()=>{const s=document.querySelector('#growth-spells-proof')?.textContent || '';return s.includes('弹药进度：0/6')&&s.includes('累计在场消费：20；当前每3资金：+3层');});
  await c.page.screenshot({path:'.cache/growth-browser/spell-star-current.png'});assert.deepEqual(c.problems,[]);assert.deepEqual(h.logs.error,[]);
 }finally{f.b.forceEnd();h.m.dispose();await c.close();await srv.close();}
});


test('Sea Nymph summons keep team talents, real skills and Indom/Indre chains identical in Chrome and Node',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {DATA}=await import('../match/harness.js');
  const {growthData,GROWTH_ROSTER}=await import('../../shared/growthMode.js');
  const {DataSource}=await import('../../server/sim/simdata.js');
  const {flatStage}=await import('../helpers/battleHarness.js');
  const {buildBattleSpec,createBattleFromSpec,resultDigest}=await import('../../server/sim/spec.js');
  const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;
  const raw={...DATA,stages:{...DATA.stages,nymph_parity:flatStage({id:'nymph_parity'})}};
  const spec=buildBattleSpec({kind:'normal',stageId:'nymph_parity',seed:47,timeLimit:10,flags:{growthMode:true},players:[{
    playerId:'p1',units:[{uid:1,chessId:id('海霓'),row:10,col:3},{uid:2,chessId:id('隐德来希'),row:12,col:3},
      {uid:3,chessId:id('斯卡蒂'),row:12,col:5}],growthEgirPool:[id('归溟幽灵鲨')],
    bonds:{egirShip:{active:true,count:1,tier:1,layers:200},indomShip:{active:true,count:2,tier:2,layers:999}}}]});
  const b=createBattleFromSpec(spec,new DataSource(growthData(raw,true)),{recordEvents:true});b.start();
  const parent=b.allyUnits[0];b.kill(parent);const children=b.allyUnits.filter(u=>u.growthSummoner===parent);
  assert.equal(children.length,2);
  for(const u of children){assert.ok(u.findBuff('talent:skadi_predator'));assert.ok(u.findBuff('ghost2:abyss'));
    u.skill.activate('audit',{free:true});u.skill.end('normal');b.removeBuff(u,'trait:substitute');}
  for(const u of children){b.kill(u);assert.equal(u.alive,true);}
  assert.equal(parent.growthIndomPending,true);
  b.retreat(children[0],{permanent:true});b.step();assert.equal(parent.alive,true);b.forceEnd();
  const expected=resultDigest(b.result());assert.equal(b.result().errors,0);
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true}),c=new Client(puppeteer,srv.url,'NymphAudit',{w:1280,h:900});
  try {
    await c.open();
    const actual=await c.page.evaluate(async({raw,spec})=>{
      const {loadBrowserSim}=await import('/js/battle/simLoader.js');const {growthData}=await import('/shared/growthMode.js');
      const sim=await loadBrowserSim({data:growthData(raw,true)}),b=sim.spec.createBattleFromSpec(spec,sim.ds,{recordEvents:true});
      b.start();const parent=b.allyUnits[0];b.kill(parent);const children=b.allyUnits.filter(u=>u.growthSummoner===parent);
      const buffs=children.every(u=>u.findBuff('talent:skadi_predator')&&u.findBuff('ghost2:abyss'));
      for(const u of children){u.skill.activate('audit',{free:true});u.skill.end('normal');b.removeBuff(u,'trait:substitute');}
      for(const u of children)b.kill(u);const allRevived=children.every(u=>u.alive),pending=parent.growthIndomPending;
      b.retreat(children[0],{permanent:true});b.step();b.forceEnd();
      return {digest:sim.spec.resultDigest(b.result()),errors:b.result().errors,buffs,allRevived,pending,parentAlive:parent.alive};
    },{raw,spec});
    assert.equal(actual.errors,0);assert.ok(actual.buffs&&actual.allRevived&&actual.pending&&actual.parentAlive);
    assert.deepEqual(actual.digest,expected);assert.deepEqual(c.problems,[]);
  } finally {await c.close();await srv.close();}
});

test('artificial revival copies and their display markers match in Chrome and Node',{
  skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH,timeout:120000,
},async()=>{
  const {DATA}=await import('../match/harness.js');
  const {growthData,GROWTH_ROSTER}=await import('../../shared/growthMode.js');
  const {DataSource}=await import('../../server/sim/simdata.js');
  const {flatStage}=await import('../helpers/battleHarness.js');
  const {buildBattleSpec,createBattleFromSpec,resultDigest}=await import('../../server/sim/spec.js');
  const raw={...DATA,stages:{...DATA.stages,copy_parity:flatStage({id:'copy_parity'})}};
  const units=['深巡','乌尔比安','浊心斯卡蒂','隐德来希'].map((name,i)=>({uid:i+1,chessId:GROWTH_ROSTER.find(r=>r.name===name).id,row:10+i%2*2,col:3+Math.floor(i/2)*3}));
  const spec=buildBattleSpec({kind:'normal',stageId:'copy_parity',seed:37,timeLimit:10,flags:{growthMode:true},players:[{playerId:'p1',units,bonds:{indomShip:{active:true,count:1,tier:1,layers:999}}}]});
  const b=createBattleFromSpec(spec,new DataSource(growthData(raw,true)),{recordEvents:true});b.start();
  const copies=b.allyUnits.filter(u=>u.growthReviveDisabled);assert.equal(copies.length,4);
  b.kill(copies[0]);assert.equal(copies[0].alive,true);b.forceEnd();const expected=resultDigest(b.result());
  const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
  const srv=await startServer({port:0,host:'127.0.0.1',quiet:true}),c=new Client(puppeteer,srv.url,'CopyParity',{w:1280,h:900});
  try{
    await c.open();
    const result=await c.page.evaluate(async({raw,spec})=>{
      const {loadBrowserSim}=await import('/js/battle/simLoader.js');const {growthData}=await import('/shared/growthMode.js');
      const {summonedScale}=await import('/js/render/summonedScale.js');
      const sim=await loadBrowserSim({data:growthData(raw,true)}),b=sim.spec.createBattleFromSpec(spec,sim.ds,{recordEvents:true});b.start();
      const copies=b.allyUnits.filter(u=>u.growthReviveDisabled),info=b.fieldMeta().units;
      const scales=info.filter(u=>u.growthReviveDisabled).map(u=>summonedScale(u));
      b.kill(copies[0]);const revived=copies[0].alive;b.forceEnd();
      return {digest:sim.spec.resultDigest(b.result()),scales,revived,errors:b.result().errors};
    },{raw,spec});
    assert.deepEqual(result.scales,[0.8,0.8,0.8,0.8]);assert.equal(result.revived,true);assert.equal(result.errors,0);
    assert.deepEqual(result.digest,expected);assert.deepEqual(c.problems,[]);
  }finally{await c.close();await srv.close();}
});
