import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server-streamed layers grow during combat without private refresh; Yogg cast stays prominent and inspectable', {
  skip: process.env.SP_E2E !== '1' || !process.env.CHROME_PATH, timeout: 90000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox','--mute-audio'] });
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  fs.mkdirSync('.cache/live-layer-browser', { recursive: true });
  try {
    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(`${srv.url}/dev/game-mock.html?phase=COMBAT&render=fallback&shot=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.gm__bonds .bond__count');
    await page.evaluate(() => {
      const mock = globalThis.__MOCK__;
      clearInterval(mock.S().battle.timer);
      mock.mutate(s => { s.pub.growthMode = true; s.pub.disabledBonds = []; s.priv.board[0].id = 'chess_char_3_06_a'; });
    });
    const push = async n => page.evaluate(async n => {
      const { net } = await import('/js/net.js');
      const s = globalThis.__MOCK__.store.get(), pid = s.me.playerId, fid = s.match.field.fieldId;
      net._emit('b.snap', { t: 'b.snap', fieldId: fid, gt: n, units: [], killed: 0, total: 9, bondLayers: { [pid]: { sargonShip: n } } });
      net._emit('b.snap', { t: 'b.snap', fieldId: fid, gt: n + 0.1, units: [], killed: 0, total: 9 });
    }, n);
    await push(1500);
    await page.waitForFunction(() => document.querySelector('[data-bond="sargonShip"] .bond__count')?.textContent === '1.5k');
    await push(21300);
    await page.waitForFunction(() => document.querySelector('[data-bond="sargonShip"] .bond__count')?.textContent === '21.3k');
    assert.equal(await page.$eval('[data-bond="sargonShip"] .bond__count', el => el.title), '21300');
    await page.click('[data-bond="sargonShip"] button');
    await page.waitForFunction(() => document.querySelector('.bpop__facts')?.textContent.includes('21.3k'));
    await page.keyboard.press('Escape');
    await push(1000000);
    await page.waitForFunction(() => document.querySelector('[data-bond="sargonShip"] .bond__count')?.textContent === '1.0M');
    const state = await page.evaluate(() => globalThis.__MOCK__.store.get());
    assert.equal(state.match.public.phase, 'COMBAT');
    assert.ok(!state.match.private.bonds.some(b => b.bondId === 'sargonShip' && b.layers >= 1500), 'no post-combat private update supplied the visible counts');
    await page.screenshot({ path: '.cache/live-layer-browser/sargon-million-in-combat.png' });
    await page.evaluate(() => {
      globalThis.__MOCK__.setPhase('PREP');
      globalThis.__MOCK__.mutate(s => { s.pub.round = 3; s.priv.heroPower = {
        id: 'yogg', name: '尤格-萨隆', desc: '', price: 0, passive: true, round: 3, cooldown: 0, locked: [], choices: [], targets: [],
        lastSpell: { id: 'hs_bg33_101', round: 3, targetId: 'chess_char_3_06_a' },
      }; });
    });
    await page.waitForSelector('[data-testid="hero-auto-spell"]');
    assert.ok((await page.$eval('[data-testid="hero-auto-spell"]', el => el.textContent)).includes('新生幼苗'));
    assert.ok((await page.$eval('[data-testid="hero-auto-spell"]', el => el.textContent)).includes('菲莱'));
    await new Promise(r => setTimeout(r, 2500));
    assert.ok(await page.$('[data-testid="hero-auto-spell"]'), 'survives an ordinary short toast');
    await page.screenshot({ path: '.cache/live-layer-browser/yogg-cast-notice.png' });
    await page.waitForFunction(() => !document.querySelector('[data-testid="hero-auto-spell"]'), { timeout: 2000 });
    await page.hover('.hero-power__toggle'); await page.waitForSelector('.hero-power__facts');
    assert.ok((await page.$eval('.hero-power__facts', el => el.textContent)).includes('新生幼苗'));
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: '.cache/live-layer-browser/failure.png' }).catch(() => {});
    fs.writeFileSync('.cache/live-layer-browser/failure.json', JSON.stringify({ error: String(error), errors, text: await page.evaluate(() => document.body.innerText) }, null, 2));
    throw error;
  } finally { await browser.close(); await srv.close(); }
});
