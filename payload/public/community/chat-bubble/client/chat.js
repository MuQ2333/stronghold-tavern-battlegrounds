// chat-bubble/client/chat.js — 局内文字聊天（`screen.game.overlay` 面板）。
//
// 做什么：对局里左下角一个输入框，回车把一句话送到**同一个房间里、同样装了这个包**的客户端，
// 收到的一方在自己屏幕上以气泡显示，4 秒后淡出。
//
// 走哪条路：引擎自己的包命名空间通道 —— `ctx.net.send('say', {...})` 上行、`ctx.net.on('say', fn)`
// 下行，线上类型是引擎定的 `pack.msg`，通道名是本包声明的 `say`（线上拼成 `chat-bubble.say`）。
//
// **为什么这不是「发明了一个协议类型」**：`docs/MOD-SURFACE.md` 的「刻意不是表面的东西」写得很死 ——
// 「包不能发明 S2C/C2S 类型。包自己的通道走 `pack.msg`，类型名由引擎定」。`shared/protocol.js` 里
// `pack.msg` 同时挂在 C2S 与 S2C 两张表上：上行由引擎校验形状、下行由引擎转发给同房同包同通道的客户端。
// 引擎**不解释** `data` 的语义（那是包自己的），只做三件事：限流、把字节送到该到的地方、不让没装包的
// 客户端收到。所以 `b.*` 那条边界一个字没动，也没新增任何线上类型。
//
// **它不是引擎的房内聊天**：`room.chat` / `room.quickMsg` 是**产品功能**（docs/META.md §1.6–§1.8），
// 由引擎自己实现、不对包开放。这是包自己的通道 —— 只有装了本包的人互相看得见，跨包不互通。
// 这一点必须写在备注里，否则用户会以为「装了就能跟所有人说话」。
//
// 限额（引擎定，包改不了）：单条 `data` 序列化后 ≤ 4096 字节、每会话 5 条/秒、突发 20 条。
// 超了引擎回 `ERR.RATE`；本包只做客户端侧的**保守自限**（见 SEND_INTERVAL_MS），不试图绕过。
//
// 安全与边界：
//   * 一律走 `textContent` 写文本，**绝不**拼 innerHTML —— 别人发来的字符串永远只是文本；
//   * 名字只从 `ctx.me` 的只读会话快照里取（引擎给的，不是对面报的），所以**冒名顶替在本包里做不到**；
//   * 文本在发送侧就截断（`TEXT_MAX` 按码点计，与引擎那条「截断而非拒绝」同一口径）；
//   * 面板拿不到 store / match / runner / audio（§28.8），所以它改不了对局，也发不出 `g.*`。

/** 一条消息最多几个字符（按码点计：一个 emoji 算 1 个）。超了截断，不拒。 */
export const TEXT_MAX = 120;
/** 气泡停留多久（ms）。 */
export const BUBBLE_MS = 4000;
/** 最多同时显示几条气泡（老的先走）。 */
export const BUBBLE_MAX = 4;
/** 客户端自限：两条之间至少隔这么久（ms）。引擎限的是 5 条/秒，这里取 250ms = 4 条/秒，留余量。 */
export const SEND_INTERVAL_MS = 250;

/** 按码点截断（`Array.from` 按码点切，不会把代理对切成两半）。 */
export function clampText(s) {
  const chars = Array.from(String(s == null ? '' : s));
  return chars.length <= TEXT_MAX ? chars.join('') : chars.slice(0, TEXT_MAX).join('');
}

/** 去掉控制字符与换行（气泡是一行；换行与 \u0000 这类进 DOM 没意义）。 */
export function sanitizeText(s) {
  // eslint-disable-next-line no-control-regex
  return clampText(String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim());
}

/** 发送节流：距离上次发送不足间隔则返回 false。抽成纯函数只为可测。 */
export function canSend(now, lastSentAt, interval = SEND_INTERVAL_MS) {
  if (!Number.isFinite(lastSentAt)) return true;
  return now - lastSentAt >= interval;
}

export function mount(ctx) {
  const host = ctx.host;
  const t = ctx.t || (s=>s);
  const log = ctx.log || console;

  // 没有收发能力（老引擎 / 没声明通道）→ 明说一句，不静默装死。
  if (!ctx.net || typeof ctx.net.send !== 'function' || typeof ctx.net.on !== 'function') {
    log.warn && log.warn('chat-bubble: 这版引擎没有包通道（ctx.net.send/on），聊天不会生效');
    return { unmount() {} };
  }

  const box = document.createElement('div');
  box.className = 'chatbub';

  const list = document.createElement('div');
  list.className = 'chatbub__list';
  box.appendChild(list);

  const form = document.createElement('form');
  form.className = 'chatbub__form';
  const input = document.createElement('input');
  input.className = 'chatbub__input';
  input.type = 'text';
  input.maxLength = TEXT_MAX;
  input.placeholder = t('说点什么…（回车发送）');
  input.autocomplete = 'off';
  const send = document.createElement('button');
  send.className = 'chatbub__send';
  send.type = 'submit';
  send.textContent = t('发送');
  form.appendChild(input);
  form.appendChild(send);
  box.appendChild(form);

  host.appendChild(box);

  /** 一条气泡：4 秒后自己移除。 */
  function bubble(name, text) {
    const el = document.createElement('div');
    el.className = 'chatbub__item';
    const who = document.createElement('b');
    who.className = 'chatbub__who';
    // textContent：对面发来的字符串永远只是文本，不解释成标记。
    who.textContent = name;
    const body = document.createElement('span');
    body.className = 'chatbub__text';
    body.textContent = text;
    el.appendChild(who);
    el.appendChild(body);
    list.appendChild(el);
    while (list.childElementCount > BUBBLE_MAX) list.removeChild(list.firstChild);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, BUBBLE_MS);
  }

  let lastSentAt = NaN;
  const off = ctx.net.on('say', (msg) => {
    const d = msg && msg.data;
    if (!d || typeof d !== 'object') return;
    const text = sanitizeText(d.text);
    if (!text) return;
    // 名字取收到的 `name`（对面自称），但**只作显示**：本包没有任何身份校验的余地，
    // 引擎也不校验 `data`；真要防冒名，得由引擎给一格「消息附会话身份」的表面（见 README 的备注）。
    bubble(String(d.name || '?').slice(0, 24), text);
  });

  let composing=false;
  input.addEventListener('compositionstart',()=>{composing=true;});
  input.addEventListener('compositionend',()=>{composing=false;});
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.isComposing||composing){if(e.key==='Enter')e.preventDefault();}});
  async function submit(ev) {
    if (ev) ev.preventDefault();
    if(composing)return;
    const text = sanitizeText(input.value);
    if (!text) return;
    const now = Date.now();
    if (!canSend(now, lastSentAt)) return;
    lastSentAt = now;
    const me = ctx.me || {};
    const name = me.name || '?';
    try{await ctx.net.send('say', { text, name });if(input.value===text)input.value='';}
    catch{bubble('',t('聊天发送失败，请重试'));}
  }

  form.addEventListener('submit', submit);

  return {
    unmount() {
      try { if (typeof off === 'function') off(); } catch (_) { /* 退订失败不该挡卸载 */ }
      form.removeEventListener('submit', submit);
      if (box.parentNode) box.parentNode.removeChild(box);
    },
  };
}
