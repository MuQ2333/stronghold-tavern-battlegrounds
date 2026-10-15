import {html} from './components.js';
import {useState} from '../../vendor/hooks.module.js';
import {t} from '../../../shared/i18n.js';
import {store} from '../store.js';
import {net} from '../net.js';
import {mount as mountChat} from '../../community/chat-bubble/client/chat.js';
import {mount as mountDamage} from '../../community/dmg-board/client/board.js';
const key=id=>'sp.community.'+id;
export function communityEnabled(id){try{return localStorage.getItem(key(id))!=='false';}catch{return true;}}
export function setCommunityEnabled(id,value){try{localStorage.setItem(key(id),String(value));}catch{/* private mode */}window.dispatchEvent(new Event('sp:community'));}
export function CommunityPreferences(){
 const [values,setValues]=useState(()=>({chat:communityEnabled('chat'),damage:communityEnabled('damage')}));
 return html`<span class="community-prefs">${[['chat',t('局内聊天（仅自己）')],['damage',t('伤害看板（仅自己）')]].map(([id,label])=>html`<label class="tavern-mod"><input type="checkbox" checked=${values[id]} onChange=${e=>{setCommunityEnabled(id,e.target.checked);setValues({...values,[id]:e.target.checked});}}/>${label}</label>`)}</span>`;
}
let started=false;
export function startCommunityAddons(){
 if(started)return;started=true;
 for(const href of ['/community/chat-bubble/client/chat.css','/community/dmg-board/client/board.css','/css/community-addons.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);}
 const mounted=new Map();
 function sync(){
  const state=store.get(),room=state.room;
  for(const [id,selector,mount] of [['chat','.gm',mountChat],['damage','.screen.result',mountDamage]]){
   const parent=document.querySelector(selector),allowed=communityEnabled(id)&&parent&&(id!=='chat'||room)&&!document.querySelector('.st');
   const old=mounted.get(id),identity=id==='chat'?room?.code:state.match?.result;
   if(old&&(!allowed||old.parent!==parent||old.identity!==identity)){old.handle.unmount();old.host.remove();mounted.delete(id);}
   if(!allowed||mounted.has(id))continue;
   const host=document.createElement('div');host.className='community-host community-host--'+id;parent.appendChild(host);
   const ctx={host,me:state.me,t,net:{
    send:(_channel,data)=>net.request('community.chat',{text:data.text},{queue:false}),
    on:(channel,fn)=>{
     if(channel==='m.result'){if(state.match?.result)queueMicrotask(()=>{if(host.isConnected)fn(state.match.result);});return net.on(channel,fn);}
     return net.on('community.chat',msg=>{if(msg.code===store.get().room?.code&&communityEnabled('chat'))fn(msg);});
    },
   }};
   mounted.set(id,{host,parent,identity,handle:mount(ctx)});
  }
 }
 window.addEventListener('sp:community',sync);
 store.subscribe(()=>requestAnimationFrame(sync));
 setInterval(sync,500);sync();
}
