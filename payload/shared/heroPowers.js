// Activated only by a loaded strategy record's params.heroPower. No global mod switch.
export const HERO_POWER_IDS = Object.freeze([
  'gallywix', 'sindragosa', 'millhouse', 'toki', 'mukla', 'elise', 'tess', 'flurgl',
  'alexstrasza', 'nozdormu', 'maiev', 'eudora', 'omu', 'zephrys', 'guff', 'tamsin',
  'galewing', 'cookie', 'faelin', 'togwaggle', 'sylvanas', 'voone', 'hoggarr', 'snakeeyes', 'cenarius',
  'thelan', 'hollidae', 'yogg', 'scabbs', 'nguyen',
]);
export const SPELL_HERO_IDS = Object.freeze(['thelan', 'hollidae', 'yogg', 'galewing']);
export function heroAvailable(record, spells = false) {
  return !SPELL_HERO_IDS.includes(heroPowerId(record)) || spells === true;
}
export function heroPowerId(record) {
  const id = record?.params?.heroPower;
  return HERO_POWER_IDS.includes(id) ? id : null;
}
