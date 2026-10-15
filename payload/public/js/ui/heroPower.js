import { html, Icon } from './components.js';
import { useEffect, useRef, useState } from '../../vendor/hooks.module.js';
import { t } from '../../../shared/i18n.js';
import { actions } from './gameActions.js';
import { Img, BondGlyph, RichText } from './gameComponents.js';
import { data } from '../data.js';
import {HERO_SOURCE_VERSION} from '../../../shared/heroCatalog.js';
import {lockedCardText} from './lockedCards.js';

export function HeroPower({ priv, gd, picked = null, onTargetMode = null, canTarget = true, routeSelection = false, onRouteSelection = null }) {
  const [inspect,setInspect]=useState(false), [hovered,setHovered]=useState(false), [targeting,setTargeting]=useState(false), [localRoutes,setLocalRoutes]=useState(false), [busy,setBusy]=useState(false);
  const routes=onRouteSelection?routeSelection:localRoutes, setRoutes=onRouteSelection||setLocalRoutes;
  const hold=useRef(null), hoverLeave=useRef(null), suppressClick=useRef(false), start=useRef(null), sending=useRef(false);
  const h=priv?.heroPower;
  const pending=!!h?.choices.length;
  const passive=h?.passive||h?.id==='faelin';
  const available=!!h&&!passive&&!h.disabled&&!busy&&!pending;
  const directTarget=h?.id==='cookie'||h?.id==='maiev';
  const picking=targeting&&available&&canTarget&&directTarget;
  const detailOpen=hovered||inspect||picking;
  const showHover=()=>{clearTimeout(hoverLeave.current);setHovered(true);};
  const hideHover=()=>{clearTimeout(hoverLeave.current);hoverLeave.current=setTimeout(()=>setHovered(false),160);};
  const stopHold=()=>{clearTimeout(hold.current);hold.current=null;};
  const send=async args=>{if(sending.current)return;sending.current=true;setBusy(true);setTargeting(false);setRoutes(false);setInspect(false);setHovered(false);try {await actions.heroPower(args);}finally{sending.current=false;setBusy(false);}};
  useEffect(()=>()=>{clearTimeout(hold.current);clearTimeout(hoverLeave.current);},[]);
  useEffect(()=>{setTargeting(false);setInspect(false);setHovered(false);setRoutes(false);},[h?.id,h?.round]);
  useEffect(()=>{onTargetMode?.(picking);},[picking,onTargetMode]);
  useEffect(()=>{if(!available||!canTarget){setTargeting(false);setRoutes(false);}},[available,canTarget]);
  useEffect(()=>{
    if(!picked||!picking)return;
    const x=h.targets.find(x=>picked.uid!==undefined?x.uid===picked.uid:x.slot===picked.slot&&x.id===picked.id);
    if(x)send({action:'use',...(x.uid!==undefined?{uid:x.uid}:{slot:x.slot,expectedId:x.id})});
  },[picked]);
  useEffect(()=>{
    if(!detailOpen&&!routes)return;
    const cancel=e=>{if(e.key==='Escape'){setTargeting(false);setInspect(false);setHovered(false);setRoutes(false);}};
    window.addEventListener('keydown',cancel);
    return()=>window.removeEventListener('keydown',cancel);
  },[detailOpen,routes]);
  if(!h) return null;
  const label=x=>(x.kind==='item'?gd.item(x.id):gd.chess(x.id))?.name||x.id;
  const rotates=h.id==='tess'||h.id==='scabbs';
  const status=picking?t('请选择目标'):pending?t('待选择'):passive?t('被动技能'):h.cooldown?`${t('冷却')} ${h.cooldown}`:h.used?t('本轮已使用'):h.disabled?t('暂不可用'):t('发动技能');
  const icon=`/assets/heroes/power-${h.id}.jpg?v=${HERO_SOURCE_VERSION}`;
  const close=()=>{setTargeting(false);setInspect(false);setHovered(false);setRoutes(false);};
  const facts=[
    ...(rotates?[[t('本轮队友'),h.sourcePlayer?.name||t('无可用队友')]]:[]),
    ...(h.progress?[[t('进度'),h.progress]]:[]),
    ...(h.cooldown?[[t('冷却'),h.cooldown]]:[]),
    ...(h.id==='cenarius'?[[t('资金'),`+${h.income}/${t('回合')}`]]:[]),
    ...(h.id==='nozdormu'?[[t('剩余次数'),h.freeRefresh]]:[]),
    ...(h.roll?[[t('进度'),h.roll]]:[]),
  ];
  const activate=()=>{
    if(suppressClick.current){suppressClick.current=false;return;}
    if(pending||!available){setInspect(!inspect);return;}
    setInspect(false);
    setHovered(false);
    if(directTarget){if(canTarget)setTargeting(!targeting);}
    else if(h.id==='galewing')setRoutes(!routes);
    else send({action:'use'});
  };
  return html`<section class="hero-power"
    onPointerEnter=${e=>{if(e.pointerType==='mouse')showHover();}}
    onPointerLeave=${e=>{if(e.pointerType==='mouse')hideHover();}}
    onFocusOut=${e=>{if(!e.currentTarget.contains(e.relatedTarget))setHovered(false);}}>
    <div class="hero-power__control">
      <button type="button" class=${`hero-power__toggle ${available?'is-available':''} ${passive?'is-passive':''} ${!available&&!passive&&!pending?'is-unavailable':''} ${pending?'has-choice':''} ${picking?'is-targeting':''}`}
        onClick=${activate} onContextMenu=${e=>{e.preventDefault();stopHold();setInspect(true);}}
        onPointerDown=${e=>{suppressClick.current=false;start.current={x:e.clientX,y:e.clientY};if(e.pointerType==='touch'||e.pointerType==='pen'){stopHold();hold.current=setTimeout(()=>{suppressClick.current=true;setInspect(true);setTargeting(false);setRoutes(false);},500);}}}
        onPointerMove=${e=>{if(start.current&&Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>12)stopHold();}}
        onPointerUp=${stopHold} onPointerCancel=${stopHold} onFocus=${showHover}
        aria-expanded=${detailOpen||routes} aria-controls=${routes?'hero-flight-choices':'hero-power-detail'} aria-pressed=${picking} aria-label=${`${t('英雄技能')} · ${h.name} · ${status}`}>
        <span class="hero-power__art"><${Img} src=${icon} alt="" fallback=${html`<span class="hero-power__fallback">${h.name.slice(0,1)}</span>`} /></span>
        ${!passive?html`<span class="hero-power__cost" aria-label=${`${t('资金')} ${h.price}`}>${h.price}</span>`:null}
        ${pending?html`<span class="hero-power__badge">!</span>`:h.cooldown?html`<span class="hero-power__badge">${h.cooldown}</span>`:h.used?html`<span class="hero-power__badge">✓</span>`:null}
      </button>
      <span class="hero-power__name">${h.name}</span><span class="hero-power__status">${status}</span>
      ${h.temporary?html`<span class="hero-power__source">${t('仅本回合生效')}</span>`:null}
      ${rotates?html`<span class="hero-power__source">${t('本轮队友')}：${h.sourcePlayer?.name||t('无可用队友')}</span>`:null}
    </div>
    ${detailOpen?html`<aside id="hero-power-detail" class="hero-power__panel dpanel brackets" aria-label=${`${t('英雄技能')} · ${h.name}`}>
      <button type="button" class="dpanel__close hero-power__close" onClick=${close} aria-label=${picking||routes?t('取消'):t('关闭')} title=${picking||routes?t('取消'):t('关闭')}><${Icon} name="close"/></button>
      <div class="dpanel__scroll hero-power__scroll">
        <section class="dsec dsec--skill">
          <div class="dskill">
            <${Img} src=${icon} class="dskill__icon" alt="" fallback=${html`<span class="dskill__icon dskill__icon--empty">${h.name.slice(0,1)}</span>`}/>
            <div class="dskill__meta"><b class="dskill__name">${h.name}</b>
              <div class="dskill__tags">
                ${passive||pending||h.cooldown||h.used||h.disabled||picking?html`<span class="dsp dsp--trig">${status}</span>`:null}
                ${!passive?html`<span class="dsp__num">${t('资金')} <b class="num">${h.price}</b></span>`:null}
              </div>
            </div>
          </div>
          <${RichText} as="p" text=${h.desc} class="dtext hero-power__description"/>
        </section>
        ${picking?html`<div class="dhint hero-power__target" role="status"><${Icon} name="info"/><div><b class="hero-power__aim">${h.id==='cookie'?t('点击调度中心、整备区或作战区中的干员入锅'):t('点击调度中心中的卡牌将其锁入整备区')}</b><p>${t('点击目标立即生效，再次点击技能或按Esc取消')}</p></div></div>`:null}
        ${facts.length?html`<dl class="hero-power__facts">${facts.map(([name,value])=>html`<div><dt>${name}</dt><dd>${value}</dd></div>`)}</dl>`:null}
        ${h.id==='cookie'?html`<section class="dsec"><h4 class="dsec__title">${t('已入锅的盟约')}</h4><div class="hero-power__pot">${Array.from({length:3},(_,i)=>html`<div class=${`hero-power__ingredient ${h.pot[i]?'is-filled':''}`}><b>${i+1}</b>${h.pot[i]?h.pot[i].map(id=>html`<span><${BondGlyph} bondId=${id}/>${data.lookup('bonds',id)?.name||id}</span>`):html`<small>${t('待入锅')}</small>`}</div>`)}</div></section>`:null}
        ${h.locked.length?html`<ul class="hero-power__locks">${h.locked.map(x=>html`<li><b>${label(x)}</b><span>${lockedCardText({unlockRound:x.round,unlockLevel:x.level},{round:h.round||0,level:priv.shop?.level||0})}</span></li>`)}</ul>`:null}
      </div>
    </aside>`:null}
  </section>`;
}
