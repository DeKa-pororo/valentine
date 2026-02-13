import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================== FIREBASE ================== */

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

/* ================== ELEMENTS ================== */

const startScreen = document.getElementById("startScreen");
const askScreen   = document.getElementById("askScreen");
const yesScreen   = document.getElementById("yesScreen");
const noEndScreen = document.getElementById("noEndScreen");

const startBtn  = document.getElementById("startBtn");
const loveMsg   = document.getElementById("loveMsg");
const charCount = document.getElementById("charCount");
const msgPreview= document.getElementById("msgPreview");

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const arena  = document.getElementById("arena");
const img    = document.getElementById("cuteImg");
const hint   = document.getElementById("hint");
const bgm    = document.getElementById("bgm");

/* ================== STATE ================== */

let noCountLocal = 0;
let yesScale = 1;

/* ================== MUSIC (textarea дээр дармагц) ================== */

let musicStarted = false;

async function startMusicOnce(){
  if(musicStarted) return;
  try{
    bgm.volume = 0.0;
    await bgm.play();
    musicStarted = true;

    let v = 0;
    const fade = setInterval(()=>{
      v += 0.03;
      bgm.volume = Math.min(v,0.35);
      if(v>=0.35) clearInterval(fade);
    },120);
  }catch(e){}
}

loveMsg?.addEventListener("pointerdown", startMusicOnce);
loveMsg?.addEventListener("focus", startMusicOnce);

/* ================== START BUTTON ================== */

startBtn?.addEventListener("click", async ()=>{
  await startMusicOnce();
  startScreen.classList.add("hidden");
  askScreen.classList.remove("hidden");

  const msg = loveMsg.value.trim();
  if(msgPreview) msgPreview.textContent = msg ? `“${msg}”` : "";
});

/* ================== CHARACTER COUNT ================== */

loveMsg?.addEventListener("input", ()=>{
  if(charCount){
    charCount.textContent = `${loveMsg.value.length} / 420`;
  }
});

/* ================== FIRESTORE ================== */

async function trackNo(){
  try{
    await setDoc(doc(db,"clicks","default"),{
      noCount: increment(1),
      lastNoAt: serverTimestamp()
    },{merge:true});
  }catch(e){}
}

/* ================== NO BUTTON POSITIONS ================== */

function moveNoButtonStep(step){

  const positions = [
    { left: 40,  top: 20 },
    { left: 320, top: 25 },
    { left: 60,  top: 75 },
    { left: 300, top: 80 }
  ];

  const p = positions[Math.min(step-2, positions.length-1)];

  noBtn.style.left = p.left + "px";
  noBtn.style.top  = p.top + "px";
  noBtn.style.transform = "translate(0,0)";
}

/* ================== NO CLICK ================== */

noBtn?.addEventListener("click", async ()=>{

  noCountLocal++;

  // зураг солих
  const images = ["img.jpg","img2.png","img3.png","img4.png","img5.png"];
  img.src = images[noCountLocal % images.length];

  // YES томрох
  yesScale = Math.min(yesScale * 1.18, 6);
  yesBtn.style.transform =
    `translate(-120%, -50%) scale(${yesScale})`;

  // текст солих
  const noTexts = [
    "No",
    "Чи бүрэн итгэлтэй байна уу? 😳",
    "Дахиад бод доо… 🥺",
    "Сүүлийн боломж шүү… 😭",
    "За үнэхээр No гэж үү? 💔"
  ];

  noBtn.textContent =
    noTexts[Math.min(noCountLocal, noTexts.length-1)];

  // 2,3,4 дээр байр солих
  if(noCountLocal === 2 ||
     noCountLocal === 3 ||
     noCountLocal === 4){
    moveNoButtonStep(noCountLocal);
  }

  await trackNo();

  // 5 дахь дээр дуусгах
  if(noCountLocal >= 5){
    askScreen.classList.add("hidden");
    noEndScreen.classList.remove("hidden");
  }

});

/* ================== YES CLICK ================== */

yesBtn?.addEventListener("click", ()=>{
  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  confetti({
    particleCount:170,
    spread:85,
    origin:{y:0.6}
  });
});