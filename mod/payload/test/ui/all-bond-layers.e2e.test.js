import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from '../e2e/client.mjs';

const enabled = process.env.SP_E2E === '1' && !!process.env.CHROME_PATH;
test('all twenty stack-bearing alliances update their own badges in combat, while four no-stack entries stay hidden', { skip: !enabled, timeout: 90000 }, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox','--mute-audio'] });
  const page = await browser.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  const out = '.cache/all-layer-browser'; fs.mkdirSync(out, { recursive: true });
  try {
    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(`${srv.url}/dev/game-mock.html?phase=COMBAT&render=fallback&shot=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.gm__bonds .bond__count');
    const cases = await page.evaluate(async () => {
      const { data } = await import('/js/data.js'); data.setGrowthMode(true);
      const mock = globalThis.__MOCK__; clearInterval(mock.S().battle.timer);
      mock.mutate(s => { s.pub.growthMode = true; s.pub.disabledBonds = []; });
      return data.list('bonds').map(b => ({ id: b.bondId, name: b.name, noStack: !!b.noStack }));
    });
    assert.equal(cases.filter(x => !x.noStack).length, 20); assert.equal(cases.filter(x => x.noStack).length, 4);
    const results = [];
    for (const [i, rec] of cases.entries()) {
      const value = 21300 + i * 100;
      await page.evaluate(async ({ id, value }) => {
        const { net } = await import('/js/net.js'); const state = globalThis.__MOCK__.store.get();
        net._emit('b.snap', { t: 'b.snap', fieldId: state.match.field.fieldId, gt: value, units: [], killed: 0, total: 9, bondLayers: { [state.me.playerId]: { [id]: value } } });
      }, { id: rec.id, value });
      if (rec.noStack) {
        await page.waitForFunction(id => !document.querySelector(`[data-bond="${id}"] .bond__count`), {}, rec.id);
      } else {
        await page.waitForFunction(({ id, value }) => document.querySelector(`[data-bond="${id}"] .bond__count`)?.title === String(value), {}, { id: rec.id, value });
        const text = await page.$eval(`[data-bond="${rec.id}"] .bond__count`, el => el.textContent);
        assert.equal(text, `${(value / 1000).toFixed(1)}k`, rec.id);
        await page.$eval(`[data-bond="${rec.id}"] button.bond`, el => el.click());
        await page.waitForFunction(name => document.querySelector('.bpop__name')?.textContent === name, {}, rec.name);
        const descriptions = await page.evaluate(async ({ id, value }) => {
          const { data } = await import('/js/data.js'), { growthBondDescription } = await import('/shared/growthBondDescriptions.js');
          const { richTextPlain } = await import('/js/ui/richText.js');
          const b = data.lookup('bonds', id), sections = document.querySelectorAll('.bpop__sec .bpop__desc');
          const clean = s => s.replace(/\s+/g,'');
          return { rule: clean(sections[1]?.textContent || ''), expectedRule: clean(richTextPlain(b.desc)),
            current: clean(sections[0]?.textContent || ''), expectedCurrent: clean(richTextPlain(growthBondDescription(b, value))),
            scaled:!!b.effectDescParams?.length,blue:sections[0]?.querySelectorAll('.rt-vup').length||0 };
        }, { id: rec.id, value });
        if (rec.id !== 'investShip') assert.equal(descriptions.current, descriptions.expectedCurrent, `${rec.id} current`);
        if (rec.id !== 'investShip') assert.equal(descriptions.rule, descriptions.expectedRule, `${rec.id} formula`);
        if(descriptions.scaled)assert.ok(descriptions.blue>0,`${rec.id} keeps blue layer-dependent values`);
        if (rec.id === 'sargonShip') await page.screenshot({ path: `${out}/sargon-unified-description.png` });
        await page.click('.bpop__close');
        results.push({ ...rec, value, text, descriptions });
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${out}/all-alliances.json`, JSON.stringify(results, null, 2));
    await page.screenshot({ path: `${out}/all-alliances-last.png` });
  } catch (error) { await page.screenshot({ path: `${out}/all-alliances-failure.png` }).catch(() => {}); throw error; }
  finally { await browser.close(); await srv.close(); }
});

test('real imported Forge packs preserve simultaneous Kazimierz/Indom growth through an isolated host and watch resync', {
  skip: !enabled || !process.env.SP_FORGE_PLUGINS_DIR, timeout: 120000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const old = process.env.SP_TEST_MODE; process.env.SP_TEST_MODE = '1'; let srv;
  try { srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, seedFn: () => 3, pluginsDir: process.env.SP_FORGE_PLUGINS_DIR,
    matchHost: { matchOptions: { clientCombat: false, botRehearsal: 0 } } }); }
  finally { if (old === undefined) delete process.env.SP_TEST_MODE; else process.env.SP_TEST_MODE = old; }
  const c = new Client(puppeteer, srv.url, 'ForgeLayers', { w: 1600, h: 900 });
  const out = '.cache/all-layer-browser'; fs.mkdirSync(out, { recursive: true });
  try {
    await c.open(); await c.enter('ForgeLayers'); await c.click('.mode-card','独立模拟'); await c.click('.diff-card','险境模拟');
    await c.page.waitForSelector('[data-testid="create-test"] input'); await c.page.click('[data-testid="create-test"] input');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="create-test"] input')?.checked);
    await c.click('.create-box button','开始独立模拟'); await c.waitFor(s => !!s.room?.code,'room');
    await c.page.evaluate(async () => { const { net } = await import('/js/net.js');
      await net.request('room.setTavernMods',{ mods: { growth: true, spells: true, heroes: true } });
      await net.request('room.setPlugins',{ plugins: ['hero-strategies','spell-shop','hero-strategies-look'].map(id => ({ id })) });
    });
    await c.click('.room-bar__right button','开始模拟'); await c.waitFor(s => s.phase === 'INFO_CHECK','briefing');
    await c.click('.brief__foot .btn--primary','准备就绪'); await c.waitFor(s => s.phase === 'BAND_DRAFT','draft');
    await c.page.evaluate(async () => { const { net } = await import('/js/net.js'); await net.request('g.test',{ cmd: 'phase', args: { name: 'battleCheck' } }); });
    await c.waitFor(s => s.phase === 'PREP','prep');
    const setup = await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js'), { data } = await import('/js/data.js'), { deployMap } = await import('/js/ui/gameLogic/placement.js');
      await net.request('g.test',{ cmd: 'timers', args: { on: false } });
      await net.request('g.test',{ cmd: 'chess', args: { id: 'chess_char_2_12_a' } });
      const state = () => globalThis.__SP__.store.get(), p = state().match.private;
      const piece = [...p.hand,...p.temp].find(p => p?.id === 'chess_char_2_12_a');
      if (!piece) throw new Error('Gravel was not acquired');
      const stage = data.lookup('stages',state().match.public.stageId); let moved = false;
      for (const [key, kind] of deployMap(stage)) {
        if (kind !== 'melee') continue;
        const [row,col] = key.split(',').map(Number);
        try { await net.request('g.move',{ uid: piece.uid, to: { area: 'board', row, col } }); moved = true; break; } catch { /* another legal tile */ }
      }
      if (!moved) throw new Error('Gravel could not deploy');
      for (const id of ['kazimierzShip','indomShip']) {
        try { await net.request('g.test',{ cmd: 'bond', args: { id, layers: 999 } }); }
        catch (error) { throw new Error(`${id}: ${error.code} ${error.detail || error.message}; growth=${state().match.public.growthMode}`, { cause: error }); }
      }
      await net.request('g.test',{ cmd: 'enemies', args: { hp: 1000000, atk: 0, speed: 0 } });
      globalThis.__forgeLayerFrames = []; net.on('b.snap',m => { if(m.bondLayers) globalThis.__forgeLayerFrames.push(m); });
      return { cs: state().room.content.cs, rules: state().room.content.rules, growth: state().match.public.growthMode };
    });
    assert.ok(setup.growth && setup.cs && setup.rules.spellShop === 'separate');
    await c.page.evaluate(async () => { const { net } = await import('/js/net.js'); await net.request('g.test',{ cmd: 'phase', args: { name: 'combat' } }); });
    await c.waitFor(s => s.phase === 'COMBAT','combat');
    // A network callback can precede Preact's paint. Capture matching DOM/frame values atomically after that paint.
    const shownHandle = await c.page.waitForFunction(() => {
      const s = globalThis.__SP__.store.get(), pid = s.me.playerId, frame = globalThis.__forgeLayerFrames.at(-1);
      const layers = Object.fromEntries(['kazimierzShip','indomShip'].map(id => [id,Number(document.querySelector(`[data-bond="${id}"] .bond__count`)?.title)]));
      if (!Object.entries(layers).every(([id,n]) => n > 999 && n === frame?.bondLayers?.[pid]?.[id])) return false;
      return { phase: s.match.public.phase, frame, pid, fieldId: s.match.field.fieldId, layers };
    });
    const shown = await shownHandle.jsonValue(); await shownHandle.dispose();
    assert.equal(shown.phase,'COMBAT');
    await c.page.$eval('[data-bond="indomShip"] button.bond',e=>e.click());
    await c.page.waitForSelector('.bpop__sec--now .rt-vup');
    assert.equal(await c.page.$eval('.bpop__sec--now .rt-vup',e=>getComputedStyle(e).color),'rgb(63, 182, 255)');
    assert.ok(await c.page.$('.bpop__sec--now .rt-note'),'Forge current layer note stays grey');
    await c.page.click('.bpop__close');
    await c.page.waitForFunction(async()=>{
      const {metricArchive}=await import('/js/battle/metricArchive.js');
      return metricArchive.sessions()[0]?.battles[0]?.record.rows.length>0;
    });
    await c.page.click('.gm__metrics');
    await c.page.waitForSelector('.combat-metrics__archive');
    const stats=await c.page.evaluate(async()=>{
      const {metricArchive}=await import('/js/battle/metricArchive.js');
      const s=metricArchive.sessions()[0];return {cs:s.cs,round:s.battles[0].round,rows:s.battles[0].record.rows,selects:document.querySelectorAll('.combat-metrics__archive select').length};
    });
    assert.equal(stats.cs,setup.cs);assert.ok(stats.rows.length>0);assert.equal(stats.selects,3);
    await c.page.screenshot({path:`${out}/forge-growth-metrics.png`});
    await c.page.click('.combat-metrics__close');
    for (const id of Object.keys(shown.layers)) assert.equal(shown.layers[id],shown.frame.bondLayers[shown.pid][id]);
    await c.page.screenshot({ path: `${out}/real-forge-dual-layers.png` });
    const count = await c.page.evaluate(() => globalThis.__forgeLayerFrames.length);
    await c.page.evaluate(async fieldId => { const { net } = await import('/js/net.js'); await net.request('g.watch',{ fieldId }); },shown.fieldId);
    await c.page.waitForFunction(n => globalThis.__forgeLayerFrames.length > n,{},count);
    await c.page.waitForFunction(layers => Object.entries(layers).every(([id,n]) => Number(document.querySelector(`[data-bond="${id}"] .bond__count`)?.title) >= n),{},shown.layers);
    const last = await c.page.evaluate(() => globalThis.__forgeLayerFrames.at(-1));
    for (const id of Object.keys(shown.layers)) assert.ok(last.bondLayers[shown.pid][id] >= shown.layers[id]);
    // Settle is held by the test room: no more live samples can mask a missing reconnect replay.
    await c.waitFor(s=>s.phase==='SETTLE','settle');
    await c.page.waitForFunction(async()=>{const {metricArchive}=await import('/js/battle/metricArchive.js');return metricArchive.sessions()[0]?.battles.at(-1)?.done;});
    const finalKey=await c.page.evaluate(async()=>{const {metricArchive}=await import('/js/battle/metricArchive.js');return metricArchive.sessions()[0].key;});
    await c.page.evaluate(()=>window.addEventListener('pagehide',()=>localStorage.removeItem('sp.growthCombatArchive.v1'),{once:true}));
    await c.page.reload({waitUntil:'domcontentloaded'});
    await c.page.waitForFunction(async key=>{const {metricArchive}=await import('/js/battle/metricArchive.js');return metricArchive.sessions().find(s=>s.key===key)?.battles.at(-1)?.done;},{timeout:30000},finalKey);
    fs.writeFileSync(`${out}/real-forge-dual-layers.json`, JSON.stringify({ setup, shown, resync: last, problems: c.problems }, null, 2));
    assert.ok(!c.problems.some(e => /pageerror:|console:/.test(e)),JSON.stringify(c.problems));
  } catch (error) {
    await c.page?.screenshot({ path: `${out}/real-forge-failure.png` }).catch(() => {});
    fs.writeFileSync(`${out}/real-forge-failure.json`,JSON.stringify({ error:String(error), state:await c.st().catch(() => null), text:await c.page?.evaluate(() => document.body.innerText).catch(() => ''), problems:c.problems },null,2)); throw error;
  } finally { await c.close(); await srv.close(); }
});
