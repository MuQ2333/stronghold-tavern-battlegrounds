// Star copies all current Skillful excess temporarily at each field opening; no pending permanent reward.
export function growthStarPresent(ps) {
  if(!ps.m.growthMode)return false;
  const board=ps._growthCombat?.board() ?? ps.board;
  return [...board.values()].some(p=>p.kind==='chess' && ps.gd.chess(p.id)?.growthTrait?.handler==='starSpend');
}
export const growthStarOverflow=ps=>growthStarPresent(ps)?Math.max(0,(ps._growthCombat?.permanentLayers('skillfulShip') ?? ps.layers.skillfulShip ?? 0)-999):0;
export const growthStarYield=(ps,p)=>(ps.gd.isGolden(p.id)?2:1)*(1+Math.floor((p.meta?.growthStarSpent || 0)/10));
