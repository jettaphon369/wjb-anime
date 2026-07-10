# WJB 3D RPG

ต้นแบบเกมเว็บ 3D สำหรับ GitHub Pages รองรับมือถือและคอมพิวเตอร์

## เปิดใช้งานบน GitHub Pages

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไปที่รากของ Repository `wjb-anime`
2. ไปที่ **Settings → Pages**
3. ใน **Build and deployment** เลือก **Deploy from a branch**
4. เลือก Branch `main` และ Folder `/ (root)`
5. กด **Save**

เว็บไซต์จะเผยแพร่ที่:

`https://jettaphon369.github.io/wjb-anime/`

## ไฟล์สำคัญ

- `index.html` หน้าเกม
- `style.css` รูปแบบหน้าจอและมือถือ
- `main.js` ระบบตัวละคร 3D เลือกตัวละครและต่อสู้
- `.nojekyll` ป้องกัน GitHub Pages ประมวลผลไฟล์ผ่าน Jekyll

## หมายเหตุ

เวอร์ชันนี้ใช้โมเดล 3D รูปทรงที่สร้างด้วย Three.js เพื่อให้เล่นได้ทันที เมื่อมีไฟล์ตัวละครจริง `.glb` สามารถเปลี่ยนระบบสร้างตัวละครใน `main.js` เป็น `GLTFLoader` ได้
