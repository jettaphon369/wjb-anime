const LIMIT_MB = 500;
let storageUsed = Number(localStorage.getItem("used")) || 0;
let files = JSON.parse(localStorage.getItem("files") || "[]");

updateUI();

function uploadFile(){
  const input = document.getElementById("fileInput");
  const file = input.files[0];
  if(!file) return;

  const sizeMB = file.size/(1024*1024);

  if(storageUsed + sizeMB > LIMIT_MB){
    showUpgrade();
    return;
  }

  storageUsed += sizeMB;

  const reader = new FileReader();
  reader.onload = () => {
    files.push({
      name:file.name,
      data:reader.result,
      size:sizeMB.toFixed(2)
    });
    save();
    updateUI();
  };

  reader.readAsDataURL(file);
}

function updateUI(){
  document.getElementById("storageInfo").innerText =
  `ใช้ไป ${storageUsed.toFixed(2)} / ${LIMIT_MB} MB`;

  document.getElementById("storageBar").style.width =
  (storageUsed/LIMIT_MB)*100 + "%";

  document.getElementById("gallery").innerHTML =
  files.map(f=>`
    <div class="item">
      <p>${f.name}</p>
      <small>${f.size} MB</small>
    </div>
  `).join("");
}

function save(){
  localStorage.setItem("used",storageUsed);
  localStorage.setItem("files",JSON.stringify(files));
}

function showUpgrade(){
  document.getElementById("upgradeModal").style.display="flex";
}

function closeModal(){
  document.getElementById("upgradeModal").style.display="none";
}
