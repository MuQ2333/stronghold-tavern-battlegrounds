import {decodePng,encodePng} from './crop-board-atlas.mjs';

/** Remove only continuous, nearly uniform white/black/transparent export mattes, not dark artwork. */
export function trimSpellMatte(blob) {
  const img=decodePng(blob),{w,h,rgba}=img;
  const matte=(points)=>{
    let min=255,max=0,opaque=0,blank=0;
    for(const p of points){const i=p*4;if(rgba[i+3]<3){blank++;continue;}
      opaque++;const rgb=[rgba[i],rgba[i+1],rgba[i+2]];min=Math.min(min,...rgb);max=Math.max(max,...rgb);
    }
    return blank===points.length || (opaque===points.length && max-min<=10 && (max<=18||min>=238));
  };
  const row=y=>Array.from({length:w},(_,x)=>y*w+x),col=x=>Array.from({length:h},(_,y)=>y*w+x);
  let top=0,bottom=h,left=0,right=w;
  while(top<h*.15&&matte(row(top)))top++;
  while(bottom>h*.85&&matte(row(bottom-1)))bottom--;
  while(left<w*.15&&matte(col(left)))left++;
  while(right>w*.85&&matte(col(right-1)))right--;
  if(!top&&!left&&bottom===h&&right===w)return {blob,rect:[0,0,w,h]};
  return {blob:cropSpellImage(img,[left,top,right-left,bottom-top]),rect:[left,top,right-left,bottom-top]};
}

export function cropSpellImage(img,[x,y,w,h]) {
  if(x<0||y<0||w<=0||h<=0||x+w>img.w||y+h>img.h)throw Error('Spell crop outside source');
  const pixels=Buffer.alloc(w*h*4);
  for(let row=0;row<h;row++)img.rgba.copy(pixels,row*w*4,((y+row)*img.w+x)*4,((y+row)*img.w+x+w)*4);
  return encodePng(w,h,pixels);
}
