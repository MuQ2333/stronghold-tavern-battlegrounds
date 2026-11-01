import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA, makeMatch } from './match/harness.js';
import { makeBattle, chessRec } from './helpers/battleHarness.js';
import { growthData, GROWTH_ROSTER, GROWTH_EVENTS } from '../shared/growthMode.js';
import { DataSource } from '../server/sim/simdata.js';
import { ALL_SPELLS } from '../shared/spellCatalog.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
const active=(count=1,layers=0,tier=1)=>({active:true,count,layers,tier});
const done=h=>{h.b.forceEnd();assert.equal(h.b.result().errors,0,JSON.stringify(h.b.errors));};
test('all 120 reviewed and added identities have both grades, edited tiers/memberships and declared trait classification',()=>{
  const d=growthData(DATA,true),names=Object.fromEntries(Object.values(d.bonds).map(b=>[b.name,b.bondId]));names['协防']='emptyShip';
  assert.equal(GROWTH_ROSTER.length,120);
  for(const row of GROWTH_ROSTER)for(const elite of [false,true]) {
    const c=d.chess[id(row.name,elite)];assert.ok(c,row.name);assert.equal(c.tier,row.tier,row.name);
    const expected=[...new Set([row.main,row.addon].flatMap(s=>s.split('、').map(n=>names[n])).filter(x=>x && x!=='investShip'))].sort();
    assert.deepEqual([...c.bonds].sort(),expected,row.name);
    if(row.handler) {
      assert.equal(c.growthTrait.handler,row.handler,row.name);
      const g=d.garrisons[c.garrisonIds[0]];assert.equal(g.eventType,GROWTH_EVENTS[row.handler]);assert.ok(g.desc.length>0);
    } else assert.deepEqual(c.garrisonIds,DATA.chess[c.chessId].garrisonIds,row.name);
  }
  const desc=(name,elite=false)=>d.garrisons[d.chess[id(name,elite)].garrisonIds[0]].desc;
  assert.match(desc('深巡'),/攻击力、防御力、生命上限减半/);
  assert.match(d.garrisons[d.chess[id('乌尔比安')].garrisonIds[0]].growthNotes,/伤害成长部分保留/);
  assert.ok(desc('深巡').length < 65);
  assert.doesNotMatch(desc('深巡'),/复制体|合法空位/);
  assert.match(desc('蓝毒',true),/^<被击倒时>/);
  assert.match(desc('幽灵鲨',true),/^<战斗中>/);
  assert.match(desc('归溟幽灵鲨'),/^<战斗中>/);
  for(const name of ['忍冬','安洁莉娜','赫德雷','魔王'])assert.match(desc(name),/本局/);
  for(const name of ['闪灵','魔王'])assert.match(desc(name),/主动自伤/);
});

test('all 240 real growth operator forms instantiate, activate their actual kit and resolve combat events without sim faults',()=>{
  const d=growthData(DATA,true),data=new DataSource(d);
  for(const row of GROWTH_ROSTER)for(const elite of [false,true]) {
    const rec=d.chess[id(row.name,elite)],bonds=Object.fromEntries(rec.bonds.map(b=>[b,active(1,10)]));
    const h=makeBattle({data,flags:{growthMode:true},units:[{chessId:rec.chessId,row:10,col:4,uid:1}],bonds,autoFinish:false});
    h.step();const u=h.b.allyUnits[0];u.skill?.activate('workbook-audit',{free:true});
    const e=h.spawn('enemy_1001_1',{pos:[9,7]});h.b.dealDamage(u,e,{amount:1e8,type:'true',isAttack:true,canDodge:false});
    h.b.kill(u);h.step();h.b.forceEnd();assert.equal(h.b.result().errors,0,`${row.name}/${elite}: ${JSON.stringify(h.b.errors)}`);
  }
});

function simple(bond,growth=true) {
  const d=growth?growthData(DATA,true):DATA;
  const rec=chessRec({id:'audit_holder_a',bonds:[bond],skill:null,stats:{atk:1000,maxHp:10000}});
  return makeBattle({data:new DataSource({...d,chess:{...d.chess,[rec.chessId]:rec}}),flags:{growthMode:growth},
    units:[{chessId:rec.chessId,row:9,col:3,uid:1},{chessId:rec.chessId,row:11,col:6,uid:2}],
    bonds:{[bond]:active(growth?3:6,0,2)},autoFinish:false});
}
test('growth Laterano and Kazimierz exceed their former ATK caps while native mode retains them',()=>{
  for(const growth of [false,true]) {
    const l=simple('lateranoShip',growth);l.step();const [a,b]=l.b.allyUnits;
    for(let n=0;n<60;n++)l.b.emit('ammoUsed',{unit:a});
    assert.ok(Math.abs(b.s.atk-(growth?3400:3000))<1e-6);done(l);
    const k=simple('kazimierzShip',growth);k.step();const [x,y]=k.b.allyUnits;
    for(let n=0;n<10;n++){k.b.retreat(y);assert.equal(k.b.redeploy(y,{free:true}),true);}
    assert.ok(Math.abs(x.s.atk-(growth?3400:1500))<1e-6);done(k);
  }
});

function indom() {
  const h=simple('indomShip'),bb=growthData(DATA,true).bonds.indomShip.bb;
  h.b.players[0].bonds.indomShip.layers=(1-bb.base_prob)/bb.prob_per_stack;h.step();return h;
}
test('growth Indom halves after successes only, uses independent operators, and resets each battle',()=>{
  const h=indom(),[a,b]=h.b.allyUnits;h.b.rng=()=>0.6;
  h.b.kill(a);assert.equal(a.alive,true,'first chance is 100%');h.step();
  h.b.kill(a);assert.equal(a.alive,false,'after success chance is 50%');
  h.b.kill(b);assert.equal(b.alive,true,'the other operator still has 100%');
  h.b.redeploy(a,{free:true});h.step();h.b.rng=()=>0.4;
  h.b.kill(a);assert.equal(a.alive,true,'a failed 50% roll did not halve it further');h.step();
  h.b.kill(a);assert.equal(a.alive,false,'the second success reduced it to 25%');done(h);
  const next=indom();next.b.rng=()=>0.6;next.b.kill(next.b.allyUnits[0]);assert.equal(next.b.allyUnits[0].alive,true);done(next);
});

test('growth Indom retains chance above 100% through multiple successful halvings',()=>{
  const h=indom(),u=h.b.allyUnits[0],bb=growthData(DATA,true).bonds.indomShip.bb;
  h.b.players[0].bonds.indomShip.layers=(4-bb.base_prob)/bb.prob_per_stack;
  h.b.rng=()=>0.9;
  for(let i=0;i<3;i++){h.b.kill(u);assert.equal(u.alive,true,`raw chance 400/200/100: success ${i+1}`);h.step();}
  h.b.kill(u);assert.equal(u.alive,false,'the fourth chance is 50%, not guaranteed');done(h);
});

test('new combat Indom layers use the current base chance with all previous success halvings',()=>{
  const h=indom(),[u,fresh]=h.b.allyUnits,bb=growthData(DATA,true).bonds.indomShip.bb;
  const gain=n=>h.b.addLayers(h.b.players[0].playerId,'indomShip',Math.round(n/bb.prob_per_stack),'audit',{temporary:true});
  h.b.rng=()=>0.9;h.b.kill(u);assert.equal(u.alive,true,'100% initial chance succeeds');h.step();
  gain(0.2);h.b.rng=()=>0.65;h.b.kill(u);
  assert.equal(u.alive,false,'120% base / 2 = 60%, not 50% + 20%');
  assert.equal(h.b.redeploy(u,{free:true}),true);h.step();
  gain(0.4);h.b.rng=()=>0.75;h.b.kill(u);
  assert.equal(u.alive,true,'160% base / 2 = 80%; failed rolls did not add a halving');h.step();
  h.b.rng=()=>0.45;h.b.kill(u);assert.equal(u.alive,false,'second success now gives 160% / 4 = 40%');
  h.b.rng=()=>0.99;h.b.kill(fresh);assert.equal(fresh.alive,true,'another operator still has the full 160% chance');done(h);
});
test('a banked Indom switch charges one success, consuming the banked deployment does not halve twice',()=>{
  const h=indom(),u=h.b.allyUnits[0];h.b.rng=()=>0.6;
  h.b.emit('dollSwap',{unit:u,form:'doll'});assert.equal(u.mem.indomFreeDeploy,true);
  h.b.kill(u);assert.equal(u.alive,true);assert.equal(u.mem.indomFreeDeploy,false);h.step();
  h.b.rng=()=>0.4;h.b.kill(u);assert.equal(u.alive,true,'banked grant left the next chance at 50%');h.step();
  h.b.kill(u);assert.equal(u.alive,false);done(h);
});

test('Titi listens to enemies and friendly operators entering control, not ordinary friendly tokens or refreshes',()=>{
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},
    units:[{chessId:id('缇缇'),row:9,col:4}],bonds:{sargonShip:active(),preciShip:active()},autoFinish:false});h.step();
  const e=h.spawn('enemy_1001_1',{pos:[9,5]}),p=h.b.players[0];
  h.b.emit('statusApplied',{target:{...e,side:'ally',kind:'token'},status:'stun',entered:true});assert.equal(p.bonds.sargonShip.layers,0);
  h.b.emit('statusApplied',{target:e,status:'stun',entered:false});assert.equal(p.bonds.sargonShip.layers,0);
  h.b.emit('statusApplied',{target:e,status:'stun',entered:true});assert.equal(p.bonds.sargonShip.layers,1);
  h.b.emit('statusApplied',{target:{...e,side:'ally',kind:'op'},status:'sleep',entered:true});assert.equal(p.bonds.sargonShip.layers,2);done(h);
});

function prep() {
  const h=makeMatch({growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'FUNNY',fake:true,seed:52});h.start();h.toPrep(1);
  const ps=h.ps('p_0');ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.gd.modeInactiveBonds.clear();h.m.disabledBonds=[];ps.bandId=null;ps.layers={};ps.funds=100;
  const put=(name,elite=false,r=9,c=3)=>{const p=ps.newPiece('chess',id(name,elite));ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  const refresh=()=>{for(let n=0;n<3;n++)h.m.dispatch(ps,'onRefresh',{trigger:false});};
  const close=()=>{assert.deepEqual(h.logs.error,[]);h.m.dispose();};
  return {h,ps,put,refresh,close};
}
test('Lappland alter compares a single grant and triggers only that grant without buying or acquiring the card',()=>{
  const s=prep();s.put('荒芜拉普兰德');s.ps.growthState={grants:[{match:['kjeragShip'],n:3,active:false},{match:['sargonShip'],n:4,active:false}],grantBonus:0};
  s.ps.shop.slots=[{kind:'chess',id:id('角峰'),sold:false},{kind:'chess',id:id('艾丝黛尔'),sold:false}];const funds=s.ps.funds,gained=s.ps.round.gainedChess;
  s.refresh();assert.equal(s.ps.layers.sargonShip,4);assert.equal(s.ps.layers.kjeragShip || 0,0);assert.equal(s.ps.layers.steadShip || 0,0);
  assert.equal(s.ps.funds,funds);assert.equal(s.ps.round.gainedChess,gained);assert.ok(s.ps.shop.slots.every(x=>!x.sold));
  s.ps.growthState.grants=[{match:['kjeragShip'],target:'kjeragShip',n:3,active:false},{match:['steadShip'],target:'steadShip',n:5,active:false}];
  s.refresh();assert.equal(s.ps.layers.steadShip,5);assert.equal(s.ps.layers.kjeragShip || 0,0);s.close();
});
test('Lappland alter breaks highest ties with seeded randomness, including both tied choices reproducibly',()=>{
  const run=()=>{
    const s=prep();s.put('荒芜拉普兰德');s.ps.growthState={grants:[{match:['kjeragShip'],target:'kjeragShip',n:4,active:false},{match:['sargonShip'],n:4,active:false}],grantBonus:0};
    s.ps.shop.slots=[{kind:'chess',id:id('角峰'),sold:false},{kind:'chess',id:id('艾丝黛尔'),sold:false}];const selected=[];
    for(let n=0;n<20;n++){s.ps.layers={};s.refresh();selected.push(s.ps.layers.sargonShip===4?'B':'A');}
    s.close();return selected;
  };
  const a=run();assert.equal(new Set(a).size,2);assert.deepEqual(a,run());
});
test('replaying the strongest spell purchase grant applies current spell strength exactly once',()=>{
  const s=prep();s.put('荒芜拉普兰德');s.ps.growthState={grants:[{match:['sargonShip'],n:3,active:false}],grantBonus:0,spellBonus:3};
  s.ps.spellData().growth=1;s.ps.shop.slots=[{kind:'chess',id:id('艾丝黛尔'),sold:false}];s.refresh();
  assert.equal(s.ps.layers.sargonShip,4,'wand 1 + spell strength 3; no other grant or second strength bonus');s.close();
});
test('Corrupted Cupcakes purchase replays also apply spell strength only once to each devoured card',()=>{
  const s=prep(),target=s.put('小满');s.ps.growthState={grants:[],grantBonus:0,spellBonus:3};s.ps.spellData().growth=1;
  s.ps.shop.slots=Array.from({length:3},()=>({kind:'chess',id:id('艾丝黛尔'),sold:false}));
  const card=s.ps.acquireItem(ALL_SPELLS.find(x=>x.name==='腐化糕点').id);
  assert.equal(s.ps.castSpell(card.uid,target.uid).ok,true);assert.equal(s.ps.layers.sargonShip,12);s.close();
});
