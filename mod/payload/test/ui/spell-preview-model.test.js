import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spellPreviewRoster, filterSpellPreview } from '../../public/js/ui/spellPreviewModel.js';
import { readFileSync } from 'node:fs';
import { ALL_SPELLS } from '../../shared/spellCatalog.js';

test('preview cannot reveal unavailable spells through All, tier or name searches', () => {
  const roster = spellPreviewRoster(JSON.parse(readFileSync(new URL('../../data/items.json', import.meta.url))));
  const disabled = ALL_SPELLS.filter(rec => rec.poolDisabled);
  assert.ok(disabled.length > 0);
  assert.ok(roster.length > 0);
  for (const rec of disabled) {
    assert.ok(!roster.some(row => row.id === rec.id));
    for (const availability of ['all', 'active', 'special', 'disabled']) {
      assert.equal(filterSpellPreview([rec], { availability, query: rec.name, tier: rec.tier }).length, 0);
    }
  }
});

test('tier and effect search compose while special variants remain inspectable', () => {
  const roster = spellPreviewRoster(JSON.parse(readFileSync(new URL('../../data/items.json', import.meta.url))));
  for (const tier of [1, 2, 3, 4, 5, 6]) {
    const rows = filterSpellPreview(roster, { tier, availability: 'all' });
    assert.ok(rows.length > 0);
    assert.ok(rows.every(rec => rec.tier === tier));
  }
  const golden = roster.find(rec => rec.isGolden);
  assert.ok(golden);
  assert.ok(filterSpellPreview(roster, { query: golden.name, availability: 'special' }).some(rec => rec.id === golden.id));
});
