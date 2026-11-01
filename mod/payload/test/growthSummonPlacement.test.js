import { test } from 'node:test';
import assert from 'node:assert/strict';
import { growthSummonTile } from '../server/sim/content/garrisons/growthSpawn.js';
import { growthData, GROWTH_ROSTER } from '../shared/growthMode.js';
import { DATA } from './match/harness.js';
import { makeBattle } from './helpers/battleHarness.js';
import { DataSource } from '../server/sim/simdata.js';
import { triggerDeathTraits } from '../server/sim/content/garrisons/growthTriggers.js';

const raw=growthData(DATA,true);
const id=name=>GROWTH_ROSTER.find(r=>r.name===name).id;

function placement({legal=[[11,7],[10,7],[11,6],[9,2]],occupied=[],down=[],ranged=false}={}) {
  const ps={playerId:'p1'},source={ownerId:'p1',tileR:11,tileC:7},keys=new Set(legal.map(x=>x.join(',')));
  const b={getPlayer:()=>ps,_boardTile:(_p,r,c)=>[r,c],onOwnBoard:(_p,r,c)=>r>=9&&r<=12&&c>=2&&c<=10,
    grid:{inRect:()=>true,canStand:(r,c,opt)=>opt.ranged===ranged&&keys.has(`${r},${c}`)},
    allyUnits:occupied.map(([tileR,tileC])=>({alive:true,deployed:true,tileR,tileC})),
    downOn:(r,c)=>down.some(x=>x[0]===r&&x[1]===c)};
  return {b,source,def:{position:ranged?'RANGED':'MELEE'}};
}

test('growth summons prefer their original tile, then the nearest legal empty tile rather than the bottom-left',()=>{
  const x=placement();assert.deepEqual(growthSummonTile(x.b,x.source,x.def),[11,7]);
  x.b.allyUnits.push({alive:true,deployed:true,tileR:11,tileC:7});
  assert.deepEqual(growthSummonTile(x.b,x.source,x.def),[10,7]);
  assert.deepEqual(growthSummonTile(x.b,x.source,x.def),[10,7],'equal-distance tie is deterministic');
  const blocked=placement({occupied:[[11,7],[10,7]],down:[[11,6]]});
  assert.deepEqual(growthSummonTile(blocked.b,blocked.source,blocked.def),[9,2],'occupied and downed positions remain reserved');
  const ranged=placement({ranged:true,legal:[[11,9],[9,2]]});
  assert.deepEqual(growthSummonTile(ranged.b,ranged.source,ranged.def),[11,9]);
  assert.equal(growthSummonTile(placement({legal:[]}).b,x.source,x.def),null);
});

for(const kind of ['normal','unite','boss','hidden'])for(const fieldCoords of [false,true]) {
  test(`nearest summons stay on their own mapped board (${kind}, fieldCoords=${fieldCoords})`,()=>{
    const right=kind!=='normal',boss=kind==='boss'||kind==='hidden';
    const player={playerId:'p1',...(right?(boss?{mirror:true}:{colOffset:8}):{}),...(fieldCoords?{coords:'field'}:{}),units:[]};
    const h=makeBattle({data:new DataSource(raw),kind,players:[player],flags:{growthMode:true},autoFinish:false});
    h.step();const p=h.b.players[0],origin=h.b._boardTile(p,11,7),close=h.b._boardTile(p,10,7),far=h.b._boardTile(p,9,2);
    const allowed=new Set([close,far].map(x=>x.join(',')));
    h.b.grid.canStand=(r,c)=>allowed.has(`${r},${c}`);
    const source={ownerId:'p1',tileR:origin[0],tileC:origin[1]};
    assert.deepEqual(growthSummonTile(h.b,source,{position:'MELEE'}),close);
    assert.ok(h.b.onOwnBoard(p,...close));
    h.b.forceEnd();assert.equal(h.b.result().errors,0);
  });
}

for(const name of ['海霓','深巡','乌尔比安']) test(`${name} actual trait summons through nearest placement`,()=>{
  const sea=name==='海霓';
  const h=makeBattle({data:new DataSource(raw),flags:{growthMode:true},autoFinish:false,
    players:[{playerId:'p1',units:[{uid:1,chessId:id(name),row:sea?10:11,col:sea?2:7}],growthEgirPool:[id('深巡')]}]});
  h.step();const source=h.unit(1);triggerDeathTraits(h.b,source);
  const child=h.b.allyUnits.find(u=>u.growthSummoner===source);
  assert.ok(child);assert.deepEqual([child.tileR,child.tileC],sea?[10,3]:[10,7]);
  assert.equal(child.skill.id,raw.chess[child.defId].skill.skillId);
  h.invariants();h.b.forceEnd();assert.equal(h.b.result().errors,0);
});
