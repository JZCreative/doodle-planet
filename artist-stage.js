import * as THREE from 'three';

// The four original drawings remain upright XY cutouts, never billboards.
// White paper writes depth; only transparent pixels let the cast show through.
export const STAGE_PANELS = [
  {file:'4.png',width:36,aspect:2274/865,position:[0,-.1,-8]},
  {file:'3.png',width:33,aspect:2193/875,position:[-.7,-2.2,-3.5]},
  {file:'2.png',width:33,aspect:2012/788,position:[.3,-5.1,1]},
  {file:'1.png',width:35,aspect:3508/858,position:[0,-8.2,5.5]},
];

// Position is a foot point, so differently proportioned native meshes stand
// on the same illustrated hillside when the cast is changed.
export const STAGE_SLOTS = [
  {id:'broccoli',x:-13,y:1.8,z:-5.8,height:5.6,width:3.6},
  {id:'cryingsun',x:0,y:4.5,z:-10,height:3.5,width:3.5},
  {id:'cake',x:10.2,y:-.7,z:-.9,height:6.1,width:4.4},
  {id:'sun',x:-8.6,y:-3.4,z:3,height:6.8,width:5.7},
  {id:'bird',x:-3.6,y:-2.2,z:3,height:7.5,width:3.8},
  {id:'apple',x:5.3,y:-1.2,z:-1.1,height:6.7,width:4.8},
  {id:'chair',x:12,y:-4,z:3,height:5.5,width:3.8},
  {id:'cat',x:1,y:-4.5,z:3,height:6.8,width:5.4},
  {id:'house',x:7.5,y:-6.2,z:3,height:5.6,width:4},
  {id:'alien',x:-14.1,y:-5.6,z:3,height:4.5,width:3},
  {id:'bunny',x:-10,y:-10.8,z:7.4,height:7.1,width:4.4},
  {id:'wolf',x:-3.1,y:-10,z:7.6,height:5.2,width:6.9},
  {id:'fingerbird',x:5.2,y:-10.1,z:7.4,height:4.8,width:6.1},
];

export function arrangeStage(entries,models,shuffle=false,random=Math.random,slots=STAGE_SLOTS){
  const available=new Map(entries),ids=[...available.keys()];
  if(shuffle)for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const used=new Set(),layout=[];
  for(const slot of slots){
    const id=!shuffle&&available.has(slot.id)&&!used.has(slot.id)?slot.id:ids.find(key=>!used.has(key));
    if(!id)break;
    used.add(id);const g=available.get(id);
    g.position.set(0,0,0);g.scale.setScalar(1);g.rotation.set(...models[id].rotation);g.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(g.userData.mesh),size=box.getSize(new THREE.Vector3());
    const scale=Math.min(slot.height/Math.max(.01,size.y),slot.width/Math.max(.01,size.x));
    g.scale.setScalar(scale);
    g.position.set(slot.x-(box.min.x+box.max.x)*scale/2,slot.y-box.min.y*scale,slot.z);
    g.visible=true;g.updateMatrixWorld(true);
    layout.push({id,position:g.position.toArray(),scale,quaternion:g.quaternion.toArray(),foot:[slot.x,slot.y,slot.z],scene:'artist-stage'});
  }
  for(const [id,g]of entries)g.visible=used.has(id);
  return layout;
}

// Keep the current cast and its paint, but trade places between the safe depth
// lanes. Small bounded offsets avoid moving anyone into/behind the paper hills.
export function randomizeStagePositions(layout,entries,models,random=Math.random){
  const cast=new Set(layout.map(p=>p.id));
  const slots=STAGE_SLOTS.map(slot=>({...slot,x:slot.x+(random()-.5)*.5,y:slot.y+(random()-.5)*.16,z:slot.z+(random()-.5)*.2}));
  return arrangeStage(entries.filter(([id])=>cast.has(id)),models,true,random,slots);
}

function characterSeed(id){
  let seed=2166136261;
  for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  return (seed>>>0)/4294967296;
}

// Decorative motion is never written to saved layout poses. Each resident has
// its own clock, so hover/pause freezes the exact pose without teleporting.
export function createStageMotion(){
  let activeLayout=null,states=[];
  const turn=new THREE.Quaternion(),axis=new THREE.Vector3(0,0,1),offset=new THREE.Vector3();
  function setLayout(layout,groups){
    if(layout===activeLayout)return;
    activeLayout=layout;
    states=layout.flatMap(pose=>{
      const g=groups.get(pose.id);if(!g)return [];
      const seed=characterSeed(pose.id);
      return [{pose,g,time:0,seed,base:new THREE.Vector3(...pose.position),front:new THREE.Quaternion(...pose.quaternion),foot:new THREE.Vector3(...(pose.foot??pose.position))}];
    });
  }
  function update(dt,{enabled=true,held=null,reduced=false}={}){
    for(const state of states){
      const {pose,g,seed,base,front,foot}=state;
      if(!g.visible)continue;
      if(enabled&&!reduced&&held!==pose.id)state.time+=Math.min(.05,Math.max(0,dt));
      const t=reduced?0:state.time,delay=1.5+seed*9,period=8+seed*7;
      const phase=t>=delay?(t-delay)%period:period;
      const hop=phase<.95?Math.sin(Math.PI*phase/.95)**2*(.16+seed*.1):0;
      const roll=Math.sin(t*.65+seed*Math.PI*2)*.014*Math.min(1,t/1.5);
      turn.setFromAxisAngle(axis,roll);
      offset.copy(base).sub(foot).applyQuaternion(turn);
      g.position.copy(foot).add(offset);g.position.y+=hop;
      g.quaternion.copy(turn).multiply(front);g.scale.setScalar(pose.scale);
    }
  }
  return {setLayout,update};
}

export function snapshotStageLayout(layout,groups){
  return layout.map(pose=>{
    const g=groups.get(pose.id);
    return g?{...pose,position:g.position.toArray(),quaternion:g.quaternion.toArray(),scale:g.scale.x}:pose;
  });
}

export function stageView(aspect,fov=42){
  const tan=Math.tan(THREE.MathUtils.degToRad(fov/2));
  const distance=Math.max(11.4/tan,19/(tan*aspect))+5.5;
  return {position:new THREE.Vector3(0,-2.5,distance),target:new THREE.Vector3(0,-2.5,0)};
}

export function createArtistStage(partMaterial,renderer){
  const group=new THREE.Group();group.name='Artist paper theater';group.visible=false;
  const panels=[];let pending=null;
  async function load(){
    if(pending)return pending;
    pending=Promise.all(STAGE_PANELS.map(async spec=>{
      const map=await new THREE.TextureLoader().loadAsync(`./assets/scenes/artist-stage/${spec.file}`);
      map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,alphaTest:.5,depthWrite:true,toneMapped:false});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(spec.width,spec.width/spec.aspect),material);
      mesh.name=`Artist original ${spec.file}`;mesh.position.fromArray(spec.position);
      const canvas=document.createElement('canvas');canvas.width=map.image.width;canvas.height=map.image.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(map.image,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
      mesh.userData.alpha=pixels;
      mesh.onBeforeRender=(_r,_s,_c,_g,m)=>{
        if(m!==partMaterial)return;
        m.uniforms.cutout.value=true;m.uniforms.cutoutMap.value=map;m.uniforms.locked.value=0;m.uniformsNeedUpdate=true;
      };
      return mesh;
    })).then(meshes=>{panels.push(...meshes);group.add(...meshes);return group;}).catch(error=>{pending=null;throw error;});
    return pending;
  }
  function occludes(raycaster,distance){
    if(!group.visible)return false;
    for(const hit of raycaster.intersectObjects(panels,false)){
      if(hit.distance>=distance)break;
      const {data,width,height}=hit.object.userData.alpha;
      const x=Math.min(width-1,Math.max(0,Math.floor(hit.uv.x*width)));
      const y=Math.min(height-1,Math.max(0,Math.floor((1-hit.uv.y)*height)));
      if(data[(y*width+x)*4+3]>=128)return true;
    }
    return false;
  }
  return {group,load,occludes};
}
