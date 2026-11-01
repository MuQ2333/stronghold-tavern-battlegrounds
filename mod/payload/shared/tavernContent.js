// Built-in host capabilities for imported Tavern data. No workshop code is executed.
import { HERO_BANDS } from './heroCatalog.js';
import { heroPowerId } from './heroPowers.js';
import { ruleOption } from './plugins/rules.js';

/** Explicit room choices win; declarations only supply an omitted option. */
export function tavernOptions(opts = {}) {
  return {
    spells: typeof opts.spellShop === 'boolean' ? opts.spellShop : ruleOption(opts.rules, 'spellShop') === 'separate',
    heroes: typeof opts.heroMod === 'boolean' ? opts.heroMod : ruleOption(opts.rules, 'tavernHeroes') === 'enabled',
  };
}

/** A selected, namespaced hero catalogue is authoritative, including deliberate omissions. */
export function tavernBands(records = {}, enabled = true) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
  const entries = Object.entries(records);
  if (!enabled) return entries.some(([, rec]) => heroPowerId(rec))
    ? Object.fromEntries(entries.filter(([, rec]) => !heroPowerId(rec))) : records;
  if (entries.some(([id, rec]) => id.startsWith('band_x_') && heroPowerId(rec))) {
    return Object.fromEntries(entries.filter(([id]) => !Object.hasOwn(HERO_BANDS, id)));
  }
  // Keep native/source iteration order as well as its translated records; append only missing fallbacks.
  return { ...records, ...Object.fromEntries(Object.entries(HERO_BANDS).filter(([id]) => !Object.hasOwn(records, id))) };
}
