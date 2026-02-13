import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

/* ---------- Elements ---------- */
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const loveMsg = document.getElementById("loveMsg");
const charCount = document.getElementById("charCount");

const askScreen = document.getElementById("askScreen");
const yesScreen = document.getElementById("yesScreen");
const noEndScreen = document.getElementById("noEndScreen");

const msgPreview = document.getElementById("msgPreview");
const titleText = document.getElementById("titleText");
const yesText = document.getElementById("yesText");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const arena = document.getElementById("arena");
const img = document.getElementById("cuteImg");
const hint = document.getElementById("hint");

const bgm = document.getElementById("bgm");

/* ---------- State ---------- */
let noCountLocal = 0;
let yesScale = 1;

const ESCAPE_AFTER = 3;
const FINAL_NO_AT = 5; // ✅ 5 дахь No дээр дуусгана
const GROW_FACTOR = 1.18;

const images = ["img.jpg", "img2.png", "img3.png", "img4.png", "img5.png"];

const noTexts = [
  "Үгүй 😳",
  "Чи бүрэн итгэлтэй байна уу?? 🥺",
  "За яахав дээ… 😭",
  "Сүүлчийн боломж шүү 😤",
  "За ойлголоо… 💔"
];

/* ---------- URL params ---------- */
function qp(key) {
  return new URLSearchParams(location.search).get(key);
}
function getSid() {
  return qp("sid") || "default";
}
function getName() {
  const raw = (qp("name") || "").trim();
  return raw.length ? raw.slice(0, 24) : "Cutie";
}
const personName = getName();
if (titleText)
  titleText.textContent = `Will you be my Valentine, ${personName}? 💕`;

/* ---------- Music (must be user gesture) ---------- */
let musicStarted = false;
async function startMusicOnce() {
  if (musicStarted) return;
  try {
    bgm.volume = 0.0;
    await bgm.play();
    musicStarted = true;

    // fade in
    let v = 0;
    const t = setInterval(() => {
      v += 0.03;
      bgm.volume = Math.min(v, 0.35);
      if (bgm.volume >= 0.35) clearInterval(t);
    }, 120);
  } catch (e) {
    musicStarted = false;
    console.log("Music play blocked:", e);
  }
}

/* ---------- Helpers ---------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function moveNoButtonRandom() {
  const pad = 8;
  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();
  const maxX = a.width - b.width - pad;
  const maxY = a.height - b.height - pad;
  const x = Math.random() * maxX + pad;
  const y = Math.random() * maxY + pad;
  noBtn.style.left = x + "px";
  noBtn.style.top = y + "px";
  noBtn.style.transform = "translate(0,0)";
}

function maybeEscape() {
  if (noCountLocal >= ESCAPE_AFTER) moveNoButtonRandom();
}

function freezeButtons() {
  yesBtn.disabled = true;
  noBtn.disabled = true;
  yesBtn.style.pointerEvents = "none";
  noBtn.style.pointerEvents = "none";
}

function safeText(s) {
  return (s || "").trim().slice(0, 420);
}

/* ---------- Firestore ---------- */
async function trackNo() {
  await setDoc(
    doc(db, "clicks", getSid()),
    {
      sid: getSid(),
      name: personName,
      lastNoAt: serverTimestamp(),
      noCount: increment(1),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function finalizeNo() {
  await setDoc(
    doc(db, "clicks", getSid()),
    {
      sid: getSid(),
      name: personName,
      choice: "no",
      finalChoice: "no",
      finalNoAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function takeShotAsSmallJpegDataUrl() {
  const canvas = await html2canvas(askScreen, { scale: 1 });
  const maxW = 520;

  if (canvas.width > maxW) {
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

async function trackYesWithScreenshot(loveMessage) {
  const screenshotDataUrl = await takeShotAsSmallJpegDataUrl();

  await setDoc(
    doc(db, "clicks", getSid()),
    {
      sid: getSid(),
      name: personName,
      choice: "yes",
      loveMessage: loveMessage || "",
      screenshotDataUrl,
      shotAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

/* ---------- Start screen logic ---------- */
function updateCharCount() {
  if (!charCount) return;
  const len = (loveMsg?.value || "").length;
  charCount.textContent = `${len} / 420`;
}
loveMsg?.addEventListener("input", updateCharCount);
updateCharCount();

function showAskScreenWithMessage() {
  const message = safeText(loveMsg?.value);
  if (msgPreview) {
    msgPreview.textContent = message.length ? `“${message}”` : "";
  }
  startScreen.classList.add("hidden");
  askScreen.classList.remove("hidden");
}

startBtn?.addEventListener("click", async () => {
  // ✅ First click: start music, then show ask screen
  await startMusicOnce();
  showAskScreenWithMessage();
});

/* ---------- No button behavior ---------- */
noBtn?.addEventListener("click", async () => {
  noCountLocal++;

  // image rotate
  if (img) img.src = images[noCountLocal % images.length];

  // Yes grow
  yesScale = clamp(yesScale * GROW_FACTOR, 1, 6);
  yesBtn.style.transform = `translate(-120%, -50%) scale(${yesScale})`;

  // No text rotate (every click)
  noBtn.textContent = noTexts[Math.min(noCountLocal, noTexts.length) - 1];

  // escape
  if (noCountLocal >= ESCAPE_AFTER && hint)
    hint.textContent = "Одоо “No” баригдахгүй дээ 😈";
  if (noCountLocal >= ESCAPE_AFTER) moveNoButtonRandom();

  // Firestore increment
  try {
    await trackNo();
  } catch (e) {
    console.log("trackNo failed:", e);
  }

  // FINAL NO
  if (noCountLocal >= FINAL_NO_AT) {
    try {
      await finalizeNo();
    } catch (e) {
      console.log("finalizeNo failed:", e);
    }

    freezeButtons();
    askScreen.classList.add("hidden");
    if (noEndScreen) noEndScreen.classList.remove("hidden");
  }
});

noBtn?.addEventListener("mouseenter", maybeEscape);
noBtn?.addEventListener(
  "touchstart",
  (e) => {
    if (noCountLocal >= ESCAPE_AFTER) {
      e.preventDefault();
      maybeEscape();
    }
  },
  { passive: false }
);

/* ---------- Yes button behavior ---------- */
yesBtn?.addEventListener("click", async () => {
  await startMusicOnce();

  const message = safeText(loveMsg?.value);

  try {
    await trackYesWithScreenshot(message);
  } catch (e) {
    console.log("Screenshot save failed:", e);
    await setDoc(
      doc(db, "clicks", getSid()),
      {
        sid: getSid(),
        name: personName,
        choice: "yes",
        loveMessage: message || "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  if (yesText)
    yesText.textContent = `Чиний хариуг зүрх догдлон хүлээж, зөвшөөрнө гэж найдаж байсан, ${personName}! 🎉`;

  askScreen.classList.add("hidden");
  yesScreen.classList.remove("hidden");

  // confetti
  confetti({ particleCount: 170, spread: 85, origin: { y: 0.6 } });
  setTimeout(
    () => confetti({ particleCount: 130, spread: 110, origin: { y: 0.6 } }),
    280
  );
});
