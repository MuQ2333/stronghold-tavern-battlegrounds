// Maintainer-authored growth spell strength: one bonus for each independent positive layer-gain event.
export const growthSpellStrength=ps=>ps.m.growthMode?ps.growthState?.spellBonus || 0:0;

/** Existing counters retain base amounts; recover each spell's independent assignment, including old matches. */
export function spellLayerParts(n,base) {
  if(!Number.isFinite(n) || !(n>0))return [];
  const count=Math.floor(n/base),rest=n-count*base;
  return [...(count?[{n:base,count}]:[]),...(rest?[{n:rest,count:1}]:[])];
}

export function spellPurchaseParts(ps,slot) {
  if(!ps.m.spellShop || slot?.kind!=='chess')return [];
  const s=ps.spellState,ids=ps.gd.chess(slot.id)?.bonds || [];
  const right=ps.shop.slots.filter(x=>x?.kind==='chess'&&!x.sold).at(-1);
  const parts=[...spellLayerParts(slot.spellBonus || 0,2),...spellLayerParts(s?.growth || 0,1),
    ...spellLayerParts(slot===right?s?.right || 0:0,3),
    ...(s?.conditions || []).filter(c=>c.ids.some(id=>ids.includes(id))&&c.n>0).map(c=>({n:c.n,count:1}))];
  if(ps.m.growthMode)return parts;
  const n=parts.reduce((sum,p)=>sum+p.n*p.count,0);
  return n>0?[{n,count:1}]:[];
}

export function spellPartsAmount(ps,parts,{raw=false}={}) {
  return parts.reduce((sum,p)=>sum+p.count*(raw?p.n:growthSpellAmount(ps,p.n,'spell')),0);
}

export function grantSpellPurchase(ps,slot,parts,{devour=false}={}) {
  for(const p of parts)for(let i=0;i<p.count && ps.alive;i++)ps.spellLayers({id:slot.id,items:[]},p.n,false,{devour});
}

export function withGrowthSpell(ps,item,fn) {
  if(!ps.m.growthMode || ps._growthSpell)return fn();
  ps._growthSpell={uid:item.uid,id:item.id,bonus:growthSpellStrength(ps)};
  try {return fn();} finally {delete ps._growthSpell;}
}

export function growthSpellAmount(ps,n,reason) {
  if(!ps.m.growthMode || reason!=='spell' || !Number.isFinite(n) || !(n>0))return n;
  return n+(ps._growthSpell?.bonus ?? growthSpellStrength(ps));
}

export function increaseGrowthSpellStrength(ps,n) {
  if(!ps.m.growthMode || !(n>0))return;
  ps.growthState ||= {grants:[],grantBonus:0};
  ps.growthState.spellBonus=(ps.growthState.spellBonus || 0)+n;
  ps.dirty();
}
