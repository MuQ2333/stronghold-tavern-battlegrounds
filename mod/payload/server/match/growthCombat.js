// Growth economy stays match-authoritative, just like the shared card pool and leader HP.
// Sim trait events are synchronous; gifts therefore finish their real onGain chain before combat resumes.
import {boardOrder,parseKey} from './board.js';
import {pieceBonds} from './bondsMeta.js';
import {isHandLocked} from '../../shared/lockedCards.js';
import {layerGainRoom} from '../../shared/constants.js';
import {triggerDeployTraits} from '../sim/content/garrisons/growthTriggers.js';
import {mirrorDir} from '../sim/dir.js';
import {increaseGrowthSpellStrength} from './growthSpells.js';

export const growthBoardMap=ps=>ps._growthCombat?.board() ?? ps.board;
const type=(ps,p)=>ps.gd.chess(p.id)?.growthTrait?.handler;
const live=(b,u)=>u.kind==='op' && (u.alive && u.deployed || b._startDeploying && u.deploySeq===0 && !u.removed);

/** Replay deployment traits in PREP, without deploying, paying DP, or invoking deployment equipment/bonds. */
export function triggerGrowthDeploy(ps,piece) {
  if(ps._growthCombat)return ps._growthCombat.deploy(piece);
  if(!ps.alive || isHandLocked(piece))return;
  const rec=ps.gd.chess(piece.id),m=rec?.isGolden?2:1;
  const repeat=boardOrder(ps.board).reduce((n,{piece:p})=>n+(p.kind==='chess' && !isHandLocked(p) && type(ps,p)==='repeatCombat'?(ps.gd.isGolden(p.id)?2:1):0),1);
  for(let i=0;i<repeat;i++) {
    const own=pieceBonds(ps.gd,piece);
    if(type(ps,piece)==='deployOwnLayers')for(const id of own)ps.addLayers(id,5*m,{requireActive:true,reason:'growth'});
    if(type(ps,piece)==='gravelRamp') {
      piece.meta ||= {};
      const n=piece.meta.growthTraitUses=(piece.meta.growthTraitUses || 0)+1;
      ps.addLayers('kazimierzShip',m*n,{requireActive:true,reason:'growth'});
      ps.addLayers('indomShip',2*m*n,{requireActive:true,reason:'growth'});
    }
    for(const grade of ['normal','elite']) {
      const n=(piece.meta?.growthDeployGrants?.[grade] || 0)*(grade==='elite'?8:4);
      for(const id of ['kazimierzShip','preciShip'])if(n)ps.addLayers(id,n,{requireActive:true,reason:'growth'});
    }
    // Mlynar's timed stat buff is not replayable. Surtr's new trait strengthens spells on defeat, not deployment.
  }
  ps.dirty();
}

export function installGrowthEconomy(m,battle) {
  if(!m.growthMode || !battle.on || !battle.getPlayer)return;
  const execute=({unit,source,action=null,allowDead=false})=>{
    const ps=m.players.get(unit.ownerId),piece=ps?.find(unit.uid)?.piece ?? unit.growthPiece;
    if(!ps?.alive || !piece || !allowDead && !live(battle,unit))return;
    if(ps._growthCombat) { ps._growthCombat.queue.push({unit,source,action});return; }
    const savedLayers=ps.layers;
    const player=battle.getPlayer(unit.ownerId);
    const fieldUnit=p=>battle.allyUnits.find(u=>u.uid===p.uid && u.ownerId===ps.playerId && live(battle,u));
    const context={
      queue:[{unit,source,action}],
      bonds:()=>player.bonds,
      enqueue:(hook,ev)=>context.queue.push({hook,ev}),
      board:()=>new Map([...ps.board].flatMap(([key,p])=>{
        const u=fieldUnit(p);if(!u)return [];
        const [r,c]=parseKey(key),[fr,fc]=battle.mapTile(player,r,c);
        const col=c+(u.tileC-fc)*(player.mirror && player.coords!=='field'?-1:1);
        return [[`${r+u.tileR-fr},${col}`,p]];
      }).concat(battle.allyUnits.filter(u=>u.ownerId===ps.playerId && u.growthPiece && live(battle,u)).map(u=>{
        const [r,c]=battle.mapTile(player,9,2);
        return [[9+u.tileR-r,2+(u.tileC-c)*(player.mirror && player.coords!=='field'?-1:1)].join(','),u.growthPiece];
      }))),
      find:uid=>{const row=[...context.board()].find(([,p])=>p.uid===uid);return row?{area:'board',key:row[0],piece:row[1]}:ps.find(uid);},
      direction:p=>{const u=fieldUnit(p);return u?(player.mirror?mirrorDir(u.dir):u.dir):p.dir;},
      deploy:p=>{
        const target=battle.allyUnits.find(u=>u.ownerId===ps.playerId && u.uid===p.uid && live(battle,u));
        if(target)triggerDeployTraits(battle,target,{source:context.unit});
      },
      grantDeploy:(p,counts)=>{
        const target=battle.allyUnits.find(u=>u.ownerId===ps.playerId && u.uid===p.uid);
        if(target)battle.emit('growthDeployGrant',{unit:target,counts:{...counts}});
      },
      permanentLayers:id=>(savedLayers[id] || 0)+(battle.kind==='unite'?(ps.pendingLayerGains?.[id] || 0):0)+(battle._pp(ps.playerId)?.layerGains[id] || 0),
      addLayers:(id,n,{requireActive=false,reason='growth'}={})=>{
        if(!ps.gd.bond(id) || !Number.isFinite(n) || n<=0 || requireActive && !player.bonds[id]?.active)return 0;
        player.growthKjeragBonus=ps.growthState?.kjeragBonus || 0;
        player.bonds[id] ||= {...ps.bonds[id],layers:savedLayers[id] || 0};
        const spell=reason==='spell' && ps._growthSpell;
        if(spell)n*=context.spellScale || 1;
        const from=context.permanentLayers(id);
        // Already committed to the real player below; never charge it again through result.layerGains.
        const add=battle.addLayers(ps.playerId,id,n,'growth:replay',{source:context.unit,temporary:true,growthPermanent:!spell || context.spellKeep});
        if(!add)return 0;
        if(spell && !context.spellKeep)return add;
        savedLayers[id]=(savedLayers[id] || 0)+layerGainRoom(savedLayers[id] || 0,add,true);
        m.dispatch(ps,'onLayers',{bondId:id,from,to:context.permanentLayers(id),reason});
        ps.dirty();return add;
      },
      unit,
    };
    ps._growthCombat=context;
    // Readers (highest bond, milestones, native garrisons) see the same current layers as combat.
    ps.layers=new Proxy(savedLayers,{get:(target,key)=>player.bonds[key]?.layers ?? target[key]});
    try {
      // [ASSUMED] New acquisition events resolve FIFO inside this callback, in existing field order.
      // No recursive acquisition stack or gameplay chain-count cap is introduced.
      for(let i=0;i<context.queue.length && ps.alive;i++) {
        const task=context.queue[i];
        if(task.action) {context.unit=task.unit;task.action(ps,context);}
        else if(task.hook) {
          context.unit=battle.allyUnits.find(u=>u.ownerId===ps.playerId && u.uid===task.ev.piece?.uid) || null;
          m.dispatch(ps,task.hook,task.ev);
        }
        else {
          context.unit=task.unit;
          const target=context.find(task.unit.uid)?.piece;
          if(target && live(battle,task.unit))m.dispatcher.triggerGarrisons(ps,target,'SERVER_GAIN',{triggeredBy:task.source?.uid ?? null});
        }
      }
    } finally {
      // A lethal gain can stop queued hooks; its unstored resources must still release their real claims.
      for (const p of ps._overflowResources || []) ps._discardResource(p);
      player.growthKjeragBonus=ps.growthState?.kjeragBonus || 0;
      ps.layers=savedLayers;
      delete ps._growthCombat;
      ps.recompute();ps.dirty();m.markPublic();
      // Match the existing quit policy: an eliminated owner's normal field stops; shared fields continue.
      if(!ps.alive && battle.kind==='normal' && !battle.finished)battle.forceEnd('forced');
    }
  };
  battle.on('growthGainTrait',execute);
  battle.on('growthSpellStrength',({unit,n,allowDead=false})=>execute({unit,allowDead,action:ps=>{
    increaseGrowthSpellStrength(ps,n);
    for(const u of battle.allyUnits)if(u.ownerId===unit.ownerId && ['spellGainBonus','spellSkillBonus','spellDeathBonus'].includes(u.def?.raw?.growthTrait?.handler))u.growthTraitLive={value:ps.growthState.spellBonus};
  }}));
  battle.on('growthCastSpell',({unit,id})=>execute({unit,action:(ps,context)=>{
    if(!m.spellShop)return;
    const keep=[...context.board().values()].reduce((n,p)=>ps.gd.chess(p.id)?.growthTrait?.handler==='spellRetain'?Math.max(n,ps.gd.isGolden(p.id)?2:1):n,0);
    context.spellKeep=keep>0;context.spellScale=keep || 1;
    const previous=ps._automaticSpellItem,item=ps.newPiece('item',id);ps._automaticSpellItem=item;
    try {ps.castSpell(item.uid,null,null,true);}finally {
      if(previous)ps._automaticSpellItem=previous;else delete ps._automaticSpellItem;
      delete context.spellKeep;delete context.spellScale;
    }
  }}));
}

/** Inventory replacement is deliberately outside a live battle event. */
export function finishGrowthCombat(ps,{eliteGain=true}={}) {
  const pending=ps.growthCombatMerges;
  if(!pending)return;
  delete ps.growthCombatMerges;
  // loop-cap: each successful merge consumes the required ordinary copies from finite owned inventory.
  for(const base of pending)while(ps.completesChessMerge(base) && ps.countCopies(base)>=ps.gd.mergeCount(base)) {
    const elite=ps._mergeChess(base,null);
    if(!elite)break;
    if(eliteGain)ps.m.dispatch(ps,'onGain',{piece:elite,kind:'chess',source:'growth:combatMerge'});
  }
  ps.recompute();ps.dirty();
}
