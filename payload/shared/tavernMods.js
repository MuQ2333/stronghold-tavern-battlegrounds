// Gameplay switches are authoritative per room; Bob is a local presentation preference.
export const TAVERN_MOD_DEFAULTS = Object.freeze({spells:true,heroes:true});
export const normalizeTavernMods = value => ({spells:value?.spells !== false,heroes:value?.heroes !== false});
export const validTavernMods = value => !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).every(k=>['spells','heroes'].includes(k)) && ['spells','heroes'].every(k=>typeof value[k]==='boolean');
