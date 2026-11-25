// All coordinates are in the 1122 × 1402 studio artwork, including the live mesh.
const stage = document.querySelector('.atrium');
if (stage) startAtrium(stage);

const W = 1122, H = 1402;
const ease = (t,start,end) => {
  const u = Math.max(0,Math.min(1,(t-start)/(end-start)));
  return u*u*(3-2*u);
};
const mix = (a,b,t) => a+(b-a)*t;
const between = (a,b,t) => [mix(a[0],b[0],t),mix(a[1],b[1],t)];

// The desk, portable sheet and sample carry the same small canopy revision.
const canopy = [[0,0],[26,-14],[64,-11],[38,5],[0,0],[1,10],[38,15],[38,5],[64,-11],[64,-1],[38,15]];
function canopyLine(ctx,progress) {
  const distance=progress*(canopy.length-1);
  ctx.beginPath();ctx.moveTo(...canopy[0]);
  for(let n=1;n<canopy.length;n++){
    const fraction=Math.max(0,Math.min(1,distance-n+1));
    ctx.lineTo(...between(canopy[n-1],canopy[n],fraction));
    if(fraction<1)break;
  }
  ctx.stroke();
}
function deskPose(t) {
  // Both sides are active as the page opens, and again while the model is being checked.
  const phrase=1-ease(t,2.9,3.65)+ease(t,6.25,6.85);
  const beat=t*2.1;
  const tap=offset=>phrase*Math.max(0,Math.cos((beat+offset)*Math.PI*2))**2;
  const draft=ease(t,-.55,2.8);
  const step=draft*(canopy.length-1),index=Math.min(canopy.length-2,Math.floor(step));
  const cursor=between(canopy[index],canopy[index+1],step-index);
  const rest=ease(t,8,10);
  return {left:tap(0),right:tap(.46),draft,
    penX:cursor[0]*(1-rest),penY:cursor[1]*(1-rest),
    ink:1-ease(t,8.5,9.85), beat};
}

function poseAt(time) {
  const t=time%10;
  const reset=1-ease(t,8.8,9.95);
  const offer=ease(t,-.18,1.30)*reset;
  const catchSheet=ease(t,.28,1.30)*reset;
  const take=ease(t,1.58,2.65)*reset;
  const release=ease(t,1.62,2.48)*reset;
  const look=ease(t,2.48,3.55)*reset;
  const point=ease(t,2.70,3.65)*reset;
  // Each reply begins while the preceding participant is finishing their gesture.
  const trace=ease(t,2.85,4.55)*(1-ease(t,5.15,5.95));
  const adjust=ease(t,4.35,5.7)*(1-ease(t,7.75,8.75));
  const approve=ease(t,6.22,6.94)*(1-ease(t,8.25,9.1));
  const nod=Math.sin(Math.PI*ease(t,6.75,7.55));
  return {
    trace,adjust,approve,nod,desk:deskPose(t),
    t,offer,catchSheet,take,release,look,point,
    sheetX:536+96*offer+56*take,
    sheetY:653-15*offer+49*take,
    angle:-.13+.16*offer+.07*take,
    tilt:1-.26*look,
    lightToModel:ease(t,2.25,3.62),
    glow:ease(t,3.15,3.7)*(1-ease(t,8.35,9.15))
  };
}

// The lit, textured gloves are cut from the approved artwork and pivot at the cuffs.
// The sheet is a separate plane so the giver can actually let go of it.
const grips=[
  {wrist:[119,145],path:'M116 136 Q117 126 129 126 Q138 115 152 117 Q174 118 182 130 Q187 139 177 139 L165 134 Q181 143 174 149 Q171 153 163 149 Q171 158 162 162 Q157 164 150 160 Q143 165 133 160 Q117 161 116 149 Z'},
  {wrist:[218,88],path:'M214 89 Q216 78 225 77 Q233 72 243 77 Q256 80 260 93 Q260 98 255 99 Q249 100 246 93 Q249 102 241 102 Q231 104 229 94 Q222 95 215 93 Z'},
  {wrist:[420,213],path:'M432 198 Q426 192 421 196 Q409 186 399 184 Q379 176 374 182 Q368 188 381 196 Q372 201 364 198 Q350 195 350 203 Q349 211 366 215 Q359 221 372 227 Q384 235 401 231 Q413 230 420 225 Q435 225 432 207 Z'},
  {wrist:[394,132],path:'M398 129 Q393 119 384 118 Q370 117 363 122 Q354 124 352 133 Q352 141 360 141 Q366 138 370 133 Q365 144 372 147 Q380 149 385 139 Q391 142 397 136 Z'}
].map(g=>({...g,mask:new Path2D(g.path)}));

function sleeve(ctx,start,elbow,end) {
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(...start);ctx.quadraticCurveTo(...elbow,...end);
  ctx.strokeStyle='#111c3a';ctx.lineWidth=27;ctx.stroke();
  const sheen=ctx.createLinearGradient(start[0],start[1]-12,end[0],end[1]+10);
  sheen.addColorStop(0,'#294077');sheen.addColorStop(.54,'#212c5c');sheen.addColorStop(1,'#364b81');
  ctx.strokeStyle=sheen;ctx.lineWidth=21;ctx.stroke();
}
function glove(ctx,art,id,at,rotation) {
  const g=grips[id];ctx.save();ctx.translate(...at);ctx.rotate(rotation);
  ctx.translate(-g.wrist[0],-g.wrist[1]);ctx.clip(g.mask);
  ctx.drawImage(art,-370,-512,W,H);ctx.restore();
}
// A shallow metal keyboard lies along the near edge of the glass, beneath the real cuffs.
function drawKeyboard(ctx,p) {
  ctx.save();
  ctx.transform(1,-.235,.57,.67,204,1014);
  const metal=ctx.createLinearGradient(0,0,0,81);
  metal.addColorStop(0,'#7495a6');metal.addColorStop(.06,'#32485a');metal.addColorStop(.91,'#1c3145');metal.addColorStop(1,'#819caf');
  ctx.fillStyle=metal;ctx.strokeStyle='#9ac1cd';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.roundRect(0,0,295,79,7);ctx.fill();ctx.stroke();
  const active=Math.floor(p.desk.beat);
  for(let row=0;row<4;row++){
    for(let col=0;col<13;col++){
      if(row===3 && col>3 && col<9)continue;
      const down=col===2+active%3 && row===1 ? p.desk.left :
                 col===10+active%2 && row===active%3 ? p.desk.right : 0;
      const x=7+col*21.5,y=6+row*17+down*2,w=row===3&&col===3?124:18;
      ctx.fillStyle=down>.23?'#98f2ff':'#172e41';
      ctx.fillRect(x,y,w,13);
      ctx.fillStyle=down>.23?'#fff':'#678797';
      ctx.fillRect(x+3,y+2,w-6,1.7);
    }
  }
  ctx.restore();
}
function drawDeskDraft(ctx,p,mesh) {
  const desk=p.desk;
  const wristX=-19*p.point-20*p.adjust+.99*desk.penX;
  const wristY=11*p.point+10*p.adjust+.99*desk.penY;
  // On a flat canvas the resting glove stays still and the stylus pivots in its grip.
  const hold=[637+(mesh?wristX*.91:0),1014+(mesh?wristY*.91:0)];
  const tip=[594+desk.penX-19*p.point-20*p.adjust,1065+desk.penY+11*p.point+10*p.adjust];
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.save();ctx.translate(594,1065);ctx.globalAlpha=desk.ink;
  ctx.shadowBlur=5;ctx.shadowColor='#ffc987';ctx.strokeStyle='#ffe1a7';ctx.lineWidth=3;
  canopyLine(ctx,desk.draft);ctx.restore();
  const back=[hold[0]+(hold[0]-tip[0])*.38,hold[1]+(hold[1]-tip[1])*.38];
  ctx.beginPath();ctx.moveTo(...back);ctx.lineTo(...tip);
  ctx.strokeStyle='#142a40';ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle='#a1beca';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='#ebfcff';ctx.lineWidth=1.4;ctx.stroke();
  ctx.beginPath();ctx.arc(...tip,3,0,Math.PI*2);ctx.fillStyle='#ffe3aa';ctx.fill();
  ctx.restore();
}
function drawCuffs(ctx,plate,p,mesh) {
  // Restore just the foreground fingers over the keyboard and pen shafts.
  // Sample the same warped surface as the base layer so the edges meet their sleeves.
  ctx.save();
  const regions=[
    [251,1007,71,45,.09],[499,949,44,36,-.12],[660,981,38,38,-.32]
  ];
  ctx.beginPath();
  for(const [x,y,rx,ry,angle] of regions){
    const dx=mesh && x===660?p.desk.penX*.62-14*p.point-13*p.adjust:0;
    const dy=mesh && x===660?p.desk.penY*.62+9*p.point+7*p.adjust:0;
    ctx.moveTo(x+dx+rx*Math.cos(angle),y+dy+rx*Math.sin(angle));
    ctx.ellipse(x+dx,y+dy,rx,ry,angle,0,Math.PI*2);
    ctx.closePath();
  }
  ctx.clip();
  if(mesh){
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(mesh,0,0);
  }else{ctx.drawImage(plate,0,0,W,H);}
  ctx.restore();
}
function sharedTablets(ctx,p) {
  // Keep the revision on the displays already held by the two pairs in the room.
  const tablets=[[310,568,.69],[736,450,.58]];
  for(const [x,y,size] of tablets){
    ctx.save();ctx.transform(size,-.09,-.13,size,x,y);
    ctx.globalAlpha=.85*p.desk.ink;ctx.lineWidth=3.4;ctx.lineJoin='round';
    ctx.strokeStyle=p.approve>.25?'#ffe4ac':'#bdf6ff';
    ctx.shadowBlur=3;ctx.shadowColor=ctx.strokeStyle;
    canopyLine(ctx,p.desk.draft);
    ctx.restore();
  }
}
function drawHandoff(ctx,art,p) {
  const cos=Math.cos(p.angle),sin=Math.sin(p.angle);
  const attached=(x,y)=>[p.sheetX+x*cos-y*p.tilt*sin,p.sheetY+x*sin+y*p.tilt*cos];
  const left=between(attached(-107,-2),[476+39*p.point,657+59*p.point],p.release);
  const leftBack=between(attached(-82,-47),[538+47*p.trace,631+19*p.trace],p.release);
  const right=between([843,706],attached(118,28),p.catchSheet);
  const rightBack=between([846,656],attached(100,-44),p.catchSheet);
  sleeve(ctx,[527,599],[550,611],leftBack);
  sleeve(ctx,[837,625],[819,653],rightBack);
  sleeve(ctx,[414,605],[414,695],left);
  sleeve(ctx,[917,648],[890,740],right);
  ctx.save();ctx.translate(p.sheetX,p.sheetY);ctx.rotate(p.angle);ctx.scale(1,p.tilt);ctx.transform(1,.11,-.20,1,0,0);
  const pane=ctx.createLinearGradient(-107,-57,112,58);
  pane.addColorStop(0,'rgba(160,224,250,.85)');pane.addColorStop(.43,'rgba(58,118,163,.83)');pane.addColorStop(1,'rgba(147,207,236,.82)');
  ctx.fillStyle=pane;ctx.strokeStyle='#cdefff';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-109,-57,219,115,3);ctx.fill();ctx.stroke();
  // Register the architectural drawing itself onto the new transmissive sheet.
  ctx.save();ctx.beginPath();ctx.rect(-100,-46,200,89);ctx.clip();
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=.88;
  ctx.drawImage(art,543/W*art.naturalWidth,634/H*art.naturalHeight,169/W*art.naturalWidth,81/H*art.naturalHeight,-99,-44,198,88);
  ctx.restore();
  ctx.save();ctx.translate(-17,-1);ctx.scale(.9,.9);ctx.lineWidth=3.2;
  ctx.strokeStyle='#ffe4a6';ctx.lineJoin='round';ctx.globalAlpha=p.desk.ink;
  canopyLine(ctx,p.desk.draft);ctx.restore();
  const scan=-110+220*p.offer;
  const bar=ctx.createLinearGradient(scan-18,0,scan+4,0);
  bar.addColorStop(0,'rgba(84,225,255,0)');bar.addColorStop(.87,'rgba(128,242,255,.32)');bar.addColorStop(1,'rgba(128,242,255,0)');
  ctx.fillStyle=bar;ctx.fillRect(Math.max(-108,scan-18),-55,Math.min(22,109-Math.max(-108,scan-18)),110);
  ctx.restore();
  glove(ctx,art,1,leftBack,p.angle*.45);glove(ctx,art,3,rightBack,-.20*(1-p.catchSheet));
  glove(ctx,art,0,left,.2*p.release);glove(ctx,art,2,right,.12-.24*p.catchSheet);
}
function drawSignal(ctx,p) {
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  // The signal leaves the receiver's lower glass corner, then bends onto the front table.
  const start=[p.sheetX+70,p.sheetY+48*p.tilt];
  const end=[575,1044],a=[770,786],b=[440,902];
  const u=p.lightToModel;
  function location(k){
    const v=1-k;
    return [v*v*v*start[0]+3*v*v*k*a[0]+3*v*k*k*b[0]+k*k*k*end[0],
            v*v*v*start[1]+3*v*v*k*a[1]+3*v*k*k*b[1]+k*k*k*end[1]];
  }
  if(u>0 && p.t<4.05){
    ctx.globalAlpha=1-ease(p.t,3.62,4.05);ctx.shadowBlur=11;ctx.shadowColor='#27dcff';
    for(let j=0;j<14;j++){
      const a=location(Math.max(0,u-.24+.24*j/14)),b=location(Math.max(0,u-.24+.24*(j+1)/14));
      ctx.strokeStyle='rgba(94,228,255,'+((j+1)/15)+')';ctx.lineWidth=3.8;
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
    }
    ctx.fillStyle='#dfffff';ctx.beginPath();ctx.arc(...location(u),4.3,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=p.glow;ctx.shadowColor='#21cfff';ctx.shadowBlur=7;
  const sweep=ctx.createRadialGradient(556,1090,8,556,1090,205);
  sweep.addColorStop(0,'rgba(54,220,255,.26)');sweep.addColorStop(1,'rgba(54,220,255,0)');
  ctx.fillStyle=sweep;ctx.save();ctx.translate(556,1090);ctx.scale(1,.43);ctx.translate(-556,-1090);ctx.fillRect(343,880,430,430);ctx.restore();
  const outline=new Path2D('M380 1124 L397 1060 Q409 1044 495 1052 L504 1032 L578 1024 L580 1097 L740 1095 L738 1127 L688 1145 L520 1140 Z');
  ctx.strokeStyle='rgba(128,249,255,.84)';ctx.lineWidth=2.5;ctx.setLineDash([900]);ctx.lineDashOffset=900*(1-ease(p.t,3.45,4.46));ctx.stroke(outline);
  ctx.restore();
}

// Lines are drawn in the same perspective as the two actual models on the glass table.
function reviewModel(ctx,p) {
  ctx.save();
  ctx.lineJoin='round';ctx.lineCap='round';
  function stroke(points,color,width=2) {
    ctx.beginPath();ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function contact(x,y,r,amount) {
    if(amount<=0)return;
    ctx.save();ctx.globalAlpha=amount;ctx.shadowColor='#68e8ff';ctx.shadowBlur=7;
    ctx.beginPath();ctx.ellipse(x,y,r,r*.38,-.08,0,Math.PI*2);
    ctx.strokeStyle='#b6f8ff';ctx.lineWidth=2.4;ctx.stroke();
    ctx.restore();
  }

  // Left reviewer slides a guide across the plan; the opposite hand catches its endpoint.
  const slide=ease(p.t,3.2,4.65);
  const palm=between([280,1054],[333,1061],p.trace);
  const seam=between([395,1072],[608,1045],slide);
  ctx.globalAlpha=ease(p.t,2.9,3.25)*(1-ease(p.t,5.55,6.1));
  stroke([palm,[359,1080],[395,1072],seam],'#7ae3f4',3);
  contact(...seam,12,1);
  ctx.globalAlpha=1;
  const finger=[636-27*p.point-20*p.adjust,1044+11*p.point+10*p.adjust];
  contact(...finger,9+11*p.adjust,p.adjust);

  // The adjustment lifts three curved floor plates out of the blueprint, then seats them.
  const rise=ease(p.t,4.65,5.75);
  const settle=ease(p.t,6.04,6.8);
  const opacity=ease(p.t,4.38,4.85)*(1-ease(p.t,8.1,8.78));
  const lift=rise*(1-.75*settle);
  ctx.globalAlpha=opacity;
  for(let level=0;level<3;level++){
    const y=1042-level*8-(level+1)*13*lift;
    ctx.beginPath();ctx.moveTo(412,y+8);
    ctx.bezierCurveTo(393,y-2,419,y-14,449,y-15);
    ctx.lineTo(508,y-19);ctx.lineTo(541,y-10);ctx.lineTo(523,y+1);
    ctx.quadraticCurveTo(453,y+17,412,y+8);
    ctx.fillStyle=level===2?'rgba(118,232,255,.42)':'rgba(38,154,206,.31)';
    ctx.fill();ctx.strokeStyle='#c8f6ff';ctx.lineWidth=2;ctx.stroke();
    stroke([[415,y+9],[415,y+15],[450,y+19],[522,y+7],[522,y+1]],'#67dbf4',1.7);
  }
  // A warm confirmation travels to the physical model; its windows light bay by bay.
  const transfer=ease(p.t,6.35,7.46);
  ctx.globalAlpha=ease(p.t,6.3,6.65)*(1-ease(p.t,8.55,9));
  const bridge=[[535,1066],[645,1101],[745,1117],[837,1145],[903,1158]];
  const count=transfer*(bridge.length-1),seg=Math.min(bridge.length-2,Math.floor(count));
  const tip=between(bridge[seg],bridge[seg+1],count-seg);
  stroke([...bridge.slice(0,seg+1),tip],'#f9d393',2.6);contact(...tip,7,1);
  for(let bay=0;bay<8;bay++){
    const on=ease(p.t,7.21+bay*.085,7.55+bay*.085)*(1-ease(p.t,8.62,9.22));
    ctx.globalAlpha=on*.72;ctx.shadowColor='#ffc57b';ctx.shadowBlur=6;
    const x=849+bay*9,y=1161+Math.sin(bay*.45)*3;
    stroke([[x,y],[x,y+11]],'#ffdd9f',3);
  }
  ctx.restore();
}

async function startAtrium(stage) {
  const art=stage.querySelector('img');
  const plate=new Image();
  plate.src=innerWidth<=680?'assets/atrium-table-mobile.webp?v=b493c9800d64fb1c':'assets/atrium-table.webp?v=2be7ee070ebe2474';
  try { await Promise.all([art.decode(),plate.decode()]); } catch { return; }
  const canvas=stage.querySelector('.characters'),light=stage.querySelector('.table-light');
  const brush=light.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const surface=makeSurface(canvas,plate,W,H);
  let visible=false,request=0,previous=0,elapsed=0;
  let viewWidth=0,viewHeight=0,scale=1,originX=0,originY=0;
  let pointerX=0,pointerY=0,panX=0,panY=0;
  function render(t) {
    const p=poseAt(t),a=t*Math.PI*2/10;
    const motion=[
      [12*p.offer+5*p.look,16*p.look+6*p.nod,.13*p.look-.045*p.offer],
      [-16*p.catchSheet-7*p.look,20*p.look,-.16*p.look+.06*p.catchSheet],
      [-19*p.point-20*p.adjust+p.desk.penX,11*p.point+10*p.adjust+p.desk.penY,-.05*p.adjust],[5*p.point-9*p.adjust,7*p.look+11*p.nod,-.045*p.look-.045*p.adjust],
      [7*p.look+11*p.trace,9*p.look+9*p.nod,.06*p.look+.06*p.trace],[3*Math.sin(a)+6*p.desk.draft*p.desk.ink,3*Math.cos(a)+7*p.approve,.07*p.desk.draft*p.desk.ink],
      [3*Math.sin(a+.3),2*Math.cos(a),0],[-3*Math.sin(a)-8*p.approve,3*Math.cos(a)+7*p.nod,-.08*p.approve],
      [16*p.trace-8*p.desk.left,5*p.trace+12*p.desk.left,-.12*p.desk.left],[9*p.approve+5*p.desk.right,-7*p.approve+12*p.desk.right,.10*p.desk.right]
    ];
    panX+=(pointerX-panX)*.08;panY+=(pointerY-panY)*.08;
    const x=originX+(surface?panX*3*scale:0),y=originY+(surface?panY*2*scale:0);
    if(surface)surface.draw(motion,scale,x,y,viewWidth,viewHeight);
    brush.setTransform(1,0,0,1,0,0);brush.clearRect(0,0,light.width,light.height);
    const px=light.width/viewWidth,py=light.height/viewHeight;
    brush.setTransform(px*scale,0,0,py*scale,px*x,py*y);
    if(!surface)brush.drawImage(plate,0,0,W,H);
    sharedTablets(brush,p);drawHandoff(brush,art,p);drawSignal(brush,p);reviewModel(brush,p);
    drawKeyboard(brush,p);drawDeskDraft(brush,p,Boolean(surface));
    drawCuffs(brush,plate,p,surface?canvas:null);
    stage.classList.toggle('motion-ready',Boolean(surface));
  }
  function tick(now) {
    request=0;
    if(!visible||document.hidden||reduce.matches)return;
    if(!previous || now-previous>=32){
      elapsed+=previous?Math.min(.1,(now-previous)/1000):0;previous=now;render(elapsed);
    }
    request=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(request);previous=0;
    if(reduce.matches){stage.classList.remove('motion-ready');brush.clearRect(-W*2,-H*2,W*5,H*5);return;}
    if(visible&&!document.hidden)request=requestAnimationFrame(tick);
  }
  function resize() {
    const rect=stage.getBoundingClientRect();
    viewWidth=rect.width;viewHeight=rect.height;
    if(!viewWidth||!viewHeight)return;
    scale=Math.max(viewWidth/W,viewHeight/H)*(surface?1.015:1);
    originX=(viewWidth-W*scale)/2;originY=(viewHeight-H*scale)/2;
    const ratio=Math.min(devicePixelRatio||1,1.75);
    for(const layer of [canvas,light]){
      layer.width=Math.round(viewWidth*ratio);layer.height=Math.round(viewHeight*ratio);
    }
    if(!reduce.matches)render(elapsed);
  }
  stage.closest('section').addEventListener('pointermove',event=>{
    const b=stage.getBoundingClientRect();
    pointerX=Math.max(-1,Math.min(1,(event.clientX-b.left)/b.width*2-1));
    pointerY=Math.max(-1,Math.min(1,(event.clientY-b.top)/b.height*2-1));
  },{passive:true});
  stage.closest('section').addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(stage);
  reduce.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  resize();
}

function makeSurface(canvas,image,width,height) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});
  if(!gl)return null;
  const vertex='attribute vec2 p;attribute vec2 uv;uniform vec2 zoom;uniform vec2 offset;varying vec2 v;void main(){v=uv;vec2 s=p*zoom+offset;gl_Position=vec4(s.x*2.-1.,1.-s.y*2.,0.,1.);}';
  const fragment='precision mediump float;uniform sampler2D art;varying vec2 v;void main(){gl_FragColor=texture2D(art,v);}';
  function shader(kind,source){
    const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);return s;
  }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
  // Soft local influences keep the wrists attached to sleeves and the room stationary.
  const zones=[
    [481,541,120,115],[879,609,133,130],[650,1007,88,95],
    [894,863,177,132],[311,842,170,168],[226,528,86,84],
    [724,455,52,54],[861,393,72,78],
    [260,1016,95,67],[501,950,73,61]
  ];
  const cols=64,rows=82,n=(cols+1)*(rows+1);
  const rest=new Float32Array(n*2),uv=new Float32Array(n*2),positions=new Float32Array(n*2);
  const weights=[];
  const indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const k=j*(cols+1)+i,x=i/cols*width,y=j/rows*height;
    rest[k*2]=x;rest[k*2+1]=y;uv[k*2]=i/cols;uv[k*2+1]=j/rows;
    const local=[];
    zones.forEach(([cx,cy,rx,ry],z)=>{
      const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
      if(d<2.15)local.push([z,Math.exp(-1.65*d)*(1-Math.max(0,d-1.15))]);
    });weights.push(local);
    if(i<cols&&j<rows)indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);
  }
  function attribute(name,data,usage){
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,usage);
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    return buffer;
  }
  const coords=attribute('p',rest,gl.DYNAMIC_DRAW);attribute('uv',uv,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  const zoom=gl.getUniformLocation(program,'zoom'),offset=gl.getUniformLocation(program,'offset');
  return {draw(motion,scale,x,y,w,h){
    for(let k=0;k<n;k++){
      let dx=0,dy=0;
      for(const [id,influence] of weights[k]){
        const [tx,ty,angle]=motion[id];
        dx+=(tx-angle*(rest[k*2+1]-zones[id][1]))*influence;
        dy+=(ty+angle*(rest[k*2]-zones[id][0]))*influence;
      }
      positions[k*2]=rest[k*2]+dx;positions[k*2+1]=rest[k*2+1]+dy;
    }
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(zoom,scale/w,scale/h);gl.uniform2f(offset,x/w,y/h);
    gl.bindBuffer(gl.ARRAY_BUFFER,coords);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }};
}
