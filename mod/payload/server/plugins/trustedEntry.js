// Server-level trusted modules execute in a dedicated child, never in the HTTP/lobby process.
import { importScript } from '../../shared/plugins/scriptLoad.js';
import { healthJson, trustedRouteAllowed } from './trustedApi.js';
const send = m => { if (process.connected) process.send(m); };
const routes = new Map(), listeners = new Map(), lifecycle = {boot:[],shutdown:[]}, forgeHealth=[];
const freeze = v => { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; };
process.on('disconnect',() => process.exit(0));
process.on('message', async m => {
  try {
    if (m.type === 'init') {
      for (const p of m.plugins) {
        const manifest = JSON.parse(p.manifestSource);
        const api = freeze({
          plugin:{id:p.id,hash:p.hash},
          http:{route(route,fn) {
            if (!manifest.permissions.includes('trusted.server') || !trustedRouteAllowed(p.id,route) || typeof fn !== 'function' || routes.has(route)) throw new Error('route must be unique and inside /x/'+p.id+'/');
            routes.set(route,fn); send({type:'route',pluginId:p.id,route});
          }},
          lobby:{on(event,fn) {
            if (!['roomCreated','playerJoined','playerLeft','matchStarted','roomClosed'].includes(event) || typeof fn !== 'function') throw new Error('unknown lobby event');
            const list = listeners.get(event) || []; list.push(fn); listeners.set(event,list);
          }},
          health:{extend(value) { send({type:'health',id:p.id,value:healthJson(value)}); }},
          lifecycle:{onBoot(fn) {if(typeof fn!=='function')throw new Error('boot callback required');lifecycle.boot.push(fn);},
            onShutdown(fn) {if(typeof fn!=='function')throw new Error('shutdown callback required');lifecycle.shutdown.push(fn);},
            healthz(pack,fn) {if(typeof pack!=='string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(pack) || typeof fn!=='function')throw new Error('invalid Forge health callback');forgeHealth.push({pack,fn});send({type:'forge-health-available'});}},
          log:{info(...args){send({type:'log',level:'info',message:args.map(String).join(' ').slice(0,2000)});},
            warn(...args){send({type:'log',level:'warn',message:args.map(String).join(' ').slice(0,2000)});},
            error(...args){send({type:'log',level:'error',message:args.map(String).join(' ').slice(0,2000)});}},
        });
        const mod = await importScript(p.sources[manifest.entry.server],{checked:false,nonce:p.id+'-'+p.hash});
        const activate = mod.activate || mod.default;
        if (typeof activate !== 'function') throw new Error(p.id+': activate(api) required');
        await activate(api);
      }
      send({type:'ready'});
    } else if (m.type === 'forge-health') {
      const out=Object.create(null);
      for (const entry of forgeHealth) {
        try {
          const v=await entry.fn();
          if (v==null) continue;
          if (!v || typeof v!=='object' || Array.isArray(v) || Object.keys(v).length>12 || Buffer.byteLength(JSON.stringify(v),'utf8')>2048
            || Object.values(v).some(x=>x!==null && !['string','boolean','number'].includes(typeof x) || typeof x==='number' && !Number.isFinite(x))) throw new Error('invalid Forge health fields');
          out[entry.pack]={...(out[entry.pack] || {}),...v};
        } catch(e) {send({type:'log',level:'warn',message:String(e?.message || e).slice(0,2000)});}
      }
      send({type:'reply',id:m.id,value:out});
    } else if (m.type === 'lifecycle') {
      if (!Object.hasOwn(lifecycle,m.event)) throw new Error('unknown lifecycle event');
      for (const fn of lifecycle[m.event]) {
        try { await (m.event==='boot' ? fn(freeze(m.value)) : fn()); }
        catch(e) { send({type:'log',level:'error',message:String(e?.message || e).slice(0,2000)}); }
      }
      send({type:'reply',id:m.id,value:true});
    } else if (m.type === 'http') {
      const value = await routes.get(m.request.path)?.(freeze(m.request));
      send({type:'reply',id:m.id,value:value ?? null});
    } else if (m.type === 'event') {
      for (const fn of listeners.get(m.event) || []) { try { fn(freeze(m.value)); } catch (e) { send({type:'error',message:String(e.message)}); } }
    }
  } catch (e) { send({type:'error',id:m.id,message:String(e.message)}); }
});
