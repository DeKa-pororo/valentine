import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadString } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

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
const storage = getStorage(app);

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

let noCount = 0;
let yesScale = 1;

const ESCAPE_AFTER = 3;
const GROW_FACTOR  = 1.18;
const images = ["img1.png","img2.png","img3.png","img4.png","img5.png"];

// URL params
function qp(key){
  return new URLSearchParams(location.search).get(key);
}
function getSid(){
  return qp("sid") || "default";
}
function getName(){
  const raw = (qp("name") || "").trim();
  // decode already handled by URLSearchParams, just sanitize length
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();

// Optional: Title дээр нэр оруулах (хүсвэл)
titleText.textContent = `Will you be my Valentine, ${personName}? 💕`;

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// iOS autoplay restriction: play will work only after first user gesture.
// We'll attempt on first pointerdown + also inside Yes click.
let musicStarted = false;
async function startMusicOnce(){
  if(musicStarted) return;
  try{
    bgm.volume = 0.35;
    await bgm.play();
    musicStarted = true;
  }catch(e){
    // keep false; next gesture will try again
    musicStarted = false;
  }
}
window.addEventListener("pointerdown", startMusicOnce);
window.addEventListener("touchstart", startMusicOnce, { passive:true });

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
  if(noCount >= ESCAPE_AFTER) moveNoButtonRandom();
}

async function track(choice){
  const base = {
    sid: getSid(),
    name: personName,      // (name param ашиглаж байгаа бол)
    choice,
    updatedAt: serverTimestamp()
  };

  if(choice === "no"){
    // ✅ refresh хийсэн ч Firestore дээр нийтээрээ нэмэгдэнэ
    await setDoc(doc(db, "clicks", getSid()), {
      ...base,
      noCount: increment(1)
    }, { merge: true });
  } else {
    // ✅ Yes дээр noCount-ыг overwrite хийхгүй
    await setDoc(doc(db, "clicks", getSid()), base, { merge: true });
  }
}


async function takeShotYesOnly(){
  const canvas = await html2canvas(askScreen, { scale: 2 });
  const dataUrl = canvas.toDataURL("image/png");
  const fileRef = ref(storage, `shots/${getSid()}.png`);
  await uploadString(fileRef, dataUrl, "data_url");
}

// NO click
noBtn.addEventListener("click", async () => {
  noCount++;

  img.src = images[noCount % images.length];

  yesScale = clamp(yesScale * GROW_FACTOR, 1, 6);
  yesBtn.style.transform = `translate(-120%, -50%) scale(${yesScale})`;

  if(noCount === 1) noBtn.textContent = "Are you positive? 😳";
  if(noCount >= ESCAPE_AFTER) hint.textContent = "Одоо “No” баригдахгүй дээ 😈";
  if(noCount >= ESCAPE_AFTER) moveNoButtonRandom();

  await track("no");
});

noBtn.addEventListener("mouseenter", maybeEscape);
noBtn.addEventListener("touchstart", (e) => {
  if(noCount >= ESCAPE_AFTER){
    e.preventDefault();
    maybeEscape();
  }
}, { passive:false });

// YES click
yesBtn.addEventListener("click", async () => {
  await startMusicOnce();

  // Screenshot зөвхөн Yes дээр
  try { await takeShotYesOnly(); } catch {}

  await track("yes");

  yesText.textContent = `Knew you would say yes, ${personName}! 🎉`;

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }), 280);
});
