// Blue Poison: official S1/S2 and 神经毒素, PRTS 蓝毒 (2026-10-25).
// Normal Lv4 / elite Lv7 S2 has three targets; the extra main-target shot starts only at mastery.
import {num,talentBb,traitBb} from '../shared/tier1.js';
import {altSkills,groundAspd,instantKindOf} from '../shared/tier3.js';

export default function bluep(bb,chess,def) {
  const talent=talentBb(chess,0),trait=traitBb(chess);
  const skill={kind:'duration',mods:{atkPct:num(bb.atk)},targeting:{maxTargets:3}};
  const kit={skill,skills:altSkills(chess,def,bb,{
    skchr_bluep_1:s=>({kind:instantKindOf(s),targeting:{maxTargets:2},attack:{atkScale:num(s.bb.atk_scale,1)}}),
    skchr_bluep_2:s=>({kind:'duration',mods:{atkPct:num(s.bb.atk)},targeting:{maxTargets:3}}),
  }),install(battle,unit) {
    const previous=unit.profile.onEachHit;
    unit.profile.onEachHit=(b,u,target,ctx)=>{
      if(previous)previous(b,u,target,ctx);
      if(!target?.alive||target.side!=='enemy')return;
      const key='bluep:poison',duration=num(talent.duration,3.1),old=target.findBuff(key);
      const scale=ctx.isSkill&&chess.skill?.skillId==='skchr_bluep_1'?num(bb.atk_scale,1):1;
      const amount=old?.data?.amount ?? num(talent.poison_damage)*scale;
      if(!(amount>0))return;
      // Existing poison refreshes its timer while retaining the initial amount and tick cadence (PRTS note).
      b.addBuff(target,{key,duration,refresh:'extend',interval:1,source:u,data:{amount},tags:['dot','talent'],
        onTick:({battle:bt,unit:enemy,buff})=>bt.dealDamage(u,enemy,{amount:buff.data.amount,type:'arts',sourceless:true,canDodge:false,tags:['dot','talent','bluep:poison']})});
    };
    const moduleAspd=chess.talents?.find(t=>t.index===-1)?.bb?.attack_speed ?? trait.attack_speed;
    if(num(moduleAspd)>0)groundAspd('trait:bluepGround',num(moduleAspd))(battle,unit);
  }};
  return kit;
}
