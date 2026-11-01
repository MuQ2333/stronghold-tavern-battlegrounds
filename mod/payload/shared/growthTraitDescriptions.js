// Confirmed clarifications for the growth workbook; retain the original snapshot as provenance.
// i18n-ignore-file: maintainer-authored game-data prose, not interface message IDs.
export function clarifiedGrowthTrait(row, golden, text) {
  const m=golden?2:1;
  switch(row.name) {
    case '歌蕾蒂娅': return '生命上限-50%，攻击力+100%\n'+text;
    case '伺夜': return text.replace(/\n<战斗中>造成的伤害变为弱点伤害（基于敌人的防御力和法术抗性变换物理和法术伤害）/g,'');
    case '深巡': return `<被击倒时>复活，${golden?'属性不变':'攻击力、防御力、生命上限减半'}。每场战斗限一次。`;
    case '乌尔比安': return `【阿戈尔】每叠加2层，本干员攻击造成的伤害＋${m}%。<被击倒时>复活，每场战斗限一次。`;
    case '海霓': return `<被击倒时>在空位随机部署1名${golden?'精锐':'普通'}【阿戈尔】干员。召唤的干员均被击倒过后，自身才可触发不屈。`;
    case '松果': return `<售出时>进行一次${golden?'V':'I'}阶干员的免费特殊招募（获得后每回合提升1阶，最高VI阶）。`;
    case '缇缇': return text.replace('回合结束时提升','每次休整期结束时，单次收益增加初始值');
    case '铃兰': return `<休整期结束时>本局后续赋予调度中心干员的〈购买时〉特质，叠层数值额外＋${m}。`;
    case '风笛': return `<战斗中>本场首次击倒敌人时，获得1件随机${golden?'精锐':''}装备，战后保留。`;
    case '斯卡蒂': return `<被击倒时>获得${m}次免费的刷新`;
    case '至简': return `<战斗中>开启技能时，使已激活的【萨尔贡】【灵巧】层数+${m}`;
    case '信仰搅拌机': return `<战斗中>开启技能后，在本局对战中，你的法术使盟约层数额外+${m}`;
    case '蕾缪安': return `<战斗中>场上干员每消耗10发子弹，释放${m}次闪亮的戒指`;
    case '忍冬': return `<获得时>本局调度中心的【叙拉古】【迅捷】干员获得：〈购买时〉使所属盟约层数＋${3*m}。`;
    case '安洁莉娜': return golden
      ? '<刷新时>本局调度中心的【叙拉古】干员获得：〈购买时〉使已激活的【叙拉古】层数＋8。'
      : '<刷新时>本局调度中心的【叙拉古】干员获得：〈购买时〉使所属盟约层数＋4。';
    case '赫德雷': return `<获得时>本局调度中心的干员获得：〈购买时〉使所属盟约层数＋${2*m}。`;
    case '闪灵': return `受到主动自伤后，回溯该伤害，并使已激活的【卡兹戴尔】层数＋${2*m}。`;
    case '魔王': return `受到主动自伤后，回溯该伤害，并使本局调度中心的干员获得：〈购买时〉使所属盟约层数＋${m}（无需激活）。`;
    case '余': return `在场时每累计消耗9资金，随机获得${m}名场上人数最多盟约的干员。`;
    case '溯光星源': return `<休整期结束时>本回合每花费3资金，使已激活的【灵巧】【奥术】层数＋${m}；在场期间每累计花费10资金，单次收益额外＋${m}（本局累计）。<战斗开始时>将【灵巧】超出999的层数临时加给层数最高的已激活主盟约。`;
    case '荒芜拉普兰德': return `在场时每刷新3次，触发${golden?'2':'1'}次调度中心单项层数最高的〈购买时〉效果（并列随机）。`;
    default: return text;
  }
}

/** Optional interaction reference; keep the playable core readable on ordinary cards. */
export function growthTraitNotes(row, golden) {
  switch (row.name) {
    case '深巡': return `复活优先于不屈。被其他特质主动触发时，改为在本方合法空位召唤同品级个体，本体保留复活机会。召唤个体不携带此复活特质，不复制装备和临时增益${golden?'':'，攻击力、防御力、生命上限减半'}。`;
    case '乌尔比安': return '复活优先于不屈，伤害成长部分保留。被其他特质主动触发时，改为在本方合法空位召唤同品级个体，本体保留复活机会。召唤个体保留伤害成长，不携带复活特质，不复制装备和临时增益。';
    case '海霓': return '仅从本局未禁用的阿戈尔干员中抽取，排除海霓；召唤仅本场有效，不占库存。优先原位，其次本方最近的合法空位；无空位时不召唤。召唤干员首次被击倒即满足等待条件，即使它立即复活也算；海霓再部署仍需有合法空位。';
    case '溯光星源': return '消费成长仅统计持有且在场期间，跨回合保留。溢出转移每场开战结算一次，多张星源不重复；灵巧自身层数不减少，转入的临时层数战后清除。';
    default: return '';
  }
}

export function copyGrowthTraitDescription(text) {
  return (text || '').split('<被击倒时>')[0].trim();
}

export function growthSkillDescription(skill) {
  if(skill?.skillId!=='skchr_lemuen_3')return skill;
  const text=(value,rich)=>value?.replace('技能结束时对每名被锁定的敌人所在位置进行轰炸',
    `每锁定${rich?'<@ba.vup>5</>':'5'}发即对该组敌人所在位置进行轰炸，技能结束时也会轰炸未满${rich?'<@ba.vup>5</>':'5'}发的一组`).replace('秒消耗1发子弹','秒（受攻击速度影响）消耗1发子弹');
  return {...skill,desc:text(skill.desc,false),descRaw:text(skill.descRaw,true)};
}
