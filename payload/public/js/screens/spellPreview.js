import { useEffect, useMemo, useRef, useState } from '../../vendor/hooks.module.js';
import { html, Button, Icon, Modal, Spinner } from '../ui/components.js';
import { Img, RichText } from '../ui/gameComponents.js';
import { itemIconUrl } from '../ui/assetUrls.js';
import { createStore, useStore, selectRoute } from '../store.js';
import { data, useData } from '../data.js';
import { spellTarget } from '../../../shared/spells.js';
import { spellPreviewRoster, filterSpellPreview, spellPreviewText } from '../ui/spellPreviewModel.js';
import { t } from '../../../shared/i18n.js';

const previewStore = createStore({ open: false });
export const openSpellPreview = () => previewStore.set({ open: true });
export const closeSpellPreview = () => previewStore.set({ open: false });

export function SpellPreviewButton({ size = 'sm' }) {
  return html`<${Button} size=${size} icon="search" class="spell-preview-entry" onClick=${openSpellPreview}>${t('法术预览')}<//>`;
}

function SpellCard({ rec, assets }) {
  const target = spellTarget(rec);
  return html`<article class="spell-preview-card" data-spell-id=${rec.id}>
    <div class=${`spell-preview-card__art ${rec.spellMod?'is-imported':'is-native'}`}><${Img} src=${itemIconUrl(assets, rec)} alt="" fallback=${html`<${Icon} name="search" />`} /></div>
    <div class="spell-preview-card__info">
      <header><h3>${rec.name}</h3><span class="spell-preview-card__tier">${t('{n} 阶', { n: rec.tier })}</span></header>
      <div class="spell-preview-card__meta"><b>${rec.currency === 'life' ? t('{n} 生命', { n: rec.price }) : t('{n} 资金', { n: rec.price })}</b>
        <span>${target === 'chess' ? t('指定干员') : target === 'tile' ? t('指定地块') : t('直接施放')}</span>
        ${rec.isGolden ? html`<span>${t('金色版本')}</span><span>${t('特殊来源')}</span>` : null}
        ${rec.multiplayerOnly ? html`<span>${t('仅联机')}</span>` : null}
        ${rec.oncePerRound ? html`<span>${t('每回合限一次')}</span>` : null}
        ${rec.poolDisabled ? html`<span class="spell-preview-card__disabled">${t('暂不入池')}</span>` : null}
      </div>
      <${RichText} as="p" class="spell-preview-card__effect" text=${spellPreviewText(rec)} />
      ${rec.choices?.length ? html`<ol class="spell-preview-card__choices">${rec.choices.map((choice, i) => html`<li key=${i}><${RichText} text=${choice} /></li>`)}</ol>` : null}
    </div>
  </article>`;
}

function SpellPreviewScreen() {
  const settled = useData('items', 'assets');
  const [query, setQuery] = useState(''), [tier, setTier] = useState(''), [target, setTarget] = useState(''), [availability, setAvailability] = useState('active');
  const route = useStore(selectRoute), initialRoute = useRef(route);
  // A room starting its match closes this out-of-match page automatically.
  useEffect(() => { if (route === 'game' && initialRoute.current !== 'game') closeSpellPreview(); }, [route]);
  const records = useMemo(() => spellPreviewRoster(data.get('items')), [settled, data.locale()]);
  const visible = filterSpellPreview(records, { query, tier, target, availability });
  const reset = () => { setQuery(''); setTier(''); setTarget(''); setAvailability('active'); };
  return html`<${Modal} open=${true} onClose=${closeSpellPreview} class="spell-preview" width="100vw" closeOnBackdrop=${false}>
    <header class="spell-preview__head"><${Button} variant="ghost" icon="chevronLeft" onClick=${closeSpellPreview}>${t('返回')}<//>
      <h2>${t('法术预览')}</h2><span role="status">${t('共 {n} 张', { n: visible.length })}</span></header>
    <div class="spell-preview__filters">
      <label class="spell-preview__search"><span>${t('搜索法术')}</span><input type="search" value=${query} placeholder=${t('搜索名称或效果')} onInput=${e => setQuery(e.target.value)} /></label>
      <label><span>${t('等阶')}</span><select value=${tier} onChange=${e => setTier(e.target.value)}><option value="">${t('全部等阶')}</option>${[1,2,3,4,5,6].map(n => html`<option key=${n} value=${n}>${t('{n} 阶', { n })}</option>`)}</select></label>
      <label><span>${t('施放目标')}</span><select value=${target} onChange=${e => setTarget(e.target.value)}><option value="">${t('全部目标')}</option><option value="chess">${t('指定干员')}</option><option value="tile">${t('指定地块')}</option><option value="global">${t('直接施放')}</option></select></label>
      <label><span>${t('入池状态')}</span><select value=${availability} onChange=${e => setAvailability(e.target.value)}><option value="active">${t('可入池')}</option><option value="special">${t('特殊来源')}</option><option value="disabled">${t('暂不入池')}</option><option value="all">${t('全部')}</option></select></label>
      <${Button} variant="ghost" size="sm" onClick=${reset}>${t('重置筛选')}<//>
    </div>
    <p class="spell-preview__note">${t('展示固定基础效果；实际费用和效果以对局中的加成与使用条件为准。')}</p>
    <div class="spell-preview__list" tabindex="0" aria-label=${t('法术列表')}>
      ${!settled ? html`<${Spinner} label=${t('正在载入法术…')} />` : visible.length ? visible.map(rec => html`<${SpellCard} key=${rec.id} rec=${rec} assets=${data.get('assets')} />`) : html`<p class="spell-preview__empty">${t('没有符合条件的法术')}</p>`}
    </div>
  <//>`;
}

export function SpellPreviewHost() {
  const open = useStore(s => s.open, Object.is, previewStore);
  return open ? html`<${SpellPreviewScreen} />` : null;
}
