import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch} from './match/harness.js';
import {startServer} from '../server/index.js';
import {TestClient} from './helpers/wsClient.js';
import {ALL_SPELLS} from '../shared/spellCatalog.js';
import {boardFrom} from '../public/community/dmg-board/client/board.js';

for(const humans of [4,8,12])for(const spells of [false,true])for(const heroes of [false,true])test(`${humans} players / spells ${spells} / heroes ${heroes}`,()=>{
 const h=makeMatch({humans,fake:true,spellShop:spells,heroMod:heroes,seed:37});
 try{
  h.start();h.toPrep(1);assert.equal(h.m.players.size,humans);
  const ps=h.ps('p_0');assert.equal(ps.shop.layout.spell||0,spells?1:0);
  assert.equal(h.m.gd.bandIds().some(id=>id.startsWith('band_hs_')),heroes);
  assert.equal(h.m.gd.seatScale,humans/4);
  if(spells){const coin=ps.acquireItem(ALL_SPELLS.find(c=>c.name==='盟约之币')?.id||'chess_item_1_03_e_a');assert.ok(coin);assert.equal(ps.castSpell(coin.uid,null).ok,true);}
  h.invariants();h.autoHumans();const result=h.runToEnd();assert.equal(result.players.length,humans);
  const snapshot=JSON.stringify(result);for(const damage of [false,true])for(const chat of [false,true]){if(damage)assert.equal(boardFrom(result).rows.length,humans);assert.equal(JSON.stringify(result),snapshot);assert.equal(typeof chat,'boolean');}
  assert.deepEqual(h.logs.error,[]);
 }finally{h.m.dispose();}
});

test('12 real sockets: capacity bounds, isolated chat, identity, rate limit, and tavern controls',async()=>{
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});const clients=[];
 try{
  for(let i=0;i<13;i++){const c=await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`);await c.hello('P'+i);clients.push(c);}
  const host=clients[0];assert.equal((await host.request({t:'room.create',mode:'coop',difficulty:'FUNNY',capacity:12})).t,'ok');
  const room=await host.waitFor('room.state');assert.equal(room.seats.length,12);
  for(const c of clients.slice(1,12))assert.equal((await c.request({t:'room.join',code:room.code})).t,'ok');
  assert.equal((await clients[12].request({t:'room.join',code:room.code})).code,'ROOM_FULL');
  assert.equal((await clients[1].request({t:'room.setCapacity',capacity:8})).code,'NOT_HOST');
  assert.equal((await host.request({t:'room.setCapacity',capacity:8})).code,'BAD_TARGET');
  assert.equal((await host.request({t:'room.setTavernMods',mods:{spells:false,heroes:true}})).t,'ok');
  assert.equal((await host.request({t:'community.chat',text:'<img src=x onerror=alert(1)> 中文'})).t,'ok');
  const msg=await clients[11].waitFor('community.chat');assert.equal(msg.data.name,'P0');assert.equal(msg.code,room.code);
  assert.ok(!clients[12].log.some(m=>m.t==='community.chat'));
  assert.equal((await host.request({t:'community.chat',text:'too soon'})).code,'RATE');
  assert.equal((await clients[12].request({t:'community.chat',text:'outsider'})).code,'NOT_IN_ROOM');
 }finally{for(const c of clients)await c.terminate();await srv.close();}
});
