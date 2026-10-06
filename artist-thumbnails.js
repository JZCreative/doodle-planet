// Display the supplied artwork itself, never an AI redraw or 3D render.
export async function installArtistThumbnails(){
  const response=await fetch('./assets/artist/drawings/manifest.json?v=19');
  if(!response.ok)return;
  const drawings=await response.json(),ns='http://www.w3.org/2000/svg';
  for(const [id,art] of Object.entries(drawings)){
    const card=document.querySelector(`[data-model="${id}"]`),slot=card?.querySelector('.model-doodle');
    if(!slot)continue;
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',art.viewBox);svg.setAttribute('aria-hidden','true');
    const image=document.createElementNS(ns,'image');image.setAttribute('href',art.src);image.setAttribute('width',art.width);image.setAttribute('height',art.height);svg.append(image);
    if(id==='sun'||id==='apple'){
      // Convert the grey paper to alpha at display time; retain original artwork files.
      const defs=document.createElementNS(ns,'defs'),filter=document.createElementNS(ns,'filter'),matrix=document.createElementNS(ns,'feColorMatrix');
      filter.id=`original-ink-${id}`;filter.setAttribute('color-interpolation-filters','sRGB');
      matrix.setAttribute('type','matrix');matrix.setAttribute('values','0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.25927 -0.8722 -0.08805 0 1');
      filter.append(matrix);defs.append(filter);svg.prepend(defs);image.setAttribute('filter',`url(#${filter.id})`);
    }
    slot.className='model-doodle artist-drawing';slot.replaceChildren(svg);
  }
}
