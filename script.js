import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/** Firebase config */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "valentine-c7202.firebaseapp.com",
  projectId: "valentine-c7202",
  storageBucket: "valentine-c7202.firebasestorage.app",
  messagingSenderId: "97199788414",
  appId: "1:97199788414:web:d4a9a8ba08ac7692eb632f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Screens
const startScreen = document.getElementById("startScreen");
const askScreen   = document.getElementById("askScreen");
const yesScreen   = document.getElementById("yesScreen");

// Start UI
const startBtn    = document.getElementById("startBtn");
const loveMsg     = document.getElementById("loveMsg");
const charCount   = document.getElementById("charCount");

// Ask UI
const yesBtn    = document.getElementById("yesBtn");
const noBtn     = document.getElementById("noBtn");
const arena     = document.getElementById("arena");
const img       = document.getElementById("cuteImg");
const hint      = document.getElementById("hint");
const yesText   = document.getElementById("yesText");
const titleText = document.getElementById("titleText");
const msgPreview= document.getElementById("msgPreview");

// Audio
const bgm = document.getElementById("bgm");

// State
let noCountLocal = 0;
let yesScale = 1;

const ESCAPE_AFTER = 3;
const GROW_FACTOR  = 1.18;

const images = ["img.jpg","img2.png","img3.png","img4.png","img5.png"];

const noTexts = [
  "Чи бүрэн итгэлтэй байна уу?? 😳",
  "Дахиад бодооч дээ 🥺",
  "Зүрх минь шархалж байна 💔",
  "No гэж үү? 😢",
  "Сүүлийн боломж шүү 😈",
  "Одоо баригдахгүй дээ 😜"
];

// URL params
function qp(key){ return new URLSearchParams(location.search).get(key); }
function getSid(){ return qp("sid") || "default"; }
function getName(){
  const raw = (qp("name") || "").trim();
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();
if(titleText) titleText.textContent = `Will you be my Valentine, ${personName}? 💕`;

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// --- Music start (iOS restriction) ---
let musicStarted = false;
async function startMusicOnce(){
  if(musicStarted) return;
  try{
    bgm.volume = 0.0;
    await bgm.play();
    musicStarted = true;

    // fade in
    let v = 0;
    const t = setInterval(() => {
      v += 0.03;
      bgm.volume = Math.min(v, 0.35);
      if(bgm.volume >= 0.35) clearInterval(t);
    }, 120);
  }catch{
    musicStarted = false;
  }
}

// Firestore tracking
async function trackStart(message){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    loveMsg: message || "",
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function trackNo(){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    lastNoAt: serverTimestamp(),
    noCount: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function trackYes(){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    choice: "yes",
    yesCount: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Move NO
function moveNoButtonRandom(){
  const pad = 8;
  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();
  const maxX = a.width - b.width - pad;
  const maxY = a.height - b.height - pad;
  const x = Math.random() * maxX + pad;
  const y = Math.random() * maxY + pad;
  noBtn.style.left = x + "px";
  noBtn.style.top  = y + "px";
  noBtn.style.transform = "translate(0,0)";
}

// --- Start screen char count ---
if(loveMsg && charCount){
  loveMsg.addEventListener("input", () => {
    charCount.textContent = `${loveMsg.value.length} / 220`;
  });
}

// ✅ START button (before YES/NO)
startBtn.addEventListener("click", async () => {
  // 1) start music
  await startMusicOnce();

  // 2) save message + start log
  const message = (loveMsg?.value || "").trim();
  try{ await trackStart(message); }catch{}

  // 3) show message on ask screen (optional)
  if(msgPreview){
    msgPreview.textContent = message.length ? `💌 ${message}` : "";
  }

  // 4) switch screens
  startScreen.classList.add("hidden");
  askScreen.classList.remove("hidden");
});

// ❌ NO click
noBtn.addEventListener("click", async () => {
  noCountLocal++;

  // image change
  img.src = images[noCountLocal % images.length];

  // yes grow
  yesScale = clamp(yesScale * GROW_FACTOR, 1, 6);
  yesBtn.style.transform = `translate(-120%, -50%) scale(${yesScale})`;

  // text change every click
  noBtn.textContent = noTexts[noCountLocal % noTexts.length];

  if(noCountLocal >= ESCAPE_AFTER && hint)
    hint.textContent = "Одоо “No” баригдахгүй дээ 😈";

  if(noCountLocal >= ESCAPE_AFTER)
    moveNoButtonRandom();

  try{ await trackNo(); }catch{}
});

// hover escape
noBtn.addEventListener("mouseenter", () => {
  if(noCountLocal >= ESCAPE_AFTER) moveNoButtonRandom();
});
noBtn.addEventListener("touchstart", (e) => {
  if(noCountLocal >= ESCAPE_AFTER){
    e.preventDefault();
    moveNoButtonRandom();
  }
}, { passive:false });

// ✅ YES click
yesBtn.addEventListener("click", async () => {
  await startMusicOnce();
  try{ await trackYes(); }catch{}

  if(yesText)
    yesText.textContent = `Тийм гэж хэлсэнд баярлалаа, ${personName}! 💖🎉`;

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }), 280);
});
