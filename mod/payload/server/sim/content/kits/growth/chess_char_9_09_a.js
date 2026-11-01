// Ported from Forge-Mods fanpack-kazdel-rhodes. Same operator, not a substitute kit.
// kits/chess_char_9_09_a.js — 阿斯卡纶（T5 伏击客）。原件 `kits/custom.js` 第 591-733 行逐字搬来。

import { skillRec } from '../shared/tier1.js';

import { num, mods, talentBb, batPct } from './lib/bb.js';
import { on, whileOn } from './lib/unit.js';
import { bodyInKeys } from './lib/engine.js';

// 格键算术用的是引擎的 canvas 尺寸（`../../../constants.js` 的 COLS/ROWS），而 `lib/` 里的辅助文件
// 够不到 `../../../`（见 `lib/constants.js` 文件头），所以在这里注入一次。

// 阿斯卡纶 — T5 伏击客 (stalker). Trait 对攻击范围内所有敌人造成伤害 / 拥有50%的物理和法术闪避且不容易成为攻击目标:
// the profession layer reads the trait blackboard (`allInRange` + `installStalker` from `prob`) — nothing to author.
//   天赋1 死亡拘审 (PRTS 精英2: 移动速度降低18％, 每秒受到10％当前攻击力的法术伤害, 持续25秒, 最多叠加三层):
//     every attack slows the target (`slow`) and puts a stacking DoT on it — every `interval` s it takes
//     `atk_ratio` × 阿斯卡纶's CURRENT ATK arts damage (the tick reads `unit.s.atk`), up to `max_stack_cnt` stacks,
//     lasting `debuff_duration` s. PRTS 备注: "攻击已有本天赋效果的单位时叠加一层效果并重置持续时间；本天赋效果叠加
//     时令已有的减速效果数值增加一倍" ⇒ the slow carries the stack count (18 % → 36 % → 54 %), and "自身退场后，所有已
//     施加的本天赋效果将立刻结束" ⇒ a `death` hook clears the marks.
//   天赋2 噬光残影: ASPD +`attack_speed`, and +`attack_speed_add` more while at least `cnt` of the 4 orthogonal
//     neighbours is a 高台 (high-ground) tile — a 0.5 s poll (grid.isLow is false).
//   恩赐 (S2): ATK +`atk` (the generic spec), "使攻击范围内所有敌人移动速度-`move_speed`" — a 0.25 s aura over every
//     enemy of her current range, **地面与空中都算** (owner confirmed 2026-10-08; PRTS 修正 备注 says the 描述's 地面敌人
//     does not match the game) under a key of her own, so it does not fight 天赋1's own slow (同名效果取最高) — and
//     "在地面敌人被击倒时对周围地面敌人施加一层第一天赋效果": a ground enemy of her range knocked out while the skill
//     runs gives one 死亡拘审 layer to every ground enemy within `range_radius` (PRTS 备注 "尸爆半径1.3", 中点判定).
//   降临 (S3, 45 s in the data): ATK +`atk`, BAT `base_attack_time` (−1.5 s on the elite blackboard), taunt
//     +`taunt_level` (PRTS 备注: "技能期间自身嘲讽等级+2（从-1提升至1）") and the skill's own (expanded) range. "使攻击
//     范围内的地面敌人物理与法术命中率-X%": a ground enemy inside the range carries `ascln:blind`
//     (data.miss = |damage_hitrate_physical|) while the skill runs, and its **physical / arts** damage is cancelled
//     with that chance — the engine has no 命中率 attribute, so this is the practical equivalent of the miss roll
//     [ASSUMED]; true / elemental damage keeps landing. "敌人未命中自身或自身闪避时回复最大生命值": both that miss
//     (when it targets her) and the engine's own `dodge` event heal `hp_ratio` × max HP.
export default function kit(bb, chess, def) {
  const t0 = talentBb(chess, 0), t1 = talentBb(chess, 1);
  const s2 = skillRec(chess, 'skchr_ascln_2')?.bb ?? {}; // 恩赐 (S2)
  const slowBy = Math.min(0.9, Math.abs(num(t0.move_speed)));
  const dotRatio = num(t0.atk_ratio), dotDur = num(t0.debuff_duration, 25);
  const dotMax = Math.max(1, Math.floor(num(t0.max_stack_cnt, 3)));
  const dotIv = Math.max(0.2, num(t0.interval, 1));
  const aspdBase = num(t1.attack_speed), aspdHigh = num(t1.attack_speed_add);
  const highNeed = Math.max(1, Math.floor(num(t1.cnt, 1)));
  const missChance = Math.min(1, Math.max(0, -num(bb['attack@damage_hitrate_physical'])));
  const hpRatio = num(bb['attack@hp_ratio']);
  const mend = (battle, unit) => { if (hpRatio > 0 && on(unit)) battle.heal(unit, unit, unit.s.maxHp * hpRatio, { tags: ['skill', 'ascln'] }); };
  /**
   * One layer of 死亡拘审 on `target`: the stacking 减速 (+18 % a layer) and its 法术持续伤害 tick. Both the attacks of
   * 天赋1 and S2 恩赐's 尸爆 use it.
   */
  const judge = (battle, unit, target) => {
    if (!target || !target.alive || target.side !== 'enemy') return;
    // 叠加时 "令已有的减速效果数值增加一倍" — the slow grows with the stack count instead of multiplying as two
    // independent `slow` statuses would (0.82² = −32.8 % instead of the official −36 %).
    const had = target.findBuff('ascln:judge');
    const stacks = Math.min(dotMax, (had ? Math.max(1, Math.floor(had.stacks || 1)) : 0) + 1);
    if (slowBy > 0) battle.applyStatus(target, 'slow', { value: Math.min(0.9, slowBy * stacks), duration: dotDur, source: unit });
    if (!(dotRatio > 0)) return;
    battle.addBuff(target, {
      key: 'ascln:judge', duration: dotDur, refresh: 'stack', stacks: 1, maxStacks: dotMax, visible: true, tags: ['talent'],
      interval: dotIv,
      onTick({ battle: b, unit: e, buff }) {
        if (!on(unit) || !e.alive) return;
        b.dealDamage(unit, e, { amount: dotRatio * unit.s.atk * Math.max(1, buff.stacks), type: 'arts', tags: ['talent', 'ascln'] });
      },
    });
  };
  return {
    skill: {
      kind: 'duration',
      mods: mods({ atkPct: num(bb.atk), batPct: batPct(bb.base_attack_time, chess), taunt: num(bb.taunt_level) }),
      targeting: { rangeGrid: def?.skill?.rangeGrid ?? null },
      onEnd({ battle }) {
        for (const e of battle.enemies) if (e.buffs.length) battle.removeBuff(e, 'ascln:blind');
      },
    },
    talents: [
      { install(battle, unit) { // 死亡拘审
        battle.on('hit', (c) => {
          if (c.source !== unit || !c.dmg.isAttack) return;
          judge(battle, unit, c.target);
        }, { owner: unit, priority: 10 });
        battle.on('death', (c) => { // "自身退场后，所有已施加的本天赋效果将立刻结束"
          if (c.unit !== unit) return;
          for (const e of battle.enemies) {
            if (!e.buffs.length || !e.findBuff('ascln:judge')) continue;
            battle.removeBuff(e, 'ascln:judge');
            battle.removeBuff(e, 'slow'); // the 减速 belongs to the same talent (another source's slow ends too — approximation)
          }
        }, { owner: unit });
      } },
      { install(battle, unit) { // 噬光残影
        if (aspdBase > 0) battle.addBuff(unit, { key: 'ascln:shadow', mods: { aspd: aspdBase }, persist: true, allowDead: true });
        if (!(aspdHigh > 0)) return;
        whileOn(battle, unit, 0.5, () => {
          let high = 0;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const r = unit.tileR + dr, c = unit.tileC + dc;
            if (battle.grid.inRect(r, c) && !battle.grid.isLow(r, c)) high++;
          }
          if (high >= highNeed) battle.addBuff(unit, { key: 'ascln:shadowHigh', duration: 0.7, refresh: 'extend', mods: { aspd: aspdHigh }, visible: true, tags: ['talent'] });
          else battle.removeBuff(unit, 'ascln:shadowHigh');
        });
      } },
    ],
    install(battle, unit) {
      // 恩赐 (S2): "使攻击范围内所有敌人移动速度-30%" — PRTS 修正 (原因 "描述与游戏实际表现不符合"): every enemy of her
      // range, **地面与空中都算** (owner confirmed 2026-10-08; the data's own 描述 says 地面敌人, which is the text the
      // 修正 supersedes) — and "在地面敌人被击倒时对周围地面敌人施加一层第一天赋效果" (PRTS 备注 "尸爆半径1.3", a 中点
      // 判定 around the enemy, refreshed while the skill runs).
      if (unit.skill && unit.skill.id === 'skchr_ascln_2') {
        const ms = Math.min(0.9, Math.abs(num(s2.move_speed))), radius = num(s2.range_radius, 1.3);
        const aura = () => {
          if (ms <= 0 || !on(unit) || !unit.skill || !unit.skill.active) return;
          for (const e of battle.enemiesInKeys(unit.rangeKeys, unit, { canHitFly: true })) {
            // A key of her own, so 天赋1's own `slow` (同名效果取最高) and this one multiply, and two 阿斯卡纶 do not stack
            battle.applyStrongest(e, 'ascln:s2slow', { duration: 0.4, value: ms, mods: (v) => ({ moveMul: Math.max(0, 1 - v) }), source: unit });
          }
        };
        battle.on('skillStart', (c) => { if (c.unit === unit) aura(); }, { owner: unit });
        whileOn(battle, unit, 0.25, aura);
        battle.on('death', (c) => { // 尸爆: a ground enemy of her range knocked out while the skill runs
          const v = c.unit;
          if (c.reason !== 'killed' || !v || v.side !== 'enemy' || v.isFlying || !on(unit) || !unit.skill || !unit.skill.active) return;
          if (!unit.rangeKeySet || !bodyInKeys(v, unit.rangeKeySet)) return;
          battle.fx('aoe', { x: v.x, y: v.y, r: radius, id: unit.id, skill: 'ascln:endowment' });
          for (const e of battle.foesInRadius(v.x, v.y, radius, true)) {
            if (e === v || e.isFlying) continue; // 地面敌人 only, the dead one itself excluded
            judge(battle, unit, e);
          }
        }, { owner: unit });
      }
      // 降临: 命中率 + 闪避回复
      battle.on('hit', (c) => {
        if (!c.source || c.source.side !== 'enemy' || c.dmg.cancel) return;
        // "物理与法术命中率-X %": true / elemental damage takes no miss roll
        if (c.dmg.type !== 'phys' && c.dmg.type !== 'arts') return;
        if (typeof c.source.findBuff !== 'function') return;
        const blind = c.source.findBuff('ascln:blind');
        if (!blind) return;
        if (!battle.rng.chance(num(blind.data && blind.data.miss, 0))) return;
        c.dmg.cancel = true; // 敌人未命中: the attack happened (cooldown, 技力), nothing landed
        if (c.target === unit) mend(battle, unit);
      }, { owner: unit, priority: -50 });
      battle.on('dodge', (c) => { if (c.target === unit && unit.skill && unit.skill.active) mend(battle, unit); }, { owner: unit });
      if (missChance > 0) whileOn(battle, unit, 0.25, () => {
        if (!unit.skill || !unit.skill.active) return;
        for (const e of battle.enemiesInKeys(unit.rangeKeys, unit, unit.profile)) {
          if (e.isFlying) continue; // 地面敌人
          battle.addBuff(e, { key: 'ascln:blind', duration: 0.6, refresh: 'extend', visible: true, data: { miss: missChance }, tags: ['skill', 'ascln'] });
        }
      });
    },
  };
}
