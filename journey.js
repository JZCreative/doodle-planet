import {STORIES} from './character-stories.js?v=3';
import {AVATAR_STICKERS,renderAvatar,avatarControls} from './avatar.js?v=2';

export function createJourney({models,progress,current,capture,enter,portrait}){
  const dialog=document.querySelector('#journeyDialog'),status=document.querySelector('#journeyStatus');
  const wish=document.querySelector('#wishText');
  let busy=false,whisperTimer;
  document.querySelector('.tool-panel .panel-heading').after(document.querySelector('.wish-card'));
  // Keep the action shelf outside the tools' independent scroll area.
  const panel=document.querySelector('.tool-panel'),shelf=document.querySelector('.design-progress');
  shelf.append(document.querySelector('#postcardBtn'));
  const scroll=document.createElement('div');scroll.className='tool-scroll';
  for(const child of [...panel.children])if(child!==shelf)scroll.append(child);
  panel.replaceChildren(scroll,shelf);
  const story=id=>STORIES[id]||['今天想试试什么颜色？','谢谢你的颜色。',[]];
  function showWish(id){wish.textContent=`${models[id].name}说：“${story(id)[0]}”`;}
  document.querySelector('#journeyClose').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function candidates(){const locked=progress.locked(),last=progress.completed().at(-1);return [...new Set([...(story(last)[2]||[]),...locked])].filter(id=>locked.includes(id)).slice(0,3);}
  function neighbors(){
    const list=document.querySelector('#neighborList');list.replaceChildren();
    document.querySelector('#neighborHint').textContent=progress.credits()?`你有 ${progress.credits()} 次邀请机会。选一位想认识的朋友，其他朋友以后还会出现。`:progress.locked().length?'完成一位朋友的作品，就能从三个新邻居中任选一位。邀请机会可以留到下次。':'所有朋友都已来到宇宙，继续给他们设计新配色吧。';
    for(const id of candidates()){
      const card=document.createElement('article');card.className='neighbor-card';const name=document.createElement('strong');name.textContent=`${models[id].name} · ${models[id].english}`;
      const preview=document.createElement('div');preview.className='neighbor-preview';preview.textContent='角色正在赶来…';
      portrait(id).then(src=>{if(!preview.isConnected)return;const img=document.createElement('img');img.src=src;img.alt=models[id].name+'的3D角色预览';preview.replaceChildren(img);}).catch(()=>{preview.textContent='角色暂未加载，请关闭手册后重试';});
      const quote=document.createElement('blockquote');quote.textContent=`“${story(id)[0]}”`;
      const button=document.createElement('button');button.textContent='邀请这位朋友 ↗';button.disabled=!progress.credits();
      button.onclick=async()=>{
        list.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{if(await progress.invite(id)){
          status.textContent=`欢迎 ${models[id].name}！新朋友已经加入你的宇宙。`;
          document.querySelector('#neighborHint').textContent=progress.credits()?`还可以邀请 ${progress.credits()} 位朋友。也可以先给新朋友涂色。`:'本次邀请已完成。完成新的作品后，可以继续认识其他朋友。';
          card.classList.add('just-invited');const sparks=document.createElement('div');sparks.className='invite-sparks';sparks.setAttribute('aria-hidden','true');sparks.textContent='✦　✳　✧';preview.append(sparks);
          button.textContent='开始给它涂色 ↗';button.disabled=false;button.onclick=async()=>{dialog.close();await enter(id,false);};
          const again=document.createElement('button');again.textContent='看看其他朋友';again.onclick=neighbors;card.append(again);button.focus();
        }else {status.textContent='目前没有可用的邀请机会。';neighbors();}}
        catch{status.textContent='邀请保存失败，机会仍然保留，请重试';list.querySelectorAll('button').forEach(b=>b.disabled=!progress.credits());}
      };
      card.append(preview,name,quote,button);list.append(card);
    }
  }
  async function album(){
    const list=document.querySelector('#postcardList');list.replaceChildren();
    try{
      const cards=await progress.cards();if(!cards.length)list.textContent='在填色页点击「生成头像」，把喜欢的角度留下来。';
      for(const card of cards){
        const item=document.createElement('article');item.className='postcard-item';const img=document.createElement('img');img.alt=`${models[card.model].name}的正方形头像`;img.src=await renderAvatar(card);
        const stickers=document.createElement('div');stickers.className='avatar-stickers';stickers.setAttribute('role','group');stickers.setAttribute('aria-label','选择头像贴纸');
        for(const [id,label] of AVATAR_STICKERS){const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-pressed',String((card.sticker||'wow')===id));button.onclick=async()=>{stickers.querySelectorAll('button').forEach(b=>b.disabled=true);try{const next={...card,sticker:id};const src=await renderAvatar(next);await progress.saveCard(next);Object.assign(card,next);img.src=src;stickers.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));status.textContent='贴纸已保存';}catch{status.textContent='贴纸未能保存，请重试';}finally{stickers.querySelectorAll('button').forEach(b=>b.disabled=false);}};stickers.append(button);}
        const download=document.createElement('button');download.textContent='下载头像 ↓';download.onclick=()=>{const a=document.createElement('a');a.href=img.src;a.download=`Doodle-Planet-avatar-${card.model}-${card.date}.png`;a.click();};
        const revisit=document.createElement('button');revisit.textContent='再画一版';revisit.onclick=async()=>{dialog.close();await enter(card.model,false);};
        item.append(img,stickers,avatarControls(card,img,c=>progress.saveCard(c),status),download,revisit);list.append(item);
      }
    }catch{list.textContent='手册读取失败，请检查浏览器存储空间。';}
  }
  async function open(){status.textContent='';neighbors();if(!dialog.open)dialog.showModal();await album();}
  async function makeCard(id,automatic=false){
    if(busy)return;busy=true;document.querySelector('#postcardBtn').disabled=true;
    try{if(current()?.userData.id!==id)throw new Error('视角已切换');const image=await capture();if(current()?.userData.id!==id)throw new Error('视角已切换');await progress.saveCard({key:`card:${crypto.randomUUID()}`,model:id,date:Date.now(),sticker:'wow',image});await open();status.textContent=automatic?'作品完成，头像已收藏。':'选一枚贴纸，带走你的头像。';document.querySelector('#postcardList').scrollIntoView({block:'start',behavior:'smooth'});}
    catch{await open();status.textContent='头像未能保存，请回到填色页重试。作品进度不受影响。';}finally{busy=false;document.querySelector('#postcardBtn').disabled=false;}
  }
  document.querySelector('#journeyBtn').onclick=open;
  document.querySelector('#postcardBtn').onclick=()=>{const g=current();if(g)makeCard(g.userData.id);};
  function whisper(text){const el=document.querySelector('#skyWhisper');el.textContent=text;clearTimeout(whisperTimer);whisperTimer=setTimeout(()=>el.textContent='',6000);}
  let moonAsleep=false;
  document.querySelector('#sleepyMoon').onclick=e=>{moonAsleep=!moonAsleep;e.currentTarget.textContent=moonAsleep?'◡':'☾';e.currentTarget.setAttribute('aria-pressed',String(moonAsleep));whisper(moonAsleep?'嘘，月亮把今天折起来，睡着了。':'月亮睁开眼：你又带来了什么新颜色？');};
  function rain(x=48,y=document.querySelector('#universeSpace').clientHeight-125){whisper('云朵收到了你的招呼，送来一小阵彩色雨。');const rain=document.querySelector('#colorRain');rain.replaceChildren();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<18;i++){const drop=document.createElement('i');drop.style.left=`${x-27+i*3}px`;drop.style.top=`${y+i%3*8}px`;drop.style.background=['#da9b97','#d4bd77','#98b4ae','#9baac3'][i%4];drop.style.animationDelay=`${i*.05}s`;rain.append(drop);}setTimeout(()=>rain.replaceChildren(),3000);}
  document.querySelector('#rainCloud').onclick=()=>rain();
  document.querySelector('#hiddenTrail').onclick=()=>{open();whisper('沿着虚线走走，看看下一位想遇见谁。');};
  let greeting=0;
  setInterval(()=>{const done=progress.completed();if(done.length<2||dialog.open||!document.body.classList.contains('home-mode')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const a=done[greeting%done.length],b=done[(greeting+1)%done.length];greeting++;whisper(`${models[a].name}向${models[b].name}打了个招呼：“今天的颜色真不错。”`);},45000);
  return {showWish,rain,complete:id=>makeCard(id,true)};
}
