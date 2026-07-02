const grid = document.getElementById("grid");
const search = document.getElementById("search");

function render(list) {
  grid.innerHTML = "";

  list.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${a.img}">
      <h3>${a.title}</h3>
    `;

    div.onclick = () => openAnime(a);

    grid.appendChild(div);
  });
}

function openAnime(a) {
  let html = `<h2>${a.title}</h2>`;

  a.eps.forEach(ep => {
    html += `<h4>EP ${ep.ep}</h4>`;

    ep.servers.forEach(s => {
      html += `<button onclick="window.open('${s.url}')">
        ${s.name}
      </button> `;
    });
  });

  grid.innerHTML = html;
}

search.oninput = (e) => {
  const v = e.target.value.toLowerCase();
  render(data.filter(a => a.title.toLowerCase().includes(v)));
};

render(data);
