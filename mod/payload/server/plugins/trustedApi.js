// Shared rules of the experimental trusted IPC bridge (DESIGN §32.10).
// [ASSUMED] A plugin's health extension is at most 16 KiB of serialized UTF-8 JSON.
export const TRUSTED_HEALTH_BYTES = 16 * 1024;
export function trustedRouteAllowed(id, route) {
  return typeof id === 'string' && typeof route === 'string' && route.startsWith(`/x/${id}/`)
    && !/\.\.|%2e|%5c|[\\?#\x00-\x20\x7f]/i.test(route);
}
export function healthJson(value) {
  const json = JSON.stringify(value);
  if (typeof json !== 'string' || Buffer.byteLength(json, 'utf8') > TRUSTED_HEALTH_BYTES)
    throw new Error(`health extension must be JSON of at most ${TRUSTED_HEALTH_BYTES} bytes`);
  return JSON.parse(json);
}

/** The importer uses this marker only on explicitly trusted Forge match-wrapper adapters. */
export const FORGE_MATCH_MARKER = '/* sp-forge-match-wrapper-v1 */';

/** Apply selected, verified Forge match wrappers in the content set's isolated trusted host. */
export async function applyForgeMatchWrappers(Base, scripts, { importModule, log = {}, digest = '' } = {}) {
  let current=Base;
  const modules=[];
  for (const plugin of scripts || []) {
    if (plugin.class!=='trusted' || plugin.execution==='sandbox') continue;
    const manifest=JSON.parse(plugin.manifestSource), source=plugin.sources?.[manifest.entry?.server];
    if (typeof source!=='string' || !source.startsWith(FORGE_MATCH_MARKER)) continue;
    if (!manifest.permissions?.includes('trusted.server') || typeof importModule!=='function') throw new Error('Forge wrapper requires trusted server permission');
    const mod=await importModule(source,plugin.id);
    if (typeof mod.registerServer!=='function' || !mod.__spForge || typeof mod.__spForge.packId!=='string'
      || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(mod.__spForge.packId) || !Array.isArray(mod.__spForge.matchKinds) || mod.__spForge.matchKinds.length>4) throw new Error('invalid Forge match adapter');
    modules.push({mod,plugin});
  }
  modules.sort((a,b)=>a.mod.__spForge.packId<b.mod.__spForge.packId?-1:a.mod.__spForge.packId>b.mod.__spForge.packId?1:0);
  if (!modules.length) return current;
  const packs=Object.freeze(modules.map(({mod,plugin})=>Object.freeze({id:mod.__spForge.packId,version:plugin.version,matchKinds:Object.freeze(mod.__spForge.matchKinds.map(k=>Object.freeze({...k,...(k.seats?{seats:Object.freeze({...k.seats})}:{})})))})));
  const mods=Object.freeze({digest,packs});
  const Inner=current;
  current=class ForgeContext extends Inner {
    constructor(opts) {super(opts);this.mods=mods;}
  };
  for (const {mod,plugin} of modules) {
    const kinds=Object.freeze(mod.__spForge.matchKinds.map(k=>Object.freeze({...k,...(k.seats?{seats:Object.freeze({...k.seats})}:{})})));
    const wrappers=[];
    const deny=name=>{throw Object.assign(new Error(`Forge server module did not declare ${name}`),{code:'MODULE_USE_UNDECLARED'});};
    const io=Object.freeze({get dir(){return deny('write');},write:()=>deny('write'),append:()=>deny('write'),read:()=>deny('write'),
      exists:()=>deny('write'),remove:()=>deny('write'),list:()=>deny('write')});
    const host=Object.freeze({pack:mod.__spForge.packId,module:mod.__spForge.moduleId || '',hash:plugin.hash || '',dir:'',io,
      log:Object.freeze({info:log.info || (()=>{}),warn:log.warn || (()=>{}),error:log.error || (()=>{})}),
      onBoot:()=>deny('boot'),onShutdown:()=>deny('shutdown'),healthz:()=>deny('healthz'),metrics:()=>deny('metrics'),route:()=>deny('route'),lane:()=>deny('lane'),
      matchKinds:()=>kinds,matchClass:fn=>{if(typeof fn!=='function')throw new Error('matchClass needs a function');wrappers.push(fn);return true;}});
    await mod.registerServer(host);
    for (const wrap of wrappers) {
      const next=wrap(current);
      if (typeof next!=='function') throw new Error('Forge match wrapper must return a match class');
      current=next;
    }
  }
  const Wrapped=current;
  return class ForgeDispatch extends Wrapped {
    constructor(opts) {super({...opts,mods});}
  };
}
