import {growthEnemyScale} from './growthEnemyCurve.js';
import { withGrowthBondDescription } from './growthBondDescriptions.js';
import { clarifiedGrowthTrait, growthTraitNotes, growthSkillDescription } from './growthTraitDescriptions.js';
import { growthRichText } from './growthRichText.js';
// Optional growth preview: only the explicitly implemented subset replaces native traits.
import { GROWTH_ROSTER as SOURCE_ROSTER } from './growthRoster.js';
import { GROWTH_KAZDEL } from './growthKazdelRoster.js';
import {withGrowthAssetFallbacks} from './growthAssets.js';
import {GROWTH_BLUE_POISON} from './growthBluePoison.js';
import {supportsTavernMods} from './tavernMods.js';
import {projectEliteData} from './standIn.js';

// Later edits in 当前实装干员特质表-20261024.xlsx, 干员特质 K/N8, K/N13, K/N14.
// Keep the earlier source workbook snapshot intact.
const traitEdits={
  chess_char_5_23_a:{handler:'scribeGrowth',traitChanged:true,normal:'<获得时>【炎】层数+6、【奇迹】层数+3（本局模拟你每获得过一个录武官都会提升）',elite:'<获得时>【炎】层数+12、【奇迹】层数+6（本局模拟你每获得过一个录武官都会提升）'}, // i18n-ignore: user-authored trait
  chess_char_1_03_a:{handler:'saleCoins',traitChanged:true,normal:'<售出时>获得一枚盟约之币',elite:'<售出时>获得两枚盟约之币'}, // i18n-ignore: growth game-data text, not a UI msgid
  chess_char_1_09_a:{handler:'allEnemyAttack',traitChanged:true,normal:'攻击敌人时攻击力提升至140%',elite:'攻击敌人时攻击力提升至180%'}, // i18n-ignore: growth game-data text, not a UI msgid
  chess_char_1_10_a:{handler:'fixedSpRecovery',traitChanged:true,normal:'技力自然恢复速度+0.25/秒',elite:'技力自然恢复速度+0.5/秒'}, // i18n-ignore: growth game-data text, not a UI msgid
  chess_char_2_07_a:{handler:'frontFirstOneHp',traitChanged:true,
    normal:'<战斗中>本干员的生命值首次降为1时，触发身前干员的被击倒时效果', // i18n-ignore: growth game-data text, not a UI msgid
    elite:'<战斗中>本干员的生命值首次降为1时，触发身前干员的被击倒时效果两次'}, // i18n-ignore: growth game-data text, not a UI msgid
  chess_char_3_05_a:{addon:'突袭'}, // i18n-ignore: growth game-data text, not a UI msgid
};
export const GROWTH_ROSTER=Object.freeze([...SOURCE_ROSTER.map(row=>traitEdits[row.id]?{...row,...traitEdits[row.id]}:row),GROWTH_BLUE_POISON.roster]);
const cache = new WeakMap();
function halfBaseHp(rec) {
  const half=stats=>({...stats,maxHp:(stats.maxHp ?? stats.hp)*0.5});
  return {...rec,stats:half(rec.stats),
    ...(rec.statsBase?{statsBase:half(rec.statsBase)}:{}),
    ...(rec.modules?{modules:rec.modules.map(m=>({...m,attr:{...m.attr,...(Number.isFinite(m.attr?.maxHp)?{maxHp:m.attr.maxHp*0.5}:{})}}))}:{}),
    ...(rec.potDown?{potDown:Object.fromEntries(Object.entries(rec.potDown).map(([rank,patch])=>[rank,
      Object.fromEntries(Object.entries(patch).map(([key,value])=>[key,/^stats(?:Base)?\.(?:maxHp|hp)$/.test(key)&&typeof value==='number'?value*0.5:value]))]))}:{}),
  };
}
function growthModeConfig(id, mode) {
  const out={...mode,inactiveBondIds:[...new Set([...(mode.inactiveBondIds ?? []),'investShip'])]};
  out.enemyScale=growthEnemyScale(id,mode.enemyScale);
  return out;
}
function growthBond(b) {
  const original=b.thresholds || [];
  const thresholds=original.map((n,i)=>i===0?1:i===1?(b.isCore?3:2):b.bondId==='yanShip' && n===9?6:n);
  const count=n=>{const i=original.indexOf(n);return i<0?n:thresholds[i];};
  const bb=x=>{
    /** @type {Record<string, number>} */
    const out={...Object.fromEntries(Object.entries(x || {}).map(([k,v])=>[k,['power_bond_char_cnt','ex_bond_char_cnt','power_char_cnt','ex_char_cnt'].includes(k)?count(v):v])),...(b.bondId==='sargonShip'?{max_buff_stack_cnt:0}:{})};
    if(b.bondId==='egirShip') {
      out.base_atk=out.base_atk ?? out.base_max_hp ?? 0.35;
      out.atk_per_stack=out.atk_per_stack ?? out.max_hp_per_stack ?? 0.01;
      delete out.base_max_hp;delete out.max_hp_per_stack;
    }
    if(b.bondId==='lateranoShip')delete out.max_atk_for_consume;
    if(b.bondId==='kazimierzShip'){delete out.base_max_atk_when_born;delete out.max_atk_when_born_per_stack;}
    return out;
  };
  const text=s=>typeof s==='string'?(b.bondId==='indomShip'?s.replaceAll('地面干员','干员').replaceAll('近战干员','干员').replaceAll('近战部署类别干员','所有部署类别干员'):s).replace(/(在场(?:<[^>]+>)?)(\d+)/g,(_,prefix,n)=>prefix+count(Number(n))):s;
  return {...b,activeCount:1,thresholds,bb:bb(b.bb),buffs:(b.buffs || []).map(x=>({...x,bb:bb(x.bb)})),
    ...Object.fromEntries(['desc','descRaw','effectDesc','effectDescRaw'].map(k=>[k,text(b[k])])),
    ...(b.spec?{spec:{...b.spec,tiers:b.spec.tiers?.map(x=>({...x,need:typeof x.need==='string'?x.need.replace(/\b\d+(?= distinct| elite| 助力)/g,n=>count(Number(n))):x.need}))}}:{})};
}
export const GROWTH_EVENTS = Object.freeze({ scribeGrowth:'SERVER_GAIN',pendingFunds: 'SERVER_GAIN', frontFirstOneHp:'IN_BATTLE',saleCoins:'SERVER_CHESS_SOLD',allEnemyAttack:'IN_BATTLE',fixedSpRecovery:'IN_BATTLE',gainedLayers: 'SERVER_PREP_FIN',
  ownLayersStart: 'SERVER_PREP_START', topLayers: 'SERVER_GAIN', positionLayers: 'SERVER_PREP_FIN',
  oddEquipment: 'SERVER_PREP_FIN', equipment: 'SERVER_PREP_FIN', ownLayersEnd: 'SERVER_PREP_FIN',
  saleFunds: 'SERVER_CHESS_SOLD', refreshLayers: 'SERVER_PREP_FIN', boardLayers: 'SERVER_PREP_FIN',
  benchLayers: 'SERVER_PREP_FIN', benchCountLayers: 'SERVER_PREP_FIN', dusk: 'SERVER_PREP_FIN',
  siracusaGift: 'SERVER_GAIN', prepEcho: 'SERVER_GAIN', buyGrant: 'SERVER_GAIN',
  grantAmplifier: 'SERVER_PREP_FIN', refreshGrant: 'SERVER_REFRESH_SHOP', purchaseEcho: 'SERVER_REFRESH_SHOP',
  repeatGain: 'NONE', repeatStart: 'NONE', repeatEnd: 'NONE', battleEquipment: 'IN_BATTLE', deathRefresh: 'IN_BATTLE',
  freezeLocal: 'IN_BATTLE', freezeGlobal: 'IN_BATTLE', coldHit: 'IN_BATTLE', fixedAspd: 'IN_BATTLE',
  distinctVictoria:'SERVER_PREP_FIN', distinctTop:'SERVER_PREP_FIN', distinctRoyal:'SERVER_PREP_FIN',
  spendEquipment:'NONE', gainExusiai:'SERVER_GAIN', gainSpell:'SERVER_GAIN',
  autoRing:'SERVER_PREP_START', spellCountLayers:'SERVER_PREP_FIN', kjeragAmplifier:'SERVER_GAIN',
  leakSale:'SERVER_CHESS_SOLD', skillSargon:'IN_BATTLE', skillSargonClever:'IN_BATTLE', allSkillsSargon:'IN_BATTLE',
  kjeragBattleAmplifier:'IN_BATTLE', halfRevive:'IN_BATTLE', damageRevive:'IN_BATTLE',
  skillSargonRamp:'IN_BATTLE', statusSargonRamp:'IN_BATTLE', recruitSale:'SERVER_CHESS_SOLD', deathSpread:'IN_BATTLE',
  firstKillLayers:'IN_BATTLE', pairKillLayers:'IN_BATTLE', fiveKillLayers:'IN_BATTLE', deployOwnLayers:'IN_BATTLE',
  frontSkillGrant:'IN_BATTLE', skillTopRamp:'IN_BATTLE', permanentDeployGrant:'SERVER_PREP_FIN',
  selfHarmGain:'SERVER_GAIN', kazdelGainAura:'NONE', selfHarmRollback:'NONE', shopBuyGrant:'SERVER_GAIN',
  shopGainRollback:'NONE', kazdelDiscover:'SERVER_GAIN', consumeHighest:'SERVER_PREP_FIN',
  kazdelConsume:'NONE', spellConsume:'NONE', kazdelDamage:'IN_BATTLE', gravelRamp:'IN_BATTLE', dollRamp:'IN_BATTLE',
  repeatTargetSpell:'NONE',repeatCombat:'IN_BATTLE',firstSkillDeath:'IN_BATTLE',startDeathTraits:'IN_BATTLE',
  tripleGift:'SERVER_GAIN', majoritySale:'SERVER_CHESS_SOLD', majoritySpend:'NONE',deathGain:'IN_BATTLE',gainDeploy:'SERVER_GAIN',
  starSpend:'SERVER_PREP_FIN',deathSummon:'IN_BATTLE',spellGainBonus:'SERVER_GAIN',spellSkillBonus:'IN_BATTLE',spellDeathBonus:'IN_BATTLE',spellRetain:'NONE',localAmmoSpell:'IN_BATTLE',globalAmmoSpell:'IN_BATTLE' });

/** Compact counts retain the grade of the granting source, regardless of the recipient's grade. */
export function growthGrantedTraitView(deploy, skill) {
  const out=[];
  for (const [kind,counts,base] of [['deploy',deploy,4],['skill',skill,1]]) for(const grade of ['normal','elite']) {
    const count=counts?.[grade] || 0;
    if(count>0)out.push({garrisonId:`growth_grant_${kind}_${grade}`,count,value:count*base*(grade==='elite'?2:1)});
  }
  return out;
}
export function growthData(raw, enabled = false) {
  if (!enabled || !raw || raw.growthPreview === 1 || !supportsTavernMods(raw.config?.version?.id)) return raw;
  if (cache.has(raw)) return cache.get(raw);
  const chess = { ...raw.chess,...GROWTH_KAZDEL.chess,...GROWTH_BLUE_POISON.chess }, garrisons = { ...raw.garrisons };
  for (const grade of ['normal','elite']) for(const kind of ['deploy','skill']) {
    const n=(kind==='deploy'?4:1)*(grade==='elite'?2:1),gid=`growth_grant_${kind}_${grade}`;
    const desc=kind==='deploy'?`<部署时>使已激活的【卡西米尔】【精准】层数+${n}（可叠加）` // i18n-ignore: growth game-data text, not a UI msgid
      :`<开启技能时>使已激活的【精准】和自身所属盟约层数+${n}`; // i18n-ignore: user-authored growth design
    garrisons[gid]={garrisonId:gid,eventType:'IN_BATTLE',effectKey:'GROWTH_PREVIEW',desc,descRaw:growthRichText(desc),bb:{},bbStr:{},owners:[]};
  }
  for (const row of GROWTH_ROSTER) {
    if (!row.id) continue;
    for (const golden of [false, true]) {
      const id = golden ? row.id.replace(/_a$/, '_b') : row.id;
      const base = chess[id];
      if (!base) continue; // Additional Kazdel operators require their actual content pack.
      let next = base;
      if(row.main==='卡兹戴尔') {
        const names={'远见':'visiShip','突袭':'raidShip','协防':'emptyShip','奇迹':'miraShip','不屈':'indomShip','灵巧':'skillfulShip','精准':'preciShip','助力':'deputShip'};
        next={...next,bonds:['kazdelShip',...row.addon.split('、').map(n=>names[n]).filter(Boolean)]};
      }
      if (base.bonds?.includes('investShip')) next = { ...next, bonds: next.bonds.filter(id => id !== 'investShip') };
      if(row.name==='斯卡蒂')next={...next,bonds:next.bonds.filter(id=>id!=='steadShip')};
      if(row.name==='歌蕾蒂娅')next=halfBaseHp(next);
      if(row.name==='蕾缪安')next={...next,skill:growthSkillDescription(next.skill),skills:next.skills?.map(growthSkillDescription)};
      if (row.tierChanged) {
        const prices=raw.config?.economy?.chessPrice?.[row.tier];
        const price=typeof prices==='number'?prices:prices?.[golden?'golden':'normal'];
        next = { ...next, tier: row.tier, price: Number.isFinite(price)?price:({1:2,2:3,3:3,4:3,5:4,6:4}[row.tier]) };
      }
      if (row.handler) {
        const gid = `growth_${id}`;
        const sourceDesc = row.name === '夕'
          ? `<休整期结束时>本回合每获得1名干员，使已激活的【炎】【奥术】层数+${golden?4:2}；本回合每获得4名【炎】或【奥术】干员，上述每名干员的层数收益额外+${golden?4:2}。` // i18n-ignore: growth game-data text, not a UI msgid
          : row.name === '幽灵鲨' ? (golden ? row.elite : row.normal).replace('使1名友方单位','使1名友方【阿戈尔】干员')
          : row.name === '归溟幽灵鲨' ? `<战斗中>场上有己方干员被击倒或自身替身切换时，使已激活的【阿戈尔】【不屈】临时层数各＋${golden?4:2}；每触发一次，单次收益各＋${golden?4:2}（本场累计）。` // i18n-ignore: growth game-data text, not a UI msgid
          : row.name === '锏' ? (golden ? row.elite : row.normal).replace('（以上效果','（部署时触发获得时的效果每张每场战斗限一次；以上效果')
          : row.name==='史尔特尔' ? (golden?row.elite:row.normal).replace('本场模拟','本局对战')
          : row.name==='圣约送葬人' && golden ? '你在战斗中释放的法术效果在本场与战后均双倍生效；同名只取最高品级' // i18n-ignore: growth game-data text, not a UI msgid
          : golden ? row.elite : row.normal;
        const desc = clarifiedGrowthTrait(row,golden,sourceDesc);
        garrisons[gid] = { garrisonId: gid, eventType: GROWTH_EVENTS[row.handler], effectKey: 'GROWTH_PREVIEW',
          desc, descRaw: growthRichText(desc), growthNotes: growthTraitNotes(row,golden), bb: {}, bbStr: {}, owners: [id] };
        // Vigil keeps his native weakness conversion while replacing only the old three-kill layer cap.
        // Compact sim DataSource.raw omits garrison tables; official garrison_01_a/b are the same weakness rune.
        const retained=(base.garrisonIds || []).filter(id=>row.handler==='fiveKillLayers' &&
          (raw.garrisons?.[id]?.effectKey==='act1autochess_gar_eff_chaos' || /^garrison_01_[ab]$/.test(id)));
        next = { ...next, growthTrait: { handler: row.handler, row: row.row }, garrisonIds: [gid,...retained] };
      }
      if(row.name==='红豆')next={...next,price:1};
      chess[id] = next;
    }
  }
  for (const [gid,g] of Object.entries(garrisons)) if (g.desc?.includes('【炎】/【投资人】')) {
    garrisons[gid] = {...g,desc:g.desc.replaceAll('【炎】/【投资人】','【炎】'),
      descRaw:g.descRaw?.replaceAll('【炎】/【投资人】','【炎】'),
      bbStr:{...g.bbStr,bond:g.bbStr?.bond?.split(',').filter(id=>id!=='investShip').join(',')}};
  }
  const config = raw.config ? { ...raw.config, modes: Object.fromEntries(Object.entries(raw.config.modes ?? {}).map(([id,m]) => [id,growthModeConfig(id,m)])) } : raw.config;
  const bonds=Object.fromEntries(Object.entries({...raw.bonds,kazdelShip:GROWTH_KAZDEL.bond}).map(([id,b])=>[id,growthBond(b)]));
  for(const field of ['members','visibleMembers']) {
    if(Array.isArray(bonds.egirShip?.[field]))bonds.egirShip={...bonds.egirShip,[field]:[...new Set([...bonds.egirShip[field],GROWTH_BLUE_POISON.roster.id])]};
    if(Array.isArray(bonds.steadShip?.[field]))bonds.steadShip={...bonds.steadShip,[field]:bonds.steadShip[field].filter(id=>!/^chess_char_3_05_[ab]$/.test(id))};
  }
  if (bonds.miraShip) {
    const b=bonds.miraShip;
    bonds.miraShip={...b,bb:{...b.bb,count:10},buffs:(b.buffs ?? []).map(x=>x.key==='bond_layer_gain_coin'?{...x,bb:{...x.bb,count:10}}:x)};
  }
  for (const [id,b] of Object.entries(bonds)) bonds[id]=withGrowthBondDescription(b);
  const assets=withGrowthAssetFallbacks(raw.assets);
  const out = projectEliteData({ ...raw, chess, garrisons, config, bonds, assets,tokens:{...raw.tokens,...GROWTH_KAZDEL.tokens},items:{...raw.items,...GROWTH_KAZDEL.items},growthPreview: 1 });
  cache.set(raw, out);
  return out;
}
