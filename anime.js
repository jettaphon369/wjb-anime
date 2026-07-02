const params = new URLSearchParams(location.search);
const id = params.get("id") || "solo-leveling";
const anime = DB[id];

const detailHero = document.getElementById("detailHero");
const episodeList = document.getElementById("episodeList");
const episodeCount = document.getElementById("episodeCount");

if (!anime) {
  document.body.innerHTML = "<main class='detail-page'><h1>ไม่พบอนิเมะ</h1></main>";
} else {
  episodeCount.textContent = `${anime.episodes.length} ตอน`;

  detailHero.innerHTML = `
    <div class="detail-copy">
      <span class="badge">${anime.status}</span>
      <h1>${anime.title}</h1>
      <h2>${anime.thaiTitle}</h2>
      <p>${anime.desc}</p>
      <div class="detail-meta">
        <span>★ ${anime.rating}</span>
        ${anime.genre.map(g => `<span>${g}</span>`).join("")}
      </div>
      <button class="primary-btn" onclick="location.href='./watch.html?id=${id}&ep=${anime.episodes[0].ep}'">▶ ดูตอนล่าสุด</button>
    </div>
    <div class="detail-art poster-${anime.color}">
      <div class="glow-orb"></div>
    </div>
  `;

  episodeList.innerHTML = anime.episodes.map(ep => `
    <button onclick="location.href='./watch.html?id=${id}&ep=${ep.ep}'">
      <b>EP ${ep.ep}</b>
      <span>${ep.title}</span>
    </button>
  `).join("");
}
