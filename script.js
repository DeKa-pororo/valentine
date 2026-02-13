/* ===== FIREBASE ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

/* ===== HELPERS ===== */
function qp(k){ return new URLSearchParams(location.search).get(k); }
const sid = (qp("sid") || "default").trim();

function getName(){
  const raw = (qp("name") || "").trim();
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

/* ===== ELEMENTS ===== */
const startScreen = document.getElementById("startScreen");
const askScreen   = document.getElementById("askScreen");
const yesScreen   = document.getElementById("yesScreen");
const noEndScreen = document.getElementById("noEndScreen");

const startBtn   = document.getElementById("startBtn");
const loveMsg    = document.getElementById("loveMsg");
const msgPreview = document.getElementById("msgPreview");
const charCount  = document.getElementById("charCount");

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const arena  = document.getElementById("arena");
const img    = document.getElementById("cuteImg");
const hint   = document.getElementById("hint");
const bgm    = document.getElementById("bgm");

const titleText = document.getElementById("titleText");
const yesText   = document.getElementById("yesText");

/* ===== UI: NAME TEXT ===== */
titleText.textContent = `Надтай хамт ирээдүйгээ бүтээж, олон сайхан дурсамж бүтээх үү, ${personName}? 💕`;

/* ===== MUSIC: textarea дээр дармагц асна ===== */
let musicStarted = false;

async function startMusicOnce(){
  if(musicStarted) return;
  try{
    // iOS дээр play() user gesture шаарддаг => focus/click дээр асна
    bgm.volume = 0.3;
    await bgm.play();
    musicStarted = true;
  }catch(e){
    // зарим үед дараагийн gesture дээр асна
    musicStarted = false;
  }
}

// textarea focus/click/typing дээр хөгжим асаах
["focus","click","touchstart","input"].forEach(ev=>{
  loveMsg.addEventListener(ev, startMusicOnce, { passive: true });
});

/* ===== LIVE char counter ===== */
function updateCount(){
  if(!charCount) return;
  const len = (loveMsg.value || "").length;
  charCount.textContent = `${len} / 420`;
}
loveMsg.addEventListener("input", updateCount);
updateCount();

/* ===== FIRESTORE: save message / start ===== */
async function saveMessageIfAny(){
  const message = (loveMsg.value || "").trim();
  await setDoc(doc(db, "clicks", sid), {
    sid,
    name: personName,
    loveMsg: message || "",
    loveMsgUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ===== START BUTTON ===== */
startBtn.addEventListener("click", async () => {
  await startMusicOnce();

  // message preview
  const message = (loveMsg.value || "").trim();
  msgPreview.textContent = message ? `“${message}”` : "";

  // save message + startedAt
  try{
    await setDoc(doc(db, "clicks", sid), {
      sid,
      name: personName,
      loveMsg: message || "",
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }catch(e){
    console.log("save start/message failed:", e);
  }

  startScreen.classList.add("hidden");
  askScreen.classList.remove("hidden");
});

/* ===== NO LOGIC ===== */
let noCountLocal = 0;
let yesScale = 1;

const images = ["img.jpg","img2.png","img3.png","img4.png","img5.png"];

const noTexts = [
  "No",
  "Чи бүрэн итгэлтэй байна уу?? 😳",
  "Дахиад бод доо 🥺",
  "Сүүлийн боломж шүү 😭",
  "За ойлголоо 💔"
];

// 2,3,4 дээр “өөр газар” байрлуулах (arena дотор absolute)
function moveNoByStep(step){
  // arena хэмжээ: ~560px хүрэхгүй, мобайл дээр багасна
  // тиймээс px биш, % хэрэглэвэл найдвартай
  const positions = [
    { left: "8%",  top: "12%" },  // step 2
    { left: "70%", top: "12%" },  // step 3
    { left: "22%", top: "68%" }   // step 4
  ];
  const idx = clamp(step - 2, 0, positions.length - 1);
  const p = positions[idx];

  noBtn.style.left = p.left;
  noBtn.style.top  = p.top;
  noBtn.style.transform = "translate(0,0)";
}

async function trackNo(){
  await setDoc(doc(db, "clicks", sid), {
    sid,
    name: personName,
    choice: "no",
    lastNoAt: serverTimestamp(),
    noCount: increment(1),
    loveMsg: (loveMsg.value || "").trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

noBtn.addEventListener("click", async () => {
  noCountLocal++;

  // image rotate
  if(img) img.src = images[noCountLocal % images.length];

  // yes grows
  yesScale = clamp(yesScale * 1.18, 1, 6);
  yesBtn.style.transform = `translate(-120%,-50%) scale(${yesScale})`;

  // no text changes every click
  noBtn.textContent = noTexts[clamp(noCountLocal, 0, 4)];

  // 2,3,4 дээр байрлал өөрчилнө (hover escape байхгүй)
  if(noCountLocal === 2 || noCountLocal === 3 || noCountLocal === 4){
    moveNoByStep(noCountLocal);
  }

  if(hint){
    hint.textContent = (noCountLocal >= 4) ? "😶‍🌫️ ..." : "";
  }

  // save NO count + message
  try{
    await trackNo();
  }catch(e){
    console.log("trackNo failed:", e);
  }

  // 5 дахь дээр NO end
  if(noCountLocal >= 5){
    askScreen.classList.add("hidden");
    noEndScreen.classList.remove("hidden");
  }
});

/* ===== YES LOGIC ===== */
async function trackYes(){
  await setDoc(doc(db, "clicks", sid), {
    sid,
    name: personName,
    choice: "yes",
    lastYesAt: serverTimestamp(),
    yesCount: increment(1),
    loveMsg: (loveMsg.value || "").trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

yesBtn.addEventListener("click", async () => {
  await startMusicOnce();

  // save message (just in case)
  try{
    await saveMessageIfAny();
  }catch(e){}

  // track YES
  try{
    await trackYes();
  }catch(e){
    console.log("trackYes failed:", e);
  }

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  yesText.textContent = `${personName}, чи намайг хамгийн аз жаргалтай хүн болголоо! 💗`;

  // confetti
  try{
    confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 120, spread: 110, origin: { y: 0.6 } }), 260);
  }catch(e){}
});