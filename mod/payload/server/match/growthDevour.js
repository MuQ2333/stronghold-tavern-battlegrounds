/** Only layers directly earned by devouring are redirected; ordinary purchases retain their own alliances. */
export function addDevourLayers(ps,bondId,n,{requireActive=false,reason='growth'}={}) {
  const bonds=ps._growthCombat?.bonds?.() ?? ps.bonds;
  if(requireActive&&!bonds[bondId]?.active)return 0;
  const kazdel=bonds.kazdelShip;
  const convert=ps.m.growthMode&&kazdel?.active&&kazdel.tier>=2&&ps.gd.bond(bondId)?.isCore;
  return ps.addLayers(convert?'kazdelShip':bondId,n,{requireActive:convert?false:requireActive,reason});
}
