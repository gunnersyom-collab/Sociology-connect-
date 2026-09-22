import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

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


/* =====================================================
   FIREBASE CONFIG
===================================================== */

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

try {
  getAnalytics(app);
} catch (error) {
  console.log("Analytics unavailable:", error);
}

const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   SIGN UP
===================================================== */

window.signup = async function () {

  try {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const fullNameInput = document.getElementById("fullName");
    const yearInput = document.getElementById("year");
    const bioInput = document.getElementById("bio");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const fullName = fullNameInput?.value.trim() || "";
    const year = yearInput?.value || "";
    const bio = bioInput?.value.trim() || "";

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    /* Save name to Firebase Authentication */
    if (fullName) {
      await updateProfile(user, {
        displayName: fullName
      });
    }

    /* Save complete profile to Firestore */
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
      },
      { merge: true }
    );

    alert("Account created successfully! 🎉");

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    let message = error.message;

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered.";
    }

    if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email.";
    }

    if (error.code === "auth/weak-password") {
      message = "Password is too weak.";
    }

    alert(message);
  }
};


/* =====================================================
   LOGIN
===================================================== */

window.login = async function () {

  try {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    let message = error.message;

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      message = "Email or password is incorrect.";
    }

    alert(message);
  }
};


/* =====================================================
   LOGOUT
===================================================== */

window.logout = async function () {

  try {

    await signOut(auth);

    window.location.href = "login.html";

  } catch (error) {

    alert(error.message);
  }
};


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(auth, async (user) => {

  const info = document.getElementById("userInfo");
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {

    if (info) {
      info.textContent =
        user.displayName || user.email;

      info.style.display = "inline";
    }

    if (loginLink) {
      loginLink.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }

    await loadProfile(user);

  } else {

    if (info) {
      info.style.display = "none";
    }

    if (loginLink) {
      loginLink.style.display = "inline";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }

    const profileCard =
      document.getElementById("profileCard");

    const loginMessage =
      document.getElementById("loginMessage");

    if (profileCard) {
      profileCard.style.display = "none";
    }

    if (loginMessage) {
      loginMessage.style.display = "block";
    }
  }
});


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile(user) {

  try {

    const profileRef =
      doc(db, "users", user.uid);

    const profileSnap =
      await getDoc(profileRef);

    let data = {};

    if (profileSnap.exists()) {
      data = profileSnap.data();
    }

    const profileCard =
      document.getElementById("profileCard");

    const loginMessage =
      document.getElementById("loginMessage");

    if (profileCard) {
      profileCard.style.display = "block";
    }

    if (loginMessage) {
      loginMessage.style.display = "none";
    }


    /* Profile display */

    const profileName =
      document.getElementById("profileName");

    const profileEmail =
      document.getElementById("profileEmail");

    const profileYear =
      document.getElementById("profileYear");

    const profileBio =
      document.getElementById("profileBio");

    const profilePhoto =
      document.getElementById("profilePhoto");


    if (profileName) {
      profileName.textContent =
        data.fullName ||
        user.displayName ||
        "Student";
    }

    if (profileEmail) {
      profileEmail.textContent =
        user.email;
    }

    if (profileYear) {

      if (profileYear.tagName === "SELECT") {
        profileYear.value = data.year || "";
      } else {
        profileYear.textContent =
          data.year || "Not added";
      }
    }

    if (profileBio) {

      if (
        profileBio.tagName === "TEXTAREA" ||
        profileBio.tagName === "INPUT"
      ) {
        profileBio.value = data.bio || "";
      } else {
        profileBio.textContent =
          data.bio || "No bio added yet.";
      }
    }

    if (profilePhoto && data.photo) {
      profilePhoto.src = data.photo;
    }


    /* Edit form */

    const fullName =
      document.getElementById("fullName");

    const year =
      document.getElementById("year");

    const bio =
      document.getElementById("bio");

    const photo =
      document.getElementById("photo");


    if (fullName) {
      fullName.value =
        data.fullName ||
        user.displayName ||
        "";
    }

    if (year) {
      year.value =
        data.year || "";
    }

    if (bio) {
      bio.value =
        data.bio || "";
    }

    if (photo) {
      photo.value =
        data.photo || "";
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );
  }
}


/* =====================================================
   SAVE PROFILE
===================================================== */

window.saveProfile = async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  try {

    const fullName =
      document.getElementById("fullName")?.value.trim() || "";

    const year =
      document.getElementById("year")?.value || "";

    const bio =
      document.getElementById("bio")?.value.trim() || "";

    const photo =
      document.getElementById("photo")?.value.trim() || "";


    /* Update Firebase Auth name */

    if (fullName) {

      await updateProfile(user, {
        displayName: fullName
      });
    }


    /* Update Firestore */

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        year: year,
        bio: bio,
        photo: photo,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );


    /* Update screen */

    const profileName =
      document.getElementById("profileName");

    const profilePhoto =
      document.getElementById("profilePhoto");

    const profileYear =
      document.getElementById("profileYear");

    const profileBio =
      document.getElementById("profileBio");


    if (profileName) {
      profileName.textContent =
        fullName || "Student";
    }

    if (profileYear) {

      if (profileYear.tagName === "SELECT") {
        profileYear.value = year;
      } else {
        profileYear.textContent =
          year || "Not added";
      }
    }

    if (profileBio) {

      if (
        profileBio.tagName === "TEXTAREA" ||
        profileBio.tagName === "INPUT"
      ) {
        profileBio.value = bio;
      } else {
        profileBio.textContent =
          bio || "No bio added yet.";
      }
    }

    if (profilePhoto && photo) {
      profilePhoto.src = photo;
    }


    alert("Profile saved successfully! ✅");

  } catch (error) {

    console.error(error);

    alert(
      "Could not save profile: " +
      error.message
    );
  }
};


/* =====================================================
   CREATE POST
===================================================== */

window.createPost = async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  try {

    const input =
      document.getElementById("postText");

    const text =
      input?.value.trim();

    if (!text) {
      alert("Please write something first.");
      return;
    }

    const profileSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    const profile =
      profileSnap.exists()
        ? profileSnap.data()
        : {};


    await addDoc(
      collection(db, "posts"),
      {
        content: text,
        userId: user.uid,
        userEmail: user.email,
        userName:
          profile.fullName ||
          user.displayName ||
          user.email,

        createdAt: serverTimestamp(),

        likes: [],
        comments: []
      }
    );


    input.value = "";

  } catch (error) {

    console.error(error);

    alert(
      "Could not create post: " +
      error.message
    );
  }
};


/* =====================================================
   LIKE / UNLIKE
===================================================== */

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

      await updateDoc(postRef, {
        likes:
          arrayRemove(user.email)
      });

    } else {

      await updateDoc(postRef, {
        likes:
          arrayUnion(user.email)
      });
    }

  } catch (error) {

    console.error(error);

    alert(
      "Like failed: " +
      error.message
    );
  }
};


/* =====================================================
   ADD COMMENT
===================================================== */

window.addComment = async function (postId) {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  try {

    const input =
      document.getElementById(
        "commentInput-" + postId
      );

    const text =
      input?.value.trim();

    if (!text) {
      return;
    }


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
      "Comment failed: " +
      error.message
    );
  }
};


/* =====================================================
   SHARE POST
===================================================== */

window.sharePost = async function (postId) {

  const shareData = {

    title:
      "Sociology Connect",

    text:
      "Check this post on Sociology Connect.",

    url:
      window.location.href +
      "#post-" +
      postId
  };


  try {

    if (navigator.share) {

      await navigator.share(
        shareData
      );

    } else {

      await navigator.clipboard.writeText(
        shareData.url
      );

      alert(
        "Post link copied! 📋"
      );
    }

  } catch (error) {

    console.log(
      "Share cancelled or unavailable."
    );
  }
};


/* =====================================================
   REAL-TIME POSTS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const box =
      document.getElementById(
        "postsContainer"
      );

    if (!box) {
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

        box.innerHTML = "";

        const posts = [];


        snapshot.forEach(
          (docSnap) => {

            posts.push({
              id: docSnap.id,
              ...docSnap.data()
            });

          }
        );


        posts.forEach(
          (post) => {

            const likes =
              post.likes?.length || 0;

            let commentsHTML = "";


            (post.comments || [])
              .forEach(
                (comment) => {

                  commentsHTML += `
                    <div style="
                      background:#f1f3f5;
                      padding:8px;
                      margin:5px 0;
                      border-radius:8px;
                    ">
                      <b>
                        ${comment.userEmail || "Student"}
                      </b>
                      <br>
                      ${comment.text || ""}
                    </div>
                  `;
                }
              );


            const postHTML = `

              <article
                id="post-${post.id}"
                style="
                  background:white;
                  padding:18px;
                  margin:15px 0;
                  border-radius:14px;
                  box-shadow:0 2px 8px rgba(0,0,0,.08);
                "
              >

                <small style="color:#666;">
                  👤
                  <b>
                    ${post.userName ||
                      post.userEmail ||
                      "Student"}
                  </b>
                </small>

                <p style="
                  margin:12px 0;
                  line-height:1.5;
                  font-size:16px;
                ">
                  ${post.content || ""}
                </p>


                <div style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                  border-top:1px solid #eee;
                  padding-top:10px;
                ">

                  <button
                    onclick="likePost('${post.id}')"
                  >
                    ❤️ ${likes}
                  </button>

                  <button
                    onclick="sharePost('${post.id}')"
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
                      type="text"
                      placeholder="Write a comment..."
                      style="
                        flex:1;
                        padding:10px;
                        border:1px solid #ccc;
                        border-radius:8px;
                      "
                    >

                    <button
                      onclick="addComment('${post.id}')"
                    >
                      Send
                    </button>

                  </div>

                </div>

              </article>

            `;


            box.insertAdjacentHTML(
              "beforeend",
              postHTML
            );

          }
        );


        updateTrending(posts);

      },

      (error) => {

        console.error(
          "Posts error:",
          error
        );

        box.innerHTML = `
          <p style="color:red;">
            Could not load posts.
          </p>
        `;
      }
    );

  }
);


/* =====================================================
   TRENDING POSTS
===================================================== */

function updateTrending(posts) {

  const trending =
    document.getElementById(
      "trending"
    );

  if (!trending) {
    return;
  }


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


  trending.innerHTML =
    "<h2>🔥 Trending Posts</h2>";


  sorted
    .slice(0, 3)
    .forEach(
      (post) => {

        trending.innerHTML += `

          <div class="card"
               style="
                 background:white;
                 padding:12px;
                 margin:8px 0;
                 border-radius:10px;
               ">

            <b>
              ${post.userName ||
                post.userEmail ||
                "Student"}
            </b>

            <p>
              ${post.content || ""}
            </p>

            <small>
              ❤️ ${post.likes?.length || 0}
              &nbsp;
              💬 ${post.comments?.length || 0}
            </small>

          </div>

        `;
      }
    );
}


/* =====================================================
   ADMIN CHECK
===================================================== */

window.isAdmin = function () {

  return (
    auth.currentUser?.email ===
    "admin@sociologyconnect.com"
  );
};
