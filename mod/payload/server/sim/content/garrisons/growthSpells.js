// Maintainer growth spells: real ammo events cast a free ring; trait strength persists through the match host.
import * as S from '../support/index.js';
import {onTrait} from './growthTriggers.js';

const type=u=>u?.def?.raw?.growthTrait?.handler;
const ring='hs_bg28_168';
export function install(battle) {
  const ammo=new Map();
  battle.on('skillStart',({unit})=>{
    if(type(unit)==='spellSkillBonus' && S.onField(unit))battle.emit('growthSpellStrength',{unit,n:unit.def.raw.isGolden?2:1});
  });
  onTrait(battle,'death',({unit})=>{
    if(type(unit)==='spellDeathBonus')battle.emit('growthSpellStrength',{unit,n:unit.def.raw.isGolden?2:1,allowDead:true});
  });
  battle.on('ammoUsed',({unit})=>{
    if(!S.isOp(unit) || !S.onField(unit))return;
    for(const caster of battle.allyUnits) {
      const kind=type(caster);
      if(!['localAmmoSpell','globalAmmoSpell'].includes(kind) || !S.onField(caster) || caster.ownerId!==unit.ownerId)continue;
      // Same x-5 as the native Mostima trait: self plus the four orthogonally adjacent operator tiles.
      if(kind==='localAmmoSpell' && caster!==unit && Math.abs(caster.tileR-unit.tileR)+Math.abs(caster.tileC-unit.tileC)!==1)continue;
      const threshold=kind==='localAmmoSpell'?6:10,count=(ammo.get(caster) || 0)+1;ammo.set(caster,count);
      caster.growthTraitLive={ammoProgress:count%threshold,ammoThreshold:threshold};
      if(count%threshold)continue;
      const repeats=caster.def.raw.isGolden?2:1;
      for(let n=0;n<repeats;n++)battle.emit('growthCastSpell',{unit:caster,id:ring});
    }
  });
}
