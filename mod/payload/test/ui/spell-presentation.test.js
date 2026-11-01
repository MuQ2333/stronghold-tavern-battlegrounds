import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spellTarget, spellFrame, rewriteSpellText, amplifiedSpellText } from '../../shared/spells.js';
import {ALL_SPELLS} from '../../shared/spellCatalog.js';
import {richTextPlain} from '../../public/js/ui/richText.js';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const items = json('../../data/items.json');
const locales = ['zh', 'en', 'ja', 'ko', 'zh-TW'];

test('live spell text changes only positive layer amounts and preserves exact assignments, costs and repetitions',()=>{
  const spell=name=>ALL_SPELLS.find(s=>s.name===name),text=(name,bonus=3)=>richTextPlain(amplifiedSpellText(spell(name),spell(name).descRaw,bonus));
  assert.match(text('富足之杖'),/层数\+4/);
  assert.match(text('赢家的面包'),/层数\+6.*层数额外\+9/);
  assert.match(text('海鲜乱炖'),/层数\+4.*额外重复一次/);
  assert.match(text('背靠背'),/层数\+4.*每施放一次.*额外执行一次/);
  assert.match(text('森林秘宝'),/层数\+11.*层数\+5/);
  assert.match(text('回响咆哮'),/层数\+5/);
  for(const name of ['完美形象','快速浏览','武器锻造','新生幼苗','护甲储备','拼命发掘'])assert.equal(text(name),spell(name).descRaw);
  assert.equal(text('富足之杖',0),spell('富足之杖').descRaw);
});

test('native layer-coin spell amounts update in all official locales and Forge-style text without changing other equipment',()=>{
  for(const lang of locales)for(const grade of ['a','b']) {
    const id=`chess_item_1_04_e_${grade}`,rec=items[id],translated=lang==='zh'?rec:json(`../../data/i18n/${lang}.json`).files.items[id];
    const original=translated.descRaw,changed=amplifiedSpellText(rec,original,3);
    assert.notEqual(changed,original,`${lang}/${grade}`);
    assert.deepEqual(changed.match(/\d+(?:\.\d+)?/g),original.match(/\d+(?:\.\d+)?/g).map(n=>String(Number(n)+3)));
    assert.deepEqual(changed.match(/<[^>]+>/g),original.match(/<[^>]+>/g));
  }
  const rec=items.chess_item_1_04_e_a;
  assert.equal(richTextPlain(amplifiedSpellText(rec,'使目标干员所属盟约层数+3',4)),'使目标干员所属盟约层数+7');
  for(const rec of Object.values(items).filter(x=>!spellTarget(x)))assert.equal(amplifiedSpellText(rec,rec.descRaw,3),rec.descRaw);
});

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
