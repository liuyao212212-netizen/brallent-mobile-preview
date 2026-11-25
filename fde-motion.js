// A stationary desk connects the five scenes as the visitor swipes.
(() => {
  const deck=document.querySelector('.fde-stage-deck');
  if (!deck) return;
  const viewport=deck.parentElement;
  const canvas=viewport.querySelector('.collab-canvas');
  const ctx=canvas.getContext('2d');
  if (!ctx) return;
  const scenes=[...deck.querySelectorAll('.collab-scene')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const buttons=scenes.map(scene=>[...scene.querySelectorAll('button')]);
  const tones=[[185,222,231],[206,207,244],[173,225,210],[236,220,190],[194,213,241]];
  let active=-1, beat=0, start=0, stepAt=0, manual=false, visible=false, frame=0, stride=0, last=-100;

  const stills=scenes.map(scene=>scene.querySelector('.scene-still'));
  const focus=[
    [[.18,.75],[.55,.73],[.80,.69]],
    [[.26,.75],[.51,.82],[.75,.85]],
    [[.32,.65],[.62,.82],[.65,.60]],
    [[.30,.75],[.51,.61],[.81,.84]],
    [[.30,.72],[.50,.59],[.76,.76]]
  ];
  function drawDesk(index,position,now) {
    const scene=scenes[index], action=buttons[index][beat];
    const progress=motion.matches ? 1 : Math.min(1,Math.max(0,(now-stepAt)/680));
    const ease=1-(1-progress)**3;
    const previous=focus[index][Math.max(0,beat-1)], point=focus[index][beat];
    const x=previous[0]+(point[0]-previous[0])*ease, y=previous[1]+(point[1]-previous[1])*ease;
    const lower=Math.floor(position),upper=Math.min(lower+1,scenes.length-1);
    const blend=position-lower;
    ctx.fillStyle='#102238';ctx.fillRect(0,0,390,242);
    function shot(image,opacity) {
      if(!image.complete || !image.naturalWidth || opacity<=0) return;
      const zoom=motion.matches ? 1 : 1.035;
      const w=390*zoom,h=195*zoom;
      ctx.save();ctx.beginPath();ctx.rect(0,0,390,195);ctx.clip();ctx.globalAlpha=opacity;
      ctx.translate(-(w-390)*x,-(h-195)*y);
      if (motion.matches || progress===1) {
        ctx.drawImage(image,0,0,w,h);
      } else {
        // Anchor both edges of the scene while the selected teammate dips toward the shared document.
        const slices=64,iw=image.naturalWidth,ih=image.naturalHeight;
        const activeX=[.22,.53,.83][beat],pulse=Math.sin(progress*Math.PI);
        for(let k=0;k<slices;k++) {
          const u=(k+.5)/slices;
          const shift=3.8*pulse*Math.exp(-((u-activeX)**2)/.012);
          const mid=h*.70+shift,sx=k*iw/slices,dx=k*w/slices;
          ctx.drawImage(image,sx,0,iw/slices,ih*.70,dx,0,w/slices+.25,mid);
          ctx.drawImage(image,sx,ih*.70,iw/slices,ih*.30,dx,mid,w/slices+.25,h-mid);
        }
      }
      ctx.restore();
    }
    shot(stills[lower],1);
    if (upper!==lower) shot(stills[upper],blend);
    const [r,g,b]=tones[lower].map((c,i)=>Math.round(c+(tones[upper][i]-c)*blend));
    // Reflected light travels along the glass desk to the colleague taking over.
    const cx=390*x,cy=195*y;
    const glow=ctx.createRadialGradient(cx,cy,1,cx,cy,43);
    glow.addColorStop(0,'rgba('+[r,g,b]+',.35)');glow.addColorStop(.34,'rgba('+[r,g,b]+',.13)');glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;ctx.fillRect(cx-43,cy-43,86,86);
    const strip=ctx.createLinearGradient(0,0,390,0);
    strip.addColorStop(0,'#0b1b2e');strip.addColorStop(1,'#203b54');
    ctx.fillStyle=strip;ctx.fillRect(0,195,390,47);
    ctx.fillStyle='rgb('+[r,g,b]+')';ctx.fillRect(15,205,2,26);
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.font='600 12px system-ui,sans-serif';ctx.fillText(action.dataset.role+'  ·  '+scene.dataset.document,25,207);
    ctx.fillStyle='#fff';ctx.font='600 15px system-ui,sans-serif';ctx.fillText(action.dataset.line,25,227);
  }
  for(const image of stills) image.addEventListener('load',schedule);
  const loadNearby=new IntersectionObserver(([entry])=>{
    if(!entry.isIntersecting) return;
    stills.forEach(image=>{image.loading='eager';});
    loadNearby.disconnect();
  },{rootMargin:'440px 0px'});
  loadNearby.observe(viewport);
  function setBeat(index,n,now) {
    beat=n;stepAt=now;
    buttons[index].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===n)));
  }
  function schedule() {
    if(visible&&!document.hidden&&!frame) frame=requestAnimationFrame(render);
  }
  function render(now) {
    frame=0;
    if(!visible||document.hidden||!stride) return;
    const position=Math.max(0,Math.min(scenes.length-1,deck.scrollLeft/stride));
    const index=Math.round(position);
    if(active!==index) {active=index;manual=false;start=now;setBeat(index,0,now);}
    const nextBeat=motion.matches || manual?beat:Math.min(2,Math.floor((now-start)/2400));
    if(nextBeat!==beat) setBeat(index,nextBeat,now);
    if(now-last>32 || motion.matches) {drawDesk(index,position,now);last=now;}
    else {schedule();return;}
    if(!motion.matches && ((!manual && beat<2) || now-stepAt<700)) schedule();
  }
  function resize() {
    const width=scenes[0].getBoundingClientRect().width;
    stride=deck.children[1].getBoundingClientRect().left-deck.children[0].getBoundingClientRect().left;
    viewport.style.setProperty('--desk-width',width+'px');
    canvas.width=Math.max(1,Math.round(width*Math.min(devicePixelRatio,2)));
    canvas.height=Math.round(canvas.width*242/390);
    ctx.setTransform(canvas.width/390,0,0,canvas.height/242,0,0);
    schedule();
  }
  viewport.classList.add('with-desk');canvas.hidden=false;
  scenes.forEach((scene,i)=>{
    scene.querySelector('.collab-actions').hidden=false;
    buttons[i].forEach((button,j)=>button.addEventListener('click',()=>{
      manual=true;setBeat(i,j,performance.now());schedule();
    }));
  });
  new ResizeObserver(resize).observe(scenes[0]);resize();
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(canvas);
  deck.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);
})();

// The touch scroller and radio controls are two ways to open the same document.
(() => {
  const bench=document.querySelector('.deliver-bench');
  if (!bench) return;
  const track=bench.querySelector('.deliver-pages');
  const pages=[...track.children];
  const radios=[...bench.querySelectorAll('input[type=radio]')];
  const seam=bench.nextElementSibling;
  const phone=matchMedia('(max-width:680px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=value=>Math.max(0,Math.min(1,value));
  let nearSeam=false, frame=0;

  function render() {
    frame=0;
    if (!phone.matches || !track.clientWidth) return;
    const position=track.scrollLeft/track.clientWidth;
    const current=Math.max(0,Math.min(pages.length-1,Math.round(position)));
    radios[current].checked=true;
    pages.forEach((page,i)=>{
      page.inert=i!==current;
      const offset=Math.max(-1,Math.min(1,i-position));
      page.style.setProperty('--page-angle', (offset*16)+'deg');
    });
    seam.style.setProperty('--review-weight', clamp(position-(pages.length-2)));
    if (nearSeam) {
      const progress=clamp((innerHeight*.86-seam.getBoundingClientRect().top)/(innerHeight*.38));
      seam.style.setProperty('--travel', reduced.matches ? 1 : progress);
    }
  }
  function schedule() {
    if (!frame && phone.matches) frame=requestAnimationFrame(render);
  }
  function configure() {
    const selected=radios.findIndex(radio=>radio.checked);
    bench.classList.toggle('folio',phone.matches);
    if (phone.matches) {
      track.scrollLeft=Math.max(0,selected)*track.clientWidth;
      schedule();
    } else {
      pages.forEach(page=>{page.inert=false;});
    }
  }
  radios.forEach((radio,i)=>radio.addEventListener('change',()=>{
    if (phone.matches && radio.checked) {
      track.scrollTo({left:i*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});
    }
  }));
  // Lock only horizontal drags. Vertical gestures stay with the page.
  let drag=null;
  function begin(x,y) {
    if (phone.matches) drag={x,y,left:track.scrollLeft,active:false};
  }
  function move(x,y) {
    if (!drag) return false;
    const dx=x-drag.x,dy=y-drag.y;
    if (!drag.active) {
      if (Math.max(Math.abs(dx),Math.abs(dy))<6) return false;
      if (Math.abs(dy)>=Math.abs(dx)) {drag=null;return false;}
      drag.active=true;track.classList.add('turning');
    }
    track.scrollLeft=drag.left-dx;
    return true;
  }
  function finish(cancelled) {
    const gesture=drag;
    drag=null;
    if (!gesture?.active) return;
    const delta=track.scrollLeft-gesture.left;
    const from=Math.round(gesture.left/track.clientWidth);
    const step=cancelled || Math.abs(delta)<track.clientWidth*.14 ? 0 : Math.sign(delta);
    const to=Math.max(0,Math.min(pages.length-1,from+step));
    track.classList.remove('turning');
    track.scrollTo({left:to*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});
  }
  track.addEventListener('touchstart',event=>{
    if(event.touches.length===1) begin(event.touches[0].clientX,event.touches[0].clientY);
    else finish(true);
  },{passive:true});
  track.addEventListener('touchmove',event=>{
    const point=event.touches[0];
    if(point && event.touches.length===1 && move(point.clientX,point.clientY) && event.cancelable) event.preventDefault();
  },{passive:false});
  track.addEventListener('touchend',()=>finish(false));
  track.addEventListener('touchcancel',()=>finish(true));
  track.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse' && event.button===0) begin(event.clientX,event.clientY);
  });
  track.addEventListener('pointermove',event=>{
    if(event.pointerType==='mouse' && move(event.clientX,event.clientY)) track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointerup',event=>{if(event.pointerType==='mouse') finish(false);});
  track.addEventListener('pointercancel',event=>{if(event.pointerType==='mouse') finish(true);});
  track.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('scroll',()=>{if(nearSeam) schedule();},{passive:true});
  new IntersectionObserver(([entry])=>{nearSeam=entry.isIntersecting;schedule();},
    {rootMargin:'80px 0px'}).observe(seam);
  new ResizeObserver(schedule).observe(track);
  phone.addEventListener('change',configure);
  reduced.addEventListener('change',schedule);
  configure();
})();
