let DB = JSON.parse(localStorage.getItem("db")||'{"videos":[]}');

function upload(){
  const file = document.getElementById("file").files[0];
  const title = document.getElementById("title").value;

  if(!file) return;

  const url = URL.createObjectURL(file);

  DB.videos.push({title,url});

  localStorage.setItem("db", JSON.stringify(DB));

  document.getElementById("status").innerText = "uploaded (local demo)";
}

function render(){
  const list = document.getElementById("list");
  if(list){
    list.innerHTML = DB.videos.map((v,i)=>
      `<div class="card" onclick="openVideo(${i})">
        🎥 ${v.title}
      </div>`
    ).join("");
  }
}

function openVideo(i){
  localStorage.setItem("current", i);
  window.location.href = "player.html";
}

function play(){
  const i = localStorage.getItem("current");
  const v = DB.videos[i];
  if(v){
    document.getElementById("player").src = v.url;
  }
}

render();
play();
