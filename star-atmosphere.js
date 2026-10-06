import * as THREE from 'three';

// Separate backdrop pass: never participates in picking, paint IDs or ink.
export function createStarAtmosphere(){
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xffffff,65,140);
  const themes={wild:new THREE.Group(),dream:new THREE.Group()};
  Object.values(themes).forEach(g=>scene.add(g));
  const cards=[];
  function stroke(group,points,opacity=.24,dashed=false){
    const material=dashed?new THREE.LineDashedMaterial({color:0x747474,dashSize:.26,gapSize:.38}):new THREE.LineBasicMaterial({color:0x747474});
    Object.assign(material,{transparent:true,opacity,depthWrite:false});material.userData.opacity=opacity;
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);
    if(dashed)line.computeLineDistances();group.add(line);return line;
  }
  function anchor(i,n,r){const y=1-2*(i+.5)/n,a=i*2.39996323,s=Math.sqrt(1-y*y);return new THREE.Vector3(Math.cos(a)*s*r,y*r,Math.sin(a)*s*r);}
  // All directions are populated; every shell remains outside the allowed camera orbit.
  for(let i=0;i<34;i++){
    const g=new THREE.Group();g.position.copy(anchor(i,34,46+i%5*6));themes.dream.add(g);cards.push(g);
    const shape=new THREE.Shape();
    if(i%4===0){
      shape.moveTo(.6,1.65);shape.bezierCurveTo(-2.3,1.4,-2.1,-1.8,.6,-1.65);shape.bezierCurveTo(-.6,-.7,-.6,.75,.6,1.65);
      stroke(g,shape.getPoints(64),.34);
    }else{
      shape.moveTo(-3,-.5);shape.bezierCurveTo(-4,.1,-3,1.3,-2,1);shape.bezierCurveTo(-1.8,2.5,.6,2.5,1,1.1);shape.bezierCurveTo(3,1.8,4,.2,2.9,-.5);shape.bezierCurveTo(1,-.8,-1.3,-.8,-3,-.5);
      stroke(g,shape.getPoints(48),.22);
      if(i%3===0)stroke(g,[new THREE.Vector3(-1,.35,0),new THREE.Vector3(-.6,.23,0),new THREE.Vector3(-.2,.35,0)],.27);
    }
    g.scale.setScalar(.6+(i%4)*.23);
  }
  const positions=[];
  for(let i=0;i<420;i++){
    const y=1-2*(i+.5)/420,a=i*2.39996323,r=36+(i%11)*2.8;
    const s=Math.sqrt(1-y*y);
    positions.push(Math.cos(a)*s*r,y*r,Math.sin(a)*s*r);
  }
  const dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),new THREE.PointsMaterial({color:0x6c7582,size:.10,transparent:true,opacity:.65,depthWrite:false}));
  scene.add(dust);
  const orbits=[];
  for(let i=0;i<4;i++){
    const points=[],r=12+i*6;
    // Incomplete ellipses avoid enclosing the entire composition in rings.
    for(let j=0;j<=240;j++){
      const a=(j/240*1.65+.18*i)*Math.PI;
      points.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r*.67,0));
    }
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0x737b88,dashSize:.17+i*.055,gapSize:.26+i*.045,transparent:true,opacity:.48,depthWrite:false}));
    line.computeLineDistances();line.rotation.set(.35+i*.57,-.6+i*.39,.24+i*.83);
    line.position.set((i-1.5)*2,(i%2?1:-1)*3,-8-i*4);
    themes.wild.add(line);line.material.userData.opacity=.48;orbits.push(line);
  }
  const meteors=[];
  for(let i=0;i<3;i++){
    const p=[],colors=[];
    for(let j=0;j<24;j++){
      p.push(-j*.11,j*.043,0);
      const shade=.54+.46*(j/23);colors.push(shade,shade,shade);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const line=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false}));
    themes.wild.add(line);meteors.push(line);
  }
  let clock=0,last=null,selected='wild';
  const weights={wild:1,dream:0};
  return {scene,setTheme(id,immediate=false){
    if(!themes[id])return;selected=id;
    if(immediate)Object.keys(weights).forEach(k=>weights[k]=Number(k===id));
  },update(now,moving,camera){
    const dt=last===null?0:Math.min(100,Math.max(0,now-last));last=now;
    if(moving)clock+=dt;
    for(const [id,g]of Object.entries(themes)){
      weights[id]+=(Number(id===selected)-weights[id])*(1-Math.exp(-dt/240));
      g.visible=weights[id]>.001;
      g.traverse(o=>{if(o.material&&o.material.userData.opacity!==undefined)o.material.opacity=o.material.userData.opacity*weights[id];});
    }
    // Tangent illustrations turn gently with the viewer, never flatten edge-on.
    if(camera)cards.forEach((g,i)=>{
      g.quaternion.copy(camera.quaternion);
      if(g.userData.baseY===undefined)g.userData.baseY=g.position.y;
      g.position.y=g.userData.baseY+Math.sin(clock*.00009+i)*.25;
    });
    dust.rotation.y=clock*.000002;
    meteors.forEach((line,i)=>{
      const phase=((clock+18000-i*6000)%18000)/1800;
      line.visible=moving&&phase<1;
      if(!line.visible)return;
      line.position.set(-16+i*11+phase*9,9-i*6-phase*3.5,-12-i*8);
      line.material.opacity=Math.sin(phase*Math.PI)*.55*weights.wild;
    });
  }};
}
