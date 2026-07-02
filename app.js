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

    div.onclick = () => {
      alert("ไปหน้า anime detail: " + a.title);
    };

    grid.appendChild(div);
  });
}

search.oninput = (e) => {
  const v = e.target.value.toLowerCase();
  render(data.filter(a => a.title.toLowerCase().includes(v)));
};

render(data);
