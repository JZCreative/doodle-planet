import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { attachInk, stampInk } from './ink.js';
import { createFloatingResidents } from './floating-residents.js?v=3';
import { arrangePortrait,framePortrait } from './group-portrait.js?v=2';
import { createArtistStage,arrangeStage,stageView,randomizeStagePositions,createStageMotion,snapshotStageLayout } from './artist-stage.js?v=2';
import { createStarAtmosphere } from './star-atmosphere.js?v=3';
import { createMeteorEncounters } from './meteor-encounters.js?v=3';
import { createProgress } from './progress.js?v=6';
import { createJourney } from './journey.js?v=9';
import { createCharacterPortraits } from './character-portraits.js?v=2';
import { installArtistThumbnails } from './artist-thumbnails.js?v=20';
installArtistThumbnails().catch(error=>console.warn('原稿缩略图加载失败',error));

import { CHARACTER_NAMES } from './character-stories.js?v=3';
const MODELS = {
  bunny: { name: '长耳朵', asset: 'bunny-curve', file: './assets/models/bunny-curve.stl', rotation: [-Math.PI / 2, 0, -.28] },
  sun: { name: '慢太阳', asset: 'sun-floating-v9', file: './assets/models/sun-floating-v9.stl', rotation: [0, 0, 0] },
  cat: { name: '梦游猫', asset: 'cat-curve', file: './assets/models/cat-curve.stl', rotation: [-Math.PI / 2, 0, -.12] },
  bird: { name: '叠叠鸟', asset: 'stacked-bird-curve', file: './assets/models/stacked-bird-curve.stl', rotation: [0, -.45, 0] },
  broccoli: { name: '花椰树', asset: 'broccoli-curve', file: './assets/models/broccoli-curve.stl', rotation: [0, -.10, 0] },
  skull: { name: '笑脸骷髅', asset: 'skull-curve', file: './assets/models/skull-curve.stl', rotation: [0, 0, 0] },
  glove: { name: '微笑拳套', asset: 'glove-original', file: './assets/models/glove-original.stl', rotation: [0, 0, 0] },
  apple: { name: '苹果三重奏', asset: 'apple-curve', file: './assets/models/apple-curve.stl', rotation: [0, 0, 0] },
  whitecat: { name: '长身白猫', asset: 'whitecat-original', file: './assets/models/whitecat-original.stl', rotation: [0, 0, 0], editorScale: .82 },
  whitebird: { name: '长腿白鸟', asset: 'whitebird-original', file: './assets/models/whitebird-original.stl', rotation: [0, 0, 0] },
  chair: { name: '散步扶手椅', asset: 'chair-original', file: './assets/models/chair-original.stl', rotation: [0, -.35, 0] },
  house: { name: '漫游小屋', asset: 'house-original', file: './assets/models/house-original.stl', rotation: [0, -.30, 0] },
  wolf: { name: '怪狼', asset: 'wolf-original', file: './assets/models/wolf-original.stl', rotation: [0, 0, 0] },
  cryingsun: { name: '哭太阳', asset: 'cryingsun-original', file: './assets/models/cryingsun-original.stl', rotation: [0, -.10, 0] },
  cake: { name: '怪手蛋糕塔', asset: 'cake-original', file: './assets/models/cake-original.stl', rotation: [.20, -.25, 0] },
  fingerbird: { name: '手指鱼鸟', asset: 'fingerbird-blender', file: './assets/models/fingerbird-blender.stl', rotation: [0, -.08, 0] },
  coilsnake: { name: '盘盘牙蛇', asset: 'coilsnake-blender', file: './assets/models/coilsnake-blender.stl', rotation: [0, -.10, 0] },
  facestack: { name: '表情叠叠塔', asset: 'facestack-simple', file: './assets/models/facestack-simple.stl', rotation: [-Math.PI / 2, 0, .18] },
  alien: { name: '圈圈外星人', asset: 'alien-original', file: './assets/models/alien-original.stl', rotation: [0, 0, 0] }
};

for(const [id,[name,english]] of Object.entries(CHARACTER_NAMES)){
  const m=MODELS[id];m.description=m.name;m.name=name;m.english=english;
  const card=document.querySelector(`[data-model="${id}"]`);
  if(card){card.querySelector('b').textContent=name;card.querySelector('small').textContent=`${english} · ${m.description}`;}
}
let isHome=true, entering=false, homeMotion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let viewport = document.querySelector('#homeViewport');
const modelGroups=new Map();
const homeCamera=new THREE.PerspectiveCamera(58,1,.1,150);
homeCamera.position.set(0,1.2,11.8);
let homeTransition=null;
let returnView=null;
let studioTransition=null;
let portraitMode=null,portraitLayout=[],portraitUndo=[];
let homeScene='universe',stageLayout=[],stagePortrait=false,sceneChanging=false;
let stageMotionEnabled=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const stageActive=()=>isHome?homeScene==='artist-stage':!!portraitMode&&stagePortrait;
const brushResidents=new Set();
let brushUndoStart=0;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Outline the actual rendered silhouette rather than an enlarged copy of the
// model: offsets otherwise produce broken outlines and ghost facial details.
const paperTarget=new THREE.WebGLRenderTarget(1,1,{samples:4});
const partTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
partTarget.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
const partMaterial=new THREE.ShaderMaterial({
  uniforms:{locked:{value:0},cutout:{value:false},cutoutMap:{value:null}},
  vertexShader:'attribute float partId;varying float part;varying vec2 panelUv;void main(){part=partId;panelUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float locked;uniform bool cutout;uniform sampler2D cutoutMap;varying float part;varying vec2 panelUv;void main(){if(cutout&&texture2D(cutoutMap,panelUv).a<.5)discard;gl_FragColor=vec4(cutout?200./255.:part/255.,locked,0.,1.);}'
});
partMaterial.defaultAttributeValues.uv=[0,0];
const artistStage=createArtistStage(partMaterial,renderer);scene.add(artistStage.group);
const stageMotion=createStageMotion();
const paperScene=new THREE.Scene();
const paperCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const paperMaterial=new THREE.ShaderMaterial({
  uniforms:{picture:{value:paperTarget.texture},parts:{value:partTarget.texture},partEdges:{value:false},environmentFade:{value:0},pixel:{value:new THREE.Vector2(1,1)},width:{value:1.5}},
  vertexShader:'varying vec2 uvPaper;void main(){uvPaper=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D picture;uniform sampler2D parts;uniform bool partEdges;uniform float environmentFade;uniform vec2 pixel;uniform float width;varying vec2 uvPaper;
    void main(){vec4 c=texture2D(picture,uvPaper);float a=c.a;
      for(int i=0;i<8;i++){float angle=float(i)*.785398;vec2 offset=vec2(cos(angle),sin(angle))*pixel*width;a=max(a,texture2D(picture,uvPaper+offset).a);}
      float edge=0.;vec4 partSample=texture2D(parts,uvPaper);float id=partSample.r;
      if(partEdges&&id>0.){for(int i=0;i<8;i++){
        float angle=float(i)*.785398;
        vec4 neighbor=texture2D(parts,uvPaper+vec2(cos(angle),sin(angle))*pixel*width*.65);
        float otherId=neighbor.r;
        if(abs(id-otherId)>.002){
          edge=1.;
        }
      }}
      gl_FragColor=vec4(c.rgb*(1.-edge)*c.a/max(a,.00001),a);
      float faded=partSample.g;
      for(int k=0;k<8;k++){float t=float(k)*.785398;faded=max(faded,texture2D(parts,uvPaper+vec2(cos(t),sin(t))*pixel*width).g);}
      if(faded>.5)gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.),.78);
      bool environment=id>=120./255.;
      bool asset=id>0.&&id<120./255.;
      if(environmentFade>0.){
        for(int j=0;j<8;j++){
          float angle=float(j)*.785398;
          float nearby=texture2D(parts,uvPaper+vec2(cos(angle),sin(angle))*pixel*width).r;
          environment=environment||nearby>=120./255.;
          asset=asset||(nearby>0.&&nearby<120./255.);
        }
        if(environment&&!asset)gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.),environmentFade);
      }
      #include <colorspace_fragment>
    }`,depthTest:false,depthWrite:false,transparent:true
});
paperScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),paperMaterial));
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, 0.25, 6.7);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = 3.6;
controls.maxDistance = 8;
controls.autoRotateSpeed = 1.1;
const homeControls=new OrbitControls(homeCamera,renderer.domElement);
homeControls.enableDamping=true;homeControls.dampingFactor=.06;
homeControls.minDistance=7;homeControls.maxDistance=32;homeControls.enablePan=false;
homeControls.autoRotateSpeed=.32;
let homeInteracting=false,homeOrbitResume=0,homeOrbitClock=0;
homeControls.addEventListener('start',()=>{homeInteracting=true;});
homeControls.addEventListener('end',()=>{homeInteracting=false;homeOrbitResume=performance.now()+3500;});
let homeZoomDistance=null;
let frameDelta=1/60,lastFrameTime=performance.now();
const zoomOffset=new THREE.Vector3();
// Capture wheel input before OrbitControls applies its discrete dolly step.
// Touch pinch remains handled by OrbitControls.
renderer.domElement.addEventListener('wheel',event=>{
  if(!isHome||!homeControls.enabled||homeTransition)return;
  event.preventDefault();event.stopImmediatePropagation();
  homeOrbitResume=performance.now()+3500;
  const unit=event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1;
  const delta=THREE.MathUtils.clamp(event.deltaY*unit,-240,240);
  const base=homeZoomDistance??homeCamera.position.distanceTo(homeControls.target);
  homeZoomDistance=THREE.MathUtils.clamp(base*Math.exp(delta*.0015),homeControls.minDistance,homeControls.maxDistance);
},{passive:false,capture:true});
const cosmic=new THREE.Group();scene.add(cosmic);
let homeSpaceScale=1;
partMaterial.side=THREE.DoubleSide;
partMaterial.defaultAttributeValues.partId=[0];
const cosmicBodies=[];
const cosmicWhite=new THREE.MeshBasicMaterial({color:0xffffff});
const cosmicInk=new THREE.MeshBasicMaterial({color:0x151515});
function cosmicPlanet(radius,ring=false){
  const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.SphereGeometry(radius,32,24),cosmicWhite));
  if(ring){const r=new THREE.Mesh(new THREE.TorusGeometry(radius*1.65,.018,6,90),cosmicInk);r.rotation.x=1.05;r.rotation.y=.28;g.add(r);
    const r2=new THREE.Mesh(new THREE.TorusGeometry(radius*1.8,.008,4,90),cosmicInk);r2.rotation.copy(r.rotation);g.add(r2);}
  else for(const [x,y,s]of [[-.25,.23,.14],[.22,-.15,.09],[-.1,-.38,.065]]){
    const crater=new THREE.Mesh(new THREE.TorusGeometry(radius*s,.009,4,24),cosmicInk);crater.position.set(x*radius,y*radius,radius*Math.sqrt(1-x*x-y*y)+.004);g.add(crater);
  }
  cosmic.add(g);cosmicBodies.push(g);return g;
}
// Sparse celestial accents; no island meshes or track geometry are loaded.
for(const [radius,ring] of [[.40,true],[.23,false],[.31,true],[.18,false]])cosmicPlanet(radius,ring);
const crossVertices=[];
for(let i=0;i<180;i++){
  // A stable spherical field gives real depth/parallax through orbiting.
  const y=1-2*(i+.5)/180,angle=i*2.39996323,radius=42+(i%7)*1.8;
  const radial=Math.sqrt(1-y*y),x=Math.cos(angle)*radial*radius,z=Math.sin(angle)*radial*radius;
  const p=new THREE.Vector3(x,y*radius,z),normal=p.clone().normalize();
  const u=new THREE.Vector3().crossVectors(normal,new THREE.Vector3(0,1,.1)).normalize();
  const v=new THREE.Vector3().crossVectors(normal,u).normalize();
  const size=.16+(i%6)*.07;
  for(const axis of [u,v]){
    const a=p.clone().addScaledVector(axis,-size),b=p.clone().addScaledVector(axis,size);
    const mid=p.clone().addScaledVector(u,(i%3-1)*size*.12);
    crossVertices.push(...a.toArray(),...mid.toArray(),...mid.toArray(),...b.toArray());
  }
}
// Cross stars are the readable hand-drawn midground, not the fogged dust.
const cosmicStars=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(crossVertices,3)),new THREE.LineBasicMaterial({color:0x555555,transparent:true,opacity:.88,fog:false,depthWrite:false}));
const starAtmosphere=createStarAtmosphere();
starAtmosphere.setTheme('wild',true);starAtmosphere.scene.add(cosmicStars);
const meteorEncounters=[3,6.5,10].map(delay=>createMeteorEncounters(starAtmosphere.scene,Math.random,delay));
const floatingResidents=createFloatingResidents();
let hoveredResident=null;
function holdResident(id){hoveredResident=id;floatingResidents.hold(id);document.querySelectorAll('[data-resident]').forEach(el=>el.classList.toggle('is-hovered',el.dataset.resident===id));}
renderer.domElement.addEventListener('pointermove',e=>{
  if(!isHome||entering||e.buttons){holdResident(null);return;}
  const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,homeCamera);
  const hit=raycaster.intersectObjects([...modelGroups.values()].filter(g=>g.visible).map(g=>g.userData.mesh))[0];
  holdResident(hit&&!artistStage.occludes(raycaster,hit.distance)?[...modelGroups].find(([,g])=>g.userData.mesh===hit.object)?.[0]:null);
});
renderer.domElement.addEventListener('pointerleave',()=>holdResident(null));


const root = new THREE.Group();
scene.add(root);
let current = null;
let postcardCapture=null;
function capturePostcard(){return new Promise((resolve,reject)=>{if(isHome){reject(new Error('请先进入填色'));return;}postcardCapture={resolve,reject};});}
function captureAvatarSource(){
  // Re-render the 3D artwork, rather than enlarging a small on-screen screenshot.
  const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio();
  const scale=Math.min(2160/Math.min(size.x,size.y),4096/Math.max(size.x,size.y));
  const w=Math.max(1,Math.round(size.x*scale)),h=Math.max(1,Math.round(size.y*scale));
  const lineWidth=paperMaterial.uniforms.width.value;
  const visible=[...modelGroups.values()].filter(g=>g.visible);
  const overrides=scene.overrideMaterial;
  const creaseVisibility=visible.map(g=>g.userData.crease.visible);
  try{
    renderer.setPixelRatio(1);renderer.setSize(w,h,false);
    paperTarget.setSize(w,h);partTarget.setSize(w,h);
    paperMaterial.uniforms.pixel.value.set(1/w,1/h);
    paperMaterial.uniforms.width.value=lineWidth*scale/ratio;
    visible.forEach(g=>g.userData.crease.visible=false);scene.overrideMaterial=partMaterial;
    renderer.setRenderTarget(partTarget);renderer.render(scene,camera);
    scene.overrideMaterial=overrides;visible.forEach((g,i)=>g.userData.crease.visible=creaseVisibility[i]);
    renderer.setRenderTarget(paperTarget);renderer.render(scene,camera);
    renderer.setRenderTarget(null);renderer.render(paperScene,paperCamera);
    return renderer.domElement.toDataURL('image/png');
  }finally{
    scene.overrideMaterial=overrides;visible.forEach((g,i)=>g.userData.crease.visible=creaseVisibility[i]);
    renderer.setRenderTarget(null);renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);
    const buffer=renderer.getDrawingBufferSize(new THREE.Vector2());
    paperTarget.setSize(buffer.x,buffer.y);partTarget.setSize(buffer.x,buffer.y);
    paperMaterial.uniforms.pixel.value.set(1/buffer.x,1/buffer.y);paperMaterial.uniforms.width.value=lineWidth;
  }
}
let selectedColor = '#ff6157';
let currentTool = 'fill';
let edgeScale = 1.014;
const cache = new Map();
const loader = new STLLoader();

function fitGeometry(geometry) {
  geometry.computeVertexNormals();
  geometry.center();
  const box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
  const size = box.getSize(new THREE.Vector3());
  geometry.scale(2.65 / Math.max(size.x, size.y, size.z), 2.65 / Math.max(size.x, size.y, size.z), 2.65 / Math.max(size.x, size.y, size.z));
  geometry.computeBoundingSphere();
  return geometry;
}

async function loadModel(id) {
  document.querySelector('#loader').classList.remove('hidden');
  document.querySelector('#modelName').textContent = MODELS[id].name;
  if (current&&!isHome) current.visible=false;
  if(modelGroups.has(id)) {
    current=modelGroups.get(id);current.visible=!isHome;
    if(!isHome){current.userData.crease.material.uniforms.resolution.value.set(viewport.clientWidth,viewport.clientHeight);current.userData.crease.material.uniforms.width.value=.6+(+document.querySelector('#lineWidth').value)*.25;}
    document.querySelector('#undoBtn').disabled=!current.userData.history.length;
    document.querySelector('#loader').classList.add('hidden');
    document.querySelector('#inkStatus').textContent=`${MODELS[id].name} · ${current.userData.regionInfo.regions.length} 个部位，可分别填色。`;
    return;
  }
  let data = cache.get(id);
  if (!data) {
    const asset=MODELS[id].asset || id;
    const assetVersion=id==='alien'?'neck-clean-2':id==='glove'?'original-velcro-3':id==='whitecat'?'source-eye-surface-6':id==='whitebird'?'smooth-motifs-3':id==='chair'?'chair-joins-6':id==='house'?'house-back-2':id==='wolf'?'wolf-chest-3':id==='cake'?'cake-wrap-2':id==='fingerbird'?'finger-nails-9':id==='coilsnake'?'coil-bilateral-3':id==='facestack'?'stack-face-43':'curve-game-1';
    const [rawGeometry, edgeBuffer, regionBuffer, regionInfo] = await Promise.all([
      loader.loadAsync(MODELS[id].file+'?v='+assetVersion),
      fetch(`./assets/models/${asset}.edges.bin?v=${assetVersion}`).then(r => r.arrayBuffer()),
      fetch(`./assets/models/${asset}.regions.bin?v=${assetVersion}`).then(r => r.arrayBuffer()),
      fetch(`./assets/models/${asset}.regions.json?v=${assetVersion}`).then(r => r.json())
    ]);
    const originalBox = new THREE.Box3().setFromBufferAttribute(rawGeometry.attributes.position);
    const originalSize = originalBox.getSize(new THREE.Vector3());
    const scale = 2.65 / Math.max(originalSize.x, originalSize.y, originalSize.z);
    const center = originalBox.getCenter(new THREE.Vector3());
    const geometry = fitGeometry(rawGeometry);
    const edgeArray = new Float32Array(edgeBuffer);
    for (let i = 0; i < edgeArray.length; i += 3) {
      edgeArray[i] = (edgeArray[i] - center.x) * scale;
      edgeArray[i + 1] = (edgeArray[i + 1] - center.y) * scale;
      edgeArray[i + 2] = (edgeArray[i + 2] - center.z) * scale;
    }
    // Screen-space ribbons give structural boundaries a readable fixed ink width.
    const positions=[], ends=[], sides=[];
    for(let i=0;i<edgeArray.length;i+=6){
      const a=Array.from(edgeArray.slice(i,i+3)), b=Array.from(edgeArray.slice(i+3,i+6));
      for(const [tip,side] of [[0,-1],[0,1],[1,-1],[1,-1],[0,1],[1,1]]){
        positions.push(...(tip?b:a)); ends.push(...(tip?a:b)); sides.push(tip?-side:side);
      }
    }
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    edgeGeometry.setAttribute('other', new THREE.Float32BufferAttribute(ends,3));
    edgeGeometry.setAttribute('side', new THREE.Float32BufferAttribute(sides,1));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(1), 3));
    const partLabels=new Uint32Array(regionBuffer);
    geometry.setAttribute('partId',new THREE.Float32BufferAttribute(Float32Array.from({length:geometry.attributes.position.count},(_,i)=>partLabels[Math.floor(i/3)]+1),1));
    data = { geometry, edgeGeometry, regions: new Uint32Array(regionBuffer), regionInfo };
    cache.set(id, data);
  }
  const { geometry, edgeGeometry } = data;
  const group = new THREE.Group();
  group.visible=!isHome;
  group.rotation.set(...MODELS[id].rotation);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const ink = attachInk(material, data.ink);
  data.ink = ink;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.onBeforeRender=(_r,_s,_c,_g,m)=>{if(m===partMaterial){partMaterial.uniforms.cutout.value=false;partMaterial.uniforms.locked.value=isHome&&!progress.unlocked(id)?1:0;partMaterial.uniformsNeedUpdate=true;}};
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.paintable = true;

  // Back-face expanded silhouette: view-independent, stable outer ink line.
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const outline = new THREE.Mesh(geometry, outlineMaterial);
  outline.visible = false;
  outline.scale.setScalar(edgeScale);
  outline.renderOrder = -1;

  // Crease lines preserve geometric grooves and sharp transitions while rotating.
  const crease = new THREE.Mesh(edgeGeometry, new THREE.ShaderMaterial({
    uniforms:{resolution:{value:new THREE.Vector2(viewport.clientWidth,viewport.clientHeight)},width:{value:1.6}},
    vertexShader:`attribute vec3 other; attribute float side; uniform vec2 resolution; uniform float width;
      void main(){vec4 a=projectionMatrix*modelViewMatrix*vec4(position,1.);vec4 b=projectionMatrix*modelViewMatrix*vec4(other,1.);
      vec2 d=(b.xy/b.w-a.xy/a.w)*resolution;vec2 n=normalize(vec2(-d.y,d.x)+vec2(1e-8));
      a.xy+=n*side*width/resolution*a.w;a.z-=0.00001*a.w;gl_Position=a;}`,
    fragmentShader:`void main(){gl_FragColor=vec4(0.,0.,0.,1.);}`,side:THREE.DoubleSide
  }));
  group.add(outline, mesh, crease);
  root.add(group);
  current = group;
  paperMaterial.uniforms.partEdges.value=Boolean(MODELS[id].asset);
  current.userData = { id, mesh, outline, crease, regions: data.regions, regionInfo: data.regionInfo, ink, strokes:0 };
  current.userData.history=[];
  modelGroups.set(id,group);
  await progress.hydrate(group);
  document.querySelector('#undoBtn').disabled=true;
  document.querySelector('#inkStatus').textContent=`${MODELS[id].name} · ${data.regionInfo.regions.length} 个部位，可分别填色。`;
  document.querySelector('#loader').classList.add('hidden');
}

function saveUndo() {
  if(!current) return;
  const {mesh,ink,history}=current.userData;
  history.push({colors:mesh.geometry.attributes.color.array.slice(),pixels:ink.pixels.slice(),count:ink.count.value,serial:ink.strokeSerial||0,strokes:current.userData.strokes||0});
  if(history.length>20) history.shift();
  if(portraitMode==='paint'){portraitUndo.push([current.userData.id]);if(portraitUndo.length>100)portraitUndo.shift();}
  document.querySelector('#undoBtn').disabled=false;
}
document.querySelector('#undoBtn').addEventListener('click',()=>{
  if(!current||painting) return;
  const ids=portraitMode==='paint'?portraitUndo.pop():[current.userData.id];if(!ids)return;
  for(const id of [...ids].reverse()){
    const g=modelGroups.get(id);if(!g)continue;
    const {mesh,ink,history}=g.userData,step=history.pop();if(!step)continue;
    mesh.geometry.attributes.color.array.set(step.colors);mesh.geometry.attributes.color.needsUpdate=true;
    ink.pixels.set(step.pixels);ink.texture.needsUpdate=true;ink.count.value=step.count;ink.strokeSerial=step.serial;
    g.userData.strokes=step.strokes;progress.changed(g);
  }
  document.querySelector('#undoBtn').disabled=portraitMode==='paint'?!portraitUndo.length:!current.userData.history.length;
  document.querySelector('#inkStatus').textContent='已撤销上一步';
});
function applyColor(color, faceIndex = null) {
  if (!current) return;
  saveUndo();
  const { mesh, regions } = current.userData;
  const colors = mesh.geometry.attributes.color;
  const ink = new THREE.Color(color);
  const region = faceIndex === null ? -1 : regions[faceIndex];
  for (let f=0;f<regions.length;f++) {
    let paint = regions[f] === region;
    if (paint) for(let v=0;v<3;v++) colors.setXYZ(f*3+v, ink.r, ink.g, ink.b);
  }
  colors.needsUpdate = true;
  progress.changed(current);
  const title=current.userData.regionInfo.regions.find(item=>item.id===region)?.name;
  if(title) document.querySelector('#inkStatus').textContent=`已为「${title}」上色`;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPoint = null;
let painting = false;
let lastScreen = null;
let lastPaint = null;
const brushHelp='刷子：在角色上拖动涂色，拖动空白处旋转（或按住 Alt 拖动）。';
function hitAt(x,y) {
  if(!current||isHome||portraitMode==='preview') return null;
  const r=renderer.domElement.getBoundingClientRect();
  pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=(portraitMode?raycaster.intersectObjects([...modelGroups.values()].filter(g=>g.visible).map(g=>g.userData.mesh)):raycaster.intersectObject(current.userData.mesh))[0];
  return hit&&!artistStage.occludes(raycaster,hit.distance)?hit:null;
}
function brushAt(x,y) {
  const hit=hitAt(x,y);
  if(!hit){lastPaint=null;return;}
  if(portraitMode){
    const g=[...modelGroups.values()].find(g=>g.userData.mesh===hit.object);
    selectPortraitResident(g);
    if(!brushResidents.has(g)){saveUndo();g.userData.ink.strokeSerial=(g.userData.ink.strokeSerial||0)+1;brushResidents.add(g);lastPaint=null;}
  }
  const size=+document.querySelector('#brushSize').value;
  if(lastPaint && hit.point.distanceTo(lastPaint)<size*.23) return;
  lastPaint=hit.point.clone();
  const {mesh,ink}=current.userData;
  if(!stampInk(mesh,ink,hit,selectedColor,'brush',size)) document.querySelector('#inkStatus').textContent='画布笔迹已满，恢复纯白后可重新创作。';
}
// Capture before OrbitControls receives pointerdown; painting never rotates.
renderer.domElement.addEventListener('pointerdown',e=>{
  if(entering)return;
  if(currentTool!=='brush'||e.button!==0||e.altKey||!hitAt(e.clientX,e.clientY)) return;
  e.stopImmediatePropagation(); e.preventDefault();
  painting=true; controls.enabled=false; downPoint=null; lastPaint=null;
  brushResidents.clear();
  brushUndoStart=portraitUndo.length;
  if(!portraitMode){saveUndo();current.userData.ink.strokeSerial=(current.userData.ink.strokeSerial || 0)+1;}
  lastScreen=[e.clientX,e.clientY];
  renderer.domElement.setPointerCapture(e.pointerId);
  brushAt(e.clientX,e.clientY);
},true);
renderer.domElement.addEventListener('pointermove',e=>{
  if(!painting) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const dx=e.clientX-lastScreen[0],dy=e.clientY-lastScreen[1];
  const steps=Math.min(150,Math.max(1,Math.ceil(Math.hypot(dx,dy)/3)));
  for(let j=1;j<=steps;j++) brushAt(lastScreen[0]+dx*j/steps,lastScreen[1]+dy*j/steps);
  lastScreen=[e.clientX,e.clientY];
},true);
function finishBrush(e){
  if(!painting) return;
  e.stopImmediatePropagation();
  painting=false;controls.enabled=true;lastScreen=null;lastPaint=null;downPoint=null;
  for(const g of portraitMode?brushResidents:[current]){const before=g.userData.history.at(-1);if(before&&g.userData.ink.count.value>before.count){g.userData.strokes++;progress.changed(g);}}
  if(portraitMode&&brushResidents.size)portraitUndo.splice(brushUndoStart,portraitUndo.length-brushUndoStart,[...brushResidents].map(g=>g.userData.id));
  brushResidents.clear();
  if(renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
}
renderer.domElement.addEventListener('pointerup',finishBrush,true);
renderer.domElement.addEventListener('pointercancel',finishBrush,true);
renderer.domElement.addEventListener('lostpointercapture',finishBrush,true);
renderer.domElement.addEventListener('pointerdown', e => downPoint = [e.clientX, e.clientY]);
renderer.domElement.addEventListener('pointerup', e => {
  if(entering){downPoint=null;return;}
  if(portraitMode==='preview')return;
  if(isHome){
    if(entering||!downPoint||Math.hypot(e.clientX-downPoint[0],e.clientY-downPoint[1])>6)return;
    const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,homeCamera);
    const hit=raycaster.intersectObjects([...modelGroups.values()].filter(g=>g.visible).map(g=>g.userData.mesh))[0];
    if(hit&&!artistStage.occludes(raycaster,hit.distance)){const entry=[...modelGroups].find(([,g])=>g.userData.mesh===hit.object);if(entry)enterResident(entry[0]);}
    return;
  }
  if(currentTool==='brush'||e.button!==0) return;
  if (!downPoint || Math.hypot(e.clientX - downPoint[0], e.clientY - downPoint[1]) > 6 || !current) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
  raycaster.setFromCamera(pointer, camera);
  const hit = hitAt(e.clientX,e.clientY);
  if (hit) {
    if(portraitMode)selectPortraitResident([...modelGroups.values()].find(g=>g.userData.mesh===hit.object));
    if(currentTool === 'fill') applyColor(selectedColor, hit.faceIndex);
    else {
      const {mesh,ink}=current.userData;
      if(ink.count.value<512) saveUndo();
      const accepted=stampInk(mesh,ink,hit,selectedColor,currentTool,+document.querySelector('#brushSize').value);
      if(accepted){current.userData.strokes++;progress.changed(current);}
      if(!accepted) document.querySelector('#inkStatus').textContent='画布笔迹已满，恢复纯白后可重新创作。';
    }
  }
});

document.querySelectorAll('.model-card').forEach(btn => btn.addEventListener('click', () => {
  enterResident(btn.dataset.model,false);
}));
document.querySelectorAll('.crayon').forEach(btn => btn.addEventListener('click', () => {
  selectedColor = btn.dataset.color;
  document.querySelectorAll('.crayon').forEach(x => x.classList.toggle('active', x === btn));
}));
document.querySelectorAll('input[name=tool]').forEach(input => input.addEventListener('change', () => {
  currentTool = input.value;
  document.querySelector('#inkStatus').textContent=currentTool==='brush'?brushHelp:currentTool==='splash'?'点击角色泼出颜料，拖动旋转。':'点击区域填色，拖动旋转。';
  renderer.domElement.style.cursor=currentTool==='brush'?'crosshair':'grab';
  document.querySelectorAll('.tool-option').forEach(x => x.classList.toggle('active', x.contains(input)));
}));
document.querySelector('#lineWidth').addEventListener('input', e => {
  const v = +e.target.value;
  paperMaterial.uniforms.width.value=(.65+v*.22)*renderer.getPixelRatio();
  edgeScale = 1.006 + v * .002;
  if (current) {
    current.userData.outline.scale.setScalar(edgeScale);
    current.userData.crease.material.uniforms.width.value = .6+v*.25;
  }
  document.querySelector('#lineLabel').textContent = v < 3 ? '轻轻的' : v > 6 ? '很有脾气' : '刚刚好';
  document.querySelector('.line-preview i').style.borderTopWidth = `${Math.max(1,v-1)}px`;
});
document.querySelector('#spinBtn').addEventListener('click', e => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.setAttribute('aria-pressed', controls.autoRotate);
});
document.querySelector('#resetBtn').addEventListener('click', () => {
  if(portraitMode){frameCurrentPortrait();return;}
  camera.position.set(0, .25, 6.7); controls.target.set(0,0,0); controls.update();
  if (current) current.rotation.set(...Object.values(MODELS).find(m => m.name === document.querySelector('#modelName').textContent).rotation);
});
document.querySelector('#randomBtn').addEventListener('click', () => {
  if (!current) return;
  saveUndo();
  current.userData.mesh.geometry.attributes.color.array.fill(1);
  current.userData.mesh.geometry.attributes.color.needsUpdate = true;
  current.userData.ink.count.value = 0;
  current.userData.strokes=0;progress.changed(current);
  document.querySelector('#inkStatus').textContent=brushHelp;
});

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if(!w||!h)return;
  const oldAspect=isHome?homeCamera.aspect:camera.aspect;
  if(stageActive()&&!entering&&!homeTransition&&oldAspect!==w/h){
    const eye=isHome?homeCamera:camera,orbit=isHome?homeControls:controls;
    const previous=stageView(oldAspect,eye.fov),next=stageView(w/h,eye.fov);
    eye.position.sub(orbit.target).multiplyScalar(next.position.z/previous.position.z).add(orbit.target);
    homeZoomDistance=null;
  }
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const resolution=renderer.getDrawingBufferSize(new THREE.Vector2());
  paperTarget.setSize(resolution.x,resolution.y);
  partTarget.setSize(resolution.x,resolution.y);
  paperMaterial.uniforms.pixel.value.set(1/resolution.x,1/resolution.y);
  paperMaterial.uniforms.width.value=(.65+(+document.querySelector('#lineWidth').value)*.22)*renderer.getPixelRatio();
  for(const g of modelGroups.values())if(g.visible)g.userData.crease.material.uniforms.resolution.value.set(w,h);
  if(isHome){homeCamera.aspect=w/h;homeCamera.updateProjectionMatrix();layoutResidents();}
}
new ResizeObserver(resize).observe(viewport);
new ResizeObserver(()=>{if(!isHome)resize();}).observe(document.querySelector('#viewport'));
function animate() {
  requestAnimationFrame(animate);
  const now=performance.now();frameDelta=Math.min(.05,Math.max(0,(now-lastFrameTime)/1000));lastFrameTime=now;
  artistStage.group.visible=stageActive();
  starAtmosphere.update(performance.now(),isHome&&!stageActive()&&homeMotion&&!entering&&!matchMedia('(prefers-reduced-motion: reduce)').matches,homeCamera);
  if(isHome)animateUniverse(performance.now());
  else if(studioTransition){
    const tr=studioTransition,p=Math.min(1,(now-tr.start)/tr.duration),ease=p*p*(3-2*p);
    camera.position.lerpVectors(tr.from,tr.to,ease);
    camera.quaternion.slerpQuaternions(tr.rotationFrom,tr.rotationTo,ease);
    camera.fov=THREE.MathUtils.lerp(tr.fov,34,ease);
    const w=viewport.clientWidth,h=viewport.clientHeight;
    camera.setViewOffset(THREE.MathUtils.lerp(tr.fullWidth,w,ease),THREE.MathUtils.lerp(tr.fullHeight,h,ease),tr.x*(1-ease),tr.y*(1-ease),w,h);
    camera.updateProjectionMatrix();
    if(p===1){camera.clearViewOffset();studioTransition=null;tr.done();}
  }
  else if(!painting&&!entering) controls.update();
  if(!isHome&&stagePortrait&&portraitMode==='preview'&&!entering){
    stageMotion.update(frameDelta,{enabled:stageMotionEnabled,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
  }
  for(const g of modelGroups.values())if(g.visible)g.userData.ink.time.value=performance.now()/1000;
  const activeCamera=isHome?homeCamera:camera;
  paperMaterial.uniforms.environmentFade.value=isHome&&!stageActive()?.38:0;
  const visible=[...modelGroups.values()].filter(g=>g.visible);
  if(visible.length){
    cosmic.visible=false;
    // Match the visible surface pass: back-facing relief walls must not add
    // ghost region contours through the front-facing character surface.
    partMaterial.side=isHome?THREE.DoubleSide:THREE.FrontSide;
    visible.forEach(g=>g.userData.crease.visible=false);scene.overrideMaterial=partMaterial;
    renderer.setRenderTarget(partTarget);renderer.render(scene,activeCamera);
    scene.overrideMaterial=null;visible.forEach(g=>g.userData.crease.visible=true);
  }
  cosmic.visible=false;
  renderer.setRenderTarget(paperTarget);renderer.render(scene,activeCamera);
  renderer.setRenderTarget(null);
  // Render faint sky first, then the opaque white residents and their ink.
  // This guarantees orbit/meteor strokes cannot cross a character's surface.
  renderer.autoClear=false;renderer.clear();
  if(isHome&&!stageActive())renderer.render(starAtmosphere.scene,homeCamera);
  renderer.clearDepth();renderer.render(paperScene,paperCamera);
  renderer.autoClear=true;
  if(postcardCapture){const pending=postcardCapture;postcardCapture=null;try{pending.resolve(captureAvatarSource());}catch(e){pending.reject(e);}}
}
function layoutResidents(){
  if(homeScene==='artist-stage'){
    if(!stageLayout.length)stageLayout=arrangeStage([...modelGroups].filter(([id])=>progress.unlocked(id)),MODELS);
    applyStageLayout();return;
  }
  const frame=viewport.getBoundingClientRect();
  const halfY=Math.tan(THREE.MathUtils.degToRad(22))*18,halfX=halfY*frame.width/frame.height;
  const positions=[[-.60,.49,5.5],[.48,.49,-6.5],[-.13,.10,0],[.69,-.03,2],[-.64,-.29,-8],[.30,-.30,6.5],[.68,-.55,-4.5],[-.08,-.56,-1],[.38,-.73,4],[-.10,.58,-2.5],[-.70,.02,-3],[-.40,-.70,2],[.34,.10,-4],[-.38,.28,-7],[.72,.35,-2],[-.83,.67,-5],[.05,.80,-6],[-.84,-.65,-5]];
  const compact=frame.width<700;
  homeSpaceScale=Math.min(1,Math.max(.40,frame.width/frame.height*.85));
  cosmicBodies.forEach((p,i)=>{const loc=[[-.88,.02,-2.5],[.05,.77,-4],[.85,.80,-5],[-.8,-.79,1]][i];p.position.set(loc[0]*halfX,loc[1]*halfY,loc[2]);});
  let i=0;
  for(const [id,g] of modelGroups){
    const el=document.querySelector(`[data-resident="${id}"]`);if(!el)continue;
    const [x,y,z]=positions[i]??[0,0,0];
    // Account for perspective so foreground residents stay within the frame.
    const depth=(18-z)/18;
    g.userData.homeBase=new THREE.Vector3(x*Math.min(halfX,13.5)*depth,y*halfY*depth,z);
    g.userData.homeScale=.68*homeSpaceScale*([.94,.91,1.02,1.40,1.08,.88,.90,.98,1.10,1.15,1.02,1.10,1.12,.92,1.12,1.08,1.12,1.28][i++]??1.1);
    g.userData.mesh.geometry.computeBoundingSphere();
    floatingResidents.ensure(id,g.userData.homeScale/homeSpaceScale*g.userData.mesh.geometry.boundingSphere.radius/1.34);
    g.userData.crease.material.uniforms.resolution.value.set(frame.width,frame.height);
    g.userData.crease.material.uniforms.width.value=.72;
  }
}
function applyStageLayout(){
  const poses=new Map(stageLayout.map(item=>[item.id,item]));
  for(const [id,g]of modelGroups){
    const pose=poses.get(id);g.visible=!!pose;
    if(!pose)continue;
    g.position.fromArray(pose.position);g.quaternion.fromArray(pose.quaternion);g.scale.setScalar(pose.scale);
    g.userData.crease.material.uniforms.resolution.value.set(viewport.clientWidth,viewport.clientHeight);
    g.userData.crease.material.uniforms.width.value=1;
    g.updateMatrixWorld(true);
  }
  stageMotion.setLayout(stageLayout,modelGroups);
  stageMotion.update(0,{enabled:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
}
function updateStageLabels(){
  const frame=viewport.getBoundingClientRect();
  for(const [id,g]of modelGroups){
    const label=document.querySelector(`[data-resident="${id}"]`);if(!label)continue;
    if(!g.visible){label.style.display='none';continue;}
    const p=g.position.clone().project(homeCamera);
    label.style.display=p.z>=-1&&p.z<=1&&Math.abs(p.x)<.97&&Math.abs(p.y)<.9?'':'none';
    label.style.left=`${(p.x*.5+.5)*frame.width}px`;label.style.top=`${(-p.y*.5+.5)*frame.height+20}px`;
  }
}
function configureHomeCamera(){
  const stage=homeScene==='artist-stage';
  homeCamera.fov=stage?42:58;homeCamera.far=stage?300:150;homeCamera.updateProjectionMatrix();
  homeControls.minDistance=stage?16:7;homeControls.maxDistance=stage?180:32;
  homeControls.minPolarAngle=stage?.6:0;homeControls.maxPolarAngle=stage?2.5:Math.PI;
  homeControls.minAzimuthAngle=stage?-1.15:-Infinity;homeControls.maxAzimuthAngle=stage?1.15:Infinity;
  homeControls.autoRotate=false;
}
function updateSceneUI(){
  const stage=homeScene==='artist-stage';
  document.body.classList.toggle('artist-stage',stage);
  for(const button of document.querySelectorAll('[data-scene]'))button.setAttribute('aria-pressed',String(button.dataset.scene===homeScene));
  for(const id of ['stageNote','stageFrame','stageShuffle','stageReposition'])document.getElementById(id).hidden=!stage;
  updateStageMotionUI();
}
function updateStageMotionUI(){
  const stage=homeScene==='artist-stage',homeButton=document.querySelector('#homeMotion');
  homeButton.setAttribute('aria-pressed',String(stage?stageMotionEnabled:homeMotion));
  homeButton.textContent=stage?(stageMotionEnabled?'暂停动态 Ⅱ':'继续动态 ▷'):(homeMotion?'暂停漂浮 Ⅱ':'继续漂浮 ▷');
  const preview=stagePortrait&&portraitMode==='preview';
  document.querySelector('#portraitReposition').hidden=!preview;
  const motion=document.querySelector('#portraitStageMotion');motion.hidden=!preview;
  motion.setAttribute('aria-pressed',String(stageMotionEnabled));motion.textContent=stageMotionEnabled?'暂停动态 Ⅱ':'继续动态 ▷';
  document.querySelector('#portraitShuffle').textContent=stagePortrait?'换一组朋友 ↻':'换一组 ↻';
}
async function switchHomeScene(next){
  if(!isHome||entering||sceneChanging||next===homeScene)return;
  sceneChanging=true;
  const buttons=[...document.querySelectorAll('[data-scene]')],note=document.querySelector('#stageNote');
  buttons.forEach(button=>button.disabled=true);
  try{
    if(next==='artist-stage'){
      note.hidden=false;note.textContent='正在展开艺术家的布景…';await artistStage.load();
      stageLayout=arrangeStage([...modelGroups].filter(([id])=>progress.unlocked(id)),MODELS);
    }
    homeScene=next;holdResident(null);homeZoomDistance=null;returnView=null;
    configureHomeCamera();layoutResidents();artistStage.group.visible=next==='artist-stage';
    const view=next==='artist-stage'?stageView(homeCamera.aspect,homeCamera.fov):{position:new THREE.Vector3(0,1.2,11.8),target:new THREE.Vector3()};
    homeCamera.position.copy(view.position);homeControls.target.copy(view.target);homeControls.update();
    note.textContent='四张原画，一座小剧场 · 拖动发现前后层次';updateSceneUI();
    try{localStorage.setItem('doodle-home-scene',homeScene);}catch{}
  }catch(error){note.hidden=false;note.textContent='布景加载失败，请重试';console.error('Artist stage failed to load',error);}
  finally{sceneChanging=false;buttons.forEach(button=>button.disabled=false);}
}
document.querySelectorAll('[data-scene]').forEach(button=>button.onclick=()=>switchHomeScene(button.dataset.scene));
document.querySelector('#stageShuffle').onclick=()=>{
  if(entering||sceneChanging||homeScene!=='artist-stage')return;
  stageLayout=arrangeStage([...modelGroups].filter(([id])=>progress.unlocked(id)),MODELS,true);applyStageLayout();holdResident(null);
};
document.querySelector('#stageReposition').onclick=()=>{
  if(entering||sceneChanging||homeScene!=='artist-stage')return;
  stageLayout=randomizeStagePositions(stageLayout,[...modelGroups],MODELS);applyStageLayout();holdResident(null);
};
document.querySelector('#stageFrame').onclick=async()=>{
  if(entering||sceneChanging)return;
  const view=stageView(homeCamera.aspect,homeCamera.fov);homeZoomDistance=null;holdResident(null);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    entering=true;homeControls.enabled=false;
    await new Promise(done=>homeTransition={start:performance.now(),duration:850,from:homeCamera.position.clone(),to:view.position,targetFrom:homeControls.target.clone(),target:view.target,done});
  }
  homeCamera.position.copy(view.position);homeControls.target.copy(view.target);homeControls.update();homeControls.enabled=true;entering=false;
};
function faceResident(id,g,t,index){
  // World-Y rotation preserves the authored orientation; no camera-facing lock.
  const moving=homeMotion&&hoveredResident!==id&&!entering&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elapsed=Math.min(.05,Math.max(0,(t-(g.userData.lastHomeTurn??t))/1000));
  g.userData.lastHomeTurn=t;
  // Stable per-character variations: signed radians/second and starting yaw.
  const turns={bunny:[.073,.16],sun:[-.047,-.32],cat:[.109,.48],bird:[-.082,-.2],broccoli:[.056,.3],skull:[-.126,-.52],glove:[.091,-.12],apple:[-.063,.38],whitecat:[.041,-.24],whitebird:[-.052,.12],chair:[.061,.18],house:[-.039,-.28],wolf:[.084,-.14],cryingsun:[-.058,.20],cake:[.045,-.25],fingerbird:[-.068,.12]};
  const [speed,start]=turns[id]??(id==='facestack'?[-.043,.18]:[.07,0]);
  g.userData.homeYaw=(g.userData.homeYaw??start)+(moving?elapsed*speed:0);
  const phase=t*.00065+index*1.7;
  // Each resident tumbles around a different tilted axis, including world Y.
  if(!g.userData.homeTumble)g.userData.homeTumble=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),start);
  const axis=new THREE.Vector3(Math.sin(index*2.4+.6),.45*(index%2?-1:1),Math.cos(index*1.7+.3)).normalize();
  if(moving)g.userData.homeTumble.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,elapsed*(.17+(index%5)*.025)*(speed<0?-1:1))).normalize();
  if(moving&&g.userData.impactSpin>.005){
    const boost=g.userData.impactSpin,decay=Math.exp(-elapsed/1.65);
    g.userData.homeTumble.premultiply(new THREE.Quaternion().setFromAxisAngle(g.userData.impactAxis,boost*1.65*(1-decay))).normalize();
    g.userData.impactSpin=boost*decay;
  }
  const sway=g.userData.homeTumble;
  const front=new THREE.Quaternion().setFromEuler(new THREE.Euler(...MODELS[id].rotation));
  g.quaternion.copy(sway).multiply(front);
}
function animateUniverse(t){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(homeTransition){
    const tr=homeTransition,p=Math.min(1,(t-tr.start)/tr.duration),ease=p*p*(3-2*p);
    homeCamera.position.lerpVectors(tr.from,tr.to,ease);
    const lookTarget=new THREE.Vector3().lerpVectors(tr.targetFrom,tr.target,ease);
    if(tr.orbitFrom){
      // Arc around the target instead of crossing through it when approaching from behind.
      const turn=new THREE.Quaternion().slerp(tr.orbitTurn,ease);
      const offset=tr.orbitFrom.clone().normalize().applyQuaternion(turn)
        .multiplyScalar(THREE.MathUtils.lerp(tr.orbitFrom.length(),tr.orbitTo.length(),ease));
      homeCamera.position.copy(lookTarget).add(offset);
    }
    homeCamera.lookAt(lookTarget);
    if(homeScene!=='artist-stage'){let index=0;for(const [id,g]of modelGroups)faceResident(id,g,t,index++);}
    if(tr.rotationFrom)modelGroups.get(tr.id).quaternion.slerpQuaternions(tr.rotationFrom,tr.rotationTo,ease);
    if(p===1){homeTransition=null;tr.done();}
    return;
  }
  let i=0;
  if(homeZoomDistance!==null){
    zoomOffset.copy(homeCamera.position).sub(homeControls.target);
    const distance=zoomOffset.length();
    const next=THREE.MathUtils.lerp(distance,homeZoomDistance,1-Math.exp(-frameDelta/.18));
    homeCamera.position.copy(homeControls.target).add(zoomOffset.setLength(next));
    if(Math.abs(next-homeZoomDistance)<.002)homeZoomDistance=null;
  }
  if(homeScene==='artist-stage'){
    homeControls.autoRotate=false;homeControls.update(frameDelta);
    if(!entering)stageMotion.update(frameDelta,{enabled:stageMotionEnabled,held:hoveredResident,reduced});
    updateStageLabels();return;
  }
  const orbiting=homeMotion&&!reduced&&!homeInteracting&&!hoveredResident&&t>homeOrbitResume;
  homeControls.autoRotate=orbiting;
  if(orbiting){
    homeOrbitClock+=frameDelta;
    const offset=homeCamera.position.clone().sub(homeControls.target),sphere=new THREE.Spherical().setFromVector3(offset);
    sphere.phi=THREE.MathUtils.clamp(sphere.phi+frameDelta*.014*Math.cos(homeOrbitClock*.12),.25,Math.PI-.25);
    homeCamera.position.copy(homeControls.target).add(offset.setFromSpherical(sphere));
  }
  homeControls.update(frameDelta);
  const frame=viewport.getBoundingClientRect();
  floatingResidents.update(frameDelta,homeMotion&&!reduced);
  for(const [id,g]of modelGroups){
    // STL loading registers a group before the following layout pass measures it.
    if(!floatingResidents.bodies.has(id))continue;
    const moving=homeMotion&&!reduced;
    const phase=t*.00065+i*1.7;
    const base=g.userData.homeBase||new THREE.Vector3();
    g.position.copy(floatingResidents.position(id,homeSpaceScale));
    g.scale.setScalar(g.userData.homeScale||.5);
    faceResident(id,g,t,i);
    g.visible=true;
    const p=g.position.clone().add(new THREE.Vector3(0,-1.45*g.scale.x,0)).project(homeCamera);const label=document.querySelector(`[data-resident="${id}"]`);
    const distance=g.position.distanceTo(homeCamera.position),size=2.65*g.scale.x*frame.height/(2*Math.tan(THREE.MathUtils.degToRad(22))*distance);
    label.style.left=`${(p.x*.5+.5)*frame.width}px`;label.style.top=`${(-p.y*.5+.5)*frame.height+10}px`;
    const labelVisible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.91;
    label.style.zIndex=String(Math.round(100-distance));label.style.display=labelVisible?'':'none';i++;
  }
  meteorEncounters.forEach(event=>event.update(frameDelta,{moving:homeMotion&&!reduced,groups:modelGroups,held:hoveredResident,camera:homeCamera,scale:homeSpaceScale}));
}
async function enterResident(id,zoom=true,push=true){
  if(!progress.unlocked(id)){progress.blocked(id);return;}
  if(entering||sceneChanging||!modelGroups.has(id))return;
  leavePortrait();
  entering=true;controls.enabled=false;homeControls.enabled=false;
  if(isHome)returnView={position:homeCamera.position.clone(),target:homeControls.target.clone()};
  document.querySelector('#universeStatus').textContent=`正在飞向${MODELS[id].name}…`;
  const smoothArrival=isHome&&zoom&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(smoothArrival){
    document.body.classList.add('entering');const g=modelGroups.get(id);
    const rotationFrom=g.quaternion.clone();
    const rotationTo=new THREE.Quaternion().setFromEuler(new THREE.Euler(...MODELS[id].rotation));
    // Match the editor's viewing direction as well as the authored model orientation.
    const orbitFrom=homeCamera.position.clone().sub(homeControls.target);
    const orbitTo=new THREE.Vector3(0,.25,6.7).normalize().multiplyScalar(4.1*g.scale.x);
    const orbitTurn=new THREE.Quaternion().setFromUnitVectors(orbitFrom.clone().normalize(),orbitTo.clone().normalize());
    await new Promise(done=>homeTransition={id,start:performance.now(),duration:1450,from:homeCamera.position.clone(),to:g.position.clone().add(orbitTo),targetFrom:homeControls.target.clone(),target:g.position.clone(),orbitFrom,orbitTo,orbitTurn,rotationFrom,rotationTo,done});
  }
  // Preserve the exact projection at the DOM/canvas handoff, including viewport crop.
  const selected=modelGroups.get(id),oldFrame=viewport.getBoundingClientRect();
  const arrival=smoothArrival?{
    from:homeCamera.position.clone().sub(selected.position).multiplyScalar((MODELS[id].editorScale||1)/selected.scale.x),
    rotationFrom:homeCamera.quaternion.clone(),fov:homeCamera.fov,
    fullWidth:oldFrame.width,fullHeight:oldFrame.height,left:oldFrame.left,top:oldFrame.top
  }:null;
  isHome=false;artistStage.group.visible=false;document.body.classList.remove('home-mode','entering');
  document.querySelector('#universe').hidden=true;
  const studio=document.querySelector('.workspace');studio.hidden=false;studio.classList.remove('studio-arrival');
  document.querySelector('#homeBtn').hidden=false;
  viewport=document.querySelector('#viewport');viewport.appendChild(renderer.domElement);
  for(const [key,g]of modelGroups){g.visible=key===id;g.position.set(0,0,0);g.scale.setScalar(MODELS[key].editorScale||1);g.rotation.set(...MODELS[key].rotation);}
  await loadModel(id);
  document.querySelectorAll('.model-card').forEach(b=>b.classList.toggle('active',b.dataset.model===id));
  camera.clearViewOffset();camera.fov=34;camera.position.set(0,.25,6.7);controls.target.set(0,0,0);controls.autoRotate=false;
  camera.lookAt(controls.target);resize();
  if(arrival){
    const frame=viewport.getBoundingClientRect(),to=camera.position.clone(),rotationTo=camera.quaternion.clone();
    camera.position.copy(arrival.from);camera.quaternion.copy(arrival.rotationFrom);camera.fov=arrival.fov;
    camera.setViewOffset(arrival.fullWidth,arrival.fullHeight,frame.left-arrival.left,frame.top-arrival.top,frame.width,frame.height);
    camera.updateProjectionMatrix();
    await new Promise(done=>studioTransition={...arrival,to,rotationTo,x:frame.left-arrival.left,y:frame.top-arrival.top,start:performance.now(),duration:700,done});
  }
  controls.enabled=true;controls.update();
  current.userData.crease.material.uniforms.width.value=.6+(+document.querySelector('#lineWidth').value)*.25;
  if(push)history.pushState({},'',`#paint=${id}`);
  window.scrollTo(0,0);document.querySelector('#homeBtn').focus({preventScroll:true});entering=false;
  progress.update();
  journey.showWish(id);
}
async function showUniverse(push=true){
  if(entering)return;
  if(isHome)return;
  const wasPortrait=!!portraitMode;leavePortrait();
  const id=current?.userData.id,g=modelGroups.get(id),rotationFrom=g?.quaternion.clone();
  const editorOffset=camera.position.clone().sub(controls.target);
  const animate=!!g&&!wasPortrait&&(homeScene!=='artist-stage'||stageLayout.some(item=>item.id===id))&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  entering=true;
  isHome=true;controls.enabled=false;homeControls.enabled=true;controls.autoRotate=false;document.querySelector('#spinBtn').setAttribute('aria-pressed','false');
  document.body.classList.add('home-mode');document.querySelector('.workspace').hidden=true;
  document.querySelector('#universe').hidden=false;document.querySelector('#homeBtn').hidden=true;
  viewport=document.querySelector('#homeViewport');viewport.appendChild(renderer.domElement);
  homeZoomDistance=null;configureHomeCamera();homeCamera.position.set(0,1.2,11.8);homeCamera.zoom=1;homeControls.target.set(0,0,0);homeControls.update();
  for(const g of modelGroups.values())g.visible=false;
  resize();document.querySelector('#universeStatus').textContent='点击一个朋友，飞近一点 ↗';
  if(push)history.pushState({},'','#universe');window.scrollTo(0,0);
  const destination=returnView??(homeScene==='artist-stage'?stageView(homeCamera.aspect,homeCamera.fov):{position:new THREE.Vector3(0,1.2,11.8),target:new THREE.Vector3()});
  if(animate){
    document.body.classList.add('entering');homeControls.enabled=false;
    let index=0;for(const [key,resident] of modelGroups){
      if(homeScene==='artist-stage')continue;
      if(!floatingResidents.bodies.has(key))continue;
      resident.position.copy(floatingResidents.position(key,homeSpaceScale));
      resident.scale.setScalar(resident.userData.homeScale);faceResident(key,resident,performance.now(),index++);resident.visible=true;
    }
    const rotationTo=g.quaternion.clone();
    const from=g.position.clone().add(editorOffset.multiplyScalar(g.scale.x/(MODELS[id].editorScale||1)));
    homeCamera.position.copy(from);homeCamera.lookAt(g.position);g.quaternion.copy(rotationFrom);
    await new Promise(done=>homeTransition={id,start:performance.now(),duration:1400,from,to:destination.position.clone(),targetFrom:g.position.clone(),target:destination.target.clone(),rotationFrom,rotationTo,done});
  }
  homeCamera.position.copy(destination.position);homeControls.target.copy(destination.target);
  homeControls.autoRotate=false;homeControls.update();homeControls.enabled=true;homeOrbitResume=performance.now()+1800;
  document.body.classList.remove('entering');entering=false;
}
function selectPortraitResident(g){
  if(!g)return;current=g;
  document.querySelector('#inkStatus').textContent=`正在涂：${MODELS[g.userData.id].name} · 直接点另一位即可切换`;
}
function leavePortrait(){
  if(!portraitMode)return;
  portraitMode=null;stagePortrait=false;artistStage.group.visible=false;document.body.classList.remove('portrait-mode','portrait-preview','stage-portrait');
  document.querySelector('#portraitToolbar').hidden=true;
  document.querySelector('#saveDesign').textContent='保存设计版本';
  controls.maxDistance=8;camera.far=100;camera.updateProjectionMatrix();controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;portraitUndo=[];
  updateStageMotionUI();
}
function frameCurrentPortrait(){
  if(stagePortrait){const view=stageView(camera.aspect,camera.fov);camera.position.copy(view.position);controls.target.copy(view.target);camera.lookAt(view.target);controls.update();}
  else framePortrait([...modelGroups.values()].filter(g=>g.visible),camera,controls);
}
function shufflePortrait(){
  if(!portraitMode||painting)return;
  portraitLayout=stagePortrait?arrangeStage([...modelGroups].filter(([id])=>progress.unlocked(id)),MODELS,true):arrangePortrait([...modelGroups].filter(([id])=>progress.unlocked(id)),MODELS);
  for(const [id,g]of modelGroups)g.visible=portraitLayout.some(item=>item.id===id);
  if(stagePortrait)stageMotion.setLayout(portraitLayout,modelGroups);
  frameCurrentPortrait();
  document.querySelector('#portraitHint').textContent=`${portraitLayout.length} 位朋友，前后交叠 · 拖动查看，或换一组构图`;
}
async function openPortrait(push=true,withStage=homeScene==='artist-stage'){
  if(entering||painting||sceneChanging)return;
  if(!modelGroups.size)return;
  if(withStage){try{await artistStage.load();}catch{document.querySelector('#universeStatus').textContent='布景加载失败，请重试';return;}}
  const wasStageHome=isHome&&homeScene==='artist-stage'&&withStage;
  stagePortrait=withStage;
  if(isHome)returnView={position:homeCamera.position.clone(),target:homeControls.target.clone()};
  isHome=false;portraitMode='preview';portraitUndo=[];holdResident(null);
  document.body.classList.remove('home-mode');document.body.classList.add('portrait-mode','portrait-preview');
  document.body.classList.toggle('stage-portrait',stagePortrait);artistStage.group.visible=stagePortrait;
  document.querySelector('#universe').hidden=true;document.querySelector('.workspace').hidden=false;
  document.querySelector('.workspace').classList.remove('studio-arrival');
  document.querySelector('#homeBtn').hidden=false;document.querySelector('#portraitToolbar').hidden=false;
  document.querySelector('#portraitConfirm').hidden=false;document.querySelector('#portraitExport').hidden=true;
  homeControls.enabled=false;controls.enabled=true;controls.autoRotate=false;controls.maxDistance=stagePortrait?180:65;
  controls.minPolarAngle=stagePortrait?.6:0;controls.maxPolarAngle=stagePortrait?2.5:Math.PI;
  controls.minAzimuthAngle=stagePortrait?-1.15:-Infinity;controls.maxAzimuthAngle=stagePortrait?1.15:Infinity;
  document.querySelector('#spinBtn').setAttribute('aria-pressed','false');
  viewport=document.querySelector('#viewport');viewport.appendChild(renderer.domElement);
  camera.clearViewOffset();camera.fov=34;camera.far=stagePortrait?300:100;resize();
  if(wasStageHome){
    portraitLayout=stageLayout.map(item=>({...item}));applyStageLayout();
    const factor=stageView(camera.aspect,camera.fov).position.z/stageView(homeCamera.aspect,homeCamera.fov).position.z;
    controls.target.copy(homeControls.target);camera.position.copy(homeCamera.position).sub(homeControls.target).multiplyScalar(factor).add(controls.target);camera.lookAt(controls.target);controls.update();
    document.querySelector('#portraitHint').textContent='原画布景 × 3D 朋友 · 拖动寻找你的合影角度';
  }
  else shufflePortrait();
  if(stagePortrait)stageMotion.setLayout(portraitLayout,modelGroups);
  updateStageMotionUI();
  selectPortraitResident(modelGroups.get(portraitLayout[0].id));
  document.querySelector('#modelName').textContent='宇宙合照';
  for(const g of modelGroups.values()){g.userData.crease.material.uniforms.resolution.value.set(viewport.clientWidth,viewport.clientHeight);g.userData.crease.material.uniforms.width.value=.6+(+document.querySelector('#lineWidth').value)*.25;}
  if(push)history.pushState({},'','#portrait');
}
document.querySelector('#portraitBtn').onclick=()=>openPortrait();
document.querySelector('#portraitShuffle').onclick=shufflePortrait;
document.querySelector('#portraitReposition').onclick=()=>{
  if(!stagePortrait||portraitMode!=='preview'||painting||entering)return;
  portraitLayout=randomizeStagePositions(portraitLayout,[...modelGroups],MODELS);
  stageMotion.setLayout(portraitLayout,modelGroups);
  document.querySelector('#portraitHint').textContent='同一组朋友，换个站位 · 确认后定格，开始涂鸦';
};
document.querySelector('#portraitStageMotion').onclick=()=>{stageMotionEnabled=!stageMotionEnabled;updateStageMotionUI();};
document.querySelector('#portraitConfirm').onclick=()=>{
  if(stagePortrait)portraitLayout=snapshotStageLayout(portraitLayout,modelGroups);
  portraitMode='paint';document.body.classList.remove('portrait-preview');
  updateStageMotionUI();
  document.querySelector('#portraitConfirm').hidden=true;document.querySelector('#portraitExport').hidden=false;
  document.querySelector('#portraitHint').textContent='直接在整组角色上填色、泼洒或涂鸦 · 空白处拖动旋转';
  document.querySelector('#saveDesign').textContent='保存整组设计';
  resize();if(!stagePortrait)frameCurrentPortrait();progress.update();
};
async function restorePortrait(layout){
  await openPortrait(true,layout.some(item=>item.scene==='artist-stage'));portraitLayout=layout;
  for(const [id,g]of modelGroups){const item=layout.find(p=>p.id===id);g.visible=!!item;if(item){g.position.fromArray(item.position);g.scale.setScalar(item.scale);g.quaternion.fromArray(item.quaternion);}}
  frameCurrentPortrait();
  document.querySelector('#portraitConfirm').onclick();
}
document.querySelector('#portraitExport').onclick=async()=>{
  const b=document.querySelector('#portraitExport');b.disabled=true;
  const hint=document.querySelector('#portraitHint');
  try{
    let image=await capturePostcard();
    if(stagePortrait){
      // A theater photo is a white-paper composition, including the open sky.
      const picture=new Image();picture.src=image;await picture.decode();
      const photo=document.createElement('canvas');photo.width=picture.naturalWidth;photo.height=picture.naturalHeight;
      const ctx=photo.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,photo.width,photo.height);ctx.drawImage(picture,0,0);image=photo.toDataURL('image/png');
    }
    const a=document.createElement('a');a.id='portraitDownload';a.href=image;a.download='Doodle-Planet-宇宙合照.png';a.textContent='再次下载';
    hint.replaceChildren(document.createTextNode('合照已生成 · '),a);a.click();
  }catch(error){hint.textContent='合照生成失败，请重试';console.error('Portrait export failed',error);}
  finally{b.disabled=false;}
};
async function initUniverse(){
  controls.enabled=false;
  document.querySelector('#homeMotion').setAttribute('aria-pressed',homeMotion);
  document.querySelector('#homeMotion').textContent=homeMotion?'暂停漂浮 Ⅱ':'继续漂浮 ▷';
  const descriptions=['把月亮藏在耳朵里','今天也不着急发光','睡着也能去旅行','一个接一个的奇思妙想','一棵有自己想法的树','每一个小脸都在笑','轻轻打一拳，好心情','三种表情，三个心情','把散步拉得长长的','踮起脚，向星空打个招呼','坐不住，就去星空散步','带着家，一起去远方','翘着腿，指向下一个奇想','下雨天，也是一颗太阳','举起奇思妙想，庆祝今天','用五根手指，游向天空'];
  Object.entries(MODELS).forEach(([id,m],i)=>{
    const b=document.createElement('button');b.className='resident';b.dataset.resident=id;b.disabled=true;b.setAttribute('aria-label',`为${m.name}填色`);b.title=descriptions[i]??(id==='facestack'?'把今天的表情，一层层叠起来':'盘起身体，露出一口奇思妙想');
    b.style.display='none';
    b.innerHTML=`<span class="resident-caption"><small>${String(i+1).padStart(2,'0')}</small><b>${m.name}</b><span class="visit-arrow">↗</span></span>`;
    b.addEventListener('pointerenter',()=>holdResident(id));b.addEventListener('pointerleave',()=>holdResident(null));
    b.addEventListener('focus',()=>holdResident(id));b.addEventListener('blur',()=>holdResident(null));
    b.addEventListener('click',()=>enterResident(id));document.querySelector('#residentGrid').appendChild(b);
  });
  resize();let ready=0;
  for(const id of Object.keys(MODELS)){
    try{await loadModel(id);layoutResidents();ready++;}
    catch(error){console.error('角色加载失败',id,error);document.querySelector(`[data-resident="${id}"] b`).textContent=MODELS[id].name+' · 加载失败';}
    document.querySelector('#universeStatus').textContent=`${ready} / ${Object.keys(MODELS).length} 位居民已醒来`;
  }
  document.querySelector('#universeStatus').textContent=ready===Object.keys(MODELS).length?'点击星空里的朋友，飞近一点 ↗':'部分居民加载失败，请刷新重试';
  for(const id of modelGroups.keys())document.querySelector(`[data-resident="${id}"]`).disabled=false;
  progress.update();
  document.querySelector('#portraitBtn').disabled=false;
  document.querySelector('[data-scene="artist-stage"]').disabled=false;
  try{if(localStorage.getItem('doodle-home-scene')==='artist-stage')await switchHomeScene('artist-stage');}catch{}
  const id=location.hash.replace('#paint=','');if(MODELS[id])await enterResident(id,false,false);
  else if(location.hash==='#portrait')await openPortrait(false);
  if(isHome)window.scrollTo(0,0);
}
document.querySelector('#homeBtn').addEventListener('click',()=>showUniverse());
document.querySelector('#convergenceBtn').addEventListener('click',()=>{
  if(entering)return;
  homeZoomDistance=null;homeCamera.position.set(0,1.2,11.8);homeControls.target.set(0,0,0);homeMotion=false;homeControls.autoRotate=false;homeControls.update();holdResident(null);
  document.querySelector('#homeMotion').setAttribute('aria-pressed','false');document.querySelector('#homeMotion').textContent='继续漂浮 ▷';
});
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();showUniverse();});
document.querySelector('#homeMotion').addEventListener('click',()=>{if(homeScene==='artist-stage')stageMotionEnabled=!stageMotionEnabled;else homeMotion=!homeMotion;updateStageMotionUI();});
addEventListener('popstate',()=>{const id=location.hash.replace('#paint=','');if(MODELS[id])enterResident(id,false,false);else if(location.hash==='#portrait')openPortrait(false);else showUniverse(false);});
const progress=await createProgress({models:MODELS,groups:modelGroups,current:()=>isHome?null:current,enter:enterResident,enterGroup:restorePortrait,refresh:()=>{},onComplete:id=>journey.complete(id)});
const portrait=createCharacterPortraits({groups:modelGroups,models:MODELS,paperMaterial,partMaterial});
const journey=createJourney({models:MODELS,progress,current:()=>isHome?null:current,capture:capturePostcard,enter:enterResident,portrait});
const saveSingleDesign=document.querySelector('#saveDesign').onclick;
document.querySelector('#saveDesign').onclick=async()=>{
  if(!portraitMode){saveSingleDesign();return;}
  const b=document.querySelector('#saveDesign');b.disabled=true;
  try{await progress.savePortrait(portraitLayout,[...modelGroups.values()].filter(g=>g.visible));b.textContent='✓ 整组已保存';}
  catch{b.textContent='保存失败，请重试';}
  finally{b.disabled=false;}
};
animate(); initUniverse();

// Hand-drawn, two-depth parallax sky.
const starCanvas = document.querySelector('#starfield');
const ctx = starCanvas.getContext('2d');
let stars = [], mouse = {x:0,y:0};
function seedStars(){
  const dpr=Math.min(devicePixelRatio,2); starCanvas.width=innerWidth*dpr;starCanvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  stars=Array.from({length:Math.floor(innerWidth/18)},(_,i)=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*3+1,d:Math.random(),tw:Math.random()*6}));
}
function drawStars(t){
  if(isHome){ctx.clearRect(0,0,innerWidth,innerHeight);requestAnimationFrame(drawStars);return;}
  ctx.clearRect(0,0,innerWidth,innerHeight);ctx.lineCap='round';
  stars.forEach((s,i)=>{const x=s.x+mouse.x*(.006+s.d*.018),y=s.y+mouse.y*(.006+s.d*.018),pulse=.7+Math.sin(t*.001+s.tw)*.25;ctx.strokeStyle='#000';ctx.globalAlpha=(.2+s.d*.55)*pulse;ctx.lineWidth=.8+s.d*1.5;ctx.beginPath();ctx.moveTo(x-s.r*(1+s.d),y);ctx.quadraticCurveTo(x,y+s.d,x+s.r*(1+s.d),y);ctx.moveTo(x,y-s.r*(1+s.d));ctx.quadraticCurveTo(x+s.d,y,x,y+s.r*(1+s.d));ctx.stroke();});ctx.globalAlpha=1;requestAnimationFrame(drawStars)
}
addEventListener('pointermove',e=>{mouse.x=e.clientX-innerWidth/2;mouse.y=e.clientY-innerHeight/2});addEventListener('resize',seedStars);seedStars();drawStars(0);
