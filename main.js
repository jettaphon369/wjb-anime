import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const chars=[
{name:'มีโอะแมวนักเวท',role:'เวทมนตร์ระยะไกล',emoji:'🐱',color:0x2e5680,accent:0xd6a64a,stats:[85,45,70]},
{name:'ก๊าบบี้',role:'ช่างกลสนับสนุน',emoji:'🦆',color:0xe8e0c9,accent:0xb1742c,stats:[60,75,90]},
{name:'วินด์',role:'นักยิงธนูสายลม',emoji:'🏹',color:0x45653b,accent:0x9c7b3f,stats:[88,55,72]},
{name:'ไททัน',role:'อัศวินโล่เหล็ก',emoji:'🛡️',color:0x2e4c70,accent:0xd4aa55,stats:[70,95,55]},
{name:'ไรอัน',role:'นักผจญภัยพลังสายลม',emoji:'🧭',color:0xb65b2e,accent:0xe6b349,stats:[82,68,78]},
{name:'ไคเซ็น',role:'นักดาบวายุ',emoji:'⚔️',color:0x214f35,accent:0xc5a05a,stats:[95,72,66]},
{name:'บิสกี้',role:'นักผจญภัยซื่อสัตย์',emoji:'🐶',color:0x9a6c3b,accent:0xd5a743,stats:[72,78,88]}
];
let selected=0, viewerModel, battleModel, enemy, enemyHP=100;

function screen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');setTimeout(()=>window.dispatchEvent(new Event('resize')),30)}

document.getElementById('startBtn').onclick=()=>{screen('battle');setupBattle()};
document.getElementById('rosterBtn').onclick=()=>screen('roster');
document.querySelector('.backBtn').onclick=()=>screen('home');
document.getElementById('playSelected').onclick=()=>{screen('battle');setupBattle()};
document.getElementById('backHomeBtn').onclick=()=>screen('home');

function rendererFor(canvas){const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.shadowMap.enabled=true;return r}
function lights(scene){scene.add(new THREE.HemisphereLight(0xaad9ff,0x182018,2.2));const key=new THREE.DirectionalLight(0xffe3bb,3);key.position.set(5,8,6);key.castShadow=true;scene.add(key);const rim=new THREE.DirectionalLight(0x6fa8ff,2);rim.position.set(-5,4,-5);scene.add(rim)}

function makeHero(c,scale=1){
 const g=new THREE.Group(); const mat=(col,rough=.55,metal=.05)=>new THREE.MeshStandardMaterial({color:col,roughness:rough,metalness:metal});
 const skin=mat(c.emoji==='🐱'?0x77736c:c.emoji==='🦆'?0xf4eee0:c.emoji==='🐶'?0xb77d48:0xd9a77e);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.75,8,16),mat(c.color));body.position.y=1.15;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.43,24,18),skin);head.position.y=2.05;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.45,18,12,0,Math.PI*2,0,Math.PI/2),mat(c.emoji==='🦆'?0xf1efe8:c.emoji==='🐱'?0x34302f:c.emoji==='🐶'?0x754522:c.name==='ไคเซ็น'?0x315b39:0x3b2921));hair.position.y=2.13;g.add(hair);
 for(const x of[-.16,.16]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),mat(0x111111));eye.position.set(x,2.08,.39);g.add(eye)}
 for(const x of[-.33,.33]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.55,6,10),mat(c.color));arm.position.set(x,1.25,0);arm.rotation.z=x>0?-.25:.25;g.add(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.5,6,10),mat(0x282522));leg.position.set(x*.55,.45,0);g.add(leg)}
 const belt=new THREE.Mesh(new THREE.TorusGeometry(.43,.05,8,24),mat(c.accent,.35,.4));belt.rotation.x=Math.PI/2;belt.position.y=1.03;g.add(belt);
 // role props
 if(c.emoji==='🐱'){const hat=new THREE.Mesh(new THREE.ConeGeometry(.5,.8,18),mat(c.color));hat.position.y=2.7;hat.rotation.z=-.15;g.add(hat);const staff=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.2,10),mat(0x6a4021));staff.position.set(-.62,1.2,0);g.add(staff)}
 if(c.emoji==='🦆'){const beak=new THREE.Mesh(new THREE.ConeGeometry(.13,.3,12),mat(0xf1a12a));beak.rotation.x=Math.PI/2;beak.position.set(0,2.0,.48);g.add(beak)}
 if(['🏹','⚔️','🛡️'].includes(c.emoji)){const weapon=new THREE.Mesh(new THREE.BoxGeometry(.08,1.5,.1),mat(0xc5a05a,.25,.6));weapon.position.set(.62,1.1,0);weapon.rotation.z=-.2;g.add(weapon)}
 if(c.emoji==='🐶'){for(const x of[-.3,.3]){const ear=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.35,6,10),mat(0x8a552f));ear.position.set(x,2.12,0);ear.rotation.z=x>0?-.55:.55;g.add(ear)}}
 g.scale.setScalar(scale);g.userData.baseY=0;return g
}

function loop(renderer,scene,camera,update){function f(t){resize(renderer,camera);update?.(t*.001);renderer.render(scene,camera);requestAnimationFrame(f)}requestAnimationFrame(f)}
function resize(r,c){const canvas=r.domElement,w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w||canvas.height!==h){r.setSize(w,h,false);c.aspect=w/h;c.updateProjectionMatrix()}}

// Home scene
{
 const canvas=document.getElementById('homeCanvas'),r=rendererFor(canvas),s=new THREE.Scene();s.fog=new THREE.FogExp2(0x071014,.055);lights(s);const c=new THREE.PerspectiveCamera(40,1,.1,100);c.position.set(7,4.2,8);const ctrl=new OrbitControls(c,canvas);ctrl.target.set(0,1.2,0);ctrl.enablePan=false;ctrl.minDistance=5;ctrl.maxDistance=13;
 const ground=new THREE.Mesh(new THREE.CircleGeometry(14,64),new THREE.MeshStandardMaterial({color:0x101b1c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;s.add(ground);
 chars.slice(0,4).forEach((ch,i)=>{const m=makeHero(ch,.95);m.position.set((i-1.5)*1.8,0,(i%2)*.3);m.rotation.y=(i-1.5)*-.15;s.add(m)});
 loop(r,s,c,t=>{s.children.filter(x=>x.type==='Group').forEach((m,i)=>m.position.y=Math.sin(t*1.5+i)*.04);ctrl.update()});
}

// roster
const list=document.getElementById('characterList');chars.forEach((ch,i)=>{const b=document.createElement('button');b.className='charBtn';b.innerHTML=`<span class="avatar">${ch.emoji}</span><span><b>${ch.name}</b><small>${ch.role}</small></span>`;b.onclick=()=>selectChar(i);list.appendChild(b)});
let viewerScene,viewerCamera;
{
 const canvas=document.getElementById('viewerCanvas'),r=rendererFor(canvas);viewerScene=new THREE.Scene();lights(viewerScene);viewerCamera=new THREE.PerspectiveCamera(38,1,.1,100);viewerCamera.position.set(4,2.5,5.8);const ctrl=new OrbitControls(viewerCamera,canvas);ctrl.target.set(0,1.2,0);ctrl.enablePan=false;ctrl.minDistance=3;ctrl.maxDistance=8;const ground=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({color:0x101b1d,roughness:1}));ground.rotation.x=-Math.PI/2;viewerScene.add(ground);loop(r,viewerScene,viewerCamera,t=>{if(viewerModel)viewerModel.position.y=Math.sin(t*1.8)*.035;ctrl.update()});
}
function selectChar(i){selected=i;document.querySelectorAll('.charBtn').forEach((b,n)=>b.classList.toggle('active',n===i));if(viewerModel)viewerScene.remove(viewerModel);viewerModel=makeHero(chars[i],1.15);viewerScene.add(viewerModel);document.getElementById('charName').textContent=chars[i].name;document.getElementById('charRole').textContent=chars[i].role;document.getElementById('stats').innerHTML=['พลังโจมตี','พลังป้องกัน','ความคล่องตัว'].map((x,n)=>`<div class="stat"><span>${x}</span><div><i style="width:${chars[i].stats[n]}%"></i></div></div>`).join('')}
selectChar(0);

// battle
let battleReady=false,battleScene,battleCamera,battleRenderer;
function setupBattle(){document.getElementById('battleName').textContent=chars[selected].name;enemyHP=100;document.getElementById('enemyHp').style.width='100%';if(battleModel&&battleScene){battleScene.remove(battleModel);battleModel=makeHero(chars[selected],1);battleModel.position.set(-1.8,0,0);battleScene.add(battleModel)}if(!battleReady)initBattle()}
function initBattle(){battleReady=true;const canvas=document.getElementById('battleCanvas');battleRenderer=rendererFor(canvas);battleScene=new THREE.Scene();battleScene.background=new THREE.Color(0x6c8890);battleScene.fog=new THREE.Fog(0x6c8890,8,22);lights(battleScene);battleCamera=new THREE.PerspectiveCamera(45,1,.1,100);battleCamera.position.set(0,4.2,7);battleCamera.lookAt(0,1,0);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30,20,20),new THREE.MeshStandardMaterial({color:0x526b4b,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;battleScene.add(ground);
 battleModel=makeHero(chars[selected],1);battleModel.position.set(-1.8,0,0);battleModel.rotation.y=.5;battleScene.add(battleModel);
 enemy=new THREE.Group();const rock=new THREE.MeshStandardMaterial({color:0x6a6156,roughness:1});const eb=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.1,8,14),rock);eb.position.y=1.1;enemy.add(eb);const eh=new THREE.Mesh(new THREE.SphereGeometry(.6,18,14),rock);eh.position.y=2.15;enemy.add(eh);for(const x of[-.65,.65]){const a=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.8,6,10),rock);a.position.set(x,1.25,0);a.rotation.z=x>0?-.35:.35;enemy.add(a)}enemy.position.x=1.8;enemy.rotation.y=-.5;battleScene.add(enemy);
 loop(battleRenderer,battleScene,battleCamera,t=>{battleModel.position.y=Math.sin(t*3)*.035;enemy.position.y=Math.sin(t*2+1)*.025});}
function hit(amount,skill=false){if(enemyHP<=0)return;enemyHP=Math.max(0,enemyHP-amount);document.getElementById('enemyHp').style.width=enemyHP+'%';document.getElementById('message').textContent=skill?`ใช้สกิล! สร้างความเสียหาย ${amount}`:`โจมตี! สร้างความเสียหาย ${amount}`;const start=battleModel.position.x;battleModel.position.x=start+.65;setTimeout(()=>battleModel.position.x=start,180);enemy.rotation.z=.16;setTimeout(()=>enemy.rotation.z=0,180);if(enemyHP===0){document.getElementById('message').textContent='ชัยชนะ! โกเลมหินถูกกำจัดแล้ว';enemy.scale.set(.01,.01,.01);setTimeout(()=>{enemy.scale.set(1,1,1)},900)}}
document.getElementById('attackBtn').onclick=()=>hit(14+Math.floor(Math.random()*8));document.getElementById('skillBtn').onclick=()=>hit(28+Math.floor(Math.random()*12),true);
