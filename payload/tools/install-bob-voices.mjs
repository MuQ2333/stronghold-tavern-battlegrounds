// Install only reviewed, unchanged original lines. Generated samples require a separate approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [planFile,audioDir]=process.argv.slice(2);
if(!planFile||!audioDir)throw Error('Usage: node tools/install-bob-voices.mjs <generation-plan.json> <original-audio-directory>');
const plan=JSON.parse(await fs.readFile(planFile,'utf8'));
const cues={'需要补强':'loss','冻结商店':'freeze','出售干员':'sell','防守顺利':'win','本轮防守有漏怪':'loss','本轮完美防守':'win','连续完美防守':'streak','休整期闲聊':'idle','回到休整期':'prep','本局开场':'welcome','招募高阶干员':'buyHigh','招募中阶干员':'buyMid','招募低阶干员':'buyLow','普通战斗开始':'combat','升级调度中心':'upgrade','完成晋升':'triple','刷新商店':'refresh','新手招募／部署提示':'tutorial','可完成晋升':'tripleAvailable'};
// Original-only mode also restores the reviewed strategy-selection line.
cues['选择策略']='strategy';
const bank={},assets=[];
for(const line of plan.lines){
 if(line.include!==1||line.number===34||line.audioMode!=='original')continue;
 if(line.text!==line.original)throw Error(`Changed text cannot use original audio: ${line.number}`);
 const cue=line.number===58?'firstWin':cues[line.category];
 if(!cue)throw Error(`Unmapped approved line ${line.number}`);
 const audioId=line.audioId||line.id;
 const bytes=await fs.readFile(path.join(audioDir,audioId+'.wav'));
 if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Invalid WAV: '+line.id);
 const url='/assets/bob/voices/'+audioId+'.wav';
 (bank[cue]??=[]).push({id:line.id,...(audioId!==line.id?{audioId}:{}),number:line.number,text:line.text,url});
 assets.push({url,bytes});
}
await fs.mkdir(path.join(root,'public/assets/bob/voices'),{recursive:true});
for(const a of assets)await fs.writeFile(path.join(root,'public',a.url),a.bytes);
await fs.writeFile(path.join(root,'public/js/ui/bobVoiceManifest.js'),'// Generated from the reviewed script. Only unchanged original recordings; row 34 and AI samples excluded.\nexport const BOB_VOICE_MANIFEST=Object.freeze('+JSON.stringify(bank,null,2)+');\n');
console.log(`Installed ${assets.length} reviewed original recordings in ${Object.keys(bank).length} cue groups.`);
