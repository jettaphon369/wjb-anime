const grid = document.getElementById('grid');
const search = document.getElementById('search');

function render(db){
  grid.innerHTML = '';

  Object.keys(db).forEach(id=>{
    const a = db[id];

    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<div class='thumb'></div><h3>${a.title}</h3>`;

    div.onclick = ()=>{
      location.href = 'watch.html?id=' + id;
    };

    grid.appendChild(div);
  });
}

render(DB);

search.oninput = (e)=>{
  const v = e.target.value.toLowerCase();

  const filtered = Object.fromEntries(
    Object.entries(DB).filter(([k,a]) =>
      a.title.toLowerCase().includes(v)
    )
  );

  render(filtered);
};
