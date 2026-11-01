import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {growthRichText} from '../shared/growthRichText.js';
import {formatBondEffect,parseRichText,richTextPlain} from '../public/js/ui/richText.js';

test('new growth emphasis preserves words, literal triggers and existing native styles',()=>{
  const text='<获得时>攻击力+4，攻击速度+0.5%，进行I阶特殊招募。<@ba.vdown>-20%</>，<$ba.stun>眩晕</>。';
  const rich=growthRichText(text),segs=parseRichText(rich).filter(x=>!x.br);
  assert.equal(richTextPlain(rich),richTextPlain(text));
  assert.equal(growthRichText(rich),rich,'formatting twice does not nest new spans');
  for(const value of ['攻击力','+4','攻击速度','+0.5%','I'])assert.ok(segs.some(s=>s.text.includes(value)&&s.cls.includes('ba.vup')),value);
  assert.ok(segs.some(s=>s.text==='-20%'&&s.cls.includes('ba.vdown')));
  assert.ok(segs.some(s=>s.text==='眩晕'&&s.term));
  assert.match(rich,/^<获得时>/,'trigger label remains literal');
});

test('all 240 growth forms keep the exact same visible trait text and native records remain untouched',()=>{
  const before=JSON.stringify(DATA.garrisons),d=growthData(DATA,true);
  for(const row of GROWTH_ROSTER)for(const elite of [false,true]){
    const c=d.chess[row.id.replace(/_a$/,elite?'_b':'_a')];
    for(const id of c.garrisonIds){
      const g=d.garrisons[id];if(!id.startsWith('growth_'))continue;
      assert.equal(richTextPlain(g.descRaw),g.desc,`${row.name}/${elite}`);
      assert.doesNotMatch(richTextPlain(g.descRaw),/<[@$]|<\/>/,`${row.name}/${elite}: no broken style tags`);
      if(/\d/.test(g.desc))assert.ok(parseRichText(g.descRaw).some(s=>!s.br&&s.cls.includes('ba.vup')),row.name);
    }
  }
  assert.equal(JSON.stringify(DATA.garrisons),before);
  for(const id of Object.keys(DATA.garrisons))if(d.garrisons[id]===DATA.garrisons[id])assert.equal(d.garrisons[id].descRaw,DATA.garrisons[id].descRaw);
});

test('current alliance numbers stay blue, layer notes stay grey, and confirmed rules retain balanced markup',()=>{
  const d=growthData(DATA,true),text=formatBondEffect(d.bonds.yanShip,100),segs=parseRichText(text).filter(x=>!x.br);
  assert.ok(segs.some(s=>s.text==='+113%'&&s.cls.includes('ba.vup')));
  assert.ok(segs.some(s=>s.text.includes('受层数影响')&&s.cls.includes('ba.acrem')));
  assert.ok(parseRichText(d.bonds.yanShip.descRaw).some(s=>!s.br&&s.text==='3'&&s.cls.includes('autochess.dgreen')));
  assert.match(d.bonds.egirShip.descRaw,/<@ba.vup>攻击力<\/>/);
  for(const id of ['sargonShip','lateranoShip','kazimierzShip'])assert.doesNotMatch(formatBondEffect(d.bonds[id],100),/至多|有上限/);
  for(const b of Object.values(d.bonds))for(const layers of [0,999,1000,21300,1000000]){
    const rich=formatBondEffect(b,layers);
    assert.doesNotMatch(richTextPlain(rich),/<[@$]|<\/>|\{\d+:/,b.bondId);
    assert.equal(richTextPlain(rich),richTextPlain(formatBondEffect({...b,effectDescRaw:b.effectDesc},layers)),b.bondId);
  }
  assert.match(formatBondEffect(d.bonds.miraShip,100),/获得<@ba.vup>10<\/>资金/);
});
