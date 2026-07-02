const LIMIT=500;

let files=JSON.parse(localStorage.getItem("files")||"[]");
let used=Number(localStorage.getItem("used")||0);

render();

function upload(){
const f=document.getElementById("fileInput").files[0];
if(!f)return;

const size=f.size/1024/1024;

if(used+size>LIMIT){
alert("พื้นที่เต็ม");
return;
}

const type=f.type.startsWith("image")?"image":"video";

const r=new FileReader();
r.onload=()=>{

files.unshift({name:f.name,type,size:size.toFixed(2),data:r.result});
used+=size;

save();
render();
};

r.readAsDataURL(f);
}

function render(){

document.getElementById("imgCount").innerText=
files.filter(x=>x.type==="image").length;

document.getElementById("videoCount").innerText=
files.filter(x=>x.type==="video").length;

document.getElementById("totalCount").innerText=files.length;

document.getElementById("storageInfo").innerText=used.toFixed(2)+" MB";

document.getElementById("barFill").style.width=(used/LIMIT*100)+"%";

document.getElementById("recent").innerHTML=
files.slice(0,5).map(f=>`
<div class="item">
<b>${f.name}</b><br>
<small>${f.type} ${f.size}MB</small>
</div>
`).join("");
}

function save(){
localStorage.setItem("files",JSON.stringify(files));
localStorage.setItem("used",used);
}
