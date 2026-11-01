import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from '../e2e/client.mjs';

test('lobby catalog toggles both versions, previews layers, folds interaction notes and follows room rules', {
  skip:process.env.SP_E2E !== '1' || !process.env.CHROME_PATH, timeout:120000,
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const srv = await startServer({port:0,host:'127.0.0.1',quiet:true});
  const c = new Client(puppeteer,srv.url,'Catalog',{w:1600,h:900});
  try {
    await c.open(); await c.enter('Catalog');
    await c.page.click('[data-testid="loadout-open"]');
    await c.page.waitForSelector('.lo-card');
    await c.page.click('[data-testid="catalog-growth"]');
    await c.page.waitForFunction(() => document.querySelector('[data-testid="catalog-growth"]')?.getAttribute('aria-pressed') === 'true');
    const select = async name => {
      await c.page.$eval('.lo-search input',(e,name) => { e.value=name; e.dispatchEvent(new Event('input',{bubbles:true})); },name);
      await c.page.waitForFunction(name => [...document.querySelectorAll('.lo-card__pick')].some(e => e.title === name),{},name);
      await c.page.$eval('.lo-card__pick',e => e.click());
      await c.page.waitForFunction(name => document.querySelector('.lo-dhead__name')?.textContent === name,{},name);
    };
    await select('风笛');
    assert.match(await c.page.$eval('.lo-garrisons',e => e.textContent),/战后保留/);
    assert.ok(await c.page.$('.lo-garrisons .rt-vup'),'growth trait has blue emphasis');
    assert.ok(await c.page.$('.lo-card--t3'));
    const globalTier = await c.page.evaluate(async () => { const {data}=await import('/js/data.js'); return data.list('chess').find(c => c.name === '风笛' && !c.isGolden).tier; });
    assert.equal(globalTier,4,'catalog does not change live mode');
    await c.page.click('.lo-seg[aria-label="技能等级"] [role="tab"]:last-child');
    assert.match(await c.page.$eval('.lo-garrisons',e => e.textContent),/精锐装备/);
    await c.page.click('[data-testid="catalog-native"]');
    await c.page.waitForSelector('.lo-card--t4');
    assert.doesNotMatch(await c.page.$eval('.lo-garrisons',e => e.textContent),/战后保留/);
    await c.page.click('[data-testid="catalog-growth"]');
    for(const name of ['伺夜','流星','寒檀','耀骑士临光']){
      await select(name);
      for(const which of ['first','last']){
        await c.page.click(`.lo-seg[aria-label="技能等级"] [role="tab"]:${which}-child`);
        await c.page.waitForFunction(()=>document.querySelectorAll('.lo-garrisons > .dgarrison').length===1);
        const text=await c.page.$eval('.lo-garrisons',e=>e.textContent);
        if(['伺夜','流星'].includes(name))assert.equal(text.split('造成的伤害变为弱点伤害').length-1,1);
      }
    }
    await select('魔王');
    assert.match(await c.page.$eval('.lo-garrisons',e=>e.textContent),/〈购买时〉/);
    assert.doesNotMatch(await c.page.$eval('.lo-garrisons',e=>e.textContent),/〈获得时〉/);
    assert.match(await c.page.$eval('.lo-alliance-effects',e=>e.textContent),/<在场3名[^\n]+你通过吞噬获得的主盟约层数会全部转为【卡兹戴尔】/);
    await select('蓝毒');
    assert.ok(await c.page.$('.lo-card--t2'));
    assert.match(await c.page.$eval('.lo-garrisons',e=>e.textContent),/被击倒时.*阿戈尔/s);
    assert.match(await c.page.$eval('.lo-garrisons',e=>e.textContent),/本干员可以部署在地面上/);
    const blueArt=await c.page.evaluate(()=>[...document.querySelectorAll('img')].filter(e=>e.src.includes('char_129_bluep')).map(e=>({ok:e.complete&&e.naturalWidth>0,src:e.src})));
    assert.ok(blueArt.some(e=>e.ok),JSON.stringify(blueArt));
    await select('幽灵鲨');
    assert.match(await c.page.$eval('.lo-garrisons',e=>e.textContent),/战斗中.*生命值首次降为1.*身前/s);
    await select('斯卡蒂');
    assert.doesNotMatch(await c.page.$eval('.lo-alliance-effects',e=>e.textContent),/坚守/);
    await select('深巡');
    assert.equal(await c.page.$eval('.dgarrison__notes',e => e.open),false);
    assert.ok((await c.page.$eval('.lo-garrisons > .dgarrison > .dgarrison__text',e => e.textContent)).length < 65);
    await c.page.$eval('.dgarrison__notes summary',e => e.click());
    assert.match(await c.page.$eval('.dgarrison__notes',e => e.textContent),/不复制装备/);
    await c.page.$eval('.lo-layer-preview input',e => {e.value='1000';e.dispatchEvent(new Event('input',{bubbles:true}));});
    await c.page.waitForFunction(() => document.querySelector('.lo-alliance__preview')?.textContent.includes('1000层'));
    assert.match(await c.page.$eval('.lo-alliance-effects',e => e.textContent),/1035%/);
    assert.doesNotMatch(await c.page.$eval('.lo-alliance-effects',e => e.textContent),/×层数|倍率为|人档：/);
    assert.match(await c.page.$eval('.lo-alliance-effects',e => e.textContent),/攻击力\+1035%（受层数影响）/);
    const color=await c.page.evaluate(()=>{
      const section=document.querySelector('.lo-alliance__preview');
      const value=[...section.querySelectorAll('.rt-vup')].find(e=>e.textContent.includes('1035%'));
      const note=[...section.querySelectorAll('.rt-note')].find(e=>e.textContent.includes('受层数影响'));
      return {value:value?.textContent,color:value&&getComputedStyle(value).color,note:note?.textContent};
    });
    assert.equal(color.value,'+1035%');assert.equal(color.color,'rgb(63, 182, 255)');assert.ok(color.note);
    fs.mkdirSync('.cache/catalog-browser',{recursive:true});
    await c.page.screenshot({path:'.cache/catalog-browser/desktop.png'});
    await c.page.setViewport({width:844,height:390});
    await c.page.click('.lo-detail-back');
    const fits = await c.page.$eval('.lo-catalog-mode',e => {const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth;});
    assert.ok(fits);
    await c.page.screenshot({path:'.cache/catalog-browser/narrow.png'});
    await c.page.setViewport({width:1600,height:900});
    await c.page.click('.lo-back');
    await c.createCoop();
    await c.waitFor(s => !!s.room?.code,'room');
    await c.page.evaluate(async () => {const {openLoadout}=await import('/js/screens/loadout.js');openLoadout('room');});
    await c.page.waitForSelector('.lo-card');
    assert.equal(await c.page.$('[data-testid="catalog-growth"]'),null);
    await select('风笛');
    assert.ok(await c.page.$('.lo-card--t4'));
    await c.page.click('.lo-back');
    const switchVersion=async version=>{
      const result=await c.page.evaluate(async version=>{const {net}=await import('/js/net.js');return net.request('room.proposeVersion',{version});},version);
      assert.equal(result.t,'ok',JSON.stringify(result));
      await c.page.waitForFunction(version=>globalThis.__SP__.store.get().room?.version===version,{},version);
    };
    await switchVersion('act1autochess');
    await c.page.waitForFunction(()=>[...document.querySelectorAll('[data-tavern-mod] input')].every(e=>e.disabled&&!e.checked));
    assert.match(await c.page.$eval('.tavern-mods',e=>e.textContent),/仅适用于第二期下半/);
    const rawFirst=await c.page.evaluate(async()=>{const {data}=await import('/js/data.js');return {hasBlue:data.list('chess').some(c=>c.charId==='char_129_bluep'),same:data.get('chess')===data.getRaw('chess')};});
    assert.equal(rawFirst.hasBlue,false);assert.equal(rawFirst.same,true);
    assert.deepEqual(c.problems,[]);
  } finally { await c.close(); await srv.close(); }
});
