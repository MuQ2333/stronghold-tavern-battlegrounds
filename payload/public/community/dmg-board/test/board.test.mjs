// dmg-board/test/board.test.mjs — 结算页伤害看板的纯逻辑与宿主交互验收。
//
// 怎么跑：在**管理器树**里 `node --test dmg-board/test/board.test.mjs`。
// 包本身不 import 引擎的任何东西（面板只有包内模块）；test 是作者侧的，这里也不需要引擎：
//   * 纯函数（`boardFrom` / `fmt` / `visibleOn`）直接测；
//   * `mount` 用本文件里的迷你 DOM + 假的 `ctx.net`（形状照 `public/js/ui/extensions.js` 的注入面：只有
//     `host` / `key` / `net.on` / `log`）—— 本机没有 Chrome，这条覆盖的是「订阅 → 判可见 → 画 / 撤」的次序。
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COLUMNS, fmt, boardFrom, visibleOn, mount } from '../client/board.js';

// ---- 迷你 DOM：只实现 mount 用到的那几个成员（不用 jsdom） ----
function makeEl(tag) {
  const el = {
    tagName: tag, children: [], attrs: {}, style: '',
    className: '',
    classList: {
      add(c) { el.className = `${el.className} ${c}`.trim(); },
      contains(c) { return el.className.split(/\s+/).includes(c); },
    },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null; },
    appendChild(child) { el.children.push(child); child.parentElement = el; return child; },
    remove() {
      if (el.parentElement) el.parentElement.children = el.parentElement.children.filter((c) => c !== el);
      el.parentElement = null;
    },
    querySelectorAll() { return []; },
  };
  Object.defineProperty(el, 'textContent', {
    get: () => el._text || '',
    set: (v) => { el._text = String(v); if (v === '') el.children = []; },
  });
  return el;
}

/** 宿主 document 的最小面：createElement + querySelector（`.st` / `.screen.result` 两个选择器）+ body。 */
function makeDoc({ result = false, stats = false } = {}) {
  const doc = {
    body: makeEl('body'),
    _result: result,
    _stats: stats,
    createElement: makeEl,
    querySelector(sel) {
      if (sel === '.st') return doc._stats ? makeEl('div') : null;
      if (sel === '.screen.result') return doc._result ? makeEl('div') : null;
      return null;
    },
  };
  doc.body.ownerDocument = doc;
  return doc;
}

/** 一次 `m.result`（形状照 `server/match/results.js` 的 rows：stats 的键与服务端组装的那份一致）。 */
const RESULT = {
  t: 'm.result',
  victory: true,
  roundsPassed: 14,
  difficulty: 'NORMAL',
  players: [
    {
      playerId: 'p1', seat: 1, name: '甲', isBot: false,
      stats: {
        dmgDealt: 52310, kills: 88, leaks: 2, gold: 1200, refreshes: 31, merges: 12,
        itemsEquipped: 9, bossDamage: 17800, activatedLayers: 7, lpLost: 3, perfectRounds: 5,
      },
    },
    {
      playerId: 'p2', seat: 0, name: '乙（AI）', isBot: true,
      stats: {
        dmgDealt: 18400, kills: 40, leaks: 0, gold: 900, refreshes: 12, merges: 6,
        itemsEquipped: 4, bossDamage: 3200, activatedLayers: 3, lpLost: 0, perfectRounds: 9,
      },
    },
  ],
};

test('boardFrom：按造成伤害降序、列只保留真的存在的键、top 是最大值', () => {
  const b = boardFrom(RESULT);
  assert.deepEqual(b.rows.map((r) => r.name), ['甲', '乙（AI）']);
  assert.equal(b.top, 52310);
  assert.equal(b.victory, true);
  assert.equal(b.roundsPassed, 14);
  assert.equal(b.difficulty, 'NORMAL');
  assert.deepEqual(b.columns.map(([k]) => k), COLUMNS.map(([k]) => k));
  assert.equal(b.rows[0].seat, 1);
  assert.equal(b.rows[1].isBot, true);
});

test('boardFrom：缺键就不画那一列（老版本 / 部分字段的消息）', () => {
  const partial = {
    ...RESULT,
    players: [
      { playerId: 'p1', name: '甲', stats: { dmgDealt: 100, kills: 3 } },
      { playerId: 'p2', name: '乙', stats: { dmgDealt: 50, merges: 1 } },
    ],
  };
  const b = boardFrom(partial);
  assert.deepEqual(b.columns.map(([k]) => k), ['dmgDealt', 'kills', 'merges']);
});

test('boardFrom：形状不对返回 null（不画空表）', () => {
  for (const bad of [null, undefined, 5, 'x', {}, { players: [] }, { players: [null, 3] }, { players: [{ playerId: 'p1' }] }]) {
    assert.equal(boardFrom(bad), null, `bad: ${JSON.stringify(bad)}`);
  }
  // stats 里有缺值（null / 非数字）时：那一列按「无值」处理，不当 0 画
  const b = boardFrom({ players: [{ playerId: 'p1', name: '甲', stats: { dmgDealt: 10, lpLost: null, kills: 'x' } }] });
  assert.deepEqual(b.columns.map(([k]) => k), ['dmgDealt']);
});

test('fmt：万位短写、去尾零、缺值给 —', () => {
  assert.equal(fmt(0), '0');
  assert.equal(fmt(9999), '9999');
  assert.equal(fmt(10000), '1万');
  assert.equal(fmt(12345), '1.2万');
  assert.equal(fmt(98400), '9.8万');
  assert.equal(fmt(-10000), '-1万');
  assert.equal(fmt(null), '—');
  assert.equal(fmt(undefined), '—');
  assert.equal(fmt(NaN), '—');
});

test('visibleOn：只在活的结算屏上为真；统计页浮层开着时一律为假', () => {
  assert.equal(visibleOn(makeDoc({ result: true })), true);
  assert.equal(visibleOn(makeDoc({ result: false })), false);
  assert.equal(visibleOn(makeDoc({ result: true, stats: true })), false, '统计页的重看不是本局的数');
  assert.equal(visibleOn(makeDoc({ stats: true })), false);
  assert.equal(visibleOn(null), false);
  assert.equal(visibleOn({}), false);
});

// ---- mount：订阅 → 判可见 → 画 / 撤 ----

/** 一次挂载的舞台：假 document、假 net（记下订阅与退订）、可手动驱动的「页面变了」回调。 */
function stage({ result = false, stats = false } = {}) {
  const doc = makeDoc({ result, stats });
  const host = makeEl('div');
  host.ownerDocument = doc;
  const subs = [];
  const ctx = {
    pack: 'dmg-board', id: 'board', slot: 'screen.result.footer', hostKey: null, host,
    net: { on: (type, fn) => { subs.push({ type, fn, off: false }); return () => { subs[subs.indexOf(subs.find((s) => s.fn === fn))].off = true; }; } },
    log: { info() {}, warn() {}, error() {} },
  };
  // 观察器与 rAF 都换成可手动驱动的版本（本机没有浏览器）：模块读的是 globalThis 上的名字。
  const saved = { mo: globalThis.MutationObserver, raf: globalThis.requestAnimationFrame };
  let observer = null;
  let raf = null;
  globalThis.MutationObserver = class { constructor(cb) { observer = { cb, stopped: false }; } observe() {} disconnect() { if (observer) observer.stopped = true; } };
  globalThis.requestAnimationFrame = (fn) => { raf = fn; };
  const api = mount(ctx);
  const flush = () => { const f = raf; raf = null; if (f) f(); };
  const pageChanged = () => { if (observer) observer.cb([]); }; // 「结算屏渲染出来了」= 一次 DOM 变化
  const deliver = (msg) => { for (const s of subs) if (s.type === 'm.result') s.fn(msg); };
  const restore = () => {
    globalThis.MutationObserver = saved.mo;
    globalThis.requestAnimationFrame = saved.raf;
  };
  return { doc, host, ctx, api, flush, pageChanged, deliver, restore, subs, get observer() { return observer; } };
}

/** 箱里那张表的行（`section > table > tbody > tr`）。 */
function tableRows(host) {
  const box = host.children[0];
  const table = box.children.find((c) => c.tagName === 'table');
  if (!table) return null;
  const tbody = table.children.find((c) => c.tagName === 'tbody');
  return tbody.children;
}

test('mount：订的是引擎的 m.result 类型；没有数据 / 不在结算屏都不画', () => {
  const s = stage({ result: false });
  assert.deepEqual(s.subs.map((x) => x.type), ['m.result']);
  const box = s.host.children[0];
  assert.equal(box.className, 'dmg-board');
  assert.equal(box.children.length, 0, '挂载时：没有数据 → 整块空着');

  s.deliver(RESULT); // 有数据了，但玩家已经回了大厅（页面上没有结算屏）
  s.flush();
  assert.equal(box.children.length, 0, '没有活的结算屏就不画');
  s.restore();
});

test('mount：结算屏出现时画表（按伤害排序、首行标 is-top、伤害列带比例条）', () => {
  const s = stage({ result: false });
  const box = s.host.children[0];
  s.deliver(RESULT);
  s.flush();
  assert.equal(box.children.length, 0);

  s.doc._result = true; // 结算屏渲染出来了
  s.pageChanged();
  s.flush();

  const rows = tableRows(s.host);
  assert.equal(rows.length, 2);
  assert.ok(rows[0].className.includes('is-top'));
  const nameCell = rows[0].children[1];
  assert.equal(nameCell.children[0]._text, '甲'); // 排序：伤害高的在前
  assert.equal(rows[1].children[1].children[0]._text, '乙（AI）');
  assert.equal(rows[1].children[1].children[1]._text, 'AI'); // isBot 标记
  // 表头 = # + 玩家 + 11 列（本样例 stats 键齐全）
  assert.equal(rows[0].children.length, 2 + COLUMNS.length);
  // 伤害列：数字 + 比例条（宽度按 top 归一）
  const dmgCell = rows[0].children[2];
  assert.ok(dmgCell.className.includes('dmg-board__dmg'));
  assert.equal(dmgCell._text, '5.2万');
  const bar = dmgCell.children.find((c) => c.className === 'dmg-board__bar');
  assert.equal(bar.attrs.style, '--w:100%');
  const bar2 = rows[1].children[2].children.find((c) => c.className === 'dmg-board__bar');
  assert.equal(bar2.attrs.style, '--w:35%'); // 18400 / 52310
  // 漏怪 / 损失生命 > 0 的行标红
  const leaksIdx = 2 + COLUMNS.findIndex(([k]) => k === 'leaks');
  assert.ok(rows[0].children[leaksIdx].className.includes('dmg-board__bad'));
  assert.ok(!rows[1].children[leaksIdx].className.includes('dmg-board__bad'));
  s.restore();
});

test('mount：重复触发（同一份数据）不重画；结算屏撤掉就清空；统计页开着不画', () => {
  const s = stage({ result: false });
  const box = s.host.children[0];
  s.deliver(RESULT);
  s.doc._result = true;
  s.pageChanged();
  s.flush();
  const firstTable = tableRows(s.host);
  s.pageChanged(); s.pageChanged(); s.flush(); s.flush();
  assert.equal(tableRows(s.host), firstTable, '状态没变：一个 DOM 写都不做（引用都不换）');

  s.doc._stats = true; // 统计页浮层开着（它里面的重看也是 .screen.result）
  s.pageChanged();
  s.flush();
  assert.equal(box.children.length, 0, '统计页压上来就不画');
  s.doc._stats = false;
  s.pageChanged();
  s.flush();
  assert.equal(tableRows(s.host).length, 2, '统计页关掉、结算屏还在 → 画回来');

  s.doc._result = false; // 玩家点了返回
  s.pageChanged();
  s.flush();
  assert.equal(box.children.length, 0);
  s.restore();
});

test('mount：unmount 退订 + 停观察 + 摘掉自己', () => {
  const s = stage({ result: true });
  s.deliver(RESULT);
  s.flush();
  const box = s.host.children[0];
  assert.ok(box.children.length > 0);
  s.api.unmount();
  assert.equal(box.parentElement, null, '箱子从宿主里摘掉');
  assert.equal(s.subs[0].off, true, '订阅被退掉');
  assert.equal(s.observer.stopped, true, '观察器停了');
  s.restore();
});
