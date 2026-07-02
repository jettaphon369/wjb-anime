const search = document.getElementById("search");
const mainList = document.getElementById("mainList");
const latest = document.getElementById("latest");
const ranking = document.getElementById("ranking");
const schedule = document.getElementById("schedule");
const categories = document.getElementById("categories");
const mainTitle = document.getElementById("mainTitle");

function animeList() {
  return Object.entries(DB).map(([id, item]) => ({
    id,
    ...item
  }));
}

function favorites() {
  return JSON.parse(localStorage.getItem("wjb_favorites") || "[]");
}

function saveFavorites(list) {
  localStorage.setItem("wjb_favorites", JSON.stringify(list));
}

function toggleFavorite(id) {
  const list = favorites();

  const next = list.includes(id)
    ? list.filter(x => x !== id)
    : [...list, id];

  saveFavorites(next);
  renderRows();
}

function posterClass(item) {
  return `poster poster-${item.color || "blue"}`;
}

function openAnime(id) {
  location.href = `./anime.html?id=${id}`;
}

function openWatch(id) {
  const ep = DB[id]?.episodes?.[0]?.ep || 1;
  location.href = `./watch.html?id=${id}&ep=${ep}`;
}

function openSocial(type) {
  alert("ลิงก์ " + type + " ยังไม่ได้ตั้งค่า");
}

function card(item) {
  const lastEp = item.episodes[0]?.ep || 1;
  const isFav = favorites().includes(item.id);

  return `
    <article class="anime-card">
      <div class="${posterClass(item)}" onclick="openAnime('${item.id}')">
        <span class="hot">${item.status}</span>
        <span class="ep">EP.${lastEp}</span>
      </div>

      <h3 onclick="openAnime('${item.id}')">
        ${item.title}
      </h3>

      <div class="card-meta">
        <span>${item.thaiTitle}</span>
        <strong>★ ${item.rating}</strong>
      </div>

      <div class="card-actions">
        <button onclick="openWatch('${item.id}')">▶ ดู</button>
        <button onclick="toggleFavorite('${item.id}')">
          ${isFav ? "♥" : "♡"}
        </button>
      </div>
    </article>
  `;
}

function renderRows(list = animeList(), title = "🔥 อนิเมะมาแรง") {
  mainTitle.textContent = title;

  mainList.innerHTML = list.map(card).join("");

  latest.innerHTML = animeList()
    .slice()
    .reverse()
    .map(card)
    .join("");

  ranking.innerHTML = animeList()
    .sort((a, b) => Number(b.rating) - Number(a.rating))
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
    <div class="schedule-item" onclick="openWatch('${s.id}')">
      <div>
        <b>${s.day}</b>
        <small>${s.time}</small>
      </div>
      <p>
        ${s.title}<br>
        <span>EP.${s.ep}</span>
      </p>
    </div>
  `).join("");

  categories.innerHTML = CATEGORIES.map(c => `
    <button onclick="filterCategory('${c}')">
      ${c}
    </button>
  `).join("");
}

function setFilter(type) {
  document.querySelectorAll(".nav-item, .top-menu a").forEach(el => {
    el.classList.remove("active");
  });

  document.querySelectorAll(`[data-filter="${type}"]`).forEach(el => {
    el.classList.add("active");
  });

  const all = animeList();

  if (type === "all") {
    renderRows(all, "🔥 อนิเมะมาแรง");
  }

  if (type === "latest") {
    renderRows(all.slice().reverse(), "🎬 ตอนล่าสุด");
  }

  if (type === "trending") {
    renderRows(
      all.filter(a => ["HOT", "อัปเดต", "กำลังฉาย"].includes(a.status)),
      "🔥 อนิเมะมาแรง"
    );
  }

  if (type === "popular") {
    renderRows(
      all.sort((a, b) => Number(b.rating) - Number(a.rating)),
      "⭐ อนิเมะยอดนิยม"
    );
  }

  if (type === "az") {
    renderRows(
      all.sort((a, b) => a.title.localeCompare(b.title)),
      "🔎 A-Z ค้นหา"
    );
  }

  if (type === "favorites") {
    const fav = favorites();

    renderRows(
      all.filter(a => fav.includes(a.id)),
      "♡ รายการโปรด"
    );
  }

  if (type === "schedule") {
    const scheduleItems = SCHEDULE
      .map(s => ({
        id: s.id,
        ...DB[s.id]
      }))
      .filter(Boolean);

    renderRows(scheduleItems, "📅 ตารางฉาย");
  }
}

function filterCategory(cat) {
  if (cat === "ทุกหมวดหมู่") {
    setFilter("all");
    return;
  }

  renderRows(
    animeList().filter(a => a.genre.includes(cat)),
    "🧩 " + cat
  );
}

document.querySelectorAll(".nav-item, .top-menu a").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    setFilter(el.dataset.filter);
  });
});

search.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();

  const filtered = animeList().filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.thaiTitle.toLowerCase().includes(q) ||
    item.genre.join(" ").toLowerCase().includes(q)
  );

  renderRows(
    filtered,
    q ? `ผลการค้นหา: ${q}` : "🔥 อนิเมะมาแรง"
  );
});

renderRows();
