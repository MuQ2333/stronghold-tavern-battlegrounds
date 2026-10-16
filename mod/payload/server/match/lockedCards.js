import {handLockOf,lockedCardStatus} from '../../shared/lockedCards.js';

/** Place a reserved or generated card into a real, ordinary hand slot without triggering an early merge. */
export function lockHandCard(ps,entry,lock) {
  if(!ps.hand.some(p=>!p))return null;
  const p=ps.newPiece(entry.kind,entry.id,{meta:{handLock:{...lock}},...(entry.kind==='chess'?{poolCopies:entry.generated?0:1}:{})});
  if(entry.generated){if(entry.kind==='chess')p.noPoolTopUp=true;else p.stockCopies=0;}
  if(!ps.stow(p,{allowTemp:false}))return null;
  ps.recompute();
  return p;
}

/** Reacquire in the vacated slot when unlocked, allowing normal merges and onGain exactly then. */
export function unlockHandCards(ps) {
  const pending=[...ps.hand,...ps.temp].filter(p=>p&&handLockOf(p)&&lockedCardStatus(handLockOf(p),{round:ps.m.round,level:ps.shop.level}).waiting);
  for(const p of pending){
    const loc=ps.find(p.uid);if(!loc)continue;
    ps._detach(loc);
    if(p.kind==='chess')ps.acquireChess(p.id,{source:'hero',fromPool:false,noPoolTopUp:!!p.noPoolTopUp,reservedCopies:p.poolCopies||0});
    else ps.acquireItem(p.id,{source:'hero',reservedStock:true,ignoreStock:p.stockCopies===0});
  }
}

export function handLockedCards(ps) {
  return [...ps.hand,...ps.temp].filter(p=>p&&handLockOf(p)).map(p=>({key:`hand:${p.uid}`,uid:p.uid,kind:p.kind,id:p.id,...handLockOf(p)}));
}
