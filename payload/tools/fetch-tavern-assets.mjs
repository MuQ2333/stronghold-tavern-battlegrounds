// Reuse the independent pack's verified strategy portraits; never include game art in a source patch.
import fs from'node:fs/promises';
import path from'node:path';
import {fileURLToPath}from'node:url';
import{HERO_POWER_IDS}from'../shared/heroPowers.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=process.argv[2];
if(!source)throw Error('Usage: node tools/fetch-tavern-assets.mjs <independent hero pack directory>; expects assets/art/');
const dest=path.join(root,'public/assets/heroes');await fs.mkdir(dest,{recursive:true});
const pack=JSON.parse(await fs.readFile(path.resolve(source,'pack.json'),'utf8'));
for(const id of HERO_POWER_IDS){
 if(id==='nguyen')continue;
 const portrait=pack.art?.bands?.['band_hs_'+id],power=pack.art?.skills?.['hero_power_'+id];
 if(!portrait||!power)throw Error('Missing source art mapping for '+id);
 await fs.copyFile(path.resolve(source,'assets',portrait),path.join(dest,`strategy-${id}.png`));
 await fs.copyFile(path.resolve(source,'assets',power),path.join(dest,`power-${id}.jpg`));
}
for(const [file,url] of [
 ['strategy-nguyen.png','https://art.hearthstonejson.com/v1/heroes/latest/256x/BG20_HERO_202.png'],
 ['power-nguyen.jpg','https://art.hearthstonejson.com/v1/256x/BG20_HERO_202p.jpg'],
]) {
 const output=path.join(dest,file);
 try{await fs.access(output);}catch{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(file+' '+r.status);
  await fs.writeFile(output,Buffer.from(await r.arrayBuffer()));
 }
}
const url='https://art.hearthstonejson.com/v1/heroes/latest/256x/TB_BaconShopBob.png';
const bob=path.join(root,'public/assets/bob');await fs.mkdir(bob,{recursive:true});
try{await fs.access(path.join(bob,'portrait.png'));}catch{
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Bob art '+response.status);
 await fs.writeFile(path.join(bob,'portrait.png'),Buffer.from(await response.arrayBuffer()));
}
console.log('Prepared 30 hero portraits and skill icons, and Bob portrait. No voice files generated.');
