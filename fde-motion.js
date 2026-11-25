// Original process schematics. Coordinates share a fixed view so the three captions
// stay aligned at every viewport size. Only visible schematics request frames.
(() => {
  const figures = [...document.querySelectorAll('.fde-signal')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const ice = '#c6f5ff', mint = '#62efd5', violet = '#b9acff', gold = '#ffc985';
  const shell = '#123349', rim = '#6c9db2';
  const nodes = [75, 195, 315];

  function paint(ctx, stage, t, industry) {
    function line(points, color, width = 1.5) {
      ctx.beginPath();
      points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    function box(x,y,w,h,fill = shell,stroke = rim,r = 4) {
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    function dot(x,y,r,color) {
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    function glow(x,y,color) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      dot(x,y,2.4,color);
      ctx.shadowBlur = 0;
    }
    function trace(points,color,phase = 0) {
      line(points,'#457185',1.3);
      const lengths = points.slice(1).map(([x,y],i) => Math.hypot(x-points[i][0],y-points[i][1]));
      let distance = ((t+phase)%1)*lengths.reduce((a,b)=>a+b,0);
      for (let i=0;i<lengths.length;i++) {
        if (distance <= lengths[i]) {
          const [x,y] = points[i], [dx,dy] = points[i+1];
          glow(x+(dx-x)*distance/lengths[i], y+(dy-y)*distance/lengths[i],color);
          break;
        }
        distance -= lengths[i];
      }
    }
    function tick(x,y,color = mint) {
      line([[x-7,y],[x-2,y+5],[x+8,y-6]],color,2.8);
    }
    function sheet(x,y) {
      box(x-18,y-20,36,40);
      for(let i=0;i<3;i++) line([[x-11,y-10+i*8],[x+8-i*2,y-10+i*8]],i===0?ice:rim,2);
    }
    function panel(x,y) {
      box(x-29,y-20,58,40,'#0d293b',rim);
      line([[x-28,y-11],[x+28,y-11]],'#426676',1);
      [0,1,2].forEach(i=>dot(x-22+i*5,y-15,1.2,i===0?mint:rim));
    }
    function bars(x,y) {
      [11,19,15,23,18].forEach((h,i)=>box(x-19+8*i,y-h,4,h,'#39867f',i===3?mint:rim,1));
    }
    function cursor(x,y,color) {
      const points=[[x,y],[x+4,y+16],[x+7,y+10],[x+14,y+7],[x,y]];
      ctx.beginPath();
      points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.fillStyle=color;
      ctx.fill();
    }

    ctx.clearRect(0,0,390,136);
    ctx.lineJoin='round';
    ctx.lineCap='round';
    // Etched ground plane gives the modules a common physical reference.
    ctx.save();
    ctx.beginPath();ctx.rect(14,46,362,78);ctx.clip();
    for(let x=-180;x<600;x+=31) {
      line([[x,124],[x+129,46]],'#76adbc16',.8);
      line([[x,124],[x-129,46]],'#76adbc16',.8);
    }
    ctx.restore();
    nodes.forEach((x,i)=>{
      const color=[rim,mint,violet][i];
      line([[x-36,96],[x,109],[x+36,96],[x,83],[x-36,96]],'#457586',1);
      line([[x-36,100],[x,113],[x+36,100]],'#325464',1);
      line([[x-9,106],[x,109],[x+9,106]],color,1.6);
    });
    trace([[94,94],[117,85],[141,85],[165,94]],mint);
    trace([[224,94],[246,85],[271,85],[293,94]],violet,.52);
    if (industry) {
      paintIndustry(industry,t,{ctx,line,box,dot,trace,tick,sheet,panel,bars,cursor});
      return;
    }
    const wave = (1-Math.cos(t*2*Math.PI))/2;
    switch(stage) {
      case 1: {
        sheet(66,66);sheet(71,61);sheet(76,56);
        // Trace two alternative routes and scan them for a repeated step.
        panel(195,59);
        line([[172,65],[181,65],[189,56],[205,56],[215,65]],mint);
        line([[181,65],[189,73],[206,73],[215,65]],violet);
        const x=175+39*wave;
        const beam=ctx.createLinearGradient(x-10,0,x,0);
        beam.addColorStop(0,'#64f5dc00');beam.addColorStop(1,'#64f5dc66');
        ctx.fillStyle=beam;ctx.fillRect(x-10,49,10,28);
        line([[x,50],[x,77]],ice);
        line([[291,61],[308,61],[314,52],[326,52],[326,69],[314,69],[308,61]],gold,2);
        [5,12+wave*5].forEach(r=>{ctx.beginPath();ctx.arc(309,61,r,0,Math.PI*2);ctx.strokeStyle=r===5?gold:'#ffc98566';ctx.stroke();});
        break;
      }
      case 2: {
        for(let i=2;i>=0;i--) {
          const y=47+i*10;
          box(53,y,44,15,'#173d50',rim,7);
          ctx.beginPath();ctx.ellipse(75,y+2,22,6,0,0,2*Math.PI);
          ctx.fillStyle='#245568';ctx.fill();ctx.strokeStyle=ice;ctx.stroke();
        }
        for(const y of [41,76]) {
          trace([[168,59],[177,59],[188,y],[202,y],[214,59],[222,59]],y===41?mint:violet,y===41?0:.5);
          box(190,y-5,10,10,'#255065',ice,2);
        }
        [168,222].forEach(x=>dot(x,59,4,mint));
        sheet(312,59);dot(329,71,10,'#17605e');tick(329,71);
        break;
      }
      case 3: {
        [0,1,2].forEach(i=>{
          const x=57+i*18;
          line([[x,40],[x,77]],rim,2);
          box(x-4,45+(i*13)%24,8,8,shell,ice,2);
        });
        panel(195,60);
        const path=[[172,66],[180,66],[185,60],[190,72],[197,52],[203,68],[209,62],[218,62]];
        trace(path,mint);
        box(289,39,52,39,shell,ice);line([[296,69],[304,69],[309,62],[315,66],[324,53],[333,53]],mint,2);
        glow(333,53,mint);line([[308,83],[322,83]],rim,2);
        break;
      }
      case 4: {
        panel(75,59);line([[58,56],[80,56]],ice);line([[58,64],[72,64]],rim);
        cursor(78+wave*4,60,mint);
        panel(195,55);panel(202,64);
        cursor(183+wave*4,64,violet);cursor(204-wave*4,68,mint);
        panel(315,61);tick(315,65);
        trace([[177,39],[167,30],[116,30],[105,41]],violet,.3);
        break;
      }
      case 5: {
        panel(75,62);bars(75,78);
        panel(195,62);
        line([[171,69],[181,66],[189,69],[200,60],[217,60]],violet,2);
        line([[171,75],[183,70],[192,72],[205,58],[217,54]],mint,2);
        for(let i=0;i<3;i++){
          const y=47+i*13, x=[305,325,312][i]+(i===1?-1:1)*wave*4;
          line([[293,y],[336,y]],rim,2);dot(x,y,4.5,i===1?violet:mint);
        }
        trace([[334,39],[324,27],[85,27],[72,39]],mint,.12);
        line([[72,34],[72,39],[78,38]],mint);
        break;
      }
    }
  }

  function paintIndustry(key,t,{ctx,line,box,dot,trace,tick,sheet,panel,bars,cursor}) {
    const sweep=(1-Math.cos(t*2*Math.PI))/2;
    function scan(x,y,w,h) {
      const position=x+w*sweep;
      const shade=ctx.createLinearGradient(position-9,0,position,0);
      shade.addColorStop(0,'#5bedd300');shade.addColorStop(1,'#5bedd355');
      ctx.fillStyle=shade;ctx.fillRect(Math.max(x,position-9),y,Math.min(9,position-x),h);
      line([[position,y],[position,y+h]],mint,1.6);
    }
    function rows(x,y,marked=false) {
      for(let i=0;i<3;i++) {
        const yy=y+i*11, color=marked&&i===1?gold:ice;
        dot(x,yy,2.1,color);
        line([[x+6,yy],[x+23+(i%2)*6,yy]],color);
      }
    }
    function verified(x,y) {
      dot(x,y,10,'#185651');tick(x,y);
    }
    function plan(x,y) {
      box(x-25,y-17,50,34,'#132f48',rim,1);
      line([[x-8,y-17],[x-8,y-4],[x+3,y-4]],ice);
      line([[x+10,y-17],[x+10,y+5],[x+24,y+5]],ice);
      line([[x-25,y+3],[x-12,y+3],[x-12,y+16]],ice);
    }
    function carton(x,y) {
      line([[x-15,y-5],[x,y-13],[x+15,y-5],[x+15,y+10],[x,y+18],[x-15,y+10],[x-15,y-5],[x,y+3],[x+15,y-5]],ice);
      line([[x,y+3],[x,y+18]],ice);
      line([[x-8,y-9],[x+7,y-1]],mint,2);
    }
    switch(key) {
      case 'industry-1': // Shop-floor questions become retrieved knowledge and training records.
        box(48,40,42,23);box(65,59,36,20,shell,violet);
        [59,66,73].forEach(x=>dot(x,51,1.8,ice));
        line([[72,67],[91,67]],violet);
        for(let i=2;i>=0;i--) {
          box(170+i*4,41+i*7,39,22,shell,i===1?mint:rim);
          line([[176+i*4,48+i*7],[193+i*4,48+i*7]],ice);
        }
        scan(171,39,40,31);
        sheet(310,58);verified(330,70);
        break;
      case 'industry-2': // Technical drawing, dimension extraction, confirmed quote.
        box(48,38,55,42);line([[55,69],[55,46],[73,46],[73,55],[91,55],[91,69],[55,69]],ice);
        line([[170,72],[170,64],[217,64],[217,72]],rim);
        line([[178,54],[209,54]],mint,2);
        line([[178,49],[178,59]],ice);line([[209,49],[209,59]],ice);
        scan(170,39,47,33);
        sheet(312,58);verified(330,71);
        break;
      case 'industry-3':
        sheet(68,54);sheet(79,60);
        box(159,37,30,44);box(201,37,30,44);
        for(let i=0;i<3;i++) {
          const y=46+i*12;
          line([[164,y],[183,y]],ice);line([[206,y],[225,y]],ice);
          trace([[185,y],[193,y],[198,y+(i===1?4:0)],[205,y+(i===1?4:0)]],i===1?gold:mint,i/3);
        }
        panel(315,58);rows(297,52,true);
        break;
      case 'industry-4':
        panel(75,58);bars(75,72);
        panel(195,56);bars(195,72);line([[171,56],[219,56]],gold);
        sheet(307,56);carton(327,69);
        break;
      case 'industry-5':
        sheet(63,53);sheet(83,63);
        for(let i=0;i<3;i++) {
          const y=42+14*i;
          box(164,y,19,6,shell,ice,2);
          trace([[184,y+3],[191,y+3],[202,60],[220,60]],mint,i/3);
        }
        dot(222,60,4,violet);
        panel(315,57);rows(297,52);verified(334,73);
        break;
      case 'industry-6':
        sheet(65,56);sheet(76,61);sheet(86,66);
        panel(190,56);rows(171,50);dot(210,60,10,mint);dot(210,60,7,shell);
        line([[216,68],[225,77]],mint,3);scan(167,47,34,22);
        sheet(309,57);verified(329,70);
        break;
      case 'industry-7':
        plan(75,58);plan(195,58);
        [[179,48],[200,66],[214,51]].forEach(([x,y],i)=>{
          dot(x,y,4,'#12665e');dot(x,y,1.6,ice);
          if(i===Math.floor(t*3)) {ctx.beginPath();ctx.arc(x,y,7,0,2*Math.PI);ctx.strokeStyle=mint;ctx.stroke();}
        });
        plan(313,58);cursor(316+sweep*3,59,violet);verified(335,74);
        break;
      case 'industry-8':
        carton(73,57);line([[75,60],[84,56]],mint,2);
        box(166,38,55,43);rows(174,47,true);scan(168,40,50,39);
        sheet(310,57);line([[298,59],[318,59]],gold,2);verified(328,72);
        break;
    }
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
    const height=Math.round(width*136/390);
    if(canvas.width!==width || canvas.height!==height) {
      canvas.width=width;canvas.height=height;
    }
    ctx.setTransform(width/390,0,0,height/136,0,0);
    paint(ctx,Number(figure.dataset.stage),t,figure.dataset.industry);
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
    if(!ctx || !ctx.roundRect) return;
    contexts.set(figure,ctx);
    figure.classList.add('drawn');
    resize.observe(figure);observer.observe(figure);
  });
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',()=>{
    if(motion.matches) contexts.forEach((_,figure)=>draw(figure,.42));
    schedule();
  });
})();
