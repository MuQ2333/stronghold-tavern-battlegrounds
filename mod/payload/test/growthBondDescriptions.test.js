import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {growthData} from '../shared/growthMode.js';
import {growthBondDescription,withGrowthBondDescription} from '../shared/growthBondDescriptions.js';
import {formatBondEffect as richBondEffect,richTextPlain} from '../public/js/ui/richText.js';
const formatBondEffect = (...args) => richTextPlain(richBondEffect(...args));

test('all 24 growth alliances retain original terminology and resolve numbers without exposing formulas',()=>{
  const before=JSON.stringify(DATA.bonds),changed=growthData(DATA,true);
  assert.equal(Object.keys(changed.bonds).length,24);
  for(const b of Object.values(changed.bonds)){
    assert.equal(b.growthDescription,true,b.bondId);
    assert.equal(b.desc,richTextPlain(b.descRaw));assert.equal(b.effectDesc,richTextPlain(b.effectDescRaw));
    assert.equal(growthBondDescription(b),b.desc);
    assert.doesNotMatch(b.desc,/×层数|人档：|倍率为|欠付|同名盟约光环/,b.bondId);
    for(const layers of [0,999,1000,21300,1000000]){
      const text=formatBondEffect(b,layers);
      assert.equal(text,growthBondDescription(b,layers));
      assert.doesNotMatch(text,/\{[^}]+\}|NaN|undefined|Infinity|×层数/,b.bondId);
      if(b.effectDescParams.length)assert.match(text,/受层数影响/,b.bondId);
    }
  }
  for(const id of ['victoriaShip','kjeragShip','siracusaShip','preciShip','skillfulShip','arcaneShip',
    'steadShip','deputShip','raidShip','maniShip','emptyShip','soloShip','suntShip']){
    const expected=DATA.bonds[id].desc.replace(/(在场)(\d+)/g,(_,start,n)=>{
      const index=DATA.bonds[id].thresholds.indexOf(Number(n));return start+(changed.bonds[id].thresholds[index]??n);
    });
    assert.equal(changed.bonds[id].desc,expected,id+' only changes confirmed thresholds');
  }
  assert.equal(JSON.stringify(DATA.bonds),before);assert.equal(growthData(DATA),DATA);
});

test('changed rules use original numeric style and keep confirmed gameplay differences',()=>{
  const b=growthData(DATA,true).bonds;
  assert.match(formatBondEffect(b.yanShip,100),/攻击力\+113%（受层数影响）/);
  assert.match(formatBondEffect(b.egirShip,10),/攻击力\+45%（受层数影响）/);
  assert.doesNotMatch(b.egirShip.desc,/干员生命值提升/);
  assert.match(b.egirShip.desc,/<在场3名.*前3名.*首次被击倒时立刻复活/);
  assert.match(formatBondEffect(b.kjeragShip,1000),/提升至1135%（受层数影响）/);
  assert.match(formatBondEffect(b.swiftShip,1000),/100%概率（受层数影响）/);
  assert.match(formatBondEffect(b.indomShip,1000),/418%（受层数影响）概率/);
  assert.match(b.indomShip.desc,/每成功触发一次.*概率减半.*每场战斗重置/);
  assert.doesNotMatch(b.indomShip.desc,/地面干员|最高100%/);
  assert.match(formatBondEffect(b.miraShip,1000),/50%（受层数影响）/);
  assert.match(formatBondEffect(b.miraShip,1000),/获得10资金/);
  for(const [id,limit] of [['visiShip',5],['miraShip',1]]) {
    const pattern=new RegExp(`每回合最多${limit}次`);
    assert.match(b[id].desc,pattern);assert.match(formatBondEffect(b[id],1000),pattern);
    assert.doesNotMatch(DATA.bonds[id].desc,/每回合最多/);
  }
  for(const text of [b.visiShip.desc,b.visiShip.effectDesc,richTextPlain(b.visiShip.descRaw),richTextPlain(b.visiShip.effectDescRaw)]) {
    assert.doesNotMatch(text,/150|以上效果改为/);
    assert.match(text,/首次(?:达到|到达)80层.*所有【远见】干员/);
    assert.match(text,/整备区的【远见】干员也可用于激活盟约/);
  }
  for(const id of ['sargonShip','lateranoShip','kazimierzShip'])assert.doesNotMatch(b[id].effectDesc,/至多|有上限|上限受层数影响/,id);
  assert.equal(b.sargonShip.bb.max_buff_stack_cnt,0);
  assert.equal(DATA.bonds.sargonShip.bb.max_buff_stack_cnt,25);
  assert.match(formatBondEffect(b.sargonShip,10),/攻击速度\+12.*持续7秒（受层数影响）/);
  assert.match(b.yanShip.desc,/<在场3名/);assert.match(b.yanShip.desc,/<在场6名/);
});

test('Forge overrides use their actual parameters; namespaced custom alliances keep their own prose',()=>{
  const original=DATA.bonds.yanShip;
  const raw={...DATA,bonds:{...DATA.bonds,
    yanShip:{...original,buffs:original.buffs.map(b=>({...b,bb:{...b.bb,base_atk:0.37,atk_per_stack:0.02}}))},
    'forge:probe:bond':{bondId:'forge:probe:bond',isCore:false,thresholds:[2],desc:'custom Forge rule',effectDesc:'custom Forge current',bb:{}},
  }};
  const changed=growthData(raw,true);
  assert.equal(changed.bonds.yanShip.desc,original.desc.replace('在场6名','在场3名').replace('在场9名','在场6名'));
  assert.match(formatBondEffect(changed.bonds.yanShip,10),/57%（受层数影响）/);
  const custom=changed.bonds['forge:probe:bond'];assert.equal(custom.desc,'custom Forge rule');
  assert.equal(custom.effectDesc,'custom Forge current');assert.equal(custom.growthDescription,undefined);
  assert.equal(withGrowthBondDescription(custom),custom);assert.equal(formatBondEffect(custom,21300),'custom Forge current');
});

test('Swift excess is temporary and only Star supplies Skillful transfer',()=>{
  const b=growthData(DATA,true).bonds;
  assert.match(b.swiftShip.desc,/战斗开始时.*超过999的层数.*临时.*最高的已激活主盟约/);
  assert.match(formatBondEffect(b.swiftShip,1150),/超过999的151层/);
  assert.match(formatBondEffect(b.swiftShip,999),/超过999的0层/);
  assert.doesNotMatch(b.skillfulShip.desc,/转移|临时加给/);
});
