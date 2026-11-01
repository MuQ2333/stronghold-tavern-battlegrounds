/** Growth trial: ~20% fewer scheduled enemies in R2–R5. Keep every action and its original time window. */
export function growthEarlyWaves(wave,round,enabled) {
  if(!enabled || round<2 || round>5)return wave;
  const slots=wave.spawns.map((s,i)=>({s,i,n:Math.max(1,Math.floor(s.count||1))})).filter(x=>!['boss','part','bounty'].includes(x.s.tag));
  const total=slots.reduce((n,x)=>n+x.n,0),target=Math.max(slots.length,Math.round(total*0.8));
  const counts=new Map(slots.map(x=>[x.i,Math.max(1,Math.floor(x.n*0.8))]));
  let sum=[...counts.values()].reduce((a,b)=>a+b,0);
  while(sum<target){const x=slots.filter(x=>counts.get(x.i)<x.n).sort((a,b)=>(b.n*0.8-counts.get(b.i))-(a.n*0.8-counts.get(a.i))||a.i-b.i)[0];if(!x)break;counts.set(x.i,counts.get(x.i)+1);sum++;}
  while(sum>target){const x=slots.filter(x=>counts.get(x.i)>1).sort((a,b)=>(counts.get(b.i)-b.n*0.8)-(counts.get(a.i)-a.n*0.8)||a.i-b.i)[0];if(!x)break;counts.set(x.i,counts.get(x.i)-1);sum--;}
  const byAction=new Map();
  const spawns=wave.spawns.map((s,i)=>{
    if(!counts.has(i))return s;
    const count=counts.get(i),old=Math.max(1,Math.floor(s.count||1));
    byAction.set(s.actionIndex,count);
    return {...s,count,interval:(s.interval||0)*old/count};
  });
  return {...wave,spawns,actions:wave.actions.map(a=>byAction.has(a.index)?{...a,count:byAction.get(a.index)}:a)};
}
