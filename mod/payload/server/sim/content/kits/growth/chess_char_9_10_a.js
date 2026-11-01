import {hypot} from '../../../detmath.js';
// Ported from Forge-Mods fanpack-kazdel-rhodes. Same operator, not a substitute kit.
// kits/chess_char_9_10_a.js — 维什戴尔（T6 投掷手）。原件 `kits/custom.js` 第 429-589 行逐字搬来。

import { COLS } from '../../../constants.js';
import { sortEnemyTargets } from '../../../targeting.js';

import { num, mods, talentBb, batPct } from './lib/bb.js';
import { on, whileOn } from './lib/unit.js';
import { hasHp } from './lib/engine.js';

// 格键算术用的是引擎的 canvas 尺寸（`../../../constants.js` 的 COLS/ROWS），而 `lib/` 里的辅助文件
// 够不到 `../../../`（见 `lib/constants.js` 文件头），所以在这里注入一次。

/** 魂灵之影 — 维什戴尔's summon (talent 2 / 爆裂黎明)（原件 custom.js:34）。 */
const WISDEL_TOKEN = 'token_10035_wisdel_wward';
/** 魂灵之影 "最多存在3个" (the token record's `deployLimit`) — talent 2 死魂灵的余息 / S3 爆裂黎明 share it（原件 custom.js:36）。 */
const WISDEL_SHADOW_CAP = 3;
/** 死魂灵的余息 "在魂灵之影周围时获得迷彩" [ASSUMED: the 8 neighbours and its own tile, 1.5 tiles]（原件 custom.js:38）。 */
const WISDEL_CAMO_RANGE = 1.5;
/** 维什戴尔 S3 爆裂黎明 "溅射范围大幅扩大": the blackboard carries no radius, but PRTS's 备注 for the skill gives it
 *  outright ("施加锁定、普通攻击、溅射均可对空，攻击溅射半径2.5") — official, not a reading（原件 custom.js:41）。 */
const WISDEL_S3_SPLASH = 2.5;

// 维什戴尔 — T6 投掷手 (bombarder). Trait 攻击对小范围的地面敌人造成两次物理伤害（第二次为余震）: the profession
// layer already reads the trait blackboard (battle field 0.9, splash, `attack@append_atk_scale` 0.5, shockTimes 2), so
// nothing to author — her 余震 instances carry the tag 'aftershock' (professions.js).
//   天赋1 好礼: the main target of an attack takes attack@main_atk_scale × ATK and is marked with a 残影; an 余震
//     that reaches a marked enemy explodes with attack@prob chance, dealing attack@bomb_atk_scale × ATK phys to every
//     enemy within attack@range_radius and stunning them for attack@stun s. PRTS 备注: the 残影 lasts forever, does not
//     stack and disappears with her (a `death` hook clears the marks); every 余震 rolls independently; the explosion is
//     中点判定 and hits air units; the ×main_atk_scale part only applies to normal attacks / 余震 (not to skill hits).
//   天赋2 死魂灵的余息: "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得迷彩" — every deployment summons one
//     魂灵之影 on a free deployable tile of her range (PRTS 备注 "部署时优先在距离自身最近的>地图下方行>地图左侧列可部署位
//     部署"), at most WISDEL_SHADOW_CAP standing ("最多存在3个"). The token is `placeable: false` in the pack's tokens.json,
//     so this summon (and S3's) is the only way it reaches the field — the engine's own fallback is off under a
//     hand-authored kit. It never normal-attacks (trait noAttack) and is 禁疗; its skill (AUTO, 5 SP over time)
//     strikes an enemy of her own range (残影-less ones first, never air units) with 1 × its ATK arts, `sluggish` s
//     停顿, a 残影 and 0-2 SP. She has 迷彩 while she stands beside one of them (PRTS 备注: the 迷彩 does not lift by
//     blocking; the token "仅在登场时尝试给予" it).
//     [ASSUMED] "在魂灵之影周围" = within 1.5 tiles (its own tile and the 8 neighbours); the poll re-grants the 迷彩
//     whenever she is back near any of her shadows.
//   爆裂黎明 (S3, kind 'ammo' 6): ATK +150 %, BAT +2.9 s (an absolute addition, 2.1 → 5.0 s), attacks at
//     attack@atk_scale_3 × ATK with a much wider splash (attack 溅射半径 2.5, PRTS 备注) and 好礼 always procs
//     (attack@prob 1 — read per roll, so it lapses with the skill). "可随时停止" has no automatic counterpart: the
//     ammo kind ends the skill when the last bullet is spent.
export default function kit(bb, chess) {
  const t0 = talentBb(chess, 0);
  const mainScale = num(t0['attack@main_atk_scale'], 1.15);
  const boomProb = num(t0['attack@prob'], 0.15);
  const boomScale = num(t0['attack@bomb_atk_scale'], 1.5);
  const boomStun = num(t0['attack@stun'], 1);
  const boomRadius = num(t0['attack@range_radius'], 1.1);
  const skillProb = num(bb['attack@prob']);   // 1 while the skill runs
  const skillScale = num(bb['attack@atk_scale_3'], 1);
  /** Her 魂灵之影 on the field. */
  const shadowsOf = (battle, host) => battle.allyUnits.filter((t) => on(t) && t.kind === 'token' && t.ownerUnit === host && t.defId === WISDEL_TOKEN);
  /** The free deployable tile of her range a 魂灵之影 takes (nearest to her > lower row > left column), or null. */
  const shadowTile = (battle, host) => {
    let best = null, bd = Infinity;
    for (const k of host.rangeKeys ?? []) {
      const r = Math.floor(k / COLS), c = k % COLS;
      if (!battle.grid.inRect(r, c) || !battle.grid.canStand(r, c, { ranged: true }) || battle.isReservedTile(r, c)) continue;
      const d = hypot(r - host.tileR, c - host.tileC);
      if (d < bd - 1e-9 || (Math.abs(d - bd) <= 1e-9 && (r < best[0] || (r === best[0] && c < best[1])))) { bd = d; best = [r, c]; }
    }
    return best;
  };
  /** The enemy a 魂灵之影 strikes: a targetable ground enemy of her range, 残影-less ones first, then the usual order. */
  const shadowTarget = (battle, host, t) => {
    const pool = battle.enemiesInKeys(host.rangeKeys, t, { canHitFly: false });
    if (!pool.length) return null;
    const fresh = pool.filter((e) => !e.findBuff('wisdel:shadow'));
    const list = fresh.length ? fresh : pool;
    sortEnemyTargets(battle, t, list, null);
    return list[0];
  };
  /** 魂灵之影's kit: 禁疗, no normal attack, its skill cast once it holds a target of her range. */
  const shadowKit = (host) => ({
    skill: {
      kind: 'instant',
      trigger: 'NEVER', // the tick below activates it, so it can only ever strike an enemy of her range
      onStart({ battle, unit: t, bb: sbb }) {
        const e = t.mem.wisdelTarget;
        t.mem.wisdelTarget = null;
        if (e && e.alive) {
          battle.fx('strike', { x: e.x, y: e.y, id: t.id, target: e.id });
          battle.dealDamage(t, e, { amount: t.s.atk * t.s.atkScaleMul, type: 'arts', isSkill: true, tags: ['skill', 'wisdel:shadow'] });
          if (hasHp(e)) {
            const sluggish = num(sbb.sluggish, 1);
            if (sluggish > 0) battle.applyStatus(e, 'sluggish', { duration: sluggish, source: t });
            if (on(host)) battle.addBuff(e, { key: 'wisdel:shadow', duration: Infinity, refresh: 'keep', visible: true, source: host, tags: ['talent'] });
          }
        }
        // token_wisdel_skill_end: "之后获得0-2点技力" (an integer of [sp_min, sp_max))
        const lo = Math.max(0, Math.floor(num(sbb.sp_min))), hi = Math.max(lo + 1, Math.floor(num(sbb.sp_max, lo + 2)));
        const add = lo + battle.rng.int(hi - lo);
        if (add > 0) t.skill.gainSp(add, 'init');
      },
    },
    trait: { noAttack: true },
    install(battle, t) {
      battle.addBuff(t, { key: 'trait:abnormal', flags: { noHeal: true }, persist: true, allowDead: true }); // 持有禁疗
      battle.on('tick', () => {
        const sk = t.skill;
        if (!on(t) || !sk || !sk.ready || sk.active || !t.canAct || t.s.flags.silence || !on(host)) return;
        const e = shadowTarget(battle, host, t);
        if (!e) return;
        t.mem.wisdelTarget = e;
        sk.activate('DEFAULT');
      }, { owner: t });
    },
  });
  /** The 迷彩 a 魂灵之影 gives her the moment it arrives (the poll below keeps it up while she stays near one). */
  const grantCamo = (battle, host, t) => {
    if (!on(host) || hypot(host.x - t.x, host.y - t.y) > WISDEL_CAMO_RANGE) return;
    battle.addBuff(host, { key: 'wisdel:camou', duration: 0.4, refresh: 'extend', flags: { camou: true }, visible: true, tags: ['talent'] });
  };
  /** Summon up to `n` 魂灵之影 (never beyond the cap); the first of a batch starts with `firstSp` SP. */
  const summon = (battle, host, n, firstSp = 0) => {
    for (let i = 0; i < n; i++) {
      if (shadowsOf(battle, host).length >= WISDEL_SHADOW_CAP) return;
      const tile = shadowTile(battle, host);
      if (!tile) return;
      const t = battle.spawnToken(host, WISDEL_TOKEN, tile[0], tile[1], { kit: shadowKit(host) });
      if (!t) return;
      if (i === 0 && firstSp > 0 && t.skill) t.skill.gainSp(firstSp, 'init');
      battle.fx('summon', { x: t.x, y: t.y, id: host.id, token: WISDEL_TOKEN });
      grantCamo(battle, host, t);
    }
  };
  return {
    skill: {
      kind: 'ammo',
      ammo: Math.max(1, Math.floor(num(bb['attack@trigger_time'], 6))),
      mods: mods({ atkPct: num(bb.atk), batPct: batPct(bb.base_attack_time, chess) }),
      attack: { atkScale: skillScale, splashRadius: WISDEL_S3_SPLASH },
      onStart(ctx) {
        ctx.unit.mem.wisdelBoost = true;
        // 爆裂黎明 "召唤 max_cnt 个魂灵之影" (PRTS: 初始技力分别为 3sp（优先召唤）与 0sp)
        summon(ctx.battle, ctx.unit, Math.max(1, Math.floor(num(ctx.bb?.max_cnt, 1))), num(ctx.bb?.sp));
      },
      onEnd(ctx) { ctx.unit.mem.wisdelBoost = false; },
    },
    talents: [
      { install(battle, unit) { // 好礼
        battle.on('beforeAttack', (c) => {
          if (c.attacker !== unit) return;
          unit.mem.wisdelMain = (c.targets || []).find((t) => t && t.alive) ?? null;
        }, { owner: unit, priority: 50 });
        battle.on('hit', (c) => {
          if (c.source !== unit || !c.target || c.target.side !== 'enemy') return;
          if (c.dmg.isAttack && c.target === unit.mem.wisdelMain) { // 主目标 ×1.15 + 附着残影
            c.dmg.amount *= mainScale;
            battle.addBuff(c.target, { key: 'wisdel:shadow', duration: Infinity, refresh: 'keep', visible: true, tags: ['talent'] });
            return;
          }
          if (!c.dmg.tags || c.dmg.tags.indexOf('aftershock') < 0) return; // 残影受到余震影响时
          if (!c.target.findBuff('wisdel:shadow')) return;
          const p = unit.mem.wisdelBoost ? skillProb : boomProb;
          if (!(p > 0) || !battle.rng.chance(p)) return;
          battle.removeBuff(c.target, 'wisdel:shadow');
          for (const e of battle.foesInRadius(c.target.x, c.target.y, boomRadius, true)) {
            if (!e.alive) continue;
            battle.dealDamage(unit, e, { amount: unit.s.atk * boomScale, type: 'phys', isSplash: true, tags: ['talent', 'wisdel'] });
            battle.applyStatus(e, 'stun', { duration: boomStun, source: unit });
          }
          battle.fx('aoe', { x: c.target.x, y: c.target.y, id: unit.id, r: boomRadius, skill: 'wisdel' });
        }, { owner: unit, priority: 20 });
        battle.on('death', (c) => { // 残影 "维什戴尔退场后消失" (PRTS 备注 of 好礼)
          if (c.unit !== unit) return;
          for (const e of battle.enemies) if (e.buffs.length) battle.removeBuff(e, 'wisdel:shadow');
        }, { owner: unit });
      } },
      { install(battle, unit) { // 死魂灵的余息
        battle.on('deploy', (ctx) => { if (ctx.unit === unit) summon(battle, unit, 1); }, { owner: unit }); // "部署后立刻在攻击范围内召唤一个魂灵之影"
        whileOn(battle, unit, 0.25, () => {
          const near = shadowsOf(battle, unit).some((t) => hypot(unit.x - t.x, unit.y - t.y) <= WISDEL_CAMO_RANGE);
          if (near) battle.addBuff(unit, { key: 'wisdel:camou', duration: 0.4, refresh: 'extend', flags: { camou: true }, visible: true, tags: ['talent'] });
          else battle.removeBuff(unit, 'wisdel:camou');
        });
      } },
    ],
  };
}
