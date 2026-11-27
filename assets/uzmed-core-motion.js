/* UZMED real agent traffic -> THREE motion and speech. No simulated conversations. */
export function createAgentMotion(THREE,byName,wrap,canvas,camera){
  const ALLOWED=new Set(['agent.walk_to','agent.dialogue','agent.report_to_boss','agent.return_to_desk']);
  const seen=new Set(),timeline=[],positions=new Map();
  const types={ 'agent.walk_to':2.5,'agent.dialogue':1.25,'agent.report_to_boss':2.7,'agent.return_to_desk':1.9 };
  const el=document.createElement('div');el.className='uzc-3d-dialogue';el.hidden=true;wrap.appendChild(el);
  const bubble=document.createElement('div');bubble.className='uzc-agent-speech';bubble.hidden=true;wrap.appendChild(bubble);
  const clock={at:0,current:null};
  let audio=false;
  const label=n=>({'UZMED CORE':'Bosh agent','Medical Agent':'Mutaxassis','Evidence Agent':'Manbalar','Reviewer Agent':'Tekshiruvchi','MKB Agent':'MKB-10','Differential Agent':'Differensial','Tahlil Agent':'Tahlil','Score Agent':'Klinik shkala','DevOps Agent':'Server'})[n]||'Agent';
  const desk=n=>{
    let g=byName.get(n);return g?{x:g.position.x,z:g.position.z+.88,angle:0}:null;
  };
  const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
  const kind=e=>{
    let meta=e.metadata||{},type=e.event_type;
    return {id:String(e.id),type,agent:String(meta.from||e.agent_name||''),to:String(meta.to||e.parent_agent||''),
      phrase:String(meta.phrase||'').slice(0,115),timestamp:Date.parse(e.created_at||0)||0,meeting:String(meta.meeting_id||'')};
  };
  function receive(events){
    const now=Date.now();
    const incoming=(events||[]).filter(e=>ALLOWED.has(e.event_type)).slice().sort((a,b)=>Number(a.id||0)-Number(b.id||0));
    incoming.forEach(e=>{
      const x=kind(e);if(seen.has(x.id))return;seen.add(x.id);
      if(!byName.has(x.agent))return;
      if(now-x.timestamp>60000||x.timestamp-now>10000)return;
      timeline.push(x);
    });
    while(seen.size>500){const first=seen.values().next().value;seen.delete(first)}
    if(timeline.length>65)timeline.splice(0,timeline.length-65);
  }
  function targetOf(x){
    const target=x.type==='agent.return_to_desk'?desk(x.agent):desk(x.to);
    if(!target)return desk(x.agent);
    if(x.type==='agent.return_to_desk')return target;
    const g=byName.get(x.to);
    if(!g)return desk(x.agent);
    const self=byName.get(x.agent);
    const dx=(self?.position.x||0)-g.position.x;
    // Standing alongside another doctor's workstation, never inside the desk.
    const ox=Math.abs(dx)<.3?(x.agent==='UZMED CORE'?.88:-.88):Math.sign(dx)*.35;
    return {x:g.position.x+ox,z:g.position.z+(x.to==='UZMED CORE'?2.45:2.15),angle:0};
  }
  function begin(now){
    if(clock.current||!timeline.length)return;
    let m=timeline.shift(),g=byName.get(m.agent),home=desk(m.agent);
    if(!g||!home)return;
    const start=positions.get(m.agent)||home,target=targetOf(m)||home;
    const travel=m.type==='agent.walk_to'||m.type==='agent.report_to_boss'||m.type==='agent.return_to_desk';
    // Route goes through the common corridor, avoiding objects where possible.
    const corridor={x:lerp(start.x,target.x,.48),z:Math.max(start.z,target.z)+1.35};
    const route=travel?[start,{x:start.x,z:start.z+.8},corridor,{x:target.x,z:target.z+.22},target]:[start];
    clock.current={...m,start,target,route,travel,duration:types[m.type]||4,started:now};
    el.hidden=false;el.innerHTML='<strong>'+escapeHtml(label(m.agent))+' <span>→ '+escapeHtml(label(m.to||'UZMED CORE'))+'</span></strong><small>'+escapeHtml(m.phrase)+'</small>';
    bubble.hidden=false;bubble.textContent=label(m.agent)+': '+m.phrase;
    el.classList.toggle('talking',m.type==='agent.dialogue');
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function pose(name,pos,walking,progress,now){
    let g=byName.get(name),p=g?.userData.person;if(!p)return;
    // Position is local to agent's workstation group.
    p.position.set(pos.x-g.position.x,Math.sin(now*11)*.035*(walking?1:0),pos.z-g.position.z);
    let dx=0,dz=1;
    const active=clock.current;
    if(walking&&active&&active.agent===name){
      const at=Math.max(0,Math.min(active.route.length-2,Math.floor(progress*(active.route.length-1))));
      const a=active.route[at],b=active.route[at+1];
      dx=b.x-a.x;dz=b.z-a.z;
    }else if(active&&active.to===name){
      const source=positions.get(active.agent)||desk(active.agent);
      if(source){dx=source.x-pos.x;dz=source.z-pos.z}
    }
    if(Math.hypot(dx,dz)>.001)p.rotation.y=lerp(p.rotation.y,Math.atan2(dx,dz),.23);
    let ar=p.userData.arms||[],legs=p.userData.legs||[],head=p.userData.head,face=p.userData.face;
    if(walking){
      if(face?.mouth)face.mouth.scale.set(1,.3+Math.abs(Math.sin(now*7.6))*.45,1);
      const stride=Math.sin(now*9.4);
      if(legs[0])legs[0].rotation.x=stride*.55;if(legs[1])legs[1].rotation.x=-stride*.55;
      if(ar[0])ar[0].rotation.x=-stride*.40;if(ar[1])ar[1].rotation.x=stride*.4;
      if(head)head.rotation.y=Math.sin(now*2.3)*.08;
    }else if(active?.agent===name&&active.type==='agent.dialogue'){
      // Animated face and hand gestures while actually addressing peer agent.
      if(ar[0])ar[0].rotation.x=-.60+Math.sin(now*5)*.22;
      if(ar[1])ar[1].rotation.x=-.25+Math.sin(now*3)*.18;
      if(head)head.rotation.y=Math.sin(now*3)*.14;
      if(face?.mouth)face.mouth.scale.set(1,.35+Math.abs(Math.sin(now*9))*.75,1);
    }else if(active?.agent===name){
      if(ar[0])ar[0].rotation.x=-.6+Math.sin(now*4)*.13;
      if(ar[1])ar[1].rotation.x=-.4+Math.sin(now*4.3)*.15;
    }
  }
  function point(route,p){
    if(route.length===1)return route[0];
    let n=route.length-1,q=Math.min(n-.0001,Math.max(0,p*n)),i=Math.floor(q);
    return {x:lerp(route[i].x,route[i+1].x,smooth(q-i)),z:lerp(route[i].z,route[i+1].z,smooth(q-i))};
  }
  function tick(now){
    begin(now);
    let m=clock.current;
    if(!m){
      positions.forEach((pos,name)=>pose(name,pos,false,1,now));
      el.hidden=true;bubble.hidden=true;return;
    }
    let elapsed=(now-m.started),ratio=Math.min(1,elapsed/m.duration),walking=m.travel&&ratio<.76;
    let pos=m.travel?point(m.route,Math.min(1,ratio/.76)):m.start;
    positions.set(m.agent,pos);
    positions.forEach((where,name)=>pose(name,where,name===m.agent&&walking,ratio,now));
    // Follow the walking doctor, clamped to viewport so phones can show text.
    const v=new THREE.Vector3(pos.x,2.65,pos.z).project(camera);
    const w=wrap.clientWidth,h=wrap.clientHeight;
    if(Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.z<1){
      const sx=(v.x*.5+.5)*w,sy=(-v.y*.5+.5)*h;
      bubble.style.left=Math.max(90,Math.min(w-90,sx))+'px';
      bubble.style.top=Math.max(82,Math.min(h-120,sy-12))+'px';
      bubble.hidden=false;
    }else bubble.hidden=true;
    if(elapsed>=m.duration){
      positions.set(m.agent,m.target);
      clock.current=null;el.hidden=true;bubble.hidden=true;
    }
  }
  return {receive,tick,movingAgents(){return clock.current&&clock.current.travel?[clock.current.agent]:[]},reset(){timeline.length=0;positions.clear();clock.current=null;el.hidden=true;bubble.hidden=true}};
}
