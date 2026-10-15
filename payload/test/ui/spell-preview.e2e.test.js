import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync} from 'node:fs';

const chrome = process.env.CHROME_PATH;
test('out-of-match spell preview opens beside Loadout, filters current effects and works on narrow screens', {
  skip: process.env.SP_E2E !== '1' || !chrome || !existsSync(chrome), timeout: 90000,
}, async () => {
  const {startServer} = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const server = await startServer({port: 0, host: '127.0.0.1', quiet: true});
  let browser;
  try {
    browser = await puppeteer.launch({executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-gpu']});
    const page = await browser.newPage(), errors = [], requests = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.setViewport({width: 1600, height: 900});
    await page.goto(`http://127.0.0.1:${server.port}/`, {waitUntil: 'networkidle0'});
    await page.evaluate(async () => { const {enterSession} = await import('/js/screens/title.js'); enterSession('法术预览测试'); });
    await page.waitForSelector('.lobby-screen .spell-preview-entry');
    assert.equal(await page.$eval('[data-testid="loadout-open"]', el => el.nextElementSibling.classList.contains('spell-preview-entry')), true);
    page.on('websocket', ws => ws.on('framesent', frame => { try { requests.push(JSON.parse(frame.payload).t); } catch { /* ping payload */ } }));
    await page.click('.spell-preview-entry');
    await page.waitForSelector('.spell-preview-card[data-spell-id="hs_bg30_802"]');
    assert.equal(await page.$eval('.spell-preview__head h2',el=>el.textContent),'法术预览');
    const firstArt=await page.$eval('.spell-preview-card__art',el=>el.getBoundingClientRect().width);
    await page.setViewport({width:960,height:540});
    await page.waitForFunction(w=>document.querySelector('.spell-preview-card__art').getBoundingClientRect().width<w*.8,{},firstArt);
    await page.setViewport({width:1600,height:900});
    const texts=await page.$$eval('.spell-preview-card',cards=>Object.fromEntries(cards.map(c=>[c.querySelector('h3').textContent,c.querySelector('.spell-preview-card__effect').textContent])));
    assert.equal(texts['身份揭晓'],'发现一个新的策略，替换当前策略。');
    assert.equal(texts['拼命发掘'],'获得1资金，购买本法术将消耗生命值，而非资金。');
    assert.equal(texts['智慧球'],'你的下2次主动刷新均为有用的刷新！');
    assert.ok(!texts['支援'].includes('可调整朝向')&&!texts['支援'].includes('不参与合成'));
    assert.ok(!texts['紧急调度券'].includes('（'));assert.ok(texts['精打细算玩偶'].startsWith('使用后每回合开始时'));
    assert.ok(texts['意外之果'].includes('<购买后>'));assert.ok(!Object.values(texts).some(t=>t.includes('商店')));
    assert.equal(await page.$$eval('.spell-preview-card__art img',imgs=>imgs.every(im=>{const r=im.getBoundingClientRect(),p=im.parentElement.getBoundingClientRect();return r.width<=p.width&&r.height<=p.height;})),true);
    const initial = await page.$$eval('.spell-preview-card', cards => cards.length);
    assert.ok(initial > 40);
    assert.equal(await page.$$('.spell-preview-card__disabled').then(a => a.length), 0);
    assert.equal(await page.$$eval('.spell-preview-card', cards => cards.some(card => card.textContent.includes('金色版本'))), false);
    const search = '.spell-preview__search input';
    await page.type(search, '背靠背');
    await page.waitForFunction(() => document.querySelectorAll('.spell-preview-card').length === 1);
    assert.match(await page.$eval('.spell-preview-card', card => card.textContent), /4 阶[\s\S]*1 资金/);
    await page.click('.spell-preview__filters button');
    await page.waitForFunction(() => document.querySelector('.spell-preview__search input').value === '');
    await page.type(search, '无限潜力');
    await page.waitForSelector('.spell-preview-card__choices li');
    assert.equal(await page.$$('.spell-preview-card__choices li').then(a => a.length), 2);
    await page.click('.spell-preview__filters button');
    await page.waitForFunction(() => document.querySelector('.spell-preview__search input').value === '');
    await page.select('.spell-preview__filters label:nth-of-type(4) select', 'disabled');
    await page.waitForFunction(() => document.querySelectorAll('.spell-preview-card__disabled').length === 5);
    await page.select('.spell-preview__filters label:nth-of-type(4) select', 'all');
    assert.equal(await page.$$eval('.spell-preview-card h3', a => a.some(n => ['财富悬赏令','黄金狂潮'].includes(n.textContent))), false);
    await page.click('.spell-preview__filters button');
    mkdirSync('.cache/spell-preview', {recursive: true});
    await page.screenshot({path: '.cache/spell-preview/desktop.png'});
    await page.setViewport({width: 844, height: 390});
    await new Promise(resolve => setTimeout(resolve, 250));
    const fits = await page.$eval('.spell-preview', el => {
      const r = el.getBoundingClientRect(), list = el.querySelector('.spell-preview__list');
      return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && list.clientHeight > 60 && list.scrollWidth <= list.clientWidth;
    });
    assert.equal(fits, true);
    await page.screenshot({path: '.cache/spell-preview/narrow.png'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.spell-preview'));
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('spell-preview-entry')), true);
    assert.equal(await page.$eval('.spell-preview-entry', el => {const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}), true);
    await page.screenshot({path: '.cache/spell-preview/lobby-entry.png'});
    assert.equal(requests.some(t => t.startsWith('g.')), false);
    await page.evaluate(async () => {
      const {store} = await import('/js/store.js');
      store.set({room: {code:'TEST', hostId:store.get().me.playerId, mode:'solo', difficulty:'FUNNY', inMatch:false, seats:[], spectators:[], tavernMods:{spells:true, heroes:true}}});
    });
    await page.waitForSelector('.room-screen .spell-preview-entry');
    assert.equal(await page.$eval('.spell-preview-entry', el => {const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}), true);
    assert.equal(await page.$eval('[data-testid="loadout-open"]', el => el.nextElementSibling.classList.contains('spell-preview-entry')), true);
    await page.click('.spell-preview-entry');
    await page.waitForSelector('.spell-preview');
    await page.evaluate(async () => { const {store} = await import('/js/store.js'); store.patch('room', {inMatch:true}); });
    await page.waitForFunction(() => !document.querySelector('.spell-preview'));
    assert.deepEqual(errors, []);
  } finally {
    await Promise.race([browser?.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
    browser?.process()?.kill();
    for (const client of server.wss.clients || []) client.terminate();
    await server.close();
  }
});
