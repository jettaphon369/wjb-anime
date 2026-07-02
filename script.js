const list = document.getElementById("list");

data.forEach(a=>{
 const div = document.createElement("div");
 div.className="card";
 div.innerHTML = `
  <h3>${a.title}</h3>
  <a href="anime.html?id=${a.id}">ดู</a>
 `;
 list.appendChild(div);
});
