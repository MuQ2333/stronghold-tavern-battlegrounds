// kits/lib/bb.js — 黑板与数值读取。原件写在 `kits/custom.js` 顶部的那几个纯函数，逐字搬到这里，
// 由**所有**需要它们的干员文件用包相对 import 引用（DESIGN §28.18）——绝不复制进每个文件。
//
// ⚠️ **本文件（以及 `kits/lib/` 下的每一个文件）不得出现 `@kit/` / `@sim/` import。**
// 这是实测的引擎限制，不是风格选择：`server/workshop.js loadWorkshopKits()` 的 `rewriteKitImports()` 只作用在
// **被加载的那个 kit 文件自己的源码**上；`./lib/x.js` 交给 Node 的是一个真实 `file:` URL，于是辅助文件被**原样**
// 加载，它里面的 `@sim/...` 没有 import map 可解 ⇒ `KIT_IMPORT_FAILED`，那个干员整件装不上。
// 实测见 `_up/mod-compat/out/probe-libimports.mjs`（例 2 / 例 3 失败，例 1 / 例 4 通过）。
//
// 归属判断：这些是「读一条 chess 记录里的黑板 / 归一化一个数」，与引擎状态无关，所以是包自己的代码，
// 本来也不需要白名单（白名单开的是**引擎**的模块，见 docs/WORKSHOP.md §4.5.1）。

/**
 * 把一个黑板值归一化成有限数。原件逐字：number 且有限 ⇒ 自己；非空字符串且可转 ⇒ 转出来的数；否则取默认值。
 * @param {unknown} v
 * @param {number} [d]
 * @returns {number}
 */
export const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(+v) ? +v : d));

/**
 * 丢弃 0 与不可用的项（一个 0 的加成是 buff 列表里的噪声，原件注释逐字）。
 * @param {Record<string, unknown>} m
 * @returns {Record<string, number>}
 */
export const mods = (m) => { const o = {}; for (const k of Object.keys(m)) { const v = m[k]; if (typeof v === 'number' && Number.isFinite(v) && v !== 0) o[k] = v; } return o; };

/**
 * 第 `i` 条天赋的黑板（缺失即空对象）。
 * @param {any} chess
 * @param {number} i
 */
export const talentBb = (chess, i) => ((chess?.talents || []).find((t) => t && t.index === i)?.bb) ?? {};

/**
 * 一个「攻击间隔变化（秒）」换算成相对该干员基础攻击间隔的倍率，下限 −0.9。
 * @param {unknown} sec
 * @param {any} chess
 * @returns {number}
 */
export const batPct = (sec, chess) => { const b = num(chess?.stats?.bat, 1) || 1; const v = num(sec) / b; return v ? Math.max(-0.9, v) : 0; };

export { COLS } from '../../../../constants.js';

/**
 * 两格之间的欧氏距离（原件用 `Math.hypot`）。放在这里同样是为了让辅助文件不碰 `@sim/`。
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export const dist2 = (a, b) => Math.sqrt(a * a + b * b);
