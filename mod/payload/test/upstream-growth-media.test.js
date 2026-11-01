// Optional acceptance against a real, pinned upstream checkout/archive, never a substitute fixture.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {GROWTH_BLUE_POISON} from '../shared/growthBluePoison.js';
import {GROWTH_BLUE_POISON_ASSETS} from '../shared/growthBluePoisonAssets.js';

const root=process.env.SP_UPSTREAM_NATIVE_ROOT;
test('added operator voice metadata matches the latest upstream planner and AudioManager API',{
 skip:!root||!fs.existsSync('.cache/gamedata/excel/charword_table.json'),
},async()=>{
 const load=rel=>import(pathToFileURL(path.join(root,rel)).href);
 const [{buildPlan},{indexAudio},{voiceLine,AudioManager}]=await Promise.all([load('tools/assets/plan.mjs'),load('tools/assets/audio.mjs'),load('public/js/audio.js')]);
 const charId='char_129_bluep',card=GROWTH_BLUE_POISON.chess.chess_char_2_30_a;
 const charword=JSON.parse(fs.readFileSync('.cache/gamedata/excel/charword_table.json','utf8'));
 const {template}=buildPlan({assets07:{},ops03:{chess:[{charId,defaultSkillIndex:1}]},enemies05:{},maps05:{},modelsData:{},audio:indexAudio({}),charword,voiceJp:true,optionalVoice:true,extraOperators:{[charId]:{name:card.name,skills:card.skills}}});
 let count=0;
 for(const [tree,lang]of [['voice','cn'],['voiceJp','jp'],['voiceEn','en'],['voiceKr','kr']])for(const [slot,leaves]of Object.entries(template.audio[tree][charId])){
  const expected=[leaves].flat().map(l=>'/assets/growth-bluepoison/'+l.alts[0].rel);
  const actual=[GROWTH_BLUE_POISON_ASSETS.audio[tree][charId][slot]].flat();assert.deepEqual(actual,expected,`${lang}/${slot}`);
  for(let n=0;n<actual.length;n++)assert.equal(voiceLine(GROWTH_BLUE_POISON_ASSETS.audio,charId,slot,lang,()=>n/actual.length).url,actual[n]);
  count+=actual.length;
 }
 assert.equal(count,56);
 for(const method of ['voice','previewVoice','setVoiceLang','setVoiceNative','_buffer'])assert.equal(typeof AudioManager.prototype[method],'function',method);
});
