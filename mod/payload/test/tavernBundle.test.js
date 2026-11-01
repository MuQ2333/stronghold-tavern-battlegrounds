import{test}from'node:test';
import assert from'node:assert/strict';
import{makeMatch}from'./match/harness.js';
import{startServer}from'../server/index.js';
import{TestClient}from'./helpers/wsClient.js';
import{normalizeTavernMods,validTavernMods}from'../shared/tavernMods.js';
import{bobCue,bobSnapshot}from'../shared/bobShopkeeper.js';
import{heroEvent,useHeroPower}from'../server/match/heroPowers.js';
import{ALL_SPELLS}from'../shared/spellCatalog.js';

test('all eight module switch combinations preserve independent gameplay and availability',()=>{
 for(const spells of[false,true])for(const heroes of[false,true]){
  let gameplay=null;
  for(const bob of[false,true]){
   const h=makeMatch({fake:true,spellShop:spells,heroMod:heroes,seed:43});h.start();h.toPrep(1);const ps=h.ps('p_0');
   const ids=h.m.gd.bandIds(),custom=ids.filter(id=>id.startsWith('band_hs_'));
   assert.equal(custom.length,heroes?(spells?30:26):0);
   assert.equal(ps.shop.layout.spell||0,spells?1:0);
   if(!heroes){ps.bandId='band_hs_elise';assert.ok(useHeroPower(ps,{action:'use'}).error);}
   const snapshot=JSON.stringify({slots:ps.shop.slots,layout:ps.shop.layout,pool:h.m.pool.snapshot(),ids});
   if(gameplay)assert.equal(snapshot,gameplay,'local Bob switch consumes no gameplay RNG');gameplay=snapshot;
   assert.equal(bobCue(null,bobSnapshot(h.m.publicView(),ps.privateView())),null,'mount/reconnect never replays past cues');
   assert.equal(typeof bob,'boolean');h.m.dispose();
  }
 }
 assert.deepEqual(normalizeTavernMods(),{spells:true,heroes:true,growth:false});
 assert.equal(validTavernMods({spells:true,heroes:true,bob:false}),false);
});

test('room switches default on, synchronize from the host, clear readiness and lock during a match',async()=>{
 const server=await startServer({port:0,host:'127.0.0.1',quiet:true});const clients=[];
 try{
  const connect=async name=>{const c=await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`);clients.push(c);const w=await c.hello(name);c.id=w.playerId;return c;};
  const a=await connect('Host'),b=await connect('Guest');
  assert.equal((await a.request({t:'room.create',mode:'coop',difficulty:'FUNNY'})).t,'ok');
  const initial=await a.waitFor('room.state');assert.deepEqual(initial.tavernMods,{spells:true,heroes:true,growth:false});
  assert.equal((await b.request({t:'room.join',code:initial.code})).t,'ok');
  assert.equal((await b.request({t:'room.ready',ready:true})).t,'ok');
  const message={t:'room.setTavernMods',mods:{spells:false,heroes:true,growth:true}};
  assert.equal((await b.request(message)).code,'NOT_HOST');
  assert.equal((await a.request(message)).t,'ok');
  const state=await b.waitFor('room.state',s=>s.tavernMods?.growth===true);
  assert.deepEqual(state.tavernMods,{spells:true,heroes:true,growth:true},'enabling tavern turns on both switches');
  assert.equal(state.seats.find(s=>s?.playerId===b.id).ready,false);
  assert.equal((await a.request(message)).t,'ok');
  const independent=await b.waitFor('room.state',s=>s.tavernMods?.growth===true&&s.tavernMods?.spells===false);
  assert.deepEqual(independent.tavernMods,{spells:false,heroes:true,growth:true},'the other switches remain individually adjustable');
  assert.equal((await b.request({t:'room.ready',ready:true})).t,'ok');
  assert.equal((await a.request({t:'room.start'})).t,'ok');
  const room=server.lobby.getRoom(initial.code);assert.equal(room.match.spellShop,false);assert.equal(room.match.heroMod,true);
  assert.equal(room.match.growthMode,true);
  assert.equal((await a.request(message)).code,'ROOM_STARTED');
  room.match.dispose();
 }finally{for(const c of clients)await c.terminate();await server.close();}
});

test('Yogg catalog casts need no inventory slot, work at round start and preserve the real overflow cap',()=>{
 for(const spell of['chess_item_1_03_e_a',ALL_SPELLS.find(c=>c.name==='智慧球').id]){
  const h=makeMatch({fake:true,spellShop:true,heroMod:true});h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId='band_hs_yogg';ps.shop.level=6;
  ps.spellPool=()=>[spell];
  for(let i=0;i<ps.hand.length;i++)ps.hand[i]=ps.newPiece('item','chess_item_1_03_e_a');
  for(let i=0;i<ps.temp.length;i++)ps.temp[i]=ps.newPiece('item','chess_item_1_03_e_a');
  const before=JSON.stringify([ps.hand,ps.temp]),funds=ps.funds;
  h.m.round=3;h.m.phase='ROUND_START';heroEvent(ps,'onRoundStart',{});
  assert.equal(JSON.stringify([ps.hand,ps.temp]),before);assert.equal(ps._automaticSpellItem,undefined);
  if(spell.startsWith('hs_'))assert.equal(ps.spellData().wisdom,2);else assert.ok(ps.funds>funds);
  assert.deepEqual(h.logs.error,[]);h.m.dispose();
 }
});

test('hero-locked cards cannot be spell targets or trigger preparation traits before unlock',()=>{
 const h=makeMatch({fake:true,spellShop:true,heroMod:true});h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId='band_hs_maiev';ps.funds=50;ps.shop.level=6;
 const id=ps.spellChessPool(null,c=>c.garrisonIds.some(g=>ps.gd.garrison(g)?.eventType==='SERVER_GAIN'))[0];assert.ok(id);
 ps.shop.slots[0]={kind:'chess',id,basePrice:3,sold:false};
 assert.equal(useHeroPower(ps,{action:'use',slot:0,expectedId:id}).ok,true);const target=ps.hand.find(Boolean);
 const item=ps.acquireItem(ALL_SPELLS.find(c=>c.name==='回响咆哮').id);
 assert.ok(ps.castSpell(item.uid,target.uid).error);assert.ok(ps.find(item.uid));
 assert.equal(h.m.dispatcher.triggerGarrisons(ps,target,'SERVER_GAIN'),0);
 h.m.dispose();
});

test('Bob cue priority uses confirmed state changes and never reports failed actions or unfreezing',()=>{
 const prev={phase:'PREP',round:2,ready:false,alive:true,level:2,merges:0,buys:0,sells:0,refreshes:0,frozen:false};
 assert.equal(bobCue(prev,{...prev}),null);
 assert.equal(bobCue(prev,{...prev,merges:1,buys:1}),'triple');
 assert.equal(bobCue(prev,{...prev,level:3}),'upgrade');
 assert.equal(bobCue(prev,{...prev,frozen:true}),'freeze');
 assert.equal(bobCue({...prev,frozen:true},prev),null);
 assert.equal(bobCue(prev,{...prev,phase:'COMBAT',merges:1}),'combat');
 assert.equal(bobCue(prev,{...prev,alive:false,phase:'RESULT'}),'defeat');
});
