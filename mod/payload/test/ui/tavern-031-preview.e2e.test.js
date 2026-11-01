// Opt-in visual acceptance for 0.3.1: real room requests/matches followed by an explicitly marked fixture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const chrome = process.env.CHROME_PATH;
const out = process.env.TAVERN_PREVIEW_OUT || '.cache/integration';
test('0.3.1 native UI supports independent live room switches and tavern previews', {
  skip: process.env.SP_E2E !== '1' || !chrome || !existsSync(chrome), timeout: 240000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const { Client, sleep } = await import('../e2e/client.mjs');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, assetIndex: false });
  mkdirSync(out, { recursive: true });
  const closeClient = async c => {
    const child = c.browser?.process();
    await Promise.race([c.close().catch(() => {}), sleep(3000)]);
    child?.kill();
    for (const stream of child?.stdio || []) stream?.destroy?.();
  };
  const clients = [], report = { mode: process.env.TAVERN_PREVIEW_FIXTURE_ONLY === '1' ? 'fixture-only' : 'full', real: [], fixture: null };
  const shot = async (page, name) => { await sleep(700); await page.screenshot({ path: path.join(out, `031-${name}.png`) }); };
  try {
    for (const enabled of process.env.TAVERN_PREVIEW_FIXTURE_ONLY === '1' ? [] : [false, true]) {
      const c = new Client(puppeteer, srv.url, enabled ? 'enabled' : 'disabled', { w: 1600, h: 900 });
      clients.push(c);
      console.log(`Opening ${enabled ? 'enabled' : 'disabled'} real room`);
      await c.open(); await c.enter(enabled ? 'Tavern031' : 'Native031');
      await c.createCoop();
      await c.waitFor(s => !!s.room?.code, 'room');
      await c.page.waitForSelector('.tavern-mods input');
      const mods = () => c.page.evaluate(() => globalThis.__SP__.store.get().room.tavernMods);
      assert.deepEqual(await mods(), { spells: true, heroes: true, growth: false });
      // The first two real checkboxes send room.setTavernMods through the real socket.
      await c.click('.tavern-mod input', null, { nth: 0 });
      await c.page.waitForFunction(() => globalThis.__SP__.store.get().room.tavernMods.spells === false);
      assert.deepEqual(await mods(), { spells: false, heroes: true, growth: false });
      await c.click('.tavern-mod input', null, { nth: 1 });
      await c.page.waitForFunction(() => globalThis.__SP__.store.get().room.tavernMods.heroes === false);
      assert.deepEqual(await mods(), { spells: false, heroes: false, growth: false });
      await c.click('.tavern-mod input', null, { nth: 2 });
      await c.page.waitForFunction(() => { const m=globalThis.__SP__.store.get().room.tavernMods; return m.growth && m.spells && m.heroes; });
      assert.deepEqual(await mods(), { spells: true, heroes: true, growth: true });
      await c.click('.tavern-mod input', null, { nth: 0 });
      await c.page.waitForFunction(() => !globalThis.__SP__.store.get().room.tavernMods.spells);
      await c.click('.tavern-mod input', null, { nth: 1 });
      await c.page.waitForFunction(() => !globalThis.__SP__.store.get().room.tavernMods.heroes);
      assert.deepEqual(await mods(), { spells: false, heroes: false, growth: true });
      await c.click('.tavern-mod input', null, { nth: 2 });
      await c.page.waitForFunction(() => !globalThis.__SP__.store.get().room.tavernMods.growth);
      if (enabled) {
        await c.click('.tavern-mod input', null, { nth: 0 });
        await c.page.waitForFunction(() => globalThis.__SP__.store.get().room.tavernMods.spells === true);
        await c.click('.tavern-mod input', null, { nth: 1 });
        await c.page.waitForFunction(() => globalThis.__SP__.store.get().room.tavernMods.heroes === true);
      }
      if (enabled) {
        await shot(c.page, 'real-room-desktop');
        await c.page.setViewport({ width: 844, height: 390 });
        await shot(c.page, 'real-room-phone-landscape');
        await c.page.setViewport({ width: 1600, height: 900 });
      }
      await c.click('.room-bar__right button', '开始模拟');
      await c.waitFor(s => s.phase === 'INFO_CHECK', 'briefing');
      await c.click('.brief__foot .btn--primary', '准备就绪');
      await c.waitFor(s => s.phase === 'BAND_DRAFT', 'draft');
      if (enabled) await c.page.click('[data-band="band_hs_cookie"]');
      else await c.click('.dband', null, { nth: 0 });
      await c.click('.draft-detail__btns .btn--primary', '确认选择');
      await c.waitFor(s => s.phase === 'PREP', 'prep');
      await c.page.waitForSelector('.shopbar');
      await c.page.waitForFunction(() => !document.querySelector('.pbanner'));
      await c.page.waitForFunction(() => globalThis.__SP_VIEW__?.kind !== 'loading');
      await sleep(3000);
      const state = await c.page.evaluate(() => {
        const s = globalThis.__SP__.store.get();
        return { spells: s.match.private.shop.spellShop === true, hero: s.match.private.heroPower?.id || null,
          heroVisible: !!document.querySelector('.hero-power__toggle'), spellVisible: !!document.querySelector('.shopbar__spells'),
          pluginSlot: !!document.querySelector('[data-ui-slot="hud.right"]'), room: s.room.tavernMods };
      });
      assert.equal(state.spells, enabled); assert.equal(state.spellVisible, enabled);
      assert.equal(state.heroVisible, enabled); assert.equal(state.pluginSlot, true);
      if (enabled) {
        assert.equal(state.hero, 'cookie');
        await c.page.hover('.hero-power__toggle'); await c.page.waitForSelector('.hero-power__panel');
        await shot(c.page, 'real-match-enabled-desktop');
        await c.page.setViewport({ width: 844, height: 390 });
        await c.page.hover('.hero-power__toggle');
        await c.page.waitForSelector('.hero-power__panel');
        await shot(c.page, 'real-match-enabled-phone-landscape');
      } else await shot(c.page, 'real-match-disabled-desktop');
      report.real.push({ enabled, ...state, problems: c.problems });
      writeFileSync(path.join(out, '031-preview-real-report.json'), JSON.stringify(report.real, null, 2));
      console.log(`Verified real ${enabled ? 'enabled' : 'disabled'} match`);
      await closeClient(c); clients.pop();
    }
    console.log('Preparing the marked server-generated fixture.');
    const { makeMatch } = await import('../match/harness.js');
    const { heroEvent } = await import('../../server/match/heroPowers.js');
    const h = makeMatch({ fake: true, spellShop: true, heroMod: true });
    h.start(); h.toPrep(1);
    const ps = h.ps('p_0'); ps.bandId = 'band_hs_cookie'; ps.funds = 50; ps.lp = 24;
    ps.shop.level = 6; ps.rollShop(); ps.spellData().armor = 8; heroEvent(ps, 'onRoundStart', {});
    const view = ps.privateView(); h.m.dispose();
    const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--mute-audio'] });
    clients.push({ browser, close: () => browser.close() });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(`${srv.url}/dev/game-mock.html?phase=PREP&render=engine&shot=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.shopbar');
    await page.evaluate(view => {
      const note = document.createElement('div'); note.textContent = '0.3.1 · 服务器生成的界面测试场景（非真实对局）';
      note.style.cssText = 'position:fixed;left:20px;top:80px;z-index:9999;color:#ffe29a;background:#151a19e8;padding:6px 10px;font:13px sans-serif';
      document.body.append(note);
      globalThis.__MOCK__.mutate(s => {
        s.priv.heroPower = view.heroPower; s.priv.shop = view.shop; s.priv.funds = view.funds;
        s.priv.lp = view.lp; s.priv.armor = view.armor; s.priv.bandId = view.bandId;
        s.pub.heroMod = true; s.pub.spellShop = true; s.pub.spellHeroesEnabled = true;
      });
    }, view);
    await page.waitForSelector('.hero-power__toggle');
    await page.hover('.hero-power__toggle'); await page.waitForSelector('.hero-power__panel');
    await page.waitForFunction(() => !document.querySelector('.pbanner') && globalThis.__SP_VIEW__?.kind !== 'loading');
    await sleep(2500);
    await shot(page, 'fixture-tavern-armor-desktop');
    await page.setViewport({ width: 844, height: 390 });
    await page.hover('.hero-power__toggle');
    await page.waitForSelector('.hero-power__panel');
    await shot(page, 'fixture-tavern-armor-phone-landscape');
    report.fixture = await page.evaluate(() => ({ lp: document.querySelector('.gtop .lp__val').textContent,
      armor: document.querySelector('[data-testid="hero-armor"]').textContent.trim(),
      hero: !!document.querySelector('.hero-power__panel'), spells: document.querySelectorAll('.shopbar__spells .scard').length,
      brokenImages: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src) }));
    assert.equal(report.fixture.lp, '24'); assert.equal(report.fixture.armor, '8');
    assert.equal(report.fixture.hero, true); assert.ok(report.fixture.spells > 0);
  } catch (error) {
    report.error = { message: error.message, stack: error.stack };
    console.error(error); throw error;
  } finally {
    writeFileSync(path.join(out, '031-preview-report.json'), JSON.stringify(report, null, 2));
    for (const c of clients) await closeClient(c);
    for (const room of srv.lobby.rooms.values()) room.match?.dispose?.();
    for (const socket of srv.wss.clients || []) socket.terminate();
    srv.server.closeAllConnections();
    await srv.close();
  }
});
