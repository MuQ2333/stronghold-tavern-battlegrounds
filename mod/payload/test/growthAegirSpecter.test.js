import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './match/harness.js';
import { makeBattle, chessRec, checkInvariants } from './helpers/battleHarness.js';
import { growthData, GROWTH_ROSTER } from '../shared/growthMode.js';
import { DataSource } from '../server/sim/simdata.js';
import { hasDeathTrait, triggerDeathTraits } from '../server/sim/content/garrisons/growthTriggers.js';
import { formatBondEffect } from '../public/js/ui/richText.js';
import { unitStatsEntry } from '../shared/protocol.js';
import { compactResult, resultDigest } from '../server/sim/spec.js';

const id = (name, elite = false) => GROWTH_ROSTER.find(r => r.name === name).id.replace(/_a$/, elite ? '_b' : '_a');
const piece = (name, row, col, elite = false, uid = 1) => ({ chessId: id(name, elite), row, col, uid });
const active = (layers = 0) => ({ active: true, count: 1, tier: 1, layers });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
function fight(units, extra = {}) {
  const h = makeBattle({ data: new DataSource(growthData(DATA, true)), flags: { growthMode: true, layerGainsEnabled: false },
    units, bonds: { egirShip: active(), indomShip: { active: false, count: 0, tier: 0, layers: 0 } }, autoFinish: false, ...extra });
  // Display/gain active Indom layers without installing its independent native random revival in this fixture.
  h.b.players[0].bonds.indomShip=active();
  return h;
}
function done(h) { h.b.forceEnd(); assert.equal(h.b.result().errors, 0); checkInvariants(h.b); }

for (const elite of [false, true]) test(`Specter alter ${elite ? 'elite' : 'normal'} observes real knock-outs and own switches once, without death-trait repetition`, () => {
  const m=elite?2:1;
  const h = fight([piece('归溟幽灵鲨',9,3,elite),piece('小满',11,6,false,2),piece('隐德来希',10,8,true,3)]);
  h.step(); const [u, other] = h.b.allyUnits, p = h.b.players[0];
  assert.equal(hasDeathTrait(u), false);
  const trait = growthData(DATA,true).garrisons[u.def.raw.garrisonIds[0]];
  assert.match(trait.desc, /<战斗中>场上有己方干员被击倒/);
  assert.doesNotMatch(trait.desc, /<被击倒时>/);
  const before = other.deploySeq;
  triggerDeathTraits(h.b,u); triggerDeathTraits(h.b,other);
  assert.equal(p.bonds.egirShip.layers, 0, 'artificial death traits never reach the observer');
  h.b.kill(other); assert.equal(other.alive, false);
  assert.equal(other.deploySeq, before);
  assert.equal(p.bonds.egirShip.layers, 2*m, 'one real knock-out is not tripled by elite Indre');
  h.b.emit('dollSwitch', { unit: u });
  assert.equal(u.trait.doll, true); assert.equal(p.bonds.egirShip.layers, 6*m);
  h.b.removeBuff(u, 'trait:substitute');
  assert.equal(u.trait.doll, false); assert.equal(p.bonds.egirShip.layers, 12*m, 'both real switches count even within one tick');
  assert.equal(unitStatsEntry(u).growthTrait.value, 8*m);
  assert.equal(p.bonds.indomShip.layers, 12*m);
  done(h);
  assert.deepEqual(h.b.result().perPlayer.p1.layerGains, {});
  assert.equal(resultDigest(h.b.result()).hash, resultDigest(compactResult(h.b.result())).hash);
  const next = fight([piece('归溟幽灵鲨',9,3,elite)]);
  assert.equal(next.b.allyUnits[0].growthTraitLive.value, 2*m); done(next);
});

test('Specter alter listens to an actual own knock-out once, while death form cleanup and off-field deaths do not double count', () => {
  const h = fight([piece('归溟幽灵鲨',9,3),piece('小满',11,6,false,2)]);
  h.step(); const [u,other] = h.b.allyUnits,p = h.b.players[0];
  h.b.emit('dollSwitch',{unit:u}); assert.equal(p.bonds.egirShip.layers,2);
  // The substitute really leaves the field, rather than switching back through dollSwap.
  h.b.kill(u); assert.equal(p.bonds.egirShip.layers,6);
  h.step(); assert.equal(p.bonds.egirShip.layers,6,'no polling-based second award for clearing the dead form');
  h.b.kill(other); assert.equal(p.bonds.egirShip.layers,6,'an off-field holder provides no aura');
  done(h);
});

test('Specter alter ignores retreats, enemy deaths and token deaths, and multiple copies grow independently', () => {
  const h = fight([piece('归溟幽灵鲨',9,3),piece('归溟幽灵鲨',11,3,true,2),piece('小满',11,6,false,3)]);
  h.step(); const [a,b,other] = h.b.allyUnits,p=h.b.players[0];
  h.b.retreat(other); assert.equal(p.bonds.egirShip.layers,0);
  const enemy=h.spawn('enemy_1001_1',{pos:[9,7]}); h.b.kill(enemy);
  h.b.emit('death',{unit:{kind:'token',side:'ally',ownerId:a.ownerId},reason:'killed'});
  assert.equal(p.bonds.egirShip.layers,0);
  h.b.redeploy(other,{free:true}); h.b.kill(other);
  assert.equal(p.bonds.egirShip.layers,6,'normal and elite holders contribute +2 and +4 independently');
  h.b.emit('dollSwitch',{unit:a}); assert.equal(p.bonds.egirShip.layers,10,'only the switching holder advances');
  assert.equal(a.growthTraitLive.value,6); assert.equal(b.growthTraitLive.value,8);
  done(h);
});

test('a copied Blue Poison death trait remains replayable on Specter alter without advancing her combat observer', () => {
  const h=fight([piece('归溟幽灵鲨',9,3),piece('蓝毒',11,6,false,2)]);h.step();const [u,source]=h.b.allyUnits,p=h.b.players[0];
  triggerDeathTraits(h.b,source);
  assert.equal(p.bonds.egirShip.layers,4);
  assert.equal(hasDeathTrait(u),true);
  triggerDeathTraits(h.b,u);
  assert.equal(p.bonds.egirShip.layers,8,'the received one-shot copy still works');
  assert.equal(u.growthTraitLive.value,2,'the combat observer itself was not replayed');
  done(h);
});

test('a real knock-out followed immediately by Indom revival still advances the observer exactly once', () => {
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true},
    units:[piece('归溟幽灵鲨',9,3),piece('小满',11,6,false,2)],
    bonds:{egirShip:active(),indomShip:active(999)},autoFinish:false});
  h.step();const [u,other]=h.b.allyUnits,p=h.b.players[0],seq=other.deploySeq;
  h.b.kill(other);
  assert.equal(other.alive,true);assert.equal(other.deploySeq,seq+1);
  assert.equal(p.bonds.egirShip.layers,2);assert.equal(p.bonds.indomShip.layers,1001);
  assert.equal(u.growthTraitLive.value,4);done(h);
});

test('Specter alter in unite observes her own player only, while temporary layers still work with permanent growth disabled', () => {
  const h=makeBattle({data:new DataSource(growthData(DATA,true)),kind:'unite',flags:{growthMode:true,layerGainsEnabled:false},
    players:[{playerId:'p1',units:[piece('归溟幽灵鲨',9,3),piece('小满',11,6,false,2)],bonds:{egirShip:active()}},
      {playerId:'p2',units:[piece('小满',9,15,false,3)]}],autoFinish:false});
  h.step();const [u,own,foreign]=h.b.allyUnits,p=h.b.getPlayer('p1');
  h.b.kill(foreign);assert.equal(p.bonds.egirShip.layers,0);
  h.b.kill(own);assert.equal(p.bonds.egirShip.layers,2);assert.equal(u.growthTraitLive.value,4);
  done(h);assert.deepEqual(h.b.result().perPlayer.p1.layerGains,{});
});

test('growth Aegir increases ATK rather than HP, updates for permanent and temporary layers, and preserves native records', () => {
  const before=JSON.stringify(DATA.bonds.egirShip),changed=growthData(DATA,true);
  const rec=chessRec({id:'test_aegir_a',bonds:['egirShip'],skill:null,stats:{atk:1000,maxHp:10000,def:0}});
  for(const growth of [false,true]) {
    const data=new DataSource({...growth?changed:DATA,chess:{...(growth?changed:DATA).chess,[rec.chessId]:rec}});
    const h=makeBattle({data,flags:{growthMode:growth},units:[{chessId:rec.chessId,row:9,col:4}],bonds:{egirShip:active(10)},autoFinish:false});h.step();
    const u=h.b.allyUnits[0];close(u.s.atk,growth?1450:1000);close(u.s.maxHp,growth?10000:14500);
    h.b.addLayers('p1','egirShip',5,'test');h.step();
    close(u.s.atk,growth?1500:1000);close(u.s.maxHp,growth?10000:15000);
    h.b.addLayers('p1','egirShip',7,'test',{temporary:true});h.step();
    close(u.s.atk,growth?1570:1000);close(u.s.maxHp,growth?10000:15700);
    done(h);assert.equal(h.b.result().perPlayer.p1.layerGains.egirShip,5);
  }
  assert.match(changed.bonds.egirShip.desc,/攻击力提升（受层数影响）/);
  assert.doesNotMatch(changed.bonds.egirShip.desc,/干员生命值/);
  assert.match(formatBondEffect(changed.bonds.egirShip,10),/攻击力<@ba.vup>\+45%<\/>/);
  assert.equal(changed.bonds.egirShip.bb.base_max_hp,undefined);
  assert.equal(JSON.stringify(DATA.bonds.egirShip),before);
});
