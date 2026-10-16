import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mod');
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
 if(Number(process.versions.node.split('.')[0])<22)throw Error('需要 Node.js 22 或以上。');
 const args=process.argv.slice(2);
 if(args.includes('--help')){console.log('安装：node install.mjs <游戏目录>\n校验：node install.mjs --check <游戏目录>\n卸载：node install.mjs --uninstall <游戏目录>');return;}
 if(args.some(a=>a.startsWith('--')&&!['--check','--uninstall'].includes(a)))throw Error('未知参数，请使用 --help 查看用法。');
 const uninstall=process.argv.includes('--uninstall');
 const check=args.includes('--check');
 if(check&&uninstall)throw Error('--check 与 --uninstall 不能同时使用。');
 let target=process.argv.slice(2).find(a=>!a.startsWith('--'));
 if(!target&&!process.stdin.isTTY)throw Error('请在命令后提供游戏目录，含空格的路径请加引号。');
 if(!target){const rl=createInterface({input:process.stdin,output:process.stdout});target=await rl.question('请输入游戏目录（含 package.json 和 server 文件夹）：');rl.close();}
 const root=fs.realpathSync(path.resolve(target.trim().replace(/^"|"$/g,'')));
 const stateDir=path.join(root,'.tavern-mod-backup'),statePath=path.join(stateDir,'state.json');
 if(fs.existsSync(stateDir)&&fs.lstatSync(stateDir).isSymbolicLink())throw Error('Backup must not be a linked directory');
 if(check){
  if(!fs.existsSync(statePath))throw Error('没有找到本脚本的安装记录。');
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  for(const f of state.files)if(!matches(read(safe(root,f.path)),f.after))throw Error('安装文件缺失或已改变：'+f.path);
  console.log(`校验通过：${state.files.length} 个安装文件。`);return;
 }
 if(uninstall){
  if(!fs.existsSync(statePath))throw Error('没有找到本脚本的安装记录。');
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  for(const f of state.files){if(!matches(read(safe(root,f.path)),f.after))throw Error('安装后文件已修改，已停止卸载以保留改动：'+f.path);if(f.before!==null&&!matches(read(safe(stateDir,'files/'+f.path)),f.before))throw Error('备份校验失败：'+f.path);}
  for(const f of state.files){const dest=safe(root,f.path);if(f.before===null)fs.unlinkSync(dest);else fs.copyFileSync(safe(stateDir,'files/'+f.path),dest);}
  fs.renameSync(statePath,path.join(stateDir,'uninstalled-'+Date.now()+'.json'));
  console.log('已恢复安装前文件；备份保留在 .tavern-mod-backup。');return;
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'install-manifest.json'),'utf8'));
 if(fs.existsSync(statePath)){
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  if(state.version!==manifest.version)throw Error('已安装其他版本，请先卸载旧版，再导入新版。');
  for(const f of state.files)if(!matches(read(safe(root,f.path)),f.after))throw Error('已安装的文件有改动，请先核对：'+f.path);
  console.log('本版本已安装，文件校验通过，未重复写入。');return;
 }
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 if(pkg.version!==manifest.gameVersion||!fs.existsSync(path.join(root,'server/index.js')))throw Error('需要可正常启动的原版卫戍协议 '+manifest.gameVersion+'。');
 const files=[];
 for(const f of manifest.files){
  const dest=safe(root,f.path),source=safe(packageRoot,'payload/'+f.path),current=read(dest);
  if(!matches(read(source),f.after))throw Error('发布包文件缺失或损坏：'+f.path);
  if(!baseMatches(current,f.before))throw Error('文件与适配上游不一致，未写入任何文件：'+f.path+'。请使用干净的 '+manifest.gameVersion+' 游戏副本，勿覆盖其他模组。');
  files.push({...f,before:current===null?null:hash(current)});
 }
 const assetManifest=path.join(packageRoot,'asset-manifest.json');
 if(fs.existsSync(assetManifest))for(const f of JSON.parse(fs.readFileSync(assetManifest,'utf8')).files){
  if(!/^public\/assets\/(spells|heroes|bob)\//.test(f.path))throw Error('Unexpected asset path');
  const dest=safe(root,f.path),source=safe(packageRoot,'assets/'+f.path),current=read(dest);
  if(!matches(read(source),f.after))throw Error('模组素材缺失或损坏：'+f.path+'。请完整解压 Full.zip；GitHub 的 Source code ZIP 不含图片和录音。');
  if(current!==null&&!matches(current,f.after))throw Error('已有不同模组素材，请先备份到其他目录：'+f.path);
  if(current===null)files.push({path:f.path,before:null,after:f.after,asset:true});
 }
 for(const f of files)if(f.before!==null){const backup=safe(stateDir,'files/'+f.path);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(safe(root,f.path),backup);}
 fs.mkdirSync(stateDir,{recursive:true});
 const written=[];
 try{
  for(const f of files){const dest=safe(root,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});written.push(f);fs.copyFileSync(safe(packageRoot,(f.asset?'assets/':'payload/')+f.path),dest);}
  fs.writeFileSync(statePath+'.tmp',JSON.stringify({version:manifest.version,files},null,2));
  fs.renameSync(statePath+'.tmp',statePath);
 }catch(error){for(const f of written.reverse()){const dest=safe(root,f.path);if(f.before===null){if(fs.existsSync(dest))fs.unlinkSync(dest);}else fs.copyFileSync(safe(stateDir,'files/'+f.path),dest);}throw error;}
 console.log('导入完成。请沿用原游戏启动方式；服务端监听地址和端口由你的部署配置决定。详见 INSTALL.md。');
 if(!fs.existsSync(assetManifest))console.log('这是源码包，不含模组素材；完整安装请下载 Releases 中的 Full.zip。');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
