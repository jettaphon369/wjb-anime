(() => {
  const $ = s => document.querySelector(s);
  const home=$('#home'),game=$('#game'),canvas=$('#battle'),ctx=canvas.getContext('2d');
  const energyEl=$('#energy'),waveText=$('#waveText'),gateBar=$('#gateBar'),message=$('#message'),cardsEl=$('#cards');
  const modal=$('#modal'),modalTitle=$('#modalTitle'),modalBody=$('#modalBody'),modalAction=$('#modalAction');

  const ROWS=5,COLS=9;
  const units=[
    {id:'cat',name:'มิโอะ',emoji:'🐱',cost:75,hp:110,rate:1.25,damage:24,range:6,color:'#416d9f',type:'ranged',projectile:'#7fe2ff'},
    {id:'duck',name:'ก๊าบบี้',emoji:'🦆',cost:50,hp:135,rate:2.2,damage:0,range:0,color:'#dca440',type:'generator'},
    {id:'archer',name:'วินด์',emoji:'🏹',cost:100,hp:95,rate:.8,damage:19,range:8,color:'#5a7d39',type:'ranged',projectile:'#c6ff5c'},
    {id:'knight',name:'ไททัน',emoji:'🛡️',cost:75,hp:360,rate:2,damage:10,range:1,color:'#3e6687',type:'melee'},
    {id:'rian',name:'เรียน',emoji:'🧑🏻',cost:125,hp:170,rate:.65,damage:29,range:5,color:'#b55e32',type:'ranged',projectile:'#ffb443'},
    {id:'kaisen',name:'ไคเซ็น',emoji:'⚔️',cost:150,hp:230,rate:.8,damage:36,range:2,color:'#2c6a47',type:'melee'},
    {id:'bisky',name:'บิสกี้',emoji:'🐶',cost:50,hp:120,rate:1.4,damage:15,range:1,color:'#a66c37',type:'melee'}
  ];
  let selected=null,energy=200,gateHP=100,wave=0,running=false,paused=false,speed=1,last=0,spawnTimer=0,energyTimer=0,waveRemaining=0;
  let placed=[],enemies=[],shots=[],orbs=[],fx=[];

  function buildCards(){cardsEl.innerHTML='';units.forEach(u=>{const b=document.createElement('button');b.className='card';b.dataset.id=u.id;b.innerHTML=`<span class="portrait" style="--c:${u.color}">${u.emoji}</span><span class="card-info"><b>${u.name}</b><span class="cost">✦ ${u.cost}</span></span><span class="cooldown"></span>`;b.onclick=()=>selectUnit(u,b);cardsEl.appendChild(b)});updateCards()}
  function selectUnit(u,b){if(energy<u.cost)return toast('พลังงานไม่พอ');selected=u;document.querySelectorAll('.card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');toast(`เลือก ${u.name} — แตะช่องเพื่อวาง`)}
  function updateCards(){document.querySelectorAll('.card').forEach((b,i)=>b.classList.toggle('disabled',energy<units[i].cost));energyEl.textContent=Math.floor(energy)}
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(700,Math.floor(r.width*d));canvas.height=Math.max(390,Math.floor(r.height*d));}
  addEventListener('resize',resize);
  function grid(){const w=canvas.width,h=canvas.height;return {x:w*.035,y:h*.13,w:w*.82,h:h*.80,cw:w*.82/COLS,ch:h*.80/ROWS}}
  function pointer(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
  canvas.addEventListener('pointerdown',e=>{const p=pointer(e);for(let i=orbs.length-1;i>=0;i--){const o=orbs[i];if(Math.hypot(p.x-o.x,p.y-o.y)<38*(canvas.width/1000)){energy+=o.value;orbs.splice(i,1);updateCards();return}}
    if(!selected)return;const g=grid(),c=Math.floor((p.x-g.x)/g.cw),r=Math.floor((p.y-g.y)/g.ch);if(r<0||r>=ROWS||c<0||c>=COLS)return;if(placed.some(u=>u.r===r&&u.c===c))return toast('ช่องนี้มีฮีโร่อยู่แล้ว');if(energy<selected.cost)return toast('พลังงานไม่พอ');energy-=selected.cost;placed.push({...selected,r,c,hp:selected.hp,maxHp:selected.hp,t:0,blink:0});selected=null;document.querySelectorAll('.card').forEach(x=>x.classList.remove('selected'));updateCards();toast('วางฮีโร่แล้ว')});

  function startWave(){if(running)return;wave++;waveRemaining=6+wave*3;running=true;spawnTimer=.5;waveText.textContent=`ระลอก ${wave}`;$('#startWave').disabled=true;toast('ศัตรูกำลังบุก!')}
  function spawnEnemy(){const r=Math.floor(Math.random()*ROWS),elite=Math.random()<Math.min(.1+wave*.03,.35),boss=wave%5===0&&waveRemaining===1;const hp=(boss?550:elite?160:90)*(1+wave*.14);enemies.push({r,x:1.03,hp,maxHp:hp,speed:(boss?.018:elite?.027:.035)*(1+wave*.02),damage:boss?22:elite?12:8,attack:0,kind:boss?'👹':elite?'🧟‍♂️':'👾',scale:boss?1.5:elite?1.15:1});waveRemaining--}
  function update(dt){if(paused)return;dt*=speed;energyTimer+=dt;if(energyTimer>5){energyTimer=0;orbs.push({x:canvas.width*(.2+Math.random()*.55),y:canvas.height*(.2+Math.random()*.6),value:25,t:0})}
    if(running){spawnTimer-=dt;if(spawnTimer<=0&&waveRemaining>0){spawnEnemy();spawnTimer=Math.max(.55,1.5-wave*.06)}if(waveRemaining===0&&enemies.length===0){running=false;$('#startWave').disabled=false;waveText.textContent='พื้นที่ปลอดภัย';energy+=75;updateCards();if(wave>=5)return end(true);toast('ผ่านระลอก! +75 พลังงาน')}}
    orbs.forEach(o=>o.t+=dt);
    placed.forEach(u=>{u.t-=dt;u.blink=Math.max(0,u.blink-dt);if(u.type==='generator'){if(u.t<=0){u.t=5.5;const g=grid();orbs.push({x:g.x+(u.c+.5)*g.cw,y:g.y+(u.r+.45)*g.ch,value:35,t:0})}return}const targets=enemies.filter(e=>e.r===u.r&&e.x*canvas.width>grid().x+(u.c+.15)*grid().cw).sort((a,b)=>a.x-b.x);const target=targets[0];if(!target)return;const g=grid(),ux=(g.x+(u.c+.5)*g.cw)/canvas.width,dist=target.x-ux;if(dist<=u.range*g.cw/canvas.width&&u.t<=0){u.t=u.rate;if(u.type==='ranged')shots.push({r:u.r,x:ux,y:(g.y+(u.r+.52)*g.ch)/canvas.height,target,damage:u.damage,color:u.projectile});else{target.hp-=u.damage;fx.push({x:target.x,y:(g.y+(u.r+.5)*g.ch)/canvas.height,t:.18,text:'✦'})}}});
    shots.forEach(s=>s.x+=dt*.55);shots.forEach(s=>{if(s.target&&s.x>=s.target.x-.015){s.target.hp-=s.damage;s.dead=true;fx.push({x:s.target.x,y:s.y,t:.25,text:'✧'})}});shots=shots.filter(s=>!s.dead&&s.x<1.1);
    const g=grid();enemies.forEach(e=>{const col=Math.floor(((e.x*canvas.width)-g.x)/g.cw);const blocker=placed.find(u=>u.r===e.r&&u.c===col);if(blocker){e.attack-=dt;if(e.attack<=0){e.attack=.8;blocker.hp-=e.damage;blocker.blink=.15}}else e.x-=e.speed*dt;if(e.x<g.x/canvas.width-.03){gateHP-=8;e.hp=0;gateBar.style.width=`${Math.max(0,gateHP)}%`;if(gateHP<=0)end(false)}});
    enemies=enemies.filter(e=>e.hp>0);placed=placed.filter(u=>u.hp>0);fx.forEach(f=>f.t-=dt);fx=fx.filter(f=>f.t>0)
  }

  function draw(){const w=canvas.width,h=canvas.height,g=grid();const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#87c96b');grad.addColorStop(1,'#2e7d48');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.18;for(let i=0;i<90;i++){const x=(i*137)%w,y=(i*83)%h;ctx.fillStyle=i%3?'#fff':'#164e31';ctx.beginPath();ctx.arc(x,y,3+(i%4),0,7);ctx.fill()}ctx.globalAlpha=1;
    ctx.fillStyle='#d6c79a';ctx.fillRect(g.x+g.w,g.y,g.cw*.9,g.h);ctx.fillStyle='#1b4b31';ctx.fillRect(0,g.y,g.x,g.h);
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ctx.fillStyle=(r+c)%2?'#5fbf5e88':'#75ce6d88';ctx.fillRect(g.x+c*g.cw,g.y+r*g.ch,g.cw-1,g.ch-1);ctx.strokeStyle='#ffffff12';ctx.strokeRect(g.x+c*g.cw,g.y+r*g.ch,g.cw,g.ch)}
    for(let r=0;r<ROWS;r++){ctx.fillStyle='#182c28';ctx.beginPath();ctx.arc(g.x*.58,g.y+(r+.5)*g.ch,g.ch*.29,0,7);ctx.fill();ctx.fillStyle='#d1a947';ctx.font=`${g.ch*.35}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🏰',g.x*.58,g.y+(r+.5)*g.ch)}
    placed.forEach(u=>{const x=g.x+(u.c+.5)*g.cw,y=g.y+(u.r+.57)*g.ch,s=Math.min(g.cw,g.ch)*.32;ctx.save();if(u.blink)ctx.globalAlpha=.45;ctx.shadowColor='#0008';ctx.shadowBlur=s*.25;ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(x,y+s*.6,s*.8,s*.3,0,0,7);ctx.fill();ctx.shadowBlur=0;ctx.font=`${s*1.55}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(u.emoji,x,y-s*.05);hpbar(x,y-s*1.05,s*1.5,u.hp/u.maxHp);ctx.restore()});
    enemies.forEach(e=>{const x=e.x*w,y=g.y+(e.r+.58)*g.ch,s=Math.min(g.cw,g.ch)*.34*e.scale;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y+s*.7,s*.72,s*.25,0,0,7);ctx.fill();ctx.font=`${s*1.55}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.kind,x,y);hpbar(x,y-s*1.15,s*1.6,e.hp/e.maxHp)});
    shots.forEach(s=>{ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(s.x*w,s.y*h,7*w/1000,0,7);ctx.fill();ctx.shadowBlur=0});
    orbs.forEach(o=>{const bob=Math.sin(o.t*4)*7;ctx.fillStyle='#ffe86c';ctx.shadowColor='#fff26f';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(o.x,o.y+bob,20*w/1000,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#5f4a00';ctx.font=`bold ${16*w/1000}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✦',o.x,o.y+bob)});
    fx.forEach(f=>{ctx.globalAlpha=f.t*4;ctx.fillStyle='#fff';ctx.font=`bold ${34*w/1000}px sans-serif`;ctx.fillText(f.text,f.x*w,f.y*h);ctx.globalAlpha=1})
  }
  function hpbar(x,y,width,p){ctx.fillStyle='#13222c';ctx.fillRect(x-width/2,y,width,6);ctx.fillStyle=p>.45?'#65e56c':p>.2?'#ffd45b':'#ff5d57';ctx.fillRect(x-width/2,y,width*Math.max(0,p),6)}
  function loop(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
  function toast(t){message.textContent=t;message.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>message.style.opacity=.35,1800)}
  function reset(){selected=null;energy=200;gateHP=100;wave=0;running=false;paused=false;placed=[];enemies=[];shots=[];orbs=[];fx=[];waveText.textContent='เตรียมพร้อม';gateBar.style.width='100%';$('#startWave').disabled=false;updateCards()}
  function end(win){paused=true;modalTitle.textContent=win?'ชนะแล้ว!':'ภารกิจล้มเหลว';modalBody.innerHTML=`<div class="result"><span class="big">${win?'🏆':'💥'}</span>${win?'คุณป้องกันอาณาจักรครบ 5 ระลอก':'ศัตรูบุกผ่านประตูอาณาจักร'}</div>`;modalAction.textContent='เล่นอีกครั้ง';modalAction.onclick=()=>{modal.classList.add('hidden');reset()};modal.classList.remove('hidden')}
  function showHow(){modalTitle.textContent='วิธีเล่น';modalBody.innerHTML='<ol><li>เลือกการ์ดฮีโร่ด้านข้างหรือด้านล่าง</li><li>แตะช่องบนสนามเพื่อวางฮีโร่</li><li>เก็บลูกพลังงานสีทองเพื่อวางตัวเพิ่ม</li><li>กด “เริ่มการโจมตี” แล้วป้องกันศัตรูให้ครบ 5 ระลอก</li><li>เป็ดก๊าบบี้สร้างพลังงาน ส่วนไททันเหมาะสำหรับขวางศัตรู</li></ol>';modalAction.textContent='เข้าใจแล้ว';modalAction.onclick=()=>modal.classList.add('hidden');modal.classList.remove('hidden')}
  $('#playBtn').onclick=()=>{home.classList.remove('active');game.classList.add('active');setTimeout(resize,20);reset()};$('#howBtn').onclick=showHow;$('#backBtn').onclick=()=>{game.classList.remove('active');home.classList.add('active');paused=false};$('#startWave').onclick=startWave;$('#pauseBtn').onclick=()=>{paused=!paused;toast(paused?'หยุดเกม':'เล่นต่อ')};$('#speedBtn').onclick=e=>{speed=speed===1?1.5:speed===1.5?2:1;e.currentTarget.textContent='×'+speed};$('#closeModal').onclick=()=>modal.classList.add('hidden');buildCards();resize();requestAnimationFrame(loop);
})();
