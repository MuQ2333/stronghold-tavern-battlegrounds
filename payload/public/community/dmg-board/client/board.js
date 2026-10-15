// dmg-board/client/board.js — 结算页伤害看板（`screen.result.footer` 面板，纯只读）。
//
// 数据来源只有一处：**引擎自己的对局结算** `m.result`（`shared/protocol.js` S2C 表里那一条），它的 `players[]`
// 每人带 `stats { dmgDealt, kills, leaks, bossDamage, lpLost, gold, merges, itemsEquipped, activatedLayers,
// refreshes, perfectRounds }`（`server/match/results.js` 组装、伤害已经由服务端取整）。所以这一块**不重算、
// 不猜测、不碰对局**：引擎说什么就画什么。面板的注入面（DESIGN §28.8）没有 store / match，但 `ctx.net.on('<S2C
// 类型>')` 是给面板的合法订阅读口 —— 这里只用 `m.result` 一个类型。
//
// 为什么需要「什么时候显示」这一条：`screen.result.footer` 是**固定浮层**（WORKSHOP §1.9.3：挂一次就一直在，
// 与当前在哪个界面无关）。所以面板自己得知道什么时候该画 —— 判据是**页面上现在有没有一个活的结算界面**
// （`.screen.result`，引擎 `screens/result.js` 的根类）。这是读页面本身的 DOM，不是新造一层状态：面板本来就活在
// 这个页面里，而「挂一次就一直在、却永远画着上一局的表」才是那个要避免的东西。
// 统计页（`screens/stats.js` 的 `.st` 浮层）里也能翻出 `ResultView`（对局记录的重看）—— 那**不是**本局的结算，
// 而且面板拿不到那条记录，所以 `.st` 开着时一律不画：宁可什么都不显示，也不显示上一局的数。

/** 展示的列（顺序即渲染顺序）：[键, 表头] —— 只在结算数据里真的存在这个键时才画这一列。 */
export const COLUMNS = Object.freeze([
  ['dmgDealt', '造成伤害'],
  ['bossDamage', '领袖伤害'],
  ['kills', '击倒敌人'],
  ['leaks', '未击倒'],
  ['lpLost', '损失生命'],
  ['merges', '晋升次数'],
  ['itemsEquipped', '配发装备'],
  ['activatedLayers', '盟约层数'],
  ['refreshes', '刷新次数'],
  ['perfectRounds', '完美作战'],
  ['gold', '消耗资金'],
]);

/** 一个统计值：存在且是有限数字才回数字，否则 `null`（缺值不当 0 画 —— `Number(null)` 就是 0，不能直接用）。 */
const numOf = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

/** 数字的短写法（结算页是给人扫一眼的表，不是账本）：12,345 → 1.2万；保留一位小数、去尾零。 */
export function fmt(n) {
  const v = numOf(n);
  if (v === null) return '—';
  if (Math.abs(v) < 10000) return String(Math.round(v));
  const w = v / 10000;
  return `${(Math.round(w * 10) / 10).toString().replace(/\.0$/, '')}万`;
}

/**
 * 从 `m.result` 里抽出这张表要的东西。
 * 形状不对（老版本 / 坏消息 / 没到过结算帧）时返回 `null` —— 调用方据此整块不渲染
 * （一个空表格会让玩家以为引擎没算伤害）。
 */
export function boardFrom(result) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.players) || !result.players.length) return null;
  const rows = [];
  for (const p of result.players) {
    if (!p || typeof p !== 'object') continue;
    const stats = p.stats && typeof p.stats === 'object' ? p.stats : null;
    if (!stats) continue;
    rows.push({
      playerId: typeof p.playerId === 'string' ? p.playerId : '',
      name: typeof p.name === 'string' && p.name ? p.name : (typeof p.playerId === 'string' ? p.playerId : '?'),
      seat: Number.isInteger(p.seat) ? p.seat : null,
      isBot: p.isBot === true,
      stats,
    });
  }
  if (!rows.length) return null;
  // 名次：按造成伤害降序（「看板」的常用读法；数还是引擎那些数，排序只是呈现）
  rows.sort((a, b) => (numOf(b.stats.dmgDealt) ?? 0) - (numOf(a.stats.dmgDealt) ?? 0));
  const columns = COLUMNS.filter(([key]) => rows.some((r) => numOf(r.stats[key]) !== null));
  const top = Math.max(0, ...rows.map((r) => numOf(r.stats.dmgDealt) ?? 0));
  return {
    rows, columns, top,
    victory: result.victory === true,
    roundsPassed: Number.isInteger(result.roundsPassed) ? result.roundsPassed : null,
    difficulty: typeof result.difficulty === 'string' ? result.difficulty : '',
  };
}

/**
 * 「现在页面上有一个活的结算界面吗」。两个判据缺一不可：
 *   * `.screen.result` —— 引擎的结算屏（`screens/game.js` 在 `match.result` 到位时渲染 `screens/result.js`）；
 *   * 没有 `.st` —— 统计页浮层开着时，它内部的重看也是 `.screen.result`（`screens/stats.js` 的 `<ResultView>`），
 *     那不是本局的数。统计页压在结算屏上面时（它可以从中途打开）同样不画。
 * `doc` 允许注入（测试用迷你 DOM），真实浏览器里就是宿主自己的 document。
 */
export function visibleOn(doc) {
  if (!doc || typeof doc.querySelector !== 'function') return false;
  try {
    if (doc.querySelector('.st')) return false;
    return !!doc.querySelector('.screen.result');
  } catch { return false; }
}

export function mount(ctx) {
  const host = ctx.host;
  const doc = host && host.ownerDocument ? host.ownerDocument : (typeof document !== 'undefined' ? document : null);

  const box = doc.createElement('section');
  box.className = 'dmg-board';
  box.setAttribute('aria-label', '伤害看板');
  host.appendChild(box);

  /** 最后一次收到的结算（面板自持：结算屏重进 / 切回来时立刻还能画出来）。 */
  let last = null;
  /** 现在箱子里画着的，是不是 `last` 那一份。 */
  let drew = false;
  let drawnFor = null;

  const el = (tag, cls, text) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function build(board) {
    const head = el('div', 'dmg-board__head');
    head.appendChild(el('b', null, '伤害看板'));
    const meta = [board.difficulty, board.roundsPassed !== null ? `${board.roundsPassed} 回合` : '', board.victory ? '胜利' : '']
      .filter(Boolean).join(' · ');
    if (meta) head.appendChild(el('small', null, meta));
    box.appendChild(head);

    const table = el('table');
    const thead = el('thead');
    const hr = el('tr');
    hr.appendChild(el('th', 'dmg-board__rank', '#'));
    hr.appendChild(el('th', 'dmg-board__name', '玩家'));
    for (const [, label] of board.columns) hr.appendChild(el('th', null, label));
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = el('tbody');
    for (const [i, row] of board.rows.entries()) {
      const tr = el('tr', i === 0 ? 'is-top' : null);
      tr.appendChild(el('td', 'dmg-board__rank', String(i + 1)));
      const nameCell = el('td', 'dmg-board__name');
      nameCell.appendChild(el('span', null, row.name));
      if (row.isBot) nameCell.appendChild(el('span', 'dmg-board__tag', 'AI'));
      if (row.seat !== null) nameCell.appendChild(el('span', 'dmg-board__seat', `座 ${row.seat + 1}`));
      tr.appendChild(nameCell);
      for (const [key] of board.columns) {
        const v = numOf(row.stats[key]);
        const bad = (key === 'leaks' || key === 'lpLost') && v !== null && v > 0;
        const td = el('td', bad ? 'dmg-board__bad' : null, fmt(row.stats[key]));
        // 造成伤害那一列带一条比例条：看板的第一眼就是「谁打了多少」
        if (key === 'dmgDealt' && board.top > 0 && v !== null && v > 0) {
          const bar = el('i', 'dmg-board__bar');
          bar.setAttribute('aria-hidden', 'true');
          bar.setAttribute('style', `--w:${Math.max(4, Math.round((v / board.top) * 100))}%`);
          td.classList.add('dmg-board__dmg');
          td.appendChild(bar);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    box.appendChild(table);
    box.appendChild(el('p', 'dmg-board__hint', '数据来自引擎的对局结算（m.result），只读展示；不重算、不影响对局。'));
  }

  function render() {
    const show = !!last && visibleOn(doc);
    if (show) {
      if (drew && drawnFor === last) return; // 状态没变：一个 DOM 写都不做（也避免观察器自激）
      box.textContent = '';
      const board = boardFrom(last);
      if (board) build(board);
      drew = true; drawnFor = last;
      return;
    }
    if (!drew) return;
    box.textContent = '';
    drew = false; drawnFor = null;
  }

  // 引擎的结算帧（S2C 白名单内，面板可以直接订阅）：到了就存一份并重画。
  const off = ctx.net.on('m.result', (msg) => { last = msg || null; render(); });

  // 界面的出现与消失（结算屏渲染出来 / 返回大厅）不是消息驱动的 —— 页面结构变了就重判一次。
  // 合并到一帧一次；`render` 自己带状态守卫，所以不会因为自己写下的 DOM 再触发一轮。
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    const tick = () => { pending = false; render(); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tick);
    else setTimeout(tick, 32);
  };
  let observer = null;
  let timer = null;
  if (doc && typeof MutationObserver === 'function' && doc.body) {
    observer = new MutationObserver(schedule);
    observer.observe(doc.body, { childList: true, subtree: true });
  } else {
    timer = setInterval(render, 1000);
  }

  render(); // 挂载时可能已经在结算屏上（热装 / 切页回来）

  return {
    unmount() {
      off();
      if (observer) observer.disconnect();
      if (timer) clearInterval(timer);
      box.remove();
    },
  };
}
