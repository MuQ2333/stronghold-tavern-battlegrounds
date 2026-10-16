// Track the visible browser box independently of the layout viewport. Native system UI can
// pan it without firing window.resize; do not retain that pan after the keyboard is closed.
export function editingText(doc) {
  const el = doc?.activeElement;
  if (!el) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'hidden'].includes(el.type);
}

export function visibleViewport(win) {
  const vv = win.visualViewport;
  const positive = (v, fallback) => Number.isFinite(v) && v > 0 ? v : fallback || 0;
  const editing = editingText(win.document);
  return {
    width: positive(vv?.width, win.innerWidth),
    height: positive(vv?.height, win.innerHeight),
    x: editing ? Math.max(0, Number(vv?.offsetLeft) || 0) : 0,
    y: editing ? Math.max(0, Number(vv?.offsetTop) || 0) : 0,
    editing,
  };
}

export function installViewportSupport(win) {
  const doc = win.document, root = doc.documentElement;
  const off = [], last = new Map();
  let frame = null, disposed = false;
  const timers = new Set();
  const on = (target, event, handler) => {
    if (!target?.addEventListener) return;
    target.addEventListener(event, handler, {passive: true});
    off.push(() => target.removeEventListener(event, handler));
  };
  const put = (key, value) => {
    if (last.get(key) === value) return false;
    last.set(key, value); root.style.setProperty(key, value); return true;
  };
  const sync = () => {
    if (disposed) return;
    const v = visibleViewport(win);
    if (!v.editing) {
      // Only reset the root scroller. Scrollable lists, the shop and chat keep their positions.
      const scroller = doc.scrollingElement;
      if (scroller?.scrollTop) scroller.scrollTop = 0;
      if (scroller?.scrollLeft) scroller.scrollLeft = 0;
      if (win.scrollX || win.scrollY) win.scrollTo?.(0, 0);
    }
    let changed = false;
    if (v.height > 0) changed = put('--sp-vh', `${v.height / 100}px`) || changed;
    if (v.width > 0) changed = put('--sp-vw', `${v.width}px`) || changed;
    changed = put('--sp-vx', `${v.x}px`) || changed;
    changed = put('--sp-vy', `${v.y}px`) || changed;
    if (changed && win.dispatchEvent && win.Event) win.dispatchEvent(new win.Event('sp:viewport'));
  };
  const schedule = () => {
    if (frame !== null || disposed) return;
    if (!win.requestAnimationFrame) { sync(); return; }
    frame = win.requestAnimationFrame(() => { frame = null; sync(); });
  };
  // Native status/navigation bars can finish their animation after the last resize/scroll
  // event. Sample the settled box as well; do not poll forever or re-enter fullscreen.
  const recover = () => {
    schedule();
    if (!win.setTimeout) return;
    for (const timer of timers) win.clearTimeout(timer);
    timers.clear();
    for (const delay of [120, 400, 900]) {
      const timer = win.setTimeout(() => { timers.delete(timer); schedule(); }, delay);
      timers.add(timer);
    }
  };
  root.classList.add('sp-viewport-lock');
  on(win, 'scroll', schedule);
  for (const event of ['resize', 'focus', 'pageshow', 'orientationchange']) on(win, event, recover);
  for (const event of ['resize', 'scroll']) on(win.visualViewport, event, recover);
  for (const event of ['fullscreenchange', 'webkitfullscreenchange', 'visibilitychange', 'focusin', 'focusout', 'touchend', 'touchcancel', 'pointercancel']) on(doc, event, recover);
  sync();
  return {sync, destroy() {
    disposed = true;
    if (frame !== null) win.cancelAnimationFrame?.(frame);
    for (const timer of timers) win.clearTimeout(timer);
    timers.clear();
    for (const f of off) f();
    root.classList.remove('sp-viewport-lock');
  }};
}
