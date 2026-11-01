// Real browser regression for the composed upstream HUD/safe area and optional tavern state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
const chrome = process.env.CHROME_PATH;
test('tavern armor stays beside native LP and viewport recovery preserves manual screen fit', {
  skip: process.env.SP_E2E !== '1' || !chrome || !existsSync(chrome), timeout: 90000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [width, height] of [[1600, 900], [844, 390]]) {
      await page.setViewport({ width, height });
      await page.goto(`http://127.0.0.1:${srv.port}/dev/game-mock.html?phase=PREP&render=fallback&shot=1`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.shopbar');
      await page.evaluate(async () => {
        const { installViewportSupport } = await import('/js/ui/viewport.js');
        installViewportSupport(window);
        const { updateFit } = await import('/js/ui/screenFit.js');
        updateFit({ l: 40, r: 20, t: 30, b: 10 });
        globalThis.__MOCK__.mutate(s => { s.priv.armor = 8; });
      });
      for(const phase of ['PREP','COMBAT','UNITE','FINAL_ASSAULT','HIDDEN_CORE']) {
        if(phase!=='PREP')await page.evaluate(phase=>{globalThis.__MOCK__.setPhase(phase);globalThis.__MOCK__.mutate(s=>{s.priv.armor=8;});},phase);
        await page.waitForSelector('[data-testid="hero-armor"]');
        const result = await page.evaluate(() => {
          const armor = document.querySelector('[data-testid="hero-armor"]'),lp=armor.parentElement.querySelector('.lp');
          const app = document.querySelector('.app-root').getBoundingClientRect(),a=armor.getBoundingClientRect(),l=lp?.getBoundingClientRect();
          return {value:armor.textContent.trim(),adjacent:armor.previousElementSibling.classList.contains('lp'),
            inside:armor.parentElement.classList.contains('gtop__half--r'),gap:l?a.left-l.right:null,center:l?Math.abs((a.top+a.bottom-l.top-l.bottom)/2):null,
            visible:a.width>0&&a.height>0&&a.right<=innerWidth,app:[app.left,app.top,app.right,app.bottom].map(Math.round)};
        });
        assert.equal(result.value,'8');assert.equal(result.adjacent,true,`${width}/${phase}: armor follows LP`);assert.equal(result.inside,true);
        assert.ok(result.gap>=0&&result.gap<20,`${width}/${phase}: gap ${result.gap}`);assert.ok(result.center<2,`${width}/${phase}: vertical alignment`);assert.equal(result.visible,true);
        assert.deepEqual(result.app,[40,30,width-20,height-10]);
      }
      assert.ok(await page.$('[data-ui-slot="hud.right"]'), 'native plugin slot remains mounted');
      mkdirSync('.cache/integration', { recursive: true });
      await page.screenshot({ path: `.cache/integration/tavern-native-${width}.png` });
      await page.evaluate(() => globalThis.__MOCK__.mutate(s => { s.priv.armor = 0; }));
      await page.waitForFunction(() => !document.querySelector('[data-testid="hero-armor"]'));
    }
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await srv.close(); }
});
