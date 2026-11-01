// Added-operator media is available before choosing room rules (including lobby voice previews).
// Installed records win; the client applies cosmetic Forge layers over this base afterwards.
import {GROWTH_KAZDEL_ASSETS} from './growthKazdelAssets.js';
import {GROWTH_BLUE_POISON_ASSETS} from './growthBluePoisonAssets.js';

export const GROWTH_ADDED_ASSETS={
 chars:{...GROWTH_KAZDEL_ASSETS.chars,...GROWTH_BLUE_POISON_ASSETS.chars},
 skills:{...GROWTH_KAZDEL_ASSETS.skills,...GROWTH_BLUE_POISON_ASSETS.skills},
 audio:GROWTH_BLUE_POISON_ASSETS.audio,
};
const cache=new WeakMap();
export function withGrowthAssetFallbacks(base={}){
 if(cache.has(base))return cache.get(base);
 const out={...base,chars:{...GROWTH_ADDED_ASSETS.chars,...base.chars},skills:{...GROWTH_ADDED_ASSETS.skills,...base.skills},audio:{...base.audio}};
 for(const [tree,lines]of Object.entries(GROWTH_ADDED_ASSETS.audio||{}))out.audio[tree]={...lines,...base.audio?.[tree]};
 cache.set(base,out);return out;
}
