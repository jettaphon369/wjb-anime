const params = new URLSearchParams(location.search);
const id = params.get('id');

const anime = DB[id];

let ep = 1;
let server = 'youtube';

document.getElementById('title').innerText = anime.title;

const eps = document.getElementById('eps');
const servers = document.getElementById('servers');
const player = document.getElementById('player');

function loadEP(){
  eps.innerHTML = '';

  Object.keys(anime.eps).forEach(e=>{
    const b = document.createElement('button');
    b.innerText = 'EP ' + e;

    b.onclick = ()=>{
      ep = e;
      loadServers();
      play();
    };

    eps.appendChild(b);
  });
}

function loadServers(){
  servers.innerHTML = '';

  Object.keys(anime.eps[ep]).forEach(s=>{
    const b = document.createElement('button');
    b.innerText = s;

    b.onclick = ()=>{
      server = s;
      play();
    };

    servers.appendChild(b);
  });
}

function play(){
  player.src = anime.eps[ep][server];
}

loadEP();
loadServers();
play();
