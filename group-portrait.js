import * as THREE from 'three';

// A dense rectangular collage with alternating foreground/background layers.
export function arrangePortrait(entries,models,random=Math.random){
  const shuffled=[...entries];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const rows=Math.max(1,Math.round(Math.sqrt(shuffled.length/2)));
  const rowCounts=Array.from({length:rows},(_,i)=>Math.floor(shuffled.length/rows)+(i<shuffled.length%rows?1:0));
  const layout=[];
  shuffled.forEach(([id,g],i)=>{
    let row=0,col=i;while(col>=rowCounts[row])col-=rowCounts[row++];
    const count=rowCounts[row];
    const angle=(random()*2-1)*Math.PI;
    g.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),angle).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...models[id].rotation)));
    g.position.set(0,0,0);g.scale.setScalar(1);g.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(g.userData.mesh),size=box.getSize(new THREE.Vector3());
    // Fit the authored silhouette, not its unrotated height: narrow characters
    // become prominent too, while neighboring silhouettes intentionally overlap.
    const scale=(2.65+random()*.30)/Math.max(size.x,size.y);
    const layer=(row+col)%3;
    g.scale.setScalar(scale);
    g.position.set((col-(count-1)/2)*1.65+(random()-.5)*.25,((rows-1)/2-row)*1.48+(random()-.5)*.20,layer*.85-.85);
    g.visible=true;layout.push({id,position:g.position.toArray(),scale,quaternion:g.quaternion.toArray()});
  });
  return layout;
}
export function framePortrait(groups,camera,controls){
  const bounds=new THREE.Box3();
  for(const g of groups){g.updateMatrixWorld(true);bounds.union(new THREE.Box3().setFromObject(g.userData.mesh));}
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const distance=Math.max(size.y/2/tan,size.x/2/(tan*camera.aspect))*1.04+size.z/2;
  camera.position.copy(center).add(new THREE.Vector3(0,0,distance));controls.target.copy(center);camera.lookAt(center);controls.update();
}
