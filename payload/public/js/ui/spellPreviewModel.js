import { ALL_SPELLS } from '../../../shared/spellCatalog.js';
import { spellTarget, rewriteSpellText } from '../../../shared/spells.js';
import { richTextPlain } from './richText.js';
import { t } from '../../../shared/i18n.js';

// Read the same definitions as the shop. Previewing never needs a match or changes its state.
export function spellPreviewRoster(items) {
  const records = new Map(Object.values(items || {}).filter(rec => spellTarget(rec)).map(rec => [rec.id, rec]));
  for (const rec of ALL_SPELLS) records.set(rec.id, rec);
  return [...records.values()].sort((a, b) => a.tier - b.tier || a.price - b.price || a.id.localeCompare(b.id));
}

export function spellPreviewText(rec) {
  return rewriteSpellText(rec, rec?.descRaw || rec?.desc || '', {
    consume: t('施放后消耗'), destroyTarget: t('施放时，目标干员和本法术销毁'),
    noCustom: t('无法对自编干员施放'), target: t('目标干员'),
  });
}

export function filterSpellPreview(records, { query = '', tier = '', target = '', availability = 'active' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return records.filter(rec => (!tier || rec.tier === Number(tier))
    && (!target || spellTarget(rec) === target)
    && (availability === 'all' || (availability === 'disabled' ? rec.poolDisabled
      : availability === 'special' ? rec.isGolden : !rec.poolDisabled && !rec.isGolden))
    && (!needle || [rec.name, richTextPlain(spellPreviewText(rec)), ...(rec.choices || [])].join(' ').toLocaleLowerCase().includes(needle)));
}
