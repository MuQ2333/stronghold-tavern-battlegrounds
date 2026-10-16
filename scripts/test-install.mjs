// Safe fixtures: node scripts/test-install.mjs <pinned-upstream-checkout>
// Or set TAVERN_TEST_UPSTREAM and run node --test scripts/test-install.mjs.
// All writes stay in a newly created temporary directory; no assets/network/server are used.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const upstream=process.env.TAVERN_TEST_UPSTREAM||process.argv[2];
if(!upstream)throw Error('Provide the pinned upstream Git checkout as argument, or TAVERN_TEST_UPSTREAM.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'mod/install-manifest.json'),'utf8'));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tavern-install-regression-'));
const baseline=path.join(scratch,'baseline'),bundle=path.join(scratch,"中文 模组 包' &");
fs.mkdirSync(baseline);fs.mkdirSync(path.join(bundle,'scripts'),{recursive:true});
execFileSync('git',['-C',path.resolve(upstream),'archive','--format=tar','--output',path.join(scratch,'base.tar'),manifest.upstreamCommit]);
execFileSync('tar',['-xf',path.join(scratch,'base.tar'),'-C',baseline]);
fs.copyFileSync(path.join(root,'scripts/install.mjs'),path.join(bundle,'scripts/install.mjs'));
fs.mkdirSync(path.join(bundle,'mod'));
fs.copyFileSync(path.join(root,'mod/install-manifest.json'),path.join(bundle,'mod/install-manifest.json'));
fs.cpSync(path.join(root,'mod/payload'),path.join(bundle,'mod/payload'),{recursive:true});
// The source-mode fixture has no asset manifest: this test targets source installation only.
const sha=b=>createHash('sha256').update(b).digest('hex');
const development=name=>/^(?:docs|test|tools)\//.test(name)||name==='mods/hero-strategies/README.md';
const excluded=manifest.files.filter(f=>development(f.path));
const runtime=manifest.files.find(f=>f.before!==null&&/^public\/js\/.*\.js$/.test(f.path));
assert.ok(runtime&&excluded.length>0);
let number=0;
function game(){const dir=path.join(scratch,`中文 原版 游戏 ${++number}`);fs.cpSync(baseline,dir,{recursive:true});return dir;}
function removeFixture(target){
 const relative=path.relative(fs.realpathSync(scratch),path.resolve(target));
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe fixture cleanup');
 fs.rmSync(target,{recursive:true,force:true});
}
function snapshot(dir,{filesOnly=false,excludeBackup=false}={}){
 const out={};
 function walk(folder,prefix=''){for(const item of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(excludeBackup&&item.name==='.tavern-mod-backup'&&!prefix)continue;
  const name=prefix+item.name,p=path.join(folder,item.name);
  if(item.isDirectory()){if(!filesOnly)out[name+'/']='directory';walk(p,name+'/');}
  else if(item.isSymbolicLink())out[name]='link:'+fs.readlinkSync(p);else out[name]=sha(fs.readFileSync(p));
 }}walk(dir);return out;
}
function run(dir,...args){return spawnSync(process.execPath,[path.join(bundle,'scripts/install.mjs'),...args,dir],{encoding:'utf8',input:''});}
function ok(result){assert.equal(result.status,0,result.stderr||result.stdout);}
function state(dir){return JSON.parse(fs.readFileSync(path.join(dir,'.tavern-mod-backup/state.json'),'utf8'));}
function devSnapshot(dir){return Object.fromEntries(Object.entries(snapshot(dir)).filter(([name])=>development(name)));}

test('player archive without developer directories installs, checks and uninstalls without recreating them',()=>{
 const dir=game();for(const name of ['docs','test','tools'])removeFixture(path.join(dir,name));
 const readme=path.join(dir,'mods/hero-strategies/README.md');if(fs.existsSync(readme))removeFixture(readme);
 ok(run(dir));ok(run(dir,'--check'));
 assert.ok(state(dir).files.every(f=>!development(f.path)));
 assert.equal(state(dir).files.length,manifest.files.length-excluded.length);
 for(const name of ['docs','test','tools'])assert.equal(fs.existsSync(path.join(dir,name)),false);
 ok(run(dir,'--uninstall'));
 for(const name of ['docs','test','tools'])assert.equal(fs.existsSync(path.join(dir,name)),false);
});
test('source/custom/BOM/CRLF developer references are never read or replaced',()=>{
 const dir=game();
 for(const f of excluded){const p=path.join(dir,f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from('\ufeff自定义资料\r\n'+f.path+'\r\n'));}
 const before=devSnapshot(dir);ok(run(dir));assert.deepEqual(devSnapshot(dir),before);
 const recorded=fs.readFileSync(path.join(dir,'.tavern-mod-backup/state.json'));ok(run(dir));
 assert.deepEqual(fs.readFileSync(path.join(dir,'.tavern-mod-backup/state.json')),recorded);
 ok(run(dir,'--uninstall'));assert.deepEqual(devSnapshot(dir),before);
});
test('target developer symlink is untouched while runtime installation remains safe',()=>{
 const dir=game();removeFixture(path.join(dir,'docs'));
 const outside=path.join(scratch,'保留文档');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'ARCHITECTURE.md'),'custom');
 fs.symlinkSync(outside,path.join(dir,'docs'),process.platform==='win32'?'junction':'dir');
 const before=snapshot(outside);ok(run(dir));ok(run(dir,'--uninstall'));assert.deepEqual(snapshot(outside),before);assert.ok(fs.lstatSync(path.join(dir,'docs')).isSymbolicLink());
});
test('actual runtime conflict fails before any target/backup/directory write',()=>{
 const dir=game(),p=path.join(dir,runtime.path);fs.appendFileSync(p,'\n// incompatible runtime\n');
 const before=snapshot(dir),result=run(dir);assert.equal(result.status,1);assert.match(result.stderr,/未写入任何文件/);assert.ok(result.stderr.includes(runtime.path));assert.deepEqual(snapshot(dir),before);
});
test('excluded developer payload corruption is still rejected with zero game writes',()=>{
 const dir=game(),p=path.join(bundle,'mod/payload',excluded[0].path),saved=fs.readFileSync(p);fs.appendFileSync(p,'\ncorrupt payload');
 try{const before=snapshot(dir),result=run(dir);assert.equal(result.status,1);assert.match(result.stderr,/发布包文件缺失或损坏/);assert.deepEqual(snapshot(dir),before);}finally{fs.writeFileSync(p,saved);}
});
test('runtime CRLF is accepted and restored byte-for-byte, while BOM remains rejected',()=>{
 const dir=game(),p=path.join(dir,runtime.path),original=fs.readFileSync(p),crlf=Buffer.from(original.toString('utf8').replaceAll('\r\n','\n').replaceAll('\n','\r\n'));
 fs.writeFileSync(p,crlf);ok(run(dir));ok(run(dir,'--uninstall'));assert.deepEqual(fs.readFileSync(p),crlf);
 fs.writeFileSync(p,Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),original]));const before=snapshot(dir),result=run(dir);assert.equal(result.status,1);assert.deepEqual(snapshot(dir),before);
});
test('legacy 0.2.2 full state still checks and restores developer documents strictly',()=>{
 const dir=game(),before=snapshot(dir,{filesOnly:true}),backup=path.join(dir,'.tavern-mod-backup'),files=[];
 for(const f of manifest.files){
  const dest=path.join(dir,f.path),current=fs.existsSync(dest)?fs.readFileSync(dest):null;
  if(current!==null){const p=path.join(backup,'files',f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,current);}
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(bundle,'mod/payload',f.path),dest);
  files.push({...f,before:current===null?null:sha(current)});
 }
 fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(path.join(backup,'state.json'),JSON.stringify({version:'0.2.2',files}));
 ok(run(dir,'--check'));
 const doc=path.join(dir,'docs/ARCHITECTURE.md'),saved=fs.readFileSync(doc);fs.appendFileSync(doc,'\nchanged after legacy install');
 const changed=snapshot(dir);assert.equal(run(dir,'--uninstall').status,1);assert.deepEqual(snapshot(dir),changed);
 fs.writeFileSync(doc,saved);ok(run(dir,'--uninstall'));
 assert.deepEqual(snapshot(dir,{filesOnly:true,excludeBackup:true}),before);
 ok(run(dir));assert.ok(state(dir).files.every(f=>!development(f.path)));ok(run(dir,'--uninstall'));
});
console.log(`Installer regression evidence: ${scratch}; ${manifest.files.length} reviewed payload entries, ${excluded.length} development-only, ${manifest.files.length-excluded.length} installed source entries.`);
