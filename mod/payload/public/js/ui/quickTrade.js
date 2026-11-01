// UI-only drop target. Native sell/destroy intents remain authoritative for price, traits, locks and stock.
import {underframeActions} from './facing.js';
import {html} from './components.js';
import {GIcon} from './gameComponents.js';
import {t} from '../../../shared/i18n.js';

export function quickTradeInfo(ctx,uid) {
  const a=underframeActions(ctx,uid);
  if(a?.destroy)return {kind:'destroy',uid,price:null};
  if(a?.sell!=null)return {kind:'sell',uid,price:a.sell};
  return null;
}

export function quickTradeHit(rect,point) {
  return !!rect && !!point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x>=rect.left && point.x<rect.right && point.y>=rect.top && point.y<rect.bottom;
}

export function QuickTradeZone({info,name='',zoneRef,mirror=false}) {
  const label=info?.kind==='sell'?t('拖入出售'):info?.kind==='destroy'?t('拖入销毁'):t('无法出售或销毁');
  return html`<div ref=${zoneRef} class=${`quick-trade ${info?'':'is-disabled'} ${mirror?'is-mirrored':''}`} role="region" aria-label=${t('快捷出售／销毁')}>
    <${GIcon} name=${info?.kind==='sell'?'sell':'trash'} />
    <strong>${label}</strong>
    ${name?html`<span class="quick-trade__name">${name}</span>`:null}
    ${info?.kind==='sell'?html`<span class="quick-trade__price">${t('获得 {n} 资金',{n:info.price})}</span>`:null}
    <small>${info?t('松手执行，移出取消'):t('此对象不可在此处理')}</small>
  </div>`;
}
