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
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion
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
      createdAt: serverTimestamp(),
      likes: [],
      comments: []
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

// 4. Like Kennuu
window.likePost = (postId) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Like gochuuf dura Login godhi!");
    return;
  }
  const postRef = doc(db, "posts", postId);
  updateDoc(postRef, {
    likes: arrayUnion(user.email)
  });
};

// 5. Comment Dabaluu
window.addComment = (postId) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Comment kennuuf dura Login godhi!");
    return;
  }
  const commentInput = document.getElementById(`commentInput-${postId}`);
  const commentText = commentInput.value;

  if (!commentText.trim()) return;

  const postRef = doc(db, "posts", postId);
  updateDoc(postRef, {
    comments: arrayUnion({
      userEmail: user.email,
      text: commentText,
      time: new Date().toISOString()
    })
  }).then(() => {
    commentInput.value = "";
  });
};

// 6. Postiiwwan Dubbisuu fi Agarsiisuu (Real-time Feed with Likes & Comments)
document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.getElementById("postsContainer");
  
  if (postsContainer) {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
      postsContainer.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const postId = docSnap.id;
        const likesCount = post.likes ? post.likes.length : 0;
        
        let commentsHTML = "";
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(c => {
            commentsHTML += `<div style="background:#f1f3f5; padding:6px 10px; margin:4px 0; border-radius:6px; font-size:13px;"><b>${c.userEmail}:</b> ${c.text}</div>`;
          });
        }

        postsContainer.innerHTML += `
          <div style="background:white; padding:15px; margin:15px 0; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
            <small style="color:gray;"><b>${post.userEmail || 'Nam-tokko'}</b></small>
            <p style="margin:10px 0; font-size:15px; color:#222; line-height:1.4;">${post.content}</p>
            
            <div style="display:flex; align-items:center; gap:15px; margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
              <button onclick="likePost('${postId}')" style="background:#e7f5ff; color:#007bff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">👍 Like (${likesCount})</button>
            </div>

            <div style="margin-top:10px;">
              <div style="max-height:120px; overflow-y:auto; margin-bottom:8px;">${commentsHTML}</div>
              <div style="display:flex; gap:6px;">
                <input id="commentInput-${postId}" placeholder="Comment barreessi..." style="padding:8px; font-size:13px; margin:0; border-radius:6px; border:1px solid #ccc;">
                <button onclick="addComment('${postId}')" style="padding:8px 12px; font-size:13px; border-radius:6px; margin:0;">Ergi</button>
              </div>
            </div>
          </div>
        `;
      });
    });
  }
});

