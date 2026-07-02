const params = new URLSearchParams(location.search);
const id = params.get("id");
let epNumber = Number(params.get("ep"));

const anime = DB[id];

const title = document.getElementById("title");
const player = document.getElementById("player");
const servers = document.getElementById("servers");
const episodes = document.getElementById("episodes");

function getEmbed(server) {
  if (server.type === "youtube") {
    const id = server.url.split("v=")[1];
    return `https://www.youtube.com/embed/${id}`;
  }

  return server.url;
}

if (!anime) {
  title.innerHTML = "ไม่พบอนิเมะ";
} else {
  if (!epNumber) epNumber = anime.episodes[0].ep;

  render();
}

function currentEp() {
  return anime.episodes.find(e => e.ep === epNumber);
}

function render() {
  const ep = currentEp();

  title.innerHTML = `${anime.title} - EP ${ep.ep}`;

  player.innerHTML = `
    <iframe width="100%" height="400" src="${getEmbed(ep.servers[0])}" frameborder="0" allowfullscreen></iframe>
  `;

  servers.innerHTML = ep.servers.map(s => `
    <button onclick='playServer(${JSON.stringify(s)})'>
      ${s.name}
    </button>
  `).join("");

  episodes.innerHTML = anime.episodes.map(e => `
    <button onclick="changeEp(${e.ep})">
      EP ${e.ep}
    </button>
  `).join("");
}

function playServer(server) {
  player.innerHTML = `
    <iframe width="100%" height="400" src="${getEmbed(server)}" frameborder="0" allowfullscreen></iframe>
  `;
}

function changeEp(ep) {
  location.href = `watch.html?id=${id}&ep=${ep}`;
}
