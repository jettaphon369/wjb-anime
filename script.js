const params = new URLSearchParams(window.location.search);
const animeId = params.get("anime") || "one-piece";

let currentEP = 1;
let currentServer = "youtube";

const anime = animeData[animeId];

document.getElementById("title").innerText = anime.title;

// ---------- CREATE EP BUTTONS ----------
const epList = document.getElementById("ep-list");

Object.keys(anime.eps).forEach(ep => {
  const btn = document.createElement("button");
  btn.innerText = "EP " + ep;

  btn.onclick = () => {
    currentEP = ep;
    loadServers();
    loadVideo();
  };

  epList.appendChild(btn);
});

// ---------- LOAD SERVER BUTTONS ----------
function loadServers() {
  const serverList = document.getElementById("server-list");
  serverList.innerHTML = "";

  const servers = anime.eps[currentEP].servers;

  Object.keys(servers).forEach(server => {
    const btn = document.createElement("button");
    btn.innerText = server;

    btn.onclick = () => {
      currentServer = server;
      loadVideo();
    };

    serverList.appendChild(btn);
  });
}

// ---------- LOAD VIDEO ----------
function loadVideo() {
  const url = anime.eps[currentEP].servers[currentServer];
  document.getElementById("videoPlayer").src = url;
}

// init
loadServers();
loadVideo();
