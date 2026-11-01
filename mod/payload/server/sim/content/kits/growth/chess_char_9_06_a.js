// Ported from Forge-Mods fanpack-kazdel-rhodes. Same operator, not a substitute kit.
// kits/chess_char_9_06_a.js — 赫德雷（T4 重剑手）。原件 `kits/custom.js` 第 1021-1128 行逐字搬来。

import { skillBbOf } from '../shared/tier1.js';
import { frontOf } from '../../../dir.js';

import { num, mods, talentBb } from './lib/bb.js';
import { whileOn } from './lib/unit.js';
import { periodicDamage } from './lib/engine.js';

// 格键算术用的是引擎的 canvas 尺寸（`../../../constants.js` 的 COLS/ROWS），而 `lib/` 里的辅助文件
// 够不到 `../../../`（见 `lib/constants.js` 文件头），所以在这里注入一次。

// 赫德雷 — T4 重剑手 (crusher). Trait 同时攻击阻挡的所有敌人: the profession layer sets `hitAllBlocked` — nothing to author.
//   天赋1 及锋而试: "攻击敌人时攻击力提升至110%，若目标处于晕眩、束缚则改为提升至140%" — PRTS 备注 "本天赋于每次攻击的附加
//     效果后、计算伤害前判断并生效": the branch is read per damage instance in a late `hit` hook, so a target the skill's own
//     晕眩 (applied in `beforeAttack` below) already holds takes the 140 % branch.
//   天赋2 余火之氅: herself and the ally on the tile BEHIND her get 18 % 庇护 (`damage_resistance` ⇒ dmgTakenMul 0.82),
//     refreshed by a 0.25 s aura. [ASSUMED: "身后一格" = the tile opposite her facing, computed as the mirror of `frontOf`.]
//   死境硝烟 (S3, 70 s): 攻击距离+1 (`rangeExtend`), 生命上限+30 %, 攻击力+60 %; she loses `attack@value` (100) HP per
//     second (a 流失, it can knock her out); every enemy she attacked and every enemy that attacked her takes
//     `attack@damage` (200) true damage per second — PRTS 备注 "伤害分类为无来源真实持续伤害…持续至技能结束，不可叠加",
//     so each tick is a sourceless periodic instance (`periodicDamage`) and the marks go with the skill. Every attack
//     heals her `attack@hp_ratio` (5 %) of her max HP and has `attack@buff_prob` (25 %) chance to stun its targets for
//     `attack@stun` s — both applied in `beforeAttack`, before the damage.
export default function kit(bb, chess) {
  const t0 = talentBb(chess, 0), t1 = talentBb(chess, 1);
  const stunScale = num(t0.atk_scale, 1.4), plainScale = num(t0.atk_scale_2, 1.1);
  const dr = num(t1.damage_resistance);
  const drain = num(bb['attack@value']), tickDmg = num(bb['attack@damage']);
  const healRatio = num(bb['attack@hp_ratio']), stunProb = num(bb['attack@buff_prob']), stunFor = num(bb['attack@stun']);
  // S2 (skchr_hodrer_2) is authored in `skills` as well: its own blackboard, plus the chess's real 攻击间隔
  const s2 = skillBbOf(chess, 'skchr_hodrer_2');
  const stun2 = num(s2['attack@stun']);
  const bat = num(chess.stats?.bat, 1);
  return {
    skill: {
      kind: 'duration',
      mods: mods({ atkPct: num(bb.atk), hpPct: num(bb.max_hp) }),
      targeting: mods({ rangeExtend: Math.round(num(bb.ability_range_forward_extend)) }),
      onTick({ battle, unit, dt }) {
        if (drain > 0) { // 每秒流失100点生命 — a silent 流失: one `dmg` event per point would draw 100 white numbers,
          // glow particles and hit flashes a second over her (the 重构体's drain, same idiom, owner report 2026-10-08)
          unit.mem.hodrerDrain = num(unit.mem.hodrerDrain) + drain * num(dt);
          // loop-cap: the finite drain accumulated this tick, consumed one point at a time; death stops it early.
          while (unit.mem.hodrerDrain >= 1 && unit.alive) { unit.mem.hodrerDrain -= 1; battle.loseHp(unit, 1, { source: unit, silent: true }); }
        }
        if (!(tickDmg > 0)) return;
        unit.mem.hodrerTick = num(unit.mem.hodrerTick) + num(dt);
        if (unit.mem.hodrerTick < 1) return;
        unit.mem.hodrerTick = 0;
        for (const e of battle.enemies) {
          if (!e.alive || e.s.flags.invulnerable || !e.findBuff('hodrer:smoke')) continue;
          battle.dealDamage(unit, e, periodicDamage(tickDmg)); // 无来源真实持续伤害
        }
      },
      onEnd({ battle }) {
        for (const e of battle.enemies) if (e.buffs.length) battle.removeBuff(e, 'hodrer:smoke');
      },
    },
    skills: {
      // S2 死境硝烟以外的那一个 (skchr_hodrer_2): 官方文案「被动效果：攻击力+16%／主动触发可以在下列状态和初始状态间切换：
      // 攻击间隔略微增大，阻挡数+1，攻击使目标晕眩1秒」。用户 2026-10-06 要求这类「可切换」技能开启后**不再关闭**，所以
      // 它是 toggle —— 开启即保持到被击倒，不再回到初始状态。被动的那份攻击力并入技能的 mods（[ASSUMED] 这个 kit 没有
      // 独立的被动槽）；数值必须取 S2 自己的黑板（bb 是「当前选中的技能」的黑板，选 S3 时它是 S3 的）。值必须是
      // SkillSpec 对象：写成工厂函数会让 SkillRuntime 拿到一个函数，kind 回落到记录里的 instant —— 技力一满就再切一次。
      skchr_hodrer_2: {
        kind: 'toggle',
        mods: mods({
          atkPct: num(s2.atk),
          blockCnt: num(s2.block_cnt),
          // "攻击间隔略微增大" = base_attack_time 的绝对值加算，换算成相对倍率
          batPct: bat > 0 ? num(s2.base_attack_time) / bat : 0,
        }),
        attack: {
          onEachHit({ battle, unit, target }) {
            if (!(stun2 > 0) || !target || !target.alive || target.side !== 'enemy') return;
            battle.applyStatus(target, 'stun', { duration: stun2, source: unit });
          },
        },
      },
    },
    talents: [
      { install(battle, unit) { // 及锋而试
        battle.on('hit', (c) => {
          if (c.source !== unit || !c.dmg.isAttack) return;
          const f = c.target && c.target.s ? c.target.s.flags : null;
          c.dmg.amount *= f && (f.stun || f.bind) ? stunScale : plainScale; // 附加效果后、计算伤害前
        }, { owner: unit, priority: -10 });
      } },
      { install(battle, unit) { // 余火之氅
        if (!(dr > 0)) return;
        const cloak = { key: 'hodrer:cloak', duration: 0.4, refresh: 'extend', mods: { dmgTakenMul: 1 - dr }, visible: true, tags: ['talent'] };
        whileOn(battle, unit, 0.25, () => {
          battle.addBuff(unit, { ...cloak });
          const [fr, fc] = frontOf(unit.tileR, unit.tileC, unit.dir);
          const behind = battle.allyUnits.find((a) => a !== unit && a.alive && a.deployed && a.tileR === unit.tileR * 2 - fr && a.tileC === unit.tileC * 2 - fc);
          if (behind) battle.addBuff(behind, { ...cloak });
        });
      } },
    ],
    install(battle, unit) { // 死境硝烟: the marks + the per-attack heal / stun
      const mark = (e) => { if (e && e.alive && e.buffs) battle.addBuff(e, { key: 'hodrer:smoke', duration: Infinity, refresh: 'keep', visible: true, tags: ['skill', 'hodrer'] }); };
      battle.on('beforeAttack', (c) => { // the attack's own effects, before the damage (PRTS: 附加效果后、计算伤害前)
        if (!unit.skill || !unit.skill.active || c.attacker !== unit) return;
        if (healRatio > 0) battle.heal(unit, unit, unit.s.maxHp * healRatio, { tags: ['skill', 'hodrer'] });
        for (const t of c.targets || []) {
          if (!t || !t.alive || t.side !== 'enemy') continue;
          if (stunProb > 0 && battle.rng.chance(stunProb)) battle.applyStatus(t, 'stun', { duration: stunFor, source: unit });
        }
      }, { owner: unit, priority: 60 });
      battle.on('hit', (c) => { // 自身攻击过的敌人
        if (!unit.skill || !unit.skill.active || c.source !== unit || !c.dmg.isAttack) return;
        if (c.target && c.target.side === 'enemy') mark(c.target);
      }, { owner: unit, priority: 40 });
      battle.on('damaged', (c) => { // 攻击过自身的敌人
        if (!unit.skill || !unit.skill.active || c.target !== unit) return;
        if (c.source && c.source.side === 'enemy') mark(c.source);
      }, { owner: unit, priority: 40 });
    },
  };
}
