import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BobDirector,BobSpeechGate,bobSnapshot,bobCue,bobLines} from '../shared/bobShopkeeper.js';
import {BOB_VOICE_MANIFEST as bank} from '../public/js/ui/bobVoiceManifest.js';
const state=(extra={})=>({phase:'PREP',round:1,alive:true,ready:false,level:1,merges:0,buys:0,sells:0,refreshes:0,leaks:0,pendingLp:0,...extra});
test('speech is intermittent without a round cap; refresh has its own cooldown',()=>{
 const gate=new BobSpeechGate();let draws=0;const miss=()=>{draws++;return .99;},hit=()=>{draws++;return 0;};
 assert.equal(gate.consider('refresh',0,1,miss),false);
 assert.equal(gate.consider('refresh',100,1,hit),false);assert.equal(draws,1);
 assert.equal(gate.consider('refresh',3000,1,hit),true);gate.played('refresh',3000);
 assert.equal(gate.consider('buyLow',10000,1,hit),false);
 assert.equal(gate.consider('buyLow',11000,1,hit),true);gate.played('buyLow',11000);
 assert.equal(gate.consider('refresh',19000,1,hit),false);
 assert.equal(gate.consider('triple',19000,1,hit),true);gate.played('triple',19000);
 assert.equal(gate.consider('refresh',27000,1,hit),true,'same round can speak again');gate.played('refresh',27000);
 assert.equal(gate.consider('refresh',35000,2,hit),false,'round changes do not bypass refresh cooldown');
 assert.equal(gate.consider('refresh',47000,2,hit),true);
 const odds=new BobSpeechGate();assert.equal(odds.consider('refresh',0,1,()=>.1),false);
 assert.equal(odds.consider('refresh',3000,1,()=>.09),true);
});
test('reviewed original bank excludes disabled and unapproved generated lines',()=>{
 const lines=Object.values(bank).flat();assert.equal(lines.length,62);
 assert.equal(new Set(lines.map(l=>l.number)).size,62);
 for(const row of [7,34,36])assert.ok(!lines.some(l=>l.number===row));
 for(const [row,suffix]of [[2,'AfterFreezing_02'],[6,'Ahead_03'],[44,'RecruitSmallMinion_03']]){
  const line=lines.find(l=>l.number===row);assert.equal(line.audioId,'VO_DALA_BOSS_99h_Male_Human_'+suffix);
  assert.ok(line.url.endsWith(line.audioId+'.wav'));
 }
 assert.equal(lines.find(l=>l.number===23).text,'有一次我给死亡骑士倒酒。他一接过去……那杯酒就冻住啦！');
 assert.ok(lines.find(l=>l.number===14).text.includes('随从'));
 assert.ok(lines.find(l=>l.number===35).text.includes('指挥官'));
 assert.equal(bank.strategy[0].number,60);
 assert.equal(bobLines(bank,'firstWin')[0].number,58);
 assert.equal(bobLines(bank,'defeat').length,1);
});
test('confirmed purchases distinguish operators from equipment and sales require an operator to disappear',()=>{
 const snapshot=(kind,tier,sold,buys)=>bobSnapshot({phase:'PREP',round:1},{alive:true,stats:{buys},shop:{slots:[{kind,id:'a',sold}]}},()=>({tier}));
 for(const [tier,cue]of [[1,'buyLow'],[4,'buyMid'],[6,'buyHigh']])assert.equal(bobCue(snapshot('chess',tier,false,0),snapshot('chess',tier,true,1)),cue);
 assert.equal(bobCue(snapshot('item',1,false,0),snapshot('item',1,true,1)),null);
 const before=state({pieces:[{uid:1,id:'a'}],slots:[]});
 assert.equal(bobCue(before,{...before,sells:1}),null);
 assert.equal(bobCue(before,{...before,sells:1,pieces:[]}),'sell');
 assert.equal(bobCue(before,{...before,buys:1,merges:1}),'triple');
});
test('welcome is once per observed game and reconnect does not invent a battle outcome',()=>{
 const d=new BobDirector();assert.equal(d.observe(state()),null);
 assert.equal(d.observe(state()),null);
 d.observe(state({phase:'INFO_CHECK'}));assert.equal(d.observe(state({phase:'BAND_DRAFT'})),null);assert.equal(d.observe(state({phase:'BATTLE_CHECK'})),null);
 assert.equal(d.observe(state()),'welcome');assert.equal(d.observe(state()),null);
 const resumed=new BobDirector();resumed.observe(state({phase:'COMBAT',round:5}));resumed.observe(state({phase:'SETTLE',round:5}));
 assert.equal(resumed.observe(state({round:6})),'prep');
});
test('completed normal battles give one first win, streak and loss feedback on return to prep',()=>{
 const d=new BobDirector();d.observe(state());
 for(const [round,expected]of [[1,'firstWin'],[2,'win'],[3,'streak'],[4,'loss']]){
  d.observe(state({phase:'COMBAT',round}));
  if(round===4)d.observe(state({phase:'UNITE',round,pendingLp:2}));
  d.observe(state({phase:'SETTLE',round,leaks:round===4?2:0}));
  assert.equal(d.observe(state({round:round+1,leaks:round===4?2:0})),expected);
  assert.equal(d.observe(state({round:round+1,leaks:round===4?2:0})),null);
 }
});
test('idle, tutorial and available-merge reminders respect round and eligibility limits',()=>{
 const d=new BobDirector(),s=state();d.observe(s);
 assert.equal(d.idle(s,24999),null);assert.equal(d.idle(s,25000),'idle');assert.equal(d.idle(s,40000),null);
 assert.equal(d.idle({...s,round:2,ready:true},30000),null);
 assert.equal(d.idle({...s,round:2,paused:true},30000),null);
 assert.equal(d.idle({...s,round:2,alive:false},30000),null);
 const lookup=()=>({upgradeNum:3,tier:2});
 const priv={alive:true,shop:{slots:[{kind:'chess',id:'a'}]},hand:[{uid:1,kind:'chess',id:'a'},{uid:2,kind:'chess',id:'a'}]};
 const snap=bobSnapshot(s,priv,lookup);assert.equal(snap.triple,'a');
 assert.equal(d.idle(snap,3000),'tripleAvailable');assert.equal(d.idle(snap,3000),null);
 priv.hand[1].handLock={};assert.equal(bobSnapshot(s,priv,lookup).triple,null);
 delete priv.hand[1].handLock;priv.shop.slots[0].price=3;assert.equal(bobSnapshot(s,priv,lookup).triple,null);
 const teaching=new BobDirector();assert.equal(teaching.idle(s,10000,false),null);assert.equal(teaching.idle(s,10000,true),'tutorial');assert.equal(teaching.idle(s,10000,true),null);
});

test('prep and combat cues bypass both cooldowns but retain their probability',()=>{
 for(const cue of ['welcome','prep','combat','win','firstWin','loss','streak']){
  const gate=new BobSpeechGate();gate.consider('refresh',0,1,()=>0);gate.played('refresh',0);
  assert.equal(gate.consider(cue,1,1,()=>0),true,cue);
  gate.played(cue,1);assert.equal(gate.consider('buyLow',2,1,()=>0),false);
 }
 const gate=new BobSpeechGate();gate.played('refresh',0);
 assert.equal(gate.consider('combat',1,1,()=>.99),false);
});

test('opening narration excludes later-round and elimination remarks',async()=>{const {BOB_VOICE_MANIFEST:b}=await import('../public/js/ui/bobVoiceManifest.js');const {bobLines}=await import('../shared/bobShopkeeper.js');assert.ok(!bobLines(b,'welcome',1).some(x=>x.number===29));assert.ok(!bobLines(b,'combat',1).some(x=>x.number===29));assert.ok(bobLines(b,'combat',2).some(x=>x.number===29));assert.ok(!bobLines(b,'loss',2).some(x=>x.number===12));assert.ok(bobLines(b,'defeat',2).some(x=>x.number===12));});


test('merge reminders use the base ten-slot bench and ignore overflow slots',()=>{
 const piece=i=>({kind:'chess',id:'a',uid:i});
 const snapshot=hand=>bobSnapshot({phase:'PREP',round:1},{hand,funds:5,shop:{slots:[{kind:'chess',id:'a',price:1}]}},()=>({upgradeNum:3}));
 assert.equal(snapshot(Array.from({length:10},(_,i)=>piece(i))).triple,null);
 const hand=Array.from({length:10},(_,i)=>piece(i));hand[9]=null;
 assert.equal(snapshot(hand).triple,'a');
 assert.equal(snapshot([...Array.from({length:10},(_,i)=>piece(i)),null]).triple,null);
});
