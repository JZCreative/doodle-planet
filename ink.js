import * as THREE from 'three';

// Analytic surface decals: evaluated per fragment, never per triangle.
const CAPACITY = 512;
export function attachInk(material, previous = null) {
  const ink = previous || {
    count: { value: 0 }, time: { value: 0 },
    center: { value: Array.from({length:CAPACITY}, () => new THREE.Vector4()) },
    axisX: { value: Array.from({length:CAPACITY}, () => new THREE.Vector3()) },
    axisY: { value: Array.from({length:CAPACITY}, () => new THREE.Vector3()) },
    normal: { value: Array.from({length:CAPACITY}, () => new THREE.Vector3()) },
    color: { value: Array.from({length:CAPACITY}, () => new THREE.Color()) },
    params: { value: Array.from({length:CAPACITY}, () => new THREE.Vector4()) }
  };
  if (!ink.texture) {
    ink.pixels = new Float32Array(CAPACITY * 6 * 4);
    ink.texture = new THREE.DataTexture(ink.pixels, 6, CAPACITY, THREE.RGBAFormat, THREE.FloatType);
    ink.texture.needsUpdate = true;
  }
  material.onBeforeCompile = shader => {
    shader.uniforms.ink_count = ink.count;
    shader.uniforms.ink_time = ink.time;
    shader.uniforms.ink_data = { value: ink.texture };
    shader.vertexShader = 'varying vec3 inkPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ninkPosition = position;');
    shader.fragmentShader = `
      varying vec3 inkPosition;
      uniform int ink_count;
      uniform float ink_time;
      uniform sampler2D ink_data;
      vec4 inkFetch(int i,float column){return texture2D(ink_data,vec2((column+.5)/6.,(float(i)+.5)/${CAPACITY}.));}
      float inkHash(float n) { return fract(sin(n*127.1)*43758.5453); }
      float inkDisk(vec2 p, float radius) { return length(p)-radius; }
      float inkCapsule(vec2 p, vec2 a, vec2 b, float radius) {
        vec2 d=b-a;float h=clamp(dot(p-a,d)/max(dot(d,d),0.0001),0.,1.);
        return length(p-a-d*h)-radius;
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float brushMask=0.;
      float brushStroke=-1.;
      vec3 brushColor=vec3(1.);
      for(int i=0;i<${CAPACITY};i++) {
        if(i>=ink_count) break;
        float wet=ink_params[i].z;
        float stroke=ink_params[i].w;
        // Composite each complete brush stroke once, preserving paint order.
        if(brushStroke>=0. && (wet>=0. || stroke!=brushStroke)) {
          diffuseColor.rgb=mix(diffuseColor.rgb,brushColor,brushMask);
          brushMask=0.;brushStroke=-1.;
        }
        if(wet<0. && brushStroke<0.) {
          brushStroke=stroke;brushColor=ink_color[i];
        }
        vec3 delta=inkPosition-ink_center[i].xyz;
        float radius=ink_center[i].w;
        float depth=dot(delta,ink_normal[i])/radius;
        if(abs(depth)>1.8 || length(delta)>radius*4.4) continue;
        vec2 p=vec2(dot(delta,ink_axisX[i]),dot(delta,ink_axisY[i]))/radius;
        if(wet<0.) {
          float brushDistance=length(p)-.78;
          float softEdge=max(fwidth(brushDistance),.045);
          float coverage=1.-smoothstep(-softEdge,softEdge,brushDistance);
          coverage*=1.-smoothstep(.8,1.8,abs(depth));
          // Union coverage: no darker rims or pigment buildup between dabs.
          brushMask=max(brushMask,coverage);
          continue;
        }
        float age=max(0.,ink_time-ink_params[i].x);
        float seed=ink_params[i].y;
        float spread=1.-exp(-age*15.);
        float a=atan(p.y,p.x);
        float scallop=sin(a*5.+seed)*.11+sin(a*9.-seed*2.)*.065+sin(a*17.+seed)*.025;
        float d=length(p)-(0.72+scallop)*max(.05,spread);
        // Separate small droplets and tapered radial splash fingers.
        for(int j=0;j<9;j++) {
          float h=inkHash(seed+float(j)*3.13);
          float angle=float(j)*2.39996+seed;
          vec2 dir=vec2(cos(angle),sin(angle));
          vec2 spot=dir*(.98+h*.8)*spread;
          float r=.035+inkHash(seed+float(j)*5.7)*.10;
          d=min(d,inkDisk(p-spot,r*spread));
          if(h>.45) d=min(d,inkCapsule(p,dir*.45*spread,dir*(.8+h*.45)*spread,.025+.025*h));
        }
        float aa=max(fwidth(d),.003);
        float mask=1.-smoothstep(-aa,aa,d);
        // Fades through curved surfaces instead of cutting a hard projection plane.
        mask*=1.-smoothstep(.8,1.8,abs(depth));
        float pigment=.91+.09*sin(p.x*19.+seed)*sin(p.y*23.-seed);
        float rim=1.-smoothstep(.0,.06,abs(d));
        vec3 c=ink_color[i]*(1.-rim*.10);
        diffuseColor.rgb=mix(diffuseColor.rgb,c,mask*mix(pigment,1.,.6));
      }
      if(brushStroke>=0.) diffuseColor.rgb=mix(diffuseColor.rgb,brushColor,brushMask);
    `);
    for(const [field,column,swizzle] of [['center',0,''],['axisX',1,'.xyz'],['axisY',2,'.xyz'],['normal',3,'.xyz'],['color',4,'.xyz'],['params',5,'']]) {
      shader.fragmentShader=shader.fragmentShader.replaceAll(`ink_${field}[i]`,`inkFetch(i,${column}.)${swizzle}`);
    }
  };
  material.customProgramCacheKey = () => 'surface-ink-brush-v3-union';
  return ink;
}

export function stampInk(mesh, ink, hit, color, mode, size) {
  if(ink.count.value >= CAPACITY) return false;
  const i=ink.count.value++;
  const position=mesh.worldToLocal(hit.point.clone());
  const normal=hit.face.normal.clone().normalize();
  const inverse=mesh.getWorldQuaternion(new THREE.Quaternion()).invert();
  const down=new THREE.Vector3(0,-1,0).applyQuaternion(inverse);
  down.addScaledVector(normal,-down.dot(normal));
  if(down.lengthSq()<.02) down.set(0,0,1).addScaledVector(normal,-normal.z);
  if(down.lengthSq()<.02) down.set(1,0,0).addScaledVector(normal,-normal.x);
  down.normalize();
  const right=new THREE.Vector3().crossVectors(down,normal).normalize();
  const now=performance.now()/1000;
  ink.center.value[i].set(position.x,position.y,position.z,size*(mode==='brush'?1:(.85+Math.random()*.25)));
  ink.axisX.value[i].copy(right); ink.axisY.value[i].copy(down); ink.normal.value[i].copy(normal);
  ink.color.value[i].set(color);
  ink.params.value[i].set(now,mode==='brush'?7:Math.random()*100,mode==='brush'?-1:0,ink.strokeSerial || 0);
  for(const [field,column] of [['center',0],['axisX',1],['axisY',2],['normal',3],['color',4],['params',5]]) {
    const value=ink[field].value[i];
    value.toArray(ink.pixels,(i*6+column)*4);
  }
  ink.texture.needsUpdate=true;
  return true;
}
