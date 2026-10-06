import * as THREE from 'three';

// A visual encounter, never a paint stroke or a progress event.
export function createMeteorEncounters(scene,random=Math.random,initialDelay=3){
  const root=new THREE.Group();scene.add(root);root.visible=false;
  const rock=new THREE.Group();root.add(rock);
  const geo=new THREE.IcosahedronGeometry(.12,0);
  rock.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffffff})));
  rock.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x666666})));
  const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:24},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:0x999999,transparent:true,opacity:.5}));root.add(trail);
  const sparks=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(48),3)),new THREE.LineBasicMaterial({color:0x777777,transparent:true}));root.add(sparks);
  rock.visible=false;trail.visible=false;sparks.visible=false;
  const ray=new THREE.Raycaster();let wait=initialDelay,flight=null,flash=0,last=null;
  function point(u,end){return new THREE.Vector3().copy(flight.start).multiplyScalar((1-u)**2).addScaledVector(flight.control,2*u*(1-u)).addScaledVector(end,u*u);}
  function reset(){if(flight)flight.g.userData.meteorIncoming=false;flight=null;wait=7+random()*6;rock.visible=false;trail.visible=false;}
  return {root,update(dt,{moving,groups,held,camera,scale=1}){
    root.visible=moving;if(!moving)return;
    dt=Math.min(.05,Math.max(0,dt));
    flash=Math.max(0,flash-dt);sparks.visible=flash>0;sparks.material.opacity=flash/.5;
    if(!flight){
      wait-=dt;if(wait>0)return;
      const candidates=[...groups].filter(([id,g])=>{const p=g.position.clone().project(camera);return id!==held&&!g.userData.meteorIncoming&&!(g.userData.impactSpin>.4)&&g.visible&&Math.abs(p.x)<.85&&Math.abs(p.y)<.85&&p.z<1;});
      if(!candidates.length){wait=3;return;}
      const [id,g]=candidates[Math.floor(random()*candidates.length)];
      g.userData.meteorIncoming=true;
      const side=new THREE.Vector3(random()<.5?-1:1,.3+random()*.5,.2).applyQuaternion(camera.quaternion).normalize();
      const start=g.position.clone().addScaledVector(side,8*scale);
      flight={id,g,start,control:g.position.clone().addScaledVector(side,4*scale).add(new THREE.Vector3(0,2*scale,0)),age:0};
      last=start.clone();rock.visible=true;trail.visible=true;rock.scale.setScalar(scale);
    }
    if(flight.id===held||!flight.g.visible){reset();return;}
    flight.age+=dt;const u=Math.min(1,flight.age/2.7),end=flight.g.position.clone(),p=point(u,end);
    flight.g.updateWorldMatrix(true,true);
    const direction=p.clone().sub(last),distance=direction.length();
    let hit=null;
    if(distance>1e-8){ray.set(last,direction.normalize());ray.far=distance+.025*scale;hit=ray.intersectObject(flight.g.userData.mesh,false)[0];}
    if(hit){
      const axis=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(.3,1,.4)).normalize();
      flight.g.userData.impactAxis=axis;flight.g.userData.impactSpin=3.4;
      const a=sparks.geometry.attributes.position;
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,v=new THREE.Vector3(Math.cos(angle),Math.sin(angle),0).applyQuaternion(camera.quaternion);const x=hit.point.clone().addScaledVector(v,.10*scale),y=hit.point.clone().addScaledVector(v,.27*scale);a.setXYZ(i*2,x.x,x.y,x.z);a.setXYZ(i*2+1,y.x,y.y,y.z);}
      a.needsUpdate=true;sparks.geometry.computeBoundingSphere();flash=.5;sparks.visible=true;reset();return;
    }
    rock.position.copy(p);rock.rotation.x+=dt*2;rock.rotation.y+=dt*1.4;
    const a=trail.geometry.attributes.position;
    for(let i=0;i<24;i++){const q=point(Math.max(0,u-i*.004),end);a.setXYZ(i,q.x,q.y,q.z);}a.needsUpdate=true;trail.geometry.computeBoundingSphere();last.copy(p);
    if(u===1)reset();
  }};
}
