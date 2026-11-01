import {combineCombat} from './metrics.js';

const KEY='sp.growthCombatArchive.v1';
const copy=v=>JSON.parse(JSON.stringify(v));
const finite=n=>Number.isFinite(n)&&n>=0;
const validRecord=r=>r&&finite(r.seconds)&&Array.isArray(r.owners)&&r.owners.every(x=>typeof x==='string')&&Array.isArray(r.rows)&&r.rows.every(x=>
  x&&typeof x.ownerId==='string'&&typeof x.kind==='string'&&(x.defId==null||typeof x.defId==='string')&&(x.name==null||typeof x.name==='string')&&finite(x.damage)&&finite(x.healing)&&x.types&&['phys','arts','true','elemental'].every(t=>finite(x.types[t]??0)));
const validBattle=b=>b&&typeof b.battleKey==='string'&&validRecord(b.record);
const phaseOrder={normal:0,unite:1,boss:2,hidden:3};

/** Persist latest cumulative snapshot per battle, never sum repeated network packets. */
export function createMetricArchive(storage=null) {
  let sessions=[],current=null,currentPinned=false,dirty=false,lastSave=0,storageFailed=!storage,timer=null;
  try {const v=JSON.parse(storage?.getItem(KEY)||'[]');if(Array.isArray(v))sessions=v.filter(s=>typeof s?.key==='string'&&Array.isArray(s.battles)).map(s=>({...s,
    main:typeof s.main==='string'?s.main:'',note:typeof s.note==='string'?s.note:'',
    coreBonds:Array.isArray(s.coreBonds)?s.coreBonds.filter(b=>typeof b?.id==='string'&&typeof b.name==='string'):[],
    battles:s.battles.filter(validBattle)})).slice(-30);}catch{storageFailed=true;}
  function save(force=false) {
    if(!dirty || (!force && Date.now()-lastSave<5000))return;
    if(timer){clearTimeout(timer);timer=null;}
    if(!storage){storageFailed=true;return;}
    try {storage.setItem(KEY,JSON.stringify(sessions));dirty=false;lastSave=Date.now();storageFailed=false;}catch{storageFailed=true;}
  }
  function scheduleSave() {
    if(!timer){timer=setTimeout(()=>{timer=null;save(true);},5000);timer?.unref?.();}
  }
  function ingest(msg) {
    if(typeof msg?.matchKey!=='string'||!validBattle(msg))return;
    let session=sessions.find(s=>s.key===msg.matchKey);
    if(!session) {session={key:msg.matchKey,started:new Date().toISOString(),main:'',note:'',battles:[]};sessions.push(session);sessions=sessions.slice(-30);}
    if(!currentPinned||current===session.key)current=session.key;
    Object.assign(session,{modeId:msg.modeId,seed:msg.seed,cs:msg.cs,stageId:msg.stageId,heroMod:msg.heroMod,disabledBonds:msg.disabledBonds,coreBonds:msg.coreBonds,balanceVersion:msg.balanceVersion});
    session.hasTestActions=!!session.hasTestActions||!!msg.hasTestActions;
    const i=session.battles.findIndex(b=>b.battleKey===msg.battleKey);
    if(i>=0 && (session.battles[i].record.seconds>msg.record.seconds||(session.battles[i].done&&!msg.done)))return;
    const battle=copy(msg);delete battle.t;
    if(i<0)session.battles.push(battle);else session.battles[i]=battle;
    session.battles.sort((a,b)=>(a.round||0)-(b.round||0)||(phaseOrder[a.kind]??0)-(phaseOrder[b.kind]??0)||a.battleKey.localeCompare(b.battleKey));
    dirty=true;save(msg.done);if(dirty)scheduleSave();
  }
  return {
    ingest,save,
    sessions:()=>sessions.slice().reverse(),
    current:()=>current,
    setCurrent(key){current=typeof key==='string'?key:null;currentPinned=current!=null;},
    storageFailed:()=>storageFailed,
    annotate(key,patch){const s=sessions.find(s=>s.key===key);if(s){if(typeof patch.main==='string')s.main=patch.main;if(typeof patch.note==='string')s.note=patch.note.slice(0,2000);dirty=true;scheduleSave();}},
    combatMetrics({scope='battle',ownerId=null,sessionKey=current,battleKey=null}={}) {
      const s=sessions.find(s=>s.key===sessionKey);let battles=s?.battles||[];
      if(scope==='battle')battles=battleKey?battles.filter(b=>b.battleKey===battleKey):battles.slice(-1);
      return combineCombat(battles.map(b=>b.record),ownerId);
    },
    json:()=>{save(true);return JSON.stringify({schema:1,sessions},null,2);},
    csv(){
      save(true);
      const rows=[['match','main_alliance','mode','content','balance_version','seed','round','kind','complete','test_modified','shop_level','start_lp','buys_cumulative','sells_cumulative','refreshes_cumulative','merges_cumulative','start_permanent_layers','combat_layers_including_temporary','permanent_layer_gains','operator','damage','share_percent','DPS','phys','arts','true','elemental','healing','seconds','result','leaked','sim_errors','note']];
      for(const s of sessions)for(const b of s.battles){const r=combineCombat([b.record]);
        const list=r.rows.length?r.rows:[{name:'',defId:'',damage:0,dps:0,healing:0,types:{phys:0,arts:0,true:0,elemental:0}}];
        for(const u of list)rows.push([s.key,s.main,s.modeId,s.cs,s.balanceVersion,s.seed,b.round,b.kind,b.done,s.hasTestActions,b.context?.shopLevel,b.context?.lp,b.context?.stats?.buys,b.context?.stats?.sells,b.context?.stats?.refreshes,b.context?.stats?.merges,JSON.stringify(b.context?.layers),JSON.stringify(b.layers),JSON.stringify(b.result?.permanentLayerGains),u.name||u.defId,u.damage,r.damage?100*u.damage/r.damage:0,u.dps,u.types.phys,u.types.arts,u.types.true,u.types.elemental,u.healing,b.record.seconds,b.result?.reason,b.result?.leaked,b.result?.errors,s.note]);}
      const cell=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
      return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n');
    },
  };
}

let storage=null;try{storage=globalThis.localStorage;}catch{/* unavailable */}
export const metricArchive=createMetricArchive(storage);
export function installMetricArchive(net) {
  const off=net.on('m.combatMetrics',msg=>metricArchive.ingest(msg));
  const offPublic=net.on('m.public',msg=>{if(msg.growthMode&&msg.combatMetricsMatchKey)metricArchive.setCurrent(msg.combatMetricsMatchKey);});
  globalThis.addEventListener?.('pagehide',()=>metricArchive.save(true));
  return ()=>{off();offPublic();};
}

export function downloadMetrics(format='json') {
  metricArchive.save(true);
  const body=format==='csv'?metricArchive.csv():metricArchive.json();
  const url=URL.createObjectURL(new Blob([body],{type:format==='csv'?'text/csv;charset=utf-8':'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`growth-combat-${new Date().toISOString().slice(0,10)}.${format}`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
