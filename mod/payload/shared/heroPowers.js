// Activated only by a loaded strategy record's params.heroPower. No global mod switch.
export const HERO_POWER_IDS = Object.freeze([
  'gallywix', 'sindragosa', 'millhouse', 'toki', 'mukla', 'elise', 'tess', 'flurgl',
  'alexstrasza', 'nozdormu', 'maiev', 'eudora', 'omu', 'zephrys', 'guff', 'tamsin',
  'galewing', 'cookie', 'faelin', 'togwaggle', 'sylvanas', 'voone', 'hoggarr', 'snakeeyes', 'cenarius',
  'thelan', 'hollidae', 'yogg', 'scabbs', 'nguyen',
]);
export const SPELL_HERO_IDS = Object.freeze(['thelan', 'hollidae', 'yogg', 'galewing']);
export const PASSIVE_HERO_IDS = Object.freeze(['gallywix','sindragosa','millhouse','mukla','flurgl','nozdormu','omu','guff','tamsin','voone','hoggarr','thelan','yogg','faelin','nguyen']);

/** Shared by draft previews (initial state) and the authoritative current-use price. */
export function heroPowerCost(id, {uses=0,discount=0} = {}) {
  if(id==='elise') return 1+uses;
  if(id==='togwaggle') return Math.max(0,11-discount);
  if(['zephrys','cenarius'].includes(id)) return 3;
  if(id==='sylvanas'||id==='scabbs') return 2;
  return ['cookie','galewing','faelin'].includes(id)?0:1;
}
export function heroAvailable(record, spells = false) {
  return !SPELL_HERO_IDS.includes(heroPowerId(record)) || spells === true;
}
export function heroPowerId(record) {
  const id = record?.params?.heroPower;
  return HERO_POWER_IDS.includes(id) ? id : null;
}
