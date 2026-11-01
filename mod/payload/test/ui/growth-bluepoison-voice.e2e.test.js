import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

test('Blue Poison lobby previews and battle voice slots decode and play in all installed dubs',{
 skip:process.env.SP_E2E!=='1'||!process.env.CHROME_PATH||!existsSync('public/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_019.mp3'),timeout:90000,
},async()=>{
 const {startServer}=await import('../../server/index.js'),puppeteer=(await import('puppeteer-core')).default;
 const srv=await startServer({port:0,host:'127.0.0.1',quiet:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-first-run','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage(),problems=[];page.on('pageerror',e=>problems.push(e.message));
  await page.goto(srv.url);await page.click('body');
  const result=await page.evaluate(async()=>{
   const {data}=await import('/js/data.js'),{AudioManager,VOICE_TREES}=await import('/js/audio.js');
   await data.loadAll('assets','chess');data.setGrowthMode(false);
   const manager=new AudioManager({win:window,getManifest:()=>data.get('assets')});manager._unlock();await manager.ctx.resume();
   const decoded=[];
   for(const [tree,chars]of Object.entries(data.get('assets').audio))if(tree.startsWith('voice')&&chars?.char_129_bluep){
    for(const line of new Set(Object.values(chars.char_129_bluep).flat())){
     const buf=await manager._buffer(line);decoded.push({tree,line,duration:buf?.duration||0});
    }
   }
   const played=[];
   for(const lang of ['cn','jp','en','kr'])for(const slot of ['place','skill2']){
    manager.voiceGate.reset();manager._stopVoice();manager.setVoiceLang(lang);
    const accepted=manager.voice('char_129_bluep',slot,{unitKey:`${lang}:${slot}`});
    await new Promise(r=>setTimeout(r,30));
    played.push({lang,slot,accepted,url:manager.voiceNode?.url,allowed:[data.get('assets').audio[lang==='cn'?'voice':VOICE_TREES[lang]].char_129_bluep[slot]].flat()});
   }
   manager._stopVoice();manager.previewVoice('char_129_bluep','jp');await new Promise(r=>setTimeout(r,30));
   const preview=manager.voiceNode?.url;manager._stopVoice();await manager.ctx.close();
   return {decoded,played,preview,blueInNative:data.list('chess').some(c=>c.charId==='char_129_bluep')};
  });
  assert.equal(result.decoded.length,56);assert.ok(result.decoded.every(r=>r.duration>0.1),JSON.stringify(result.decoded.filter(r=>!r.duration)));
  for(const r of result.played){assert.equal(r.accepted,true);assert.ok(r.allowed.includes(r.url),JSON.stringify(r));}
  assert.match(result.preview,/voice\/jp\/char_129_bluep/);assert.equal(result.blueInNative,false);assert.deepEqual(problems,[]);
 }finally{await browser.close();await srv.close();}
});
