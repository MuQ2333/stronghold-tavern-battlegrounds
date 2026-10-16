import {t} from '../../../shared/i18n.js';

/** Client-only adapter: share promotion reward cards without changing the hero/spell reward queues or endpoints. */
export function heroDiscoveryOffer(hero, getChess, queued = 0, routes = false) {
  if(routes&&hero?.id==='galewing'&&!hero.disabled&&!hero.used&&!hero.cooldown){
    const lines=hero.desc.split('\n');
    return {source:'hero-route',label:hero.name,choiceKey:`hero-route:${hero.id}:${hero.round??0}`,queued,
      slots:[1,2,3].map(route=>{
        const line=lines[route]||'',colon=line.indexOf('：');
        return {kind:'heroRoute',id:`galewing-route-${route}`,heroRoute:true,route,price:0,sold:false,
          name:colon<0?`${t('航线')} ${route}`:line.slice(0,colon),desc:colon<0?line:line.slice(colon+1)};
      })};
  }
  if(!hero?.choices?.length)return null;
  const tier=getChess(hero.choices[0].id)?.tier;
  return {
    source:'hero',label:hero.name,choiceKey:`hero:${hero.id}:${hero.sequence}`,queued,
    ...(hero.id==='faelin'&&tier?{tier,hint:t('发现{tier}阶干员（{step}/3）',{tier,step:[6,4,2].indexOf(tier)+1})}:{}),
    slots:hero.choices.map(x=>({kind:x.kind==='band'?'band':x.kind==='item'?'item':'chess',id:x.id,price:0,sold:false,...(x.kind==='band'?{spellBandChoice:true,temporaryPower:true}:{} )})),
  };
}
