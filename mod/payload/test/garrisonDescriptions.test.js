import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from './match/harness.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {visibleGarrisonDescriptions} from '../shared/garrisonDescriptions.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';

test('both grades of Vigil, Meteor, Coldshot and Nearl expose their complete main description once',()=>{
  const d=growthData(DATA,true);
  for(const name of ['伺夜','流星','寒檀','耀骑士临光'])for(const elite of [false,true]){
    const row=GROWTH_ROSTER.find(r=>r.name===name),c=d.chess[row.id.replace(/_a$/,elite?'_b':'_a')];
    const snapshot=JSON.stringify(c),records=c.garrisonIds.map(id=>d.garrisons[id]);
    const shown=visibleGarrisonDescriptions(records);assert.equal(shown.length,1,name);
    const text=shown.map(g=>g.desc).join('\n');
    if(['伺夜','流星'].includes(name))assert.equal(text.split('造成的伤害变为弱点伤害').length-1,1,name);
    if(name==='伺夜'){
      assert.match(text,/前5次击倒敌人/);assert.match(text,elite?/叙拉古】层数\+4、【奇迹】层数\+2/:/叙拉古】层数\+2、【奇迹】层数\+1/);
      assert.ok(c.garrisonIds.includes(elite?'garrison_01_b':'garrison_01_a'),'weakness mechanic is retained');
    }
    if(name==='寒檀')assert.match(text,/<进入休整期时><休整期结束时>/,'two distinct trigger times stay visible');
    if(name==='耀骑士临光')assert.match(text,/再部署时间.*攻击速度/,'both granted effects stay visible');
    assert.equal(JSON.stringify(c),snapshot,'display filtering does not modify registered mechanics');
  }
  assert.match(GROWTH_ROSTER.find(r=>r.name==='伺夜').normal,/\n<战斗中>/,'original workbook snapshot remains intact');
});

test('independent Forge traits, even identical text on different triggers, are never collapsed',()=>{
  const records=[{garrisonId:'forge:one',desc:'effect',eventType:'SERVER_PREP_START'},
    {garrisonId:'forge:two',desc:'effect',eventType:'SERVER_PREP_FIN'},
    {garrisonId:'forge:three',operatorTrait:{},desc:'effect'}];
  assert.deepEqual(visibleGarrisonDescriptions(records),records);
  const secondary=DATA.garrisons.garrison_01_a;
  assert.deepEqual(visibleGarrisonDescriptions([{garrisonId:'other',desc:'other'},secondary]),[{garrisonId:'other',desc:'other'},secondary]);
});

test('Vigil still installs weakness conversion and awards five-kill growth after description cleanup',()=>{
  const d=growthData(DATA,true),rec=GROWTH_ROSTER.find(r=>r.name==='伺夜');
  const h=makeBattle({data:new DataSource(d),flags:{growthMode:true},units:[{chessId:rec.id,uid:1,row:10,col:4}],
    bonds:{siracusaShip:{active:true,count:1,tier:1,layers:0},miraShip:{active:true,count:1,tier:1,layers:0}},autoFinish:false});
  h.step();const u=h.unit(1),target=h.spawn('enemy_1001_1',{pos:[10,6]});
  h.b.addBuff(target,{key:'test:def',mods:{defFlat:10000}});
  let observed;
  h.b.on('damaged',ctx=>{if(ctx.source===u&&ctx.target===target)observed=ctx.type;});
  h.b.dealDamage({source:u,target,amount:1000,type:'phys',dodgeMode:'ignore'});
  assert.equal(observed,'arts','native weakness conversion still applies through the new calculation stage');
  for(let n=0;n<6;n++){
    const enemy=h.spawn('enemy_1001_1',{pos:[10,6]});h.b.dealDamage(u,enemy,{amount:1e8,type:'true',isAttack:true,canDodge:false});
  }
  assert.equal(h.b.players[0].bonds.siracusaShip.layers,10);assert.equal(h.b.players[0].bonds.miraShip.layers,5);
  h.b.forceEnd();assert.equal(h.b.result().errors,0);
});
