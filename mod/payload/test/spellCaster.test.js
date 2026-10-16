import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch} from './match/harness.js';
import {placementContext,canPlace,dropIntent,boardTargets} from '../public/js/ui/gameLogic/placement.js';
import {resolveDrop} from '../public/js/render/drag.js';
import {GEO} from '../shared/constants.js';
import {ALL_SPELLS} from '../shared/spellCatalog.js';
import {validateC2S} from '../shared/protocol.js';

test('an empty lineup casts global spells on every battlefield cell without a caster or operator',()=>{
 const h=makeMatch({fake:true,seed:17,spellShop:true});h.start();h.toPrep(1);const ps=h.ps('p_0');
 assert.equal(ps.allChess().length,0);
 const context=()=>placementContext({priv:ps.privateView(),editable:true,getItem:id=>ps.gd.item(id),getChess:id=>ps.gd.chess(id)});
 const coin=ps.acquireItem('chess_item_1_03_e_a'),funds=ps.funds;
 const cells=[];for(let row=GEO.NORMAL_RECT.r0;row<=GEO.NORMAL_RECT.r1;row++)for(let col=GEO.NORMAL_RECT.c0;col<=GEO.NORMAL_RECT.c1;col++)cells.push({area:'board',row,col});
 assert.equal(boardTargets(context(),coin.uid).legal.length,cells.length);
 for(const target of cells){
  const intent=dropIntent(context(),coin.uid,target);
  assert.deepEqual(intent,{t:'g.castSpell',fields:{itemUid:coin.uid,targetUid:null}});
  assert.equal(validateC2S({...intent.fields,t:intent.t}),null);
  assert.equal(resolveDrop({piece:coin,from:{area:'hand',idx:0},tile:target,overCanvas:true,clientX:10,clientY:10,canPlace:(p,r,c,t)=>canPlace(context(),p.uid,t).ok}).kind,'drop');
 }
 const blocked=context();blocked.deploy.melee.clear();blocked.deploy.ranged.clear();blocked.boardAt.set('10,3',{piece:{uid:999,kind:'chess',handLock:{}}});blocked.priv.spellSupports=[{row:10,col:3}];
 assert.equal(canPlace(blocked,coin.uid,{area:'board',row:10,col:3}).action,'spellGlobal');
 assert.equal(dropIntent(context(),coin.uid,{area:'outside'}),null);
 assert.equal(h.m._handle(ps,{t:'g.castSpell',itemUid:coin.uid,targetUid:null}).ok,true);
 assert.equal(ps.funds,funds+1);assert.equal(ps.find(coin.uid),null);assert.equal(ps.allChess().length,0);
 assert.notEqual(h.m._handle(ps,{t:'g.castSpell',itemUid:coin.uid,targetUid:null}).ok,true);
 const targeted=ps.acquireItem('chess_item_1_04_e_a');
 for(const target of [{area:'board',row:10,col:3}]){
  assert.match(canPlace(context(),targeted.uid,target).reason,/法术/);
  assert.equal(dropIntent(context(),targeted.uid,target),null);
 }
 const gear=ps.acquireItem('chess_item_1_01_e_a');
 assert.match(canPlace(context(),gear.uid,{area:'board',row:10,col:3}).reason,/装备/);
 const browse=ps.acquireItem(ALL_SPELLS.find(s=>s.name==='快速浏览').id),before=ps.privateView().shop.freeRefreshes||0;
 const intent=dropIntent(context(),browse.uid,{area:'board',row:9,col:0});
 assert.equal(h.m._handle(ps,{t:intent.t,...intent.fields}).ok,true);
 assert.equal(ps.find(browse.uid),null);assert.equal(ps.privateView().shop.freeRefreshes,before+2);
 const support=ps.acquireItem(ALL_SPELLS.find(s=>s.name==='支援').id),supportCtx=context();supportCtx.deploy.melee.add('10,3');
 assert.equal(canPlace(supportCtx,support.uid,{area:'board',row:10,col:3}).action,'spellTile');
 supportCtx.boardAt.set('10,3',{piece:{uid:999,kind:'chess'}});
 assert.equal(canPlace(supportCtx,support.uid,{area:'board',row:10,col:3}).ok,false);
 assert.equal(canPlace(supportCtx,support.uid,{area:'board',row:9,col:0}).ok,false);
 h.invariants();h.m.dispose();
});
