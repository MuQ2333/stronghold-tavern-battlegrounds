import { useEffect, useLayoutEffect, useRef, useState } from '../../vendor/hooks.module.js';
import { html, Icon, useTicker } from './components.js';
import { UnitThumb } from './gameComponents.js';
import { battleRunner } from '../battle/runner.js';
import { t, N_ } from '../../../shared/i18n.js';
import { combatMetricsLayout } from './combatMetricsLayout.js';
import {metricArchive,downloadMetrics} from '../battle/metricArchive.js';
import {data} from '../data.js';
import {useStore} from '../store.js';

const TYPES = Object.freeze([
  { id: 'phys', label: N_('物理') }, { id: 'arts', label: N_('法术') },
  { id: 'true', label: N_('真实') }, { id: 'elemental', label: N_('元素') },
]);
const number = (n) => Math.round(n || 0).toLocaleString('zh-CN');
const rate = (n) => (n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 1 });

/** Keep saved growth records accessible after results and after returning to the title. */
export function CombatArchiveHost() {
  const [open,setOpen]=useState(false);
  const inMatch=useStore(s=>!!s.match.public&&!s.match.result&&s.match.public.phase!=='RESULT');
  useTicker(1000);
  if(inMatch||!metricArchive.sessions().length)return null;
  return html`<div class="combat-archive-launcher">
    ${open?html`<${CombatMetricsPanel} streaming=${true} onClose=${()=>setOpen(false)} />`:null}
    <button type="button" onClick=${()=>setOpen(!open)}>${t('作战统计')}</button>
  </div>`;
}

/** A modeless panel: the battlefield stays visible and keeps playing. Mounted only while open. */
export function CombatMetricsPanel({ myId, onClose, runner = battleRunner, streaming = false }) {
  const [scope, setScope] = useState('battle');
  const [sessionKey,setSessionKey]=useState(null);
  const [battleKey,setBattleKey]=useState(null);
  const [,redraw]=useState(0);
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  useTicker(250);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape' || document.querySelector('.modal, .guide')) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const corner = panel?.parentElement;
    const viewport = window.visualViewport;
    const measure = () => {
      if (!panel || !corner) return;
      const rect = corner.getBoundingClientRect();
      const rootStyle = getComputedStyle(document.documentElement);
      const layout = combatMetricsLayout({
        cornerTop: rect.top, cornerBottom: rect.bottom,
        viewportHeight: viewport?.height || window.innerHeight,
        viewportTop: viewport?.offsetTop || 0,
        rem: parseFloat(rootStyle.fontSize) || 40,
        safeTop: parseFloat(rootStyle.getPropertyValue('--sa-t')) || 0,
        safeBottom: parseFloat(rootStyle.getPropertyValue('--sa-b')) || 0,
      });
      panel.style.setProperty('--combat-corner-height', `${rect.height || 44}px`);
      panel.style.setProperty('--combat-available-height', `${layout.availableHeight}px`);
      panel.style.setProperty('--combat-viewport-height', `${layout.viewportSpace}px`);
      panel.style.setProperty('--combat-viewport-top', `${layout.viewportPanelTop}px`);
      panel.dataset.viewportDocked = String(layout.viewportDocked);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (corner) observer?.observe(corner);
    window.addEventListener('resize', measure);
    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
    };
  }, []);
  const sessions=streaming?metricArchive.sessions():[];
  const wanted=sessionKey||metricArchive.current();
  const selected=wanted?sessions.find(s=>s.key===wanted):sessions[0];
  const selectedBattle=(battleKey?selected?.battles.find(b=>b.battleKey===battleKey):selected?.battles.at(-1));
  const bonds=data.get('bonds')||{};
  const cores=selected?.coreBonds?.length?selected.coreBonds:Object.values(bonds).filter(b=>b.isCore).map(b=>({id:b.bondId,name:b.name}));
  const annotate=patch=>{if(selected){metricArchive.annotate(selected.key,patch);redraw(n=>n+1);}};
  const result = (streaming?metricArchive.combatMetrics({scope,sessionKey:selected?.key,battleKey}):myId ? runner?.combatMetrics({ scope, ownerId: myId }) : null) || { rows: [], damage: 0, healing: 0 };
  const maximum = Math.max(1, ...result.rows.map((r) => r.damage));
  return html`<section ref=${panelRef} id="combat-metrics-panel" class=${`combat-metrics brackets${streaming?' combat-metrics--archive':''}`} role="dialog" aria-label=${t('作战统计')}
      onKeyDown=${(e) => { if (e.key === 'Escape') onClose(); e.stopPropagation(); }}>
    <header class="combat-metrics__head">
      <div><span class="combat-metrics__micro">COMBAT ANALYSIS</span><h2>${t('作战统计')}</h2></div>
      <button ref=${closeRef} type="button" class="combat-metrics__close" aria-label=${t('关闭作战统计')} onClick=${onClose}><${Icon} name="close" /></button>
      <div class="combat-metrics__tools">
        <div class="combat-metrics__scopes" role="group" aria-label=${t('统计范围')}>
          ${[['battle', t('当前战斗')], ['match', t('本局累计')], ['last', t('上一场战斗')]].map(([id, label]) => html`<button type="button" key=${id}
            aria-pressed=${scope === id} onClick=${() => setScope(id)}>${label}</button>`)}
        </div>
      </div>
    </header>
    <div class="combat-metrics__body" tabindex="0">
    ${streaming?html`<details class="combat-metrics__archive"><summary>${t('测试记录')}</summary><div class="combat-metrics__archive-form">
      <label>${t('测试记录')} <select aria-label=${t('测试记录')} value=${selected?.key||''} onChange=${e=>{setSessionKey(e.currentTarget.value);setBattleKey(null);}}>
        ${!selected?html`<option value="">${t('暂无本地战斗记录')}</option>`:null}
        ${sessions.map(s=>html`<option value=${s.key}>${s.main?(s.coreBonds?.find(b=>b.id===s.main)?.name||bonds[s.main]?.name||s.main):t('未标记')} · ${new Date(s.started).toLocaleString()} · R${s.battles.at(-1)?.round||0}${s.hasTestActions?' *':''}</option>`)}
      </select></label>
      <label>${t('主盟约标记')} <select aria-label=${t('主盟约标记')} value=${selected?.main||''} onChange=${e=>annotate({main:e.currentTarget.value})}>
        <option value="">${t('未标记')}</option>${cores.map(b=>html`<option value=${b.id}>${b.name}</option>`)}
      </select></label>
      ${scope==='battle'?html`<label>${t('战斗记录')} <select aria-label=${t('战斗记录')} value=${battleKey||''} onChange=${e=>setBattleKey(e.currentTarget.value||null)}>
        <option value="">${t('最新战斗')}</option>${selected?.battles.map(b=>html`<option value=${b.battleKey}>R${b.round} · ${b.kind} · ${b.record.seconds.toFixed(1)}s</option>`)}
      </select></label>`:null}
      <label>${t('测试备注')} <input aria-label=${t('测试备注')} maxlength="2000" value=${selected?.note||''} onInput=${e=>annotate({note:e.currentTarget.value})} /></label>
      <button type="button" onClick=${()=>downloadMetrics('csv')}>${t('导出对比CSV')}</button>
      <button type="button" onClick=${()=>downloadMetrics('json')}>${t('导出完整记录')}</button>
      <p>${t('保留最近30局，可选择历史战斗；星号表示使用过测试指令。不同局请按相同回合比较。')}</p>
      ${metricArchive.storageFailed()?html`<p role="alert">${t('本地保存失败，请立即导出记录。')}</p>`:null}
    </div></details>`:null}
    ${streaming&&selected?html`<p class="combat-metrics__note">${selected.main?(cores.find(b=>b.id===selected.main)?.name||selected.main):t('未标记')} · ${scope==='match'?t('本局累计'):`R${selectedBattle?.round||0} · ${(selectedBattle?.record.seconds||0).toFixed(1)}s`}${selected.hasTestActions?' *':''}</p>`:null}
    <div class="combat-metrics__totals">
      <span>${t('总伤害')} <b>${number(result.damage)}</b></span><span>${t('总治疗')} <b>${number(result.healing)}</b></span>
    </div>
    <div class="combat-metrics__legend" aria-label=${t('伤害类型图例')}>
      ${TYPES.map((type) => html`<span key=${type.id} class=${`combat-metrics__type combat-metrics__type--${type.id}`}>${t(type.label)}</span>`)}
      <span class="combat-metrics__sort">${t('伤害降序')}</span>
    </div>
    <ol class="combat-metrics__list" tabindex="0" aria-label=${t('干员伤害排行')}>
      ${result.rows.length ? result.rows.map((r, i) => {
        const description = TYPES.map((type) => `${t(type.label)} ${number(r.types[type.id])}`).join('，');
        return html`<li key=${r.key} class="combat-metrics__row">
          <span class="combat-metrics__rank">${String(i + 1).padStart(2, '0')}</span>
          <${UnitThumb} kind=${r.kind === 'token' ? 'token' : 'chess'} id=${r.defId} ownerId=${r.ownerId}
            rec=${r.picture?.charId ? { ...r.picture, name: r.name } : null} showTier=${false} size="sm" />
          <div class="combat-metrics__unit">
            <div class="combat-metrics__name"><b title=${r.name}>${r.name || r.defId}</b></div>
            <div class="combat-metrics__bar" role="img" aria-label=${description} title=${description}>
              ${TYPES.map((t) => html`<span key=${t.id} class=${`combat-metrics__segment combat-metrics__segment--${t.id}`}
                style=${{ width: `${r.types[t.id] / maximum * 100}%` }}></span>`)}
            </div>
            <div class="combat-metrics__values">
              <span><small>${t('伤害')}</small><b>${number(r.damage)}</b></span>
              <span><small>${t('伤害占比')}</small><b>${result.damage?(100*r.damage/result.damage).toFixed(1):'0.0'}%</b></span>
              <span><small>DPS</small><b>${rate(r.dps)}</b></span>
              <span class="combat-metrics__heal"><small>${t('治疗')}</small><b>${number(r.healing)}</b></span>
              <span class="combat-metrics__heal"><small>HPS</small><b>${rate(r.hps)}</b></span>
            </div>
          </div>
        </li>`;
      }) : html`<li class="combat-metrics__empty">${scope === 'last' ? t('暂无上一场战斗记录') : t('暂无本地战斗记录')}<br /><small>${scope === 'last' ? t('打完一场战斗后显示') : t('开始战斗后实时显示干员数据')}</small></li>`}
    </ol>
    <p class="combat-metrics__note">${t('仅统计自己 · 同名干员合并 · 召唤物计入所属干员')}<br />${streaming?t('服务端有效伤害与治疗，每秒更新；DPS按战斗秒数计算。复制体按自身同名干员合并，未归属伤害不计入。'):t('实际扣血 / 有效治疗，DPS / HPS 按自己的战斗秒数计算。刷新后重新累计。')}</p>
    </div>
  </section>`;
}
