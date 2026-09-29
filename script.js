/* =========================================================
   SOCIOLOGY CONNECT 2.0
   SCRIPT.JS
   FULL UPDATED VERSION

   FEATURES
   POSTS + LIKES + COMMENTS + SHARE + REPORT
   DELETE + ADMIN CONTROLS
   NEWS + EVENTS
   FIRESTORE NOTIFICATIONS
   UNREAD NOTIFICATION BADGE
   REAL-TIME NOTIFICATIONS
   AI MARI
   DARK MODE
   GLOBAL SEARCH 🔍
   VOICE INPUT
   LOGOUT
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
   SEARCH STATE
========================================================= */

let searchTimer = null;

/*
   Used to make sure an older search result
   does not overwrite a newer search result.
*/
let searchRequestId = 0;


/* =========================================================
   NOTIFICATION STATE
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

    /*
       Keep only the latest 100 IDs
       so localStorage does not grow forever.
    */

    const limited =
      unique.slice(-100);

    localStorage.setItem(
      NOTIFICATION_SEEN_KEY,
      JSON.stringify(limited)
    );

  } catch (error) {

    console.warn(
      "SAVE SEEN NOTIFICATIONS ERROR:",
      error
    );

  }

}


/* =========================================================
   ADMIN CHECK
========================================================= */

function isAdmin() {

  return (
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
      "Time formatting error:",
      error
    );

  }

  return "Just now";

}


/* =========================================================
   FORMAT NOTIFICATION TIME
========================================================= */

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
      "Notification time error:",
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

    const snap =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    if (snap.exists()) {

      const data =
        snap.data();

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
      "Could not load user name:",
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

    if (user) {

      const name =
        await getUserName(user);

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

      /*
         DOM may already be loaded or
         may still be loading.
      */

      if (
        document.readyState !==
        "loading"
      ) {

        createAdminControls();

      }

      /*
         Start Firestore notifications.
      */

      startNotificationListener();

      /*
         Refresh posts so admin buttons
         appear immediately after login.
      */

      if (postsContainer) {

        loadPosts();

      }

      /*
         Refresh current search because
         Research becomes available after login.
      */

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

      /*
         Refresh posts after logout so
         delete buttons disappear.
      */

      if (postsContainer) {

        loadPosts();

      }

      /*
         Refresh search because
         private Research results are no
         longer available.
      */

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
      "Please wait..."
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
  (event) => {

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

    loadTrendingPosts();

  } catch (error) {

    console.error(
      "LIKE ERROR:",
      error
    );

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
      currentUser &&
      likes.docs.some(
        item =>
          item.id ===
          currentUser.uid
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
   COMMENT
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
      error.message
    );

    return false;

  }

}


/* =========================================================
   LOAD COMMENTS
========================================================= */

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

    box.style.marginTop =
      "12px";

    box.style.padding =
      "10px";

    box.style.borderTop =
      "1px solid #ddd";

    [...snap.docs]
      .sort(
        (a, b) => {

          const x =
            a.data()
              .createdAt
              ?.toMillis?.() || 0;

          const y =
            b.data()
              .createdAt
              ?.toMillis?.() || 0;

          return x - y;

        }
      )
      .forEach(
        item => {

          const comment =
            item.data();

          const div =
            document.createElement(
              "div"
            );

          div.style.padding =
            "8px 0";

          div.style.borderBottom =
            "1px solid #eee";

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
      navigator.share
    ) {

      await navigator.share(
        {
          title:
            "Sociology Connect",

          text,

          url
        }
      );

    } else if (
      navigator.clipboard
    ) {

      await navigator.clipboard
        .writeText(url);

      alert(
        "Post link copied."
      );

    } else {

      alert(
        url
      );

    }

  } catch (error) {

    console.warn(
      "SHARE ERROR:",
      error
    );

  }

}


/* =========================================================
   REPORT POST
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
      "✅ Report submitted successfully.\n\n" +
      "Thank you for helping keep Sociology Connect safe."
    );

  } catch (error) {

    console.error(
      "REPORT ERROR:",
      error
    );

    alert(
      "❌ Unable to submit report.\n\n" +
      error.message
    );

  }

}


/* =========================================================
   DELETE POST DATA
   Used by single delete and clear-all.
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

  for (
    const item of likes.docs
  ) {

    await deleteDoc(
      item.ref
    );

  }

  const comments =
    await getDocs(
      collection(
        db,
        "posts",
        postId,
        "comments"
      )
    );

  for (
    const item of comments.docs
  ) {

    await deleteDoc(
      item.ref
    );

  }

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

    loadTrendingPosts();

    return true;

  } catch (error) {

    console.error(
      "DELETE POST ERROR:",
      error
    );

    if (askConfirmation) {

      alert(
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

    const posts =
      await getDocs(
        collection(
          db,
          "posts"
        )
      );

    for (
      const post of posts.docs
    ) {

      await deletePostData(
        post.id
      );

    }

    alert(
      "✅ All posts deleted successfully."
    );

    loadTrendingPosts();

  } catch (error) {

    console.error(
      "CLEAR POSTS ERROR:",
      error
    );

    alert(
      "❌ Could not clear all posts.\n\n" +
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

      async (snapshot) => {

        postsContainer.innerHTML =
          "";

        if (
          snapshot.empty
        ) {

          postsContainer.innerHTML = `
            <div class="post-card">
              No posts yet.
              Be the first student
              to post! 📚
            </div>
          `;

          loadTrendingPosts();

          return;

        }

        for (
          const postDoc of
          snapshot.docs
        ) {

          const post =
            postDoc.data();

          const postId =
            postDoc.id;

          const name =
            post.name ||
            "Student";

          const card =
            document.createElement(
              "div"
            );

          card.className =
            "post-card";

          card.id =
            "post-" +
            postId;

          const canDelete =
            currentUser &&
            (
              isAdmin() ||
              currentUser.uid ===
                post.userId
            );

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

              <button
                class="like-btn"
              >
                🤍 Like (0)
              </button>

              <button
                class="comment-btn"
              >
                💬 Comment (0)
              </button>

              <button
                class="share-btn"
              >
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
            () => {

              toggleLike(
                postId,
                likeBtn
              );

            }
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

              loadTrendingPosts();

            }
          );


          shareBtn?.addEventListener(
            "click",
            () => {

              sharePost(
                postId,
                post.text || ""
              );

            }
          );


          reportBtn?.addEventListener(
            "click",
            () => {

              reportPost(
                postId,
                post.text || "",
                post.userId || ""
              );

            }
          );


          deleteBtn?.addEventListener(
            "click",
            async () => {

              const deleted =
                await deletePost(
                  postId,
                  post.userId,
                  true
                );

              if (deleted) {

                loadTrendingPosts();

              }

            }
          );


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

        loadTrendingPosts();

        searchWebsite();

      },

      (error) => {

        console.error(
          "LOAD POSTS ERROR:",
          error
        );

        postsContainer.innerHTML = `
          <div class="post-card">
            ❌ Unable to load posts.
          </div>
        `;

      }
    );

}


/* =========================================================
   TRENDING POSTS
========================================================= */

async function loadTrendingPosts() {

  const trendingContainer =
    document.getElementById(
      "trendingContainer"
    );

  if (!trendingContainer) {
    return;
  }

  try {

    const postsSnapshot =
      await getDocs(
        collection(
          db,
          "posts"
        )
      );

    if (
      postsSnapshot.empty
    ) {

      trendingContainer.innerHTML = `
        <div class="post-card">
          🔥 No trending posts yet.
        </div>
      `;

      return;

    }

    const posts = [];

    for (
      const postDoc of
      postsSnapshot.docs
    ) {

      const post =
        postDoc.data();

      const likes =
        (
          await getDocs(
            collection(
              db,
              "posts",
              postDoc.id,
              "likes"
            )
          )
        ).size;

      const comments =
        (
          await getDocs(
            collection(
              db,
              "posts",
              postDoc.id,
              "comments"
            )
          )
        ).size;

      posts.push({

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

      });

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

      (snapshot) => {

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
          (docSnap) => {

            const news =
              docSnap.data();

            const card =
              document.createElement(
                "div"
              );

            card.className =
              "card";

            card.id =
              "news-" +
              docSnap.id;

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

      (error) => {

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

      (snapshot) => {

        eventsContainer.innerHTML =
          "";

        if (
          snapshot.empty
        ) {

          eventsContainer.innerHTML = `
            <div class="event-card">
              📅 No events
              available.
            </div>
          `;

          return;

        }

        snapshot.forEach(
          (docSnap) => {

            const event =
              docSnap.data();

            const card =
              document.createElement(
                "div"
              );

            card.className =
              "event-card";

            card.id =
              "event-" +
              docSnap.id;

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

      (error) => {

        console.error(
          "EVENTS ERROR:",
          error
        );

        eventsContainer.innerHTML = `
          <div class="event-card">
            ❌ Unable to load
            events.
          </div>
        `;

      }
    );

}


/* =========================================================
   FIRESTORE NOTIFICATIONS
========================================================= */


/* =========================================================
   START NOTIFICATION LISTENER
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

      (snapshot) => {

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

      (error) => {

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


/* =========================================================
   STOP NOTIFICATION LISTENER
========================================================= */

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


/* =========================================================
   NOTIFICATION BADGE
========================================================= */

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


/* =========================================================
   SHOW NOTIFICATIONS
========================================================= */

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

          const title =
            notification.title ||
            "Notification";

          const body =
            notification.message ||
            "";

          const time =
            formatNotificationTime(
              notification.createdAt
            );

          return (
            "🔔 " +
            title +
            "\n\n" +
            body +
            "\n\n" +
            "🕒 " +
            time
          );

        }
      )
      .join(
        "\n\n━━━━━━━━━━━━━━\n\n"
      );

  alert(
    message
  );

  /*
     Mark displayed notifications
     as seen on this device.
  */

  const oldSeen =
    getSeenNotificationIds();

  const displayedIds =
    latestNotifications
      .slice(0, 10)
      .map(
        notification =>
          notification.id
      );

  saveSeenNotificationIds(
    [
      ...oldSeen,
      ...displayedIds
    ]
  );

  updateNotificationBadge();

}


notifyBtn?.addEventListener(
  "click",
  showNotifications
);


/* =========================================================
   AI MARI
========================================================= */

const chatMessages = [

  {
    role:
      "system",

    content:
      `You are AI Mari, the official academic AI assistant of Sociology Connect – Arsi University (Sociology & Social Work).

Help students with Sociology, Social Work, Psychology, Anthropology, Political Science, Economics, Social Policy, Community Development, Human Rights, Gender and Society, Research Methods, Academic Writing, APA 7, Assignments, Presentations and Research Projects.

Always answer in the same language used by the user.

- Afaan Oromoo → Answer in natural Afaan Oromoo.
- Amharic → Answer in natural Amharic.
- English → Answer in clear English.

Never invent research data or citations.`
  }

];


/* =========================================================
   SEND MESSAGE TO SERVER
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

  userBox.innerHTML =
    `<b>You:</b><br>${escapeHTML(
      text
    )}`;

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
      Typing... 🤖
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
                text
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI request failed"
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
        ${escapeHTML(
          reply
        )}
      </span>

      <br><br>

      <button class="copy-btn">
        📋 Copy
      </button>

      <button class="speak-btn">
        🔊 Listen
      </button>

    `;


    aiBox
      .querySelector(
        ".copy-btn"
      )
      ?.addEventListener(
        "click",
        async () => {

          try {

            await navigator
              .clipboard
              .writeText(
                reply
              );

          } catch {

            alert(
              "Copy failed."
            );

          }

        }
      );


    aiBox
      .querySelector(
        ".speak-btn"
      )
      ?.addEventListener(
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
            /[\u1200-\u137F]/
              .test(reply)
              ? "am-ET"
              : "en-US";

          speech.rate =
            0.95;

          speech.pitch =
            1;

          const button =
            aiBox.querySelector(
              ".speak-btn"
            );

          button.textContent =
            "🔊 Speaking...";

          speech.onend =
            () => {

              button.textContent =
                "🔊 Listen";

            };

          speech.onerror =
            () => {

              button.textContent =
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
      ❌ ${escapeHTML(
        error.message ||
        "AI request failed"
      )}
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


/* =========================================================
   AI SEND BUTTON
========================================================= */

sendBtn?.addEventListener(
  "click",
  sendToServer
);


/* =========================================================
   AI ENTER KEY
========================================================= */

userInput?.addEventListener(
  "keydown",
  (event) => {

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

  localStorage.setItem(
    "sociologyTheme",
    document.body.classList.contains(
      "dark"
    )
      ? "dark"
      : "light"
  );

  updateThemeButton();

}


themeBtn?.addEventListener(
  "click",
  toggleTheme
);


/* =========================================================
   GLOBAL SEARCH 🔍
   SEARCHES:
   POSTS
   NEWS
   EVENTS
   RESEARCH
========================================================= */


/* =========================================================
   CREATE SEARCH RESULT BOX
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

  } else if (searchBar?.parentElement) {

    searchBar.parentElement.appendChild(
      box
    );

  }

  return box;

}


/* =========================================================
   SEARCH RESULT STYLES
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
      position: relative;
      z-index: 999;
    }

    .global-search-panel {
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,.12);
      overflow: hidden;
    }

    .global-search-header {
      padding: 12px 15px;
      font-weight: 700;
      border-bottom: 1px solid #eee;
      color: #007bff;
    }

    .global-search-result {
      padding: 13px 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background .2s ease;
    }

    .global-search-result:last-child {
      border-bottom: none;
    }

    .global-search-result:hover {
      background: #f1f7ff;
    }

    .global-search-category {
      font-size: 12px;
      font-weight: 700;
      color: #007bff;
      margin-bottom: 5px;
    }

    .global-search-title {
      font-weight: 700;
      margin-bottom: 5px;
    }

    .global-search-text {
      font-size: 14px;
      opacity: .8;
      line-height: 1.5;
    }

    .global-search-empty {
      padding: 20px;
      text-align: center;
      color: #777;
    }

    .global-search-loading {
      padding: 20px;
      text-align: center;
      color: #007bff;
      font-weight: 600;
    }

    .global-search-footer {
      padding: 10px 15px;
      text-align: center;
      font-size: 12px;
      opacity: .7;
    }

    #globalSearchResults mark {
      background: #fff3a3;
      color: inherit;
      border-radius: 3px;
      padding: 0 2px;
    }

    body.dark #globalSearchResults .global-search-panel {
      background: #1e1e1e;
      border-color: #444;
      color: #fff;
    }

    body.dark #globalSearchResults .global-search-header {
      border-color: #444;
    }

    body.dark #globalSearchResults .global-search-result {
      border-color: #444;
    }

    body.dark #globalSearchResults .global-search-result:hover {
      background: #292929;
    }

    body.dark #globalSearchResults .global-search-empty {
      color: #aaa;
    }

  `;

  document.head.appendChild(
    style
  );

}


/* =========================================================
   NORMALIZE SEARCH TEXT
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


/* =========================================================
   CHECK MATCH
========================================================= */

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
   SEARCH POSTS
========================================================= */

async function searchPosts(
  search
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "posts"
        )
      );

    const results = [];

    snapshot.forEach(
      postDoc => {

        const post =
          postDoc.data();

        if (
          searchMatches(
            [
              post.text,
              post.name,
              post.email
            ],
            search
          )
        ) {

          results.push({

            type:
              "post",

            id:
              postDoc.id,

            title:
              post.name ||
              "Student Post",

            text:
              post.text ||
              "",

            icon:
              "📝"

          });

        }

      }
    );

    return results;

  } catch (error) {

    console.error(
      "SEARCH POSTS ERROR:",
      error
    );

    return [];

  }

}


/* =========================================================
   SEARCH NEWS
========================================================= */

async function searchNews(
  search
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "news"
        )
      );

    const results = [];

    snapshot.forEach(
      newsDoc => {

        const news =
          newsDoc.data();

        if (
          searchMatches(
            [
              news.title,
              news.description
            ],
            search
          )
        ) {

          results.push({

            type:
              "news",

            id:
              newsDoc.id,

            title:
              news.title ||
              "Latest News",

            text:
              news.description ||
              "",

            icon:
              "📰"

          });

        }

      }
    );

    return results;

  } catch (error) {

    console.error(
      "SEARCH NEWS ERROR:",
      error
    );

    return [];

  }

}


/* =========================================================
   SEARCH EVENTS
========================================================= */

async function searchEvents(
  search
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "events"
        )
      );

    const results = [];

    snapshot.forEach(
      eventDoc => {

        const event =
          eventDoc.data();

        if (
          searchMatches(
            [
              event.title,
              event.description,
              event.date
            ],
            search
          )
        ) {

          results.push({

            type:
              "event",

            id:
              eventDoc.id,

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

          });

        }

      }
    );

    return results;

  } catch (error) {

    console.error(
      "SEARCH EVENTS ERROR:",
      error
    );

    return [];

  }

}


/* =========================================================
   SEARCH RESEARCH
   ONLY USER-ACCESSIBLE RESEARCH
========================================================= */

async function searchResearch(
  search
) {

  /*
     User must be logged in because
     Firestore rules protect research.
  */

  if (!currentUser) {

    return [];

  }

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "research"
        )
      );

    const results = [];

    snapshot.forEach(
      researchDoc => {

        const research =
          researchDoc.data();

        if (
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
        ) {

          results.push({

            type:
              "research",

            id:
              researchDoc.id,

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

          });

        }

      }
    );

    return results;

  } catch (error) {

    /*
       If Firestore blocks research
       access, do not break the
       other search categories.
    */

    console.warn(
      "RESEARCH SEARCH SKIPPED:",
      error
    );

    return [];

  }

}


/* =========================================================
   HIGHLIGHT SEARCH TEXT
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

  /*
     Escape regular-expression
     special characters.
  */

  const escapedSearch =
    String(search)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  try {

    const regex =
      new RegExp(
        `(${escapedSearch})`,
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
   SHOW SEARCH RESULTS
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

  /*
     Maximum 30 results.
  */

  const limitedResults =
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


  /* =======================================================
     HEADER
  ======================================================= */

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


  /* =======================================================
     NO RESULTS
  ======================================================= */

  if (!limitedResults.length) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "global-search-empty";

    empty.innerHTML =
      `
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


  /* =======================================================
     RESULTS
  ======================================================= */

  limitedResults.forEach(
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

      const shortText =
        String(
          result.text || ""
        ).length > 180
          ? String(
              result.text || ""
            ).substring(
              0,
              180
            ) + "..."
          : String(
              result.text || ""
            );

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
                📅 ${escapeHTML(
                  result.date
                )}
              </div>
            `
            : ""
        }

      `;


      /* =====================================================
         CLICK RESULT
      ===================================================== */

      item.addEventListener(
        "click",
        () => {

          openSearchResult(
            result
          );

        }
      );

      panel.appendChild(
        item
      );

    }
  );


  /* =======================================================
     SHOW LIMIT MESSAGE
  ======================================================= */

  if (
    results.length >
    30
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


  /* =======================================================
     POST
  ======================================================= */

  if (
    result.type ===
    "post"
  ) {

    const target =
      document.getElementById(
        "post-" +
        result.id
      );

    if (target) {

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

    } else {

      window.location.hash =
        "post-" +
        result.id;

    }

    return;

  }


  /* =======================================================
     NEWS
  ======================================================= */

  if (
    result.type ===
    "news"
  ) {

    const target =
      document.getElementById(
        "news-" +
        result.id
      );

    if (target) {

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

    } else {

      const container =
        document.getElementById(
          "newsContainer"
        );

      container?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

    }

    return;

  }


  /* =======================================================
     EVENTS
  ======================================================= */

  if (
    result.type ===
    "event"
  ) {

    const target =
      document.getElementById(
        "event-" +
        result.id
      );

    if (target) {

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

    } else {

      const container =
        document.getElementById(
          "eventsContainer"
        );

      container?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

    }

    return;

  }


  /* =======================================================
     RESEARCH
  ======================================================= */

  if (
    result.type ===
    "research"
  ) {

    window.location.href =
      "research.html";

  }

}


/* =========================================================
   GLOBAL SEARCH FUNCTION
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

  /*
     Empty search
  */

  if (!search) {

    box.innerHTML =
      "";

    return;

  }

  /*
     Create a unique request ID.
     If user types a new search while
     this search is running, the old
     result will not replace the new one.
  */

  const requestId =
    ++searchRequestId;


  /*
     Loading message
  */

  box.innerHTML = `
    <div class="global-search-panel">
      <div class="global-search-loading">
        🔎 Searching Sociology Connect...
      </div>
    </div>
  `;


  try {

    /*
       Search all sections
       at the same time.
    */

    const [
      posts,
      news,
      events,
      research
    ] =
      await Promise.all([
        searchPosts(
          search
        ),

        searchNews(
          search
        ),

        searchEvents(
          search
        ),

        searchResearch(
          search
        )
      ]);


    /*
       Do not show an old request
       after a newer search has started.
    */

    if (
      requestId !==
      searchRequestId
    ) {

      return;

    }


    /*
       Combine results.
    */

    const results = [

      ...posts,

      ...news,

      ...events,

      ...research

    ];


    /*
       Sort results by category
       for consistent display.
    */

    results.sort(
      (a, b) => {

        const order = {
          post: 1,
          news: 2,
          event: 3,
          research: 4
        };

        return (
          (order[a.type] || 99) -
          (order[b.type] || 99)
        );

      }
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
        () => {

          searchWebsite();

        },
        350
      );

  }
);


/* =========================================================
   SEARCH ENTER KEY
========================================================= */

searchBar?.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      clearTimeout(
        searchTimer
      );

      searchWebsite();

    }

  }
);


/* =========================================================
   SEARCH STYLES STARTUP
========================================================= */

addSearchStyles();


/* =========================================================
   CLOSE SEARCH WHEN CLICKING OUTSIDE
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
   VOICE RECOGNITION
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

        micBtn.textContent =
          "🔴 Listening...";

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
    (event) => {

      if (userInput) {

        userInput.value =
          event
            .results[0][0]
            .transcript;

        userInput.focus();

      }

      if (micBtn) {

        micBtn.textContent =
          "🎤";

      }

    };


  recognition.onend =
    () => {

      if (micBtn) {

        micBtn.textContent =
          "🎤";

      }

      if (userInput) {

        userInput.placeholder =
          "Ask your question...";

      }

    };


  recognition.onerror =
    (event) => {

      console.warn(
        "VOICE ERROR:",
        event.error
      );

      if (micBtn) {

        micBtn.textContent =
          "🎤";

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
        error.message
      );

    }

  }
);


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

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
      "🚀 Sociology Connect starting..."
    );

    applySavedTheme();

    loadPosts();

    loadNews();

    loadEvents();

    /*
       If authentication already finished
       before DOMContentLoaded, make sure
       admin controls are created.
    */

    if (currentUser) {

      createAdminControls();

      startNotificationListener();

    }

    updateNotificationBadge();

    console.log(
      "✅ Sociology Connect Ready"
    );

  }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

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

  }
);
