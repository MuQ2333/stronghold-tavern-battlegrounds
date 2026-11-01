// Ported from Forge-Mods fanpack-kazdel-rhodes. Same operator, not a substitute kit.
// kits/chess_char_9_02_a.js — 陨星（T2 群射手）。原件 `kits/custom.js` 第 984-1019 行逐字搬来。

import { num, talentBb } from './lib/bb.js';

// 陨星 — T2 群射手 (aoesniper). Trait 攻击造成群体物理伤害: the profession layer sets the 1.1 splash — nothing to author.
//   天赋 爆破附着改装: "普通攻击和技能释放时，15%几率当次攻击的攻击力+60%" — rolled ONCE per attack in `beforeAttack`, so
//     every damage instance of that attack (main + splash) carries it.
//   高爆弹头 (S2, an instant skill — the data has durationType NONE): the attack it rides on (the engine's instant-skill
//     pattern: fired when she is about to attack) hits at atk_scale × ATK, and every victim of it gets
//     defFlat `def` (−170) for `duration` (10 s).
export default function kit(bb, chess) {
  const t0 = talentBb(chess, 0);
  const prob = num(t0.prob), boost = num(t0.atk);
  const shatter = Math.abs(num(bb.def));
  const shatterFor = num(bb.duration, 10);
  return {
    skill: {
      kind: 'instant',
      attack: {
        atkScale: num(bb.atk_scale, 1),
        onEachHit({ battle, target }) {
          if (!(shatter > 0) || !target || target.side !== 'enemy' || !target.alive) return;
          battle.addBuff(target, { key: 'meteo:shatter', duration: shatterFor, refresh: 'replace', mods: { defFlat: -shatter }, visible: true, tags: ['skill', 'meteo'] });
        },
      },
    },
    talents: [
      { install(battle, unit) { // 爆破附着改装
        if (!(prob > 0) || !(boost > 0)) return;
        battle.on('beforeAttack', (c) => {
          if (c.attacker === unit) unit.mem.meteoBoost = battle.rng.chance(prob);
        }, { owner: unit, priority: 50 });
        battle.on('hit', (c) => {
          if (c.source !== unit || !c.dmg.isAttack || !unit.mem.meteoBoost) return;
          c.dmg.amount *= 1 + boost;
        }, { owner: unit, priority: 30 });
      } },
    ],
  };
}
