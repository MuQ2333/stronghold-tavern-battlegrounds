import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync} from 'node:fs';

const chrome = process.env.CHROME_PATH;
test('spell preview mirrors Loadout: tier chips, filtered roster, detail, excluded spells and responsive layout', {
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
    await page.waitForSelector('.spell-preview-row');
    assert.equal(await page.$eval('.spell-preview__head h2',el=>el.textContent),'法术预览');
    const count = () => page.$$eval('.spell-preview-row', rows => rows.length);
    const initial = await count();
    assert.ok(initial > 40);
    assert.equal(await page.$$eval('.spell-preview select option', opts=>opts.some(o=>o.textContent.includes('暂不入池')||o.value==='disabled')), false);
    for (const tier of [1,2,3,4,5,6]) {
      await page.click(`.lo-chip--t${tier}`);
      await page.waitForFunction(n=>[...document.querySelectorAll('.spell-preview-row')].length>0&&[...document.querySelectorAll('.spell-preview-row')].every(r=>Number(r.dataset.tier)===n),{},tier);
      assert.equal(await page.$eval(`.lo-chip--t${tier}`,el=>el.getAttribute('aria-pressed')), 'true');
      await page.click(`.lo-chip--t${tier}`);
      await page.waitForFunction(n=>document.querySelectorAll('.spell-preview-row').length===n,{},initial);
    }
    const search = '.spell-preview__search input';
    const reset = '.spell-preview .lo-frow .btn';
    await page.type(search, '背靠背');
    await page.waitForFunction(() => document.querySelectorAll('.spell-preview-row').length === 1);
    assert.match(await page.$eval('.spell-preview-card', card => card.textContent), /4 阶[\s\S]*1 资金/);
    await page.click(reset);
    await page.type(search, '无限潜力');
    await page.waitForSelector('.spell-preview-card__choices li');
    assert.equal(await page.$$('.spell-preview-card__choices li').then(a => a.length), 2);
    await page.click(reset);
    await page.select('.spell-preview .lo-select:nth-of-type(2) select', 'all');
    const excluded = await page.evaluate(async()=>{
      const {ALL_SPELLS}=await import('/shared/spellCatalog.js');
      return ALL_SPELLS.filter(r=>r.poolDisabled).map(r=>({id:r.id,name:r.name}));
    });
    assert.ok(excluded.length>0);
    for(const rec of excluded){
      assert.equal(await page.$(`.spell-preview-row[data-spell-id="${rec.id}"]`),null);
      await page.type(search,rec.name);
      await page.waitForFunction(name=>document.querySelector('.spell-preview__search input').value===name,{},rec.name);
      assert.equal(await page.$(`.spell-preview-row[data-spell-id="${rec.id}"]`),null);
      await page.click(reset);
      await page.select('.spell-preview .lo-select:nth-of-type(2) select', 'all');
    }
    await page.click(reset);
    const dir=process.env.SPELL_PREVIEW_SCREENSHOTS||'.cache/spell-preview';
    mkdirSync(dir, {recursive:true});
    for(const [name,width,height] of [['desktop',1600,900],['zoom-150',1067,600],['narrow',844,390],['small-landscape',700,390]]){
      await page.setViewport({width,height});
      await new Promise(resolve=>setTimeout(resolve,150));
      const fits=await page.$eval('.spell-preview',el=>{
        const r=el.getBoundingClientRect(),list=el.querySelector('.lo-list');
        return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1&&list.clientHeight>60&&list.scrollWidth<=list.clientWidth+1;
      });
      assert.equal(fits,true,`${name}: viewport and roster fit`);
      assert.equal(await page.$$eval('.spell-preview-card__art img',imgs=>imgs.every(im=>{const r=im.getBoundingClientRect(),p=im.parentElement.getBoundingClientRect();return r.width<=p.width&&r.height<=p.height;})),true);
      await page.screenshot({path:`${dir}/${name}.png`});
    }
    await page.click('.spell-preview-row');
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.spell-preview__detail')).display!=='none');
    assert.equal(await page.$eval('.spell-preview .lo-roster',el=>getComputedStyle(el).display),'none');
    await page.screenshot({path:`${dir}/small-landscape-detail.png`});
    await page.click('.spell-preview .lo-detail-back');
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.spell-preview .lo-roster')).display!=='none');
    await page.setViewport({width:1600,height:900});
    const before=await page.$eval('.spell-preview-card',el=>el.dataset.spellId);
    await page.click('.spell-preview__head h2');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(id=>document.querySelector('.spell-preview-card').dataset.spellId!==id,{},before);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('.spell-preview'));
    assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('spell-preview-entry')),true);
    assert.equal(requests.some(t=>t.startsWith('g.')),false);
    assert.deepEqual(errors, []);
  } finally {
    await Promise.race([browser?.close(),new Promise(resolve=>setTimeout(resolve,3000))]);
    browser?.process()?.kill();
    for(const client of server.wss.clients||[])client.terminate();
    await server.close();
  }
});
