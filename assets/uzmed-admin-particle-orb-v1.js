/* Audio-reactive point-cloud sphere for UZMED ADMIN (Canvas 2D, no external assets). */
(function(){
'use strict';
const canvas=document.getElementById('voice-sphere');
const stage=document.getElementById('orb');
if(!canvas||!stage)return;
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx)return;
const modes=new Set(['idle','listening','speaking','thinking','error']);
const SIZE=900,points=[];
const golden=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<SIZE;i++){
 const y=1-2*(i+.5)/SIZE;
 const r=Math.sqrt(Math.max(0,1-y*y));
 const a=i*golden;
 points.push([r*Math.cos(a),y,r*Math.sin(a),i%7]);
}
let mode='idle',src=null,srcMode='',time=0,lastFrame=0,raf=0,amplitude=0;
const bytes=new Uint8Array(512);
let width=240,height=240,dpr=1;
function fit(){
 const box=canvas.getBoundingClientRect();
 if(!box.width||!box.height)return;
 width=box.width;height=box.height;
 dpr=Math.min(2,window.devicePixelRatio||1);
 const w=Math.round(width*dpr),h=Math.round(height*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function setMode(next){
 mode=modes.has(next)?next:'idle';
 stage.dataset.mode=mode;
 if(mode!=='speaking'&&mode!=='listening'){src=null;srcMode='';}
}
function setAnalyser(analyser,which){
 if(analyser&&['listening','speaking'].includes(which)){
  src=analyser;srcMode=which;setMode(which);
 }else{src=null;srcMode='';}
}
function energy(){
 if(!src||srcMode!==mode)return 0;
 try{
  if(mode==='listening'){
   const n=src.fftSize||2048;
   const tmp=new Uint8Array(n);
   src.getByteTimeDomainData(tmp);
   let power=0;
   for(let i=0;i<tmp.length;i++){const v=(tmp[i]-128)/128;power+=v*v;}
   return Math.min(1,Math.sqrt(power/tmp.length)*6.5);
  }
  const n=src.frequencyBinCount||128;
  if(bytes.length<n){const d=new Uint8Array(n);src.getByteFrequencyData(d);
   let total=0;for(let i=2;i<Math.min(n,180);i++)total+=d[i];
   return Math.min(1,total/Math.max(1,Math.min(n,180)-2)/110);
  }
  src.getByteFrequencyData(bytes.subarray(0,n));
  let sum=0,count=0;
  for(let i=2;i<Math.min(n,170);i++){sum+=bytes[i];count++;}
  return Math.min(1,sum/(Math.max(1,count)*105));
 }catch{return 0;}
}
function draw(ms){
 raf=requestAnimationFrame(draw);
 if(ms-lastFrame<30)return;
 const dt=Math.min(0.05,Math.max(.016,(ms-lastFrame)/1000||.033));
 lastFrame=ms;
 if(!canvas.clientWidth)return;
 if(width!==canvas.clientWidth||height!==canvas.clientHeight)fit();
 const target=energy();
 amplitude+=(target-amplitude)*(target>amplitude?.28:.12);
 time+=dt*(mode==='speaking'?1.22:mode==='listening'?.9:.38);
 ctx.clearRect(0,0,width,height);
 const cx=width/2,cy=height/2;
 const radius=Math.min(width,height)*.335;
 const beat=mode==='speaking'?amplitude:(mode==='listening'?amplitude*.75:.08);
 const rotY=time*.55,rotX=.24+Math.sin(time*.48)*.19;
 const cosY=Math.cos(rotY),sinY=Math.sin(rotY);
 const cosX=Math.cos(rotX),sinX=Math.sin(rotX);
 const glow=ctx.createRadialGradient(cx,cy,10,cx,cy,radius*1.5);
 const hue=mode==='listening'?183:mode==='speaking'?200:218;
 glow.addColorStop(0,'hsla('+hue+',90%,64%,'+(.09+beat*.12)+')');
 glow.addColorStop(.58,'hsla('+hue+',100%,52%,'+(.09+beat*.09)+')');
 glow.addColorStop(1,'hsla('+hue+',90%,50%,0)');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,radius*1.54,0,Math.PI*2);ctx.fill();
 const active=mode==='listening'||mode==='speaking';
 for(let i=0;i<points.length;i++){
  let [x,y,z,band]=points[i];
  // Low frequency, coherent deformations: a breathing point-cloud sphere.
  const wave=Math.sin(y*8+time*2.4+x*3)+Math.sin(x*7-y*5-time*1.7);
  const swell=1+(active?beat*.22:.025*Math.sin(time*1.6))+wave*(active?(.013+beat*.065):.017);
  x*=swell;y*=swell;z*=swell;
  const xx=x*cosY-z*sinY,zz=x*sinY+z*cosY;
  const yy=y*cosX-zz*sinX,depth=y*sinX+zz*cosX;
  const perspective=2.85/(2.85-depth*.45);
  const px=cx+xx*radius*perspective,py=cy+yy*radius*perspective;
  const front=(depth+1.35)/2.7;
  const alpha=Math.min(.97,Math.max(.15,.17+front*.73));
  const size=(.55+front*.95+beat*.38)*Math.min(width,height)/260;
  ctx.fillStyle=mode==='speaking'?'rgba(237,251,255,'+alpha+')':
    mode==='listening'?'rgba(190,249,255,'+alpha+')':'rgba(230,239,255,'+alpha+')';
  ctx.beginPath();ctx.arc(px,py,Math.max(.45,size),0,Math.PI*2);ctx.fill();
 }
 // Fine orbit line, indicates rotation even during silence.
 ctx.strokeStyle='rgba(131,190,255,'+(.11+beat*.15)+')';
 ctx.lineWidth=1;ctx.beginPath();
 ctx.ellipse(cx,cy,radius*1.13,radius*.31,rotY*.7,0,Math.PI*2);ctx.stroke();
 stage.style.setProperty('--voice-level',beat.toFixed(3));
}
fit();requestAnimationFrame(draw);
window.addEventListener('resize',fit,{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){ctx.clearRect(0,0,width,height);setAnalyser(null);}
});
window.UZMEDVoiceOrb={setMode,setAnalyser,getMode:()=>mode};
})();
