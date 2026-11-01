import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './harness.js';
import { PHASE, ERR } from '../../shared/constants.js';
import { validateC2S } from '../../shared/protocol.js';
import { RESULT_GRACE_MS } from '../../server/match/fields.js';
import { wireOptions } from '../../server/match/host/proxy.js';

test('pacing protocol permits only the four speeds and forwards the host without enabling test mode', () => {
  for (const speed of [1,2,4,8]) assert.equal(validateC2S({t:'g.combatSpeed',speed}),null);
  for (const speed of [0,-1,3,16,'4',NaN]) assert.notEqual(validateC2S({t:'g.combatSpeed',speed}),null);
  assert.deepEqual(wireOptions({hostId:'p_0'}),{hostId:'p_0'});
});

test('client field speed changes preserve elapsed time, deadlines, pause and reconnect without restarting battle', () => {
  const h=makeMatch({mode:'solo',difficulty:'FUNNY',fake:true,clientCombat:true,clients:false,instant:false}).start();
  try {
    assert.ok(h.drive(() => h.m.phase === PHASE.COMBAT));
    const m=h.m,f=m.fields[0],battleId=f.battleId;
    h.sched.advance(1000);
    const elapsed=m._fieldElapsed(f), remaining=m.deadline-h.sched.now();
    assert.deepEqual(m.handle('p_0',{t:'g.combatSpeed',speed:8}),{ok:true});
    assert.equal(f.battleId,battleId);assert.equal(m._fieldElapsed(f),elapsed);
    assert.equal(m.deadline-h.sched.now(),remaining/4);
    h.sched.advance(500);assert.equal(m._fieldElapsed(f),elapsed+4);
    assert.equal(m.setPause(h.ps('p_0'),true).ok,true);
    h.sched.advance(5000); const paused=m._fieldElapsed(f);
    assert.equal(m.handle('p_0',{t:'g.combatSpeed',speed:1}).ok,true);
    assert.equal(m._fieldElapsed(f),paused);h.sched.advance(1000);assert.equal(m._fieldElapsed(f),paused);
    m.setPause(h.ps('p_0'),false);h.sched.advance(1000);assert.equal(m._fieldElapsed(f),paused+1);
    m.onReconnect('p_0');const msg=h.lastTo('p_0','b.start');assert.equal(msg.speed,1);assert.equal(msg.battleId,battleId);
    assert.equal(msg.elapsed,paused+1);
    const due=f.startAt+f.spec.timeLimit*1000+RESULT_GRACE_MS;
    h.sched.advance(due-h.sched.now()-1);assert.equal(f.mode,'client');
    h.sched.advance(2);assert.equal(f.mode,'server');assert.equal(m.errorCount,0);
  } finally {h.m.dispose();}
});

for (const growthMode of [false,true]) test(`server pacing changes tick rate, not simulated outcomes (growth=${growthMode})`, () => {
  const h=makeMatch({mode:'solo',fake:true,growthMode,instant:false,script:()=>({duration:20,coins:{p_0:3}})}).start();
  try {
    assert.ok(h.drive(()=>h.m.phase===PHASE.COMBAT));
    const f=h.m.fields[0];h.sched.advance(500);const before=f.battle.time;
    assert.equal(h.m.handle('p_0',{t:'g.combatSpeed',speed:8}).ok,true);
    h.sched.advance(500);const delta=f.battle.time-before;assert.ok(Math.abs(delta-4)<0.1,delta);
    assert.equal(h.m.handle('p_0',{t:'g.combatSpeed',speed:1}).ok,true);
    const beforeSlow=f.battle.time;h.sched.advance(500);assert.ok(Math.abs(f.battle.time-beforeSlow-0.5)<0.1);
    assert.ok(h.drive(()=>!f.live));assert.ok(Math.abs(f.battle.result().time-20)<0.05);
    assert.equal(f.battle.result().perPlayer.p_0.coins,3);assert.equal(h.m.errorCount,0);
  } finally {h.m.dispose();}
});

test('multiplayer pacing is host-only, follows host migration, and covers unite and leader clocks', () => {
  const h=makeMatch({humans:2,hostId:'p_0',fake:true,clients:false,clientCombat:true,instant:false}).start();
  try {
    assert.ok(h.drive(()=>h.m.phase===PHASE.COMBAT));
    assert.equal(h.m.handle('p_1',{t:'g.combatSpeed',speed:4}).error,ERR.NOT_HOST);
    assert.equal(h.m.setCombatSpeed({playerId:'p_0',spectator:true},4).error,ERR.NOT_HOST);
    h.m.setHost('p_1');assert.equal(h.m.publicView().combatSpeedHost,'p_1');
    for (const phase of [PHASE.UNITE,PHASE.FINAL_ASSAULT,PHASE.HIDDEN_CORE]) {
      h.m.phase=phase;h.m._bossStartAt=h.sched.now()-2000;h.m.overtimeAt=h.sched.now()+4000;
      const old=h.m.gameSpeed,elapsed=(h.sched.now()-h.m._bossStartAt)*old;
      assert.equal(h.m.handle('p_1',{t:'g.combatSpeed',speed:old===4?2:4}).ok,true);
      assert.equal((h.sched.now()-h.m._bossStartAt)*h.m.gameSpeed,elapsed);
      assert.equal(h.m.publicView().combatSpeed,h.m.gameSpeed);
    }
    h.m.phase=PHASE.PREP;
    assert.equal(h.m.handle('p_1',{t:'g.combatSpeed',speed:1}).error,ERR.WRONG_PHASE);
    assert.equal(h.m.errorCount,0);
  } finally {h.m.dispose();}
});
