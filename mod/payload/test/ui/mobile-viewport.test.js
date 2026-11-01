import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleViewport,installViewportSupport} from '../../public/js/ui/viewport.js';
function events(){const all=new Map();return {addEventListener(k,f){if(!all.has(k))all.set(k,new Set());all.get(k).add(f);},removeEventListener(k,f){all.get(k)?.delete(f);},dispatchEvent(e){for(const f of all.get(e.type)||[])f(e);},count(k){return all.get(k)?.size||0;}};}
function fixture(){
 const css=new Map(),classes=new Set(),root={style:{setProperty:(k,v)=>css.set(k,v)},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const doc=Object.assign(events(),{documentElement:root,activeElement:null,scrollingElement:{scrollTop:0,scrollLeft:0}});
 const vv=Object.assign(events(),{width:844,height:390,offsetTop:0,offsetLeft:0});
 const win=Object.assign(events(),{document:doc,visualViewport:vv,innerWidth:844,innerHeight:390,scrollX:0,scrollY:0,Event:class{constructor(type){this.type=type;}},scrollTo(x,y){this.scrollX=x;this.scrollY=y;}});
 return {win,doc,vv,css,classes};
}
test('fullscreen system-bar pan does not become a permanent page offset',()=>{
 const f=fixture(),p=installViewportSupport(f.win);
 try {
  f.win.scrollY=31;f.doc.scrollingElement.scrollTop=31;f.doc.scrollingElement.scrollLeft=5;
  f.vv.offsetTop=31;f.vv.offsetLeft=5;f.vv.height=359;f.vv.dispatchEvent({type:'scroll'});
  assert.deepEqual([f.win.scrollY,f.doc.scrollingElement.scrollTop,f.doc.scrollingElement.scrollLeft],[0,0,0]);
  assert.equal(f.css.get('--sp-vy'),'0px');assert.equal(f.css.get('--sp-vh'),'3.59px');
  f.vv.offsetTop=0;f.vv.height=390;f.win.dispatchEvent({type:'focus'});
  assert.equal(f.css.get('--sp-vh'),'3.9px');assert.equal(f.css.get('--sp-vw'),'844px');
 } finally {p.destroy();}
 assert.equal(f.vv.count('scroll'),0);assert.equal(f.win.count('focus'),0);assert.equal(f.classes.has('sp-viewport-lock'),false);
});
test('keyboard editing follows the visible box without resetting the focused field',()=>{
 const f=fixture();f.doc.activeElement={tagName:'INPUT',type:'text'};f.vv.height=210;f.vv.offsetTop=90;f.doc.scrollingElement.scrollTop=90;
 const p=installViewportSupport(f.win);
 try{
  assert.equal(f.css.get('--sp-vy'),'90px');assert.equal(f.css.get('--sp-vh'),'2.1px');assert.equal(f.doc.scrollingElement.scrollTop,90);
  const internal={scrollTop:88};f.doc.activeElement=null;f.vv.height=390;f.vv.offsetTop=0;f.doc.dispatchEvent({type:'focusout'});
  assert.equal(f.css.get('--sp-vy'),'0px');assert.equal(f.doc.scrollingElement.scrollTop,0);assert.equal(internal.scrollTop,88);
 }finally{p.destroy();}
});
test('visual viewport falls back to window metrics; range controls never count as keyboard editing',()=>{
 const f=fixture();f.doc.activeElement={tagName:'INPUT',type:'range'};f.vv.offsetTop=29;
 assert.equal(visibleViewport(f.win).editing,false);assert.equal(visibleViewport(f.win).y,0);
 delete f.win.visualViewport;assert.deepEqual(visibleViewport(f.win),{width:844,height:390,x:0,y:0,editing:false});
});

function clock(win) {
 const pending=new Map();let id=0;
 win.setTimeout=(fn,delay)=>{pending.set(++id,{fn,delay});return id;};
 win.clearTimeout=n=>pending.delete(n);
 return {pending,run(delay){for(const [n,t] of [...pending])if(t.delay===delay){pending.delete(n);t.fn();}}};
}

test('resamples system-bar geometry after the browser stops sending viewport events',()=>{
 const f=fixture(),c=clock(f.win),p=installViewportSupport(f.win);
 try{
  f.vv.height=340;f.vv.dispatchEvent({type:'resize'});
  assert.equal(f.css.get('--sp-vh'),'3.4px');assert.equal(c.pending.size,3);
  // Native UI settles without another resize. Recovery must read fresh values.
  f.vv.height=390;f.win.scrollY=46;f.doc.scrollingElement.scrollTop=46;
  c.run(400);
  assert.equal(f.css.get('--sp-vh'),'3.9px');assert.equal(f.win.scrollY,0);
  assert.equal(f.doc.scrollingElement.scrollTop,0);
  for(let i=0;i<20;i++)f.doc.dispatchEvent({type:'pointercancel'});
  assert.equal(c.pending.size,3,'recovery bursts replace previous timers');
 }finally{p.destroy();}
 assert.equal(c.pending.size,0,'destroy disposes delayed callbacks');
 assert.equal(f.doc.count('touchend'),0);
});

test('delayed recovery keeps keyboard focus and internal scrolling intact',()=>{
 const f=fixture(),c=clock(f.win),p=installViewportSupport(f.win);
 try{
  f.doc.activeElement={tagName:'INPUT',type:'text'};
  f.doc.dispatchEvent({type:'focusin'});
  f.vv.height=190;f.vv.offsetTop=80;f.doc.scrollingElement.scrollTop=80;
  c.run(120);
  assert.equal(f.css.get('--sp-vh'),'1.9px');assert.equal(f.css.get('--sp-vy'),'80px');
  assert.equal(f.doc.scrollingElement.scrollTop,80);
  f.doc.activeElement=null;f.doc.dispatchEvent({type:'focusout'});
  f.vv.height=390;f.vv.offsetTop=0;c.run(900);
  assert.equal(f.css.get('--sp-vh'),'3.9px');assert.equal(f.css.get('--sp-vy'),'0px');
  assert.equal(f.doc.scrollingElement.scrollTop,0);
 }finally{p.destroy();}
});
