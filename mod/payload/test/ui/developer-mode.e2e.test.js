// Real test-room UI, ordinary acquisition, and imported Forge content on the same developer dock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from '../e2e/client.mjs';

for (const forge of [false, true]) test(`developer dock: real ${forge ? 'Forge' : 'built-in growth'} content, searchable cards and enemy settings`, {
  skip: process.env.SP_E2E !== '1' || !process.env.CHROME_PATH || (forge && !process.env.SP_FORGE_PLUGINS_DIR), timeout: 150000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const old = process.env.SP_TEST_MODE; process.env.SP_TEST_MODE = '1';
  let srv;
  try { srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true,
    ...(forge ? { pluginsDir: process.env.SP_FORGE_PLUGINS_DIR } : {}),
    matchHost: { matchOptions: { clientCombat: false, botRehearsal: 0 } } }); }
  finally { if (old === undefined) delete process.env.SP_TEST_MODE; else process.env.SP_TEST_MODE = old; }
  const c = new Client(puppeteer, srv.url, 'DevTest', { w: 1600, h: 900 });
  const out = '.cache/developer-browser'; fs.mkdirSync(out, { recursive: true });
  try {
    await c.open(); await c.enter('DevTest');
    await c.click('.mode-card', '独立模拟'); await c.click('.diff-card', '标准模拟');
    await c.page.waitForSelector('[data-testid="create-test"] input');
    await c.page.click('[data-testid="create-test"] input');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="create-test"] input')?.checked);
    await c.click('.create-box button', '开始独立模拟'); await c.waitFor(s => !!s.room?.code, 'room');
    await c.page.evaluate(async forge => {
      const { net } = await import('/js/net.js');
      await net.request('room.setTavernMods', { mods: { growth: true, spells: true, heroes: true } });
      if (forge) await net.request('room.setPlugins', { plugins: ['hero-strategies','spell-shop','hero-strategies-look'].map(id => ({ id })) });
    }, forge);
    await c.click('.room-bar__right button', '开始模拟');
    await c.waitFor(s => s.phase === 'INFO_CHECK', 'briefing'); await c.click('.brief__foot .btn--primary', '准备就绪');
    await c.waitFor(s => s.phase === 'BAND_DRAFT', 'draft');
    await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js');
      await net.request('g.test', { cmd: 'phase', args: { name: 'battleCheck' } });
    });
    await c.waitFor(s => s.phase === 'PREP', 'prep');
    await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js'); await net.request('g.test', { cmd: 'timers', args: { on: false } });
    });
    await c.page.waitForFunction(() => !document.querySelector('.pbanner'));
    if (!await c.page.$('.testconsole.is-open')) await c.page.click('.testconsole__tab');
    const command = async name => { await c.page.select('[data-testid="test-command"]', name); };
    const input = async (selector, value) => {
      await c.page.$eval(selector, (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    };
    const run = async () => {
      const before = await c.page.evaluate(() => globalThis.__SP__.store.get().match.public.testActions);
      await c.page.click('[data-testid="test-run"]');
      await c.page.waitForFunction(n => globalThis.__SP__.store.get().match.public.testActions > n, {}, before);
      await c.page.waitForFunction(() => !document.querySelector('[data-testid="test-run"]')?.disabled);
    };
    await command('chess'); await input('[data-testid="test-search"]', '红豆');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="test-catalog"]')?.options.length > 1);
    assert.ok(await c.page.$eval('[data-testid="test-catalog"]', s => [...s.options].some(o => o.text.includes('红豆'))), 'Kazdel role comes from the growth roster');
    await input('[data-testid="test-search"]', '角峰');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="test-catalog"]')?.options[1]?.text.includes('角峰'));
    const id = await c.page.$eval('[data-testid="test-catalog"]', s => s.options[1].value);
    await c.page.select('[data-testid="test-catalog"]', id);
    await input('[data-testid="test-quantity"]', '3'); await run();
    assert.ok(await c.page.evaluate(() => {
      const p = globalThis.__SP__.store.get().match.private;
      return [...p.hand, ...p.temp, ...p.board.map(x => x.piece || x)].some(x => x?.kind === 'chess' && x.id.endsWith('_b'));
    }), 'three grants use the real elite merge');
    await command('spell'); await input('[data-testid="test-search"]', '新生幼苗');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="test-catalog"]')?.options[1]?.text.includes('新生幼苗'));
    const spell = await c.page.$eval('[data-testid="test-catalog"]', s => s.options[1].value);
    await c.page.select('[data-testid="test-catalog"]', spell); await input('[data-testid="test-quantity"]', '1'); await run();
    assert.ok(await c.page.evaluate(id => {
      const p = globalThis.__SP__.store.get().match.private; return [...p.hand, ...p.temp].some(x => x?.id === id);
    }, spell));
    await command('enemies');
    await c.page.click('[data-testid="test-expand"]');
    await c.page.waitForFunction(() => document.querySelector('.testconsole')?.getBoundingClientRect().width > 600);
    await input('[data-testid="test-enemy-hp"]', '2.5'); await input('[data-testid="test-enemy-count"]', '2'); await run();
    assert.deepEqual(await c.page.evaluate(() => {
      const e = globalThis.__SP__.store.get().match.public.testEnemies; return [e.hp, e.count];
    }), [2.5, 2]);
    await c.page.$eval('.testconsole__body', el => { el.scrollTop = 0; });
    await c.page.screenshot({ path: `${out}/${forge ? 'forge' : 'growth'}-desktop.png` });
    await c.page.setViewport({ width: 720, height: 400 });
    await c.page.waitForFunction(() => document.querySelector('.testconsole.is-sheet'));
    assert.ok(await c.page.$eval('.testconsole', el => {
      const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1;
    }));
    await c.page.screenshot({ path: `${out}/${forge ? 'forge' : 'growth'}-phone.png` });
    await c.page.click('.testconsole__enemy button');
    await c.page.waitForFunction(() => globalThis.__SP__.store.get().match.public.testEnemies.hp === 1);
    assert.ok(!c.problems.some(e => /pageerror:|console:/.test(e)), JSON.stringify(c.problems));
  } catch (error) {
    await c.page?.screenshot({ path: `${out}/failure-${forge}.png` }).catch(() => {});
    fs.writeFileSync(`${out}/failure-${forge}.json`, JSON.stringify({ error: String(error), state: await c.st().catch(() => null), text: await c.page?.evaluate(() => document.body.innerText).catch(() => ''), problems: c.problems }, null, 2));
    throw error;
  } finally { await c.close(); await srv.close(); }
});
