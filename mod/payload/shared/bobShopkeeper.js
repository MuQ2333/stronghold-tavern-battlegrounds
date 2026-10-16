// Presentation-only event selection: no match mutation, gameplay random draw or server dependencies.
import {GEO} from './constants.js';
/** @param {any} pub @param {any} priv @param {(id:string)=>any} [getChess] */
export const bobSnapshot=(pub,priv,getChess=()=>null)=>{
 const pieces=[...(priv?.hand||[]),...(priv?.temp||[]),...(priv?.board||[])].filter(p=>p?.kind==='chess');
 const slots=(priv?.shop?.slots||[]).map(s=>s?{...s,tier:getChess(s.id)?.tier}:null);
 const counts=new Map();
 for(const p of pieces)if(!p.golden&&!p.handLock&&!p.spellLocked)counts.set(p.id,(counts.get(p.id)||0)+1);
 return {phase:pub?.phase,round:pub?.round,level:priv?.shop?.level,ready:priv?.ready,alive:priv?.alive,
  frozen:priv?.shop?.frozen,merges:priv?.stats?.merges||0,buys:priv?.stats?.buys||0,sells:priv?.stats?.sells||0,refreshes:priv?.stats?.refreshes||0,
  leaks:priv?.stats?.leaks||0,slots,pieces,paused:!!pub?.paused,
  pendingLp:pub?.players?.find(p=>p.playerId===priv?.playerId)?.pendingLp||0,
  triple:Array.from({length:GEO.HAND_SIZE},(_,i)=>priv?.hand?.[i]).some(p=>!p)?slots.find(s=>s?.kind==='chess'&&!s.sold&&(s.price||0)<=(priv?.funds||0)&&getChess(s.id)?.upgradeNum>1&&(counts.get(s.id)||0)+1>=getChess(s.id).upgradeNum)?.id||null:null};
};
export function bobCue(previous,current) {
  if(!previous||!current)return null;
  if(previous.alive!==false&&current.alive===false)return 'defeat';
  if(previous.phase!==current.phase){
    if(current.phase==='RESULT')return 'result';
    if(current.phase==='UNITE')return 'unite';
    if(current.phase==='FINAL_ASSAULT'||current.phase==='HIDDEN_CORE')return 'boss';
    if(current.phase==='COMBAT')return 'combat';
    if(current.phase==='PREP')return current.round===1?'welcome':'prep';
    if(current.phase==='BAND_DRAFT')return null;
  }
  if(current.phase!=='PREP'||current.ready||current.alive===false)return null;
  if(current.merges>previous.merges)return 'triple';
  if(current.level>previous.level)return 'upgrade';
  if(current.buys>previous.buys){
    if(!current.slots)return 'buy';
    const slot=current.slots.find((s,i)=>s?.sold&&s.kind==='chess'&&previous.slots?.[i]?.id===s.id&&!previous.slots[i].sold);
    if(slot)return slot.tier>=5?'buyHigh':slot.tier>=3?'buyMid':'buyLow';
  }
  if(current.sells>previous.sells&&(!current.pieces||previous.pieces?.some(p=>!current.pieces.some(q=>q.uid===p.uid))))return 'sell';
  if(current.refreshes>previous.refreshes)return 'refresh';
  if(!previous.frozen&&current.frozen)return 'freeze';
  return null;
}
export const BOB_COOLDOWN_MS=8000;

// Presentation history only: mount/reconnect establishes a baseline, never reconstructs past speech.
export class BobDirector {
 constructor(){this.previous=null;this.battle=null;this.outcome=null;this.streak=0;this.wins=0;this.welcomed=false;this.reminded=new Set();this.idleRound=null;this.taught=false;}
 observe(current){
  const previous=this.previous;this.previous=current;
  if(!previous)return null;
  if(previous.round!==current.round){this.reminded.clear();this.idleRound=null;}
  if(current.phase==='COMBAT'&&previous.phase!=='COMBAT')this.battle={round:current.round,leaks:current.leaks,pending:0};
  if(this.battle&&current.round===this.battle.round)this.battle.pending=Math.max(this.battle.pending,current.pendingLp||0);
  if(current.phase==='SETTLE'&&previous.phase!=='SETTLE'&&this.battle){
   const lost=current.leaks>this.battle.leaks||this.battle.pending>0;
   this.streak=lost?0:this.streak+1;
   this.outcome=lost?'loss':this.wins++===0?'firstWin':this.streak>=3?'streak':'win';
   this.battle=null;
  }
  let cue=bobCue(previous,current);
  if(current.phase==='PREP'&&previous.phase!=='PREP'&&this.outcome){cue=this.outcome;this.outcome=null;}
  if(cue==='welcome'){if(this.welcomed)return null;this.welcomed=true;}
  return cue;
 }
 idle(current,quietMs,tutorial=false){
  if(!current||current.phase!=='PREP'||current.ready||current.alive===false||current.paused)return null;
  if(current.triple&&!this.reminded.has(current.triple)&&quietMs>=3000){this.reminded.add(current.triple);return 'tripleAvailable';}
  if(tutorial&&!this.taught&&current.round===1&&current.buys===0&&quietMs>=10000){this.taught=true;return 'tutorial';}
  if(quietMs>=25000&&this.idleRound!==current.round){this.idleRound=current.round;return 'idle';}
  return null;
 }
}
export const bobPhaseCue=cue=>['welcome','prep','combat','win','firstWin','loss','streak'].includes(cue);
export const bobPriority=cue=>['welcome','prep','combat','win','firstWin','loss','streak','defeat','result','boss','unite','strategy'].includes(cue)?3:cue==='triple'?2:cue==='idle'||cue==='tutorial'||cue==='tripleAvailable'?0:1;
export const bobLines=(bank,cue,round=0)=>(bank[cue]||(cue==='firstWin'||cue==='streak'?bank.win:null)||[]).filter(line=>!line.minRound||round>=line.minRound);

// [ASSUMED] Public voice lists establish event categories, not Blizzard's exact probabilities.
// These presentation-only adaptation values deliberately make routine actions intermittent.
export const BOB_SPEECH_POLICY=Object.freeze({
 chance:Object.freeze({buyLow:.2,buyMid:.2,buyHigh:.2,sell:.2,refresh:.1,freeze:.3,upgrade:.6,idle:.4,tutorial:1,tripleAvailable:.4,combat:.6,prep:.5,win:.7,loss:.7,streak:.8,triple:1}),
 attemptGapMs:3000,refreshCooldownMs:20000,
});
export class BobSpeechGate {
 constructor(){this.lastAttempt=-Infinity;this.lastPlayed=-Infinity;this.lastRefreshPlayed=-Infinity;}
 consider(cue,now,round,random){
  const phaseCue=bobPhaseCue(cue);
  if(!phaseCue&&now-this.lastPlayed<BOB_COOLDOWN_MS)return false;
  if(cue==='refresh'&&now-this.lastRefreshPlayed<BOB_SPEECH_POLICY.refreshCooldownMs)return false;
  const chance=BOB_SPEECH_POLICY.chance[cue]??1;
  if(!phaseCue&&now-this.lastAttempt<BOB_SPEECH_POLICY.attemptGapMs)return false;
  this.lastAttempt=now;
  return random()<chance;
 }
 played(cue,now){this.lastPlayed=now;if(cue==='refresh')this.lastRefreshPlayed=now;}
}
