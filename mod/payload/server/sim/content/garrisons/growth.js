// Confirmed third-batch growth traits. All state is local to this battle; native mode never installs these hooks.
import * as S from '../support/index.js';
import {onTrait} from './growthTriggers.js';
import {frontOf} from '../../dir.js';
import {growthGrantedTraitView} from '../../../../shared/growthMode.js';

export function install(battle) {
  const ops=battle.allyUnits.filter(S.isOp), kills=new Map(), skills=new Map(), deployGrants=new Map(), skillGrants=new Map();
  const kind=u=>u?.def?.raw?.growthTrait?.handler;
  const mult=u=>u.def.raw.isGolden?2:1;
  const innate=u=>{
    if(kind(u)==='fixedSpRecovery')battle.addBuff(u,{key:'growth:innateSp',mods:{spRecoveryFlat:0.25*mult(u)},persist:true,allowDead:true});
    if(kind(u)==='deathGain')battle.addBuff(u,{key:'growth:gladiiaAtk',mods:{atkPct:1},persist:true,allowDead:true});
  };
  for(const u of ops)innate(u);
  const show=u=>{
    u.growthGrantedTraits=growthGrantedTraitView(deployGrants.get(u),skillGrants.get(u));
  };
  battle.on('growthOperatorCreated',({unit})=>{
    if(!S.isOp(unit)||ops.includes(unit))return;
    ops.push(unit);if(kind(unit)==='skillTopRamp')unit.growthTraitLive={value:3*mult(unit)};
    innate(unit);
  });
  battle.on('hit',({source,target,dmg})=>{
    if(kind(source)!=='allEnemyAttack'||target?.side!=='enemy'||!dmg||dmg.type==='element'||dmg.tags?.includes('dot'))return;
    dmg.amount*=source.def.raw.isGolden?1.8:1.4;
  });
  battle.on('growthDeployGrant',({unit,counts})=>{
    if(!ops.includes(unit))return;
    deployGrants.set(unit,{normal:counts.normal || 0,elite:counts.elite || 0});show(unit);
  });
  const gain=(u,ids,n)=>{
    for(const id of new Set(ids))if(S.bondActive(battle,u.ownerId,id))battle.addLayers(u.ownerId,id,n,'growth',{source:u});
  };
  for(const u of ops) {
    const saved=battle.getPlayer(u.ownerId)?.input?.growthDeployGrants?.[u.uid];
    if(saved && (saved.normal>0 || saved.elite>0)) {
      deployGrants.set(u,{normal:saved.normal || 0,elite:saved.elite || 0});show(u);
    }
    if(kind(u)==='skillTopRamp')u.growthTraitLive={value:3*mult(u)};
    if(kind(u)!=='frontSkillGrant')continue;
    // Like native ADD_BOND, resolve deployment tiles before initial deploy (including instant skills).
    const [r,c]=frontOf(u.homeR,u.homeC,u.dir);
    const target=ops.find(t=>t.ownerId===u.ownerId && t.homeR===r && t.homeC===c && !t.removed);
    if(!target)continue;
    const grants=skillGrants.get(target) || {normal:0,elite:0};
    grants[u.def.raw.isGolden?'elite':'normal']=1; // Same granted trait id remains deduplicated as in native mode.
    skillGrants.set(target,grants);show(target);
  }
  battle.on('kill',({killer,victim})=>{
    if(victim?.side!=='enemy' || !S.isOp(killer) || killer.side!=='ally')return;
    const k=kind(killer);
    if(!['firstKillLayers','pairKillLayers','fiveKillLayers'].includes(k))return;
    const count=(kills.get(killer) || 0)+1;kills.set(killer,count);
    if(k==='firstKillLayers' && count===1)gain(killer,['lateranoShip','preciShip'],5*mult(killer));
    if(k==='pairKillLayers' && count%2===0)gain(killer,['raidShip'],2*mult(killer));
    if(k==='fiveKillLayers' && count<=5) {
      gain(killer,['siracusaShip'],2*mult(killer));gain(killer,['miraShip'],mult(killer));
    }
  });
  onTrait(battle,'deploy',({unit})=>{
    if(!S.isOp(unit) || !S.onField(unit))return;
    if(kind(unit)==='deployOwnLayers')gain(unit,S.unitBonds(unit),5*mult(unit));
    const grants=deployGrants.get(unit);
    // Each permanent copy emits its own event. Source grade never changes when the recipient upgrades.
    for(const grade of ['normal','elite'])for(let i=0;i<(grants?.[grade] || 0);i++)gain(unit,['kazimierzShip','preciShip'],grade==='elite'?8:4);
  });
  battle.on('skillStart',({unit})=>{
    if(!S.isOp(unit) || !S.onField(unit))return;
    const grants=skillGrants.get(unit);
    for(const grade of ['normal','elite'])if(grants?.[grade])gain(unit,['preciShip',...S.unitBonds(unit)],grade==='elite'?2:1);
    if(kind(unit)!=='skillTopRamp')return;
    const used=skills.get(unit) || 0,top=S.topActiveBond(battle,unit.ownerId);
    if(top)gain(unit,[top],3*mult(unit)*(used+1));
    skills.set(unit,used+1);unit.growthTraitLive={value:3*mult(unit)*(used+2)};
  });
}
