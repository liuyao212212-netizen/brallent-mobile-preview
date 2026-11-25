// Original process schematics. Coordinates share a fixed view so the three captions
// stay aligned at every viewport size. Only visible schematics request frames.
(() => {
  const figures = [...document.querySelectorAll('.fde-signal')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Each surface is sampled as fine luminous filaments. All scenes share the
  // same camera, so switching steps feels like exploring one space.
  const turn = 2 * Math.PI;
  const palettes = [
    ['#67c7ff','#b39aff','#ffd197'], ['#8c9eff','#7de8f4','#e5e0ff'],
    ['#679dfe','#6df0d7','#e2fffb'], ['#80ddec','#c69eff','#fff2d3'],
    ['#74b1ff','#a998ff','#9ff2e0']
  ];
  function paintStars(ctx, stage, phase) {
    const [blue,lilac,white] = palettes[stage-1];
    const theta = phase * turn;
    const {sin,cos,exp} = Math;
    ctx.clearRect(0,0,390,206);
    function halo(x,y,r,color) {
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
    }
    halo(185,107,105,blue+'27');
    halo(235,79,90,lilac+'19');
    for(let n=1;n<118;n++) {
      const x=(n*153.37)%390, y=(n*n*17.63)%206;
      ctx.globalAlpha=.2+.31*(1+sin(n+theta))/2;
      ctx.fillStyle=n%4?blue:white;
      ctx.fillRect(x,y,n%8?.85:1.65,n%8?.85:1.65);
    }
    ctx.globalAlpha=1;
    function project(u,v) {
      const a=u*turn, b=v*turn;
      if(stage===1) {
        // Dispersed signals are swept through one diagnostic focus.
        const d=u-.58, width=6+54*(1-exp(-19*d*d));
        return [7+377*u,108+20*sin(a-.55)+width*sin(b+a*.68+.4*sin(theta))];
      }
      if(stage===2) {
        const plane=Math.floor(v*3), f=(v*3)%1;
        return [38+296*u+17*f,144-plane*29-25*u-13*f+18*sin(a+f*1.8+plane*.7+.45*sin(theta))];
      }
      if(stage===3) {
        const radius=35+88*u, orbit=a*1.55+.4*sin(theta);
        return [193+radius*cos(orbit)+(v-.5)*20*cos(orbit),112+.41*radius*sin(orbit)-61*u+(v-.5)*19];
      }
      if(stage===4) {
        const hand=v<.5?1:-1, f=(v*2)%1;
        return [12+365*u,111-21*u+hand*(32*sin(a+.4*sin(theta)))+(f-.5)*(13+16*sin(Math.PI*u))];
      }
      const radius=86+19*cos(b);
      return [195+radius*cos(a)+13*sin(a),101+.45*radius*sin(a)-20*sin(b)+15*cos(a+.4*sin(theta))];
    }
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let j=0;j<40;j++) {
      const v=(j+.3)/40;
      ctx.beginPath();
      for(let n=0;n<=85;n++) {
        const [x,y]=project(n/85,v);
        if(n===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.lineWidth=j%9===0?1.05:.6;
      ctx.strokeStyle=(j<20?blue:lilac)+(j%9===0?'a8':'66');
      ctx.stroke();
      const u=(phase+j*.087)%1;
      const [x,y]=project(u,v);
      ctx.fillStyle=j%5?white:blue;
      ctx.beginPath();ctx.arc(x,y,j%5?.8:1.65,0,turn);ctx.fill();
    }
    const u=stage===1?.58:phase;
    const [x,y]=project(u,.45);
    halo(x,y,18,white+'ac');
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,2.1,0,turn);ctx.fill();
    ctx.restore();
  }

  const visible = new Set();
  const contexts = new Map();
  const observer = new IntersectionObserver(entries=>{
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    schedule();
  },{threshold:.1});
  let frame=0, last=0;
  function draw(figure,t) {
    const ctx=contexts.get(figure);
    const canvas=ctx.canvas;
    const width=Math.round(figure.clientWidth*Math.min(devicePixelRatio,2));
    if (!width) return;
    const stage=Number(figure.dataset.stage);
    const frameHeight=206;
    const height=Math.round(width*frameHeight/390);
    if(canvas.width!==width || canvas.height!==height) {
      canvas.width=width;canvas.height=height;
    }
    ctx.setTransform(width/390,0,0,height/frameHeight,0,0);
    paintStars(ctx,stage,t);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    if (motion.matches || document.hidden || !visible.size) return;
    frame=requestAnimationFrame(animate);
  }
  function animate(now) {
    if(now-last>=40) {
      visible.forEach(figure=>draw(figure,(now%4400)/4400));
      last=now;
    }
    frame=requestAnimationFrame(animate);
  }
  const resize=new ResizeObserver(entries=>entries.forEach(e=>draw(e.target,.42)));
  figures.forEach(figure=>{
    const ctx=figure.querySelector('canvas').getContext('2d');
    if(!ctx) return;
    contexts.set(figure,ctx);
    figure.classList.add('drawn');
    resize.observe(figure);observer.observe(figure);
    function spotlight(event) {
      if(motion.matches) return;
      const rect=figure.getBoundingClientRect();
      figure.style.setProperty('--light-x', (event.clientX-rect.left)+'px');
      figure.style.setProperty('--light-y', (event.clientY-rect.top)+'px');
    }
    function release() {
      figure.style.removeProperty('--light-x');figure.style.removeProperty('--light-y');
    }
    figure.addEventListener('pointerdown',spotlight,{passive:true});
    figure.addEventListener('pointermove',spotlight,{passive:true});
    for(const event of ['pointerleave','pointercancel','pointerup']) figure.addEventListener(event,release);
  });
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',()=>{
    if(motion.matches) contexts.forEach((_,figure)=>draw(figure,.42));
    schedule();
  });
})();
