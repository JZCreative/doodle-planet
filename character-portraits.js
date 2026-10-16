import * as THREE from 'three';

// Isolated preview renderer: never changes the live character or paint camera.
export function createCharacterPortraits({groups,models,paperMaterial,partMaterial}){
  let renderer,color,parts,quad,screen,camera;const cache=new Map();
  function setup(){
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(320,280);renderer.outputColorSpace=THREE.SRGBColorSpace;
    color=new THREE.WebGLRenderTarget(320,280,{samples:4});parts=new THREE.WebGLRenderTarget(320,280);
    const ink=paperMaterial.clone();ink.uniforms.picture.value=color.texture;ink.uniforms.parts.value=parts.texture;ink.uniforms.pixel.value.set(1/320,1/280);ink.uniforms.width.value=1;ink.uniforms.environmentFade.value=0;ink.uniforms.partEdges.value=true;
    screen=new THREE.Scene();quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),ink);screen.add(quad);camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  }
  return async function portrait(id){
    if(cache.has(id))return cache.get(id);
    for(let i=0;!groups.has(id)&&i<150;i++)await new Promise(r=>setTimeout(r,200));
    const original=groups.get(id);if(!original)throw new Error('角色还在赶来');
    if(!renderer)setup();
    const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
    const mesh=new THREE.Mesh(original.userData.mesh.geometry,original.userData.mesh.material);group.add(mesh);group.rotation.set(...models[id].rotation);
    const crease=original.userData.crease.clone();crease.material=original.userData.crease.material.clone();crease.material.uniforms.resolution.value.set(320,280);crease.material.uniforms.width.value=.65;group.add(crease);
    group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(mesh),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const span=Math.max(size.y,size.x*280/320)*1.22;
    const eye=new THREE.OrthographicCamera(-span*320/280/2,span*320/280/2,span/2,-span/2,.01,100);eye.position.copy(center).add(new THREE.Vector3(0,0,10));eye.lookAt(center);
    const ids=partMaterial.clone();ids.uniforms.locked.value=0;ids.uniforms.cutout.value=false;ids.uniforms.cutoutMap.value=null;ids.side=THREE.DoubleSide;crease.visible=false;scene.overrideMaterial=ids;
    renderer.setRenderTarget(parts);renderer.render(scene,eye);scene.overrideMaterial=null;crease.visible=true;
    renderer.setRenderTarget(color);renderer.render(scene,eye);renderer.setRenderTarget(null);renderer.render(screen,camera);
    const image=renderer.domElement.toDataURL('image/png');cache.set(id,image);crease.material.dispose();ids.dispose();return image;
  };
}
