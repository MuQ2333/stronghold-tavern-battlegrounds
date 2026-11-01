import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quickTradeInfo,quickTradeHit} from '../../public/js/ui/quickTrade.js';

const ctx={pieces:new Map([
 [1,{area:'board',piece:{uid:1,kind:'chess',id:'plugin_chess',sellPrice:10,items:[{uid:8,id:'plugin_item'}]}}],
 [2,{area:'hand',piece:{uid:2,kind:'chess',id:'native_chess'}}],
 [3,{area:'hand',piece:{uid:3,kind:'item',id:'plugin_item'}}],
 [4,{area:'temp',piece:{uid:4,kind:'item',id:'custom_spell'}}],
 [5,{area:'board',piece:{uid:5,kind:'token',id:'summon'}}],
 [6,{area:'hand',piece:{uid:6,kind:'chess',meta:{spellLockUntil:1},spellLocked:true}}],
 [7,{area:'hand',piece:{uid:7,kind:'item',spellLocked:true}}],
 [8,{area:'hand',equipped:true,piece:{uid:8,kind:'item'}}],
]),getChess:id=>id==='native_chess'?{sellPrice:2}:null};

test('quick trade uses authoritative operator sale values including plugin records and custom final sell prices',()=>{
 assert.deepEqual(quickTradeInfo(ctx,1),{kind:'sell',uid:1,price:10});
 assert.deepEqual(quickTradeInfo(ctx,2),{kind:'sell',uid:2,price:2});
});
test('only loose equipment and spells can be destroyed; summons, locks and equipped items stay protected',()=>{
 for(const uid of [3,4])assert.deepEqual(quickTradeInfo(ctx,uid),{kind:'destroy',uid,price:null});
 for(const uid of [5,6,7,8,999])assert.equal(quickTradeInfo(ctx,uid),null);
 assert.equal(quickTradeInfo(null,1),null);
});
test('quick trade requires release inside the explicit visible screen-space rectangle',()=>{
 const r={left:100,top:200,right:250,bottom:300};
 for(const p of [{x:100,y:200},{x:249,y:299}])assert.equal(quickTradeHit(r,p),true);
 for(const p of [{x:99,y:250},{x:250,y:250},{x:150,y:300},{x:-1,y:-1},{x:NaN,y:220},null])assert.equal(quickTradeHit(r,p),false);
 assert.equal(quickTradeHit(null,{x:100,y:200}),false);
});
