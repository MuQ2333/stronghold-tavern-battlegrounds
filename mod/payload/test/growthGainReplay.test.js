import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './match/harness.js';
import {makeBattle,flatStage} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {Battle} from '../server/sim/Battle.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {installGrowthEconomy,finishGrowthCombat} from '../server/match/growthCombat.js';
import {triggerDeathTraits,triggerDeployTraits,triggerGainTraits} from '../server/sim/content/garrisons/growthTriggers.js';
import {spellTarget} from '../shared/spells.js';
import {consumeShop} from '../server/match/growthKazdel.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
function prep(growthMode=true,options={}) {
  const h=makeMatch({growthMode,spellShop:true,heroMod:false,fake:true,mode:'solo',difficulty:'FUNNY',...options});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.gd.modeInactiveBonds.clear();h.m.disabledBonds=[];ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.recompute();
  const put=(name,r,c,elite=false)=>{const p=ps.newPiece('chess',id(name,elite),{poolCopies:0});p.dir='RIGHT';ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  return {h,ps,put};
}
function combat(t,extra={}) {
  const {ps}=t;
  const bonds=Object.fromEntries(Object.entries(ps.bonds).map(([key,v])=>[key,{...v,layers:ps.layers[key] || 0}]));
  // No Aegir devour/revival side effects in these focused replay tests.
  if(bonds.egirShip)bonds.egirShip.active=false;
  const units=[...ps.board].map(([key,p])=>{const [row,col]=key.split(',').map(Number);return {uid:p.uid,chessId:p.id,row,col,dir:p.dir};});
  const f=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true,layerGainsEnabled:true},players:[{playerId:ps.playerId,units,bonds}],autoFinish:false,...extra});
  installGrowthEconomy(t.h.m,f.b);t.h.m.phase='COMBAT';
  f.step();return {...f,unit:p=>f.b.allyUnits.find(u=>u.uid===p.uid)};
}
function done(t,f) {f.b.forceEnd();assert.equal(f.b.result().errors,0,JSON.stringify(f.b.errors));assert.deepEqual(t.h.logs.error,[]);assert.deepEqual(t.h.logs.warn,[]);t.h.m.dispose();}

test('combat devour reads field Kazdel tier, converts main layers and permanently commits each reward once',()=>{
 const t=prep(),p=t.put('逻各斯',10,3);t.put('魔王',11,3);t.put('赫德雷',12,3);
 t.ps.growthState={grants:[{n:2,active:false}],gainGrant:3};
 t.ps.shop.slots=[{kind:'chess',id:id('小满'),sold:false}];
 const f=combat(t),player=f.b.getPlayer(t.ps.playerId);assert.equal(player.bonds.kazdelShip.tier,2);
 // A stale prep tier must not turn off a field's active three-member rule.
 t.ps.bonds.kazdelShip={...t.ps.bonds.kazdelShip,tier:1};
 f.b.emit('growthGainTrait',{unit:f.unit(p),action:ps=>consumeShop(ps,1)});
 assert.equal(t.ps.layers.yanShip||0,0);assert.equal(t.ps.layers.kazdelShip,5);assert.equal(t.ps.layers.skillfulShip,5);
 assert.equal(player.bonds.kazdelShip.layers,5);f.b.forceEnd();assert.deepEqual(f.b.result().perPlayer[t.ps.playerId].layerGains,{});
 const saved={...t.ps.layers};t.h.m.dispatch(t.ps,'onBattleResult',{result:f.b._pp(t.ps.playerId)});assert.deepEqual(t.ps.layers,saved);done(t,f);
});

for(const elite of [false,true])test(`Gladiia replays behind${elite?' and front':''}, with permanent live layers and no settlement duplication`,()=>{
  const t=prep(),g=t.put('歌蕾蒂娅',10,4,elite),behind=t.put('角峰',10,3),front=t.put('艾丝黛尔',10,5);
  const f=combat(t);const old={...t.ps.layers};
  triggerDeathTraits(f.b,f.unit(g));
  for(const bond of t.ps.gd.chess(behind.id).bonds)assert.equal(t.ps.layers[bond] || 0,(old[bond] || 0)+2);
  for(const bond of t.ps.gd.chess(front.id).bonds)assert.equal(t.ps.layers[bond] || 0,(old[bond] || 0)+(elite?2:0));
  assert.deepEqual(f.b._pp(t.ps.playerId).layerGains,{});
  const saved={...t.ps.layers};t.h.m.dispatch(t.ps,'onBattleResult',{result:f.b._pp(t.ps.playerId)});assert.deepEqual(t.ps.layers,saved);done(t,f);
});

test('Gladiia uses facing and living adjacent operators, and synthetic defeat never actually knocks her out',()=>{
  const t=prep(),g=t.put('歌蕾蒂娅',10,4),p=t.put('普罗旺斯',9,4);g.dir='UP';const f=combat(t);
  const before=t.ps.shop.freeRefreshes;triggerDeathTraits(f.b,f.unit(g));assert.equal(t.ps.shop.freeRefreshes,before+1);assert.equal(f.unit(g).alive,true);
  f.b.kill(f.unit(p));triggerDeathTraits(f.b,f.unit(g));assert.equal(t.ps.shop.freeRefreshes,before+1);done(t,f);
});

test('each Jian gets one full elite/Indre activation; gain repeaters multiply target gains, not actual deployments',()=>{
  const t=prep(),j=t.put('锏',10,2,true);t.put('锏',11,2);t.put('隐德来希',12,2);t.put('山',12,3);t.put('普罗旺斯',10,4);
  const old=t.ps.shop.freeRefreshes,f=combat(t);assert.equal(t.ps.shop.freeRefreshes-old,12,'elite 2 * Indre 2 * Mountain 2, plus normal 1 * 2 * 2');
  const value=t.ps.shop.freeRefreshes,seq=f.unit(j).deploySeq;triggerDeployTraits(f.b,f.unit(j),{times:3});
  assert.equal(t.ps.shop.freeRefreshes,value);assert.equal(f.unit(j).deploySeq,seq);done(t,f);
});

test('battle gifts arrive and trigger their gain chain now; triple and elite gain wait until battle result',()=>{
  const t=prep(),g=t.put('歌蕾蒂娅',10,4);t.put('能天使',11,3);
  // Use the actual Exusiai-alter gift, which produces normal Exusiai (and then a real spell).
  const alter=GROWTH_ROSTER.find(r=>r.handler==='gainExusiai');assert.ok(alter);
  const donor=t.put(alter.name,10,3);const f=combat(t),before=t.ps.round.gainedChess;
  triggerDeathTraits(f.b,f.unit(g));assert.equal(t.ps.round.gainedChess,before+1);
  assert.equal(t.ps.countCopies(id('能天使')),2);
  triggerDeathTraits(f.b,f.unit(g));assert.equal(t.ps.countCopies(id('能天使')),3);
  assert.equal(t.ps.find(donor.uid).piece,donor);assert.ok(t.ps.hand.some(p=>p?.kind==='item'&&t.ps.gd.item(p.id)?.spellMod),'gift onGain generated a spell in this battle');
  const spellCount=()=>[...t.ps.hand,...t.ps.temp].filter(p=>p?.kind==='item'&&(t.ps.gd.item(p.id)?.spellMod || spellTarget(t.ps.gd.item(p.id)))).length;
  const spells=spellCount();t.h.m.dispatch(t.ps,'onBattleResult',{result:f.b._pp(t.ps.playerId)});
  assert.equal(t.ps.countCopies(id('能天使')),0);assert.ok(t.ps.allChess().some(p=>p.id===id('能天使',true)));assert.equal(spellCount(),spells+2,'new elite replays onGain after merging');done(t,f);
});

test('confirmed large onGain layer gifts persist and highest-bond selection reads current battle growth',()=>{
  const t=prep(),snow=t.put('雪猎',10,3),scribe=t.put('录武官',11,3),grey=t.put('灰毫',12,3);
  t.ps.layers.yanShip=30;t.ps.recompute();const f=combat(t);f.b.getPlayer(t.ps.playerId).bonds.yanShip.active=true;
  for(const p of [snow,scribe,grey])triggerGainTraits(f.b,f.unit(p));
  assert.equal(t.ps.layers.yanShip,40);assert.equal(t.ps.layers.miraShip,3);
  for(const b of t.ps.gd.chess(snow.id).bonds)assert.ok(t.ps.layers[b]>=5);done(t,f);
});

test('battle scribe gains use each acquisition count in order and the post-battle elite counts once',()=>{
  const t=prep(),carrier=t.put('普罗旺斯',10,3),f=combat(t);
  f.b.emit('growthGainTrait',{unit:f.unit(carrier),action:ps=>{
    for(let i=0;i<3;i++)ps.acquireChess(id('录武官'),{fromPool:false});
  }});
  assert.equal(t.ps.layers.yanShip,36);assert.equal(t.ps.layers.miraShip,18);
  assert.equal(t.ps.growthState.scribeGains,3);
  finishGrowthCombat(t.ps);assert.equal(t.ps.growthState.scribeGains,4);
  assert.equal(t.ps.layers.yanShip,84);assert.equal(t.ps.layers.miraShip,42);
  done(t,f);
});

test('onGain replay uses live Kjerag amplification exactly once and preserves match-long shop grants',()=>{
  const t=prep(),p=t.put('角峰',10,3),grant=t.put('忍冬',11,3),amp=t.put('凛御银灰',12,3);const f=combat(t);
  const old=t.ps.layers.kjeragShip || 0;triggerGainTraits(f.b,f.unit(amp));triggerGainTraits(f.b,f.unit(p));assert.equal(t.ps.layers.kjeragShip,old+3);
  triggerGainTraits(f.b,f.unit(grant));assert.equal(t.ps.growthState.grants[0].n,3);
  assert.equal(f.b.getPlayer(t.ps.playerId).bonds.kjeragShip.layers,t.ps.layers.kjeragShip);done(t,f);
});

test('Jian obtained in prep replays actual layer deployment traits, excludes her own name and leaves DP untouched',()=>{
  const t=prep(),p=t.put('瑕光',10,3),r=t.put('砾',11,3);t.put('锏',12,3);const before={...t.ps.layers};
  t.h.m.dispatcher.triggerGarrisons(t.ps,{...t.ps.newPiece('chess',id('锏'))},'SERVER_GAIN');
  assert.equal(t.ps.layers.kazimierzShip,(before.kazimierzShip || 0)+6);assert.equal(r.meta.growthTraitUses,1);assert.equal(t.ps.find(p.uid).piece,p);
  assert.deepEqual(t.h.logs.error,[]);t.h.m.dispose();
});

test('read-only battle preview cannot draw stock or replay real onGain rewards',()=>{
  const t=prep(),p=t.put('普罗旺斯',10,3);t.h.m.BattleClass=Battle;const input=t.ps.battleInput();const before=t.ps.shop.freeRefreshes,stock=t.h.m.pool.snapshot(),rng=t.h.m.rngMeta.state();
  const b=t.h.m.newBattle({players:[input],stage:flatStage(),timeLimit:1,autoFinish:false},{preview:true});b.start();triggerGainTraits(b,b.allyUnits.find(u=>u.uid===p.uid));
  assert.equal(t.ps.shop.freeRefreshes,before);assert.deepEqual(t.h.m.pool.snapshot(),stock);assert.deepEqual(t.h.m.rngMeta.state(),rng);b.forceEnd();t.h.m.dispose();
});

test('real match newBattle installs the authoritative bridge and disabled growth preserves native acquisition',()=>{
  const t=prep(),p=t.put('普罗旺斯',10,3);t.h.m.BattleClass=Battle;const before=t.ps.shop.freeRefreshes;
  const b=t.h.m.newBattle({players:[t.ps.battleInput()],stage:flatStage(),timeLimit:1,autoFinish:false});b.start();triggerGainTraits(b,b.allyUnits.find(u=>u.uid===p.uid));assert.equal(t.ps.shop.freeRefreshes,before+1);b.forceEnd();t.h.m.dispose();
  const off=prep(false);off.ps.acquireChess(id('能天使'),{silent:true,fromPool:false});off.ps.acquireChess(id('能天使'),{silent:true,fromPool:false});off.ps.acquireChess(id('能天使'),{silent:true,fromPool:false});
  assert.equal(off.ps.countCopies(id('能天使')),0);assert.equal(off.ps.growthCombatMerges,undefined);finishGrowthCombat(off.ps);off.h.m.dispose();
});

test('opening the actual unit-stat detail preview does not pay Jian gain rewards or touch stock and economy',()=>{
  const t=prep();t.put('锏',10,3);t.put('普罗旺斯',10,4);
  t.h.m.BattleClass=class extends Battle {constructor(opts){super({...opts,stage:flatStage()});}};
  const before={refresh:t.ps.shop.freeRefreshes,stock:t.h.m.pool.snapshot(),rng:t.h.m.rngMeta.state(),layers:{...t.ps.layers},gained:t.ps.round.gainedChess};
  assert.ok(t.h.m._unitStatsOf(t.ps).length>0);t.h.m._unitStatsCache=null;t.h.m._unitStatsOf(t.ps);
  assert.equal(t.ps.shop.freeRefreshes,before.refresh);assert.equal(t.ps.round.gainedChess,before.gained);
  assert.deepEqual(t.ps.layers,before.layers);assert.deepEqual(t.h.m.pool.snapshot(),before.stock);assert.equal(t.h.m.rngMeta.state(),before.rng);
  assert.deepEqual(t.h.logs.error,[]);t.h.m.dispose();
});

test('non-Jian targets can replay repeatedly in one chain; own-name exclusion does not become whole-chain deduplication',()=>{
  const t=prep(),g=t.put('歌蕾蒂娅',10,4);t.put('锏',10,3);t.put('瑕光',11,3);const f=combat(t);
  const before=f.b.getPlayer(t.ps.playerId).bonds.kazimierzShip.layers;
  triggerDeathTraits(f.b,f.unit(g),{times:2});
  assert.equal(f.b.getPlayer(t.ps.playerId).bonds.kazimierzShip.layers,before+10);
  assert.equal(f.b._pp(t.ps.playerId).layerGains.kazimierzShip,15,'one initial deploy plus two indirect replays');done(t,f);
});

test('Hoshiguma indirect prep-end growth keeps the target policy and updates the current battle',()=>{
  const t=prep(),star=t.put('星熊',10,3),row=GROWTH_ROSTER.find(r=>r.handler==='ownLayersEnd');const p=t.put(row.name,10,5);const f=combat(t);
  const own=t.ps.gd.chess(p.id).bonds.filter(b=>t.ps.bonds[b]?.active),before={...t.ps.layers};triggerGainTraits(f.b,f.unit(star));
  for(const b of own){assert.equal(t.ps.layers[b],(before[b] || 0)+8);assert.equal(f.b.getPlayer(t.ps.playerId).bonds[b].layers,t.ps.layers[b]);}
  assert.ok(own.length);done(t,f);
});

test('Far Tooth grants created through Hoshiguma become visible and replayable in the same battle',()=>{
  const t=prep(),star=t.put('星熊',10,3);t.put('远牙',10,5);const target=t.put('普罗旺斯',10,6),f=combat(t);
  triggerGainTraits(f.b,f.unit(star));assert.equal(target.meta.growthDeployGrants.normal,1);
  assert.deepEqual(f.unit(target).growthGrantedTraits,[{garrisonId:'growth_grant_deploy_normal',count:1,value:4}]);
  const before=f.b.getPlayer(t.ps.playerId).bonds.preciShip.layers;triggerDeployTraits(f.b,f.unit(target));
  assert.equal(f.b.getPlayer(t.ps.playerId).bonds.preciShip.layers,before+4);done(t,f);
});

test('indirect positional traits use living combat positions rather than stale preparation positions',()=>{
  const t=prep(),star=t.put('星熊',10,3),grow=GROWTH_ROSTER.find(r=>r.handler==='ownLayersEnd'),p=t.put(grow.name,10,5);t.put('凯瑟琳',10,6);
  const f=combat(t);f.unit(p).tileC=7;
  const before={...t.ps.layers};triggerGainTraits(f.b,f.unit(star));
  const own=t.ps.gd.chess(p.id).bonds.filter(b=>t.ps.bonds[b]?.active);assert.ok(own.length);
  for(const b of own)assert.equal(t.ps.layers[b],(before[b] || 0)+8);done(t,f);
});

test('Kazdel rollback rewards use living battle observers and retain armor; unprotected active self-harm can eliminate',()=>{
  const t=prep(),v=t.put('红豆',10,3);t.put('闪灵',11,3);t.put('魔王',12,3);t.ps.spellData().armor=3;const f=combat(t),hp=t.ps.lp;
  triggerGainTraits(f.b,f.unit(v));assert.equal(t.ps.lp,hp);assert.equal(t.ps.spellState.armor,3);assert.equal(t.ps.growthState.gainGrant,1);assert.equal(t.ps.layers.kazdelShip,2);done(t,f);
  const fatal=prep(),p=fatal.put('红豆',10,3);fatal.ps.lp=1;const ff=combat(fatal);triggerGainTraits(ff.b,ff.unit(p));assert.equal(fatal.ps.lp,0);assert.equal(fatal.ps.alive,false);assert.equal(ff.b.finished,true);assert.equal(ff.b.result().errors,0);assert.deepEqual(fatal.h.logs.error,[]);fatal.h.m.dispose();
});

test('final/hidden self-harm debits only its owner, survives pooled-life resync, and never consumes ally armor',()=>{
  const t=prep(true,{mode:'coop',humans:2}),p=t.put('红豆',10,3),other=t.h.ps('p_1');
  t.ps.lp=10;other.lp=10;other.spellData().armor=5;t.h.m._openTeamLp();const f=combat(t,{kind:'boss'});t.h.m.phase='FINAL_ASSAULT';
  triggerGainTraits(f.b,f.unit(p));assert.equal(t.ps.lp,9);assert.equal(other.lp,10);assert.equal(t.h.m.teamLp,20);assert.equal(other.spellState.armor,5);
  t.h.m._syncTeamLp();assert.equal(t.ps.lp,9,'shared projection must not heal personal self-harm');
  t.h.m.teamLp=18;t.h.m._syncTeamLp();assert.equal(t.ps.lp,8);assert.equal(other.lp,9);assert.equal(t.ps.growthState.personalFinalDamage,1);
  t.h.m.phase='HIDDEN_CORE';triggerGainTraits(f.b,f.unit(p));t.h.m._syncTeamLp();assert.equal(t.ps.lp,7);assert.equal(other.lp,9);assert.equal(t.h.m.teamLp,18);done(t,f);
});

test('Mlynar timed deployment buffs and superseded Surtr deployment layers are not indirectly replayed',()=>{
  const t=prep(),m=t.put('玛恩纳',10,3),s=t.put('史尔特尔',11,3);t.ps.layers.kazimierzShip=100;t.ps.recompute();const f=combat(t),mu=f.unit(m),su=f.unit(s);
  f.b.step();const raid=f.b.getPlayer(t.ps.playerId).bonds.raidShip.layers;
  const mods=mu.buffs.map(b=>({...b}));triggerDeployTraits(f.b,mu);triggerDeployTraits(f.b,su);
  assert.deepEqual(mu.buffs,mods);assert.equal(f.b.getPlayer(t.ps.playerId).bonds.raidShip.layers,raid);done(t,f);
});

test('battle replays remain permanent in unite/boss fields without fabricating ordinary battle layer gains',()=>{
  for(const kind of ['unite','boss']) {
    const t=prep(),p=t.put('角峰',10,3);const f=combat(t,{kind,flags:{growthMode:true,layerGainsEnabled:false}});triggerGainTraits(f.b,f.unit(p));
    for(const b of t.ps.gd.chess(p.id).bonds)assert.equal(t.ps.layers[b],2);assert.deepEqual(f.b._pp(t.ps.playerId).layerGains,{});done(t,f);
  }
});

test('unite gain replays read the normal pending gains plus this field gains as permanent progress',()=>{
  const t=prep(),p=t.put('角峰',10,3);t.ps.layers.kjeragShip=100;t.ps.pendingLayerGains={kjeragShip:10};t.ps.recompute();
  const f=combat(t,{kind:'unite',flags:{growthMode:true,layerGainsEnabled:true}});
  f.b.getPlayer(t.ps.playerId).bonds.kjeragShip.layers=110;
  f.b.addLayers(t.ps.playerId,'kjeragShip',7,'test');let observed;
  f.b.emit('growthGainTrait',{unit:f.unit(p),action:(ps,context)=>{observed=context.permanentLayers('kjeragShip');}});
  assert.equal(observed,117);assert.equal(t.ps.layers.kjeragShip,100,'pending gains are read, not committed early');
  done(t,f);
});

test('real complete matches exercise streamed Jian economy with either requested combat option, without manual LP overrides',{
  skip:process.env.SP_GROWTH_FULLMATCH!=='1',timeout:180000,
},t=>{
  for(const clientCombat of [false,true]) {
    const h=makeMatch({growthMode:true,spellShop:true,heroMod:false,mode:'solo',difficulty:'NORMAL',seed:153,clientCombat,captureFrames:false,botRehearsal:0});
    try {
      assert.equal(h.m.clientCombat,false);assert.equal(h.m.publicView().combatMode,'server');
      h.start();h.toPrep(1);const ps=h.ps('p_0');
      for(const name of ['锏','普罗旺斯','歌蕾蒂娅']) {
        const p=ps.acquireChess(id(name),{silent:true});
        const tile=[...ps.deployMap()].find(([key])=>{const [r,c]=key.split(',').map(Number);return !ps.board.has(key) && ps._legal(p,r,c);});assert.ok(tile,name);
        const [row,col]=tile[0].split(',').map(Number);assert.equal(ps.move(p.uid,{area:'board',row,col}).ok,true);
      }
      let replays=0;
      const construct=h.m.newBattle.bind(h.m);h.m.newBattle=(opts,config)=>{
        const b=construct(opts,config);if(!config?.preview)b.on('growthGainTrait',()=>replays++);return b;
      };
      h.drive(()=>h.m.round>1 || h.ended);assert.ok(replays>=2,'initial Jian actually used the economy host');
      h.autoHumans();if(!h.ended)h.runToEnd({maxSteps:5000000});h.invariants();
      assert.equal(h.endedCount,1);assert.equal(h.m.errorCount,0);assert.deepEqual(h.logs.error,[]);
      assert.ok(!h.logs.warn.some(line=>line.includes('depth limit')));
      t.diagnostic(JSON.stringify({requestedClientCombat:clientCombat,combatMode:'server',round:h.m.round,replays,errors:h.m.errorCount}));
    } finally {h.m.dispose();}
  }
});

test('paced cooperative growth grants nothing ahead of the field clock and shared draws ignore headless slice budgets',()=>{
  const run=headlessSliceMs=>{
    const h=makeMatch({growthMode:true,spellShop:true,heroMod:false,mode:'coop',humans:2,instant:false,clientCombat:true,headlessSliceMs,seed:153});
    try {
      h.start();h.toPrep(1);
      const old=[];
      for(const ps of h.m.order) {
        for(const name of ['锏','普罗旺斯','缄默德克萨斯']) {
          const p=ps.acquireChess(id(name),{silent:true});
          const tile=[...ps.deployMap()].find(([key])=>{const [r,c]=key.split(',').map(Number);return !ps.board.has(key) && ps._legal(p,r,c);});assert.ok(tile);
          const [row,col]=tile[0].split(',').map(Number);assert.equal(ps.move(p.uid,{area:'board',row,col}).ok,true);
        }
        old.push(ps.shop.freeRefreshes);
      }
      h.m.startCombat();assert.equal(h.m.clientCombat,false);
      assert.deepEqual(h.m.order.map(ps=>ps.shop.freeRefreshes),old,'no headless future rewards before the field starts');
      h.sched.advance(200);
      for(let i=0;i<h.m.order.length;i++)assert.ok(h.m.order[i].shop.freeRefreshes>old[i]);
      assert.ok(h.sent.some(([,msg])=>msg.t==='b.snap'),'real authoritative snapshots reach browser watchers');
      assert.deepEqual(h.logs.error,[]);
      return {pool:h.m.pool.snapshot(),rng:h.m.rngMeta.state(),players:h.m.order.map(ps=>({layers:ps.layers,hand:ps.hand,temp:ps.temp,free:ps.shop.freeRefreshes}))};
    } finally {h.m.dispose();}
  };
  assert.deepEqual(run(0.01),run(8));
});
