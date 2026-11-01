import {t} from '../../../shared/i18n.js';
import {data} from '../data.js';

export function growthTraitLines(v) {
  if (!v) return [];
  const out=[];
  if(v.gains)out.push(`${t('当前效果')}：${v.gains.map(x=>`${data.lookup('bonds',x.bondId)?.name || x.bondId} +${x.layers}`).join(' / ')}`);
  if(v.value!=null)out.push(`${t('当前效果')} +${v.value}`);
  if(v.recruitTier!=null)out.push(t('当前特殊招募：{tier}阶',{tier:v.recruitTier}));
  if(v.spent!=null)out.push(t('消费进度：{spent}/9',{spent:v.spent}));
  if(v.refreshProgress!=null)out.push(t('刷新进度：{count}/3',{count:v.refreshProgress}));
  if(v.ammoProgress!=null)out.push(t('弹药进度：{count}/{total}',{count:v.ammoProgress,total:v.ammoThreshold}));
  if(v.starSpent!=null)out.push(t('累计在场消费：{spent}；当前每3资金：+{layers}层',{spent:v.starSpent,layers:v.nextValue}));
  if(v.overflow!=null)out.push(t('开战临时转移：{count}层',{count:v.overflow}));
  if(v.summonsWaiting!=null)out.push(t('待击倒召唤物：{count}',{count:v.summonsWaiting}));
  if(v.sale!=null)out.push(t('当前售价：{price}',{price:v.sale}));
  if(v.repeat>1)out.push(t('特质触发次数：{count}',{count:v.repeat}));
  return out;
}
