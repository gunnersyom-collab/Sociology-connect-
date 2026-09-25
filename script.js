/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
   PART 1
   FIREBASE IMPORTS
   ELEMENTS
   AUTH
   SECURITY
   CREATE POST
   ========================================================= */

/* =========================================================
   FIREBASE IMPORTS
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

/* =========================================================
   ELEMENTS
   ========================================================= */

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

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let authReady = false;

/* Admin email */
const ADMIN_EMAIL = "yom@gmail.com";

/* =========================================================
   ADMIN CHECK
   ========================================================= */

function isAdmin() {
  return (
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatPostTime(timestamp) {
  if (!timestamp) return "Just now";

  try {
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    }
  } catch (e) {}

  return "Just now";
}

/* =========================================================
   FIREBASE AUTH
   ========================================================= */

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;

  if (user) {
    console.log("✅ Logged in:", user.email);

    if (userInfo) {
      userInfo.textContent =
        "👤 " +
        (user.displayName ||
          user.email?.split("@")[0] ||
          "Student");
    }

    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    createAdminControls();
  } else {
    console.log("ℹ️ No user logged in.");

    if (userInfo) userInfo.textContent = "";

    if (loginLink) loginLink.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";

    removeAdminControls();
  }
});

/* =========================================================
   GET USER NAME
   ========================================================= */

async function getUserName(user) {
  if (!user) return "Student";

  try {
    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();

      return (
        data.fullName ||
        data.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student"
      );
    }
  } catch (error) {
    console.log("Profile not available:", error);
  }

  return (
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student"
  );
}

/* =========================================================
   CREATE POST
   ========================================================= */

async function createPost() {
  if (!postInput) return;

  if (!authReady) {
    alert("Please wait a moment and try again.");
    return;
  }

  const text = postInput.value.trim();

  if (!text) {
    alert("Write something first.");
    postInput.focus();
    return;
  }

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (postBtn) {
    postBtn.disabled = true;
    postBtn.textContent = "Posting...";
  }

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

    console.log("✅ Post created successfully.");

  } catch (error) {

    console.error("❌ CREATE POST ERROR:", error);

    alert("Post failed:\n\n" + error.message);

  } finally {

    if (postBtn) {
      postBtn.disabled = false;
      postBtn.textContent = "📤 Post";
    }
  }
}

/* Button click */

postBtn?.addEventListener("click", createPost);

/* Enter key */

postInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    createPost();
  }
});

/* =========================================================
   PART 2
   LIKE
   COMMENT
   SHARE
   DELETE
   ADMIN
   ========================================================= */

/* =========================================================
   LIKE POST
   ========================================================= */

async function toggleLike(postId, likeButton) {

  if (!currentUser) {
    alert("Please login to like a post.");
    return;
  }

  const likeRef = doc(db, "posts", postId, "likes", currentUser.uid);

  try {

    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      console.log("💔 Like removed.");
    } else {
      await setDoc(likeRef, {
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      console.log("❤️ Post liked.");
    }

    await updateLikeButton(postId, likeButton);

  } catch (error) {
    console.error("❌ LIKE ERROR:", error);
    alert("Like failed:\n\n" + error.message);
  }
}

/* =========================================================
   UPDATE LIKE BUTTON
   ========================================================= */

async function updateLikeButton(postId, likeButton) {

  if (!likeButton) return;

  try {

    const likesRef = collection(db, "posts", postId, "likes");
    const likesSnap = await getDocs(likesRef);

    const count = likesSnap.size;

    const liked =
      currentUser &&
      likesSnap.docs.some(item => item.id === currentUser.uid);

    likeButton.textContent = liked
      ? `❤️ Liked (${count})`
      : `🤍 Like (${count})`;

  } catch (error) {
    console.error("❌ LIKE COUNT ERROR:", error);
  }
}

/* =========================================================
   COMMENT POST
   ========================================================= */

async function commentPost(postId) {

  if (!currentUser) {
    alert("Please login to comment.");
    return false;
  }

  const comment = prompt("💬 Write your comment:");

  if (comment === null || !comment.trim()) return false;

  try {

    const name = await getUserName(currentUser);

    await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        text: comment.trim(),
        userId: currentUser.uid,
        name,
        createdAt: serverTimestamp()
      }
    );

    console.log("💬 Comment added.");

    return true;

  } catch (error) {

    console.error("❌ COMMENT ERROR:", error);
    alert("Comment failed:\n\n" + error.message);

    return false;
  }
}

/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadComments(
  postId,
  commentButton,
  card,
  showComments = false
) {

  try {

    const commentsRef =
      collection(db, "posts", postId, "comments");

    const commentsSnap = await getDocs(commentsRef);

    const count = commentsSnap.size;

    if (commentButton) {
      commentButton.textContent = `💬 Comment (${count})`;
    }

    const oldBox = card.querySelector(".comments-box");
    if (oldBox) oldBox.remove();

    if (count === 0 || !showComments) return;

    const commentsBox = document.createElement("div");
    commentsBox.className = "comments-box";

    commentsBox.style.marginTop = "12px";
    commentsBox.style.padding = "10px";
    commentsBox.style.borderTop = "1px solid #ddd";

    const sortedComments = [...commentsSnap.docs].sort((a, b) => {
      const ta = a.data().createdAt?.toMillis?.() || 0;
      const tb = b.data().createdAt?.toMillis?.() || 0;
      return ta - tb;
    });

    sortedComments.forEach(commentDoc => {

      const data = commentDoc.data();

      const div = document.createElement("div");

      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";

      div.innerHTML = `
        <strong>${escapeHTML(data.name || "Student")}</strong>
        <br>
        <span>${escapeHTML(data.text || "")}</span>
      `;

      commentsBox.appendChild(div);
    });

    card.appendChild(commentsBox);

  } catch (error) {
    console.error("❌ LOAD COMMENTS ERROR:", error);
  }
}

/* =========================================================
   SHARE POST
   ========================================================= */

async function sharePost(postId, postText) {

  const shareUrl =
    window.location.href.split("#")[0] +
    "#post-" +
    postId;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Sociology Connect",
        text: postText,
        url: shareUrl
      });

      return;
    }

    if (navigator.clipboard && window.isSecureContext) {

      await navigator.clipboard.writeText(shareUrl);

      alert("✅ Post link copied!");

      return;
    }

    const input = document.createElement("input");
    input.value = shareUrl;

    document.body.appendChild(input);

    input.select();

    document.execCommand("copy");

    input.remove();

    alert("✅ Post link copied!");

  } catch (error) {

    if (error.name === "AbortError") return;

    console.error("❌ SHARE ERROR:", error);
  }
}

/* =========================================================
   DELETE SINGLE POST
   ========================================================= */

async function deletePost(postId, ownerId) {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (!(isAdmin() || currentUser.uid === ownerId)) {
    alert("❌ You can only delete your own post.");
    return;
  }

  if (!confirm("🗑️ Delete this post?")) return;

  try {

    const likes =
      await getDocs(collection(db, "posts", postId, "likes"));

    for (const like of likes.docs) {
      await deleteDoc(like.ref);
    }

    const comments =
      await getDocs(collection(db, "posts", postId, "comments"));

    for (const comment of comments.docs) {
      await deleteDoc(comment.ref);
    }

    await deleteDoc(doc(db, "posts", postId));

    console.log("🗑️ Post deleted.");

  } catch (error) {

    console.error("❌ DELETE ERROR:", error);
    alert(error.message);
  }
}

/* =========================================================
   ADMIN - CLEAR ALL POSTS
   ========================================================= */

async function clearAllPosts() {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (!isAdmin()) {
    alert("❌ Admin access required.");
    return;
  }

  if (!confirm("⚠️ Delete ALL posts permanently?")) return;

  try {

    const posts =
      await getDocs(collection(db, "posts"));

    for (const post of posts.docs) {

      const id = post.id;

      const likes =
        await getDocs(collection(db, "posts", id, "likes"));

      for (const like of likes.docs) {
        await deleteDoc(like.ref);
      }

      const comments =
        await getDocs(collection(db, "posts", id, "comments"));

      for (const comment of comments.docs) {
        await deleteDoc(comment.ref);
      }

      await deleteDoc(doc(db, "posts", id));
    }

    alert("✅ All posts deleted.");

  } catch (error) {

    console.error("❌ CLEAR ALL ERROR:", error);
    alert(error.message);
  }
}

/* =========================================================
   ADMIN CONTROLS
   ========================================================= */

function createAdminControls() {

  if (!isAdmin()) return;

  if (document.getElementById("adminControls")) return;

  const composer = document.querySelector(".post-composer");

  if (!composer) return;

  const box = document.createElement("div");

  box.id = "adminControls";

  box.innerHTML = `
    <hr>
    <strong>👑 Admin Controls</strong><br><br>

    <button
      id="adminClearPostsBtn"
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

  composer.appendChild(box);

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

/* =========================================================
   LOAD POSTS
   ========================================================= */

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

                    ${
                        canDelete
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

    }, (error) => {

        console.error("LOAD POSTS ERROR:", error);

        postsContainer.innerHTML = `
            <div class="post-card">
                ❌ Unable to load posts.
            </div>
        `;
    });
}

loadPosts();

/* =========================================================
   LOAD TRENDING POSTS
   (ONLY ONE FUNCTION - Duplicate fixed)
   ========================================================= */

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
                await getDocs(
                    collection(db, "posts", postDoc.id, "likes")
                );

            const comments =
                await getDocs(
                    collection(db, "posts", postDoc.id, "comments")
                );

            posts.push({
                id: postDoc.id,
                name: post.name || "Student",
                text: post.text || "",
                likes: likes.size,
                comments: comments.size,
                score: likes.size + comments.size
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

   
/* =========================================================
   NEWS
   EVENTS
   AI MARI
   ========================================================= */

/* =========================================================
   LOAD NEWS
   ========================================================= */

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

    }, (error) => {

        console.error("NEWS ERROR:", error);

        newsContainer.innerHTML = `
            <div class="card">
                ❌ Unable to load news.
            </div>
        `;
    });
}

loadNews();

/* =========================================================
   LOAD EVENTS
   ========================================================= */

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
                <strong>
                    📅 ${escapeHTML(event.title || "Event")}
                </strong>

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

        console.error("EVENT ERROR:", error);

        eventsContainer.innerHTML = `
            <div class="event-card">
                ❌ Unable to load events.
            </div>
        `;
    });
}

loadEvents();

/* =========================================================
   AI MARI
   ========================================================= */

async function sendToServer() {

    if (!chatHistory || !userInput) return;

    const text = userInput.value.trim();

    if (!text) return;

    /* User message */

    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.innerHTML = `<b>You:</b> ${escapeHTML(text)}`;

    chatHistory.appendChild(userMessage);

    userInput.value = "";

    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Thinking...";
    }

    /* Loading */

    const loading = document.createElement("div");
    loading.className = "message ai";
    loading.innerHTML = `
        <b>AI Mari:</b><br>
        <i>Typing... 🤖</i>
    `;

    chatHistory.appendChild(loading);

    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {

        /* Fixed Pollinations URL */

        const apiUrl =
            `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error("Server Error");
        }

        const reply = await response.text();

        loading.remove();

        const aiMessage = document.createElement("div");
        aiMessage.className = "message ai";

        aiMessage.innerHTML = `
            <b>AI Mari:</b><br>

            <span class="ai-text">
                ${escapeHTML(reply)}
            </span>

            <br><br>

            <button class="copy-btn">
                📋 Copy
            </button>
        `;

        const copyBtn =
            aiMessage.querySelector(".copy-btn");

        copyBtn.addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(reply);

                copyBtn.textContent = "✅ Copied";

                setTimeout(() => {
                    copyBtn.textContent = "📋 Copy";
                }, 1500);

            } catch {
                alert("Copy failed.");
            }
        });

        chatHistory.appendChild(aiMessage);

        chatHistory.scrollTop = chatHistory.scrollHeight;

    } catch (error) {

        console.error("AI ERROR:", error);

        loading.remove();

        const errorBox = document.createElement("div");
        errorBox.className = "message ai";

        errorBox.innerHTML = `
            <b>AI Mari:</b><br>

            ❌ Connection failed.
            Please check your internet.
        `;

        chatHistory.appendChild(errorBox);
    }

    finally {

        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = "Send";
        }
    }
}

/* Send button */

sendBtn?.addEventListener("click", sendToServer);

/* Enter key */

userInput?.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendToServer();
    }
});

/* =========================================================
   LOAD POSTS
   ========================================================= */

function loadPosts(){

    if(!postsContainer) return;

    const postsQuery = query(
        collection(db,"posts"),
        orderBy("createdAt","desc")
    );

    onSnapshot(postsQuery, async(snapshot)=>{

        postsContainer.innerHTML="";

        if(snapshot.empty){
            postsContainer.innerHTML=`
                <div class="post-card">
                    <p>No posts yet. Be the first student to post something! 📚</p>
                </div>
            `;
            return;
        }

        for(const postDoc of snapshot.docs){

            const post=postDoc.data();
            const postId=postDoc.id;

            const card=document.createElement("div");
            card.className="post-card";
            card.id="post-"+postId;

            const name=post.name || "Student";
            const firstLetter=name.charAt(0).toUpperCase();

            let deleteHTML="";

            if(currentUser &&
               (isAdmin() || currentUser.uid===post.userId)){

                deleteHTML=`
                    <button class="delete-btn"
                        data-id="${postId}">
                        🗑️ Delete
                    </button>
                `;
            }

            card.innerHTML=`
                <div class="post-header">

                    <div class="post-avatar">
                        ${escapeHTML(firstLetter)}
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

                    <button class="like-btn">
                        🤍 Like (0)
                    </button>

                    <button class="comment-btn">
                        💬 Comment (0)
                    </button>

                    <button class="share-btn">
                        📤 Share
                    </button>

                    ${deleteHTML}

                </div>
            `;

            postsContainer.appendChild(card);

            const likeBtn=card.querySelector(".like-btn");
            const commentBtn=card.querySelector(".comment-btn");
            const shareBtn=card.querySelector(".share-btn");
            const deleteBtn=card.querySelector(".delete-btn");

            likeBtn?.addEventListener("click",()=>{
                toggleLike(postId,likeBtn);
            });

            commentBtn?.addEventListener("click",async()=>{

                const added=await commentPost(postId);

                await loadComments(
                    postId,
                    commentBtn,
                    card,
                    added
                );
            });

            shareBtn?.addEventListener("click",()=>{
                sharePost(postId,post.text||"");
            });

            deleteBtn?.addEventListener("click",()=>{
                deletePost(postId,post.userId);
            });

            await updateLikeButton(postId,likeBtn);

            await loadComments(
                postId,
                commentBtn,
                card,
                false
            );

        }

    },(error)=>{

        console.error(error);

        postsContainer.innerHTML=`
            <div class="post-card">
                ❌ Unable to load posts.
            </div>
        `;

    });

}

loadPosts();

/* =========================================================
   PART 6
   TRENDING POSTS
   NEWS
   EVENTS
   ========================================================= */

/* =========================================================
   LOAD TRENDING POSTS
   (Only One Function)
   ========================================================= */

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

loadTrendingPosts();

/* =========================================================
   LOAD NEWS
   ========================================================= */

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

    }, (error) => {

        console.error("NEWS ERROR:", error);

        newsContainer.innerHTML = `
            <div class="card">
                ❌ Unable to load latest news.
            </div>
        `;
    });
}

loadNews();

/* =========================================================
   LOAD EVENTS
   ========================================================= */

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
                <strong>
                    📅 ${escapeHTML(event.title || "Event")}
                </strong>

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

        console.error("EVENT ERROR:", error);

        eventsContainer.innerHTML = `
            <div class="event-card">
                ❌ Unable to load events.
            </div>
        `;
    });
}

loadEvents();

/* =========================================================
   PART 7 (FINAL)
   AI MARI
   DARK MODE
   SEARCH
   NOTIFICATIONS
   VOICE
   LOGOUT
   START
   ========================================================= */

/* ================= AI MARI ================= */

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
    loading.innerHTML = "<b>AI Mari:</b><br><i>Typing... 🤖</i>";
    chatHistory.appendChild(loading);

    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Thinking...";
    }

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
            <span class="ai-text">${escapeHTML(reply)}</span>
            <br><br>
            <button class="copy-btn">📋 Copy</button>
        `;

        aiBox.querySelector(".copy-btn")
            .addEventListener("click", async () => {

                await navigator.clipboard.writeText(reply);

                const btn = aiBox.querySelector(".copy-btn");
                btn.textContent = "✅ Copied";

                setTimeout(() => {
                    btn.textContent = "📋 Copy";
                }, 1500);

            });

        chatHistory.appendChild(aiBox);

    } catch {

        loading.innerHTML = `
            <b>AI Mari:</b><br>
            ❌ Connection failed.
        `;

    } finally {

        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = "Send";
        }

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

sendBtn?.addEventListener("click", sendToServer);

userInput?.addEventListener("keydown", e => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();
        sendToServer();

    }
});

/* ================= DARK MODE ================= */

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

window.toggleTheme = toggleTheme;

themeBtn?.addEventListener("click", toggleTheme);

/* ================= SEARCH ================= */

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

    document.getElementById("searchCount").textContent =
        q ? `${count} results found` : "";
}

searchBar?.addEventListener("input", searchWebsite);

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

        if (micBtn) micBtn.textContent = "🔴";
    });

    recognition.onresult = e => {

        userInput.value =
            e.results[0][0].transcript;

        if (micBtn) micBtn.textContent = "🎤";
    };

    recognition.onend = () => {

        if (micBtn) micBtn.textContent = "🎤";
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


