// Real battle-only operators: one shared placement and initialization path for growth summons/copies.
export function growthSummonTile(battle, source, def) {
  const ps=battle.getPlayer(source.ownerId),ranged=def.position==='RANGED';
  const legal=(r,c)=>battle.onOwnBoard(ps,r,c)&&battle.grid.inRect(r,c)&&battle.grid.canStand(r,c,{ranged})
    &&!battle.allyUnits.some(u=>u.alive&&u.deployed&&u.tileR===r&&u.tileC===c)&&!battle.downOn(r,c,source);
  if(legal(source.tileR,source.tileC))return [source.tileR,source.tileC];
  // Nearest legal field tile; equal distances retain stable owner-relative board order without RNG draws.
  let best=null,bestDistance=Infinity;
  for(let r=9;r<=12;r++)for(let c=2;c<=10;c++){
    // Enumerate the owner's board even when its unit input already uses field coordinates.
    const at=battle._boardTile(ps,r,c);if(!legal(...at))continue;
    const dr=at[0]-source.tileR,dc=at[1]-source.tileC,distance=dr*dr+dc*dc;
    if(distance<bestDistance){best=at;bestDistance=distance;}
  }
  return best;
}

export function spawnGrowthOperator(battle,source,chessId,{disableRevive=false,half=false}={}) {
  const ps=battle.getPlayer(source.ownerId),def=battle.data.getChess(chessId);
  if(!def)return null;
  const at=growthSummonTile(battle,source,def);if(!at)return null;
  const u=battle._createAllyFromInput(ps,{chessId,row:at[0],col:at[1],abs:true,dir:source.dir,uid:-(battle._idSeq+1)});
  if(!u)return null;
  u.growthSummoner=source;u.growthSummoned=true;u.growthReviveDisabled=disableRevive;
  u.growthPiece={uid:u.uid,id:chessId,kind:'chess',items:[],meta:{},dir:source.dir,poolCopies:0};
  battle._setupUnit(u);
  if(half)battle.addBuff(u,{key:'growth:reviveHalf',mods:{atkMul:0.5,defMul:0.5,hpMul:0.5},persist:true,allowDead:true});
  if(!battle._deploy(u,{tile:at})){u.removed=true;battle._toRelease.push(u);return null;}
  return u;
}
