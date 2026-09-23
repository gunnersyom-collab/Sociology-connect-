import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiwF8jW-hCDLmtbpAD6t99afAhcldGQfw",
  authDomain: "sociologyconnect.firebaseapp.com",
  projectId: "sociologyconnect",
  storageBucket: "sociologyconnect.firebasestorage.app",
  messagingSenderId: "500228908679",
  appId: "1:500228908679:web:ebc9c7cd6bf7c38aa13a22",
  measurementId: "G-BM74QJ4XTZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

/* ---------- SIGN UP ---------- */

async function signup() {
  try {
    const fullName = $("fullName")?.value.trim() || "";
    const year = $("year")?.value || "";
    const bio = $("bio")?.value.trim() || "";
    const email = $("email").value.trim();
    const password = $("password").value;

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (fullName) {
      await updateProfile(cred.user, { displayName: fullName });
    }

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      fullName,
      year,
      bio,
      createdAt: serverTimestamp()
    });

    alert("Account created successfully!");
    location.href = "index.html";

  } catch (e) {
    alert(e.message);
  }
}

/* ---------- LOGIN ---------- */

async function login() {
  try {
    const email = $("email").value.trim();
    const password = $("password").value;

    await signInWithEmailAndPassword(auth, email, password);

    location.href = "index.html";

  } catch (e) {
    alert(e.message);
  }
}

/* ---------- LOGOUT ---------- */

async function logout() {
  await signOut(auth);
  location.href = "login.html";
}

/* ---------- PROFILE ---------- */

async function loadProfile(user) {
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.exists() ? snap.data() : {};

  $("userInfo") && ($("userInfo").textContent = data.fullName || user.displayName || user.email);
  $("profileName") && ($("profileName").textContent = data.fullName || user.displayName || "Student");
  $("profileEmail") && ($("profileEmail").textContent = user.email);
  $("profileYear") && ($("profileYear").textContent = data.year || "");
  $("profileBio") && ($("profileBio").textContent = data.bio || "");
}

/* ---------- AUTH STATE ---------- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    $("loginLink") && ($("loginLink").style.display = "none");
    $("logoutBtn") && ($("logoutBtn").style.display = "inline-block");
    loadProfile(user);
  } else {
    $("loginLink") && ($("loginLink").style.display = "inline");
    $("logoutBtn") && ($("logoutBtn").style.display = "none");
  }
});

/* ---------- IMPORTANT ---------- */

window.login = login;
window.signup = signup;
window.logout = logout;

console.log("✅ AUTH READY");
