import {layerGainRoom} from '../../shared/constants.js';

/** Commit only this field's newly earned permanent layers; carried input and temporary layers are not gains. */
export function settleGrowthLayers(m,ps,result) {
  if(!m.growthMode || !ps?.alive || !result?.layerGains || !Object.keys(result.layerGains).length)return;
  for(const [bondId,n] of Object.entries(result?.layerGains||{})) {
    if(!m.gd.bond(bondId)||!Number.isFinite(n)||n<=0)continue;
    const before=ps.layers[bondId]||0,add=layerGainRoom(before,Math.floor(n),true);
    if(!add)continue;
    ps.layers[bondId]=before+add;
    m.dispatch(ps,'onLayers',{bondId,from:before,to:ps.layers[bondId],reason:'battle'});
  }
  ps.recompute();ps.dirty();
}
