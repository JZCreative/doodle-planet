export const AVATAR_STICKERS=[['none','无贴纸'],['wow','✦ WOW'],['hey','● HEY!'],['cool','◆ COOL'],['yay','▰ YAY!']];
export const AVATAR_EXPORT_SIZE=1080;

export async function renderAvatar(card){
  const image=new Image();image.src=card.image;await image.decode();
  // Find the artwork rather than retaining a wide viewport's empty margins.
  const scan=document.createElement('canvas');scan.width=image.width;scan.height=image.height;
  const s=scan.getContext('2d',{willReadFrequently:true});s.drawImage(image,0,0);
  const pixels=s.getImageData(0,0,scan.width,scan.height).data;
  let left=scan.width,top=scan.height,right=0,bottom=0;
  for(let y=0;y<scan.height;y+=2)for(let x=0;x<scan.width;x+=2){const i=(y*scan.width+x)*4;if(pixels[i+3]>32&&Math.min(pixels[i],pixels[i+1],pixels[i+2])<230){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  if(right<=left||bottom<=top){left=0;top=0;right=scan.width;bottom=scan.height;}
  const c=document.createElement('canvas');c.width=c.height=AVATAR_EXPORT_SIZE;const ctx=c.getContext('2d');
  // Keep the saved sticker coordinates in their original 1024-unit space.
  // Draw into a native 1080px canvas, including vector stickers and text.
  ctx.scale(AVATAR_EXPORT_SIZE/1024,AVATAR_EXPORT_SIZE/1024);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#fff';ctx.fillRect(0,0,1024,1024);
  const width=right-left+4,height=bottom-top+4,scale=Math.min(820/width,820/height);
  ctx.drawImage(image,Math.max(0,left-2),Math.max(0,top-2),width,height,(1024-width*scale)/2,(1024-height*scale)/2,width*scale,height*scale);
  const sticker=card.sticker||'wow';
  if(sticker!=='none'){
    ctx.save();ctx.translate(card.stickerX??805,card.stickerY??817);ctx.rotate((card.stickerAngle??-7.45)*Math.PI/180);ctx.scale(card.stickerScale??1,card.stickerScale??1);ctx.lineWidth=6;ctx.strokeStyle='#222';ctx.beginPath();
    if(sticker==='wow'){ctx.fillStyle='#ffe574';for(let i=0;i<24;i++){const a=i*Math.PI/12-Math.PI/2,r=i%2?115:154;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
    else if(sticker==='hey'){ctx.fillStyle='#bce8df';ctx.arc(0,0,141,0,Math.PI*2);}
    else if(sticker==='cool'){ctx.fillStyle='#d4c5ef';ctx.moveTo(0,-148);ctx.lineTo(160,0);ctx.lineTo(0,148);ctx.lineTo(-160,0);ctx.closePath();}
    else{ctx.fillStyle='#ffc4af';ctx.roundRect(-153,-88,306,176,28);}
    ctx.fill();ctx.stroke();ctx.fillStyle='#222';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 57px sans-serif';const text=card.stickerText??({wow:'WOW',hey:'HEY!',cool:'COOL',yay:'YAY!'})[sticker]??'WOW';const size=Math.min(57,57*235/Math.max(1,ctx.measureText(text).width));ctx.font=`900 ${size}px sans-serif`;ctx.fillText(text,0,4);ctx.restore();
  }
  return c.toDataURL('image/png');
}

export function avatarControls(card,img,save,status){
  const controls=document.createElement('div');controls.className='avatar-controls';
  let revision=0,timer,queue=Promise.resolve();
  function update(){const rev=++revision;renderAvatar(card).then(src=>{if(rev===revision)img.src=src;});clearTimeout(timer);timer=setTimeout(()=>{const snapshot={...card};queue=queue.catch(()=>{}).then(()=>save(snapshot)).then(()=>{status.textContent='头像编辑已保存';}).catch(()=>{status.textContent='保存失败，请再次调整以重试';});},180);}
  const hint=document.createElement('small');hint.textContent='拖动贴纸移动位置';controls.append(hint);
  for(const [key,title,min,max,step,initial] of [['stickerScale','缩放',.35,2.5,.05,1],['stickerAngle','旋转',-180,180,1,-7]]){
    const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=card[key]??initial;input.setAttribute('aria-label',`贴纸${title}`);input.oninput=()=>{card[key]=Number(input.value);update();};label.append(input);controls.append(label);
  }
  const label=document.createElement('label');label.textContent='文字';const text=document.createElement('input');text.type='text';text.maxLength=18;text.placeholder='自定义文字';text.value=card.stickerText??({wow:'WOW',hey:'HEY!',cool:'COOL',yay:'YAY!'})[card.sticker||'wow']??'';text.setAttribute('aria-label','贴纸文字');text.oninput=()=>{card.stickerText=text.value;update();};label.append(text);controls.append(label);
  img.draggable=false;img.style.touchAction='none';img.style.cursor='grab';let drag=null;
  img.onpointerdown=e=>{if(card.sticker==='none')return;const r=img.getBoundingClientRect(),x=(e.clientX-r.left)*1024/r.width,y=(e.clientY-r.top)*1024/r.height;if(Math.hypot(x-(card.stickerX??805),y-(card.stickerY??817))>180*(card.stickerScale??1))return;drag={x,y,left:card.stickerX??805,top:card.stickerY??817};img.setPointerCapture(e.pointerId);e.preventDefault();};
  img.onpointermove=e=>{if(!drag)return;const r=img.getBoundingClientRect();card.stickerX=Math.max(0,Math.min(1024,drag.left+(e.clientX-r.left)*1024/r.width-drag.x));card.stickerY=Math.max(0,Math.min(1024,drag.top+(e.clientY-r.top)*1024/r.height-drag.y));update();};
  img.onpointerup=img.onpointercancel=()=>{drag=null;};
  return controls;
}
