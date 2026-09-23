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
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
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

/* ---------- HTML SECURITY HELPER ---------- */
function escapeHTML(value) {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

/* ---------- CREATE POST ---------- */

async function createPost() {
  try {
    const postText = $("postText")?.value.trim();
    if (!postText) {
      alert("Please write something to post!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to post.");
      location.href = "login.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const userData = snap.exists() ? snap.data() : {};
    const authorName = userData.fullName || user.displayName || "Student";

    await addDoc(collection(db, "posts"), {
      text: postText,
      authorId: user.uid,
      authorName: authorName,
      createdAt: serverTimestamp()
    });

    $("postText").value = "";
    loadPosts();
  } catch (e) {
    alert("Error posting: " + e.message);
  }
}

/* ---------- LOAD POSTS ---------- */

async function loadPosts() {
  const postsContainer = $("postsContainer");
  if (!postsContainer) return;

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      postsContainer.innerHTML = `
        <div class="post-empty"> 
            <h3>📭 No posts yet</h3> 
            <p>Be the first to share something with the community!</p> 
        </div>`;
      return;
    }

    let html = "";
    querySnapshot.forEach((docSnap) => {
      const post = docSnap.data();
      html += `
        <div class="card" style="margin-bottom: 12px; background:white; padding:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <strong style="color:#007bff;">${escapeHTML(post.authorName || "Student")}</strong>
            <p style="margin-top: 5px; white-space: pre-wrap; line-height:1.5;">${escapeHTML(post.text)}</p>
        </div>
      `;
    });

    postsContainer.innerHTML = html;
  } catch (e) {
    console.error("Error loading posts:", e);
    postsContainer.innerHTML = `
      <div class="post-empty"> 
          <h3>⚠️ Error loading posts</h3> 
          <p>${escapeHTML(e.message)}</p> 
      </div>`;
  }
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

/* ---------- WINDOW GLOBAL EXPORTS ---------- */

window.login = login;
window.signup = signup;
window.logout = logout;
window.createPost = createPost;
window.loadPosts = loadPosts;

/* ---------- DOM CONTENT LOADED ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});

console.log("✅ AUTH & POSTS READY");
