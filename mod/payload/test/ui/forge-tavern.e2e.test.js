// Real imported Forge plugins, real socket/isolated match host, real browser UI; no mock views.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from '../e2e/client.mjs';

const chrome = process.env.CHROME_PATH;
const pluginsDir = process.env.SP_FORGE_PLUGINS_DIR;
for (const growthMode of [false, true]) test(`Forge Tavern plugins: ${growthMode ? 'tavern mode' : 'native mode'} selects namespaced heroes, uses power/spell and completes an isolated match`, {
  skip: process.env.SP_E2E !== '1' || !pluginsDir || !chrome || !fs.existsSync(chrome), timeout: 240000,
}, async t => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, pluginsDir,
    matchHost: { virtualTime: true, matchOptions: { clientCombat: false, botRehearsal: 0, timerScale: 0.01 } } });
  const c = new Client(puppeteer, srv.url, 'ForgeTavern', { w: 1600, h: 900 });
  const out = '.cache/forge-host-browser'; fs.mkdirSync(out, { recursive: true });
  try {
    await c.open(); await c.enter('ForgeTavern');
    await c.createCoop();
    await c.waitFor(s => !!s.room?.code, 'room');
    const apply = await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js');
      return net.request('room.setPlugins', { plugins: ['hero-strategies', 'spell-shop', 'hero-strategies-look'].map(id => ({ id })) });
    });
    assert.equal(apply.t, 'ok', JSON.stringify(apply));
    await c.page.waitForFunction(() => {
      const r = globalThis.__SP__.store.get().room;
      return r?.content?.rules?.spellShop === 'separate' && r?.content?.rules?.tavernHeroes === 'enabled';
    });
    if (growthMode) {
      const toggle=await c.page.evaluate(async()=>{
        const {net}=await import('/js/net.js');
        return net.request('room.setTavernMods',{mods:{spells:true,heroes:true,growth:true}});
      });
      assert.equal(toggle.t,'ok');
      await c.page.waitForFunction(()=>globalThis.__SP__.store.get().room?.tavernMods?.growth===true);
    }
    await c.click('.room-bar__right button', '开始模拟');
    await c.waitFor(s => s.phase === 'INFO_CHECK', 'briefing');
    await c.click('.brief__foot .btn--primary', '准备就绪');
    await c.waitFor(s => s.phase === 'BAND_DRAFT', 'draft');
    await c.page.waitForSelector('[data-band="band_x_hero_strategies_band_hs_hollidae"]');
    assert.equal((await c.page.$$('[data-band="band_hs_hollidae"]')).length, 0, 'no duplicate built-in hero');
    await c.page.click('[data-band="band_x_hero_strategies_band_hs_hollidae"]');
    await c.click('.draft-detail__btns .btn--primary', '确认选择');
    await c.waitFor(s => s.phase === 'PREP', 'prep');
    await c.page.waitForSelector('.hero-power__toggle.is-available');
    await c.page.waitForSelector('.shopbar__spells');
    await c.page.waitForFunction(() => !document.querySelector('.pbanner'));
    await c.page.waitForFunction(() => !document.querySelector('.gm__loading'), { timeout: 60000 });
    const initial = await c.page.evaluate(() => {
      const s = globalThis.__SP__.store.get();
      return { cs: s.room.content.cs, funds: s.match.private.funds, band: s.match.private.bandId,
        layout: s.match.private.shop.layout, hero: s.match.private.heroPower.id };
    });
    assert.equal(initial.hero, 'hollidae');
    assert.equal(initial.layout.spell, 1);
    await c.page.click('.hero-power__toggle');
    await c.page.waitForFunction(() => globalThis.__SP__.store.get().match.private.heroPower.used === true);
    assert.equal(await c.page.evaluate(() => globalThis.__SP__.store.get().match.private.funds), initial.funds - 1);
    const cast = await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js');
      const { spellTarget } = await import('/shared/spells.js');
      const { data } = await import('/js/data.js');
      const state = () => globalThis.__SP__.store.get().match.private;
      const spell = [...state().hand, ...state().temp].find(p => p?.kind === 'item' && spellTarget(data.lookup('items', p.id)));
      if (!spell) return { error: 'no hero spell' };
      const target = spellTarget(data.lookup('items', spell.id));
      let targetUid = null;
      if (target === 'chess') {
        const slot = state().shop.slots.findIndex(p => p?.kind === 'chess' && !p.sold && p.price <= state().funds);
        if (slot < 0) return { error: 'no affordable operator' };
        const bought = await net.request('g.buy', { slot, expectedId: state().shop.slots[slot].id });
        if (bought.t !== 'ok') return bought;
        await new Promise(resolve => setTimeout(resolve, 150));
        targetUid = [...state().hand, ...state().temp].find(p => p?.kind === 'chess')?.uid;
      }
      return net.request('g.castSpell', { itemUid: spell.uid, targetUid });
    });
    assert.equal(cast.t, 'ok', JSON.stringify(cast));
    // Exercise the new drop region through the real imported-pack host, not a local mock sale.
    const trade=await c.page.evaluate(async()=>{
      const {net}=await import('/js/net.js');
      const state=()=>globalThis.__SP__.store.get().match.private;
      let piece=[...state().hand,...state().temp].find(p=>p?.kind==='chess'&&!p.spellLocked);
      if(!piece) {
        const slot=state().shop.slots.findIndex(s=>s?.kind==='chess'&&!s.sold&&s.price<=state().funds);
        if(slot<0)return null;
        await net.request('g.buy',{slot});
        piece=[...state().hand,...state().temp].find(p=>p?.kind==='chess'&&!p.spellLocked);
      }
      return piece?{uid:piece.uid,before:state().funds,price:piece.sellPrice ?? 1}:null;
    });
    assert.ok(trade,'the real Forge match owns a tradeable operator');
    const from=await c.piecePoint(trade.uid);assert.ok(from);
    await c.page.mouse.move(from.x,from.y);await c.page.mouse.down();await c.page.mouse.move(from.x+14,from.y-14,{steps:4});
    await c.page.waitForSelector('.quick-trade');
    const target=await c.page.$eval('.quick-trade',el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
    await c.page.mouse.move(target.x,target.y,{steps:12});await c.page.waitForSelector('.quick-trade.is-over');
    await c.page.screenshot({path:path.join(out,'real-imported-quick-sale.png')});await c.page.mouse.up();
    await c.page.waitForFunction(uid=>{const p=globalThis.__SP__.store.get().match.private;return ![...p.board,...p.hand,...p.temp].some(x=>x?.uid===uid);},{},trade.uid);
    trade.after=await c.page.evaluate(()=>globalThis.__SP__.store.get().match.private.funds);
    assert.ok(trade.after>=trade.before+trade.price,'sale funds come back from the isolated server');
    await c.page.screenshot({ path: path.join(out, 'real-imported-prep.png') });
    // Actual AI takeover drives the remaining decisions. The host advances virtual time with the real sim;
    // no LP, economy, wave or result is replaced, and this is explicitly the server-run combat path.
    const takeover = await c.page.evaluate(async () => {
      const { net } = await import('/js/net.js'); return net.request('g.autoplay', { on: true });
    });
    assert.equal(takeover.t, 'ok');
    await c.waitFor(s => s.result, 'real result', 120000);
    const result = await c.page.evaluate(() => globalThis.__SP__.store.get().match.result);
    assert.ok(result);
    assert.ok(!c.problems.some(e => /pageerror:|console:/.test(e)), JSON.stringify(c.problems));
    const report = { initial, cast, trade, result, problems: c.problems, transport: 'isolated process', combat: 'server real sim / virtual clock' };
    fs.writeFileSync(path.join(out, growthMode ? 'report-growth.json' : 'report.json'), JSON.stringify(report, null, 2));
    t.diagnostic(JSON.stringify({ band: initial.band, cs: initial.cs, result: result.roundsPassed ?? result.summary?.roundsPassed }));
  } catch (e) {
    await c.page?.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    const state = await c.page?.evaluate(() => ({ state: globalThis.__SP__?.store.get(), text: document.body.innerText })).catch(() => null);
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ error: String(e), state, problems: c.problems }, null, 2));
    throw e;
  } finally { await c.close(); await srv.close(); }
});
