const DB = {
  "solo-leveling": {
    title: "Solo Leveling",
    thaiTitle: "โซโลเลเวลลิง",
    status: "อัปเดต",
    rating: "9.7",
    genre: ["แอ็กชัน", "แฟนตาซี"],
    color: "blue",
    desc: "นักล่าระดับล่างสุดที่ได้รับโอกาสเปลี่ยนชะตาชีวิต",
    episodes: [
      {
        ep: 12,
        title: "ศึกสุดท้ายของผู้ถูกเลือก",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          },
          {
            name: "Server 1",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          },
          {
            name: "Server 2",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      },
      {
        ep: 11,
        title: "เงาแห่งพลังใหม่",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  },

  "one-piece": {
    title: "One Piece",
    thaiTitle: "วันพีช",
    status: "กำลังฉาย",
    rating: "9.6",
    genre: ["ผจญภัย", "แอ็กชัน"],
    color: "cyan",
    desc: "การผจญภัยของกลุ่มโจรสลัดหมวกฟางสู่ทะเลอันยิ่งใหญ่",
    episodes: [
      {
        ep: 1085,
        title: "เส้นทางสู่เกาะสุดท้าย",
       servers: [
  {
    name: "YouTube",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
]
        ep: 1084,
        title: "คำสัญญาแห่งทะเล",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  },

  "demon-slayer": {
    title: "Demon Slayer",
    thaiTitle: "ดาบพิฆาตอสูร",
    status: "HOT",
    rating: "9.5",
    genre: ["แอ็กชัน", "ดราม่า"],
    color: "red",
    desc: "การต่อสู้ของนักล่าอสูรกับชะตากรรมอันโหดร้าย",
    episodes: [
      {
        ep: 11,
        title: "เปลวเพลิงแห่งการต่อสู้",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  },

  "jujutsu": {
    title: "Jujutsu Kaisen",
    thaiTitle: "มหาเวทย์ผนึกมาร",
    status: "HOT",
    rating: "9.4",
    genre: ["แอ็กชัน", "เหนือธรรมชาติ"],
    color: "purple",
    desc: "โลกของคำสาปและนักไสยเวทที่ต้องต่อกรกับความมืด",
    episodes: [
      {
        ep: 23,
        title: "คำสาปที่ไม่สิ้นสุด",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  },

  "re-zero": {
    title: "Re:Zero",
    thaiTitle: "รีเซโร่",
    status: "อัปเดต",
    rating: "9.2",
    genre: ["แฟนตาซี", "ดราม่า"],
    color: "pink",
    desc: "การเริ่มต้นใหม่ในโลกแฟนตาซีที่เต็มไปด้วยปริศนา",
    episodes: [
      {
        ep: 25,
        title: "วงล้อแห่งโชคชะตา",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  },

  "slime": {
    title: "That Time I Got Reincarnated as a Slime",
    thaiTitle: "เกิดใหม่ทั้งทีก็เป็นสไลม์ไปแล้ว",
    status: "ใหม่",
    rating: "9.3",
    genre: ["ต่างโลก", "แฟนตาซี"],
    color: "cyan",
    desc: "เรื่องราวต่างโลกของสไลม์ที่สร้างเมืองของตัวเอง",
    episodes: [
      {
        ep: 24,
        title: "เมืองใหม่และสัญญาใหม่",
        servers: [
          {
            name: "YouTube",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          }
        ]
      }
    ]
  }
};

const CATEGORIES = [
  "แอ็กชัน",
  "ต่างโลก",
  "แฟนตาซี",
  "ผจญภัย",
  "โรแมนติก",
  "คอมเมดี้",
  "ดราม่า",
  "ทุกหมวดหมู่"
];

const SCHEDULE = [
  {
    id: "slime",
    day: "จันทร์",
    time: "20:00",
    title: "เกิดใหม่ทั้งทีก็เป็นสไลม์ไปแล้ว",
    ep: "24"
  },
  {
    id: "demon-slayer",
    day: "อังคาร",
    time: "19:30",
    title: "ดาบพิฆาตอสูร",
    ep: "11"
  },
  {
    id: "jujutsu",
    day: "พุธ",
    time: "20:30",
    title: "มหาเวทย์ผนึกมาร",
    ep: "23"
  },
  {
    id: "solo-leveling",
    day: "ศุกร์",
    time: "20:00",
    title: "Solo Leveling",
    ep: "12"
  },
  {
    id: "re-zero",
    day: "อาทิตย์",
    time: "19:30",
    title: "Re:Zero",
    ep: "25"
  }
];
