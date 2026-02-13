/* ===== FIREBASE ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfRFNVsQ-6-9DyQgCIML4lGuY_-YCoDCs",
  authDomain: "valentine-c7202.firebaseapp.com",
  projectId: "valentine-c7202",
  storageBucket: "valentine-c7202.firebasestorage.app",
  messagingSenderId: "97199788414",
  appId: "1:97199788414:web:d4a9a8ba08ac7692eb632f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== ELEMENTS ===== */
const startScreen = document.getElementById("startScreen");
const askScreen   = document.getElementById("askScreen");
const yesScreen   = document.getElementById("yesScreen");
const noEndScreen = document.getElementById("noEndScreen");

const startBtn = document.getElementById("startBtn");
const loveMsg  = document.getElementById("loveMsg");
const msgPreview = document.getElementById("msgPreview");

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const arena  = document.getElementById("arena");
const img    = document.getElementById("cuteImg");
const hint   = document.getElementById("hint");
const bgm    = document.getElementById("bgm");

const titleText = document.getElementById("titleText");
const yesText   = document.getElementById("yesText");

/* ===== NAME ===== */
function qp(k){ return new URLSearchParams(location.search).get(k); }
function getName(){
  const raw = (qp("name")||"").trim();
  return raw.length ? raw : "Cutie";
}
const personName = getName();

titleText.textContent =
  `Надтай хамт ирээдүйгээ бүтээх үү, ${personName}? 💕`;

/* ===== MUSIC ===== */
let musicStarted=false;
async function startMusic(){
  if(musicStarted) return;
  try{
    await bgm.play();
    bgm.volume=0.3;
    musicStarted=true;
  }catch{}
}

loveMsg.addEventListener("focus", startMusic);

/* ===== START BUTTON ===== */
startBtn.addEventListener("click", ()=>{
  startMusic();
  startScreen.classList.add("hidden");
  askScreen.classList.remove("hidden");

  msgPreview.textContent =
    loveMsg.value.trim() ? `“${loveMsg.value}”` : "";
});

/* ===== NO LOGIC ===== */
let noCount=0;
let yesScale=1;

function moveNo(step){
  const positions=[
    {left:40, top:20},
    {left:300, top:20},
    {left:60, top:75},
    {left:300, top:80}
  ];
  const p=positions[Math.min(step-2,3)];
  noBtn.style.left=p.left+"px";
  noBtn.style.top=p.top+"px";
  noBtn.style.transform="translate(0,0)";
}

noBtn.addEventListener("click", async()=>{
  noCount++;

  const images=["img.jpg","img2.png","img3.png","img4.png","img5.png"];
  img.src=images[noCount % images.length];

  yesScale=Math.min(yesScale*1.18,6);
  yesBtn.style.transform=
    `translate(-120%,-50%) scale(${yesScale})`;

  const texts=[
    "No",
    "Чи итгэлтэй юу? 😳",
    "Дахиад бод доо 🥺",
    "Сүүлийн боломж 😭",
    "За ойлголоо 💔"
  ];
  noBtn.textContent=texts[Math.min(noCount,4)];

  if(noCount===2||noCount===3||noCount===4){
    moveNo(noCount);
  }

  await setDoc(doc(db,"clicks","default"),{
    noCount: increment(1),
    updatedAt: serverTimestamp()
  },{merge:true});

  if(noCount>=5){
    askScreen.classList.add("hidden");
    noEndScreen.classList.remove("hidden");
  }
});

/* ===== YES ===== */
yesBtn.addEventListener("click", ()=>{
  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  yesText.textContent=
    `${personName}, чи намайг хамгийн аз жаргалтай хүн болголоо! 💗`;

  confetti({particleCount:170,spread:85,origin:{y:0.6}});
});