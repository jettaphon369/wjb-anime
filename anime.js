const id = new URLSearchParams(location.search).get("id") || "solo-leveling";
const anime = DB[id];

const hero = document.getElementById("hero");
const episodes = document.getElementById("episodes");

if (!anime) {
  hero.innerHTML = "<h1>ไม่พบข้อมูล</h1>";
} else {
  hero.innerHTML = `
    <h1>${anime.title}</h1>
    <p>${anime.thaiTitle}</p>
    <p>${anime.desc}</p>
  `;

  episodes.innerHTML = anime.episodes.map(ep => `
    <button onclick="location.href='watch.html?id=${id}&ep=${ep.ep}'">
      EP ${ep.ep} - ${ep.title}
    </button>
  `).join("");
}
