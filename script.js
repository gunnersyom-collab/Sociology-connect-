
/* =========================================================
   SOCIOLOGY CONNECT 2.0
   SCRIPT.JS
   PART 1
   IMPORTS
   ELEMENTS
   GLOBAL STATE
   HELPERS
   AUTH
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

/* ELEMENTS */

const chatHistory = document.getElementById("chat-history");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const themeBtn = document.getElementById("themeBtn");
const searchBar = document.getElementById("searchBar");
const notifyBtn = document.getElementById("notifyBtn");
const postsContainer = document.getElementById("postsContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginLink = document.getElementById("loginLink");
const userInfo = document.getElementById("userInfo");

/* GLOBAL STATE */

let currentUser = null;
let authReady = false;

const ADMIN_EMAIL = "yom@gmail.com";

/* ADMIN CHECK */

function isAdmin() {
  return currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ESCAPE HTML */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* FORMAT TIME */

function formatPostTime(timestamp) {
  if (!timestamp) return "Just now";

  try {
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    }
  } catch (e) {
    console.warn(e);
  }

  return "Just now";
}

/* GET USER NAME */

async function getUserName(user) {
  if (!user) return "Student";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const data = snap.data();
      return data.fullName ||
        data.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";
    }
  } catch (e) {
    console.warn(e);
  }

  return user.displayName ||
    user.email?.split("@")[0] ||
    "Student";
}

/* AUTH STATE */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;
  authReady = true;

  if (user) {

    const name = await getUserName(user);

    if (userInfo) userInfo.textContent = "👤 " + name;
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    if (document.readyState !== "loading") {
      createAdminControls();
    }

  } else {

    if (userInfo) userInfo.textContent = "";
    if (loginLink) loginLink.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";

    if (typeof removeAdminControls === "function") {
      removeAdminControls();
    }
  }

});
/* =========================================================
   PART 2
   CREATE POST
   LIKE
   COMMENT
   SHARE
   DELETE
   ADMIN
========================================================= */

/* CREATE POST */

async function createPost() {

  if (!postInput) return;
  if (!authReady) return alert("Please wait...");
  if (!currentUser) return alert("Please login first.");

  const text = postInput.value.trim();
  if (!text) return alert("Write something first.");

  postBtn.disabled = true;
  postBtn.textContent = "Posting...";

  try {

    const name = await getUserName(currentUser);

    await addDoc(collection(db, "posts"), {
      text,
      userId: currentUser.uid,
      name,
      email: currentUser.email || "",
      createdAt: serverTimestamp()
    });

    postInput.value = "";

  } catch (e) {

    alert(e.message);
    console.error(e);

  } finally {

    postBtn.disabled = false;
    postBtn.textContent = "📤 Post";

  }

}

postBtn?.addEventListener("click", createPost);

postInput?.addEventListener("keydown", (e) => {

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    createPost();
  }

});

/* LIKE */

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

async function updateLikeButton(postId, likeBtn) {

  if (!likeBtn) return;

  try {

    const likes = await getDocs(collection(db, "posts", postId, "likes"));

    const count = likes.size;

    const liked =
      currentUser &&
      likes.docs.some(item => item.id === currentUser.uid);

    likeBtn.textContent =
      liked
        ? `❤️ Liked (${count})`
        : `🤍 Like (${count})`;

  } catch (e) {
    console.error(e);
  }

}

/* COMMENT */

async function commentPost(postId) {

  if (!currentUser) {
    alert("Please login first.");
    return false;
  }

  const text = prompt("Write your comment:");
  if (!text || !text.trim()) return false;

  try {

    const name = await getUserName(currentUser);

    await addDoc(collection(db, "posts", postId, "comments"), {
      text: text.trim(),
      userId: currentUser.uid,
      name,
      createdAt: serverTimestamp()
    });

    return true;

  } catch (e) {

    alert(e.message);
    console.error(e);

    return false;
  }

}

async function loadComments(postId, commentBtn, card, show = false) {

  if (!card) return;

  try {

    const snap = await getDocs(collection(db, "posts", postId, "comments"));

    if (commentBtn) {
      commentBtn.textContent = `💬 Comment (${snap.size})`;
    }

    card.querySelector(".comments-box")?.remove();

    if (!show || snap.empty) return;

    const box = document.createElement("div");
    box.className = "comments-box";
    box.style.marginTop = "12px";
    box.style.padding = "10px";
    box.style.borderTop = "1px solid #ddd";

    [...snap.docs]
      .sort((a, b) => {
        const x = a.data().createdAt?.toMillis?.() || 0;
        const y = b.data().createdAt?.toMillis?.() || 0;
        return x - y;
      })
      .forEach(item => {

        const c = item.data();

        const div = document.createElement("div");
        div.style.padding = "8px 0";
        div.style.borderBottom = "1px solid #eee";

        div.innerHTML = `
          <strong>${escapeHTML(c.name || "Student")}</strong>
          <br>
          ${escapeHTML(c.text || "")}
        `;

        box.appendChild(div);

      });

    card.appendChild(box);

  } catch (e) {
    console.error(e);
  }

}

/* SHARE */

async function sharePost(postId, text) {

  const url =
    window.location.href.split("#")[0] +
    "#post-" + postId;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Sociology Connect",
        text,
        url
      });

    } else if (navigator.clipboard) {

      await navigator.clipboard.writeText(url);
      alert("Post link copied.");

    }

  } catch (e) {
    console.warn(e);
  }

}

/* DELETE */

async function deletePost(postId, ownerId) {

  if (!currentUser) return alert("Login first.");

  if (!(isAdmin() || currentUser.uid === ownerId)) {
    return alert("You can delete only your own post.");
  }

  if (!confirm("Delete this post?")) return;

  try {

    const likes = await getDocs(collection(db, "posts", postId, "likes"));
    for (const item of likes.docs) await deleteDoc(item.ref);

    const comments = await getDocs(collection(db, "posts", postId, "comments"));
    for (const item of comments.docs) await deleteDoc(item.ref);

    await deleteDoc(doc(db, "posts", postId));

  } catch (e) {
    alert(e.message);
  }

}

/* CLEAR ALL POSTS */

async function clearAllPosts() {

  if (!isAdmin()) return alert("Admin only.");

  if (!confirm("Delete ALL posts?")) return;

  const posts = await getDocs(collection(db, "posts"));

  for (const post of posts.docs) {
    await deletePost(post.id, post.data().userId);
  }

  alert("All posts deleted.");

}

/* ADMIN */

function createAdminControls() {

  if (!isAdmin()) return;

  if (document.getElementById("adminControls")) return;

  const composer = document.querySelector(".post-composer");
  if (!composer) return;

  const div = document.createElement("div");
  div.id = "adminControls";

  div.innerHTML = `
    <hr>
    <strong>👑 Admin Controls</strong>
    <br><br>
    <button id="adminClearPostsBtn"
      style="background:#dc3545;color:#fff;border:none;padding:10px 15px;border-radius:8px;cursor:pointer;">
      🧹 Clear All Posts
    </button>
  `;

  composer.appendChild(div);

  document
    .getElementById("adminClearPostsBtn")
    ?.addEventListener("click", clearAllPosts);

}

function removeAdminControls() {
  document.getElementById("adminControls")?.remove();
}
/* =========================================================
   PART 3
   LOAD POSTS
   TRENDING POSTS
========================================================= */

/* LOAD POSTS */

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
          No posts yet. Be the first student to post! 📚
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

          <button class="comment-btn">💬 Comment (0)</button>

          <button class="share-btn">📤 Share</button>

          ${canDelete ? `
            <button class="delete-btn" style="color:#dc3545">
              🗑️ Delete
            </button>` : ""}

        </div>
      `;

      postsContainer.appendChild(card);

      const likeBtn = card.querySelector(".like-btn");
      const commentBtn = card.querySelector(".comment-btn");
      const shareBtn = card.querySelector(".share-btn");
      const deleteBtn = card.querySelector(".delete-btn");

      likeBtn?.addEventListener("click", () => {
        toggleLike(postId, likeBtn);
      });

      commentBtn?.addEventListener("click", async () => {

        const added = await commentPost(postId);

        await loadComments(postId, commentBtn, card, added);

        loadTrendingPosts();

      });

      shareBtn?.addEventListener("click", () => {
        sharePost(postId, post.text || "");
      });

      deleteBtn?.addEventListener("click", async () => {

        await deletePost(postId, post.userId);

        loadTrendingPosts();

      });

      await updateLikeButton(postId, likeBtn);
      await loadComments(postId, commentBtn, card, false);

    }

    loadTrendingPosts();

  }, (error) => {

    console.error("LOAD POSTS ERROR:", error);

    postsContainer.innerHTML = `
      <div class="post-card">
        ❌ Unable to load posts.
      </div>
    `;

  });

}

/* TRENDING POSTS */

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

      const likes =
        (await getDocs(collection(db, "posts", postDoc.id, "likes"))).size;

      const comments =
        (await getDocs(collection(db, "posts", postDoc.id, "comments"))).size;

      posts.push({
        id: postDoc.id,
        name: post.name || "Student",
        text: post.text || "",
        likes,
        comments,
        score: likes + comments
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
            <div class="post-name">${escapeHTML(post.name)}</div>
            <div class="post-time">🔥 Trending</div>
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

/* LOAD NEWS */

function loadNews() {

  const newsContainer = document.getElementById("newsContainer");

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

    snapshot.forEach((docSnap) => {

      const news = docSnap.data();

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>📢 ${escapeHTML(news.title || "Latest News")}</h3>

        <p>${escapeHTML(news.description || "")}</p>

        ${
          news.createdAt
            ? `<small>🕐 ${formatPostTime(news.createdAt)}</small>`
            : ""
        }
      `;

      newsContainer.appendChild(card);

    });

  }, (error) => {

    console.error("NEWS ERROR:", error);

    newsContainer.innerHTML = `
      <div class="card">
        ❌ Unable to load news.
      </div>
    `;

  });

}

/* LOAD EVENTS */

function loadEvents() {

  const eventsContainer = document.getElementById("eventsContainer");

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

    snapshot.forEach((docSnap) => {

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

  }, (error) => {

    console.error("EVENTS ERROR:", error);

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

const chatMessages = [];

/* SEND MESSAGE */

async function sendToServer() {

  if (!chatHistory || !userInput || !sendBtn) return;

  const text = userInput.value.trim();
  if (!text) return;

  chatMessages.push({
    role: "user",
    content: text
  });

  const userBox = document.createElement("div");
  userBox.className = "message user";
  userBox.innerHTML = `<b>You:</b><br>${escapeHTML(text)}`;
  chatHistory.appendChild(userBox);

  userInput.value = "";

  const aiBox = document.createElement("div");
  aiBox.className = "message ai";
  aiBox.innerHTML = `
    <b>AI Mari:</b><br>
    <span class="ai-text">Typing... 🤖</span>
  `;
  chatHistory.appendChild(aiBox);

  chatHistory.scrollTop = chatHistory.scrollHeight;

  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";

  try {

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai",
        messages: chatMessages
      })
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "No response.";

    chatMessages.push({
      role: "assistant",
      content: reply
    });

    aiBox.innerHTML = `
      <b>AI Mari:</b><br>
      <span class="ai-text">${escapeHTML(reply)}</span>
      <br><br>
      <button class="copy-btn">📋 Copy</button>
    `;

    aiBox.querySelector(".copy-btn")
      ?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(reply);
        } catch {
          alert("Copy failed.");
        }
      });

  } catch (error) {

    console.error("AI ERROR:", error);

    aiBox.innerHTML = `
      <b>AI Mari:</b><br>
      ❌ Connection failed.
    `;

  } finally {

    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    chatHistory.scrollTop = chatHistory.scrollHeight;

  }

}

/* BUTTON */

sendBtn?.addEventListener("click", sendToServer);

/* ENTER */

userInput?.addEventListener("keydown", (e) => {

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

/* UPDATE THEME BUTTON */

function updateThemeButton() {

  if (!themeBtn) return;

  themeBtn.textContent =
    document.body.classList.contains("dark")
      ? "☀️"
      : "🌙";

}

/* APPLY SAVED THEME */

function applySavedTheme() {

  const saved = localStorage.getItem("sociologyTheme");

  if (saved === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  updateThemeButton();

}

/* TOGGLE THEME */

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

/* SEARCH */

function searchWebsite() {

  if (!searchBar) return;

  const q = searchBar.value.toLowerCase().trim();

  let count = 0;

  const items = document.querySelectorAll(
    "#postsContainer > div, #news .card, #events .event-card, #trendingContainer .post-card"
  );

  items.forEach(item => {

    const text = item.textContent.toLowerCase();

    const show = !q || text.includes(q);

    item.style.display = show ? "" : "none";

    if (show) count++;

  });

  const counter = document.getElementById("searchCount");

  if (counter) {
    counter.textContent = q ? `${count} results found` : "";
  }

}

searchBar?.addEventListener("input", searchWebsite);

/* =========================================================
   PART 7
   NOTIFICATIONS
   VOICE
   LOGOUT
   SHORTCUTS
   START
========================================================= */

/* NOTIFICATIONS */

function updateNotificationBadge() {

  if (!notifyBtn) return;

  let list = [];

  try {
    list = JSON.parse(localStorage.getItem("sc_notify")) || [];
  } catch {
    list = [];
  }

  notifyBtn.innerHTML = list.length
    ? `🔔 <span style="color:red">${list.length}</span>`
    : "🔔";
}

function showNotifications() {

  let list = [];

  try {
    list = JSON.parse(localStorage.getItem("sc_notify")) || [];
  } catch {
    list = [];
  }

  alert(list.length ? list.join("\n\n") : "🔔 No new notifications.");
}

notifyBtn?.addEventListener("click", showNotifications);

/* VOICE RECOGNITION */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn?.addEventListener("click", () => {

    try {
      recognition.start();
      micBtn.textContent = "🔴";
    } catch (e) {
      console.warn(e);
    }

  });

  recognition.onresult = (e) => {

    if (userInput) {
      userInput.value = e.results[0][0].transcript;
    }

    micBtn.textContent = "🎤";
  };

  recognition.onend = () => {
    micBtn.textContent = "🎤";
  };

  recognition.onerror = () => {
    micBtn.textContent = "🎤";
  };
}

/* LOGOUT */

logoutBtn?.addEventListener("click", async () => {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  } catch (error) {

    console.error(error);

    alert(error.message);

  }

});

/* SHORTCUT */

document.addEventListener("keydown", (e) => {

  if (e.ctrlKey && e.key.toLowerCase() === "k") {

    e.preventDefault();

    searchBar?.focus();

  }

});

/* START APPLICATION */

document.addEventListener("DOMContentLoaded", () => {

  console.log("🚀 Sociology Connect starting...");

  applySavedTheme();
  updateNotificationBadge();

  loadPosts();
  loadNews();
  loadEvents();

  console.log("✅ Sociology Connect Ready");

});

