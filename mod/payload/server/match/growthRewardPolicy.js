// Filter candidates before a generic random draw, never destroy or replace an already acquired/displayed card.
// Buying deliberately and Kazdel's own explicit discovery keep their original self-harm behavior.
export function growthRewardAllowed(ps,id) {
  if(!ps.m.growthMode || ps.bonds.kazdelShip?.active)return true;
  return !['selfHarmGain','kazdelDiscover'].includes(ps.gd.chess(id)?.growthTrait?.handler);
}
