/**
 * firebase-config.js
 * Firebase + EmailJS initialization
 * Replace emailjs values with your real credentials from emailjs.com
 */

// ── Firebase Config (nikas-shop project) ──────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBaQzksyl2O-Q0ILjUpNVQMWPzU2sygkCk",
  authDomain:        "nikas-shop.firebaseapp.com",
  projectId:         "nikas-shop",
  storageBucket:     "nikas-shop.firebasestorage.app",
  messagingSenderId: "843627861768",
  appId:             "1:843627861768:web:bd59f6bead35f7d3ca7ebd",
  measurementId:     "G-F2QQ1BTCJG"
};

// ── EmailJS Config ─────────────────────────────────────────────────
// Sign up at https://www.emailjs.com → copy your IDs here
window.EMAILJS_CONFIG = {
  publicKey:  "wOWeB0_iMRQ0KSs10",   // Account → API Keys
  serviceID:  "service_5zlel99",           // Email Services tab
  templateID: "template_k98dxww"           // Email Templates tab
};

// ── Initialize Firebase ───────────────────────────────────────────
(function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    window.fbAuth = firebase.auth();
    window.fbDb   = firebase.firestore();
    console.log("✅ Firebase ready");
  } catch (e) {
    console.error("Firebase init error:", e);
  }
})();

// ── Initialize EmailJS ────────────────────────────────────────────
(function initEmailJS() {
  try {
    emailjs.init(window.EMAILJS_CONFIG.publicKey);
    console.log("✅ EmailJS ready");
  } catch (e) {
    console.warn("EmailJS not loaded yet:", e);
  }
})();