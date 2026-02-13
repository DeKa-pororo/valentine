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
const askScreen = document.getElementById("askScreen");
const yesScreen = document.getElementById("yesScreen");
const yesBtn    = document.getElementById("yesBtn");
const noBtn     = document.getElementById("noBtn");
const arena     = document.getElementById("arena");
const img       = document.getElementById("cuteImg");
const hint      = document.getElementById("hint");
const yesText   = document.getElementById("yesText");
const titleText = document.getElementById("titleText");
const bgm       = document.getElementById("bgm");

let noCountLocal = 0;
let yesScale = 1;

const ESCAPE_AFTER = 3;
const GROW_FACTOR  = 1.18;
const images = ["img.jpg","img2.png","img3.png","img4.png","img5.png"];

// URL params
function qp(key){ return new URLSearchParams(location.search).get(key); }
function getSid(){ return qp("sid") || "default"; }
function getName(){
  const raw = (qp("name") || "").trim();
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();
if(titleText) titleText.textContent = `Will you be my Valentine, ${personName}? 💕`;

// 💗 Floating hearts
const heartsLayer = document.getElementById("hearts");
const heartEmojis = ["💗","💖","💕","💘","💞","🌸"];
function spawnHeart(){
  if(!heartsLayer) return;
  const h = document.createElement("div");
  h.className = "heart";
  h.textContent = heartEmojis[Math.floor(Math.random()*heartEmojis.length)];
  h.style.left = Math.random()*100 + "vw";
  h.style.animationDuration = (4 + Math.random()*3) + "s";
  h.style.fontSize = (14 + Math.random()*18) + "px";
  heartsLayer.appendChild(h);
  setTimeout(()=>h.remove(), 8000);
}
setInterval(spawnHeart, 350);

// 🎵 iOS autoplay restriction + fade-in (River Flows In You soft)
let musicStarted = false;
async function startMusicOnce(){
  if(musicStarted) return;
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
window.addEventListener("pointerdown", startMusicOnce);
window.addEventListener("touchstart", startMusicOnce, { passive:true });

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

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
function maybeEscape(){
  if(noCountLocal >= ESCAPE_AFTER) moveNoButtonRandom();
}

// ✅ NO tracking (refresh хийсэн ч нийлнэ)
async function trackNo(){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    lastNoAt: serverTimestamp(),
    noCount: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

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

// NO click
noBtn.addEventListener("click", async () => {
  noCountLocal++;

  img.src = images[noCountLocal % images.length];

  yesScale = clamp(yesScale * GROW_FACTOR, 1, 6);
  yesBtn.style.transform = `translate(-120%, -50%) scale(${yesScale})`;

  if(noCountLocal === 1) noBtn.textContent = "Чи бүрэн итгэлтэй байна уу?? 😳";
  if(noCountLocal >= ESCAPE_AFTER && hint) hint.textContent = "Одоо “No” баригдахгүй дээ 😈";
  if(noCountLocal >= ESCAPE_AFTER) moveNoButtonRandom();

  await trackNo();
});

noBtn.addEventListener("mouseenter", maybeEscape);
noBtn.addEventListener("touchstart", (e) => {
  if(noCountLocal >= ESCAPE_AFTER){
    e.preventDefault();
    maybeEscape();
  }
}, { passive:false });

// YES click
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

  if(yesText) yesText.textContent = `Чиний хариуг зүрх догдлон хүлээж, зөвшөөрнө гэж найдаж байсан, ${personName}! 🎉`;

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  // 🎉 Confetti
  confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }), 280);

  // 💗 Hearts burst
  for(let i=0;i<18;i++) spawnHeart();
});
