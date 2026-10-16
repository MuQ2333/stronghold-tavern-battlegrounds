// Download untracked Hearthstone art separately from the source patch.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SHOP_SPELLS } from '../shared/spellCatalog.js';
import { decodePng } from './crop-board-atlas.mjs';
import {trimSpellMatte,cropSpellImage} from './spell-art.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'public/assets/spells');
await fs.mkdir(dest, { recursive: true });
const originals=path.join(dest,'originals');await fs.mkdir(originals,{recursive:true});
const ids = [...new Set(SHOP_SPELLS.map(c => c.iconId))].filter(id => /^(BG|EBG_)/.test(id));
const results = [];
async function download(id) {
  const url = `https://art.hearthstonejson.com/v1/orig/${id}.png`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const blob = Buffer.from(await response.arrayBuffer());
  if (blob.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${id}: not PNG`);
  return blob;
}
for (let start = 0; start < ids.length; start += 3) {
  const rows = await Promise.all(ids.slice(start, start + 3).map(async id => {
    const target = path.join(dest, id + '.png');
    let blob, fallback = null;
    try { blob = await fs.readFile(path.join(originals,id+'.png')); } catch { /* download the unmodified source below */ }
    if(blob?.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')blob=null;
    if (!blob) {
      try { blob = await download(id); }
      catch (e) {
        if (id !== 'BG36_303') return { id, error: e.message };
        // Newest art is not always mirrored yet: explicitly reuse Tavern Coin until it is available.
        fallback = 'BG28_810';
        try { blob = await fs.readFile(path.join(dest, fallback + '.png')); } catch { blob = await download(fallback); }
      }
      await fs.writeFile(path.join(originals,id+'.png'),blob);
    }
    // BG28_827 has a curved white export matte, not a straight uniform border.
    const rect=id==='BG28_827'?[2,52,508,396]:null;
    const sourceSha256=createHash('sha256').update(blob).digest('hex'),trimmed=rect?{blob:cropSpellImage(decodePng(blob),rect),rect}:trimSpellMatte(blob);
    await fs.writeFile(target,trimmed.blob);
    return {id,sourceSha256,rect:trimmed.rect,sha256:createHash('sha256').update(trimmed.blob).digest('hex'),fallback};
  }));
  results.push(...rows);
}
// User-requested shield-focused crop from normal Hoshiguma's E2 illustration.
const illustrationUrl='https://media.prts.wiki/0/0a/%E7%AB%8B%E7%BB%98_%E6%98%9F%E7%86%8A_2.png';
try {
 const source=path.join(originals,'hoshiguma-e2-illustration.png');let src;
 try{src=await fs.readFile(source);}catch{
  const r=await fetch(illustrationUrl,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error('Hoshiguma illustration '+r.status);
  src=Buffer.from(await r.arrayBuffer());await fs.writeFile(source,src);
 }
 // Include all three shield corners; the original overlapping character remains visible.
 const rect=[40,590,1240,1240],blob=cropSpellImage(decodePng(src),rect);
 await fs.writeFile(path.join(dest,'hoshiguma_shield_illustration.png'),blob);
 results.push({id:'hoshiguma_shield',source:illustrationUrl,rect,sourceSha256:createHash('sha256').update(src).digest('hex'),sha256:createHash('sha256').update(blob).digest('hex')});
}catch(error){results.push({id:'hoshiguma_shield',error:error.message});}
await fs.writeFile(path.join(dest, 'sources.json'), JSON.stringify({ source: 'https://hearthstonejson.com/; Arknights original E2 Hoshiguma illustration crop', results }, null, 2) + '\n');
const failures = results.filter(r => r.error);
console.log(`${results.length - failures.length}/${results.length} spell images installed; ${results.filter(r => r.fallback).length} explicitly reused coin image(s).`);
for (const row of failures) console.error(row.error);
if (failures.length) process.exitCode = 1;
