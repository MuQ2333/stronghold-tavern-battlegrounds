import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDataStore } from '../../public/js/data.js';
import { HERO_BANDS } from '../../shared/heroCatalog.js';

const heroId = Object.keys(HERO_BANDS)[0];
const store = () => createDataStore({ fetch: async () => ({ ok: true, json: async () => ({ native: { id: 'native' } }) }), retryDelays: [] });

test('tavern strategies preserve the lazy data contract and do not leak inherited properties', async () => {
  const data = store();
  assert.equal(data.get('bands'), null);
  assert.equal(data.lookup('bands', heroId), null);
  assert.deepEqual(data.list('bands'), []);
  await data.load('bands');
  assert.equal(data.lookup('bands', heroId), HERO_BANDS[heroId]);
  assert.equal(data.lookup('bands', 'constructor'), null);
  assert.equal(data.list('bands').length, Object.keys(HERO_BANDS).length + 1);
});

test('room content strategies override a tavern record without duplicate roster entries; views remain supported', async () => {
  const data = store();
  await data.load('bands');
  const changed = { id: heroId, name: 'content override' };
  data.setContent({ id: 'test-set', values: { bands: { [heroId]: changed } } });
  assert.equal(data.lookup('bands', heroId), changed);
  assert.equal(data.get('bands')[heroId], changed);
  assert.equal(data.list('bands').filter(x => x.id === heroId).length, 1);
  data.setView('bands', value => ({ ...value, viewApplied: true }));
  assert.equal(data.get('bands').viewApplied, true);
  assert.equal(data.getRaw('bands').viewApplied, undefined);
  data.setContent(null);
  assert.equal(data.lookup('bands', heroId), HERO_BANDS[heroId]);
});
