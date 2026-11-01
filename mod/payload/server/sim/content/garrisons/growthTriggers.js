// Growth-only trait events. Replaying a trait never emits a real kill/death/deploy.
import * as S from '../support/index.js';
import {frontOf} from '../../dir.js';

const traitType=u=>u?.def?.raw?.growthTrait?.handler;
const eventName=event=>`growth:trait:${event}`;
const available=(b,u)=>S.onField(u) || (b._startDeploying && u.deploySeq===0 && !u.removed);

export function growthCombatRepeats(battle,unit) {
  if(!battle.flags.growthMode)return 1;
  let n=1;
  for(const u of battle.allyUnits)if(u.ownerId===unit.ownerId && traitType(u)==='repeatCombat' && available(battle,u))n+=u.def.raw.isGolden?2:1;
  return n;
}

/** Existing trait callbacks keep their priority; one-shot consumers can handle the repeat count themselves. */
export function onTrait(battle,event,fn,{single=false,...opts}={}) {
  if(!battle.flags.growthMode)return battle.on(event,fn,opts);
  return battle.on(eventName(event),ctx=>{
    const count=single?1:ctx.traitRepeats;
    for(let i=0;i<count;i++)fn(ctx,battle);
  },opts);
}

function emitTraits(battle,event,ctx) {
  if(!S.isOp(ctx.unit) || ctx.unit.side!=='ally')return;
  ctx.traitRepeats=growthCombatRepeats(battle,ctx.unit);
  battle.emit(eventName(event),ctx);
}

export function triggerDeathTraits(battle,unit,{times=1,source=null}={}) {
  if(!battle.flags.growthMode || !S.onField(unit))return;
  for(let i=0;i<times;i++)emitTraits(battle,'death',{unit,reason:'killed',artificial:true,source});
}

export function triggerDeployTraits(battle,unit,{times=1,source=null}={}) {
  if(!battle.flags.growthMode || !available(battle,unit))return;
  for(let i=0;i<times;i++)emitTraits(battle,'deploy',{unit,artificial:true,source});
}

/** The authoritative match host resolves economy; a read-only battle preview has no economy listener. */
export function triggerGainTraits(battle,unit,{times=1,source=null}={}) {
  if(!battle.flags.growthMode || !available(battle,unit) || !S.isOp(unit))return;
  for(let i=0;i<times;i++)battle.emit('growthGainTrait',{unit,source});
}

export function hasDeathTrait(unit) {
  if(['halfRevive','damageRevive'].includes(traitType(unit))&&!unit.growthReviveDisabled)return true;
  if(['deathSpread','deathRefresh','gravelRamp','deathGain','spellDeathBonus','deathSummon'].includes(traitType(unit)))return true;
  if((unit.growthDeathCopies?.normal || 0)+(unit.growthDeathCopies?.elite || 0)>0)return true;
  return (unit.def?.raw?.garrisonIds || []).some(id=>S.garrisonRecord(id)?.effectKey==='act1autochess_gar_event_selfdead');
}

export function install(battle) {
  // Only the original field roster participates in opening traits, never combat-generated operators.
  const startingOps=battle.allyUnits.filter(S.isOp);
  const oneHpUsed=new Set();
  battle.on('damaged',({target:unit,hpBefore})=>{
    if(traitType(unit)!=='frontFirstOneHp'||!S.onField(unit)||!(hpBefore>1)||unit.hp!==1||oneHpUsed.has(unit))return;
    oneHpUsed.add(unit);
    const [r,c]=frontOf(unit.tileR,unit.tileC,unit.dir);
    const target=battle.allyUnits.find(t=>t!==unit&&t.ownerId===unit.ownerId&&S.isOp(t)&&S.onField(t)&&t.tileR===r&&t.tileC===c);
    if(target)triggerDeathTraits(battle,target,{times:unit.def.raw.isGolden?2:1,source:unit});
  });
  battle.on('deploy',ctx=>emitTraits(battle,'deploy',ctx),{priority:200});
  // All trait callbacks, including priority-100 trait revival, finish before native indom (priority 10).
  battle.on('death',ctx=>{if(ctx.reason==='killed')emitTraits(battle,'death',ctx);},{priority:200});
  const deployed=new Set();
  onTrait(battle,'deploy',({unit,traitRepeats})=>{
    if(traitType(unit)!=='gainDeploy' || deployed.has(unit))return;
    // Lock before the first nested gain: each physical copy has one complete activation per battle.
    deployed.add(unit);
    const targets=battle.allyUnits.filter(t=>t.ownerId===unit.ownerId && S.isOp(t) && available(battle,t) && traitType(t)!=='gainDeploy');
    for(let n=0;n<traitRepeats*(unit.def.raw.isGolden?2:1);n++)for(const target of targets)triggerGainTraits(battle,target,{source:unit});
  },{single:true});
  onTrait(battle,'death',({unit})=>{
    if(traitType(unit)!=='deathGain')return;
    for(const offset of unit.def.raw.isGolden?[-1,1]:[-1]) {
      const [r,c]=frontOf(unit.tileR,unit.tileC,unit.dir,offset);
      const target=battle.allyUnits.find(t=>t.ownerId===unit.ownerId && S.isOp(t) && S.onField(t) && t.tileR===r && t.tileC===c);
      if(target)triggerGainTraits(battle,target,{source:unit});
    }
  });
  const used=new Set();
  battle.on('skillStart',({unit})=>{
    if(traitType(unit)!=='firstSkillDeath' || !S.onField(unit) || used.has(unit))return;
    used.add(unit);
    // [ASSUMED] Choose only operators with a death trait, right then down in the owner's orientation.
    const targets=battle.allyUnits.filter(t=>t.ownerId===unit.ownerId && S.isOp(t) && S.onField(t) && hasDeathTrait(t));
    const col=u=>u.player?.mirror?-u.tileC:u.tileC;
    targets.sort((a,b)=>col(b)-col(a) || b.tileR-a.tileR || a.id-b.id);
    if(targets[0])triggerDeathTraits(battle,targets[0],{times:unit.def.raw.isGolden?2:1,source:unit});
  });
  battle.on('battleStart',()=>{
    for(const u of startingOps)if(traitType(u)==='startDeathTraits' && S.onField(u)) {
      // Visit the whole original roster: an earlier target can grant a death trait to a later one.
      // Elite repeats each target in place (A,A,B,B); Indre repeats remain inside that individual activation.
      for(const target of startingOps)if(target.ownerId===u.ownerId && S.onField(target))
        triggerDeathTraits(battle,target,{times:u.def.raw.isGolden?2:1,source:u});
    }
  });
}
