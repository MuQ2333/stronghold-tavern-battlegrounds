// Maintainer: opening overflow is a temporary copy, never a permanent economy reward.
import { bondRecord, onField } from '../support/index.js';

export function install(battle) {
  if(!battle.flags.growthMode)return;
  let applied=false;
  battle.on('battleStart',()=>{
    if(applied)return;applied=true;
    for(const p of battle.players) {
      const mains=Object.entries(p.bonds || {}).filter(([id,b])=>b.active && (battle.data.raw?.bonds?.[id] ?? bondRecord(id))?.isCore);
      mains.sort((a,b)=>(b[1].layers || 0)-(a[1].layers || 0) || (a[0]<b[0]?-1:a[0]>b[0]?1:0));
      if(!mains.length)continue;
      const swift=p.bonds.swiftShip;
      const swiftExcess=swift?.active?Math.max(0,(swift.layers || 0)-999):0;
      if(swiftExcess)battle.addLayers(p.playerId,mains[0][0],swiftExcess,'growth:swiftOverflow',{temporary:true});
      const star=battle.allyUnits.find(u=>u.ownerId===p.playerId && u.def?.raw?.growthTrait?.handler==='starSpend' && onField(u));
      const n=star?Math.max(0,(p.bonds.skillfulShip?.layers || 0)-999):0;
      if(n)battle.addLayers(p.playerId,mains[0][0],n,'growth:starOverflow',{temporary:true,source:star});
    }
  });
}
