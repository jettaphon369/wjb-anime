const search = document.getElementById("search");
const trending = document.getElementById("trending");
const latest = document.getElementById("latest");
const ranking = document.getElementById("ranking");
const schedule = document.getElementById("schedule");
const categories = document.getElementById("categories");

function animeList() {
  return Object.entries(DB).map(([id, item]) => ({ id, ...item }));
}

function posterClass(item) {
  return `poster poster-${item.color || "blue"}`;
}

function openAnime(id) {
  location.href = `./anime.html?id=${id}`;
}

function card(item) {
  const lastEp = item.episodes[0]?.ep || 1;
  return `
    <article class="anime-card" onclick="openAnime('${item.id}')">
      <div class="${posterClass(item)}">
        <span class="hot">${item.status}</span>
        <span class="ep">EP.${lastEp}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="card-meta">
        <span>${item.thaiTitle}</span>
        <strong>★ ${item.rating}</strong>
      </div>
    </article>
  `;
}

function renderRows(list = animeList()) {
  trending.innerHTML = list.map(card).join("");
  latest.innerHTML = list.slice().reverse().map(card).join("");

  ranking.innerHTML = list
    .sort((a,b) => Number(b.rating) - Number(a.rating))
    .map((item, index) => `
      <div class="rank-item" onclick="openAnime('${item.id}')">
        <b>${index + 1}</b>
        <div class="${posterClass(item)} mini-poster"></div>
        <span>${item.title}</span>
        <em>${item.rating}</em>
      </div>
    `)
    .join("");

  schedule.innerHTML = SCHEDULE.map(s => `
    <div class="schedule-item">
      <div><b>${s.day}</b><small>${s.time}</small></div>
      <p>${s.title}<br><span>EP.${s.ep}</span></p>
    </div>
  `).join("");

  categories.innerHTML = CATEGORIES.map(c => `<button>${c}</button>`).join("");
}

search.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = animeList().filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.thaiTitle.toLowerCase().includes(q) ||
    item.genre.join(" ").toLowerCase().includes(q)
  );
  renderRows(filtered);
});

renderRows();
