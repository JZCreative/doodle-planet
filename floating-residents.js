import * as THREE from 'three';

// Conservative spherical colliders; stable IDs preserve motion on resize/editor return.
export function createFloatingResidents(){
  const bodies=new Map(),radius=8.6,normal=new THREE.Vector3();
  let held=null;
  function ensure(id,size){
    if(bodies.has(id))return;
    const r=size*1.34;
    let p=new THREE.Vector3(),best=-Infinity;
    // Random best-candidate placement also avoids initial screen-space piles.
    for(let tries=0;tries<160;tries++){
      const candidate=new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random())*(radius-r));
      if([...bodies.values()].some(b=>candidate.distanceTo(b.p)<r+b.r+.65))continue;
      const project=v=>new THREE.Vector2(v.x,v.y).multiplyScalar(24/(24-v.z));
      const score=Math.min(...[...bodies.values()].map(b=>project(candidate).distanceTo(project(b.p))),20);
      if(score>best){best=score;p.copy(candidate);}
    }
    bodies.set(id,{p:p.clone(),v:new THREE.Vector3().randomDirection().multiplyScalar(.34+Math.random()*.20),r});
  }
  function update(dt,moving){
    if(!moving)return;
    dt=Math.min(.05,Math.max(0,dt));
    const list=[...bodies.entries()];
    for(const [id,b] of list)if(id!==held)b.p.addScaledVector(b.v,dt);
    // Resolve overlap before exchanging only approaching normal velocities.
    for(let iteration=0;iteration<3;iteration++){
      for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
        const [aid,a]=list[i],[bid,b]=list[j];normal.subVectors(b.p,a.p);
        const d=normal.length(),limit=a.r+b.r;if(d>=limit)continue;
        if(d<1e-7)normal.set(1,0,0);else normal.divideScalar(d);
        const wa=aid===held?0:1,wb=bid===held?0:1,total=wa+wb;if(!total)continue;
        const depth=(limit-d+.0001)/total;
        a.p.addScaledVector(normal,-depth*wa);b.p.addScaledVector(normal,depth*wb);
        const relative=b.v.clone().multiplyScalar(wb).sub(a.v.clone().multiplyScalar(wa)).dot(normal);
        if(relative<0){const impulse=-2*relative/total;a.v.addScaledVector(normal,-impulse*wa);b.v.addScaledVector(normal,impulse*wb);}
      }
      for(const [id,b] of list){
        const limit=radius-b.r,d=b.p.length();
        if(d>limit){normal.copy(b.p).divideScalar(d);b.p.copy(normal).multiplyScalar(limit);const outward=b.v.dot(normal);if(outward>0)b.v.addScaledVector(normal,-2*outward);}
        if(b.v.length()>.62)b.v.setLength(.62);
      }
    }
  }
  return {ensure,update,bodies,radius,hold(id){held=id;},position(id,scale){return bodies.get(id).p.clone().multiplyScalar(scale);}};
}
