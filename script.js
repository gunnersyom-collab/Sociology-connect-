/* =========================================================
   SOCIOLOGY CONNECT 2.0 - SCRIPT.JS
   PART 1
   IMPORTS
   ELEMENTS
   GLOBAL STATE
   AUTH
   HELPERS
========================================================= */

import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* ================= ELEMENTS ================= */

const chatHistory =
  document.getElementById("chat-history");

const userInput =
  document.getElementById("userInput");

const sendBtn =
  document.getElementById("sendBtn");

const micBtn =
  document.getElementById("micBtn");

const themeBtn =
  document.getElementById("themeBtn");

const searchBar =
  document.getElementById("searchBar");

const notifyBtn =
  document.getElementById("notifyBtn");

const postsContainer =
  document.getElementById("postsContainer");

const postInput =
  document.getElementById("postInput");

const postBtn =
  document.getElementById("postBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const loginLink =
  document.getElementById("loginLink");

const userInfo =
  document.getElementById("userInfo");


/* ================= GLOBAL STATE ================= */

let currentUser = null;
let authReady = false;

const ADMIN_EMAIL = "yom@gmail.com";


/* ================= HELPERS ================= */

function isAdmin() {

  return (
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatPostTime(timestamp) {

  if (!timestamp) {
    return "Just now";
  }

  try {

    if (
      typeof timestamp.toDate ===
      "function"
    ) {

      return timestamp
        .toDate()
        .toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short"
        });

    }

  } catch (error) {

    console.warn(
      "Time format error:",
      error
    );

  }

  return "Just now";

}


/* ================= USER NAME ================= */

async function getUserName(user) {

  if (!user) {
    return "Student";
  }

  try {

    const snap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    if (snap.exists()) {

      const data = snap.data();

      return (
        data.fullName ||
        data.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student"
      );

    }

  } catch (error) {

    console.warn(
      "User name error:",
      error
    );

  }

  return (
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student"
  );

}


/* ================= AUTH ================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;
    authReady = true;

    if (user) {

      const name =
        await getUserName(user);

      if (userInfo) {

        userInfo.textContent =
          `👤 ${name}`;

      }

      if (loginLink) {
        loginLink.style.display =
          "none";
      }

      if (logoutBtn) {
        logoutBtn.style.display =
          "inline-block";
      }

      if (typeof createAdminControls === "function") {
        createAdminControls();
      }

    } else {

      if (userInfo) {
        userInfo.textContent = "";
      }

      if (loginLink) {
        loginLink.style.display =
          "inline-block";
      }

      if (logoutBtn) {
        logoutBtn.style.display =
          "none";
      }

      if (
        typeof removeAdminControls ===
        "function"
      ) {
        removeAdminControls();
      }

    }

  }
);

/* =========================================================
   PART 2
   LIKE
   COMMENT
   SHARE
   DELETE
   ADMIN CONTROLS
========================================================= */

/* ================= LIKE POST ================= */

async function toggleLike(postId, likeBtn) {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const likeRef = doc(db, "posts", postId, "likes", currentUser.uid);

  try {

    const snap = await getDoc(likeRef);

    if (snap.exists()) {

      await deleteDoc(likeRef);

    } else {

      await setDoc(likeRef, {
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });

    }

    await updateLikeButton(postId, likeBtn);

  } catch (e) {

    console.error(e);

  }

}

/* ================= UPDATE LIKE BUTTON ================= */

async function updateLikeButton(postId, likeBtn) {

  if (!likeBtn) return;

  try {

    const likesSnap = await getDocs(
      collection(db, "posts", postId, "likes")
    );

    const count = likesSnap.size;

    const liked =
      currentUser &&
      likesSnap.docs.some(d => d.id === currentUser.uid);

    likeBtn.textContent = liked
      ? `❤️ Liked (${count})`
      : `🤍 Like (${count})`;

  } catch {}

}

/* ================= COMMENT POST ================= */

async function commentPost(postId) {

  if (!currentUser) {
    alert("Please login first.");
    return false;
  }

  const text = prompt("Write your comment:");

  if (!text || !text.trim()) return false;

  try {

    const name = await getUserName(currentUser);

    await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        text: text.trim(),
        userId: currentUser.uid,
        name,
        createdAt: serverTimestamp()
      }
    );

    return true;

  } catch (e) {

    console.error(e);
    return false;

  }

}

/* ================= LOAD COMMENTS ================= */

async function loadComments(
  postId,
  commentBtn,
  card,
  show = false
) {

  try {

    const snap = await getDocs(
      collection(db, "posts", postId, "comments")
    );

    commentBtn &&
      (commentBtn.textContent = `💬 Comment (${snap.size})`);

    card.querySelector(".comments-box")?.remove();

    if (!show || snap.empty) return;

    const box = document.createElement("div");
    box.className = "comments-box";

    box.style.marginTop = "12px";
    box.style.padding = "10px";
    box.style.borderTop = "1px solid #ddd";

    const comments = [...snap.docs].sort((a, b) => {
      return (
        (a.data().createdAt?.toMillis?.() || 0) -
        (b.data().createdAt?.toMillis?.() || 0)
      );
    });

    comments.forEach(item => {

      const data = item.data();

      const div = document.createElement("div");

      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";

      div.innerHTML = `
        <strong>${escapeHTML(data.name || "Student")}</strong>
        <br>
        ${escapeHTML(data.text || "")}
      `;

      box.appendChild(div);

    });

    card.appendChild(box);

  } catch (e) {

    console.error(e);

  }

}

/* ================= SHARE POST ================= */

async function sharePost(postId, text) {

  const url =
    window.location.href.split("#")[0] +
    "#post-" +
    postId;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Sociology Connect",
        text,
        url
      });

      return;
    }

    await navigator.clipboard.writeText(url);

    alert("Post link copied.");

  } catch {}

}

/* ================= DELETE POST ================= */

async function deletePost(postId, ownerId) {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (!(isAdmin() || currentUser.uid === ownerId)) {
    alert("You can delete only your own post.");
    return;
  }

  if (!confirm("Delete this post?")) return;

  try {

    const likes = await getDocs(
      collection(db, "posts", postId, "likes")
    );

    for (const d of likes.docs) {
      await deleteDoc(d.ref);
    }

    const comments = await getDocs(
      collection(db, "posts", postId, "comments")
    );

    for (const d of comments.docs) {
      await deleteDoc(d.ref);
    }

    await deleteDoc(doc(db, "posts", postId));

  } catch (e) {

    console.error(e);

  }

}

/* ================= CLEAR ALL POSTS (ADMIN) ================= */

async function clearAllPosts() {

  if (!isAdmin()) {
    alert("Admin only.");
    return;
  }

  if (!confirm("Delete ALL posts?")) return;

  const posts = await getDocs(collection(db, "posts"));

  for (const post of posts.docs) {

    const id = post.id;

    const likes = await getDocs(
      collection(db, "posts", id, "likes")
    );

    for (const d of likes.docs) {
      await deleteDoc(d.ref);
    }

    const comments = await getDocs(
      collection(db, "posts", id, "comments")
    );

    for (const d of comments.docs) {
      await deleteDoc(d.ref);
    }

    await deleteDoc(post.ref);

  }

  alert("All posts deleted.");

}

/* ================= ADMIN CONTROLS ================= */

function createAdminControls() {

  if (!isAdmin()) return;

  if (document.getElementById("adminControls")) return;

  const composer =
    document.querySelector(".post-composer");

  if (!composer) return;

  const div = document.createElement("div");

  div.id = "adminControls";

  div.innerHTML = `
    <hr>
    <strong>👑 Admin Controls</strong><br><br>

    <button id="adminClearPostsBtn"
      style="
        background:#dc3545;
        color:#fff;
        border:none;
        padding:10px 15px;
        border-radius:8px;
        cursor:pointer;
      ">
      🧹 Clear All Posts
    </button>
  `;

  composer.appendChild(div);

  document
    .getElementById("adminClearPostsBtn")
    ?.addEventListener("click", clearAllPosts);

}

function removeAdminControls() {

  document
    .getElementById("adminControls")
    ?.remove();

}
/* =========================================================
   PART 3
   LOAD POSTS
   TRENDING POSTS
========================================================= */

/* ================= LOAD POSTS ================= */

function loadPosts() {

  if (!postsContainer) return;

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(postsQuery, async (snapshot) => {

    postsContainer.innerHTML = "";

    if (snapshot.empty) {
      postsContainer.innerHTML = `
        <div class="post-card">
          <p>No posts yet. Be the first student to post! 📚</p>
        </div>
      `;
      loadTrendingPosts();
      return;
    }

    for (const postDoc of snapshot.docs) {

      const post = postDoc.data();
      const postId = postDoc.id;
      const name = post.name || "Student";

      const card = document.createElement("div");
      card.className = "post-card";
      card.id = "post-" + postId;

      const canDelete =
        currentUser &&
        (isAdmin() || currentUser.uid === post.userId);

      card.innerHTML = `
        <div class="post-header">

          <div class="post-avatar">
            ${escapeHTML(name.charAt(0).toUpperCase())}
          </div>

          <div>
            <div class="post-name">${escapeHTML(name)}</div>
            <div class="post-time">
              🕐 ${formatPostTime(post.createdAt)}
            </div>
          </div>

        </div>

        <div class="post-text">
          ${escapeHTML(post.text || "")}
        </div>

        <div class="post-actions">

          <button class="like-btn">🤍 Like (0)</button>

          <button class="comment-btn">
            💬 Comment (0)
          </button>

          <button class="share-btn">
            📤 Share
          </button>

          ${canDelete
            ? `<button class="delete-btn" style="color:#dc3545;">🗑️ Delete</button>`
            : ""
          }

        </div>
      `;

      postsContainer.appendChild(card);

      const likeBtn = card.querySelector(".like-btn");
      const commentBtn = card.querySelector(".comment-btn");
      const shareBtn = card.querySelector(".share-btn");
      const deleteBtn = card.querySelector(".delete-btn");

      likeBtn?.addEventListener("click", () =>
        toggleLike(postId, likeBtn)
      );

      commentBtn?.addEventListener("click", async () => {
        const added = await commentPost(postId);
        await loadComments(postId, commentBtn, card, added);
        loadTrendingPosts();
      });

      shareBtn?.addEventListener("click", () =>
        sharePost(postId, post.text || "")
      );

      deleteBtn?.addEventListener("click", async () => {
        await deletePost(postId, post.userId);
        loadTrendingPosts();
      });

      await updateLikeButton(postId, likeBtn);
      await loadComments(postId, commentBtn, card, false);

    }

    loadTrendingPosts();

/* ================= LOAD POSTS ================= */

function loadPosts() {

  if (!postsContainer) {
    console.warn("⚠️ postsContainer not found");
    return;
  }

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    postsQuery,
    async (snapshot) => {

      postsContainer.innerHTML = "";

      if (snapshot.empty) {

        postsContainer.innerHTML = `
          <div class="post-card">
            <p>
              No posts yet. Be the first student to post! 📚
            </p>
          </div>
        `;

        return;
      }

      for (const postDoc of snapshot.docs) {

        const post = postDoc.data();
        const postId = postDoc.id;

        const name =
          post.name ||
          "Student";

        const card =
          document.createElement("div");

        card.className = "post-card";
        card.id = "post-" + postId;

        const canDelete =
          currentUser &&
          (
            isAdmin() ||
            currentUser.uid === post.userId
          );

        card.innerHTML = `
          <div class="post-header">

            <div class="post-avatar">
              ${escapeHTML(
                name.charAt(0).toUpperCase()
              )}
            </div>

            <div>

              <div class="post-name">
                ${escapeHTML(name)}
              </div>

              <div class="post-time">
                🕐 ${formatPostTime(post.createdAt)}
              </div>

            </div>

          </div>

          <div class="post-text">
            ${escapeHTML(post.text || "")}
          </div>

          <div class="post-actions">

            <button
              type="button"
              class="like-btn">
              🤍 Like (0)
            </button>

            <button
              type="button"
              class="comment-btn">
              💬 Comment (0)
            </button>

            <button
              type="button"
              class="share-btn">
              📤 Share
            </button>

            ${
              canDelete
                ? `
                  <button
                    type="button"
                    class="delete-btn"
                    style="color:#dc3545;">
                    🗑️ Delete
                  </button>
                `
                : ""
            }

          </div>
        `;

        postsContainer.appendChild(card);

        /* ================= BUTTONS ================= */

        const likeBtn =
          card.querySelector(".like-btn");

        const commentBtn =
          card.querySelector(".comment-btn");

        const shareBtn =
          card.querySelector(".share-btn");

        const deleteBtn =
          card.querySelector(".delete-btn");

        /* ================= LIKE ================= */

        likeBtn?.addEventListener(
          "click",
          () => {
            toggleLike(
              postId,
              likeBtn
            );
          }
        );

        /* ================= COMMENT ================= */

        commentBtn?.addEventListener(
          "click",
          async () => {

            const added =
              await commentPost(postId);

            await loadComments(
              postId,
              commentBtn,
              card,
              added
            );

            loadTrendingPosts();

          }
        );

        /* ================= SHARE ================= */

        shareBtn?.addEventListener(
          "click",
          () => {

            sharePost(
              postId,
              post.text || ""
            );

          }
        );

        /* ================= DELETE ================= */

        deleteBtn?.addEventListener(
          "click",
          async () => {

            await deletePost(
              postId,
              post.userId
            );

            loadTrendingPosts();

          }
        );

        /* ================= COUNTS ================= */

        await updateLikeButton(
          postId,
          likeBtn
        );

        await loadComments(
          postId,
          commentBtn,
          card,
          false
        );

      }

      console.log(
        "✅ Posts loaded:",
        snapshot.size
      );

      loadTrendingPosts();

    },

    (error) => {

      console.error(
        "❌ LOAD POSTS ERROR:",
        error
      );

      postsContainer.innerHTML = `
        <div class="post-card">
          ❌ Unable to load posts.
          <br><br>
          <small>
            Please login and try again.
          </small>
        </div>
      `;

    }
  );
}

/* ================= TRENDING POSTS ================= */

async function loadTrendingPosts() {

  const trendingContainer =
    document.getElementById("trendingContainer");

  if (!trendingContainer) return;

  try {

    const postsSnapshot =
      await getDocs(collection(db, "posts"));

    if (postsSnapshot.empty) {

      trendingContainer.innerHTML = `
        <div class="post-card">
          🔥 No trending posts yet.
        </div>
      `;
      return;
    }

    const posts = [];

    for (const postDoc of postsSnapshot.docs) {

      const post = postDoc.data();

      const likesSnap =
        await getDocs(
          collection(db, "posts", postDoc.id, "likes")
        );

      const commentsSnap =
        await getDocs(
          collection(db, "posts", postDoc.id, "comments")
        );

      posts.push({
        id: postDoc.id,
        name: post.name || "Student",
        text: post.text || "",
        likes: likesSnap.size,
        comments: commentsSnap.size,
        score: likesSnap.size + commentsSnap.size
      });

    }

    posts.sort((a, b) => b.score - a.score);

    trendingContainer.innerHTML = "";

    posts.slice(0, 5).forEach(post => {

      const card = document.createElement("div");
      card.className = "post-card";

      card.innerHTML = `
        <div class="post-header">

          <div class="post-avatar">
            ${escapeHTML(post.name.charAt(0).toUpperCase())}
          </div>

          <div>
            <div class="post-name">
              ${escapeHTML(post.name)}
            </div>

            <div class="post-time">
              🔥 Trending
            </div>
          </div>

        </div>

        <div class="post-text">
          ${escapeHTML(post.text)}
        </div>

        <div class="post-actions">

          <button disabled>❤️ ${post.likes}</button>

          <button disabled>💬 ${post.comments}</button>

          <button disabled>🔥 Popular</button>

        </div>
      `;

      trendingContainer.appendChild(card);

    });

  } catch (error) {

    console.error("TRENDING ERROR:", error);

    trendingContainer.innerHTML = `
      <div class="post-card">
        ❌ Unable to load trending posts.
      </div>
    `;

  }

}

/* =========================================================
   PART 4
   NEWS
   EVENTS
========================================================= */

/* ================= LOAD NEWS ================= */

function loadNews() {

  const newsContainer =
    document.getElementById("newsContainer");

  if (!newsContainer) return;

  const newsQuery = query(
    collection(db, "news"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(newsQuery, (snapshot) => {

    newsContainer.innerHTML = "";

    if (snapshot.empty) {

      newsContainer.innerHTML = `
        <div class="card">
          📰 No latest news available yet.
        </div>
      `;
      return;

    }

    snapshot.forEach(docSnap => {

      const news = docSnap.data();

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>📢 ${escapeHTML(news.title || "Latest News")}</h3>

        <p>${escapeHTML(news.description || "")}</p>

        ${
          news.createdAt
            ? `<small style="color:#777;">
                 🕐 ${formatPostTime(news.createdAt)}
               </small>`
            : ""
        }
      `;

      newsContainer.appendChild(card);

    });

  }, () => {

    newsContainer.innerHTML = `
      <div class="card">
        ❌ Unable to load news.
      </div>
    `;

  });

}

/* ================= LOAD EVENTS ================= */

function loadEvents() {

  const eventsContainer =
    document.getElementById("eventsContainer");

  if (!eventsContainer) return;

  const eventsQuery = query(
    collection(db, "events"),
    orderBy("date", "asc")
  );

  onSnapshot(eventsQuery, (snapshot) => {

    eventsContainer.innerHTML = "";

    if (snapshot.empty) {

      eventsContainer.innerHTML = `
        <div class="event-card">
          📅 No events available.
        </div>
      `;
      return;

    }

    snapshot.forEach(docSnap => {

      const event = docSnap.data();

      const card = document.createElement("div");
      card.className = "event-card";

      card.innerHTML = `
        <strong>📅 ${escapeHTML(event.title || "Event")}</strong>

        <br><br>

        ${escapeHTML(event.description || "")}

        ${
          event.date
            ? `<br><br><small>📅 ${escapeHTML(event.date)}</small>`
            : ""
        }
      `;

      eventsContainer.appendChild(card);

    });

  }, () => {

    eventsContainer.innerHTML = `
      <div class="event-card">
        ❌ Unable to load events.
      </div>
    `;

  });

}
/* =========================================================
   PART 5
   AI MARI
========================================================= */

async function sendToServer() {

  if (!chatHistory || !userInput) return;

  const text = userInput.value.trim();

  if (!text) return;

  const userBox = document.createElement("div");
  userBox.className = "message user";
  userBox.innerHTML = `<b>You:</b> ${escapeHTML(text)}`;

  chatHistory.appendChild(userBox);

  userInput.value = "";

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML =
    "<b>AI Mari:</b><br><i>Typing... 🤖</i>";

  chatHistory.appendChild(loading);

  chatHistory.scrollTop = chatHistory.scrollHeight;

  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";

  try {

    const response = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai`
    );

    const reply = await response.text();

    loading.remove();

    const aiBox = document.createElement("div");
    aiBox.className = "message ai";

    aiBox.innerHTML = `
      <b>AI Mari:</b><br>

      <span class="ai-text">
        ${escapeHTML(reply)}
      </span>

      <br><br>

      <button class="copy-btn">📋 Copy</button>
    `;

    aiBox.querySelector(".copy-btn")
      .addEventListener("click", async () => {

        await navigator.clipboard.writeText(reply);

        const btn =
          aiBox.querySelector(".copy-btn");

        btn.textContent = "✅ Copied";

        setTimeout(() => {
          btn.textContent = "📋 Copy";
        }, 1500);

      });

    chatHistory.appendChild(aiBox);

  } catch {

    loading.innerHTML =
      "<b>AI Mari:</b><br>❌ Connection failed.";

  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";

  chatHistory.scrollTop = chatHistory.scrollHeight;

}

sendBtn?.addEventListener("click", sendToServer);

userInput?.addEventListener("keydown", e => {

  if (e.key === "Enter" && !e.shiftKey) {

    e.preventDefault();

    sendToServer();

  }

});
/* =========================================================
   PART 6
   DARK MODE
   SEARCH
========================================================= */

function updateThemeButton() {

  if (!themeBtn) return;

  themeBtn.textContent =
    document.body.classList.contains("dark")
      ? "☀️"
      : "🌙";

}

function applySavedTheme() {

  const saved =
    localStorage.getItem("sociologyTheme");

  if (saved === "dark") {
    document.body.classList.add("dark");
  }

  updateThemeButton();

}

function toggleTheme() {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "sociologyTheme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

  updateThemeButton();

}

themeBtn?.addEventListener("click", toggleTheme);

function searchWebsite() {

  if (!searchBar) return;

  const q =
    searchBar.value.toLowerCase().trim();

  let count = 0;

  document.querySelectorAll(
    "#postsContainer > div,#news .card,#events .event-card"
  ).forEach(item => {

    const show =
      item.textContent.toLowerCase().includes(q);

    item.style.display =
      !q || show ? "" : "none";

    if (!q || show) count++;

  });

  const counter =
    document.getElementById("searchCount");

  if (counter) {
    counter.textContent =
      q ? `${count} results found` : "";
  }

}

searchBar?.addEventListener("input", searchWebsite);

/* =========================================================
   PART 7
   NOTIFICATIONS
   VOICE
   LOGOUT
   START
========================================================= */

/* ================= NOTIFICATIONS ================= */

function updateNotificationBadge() {

  if (!notifyBtn) return;

  const list =
    JSON.parse(localStorage.getItem("sc_notify")) || [];

  notifyBtn.innerHTML =
    list.length
      ? `🔔 <span style="color:red">${list.length}</span>`
      : "🔔";

}

function showNotifications() {

  const list =
    JSON.parse(localStorage.getItem("sc_notify")) || [];

  alert(
    list.length
      ? list.join("\n\n")
      : "🔔 No new notifications."
  );

}

notifyBtn?.addEventListener("click", showNotifications);

/* ================= VOICE ================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";

  micBtn?.addEventListener("click", () => {

    recognition.start();

    micBtn.textContent = "🔴";

  });

  recognition.onresult = e => {

    userInput.value =
      e.results[0][0].transcript;

    micBtn.textContent = "🎤";

  };

  recognition.onend = () => {

    micBtn.textContent = "🎤";

  };

}

/* ================= LOGOUT ================= */

logoutBtn?.addEventListener("click", async () => {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  } catch (e) {

    alert(e.message);

  }

});

/* ================= SHORTCUT ================= */

document.addEventListener("keydown", e => {

  if (e.ctrlKey && e.key.toLowerCase() === "k") {

    e.preventDefault();

    searchBar?.focus();

  }

});

/* ================= START ================= */

document.addEventListener("DOMContentLoaded", () => {

  applySavedTheme();

  updateNotificationBadge();

  loadPosts();
  loadTrendingPosts();
  loadNews();
  loadEvents();

  console.log("✅ Sociology Connect 2.0 Ready");

});

