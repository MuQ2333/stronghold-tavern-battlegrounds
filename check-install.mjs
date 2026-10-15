import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]||'.'),state=JSON.parse(fs.readFileSync(path.join(root,'.tavern-mod-backup/state.json'),'utf8'));
const failed=[];
for(const f of state.files){const p=path.resolve(root,f.path);if(!p.startsWith(root+path.sep))throw Error('Invalid manifest path');if(!fs.existsSync(p)||createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.after)failed.push(f.path);}
if(failed.length){console.error('导入文件校验失败：\n'+failed.join('\n'));process.exitCode=1;}
else console.log(`导入文件校验通过：${state.files.length} 个文件。`);
