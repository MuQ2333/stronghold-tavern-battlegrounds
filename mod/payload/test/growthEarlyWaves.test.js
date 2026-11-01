import {test} from 'node:test';
import assert from 'node:assert/strict';
import {growthEarlyWaves} from '../shared/growthEarlyWaves.js';
import {DATA} from './match/harness.js';
import {GameData} from '../server/match/gamedata.js';
import {growthData} from '../shared/growthMode.js';
import {createRng} from '../server/sim/rng.js';
import {setupMatchWaves,buildNormalWave,withBounties,previewOf} from '../server/match/waves.js';

test('growth count apportionment preserves each action, window and excluded reward enemies',()=>{
 const w={spawns:[2,3,4,5,1].map((count,i)=>({actionIndex:i,count,time:i*5,interval:2,enemyKey:'forge_enemy'})),actions:[2,3,4,5,1].map((count,index)=>({count,index,window:count*2}))};
 w.spawns.push({tag:'bounty',count:1,time:0,interval:0});const before=structuredClone(w);
 const r=growthEarlyWaves(w,2,true);assert.equal(r.spawns.reduce((n,s)=>n+s.count,0),13);
 r.spawns.slice(0,5).forEach((s,i)=>{assert.equal(s.count,r.actions[i].count);assert.equal(s.count*s.interval,w.spawns[i].count*2);assert.equal(s.time,w.spawns[i].time);});
 assert.deepEqual(w,before);assert.deepEqual(r.spawns.at(-1),w.spawns.at(-1));
 for(const round of [1,6,14,15])assert.equal(growthEarlyWaves(w,round,true),w);
 assert.equal(growthEarlyWaves(w,2,false),w);
 const tiny={spawns:[{count:1},{count:1}],actions:[]};assert.equal(growthEarlyWaves(tiny,3,true).spawns.length,2);
});

test('single HARD 100 real seeded waves keep preview, bounty insertion and reduced counts aligned',()=>{
 const before=new GameData(DATA,'mode_single_hard'),after=new GameData(growthData(DATA,true),'mode_single_hard');
 for(let seed=1;seed<=100;seed++) {
  const setup=setupMatchWaves(before,createRng(seed));
  for(let r=2;r<=5;r++) {
   const a=buildNormalWave(before,createRng(seed),setup,r),b=buildNormalWave(after,createRng(seed),setup,r);
   const n=a.spawns.reduce((n,s)=>n+s.count,0),want=Math.max(a.spawns.length,Math.round(n*0.8));
   assert.equal(b.spawns.reduce((n,s)=>n+s.count,0),want);
   const spawns=withBounties(after,r,b,[],'p1');
   assert.equal(previewOf(spawns).reduce((n,s)=>n+s.count,0),want);
   assert.deepEqual(b.spawns.map(s=>s.enemyKey),a.spawns.map(s=>s.enemyKey));
   const card=DATA.choices.cards.bounty.find(c=>after.enemy(c.enemyKey));
   const rewarded=withBounties(after,r,b,[{id:'test_bounty',card:{...card,count:3}}],'p1');
   assert.equal(rewarded.filter(s=>s.tag==='bounty').reduce((n,s)=>n+s.count,0),3);
   assert.equal(rewarded.filter(s=>s.tag!=='bounty').reduce((n,s)=>n+s.count,0),want,'bounty insertion must not restore removed enemies');
  }
 }
});
