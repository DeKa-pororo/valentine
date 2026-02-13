import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/** ✅ Firebase config-оо энд paste */
const firebaseConfig = {
  apiKey: "AIzaSyCfRFNVsQ-6-9DyQgCIML4lGuY_-YCoDCs",
  authDomain: "valentine-c7202.firebaseapp.com",
  projectId: "valentine-c7202",
  storageBucket: "valentine-c7202.firebasestorage.app",
  messagingSenderId: "97199788414",
  appId: "1:97199788414:web:d4a9a8ba08ac7692eb632f",
  measurementId: "G-HTW2Q4FMZD"
}

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
const images = ["img1.png","img2.png","img3.png","img4.png","img5.png"];

// URL params
function qp(key){ return new URLSearchParams(location.search).get(key); }
function getSid(){ return qp("sid") || "default"; }
function getName(){
  const raw = (qp("name") || "").trim();
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();
if(titleText) titleText.textContent = `Will you be my Valentine, ${personName}? 💕`;

// iOS autoplay restriction: first user gesture needed
let musicStarted = false;
async function startMusicOnce(){
  if(musicStarted) return;
  try{
    bgm.volume = 0.35;
    await bgm.play();
    musicStarted = true;
  }catch{ /* next gesture will try again */ }
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

/** ✅ Firestore tracking
 * - NO дээр: noCount сервер талд increment(1) → refresh хийсэн ч алдагдахгүй
 * - YES дээр: screenshotDataUrl хадгална
 */
async function trackNo(){
  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    choice: "no",
    noCount: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function takeShotAsSmallJpegDataUrl(){
  // хэмжээ багасгахын тулд scale 1, JPEG quality 0.45
  const canvas = await html2canvas(askScreen, { scale: 1 });

  // canvas-аа дэндүү том бол resize хийж багасгана (өргөн 520px орчим)
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
  const screenshotDataUrl = await takeShotAsSmallJpegDataUrl(); // data:image/jpeg;base64,...

  await setDoc(doc(db, "clicks", getSid()), {
    sid: getSid(),
    name: personName,
    choice: "yes",
    screenshotDataUrl,      // ✅ Firestore дотор хадгална
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

  if(noCountLocal === 1) noBtn.textContent = "Are you positive? 😳";
  if(noCountLocal >= ESCAPE_AFTER) hint.textContent = "Одоо “No” баригдахгүй дээ 😈";
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
    // Хэрвээ 1MiB limit давбал энд алдаа өгч болно.
    // Тэгвэл quality-г 0.35 болгож бууруул.
    console.log("Screenshot save failed:", e);
    // fallback: ядаж yes лог үлдээе
    await setDoc(doc(db, "clicks", getSid()), {
      sid: getSid(), name: personName, choice: "yes", updatedAt: serverTimestamp()
    }, { merge: true });
  }

  if(yesText) yesText.textContent = `Knew you would say yes, ${personName}! 🎉`;

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  // Confetti
  confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }), 280);
});