// Keep the original alliance wording; patch only confirmed growth-mode rule changes.
// i18n-ignore-file: game-data prose, like growthRoster.js, not interface message IDs.
const known = new Set(['yanShip','sargonShip','victoriaShip','kjeragShip','lateranoShip','egirShip',
  'siracusaShip','kazimierzShip','kazdelShip','preciShip','swiftShip','skillfulShip','arcaneShip',
  'steadShip','deputShip','visiShip','miraShip','investShip','raidShip','indomShip','maniShip',
  'emptyShip','soloShip','suntShip']);
const number = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fields = b => {
  const bb = {...b.bb};
  // Match buffParams: the first buff wins duplicate keys. Preserve Forge numeric overrides.
  for (const buff of [...(b.buffs || [])].reverse()) Object.assign(bb, buff.bb);
  if (b.bondId === 'arcaneShip') {
    bb.base_damage_scale_show = number(bb.base_damage_scale) - 1;
    bb.base_damage_scale_show_ex = number(bb.base_damage_scale) * number(bb.power_weak_scale) - 1;
    bb.damage_scale_per_stack_show_ex = number(bb.damage_scale_per_stack) * number(bb.power_weak_scale);
  }
  return bb;
};

const rewardLimit = (text, limit) => text.replace(/(获得(?:一次)?(?:<@[^>]+>)*\d+(?:<\/>)*资金)/g,
  `$1（每回合最多${text.includes('<@') ? `<@ba.vup>${limit}</>` : limit}次）`);

function growthText(b, text) {
  if (!text) return '';
  switch (b.bondId) {
    case 'egirShip': return text.replace('生命值','攻击力');
    case 'sargonShip': return text.replaceAll('（有上限）','').replace(/（至多(?:<@[^>]+>)*\+\d+(?:\.\d+)?%?(?:<\/>)*）/g,'');
    case 'lateranoShip': return text.replaceAll('（有上限）','').replace(/，至多(?:<@[^>]+>)*\+\d+(?:\.\d+)?%(?:<\/>)*/g,'');
    case 'kazimierzShip': return text.replaceAll('（上限受层数影响）','').replace(/（至多(?:<@[^>]+>)*\+\{\d+:0%\}(?:<\/>)*）(?:<@[^>]+>)*（受层数影响）(?:<\/>)*/g,'');
    case 'visiShip': return rewardLimit(text.split('\n').map(line=>/首次(?:达到|到达)(?:<@[^>]+>)*150/.test(line)
      ? line.match(/（整备区[^）]*）/)?.[0] || '' : line).filter(Boolean).join('\n'),5);
    case 'miraShip': return rewardLimit(text.replace(/获得((?:<@[^>]+>)*)20((?:<\/>)*)资金/g,(_,open,close)=>`获得${open}${number(fields(b).count)}${close}资金`),1);
    case 'kazdelShip': return text.replace('<叠加','<每叠加')+'；你通过吞噬获得的主盟约层数会全部转为【卡兹戴尔】。';
    case 'indomShip': {
      const [first,...rest] = text.split('\n');
      return [first+'；每成功触发一次，该干员后续概率减半，每场战斗重置。',...rest].join('\n');
    }
    case 'swiftShip': return text+'\n战斗开始时，将超过999的层数临时加给层数最高的已激活主盟约。';
    default: return text;
  }
}

/** Original rule text without layers; current numeric effect when layers are supplied. */
export function growthBondDescription(b, layers = null, rich = false) {
  if (!known.has(b.bondId)) return null;
  if (layers == null) return (rich ? b.descRaw : b.desc) || b.desc || '';
  const bb = fields(b), L = Math.max(0,number(layers));
  const params = b.effectDescParams || [];
  const text = ((rich ? b.effectDescRaw : b.effectDesc) || b.effectDesc || '').replace(/\{(\d+)(?::([^{}]+))?\}/g,(whole,index,fmt) => {
    const p = params.find(p => p.index === Number(index));
    if (!p) return whole;
    let value = number(bb[p.base]) + number(bb[p.perStack]) * L;
    if (b.bondId === 'swiftShip' && p.base === 'base_prob') value = Math.min(1,value);
    if (b.bondId === 'miraShip' && p.base === 'baseprob') value = Math.min(0.5,value);
    const format = p.format || fmt || '0', percent = format.endsWith('%');
    const core = percent ? format.slice(0,-1) : format;
    const decimals = core.includes('.') ? Math.min(4,core.split('.')[1].length) : 0;
    const fixed = (value * (percent ? 100 : 1)).toFixed(decimals);
    const clean = Number(fixed) === 0 ? (0).toFixed(decimals) : fixed;
    return clean + (percent ? '%' : '');
  });
  const overflow = String(Math.max(0,L-999));
  return b.bondId === 'swiftShip' ? text.replace('超过999的层数',`超过999的${rich ? `<@ba.vup>${overflow}</>` : overflow}层`) : text;
}

export function withGrowthBondDescription(b) {
  if (!known.has(b.bondId)) return b;
  const desc = growthText(b,b.desc), effectDesc = growthText(b,b.effectDesc);
  const effectDescParams = (b.effectDescParams || []).map(p => b.bondId === 'egirShip'
    ? {...p,base:p.base === 'base_max_hp' ? 'base_atk' : p.base,perStack:p.perStack === 'max_hp_per_stack' ? 'atk_per_stack' : p.perStack}
    : p).filter(p => b.bondId !== 'kazimierzShip' || p.base !== 'base_max_atk_when_born');
  return {...b, growthDescription:true, desc, descRaw:growthText(b,b.descRaw || b.desc),
    effectDesc, effectDescRaw:growthText(b,b.effectDescRaw || b.effectDesc), effectDescParams};
}
