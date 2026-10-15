import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
const packageRoot=path.dirname(fileURLToPath(import.meta.url));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function safe(root,name){
 if(!name||path.isAbsolute(name)||name.split(/[\\/]/).some(p=>p==='..'||p===''))throw Error('Unsafe path: '+name);
 const dest=path.resolve(root,name);
 for(let p=dest;p!==root;p=path.dirname(p))if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Linked path is not supported: '+p);
 return dest;
}
const read=p=>fs.existsSync(p)?fs.readFileSync(p):null;
const matches=(b,h)=>b===null?h===null:hash(b)===h;
const baseMatches=(b,h)=>matches(b,h)||(b!==null&&h!==null&&hash(Buffer.from(b.toString('utf8').replaceAll('\r\n','\n')))===h);
async function main(){
 const uninstall=process.argv.includes('--uninstall');
 let target=process.argv.slice(2).find(a=>!a.startsWith('--'));
 if(!target){const rl=createInterface({input:process.stdin,output:process.stdout});target=await rl.question('请输入游戏目录（含 package.json 和 server 文件夹）：');rl.close();}
 const root=fs.realpathSync(path.resolve(target.trim().replace(/^"|"$/g,'')));
 const stateDir=path.join(root,'.tavern-mod-backup'),statePath=path.join(stateDir,'state.json');
 if(fs.existsSync(stateDir)&&fs.lstatSync(stateDir).isSymbolicLink())throw Error('Backup must not be a linked directory');
 if(uninstall){
  if(!fs.existsSync(statePath))throw Error('没有找到本脚本的安装记录。');
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  for(const f of state.files){if(!matches(read(safe(root,f.path)),f.after))throw Error('安装后文件已修改，已停止卸载以保留改动：'+f.path);if(f.before!==null&&!matches(read(safe(stateDir,'files/'+f.path)),f.before))throw Error('备份校验失败：'+f.path);}
  for(const f of state.files){const dest=safe(root,f.path);if(f.before===null)fs.unlinkSync(dest);else fs.copyFileSync(safe(stateDir,'files/'+f.path),dest);}
  fs.renameSync(statePath,path.join(stateDir,'uninstalled-'+Date.now()+'.json'));
  console.log('已恢复安装前文件；备份保留在 .tavern-mod-backup。');return;
 }
 if(fs.existsSync(statePath)){console.log('已安装。请先卸载旧版，再导入新版。');return;}
 const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'install-manifest.json'),'utf8'));
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 if(pkg.version!==manifest.gameVersion||!fs.existsSync(path.join(root,'server/index.js')))throw Error('需要可正常启动的原版卫戍协议 '+manifest.gameVersion+'；不支持 Forge 目录。');
 const files=[];
 for(const f of manifest.files){
  const dest=safe(root,f.path),source=safe(packageRoot,'payload/'+f.path),current=read(dest);
  if(!matches(read(source),f.after))throw Error('发布包文件缺失或损坏：'+f.path);
  if(!baseMatches(current,f.before))throw Error('文件与适配上游不一致，未写入任何文件：'+f.path+'。请使用干净的 0.2.6 游戏副本，勿覆盖其他模组。');
  files.push({...f,before:current===null?null:hash(current)});
 }
 const assetManifest=path.join(packageRoot,'asset-manifest.json');
 if(fs.existsSync(assetManifest))for(const f of JSON.parse(fs.readFileSync(assetManifest,'utf8')).files){
  if(!/^public\/assets\/(spells|heroes|bob)\//.test(f.path))throw Error('Unexpected asset path');
  const dest=safe(root,f.path),source=safe(packageRoot,'assets/'+f.path),current=read(dest);
  if(!matches(read(source),f.after))throw Error('素材包损坏：'+f.path);
  if(current!==null&&!matches(current,f.after))throw Error('已有不同模组素材，请先备份到其他目录：'+f.path);
  if(current===null)files.push({path:f.path,before:null,after:f.after,asset:true});
 }
 for(const f of files)if(f.before!==null){const backup=safe(stateDir,'files/'+f.path);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(safe(root,f.path),backup);}
 fs.mkdirSync(stateDir,{recursive:true});
 const written=[];
 try{
  for(const f of files){const dest=safe(root,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});written.push(f);fs.copyFileSync(safe(packageRoot,(f.asset?'assets/':'payload/')+f.path),dest);}
  fs.writeFileSync(statePath,JSON.stringify({version:manifest.version,files},null,2));
 }catch(error){for(const f of written.reverse()){const dest=safe(root,f.path);if(f.before===null){if(fs.existsSync(dest))fs.unlinkSync(dest);}else fs.copyFileSync(safe(stateDir,'files/'+f.path),dest);}throw error;}
 console.log('导入完成。请双击游戏目录内 Start-TavernBundle.cmd，浏览器打开 http://127.0.0.1:3013/ 。');
 if(!fs.existsSync(assetManifest))console.log('这是源码包，不含游戏素材；完整试玩请下载 Releases 中的 Windows ZIP。');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
