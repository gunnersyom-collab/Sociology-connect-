
/* =========================================================
   SOCIOLOGY CONNECT - AUTH.JS
   Firebase Authentication + Profile + Posts
   ========================================================= */

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
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBiwF8j-W-hCDLmtbpAD6t99afAhcldGQfw",
  authDomain: "sociologyconnect.firebaseapp.com",
  projectId: "sociologyconnect",
  storageBucket: "sociologyconnect.firebasestorage.app",
  messagingSenderId: "500228908679",
  appId: "1:500228908679:web:ebc9c7cd6bf7c38aa13a22",
  measurementId: "G-BM74QJ4XTZ"
};

/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

/* =========================================================
   HELPER - GET ELEMENT
   ========================================================= */

function getElement(id) {
  return document.getElementById(id);
}

/* =========================================================
   HELPER - ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
  if (value === undefined || value === null) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   SIGN UP
   ========================================================= */

window.signup = async function () {

  const fullName = getElement("fullName")?.value.trim() || "";
  const year = getElement("year")?.value || "";
  const bio = getElement("bio")?.value.trim() || "";
  const email = getElement("email")?.value.trim() || "";
  const password = getElement("password")?.value || "";

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  try {

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    /* Save Firebase display name */
    if (fullName) {
      await updateProfile(user, {
        displayName: fullName
      });
    }

    /* Save user profile in Firestore */
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        year: year,
        bio: bio,
        photo: "",
        createdAt: serverTimestamp()
      }
    );

    alert("Account created successfully!");

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert(getFirebaseError(error));

  }
};

/* =========================================================
   LOGIN
   ========================================================= */

window.login = async function () {

  const email = getElement("email")?.value.trim() || "";
  const password = getElement("password")?.value || "";

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert(getFirebaseError(error));

  }
};

/* =========================================================
   LOGOUT
   ========================================================= */

window.logout = async function () {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert("Could not logout.");

  }
};

/* =========================================================
   FIREBASE ERROR MESSAGE
   ========================================================= */

function getFirebaseError(error) {

  switch (error.code) {

    case "auth/email-already-in-use":
      return "This email is already registered.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-credential":
      return "Email or password is incorrect.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    default:
      return error.message || "Something went wrong.";
  }
}

/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile(user) {

  const profileCard = getElement("profileCard");
  const loginMessage = getElement("loginMessage");

  if (!user) {

    if (profileCard) {
      profileCard.style.display = "none";
    }

    if (loginMessage) {
      loginMessage.style.display = "block";
      loginMessage.textContent =
        "Please login to view your profile.";
    }

    return;
  }

  /* Show profile */
  if (profileCard) {
    profileCard.style.display = "block";
  }

  if (loginMessage) {
    loginMessage.style.display = "none";
  }

  try {

    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);

    let data = {};

    if (profileSnap.exists()) {
      data = profileSnap.data();
    }

    const fullName =
      data.fullName ||
      user.displayName ||
      "Student";

    const email =
      data.email ||
      user.email ||
      "";

    const year =
      data.year ||
      "";

    const bio =
      data.bio ||
      "";

    const photo =
      data.photo ||
      user.photoURL ||
      "";

    /* =====================================================
       PROFILE DISPLAY
       ===================================================== */

    const profileName =
      getElement("profileName");

    const profileEmail =
      getElement("profileEmail");

    const profileYear =
      getElement("profileYear");

    const profileBio =
      getElement("profileBio");

    const profilePhoto =
      getElement("profilePhoto");

    if (profileName) {
      profileName.textContent = fullName;
    }

    if (profileEmail) {
      profileEmail.textContent = email;
    }

    if (profileYear) {
      profileYear.textContent =
        year || "Not added";
    }

    if (profileBio) {
      profileBio.textContent =
        bio || "No bio added yet.";
    }

    if (profilePhoto) {

      if (photo) {
        profilePhoto.src = photo;
      } else {
        profilePhoto.src =
          "https://via.placeholder.com/120";
      }

      profilePhoto.onerror = function () {
        this.src =
          "https://via.placeholder.com/120";
      };
    }

    /* =====================================================
       EDIT FORM
       ===================================================== */

    const fullNameInput =
      getElement("fullName");

    const yearInput =
      getElement("year");

    const bioInput =
      getElement("bio");

    const photoInput =
      getElement("photo");

    if (fullNameInput) {
      fullNameInput.value = fullName;
    }

    if (yearInput) {
      yearInput.value = year;
    }

    if (bioInput) {
      bioInput.value = bio;
    }

    if (photoInput) {
      photoInput.value = photo;
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

  }
}

/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  /* Header elements */
  const userInfo =
    getElement("userInfo");

  const loginLink =
    getElement("loginLink");

  const logoutBtn =
    getElement("logoutBtn");

  /* =======================================================
     USER LOGGED IN
     ======================================================= */

  if (user) {

    if (userInfo) {
      userInfo.textContent =
        user.displayName ||
        user.email ||
        "User";

      userInfo.style.display =
        "inline";
    }

    if (loginLink) {
      loginLink.style.display =
        "none";
    }

    if (logoutBtn) {
      logoutBtn.style.display =
        "inline-block";
    }

    /* Load profile */
    await loadProfile(user);

  }

  /* =======================================================
     USER LOGGED OUT
     ======================================================= */

  else {

    if (userInfo) {
      userInfo.style.display =
        "none";
    }

    if (loginLink) {
      loginLink.style.display =
        "inline";
    }

    if (logoutBtn) {
      logoutBtn.style.display =
        "none";
    }

    await loadProfile(null);
  }

});

/* =========================================================
   SAVE PROFILE
   ========================================================= */

window.saveProfile = async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const fullName =
    getElement("fullName")?.value.trim() || "";

  const year =
    getElement("year")?.value || "";

  const bio =
    getElement("bio")?.value.trim() || "";

  const photo =
    getElement("photo")?.value.trim() || "";

  if (!fullName) {
    alert("Please enter your full name.");
    return;
  }

  try {

    /* Update Firebase Auth profile */
    await updateProfile(user, {
      displayName: fullName,
      photoURL: photo || null
    });

    /* Update Firestore */
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        year: year,
        bio: bio,
        photo: photo
      },
      {
        merge: true
      }
    );

    /* Update profile display immediately */

    const profileName =
      getElement("profileName");

    const profileEmail =
      getElement("profileEmail");

    const profileYear =
      getElement("profileYear");

    const profileBio =
      getElement("profileBio");

    const profilePhoto =
      getElement("profilePhoto");

    if (profileName) {
      profileName.textContent =
        fullName;
    }

    if (profileEmail) {
      profileEmail.textContent =
        user.email;
    }

    if (profileYear) {
      profileYear.textContent =
        year || "Not added";
    }

    if (profileBio) {
      profileBio.textContent =
        bio || "No bio added yet.";
    }

    if (profilePhoto) {

      profilePhoto.src =
        photo ||
        "https://via.placeholder.com/120";
    }

    alert("Profile saved successfully!");

  } catch (error) {

    console.error(error);

    alert(
      "Could not save profile: " +
      error.message
    );

  }
};

/* =========================================================
   CREATE POST
   ========================================================= */

window.createPost = async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const postText =
    getElement("postText");

  if (!postText) {
    alert("Post box not found.");
    return;
  }

  const content =
    postText.value.trim();

  if (!content) {
    alert("Write something first.");
    return;
  }

  try {

    const profileSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    let fullName =
      user.displayName ||
      user.email;

    if (profileSnap.exists()) {

      const data =
        profileSnap.data();

      fullName =
        data.fullName ||
        fullName;
    }

    await addDoc(
      collection(db, "posts"),
      {
        userId: user.uid,
        userEmail: user.email,
        userName: fullName,
        content: content,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      }
    );

    postText.value = "";

  } catch (error) {

    console.error(error);

    alert(
      "Could not create post: " +
      error.message
    );

  }
};

/* =========================================================
   LIKE POST
   ========================================================= */

window.likePost = async function (postId) {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  try {

    const postRef =
      doc(db, "posts", postId);

    const postSnap =
      await getDoc(postRef);

    if (!postSnap.exists()) {
      return;
    }

    const data =
      postSnap.data();

    const likes =
      data.likes || [];

    if (likes.includes(user.email)) {

      await updateDoc(
        postRef,
        {
          likes:
            arrayRemove(user.email)
        }
      );

    } else {

      await updateDoc(
        postRef,
        {
          likes:
            arrayUnion(user.email)
        }
      );
    }

  } catch (error) {

    console.error(error);

    alert(
      "Could not update like."
    );

  }
};

/* =========================================================
   ADD COMMENT
   ========================================================= */

window.addComment = async function (postId) {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const input =
    getElement(
      "commentInput-" + postId
    );

  if (!input) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  try {

    await updateDoc(
      doc(db, "posts", postId),
      {
        comments:
          arrayUnion({
            userId: user.uid,
            userEmail: user.email,
            text: text,
            time:
              new Date().toISOString()
          })
      }
    );

    input.value = "";

  } catch (error) {

    console.error(error);

    alert(
      "Could not add comment."
    );

  }
};

/* =========================================================
   SHARE POST
   ========================================================= */

window.sharePost = async function (postId) {

  const shareUrl =
    window.location.href;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Sociology Connect",
        text: "Check this post on Sociology Connect.",
        url: shareUrl
      });

    } else if (
      navigator.clipboard
    ) {

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "Post link copied!"
      );

    } else {

      alert(
        "Sharing is not supported on this browser."
      );
    }

  } catch (error) {

    console.log(
      "Share cancelled."
    );

  }
};

/* =========================================================
   REAL-TIME POSTS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const postsContainer =
      getElement("postsContainer");

    if (!postsContainer) {
      return;
    }

    const postsQuery =
      query(
        collection(db, "posts"),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    onSnapshot(
      postsQuery,
      (snapshot) => {

        postsContainer.innerHTML = "";

        const posts = [];

        snapshot.forEach(
          (documentSnapshot) => {

            posts.push({
              id:
                documentSnapshot.id,

              ...documentSnapshot.data()
            });

          }
        );

        if (posts.length === 0) {

          postsContainer.innerHTML = `
            <div style="
              background:white;
              padding:20px;
              border-radius:12px;
              text-align:center;
            ">
              <h3>📭 No posts yet</h3>
              <p>Be the first student to create a post.</p>
            </div>
          `;

        }

        posts.forEach(
          (post) => {

            const likes =
              post.likes?.length || 0;

            const comments =
              post.comments || [];

            const userName =
              escapeHTML(
                post.userName ||
                post.userEmail ||
                "Student"
              );

            const content =
              escapeHTML(
                post.content || ""
              );

            let commentsHTML = "";

            comments.forEach(
              (comment) => {

                commentsHTML += `
                  <div style="
                    background:#f1f3f5;
                    padding:8px;
                    margin:5px 0;
                    border-radius:8px;
                  ">
                    <b>
                      ${escapeHTML(
                        comment.userEmail ||
                        "Student"
                      )}
                    </b>
                    <br>
                    ${escapeHTML(
                      comment.text ||
                      ""
                    )}
                  </div>
                `;

              }
            );

            postsContainer.innerHTML += `
              <div style="
                background:white;
                padding:16px;
                margin:15px 0;
                border-radius:14px;
                box-shadow:0 3px 10px rgba(0,0,0,.08);
              ">

                <div style="
                  display:flex;
                  align-items:center;
                  gap:8px;
                ">

                  <div style="
                    width:42px;
                    height:42px;
                    border-radius:50%;
                    background:#007bff;
                    color:white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-weight:bold;
                  ">
                    👤
                  </div>

                  <div>
                    <b>${userName}</b>
                    <br>
                    <small style="color:#777;">
                      ${escapeHTML(
                        post.userEmail ||
                        ""
                      )}
                    </small>
                  </div>

                </div>

                <p style="
                  margin:15px 0;
                  line-height:1.6;
                  white-space:pre-wrap;
                ">
                  ${content}
                </p>

                <div style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                ">

                  <button
                    onclick="likePost('${post.id}')"
                    style="
                      width:auto;
                      padding:9px 14px;
                    "
                  >
                    ❤️ ${likes}
                  </button>

                  <button
                    onclick="sharePost('${post.id}')"
                    style="
                      width:auto;
                      padding:9px 14px;
                    "
                  >
                    📤 Share
                  </button>

                </div>

                <div style="
                  margin-top:12px;
                ">

                  ${commentsHTML}

                  <div style="
                    display:flex;
                    gap:6px;
                    margin-top:8px;
                  ">

                    <input
                      id="commentInput-${post.id}"
                      placeholder="Write a comment..."
                      style="
                        margin:0;
                        flex:1;
                      "
                    >

                    <button
                      onclick="addComment('${post.id}')"
                      style="
                        width:auto;
                        padding:10px 14px;
                      "
                    >
                      Send
                    </button>

                  </div>

                </div>

              </div>
            `;

          }
        );

        updateTrending(posts);

      },

      (error) => {

        console.error(
          "Posts error:",
          error
        );

        postsContainer.innerHTML = `
          <div style="
            background:#fff3cd;
            padding:15px;
            border-radius:10px;
          ">
            ⚠️ Could not load posts.
          </div>
        `;

      }
    );

  }
);

/* =========================================================
   TRENDING POSTS
   ========================================================= */

function updateTrending(posts) {

  const trending =
    getElement("trending");

  if (!trending) {
    return;
  }

  trending.innerHTML =
    "<h2>🔥 Trending Posts</h2>";

  const sorted =
    [...posts].sort(
      (a, b) => {

        const scoreA =
          (a.likes?.length || 0) +
          (a.comments?.length || 0);

        const scoreB =
          (b.likes?.length || 0) +
          (b.comments?.length || 0);

        return scoreB - scoreA;

      }
    );

  sorted
    .slice(0, 3)
    .forEach(
      (post) => {

        trending.innerHTML += `
          <div class="card" style="
            background:white;
            padding:12px;
            margin:8px 0;
            border-radius:10px;
          ">

            ❤️ ${post.likes?.length || 0}
            &nbsp; 💬 ${post.comments?.length || 0}

            <br><br>

            ${escapeHTML(
              post.content || ""
            )}

          </div>
        `;

      }
    );
}

/* =========================================================
   ADMIN CHECK
   ========================================================= */

window.isAdmin = function () {

  const user =
    auth.currentUser;

  if (!user) {
    return false;
  }

  return (
    user.email ===
    "admin@sociologyconnect.com"
  );
};

/* =========================================================
   PAGE READY MESSAGE
   ========================================================= */

console.log(
  "✅ Sociology Connect Firebase system loaded."
);
