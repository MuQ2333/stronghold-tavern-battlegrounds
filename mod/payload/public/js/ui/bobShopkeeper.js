import {useEffect,useLayoutEffect,useRef,useState}from '../../vendor/hooks.module.js';
import {html}from './components.js';
import {t}from '../../../shared/i18n.js';
import {audio}from '../audio.js';
import {BobDirector,BobSpeechGate,bobSnapshot,bobPriority,bobLines,BOB_COOLDOWN_MS}from '../../../shared/bobShopkeeper.js';
import {BOB_VOICE_MANIFEST}from './bobVoiceManifest.js';
import {getChess}from '../data.js';
import {serverNow}from '../store.js';
const key='sp.tavern.bob.enabled';
export function bobEnabled(){try{return localStorage.getItem(key)==='true';}catch{return false;}}
export function setBobEnabled(enabled){try{localStorage.setItem(key,String(!!enabled));}catch{/* private browsing */}window.dispatchEvent(new CustomEvent('sp:bob-setting',{detail:!!enabled}));}
const muteKey='sp.tavern.bob.muted';
export function bobMuted(){try{return localStorage.getItem(muteKey)==='true';}catch{return false;}}
export function setBobMuted(muted){try{localStorage.setItem(muteKey,String(!!muted));}catch{/* private browsing */}window.dispatchEvent(new CustomEvent('sp:bob-muted',{detail:!!muted}));}
export function BobPreference(){const[enabled,setEnabled]=useState(bobEnabled);return html`<label class="tavern-mod"><input type="checkbox" checked=${enabled} onChange=${e=>{setEnabled(e.target.checked);setBobEnabled(e.target.checked);}} />${t('鲍勃商店老板（仅自己）')}</label>`;}
export function BobShopkeeper({pub,priv}){
 const[enabled,setEnabled]=useState(bobEnabled),[muted,setMuted]=useState(bobMuted),[menu,setMenu]=useState(false),[line,setLine]=useState(''),last=useRef(-Infinity),index=useRef({}),pending=useRef(null),box=useRef(null),avatar=useRef(null),option=useRef(null);
 const director=useRef(new BobDirector()),speechGate=useRef(new BobSpeechGate()),queue=useRef(null),activity=useRef(performance.now()),live=useRef(null),playToken=useRef(0);
 live.current={pub,priv,enabled,muted};
 const stop=()=>{playToken.current++;pending.current?.();pending.current=null;setLine('');};
 const enqueue=cue=>{
  if(!cue||!bobLines(BOB_VOICE_MANIFEST,cue,pub?.round).length)return;
  if(!speechGate.current.consider(cue,performance.now(),pub?.round,Math.random))return;
  if(!queue.current||bobPriority(cue)>=bobPriority(queue.current.cue)){queue.current={cue,phase:pub?.phase,expires:performance.now()+8000};stop();}
 };
 useEffect(()=>{
  const change=e=>{setEnabled(e.detail);setMenu(false);queue.current=null;stop();},mute=e=>{setMuted(e.detail);queue.current=null;stop();};
  window.addEventListener('sp:bob-setting',change);window.addEventListener('sp:bob-muted',mute);
  const input=()=>{activity.current=performance.now();if(queue.current&&bobPriority(queue.current.cue)===0)queue.current=null;};
  const visibility=()=>{activity.current=performance.now();queue.current=null;stop();};
  window.addEventListener('pointerdown',input,true);window.addEventListener('keydown',input,true);document.addEventListener('visibilitychange',visibility);
  const timer=setInterval(()=>{
   const state=live.current,now=performance.now();
   if(!state.enabled||state.muted||document.hidden||state.pub?.paused||audio.volumes.muted||audio.volumes.voice<=0){queue.current=null;return;}
   const remaining=state.pub?.deadline?state.pub.deadline-serverNow():Infinity;
   if(!queue.current&&!pending.current&&remaining>15000){
    const cue=director.current.idle(director.current.previous,now-activity.current,true);
    if(cue&&bobLines(BOB_VOICE_MANIFEST,cue,state.pub?.round).length&&speechGate.current.consider(cue,now,state.pub?.round,Math.random))queue.current={cue,phase:state.pub?.phase,expires:now+8000};
   }
   const job=queue.current;if(!job)return;
   if(now>job.expires||job.phase!==state.pub?.phase){queue.current=null;return;}
   if(!audio.ctx||audio.ctx.state==='suspended')return;
   if(bobPriority(job.cue)<3&&(pending.current||now-last.current<BOB_COOLDOWN_MS))return;
   queue.current=null;stop();
   const lines=bobLines(BOB_VOICE_MANIFEST,job.cue,state.pub?.round),i=index.current[job.cue]||0,chosen=lines[i%lines.length];if(!chosen)return;index.current[job.cue]=i+1;
   const token=++playToken.current;last.current=now;speechGate.current.played(job.cue,now);setLine(chosen.text);
   let finished=false;
   const cancel=audio.narrator(chosen.url,()=>{finished=true;if(playToken.current===token){pending.current=null;setLine('');}});
   pending.current=finished?null:cancel;
  },250);
  return()=>{clearInterval(timer);window.removeEventListener('sp:bob-setting',change);window.removeEventListener('sp:bob-muted',mute);window.removeEventListener('pointerdown',input,true);window.removeEventListener('keydown',input,true);document.removeEventListener('visibilitychange',visibility);playToken.current++;pending.current?.();};
 },[]);
 useLayoutEffect(()=>{
  if(!menu)return undefined;
  if(!enabled||pub?.phase!=='PREP'){setMenu(false);return undefined;}
  option.current?.focus();
  const outside=e=>{if(!box.current?.contains(e.target))setMenu(false);};
  const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setMenu(false);avatar.current?.focus();}};
  window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',escape,true);
  return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',escape,true);};
 },[menu,enabled,pub?.phase]);
 useEffect(()=>{
  if(!priv)return;
  const current=bobSnapshot(pub,priv,getChess),previous=director.current.previous,cue=director.current.observe(current);
  if(!previous||previous.phase!==current.phase){queue.current=null;stop();activity.current=performance.now();}
  if(previous&&(previous.buys!==current.buys||previous.sells!==current.sells||previous.refreshes!==current.refreshes))activity.current=performance.now();
  if(enabled&&!muted)enqueue(cue);
 },[pub,priv,enabled,muted]);
 if(['INFO_CHECK','BAND_DRAFT','BATTLE_CHECK'].includes(pub?.phase))return null;
 if(!enabled)return pub?.phase==='PREP'?html`<button type="button" class="bob-shopkeeper bob-shopkeeper--off" onClick=${()=>setBobEnabled(true)}>${t('开启鲍勃')}</button>`:null;
 if(pub?.phase!=='PREP'&&!line)return null;
 return html`<aside ref=${box} class=${`bob-shopkeeper${muted?' is-muted':''}`} aria-label=${t('商店老板鲍勃')}>
  <button ref=${avatar} type="button" class="bob-shopkeeper__avatar" aria-label=${t('鲍勃选项')} aria-haspopup="menu" aria-expanded=${menu} onClick=${()=>setMenu(open=>!open)} onKeyDown=${e=>{if(e.key==='ArrowDown'){e.preventDefault();setMenu(true);}}}>
   <img src="/assets/bob/portrait.png" alt="" /><span><strong>${t('鲍勃')}</strong>${muted?html`<small>${t('已屏蔽')}</small>`:null}</span>
  </button>
  ${line&&!muted?html`<p class="bob-shopkeeper__line" role="status">${line}</p>`:null}
  ${menu?html`<div class="bob-shopkeeper__menu" role="menu" aria-label=${t('鲍勃选项')}><button ref=${option} type="button" role="menuitem" onClick=${()=>{setBobMuted(!muted);setMenu(false);avatar.current?.focus();}}>${muted?t('取消屏蔽'):t('屏蔽鲍勃')}</button></div>`:null}
 </aside>`;
}
