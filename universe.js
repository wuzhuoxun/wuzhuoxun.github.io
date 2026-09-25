/* Original procedural artwork. No models, textures or animation libraries required. */
(() => {
'use strict';
if ('scrollRestoration' in history) history.scrollRestoration='manual';
const canvas=document.querySelector('#universe'),ctx=canvas.getContext('2d');
const scenes=[...document.querySelectorAll('.scene')],ids=scenes.map(s=>s.id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,w=innerWidth,h=innerHeight,dpr=1,progress=0,target=0,time=0,last=0,px=0,py=0,mx=0,my=0;
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const stars=Array.from({length:175},()=>({x:rand(),y:rand(),r:rand()*1.15+.22,a:rand()*.55+.18,z:rand(),phase:rand()*TAU}));
const doodleStars=Array.from({length:26},()=>({x:rand(),y:rand(),r:rand()*5+3,a:rand()*.48+.3,z:rand()*.7+.3,phase:rand()*TAU,kind:Math.floor(rand()*3),rot:rand()*TAU}));
const dustClouds=Array.from({length:6},(_,i)=>({x:rand(),y:rand(),r:rand()*.13+.08,phase:rand()*TAU,color:i%3}));
function resize(){const chapter=target;w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';target=chapter;window.scrollTo(0,chapter*h);}
addEventListener('resize',resize);resize();
const PLANET_RES=1024,MOON_RES=256,ATLAS_W=PLANET_RES+MOON_RES,ATLAS_H=Math.max(PLANET_RES,MOON_RES*3);
const surface=document.createElement('canvas');surface.width=ATLAS_W;surface.height=ATLAS_H;
const atlas=document.createElement("canvas");atlas.width=ATLAS_W;atlas.height=ATLAS_H;const atlasContext=atlas.getContext("2d");atlasContext.imageSmoothingEnabled=true;atlasContext.imageSmoothingQuality='high';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';let atlasTime=-10;
const gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:true});
let program,ut,uk,ul;
if(gl){
const vert='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
const frag=`precision highp float;varying vec2 uv;uniform float t;uniform float kind;uniform vec3 lightDirection;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float sphereNoise(vec3 p,float scale){return (noise(p.xy*scale+p.z*1.7)+noise(p.yz*scale+p.x*2.1)+noise(p.zx*scale-p.y*1.3))/3.;}
float landField(vec3 p){return sin(p.x*4.+p.z*2.)+.6*sin(p.y*6.-p.z*3.)+.25*sin(p.x*11.+p.y*9.);}
float reliefField(vec3 p){
 float mask=smoothstep(.2,.72,landField(p));
 float broad=1.-abs(sphereNoise(p,4.2)*2.-1.);
 float ridge=1.-abs(sphereNoise(p+vec3(.7,-.3,.2),8.5)*2.-1.);
 float detail=1.-abs(sphereNoise(p-vec3(.2,.5,.8),16.)*2.-1.);
 return mask*(pow(broad,2.2)*.56+pow(ridge,3.4)*.34+pow(detail,4.8)*.1);
}
void main(){vec2 q=uv*1.055;float r=length(q);float outline=.004*sin(atan(q.y,q.x)*47.)+.002*sin(atan(q.y,q.x)*113.);float edge=1.-smoothstep(.998+outline,1.005+outline,r);if(r>1.007){gl_FragColor=vec4(0.);return;}
vec3 n=vec3(q,sqrt(max(0.,1.-dot(q,q))));float a=t*.1;vec3 v=vec3(n.x*cos(a)+n.z*sin(a),n.y,n.z*cos(a)-n.x*sin(a));
vec3 paint=v;vec3 normal=n;
if(kind>.5){float tilt=.32;paint=vec3(v.x,v.y*cos(tilt)-v.z*sin(tilt),v.y*sin(tilt)+v.z*cos(tilt));}
vec3 surfaceNormal=paint;
vec3 col;
if(kind<.5){
 float land=landField(paint);
 float coast=smoothstep(.05,.13,land);
 col=mix(vec3(.35,.75,.76),vec3(.91,.62,.71),coast);
 float beach=(1.-smoothstep(.04,.11,abs(land-.09)))*.48;col=mix(col,vec3(.98,.85,.68),beach);
 float coastInk=1.-smoothstep(.012,.036,abs(land-.09));col=mix(col,vec3(.29,.37,.48),coastInk*.18);
 float wave=smoothstep(.96,.995,sin(paint.y*59.+sin(paint.x*17.+paint.z*13.)))*(1.-coast);
 col+=vec3(.12,.18,.15)*wave;
 float relief=reliefField(paint),peaks=smoothstep(.24,.64,relief),snow=smoothstep(.59,.86,relief+.035*sphereNoise(paint,24.));
 col=mix(col,vec3(.78,.69,.8),peaks*.18);col=mix(col,vec3(.98,.91,.72),snow*.28);
 float strata=1.-smoothstep(.018,.06,abs(fract((relief+paint.y*.06)*13.)-.5));col=mix(col,vec3(.55,.56,.68),strata*peaks*.032);
 float contour=1.-smoothstep(.025,.075,abs(fract((paint.y+sphereNoise(paint,7.)*.055)*18.)-.5));col=mix(col,vec3(.43,.52,.59),contour*coast*.05);
 float e=.006;
 vec3 grad=vec3(reliefField(paint+vec3(e,0.,0.))-reliefField(paint-vec3(e,0.,0.)),reliefField(paint+vec3(0.,e,0.))-reliefField(paint-vec3(0.,e,0.)),reliefField(paint+vec3(0.,0.,e))-reliefField(paint-vec3(0.,0.,e)))/(2.*e);
 grad-=paint*dot(grad,paint);surfaceNormal=normalize(paint-grad*.009);
}else if(kind<1.5){
 col=vec3(.94,.69,.47);
 for(int i=0;i<9;i++){
  float fi=float(i);vec3 center=normalize(vec3(sin(fi*2.4+.6),cos(fi*1.7+.9)*.85,cos(fi*2.4+.6)));
  float d=length(paint-center);float cr=.14+.055*sin(fi*4.1);
  float bowl=1.-smoothstep(cr*.58,cr*.92,d);float lip=exp(-pow((d-cr)/.024,2.));
  col=mix(col,vec3(.69,.44,.34),bowl*.55);col+=vec3(.15,.13,.10)*lip;
  vec3 tangent=center-paint*dot(center,paint);
  surfaceNormal=normalize(surfaceNormal+tangent*(bowl*2.-lip*1.8));
 }
}else if(kind<2.5){
 float bands=sin(paint.y*24.+sin(paint.x*4.+paint.z*3.)*.7);
 col=mix(vec3(.56,.49,.76),vec3(.81,.74,.90),smoothstep(-.15,.08,bands));
 col=mix(col,vec3(.93,.77,.76),(1.-smoothstep(.055,.085,abs(paint.y+.21)))*.65);
}else{
 float bands=sin(paint.y*15.+sin(paint.x*6.+paint.z*4.)*1.1);
 col=mix(vec3(.28,.65,.73),vec3(.69,.84,.83),smoothstep(-.12,.14,bands));
 float spot=length(vec2(paint.x-.2,paint.y+.21)*vec2(1.1,2.4));
 col=mix(col,vec3(.49,.68,.83),1.-smoothstep(.13,.16,spot));
}
if(kind<.5){normal=vec3(surfaceNormal.x*cos(a)-surfaceNormal.z*sin(a),surfaceNormal.y,surfaceNormal.x*sin(a)+surfaceNormal.z*cos(a));}
else{vec3 u=vec3(surfaceNormal.x,surfaceNormal.y*cos(.32)+surfaceNormal.z*sin(.32),-surfaceNormal.y*sin(.32)+surfaceNormal.z*cos(.32));normal=vec3(u.x*cos(a)-u.z*sin(a),u.y,u.x*sin(a)+u.z*cos(a));}
float light=dot(normal,normalize(lightDirection));
float diffuse=.44+.25*smoothstep(.02,.07,light)+.26*smoothstep(.49,.56,light)+.05*max(0.,light);
col*=diffuse;col=mix(col,col*vec3(.86,.91,1.12),.32*(1.-smoothstep(.0,.3,light)));
float soft=pow(max(0.,dot(normal,normalize(normalize(lightDirection)+vec3(0.,0.,1.)))),24.);
col+=vec3(.98,.94,.8)*soft*.025;

if(kind>1.5&&kind<2.5){float ringLine=q.y+.38*q.x;float shadow=smoothstep(-.19,-.14,ringLine)*(1.-smoothstep(-.06,-.02,ringLine));col*=1.-shadow*.2;}
float paper=noise(paint.xy*95.+paint.z*29.)-.5;float grain=hash(gl_FragCoord.xy)-.5;col+=paper*.026+grain*.012;
col+=vec3(.47,.65,.72)*pow(1.-n.z,5.)*.065;
float pencil=1.-smoothstep(.98+outline,.995+outline,r);col=mix(vec3(.24,.31,.39),col,pencil*.86+.14);
gl_FragColor=vec4(col,edge);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);ut=gl.getUniformLocation(program,'t');uk=gl.getUniformLocation(program,'kind');ul=gl.getUniformLocation(program,'lightDirection');gl.viewport(0,0,PLANET_RES,PLANET_RES);}catch(e){console.warn('Using canvas planet fallback.',e);program=null;}
}
function sphere(x,y,r,color){ctx.save();ctx.fillStyle=color;ctx.strokeStyle='#414b55';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(x,y,r-.7,0,7);ctx.clip();ctx.fillStyle='#3a506338';ctx.beginPath();ctx.ellipse(x+r*.6,y+r*.25,r*.68,r, .5,0,7);ctx.fill();ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.ellipse(x-r*.3,y-r*.45,r*.17,r*.09,-.55,0,7);ctx.fill();ctx.restore();}
function sparkle(x,y,r,a,color='#d4ded6'){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.stroke();ctx.restore()}
function doodleStar(x,y,r,a,kind,rotation){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=a;ctx.lineJoin='round';ctx.lineCap='round';const palette=['#ffedbb','#b1dcd4','#efb8c9'],trace=()=>{ctx.beginPath();if(kind===0){for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,rr=(i%2?r*.43:r)*(1+.055*Math.sin(i*4.7));const xx=Math.cos(angle)*rr,yy=Math.sin(angle)*rr;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.closePath();}else if(kind===1){ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r*.17,-r*.1,0,-r);ctx.quadraticCurveTo(r*.12,-r*.16,r,0);ctx.quadraticCurveTo(r*.14,r*.1,0,r);ctx.quadraticCurveTo(-r*.11,r*.16,-r,0);ctx.closePath();}else{for(let i=0;i<6;i++){const a=i*TAU/6,rr=i%2?r:r*.88,side=.19;const tip=[Math.cos(a)*rr,Math.sin(a)*rr],l=[Math.cos(a-side)*r*.2,Math.sin(a-side)*r*.2],rright=[Math.cos(a+side)*r*.2,Math.sin(a+side)*r*.2];i?ctx.lineTo(...l):ctx.moveTo(...l);ctx.quadraticCurveTo(...tip,...rright)}ctx.closePath();}};
 trace();ctx.fillStyle=palette[kind]+'d9';ctx.strokeStyle='#4f5264';ctx.lineWidth=Math.max(1,r*.2);ctx.fill();ctx.stroke();
 trace();ctx.strokeStyle='#fff5d2';ctx.lineWidth=Math.max(.55,r*.065);ctx.globalAlpha=a*.72;ctx.stroke();
 ctx.globalAlpha=a*.68;ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.ellipse(-r*.2,-r*.24,r*.14,r*.075,-.55,0,TAU);ctx.fill();
 ctx.restore();
}
function drawSpaceDust(p){
 ctx.save();ctx.globalCompositeOperation='screen';
 dustClouds.forEach((cloud,i)=>{const drift=18+cloud.r*110,x=(cloud.x*w+mx*drift+p*(i%2?.8:-.55)*9+w)%w,y=(cloud.y*h+my*drift*.55+h)%h,R=Math.max(w,h)*cloud.r*(1+.035*Math.sin(time*.22+cloud.phase));const colors=[['#8fcfc9','#8fcfc900'],['#eaaac5','#eaaac500'],['#a29bd3','#a29bd300']][cloud.color],g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,colors[0]+'0f');g.addColorStop(.45,colors[0]+'08');g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fillRect(x-R,y-R,R*2,R*2);
  for(let band=0;band<2;band++){ctx.globalAlpha=.07-band*.018;ctx.strokeStyle=colors[0];ctx.lineWidth=1.15-band*.3;ctx.beginPath();for(let n=0;n<42;n++){const a=-2.45+n/41*4.7,rr=R*(.39+band*.12+.035*Math.sin(a*6+cloud.phase)+.018*Math.sin(a*13-time*.12)),xx=x+Math.cos(a+cloud.phase*.08)*rr,yy=y+Math.sin(a+cloud.phase*.08)*rr*.38;n?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}ctx.globalAlpha=1;
 });ctx.restore();
}
function drawMeteor(){
 const duration=1.9,period=10.8,phase=(time+3.4)%period;if(phase>duration)return;const cycle=Math.floor((time+3.4)/period),lane=(Math.sin(cycle*91.73+1.2)*.5+.5),t=phase/duration,ease=t*t*(3-2*t),x=mix(w*(.08+lane*.36),w*(.62+lane*.24),ease),y=mix(h*(.09+lane*.1),h*(.35+lane*.16),ease),alpha=Math.sin(t*Math.PI),tail=(length,width,offset,color)=>{ctx.beginPath();ctx.moveTo(x-7,y+offset);ctx.bezierCurveTo(x-length*.28,y-length*.08+offset,x-length*.7,y-length*.28+offset,x-length,y-length*.39+offset);ctx.bezierCurveTo(x-length*.68,y-length*.25+offset+width,x-length*.27,y-length*.035+offset+width,x-6,y+offset+width*.25);ctx.closePath();ctx.fillStyle=color;ctx.strokeStyle='#4f5264';ctx.lineWidth=1;ctx.fill();ctx.stroke();};
 ctx.save();ctx.globalAlpha=alpha*.88;ctx.lineJoin='round';tail(126,8,2,'#ffedbbd9');tail(91,4,-2,'#efb8c9c7');for(let i=0;i<2;i++)doodleStar(x-52-i*38,y-18-i*14,2.6-i*.35,.52,i===0?1:2,-.35);doodleStar(x,y,8.2,1,cycle%3,-.28);ctx.restore();
}
// Separated hand-painted ribbons: each gap, edge and thickness is intentionally different.
function orbit(cx,cy,rx,ry,rot,alpha,front=false){
 ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.lineJoin='round';ctx.lineCap='round';
 const tilt=ry/rx,start=front?0:Math.PI,end=start+Math.PI,width=Math.max(2.8,Math.min(8.2,rx*.015)),orbitSeed=rx*.013+rot*9;
 const point=(angle,side=0,segmentPhase=0)=>{const breathe=Math.sin(angle*3.15+orbitSeed+time*.3)*rx*.014+Math.sin(angle*6.7-orbitSeed+time*.19)*rx*.01+Math.sin(angle*13.7+orbitSeed-time*.13)*rx*.004;const organicWidth=width*(.72+.25*Math.sin(angle*3.3+orbitSeed+segmentPhase)+.11*Math.sin(angle*17-orbitSeed));const edge=side*organicWidth+side*Math.sin(angle*37+orbitSeed*2)*width*.12;const rr=rx+breathe+edge;return [Math.cos(angle)*rr,Math.sin(angle)*rr*tilt]};
 const segments=[];for(let k=0;k<4;k++){const slotA=mix(start,end,k/4),slotB=mix(start,end,(k+1)/4),jitterA=.045+(.5+.5*Math.sin(orbitSeed*2.7+k*5.1))*.105,jitterB=.055+(.5+.5*Math.sin(orbitSeed*1.9+k*7.3))*.13,a=slotA+jitterA,b=slotB-jitterB,segPhase=k*.9+orbitSeed;if(b-a<.28)continue;segments.push([a,b,segPhase]);ctx.beginPath();for(let i=0;i<=34;i++){const p=point(mix(a,b,i/34),1,segPhase);i?ctx.lineTo(...p):ctx.moveTo(...p)}for(let i=34;i>=0;i--)ctx.lineTo(...point(mix(a,b,i/34),-1,segPhase));ctx.closePath();ctx.fillStyle=`rgba(255,237,187,${alpha*(front?.94:.58)})`;ctx.fill();ctx.strokeStyle=`rgba(79,82,100,${alpha*(front?.6:.3)})`;ctx.lineWidth=1;ctx.stroke();ctx.beginPath();for(let i=0;i<=26;i++){const p=point(mix(a,b,i/26),.22,segPhase);i?ctx.lineTo(...p):ctx.moveTo(...p)}ctx.strokeStyle=`rgba(255,252,226,${alpha*(front?.48:.21)})`;ctx.lineWidth=.9;ctx.stroke()}
 const runner=(time*(.17+rx*.00008)+orbitSeed)%TAU;for(const [a,b,segPhase] of segments)if(runner>=a&&runner<=b){const p=point(runner,0,segPhase);ctx.fillStyle=`rgba(255,250,219,${alpha*(front?.98:.55)})`;ctx.beginPath();ctx.ellipse(p[0],p[1],width*.65,width*.38,runner,0,TAU);ctx.fill();break}
 ctx.restore();
}
function updateAtlas(bodies){
 if(!program||time-atlasTime<1/24)return;atlasTime=time;
 gl.useProgram(program);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.viewport(0,0,PLANET_RES,PLANET_RES);gl.uniform1f(ut,time*.6);gl.uniform1f(uk,0);gl.uniform3f(ul,-.65,.8,1.3);gl.drawArrays(gl.TRIANGLES,0,6);
 for(const body of bodies){const k=body.kind;gl.viewport(PLANET_RES,k*MOON_RES,MOON_RES,MOON_RES);gl.uniform1f(ut,time*(k===0?.75:1.1)+k*15);gl.uniform1f(uk,k+1);gl.uniform3f(ul,-body.ox/body.distance*.9,-body.oy/body.distance*.9+.25,.65);gl.drawArrays(gl.TRIANGLES,0,6)}
 atlasContext.clearRect(0,0,ATLAS_W,ATLAS_H);atlasContext.drawImage(surface,0,0);
}
function planetRing(x,y,r,front){ctx.save();ctx.translate(x,y);ctx.rotate(-.38);for(let i=0;i<4;i++){ctx.strokeStyle=['#cabbd89c','#e5cfbaa8','#c9c7dfa0','#7f859670'][i];ctx.lineWidth=r*.095;ctx.beginPath();ctx.ellipse(0,0,r*(1.5+i*.1),r*(.48+i*.036),0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke()}ctx.restore()}
function drawPlanet(body){
 const {x,y,r,kind}=body;if(kind===1)planetRing(x,y,r,false);
 if(program)ctx.drawImage(atlas,PLANET_RES,ATLAS_H-(kind+1)*MOON_RES,MOON_RES,MOON_RES,x-r*1.055,y-r*1.055,r*2.11,r*2.11);
 else sphere(x,y,r,['#edbb94','#bcb6df','#9ac9d9'][kind]);
 if(kind===1)planetRing(x,y,r,true);
}
// The orbit is a circular path in a tilted 3D plane. z controls occlusion.
function orbitBody(cx,cy,unit,i,clock){const distance=[2.12,2.92,3.72][i]*unit,tilt=[.52,.62,.56][i]+my*.075,rot=[-.39,-.25,-.32][i]+mx*.24+Math.sin(clock*.11+i*2.1)*.012,a=clock*[.14,.095,.067][i]+[.7,3.5,5.4][i];const ox=Math.cos(a)*distance,oy=Math.sin(a)*distance*tilt;return {x:cx+ox*Math.cos(rot)-oy*Math.sin(rot),y:cy+ox*Math.sin(rot)+oy*Math.cos(rot),z:Math.sin(a)*distance*Math.sqrt(1-tilt*tilt),r:unit*[.235,.27,.215][i],kind:i,distance,tilt,rot,ox:ox*Math.cos(rot)-oy*Math.sin(rot),oy:ox*Math.sin(rot)+oy*Math.cos(rot)};}
// Curved surface and scenery share one rotation; one scroll turns 120 degrees.
function path(points,fill,stroke='#586473',width=1.5){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function line(points,color='#586473',width=1.5){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function rock(x,y,size){ctx.save();ctx.translate(x,y);path([[-size,0],[-size*.6,-size*.55],[-size*.1,-size*.67],[size*.65,-size*.4],[size,0]],'#c3c5dc');path([[-size*.1,-size*.67],[size*.65,-size*.4],[size,0],[size*.1,-size*.08]],'#999fbe',null);line([[-size*.6,-size*.55],[-size*.25,-size*.2],[size*.1,-size*.08]],'#7c88a3');ctx.restore()}
function telescope(){
ctx.save();ctx.rotate(-.08);
path([[-23,0],[-3,-84],[9,-84],[29,0],[21,1],[4,-63],[-15,2]],'#dbc5b0');
path([[-4,-68],[4,-82],[8,-11],[-1,-10]],'#8c9cba');
ctx.save();ctx.translate(4,-92);ctx.rotate(-.43);
path([[-60,-22],[49,-22],[60,-13],[60,15],[49,23],[-60,23]],'#b7e7df');
path([[-60,8],[48,8],[60,15],[49,23],[-60,23]],'#83b5bc',null);
path([[-70,-27],[-52,-27],[-52,27],[-70,27]],'#f1b6c8');
ctx.fillStyle='#516584';ctx.beginPath();ctx.ellipse(-70,0,7,27,0,0,7);ctx.fill();ctx.stroke();
path([[59,-9],[82,-9],[82,9],[59,9]],'#efe1b9');line([[-42,-13],[33,-13]],'#fff8e6',3);ctx.restore();ctx.restore();
}
function books(){
path([[-59,-8],[62,-8],[67,-37],[-53,-38]],'#ecc0cc');path([[-51,-15],[61,-15],[61,-30],[-49,-31]],'#fff2d9');line([[-42,-23],[53,-23]],'#c6b6bc');
path([[-48,-41],[52,-41],[47,-67],[-51,-66]],'#abc9dd');path([[-43,-45],[44,-45],[42,-60],[-46,-60]],'#f4edd8');
path([[-60,-72],[40,-72],[44,-97],[-58,-96]],'#aeddd2');path([[-50,-76],[37,-76],[38,-89],[-50,-89]],'#fff2d9');
path([[-21,-103],[13,-114],[58,-102],[19,-91]],'#dac4ed');path([[2,-96],[3,-84],[27,-81],[34,-90]],'#a593bb');line([[47,-100],[49,-72],[43,-68]],'#f5d696',2.5);
}
function antenna(){
path([[-32,0],[-18,-28],[17,-28],[33,0]],'#b3cbd9');path([[-7,-25],[-6,-91],[6,-91],[8,-25]],'#d7c7dc');
ctx.save();ctx.translate(0,-102);ctx.rotate(-.4);ctx.beginPath();ctx.moveTo(-49,-30);ctx.quadraticCurveTo(-48,45,47,30);ctx.closePath();ctx.fillStyle='#efd0da';ctx.fill();ctx.strokeStyle='#586473';ctx.lineWidth=1.8;ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,58,18,.56,0,7);ctx.fillStyle='#b3e2dc';ctx.fill();ctx.stroke();line([[0,0],[24,-36]],'#727e91',3);sphere(24,-36,5,'#f6dea2');ctx.restore();
for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(52,-158,12+i*16,17+i*14,-.4,-1.3,1.4);ctx.strokeStyle='#b7dfd0';ctx.lineWidth=1.4;ctx.stroke()}
}
function drawTerrain(cx,cy,R,turn,mobile){
ctx.save();ctx.translate(cx,cy);ctx.rotate(-turn);
// A gently imperfect silhouette avoids a mechanically perfect sphere.
ctx.beginPath();for(let i=0;i<=320;i++){const a=i/320*Math.PI*2,rr=R+Math.sin(a*37)*2+Math.sin(a*63)*1.2;const x=Math.sin(a)*rr,y=-Math.cos(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fillStyle='#aed9d1';ctx.fill();ctx.strokeStyle='#6f8b98';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.clip();
for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(-R*.38,-R*1.03);ctx.bezierCurveTo(-R*.33,-R*.84,R*.23,-R*.97,R*.18,-R*.66);ctx.bezierCurveTo(R*.09,-R*.45,-R*.19,-R*.34,R*.07,-R*.11);ctx.lineTo(R*.32,0);ctx.bezierCurveTo(-R*.24,-R*.55,R*.47,-R*.78,R*.1,-R*1.08);ctx.closePath();ctx.fillStyle=i%2?'#e8b7ca':'#c2bed9';ctx.fill();ctx.strokeStyle='#7f8f9a80';ctx.lineWidth=1.2;ctx.stroke();ctx.restore()}
for(let i=0;i<65;i++){ctx.save();ctx.rotate(i*2.399);const rr=R*(.72+(i%7)*.036),x=0,y=-rr,sz=9+(i%5)*7;ctx.beginPath();ctx.ellipse(x,y,sz,sz*.24,.16,0,Math.PI*1.65);ctx.strokeStyle='#658d9d77';ctx.lineWidth=1.2;ctx.stroke();if(i%3===0){line([[-sz*.7,y+5],[-sz*.2,y+7],[sz*.4,y+6]],'#f7e7df90',1.2)}ctx.restore()}
ctx.restore();
// Three landmarks live on the same globe, spaced one third of a turn apart.
for(let i=0;i<3;i++){
 const a=i*Math.PI*2/3+.23;ctx.save();ctx.rotate(a);ctx.translate(0,-R);const scale=mobile?.55:Math.min(w/1280,1.3)*1.35;ctx.scale(scale,scale);
 ctx.fillStyle='#697f9950';ctx.beginPath();ctx.ellipse(4,1,86,9,0,0,7);ctx.fill();
 if(i===0)telescope();if(i===1)books();if(i===2)antenna();
 rock(-104,8,19);rock(100,8,26);rock(137,13,10);
 ctx.restore();
}
for(let i=0;i<24;i++){ctx.save();ctx.rotate(i*Math.PI/12+.045);ctx.translate(0,-R);rock(0,3,8+(i%4)*6);ctx.restore()}
ctx.restore();
}

const nameCanvas=document.createElement('canvas');nameCanvas.className='burn-name';nameCanvas.setAttribute('aria-hidden','true');document.querySelector('#name').append(nameCanvas);
const nameContext=nameCanvas.getContext('2d'),letterLayer=document.createElement('canvas'),letterContext=letterLayer.getContext('2d');let nameWidth=0,nameHeight=0,burnStart=-1,nameWasVisible=false,nameComplete=false;
document.fonts.ready.then(()=>{nameWidth=0;nameComplete=false});
function drawName(now,p){
 const active=p>.35&&p<1.8;
 if(!active){nameWasVisible=false;return}if(!nameWasVisible){burnStart=now;nameWasVisible=true;nameComplete=false}
 if(nameComplete&&nameWidth===w&&nameHeight===h)return;
 if(nameWidth!==w||nameHeight!==h){nameWidth=w;nameHeight=h;nameCanvas.width=letterLayer.width=w;nameCanvas.height=letterLayer.height=h;
  let size=Math.min(w*.195,h*.285);letterContext.font=`${size}px 'Lilita One', 'Arial Black', sans-serif`;size*=Math.min(1,w*.94/letterContext.measureText('ZHUOXUN').width);
  letterContext.font=`${size}px 'Lilita One', 'Arial Black', sans-serif`;letterContext.textAlign='center';letterContext.lineJoin='round';letterContext.fillStyle='#ffedbb';letterContext.strokeStyle='#555365';letterContext.lineWidth=Math.max(2,size*.018);
  for(const [word,y] of [['ZHUOXUN',h*.45],['WU',h*.45+size*.92]]){letterContext.strokeText(word,w*.5,y);letterContext.fillText(word,w*.5,y)}
 }
 nameCanvas.classList.add('ready');document.querySelector('#name').classList.add('has-burn');const amount=reduced.matches?1:clamp((now-burnStart)/1900);if(amount>=1)nameComplete=true;const g=nameContext;g.clearRect(0,0,w,h);g.globalCompositeOperation='source-over';g.drawImage(letterLayer,0,0);
 if(amount<1){
  const edge=h*.85-amount*h*.86;const pts=[];for(let i=0;i<=90;i++){const x=i*w/90;const y=edge+Math.sin(i*1.79+now*.005)*h*.014+Math.sin(i*.41-now*.003)*h*.03;pts.push([x,y])}
  g.globalCompositeOperation='destination-in';g.beginPath();g.moveTo(0,h);for(const v of pts)g.lineTo(...v);g.lineTo(w,h);g.closePath();g.fill();
  g.globalCompositeOperation='source-atop';for(const [color,width] of [['#db713b',18],['#ffb84d',10],['#fff0a5',3]]){g.beginPath();pts.forEach((v,i)=>i?g.lineTo(...v):g.moveTo(...v));g.strokeStyle=color;g.lineWidth=width;g.stroke()}
  g.globalCompositeOperation='source-over';for(let i=0;i<14;i++){const x=(i*.071+.03)*w,y=edge-14-(Math.sin(i*4+now*.002)+1)*25;g.fillStyle=i%2?'#efaa5b':'#ffe0a2';g.globalAlpha=Math.sin(amount*Math.PI)*.7;g.fillRect(x,y,2,3)}g.globalAlpha=1;
 }
}

let perfFrames=0,perfStart=0,lastUI=-99;
function render(t){requestAnimationFrame(render);if(!perfStart)perfStart=t;if(++perfFrames>=60){canvas.dataset.fps=(60000/(t-perfStart)).toFixed(1);perfFrames=0;perfStart=t;}if(document.hidden){last=t;return}const dt=Math.min((t-last)/1000||0,.05);last=t;if(!paused)time+=dt;progress+= (target-progress)*(reduced.matches?1:1-Math.exp(-dt*4.5));mx+=(px-mx)*(1-Math.exp(-dt*5.2));my+=(py-my)*(1-Math.exp(-dt*5.2));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080a0d';ctx.fillRect(0,0,w,h);
drawName(t,progress);
const p=progress,inside=smooth((p-2.3)/.6),mobile=w<761;
drawSpaceDust(p);
for(let s of stars){let x=(s.x*w+mx*(24+s.z*96)+p*s.z*24+w)%w,y=(s.y*h+my*(18+s.z*72)-p*s.z*14+h)%h;ctx.globalAlpha=s.a*(.72+.28*Math.sin(time*.62+s.phase));ctx.fillStyle=s.z>.7?'#a8dcd4':'#e8e4d5';ctx.beginPath();ctx.arc(x,y,s.r*(mobile?.68:1),0,TAU);ctx.fill();if(s.z>.965)doodleStar(x,y,3.7+s.r*1.6,.58,Math.floor(s.phase)%3,s.phase*.7)}ctx.globalAlpha=1;
for(const s of doodleStars){const x=(s.x*w+mx*(38+s.z*112)+p*s.z*19+w)%w,y=(s.y*h+my*(28+s.z*78)-p*s.z*11+h)%h;doodleStar(x,y,s.r*(mobile?.72:1),s.a*(.78+.22*Math.sin(time*.42+s.phase)),s.kind,s.rot+Math.sin(time*.22+s.phase)*.09)}drawMeteor();
const base=Math.min(w*.112,h*.17),zoom=smooth((p-1.2)/1.6),entry=smooth((p-2.0)/.9);
const R=Math.max(w*.8,h*.8),top=h*(mobile?.84:.79),cameraX=-mx*w*(mobile?.065:.12),cameraY=-my*h*(mobile?.04:.085),cx=w*.5+cameraX,cy=mix(h*.48+cameraY,top+R,entry),r=mix(base*.9*(1+zoom*4),R,entry);
let turn=(p-3)*Math.PI*2/3;
if(entry<.998){
const fade=1-entry;ctx.save();ctx.globalAlpha=fade;
const unit=r/.9,orbitAlpha=.58*(1-zoom*.8),bodies=[0,1,2].map(i=>orbitBody(cx,cy,unit,i,time));updateAtlas(bodies);
// Draw rear arcs and planets first, then the star, then front arcs and planets.
for(const body of bodies)orbit(cx,cy,body.distance,body.distance*body.tilt,body.rot,orbitAlpha,false);
for(const body of bodies.filter(b=>b.z<0).sort((a,b)=>a.z-b.z))drawPlanet(body);
const halo=ctx.createRadialGradient(cx,cy,r*.8,cx,cy,r*1.35);halo.addColorStop(0,'#a9dcd914');halo.addColorStop(1,'#a9dcd900');ctx.fillStyle=halo;ctx.fillRect(cx-r*1.35,cy-r*1.35,r*2.7,r*2.7);
if(program)ctx.drawImage(atlas,0,ATLAS_H-PLANET_RES,PLANET_RES,PLANET_RES,cx-r*1.055,cy-r*1.055,r*2.11,r*2.11);else sphere(cx,cy,r,'#a3dcd4');
for(const body of bodies)orbit(cx,cy,body.distance,body.distance*body.tilt,body.rot,orbitAlpha,true);
for(const body of bodies.filter(b=>b.z>=0).sort((a,b)=>a.z-b.z))drawPlanet(body);
ctx.restore();}
if(entry>.001){ctx.save();ctx.globalAlpha=entry;drawTerrain(w*.5,top+R,R,turn,mobile);ctx.restore();}
if(Math.abs(p-lastUI)>.0004){lastUI=p;
for(let i=0;i<scenes.length;i++){const dist=Math.abs(p-i);let opacity=1-smooth((dist-.08)/.4);if(i===0)opacity=1-smooth(p/.7);if(i===5)opacity=smooth((p-4.25)/.6);const visible=opacity>.015;scenes[i].style.opacity=opacity;scenes[i].classList.toggle('active',visible);scenes[i].inert=!visible;scenes[i].style.transform=i>=3?`translate(${(i-p)*80}px,0)`:`translateY(${(i-p)*35}px)`;}
document.body.classList.toggle('on-surface',p>2.6);document.querySelector('.header-note').textContent=p>2.6?['ABOUT','EDUCATION','CONTACT'][clamp(Math.round(p)-3,0,2)]:'ZHUOXUN WU';const chapter=clamp(Math.round(p)-2,0,3);document.querySelector('.chapter-nav').classList.toggle('visible',p>2.6);document.querySelectorAll('.chapter-nav a').forEach((a,i)=>{a.classList.toggle('selected',chapter===i+1);if(chapter===i+1)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});document.querySelector('#counter').textContent=`0${chapter} — 03`;document.querySelector('#scroll-label').textContent=p>4.65?'BACK TO TOP':p>2.6?'NEXT SECTION':'SCROLL';
}
}
function go(index){index=clamp(index,0,5);window.scrollTo({top:index*h,behavior:'instant'});}
addEventListener('scroll',()=>{target=clamp(scrollY/h,0,5)},{passive:true});
addEventListener('pointermove',e=>{if(!paused){px=e.clientX/w-.5;py=e.clientY/h-.5}},{passive:true});
let wheelLock=0,wheelSum=0,wheelLast=0;
addEventListener('wheel',e=>{if(e.ctrlKey||document.querySelector('nav.open'))return;const chapter=document.querySelector('.chapter.active');if(chapter&&chapter.scrollHeight>chapter.clientHeight+5){if(e.deltaY>0&&chapter.scrollTop+chapter.clientHeight<chapter.scrollHeight-3||e.deltaY<0&&chapter.scrollTop>3)return;}e.preventDefault();const now=performance.now();if(now<wheelLock)return;if(now-wheelLast>180)wheelSum=0;wheelLast=now;wheelSum+=e.deltaY;if(Math.abs(wheelSum)>35){go(Math.round(target)+Math.sign(wheelSum));wheelLock=now+1000;wheelSum=0}},{passive:false});
let touchY=0;addEventListener('touchstart',e=>{touchY=e.touches[0].clientY},{passive:true});addEventListener('touchend',e=>{const ch=document.querySelector('.chapter.active');if(ch&&ch.scrollHeight>ch.clientHeight+5)return;const dy=touchY-e.changedTouches[0].clientY;if(Math.abs(dy)>45)go(Math.round(target)+Math.sign(dy));},{passive:true});
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName))return;let n;if(['ArrowDown','PageDown',' '].includes(e.key))n=Math.round(target)+1;if(['ArrowUp','PageUp'].includes(e.key))n=Math.round(target)-1;if(e.key==='Home')n=0;if(e.key==='End')n=5;if(n!==undefined){e.preventDefault();go(n)}});
const menu=document.querySelector('#navigation'),toggle=document.querySelector('#menu-toggle');function closeMenu(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();toggle.focus()}});addEventListener('click',e=>{if(!menu.contains(e.target)&&!toggle.contains(e.target))closeMenu()});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const index=ids.indexOf(a.hash.slice(1));if(index>=0){e.preventDefault();closeMenu();history.replaceState(null,'',a.hash);go(index)}}));
document.querySelector('#next').addEventListener('click',()=>go(target>4.5?0:Math.round(target)+1));
const motion=document.querySelector('#motion');function motionUI(){motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume ambient animation':'Pause ambient animation');motion.querySelector('span').textContent=paused?'MOTION OFF':'MOTION ON'}motionUI();motion.addEventListener('click',()=>{paused=!paused;motionUI()});reduced.addEventListener('change',()=>{paused=reduced.matches;motionUI()});
addEventListener('hashchange',()=>{const index=ids.indexOf(location.hash.slice(1));if(index>=0)go(index)});
const initial=ids.indexOf(location.hash.slice(1));if(initial>=0){window.scrollTo(0,initial*h);target=progress=initial}requestAnimationFrame(render);
})();
