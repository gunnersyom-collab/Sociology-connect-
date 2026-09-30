/* =========================================================
   SOCIOLOGY CONNECT 2.1
   SCRIPT.JS
   PROFESSIONAL + OPTIMIZED VERSION

   FEATURES
   ---------------------------------------------------------
   POSTS
   ✔ Create posts
   ✔ Like / Unlike
   ✔ Comments
   ✔ Share
   ✔ Report
   ✔ Delete own post
   ✔ Admin delete
   ✔ Admin clear all posts

   CONTENT
   ✔ Latest News
   ✔ Events
   ✔ Trending Posts

   NOTIFICATIONS
   ✔ Firestore notifications
   ✔ Unread badge
   ✔ Seen notifications
   ✔ Real-time listener

   AI MARI
   ✔ AI chat
   ✔ Conversation history
   ✔ Copy response
   ✔ Listen response
   ✔ Language-aware speech
   ✔ Enter to send

   UI
   ✔ Dark mode
   ✔ Mobile friendly
   ✔ PC friendly
   ✔ Search
   ✔ Voice input
   ✔ Ctrl + K search

   PERFORMANCE
   ✔ Search caching
   ✔ Debounced search
   ✔ Parallel searches
   ✔ Request protection
   ✔ Listener cleanup
========================================================= */


/* =========================================================
   FIREBASE
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


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let authReady = false;

const ADMIN_EMAIL = "yom@gmail.com";

let postsUnsubscribe = null;
let newsUnsubscribe = null;
let eventsUnsubscribe = null;
let notificationsUnsubscribe = null;

let latestNotifications = [];


/* =========================================================
   SEARCH CACHE
========================================================= */

let cachedPosts = [];
let cachedNews = [];
let cachedEvents = [];
let cachedResearch = null;

let researchCacheUserId = null;

let searchTimer = null;
let searchRequestId = 0;


/* =========================================================
   TRENDING STATE
========================================================= */

let trendingTimer = null;
let trendingRequestId = 0;


/* =========================================================
   AI STATE
========================================================= */

const chatMessages = [

  {
    role: "system",

    content:
      `You are AI Mari, the official academic AI assistant of Sociology Connect – Arsi University (Sociology & Social Work).

Help students with:
Sociology, Social Work, Psychology, Anthropology, Political Science, Economics, Social Policy, Community Development, Human Rights, Gender and Society, Research Methods, Academic Writing, APA 7, Assignments, Presentations and Research Projects.

Always answer in the same language used by the user.

Afaan Oromoo → Answer in natural Afaan Oromoo.
Amharic → Answer in natural Amharic.
English → Answer in clear English.

Give clear, useful and educational answers.

Never invent research data, statistics or citations.

When explaining academic topics, use simple examples when useful.`
  }

];


/* =========================================================
   NOTIFICATION STORAGE
========================================================= */

const NOTIFICATION_SEEN_KEY =
  "sociology_connect_seen_notifications";


function getSeenNotificationIds() {

  try {

    const saved =
      localStorage.getItem(
        NOTIFICATION_SEEN_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.warn(
      "SEEN NOTIFICATIONS ERROR:",
      error
    );

    return [];

  }

}


function saveSeenNotificationIds(ids) {

  try {

    const unique =
      [...new Set(ids)];

    localStorage.setItem(
      NOTIFICATION_SEEN_KEY,
      JSON.stringify(
        unique.slice(-100)
      )
    );

  } catch (error) {

    console.warn(
      "SAVE SEEN NOTIFICATIONS ERROR:",
      error
    );

  }

}


/* =========================================================
   ADMIN
========================================================= */

function isAdmin() {

  return Boolean(
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  );

}


/* =========================================================
   ESCAPE HTML
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
   FORMAT TIME
========================================================= */

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
        .toLocaleString(
          "en-US",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        );

    }

  } catch (error) {

    console.warn(
      "POST TIME ERROR:",
      error
    );

  }

  return "Just now";

}


function formatNotificationTime(timestamp) {

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
        .toLocaleString(
          "en-US",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        );

    }

  } catch (error) {

    console.warn(
      "NOTIFICATION TIME ERROR:",
      error
    );

  }

  return "Recently";

}


/* =========================================================
   GET USER NAME
========================================================= */

async function getUserName(user) {

  if (!user) {
    return "Student";
  }

  try {

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    if (userSnap.exists()) {

      const data =
        userSnap.data();

      return (
        data.fullName ||
        data.name ||
        data.displayName ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student"
      );

    }

  } catch (error) {

    console.warn(
      "USER NAME ERROR:",
      error
    );

  }

  return (
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student"
  );

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;
    authReady = true;

    /*
       Clear research cache when
       authentication changes.
    */

    if (
      researchCacheUserId !==
      user?.uid
    ) {

      cachedResearch = null;

      researchCacheUserId =
        user?.uid || null;

    }


    if (user) {

      const name =
        await getUserName(
          user
        );

      if (userInfo) {

        userInfo.textContent =
          "👤 " + name;

      }

      if (loginLink) {

        loginLink.style.display =
          "none";

      }

      if (logoutBtn) {

        logoutBtn.style.display =
          "inline-block";

      }

      if (
        document.readyState !==
        "loading"
      ) {

        createAdminControls();

      }

      startNotificationListener();

      if (postsContainer) {

        loadPosts();

      }

      if (
        searchBar &&
        searchBar.value.trim()
      ) {

        searchWebsite();

      }

    } else {

      if (userInfo) {

        userInfo.textContent =
          "";

      }

      if (loginLink) {

        loginLink.style.display =
          "inline-block";

      }

      if (logoutBtn) {

        logoutBtn.style.display =
          "none";

      }

      removeAdminControls();

      stopNotificationListener();

      latestNotifications = [];

      updateNotificationBadge();

      if (postsContainer) {

        loadPosts();

      }

      if (
        searchBar &&
        searchBar.value.trim()
      ) {

        searchWebsite();

      }

    }

  }
);


/* =========================================================
   CREATE POST
========================================================= */

async function createPost() {

  if (!postInput) {
    return;
  }

  if (!authReady) {

    alert(
      "Please wait while your account is loading."
    );

    return;

  }

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }

  const text =
    postInput.value.trim();

  if (!text) {

    alert(
      "Write something first."
    );

    postInput.focus();

    return;

  }

  if (postBtn) {

    postBtn.disabled =
      true;

    postBtn.textContent =
      "Posting...";

  }

  try {

    const name =
      await getUserName(
        currentUser
      );

    await addDoc(
      collection(
        db,
        "posts"
      ),
      {
        text,

        userId:
          currentUser.uid,

        name,

        email:
          currentUser.email || "",

        createdAt:
          serverTimestamp()
      }
    );

    postInput.value = "";

  } catch (error) {

    console.error(
      "CREATE POST ERROR:",
      error
    );

    alert(
      "Unable to create post.\n\n" +
      error.message
    );

  } finally {

    if (postBtn) {

      postBtn.disabled =
        false;

      postBtn.textContent =
        "📤 Post";

    }

  }

}


postBtn?.addEventListener(
  "click",
  createPost
);


postInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      createPost();

    }

  }
);


/* =========================================================
   LIKE
========================================================= */

async function toggleLike(
  postId,
  likeBtn
) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }

  if (likeBtn) {

    likeBtn.disabled =
      true;

  }

  const likeRef =
    doc(
      db,
      "posts",
      postId,
      "likes",
      currentUser.uid
    );

  try {

    const snap =
      await getDoc(
        likeRef
      );

    if (snap.exists()) {

      await deleteDoc(
        likeRef
      );

    } else {

      await setDoc(
        likeRef,
        {
          userId:
            currentUser.uid,

          createdAt:
            serverTimestamp()
        }
      );

    }

    await updateLikeButton(
      postId,
      likeBtn
    );

    scheduleTrendingLoad();

  } catch (error) {

    console.error(
      "LIKE ERROR:",
      error
    );

    alert(
      "Unable to update like."
    );

  } finally {

    if (likeBtn) {

      likeBtn.disabled =
        false;

    }

  }

}


async function updateLikeButton(
  postId,
  likeBtn
) {

  if (!likeBtn) {
    return;
  }

  try {

    const likes =
      await getDocs(
        collection(
          db,
          "posts",
          postId,
          "likes"
        )
      );

    const count =
      likes.size;

    const liked =
      Boolean(
        currentUser &&
        likes.docs.some(
          item =>
            item.id ===
            currentUser.uid
        )
      );

    likeBtn.textContent =
      liked
        ? `❤️ Liked (${count})`
        : `🤍 Like (${count})`;

  } catch (error) {

    console.error(
      "LIKE COUNT ERROR:",
      error
    );

  }

}


/* =========================================================
   COMMENTS
========================================================= */

async function commentPost(
  postId
) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return false;

  }

  const text =
    prompt(
      "Write your comment:"
    );

  if (
    !text ||
    !text.trim()
  ) {

    return false;

  }

  try {

    const name =
      await getUserName(
        currentUser
      );

    await addDoc(
      collection(
        db,
        "posts",
        postId,
        "comments"
      ),
      {
        text:
          text.trim(),

        userId:
          currentUser.uid,

        name,

        createdAt:
          serverTimestamp()
      }
    );

    return true;

  } catch (error) {

    console.error(
      "COMMENT ERROR:",
      error
    );

    alert(
      "Unable to add comment.\n\n" +
      error.message
    );

    return false;

  }

}


async function loadComments(
  postId,
  commentBtn,
  card,
  show = false
) {

  if (!card) {
    return;
  }

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "posts",
          postId,
          "comments"
        )
      );

    if (commentBtn) {

      commentBtn.textContent =
        `💬 Comment (${snap.size})`;

    }

    card
      .querySelector(
        ".comments-box"
      )
      ?.remove();

    if (
      !show ||
      snap.empty
    ) {

      return;

    }

    const box =
      document.createElement(
        "div"
      );

    box.className =
      "comments-box";

    [...snap.docs]
      .sort(
        (a, b) => {

          const first =
            a.data()
              .createdAt
              ?.toMillis?.() || 0;

          const second =
            b.data()
              .createdAt
              ?.toMillis?.() || 0;

          return first - second;

        }
      )
      .forEach(
        commentDoc => {

          const comment =
            commentDoc.data();

          const div =
            document.createElement(
              "div"
            );

          div.className =
            "comment-item";

          div.innerHTML = `
            <strong>
              ${escapeHTML(
                comment.name ||
                "Student"
              )}
            </strong>

            <br>

            ${escapeHTML(
              comment.text ||
              ""
            )}
          `;

          box.appendChild(
            div
          );

        }
      );

    card.appendChild(
      box
    );

  } catch (error) {

    console.error(
      "COMMENTS ERROR:",
      error
    );

  }

}


/* =========================================================
   SHARE
========================================================= */

async function sharePost(
  postId,
  text
) {

  const url =
    window.location.href
      .split("#")[0] +
    "#post-" +
    postId;

  try {

    if (
      typeof navigator.share ===
      "function"
    ) {

      await navigator.share(
        {
          title:
            "Sociology Connect",

          text:
            text || "Sociology Connect post",

          url
        }
      );

      return;

    }

    if (
      navigator.clipboard
    ) {

      await navigator.clipboard
        .writeText(url);

      alert(
        "✅ Post link copied."
      );

      return;

    }

    alert(url);

  } catch (error) {

    if (
      error?.name !==
      "AbortError"
    ) {

      console.warn(
        "SHARE ERROR:",
        error
      );

    }

  }

}


/* =========================================================
   REPORT
========================================================= */

async function reportPost(
  postId,
  postText,
  ownerId
) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }

  const reason =
    prompt(
      "🚩 Why are you reporting this post?\n\n" +
      "Examples:\n" +
      "• Spam\n" +
      "• Inappropriate content\n" +
      "• Harassment\n" +
      "• Academic misconduct\n" +
      "• Other"
    );

  if (
    !reason ||
    !reason.trim()
  ) {

    return;

  }

  try {

    const reporterName =
      await getUserName(
        currentUser
      );

    await addDoc(
      collection(
        db,
        "reports"
      ),
      {
        postId,

        postText:
          postText || "",

        reportedUserId:
          ownerId || "",

        reporterId:
          currentUser.uid,

        reporterName,

        reporterEmail:
          currentUser.email || "",

        reason:
          reason.trim(),

        status:
          "pending",

        createdAt:
          serverTimestamp()
      }
    );

    alert(
      "✅ Report submitted successfully."
    );

  } catch (error) {

    console.error(
      "REPORT ERROR:",
      error
    );

    alert(
      "Unable to submit report.\n\n" +
      error.message
    );

  }

}


/* =========================================================
   DELETE POST DATA
========================================================= */

async function deletePostData(
  postId
) {

  const likes =
    await getDocs(
      collection(
        db,
        "posts",
        postId,
        "likes"
      )
    );

  const comments =
    await getDocs(
      collection(
        db,
        "posts",
        postId,
        "comments"
      )
    );

  /*
     Delete likes and comments in
     parallel where possible.
  */

  await Promise.all(
    likes.docs.map(
      item =>
        deleteDoc(
          item.ref
        )
    )
  );

  await Promise.all(
    comments.docs.map(
      item =>
        deleteDoc(
          item.ref
        )
    )
  );

  await deleteDoc(
    doc(
      db,
      "posts",
      postId
    )
  );

}


/* =========================================================
   DELETE ONE POST
========================================================= */

async function deletePost(
  postId,
  ownerId,
  askConfirmation = true
) {

  if (!currentUser) {
    return false;
  }

  if (
    !isAdmin() &&
    currentUser.uid !== ownerId
  ) {

    alert(
      "You can delete only your own post."
    );

    return false;

  }

  if (
    askConfirmation &&
    !confirm(
      "Delete this post?"
    )
  ) {

    return false;

  }

  try {

    await deletePostData(
      postId
    );

    scheduleTrendingLoad();

    return true;

  } catch (error) {

    console.error(
      "DELETE POST ERROR:",
      error
    );

    if (askConfirmation) {

      alert(
        "Unable to delete post.\n\n" +
        error.message
      );

    }

    return false;

  }

}


/* =========================================================
   CLEAR ALL POSTS
========================================================= */

async function clearAllPosts() {

  if (!isAdmin()) {

    alert(
      "Admin only."
    );

    return;

  }

  if (
    !confirm(
      "⚠️ Delete ALL posts?\n\n" +
      "This will delete all community posts, likes and comments."
    )
  ) {

    return;

  }

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "posts"
        )
      );

    for (
      const post of
      snapshot.docs
    ) {

      await deletePostData(
        post.id
      );

    }

    alert(
      "✅ All posts deleted successfully."
    );

    scheduleTrendingLoad();

  } catch (error) {

    console.error(
      "CLEAR POSTS ERROR:",
      error
    );

    alert(
      "Could not clear all posts.\n\n" +
      error.message
    );

  }

}


/* =========================================================
   ADMIN CONTROLS
========================================================= */

function createAdminControls() {

  if (!isAdmin()) {
    return;
  }

  if (
    document.getElementById(
      "adminControls"
    )
  ) {

    return;

  }

  const composer =
    document.querySelector(
      ".post-composer"
    );

  if (!composer) {
    return;
  }

  const div =
    document.createElement(
      "div"
    );

  div.id =
    "adminControls";

  div.innerHTML = `
    <hr>

    <strong>
      👑 Admin Controls
    </strong>

    <br><br>

    <button
      id="adminClearPostsBtn"
      style="
        background:#dc3545;
        color:#fff;
        border:none;
        padding:10px 15px;
        border-radius:8px;
        cursor:pointer;
      "
    >
      🧹 Clear All Posts
    </button>
  `;

  composer.appendChild(
    div
  );

  document
    .getElementById(
      "adminClearPostsBtn"
    )
    ?.addEventListener(
      "click",
      clearAllPosts
    );

}


function removeAdminControls() {

  document
    .getElementById(
      "adminControls"
    )
    ?.remove();

}


/* =========================================================
   LOAD POSTS
========================================================= */

function loadPosts() {

  if (!postsContainer) {
    return;
  }

  if (postsUnsubscribe) {

    postsUnsubscribe();

    postsUnsubscribe =
      null;

  }

  const postsQuery =
    query(
      collection(
        db,
        "posts"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  postsUnsubscribe =
    onSnapshot(
      postsQuery,

      async snapshot => {

        cachedPosts =
          snapshot.docs.map(
            item => ({
              id:
                item.id,

              ...item.data()
            })
          );

        postsContainer.innerHTML =
          "";

        if (
          snapshot.empty
        ) {

          postsContainer.innerHTML = `
            <div class="post-card">
              <strong>
                📚 No posts yet
              </strong>

              <p>
                Be the first student
                to share something!
              </p>
            </div>
          `;

          scheduleTrendingLoad();

          return;

        }

        /*
           Render cards first.
           This makes the page feel
           faster on mobile and PC.
        */

        snapshot.docs.forEach(
          postDoc => {

            renderPostCard(
              postDoc
            );

          }
        );

        /*
           Update likes/comments after
           cards are visible.
        */

        await refreshPostEngagement();

        scheduleTrendingLoad();

        searchWebsite();

      },

      error => {

        console.error(
          "LOAD POSTS ERROR:",
          error
        );

        postsContainer.innerHTML = `
          <div class="post-card">
            ❌ Unable to load posts.
            <br><br>
            Please refresh the page.
          </div>
        `;

      }
    );

}


/* =========================================================
   RENDER POST CARD
========================================================= */

function renderPostCard(
  postDoc
) {

  if (!postsContainer) {
    return;
  }

  const post =
    postDoc.data();

  const postId =
    postDoc.id;

  const name =
    post.name ||
    "Student";

  const canDelete =
    currentUser &&
    (
      isAdmin() ||
      currentUser.uid ===
        post.userId
    );

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "post-card";

  card.id =
    "post-" +
    postId;

  card.innerHTML = `

    <div class="post-header">

      <div class="post-avatar">
        ${escapeHTML(
          name
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <div>

        <div class="post-name">
          ${escapeHTML(
            name
          )}
        </div>

        <div class="post-time">
          🕐
          ${formatPostTime(
            post.createdAt
          )}
        </div>

      </div>

    </div>

    <div class="post-text">
      ${escapeHTML(
        post.text || ""
      )}
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

      <button
        class="report-btn"
        style="color:#dc3545;"
      >
        🚩 Report
      </button>

      ${
        canDelete
          ? `
            <button
              class="delete-btn"
              style="color:#dc3545;"
            >
              🗑️ Delete
            </button>
          `
          : ""
      }

    </div>
  `;

  postsContainer.appendChild(
    card
  );

  const likeBtn =
    card.querySelector(
      ".like-btn"
    );

  const commentBtn =
    card.querySelector(
      ".comment-btn"
    );

  const shareBtn =
    card.querySelector(
      ".share-btn"
    );

  const reportBtn =
    card.querySelector(
      ".report-btn"
    );

  const deleteBtn =
    card.querySelector(
      ".delete-btn"
    );


  likeBtn?.addEventListener(
    "click",
    () =>
      toggleLike(
        postId,
        likeBtn
      )
  );


  commentBtn?.addEventListener(
    "click",
    async () => {

      const added =
        await commentPost(
          postId
        );

      await loadComments(
        postId,
        commentBtn,
        card,
        added
      );

      scheduleTrendingLoad();

    }
  );


  shareBtn?.addEventListener(
    "click",
    () =>
      sharePost(
        postId,
        post.text || ""
      )
  );


  reportBtn?.addEventListener(
    "click",
    () =>
      reportPost(
        postId,
        post.text || "",
        post.userId || ""
      )
  );


  deleteBtn?.addEventListener(
    "click",
    async () => {

      await deletePost(
        postId,
        post.userId,
        true
      );

    }
  );

}


/* =========================================================
   REFRESH POST ENGAGEMENT
========================================================= */

async function refreshPostEngagement() {

  if (!postsContainer) {
    return;
  }

  const cards =
    [...postsContainer.querySelectorAll(
      ".post-card"
    )];

  /*
     Run engagement requests in parallel.
  */

  await Promise.all(
    cards.map(
      async card => {

        const postId =
          card.id.replace(
            "post-",
            ""
          );

        const likeBtn =
          card.querySelector(
            ".like-btn"
          );

        const commentBtn =
          card.querySelector(
            ".comment-btn"
          );

        await Promise.all([
          updateLikeButton(
            postId,
            likeBtn
          ),

          loadComments(
            postId,
            commentBtn,
            card,
            false
          )
        ]);

      }
    )
  );

}


/* =========================================================
   TRENDING
========================================================= */

function scheduleTrendingLoad() {

  clearTimeout(
    trendingTimer
  );

  trendingTimer =
    setTimeout(
      () => {

        loadTrendingPosts();

      },
      500
    );

}


async function loadTrendingPosts() {

  const trendingContainer =
    document.getElementById(
      "trendingContainer"
    );

  if (!trendingContainer) {
    return;
  }

  const requestId =
    ++trendingRequestId;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "posts"
        )
      );

    if (
      requestId !==
      trendingRequestId
    ) {

      return;

    }

    if (
      snapshot.empty
    ) {

      trendingContainer.innerHTML = `
        <div class="post-card">
          🔥 No trending posts yet.
        </div>
      `;

      return;

    }

    /*
       Read engagement in parallel
       instead of one-by-one.
    */

    const posts =
      await Promise.all(
        snapshot.docs.map(
          async postDoc => {

            const post =
              postDoc.data();

            const [
              likesSnapshot,
              commentsSnapshot
            ] =
              await Promise.all([
                getDocs(
                  collection(
                    db,
                    "posts",
                    postDoc.id,
                    "likes"
                  )
                ),

                getDocs(
                  collection(
                    db,
                    "posts",
                    postDoc.id,
                    "comments"
                  )
                )
              ]);

            const likes =
              likesSnapshot.size;

            const comments =
              commentsSnapshot.size;

            return {

              id:
                postDoc.id,

              name:
                post.name ||
                "Student",

              text:
                post.text ||
                "",

              likes,

              comments,

              score:
                likes +
                comments

            };

          }
        )
      );


    if (
      requestId !==
      trendingRequestId
    ) {

      return;

    }


    posts.sort(
      (a, b) =>
        b.score -
        a.score
    );

    trendingContainer.innerHTML =
      "";

    posts
      .slice(0, 5)
      .forEach(
        post => {

          const card =
            document.createElement(
              "div"
            );

          card.className =
            "post-card";

          card.innerHTML = `

            <div class="post-header">

              <div class="post-avatar">
                ${escapeHTML(
                  post.name
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>

                <div class="post-name">
                  ${escapeHTML(
                    post.name
                  )}
                </div>

                <div class="post-time">
                  🔥 Trending
                </div>

              </div>

            </div>

            <div class="post-text">
              ${escapeHTML(
                post.text
              )}
            </div>

            <div class="post-actions">

              <button disabled>
                ❤️ ${post.likes}
              </button>

              <button disabled>
                💬 ${post.comments}
              </button>

              <button disabled>
                🔥 Popular
              </button>

            </div>
          `;

          trendingContainer.appendChild(
            card
          );

        }
      );

  } catch (error) {

    console.error(
      "TRENDING ERROR:",
      error
    );

    trendingContainer.innerHTML = `
      <div class="post-card">
        ❌ Unable to load
        trending posts.
      </div>
    `;

  }

}


/* =========================================================
   NEWS
========================================================= */

function loadNews() {

  const newsContainer =
    document.getElementById(
      "newsContainer"
    );

  if (!newsContainer) {
    return;
  }

  if (newsUnsubscribe) {

    newsUnsubscribe();

    newsUnsubscribe =
      null;

  }

  const newsQuery =
    query(
      collection(
        db,
        "news"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  newsUnsubscribe =
    onSnapshot(
      newsQuery,

      snapshot => {

        cachedNews =
          snapshot.docs.map(
            item => ({
              id:
                item.id,

              ...item.data()
            })
          );

        newsContainer.innerHTML =
          "";

        if (
          snapshot.empty
        ) {

          newsContainer.innerHTML = `
            <div class="card">
              📰 No latest news
              available yet.
            </div>
          `;

          return;

        }

        snapshot.forEach(
          newsDoc => {

            const news =
              newsDoc.data();

            const card =
              document.createElement(
                "div"
              );

            card.className =
              "card";

            card.id =
              "news-" +
              newsDoc.id;

            card.innerHTML = `

              <h3>
                📢
                ${escapeHTML(
                  news.title ||
                  "Latest News"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  news.description ||
                  ""
                )}
              </p>

              ${
                news.createdAt
                  ? `
                    <small>
                      🕐
                      ${formatPostTime(
                        news.createdAt
                      )}
                    </small>
                  `
                  : ""
              }

            `;

            newsContainer.appendChild(
              card
            );

          }
        );

        searchWebsite();

      },

      error => {

        console.error(
          "NEWS ERROR:",
          error
        );

        newsContainer.innerHTML = `
          <div class="card">
            ❌ Unable to load news.
          </div>
        `;

      }
    );

}


/* =========================================================
   EVENTS
========================================================= */

function loadEvents() {

  const eventsContainer =
    document.getElementById(
      "eventsContainer"
    );

  if (!eventsContainer) {
    return;
  }

  if (eventsUnsubscribe) {

    eventsUnsubscribe();

    eventsUnsubscribe =
      null;

  }

  const eventsQuery =
    query(
      collection(
        db,
        "events"
      ),
      orderBy(
        "date",
        "asc"
      )
    );

  eventsUnsubscribe =
    onSnapshot(
      eventsQuery,

      snapshot => {

        cachedEvents =
          snapshot.docs.map(
            item => ({
              id:
                item.id,

              ...item.data()
            })
          );

        eventsContainer.innerHTML =
          "";

        if (
          snapshot.empty
        ) {

          eventsContainer.innerHTML = `
            <div class="event-card">
              📅 No events available.
            </div>
          `;

          return;

        }

        snapshot.forEach(
          eventDoc => {

            const event =
              eventDoc.data();

            const card =
              document.createElement(
                "div"
              );

            card.className =
              "event-card";

            card.id =
              "event-" +
              eventDoc.id;

            card.innerHTML = `

              <strong>
                📅
                ${escapeHTML(
                  event.title ||
                  "Event"
                )}
              </strong>

              <br><br>

              ${escapeHTML(
                event.description ||
                ""
              )}

              ${
                event.date
                  ? `
                    <br><br>

                    <small>
                      📅
                      ${escapeHTML(
                        event.date
                      )}
                    </small>
                  `
                  : ""
              }

            `;

            eventsContainer.appendChild(
              card
            );

          }
        );

        searchWebsite();

      },

      error => {

        console.error(
          "EVENTS ERROR:",
          error
        );

        eventsContainer.innerHTML = `
          <div class="event-card">
            ❌ Unable to load events.
          </div>
        `;

      }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function startNotificationListener() {

  if (!currentUser) {
    return;
  }

  if (
    notificationsUnsubscribe
  ) {

    notificationsUnsubscribe();

    notificationsUnsubscribe =
      null;

  }

  const notificationsQuery =
    query(
      collection(
        db,
        "notifications"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  notificationsUnsubscribe =
    onSnapshot(
      notificationsQuery,

      snapshot => {

        latestNotifications =
          snapshot.docs.map(
            item => ({
              id:
                item.id,

              ...item.data()
            })
          );

        updateNotificationBadge();

      },

      error => {

        console.error(
          "NOTIFICATIONS ERROR:",
          error
        );

        latestNotifications =
          [];

        updateNotificationBadge();

      }
    );

}


function stopNotificationListener() {

  if (
    notificationsUnsubscribe
  ) {

    notificationsUnsubscribe();

    notificationsUnsubscribe =
      null;

  }

  latestNotifications =
    [];

}


function updateNotificationBadge() {

  if (!notifyBtn) {
    return;
  }

  const seen =
    getSeenNotificationIds();

  const unread =
    latestNotifications.filter(
      notification =>
        !seen.includes(
          notification.id
        )
    ).length;

  if (unread > 0) {

    notifyBtn.innerHTML =
      `🔔 <span style="
        color:red;
        font-weight:bold;
        margin-left:3px;
      ">${unread}</span>`;

    notifyBtn.title =
      `${unread} unread notification${
        unread === 1
          ? ""
          : "s"
      }`;

  } else {

    notifyBtn.innerHTML =
      "🔔";

    notifyBtn.title =
      "Notifications";

  }

}


function showNotifications() {

  if (!currentUser) {

    alert(
      "Please login to view notifications."
    );

    return;

  }

  if (
    !latestNotifications.length
  ) {

    alert(
      "🔔 No notifications available."
    );

    return;

  }

  const message =
    latestNotifications
      .slice(0, 10)
      .map(
        notification => {

          return (
            "🔔 " +
            (
              notification.title ||
              "Notification"
            ) +
            "\n\n" +
            (
              notification.message ||
              ""
            ) +
            "\n\n🕒 " +
            formatNotificationTime(
              notification.createdAt
            )
          );

        }
      )
      .join(
        "\n\n━━━━━━━━━━━━━━\n\n"
      );

  alert(message);

  const seen =
    getSeenNotificationIds();

  const displayed =
    latestNotifications
      .slice(0, 10)
      .map(
        item =>
          item.id
      );

  saveSeenNotificationIds([
    ...seen,
    ...displayed
  ]);

  updateNotificationBadge();

}


notifyBtn?.addEventListener(
  "click",
  showNotifications
);


/* =========================================================
   AI MARI
========================================================= */

function detectSpeechLanguage(
  text
) {

  /*
     Amharic / Ge'ez
  */

  if (
    /[\u1200-\u137F]/.test(
      text
    )
  ) {

    return "am-ET";

  }

  /*
     Afaan Oromoo often uses
     Latin characters, therefore
     use English as browser fallback.
  */

  return "en-US";

}


/* =========================================================
   FORMAT AI TEXT
========================================================= */

function formatAIResponse(
  text
) {

  /*
     Keep HTML safe while making
     simple line breaks readable.
  */

  return escapeHTML(
    text
  )
    .replace(
      /\n/g,
      "<br>"
    );

}


/* =========================================================
   SEND AI MESSAGE
========================================================= */

async function sendToServer() {

  if (
    !chatHistory ||
    !userInput ||
    !sendBtn
  ) {

    return;

  }

  const text =
    userInput.value.trim();

  if (!text) {
    return;
  }

  chatMessages.push({
    role:
      "user",

    content:
      text
  });

  const userBox =
    document.createElement(
      "div"
    );

  userBox.className =
    "message user";

  userBox.innerHTML = `
    <b>You:</b><br>
    ${escapeHTML(text)}
  `;

  chatHistory.appendChild(
    userBox
  );

  userInput.value =
    "";

  const aiBox =
    document.createElement(
      "div"
    );

  aiBox.className =
    "message ai";

  aiBox.innerHTML = `
    <b>AI Mari:</b><br>
    <span class="ai-text">
      Thinking... 🤖
    </span>
  `;

  chatHistory.appendChild(
    aiBox
  );

  chatHistory.scrollTop =
    chatHistory.scrollHeight;

  sendBtn.disabled =
    true;

  sendBtn.textContent =
    "Thinking...";

  try {

    /*
       Send recent conversation history
       so AI Mari can understand context.
    */

    const history =
      chatMessages
        .slice(-12);

    const response =
      await fetch(
        "https://sociology-connect.onrender.com/api/chat",
        {
          method:
            "POST",

          headers:
            {
              "Content-Type":
                "application/json"
            },

          body:
            JSON.stringify({
              message:
                text,

              history
            })
        }
      );

    let data;

    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        "The AI server returned an invalid response."
      );

    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI request failed."
      );

    }

    const reply =
      data.reply ||
      "No response received.";

    chatMessages.push({
      role:
        "assistant",

      content:
        reply
    });

    aiBox.innerHTML = `

      <b>AI Mari:</b><br>

      <span class="ai-text">
        ${formatAIResponse(
          reply
        )}
      </span>

      <br><br>

      <button
        class="copy-btn"
        type="button"
      >
        📋 Copy
      </button>

      <button
        class="speak-btn"
        type="button"
      >
        🔊 Listen
      </button>

    `;


    const copyBtn =
      aiBox.querySelector(
        ".copy-btn"
      );

    copyBtn?.addEventListener(
      "click",
      async () => {

        try {

          if (
            navigator.clipboard
          ) {

            await navigator
              .clipboard
              .writeText(
                reply
              );

            copyBtn.textContent =
              "✅ Copied";

            setTimeout(
              () => {

                copyBtn.textContent =
                  "📋 Copy";

              },
              1500
            );

          } else {

            alert(
              "Copy is not supported in this browser."
            );

          }

        } catch (error) {

          console.warn(
            "COPY ERROR:",
            error
          );

          alert(
            "Copy failed."
          );

        }

      }
    );


    const speakBtn =
      aiBox.querySelector(
        ".speak-btn"
      );

    speakBtn?.addEventListener(
      "click",
      () => {

        if (
          !(
            "speechSynthesis"
            in window
          )
        ) {

          alert(
            "Voice output is not supported."
          );

          return;

        }

        window
          .speechSynthesis
          .cancel();

        const speech =
          new SpeechSynthesisUtterance(
            reply
          );

        speech.lang =
          detectSpeechLanguage(
            reply
          );

        speech.rate =
          0.95;

        speech.pitch =
          1;

        speakBtn.textContent =
          "🔊 Speaking...";

        speech.onend =
          () => {

            speakBtn.textContent =
              "🔊 Listen";

          };

        speech.onerror =
          () => {

            speakBtn.textContent =
              "🔊 Listen";

          };

        window
          .speechSynthesis
          .speak(
            speech
          );

      }
    );

  } catch (error) {

    console.error(
      "AI MARI ERROR:",
      error
    );

    aiBox.innerHTML = `
      <b>AI Mari:</b><br>

      <span class="ai-text">
        ❌ ${escapeHTML(
          error.message ||
          "AI request failed."
        )}
      </span>
    `;

  } finally {

    sendBtn.disabled =
      false;

    sendBtn.textContent =
      "Send";

    chatHistory.scrollTop =
      chatHistory.scrollHeight;

  }

}


sendBtn?.addEventListener(
  "click",
  sendToServer
);


userInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendToServer();

    }

  }
);


/* =========================================================
   DARK MODE
========================================================= */

function updateThemeButton() {

  if (!themeBtn) {
    return;
  }

  themeBtn.textContent =
    document.body.classList.contains(
      "dark"
    )
      ? "☀️"
      : "🌙";

}


function applySavedTheme() {

  const saved =
    localStorage.getItem(
      "sociologyTheme"
    );

  if (
    saved === "dark"
  ) {

    document.body.classList.add(
      "dark"
    );

  } else {

    document.body.classList.remove(
      "dark"
    );

  }

  updateThemeButton();

}


function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

  const mode =
    document.body.classList.contains(
      "dark"
    )
      ? "dark"
      : "light";

  localStorage.setItem(
    "sociologyTheme",
    mode
  );

  updateThemeButton();

}


themeBtn?.addEventListener(
  "click",
  toggleTheme
);


/* =========================================================
   SEARCH
========================================================= */

function createSearchResultsBox() {

  let box =
    document.getElementById(
      "globalSearchResults"
    );

  if (box) {
    return box;
  }

  box =
    document.createElement(
      "div"
    );

  box.id =
    "globalSearchResults";

  box.style.maxWidth =
    "700px";

  box.style.margin =
    "10px auto 20px";

  box.style.padding =
    "0 15px";

  const searchContainer =
    searchBar?.closest(
      ".search-container"
    );

  if (searchContainer) {

    searchContainer.insertAdjacentElement(
      "afterend",
      box
    );

  } else if (
    searchBar?.parentElement
  ) {

    searchBar.parentElement.appendChild(
      box
    );

  }

  return box;

}


/* =========================================================
   SEARCH CSS
========================================================= */

function addSearchStyles() {

  if (
    document.getElementById(
      "globalSearchStyles"
    )
  ) {

    return;

  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "globalSearchStyles";

  style.textContent = `

    #globalSearchResults {
      position:relative;
      z-index:9999;
    }

    .global-search-panel {
      background:#fff;
      border:1px solid #ddd;
      border-radius:14px;
      box-shadow:0 8px 25px rgba(0,0,0,.12);
      overflow:hidden;
    }

    .global-search-header {
      padding:12px 15px;
      font-weight:700;
      border-bottom:1px solid #eee;
      color:#007bff;
    }

    .global-search-result {
      padding:13px 15px;
      border-bottom:1px solid #eee;
      cursor:pointer;
      transition:background .2s ease;
    }

    .global-search-result:hover {
      background:#f1f7ff;
    }

    .global-search-category {
      font-size:12px;
      font-weight:700;
      color:#007bff;
      margin-bottom:5px;
    }

    .global-search-title {
      font-weight:700;
      margin-bottom:5px;
    }

    .global-search-text {
      font-size:14px;
      opacity:.8;
      line-height:1.5;
    }

    .global-search-empty,
    .global-search-loading {
      padding:20px;
      text-align:center;
    }

    .global-search-loading {
      color:#007bff;
      font-weight:600;
    }

    .global-search-footer {
      padding:10px 15px;
      text-align:center;
      font-size:12px;
      opacity:.7;
    }

    #globalSearchResults mark {
      background:#fff3a3;
      color:inherit;
      border-radius:3px;
      padding:0 2px;
    }

    body.dark #globalSearchResults .global-search-panel {
      background:#1e1e1e;
      border-color:#444;
      color:#fff;
    }

    body.dark #globalSearchResults .global-search-header,
    body.dark #globalSearchResults .global-search-result {
      border-color:#444;
    }

    body.dark #globalSearchResults .global-search-result:hover {
      background:#292929;
    }

    body.dark #globalSearchResults .global-search-empty {
      color:#aaa;
    }

    .comment-item {
      padding:8px 0;
      border-bottom:1px solid #eee;
      line-height:1.5;
    }

    body.dark .comment-item {
      border-color:#444;
    }

  `;

  document.head.appendChild(
    style
  );

}


/* =========================================================
   SEARCH HELPERS
========================================================= */

function normalizeSearchText(
  value
) {

  return String(
    value ?? ""
  )
    .toLowerCase()
    .trim();

}


function searchMatches(
  fields,
  search
) {

  const text =
    fields
      .map(
        value =>
          normalizeSearchText(
            value
          )
      )
      .join(" ");

  return text.includes(
    search
  );

}


/* =========================================================
   SEARCH POSTS - CACHE
========================================================= */

function searchPosts(
  search
) {

  return cachedPosts
    .filter(
      post =>
        searchMatches(
          [
            post.text,
            post.name,
            post.email
          ],
          search
        )
    )
    .map(
      post => ({
        type:
          "post",

        id:
          post.id,

        title:
          post.name ||
          "Student Post",

        text:
          post.text ||
          "",

        icon:
          "📝"
      })
    );

}


/* =========================================================
   SEARCH NEWS - CACHE
========================================================= */

function searchNews(
  search
) {

  return cachedNews
    .filter(
      news =>
        searchMatches(
          [
            news.title,
            news.description
          ],
          search
        )
    )
    .map(
      news => ({
        type:
          "news",

        id:
          news.id,

        title:
          news.title ||
          "Latest News",

        text:
          news.description ||
          "",

        icon:
          "📰"
      })
    );

}


/* =========================================================
   SEARCH EVENTS - CACHE
========================================================= */

function searchEvents(
  search
) {

  return cachedEvents
    .filter(
      event =>
        searchMatches(
          [
            event.title,
            event.description,
            event.date
          ],
          search
        )
    )
    .map(
      event => ({
        type:
          "event",

        id:
          event.id,

        title:
          event.title ||
          "Event",

        text:
          event.description ||
          "",

        date:
          event.date ||
          "",

        icon:
          "📅"
      })
    );

}


/* =========================================================
   SEARCH RESEARCH
========================================================= */

async function searchResearch(
  search
) {

  if (!currentUser) {
    return [];
  }

  try {

    if (
      !cachedResearch ||
      researchCacheUserId !==
        currentUser.uid
    ) {

      const snapshot =
        await getDocs(
          collection(
            db,
            "research"
          )
        );

      cachedResearch =
        snapshot.docs.map(
          item => ({
            id:
              item.id,

            ...item.data()
          })
        );

      researchCacheUserId =
        currentUser.uid;

    }

    return cachedResearch
      .filter(
        research =>
          searchMatches(
            [
              research.topic,
              research.researchQuestions,
              research.objectives,
              research.abstract,
              research.problemStatement,
              research.apa7,
              research.aiMariResponse
            ],
            search
          )
      )
      .map(
        research => ({
          type:
            "research",

          id:
            research.id,

          title:
            research.topic ||
            "Saved Research",

          text:
            research.researchQuestions ||
            research.abstract ||
            research.problemStatement ||
            research.aiMariResponse ||
            "",

          icon:
            "🔬"
        })
      );

  } catch (error) {

    console.warn(
      "RESEARCH SEARCH SKIPPED:",
      error
    );

    return [];

  }

}


/* =========================================================
   HIGHLIGHT SEARCH
========================================================= */

function highlightSearchText(
  text,
  search
) {

  const safeText =
    escapeHTML(
      text || ""
    );

  if (!search) {
    return safeText;
  }

  const escaped =
    String(search)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  try {

    const regex =
      new RegExp(
        `(${escaped})`,
        "gi"
      );

    return safeText.replace(
      regex,
      "<mark>$1</mark>"
    );

  } catch {

    return safeText;

  }

}


/* =========================================================
   DISPLAY SEARCH RESULTS
========================================================= */

function displaySearchResults(
  results,
  search
) {

  const box =
    createSearchResultsBox();

  if (!box) {
    return;
  }

  box.innerHTML =
    "";

  if (!search) {
    return;
  }

  const limited =
    results.slice(
      0,
      30
    );

  const panel =
    document.createElement(
      "div"
    );

  panel.className =
    "global-search-panel";

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "global-search-header";

  header.textContent =
    `🔎 ${results.length} result${
      results.length === 1
        ? ""
        : "s"
    } found`;

  panel.appendChild(
    header
  );


  if (!limited.length) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "global-search-empty";

    empty.innerHTML = `
      🔍 No results found for
      <strong>
        "${escapeHTML(search)}"
      </strong>
      <br><br>
      Try another keyword.
    `;

    panel.appendChild(
      empty
    );

    box.appendChild(
      panel
    );

    return;

  }


  limited.forEach(
    result => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "global-search-result";

      let category =
        "Result";

      if (
        result.type ===
        "post"
      ) {

        category =
          "📝 POST";

      } else if (
        result.type ===
        "news"
      ) {

        category =
          "📰 NEWS";

      } else if (
        result.type ===
        "event"
      ) {

        category =
          "📅 EVENT";

      } else if (
        result.type ===
        "research"
      ) {

        category =
          "🔬 RESEARCH";

      }

      const text =
        String(
          result.text || ""
        );

      const shortText =
        text.length > 180
          ? text.substring(
              0,
              180
            ) + "..."
          : text;

      item.innerHTML = `

        <div class="global-search-category">
          ${category}
        </div>

        <div class="global-search-title">
          ${highlightSearchText(
            result.title,
            search
          )}
        </div>

        <div class="global-search-text">
          ${highlightSearchText(
            shortText,
            search
          )}
        </div>

        ${
          result.date
            ? `
              <div
                class="global-search-text"
                style="margin-top:5px;"
              >
                📅
                ${escapeHTML(
                  result.date
                )}
              </div>
            `
            : ""
        }

      `;

      item.addEventListener(
        "click",
        () =>
          openSearchResult(
            result
          )
      );

      panel.appendChild(
        item
      );

    }
  );


  if (
    results.length > 30
  ) {

    const more =
      document.createElement(
        "div"
      );

    more.className =
      "global-search-footer";

    more.textContent =
      "Showing first 30 results.";

    panel.appendChild(
      more
    );

  }

  box.appendChild(
    panel
  );

}


/* =========================================================
   OPEN SEARCH RESULT
========================================================= */

function highlightTarget(
  target
) {

  if (!target) {
    return false;
  }

  target.style.outline =
    "3px solid #007bff";

  target.scrollIntoView({
    behavior:
      "smooth",

    block:
      "center"
  });

  setTimeout(
    () => {

      target.style.outline =
        "";

    },
    2500
  );

  return true;

}


function openSearchResult(
  result
) {

  const box =
    document.getElementById(
      "globalSearchResults"
    );

  if (box) {
    box.innerHTML =
      "";
  }

  if (
    result.type ===
    "post"
  ) {

    const target =
      document.getElementById(
        "post-" +
        result.id
      );

    if (
      !highlightTarget(
        target
      )
    ) {

      window.location.hash =
        "post-" +
        result.id;

    }

    return;

  }


  if (
    result.type ===
    "news"
  ) {

    const target =
      document.getElementById(
        "news-" +
        result.id
      );

    if (
      !highlightTarget(
        target
      )
    ) {

      document
        .getElementById(
          "newsContainer"
        )
        ?.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start"
        });

    }

    return;

  }


  if (
    result.type ===
    "event"
  ) {

    const target =
      document.getElementById(
        "event-" +
        result.id
      );

    if (
      !highlightTarget(
        target
      )
    ) {

      document
        .getElementById(
          "eventsContainer"
        )
        ?.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start"
        });

    }

    return;

  }


  if (
    result.type ===
    "research"
  ) {

    window.location.href =
      "research.html";

  }

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

async function searchWebsite() {

  if (!searchBar) {
    return;
  }

  const search =
    normalizeSearchText(
      searchBar.value
    );

  const box =
    createSearchResultsBox();

  if (!box) {
    return;
  }

  if (!search) {

    box.innerHTML =
      "";

    return;

  }

  const requestId =
    ++searchRequestId;

  box.innerHTML = `
    <div class="global-search-panel">
      <div class="global-search-loading">
        🔎 Searching Sociology Connect...
      </div>
    </div>
  `;

  try {

    const [
      posts,
      news,
      events,
      research
    ] =
      await Promise.all([
        Promise.resolve(
          searchPosts(
            search
          )
        ),

        Promise.resolve(
          searchNews(
            search
          )
        ),

        Promise.resolve(
          searchEvents(
            search
          )
        ),

        searchResearch(
          search
        )
      ]);

    if (
      requestId !==
      searchRequestId
    ) {

      return;

    }

    const results = [
      ...posts,
      ...news,
      ...events,
      ...research
    ];

    const order = {
      post: 1,
      news: 2,
      event: 3,
      research: 4
    };

    results.sort(
      (a, b) =>
        (order[a.type] || 99) -
        (order[b.type] || 99)
    );

    displaySearchResults(
      results,
      search
    );

  } catch (error) {

    console.error(
      "GLOBAL SEARCH ERROR:",
      error
    );

    if (
      requestId !==
      searchRequestId
    ) {

      return;

    }

    box.innerHTML = `
      <div class="global-search-panel">
        <div class="global-search-empty">
          ❌ Search failed.
          Please try again.
        </div>
      </div>
    `;

  }

}


/* =========================================================
   SEARCH INPUT
========================================================= */

searchBar?.addEventListener(
  "input",
  () => {

    clearTimeout(
      searchTimer
    );

    searchTimer =
      setTimeout(
        searchWebsite,
        400
      );

  }
);


searchBar?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      clearTimeout(
        searchTimer
      );

      searchWebsite();

    }

  }
);


addSearchStyles();


/* =========================================================
   CLOSE SEARCH OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (!searchBar) {
      return;
    }

    const box =
      document.getElementById(
        "globalSearchResults"
      );

    if (!box) {
      return;
    }

    const searchContainer =
      searchBar.closest(
        ".search-container"
      );

    if (
      !searchContainer?.contains(
        event.target
      ) &&
      !box.contains(
        event.target
      )
    ) {

      box.innerHTML =
        "";

    }

  }
);


/* =========================================================
   VOICE INPUT
========================================================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


if (SpeechRecognition) {

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-US";

  recognition.interimResults =
    false;

  recognition.continuous =
    false;


  micBtn?.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

        if (micBtn) {

          micBtn.textContent =
            "🔴 Listening...";

          micBtn.disabled =
            true;

        }

        if (userInput) {

          userInput.placeholder =
            "Listening...";

        }

      } catch (error) {

        console.warn(
          "VOICE START ERROR:",
          error
        );

      }

    }
  );


  recognition.onresult =
    event => {

      if (userInput) {

        userInput.value =
          event.results[0][0]
            .transcript;

        userInput.focus();

      }

    };


  recognition.onend =
    () => {

      if (micBtn) {

        micBtn.textContent =
          "🎤";

        micBtn.disabled =
          false;

      }

      if (userInput) {

        userInput.placeholder =
          "Ask your question...";

      }

    };


  recognition.onerror =
    event => {

      console.warn(
        "VOICE ERROR:",
        event.error
      );

      if (micBtn) {

        micBtn.textContent =
          "🎤";

        micBtn.disabled =
          false;

      }

      if (userInput) {

        userInput.placeholder =
          "Ask your question...";

      }

    };

} else {

  if (micBtn) {

    micBtn.disabled =
      true;

    micBtn.title =
      "Voice input is not supported in this browser";

  }

}


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
  "click",
  async () => {

    try {

      logoutBtn.disabled =
        true;

      await signOut(
        auth
      );

      window.location.href =
        "index.html";

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      alert(
        "Logout failed.\n\n" +
        error.message
      );

      logoutBtn.disabled =
        false;

    }

  }
);


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.ctrlKey &&
      event.key.toLowerCase() ===
        "k"
    ) {

      event.preventDefault();

      searchBar?.focus();

    }

  }
);


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "🚀 Sociology Connect 2.1 starting..."
    );

    applySavedTheme();

    loadPosts();

    loadNews();

    loadEvents();

    if (currentUser) {

      createAdminControls();

      startNotificationListener();

    }

    updateNotificationBadge();

    console.log(
      "✅ Sociology Connect 2.1 Ready"
    );

  }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    clearTimeout(
      searchTimer
    );

    clearTimeout(
      trendingTimer
    );

    if (postsUnsubscribe) {

      postsUnsubscribe();

    }

    if (newsUnsubscribe) {

      newsUnsubscribe();

    }

    if (eventsUnsubscribe) {

      eventsUnsubscribe();

    }

    if (
      notificationsUnsubscribe
    ) {

      notificationsUnsubscribe();

    }

    if (
      "speechSynthesis" in
      window
    ) {

      window
        .speechSynthesis
        .cancel();

    }

  }
);
