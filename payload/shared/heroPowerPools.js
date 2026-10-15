// Separate policies for permanent replacement and Nguyen's one-turn powers.
// Source records and known exclusions: docs/HERO-POWER-POOLS.md.
import { heroPowerId } from './heroPowers.js';

// Opening-only Expedition Plans is unavailable to Unmasked Identity.
export const IDENTITY_HERO_BANS = Object.freeze(['faelin']);
// Multi-turn progress / opening setup cannot be completed by a one-turn power.
// [ASSUMED] adaptations of new cumulative powers follow this rule; exact server weights are not published.
export const NGUYEN_HERO_BANS = Object.freeze(['nguyen', 'flurgl', 'eudora', 'guff', 'galewing', 'cookie', 'faelin', 'voone', 'thelan']);

export function replacementHeroEligible(record, { temporary = false, round = 1, level = 1 } = {}) {
  const id = heroPowerId(record);
  if (!id) return false;
  if ((temporary ? NGUYEN_HERO_BANS : IDENTITY_HERO_BANS).includes(id)) return false;
  // Queen of Dragons is now an activated Tier-4 power, rather than its old upgrade-only version.
  if (temporary && id === 'alexstrasza' && level < 4) return false;
  if (temporary && (id === 'sylvanas' || id === 'yogg') && round < 3) return false;
  return true;
}
