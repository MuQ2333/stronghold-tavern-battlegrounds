import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeMatch,give} from './match/harness.js';
for(const humans of [8,12])test(`real battle simulation with ${humans} players and tavern modules`,()=>{
 const h=makeMatch({humans,fake:false,spellShop:true,heroMod:true,clientCombat:true,seed:17,battleContent:'full'});
 try{h.start();h.toPrep(1);for(const ps of h.m.players.values()){ps.lp=100;ps.funds=10;const id=ps.spellChessPool(2,c=>c.position==='MELEE')[0],piece=give(h.m,ps,id);const [key]=[...ps.deployMap()].find(([,kind])=>kind==='melee');ps._detach(ps.find(piece.uid));ps.board.set(key,piece);ps.recompute();}
  h.toPrep(2);assert.equal(h.m.round,2);h.invariants();assert.deepEqual(h.logs.error,[]);assert.equal(h.m.players.size,humans);
 }finally{h.m.dispose();}
});
