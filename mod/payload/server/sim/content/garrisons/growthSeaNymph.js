// Battle-only real operators: native kits/bonds and growth traits apply, without drawing shared stock.
import {onTrait} from './growthTriggers.js';
import {spawnGrowthOperator} from './growthSpawn.js';

const kind=u=>u?.def?.raw?.growthTrait?.handler;
export function install(battle) {
  const waiting=new Map();
  const spawn=source=>{
    const ps=battle.getPlayer(source.ownerId),ids=(ps.input.growthEgirPool || []).filter(id=>id!==source.defId && !id.startsWith('chess_char_3_09_'));
    if(!ids.length)return null;
    const base=ids[Math.floor(battle.rng()*ids.length)],id=source.def.raw.isGolden?base.replace(/_a$/,'_b'):base;
    return spawnGrowthOperator(battle,source,id);
  };
  onTrait(battle,'death',ctx=>{
    if(kind(ctx.unit)!=='deathSummon')return;
    const unit=ctx.unit,children=new Set();
    for(let n=0;n<ctx.traitRepeats;n++) {const child=spawn(unit);if(child)children.add(child);}
    if(ctx.artificial || !children.size || !battle.getPlayer(unit.ownerId)?.bonds.indomShip?.active && !unit.mem.indomFreeDeploy)return;
    const state={children,callbacks:[]};waiting.set(unit,state);unit.growthSummonWait=state;unit.growthTraitLive={summonsWaiting:children.size};
    const defer=fn=>state.callbacks.push(fn);
    ctx.deferGrowthIndom=defer;ctx.deferGrowthRevive=defer;
  },{single:true,priority:190});
  battle.on('death',ctx=>{
    if(ctx.reason!=='killed')return;
    const child=ctx.unit;
    // [ASSUMED] A battle summon gets actual immediate revivals; otherwise it leaves instead of paying DP to return.
    if(child.growthSummoned && !child.alive) {child.removed=true;child.respawnAt=Infinity;child.body=null;}
    for(const [parent,state] of waiting) {
      if(!state.children.delete(child))continue;
      parent.growthTraitLive={summonsWaiting:state.children.size};
      if(state.children.size)continue;
      waiting.delete(parent);
      for(const fn of state.callbacks)fn();
      delete parent.growthSummonWait;
    }
  },{priority:-1000});
  battle.on('tick',()=>{
    for(const u of battle.allyUnits)if(u.growthIndomPending && !u.alive && !u.removed) {
      if(battle.redeploy(u,{free:true}))delete u.growthIndomPending;
    }
  });
}
