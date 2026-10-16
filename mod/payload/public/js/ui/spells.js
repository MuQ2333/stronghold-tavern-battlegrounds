import { spellTarget, rewriteSpellText } from '../../../shared/spells.js';
import { t } from '../../../shared/i18n.js';
import { store } from '../store.js';
// The current match, not a process-wide installed-pack list, decides the UI rule.
export function itemSpellTarget(rec) {
  return store.get().match?.private?.shop?.spellShop ? spellTarget(rec) : null;
}

export function spellRoundBlocked(rec) {
  const shop = store.get().match?.private?.shop;
  return !!(shop?.spellShop && rec?.oncePerRound && shop.spellUsed?.includes(rec.id));
}

export function itemEffectText(rec) {
  const text = rec?.descRaw || rec?.desc || '';
  return itemSpellTarget(rec) ? rewriteSpellText(rec, text, {
    consume: t('施放后消耗'),
    destroyTarget: t('施放时，目标干员和本法术销毁'),
    noCustom: t('无法对自编干员施放'),
    target: t('目标干员'),
  }) : text;
}
