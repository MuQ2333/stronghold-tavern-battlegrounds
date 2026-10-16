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

export function SpellPreviewButton({ size = 'sm', class: cls = '' }) {
  return html`<${Button} size=${size} variant="secondary" icon="search" class=${`lo-entry spell-preview-entry ${cls}`} onClick=${openSpellPreview}>${t('法术预览')}<//>`;
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

      </div>
      <${RichText} as="p" class="spell-preview-card__effect" text=${spellPreviewText(rec)} />
      ${rec.choices?.length ? html`<ol class="spell-preview-card__choices">${rec.choices.map((choice, i) => html`<li key=${i}><${RichText} text=${choice} /></li>`)}</ol>` : null}
    </div>
  </article>`;
}

function SpellPreviewScreen() {
  const settled=useData('items','assets');
  const [query,setQuery]=useState(''),[tier,setTier]=useState(null),[target,setTarget]=useState(''),[availability,setAvailability]=useState('active');
  const [selected,setSelected]=useState(null),[detail,setDetail]=useState(false);
  const route=useStore(selectRoute),initialRoute=useRef(route);
  useEffect(()=>{if(route==='game'&&initialRoute.current!=='game')closeSpellPreview();},[route]);
  const records=useMemo(()=>spellPreviewRoster(data.get('items')),[settled,data.locale()]);
  const visible=filterSpellPreview(records,{query,tier,target,availability});
  const chosen=visible.find(x=>x.id===selected)||visible[0];
  const pick=id=>{setSelected(id);setDetail(true);};
  useEffect(()=>{const key=e=>{if(e.target.closest?.('input,select,textarea')||!['ArrowLeft','ArrowRight'].includes(e.key)||!visible.length)return;e.preventDefault();const i=visible.findIndex(x=>x.id===chosen?.id);setSelected(visible[(i+(e.key==='ArrowRight'?1:-1)+visible.length)%visible.length].id);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[chosen?.id,visible.map(x=>x.id).join('|')]);
  const reset=()=>{setQuery('');setTier(null);setTarget('');setAvailability('active');};
  return html`<${Modal} open=${true} onClose=${closeSpellPreview} class="spell-preview" width="100vw" closeOnBackdrop=${false}>
    <header class="spell-preview__head"><${Button} variant="ghost" icon="chevronLeft" onClick=${closeSpellPreview}>${t('返回')}<//><h2>${t('法术预览')}</h2><span role="status">${t('共 {n} 张',{n:visible.length})}</span></header>
    <main class=${`lo-body spell-preview__body${detail?' is-detail':''}`}>
      <section class="lo-roster">
        <div class="lo-filters">
          <div class="lo-frow"><div class="lo-chips" role="group" aria-label=${t('阶级')}>
            <button type="button" class=${`lo-chip${!tier?' is-on':''}`} aria-pressed=${String(!tier)} onClick=${()=>setTier(null)}>${t('全部')}</button>
            ${[1,2,3,4,5,6].map(n=>html`<button type="button" key=${n} class=${`lo-chip lo-chip--tier lo-chip--t${n}${tier===n?' is-on':''}`} aria-pressed=${String(tier===n)} title=${t('{tier}阶',{tier:n})} onClick=${()=>setTier(tier===n?null:n)}><span class="num">${['','I','II','III','IV','V','VI'][n]}</span></button>`)}
          </div><label class="lo-search spell-preview__search"><input type="search" aria-label=${t('搜索法术')} value=${query} placeholder=${t('搜索名称或效果')} onInput=${e=>setQuery(e.target.value)}/></label></div>
          <div class="lo-frow">
            <label class="lo-select"><span class="lo-select__k">${t('施放目标')}</span><select value=${target} onChange=${e=>setTarget(e.target.value)}><option value="">${t('全部目标')}</option><option value="chess">${t('指定干员')}</option><option value="tile">${t('指定地块')}</option><option value="global">${t('直接施放')}</option></select></label>
            <label class="lo-select"><span class="lo-select__k">${t('入池状态')}</span><select value=${availability} onChange=${e=>setAvailability(e.target.value)}><option value="active">${t('可入池')}</option><option value="special">${t('特殊来源')}</option><option value="all">${t('全部')}</option></select></label>
            <${Button} size="sm" variant="ghost" onClick=${reset}>${t('重置筛选')}<//>
          </div>
        </div>
        <div class="lo-list"><div class="spell-preview__columns"><span>${t('法术')}</span><span>${t('等阶')}</span><span>${t('资金')}</span></div>
          <div class="lo-list__rows spell-preview__rows" role="list" aria-label=${t('法术列表')}>
            ${!settled?html`<${Spinner} label=${t('正在载入法术…')}/>`:visible.length?visible.map(rec=>html`<button type="button" role="listitem" key=${rec.id} data-spell-id=${rec.id} data-tier=${rec.tier} class=${`spell-preview-row${chosen?.id===rec.id?' is-on':''}`} aria-pressed=${String(chosen?.id===rec.id)} onClick=${()=>pick(rec.id)}>
              <span class="spell-preview-row__name"><span class=${`spell-preview-card__art ${rec.spellMod?'is-imported':'is-native'}`}><${Img} src=${itemIconUrl(data.get('assets'),rec)} alt=""/></span><strong>${rec.name}</strong></span><span class="num">${['','I','II','III','IV','V','VI'][rec.tier]}</span><span class="num">${rec.currency==='life'?t('{n} 生命',{n:rec.price}):rec.price}</span>
            </button>`):html`<p class="lo-empty">${t('没有符合条件的法术')}</p>`}
          </div>
        </div>
      </section>
      <aside class="lo-detail-wrap spell-preview__detail"><button type="button" class="lo-detail-back" onClick=${()=>setDetail(false)}><${Icon} name="chevronLeft"/>${t('法术列表')}</button>
        ${chosen?html`<${SpellCard} rec=${chosen} assets=${data.get('assets')}/>`:html`<p>${t('没有符合条件的法术')}</p>`}
        <p class="spell-preview__note">${t('展示固定基础效果；实际费用和效果以对局中的加成与使用条件为准。')}</p>
      </aside>
    </main>
  <//>`;
}
export function SpellPreviewHost(){const open=useStore(s=>s.open,Object.is,previewStore);return open?html`<${SpellPreviewScreen}/>`:null;}
