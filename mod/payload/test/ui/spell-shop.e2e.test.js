import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';

const chrome = process.env.CHROME_PATH;
test('spell shop preserves category positions, buys the right slot, and fits narrow screens', {
  skip: process.env.SP_E2E !== '1' || !chrome || !existsSync(chrome),
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback`, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.waitForSelector('.shopbar__cards .scard', {timeout:10000});
    await page.evaluate(async () => {
      document.querySelector('.mockbar').classList.add('hidden');
      const note = document.createElement('div');
      note.textContent = '界面演示 · 非真实对局';
      note.style.cssText = 'position:fixed;left:22px;top:88px;z-index:9999;color:#ffe29a;background:#151a19;padding:5px 10px;font:14px sans-serif';
      document.body.append(note);
      globalThis.__MOCK__.mutate(S => {
        const shop = S.priv.shop;
        const chess = shop.slots.filter(s => s?.kind === 'chess').slice(0, 5);
        while (chess.length < 5) chess.push({ ...chess[0] });
        for (const slot of chess) slot.price = slot.basePrice;
        S.priv.funds = 50;
        shop.level = 6; shop.spellShop = true;
        shop.layout = { chess: 5, item: 1, spell: 1 };
        shop.slots = [...chess, null, { kind: 'item', id: 'chess_item_1_03_e_a', price: 1, basePrice: 1, sold: false, frozen: false }];
      });
      const { net } = await import('/js/net.js');
      globalThis.__spellRequests = [];
      net.request = async (t, fields) => { globalThis.__spellRequests.push({ t, ...fields }); return { ok: true }; };
    });
    await page.waitForSelector('.shopbar__spells .scard--spell');
    assert.equal(await page.$$eval('.scard__spelltag', x => x.length), 0);
    assert.equal(await page.$eval('.shopbar__spells .shopbar__category', x => x.textContent), '法术');
    assert.equal(await page.$$eval('.shopbar__cards .scard', x => x.length), 5);
    assert.equal(await page.$$eval('.shopbar__item:not(.shopbar__spells) .scard--empty', x => x.length), 1);
    await page.click('.shopbar__spells .scard');
    await page.waitForSelector('.shopbar__spells .is-armed');
    await page.click('.shopbar__spells .scard');
    await page.waitForFunction(() => globalThis.__spellRequests.some(x => x.t === 'g.buy'));
    assert.equal(await page.evaluate(() => globalThis.__spellRequests.find(x => x.t === 'g.buy').slot), 6);
    // Exercise the screen's actual drag dispatch, not just the pure intent mapper.
    const targetUid = await page.evaluate(() => {
      globalThis.__MOCK__.mutate(S => {
        S.priv.hand[0] = { uid: 90001, kind: 'item', id: 'chess_item_1_04_e_a', items: [] };
        S.priv.hand[1] = { uid: 90002, kind: 'item', id: 'chess_item_1_03_e_a', items: [] };
      });
      return globalThis.__MOCK__.S().priv.board.find(p => p.kind === 'chess').uid;
    });
    await page.waitForSelector('.ff-piece[data-uid="90001"]');
    assert.equal(await page.$eval('.ff-piece[data-uid="90001"]', el => el.classList.contains('is-spell')), true);
    assert.equal(await page.$eval('.ff-piece[data-uid="90002"]', el => el.classList.contains('is-spell')), true);
    assert.doesNotMatch(await page.$eval('.shopbar__spells', el => el.textContent), /装备时/);
    const center = (selector) => page.$eval(selector, el => {
      const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    const from = await center('.ff-piece[data-uid="90001"]');
    const to = await center(`.ff-piece[data-uid="${targetUid}"]`);
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    await page.mouse.move(to.x, to.y, { steps: 12 }); await page.mouse.up();
    await page.waitForFunction(() => globalThis.__spellRequests.some(x => x.t === 'g.castSpell' && x.itemUid === 90001));
    assert.equal(await page.evaluate(() => globalThis.__spellRequests.find(x => x.t === 'g.castSpell').targetUid), targetUid);
    // The renderer suppresses the click immediately following a drag release.
    await new Promise(resolve => setTimeout(resolve, 350));
    await page.click('.ff-piece[data-uid="90002"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.waitForFunction(() => [...document.querySelectorAll('.dactions button')].some(b => b.textContent.includes('施放法术')));
    assert.doesNotMatch(await page.$eval('.dpanel', el => el.textContent), /装备时销毁/);
    await page.evaluate(() => [...document.querySelectorAll('.dactions button')].find(b => b.textContent.includes('施放法术')).click());
    await page.waitForFunction(() => globalThis.__spellRequests.some(x => x.t === 'g.castSpell' && x.itemUid === 90002 && x.targetUid === null));
    // The new catalog renders in the same shop/reward UI, including BOTH choose-one descriptions.
    await page.evaluate(async () => {
      const { SHOP_SPELLS } = await import('/shared/spellCatalog.js');
      const rec = SHOP_SPELLS.find(x => x.name === '无限潜力');
      globalThis.__MOCK__.mutate(S => {
        S.priv.shop.slots[0].purchaseBonus = 7;
        S.priv.shop.slots[6] = { kind: 'item', id: rec.id, price: rec.price, basePrice: rec.price };
      });
    });
    await page.waitForFunction(() => document.querySelector('.shopbar__spells').textContent.includes('无限潜力'));
    assert.equal(await page.$eval('.scard__growth', e => e.textContent), '+7');
    const spellText = await page.$eval('.shopbar__spells .scard__idesc', e => e.textContent);
    assert.match(spellText, /干员/); assert.match(spellText, /法术/); assert.doesNotMatch(spellText, /装备/);
    await page.waitForFunction(() => document.querySelector('.shopbar__spells .scard img')?.naturalWidth > 0);
    await page.evaluate(async () => {
      const { SHOP_SPELLS } = await import('/shared/spellCatalog.js');
      const rec = SHOP_SPELLS.find(x => x.name === '无限潜力');
      globalThis.__MOCK__.mutate(S => {
        S.priv.shop.rewardOffer = { source: 'special', label: rec.name, queued: 0, slots: [0,1].map(i => ({ kind: 'item', id: rec.id + '_choice' + i, price: 0, spellChoice: true })) };
      });
    });
    await page.waitForSelector('.shopbar__rwcards .scard');
    assert.equal(await page.$$eval('.shopbar__rwcards .scard', e => e.length), 2);
    assert.match(await page.$eval('.shopbar__rwcards .scard:first-child', e => e.textContent), /发现一名.*干员/);
    assert.match(await page.$eval('.shopbar__rwcards .scard:last-child', e => e.textContent), /发现一张.*法术/);
    await page.click('.shopbar__rwcards .scard:last-child');
    await page.click('.shopbar__rwcards .scard:last-child');
    await page.waitForFunction(() => globalThis.__spellRequests.some(x => x.t === 'g.reward' && x.idx === 1));
    mkdirSync('.cache/spell-shop', { recursive: true });
    await page.screenshot({ path: '.cache/spell-shop/desktop.png' });
    await page.evaluate(() => globalThis.__MOCK__.mutate(S => { S.priv.shop.rewardOffer = null; }));
    await page.setViewport({ width: 844, height: 390 });
    await page.waitForFunction(() => {
      const r = document.querySelector('.shopbar__row').getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1;
    });
    await page.screenshot({ path: '.cache/spell-shop/narrow.png' });
    await page.evaluate(() => globalThis.__MOCK__.mutate(S => { S.priv.shop.slots[6] = null; }));
    await page.waitForSelector('.shopbar__spells .scard--empty');
    assert.equal(await page.$$eval('.shopbar__cards .scard', x => x.length), 5);
    assert.deepEqual(errors, []);
    await page.setViewport({ width: 1600, height: 900 });
    await page.evaluate(async () => {
      const { SHOP_SPELLS } = await import('/shared/spellCatalog.js');
      globalThis.__MOCK__.mutate(S => {
        S.priv.shop.layout = { chess: 0, item: 0, spell: 7 };
        S.priv.shop.slots = SHOP_SPELLS.slice(0, 7).map(c => ({ kind: 'item', id: c.id, price: c.price, basePrice: c.price }));
        S.priv.spellSupports = [{ uid: 98001, row: 3, col: 4, dir: 'RIGHT' }];
      });
    });
    await page.waitForSelector('.shopbar.all-spells');
    assert.equal(await page.$$eval('.shopbar__spellcards .scard', x => x.length), 7);
    assert.equal(await page.$$eval('.shopbar__item:not(.shopbar__spells)', x => x.length), 0, 'no phantom equipment slot in all-spell shop');
    assert.ok(await page.$eval('.shopbar__spellcards', el => el.scrollWidth <= el.clientWidth + 1), 'desktop shows every spell without a narrow spell-only strip');
    await page.click('.support-control__dirs button:first-child');
    await page.waitForFunction(() => globalThis.__spellRequests.some(x => x.t === 'g.move' && x.uid === 98001 && x.dir === 'LEFT'));
    assert.match(await page.$eval('.support-control', el => el.textContent), /自带嘲讽/);
    await page.screenshot({ path: '.cache/spell-shop/full-spells-support.png' });
    await page.setViewport({ width: 844, height: 390 });
    assert.ok(await page.$eval('.shopbar__row', el => el.getBoundingClientRect().right <= innerWidth + 1));
    assert.deepEqual(errors, []);
    await page.setViewport({ width: 1600, height: 900 });
    await page.evaluate(() => globalThis.__MOCK__.mutate(S => {
      S.priv.hand = Array.from({ length: 10 }, (_, i) => ({ kind: 'item', id: 'chess_item_1_03_e_a', tier: 1, uid: 11000 + i }));
      S.priv.shop.rewardOffer = { source: 'special', label: '身份揭晓', queued: 0,
        slots: ['band_dusk', 'band_mlyss'].map(id => ({ kind: 'band', id, price: 0, spellBandChoice: true })) };
    }));
    await page.waitForSelector('.scard--band');
    assert.equal(await page.$$eval('.scard--band', xs => xs.length), 2);
    assert.match(await page.$eval('.scard--band:first-child', el => el.textContent), /墨色真颜/);
    assert.match(await page.$eval('.scard--band:nth-child(2)', el => el.textContent), /至纯凝结/);
    await page.screenshot({ path: '.cache/spell-shop/identity-desktop.png' });
    const before = await page.evaluate(() => globalThis.__spellRequests.length);
    await page.click('.scard--band:last-child'); await page.click('.scard--band:last-child');
    await page.waitForFunction(n => globalThis.__spellRequests.slice(n).some(x => x.t === 'g.reward' && x.idx === 1), {}, before);
    await page.setViewport({ width: 844, height: 390 });
    await page.screenshot({ path: '.cache/spell-shop/identity-narrow.png' });
    await page.setViewport({ width: 1600, height: 900 });
    await new Promise(resolve=>setTimeout(resolve,500));
    const echoUid = await page.evaluate(() => {
      let uid;
      globalThis.__MOCK__.mutate(S => { const p = S.priv.board.find(p => p.kind === 'chess'); p.spellEcho = 4; uid = p.uid; });
      return uid;
    });
    await page.click(`.ff-piece[data-uid="${echoUid}"]`, { button: 'right' });
    try {await page.waitForFunction(() => document.querySelector('.dpanel')?.textContent.includes('使自身已激活的所属盟约各增加 4 层'));}
    catch(error){console.log(JSON.stringify(await page.evaluate(()=>({detail:document.querySelector('.dpanel')?.textContent,board:globalThis.__MOCK__.S().priv.board}))),errors);throw error;}
    await page.screenshot({ path: '.cache/spell-shop/echo-trait.png' });
    assert.deepEqual(errors, []);
  } finally {
    await Promise.race([browser?.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
    browser?.process()?.kill();
    for (const client of srv.wss.clients || []) client.terminate();
    await srv.close();
  }
});
