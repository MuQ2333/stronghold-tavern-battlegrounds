import{test}from'node:test';
import assert from'node:assert/strict';
import{AudioManager}from'../public/js/audio.js';

test('shop narration uses voice volume, is independent of operator speech, and cancels an unfinished download',async()=>{
 const a=new AudioManager({win:null});let started=0,stopped=0,connected=null,ended=0;
 a.ctx={createBufferSource:()=>({connect:g=>{connected=g;},start:()=>started++,stop:()=>stopped++})};a.voiceGain={voice:true};
 a._buffer=async()=>({duration:1});
 a.narrator('/voice-test',()=>ended++);await Promise.resolve();assert.equal(started,1);assert.equal(connected,a.voiceGain);
 a.voice('missing-operator','select');assert.equal(stopped,0);assert.equal(ended,0);
 let finish;a._buffer=()=>new Promise(resolve=>{finish=resolve;});
 const cancel=a.narrator('/slow');assert.equal(stopped,1,'new Bob immediately stops the previous Bob');assert.equal(ended,1);cancel();finish({duration:1});await Promise.resolve();assert.equal(started,1);
 a.volumes.voice=0;a._buffer=()=>{throw Error('muted narration must not load');};a.narrator('/muted');
 a.volumes.voice=1;a.voiceNode={};a._buffer=async()=>({duration:1});a.narrator('/busy');await Promise.resolve();assert.equal(started,2);
});
