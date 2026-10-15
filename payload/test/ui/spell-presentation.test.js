import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spellTarget, spellFrame, rewriteSpellText } from '../../shared/spells.js';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const items = json('../../data/items.json');
const locales = ['zh', 'en', 'ja', 'ko', 'zh-TW'];

test('spell wording preserves every effect number and rich-text tag in each shipped locale', () => {
  for (const lang of locales) {
    const translated = lang === 'zh' ? items : json(`../../data/i18n/${lang}.json`).files.items;
    const ui = lang === 'zh' ? {} : json(`../../public/i18n/${lang}.json`);
    const label = id => ui[id] || id;
    const labels = { consume: label('施放后消耗'), destroyTarget: label('施放时，目标干员和本法术销毁'), noCustom: label('无法对自编干员施放'), target: label('目标干员') };
    for (const item of Object.values(items).filter(spellTarget)) {
      const original = translated[item.id].descRaw || translated[item.id].desc;
      const out = rewriteSpellText(item, original, labels);
      assert.notEqual(out, original, `${lang} ${item.id}: equipment use wording changed`);
      assert.deepEqual(out.match(/\d+(?:\.\d+)?/g), original.match(/\d+(?:\.\d+)?/g), `${lang} ${item.id}: values preserved`);
      assert.deepEqual(out.match(/<[^>]+>/g), original.match(/<[^>]+>/g), `${lang} ${item.id}: rich text preserved`);
      if (item.id.startsWith('chess_item_5_04')) assert.ok(out.includes(labels.destroyTarget));
      else assert.ok(!out.includes(labels.consume), 'generic consumable clause is omitted');
    }
  }
});

test('equipment and native Arts keep their original text; frame rule follows the match toggle', () => {
  for (const rec of Object.values(items).filter(x => !spellTarget(x))) {
    assert.equal(rewriteSpellText(rec, rec.desc, {}), rec.desc);
  }
  const coin = items.chess_item_1_03_e_a;
  const native = Object.values(items).find(x => x.itemType === 'MAGIC');
  const equipment = Object.values(items).find(x => x.itemType === 'EQUIP' && !spellTarget(x));
  assert.equal(spellFrame(coin, false), false);
  assert.equal(spellFrame(coin, true), true);
  assert.equal(spellFrame(native, true), true);
  assert.equal(spellFrame(equipment, true), false);
});
