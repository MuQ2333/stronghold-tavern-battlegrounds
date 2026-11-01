import {trackCombat,combineCombat} from '../../shared/combatMetrics.js';
import {liveBondLayers} from './liveLayers.js';

/** Optional, observational growth-mode meter. No state changes or extra RNG draws. */
export const metricMatchKey=m=>`${m.roomCode}.${m.battlePrefix}`;

export function attachFieldMetrics(m,f) {
  try { attach(m,f); } catch(e) {
    f.metricRead?.stop?.();f.metricRead=null;
    m.log?.warn?.('combat metrics unavailable',String(e));
  }
}

function attach(m,f) {
  if(!m.growthMode || typeof f.battle?.on!=='function' || typeof f.battle?.heal!=='function')return;
  f.metricRead=trackCombat(f.battle);
  f.metricContext={};
  for(const pid of f.players) {
    const ps=m.players.get(pid);if(!ps)continue;
    f.metricContext[pid]={lp:ps.lp,shopLevel:ps.shop.level,funds:ps.funds,bandId:ps.bandId,
      stats:{...ps.stats},layers:{...ps.layers},
      board:[...ps.board].filter(([,p])=>p.kind==='chess').map(([pos,p])=>({pos,id:p.id,uid:p.uid,name:ps.gd.chess(p.id)?.name,bonds:ps.gd.chess(p.id)?.bonds,items:structuredClone(p.items||[])})),
    };
  }
}

export function emitFieldMetrics(m,f) {
  try { emit(m,f); } catch(e) { m.log?.warn?.('combat metrics sample failed',String(e)); }
}

function emit(m,f) {
  if(!f.metricRead)return;
  if(f.metricFinalSent)return;
  const seconds=f.battle.time||0;
  if(f.live && f.metricAt!=null && seconds-f.metricAt+1e-8<(m.gameSpeed||2))return;
  f.metricAt=seconds;
  const record=f.metricRead(),layers=liveBondLayers(f.battle);
  for(const pid of f.players) {
    const result=!f.live?f.battle.result():null,own=result?.perPlayer?.[pid];
    const packet={t:'m.combatMetrics',matchKey:metricMatchKey(m),battleKey:`${m.round}.${f.fieldId}`,
      round:m.round,kind:f.kind,done:!f.live,modeId:m.modeId,seed:m.seed,stageId:m.stageId,cs:m.cs,
      balanceVersion:'growth-2026-10-23-early80-uncapped-hit-stage-growth',
      coreBonds:m.gd?.bondIds.filter(id=>m.gd.bond(id)?.isCore).map(id=>({id,name:m.gd.bond(id).name}))||[],
      heroMod:m.heroMod,disabledBonds:m.disabledBonds,hasTestActions:!!m.testActions,
      context:f.metricContext[pid],layers:layers[pid]||{},
      record:{seconds:record.seconds,owners:[pid],rows:combineCombat([record],pid).rows},
      killed:f.battle.killed||0,total:f.battle.total||0,
      ...(result?{result:{reason:result.reason,errors:result.errors,synthetic:!!result.synthetic,killed:own?.killed,total:own?.total,
        leaked:own?.leaked?.length||0,damageDealt:own?.damageDealt,bossDamage:own?.bossDamage,permanentLayerGains:own?.layerGains}}:{}),
    };
    const history=m.combatMetricHistory ||= new Map();
    if(!history.has(pid))history.set(pid,new Map());
    const ownHistory=history.get(pid);ownHistory.set(packet.battleKey,packet);
    // Bound custom/Forge matches too, without keeping a per-tick event log.
    // loop-cap: one oldest entry removed each time until the finite history is at most 64 fields.
    while(ownHistory.size>64)ownHistory.delete(ownHistory.keys().next().value);
    m.sendTo(pid,packet);
  }
  if(!f.live)f.metricFinalSent=true;
}

export function replayFieldMetrics(m,pid) {
  for(const packet of m.combatMetricHistory?.get(pid)?.values()||[])m.sendTo(pid,packet);
}
