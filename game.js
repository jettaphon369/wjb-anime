"use strict";
/* =========================================================
   UTILITIES
========================================================= */
const Util = {
  rand(a,b){return a+Math.random()*(b-a);},
  randInt(a,b){return Math.floor(Util.rand(a,b+1));},
  choice(arr){return arr[Math.floor(Math.random()*arr.length)];},
  clamp(v,a,b){return Math.max(a,Math.min(b,v));},
  lerp(a,b,t){return a+(b-a)*t;}
};

/* =========================================================
   AUDIO (fully synthesized, no external files)
========================================================= */
const Audio2 = {
  ctx:null, musicGain:null, sfxGain:null,
  init(){
    if(this.ctx) return;
    try{
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value=0.8; this.sfxGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value=0.35; this.musicGain.connect(this.ctx.destination);
    }catch(e){ this.ctx=null; }
  },
  setSfxVol(v){ if(this.sfxGain) this.sfxGain.gain.value=v; },
  setMusicVol(v){ if(this.musicGain) this.musicGain.gain.value=v; },
  tone(freq,dur,type='sine',vol=1,slideTo=null){
    if(!this.ctx) return;
    const t0=this.ctx.currentTime;
    const osc=this.ctx.createOscillator(); osc.type=type; osc.frequency.setValueAtTime(freq,t0);
    if(slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),t0+dur);
    const g=this.ctx.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t0); osc.stop(t0+dur+0.02);
  },
  noiseBurst(dur=0.15,vol=0.5){
    if(!this.ctx) return;
    const bufSize=this.ctx.sampleRate*dur;
    const buf=this.ctx.createBuffer(1,bufSize,this.ctx.sampleRate);
    const data=buf.getChannelData(0);
    for(let i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*(1-i/bufSize);
    const src=this.ctx.createBufferSource(); src.buffer=buf;
    const g=this.ctx.createGain(); g.gain.value=vol;
    src.connect(g); g.connect(this.sfxGain); src.start();
  },
  play(name){
    if(!this.ctx) return;
    switch(name){
      case'attack': this.tone(620,0.08,'square',0.25,420); break;
      case'hit': this.noiseBurst(0.08,0.3); break;
      case'death': this.tone(300,0.35,'sawtooth',0.3,60); break;
      case'collect': this.tone(880,0.12,'sine',0.3,1300); break;
      case'win': [523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,0.25,'triangle',0.3),i*120)); break;
      case'lose': [400,340,260,200].forEach((f,i)=>setTimeout(()=>this.tone(f,0.3,'sawtooth',0.25),i*140)); break;
      case'button': this.tone(500,0.06,'square',0.2,700); break;
      case'place': this.tone(340,0.12,'triangle',0.3,540); break;
      case'ulti': this.tone(180,0.5,'sawtooth',0.35,900); break;
    }
  }
};

/* =========================================================
   STORAGE
========================================================= */
const Storage = {
  KEY:'pethousedefense_save_v2',
  data:null,
  defaults(){
    return {
      coins: 120,
      currentLevel: 1,
      maxUnlockedLevel: 1,
      levelStars: {},
      unlockedHeroes: ['brisky','mio','gabby','titan'],
      heroKills: {brisky:0,mio:0,gabby:0,wind:0,titan:0,rian:0,kaisen:0},
      heroUpgrades: {brisky:0,mio:0,gabby:0,wind:0,titan:0,rian:0,kaisen:0},
      missions: {kills:0, levelsWon:0, starsCollected:0},
      settings: {music:70, sfx:80, quality:'high', lang:'English'}
    };
  },
  load(){
    try{
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    }catch(e){ this.data = this.defaults(); }
    return this.data;
  },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.data)); }catch(e){} }
};

/* =========================================================
   HERO & ENEMY TEMPLATES (range/spd now expressed in grid-column units)
========================================================= */
const HERO_DEFS = {
  brisky:{id:'brisky',name:'Brisky',type:'dog',cost:40,hp:220,dmg:16,range:1.3,cooldown:650,proj:'none',melee:true,
    colors:['#f5b04a','#c97a26'], desc:'Cute dog warrior. Fast melee attacks.'},
  mio:{id:'mio',name:'Mio',type:'cat',cost:50,hp:160,dmg:30,range:3.2,cooldown:1400,proj:'orb',
    colors:['#c98af0','#8b4fc9'], desc:'Magic cat. Slow but powerful magic orbs.'},
  gabby:{id:'gabby',name:'Gabby',type:'duck',cost:60,hp:180,dmg:14,range:2.4,cooldown:500,proj:'wrench',
    colors:['#f7e04a','#d1a800'], desc:'Engineer duck. Rapid wrench-fire.'},
  wind:{id:'wind',name:'Wind',type:'elf',cost:60,hp:150,dmg:20,range:5.5,cooldown:900,proj:'arrow',pierce:true,
    colors:['#7de0a0','#2f9d63'], desc:'Elf archer. Long range piercing arrows.'},
  titan:{id:'titan',name:'Titan',type:'knight',cost:70,hp:520,dmg:12,range:1.0,cooldown:900,proj:'none',melee:true,tank:true,
    colors:['#9fb6d9','#4d637f'], desc:'Knight tank. Blocks enemies in its lane.'},
  rian:{id:'rian',name:'Rian',type:'adventurer',cost:90,hp:240,dmg:34,range:1.3,cooldown:800,proj:'none',crit:true,melee:true,
    colors:['#f28c6b','#c14f2e'], desc:'Adventure boy. Critical sword slashes.'},
  kaisen:{id:'kaisen',name:'Kaisen',type:'swordsman',cost:120,hp:300,dmg:26,range:1.4,cooldown:280,proj:'none',melee:true,
    colors:['#6b6bd6','#33338f'], desc:'Dual swordsman. Extremely fast, highest DPS.'}
};
const HERO_ULTIMATES = {
  brisky:'Howl Rally: nearby heroes attack faster for 6s.',
  mio:'Arcane Meteor: drops a meteor dealing heavy AoE damage.',
  gabby:'Overclock: doubles Gabby\'s fire rate for 8s.',
  wind:'Gale Storm: fires a wave of piercing arrows across the lane.',
  titan:'Iron Shield: becomes immune and taunts the whole row.',
  rian:'Blade Dance: unleashes 5 rapid critical slashes.',
  kaisen:'Twin Fury: unleashes a spinning whirlwind of blades.'
};
const HERO_SHOP_UNLOCK_COST = {wind:150, rian:220, kaisen:350};

const HERO_SPRITES = {
  mio: "mio.png",
  gabby: "gabby.png",
  wind: "wind.png",
  titan: "titan.png",
  rian: "rian.png",
  kaisen: "kaisen.png",
  brisky: "brisky.png"
};
const HERO_SPRITE_ASPECT = {"mio": 0.70155, "gabby": 0.753372, "wind": 0.77666, "titan": 0.638254, "rian": 0.847222, "kaisen": 1.013645, "brisky": 0.479239};

// 3D hero assets used on the battle board. PNG files remain for cards and menus.
const HERO_MODELS = {
  brisky: "Brisky_Prototype_V1.glb",
  mio: "Mio_Prototype_V1.glb",
  gabby: "Gabby_Prototype_V1.glb",
  wind: "Wind_Prototype_V1.glb",
  titan: "Titan_Prototype_V1.glb",
  rian: "Rian_Prototype_V1.glb",
  kaisen: "Kaisen_Prototype_V1.glb"
};
// Target display height for every GLB. The loader normalizes each model automatically,
// so all heroes stand on the ground and appear at a consistent size.
const HERO_MODEL_HEIGHT = {brisky:1.34,mio:1.30,gabby:1.25,wind:1.30,titan:1.38,rian:1.30,kaisen:1.34};
const HERO_MODEL_YAW = {brisky:Math.PI/2,mio:Math.PI/2,gabby:Math.PI/2,wind:Math.PI/2,titan:Math.PI/2,rian:Math.PI/2,kaisen:Math.PI/2};


const ENEMY_DEFS = {
  goblin:{name:'Goblin',hp:60,spd:0.55,dmg:8,color:'#6fae4a',size:26,melee:true},
  orc:{name:'Orc',hp:130,spd:0.42,dmg:15,color:'#8a5a3a',size:32,melee:true},
  slime:{name:'Slime',hp:85,spd:0.38,dmg:6,color:'#58c4d6',size:28,melee:true,alpha:0.85},
  skeleton:{name:'Skeleton',hp:75,spd:0.6,dmg:10,color:'#e5e0cc',size:26,melee:true},
  darkmage:{name:'Dark Mage',hp:95,spd:0.32,dmg:12,color:'#7a4fc9',size:28,ranged:true,range:2.4},
  ogre:{name:'Ogre',hp:240,spd:0.28,dmg:22,color:'#a34a4a',size:40,melee:true},
  wolf:{name:'Wolf',hp:65,spd:0.95,dmg:9,color:'#555a66',size:26,melee:true},
  ghost:{name:'Ghost',hp:80,spd:0.5,dmg:11,color:'#c9c9f5',size:26,melee:true,alpha:0.6},
  boss:{name:'Boss Monster',hp:1600,spd:0.22,dmg:40,color:'#3a1f2a',size:64,melee:true,boss:true}
};

/* =========================================================
   LEVEL GENERATION
========================================================= */
const TOTAL_LEVELS = 30;
function enemyPoolForLevel(lvl){
  const pool = ['goblin','skeleton'];
  if(lvl>=3) pool.push('slime');
  if(lvl>=5) pool.push('wolf');
  if(lvl>=7) pool.push('orc');
  if(lvl>=10) pool.push('darkmage');
  if(lvl>=14) pool.push('ghost');
  if(lvl>=18) pool.push('ogre');
  return pool;
}
function generateLevel(lvl){
  const isBoss = lvl % 5 === 0;
  const waveCount = 3 + Math.floor(lvl/4);
  const hpMult = 1 + lvl*0.14;
  const spdMult = 1 + Math.min(lvl*0.012,0.5);
  const dmgMult = 1 + lvl*0.09;
  const pool = enemyPoolForLevel(lvl);
  const waves=[];
  for(let w=0; w<waveCount; w++){
    const count = 4 + Math.floor(lvl/2) + w;
    const entries=[];
    for(let i=0;i<count;i++){
      entries.push({type:Util.choice(pool), row:Util.randInt(0,4), delay: i*Util.rand(900,1400)});
    }
    if(isBoss && w===waveCount-1){
      entries.push({type:'boss', row:2, delay: entries.length*300+800});
    }
    waves.push({entries});
  }
  return {level:lvl, isBoss, waves, hpMult, spdMult, dmgMult, startEnergy:150+Math.min(lvl*2,60)};
}

/* =========================================================
   3D HELPERS
========================================================= */
function shadeHex(hex,percent){
  const num = typeof hex==='number'? hex : parseInt(String(hex).replace('#',''),16);
  let r=(num>>16)+percent, g=((num>>8)&0xff)+percent, b=(num&0xff)+percent;
  r=Util.clamp(r,0,255); g=Util.clamp(g,0,255); b=Util.clamp(b,0,255);
  return (r<<16)|(g<<8)|b;
}
function disposeGroup(g){
  g.traverse(o=>{
    if(o.isMesh){
      o.geometry.dispose();
      if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose());
      else if(o.material) o.material.dispose();
    }
  });
}
function setEmissive(g,hex,intensity){
  g.traverse(o=>{
    if(o.isMesh && o.material && 'emissive' in o.material){ o.material.emissive.setHex(hex); o.material.emissiveIntensity=intensity; }
    else if(o.isSprite){ o.material.color.setHex(intensity>0.05 ? hex : 0xffffff); }
  });
}
function setOpacity(g,val){
  g.traverse(o=>{ if(o.isMesh||o.isSprite){ o.material.transparent=true; o.material.opacity=Util.clamp(val,0,1); } });
}
function findAncestorWithUserData(obj,key){
  let o=obj;
  while(o){ if(o.userData && o.userData[key]!==undefined) return o; o=o.parent; }
  return null;
}

/* =========================================================
   MODEL FACTORY — builds real 3D primitive "chibi" characters
========================================================= */
/* =========================================================
   TEXTURE FACTORY — procedural grass / dirt tile textures
========================================================= */
const TextureFactory = {
  _cache:{},
  grassTile(){
    if(this._cache.grass) return this._cache.grass;
    const size=256;
    const cv=document.createElement('canvas'); cv.width=cv.height=size;
    const ctx=cv.getContext('2d');
    // base fill with soft gradient
    const g=ctx.createLinearGradient(0,0,size,size);
    g.addColorStop(0,'#8fd18a'); g.addColorStop(1,'#7fc47a');
    ctx.fillStyle=g; ctx.fillRect(0,0,size,size);
    // speckled shading blotches
    for(let i=0;i<140;i++){
      const x=Math.random()*size, y=Math.random()*size, r=Util.rand(4,14);
      ctx.fillStyle = Math.random()<0.5 ? 'rgba(60,110,55,0.16)' : 'rgba(190,230,140,0.14)';
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    // grass blade strokes
    ctx.lineCap='round';
    for(let i=0;i<420;i++){
      const x=Math.random()*size, y=Math.random()*size;
      const len=Util.rand(4,10), ang=Util.rand(-0.5,0.5)-Math.PI/2;
      const shade=Util.randInt(0,1);
      ctx.strokeStyle = shade? 'rgba(50,95,48,0.55)':'rgba(200,235,150,0.5)';
      ctx.lineWidth=Util.rand(1,1.8);
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len); ctx.stroke();
    }
    // baked grid line border (so tiling forms a visible grid)
    ctx.strokeStyle='rgba(40,70,42,0.55)'; ctx.lineWidth=4;
    ctx.strokeRect(2,2,size-4,size-4);
    const tex=new THREE.CanvasTexture(cv);
    tex.anisotropy=4;
    this._cache.grass=tex;
    return tex;
  },
  pathTile(){
    if(this._cache.path) return this._cache.path;
    const size=256;
    const cv=document.createElement('canvas'); cv.width=cv.height=size;
    const ctx=cv.getContext('2d');
    const g=ctx.createLinearGradient(0,0,size,size);
    g.addColorStop(0,'#d9c9a3'); g.addColorStop(1,'#c9b78c');
    ctx.fillStyle=g; ctx.fillRect(0,0,size,size);
    for(let i=0;i<90;i++){
      const x=Math.random()*size, y=Math.random()*size, r=Util.rand(3,9);
      ctx.fillStyle = Math.random()<0.5 ? 'rgba(150,125,80,0.25)' : 'rgba(235,220,180,0.3)';
      ctx.beginPath(); ctx.ellipse(x,y,r,r*0.7,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }
    for(let i=0;i<60;i++){
      const x=Math.random()*size, y=Math.random()*size, r=Util.rand(2,4);
      ctx.fillStyle='rgba(120,100,70,0.35)';
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle='rgba(120,100,65,0.5)'; ctx.lineWidth=4;
    ctx.strokeRect(2,2,size-4,size-4);
    const tex=new THREE.CanvasTexture(cv);
    tex.anisotropy=4;
    this._cache.path=tex;
    return tex;
  }
};

/* =========================================================
   MODEL FACTORY — builds real 3D primitive "chibi" characters
========================================================= */
const ModelFactory = {
  mat(color,opts){ return new THREE.MeshStandardMaterial(Object.assign({color,roughness:0.55,metalness:0.06},opts||{})); },
  _spriteTexCache:{},
  getSpriteTexture(id){
    if(this._spriteTexCache[id]) return this._spriteTexCache[id];
    const loader=new THREE.TextureLoader();
    const tex=loader.load(HERO_SPRITES[id]);
    tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
    this._spriteTexCache[id]=tex;
    return tex;
  },
  buildHeroSprite(def){
    const g=new THREE.Group();
    // soft grounding shadow
    const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.32,depthWrite:false});
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(0.34,20),shadowMat);
    shadow.rotation.x=-Math.PI/2; shadow.position.y=0.01;
    g.add(shadow);
    const tex=this.getSpriteTexture(def.id);
    const mat=new THREE.SpriteMaterial({map:tex,transparent:true,color:0xffffff});
    const sprite=new THREE.Sprite(mat);
    const aspect=HERO_SPRITE_ASPECT[def.id]||0.85;
    const spriteH=1.5, spriteW=spriteH*aspect;
    sprite.scale.set(spriteW,spriteH,1);
    sprite.position.y=spriteH*0.02;
    sprite.center.set(0.5,0);
    g.add(sprite);
    g.userData.spriteMode=true;
    g.userData.sprite=sprite;
    g.userData.spriteBaseScale={x:spriteW,y:spriteH};
    return g;
  },
  _gltfLoader:null,
  _modelCache:{},
  cloneModel(src){
    const clone=src.clone(true);
    clone.traverse(o=>{
      if(o.isMesh){
        o.geometry=o.geometry.clone();
        if(Array.isArray(o.material)) o.material=o.material.map(m=>m.clone());
        else if(o.material) o.material=o.material.clone();
        o.castShadow=true; o.receiveShadow=true;
      }
    });
    return clone;
  },
  buildHeroModel(def){
    const holder=new THREE.Group();
    holder.userData.loading3D=true;
    // lightweight placeholder while the GLB is loading
    const temp=this.buildHeroSprite(def);
    temp.scale.setScalar(.85); holder.add(temp);
    if(!window.THREE || !THREE.GLTFLoader){ return holder; }
    if(!this._gltfLoader) this._gltfLoader=new THREE.GLTFLoader();
    const path=HERO_MODELS[def.id];
    const install=(source)=>{
      if(!holder.parent && !holder.userData.unitRef) return;
      while(holder.children.length){
        const child=holder.children.pop();
        disposeGroup(child);
      }
      const model=this.cloneModel(source);
      model.rotation.y=HERO_MODEL_YAW[def.id]||Math.PI/2;

      // Normalize every imported GLB to the same visual height and place its feet on y=0.
      model.updateMatrixWorld(true);
      let box=new THREE.Box3().setFromObject(model);
      const rawHeight=Math.max(0.001,box.max.y-box.min.y);
      const targetHeight=HERO_MODEL_HEIGHT[def.id]||1.30;
      const uniformScale=targetHeight/rawHeight;
      model.scale.setScalar(uniformScale);
      model.updateMatrixWorld(true);
      box=new THREE.Box3().setFromObject(model);
      const center=box.getCenter(new THREE.Vector3());
      model.position.x-=center.x;
      model.position.z-=center.z;
      model.position.y-=box.min.y;

      // Keep prototype materials readable on mobile screens without washing out their colors.
      model.traverse(o=>{
        if(!o.isMesh || !o.material) return;
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(m=>{
          if(m.color){
            if('emissive' in m){ m.emissive.copy(m.color).multiplyScalar(0.10); m.emissiveIntensity=0.55; }
            m.roughness=Math.min(0.82, m.roughness===undefined?0.68:m.roughness);
            m.metalness=Math.min(0.18, m.metalness===undefined?0.04:m.metalness);
            m.needsUpdate=true;
          }
        });
      });

      holder.add(model);
      holder.userData.modelRoot=model;
      holder.userData.baseModelScale=uniformScale;
      holder.userData.loading3D=false;
    };
    if(this._modelCache[path]){
      install(this._modelCache[path]);
    }else{
      this._gltfLoader.load(path,(gltf)=>{
        this._modelCache[path]=gltf.scene;
        install(gltf.scene);
      },undefined,(err)=>{
        console.warn('Could not load hero model',path,err);
        holder.userData.loading3D=false;
      });
    }
    return holder;
  },
  buildHero(def){
    if(HERO_MODELS[def.id]) return this.buildHeroModel(def);
    if(HERO_SPRITES[def.id]) return this.buildHeroSprite(def);
    const g=new THREE.Group();
    const bodyMat=this.mat(def.colors[0]);
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.38,16,12),bodyMat);
    body.position.y=0.44; g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.31,16,12),bodyMat);
    head.position.y=0.98; g.add(head);
    const eyeMat=this.mat('#241335',{roughness:1,metalness:0});
    [-0.12,0.12].forEach(ex=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),eyeMat);
      eye.position.set(ex,1.0,0.27); g.add(eye);
    });
    const armMat=this.mat(shadeHex(def.colors[1],14));
    const leftArm=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.4,8),armMat);
    leftArm.geometry.translate(0,-0.2,0);
    leftArm.position.set(-0.4,0.7,0); leftArm.rotation.z=0.22;
    g.add(leftArm);
    const rightArm=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.4,8),armMat.clone());
    rightArm.geometry.translate(0,-0.2,0);
    rightArm.position.set(0.4,0.7,0); rightArm.rotation.z=-0.22;
    g.add(rightArm);
    const legMat=this.mat(shadeHex(def.colors[1],-14));
    [-0.17,0.17].forEach(lx=>{
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.3,8),legMat);
      leg.position.set(lx,0.15,0); g.add(leg);
    });
    this.addHeroAccessory(g,def,rightArm,leftArm);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    g.userData.leftArm=leftArm; g.userData.rightArm=rightArm; g.userData.head=head; g.userData.body=body;
    return g;
  },
  addWeapon(rightArm,type,def){
    const handY=-0.42;
    const metal=this.mat('#565c68',{metalness:0.6,roughness:0.35});
    const wood=this.mat('#7a5230',{roughness:0.7});
    const gold=this.mat(def.colors[1],{metalness:0.5,roughness:0.4});
    switch(type){
      case'dog':{ // blaster cannon
        const g=new THREE.Group();
        const body=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.07,0.34,8),metal);
        body.rotation.z=Math.PI/2; body.position.set(0.1,0,0.05); g.add(body);
        const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.16,8),metal);
        barrel.rotation.z=Math.PI/2; barrel.position.set(0.28,0,0.05); g.add(barrel);
        const grip=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.05,0.16),gold);
        grip.position.set(0.06,-0.02,0.05); g.add(grip);
        g.position.set(0,handY,0.06); rightArm.add(g); break; }
      case'cat':{ // magic staff
        const g=new THREE.Group();
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.72,8),wood);
        pole.position.set(0,0.32,0); g.add(pole);
        const orb=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,10), new THREE.MeshStandardMaterial({color:'#c98af0',emissive:'#a24fe8',emissiveIntensity:0.7}));
        orb.position.set(0,0.7,0); g.add(orb);
        g.position.set(0.06,handY+0.05,0); rightArm.add(g); break; }
      case'duck':{ // wrench
        const g=new THREE.Group();
        const shaft=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.24,0.03),metal);
        shaft.position.set(0,-0.05,0); g.add(shaft);
        const head1=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.02,6,10),metal);
        head1.position.set(0,0.08,0); g.add(head1);
        g.position.set(0.08,handY,0.05); g.rotation.z=0.3; rightArm.add(g); break; }
      case'elf':{ // bow
        const g=new THREE.Group();
        const arc=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.018,6,12,Math.PI*1.3), this.mat('#5c3a1e',{roughness:0.7}));
        arc.rotation.z=Math.PI/2+0.4; g.add(arc);
        g.position.set(0.05,handY+0.1,0.05); rightArm.add(g); break; }
      case'knight':{ // sword
        const g=new THREE.Group();
        const blade=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.42,0.02), this.mat('#dfe6f5',{metalness:0.7,roughness:0.2}));
        blade.position.set(0,0.18,0); g.add(blade);
        const hilt=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.05,0.03),gold);
        hilt.position.set(0,-0.05,0); g.add(hilt);
        g.position.set(0.06,handY,0.04); rightArm.add(g); break; }
      case'adventurer':{ // short blade
        const g=new THREE.Group();
        const blade=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.32,0.018), this.mat('#e8413f',{metalness:0.4,roughness:0.3}));
        blade.position.set(0,0.14,0); g.add(blade);
        g.position.set(0.05,handY,0.04); g.rotation.z=-0.15; rightArm.add(g); break; }
      case'swordsman':{ // hand blade (a second sits on the back already)
        const g=new THREE.Group();
        const blade=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.4,0.016), this.mat('#dfe6f5',{metalness:0.7,roughness:0.2}));
        blade.position.set(0,0.18,0); g.add(blade);
        g.position.set(0.05,handY,0.04); rightArm.add(g); break; }
    }
  },
  addHeroAccessory(g,def,rightArm,leftArm){
    const accMat=this.mat(def.colors[1]);
    if(rightArm) this.addWeapon(rightArm,def.type,def);
    switch(def.type){
      case'dog':
        [-0.26,0.26].forEach(ex=>{
          const ear=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.24,8),accMat);
          ear.position.set(ex,1.02,0.04); ear.rotation.z=ex<0?0.7:-0.7; ear.rotation.x=0.3;
          g.add(ear);
        });
        { const tail=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.32,8),accMat);
          tail.position.set(0,0.52,-0.4); tail.rotation.x=-1.15; g.add(tail); }
        break;
      case'cat':
        { const hat=new THREE.Mesh(new THREE.ConeGeometry(0.28,0.48,16),this.mat('#3a4fbf'));
          hat.position.set(0,1.38,0); g.add(hat);
          const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.05,16),this.mat('#3a4fbf'));
          brim.position.set(0,1.15,0); g.add(brim);
          const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.07,0.46,8),accMat);
          tail.position.set(0,0.48,-0.38); tail.rotation.x=-1.0; g.add(tail); }
        break;
      case'duck':
        { const beak=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.17,8),this.mat('#e8933a'));
          beak.rotation.z=Math.PI/2; beak.position.set(0,0.93,0.27); g.add(beak);
          const pack=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.28,0.18),this.mat('#8a6a3a'));
          pack.position.set(0,0.52,-0.28); g.add(pack); }
        break;
      case'elf':
        [-0.25,0.25].forEach(ex=>{
          const ear=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.2,6),this.mat('#ead9b8'));
          ear.position.set(ex,0.98,0); ear.rotation.z=ex<0?0.9:-0.9;
          g.add(ear);
        });
        break;
      case'knight':
        { const helm=new THREE.Mesh(new THREE.SphereGeometry(0.29,12,10),this.mat('#d9e3ef',{metalness:0.6,roughness:0.3}));
          helm.position.set(0,0.98,0); g.add(helm);
          const shield=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.48,0.32),this.mat('#4d637f',{metalness:0.4}));
          shield.position.set(-0.46,0.68,0.1); g.add(shield); }
        break;
      case'adventurer':
        { const hood=new THREE.Mesh(new THREE.TorusGeometry(0.25,0.065,8,16,Math.PI),this.mat('#c14f2e'));
          hood.rotation.x=Math.PI/2; hood.position.set(0,0.76,-0.05); g.add(hood); }
        break;
      case'swordsman':
        [-0.2,0.2].forEach(sx=>{
          const blade=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.56,0.02),this.mat('#dfe6f5',{metalness:0.7,roughness:0.2}));
          blade.position.set(sx,0.72,-0.3); blade.rotation.z=sx<0?0.15:-0.15;
          g.add(blade);
        });
        break;
    }
  },
  buildEnemy(def,typeId){
    const g=new THREE.Group();
    const s=def.size/28;
    const transparent = !!def.alpha;
    const bodyMat=new THREE.MeshStandardMaterial({color:def.color,roughness:0.6,transparent,opacity:def.alpha||1});
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.34*s,16,12),bodyMat);
    body.position.y=0.4*s; g.add(body);
    const eyeMat=new THREE.MeshStandardMaterial({color:'#ff3b3b',emissive:'#ff3b3b',emissiveIntensity:0.7});
    [-0.1,0.1].forEach(ex=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.05*s,8,8),eyeMat);
      eye.position.set(ex*s,0.5*s,0.28*s); g.add(eye);
    });
    this.addEnemyAccessory(g,def,typeId,s);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=!transparent; });
    g.userData.body=body;
    return g;
  },
  addEnemyAccessory(g,def,typeId,s){
    const accMat=new THREE.MeshStandardMaterial({color:shadeHex(def.color,-30)});
    switch(typeId){
      case'goblin':
        [-0.22,0.22].forEach(ex=>{
          const ear=new THREE.Mesh(new THREE.ConeGeometry(0.06*s,0.2*s,6),accMat);
          ear.position.set(ex*s,0.55*s,0); ear.rotation.z=ex<0?1.0:-1.0; g.add(ear);
        });
        break;
      case'orc':
        [-0.1,0.1].forEach(ex=>{
          const tusk=new THREE.Mesh(new THREE.ConeGeometry(0.04*s,0.13*s,6),new THREE.MeshStandardMaterial({color:'#fff6ec'}));
          tusk.position.set(ex*s,0.28*s,0.28*s); tusk.rotation.x=Math.PI; g.add(tusk);
        });
        break;
      case'skeleton':
        for(let i=0;i<3;i++){
          const rib=new THREE.Mesh(new THREE.TorusGeometry(0.2*s,0.02*s,6,10,Math.PI),new THREE.MeshStandardMaterial({color:'#e5e0cc'}));
          rib.position.set(0,(0.24+i*0.11)*s,0); rib.rotation.y=Math.PI/2; g.add(rib);
        }
        break;
      case'darkmage':
        { const hat=new THREE.Mesh(new THREE.ConeGeometry(0.22*s,0.38*s,10),new THREE.MeshStandardMaterial({color:'#4a2f8f'}));
          hat.position.set(0,0.82*s,0); g.add(hat);
          const staff=new THREE.Mesh(new THREE.CylinderGeometry(0.02*s,0.02*s,0.58*s,6),new THREE.MeshStandardMaterial({color:'#6a4a2f'}));
          staff.position.set(0.3*s,0.4*s,0); g.add(staff); }
        break;
      case'ogre':
        { const club=new THREE.Mesh(new THREE.CylinderGeometry(0.08*s,0.14*s,0.48*s,8),accMat);
          club.position.set(0.4*s,0.4*s,0); club.rotation.z=0.6; g.add(club); }
        break;
      case'wolf':
        { const snout=new THREE.Mesh(new THREE.ConeGeometry(0.08*s,0.19*s,8),accMat);
          snout.rotation.z=Math.PI/2; snout.position.set(0,0.4*s,0.3*s); g.add(snout); }
        break;
      case'boss':
        [-0.2,0.2].forEach(ex=>{
          const horn=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.3,8),new THREE.MeshStandardMaterial({color:'#1a0f14'}));
          horn.position.set(ex,0.82,0); horn.rotation.z=ex<0?0.5:-0.5; g.add(horn);
        });
        break;
    }
  },
  buildProjectile(type){
    const color=this.projColor(type);
    const geo = type==='arrow'? new THREE.ConeGeometry(0.05,0.22,6) : new THREE.SphereGeometry(0.09,8,8);
    const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.9});
    const m=new THREE.Mesh(geo,mat);
    if(type==='arrow') m.rotation.z=Math.PI/2;
    return m;
  },
  projColor(type){
    switch(type){ case'orb':return 0xc98af0; case'wrench':return 0xf7e04a; case'arrow':return 0x7de0a0; case'darkbolt':return 0x7a4fc9; default:return 0xffffff; }
  },
  buildStar(){
    const g=new THREE.Group();
    const geo=new THREE.OctahedronGeometry(0.24,0);
    const mat=new THREE.MeshStandardMaterial({color:'#ffd166',emissive:'#ffb020',emissiveIntensity:0.6,metalness:0.3,roughness:0.3});
    const m=new THREE.Mesh(geo,mat); m.castShadow=true; g.add(m);
    const hitZone=new THREE.Mesh(new THREE.SphereGeometry(0.45,8,8), new THREE.MeshBasicMaterial({visible:false}));
    g.add(hitZone);
    return g;
  }
};

/* =========================================================
   PARTICLES (3D)
========================================================= */
class ParticleSystem3D{
  constructor(){ this.list=[]; }
  burst(x,y,z,color,count,opts){
    opts=opts||{}; count=count||10;
    for(let i=0;i<count;i++){
      const geo=new THREE.SphereGeometry(Util.rand(0.03,0.07)*(opts.big?1.7:1),6,6);
      const mat=new THREE.MeshBasicMaterial({color,transparent:true});
      const m=new THREE.Mesh(geo,mat);
      m.position.set(x,y,z);
      Game.board.particleGroup.add(m);
      const a=Math.random()*Math.PI*2, spd=Util.rand(1,4);
      this.list.push({mesh:m, vx:Math.cos(a)*spd, vy:Util.rand(1.5,3.5), vz:Math.sin(a)*spd, life:Util.rand(.35,.7), age:0, grav:opts.grav||6});
    }
  }
  update(dt){
    for(let i=this.list.length-1;i>=0;i--){
      const p=this.list[i]; p.age+=dt;
      if(p.age>=p.life){ Game.board.particleGroup.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); this.list.splice(i,1); continue; }
      p.vy-=p.grav*dt;
      p.mesh.position.x+=p.vx*dt; p.mesh.position.y+=p.vy*dt; p.mesh.position.z+=p.vz*dt;
      p.mesh.material.opacity=1-p.age/p.life;
    }
  }
}

/* =========================================================
   HERO INSTANCE
========================================================= */
let HERO_UID=1;
class HeroUnit{
  constructor(defId,row,col){
    const def=HERO_DEFS[defId];
    this.def=def; this.id=HERO_UID++;
    this.row=row; this.col=col;
    const lvlUp=1+(Storage.data.heroUpgrades[defId]||0)*0.12;
    this.maxHp=def.hp*lvlUp; this.hp=this.maxHp;
    this.dmg=def.dmg*lvlUp;
    this.cooldown=def.cooldown; this.cdTimer=Util.rand(0,def.cooldown*0.3);
    this.range=def.range;
    this.state='idle'; this.stateTimer=0; this.t=0;
    this.seed=Math.random()*1000; this.dead=false; this.fadeT=0;
    this.ultiCd=0; this.ultiMax=14000+Math.random()*2000;
    this.level=1+Math.floor((Storage.data.heroKills[defId]||0)/10);
    this.mesh=null;
  }
  buildMesh(board){
    this.mesh=ModelFactory.buildHero(this.def);
    this.mesh.userData.unitRef=this;
    this.mesh.position.set(board.worldX(this.col),0,board.worldZ(this.row));
    board.unitGroup.add(this.mesh);
  }
  dispose(board){ if(this.mesh){ board.unitGroup.remove(this.mesh); disposeGroup(this.mesh); this.mesh=null; } }
  takeDamage(dmg){
    this.hp-=dmg; this.state='hit'; this.stateTimer=180;
    if(this.mesh) Game.fx.burst(this.mesh.position.x,0.7,this.mesh.position.z,'#ff5a5a',6);
    if(this.hp<=0 && !this.dead){ this.dead=true; this.state='death'; this.stateTimer=500; Audio2.play('death'); }
  }
  update(dt,dtms,board){
    if(this.dead){ this.fadeT+=dtms; this.animateDeath(dtms); return; }
    if(this.stateTimer>0) this.stateTimer-=dtms; else if(this.state!=='idle') this.state='idle';
    let target=null,bestDx=Infinity;
    for(const e of board.enemies){
      if(e.row!==this.row || e.dead) continue;
      const dx=e.col-this.col;
      if(dx>=-0.3 && dx<=this.range){ if(dx<bestDx){bestDx=dx; target=e;} }
    }
    this.cdTimer-=dtms;
    if(target && this.cdTimer<=0){ this.cdTimer=this.cooldown; this.attack(target,board); }
    if(this.ultiCd>0) this.ultiCd-=dtms;
    this.animate(dtms,board);
  }
  attack(target,board){
    this.state='attack'; this.stateTimer=220; Audio2.play('attack');
    board.spawnProjectile(this,target);
  }
  tryUlti(){
    if(this.ultiCd>0 || this.dead) return false;
    this.ultiCd=this.ultiMax; Audio2.play('ulti'); Game.doUltimate(this);
    return true;
  }
  animate(dtms,board){
    this.t+=dtms;
    const bob=Math.sin(this.t/300+this.seed)*0.025;
    const breathe=1+Math.sin(this.t/520+this.seed)*0.012;
    this.mesh.position.set(board.worldX(this.col),bob,board.worldZ(this.row));
    this.mesh.scale.setScalar(breathe);
    let swing=0;
    if(this.state==='attack') swing=Math.sin(Util.clamp(1-this.stateTimer/220,0,1)*Math.PI);
    if(this.mesh.userData.rightArm) this.mesh.userData.rightArm.rotation.x=-swing*1.15;
    if(this.mesh.userData.leftArm) this.mesh.userData.leftArm.rotation.x=-swing*0.4;
    if(this.mesh.userData.spriteMode && this.mesh.userData.sprite){
      const s=this.mesh.userData.spriteBaseScale;
      const punch=1+swing*0.12;
      this.mesh.userData.sprite.scale.set(s.x*punch,s.y*(1-swing*0.05),1);
    }
    const flash=this.state==='hit'?Util.clamp(this.stateTimer/180,0,1):0;
    setEmissive(this.mesh, flash>0?0xff3b3b:0x000000, flash*0.8);
  }
  animateDeath(dtms){
    if(!this.mesh) return;
    const t=Util.clamp(this.fadeT/600,0,1);
    this.mesh.position.y-=0.0018*dtms;
    this.mesh.rotation.z=t*1.2;
    setOpacity(this.mesh,1-t);
  }
}

/* =========================================================
   ENEMY INSTANCE
========================================================= */
let ENEMY_UID=1;
class EnemyUnit{
  constructor(typeId,row,col,mult){
    const def=ENEMY_DEFS[typeId]; this.def=def; this.type=typeId; this.id=ENEMY_UID++;
    this.row=row; this.col=col;
    this.maxHp=def.hp*mult.hpMult; this.hp=this.maxHp;
    this.dmg=def.dmg*mult.dmgMult; this.spd=def.spd*mult.spdMult;
    this.state='walk'; this.stateTimer=0; this.dead=false; this.fadeT=0; this.t=0;
    this.seed=Math.random()*1000; this.atkCd=0;
    this.mesh=null;
  }
  buildMesh(board){
    this.mesh=ModelFactory.buildEnemy(this.def,this.type);
    this.mesh.userData.unitRef=this;
    this.mesh.position.set(board.worldX(this.col),0,board.worldZ(this.row));
    board.unitGroup.add(this.mesh);
  }
  dispose(board){ if(this.mesh){ board.unitGroup.remove(this.mesh); disposeGroup(this.mesh); this.mesh=null; } }
  takeDamage(dmg){
    this.hp-=dmg; if(!this.dead){ this.state='hit'; this.stateTimer=140; }
    if(this.mesh) Game.fx.burst(this.mesh.position.x,0.5,this.mesh.position.z,this.def.color,5);
    if(this.hp<=0 && !this.dead){
      this.dead=true; this.state='death'; this.stateTimer=450; Audio2.play('death');
      if(this.mesh) Game.fx.burst(this.mesh.position.x,0.5,this.mesh.position.z,this.def.color,this.def.boss?36:14,{big:this.def.boss,grav:this.def.boss?3:6});
      if(this.def.boss) Game.screenShake(0.22,400);
      Game.onEnemyKilled(this);
    }
  }
  update(dt,dtms,board){
    if(this.dead){ this.fadeT+=dtms; this.animateDeath(dtms); return; }
    if(this.stateTimer>0) this.stateTimer-=dtms;
    let blocker=null,bestDx=Infinity;
    for(const h of board.heroes){
      if(h.row!==this.row||h.dead) continue;
      const dx=this.col-h.col;
      if(dx>-0.1 && dx<0.55){ if(dx<bestDx){bestDx=dx;blocker=h;} }
    }
    if(blocker){
      this.atkCd-=dtms;
      if(this.atkCd<=0){ this.atkCd=800; blocker.takeDamage(this.dmg); this.state='attack'; this.stateTimer=250; Audio2.play('hit'); }
    } else if(this.def.ranged){
      let inRange=false;
      for(const h of board.heroes){
        if(h.row!==this.row||h.dead) continue;
        const dx=this.col-h.col;
        if(dx>0 && dx<this.def.range){
          inRange=true;
          this.atkCd-=dtms;
          if(this.atkCd<=0){ this.atkCd=1600; board.spawnEnemyProjectile(this,h); this.state='attack'; this.stateTimer=300; }
        }
      }
      if(!inRange) this.col-=this.spd*dt;
    } else {
      this.col-=this.spd*dt;
      if(this.state==='idle'||this.state==='walk') this.state='walk';
    }
    if(this.col<=board.houseCol){
      board.damageHouse(this.dmg*0.6+8);
      this.dead=true; this.fadeT=999;
    }
    this.animate(dtms,board);
  }
  animate(dtms,board){
    if(!this.mesh) return;
    this.t+=dtms;
    const bob=Math.abs(Math.sin(this.t/220+this.seed))*0.09;
    this.mesh.position.set(board.worldX(this.col),bob,board.worldZ(this.row));
    const flash=this.state==='hit'?Util.clamp(this.stateTimer/140,0,1):0;
    setEmissive(this.mesh, flash>0?0xffffff:0x000000, flash*0.9);
  }
  animateDeath(dtms){
    if(!this.mesh) return;
    const t=Util.clamp(this.fadeT/450,0,1);
    this.mesh.position.y-=0.0015*dtms;
    this.mesh.rotation.x=t*1.4;
    setOpacity(this.mesh,(this.def.alpha||1)*(1-t));
  }
}

/* =========================================================
   PROJECTILE (3D)
========================================================= */
class Projectile3D{
  constructor(board,shooter,target,dmg,type,opts){
    opts=opts||{};
    this.dmg=dmg; this.type=type; this.target=target; this.dead=false;
    this.speed=opts.speed||8; this.fromEnemy=!!opts.fromEnemy;
    this.mesh=ModelFactory.buildProjectile(type);
    this.mesh.position.set(board.worldX(shooter.col)+(this.fromEnemy?-0.3:0.3),0.65,board.worldZ(shooter.row));
    board.projGroup.add(this.mesh);
  }
  update(dt,board){
    if(this.dead) return;
    if(!this.target||this.target.dead){ this.dead=true; return; }
    const tx=board.worldX(this.target.col), tz=board.worldZ(this.target.row), ty=0.6;
    const dx=tx-this.mesh.position.x, dy=ty-this.mesh.position.y, dz=tz-this.mesh.position.z;
    const d=Math.hypot(dx,dy,dz)||1;
    const step=this.speed*dt;
    if(d<=step){
      this.target.takeDamage(this.dmg);
      Game.fx.burst(tx,ty,tz,ModelFactory.projColor(this.type),8);
      this.dead=true;
    } else {
      this.mesh.position.x+=dx/d*step;
      this.mesh.position.y+=dy/d*step;
      this.mesh.position.z+=dz/d*step;
      this.mesh.rotation.y+=0.3;
    }
  }
  dispose(board){ board.projGroup.remove(this.mesh); disposeGroup(this.mesh); }
}

/* =========================================================
   BOARD (3D scene)
========================================================= */
class Board3D{
  constructor(canvas){
    this.canvas=canvas;
    this.heroes=[]; this.enemies=[]; this.projectiles=[];
    this.houseHp=100; this.houseMaxHp=100;
    this.cols=9; this.rows=5; this.playableCols=6; this.houseCol=0.3;
    this.tile=1.6;
    this.raycaster=new THREE.Raycaster();
    this.initThree();
    this.buildLawn();
    this.buildHouse();
    this.resize();
  }
  worldX(col){ return (col - this.cols/2 + 0.5)*this.tile; }
  worldZ(row){ return (row - this.rows/2 + 0.5)*this.tile; }
  colRowFromWorld(x,z){
    return { col: Math.round(x/this.tile + this.cols/2 - 0.5), row: Math.round(z/this.tile + this.rows/2 - 0.5) };
  }
  initThree(){
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas, antialias:true});
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene=new THREE.Scene();
    this.scene.background=this.makeSkyTexture();
    this.scene.fog=new THREE.Fog(0x8fd5ff,22,42);
    this.camera=new THREE.PerspectiveCamera(40,1,0.1,100);
    this.camera.position.set(-0.8,10.3,10.8);
    this.camera.lookAt(0,0,0.2);
    this.camBase=this.camera.position.clone();
    // Brighter three-point lighting for readable characters on iPhone/iPad.
    const ambient=new THREE.AmbientLight(0xffffff,0.34);
    this.scene.add(ambient);
    const hemi=new THREE.HemisphereLight(0xeaf8ff,0x466237,0.88);
    this.scene.add(hemi);
    const dir=new THREE.DirectionalLight(0xfff3d0,1.05);
    dir.position.set(-6,10,6);
    dir.castShadow=true;
    dir.shadow.mapSize.set(1024,1024);
    dir.shadow.camera.left=-12; dir.shadow.camera.right=12; dir.shadow.camera.top=10; dir.shadow.camera.bottom=-10;
    this.scene.add(dir);
    const fill=new THREE.DirectionalLight(0xb9d9ff,0.32);
    fill.position.set(7,6,-5);
    this.scene.add(fill);
    const rim=new THREE.DirectionalLight(0xffd7ad,0.20);
    rim.position.set(0,5,-8);
    this.scene.add(rim);
    this.particleGroup=new THREE.Group(); this.scene.add(this.particleGroup);
    this.starGroup=new THREE.Group(); this.scene.add(this.starGroup);
    this.unitGroup=new THREE.Group(); this.scene.add(this.unitGroup);
    this.projGroup=new THREE.Group(); this.scene.add(this.projGroup);
  }
  makeSkyTexture(){
    const c=document.createElement('canvas'); c.width=512; c.height=512;
    const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'#48b8ff'); g.addColorStop(.55,'#bdeaff'); g.addColorStop(1,'#eefaff');
    x.fillStyle=g; x.fillRect(0,0,512,512);
    x.globalAlpha=.7;
    for(let i=0;i<14;i++){
      const cx=Math.random()*512, cy=40+Math.random()*320, r=18+Math.random()*36;
      x.fillStyle='#ffffff';
      x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.arc(cx+r*.8,cy+r*.1,r*.75,0,Math.PI*2); x.arc(cx-r*.75,cy+r*.15,r*.62,0,Math.PI*2); x.fill();
    }
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t;
  }
  makeMat(color,rough=.9){ return new THREE.MeshStandardMaterial({color,roughness:rough}); }
  addRock(x,z,s=.35){
    const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),this.makeMat(0x8d9692,.95));
    m.position.set(x,.20,z); m.scale.y=.7; m.rotation.set(.1,Math.random()*3,.15); m.castShadow=m.receiveShadow=true; this.scene.add(m);
  }
  addFlower(x,z,color=0xffffff){
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.18,6),this.makeMat(0x4d8f3d)); stem.position.set(x,.10,z); this.scene.add(stem);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),this.makeMat(color,.7)); head.position.set(x,.22,z); head.castShadow=true; this.scene.add(head);
  }
  addTree(x,z,s=1){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.11*s,.16*s,.75*s,8),this.makeMat(0x8b5a2b)); trunk.position.y=.38*s; trunk.castShadow=true; g.add(trunk);
    for(let i=0;i<3;i++){
      const crown=new THREE.Mesh(new THREE.ConeGeometry((.48-i*.07)*s,.78*s,8),this.makeMat(i===0?0x2f8d45:0x4ba954,.92));
      crown.position.y=(.78+i*.42)*s; crown.castShadow=true; g.add(crown);
    }
    g.position.set(x,0,z); this.scene.add(g);
  }
  addFencePost(x,z,rot=0){
    const g=new THREE.Group(); const wood=this.makeMat(0x9b672f,.95); const cap=this.makeMat(0xc8924b,.9);
    for(const dx of [-.52,.52]){ const p=new THREE.Mesh(new THREE.BoxGeometry(.16,.52,.16),wood); p.position.set(dx,.25,0); p.castShadow=true; g.add(p); const c=new THREE.Mesh(new THREE.ConeGeometry(.13,.16,4),cap); c.position.set(dx,.59,0); c.rotation.y=Math.PI/4; g.add(c); }
    for(const yy of [.20,.40]){ const rail=new THREE.Mesh(new THREE.BoxGeometry(1.18,.11,.10),wood); rail.position.y=yy; rail.castShadow=true; g.add(rail); }
    g.position.set(x,0,z); g.rotation.y=rot; this.scene.add(g);
  }
  buildLawn(){
    const boardW=this.cols*this.tile, boardH=this.rows*this.tile;
    const centerX=this.worldX((this.cols-1)/2);

    // Floating island body, layered to read clearly against the sky.
    const soil=new THREE.Mesh(new THREE.BoxGeometry(boardW+1.8,1.35,boardH+1.8),this.makeMat(0x6b4a2f,1));
    soil.position.set(centerX,-.78,0); soil.receiveShadow=true; soil.castShadow=true; this.scene.add(soil);
    const rockBase=new THREE.Mesh(new THREE.CylinderGeometry((boardW+1.2)*.55,(boardW+1.2)*.42,2.5,12),this.makeMat(0x665548,1));
    rockBase.rotation.z=Math.PI/2; rockBase.scale.z=.63; rockBase.position.set(centerX,-2.15,0); rockBase.castShadow=true; this.scene.add(rockBase);

    const grassTop=new THREE.Mesh(new THREE.BoxGeometry(boardW+1.55,.34,boardH+1.55),this.makeMat(0x65ad38,.94));
    grassTop.position.set(centerX,-.14,0); grassTop.receiveShadow=true; grassTop.castShadow=true; this.scene.add(grassTop);

    // Individual grass tiles give the board the soft, premium grid look from the reference.
    const tileGeo=new THREE.BoxGeometry(this.tile-.055,.13,this.tile-.055);
    for(let row=0; row<this.rows; row++) for(let col=0; col<this.cols; col++){
      const isPath=col>=this.playableCols;
      const base=isPath ? (0x86b94b + ((row+col)%2?0x030500:0)) : (0x76bf43 + ((row+col)%2?0x040600:0));
      const tile=new THREE.Mesh(tileGeo,this.makeMat(base,.98));
      tile.position.set(this.worldX(col),.05,this.worldZ(row)); tile.receiveShadow=true; this.scene.add(tile);
      const seam=new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo),new THREE.LineBasicMaterial({color:0x4f8b31,transparent:true,opacity:.26})); seam.position.copy(tile.position); this.scene.add(seam);
    }

    // Decorative edge: fences, rocks, flowers and trees, while keeping the battlefield clear.
    const left=centerX-boardW/2-.55, right=centerX+boardW/2+.55, top=-boardH/2-.55, bottom=boardH/2+.55;
    for(let x=left+1.0;x<right-1.0;x+=2.25){ this.addFencePost(x,top,0); if(x>centerX+1.5) this.addFencePost(x,bottom,0); }
    for(let z=top+1.2;z<bottom-1.2;z+=2.15){ this.addFencePost(right,z,Math.PI/2); }
    this.addTree(right-.45,top+.35,.78); this.addTree(right-1.35,top+.35,.62); this.addTree(left+.2,bottom-.2,.82);
    [[right-.2,bottom-.6,.42],[right-.35,top+1.4,.34],[left+.2,top+.35,.38],[left+.45,bottom-1.2,.30]].forEach(v=>this.addRock(...v));
    for(let i=0;i<24;i++){
      const side=Math.floor(Math.random()*4); let x,z;
      if(side===0){x=Util.rand(left+.2,right-.2);z=Util.rand(top+.25,top+.75);} else if(side===1){x=Util.rand(left+.2,right-.2);z=Util.rand(bottom-.75,bottom-.25);} else if(side===2){x=Util.rand(left+.2,left+.75);z=Util.rand(top+.5,bottom-.5);} else {x=Util.rand(right-.75,right-.2);z=Util.rand(top+.5,bottom-.5);}
      this.addFlower(x,z,Util.choice([0xffffff,0xffd34f,0xff7f8f,0x9fd8ff]));
    }

    this.groundPlane=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({visible:false}));
    this.groundPlane.rotation.x=-Math.PI/2; this.groundPlane.position.y=.12; this.scene.add(this.groundPlane);
  }
  buildHouse(){
    const g=new THREE.Group();
    const stone=new THREE.Mesh(new THREE.BoxGeometry(2.65,.45,2.45),this.makeMat(0x7f633f,.95)); stone.position.y=.22; stone.castShadow=stone.receiveShadow=true; g.add(stone);
    const lawn=new THREE.Mesh(new THREE.BoxGeometry(2.45,.25,2.25),this.makeMat(0x6cba3d,.95)); lawn.position.y=.52; lawn.castShadow=lawn.receiveShadow=true; g.add(lawn);
    const wall=new THREE.Mesh(new THREE.BoxGeometry(1.55,1.25,1.45),this.makeMat(0xf4dcae,.82)); wall.position.set(0,.98,0); wall.castShadow=true; wall.receiveShadow=true; g.add(wall);
    const roofMat=this.makeMat(0xd94e3f,.78);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.28,.92,4),roofMat); roof.rotation.y=Math.PI/4; roof.position.y=1.93; roof.castShadow=true; g.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(.46,.68,.10),this.makeMat(0x754326,.88)); door.position.set(.22,.85,.78); door.castShadow=true; g.add(door);
    const windowM=this.makeMat(0x90d9e8,.25); windowM.metalness=.05;
    const win=new THREE.Mesh(new THREE.BoxGeometry(.42,.38,.08),windowM); win.position.set(-.36,1.18,.79); g.add(win);
    // small fence around the house platform
    const wood=this.makeMat(0x96602c,.95);
    for(const xx of [-1.05,1.05]) for(const zz of [-.92,.92]){ const post=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.12),wood); post.position.set(xx,.74,zz); post.castShadow=true; g.add(post); }
    for(const zz of [-.94,.94]){ const r=new THREE.Mesh(new THREE.BoxGeometry(2.2,.10,.09),wood); r.position.set(0,.82,zz); g.add(r); }
    // Move house clearly outside the playable field, as requested.
    g.position.set(this.worldX(-1.30),0,.15); g.rotation.y=.05; this.scene.add(g); this.houseGroup=g;
  }
  resize(){
    const wrap=document.getElementById('screen-battle');
    const w=wrap.clientWidth,h=wrap.clientHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/(h||1);
    this.camera.updateProjectionMatrix();
    this.w=w; this.h=h;
  }
  canPlace(col,row){
    if(col<0||col>=this.playableCols||row<0||row>=this.rows) return false;
    for(const h of this.heroes){ if(!h.dead && Math.round(h.col)===col && h.row===row) return false; }
    return true;
  }
  addHero(defId,col,row){
    const hero=new HeroUnit(defId,row,col);
    hero.buildMesh(this);
    this.heroes.push(hero);
    Audio2.play('place');
    Game.fx.burst(this.worldX(col),0.6,this.worldZ(row),0x9de38a,12);
  }
  spawnProjectile(hero,target){
    if(hero.def.proj==='none'){
      target.takeDamage(hero.dmg);
      Game.fx.burst(this.worldX(target.col),0.7,this.worldZ(target.row),0xffffff,6);
      return;
    }
    this.projectiles.push(new Projectile3D(this,hero,target,hero.dmg,hero.def.proj,{pierce:hero.def.pierce}));
  }
  spawnEnemyProjectile(enemy,target){
    this.projectiles.push(new Projectile3D(this,enemy,target,enemy.dmg,'darkbolt',{fromEnemy:true,speed:6.5}));
  }
  damageHouse(v){
    this.houseHp=Math.max(0,this.houseHp-v);
    Game.screenShake(0.18,150);
    if(this.houseHp<=0) Game.onLose();
  }
  update(dt,dtms){
    for(const h of this.heroes) h.update(dt,dtms,this);
    for(const e of this.enemies) e.update(dt,dtms,this);
    for(const p of this.projectiles) p.update(dt,this);
    for(let i=this.heroes.length-1;i>=0;i--){ const h=this.heroes[i]; if(h.dead && h.fadeT>600){ h.dispose(this); this.heroes.splice(i,1);} }
    for(let i=this.enemies.length-1;i>=0;i--){ const e=this.enemies[i]; if(e.dead && e.fadeT>250){ e.dispose(this); this.enemies.splice(i,1);} }
    this.projectiles=this.projectiles.filter(p=>{ if(p.dead){ p.dispose(this); return false; } return true; });
  }
  render(){
    if(Game.shakeT>0){
      this.camera.position.set(
        this.camBase.x+(Math.random()-0.5)*Game.shakeMag,
        this.camBase.y+(Math.random()-0.5)*Game.shakeMag*0.4,
        this.camBase.z+(Math.random()-0.5)*Game.shakeMag);
    } else { this.camera.position.copy(this.camBase); }
    this.renderer.render(this.scene,this.camera);
  }
  worldToScreen(vec3){
    const v=vec3.clone().project(this.camera);
    return { x:(v.x*0.5+0.5)*this.w, y:(-v.y*0.5+0.5)*this.h };
  }
  raycastAt(clientX,clientY){
    const rect=this.canvas.getBoundingClientRect();
    const ndc=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1, -((clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(ndc,this.camera);
    return this.raycaster;
  }
  destroy(){
    this.renderer.dispose();
    this.scene.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); if(o.material){ if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose()); else o.material.dispose(); } } });
    const layer=document.getElementById('hpBarLayer'); if(layer) layer.innerHTML='';
  }
}

/* =========================================================
   GAME CONTROLLER
========================================================= */
const Game = {
  board:null, fx:new ParticleSystem3D(), running:false, speed:1, paused:false,
  energy:150, selectedHero:null, levelConf:null, waveIndex:0, spawnQueue:[], waveTimer:0,
  lastT:0, shakeT:0, shakeMag:0, starSpawnT:0, stars:[], win:false, sessionKills:0,

  start(levelNum){
    if(typeof THREE==='undefined'){
      alert('The 3D engine did not load. Please check your internet connection and reload the page.');
      UI.go('menu');
      return;
    }
    this.levelConf=generateLevel(levelNum);
    if(this.board) this.board.destroy();
    this.stars=[];
    this.board=new Board3D(document.getElementById('gameCanvas'));
    this.board.houseHp=this.board.houseMaxHp=100;
    this.energy=this.levelConf.startEnergy;
    this.waveIndex=0; this.selectedHero=null; this.speed=1; this.paused=false; this.win=false;
    this.sessionKills=0;
    document.getElementById('endgameOverlay').classList.remove('active');
    document.getElementById('pauseOverlay').classList.remove('active');
    this.loadWave(0);
    this.buildCardTray();
    document.getElementById('levelLabel').textContent='Lvl '+levelNum+(this.levelConf.isBoss?' 👑':'');
    this.updateHud();
    this.running=true; this.lastT=performance.now();
    requestAnimationFrame(Game.loop);
  },
  loadWave(i){
    this.waveIndex=i;
    const wave=this.levelConf.waves[i];
    this.spawnQueue=wave.entries.map(e=>Object.assign({},e,{t:e.delay}));
    this.waveTimer=0;
    document.getElementById('waveLabel').textContent='Wave '+(i+1)+'/'+this.levelConf.waves.length;
  },
  buildCardTray(){
    const tray=document.getElementById('cardTray'); tray.innerHTML='';
    for(const id of Storage.data.unlockedHeroes){
      const def=HERO_DEFS[id];
      const card=document.createElement('div'); card.className='tray-card'; card.dataset.hero=id;
      const cv=document.createElement('canvas'); cv.width=58; cv.height=50; card.appendChild(cv);
      drawCardIcon(cv,def);
      const cost=document.createElement('div'); cost.className='cost'; cost.textContent=def.cost;
      card.appendChild(cost);
      card.onclick=()=>Game.selectHeroCard(id,card);
      tray.appendChild(card);
    }
  },
  selectHeroCard(id,el){
    Audio2.play('button');
    this.selectedHero = this.selectedHero===id ? null : id;
    [...document.getElementById('cardTray').children].forEach(c=>c.classList.remove('selected'));
    if(this.selectedHero) el.classList.add('selected');
  },
  updateHud(){
    document.getElementById('energyVal').textContent=Math.floor(this.energy);
    document.getElementById('baseHpFill').style.width=Util.clamp(this.board.houseHp/this.board.houseMaxHp*100,0,100)+'%';
    [...document.getElementById('cardTray').children].forEach(c=>{
      const def=HERO_DEFS[c.dataset.hero];
      c.classList.toggle('disabled', this.energy<def.cost);
    });
  },
  toggleSpeed(){ this.speed=this.speed===1?2:1; document.getElementById('speedBtn').textContent='x'+this.speed; Audio2.play('button'); },
  pauseMenu(){ Audio2.play('button'); this.paused=!this.paused; document.getElementById('pauseOverlay').classList.toggle('active',this.paused); },
  screenShake(mag,ms){ this.shakeMag=mag; this.shakeT=ms; },

  handleCanvasTap(clientX,clientY){
    const board=this.board; if(!board) return;
    const raycaster=board.raycastAt(clientX,clientY);
    if(this.selectedHero){
      const hit=raycaster.intersectObject(board.groundPlane);
      if(hit.length){
        const {col,row}=board.colRowFromWorld(hit[0].point.x,hit[0].point.z);
        const def=HERO_DEFS[this.selectedHero];
        if(board.canPlace(col,row) && this.energy>=def.cost){
          board.addHero(this.selectedHero,col,row);
          this.energy-=def.cost; this.selectedHero=null;
          [...document.getElementById('cardTray').children].forEach(c=>c.classList.remove('selected'));
          this.updateHud();
        }
      }
      return;
    }
    const starHits=raycaster.intersectObjects(board.starGroup.children,true);
    if(starHits.length){
      const obj=findAncestorWithUserData(starHits[0].object,'starRef');
      if(obj){
        const star=obj.userData.starRef;
        this.energy+=25; this.removeStar(star);
        Audio2.play('collect'); Storage.data.missions.starsCollected++;
        this.floatTextWorld(obj.position,'+25⚡');
        this.updateHud();
        return;
      }
    }
    const heroHits=raycaster.intersectObjects(board.unitGroup.children,true);
    if(heroHits.length){
      const obj=findAncestorWithUserData(heroHits[0].object,'unitRef');
      if(obj){
        const unit=obj.userData.unitRef;
        if(unit instanceof HeroUnit && unit.tryUlti()) this.floatTextWorld(obj.position,'ULTIMATE!');
      }
    }
  },
  floatTextWorld(pos3,text){
    const p=new THREE.Vector3(pos3.x,pos3.y+1.1,pos3.z);
    const {x,y}=this.board.worldToScreen(p);
    this.floatText(x,y,text);
  },
  floatText(x,y,text){
    const el=document.createElement('div'); el.className='floatEnergy'; el.textContent=text;
    const rect=this.board.canvas.getBoundingClientRect();
    el.style.left=(rect.left+x-20)+'px'; el.style.top=(rect.top+y-20)+'px';
    document.getElementById('screen-battle').appendChild(el);
    let t=0; const anim=()=>{ t+=16; el.style.transform='translateY('+(-t*0.4)+'px)'; el.style.opacity=1-t/800;
      if(t<800) requestAnimationFrame(anim); else el.remove(); };
    requestAnimationFrame(anim);
  },
  doUltimate(hero){
    const b=this.board, pos=hero.mesh.position;
    switch(hero.def.id){
      case'mio': { const targets=b.enemies.filter(e=>!e.dead && e.row===hero.row);
        for(const e of targets) e.takeDamage(hero.dmg*2.5);
        this.fx.burst(pos.x+2,0.6,pos.z,0xff8a4a,30,{big:true}); this.screenShake(0.16,300); break; }
      case'wind': { const targets=b.enemies.filter(e=>!e.dead && e.row===hero.row);
        for(const e of targets) e.takeDamage(hero.dmg*1.8); break; }
      case'rian': case'kaisen': { const near=b.enemies.filter(e=>!e.dead&&e.row===hero.row).slice(0,5);
        for(const e of near) e.takeDamage(hero.dmg*1.6); break; }
      case'titan': hero.hp=hero.maxHp; this.fx.burst(pos.x,0.6,pos.z,0x9fb6d9,20); break;
      case'gabby': hero.cooldown*=0.5; setTimeout(()=>hero.cooldown*=2,8000); break;
      case'brisky': for(const h of b.heroes) if(!h.dead) h.cooldown=Math.max(120,h.cooldown*0.6);
        setTimeout(()=>{ for(const h of b.heroes) if(!h.dead) h.cooldown=HERO_DEFS[h.def.id].cooldown; },6000); break;
    }
  },
  spawnStarMaybe(dtms){
    this.starSpawnT+=dtms;
    if(this.starSpawnT>3800 && this.stars.length<3){
      this.starSpawnT=0;
      const board=this.board;
      const col=Util.rand(1.2,board.playableCols+1.5), row=Util.rand(0,board.rows-1);
      const mesh=ModelFactory.buildStar();
      mesh.position.set(board.worldX(col),1.0,board.worldZ(row));
      const starObj={mesh,t:0};
      mesh.userData.starRef=starObj;
      board.starGroup.add(mesh);
      this.stars.push(starObj);
    }
    for(const s of this.stars){ s.t+=dtms; s.mesh.rotation.y+=dtms*0.002; s.mesh.position.y=1.0+Math.sin(s.t/300)*0.08; }
    for(let i=this.stars.length-1;i>=0;i--){ if(this.stars[i].t>9000) this.removeStar(this.stars[i]); }
  },
  removeStar(star){
    this.board.starGroup.remove(star.mesh); disposeGroup(star.mesh);
    const idx=this.stars.indexOf(star); if(idx>=0) this.stars.splice(idx,1);
  },
  onEnemyKilled(e){
    this.sessionKills++;
    Storage.data.missions.kills++;
    Storage.data.coins+=e.def.boss?40:Util.randInt(2,5);
    let killer=null,best=Infinity;
    for(const h of this.board.heroes){ if(h.dead) continue; const d=Math.abs(h.row-e.row)+Math.abs(h.col-e.col)/3; if(d<best){best=d;killer=h;} }
    if(killer) Storage.data.heroKills[killer.def.id]=(Storage.data.heroKills[killer.def.id]||0)+1;
    Storage.save();
    this.updateHud();
  },
  checkWaveProgress(dtms){
    const q=this.spawnQueue; this.waveTimer+=dtms;
    for(const entry of q){
      if(!entry.spawned && this.waveTimer>=entry.t){
        entry.spawned=true;
        const e=new EnemyUnit(entry.type,entry.row,this.board.cols+0.6,this.levelConf);
        e.buildMesh(this.board);
        this.board.enemies.push(e);
      }
    }
    const allSpawned=q.every(e=>e.spawned);
    if(allSpawned && this.board.enemies.length===0){
      if(this.waveIndex<this.levelConf.waves.length-1) this.loadWave(this.waveIndex+1);
      else if(!this.win) this.onWin();
    }
  },
  onWin(){
    this.win=true; this.running=false; Audio2.play('win');
    const lvl=this.levelConf.level;
    const hpPct=this.board.houseHp/this.board.houseMaxHp;
    const stars=hpPct>0.75?3:hpPct>0.4?2:1;
    Storage.data.maxUnlockedLevel=Math.max(Storage.data.maxUnlockedLevel, Math.min(TOTAL_LEVELS, lvl+1));
    Storage.data.levelStars[lvl]=Math.max(Storage.data.levelStars[lvl]||0,stars);
    Storage.data.missions.levelsWon=(Storage.data.missions.levelsWon||0)+1;
    const reward=30+lvl*4;
    Storage.data.coins+=reward;
    Storage.save();
    document.getElementById('endgameTitle').textContent='VICTORY!';
    document.getElementById('endgameStars').textContent=['☆☆☆','★☆☆','★★☆','★★★'][stars];
    document.getElementById('endgameReward').textContent='+'+reward+' Coins';
    document.getElementById('nextLevelBtn').style.display=lvl<TOTAL_LEVELS?'block':'none';
    document.getElementById('endgameOverlay').classList.add('active');
  },
  onLose(){
    if(!this.running) return;
    this.running=false; Audio2.play('lose');
    document.getElementById('endgameTitle').textContent='DEFEATED';
    document.getElementById('endgameStars').textContent='☆☆☆';
    document.getElementById('endgameReward').textContent='Try again!';
    document.getElementById('nextLevelBtn').style.display='none';
    document.getElementById('endgameOverlay').classList.add('active');
  },
  retry(){ Audio2.play('button'); this.start(this.levelConf.level); },
  nextLevel(){ Audio2.play('button'); this.start(Math.min(TOTAL_LEVELS,this.levelConf.level+1)); },

  updateHpBars(){
    const layer=document.getElementById('hpBarLayer');
    const board=this.board; if(!board){ layer.innerHTML=''; return; }
    let html='';
    for(const h of board.heroes){
      if(h.dead||!h.mesh) continue;
      const {x,y}=board.worldToScreen(new THREE.Vector3(h.mesh.position.x,h.mesh.position.y+1.18,h.mesh.position.z));
      if(x<-60||x>board.w+60) continue;
      const pct=Util.clamp(h.hp/h.maxHp,0,1)*100;
      html+='<div class="hpbar3d" style="left:'+x+'px; top:'+y+'px;"><div class="hpfill" style="width:'+pct+'%"></div><div class="lvltag">Lv'+h.level+'</div></div>';
    }
    for(const e of board.enemies){
      if(e.dead||!e.mesh) continue;
      const off=e.def.boss?1.3:0.85;
      const {x,y}=board.worldToScreen(new THREE.Vector3(e.mesh.position.x,e.mesh.position.y+off,e.mesh.position.z));
      if(x<-60||x>board.w+60) continue;
      const pct=Util.clamp(e.hp/e.maxHp,0,1)*100;
      const w=e.def.boss?74:40;
      html+='<div class="hpbar3d'+(e.def.boss?' boss':'')+'" style="left:'+x+'px; top:'+y+'px; width:'+w+'px;"><div class="hpfill enemy" style="width:'+pct+'%"></div></div>';
    }
    layer.innerHTML=html;
  },

  loop(now){
    if(!Game.running) return;
    let dtms=Math.min(50,now-Game.lastT); Game.lastT=now;
    if(Game.paused) dtms=0;
    dtms*=Game.speed;
    const dt=dtms/1000;
    if(dtms>0){
      Game.board.update(dt,dtms);
      Game.checkWaveProgress(dtms);
      Game.spawnStarMaybe(dtms);
      Game.fx.update(dt);
      if(Game.shakeT>0) Game.shakeT-=dtms;
    }
    Game.board.render();
    Game.updateHpBars();
    Game.updateHud();
    requestAnimationFrame(Game.loop);
  }
};

/* =========================================================
   2D CANVAS ICON HELPERS (menus / card tray thumbnails only)
========================================================= */
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function radialBody(ctx,x,y,r,cLight,cDark,glow){
  ctx.save();
  if(glow){ ctx.shadowColor=cLight; ctx.shadowBlur=glow; }
  const g=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.15,x,y,r*1.05);
  g.addColorStop(0,cLight); g.addColorStop(1,cDark);
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawFace(ctx,x,y,r){
  ctx.save();
  ctx.fillStyle='#2a1a30';
  const eyeOff=r*0.32, eyeY=y-r*0.05, eyeR=Math.max(2,r*0.11);
  ctx.beginPath(); ctx.arc(x-eyeOff,eyeY,eyeR,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+eyeOff,eyeY,eyeR,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#2a1a30'; ctx.lineWidth=Math.max(1.5,r*0.06); ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x-r*0.16,y+r*0.18); ctx.quadraticCurveTo(x,y+r*0.38,x+r*0.16,y+r*0.18); ctx.stroke();
  ctx.restore();
}
const _spriteImgCache={};
function getSpriteImg(id){
  if(_spriteImgCache[id]) return _spriteImgCache[id];
  const img=new Image(); img.src=HERO_SPRITES[id];
  _spriteImgCache[id]=img;
  return img;
}
function drawCardIcon(canvas,def){
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(HERO_SPRITES[def.id]){
    const img=getSpriteImg(def.id);
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const aspect=HERO_SPRITE_ASPECT[def.id]||0.85;
      const h=canvas.height*0.94, w=h*aspect;
      ctx.drawImage(img,(canvas.width-w)/2,canvas.height-h,w,h);
    };
    if(img.complete && img.naturalWidth) draw(); else img.onload=draw;
    return;
  }
  radialBody(ctx,canvas.width/2,canvas.height/2+4,20,def.colors[0],def.colors[1],6);
  drawFace(ctx,canvas.width/2,canvas.height/2+6,20);
}

/* =========================================================
   UI / SCREEN MANAGER
========================================================= */
const UI = {
  current:'menu',
  go(name){
    Audio2.init(); Audio2.play('button');
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('screen-'+name).classList.add('active');
    this.current=name;
    if(name==='worldmap') this.buildWorldMap();
    if(name==='characters') this.buildCharacters();
    if(name==='shop') this.buildShop();
    if(name==='achievements') this.buildMissions();
    const cm=document.getElementById('coinDisplayMap'); if(cm) cm.textContent='💰'+Storage.data.coins;
    const cs=document.getElementById('coinDisplayShop'); if(cs) cs.textContent='💰'+Storage.data.coins;
    checkRotate();
  },
  buildWorldMap(){
    const track=document.getElementById('worldMapTrack'); track.innerHTML='';
    for(let i=1;i<=TOTAL_LEVELS;i++){
      const node=document.createElement('div');
      const locked=i>Storage.data.maxUnlockedLevel;
      const isBoss=i%5===0;
      node.className='level-node'+(locked?' locked':'')+(isBoss?' boss':'')+((Storage.data.levelStars[i])?' done':'');
      node.textContent=isBoss?'👑':i;
      if(!locked) node.onclick=()=>{ Audio2.play('button'); UI.go('battle'); Game.start(i); };
      track.appendChild(node);
    }
    setTimeout(()=>{ document.getElementById('worldMapScroll').scrollLeft=Math.max(0,(Storage.data.maxUnlockedLevel-3)*128); },50);
  },
  buildCharacters(){
    const grid=document.getElementById('charScreenGrid'); grid.innerHTML='';
    for(const id in HERO_DEFS){
      const def=HERO_DEFS[id];
      const unlocked=Storage.data.unlockedHeroes.includes(id);
      const card=document.createElement('div'); card.className='hero-card'+(unlocked?'':' locked');
      const cv=document.createElement('canvas'); cv.width=120; cv.height=80; card.appendChild(cv);
      const kills=Storage.data.heroKills[id]||0;
      const lvl=1+Math.floor(kills/10);
      const nm=document.createElement('div'); nm.className='hname'; nm.textContent=unlocked?def.name:'🔒 '+def.name;
      const lv=document.createElement('div'); lv.className='hlvl'; lv.textContent=unlocked?('Lv '+lvl+' · '+def.desc):'Unlock in Shop';
      card.appendChild(nm); card.appendChild(lv);
      grid.appendChild(card);
      const ctx=cv.getContext('2d');
      radialBody(ctx,60,44,32,def.colors[0],def.colors[1],unlocked?10:0);
      drawFace(ctx,60,46,32);
    }
  },
  buildShop(){
    const grid=document.getElementById('shopGrid'); grid.innerHTML='';
    document.getElementById('coinDisplayShop').textContent='💰'+Storage.data.coins;
    for(const id in HERO_SHOP_UNLOCK_COST){
      if(Storage.data.unlockedHeroes.includes(id)) continue;
      const def=HERO_DEFS[id]; const cost=HERO_SHOP_UNLOCK_COST[id];
      const row=document.createElement('div'); row.className='missionRow';
      row.innerHTML='<div class="mtitle">🔓 Unlock <b>'+def.name+'</b><div class="mprog">'+def.desc+'</div></div>';
      const btn=document.createElement('button'); btn.className='big-btn mint'; btn.style.padding='8px 12px'; btn.style.fontSize='12px';
      btn.textContent=cost+'💰';
      btn.onclick=()=>{
        if(Storage.data.coins>=cost){ Storage.data.coins-=cost; Storage.data.unlockedHeroes.push(id); Storage.save(); Audio2.play('collect'); UI.buildShop(); }
      };
      row.appendChild(btn); grid.appendChild(row);
    }
    for(const id in HERO_DEFS){
      if(!Storage.data.unlockedHeroes.includes(id)) continue;
      const lvl=Storage.data.heroUpgrades[id]||0;
      const cost=50+lvl*35;
      const row=document.createElement('div'); row.className='missionRow';
      row.innerHTML='<div class="mtitle">⬆ Upgrade <b>'+HERO_DEFS[id].name+'</b> (Tier '+lvl+')<div class="mprog">+12% stats per tier</div></div>';
      const btn=document.createElement('button'); btn.className='big-btn ghost'; btn.style.padding='8px 12px'; btn.style.fontSize='12px';
      btn.textContent=cost+'💰';
      btn.onclick=()=>{
        if(Storage.data.coins>=cost){ Storage.data.coins-=cost; Storage.data.heroUpgrades[id]=lvl+1; Storage.save(); Audio2.play('collect'); UI.buildShop(); }
      };
      row.appendChild(btn); grid.appendChild(row);
    }
  },
  buildMissions(){
    const list=document.getElementById('missionList'); list.innerHTML='';
    const m=Storage.data.missions;
    const defs=[
      {t:'Defeat 20 enemies', v:m.kills, g:20},
      {t:'Defeat 100 enemies', v:m.kills, g:100},
      {t:'Win 5 levels', v:m.levelsWon, g:5},
      {t:'Win 15 levels', v:m.levelsWon, g:15},
      {t:'Collect 30 energy stars', v:m.starsCollected, g:30},
      {t:'Unlock every hero', v:Storage.data.unlockedHeroes.length, g:7}
    ];
    for(const d of defs){
      const done=d.v>=d.g;
      const row=document.createElement('div'); row.className='missionRow'+(done?' done':'');
      row.innerHTML='<div><div class="mtitle">'+(done?'✅':'⬜')+' '+d.t+'</div><div class="mprog">'+Math.min(d.v,d.g)+'/'+d.g+'</div></div>';
      list.appendChild(row);
    }
  }
};

/* =========================================================
   INIT
========================================================= */
function toggleFullscreen(){
  Audio2.play('button');
  if(!document.fullscreenElement){ document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(()=>{}); }
  else { document.exitFullscreen && document.exitFullscreen(); }
}
function makeStarsBg(){
  const bg=document.getElementById('starsBg');
  for(let i=0;i<40;i++){
    const s=document.createElement('span');
    s.style.left=Util.rand(0,100)+'%'; s.style.top=Util.rand(0,100)+'%';
    s.style.animationDelay=Util.rand(0,2.4)+'s';
    bg.appendChild(s);
  }
}
function bindSettings(){
  const musicSlider=document.getElementById('musicSlider'), sfxSlider=document.getElementById('sfxSlider');
  musicSlider.value=Storage.data.settings.music; sfxSlider.value=Storage.data.settings.sfx;
  document.getElementById('qualSelect').value=Storage.data.settings.quality;
  musicSlider.oninput=()=>{ Storage.data.settings.music=+musicSlider.value; Audio2.setMusicVol(musicSlider.value/100*0.5); Storage.save(); };
  sfxSlider.oninput=()=>{ Storage.data.settings.sfx=+sfxSlider.value; Audio2.setSfxVol(sfxSlider.value/100); Storage.save(); };
  document.getElementById('qualSelect').onchange=(e)=>{ Storage.data.settings.quality=e.target.value; Storage.save(); };
  document.getElementById('langSelect').onchange=(e)=>{ Storage.data.settings.lang=e.target.value; Storage.save(); };
}
function bindCanvasInput(){
  const canvas=document.getElementById('gameCanvas');
  const handler=(e)=>{
    e.preventDefault();
    const pt=e.touches?e.touches[0]:e;
    Game.handleCanvasTap(pt.clientX,pt.clientY);
  };
  canvas.addEventListener('mousedown',handler);
  canvas.addEventListener('touchstart',handler,{passive:false});
}
function checkRotate(){
  const hint=document.getElementById('rotateHint');
  if(UI.current==='battle' && window.innerWidth<window.innerHeight && window.innerWidth<900) hint.classList.add('show');
  else hint.classList.remove('show');
}
window.addEventListener('resize',()=>{ if(Game.board) Game.board.resize(); checkRotate(); });
window.addEventListener('orientationchange',()=>{ setTimeout(()=>{ if(Game.board) Game.board.resize(); checkRotate(); },200); });
document.addEventListener('click',()=>Audio2.init(),{once:true});
document.addEventListener('touchstart',()=>Audio2.init(),{once:true});

window.onload=()=>{
  Storage.load();
  makeStarsBg();
  bindSettings();
  bindCanvasInput();
  checkRotate();
  if(typeof THREE==='undefined' || window.__threeLoadFailed){
    document.getElementById('screen-menu').insertAdjacentHTML('beforeend',
      '<p style="color:#ff8a8a;max-width:280px;text-align:center;font-size:12px;">3D engine failed to load (needs an internet connection the first time). Please check your connection and reload the page.</p>');
  }
  UI.go('menu');
};
