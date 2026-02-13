import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/** ✅ Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCfRFNVsQ-6-9DyQgCIML4lGuY_-YCoDCs",
  authDomain: "valentine-c7202.firebaseapp.com",
  projectId: "valentine-c7202",
  storageBucket: "valentine-c7202.firebasestorage.app",
  messagingSenderId: "97199788414",
  appId: "1:97199788414:web:d4a9a8ba08ac7692eb632f",
  measurementId: "G-HTW2Q4FMZD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const startScreen = document.getElementById("startScreen");
const startBtn    = document.getElementById("startBtn");
const loveMsg     = document.getElementById("loveMsg");
const charCount   = document.getElementById("charCount");
const msgPreview  = document.getElementById("msgPreview");

const askScreen   = document.getElementById("askScreen");
const yesScreen   = document.getElementById("yesScreen");
const noEndScreen = document.getElementById("noEndScreen");

const yesBtn      = document.getElementById("yesBtn");
const noBtn       = document.getElementById("noBtn");
const arena       = document.getElementById("arena");
const img         = document.getElementById("cuteImg");
const hint        = document.getElementById("hint");
const yesText     = document.getElementById("yesText");
const titleText   = document.getElementById("titleText");
const bgm         = document.getElementById("bgm");

// Settings
const GROW_FACTOR = 1.18;
const MAX_YES_SCALE = 6;
const MOVE_ON_NO_COUNTS = new Set([2,3,4]); // ✅ 2,3,4 дээр шилжинэ
const END_AT_NO_COUNT = 5;                  // ✅ 5 дээр дуусгана

const images = ["img.jpg","img2.png","img3.png","img4.png","img5.png"];
const noTexts = [
  "No",
  "Чи бүрэн итгэлтэй байна уу?? 😳",
  "Дахиад нэг сайн бод доо… 🥺",
  "Сүүлийн боломж шүү… 😭",
  "За тэгвэл… 😔"
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

// State
let noCountLocal = 0;
let yesScale = 1;
let musicStarted = false;

// helpers
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function showAskScreen(){
  if(startScreen) startScreen.classList.add("hidden");
  if(askScreen) askScreen.classList.remove("hidden");
  if(msgPreview && loveMsg){
    const t = (loveMsg.value || "").trim();
    msgPreview.textContent = t.length ? `“${t}”` : "";
  }
}

function showYesScreen(){
  if(askScreen) askScreen.classList.add("hidden");
  if(yesScreen) yesScreen.classList.remove("hidden");
}

function showNoEndScreen(){
  if(askScreen) askScreen.classList.add("hidden");
  if(noEndScreen) noEndScreen.classList.remove("hidden");
}

// 🎵 Start music once (fade-in)
async function startMusicOnce(){
  if(musicStarted) return;
  if(!bgm) return;

  try{
    bgm.volume = 0.0;
    await bgm.play();
    musicStarted = true;

    let v = 0;
    const t = setInterval(() => {
      v += 0.03;
      bgm.volume = Math.min(v, 0.35);
      if (bgm.volume >= 0.35) clearInterval(t);
    }, 120);
  }catch{
    musicStarted = false;
  }
}

// ✅ textarea дээр дармагц/бичихэд хөгжим асна
if(loveMsg){
  loveMsg.addEventListener("pointerdown", startMusicOnce);
  loveMsg.addEventListener("focus", startMusicOnce);
  loveMsg.addEventListener("input", startMusicOnce);
}

// Char count
if(loveMsg && charCount){
  const updateCount = () => { charCount.textContent = `${loveMsg.value.length} / 420`; };
  loveMsg.addEventListener("input", updateCount);
  updateCount();
}

// Start button (shows ask screen)
if(startBtn){
  startBtn.addEventListener("click", async () => {
    await startMusicOnce();
    showAskScreen();
  });
}

// Move No button random (INSIDE arena)
function moveNoButtonRandom(){
  if(!arena || !noBtn) return;
  const pad = 8;
  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();

  const maxX = Math.max(0, a.width - b.width - pad);
  const maxY = Math.max(0, a.height - b.height - pad);

  const x = Math.random() * maxX + pad;
  const y = Math.random() * maxY + pad;

  noBtn.style.left = x + "px";
  noBtn.style.top  = y + "px";
  noBtn.style.transform = "translate(0,0)";
}

// ✅ Firestore tracking (No)
async function trackNo(){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    lastNoAt: serverTimestamp(),
    noCount: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Screenshot tools (Yes)
async function takeShotAsSmallJpegDataUrl(){
  const canvas = await html2canvas(askScreen, { scale: 1 });
  const maxW = 520;
  if(canvas.width > maxW){
    const ratio = maxW / canvas.width;
    const c2 = document.createElement("canvas");
    c2.width = Math.round(canvas.width * ratio);
    c2.height = Math.round(canvas.height * ratio);
    const ctx = c2.getContext("2d");
    ctx.drawImage(canvas, 0, 0, c2.width, c2.height);
    return c2.toDataURL("image/jpeg", 0.45);
  }
  return canvas.toDataURL("image/jpeg", 0.45);
}

async function trackYesWithScreenshot(){
  const screenshotDataUrl = await takeShotAsSmallJpegDataUrl();
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    choice: "yes",
    screenshotDataUrl,
    shotAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// ✅ NO click behavior
if(noBtn){
  noBtn.addEventListener("click", async () => {
    noCountLocal++;

    // change image
    if(img) img.src = images[noCountLocal % images.length];

    // grow yes
    yesScale = clamp(yesScale * GROW_FACTOR, 1, MAX_YES_SCALE);
    if(yesBtn) yesBtn.style.transform = `translate(-120%, -50%) scale(${yesScale})`;

    // text changes each time
    const t = noTexts[Math.min(noCountLocal, noTexts.length) - 1] || "No";
    noBtn.textContent = t;

    // move on 2/3/4 only
    if(MOVE_ON_NO_COUNTS.has(noCountLocal)){
      moveNoButtonRandom();
      if(hint) hint.textContent = "😳";
    }

    // Firestore increment
    try { await trackNo(); } catch(e){ console.log("trackNo failed:", e); }

    // end on 5
    if(noCountLocal >= END_AT_NO_COUNT){
      showNoEndScreen();
    }
  });
}

// ✅ YES click
if(yesBtn){
  yesBtn.addEventListener("click", async () => {
    await startMusicOnce();

    try{
      await trackYesWithScreenshot();
    }catch(e){
      console.log("Screenshot save failed:", e);
      await setDoc(doc(db, "clicks", getSid()), {
        sid: getSid(), name: personName, choice: "yes", updatedAt: serverTimestamp()
      }, { merge: true });
    }

    if(yesText) yesText.textContent =
      `Чиний хариуг зүрх догдлон хүлээж, зөвшөөрнө гэж найдаж байсан, ${personName}! 🎉`;

    showYesScreen();

    // Confetti
    confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }), 280);
  });
}