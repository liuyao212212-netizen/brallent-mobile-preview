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

  function ellipse(x,y,w,h,fill) {
    ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();
  }
  function box(x,y,w,h,r,fill) {
    ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  function stroke(points,color,width) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  }
  function label(content,x,y,size,color,weight=600) {
    ctx.font=weight+' '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(content,x,y);
  }
  function drawDesk(index,position,now) {
    const t=motion.matches?1:Math.min(1,(now-stepAt)/650);
    const reach=Math.sin(Math.max(0,t)*Math.PI/2);
    const human=beat!==1, turn=human?reach:0, ai=human?0:reach;
    const scene=scenes[index], doc=scene.dataset.document;
    const a=Math.floor(position), b=Math.min(a+1,tones.length-1), fade=position-a;
    const tint=tones[a].map((c,i)=>Math.round(c+(tones[b][i]-c)*fade)).join(',');
    const bg=ctx.createLinearGradient(0,0,386,242);
    bg.addColorStop(0,'#f8f8f2');bg.addColorStop(.55,'rgb('+tint+')');bg.addColorStop(1,'#edf1f7');
    ctx.fillStyle=bg;ctx.fillRect(0,0,390,242);
    // Fixed architectural details keep the viewer in the same room.
    const light=ctx.createLinearGradient(0,0,0,195);
    light.addColorStop(0,'#ffffffaa');light.addColorStop(1,'#ffffff18');
    box(22,13,346,140,20,light);
    stroke([[33,153],[356,153]],'#ffffffc4',1);
    ellipse(194,206,163,15,'#34465c1a');
    // Upholstered chair, consultant's jacket, collar, neck and profile.
    box(26,141,57,51,13,'#4d656d');box(296,141,61,51,13,'#566779');
    const suit=ctx.createLinearGradient(42,130,100,188);
    suit.addColorStop(0,'#527d80');suit.addColorStop(1,'#20464d');
    box(44,126,57,62,18,suit);
    box(67,118,17,19,5,'#c78b69');ellipse(75,105,20,24,'#e2ac87');
    ellipse(74,96,20,13,'#292d36');ellipse(59,105,7,13,'#33313a');
    ellipse(80,99,13,7,'#34333a');ellipse(92,107,4,3.4,'#dfaa85');
    ellipse(86,104,1.6,1.7,'#242831');stroke([[88,115],[84,116]],'#9b6050',1.5);
    stroke([[65,131],[75,139],[84,131]],'#d6e1d8',3);
    // The assistant has a ceramic shell, independent gaze and articulated wrists.
    const shell=ctx.createLinearGradient(285,91,341,157);
    shell.addColorStop(0,'#fffefa');shell.addColorStop(.55,'#dce7f1');shell.addColorStop(1,'#94acc3');
    box(286,129,51,58,18,shell);box(300,117,18,14,5,'#708da6');
    box(277,86,63,40,16,shell);box(280,96,46,22,10,'#18384b');
    const eyeOffset=ai?-2:0;
    box(289+eyeOffset,103,4,7,2,'#8df5de');box(308+eyeOffset,103,4,7,2,'#8df5de');
    ellipse(335,107,6,8,'#9eafbe');ellipse(335,107,2.5,4,'#e6f8ff');
    box(299,138,20,6,3,'#527883');box(303,140,6,2,1,'#98f7d9');
    // The shared tabletop and document are in front of both seated figures.
    ctx.fillStyle='#82999e';ctx.beginPath();ctx.moveTo(88,160);ctx.lineTo(301,160);ctx.lineTo(340,191);ctx.lineTo(54,191);ctx.closePath();ctx.fill();
    stroke([[56,191],[339,191]],'#526e77',5);
    stroke([[72,194],[68,207]],'#687d85',4);stroke([[323,194],[328,207]],'#687d85',4);
    ctx.save();ctx.translate(195,143);
    ctx.rotate(-.035+.018*ai);box(-62,-26,124,56,7,'#4b6677');box(-60,-25,120,52,6,'#fcfcf7');
    label(doc,0,-12,13,'#244555');
    if(index===4) {
      stroke([[-43,16],[-27,11],[-10,14],[7,5],[23,8],[38,2]],'#368b78',2.5);
      ellipse(beat===2?38:7,beat===2?2:5,3.2,3.2,'#dd8056');
    } else {
      const fields=[['重复录入','等待确认'],['AI 整理','人工审批'],['正常任务','待复核'],['按提示填写','提交任务']][index];
      fields.forEach((field,j)=>{
        box(-49+j*49,0,46,18,4,j===beat%2?'#d7eee5':'#e9edf1');
        label(field,-26+j*49,9,10,'#285250');
      });
      if(beat===2) stroke([[35,-17],[39,-13],[46,-21]],'#318a71',2.3);
    }
    ctx.restore();
    // Hands meet the actual work surface. The human writes or points, the AI highlights.
    const hx=134+turn*16,hy=167-turn*12;
    stroke([[92,142],[105,160],[hx-8,hy]],'#365f67',10);
    ellipse(hx-2,hy,7,4.4,'#e0ab85');stroke([[hx,hy-1],[hx+10,hy-7]],'#283e50',2.6);
    const rx=259-ai*16,ry=166-ai*12;
    stroke([[291,143],[280,158],[rx,ry]],'#8098b1',10);
    stroke([[290,142],[279,156],[rx,ry-1]],'#e4edf3',6);ellipse(280,157,4,4,'#7390a8');
    ellipse(rx,ry,5.5,4,'#f6fcff');
    // The active speaker owns the bubble and the tail points towards their face.
    const anchor=human?79:310;
    box(54,20,282,40,13,'#ffffffed');
    ctx.fillStyle='#ffffffed';ctx.beginPath();ctx.moveTo(anchor-6,59);ctx.lineTo(anchor+8,59);ctx.lineTo(anchor,70);ctx.closePath();ctx.fill();
    label(buttons[index][beat].dataset.line,195,40,16,'#203847');
    label(scene.dataset.role,73,222,14,'#2a4754');label('AI 助手',310,222,14,'#2a4754');
  }
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
  track.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('scroll',()=>{if(nearSeam) schedule();},{passive:true});
  new IntersectionObserver(([entry])=>{nearSeam=entry.isIntersecting;schedule();},
    {rootMargin:'80px 0px'}).observe(seam);
  new ResizeObserver(schedule).observe(track);
  phone.addEventListener('change',configure);
  reduced.addEventListener('change',schedule);
  configure();
})();
