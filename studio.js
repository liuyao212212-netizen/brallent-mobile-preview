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

function poseAt(time) {
  const t=time%7;
  const reset=1-ease(t,5.65,7);
  const offer=ease(t,-.18,1.30)*reset;
  const catchSheet=ease(t,.28,1.30)*reset;
  const take=ease(t,1.58,2.65)*reset;
  const release=ease(t,1.62,2.48)*reset;
  const look=ease(t,2.48,3.55)*reset;
  const point=ease(t,2.70,3.65)*reset;
  return {
    t,offer,catchSheet,take,release,look,point,
    sheetX:536+96*offer+56*take,
    sheetY:653-15*offer+49*take,
    angle:-.13+.16*offer+.07*take,
    tilt:1-.26*look,
    lightToModel:ease(t,2.25,3.62),
    glow:ease(t,3.4,3.95)*(1-ease(t,5.25,6.15))
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
function drawHandoff(ctx,art,p) {
  const cos=Math.cos(p.angle),sin=Math.sin(p.angle);
  const attached=(x,y)=>[p.sheetX+x*cos-y*p.tilt*sin,p.sheetY+x*sin+y*p.tilt*cos];
  const left=between(attached(-107,-2),[476+39*p.point,657+59*p.point],p.release);
  const leftBack=between(attached(-82,-47),[538,631],p.release);
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

async function startAtrium(stage) {
  const art=stage.querySelector('img');
  const plate=new Image();
  plate.src=innerWidth<=680?'assets/atrium-table-mobile.webp':'assets/atrium-table.webp';
  try { await Promise.all([art.decode(),plate.decode()]); } catch { return; }
  const canvas=stage.querySelector('.characters'),light=stage.querySelector('.table-light');
  const brush=light.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const surface=makeSurface(canvas,plate,W,H);
  let visible=false,request=0,previous=0,elapsed=0;
  let viewWidth=0,viewHeight=0,scale=1,originX=0,originY=0;
  let pointerX=0,pointerY=0,panX=0,panY=0;
  function render(t) {
    const p=poseAt(t),a=t*Math.PI*2/7;
    const motion=[
      [12*p.offer+5*p.look,16*p.look,.13*p.look-.045*p.offer],
      [-16*p.catchSheet-7*p.look,20*p.look,-.16*p.look+.06*p.catchSheet],
      [-19*p.point,11*p.point,0],[5*p.point,7*p.look,-.045*p.look],
      [7*p.look,9*p.look,.06*p.look],[3*Math.sin(a),2*Math.cos(a),0],
      [4*Math.sin(a+.3),2*Math.cos(a),0],[-3*Math.sin(a),2*Math.cos(a),0]
    ];
    panX+=(pointerX-panX)*.08;panY+=(pointerY-panY)*.08;
    const x=originX+(surface?panX*3*scale:0),y=originY+(surface?panY*2*scale:0);
    if(surface)surface.draw(motion,scale,x,y,viewWidth,viewHeight);
    brush.setTransform(1,0,0,1,0,0);brush.clearRect(0,0,light.width,light.height);
    const px=light.width/viewWidth,py=light.height/viewHeight;
    brush.setTransform(px*scale,0,0,py*scale,px*x,py*y);
    if(!surface)brush.drawImage(plate,0,0,W,H);
    drawHandoff(brush,art,p);drawSignal(brush,p);
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
    [724,455,52,54],[861,393,72,78]
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
