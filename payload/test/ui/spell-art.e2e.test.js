import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
const chrome = process.env.CHROME_PATH;
test('WebGL hand uses the catalog art URL and retains the spell frame', {
  skip: process.env.SP_E2E !== '1' || !chrome || !existsSync(chrome), timeout: 100000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
  let browser;
  try {
    const { makeMatch } = await import('../match/harness.js');
    const { SHOP_SPELLS } = await import('../../shared/spellCatalog.js');
    const h = makeMatch({ fake: true, spellShop: true, seed: 17 });
    h.start(); h.toPrep(1);
    const ps = h.ps('p_0'); ps.shop.level = 6; ps.funds = 50; ps.rollShop();
    const wand = ps.acquireItem(SHOP_SPELLS.find(c => c.name === '富足之杖').id);
    assert.equal(ps.castSpell(wand.uid).ok, true);
    const gold = ps.acquireItem(SHOP_SPELLS.find(c => c.name === '点金之触').id);
    assert.equal(ps.castSpell(gold.uid).ok, true);
    const spell = SHOP_SPELLS.find(c => c.name === '新生幼苗');
    const supportCard = ps.acquireItem(SHOP_SPELLS.find(c => c.name === '支援').id);
    const [key] = [...ps.deployMap()].find(([, type]) => type === 'melee');
    const [row, col] = key.split(',').map(Number);
    assert.equal(ps.castSpell(supportCard.uid, null, { row, col }).ok, true);
    ps.shop.slots[ps.shop.slots.length - 1] = { kind: 'item', id: spell.id, basePrice: spell.price, sold: false };
    const shopView = ps.privateView(); h.m.dispose();
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage(); await page.setViewport({ width: 1600, height: 900 });
    const errors = [], loaded = new Set();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', r => { if (r.status() === 200) loaded.add(new URL(r.url()).pathname); });
    await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=engine`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => typeof globalThis.__MOCK__?.mutate === 'function', { timeout: 30000 });
    await page.waitForSelector('canvas[aria-label="战场"]', { timeout: 30000 });
    const art = await page.evaluate(async (shopView) => {
      const { SHOP_SPELLS } = await import('/shared/spellCatalog.js');
      const c = SHOP_SPELLS.find(x => x.name === '智慧球');
      document.querySelector('.mockbar')?.classList.add('hidden');
      const note = document.createElement('div');
      note.textContent = '界面演示 · 非真实对局';
      note.style.cssText = 'position:fixed;left:22px;top:88px;z-index:9999;color:#ffe29a;background:#151a19;padding:5px 10px;font:14px sans-serif';
      document.body.append(note);
      globalThis.__MOCK__.mutate(S => {
        S.priv.shop = shopView.shop;
        S.priv.funds = shopView.funds;
        S.priv.effects = shopView.effects;
        S.priv.board = [];
        S.priv.prepMapChars = shopView.prepMapChars;
        S.priv.spellSupports = shopView.spellSupports;
        S.priv.hand[0] = { uid: 91001, kind: 'item', id: c.id, tier: c.tier, items: [] };
      });
      return c.artUrl;
    }, shopView);
    for (let i = 0; i < 80 && !loaded.has(art); i++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(loaded.has(art), 'the hand loads the custom spell art even without a shop/detail card for it');
    for (let i = 0; i < 80 && !loaded.has('/assets/spells/hoshiguma_shield.png'); i++) await new Promise(resolve => setTimeout(resolve, 100));
    if (!loaded.has('/assets/spells/hoshiguma_shield.png')) {
      mkdirSync('.cache/spell-shop', { recursive: true });
      await page.screenshot({ path: '.cache/spell-shop/marker-debug.png' });
      console.log(JSON.stringify({ errors, marker: await page.evaluate(() => globalThis.__MOCK__.S().priv.prepMapChars), resources: [...loaded].filter(x => /shield|hsguma/.test(x)) }));
    }
    assert.ok(loaded.has('/assets/spells/hoshiguma_shield.png'), 'the field marker loads the original Hoshiguma shield');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.waitForSelector('.shopbar__spells .scard');
    assert.equal(await page.$$eval('.shopbar__cards .scard__growth', rows => rows.length), 5);
    assert.ok(await page.$$eval('.shopbar__cards .scard__growth', rows => rows.every(r => r.textContent.includes('+1层'))));
    assert.equal(await page.$$eval('.shopbar__cards .is-elite .scard__goldreward', rows => rows.length), 1);
    assert.ok(await page.$$eval('.shopbar__cards .has-growth', cards => cards.every(card => {
      const badge = card.querySelector('.scard__growth').getBoundingClientRect();
      const art = card.querySelector('.scard__art').getBoundingClientRect();
      return badge.bottom <= art.top + 1;
    })), 'purchase bonus header sits above portraits');
    const checkVisible = async () => assert.ok(await page.$eval('.shopbar__spells .scard', card => {
      const r = card.getBoundingClientRect(), funds = document.querySelector('.funds').getBoundingClientRect();
      const label = document.querySelector('.shopbar__spells .shopbar__category'), lr = label.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.right <= funds.left && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.scard') === card
        && document.elementFromPoint(lr.x + lr.width / 2, lr.y + lr.height / 2) === label;
    }), 'the spell card remains visible and clickable before the funds column');
    await checkVisible();
    mkdirSync('.cache/spell-shop', { recursive: true });
    await page.screenshot({ path: '.cache/spell-shop/webgl.png' });
    await page.setViewport({ width: 844, height: 390 });
    await new Promise(resolve => setTimeout(resolve, 500));
    await checkVisible();
    await page.screenshot({ path: '.cache/spell-shop/webgl-narrow.png' });
    await page.setViewport({ width: 1600, height: 900 });
    await page.evaluate(() => globalThis.__MOCK__.mutate(S => {
      const id = 'chess_item_1_04_e_a';
      S.priv.shop.slots[S.priv.shop.slots.length - 1] = { kind: 'item', id, price: 1, basePrice: 1, sold: false };
      S.priv.hand[0] = { uid: 91002, kind: 'item', id, tier: 1, items: [] };
    }));
    await page.waitForFunction(() => document.querySelector('.shopbar__spells .scard')?.textContent.includes('随身身份牌'));
    assert.deepEqual(await page.$eval('.shopbar__spells .scard__itemart img', img => {
      const s = getComputedStyle(img); return { fit: s.objectFit, transform: s.transform };
    }), { fit: 'contain', transform: 'none' });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: '.cache/spell-shop/native-spell.png' });
    assert.deepEqual(errors, []);
  } finally {
    await Promise.race([browser?.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
    browser?.process()?.kill();
    for (const c of srv.wss.clients || []) c.terminate();
    await srv.close();
  }
});
