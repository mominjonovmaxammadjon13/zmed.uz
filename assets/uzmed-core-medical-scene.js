// UZMED interactive clinical environment. Procedural, no external models/trackers.
export function enhanceRoom(T,scene,config){
  const {mobile,floorW,backZ}=config;
  const mat=(color,em=.0,opacity=1)=>new T.MeshStandardMaterial({color,roughness:.46,metalness:.24,emissive:color,emissiveIntensity:em,transparent:opacity<1,opacity,depthWrite:opacity===1});
  const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
  function box(w,h,d,x,y,z,color,em=0,parent=scene,opacity=1){
    const obj=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color,em,opacity));obj.position.set(x,y,z);parent.add(obj);return obj;
  }
  function photoPanel(kind){
    const c=document.createElement('canvas');c.width=640;c.height=400;
    const x=c.getContext('2d');x.fillStyle='#061b2c';x.fillRect(0,0,640,400);
    x.strokeStyle='#21748f';x.lineWidth=3;x.strokeRect(12,12,616,376);
    x.fillStyle='#57d5ed';x.font='bold 21px system-ui';x.fillText(kind==='vital'?'UZMED  •  PATIENT VITALS':'UZMED  •  DIAGNOSTIC IMAGING',25,42);
    x.strokeStyle='rgba(45,212,191,.12)';x.lineWidth=1;
    for(let i=60;i<640;i+=32){x.beginPath();x.moveTo(i,56);x.lineTo(i,370);x.stroke()}
    for(let i=60;i<395;i+=32){x.beginPath();x.moveTo(22,i);x.lineTo(619,i);x.stroke()}
    if(kind==='vital'){
      x.strokeStyle='#33f5ce';x.lineWidth=6;x.beginPath();
      const pts=[[26,210],[85,210],[105,196],[123,224],[147,210],[172,210],[181,152],[197,304],[216,128],[230,210],[305,210],[322,190],[346,210],[420,210],[444,210],[455,165],[469,283],[486,170],[498,210],[614,210]];
      pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.stroke();
      x.font='bold 50px system-ui';x.fillStyle='#6ef7c4';x.fillText('♥  72',35,119);x.fillStyle='#60dafa';x.fillText('SpO₂ 98%',285,119);
      x.font='bold 24px system-ui';x.fillStyle='#8bbad0';x.fillText('ECG • HEART RATE   /   BP 120/80',35,350);
    }else{
      x.strokeStyle='#39b8e3';x.lineWidth=4;
      for(let i=0;i<9;i++){x.beginPath();x.ellipse(190,218,75+i*4,105+i*3,i*.15,0,Math.PI*2);x.stroke()}
      x.beginPath();x.moveTo(190,110);x.lineTo(190,315);x.stroke();
      x.font='bold 25px system-ui';x.fillStyle='#93c5fd';x.fillText('MRI / CT',350,140);
      for(let i=0;i<6;i++){x.fillStyle=i%2?'#15b8bd':'#60a5fa';x.fillRect(360,175+i*25,135-(i%3)*20,8)}
      x.fillStyle='#8bbad0';x.fillText('IMAGE REVIEW  •  AI',350,346);
    }
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    return new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide});
  }
  // Medical monitors create the sense of a full department behind the team.
  function monitor(x,y,z,w,h,kind){
    box(w+.22,h+.2,.12,x,y,z-.07,0x112e43,.04);
    let m=new T.Mesh(new T.PlaneGeometry(w,h),photoPanel(kind));m.position.set(x,y,z+.012);scene.add(m);
    box(w+.25,.035,.14,x,y-h/2-.13,z-.04,0x38d9f0,.85);
  }
  monitor(-floorW*.29,3.12,backZ+.26,mobile?4.0:6.5,2.55,'vital');
  monitor(floorW*.30,3.12,backZ+.26,mobile?3.6:6.1,2.55,'scan');
  // Wall architecture and surgical lights
  for(let i=0;i<5;i++){
    const px=-floorW/2+1.2+i*(floorW-2.4)/4;
    box(.09,6.1,.28,px,3.2,backZ+.18,0x19506b,.20);
    box(.07,.06,1.7,px,5.85,backZ+1.05,0x67e8f9,.76);
  }
  box(floorW*.96,.11,.24,0,5.8,backZ+.26,0x1d95b5,.28);
  // Removed the three oversized overhead rectangles blocking the agents.
  // Glass-panel consulting room at the right wall
  if(!mobile){
    for(let i=0;i<4;i++)box(.06,3.85,.09,floorW/2-.25,2.03,-7+i*2.3,0x3994ad,.26);
    box(.06,.085,8.4,floorW/2-.25,4.0,-3.55,0x67e8f9,.85);
    box(.04,3.3,8.1,floorW/2-.3,2.0,-3.55,0x4dc0c5,.025,scene,.16);
  }
  // A holographic glowing cerebral network over the central supervisor.
  const brain=new T.Group();brain.position.set(0,3.95,backZ+2.05);
  const brainCore=new T.Mesh(new T.IcosahedronGeometry(.63,2),new T.MeshBasicMaterial({color:0x40bfff,wireframe:true,transparent:true,opacity:.72}));brain.add(brainCore);
  const brainHalo=new T.Mesh(new T.TorusGeometry(1.0,.035,8,64),new T.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.75}));brainHalo.rotation.x=Math.PI/2;brainHalo.position.y=.3;brain.add(brainHalo);
  const tube=new T.Mesh(new T.CylinderGeometry(.93,1.15,3.8,28,1,true),new T.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.08,side:T.DoubleSide,depthWrite:false}));tube.position.y=-1.12;brain.add(tube);scene.add(brain);
  // Floor remains uncluttered; no neon links connecting agent workstations.
  // Contemporary planters and clinic tables.
  function plant(x,z,s=1){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);
    let pot=new T.Mesh(new T.CylinderGeometry(.28,.20,.5,9),mat(0x526d74,.07));pot.position.y=.28;g.add(pot);
    const stem=new T.Mesh(new T.CylinderGeometry(.038,.056,1.20,7),mat(0x567243));stem.position.y=1.03;g.add(stem);
    for(let j=0;j<7;j++){
      const theta=j*Math.PI*2/7;
      const leaf=new T.Mesh(new T.SphereGeometry(.13,8,5),mat(j%2?0x0f766e:0x0d9488,.08));
      leaf.scale.set(.9,2.35,.52);leaf.position.set(Math.cos(theta)*.31,1.45+(j%3)*.12,Math.sin(theta)*.28);
      leaf.rotation.z=-Math.cos(theta)*.54;leaf.rotation.x=Math.sin(theta)*.5;g.add(leaf);
    }
    scene.add(g);
  }
  plant(-floorW/2+.6,backZ+3.4,1.1);
  plant(floorW/2-.7,backZ+3.3,1.1);
  plant(-floorW/2+.6,mobile?7:6.7,1.0);
  plant(floorW/2-.7,mobile?10:7.0,.88);
  // Pinterest-inspired clinical workstation: sterile equipment, no fake patient data.
  // Keep movable agent workspaces uncluttered; desktop only, few draw calls.
  let wardBeacon=null;
  if(!mobile){
    const sterile=mat(0xd9f4f3,.02),steel=mat(0x4b8290,.04),teal=mat(0x0f766e,.16);
    const clinicalTrolley=new T.Group();
    clinicalTrolley.position.set(floorW*.45,0,backZ+3.3);
    for(const dx of [-.39,.39])for(const dz of [-.23,.23]){
      const leg=new T.Mesh(new T.CylinderGeometry(.035,.035,.87,8),steel);
      leg.position.set(dx,.52,dz);clinicalTrolley.add(leg);
      const wheel=new T.Mesh(new T.CylinderGeometry(.09,.09,.055,10),mat(0x243747));
      wheel.rotation.z=Math.PI/2;wheel.position.set(dx,.13,dz);
      clinicalTrolley.add(wheel);
    }
    const tray=new T.Mesh(new T.BoxGeometry(1.0,.075,.66),sterile);
    tray.position.set(0,1.03,0);clinicalTrolley.add(tray);
    const lowerTray=new T.Mesh(new T.BoxGeometry(.90,.065,.60),steel);
    lowerTray.position.set(0,.49,0);clinicalTrolley.add(lowerTray);
    const supplies=new T.Mesh(new T.BoxGeometry(.42,.24,.36),teal);
    supplies.position.set(-.18,1.18,-.04);clinicalTrolley.add(supplies);
    const whiteCross=mat(0xf0fffa,.08);
    const crossVertical=new T.Mesh(new T.BoxGeometry(.055,.14,.012),whiteCross);
    crossVertical.position.set(-.18,1.185,.146);clinicalTrolley.add(crossVertical);
    const crossHorizontal=new T.Mesh(new T.BoxGeometry(.14,.055,.012),whiteCross);
    crossHorizontal.position.set(-.18,1.185,.155);clinicalTrolley.add(crossHorizontal);
    scene.add(clinicalTrolley);
  }
  // Tiny neutral status beacon on clinic wall, decorative only (not a fake live alert).
  wardBeacon=new T.Mesh(new T.SphereGeometry(.085,10,8),basic(0x5eead4,.78));
  wardBeacon.position.set(-floorW*.45,4.95,backZ+.42);scene.add(wardBeacon);
  // Signs and wall cross remain in native scene; animate extras at frame rate.
  return function animateRoom(t){
    brain.rotation.y=Math.sin(t*.25)*.19;
    brainCore.rotation.y=t*.17;brainCore.rotation.x=Math.sin(t*.45)*.09;
    brainHalo.material.opacity=.48+Math.sin(t*1.2)*.22;
    wardBeacon.material.opacity=.60+Math.sin(t*.8)*.14;
  };
}

export function enhanceDoctor(T,person,role,boss){
  const color=(hex)=>new T.MeshStandardMaterial({color:hex,roughness:.66,metalness:0});
  const skin=color(0xc58b65),ink=color(0x172235),cyan=color(0x0891b2);
  const head=person.userData.head,face=person.userData.face;
  if(!head)return;
  // Repair face transforms: face moves and turns together with head, toward viewer.
  if(face){
    const all=[...face.eyes,...face.pupils,...face.brows,face.mouth];
    all.forEach(m=>{
      m.parent.remove(m);head.add(m);m.position.y-=2.1;m.position.z=Math.abs(m.position.z);
    });
  }
  const ellipsoid=(parent,radii,pos,material)=>{
    const o=new T.Mesh(new T.SphereGeometry(1,12,9),material);o.scale.set(...radii);o.position.set(...pos);parent.add(o);return o;
  };
  ellipsoid(head,[.078,.095,.07],[-.298,-.012,.03],skin);
  ellipsoid(head,[.078,.095,.07],[.298,-.012,.03],skin);
  ellipsoid(head,[.05,.065,.092],[0,-.042,.281],skin);
  // Rounded short hairstyle, combed toward one side.
  const hair=color(role==='Reviewer Agent'?0x445169:0x302b2b);
  const tuft=ellipsoid(head,[.23,.09,.21],[-.06,.244,.025],hair);tuft.rotation.z=.20;
  const side=ellipsoid(head,[.12,.14,.12],[.22,.145,.015],hair);side.rotation.z=-.26;
  // Some doctors wear glasses.
  if(role==='Evidence Agent'||role==='Reviewer Agent'||role==='Differential Agent'){
    const glmat=new T.MeshBasicMaterial({color:0x24374d});
    for(let side of [-1,1]){
      const o=new T.Mesh(new T.TorusGeometry(.092,.012,7,20),glmat);
      o.position.set(side*.098,.0,.313);head.add(o);
    }
    const bridge=new T.Mesh(new T.BoxGeometry(.065,.016,.02),glmat);bridge.position.set(0,0,.322);head.add(bridge);
  }
  if(role==='DevOps Agent'){
    const mask=ellipsoid(head,[.22,.084,.042],[0,-.128,.275],color(0x80d7e9));mask.rotation.x=.18;
  }
  // Collar, white coat, colored badge and stethoscope.
  const coat=color(boss?0xe9fdf7:0xf2f6ff),trim=color(0xb5c8d7);
  const lapelL=new T.Mesh(new T.ConeGeometry(.15,.49,3),coat);
  lapelL.position.set(-.15,1.57,.275);lapelL.rotation.z=-.23;lapelL.rotation.x=.15;person.add(lapelL);
  const lapelR=lapelL.clone();lapelR.position.x=.15;lapelR.rotation.z=.23;person.add(lapelR);
  for(let j=0;j<3;j++)ellipsoid(person,[.015,.015,.013],[.13,1.56-j*.16,.289],ink);
  const tag=new T.Mesh(new T.PlaneGeometry(.20,.11),new T.MeshBasicMaterial({color:boss?0x22c55e:0x38bdf8}));
  tag.position.set(.18,1.67,.293);person.add(tag);
  // Hand and fingers attach to moving arms.
  for(let k=0;k<2;k++){
    let hand=ellipsoid(person.userData.arms[k],[.09,.115,.09],[0,-.34,0],skin);
    hand.name='UZMED_HAND';
  }
  // Semicircular listening tube on coat, facing camera.
  if(role!=='DevOps Agent'){
    let tube=new T.Mesh(new T.TorusGeometry(.20,.023,7,26,Math.PI),new T.MeshBasicMaterial({color:0x213b47}));
    tube.position.set(-.045,1.47,.34);tube.rotation.z=Math.PI;person.add(tube);
    ellipsoid(person,[.062,.052,.035],[.155,1.34,.34],trim);
  }
  // Footwear and embroidered UZMED patch.
  for(let k of [-1,1])ellipsoid(person,[.135,.092,.20],[k*.15,.285,.09],ink);
  return person;
}

export function enhanceDesk(T,group,role,boss){
  const material=(color,opacity=1)=>new T.MeshStandardMaterial({color,metalness:.26,roughness:.48,transparent:opacity<1,opacity});
  const add=(w,h,d,x,y,z,c,opacity=1)=>{
    const o=new T.Mesh(new T.BoxGeometry(w,h,d),material(c,opacity));o.position.set(x,y,z);group.add(o);return o;
  };
  // Extra side displays, keyboards and books retain the actual agent controls.
  const x=boss?1.47:1.02;
  let sideMonitor=add(.64,.56,.05,x,1.36,-.20,0x11466a);sideMonitor.rotation.y=-.30;
  add(.54,.035,.04,x,1.53,-.234,0x22d3ee);
  for(let j=0;j<3;j++){
    add(.30,.056,.23,boss?-1.38:-1.15,.90+j*.06,.07,j===0?0x1b5574:j===1?0x2563eb:0xc1d6e6);
  }
  // Small water bottle and lab accessory
  const bottle=new T.Mesh(new T.CylinderGeometry(.065,.075,.31,10),material(0x60a5fa,.6));
  bottle.position.set(boss?1.7:1.26,1.02,.30);group.add(bottle);
  const cap=new T.Mesh(new T.CylinderGeometry(.045,.045,.045,9),material(0xdbeafe));cap.position.set(bottle.position.x,1.2,.30);group.add(cap);
}
