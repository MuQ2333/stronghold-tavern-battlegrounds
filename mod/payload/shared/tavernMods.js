// Gameplay switches are authoritative per room; Bob is a local presentation preference.
import {DEFAULT_VERSION} from './versions.js';
export const supportsTavernMods = version => !version || version === DEFAULT_VERSION;
export const tavernModsForVersion = (value,version) => supportsTavernMods(version) ? normalizeTavernMods(value) : {spells:false,heroes:false,growth:false};
export const TAVERN_MOD_DEFAULTS = Object.freeze({spells:true,heroes:true,growth:false});
export const normalizeTavernMods = value => ({spells:value?.spells !== false,heroes:value?.heroes !== false,growth:value?.growth === true});
export const validTavernMods = value => !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).every(k=>['spells','heroes','growth'].includes(k)) && ['spells','heroes'].every(k=>typeof value[k]==='boolean') && (value.growth === undefined || typeof value.growth==='boolean');
