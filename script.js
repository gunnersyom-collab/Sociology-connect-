/* =========================================================
   SOCIOLOGY CONNECT 2.0
   SCRIPT.JS
   FULL UPDATED VERSION

   FEATURES:
   POSTS + LIKES + COMMENTS + SHARE + REPORT
   DELETE + ADMIN CONTROLS
   NEWS + EVENTS
   FIRESTORE NOTIFICATIONS
   AI MARI
   DARK MODE
   SEARCH
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
        .toLocaleString();

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

      createAdminControls();

      /*
         Start Firestore notifications
      */
      startNotificationListener();

      /*
         Refresh posts so admin buttons
         appear immediately after login.
      */
      if (postsContainer) {
        loadPosts();
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

    }

  }
);


/* =========================================================
   PART 2
   CREATE POST
   LIKE
   COMMENT
   SHARE
   REPORT
   DELETE
========================================================= */


/* =========================================================
   CREATE POST
========================================================= */

async function createPost() {

  if (!postInput) {
    return;
  }

  if (!authReady) {

    alert("Please wait...");

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
      const item of
      likes.docs
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
      const item of
      comments.docs
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
      const post of
      posts.docs
    ) {

      await deletePost(
        post.id,
        post.data().userId,
        false
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
   PART 3
   LOAD POSTS
========================================================= */

function loadPosts() {

  if (!postsContainer) {
    return;
  }

  /*
     Prevent duplicate Firebase listeners.
  */
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
   PART 4
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
   LOAD EVENTS
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
   PART 5
   FIRESTORE NOTIFICATIONS
========================================================= */


/* =========================================================
   START NOTIFICATION LISTENER
========================================================= */

function startNotificationListener() {

  if (!currentUser) {
    return;
  }

  if (notificationsUnsubscribe) {

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

}


/* =========================================================
   NOTIFICATION BADGE
========================================================= */

function updateNotificationBadge() {

  if (!notifyBtn) {
    return;
  }

  const count =
    latestNotifications.length;

  if (count > 0) {

    notifyBtn.innerHTML =
      `🔔 <span style="
        color:red;
        font-weight:bold;
      ">${count}</span>`;

    notifyBtn.title =
      `${count} notification${
        count === 1
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

}


notifyBtn?.addEventListener(
  "click",
  showNotifications
);


/* =========================================================
   PART 6
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
   SEND BUTTON
========================================================= */

sendBtn?.addEventListener(
  "click",
  sendToServer
);


/* =========================================================
   ENTER KEY
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
   PART 7
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
   PART 8
   SEARCH
========================================================= */

function searchWebsite() {

  if (!searchBar) {
    return;
  }

  const search =
    searchBar.value
      .toLowerCase()
      .trim();

  let count =
    0;

  const items =
    document.querySelectorAll(
      "#postsContainer .post-card, " +
      "#newsContainer .card, " +
      "#eventsContainer .event-card, " +
      "#trendingContainer .post-card"
    );

  items.forEach(
    item => {

      const text =
        item.textContent
          .toLowerCase();

      const show =
        !search ||
        text.includes(search);

      item.style.display =
        show
          ? ""
          : "none";

      if (show) {
        count++;
      }

    }
  );

  const counter =
    document.getElementById(
      "searchCount"
    );

  if (counter) {

    counter.textContent =
      search
        ? `${count} results found`
        : "";

  }

}


searchBar?.addEventListener(
  "input",
  searchWebsite
);


/* =========================================================
   PART 9
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
   PART 10
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
   PART 11
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
   PART 12
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
       Notification listener is started
       by Firebase Auth when user logs in.
    */

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

    if (notificationsUnsubscribe) {
      notificationsUnsubscribe();
    }

  }
);
