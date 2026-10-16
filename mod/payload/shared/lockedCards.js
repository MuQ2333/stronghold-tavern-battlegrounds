// Shared presentation contract for pending cards, independent of hero/spell availability.
// Providers own reservations, delivery and action restrictions; this module changes no game state.
export const handLockOf = piece => piece?.handLock || piece?.meta?.handLock || null;
export const isHandLocked = piece => !!handLockOf(piece);
export function lockedCardStatus(entry, {round=0,level=0}={}) {
  const unlockRound=Number.isInteger(entry?.unlockRound)?entry.unlockRound:null;
  const unlockLevel=Number.isInteger(entry?.unlockLevel)?entry.unlockLevel:null;
  const rounds=unlockRound===null?0:Math.max(0,unlockRound-round);
  const levels=unlockLevel===null?0:Math.max(0,unlockLevel-level);
  return {rounds,levels,unlockRound,unlockLevel,waiting:(unlockRound!==null||unlockLevel!==null)&&rounds===0&&levels===0};
}
