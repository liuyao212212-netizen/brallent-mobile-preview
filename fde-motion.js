// The native scroll position controls the geometry of one stationary light field.
(() => {
  const viewport = document.querySelector('.fde-stage-viewport');
  if (!viewport) return;
  const deck = viewport.querySelector('.fde-stage-deck');
  const firstFigure = deck.querySelector('.fde-stars');
  const canvas = viewport.querySelector('.fde-shared-sky');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Each surface is sampled as fine luminous filaments. All scenes share the
  // same camera, so switching steps feels like exploring one space.
  const turn = 2 * Math.PI;
  const palettes = [
    ['#407ce9','#9166cf','#8761cc'], ['#7668d4','#34aeb5','#3f8bab'],
    ['#3574db','#1bb3a2','#3064b6'], ['#3898b4','#a467bd','#896ab6'],
    ['#386fd1','#7465d8','#318e9a']
  ];
  function mix(a,b,t) { return a+(b-a)*t; }
  function mixColor(a,b,t) {
    if (!t) return a;
    const channels = [1,3,5].map(i => Math.round(mix(
      parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t
    )).toString(16).padStart(2,'0'));
    return '#' + channels.join('');
  }
  function paintStars(position,phase) {
    const index=Math.floor(position);
    const next=Math.min(index+1,palettes.length-1);
    const fraction=position-index;
    const blend=fraction*fraction*(3-2*fraction);
    const [blue,lilac,white]=palettes[index].map((c,i)=>mixColor(c,palettes[next][i],blend));
    const theta = phase * turn;
    const {sin,cos,exp} = Math;
    ctx.clearRect(0,0,390,206);
    function halo(x,y,r,color) {
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
    }
    function pane(x,y,w,h,fill,angle) {
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(-w/2,-h/2,w,h,11);
      else ctx.rect(-w/2,-h/2,w,h);
      ctx.shadowColor='#41538624';ctx.shadowBlur=13;ctx.shadowOffsetY=5;
      ctx.fillStyle=fill;ctx.fill();ctx.shadowColor='transparent';
      ctx.strokeStyle='#ffffffdb';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
    halo(100,94,116,blue+'42');
    halo(268,96,102,lilac+'45');
    const sway=sin(theta),depth=sin(position*.85);
    pane(243+depth*6,75-2*sway,184,101,'#ffffff55',.05);
    pane(143-depth*5,115+sway*2,195,105,'#ffffff65',-.09);
    pane(195,102,260,138,'#fafdff9c',-.035);
    function shape(stage,u,v) {
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
    function project(u,v) {
      const start=shape(index+1,u,v);
      if (!blend) return start;
      const end=shape(next+1,u,v);
      return [mix(start[0],end[0],blend),mix(start[1],end[1],blend)];
    }
    ctx.save();
    ctx.translate(38,12);ctx.scale(.80,.85);
    for(let j=0;j<40;j++) {
      const v=(j+.3)/40;
      ctx.beginPath();
      for(let n=0;n<=85;n++) {
        const [x,y]=project(n/85,v);
        if(n===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.lineWidth=j%9===0?1.05:.6;
      ctx.strokeStyle=(j<20?blue:lilac)+(j%9===0?'e0':'76');
      ctx.stroke();
      const u=(phase+j*.087)%1;
      const [x,y]=project(u,v);
      ctx.fillStyle=j%5?white:blue;
      ctx.beginPath();ctx.arc(x,y,j%5?.8:1.65,0,turn);ctx.fill();
    }
    const sweep=(1-cos(theta))/2;
    const u=mix(index===0?.58:sweep,next===0?.58:sweep,blend);
    const [x,y]=project(u,.45);
    halo(x,y,18,white+'ac');
    ctx.fillStyle=white;ctx.beginPath();ctx.arc(x,y,2.1,0,turn);ctx.fill();
    ctx.restore();
    const notes=['定位业务卡点','确认实施方案','上线首个场景','团队独立操作','复盘运行反馈'];
    const tagX=291+depth*4,tagY=155+2*sway;
    pane(tagX,tagY,101,30,'#ffffffed',0);
    ctx.fillStyle=blue;ctx.beginPath();ctx.arc(tagX-36,tagY,3,0,turn);ctx.fill();
    ctx.font='600 12px system-ui,sans-serif';ctx.textBaseline='middle';
    ctx.fillStyle='#26334c';ctx.globalAlpha=Math.abs(1-2*blend);
    ctx.fillText(notes[blend<.5?index:next],tagX-26,tagY);ctx.globalAlpha=1;

  }


  let stride=0, visible=false, frame=0, last=0, lastPosition=-1;
  function render(now) {
    frame=0;
    if (!visible || document.hidden || !stride) return;
    const raw=Math.max(0, Math.min(palettes.length-1,deck.scrollLeft/stride));
    const position=motion.matches ? Math.round(raw) : raw;
    // Track each scroll frame; idle twinkling can run at a lower frame rate.
    if(position!==lastPosition || now-last>=40) {
      paintStars(position,motion.matches ? .42 : (now%4400)/4400);
      lastPosition=position;
      last=now;
    }
    if (!motion.matches) schedule();
  }
  function schedule() {
    if (visible && !document.hidden && !frame) frame=requestAnimationFrame(render);
  }
  function resize() {
    const width=firstFigure.getBoundingClientRect().width;
    if (!width) return;
    stride=deck.children[1].getBoundingClientRect().left - deck.children[0].getBoundingClientRect().left;
    viewport.style.setProperty('--sky-width',width+'px');
    canvas.width=Math.round(width*Math.min(devicePixelRatio,2));
    canvas.height=Math.round(canvas.width*206/390);
    ctx.setTransform(canvas.width/390,0,0,canvas.height/206,0,0);
    lastPosition=-1;
    schedule();
  }
  viewport.classList.add('with-sky');
  canvas.hidden=false;
  new ResizeObserver(resize).observe(firstFigure);
  new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    schedule();
  }).observe(canvas);
  deck.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',()=>{lastPosition=-1;schedule();});

  function spotlight(event) {
    if (motion.matches) return;
    const rect=canvas.getBoundingClientRect();
    if(event.clientY<rect.top || event.clientY>rect.bottom || event.clientX>rect.right) {
      release();return;
    }
    viewport.style.setProperty('--light-x',(event.clientX-rect.left)+'px');
    viewport.style.setProperty('--light-y',(event.clientY-rect.top)+'px');
  }
  function release() {
    viewport.style.removeProperty('--light-x');viewport.style.removeProperty('--light-y');
  }
  deck.addEventListener('pointerdown',spotlight,{passive:true});
  deck.addEventListener('pointermove',spotlight,{passive:true});
  for(const event of ['pointerleave','pointercancel','pointerup']) deck.addEventListener(event,release);
})();
