const params = new URLSearchParams(location.search);
const id = params.get("id") || "solo-leveling";
let epNumber = Number(params.get("ep")) || null;

const anime = DB[id];
const player = document.getElementById("player");
const watchTitle = document.getElementById("watchTitle");
const watchMeta = document.getElementById("watchMeta");
const serverList = document.getElementById("serverList");
const episodeList = document.getElementById("episodeList");
const backBtn = document.getElementById("backBtn");

backBtn.onclick = () => location.href = `./anime.html?id=${id}`;

if (!anime) {
  document.body.innerHTML = "<main class='watch-page'><h1>ไม่พบอนิเมะ</h1></main>";
} else {
  if (!epNumber) epNumber = anime.episodes[0].ep;
  renderWatch();
}

function currentEpisode() {
  return anime.episodes.find(e => Number(e.ep) === Number(epNumber)) || anime.episodes[0];
}

function renderWatch() {
  const ep = currentEpisode();
  watchTitle.textContent = `${anime.title} - EP ${ep.ep}`;
  watchMeta.textContent = ep.title;

  episodeList.innerHTML = anime.episodes.map(item => `
    <button class="${Number(item.ep) === Number(ep.ep) ? "active" : ""}" onclick="changeEp(${item.ep})">
      <b>EP ${item.ep}</b>
      <span>${item.title}</span>
    </button>
  `).join("");

  serverList.innerHTML = ep.servers.map((server, index) => `
    <button class="${index === 0 ? "active" : ""}" onclick="playServer('${encodeURIComponent(server.url)}', this)">
      ${server.name}
    </button>
  `).join("");

  play(ep.servers[0].url);
}

function changeEp(nextEp) {
  epNumber = nextEp;
  const url = new URL(location.href);
  url.searchParams.set("ep", nextEp);
  history.replaceState(null, "", url);
  renderWatch();
}

function playServer(encodedUrl, btn) {
  document.querySelectorAll(".server-list button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  play(decodeURIComponent(encodedUrl));
}

function play(url) {
  player.src = url;
}
