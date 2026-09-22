import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. Signup, Login, Logout
window.signup = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => { alert("Account created successfully!"); location.href = "index.html"; })
    .catch(e => alert(e.message));
};

window.login = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => { location.href = "index.html"; })
    .catch(e => alert(e.message));
};

window.logout = () => {
  signOut(auth).then(() => location.reload()).catch(e => alert(e.message));
};

// 2. Auth State (Navbar irratti Imeelii agarsiisuu)
onAuthStateChanged(auth, user => {
  const info = document.getElementById("userInfo");
  const login = document.getElementById("loginLink");
  const logout = document.getElementById("logoutBtn");

  if (info && login && logout) {
    if (user) {
      info.style.display = "inline";
      info.textContent = user.email;
      login.style.display = "none";
      logout.style.display = "inline-block";
    } else {
      info.style.display = "none";
      login.style.display = "inline";
      logout.style.display = "none";
    }
  }
});

// 3. Postii Uumuu (Create Post)
window.createPost = () => {
  const text = document.getElementById("postText").value;
  const user = auth.currentUser;

  if (!text.trim()) {
    alert("Maaloo waan barreessitu guuti!");
    return;
  }

  if (user) {
    addDoc(collection(db, "posts"), {
      content: text,
      userEmail: user.email,
      createdAt: serverTimestamp()
    }).then(() => {
      document.getElementById("postText").value = "";
      alert("Postiin kee milkaa'inaan maxxanfame!");
    }).catch(error => {
      alert("Rakkoo: " + error.message);
    });
  } else {
    alert("Dura Login gochuu qabda!");
  }
};

// 4. Postiiwwan Dubbisuu fi Agarsiisuu (Real-time Feed)
document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.getElementById("postsContainer");
  
  if (postsContainer) {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
      postsContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const post = doc.data();
        postsContainer.innerHTML += `
          <div style="background:white; padding:15px; margin:10px 0; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
            <small style="color:gray;"><b>${post.userEmail || 'Nam-tokko'}</b></small>
            <p style="margin-top:8px; font-size:15px; color:#222;">${post.content}</p>
          </div>
        `;
      });
    });
  }
});
