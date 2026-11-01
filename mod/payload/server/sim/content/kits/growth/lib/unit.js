// kits/lib/unit.js — 单位在场的判定与「在场期间周期性执行」的轮询。原件的 `on` / `whileOn` / `neighbors` /
// `inRangeOf` / `tokenOf` 逐字在这里，由需要的干员文件用包相对 import 引用。
//
// ⚠️ 与 `bb.js` 同一条实测限制：辅助文件里**不得**写 `@kit/` / `@sim/`（见 bb.js 文件头与
// `_up/mod-compat/out/probe-libimports.mjs`）。原先这里 `import { COLS } from '@sim/constants.js'`，
// 真实装载器报 `KIT_IMPORT_FAILED`，所以 `COLS` 改成从同目录的 `./bb.js` 拿（那里重写了一份，有守卫钉着）。
//
// 归属判断：`on` / `whileOn` 只用 `battle.every` 与单位自身字段（引擎公开的战场读写），`neighbors` / `inRangeOf`
// 是纯几何 —— 都是包自己的代码。`tokenOf` 读 `battle.allyUnits` 的 `kind` / `ownerUnit` / `defId`，同样是公开路径。

import { COLS } from './bb.js';

/**
 * 单位是否「在场」：活着、已部署、没被移走。原件逐字。
 * @param {any} u
 * @returns {boolean}
 */
export const on = (u) => !!u && u.alive && u.deployed && !u.removed;

/**
 * 每 `sec` 秒检查一次，只有 `unit` 还在场时才执行 `fn`。原件逐字。
 * @param {any} battle
 * @param {any} unit
 * @param {number} sec
 * @param {() => void} fn
 */
export const whileOn = (battle, unit, sec, fn) => { battle.every(sec, () => { if (on(unit)) fn(); }, { owner: unit }); };

/**
 * 两格是否相邻（含自身所在格，切比雪夫距离 ≤ 1）。原件逐字。
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
export const neighbors = (a, b) => Math.abs(a.tileR - b.tileR) <= 1 && Math.abs(a.tileC - b.tileC) <= 1;

/**
 * `a` 所在格是否落在 `b` 当前攻击范围里。原件逐字（优先 `rangeKeySet`，否则退回 `rangeKeys` 数组）。
 * @param {any} b
 * @param {any} a
 * @returns {boolean}
 */
export const inRangeOf = (b, a) => {
  if (!b) return false;
  const key = a.tileR * COLS + a.tileC;
  if (b.rangeKeySet) return b.rangeKeySet.has(key);
  return Array.isArray(b.rangeKeys) && b.rangeKeys.includes(key);
};

/**
 * `unit` 场上那个指定 token id 的召唤物（本品模式把天赋召唤做成了手牌）。原件逐字。
 * @param {any} battle
 * @param {any} unit
 * @param {string} tokenId
 * @returns {any|null}
 */
export const tokenOf = (battle, unit, tokenId) => battle.allyUnits.find((t) => on(t) && t.kind === 'token' && t.ownerUnit === unit && t.defId === tokenId) || null;
