import { UNLOCK_ALL_FOR_REVIEW } from './preview-config.js';
// IndexedDB keeps surface colors and analytic ink stamps, not screenshots.
export async function createProgress({models,groups,current,enter,enterGroup,refresh,onComplete=()=>{}}) {
  const ids=Object.keys(models);let db=null,completed=[],opened=ids.slice(0,5),completing=false,choosing=false,queue=Promise.resolve();
  let resetting=false,designEpoch=0;
  const status=document.querySelector('#saveStatus');
  const report=text=>status.textContent=text;
  try {db=await new Promise((resolve,reject)=>{const r=indexedDB.open('doodle-planet-designs',1);r.onupgradeneeded=()=>r.result.createObjectStore('records',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}catch{report('本机存储不可用，暂不能保存');}
  function tx(mode,run){return new Promise((resolve,reject)=>{if(!db)return reject(new Error('存储不可用'));const t=db.transaction('records',mode),s=t.objectStore('records');let value;const r=run(s);r.onsuccess=()=>value=r.result;t.oncomplete=()=>resolve(value);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
  const get=key=>tx('readonly',s=>s.get(key));
  const put=value=>tx('readwrite',s=>s.put(value));
  if(db){try{const p=await get('profile');completed=[...new Set((p?.completed||[]).filter(id=>ids.includes(id)))];opened=[...new Set([...ids.slice(0,5),...(p?.opened||ids.slice(0,5+completed.length)).filter(id=>ids.includes(id))])];}catch{report('进度读取失败，请刷新后重试');}}
  const unlocked=id=>UNLOCK_ALL_FOR_REVIEW?ids.includes(id):opened.includes(id);
  const credits=()=>UNLOCK_ALL_FOR_REVIEW?0:Math.max(0,Math.min(ids.length,5+completed.length)-opened.length);
  function snapshot(g){
    const d=g.userData,colors=d.mesh.geometry.attributes.color.array,regionColors={};
    for(let f=0;f<d.regions.length;f++){const r=d.regions[f];if(regionColors[r]===undefined)regionColors[r]=Array.from(colors.subarray(f*9,f*9+3));}
    return {model:d.id,asset:models[d.id].asset,regionCount:d.regionInfo.regions.length,regionColors,pixels:d.ink.pixels.slice(),count:d.ink.count.value,serial:d.ink.strokeSerial||0,strokes:d.strokes||0};
  }
  function restore(g,s){
    const d=g.userData;if(s.asset!==models[d.id].asset||s.regionCount!==d.regionInfo.regions.length)throw new Error('模型版本已变更，保留旧记录但不能直接套用');
    const a=d.mesh.geometry.attributes.color.array;
    for(let f=0;f<d.regions.length;f++){const c=s.regionColors[d.regions[f]]||[1,1,1];for(let v=0;v<3;v++)a.set(c,f*9+v*3);}
    d.mesh.geometry.attributes.color.needsUpdate=true;d.ink.pixels.set(s.pixels);d.ink.texture.needsUpdate=true;d.ink.count.value=s.count;d.ink.strokeSerial=s.serial;d.strokes=s.strokes||0;d.history=[];
    // Persisted splashes should resume dry, independent of performance.now().
    for(let i=0;i<s.count;i++)d.ink.pixels[i*24+20]=-10000;
    document.querySelector('#undoBtn').disabled=true;
  }
  function update(){
    document.querySelector('#progressSummary').textContent=`已认识 ${UNLOCK_ALL_FOR_REVIEW?ids.length:opened.length} / ${ids.length} · 已完成 ${completed.length}${credits()?` · 可邀请 ${credits()} 位新朋友`:''}`;
    for(const id of ids){const locked=!unlocked(id);for(const el of document.querySelectorAll(`[data-model="${id}"],[data-resident="${id}"]`)){el.classList.toggle('is-locked',locked);el.setAttribute('aria-disabled',String(locked));el.title=locked?'完成作品，在旅行手册中选择新朋友':models[id].name;}}
    const g=current();const b=document.querySelector('#finishDesign');if(!g)return;
    const s=snapshot(g),painted=Object.values(s.regionColors).filter(c=>c.some(x=>x<.98)).length;
    const done=completed.includes(s.model);b.disabled=done||!(painted>=Math.min(3,s.regionCount)||s.strokes>=3);
    b.textContent=done?'✓ 已完成作品':'完成作品 · 发现新朋友';
    document.querySelector('#designGoal').textContent=done?'已获得解锁奖励，可继续修改和存档':`涂色 ${Math.min(painted,3)}/3 区，或涂鸦 ${Math.min(s.strokes,3)}/3 笔`;
    refresh();
  }
  function persist(g,manual=false){
    if(resetting)return queue;
    const data=snapshot(g),now=Date.now();const record={key:manual?`save:${crypto.randomUUID()}`:`auto:${data.model}`,date:now,...data};
    report('正在保存…');queue=queue.catch(()=>{}).then(()=>put(record)).then(()=>report(manual?'已保存设计记录':'进度已自动保存')).catch(()=>report('保存失败：请检查浏览器存储空间'));return queue;
  }
  const api={unlocked,update,credits,completed:()=>[...completed],locked:()=>ids.filter(id=>!unlocked(id)),
    async saveGroups(list){for(const g of list)await persist(g,true);},
    async savePortrait(layout,list){await queue;await put({key:`group:${crypto.randomUUID()}`,date:Date.now(),layout,designs:list.map(snapshot)});report('宇宙合照已保存');},
    async invite(id){if(choosing||credits()<1||unlocked(id)||!ids.includes(id))return false;choosing=true;try{const next=[...opened,id];await put({key:'profile',completed,opened:next});opened=next;update();return true;}finally{choosing=false;}},
    async saveCard(card){await put(card);},async cards(){return (await tx('readonly',s=>s.getAll())).filter(r=>r.key.startsWith('card:')).sort((a,b)=>b.date-a.date);},
    async hydrate(g){const epoch=designEpoch;try{const s=await get(`auto:${g.userData.id}`);if(s&&epoch===designEpoch&&!resetting)restore(g,s);}catch(e){report(e.message);}},
    changed(g){update();persist(g);},
    blocked(id){document.querySelector('#universeStatus').textContent=`${models[id].name} 尚未解锁，请先完成已开放的作品`;document.querySelector('#inkStatus').textContent='此角色尚未解锁，请先完成一件作品';}
  };
  const resetDialog=document.querySelector('#resetUniverseDialog');
  const resetConfirm=document.querySelector('#resetUniverseConfirm');
  const resetMessage=document.querySelector('#resetUniverseMessage');
  document.querySelector('#resetUniverseBtn').onclick=()=>{resetMessage.textContent='';resetDialog.showModal();document.querySelector('#resetUniverseCancel').focus();};
  document.querySelector('#resetUniverseCancel').onclick=()=>resetDialog.close();
  resetDialog.addEventListener('cancel',e=>{if(resetting)e.preventDefault();});
  resetConfirm.onclick=async()=>{
    if(resetting||completing||choosing)return;
    resetting=true;designEpoch++;resetConfirm.disabled=true;
    document.querySelector('#resetUniverseCancel').disabled=true;resetMessage.textContent='正在清空…';
    try{
      await queue;
      // One atomic transaction: never clear unrelated profile or postcard data.
      await new Promise((resolve,reject)=>{
        if(!db){reject(new Error('存储不可用'));return;}
        const t=db.transaction('records','readwrite'),s=t.objectStore('records');
        const r=s.openCursor();r.onsuccess=()=>{const cursor=r.result;if(!cursor)return;const key=String(cursor.key);if(key.startsWith('auto:')||key.startsWith('save:')||key.startsWith('group:'))cursor.delete();cursor.continue();};
        t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);
      });
      for(const g of groups.values()){
        const d=g.userData;d.mesh.geometry.attributes.color.array.fill(1);d.mesh.geometry.attributes.color.needsUpdate=true;
        d.ink.pixels.fill(0);d.ink.texture.needsUpdate=true;d.ink.count.value=0;d.ink.strokeSerial=0;d.strokes=0;d.history=[];
      }
      document.querySelector('#undoBtn').disabled=true;update();
      resetMessage.textContent='所有角色已恢复空白。已解锁角色、完成进度和头像均保留。';
      resetConfirm.hidden=true;document.querySelector('#resetUniverseCancel').textContent='完成';
    }catch{resetMessage.textContent='清空失败，未更改画面。请检查本机存储后重试。';}
    finally{resetting=false;resetConfirm.disabled=false;document.querySelector('#resetUniverseCancel').disabled=false;}
  };
  resetDialog.addEventListener('close',()=>{resetConfirm.hidden=false;document.querySelector('#resetUniverseCancel').textContent='取消';});
  document.querySelector('#saveDesign').onclick=()=>{const g=current();if(g)persist(g,true);};
  document.querySelector('#finishDesign').onclick=async()=>{
    const g=current();if(!g||completing||document.querySelector('#finishDesign').disabled)return;
    const id=g.userData.id;if(completed.includes(id))return;
    completing=true;
    let saved=false;
    try {await queue;await put({...snapshot(g),key:`auto:${id}`,date:Date.now()});const next=[...completed,id];await put({key:'profile',completed:next,opened});completed=next;update();report('作品已完成！去旅行手册选择新朋友');saved=true;}catch{report('保存失败，未扣除或发放进度，请重试');}finally{completing=false;}
    if(saved)await onComplete(id);
  };
  const dialog=document.querySelector('#recordsDialog');
  document.querySelector('#recordsClose').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.querySelector('#recordsBtn').onclick=async()=>{
    const list=document.querySelector('#recordsList');list.replaceChildren();dialog.showModal();
    try {await queue;const records=(await tx('readonly',s=>s.getAll())).filter(r=>r.key.startsWith('auto:')||r.key.startsWith('save:')||r.key.startsWith('group:')).sort((a,b)=>b.date-a.date);
      if(!records.length)list.textContent='还没有记录，开始涂鸦后会自动保存。';
      for(const r of records){
        const row=document.createElement('div');row.className='record-row';const text=document.createElement('span');
        const group=r.key.startsWith('group:');
        text.textContent=`${group?'宇宙合照 · '+r.designs.length+' 位朋友':(models[r.model]?.name||r.model)+' · '+(r.key.startsWith('auto:')?'自动续画':'设计存档')} · ${new Date(r.date).toLocaleString('zh-CN')}`;
        const b=document.createElement('button');b.textContent='继续涂鸦';b.disabled=group?r.designs.some(s=>!unlocked(s.model)):!unlocked(r.model);
        b.onclick=async()=>{try {
          if(group){
            for(const s of r.designs){const g=groups.get(s.model);if(!g||s.asset!==models[s.model].asset||s.regionCount!==g.userData.regionInfo.regions.length)throw new Error('部分角色版本已变更，原记录仍保留');}
            await enterGroup(r.layout);
            for(const s of r.designs){restore(groups.get(s.model),s);api.changed(groups.get(s.model));}
          }else{await enter(r.model,false);restore(groups.get(r.model),r);api.changed(groups.get(r.model));}
          dialog.close();
        }catch(e){report(e.message);text.textContent+=' · '+e.message;}};row.append(text,b);list.append(row);
      }
    }catch{list.textContent='无法读取存档，请检查浏览器是否允许本机存储。';}
  };
  update();return api;
}
