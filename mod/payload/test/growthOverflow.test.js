import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './match/harness.js';
import { makeBattle, chessRec } from './helpers/battleHarness.js';
import { DataSource } from '../server/sim/simdata.js';
import { growthData, GROWTH_ROSTER } from '../shared/growthMode.js';

const active = (layers = 0) => ({active:true,count:1,tier:1,layers});
const probe = chessRec({id:'overflow_probe',skill:null});
const raw = growthData({...DATA,bonds:{...DATA.bonds,'forge:overflow:main':{bondId:'forge:overflow:main',isCore:true,thresholds:[1],buffs:[],bb:{}}},chess:{...DATA.chess,[probe.chessId]:probe}},true);
const star = GROWTH_ROSTER.find(r=>r.name==='溯光星源').id;
function field(bonds, options={}) {
  const {withStar=false,...rest}=options;
  const h=makeBattle({data:new DataSource(raw),units:[{chessId:probe.chessId,row:10,col:3},
    ...(withStar?[{chessId:star,row:12,col:5}]:[])],bonds,
    flags:{growthMode:true,layerGainsEnabled:false},autoFinish:false,...rest});
  h.step();return h;
}
function finish(h) {
  h.b.forceEnd();const r=h.b.result();assert.equal(r.errors,0,JSON.stringify(h.b.errors));
  assert.deepEqual(r.perPlayer.p1.layerGains,{},'opening copies never become permanent settlement gains');
}

for(const kind of ['normal','unite','boss','hidden'])test(`Swift copies all excess temporarily in ${kind}, without a Star or permanent-gain permission`,()=>{
  const bonds={swiftShip:active(1150),yanShip:active(30),kjeragShip:active(10),arcaneShip:active(800)};
  for(let n=0;n<2;n++) {
    const h=field(bonds,{kind}),p=h.b.players[0];
    assert.equal(p.bonds.yanShip.layers,181);assert.equal(p.bonds.swiftShip.layers,1150);
    assert.equal(p.bonds.kjeragShip.layers,10);assert.equal(p.bonds.arcaneShip.layers,800);
    assert.equal(bonds.yanShip.layers,30,'fresh fields use persistent input, not previous temporary copies');
    h.b.emit('battleStart',{});assert.equal(p.bonds.yanShip.layers,181);
    h.b.addLayers('p1','swiftShip',50,'spell',{temporary:true});
    assert.equal(p.bonds.yanShip.layers,181,'no continuous conversion after opening');
    finish(h);
  }
});

test('Swift requires growth mode, an active Swift, a positive excess and an active main target',()=>{
  const cases=[
    {bonds:{swiftShip:active(1150),yanShip:active(30)},flags:{growthMode:false}},
    {bonds:{swiftShip:{...active(1150),active:false},yanShip:active(30)}},
    {bonds:{swiftShip:active(999),yanShip:active(30)}},
    {bonds:{swiftShip:active(1150),yanShip:{...active(30),active:false},arcaneShip:active(800)}},
    {bonds:{skillfulShip:active(1150),yanShip:active(30)}},
  ];
  for(const {bonds,flags} of cases) {
    const h=field(bonds,flags?{flags}:{});
    assert.equal(h.b.players[0].bonds.yanShip.layers,30);finish(h);
  }
  const h=field({swiftShip:active(1000),yanShip:active(30)});
  assert.equal(h.b.players[0].bonds.yanShip.layers,31);finish(h);
});

test('Swift and Star each supply their own temporary opening copy to the highest active main',()=>{
  const h=field({swiftShip:active(1150),skillfulShip:active(1050),yanShip:active(30),kjeragShip:active(10)}, {withStar:true});
  assert.equal(h.b.players[0].bonds.yanShip.layers,232,'30 + Swift151 + Star51');
  assert.equal(h.b.players[0].bonds.skillfulShip.layers,1050);finish(h);
});

test('opening targets use match content, including Kazdel and a namespaced Forge main absent from native data',()=>{
  for(const target of ['kazdelShip','forge:overflow:main']) {
    const h=field({swiftShip:active(1150),skillfulShip:active(1050),[target]:active(50),yanShip:active(30)},{withStar:true});
    assert.equal(h.b.players[0].bonds[target].layers,252);
    assert.equal(h.b.players[0].bonds.yanShip.layers,30);finish(h);
  }
});
