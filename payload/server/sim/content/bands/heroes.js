import { heroPowerId } from '../../../../shared/heroPowers.js';
import { HERO_BANDS } from '../../../../shared/heroCatalog.js';
import { bandRecord, playerOps, passiveBuff } from '../support/index.js';

export function installHeroBands(battle) {
  for (const ps of battle.players) {
    const id=heroPowerId(HERO_BANDS[ps.bandId] || bandRecord(ps.bandId));
    if(id==='sylvanas' || ps.playerEffects?.some(e=>e.id==='hero_nguyen_history')) {
      battle.on('death', c=>{
        if(c.reason!=='killed'||c.unit.kind!=='op'||c.unit.ownerId!==ps.playerId||!Number.isInteger(c.unit.uid))return;
        const pp=battle._pp(ps.playerId);
        pp.heroDeaths ||= [];
        pp.heroDeaths.push(c.unit.uid);
      });
    }
    if(id!=='tamsin')continue;
    let marked=null, used=false, stats=null;
    battle.on('battleStart',()=>{
      const ops=playerOps(battle,ps.playerId,{fieldOnly:true});
      marked=ops.reduce((best,u)=>!best||u.s.atk<best.s.atk?u:best,null);
    });
    battle.on('kill',c=>{if(c.victim===marked&&!used)stats={atkFlat:marked.s.atk,hpFlat:marked.s.maxHp};});
    battle.on('death',c=>{
      if(used||c.unit!==marked||c.reason!=='killed'||!stats)return;
      used=true;
      for(const u of playerOps(battle,ps.playerId))if(u!==marked)passiveBuff(battle,u,'hero:tamsin',stats);
    });
  }
}
