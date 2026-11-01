// Mode-only Kazdel source-pack alliance and the individually confirmed permanent/temporary ramps.
import * as S from '../support/index.js';
import {onTrait} from './growthTriggers.js';
import {GROWTH_KAZDEL} from '../../../../shared/growthKazdelRoster.js';

export function install(battle) {
  const ops=battle.allyUnits.filter(S.isOp),uses=new Map(),dollUses=new Map();
  const type=u=>u?.def?.raw?.growthTrait?.handler;
  const multi=u=>u.def.raw.isGolden?2:1;
  const gain=(u,id,n,temporary=false)=>{if(S.bondActive(battle,u.ownerId,id))battle.addLayers(u.ownerId,id,n,'growth',{source:u,...(temporary?{temporary:true}:{})});};
  const gravel=u=>{
    if(type(u)!=='gravelRamp')return;
    const previous=battle.getPlayer(u.ownerId)?.input?.growthCounters?.[u.uid]?.traitUses || 0;
    const count=(uses.get(u) || 0)+1;uses.set(u,count);
    gain(u,'kazimierzShip',multi(u)*(previous+count));gain(u,'indomShip',2*multi(u)*(previous+count));
    u.growthTraitLive={gains:[{bondId:'kazimierzShip',layers:multi(u)*(previous+count+1)},{bondId:'indomShip',layers:2*multi(u)*(previous+count+1)}]};
    if(u.uid!=null){const p=battle._pp(u.ownerId);p.growthTraitUses ||= {};p.growthTraitUses[u.uid]=count;}
  };
  const doll=u=>{
    if(type(u)!=='dollRamp')return;
    const count=(dollUses.get(u) || 0)+1;dollUses.set(u,count);
    for(const id of ['egirShip','indomShip'])gain(u,id,2*multi(u)*count,true);
    u.growthTraitLive={value:2*multi(u)*(count+1)};
  };
  const registerDoll=u=>{
    if(type(u)==='dollRamp' && !dollUses.has(u)){dollUses.set(u,0);u.growthTraitLive={value:2*multi(u)};}
  };
  for(const u of ops) {
    registerDoll(u);
    if(type(u)==='gravelRamp') {
      const n=1+(battle.getPlayer(u.ownerId)?.input?.growthCounters?.[u.uid]?.traitUses || 0);
      u.growthTraitLive={gains:[{bondId:'kazimierzShip',layers:multi(u)*n},{bondId:'indomShip',layers:2*multi(u)*n}]};
    }
  }
  onTrait(battle,'deploy',({unit})=>gravel(unit));
  onTrait(battle,'death',({unit,reason})=>{
    if(reason!=='killed')return;
    gravel(unit);
  },{priority:200});
  battle.on('growthOperatorCreated',({unit})=>registerDoll(unit));
  // A combat observer, not a death trait: no artificial replay or Indre repetition.
  // [ASSUMED] Like other growth auras, friendly operators are those owned by the same player.
  battle.on('death',({unit,reason})=>{
    if(reason!=='killed' || !S.isOp(unit) || unit.side!=='ally')return;
    for(const u of dollUses.keys())if(u.ownerId===unit.ownerId && (S.onField(u) || u===unit))doll(u);
  },{priority:201});
  // Listen to actual switches, including both directions within one tick. A death's form cleanup is not a switch.
  battle.on('dollSwap',({unit})=>{if(S.onField(unit) && dollUses.has(unit))doll(unit);});
  const damageAuras=ops.filter(u=>type(u)==='kazdelDamage'),seen=new Map(damageAuras.map(u=>[u,new Map()]));
  battle.on('growthOperatorCreated',({unit})=>{
    if(type(unit)==='kazdelDamage'&&!seen.has(unit)){damageAuras.push(unit);seen.set(unit,new Map());}
  });
  battle.on('damaged',({source,target,amount})=>{
    if(!(amount>0) || target?.side!=='enemy' || !S.isOp(source) || !S.unitBonds(source).includes('kazdelShip'))return;
    for(const u of damageAuras)if(u.ownerId===source.ownerId && S.onField(u)) {
      const m=seen.get(u);let enemies=m.get(source);if(!enemies){enemies=new Set();m.set(source,enemies);}
      if(enemies.has(target.id))continue;enemies.add(target.id);gain(u,'kazdelShip',2*multi(u));
    }
  });
  const controlled=t=>{
    const f=t.s?.flags || {};
    return f.stun||f.bind||f.immobile||f.rooted||t.blockedBy||t.moving===false||!(t.s?.moveSpeed>0)||f.noMove||
      ['stun','sluggish','bind','immobile'].some(k=>!!t.findBuff(k));
  };
  const bb=GROWTH_KAZDEL.bond.bb,tag='bond:kazdelShip';
  for(const p of battle.players) {
    if(!S.bondActive(battle,p.playerId,'kazdelShip'))continue;
    const members=ops.filter(u=>u.ownerId===p.playerId && S.isMember(battle,u,'kazdelShip'));
    const upper=(p.bonds.kazdelShip.tier || 0)>=2 || (p.bonds.kazdelShip.count || 0)>=3;
    if(upper)for(const u of members)S.passiveBuff(battle,u,'growth:kazdel:aspd',{aspd:bb.bonus_attack_speed});
    battle.on('growthOperatorCreated',({unit})=>{
      if(unit.ownerId!==p.playerId||!S.isOp(unit)||!S.isMember(battle,unit,'kazdelShip')||members.includes(unit))return;
      members.push(unit);if(upper)S.passiveBuff(battle,unit,'growth:kazdel:aspd',{aspd:bb.bonus_attack_speed});
    });
    battle.on('hit',({source,target,dmg})=>{
      if(!members.includes(source) || target?.side!=='enemy' || !target.alive || !dmg || dmg.sourceless || dmg.tags?.includes(tag) || !controlled(target))return;
      dmg.mul=S.num(dmg.mul,1)*(1+bb.base_damage_scale+bb.damage_scale_per_stack*S.bondLayers(battle,p.playerId,'kazdelShip'));
    });
    if(upper)battle.on('damaged',({source,target,dmg})=>{
      if(!members.includes(source) || !dmg?.isAttack || target?.side!=='enemy' || !target.alive || dmg.tags?.includes(tag))return;
      battle.dealDamage(source,target,{amount:source.s.atk*bb.true_damage_scale,type:'true',tags:[tag],canDodge:false});
    });
  }
}
