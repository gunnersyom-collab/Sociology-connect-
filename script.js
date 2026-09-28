/* =========================================================
   SOCIOLOGY CONNECT 2.0
   SCRIPT.JS
   FULL VERSION

   POSTS + LIKES + COMMENTS + SHARE + REPORT
   NEWS + EVENTS + AI MARI + DARK MODE + SEARCH
   FIREBASE NOTIFICATIONS + UNREAD BADGE
   VOICE + LOGOUT + ADMIN CONTROLS
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

const ADMIN_EMAIL = "yom@gmail.com";

let notificationUnsubscribe = null;
let allNotifications = [];


/* =========================================================
   ADMIN CHECK
========================================================= */

function isAdmin() {

  return currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

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

    if (typeof timestamp.toDate === "function") {

      return timestamp.toDate().toLocaleString(
        "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

    }

  } catch (e) {

    console.warn(e);

  }

  return "Just now";

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
        doc(db, "users", user.uid)
      );

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

      if (
        document.readyState !==
        "loading"
      ) {

        createAdminControls();

      }

      /* =========================
         FIREBASE NOTIFICATIONS
      ========================= */

      startNotificationListener();

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

      closeNotificationPanel();

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
   ADMIN
========================================================= */


/* =========================================================
   CREATE POST
========================================================= */

async function createPost() {

  if (!postInput) {
    return;
  }

  if (!authReady) {

    return alert(
      "Please wait..."
    );

  }

  if (!currentUser) {

    return alert(
      "Please login first."
    );

  }

  const text =
    postInput.value.trim();

  if (!text) {

    return alert(
      "Write something first."
    );

  }

  if (postBtn) {

    postBtn.disabled = true;

    postBtn.textContent =
      "Posting...";

  }

  try {

    const name =
      await getUserName(
        currentUser
      );

    await addDoc(
      collection(db, "posts"),
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

  } catch (e) {

    alert(e.message);

    console.error(e);

  } finally {

    if (postBtn) {

      postBtn.disabled = false;

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
  (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

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
      await getDoc(likeRef);

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

  } catch (e) {

    console.error(e);

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

  } catch (e) {

    console.error(e);

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

  } catch (e) {

    alert(e.message);

    console.error(e);

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

          const c =
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
                c.name ||
                "Student"
              )}
            </strong>

            <br>

            ${escapeHTML(
              c.text || ""
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

  } catch (e) {

    console.error(e);

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

    }

  } catch (e) {

    console.warn(e);

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
        postId:
          postId,

        postText:
          postText || "",

        reportedUserId:
          ownerId || "",

        reporterId:
          currentUser.uid,

        reporterName:
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
   DELETE POST
========================================================= */

async function deletePost(
  postId,
  ownerId
) {

  if (!currentUser) {

    return alert(
      "Login first."
    );

  }

  if (
    !(
      isAdmin() ||
      currentUser.uid ===
      ownerId
    )
  ) {

    return alert(
      "You can delete only your own post."
    );

  }

  if (
    !confirm(
      "Delete this post?"
    )
  ) {

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

  } catch (e) {

    alert(
      e.message
    );

  }

}


/* =========================================================
   CLEAR ALL POSTS
========================================================= */

async function clearAllPosts() {

  if (!isAdmin()) {

    return alert(
      "Admin only."
    );

  }

  if (
    !confirm(
      "Delete ALL posts?"
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
        post.data().userId
      );

    }

    alert(
      "All posts deleted."
    );

  } catch (error) {

    console.error(error);

    alert(
      "Unable to clear all posts."
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
   TRENDING POSTS
========================================================= */


/* =========================================================
   LOAD POSTS
========================================================= */

function loadPosts() {

  if (!postsContainer) {
    return;
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
              style="
                color:#dc3545;
              "
            >
              🚩 Report
            </button>


            ${
              canDelete
                ? `
                  <button
                    class="delete-btn"
                    style="
                      color:#dc3545
                    "
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

            await deletePost(
              postId,
              post.userId
            );

            loadTrendingPosts();

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
   EVENTS
========================================================= */


/* =========================================================
   LOAD NEWS
========================================================= */

function loadNews() {

  const newsContainer =
    document.getElementById(
      "newsContainer"
    );

  if (!newsContainer) {
    return;
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
            JSON.stringify(
              {
                message:
                  text
              }
            )
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


          const btn =
            aiBox.querySelector(
              ".speak-btn"
            );


          btn.textContent =
            "🔊 Speaking...";


          speech.onend =
            () => {

              btn.textContent =
                "🔊 Listen";

            };


          speech.onerror =
            () => {

              btn.textContent =
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
  (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      sendToServer();

    }

  }
);


/* =========================================================
   PART 6
   DARK MODE
   SEARCH
========================================================= */


/* =========================================================
   UPDATE THEME BUTTON
========================================================= */

function updateThemeButton() {

  if (!themeBtn) {
    return;
  }

  themeBtn.textContent =
    document.body.classList
      .contains("dark")
      ? "☀️"
      : "🌙";

}


/* =========================================================
   APPLY SAVED THEME
========================================================= */

function applySavedTheme() {

  const saved =
    localStorage.getItem(
      "sociologyTheme"
    );


  if (
    saved === "dark"
  ) {

    document.body.classList
      .add("dark");

  } else {

    document.body.classList
      .remove("dark");

  }


  updateThemeButton();

}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleTheme() {

  document.body.classList
    .toggle("dark");


  localStorage.setItem(
    "sociologyTheme",

    document.body.classList
      .contains("dark")
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
   SEARCH
========================================================= */

function searchWebsite() {

  if (!searchBar) {
    return;
  }


  const q =
    searchBar.value
      .toLowerCase()
      .trim();


  let count =
    0;


  const items =
    document.querySelectorAll(
      "#postsContainer .post-card, #newsContainer .card, #eventsContainer .event-card, #trendingContainer .post-card"
    );


  items.forEach(
    item => {

      const text =
        item.textContent
          .toLowerCase();


      const show =
        !q ||
        text.includes(q);


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
      q
        ? `${count} results found`
        : "";

  }

}


searchBar?.addEventListener(
  "input",
  searchWebsite
);


/* =========================================================
   PART 7
   🔔 FIREBASE NOTIFICATIONS
========================================================= */


/* =========================================================
   GET READ NOTIFICATION IDS
========================================================= */

function getReadNotificationIds() {

  if (!currentUser) {
    return [];
  }

  try {

    return JSON.parse(
      localStorage.getItem(
        `sc_read_notifications_${currentUser.uid}`
      )
    ) || [];

  } catch {

    return [];

  }

}


/* =========================================================
   SAVE READ NOTIFICATION IDS
========================================================= */

function saveReadNotificationIds(ids) {

  if (!currentUser) {
    return;
  }

  try {

    localStorage.setItem(
      `sc_read_notifications_${currentUser.uid}`,
      JSON.stringify(ids)
    );

  } catch (error) {

    console.warn(
      "Unable to save notification state:",
      error
    );

  }

}


/* =========================================================
   GET UNREAD COUNT
========================================================= */

function getUnreadNotificationCount() {

  const readIds =
    getReadNotificationIds();

  return allNotifications.filter(
    notification =>
      !readIds.includes(
        notification.id
      )
  ).length;

}


/* =========================================================
   UPDATE NOTIFICATION BADGE
========================================================= */

function updateNotificationBadge() {

  if (!notifyBtn) {
    return;
  }

  const unread =
    getUnreadNotificationCount();

  if (unread > 0) {

    notifyBtn.innerHTML = `
      🔔
      <span
        class="notification-badge"
        style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:20px;
          height:20px;
          padding:0 6px;
          margin-left:3px;
          background:#dc3545;
          color:#fff;
          border-radius:20px;
          font-size:11px;
          font-weight:bold;
          vertical-align:middle;
        "
      >
        ${unread}
      </span>
    `;

    notifyBtn.title =
      `${unread} unread notification${unread === 1 ? "" : "s"}`;

  } else {

    notifyBtn.innerHTML =
      "🔔";

    notifyBtn.title =
      "Notifications";

  }

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

    console.warn(error);

  }

  return "Recently";

}


/* =========================================================
   START NOTIFICATION LISTENER
========================================================= */

function startNotificationListener() {

  stopNotificationListener();

  if (!currentUser) {
    return;
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

  notificationUnsubscribe =
    onSnapshot(

      notificationsQuery,

      (snapshot) => {

        allNotifications =
          snapshot.docs.map(
            item => ({
              id:
                item.id,
              ...item.data()
            })
          );

        updateNotificationBadge();

        updateNotificationPanel();

      },

      (error) => {

        console.error(
          "NOTIFICATIONS ERROR:",
          error
        );

        allNotifications = [];

        updateNotificationBadge();

      }

    );

}


/* =========================================================
   STOP NOTIFICATION LISTENER
========================================================= */

function stopNotificationListener() {

  if (
    typeof notificationUnsubscribe ===
    "function"
  ) {

    notificationUnsubscribe();

    notificationUnsubscribe =
      null;

  }

  allNotifications = [];

  updateNotificationBadge();

}


/* =========================================================
   CREATE NOTIFICATION PANEL
========================================================= */

function createNotificationPanel() {

  if (
    document.getElementById(
      "scNotificationPanel"
    )
  ) {

    return;

  }

  const panel =
    document.createElement(
      "div"
    );

  panel.id =
    "scNotificationPanel";

  panel.innerHTML = `

    <div
      class="sc-notification-overlay"
      id="scNotificationOverlay"
    ></div>

    <div
      class="sc-notification-box"
      id="scNotificationBox"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >

      <div
        class="sc-notification-header"
      >

        <div>

          <h2>
            🔔 Notifications
          </h2>

          <p
            id="scNotificationSummary"
          >
            Loading notifications...
          </p>

        </div>

        <button
          id="scNotificationClose"
          class="sc-notification-close"
          type="button"
          aria-label="Close notifications"
        >
          ✕
        </button>

      </div>


      <div
        class="sc-notification-actions"
      >

        <button
          id="scMarkAllRead"
          type="button"
        >
          ✅ Mark All Read
        </button>

        <button
          id="scClearRead"
          type="button"
        >
          🗑️ Clear Read
        </button>

      </div>


      <div
        id="scNotificationList"
        class="sc-notification-list"
      >
        <div
          class="sc-notification-empty"
        >
          Loading...
        </div>
      </div>

    </div>

  `;

  document.body.appendChild(
    panel
  );


  addNotificationPanelStyles();


  document
    .getElementById(
      "scNotificationClose"
    )
    ?.addEventListener(
      "click",
      closeNotificationPanel
    );


  document
    .getElementById(
      "scNotificationOverlay"
    )
    ?.addEventListener(
      "click",
      closeNotificationPanel
    );


  document
    .getElementById(
      "scMarkAllRead"
    )
    ?.addEventListener(
      "click",
      markAllNotificationsRead
    );


  document
    .getElementById(
      "scClearRead"
    )
    ?.addEventListener(
      "click",
      clearReadNotifications
    );

}


/* =========================================================
   NOTIFICATION PANEL STYLES
========================================================= */

function addNotificationPanelStyles() {

  if (
    document.getElementById(
      "scNotificationStyles"
    )
  ) {

    return;

  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "scNotificationStyles";

  style.textContent = `

    #scNotificationPanel{
      position:fixed;
      inset:0;
      z-index:99999;
      display:none;
    }

    #scNotificationPanel.sc-open{
      display:block;
    }

    .sc-notification-overlay{
      position:absolute;
      inset:0;
      background:rgba(0,0,0,.55);
      backdrop-filter:blur(3px);
    }

    .sc-notification-box{
      position:absolute;
      top:70px;
      right:18px;
      width:min(430px, calc(100% - 28px));
      max-height:calc(100vh - 90px);
      background:#fff;
      border-radius:18px;
      box-shadow:0 20px 60px rgba(0,0,0,.25);
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }

    .sc-notification-header{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:15px;
      padding:20px;
      background:linear-gradient(135deg,#007bff,#0056b3);
      color:#fff;
    }

    .sc-notification-header h2{
      margin:0;
      font-size:20px;
    }

    .sc-notification-header p{
      margin:6px 0 0;
      font-size:13px;
      opacity:.9;
    }

    .sc-notification-close{
      border:none;
      background:rgba(255,255,255,.15);
      color:#fff;
      width:36px;
      height:36px;
      border-radius:50%;
      cursor:pointer;
      font-size:18px;
      margin:0;
    }

    .sc-notification-actions{
      display:flex;
      gap:8px;
      padding:12px 15px;
      border-bottom:1px solid #e5e7eb;
      background:#f8fbff;
    }

    .sc-notification-actions button{
      flex:1;
      border:1px solid #d5e5f8;
      background:#fff;
      color:#0056b3;
      padding:9px 10px;
      border-radius:9px;
      cursor:pointer;
      font-size:12px;
      font-weight:bold;
      margin:0;
    }

    .sc-notification-list{
      overflow-y:auto;
      padding:12px;
    }

    .sc-notification-card{
      position:relative;
      padding:15px;
      margin-bottom:10px;
      border:1px solid #dbe9ff;
      border-left:5px solid #007bff;
      border-radius:13px;
      background:#f8fbff;
      cursor:pointer;
      transition:.2s;
    }

    .sc-notification-card:hover{
      transform:translateY(-1px);
      box-shadow:0 5px 15px rgba(0,123,255,.1);
    }

    .sc-notification-card.unread{
      background:#eaf4ff;
      border-left-color:#dc3545;
    }

    .sc-notification-card.read{
      opacity:.82;
    }

    .sc-notification-card h3{
      margin:0 0 7px;
      color:#0056b3;
      font-size:16px;
    }

    .sc-notification-card p{
      margin:0;
      color:#444;
      line-height:1.5;
      white-space:pre-wrap;
      word-break:break-word;
      font-size:14px;
    }

    .sc-notification-time{
      display:block;
      margin-top:9px;
      color:#777;
      font-size:11px;
    }

    .sc-notification-status{
      display:inline-block;
      margin-top:9px;
      padding:4px 8px;
      border-radius:20px;
      background:#dc3545;
      color:#fff;
      font-size:10px;
      font-weight:bold;
    }

    .sc-notification-card.read
    .sc-notification-status{
      background:#198754;
    }

    .sc-notification-empty{
      text-align:center;
      padding:35px 15px;
      color:#777;
    }

    body.dark
    .sc-notification-box{
      background:#17202a;
      color:#fff;
    }

    body.dark
    .sc-notification-actions{
      background:#111827;
      border-color:#263445;
    }

    body.dark
    .sc-notification-actions button{
      background:#1f2937;
      color:#8ec5ff;
      border-color:#374151;
    }

    body.dark
    .sc-notification-card{
      background:#1d2936;
      border-color:#334155;
    }

    body.dark
    .sc-notification-card.unread{
      background:#20364d;
    }

    body.dark
    .sc-notification-card h3{
      color:#8ec5ff;
    }

    body.dark
    .sc-notification-card p{
      color:#e5e7eb;
    }

    body.dark
    .sc-notification-time{
      color:#aab4c0;
    }

    @media(max-width:600px){

      .sc-notification-box{
        top:12px;
        right:10px;
        width:calc(100% - 20px);
        max-height:calc(100vh - 24px);
        border-radius:15px;
      }

      .sc-notification-actions{
        flex-direction:column;
      }

      .sc-notification-actions button{
        width:100%;
      }

    }

  `;

  document.head.appendChild(
    style
  );

}


/* =========================================================
   UPDATE NOTIFICATION PANEL
========================================================= */

function updateNotificationPanel() {

  const panel =
    document.getElementById(
      "scNotificationPanel"
    );

  if (!panel) {
    return;
  }

  const list =
    document.getElementById(
      "scNotificationList"
    );

  const summary =
    document.getElementById(
      "scNotificationSummary"
    );

  if (!list || !summary) {
    return;
  }

  const unread =
    getUnreadNotificationCount();

  summary.textContent =
    `${allNotifications.length} notification${allNotifications.length === 1 ? "" : "s"} • ${unread} unread`;

  list.innerHTML =
    "";

  if (
    allNotifications.length ===
    0
  ) {

    list.innerHTML = `
      <div
        class="sc-notification-empty"
      >
        🔔 No notifications yet.
        <br><br>
        Important announcements
        will appear here.
      </div>
    `;

    return;

  }

  const readIds =
    getReadNotificationIds();


  allNotifications.forEach(
    notification => {

      const isRead =
        readIds.includes(
          notification.id
        );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        `sc-notification-card ${
          isRead
            ? "read"
            : "unread"
        }`;

      card.dataset.id =
        notification.id;


      card.innerHTML = `

        <h3>
          🔔
          ${escapeHTML(
            notification.title ||
            "Notification"
          )}
        </h3>

        <p>
          ${escapeHTML(
            notification.message ||
            ""
          )}
        </p>

        <span
          class="sc-notification-time"
        >
          🕒
          ${escapeHTML(
            formatNotificationTime(
              notification.createdAt
            )
          )}
        </span>

        ${
          isRead
            ? `
              <span
                class="sc-notification-status"
              >
                ✅ Read
              </span>
            `
            : `
              <span
                class="sc-notification-status"
              >
                🔴 New
              </span>
            `
        }

      `;


      card.addEventListener(
        "click",
        () => {

          markNotificationRead(
            notification.id
          );

        }
      );


      list.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   OPEN NOTIFICATIONS
========================================================= */

function showNotifications() {

  if (!currentUser) {

    alert(
      "Please login first to view notifications."
    );

    return;

  }

  createNotificationPanel();

  updateNotificationPanel();

  const panel =
    document.getElementById(
      "scNotificationPanel"
    );

  panel?.classList.add(
    "sc-open"
  );

  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   CLOSE NOTIFICATIONS
========================================================= */

function closeNotificationPanel() {

  const panel =
    document.getElementById(
      "scNotificationPanel"
    );

  panel?.classList.remove(
    "sc-open"
  );

  document.body.style.overflow =
    "";

}


/* =========================================================
   MARK ONE NOTIFICATION READ
========================================================= */

function markNotificationRead(
  notificationId
) {

  const readIds =
    getReadNotificationIds();

  if (
    !readIds.includes(
      notificationId
    )
  ) {

    readIds.push(
      notificationId
    );

    saveReadNotificationIds(
      readIds
    );

  }

  updateNotificationBadge();

  updateNotificationPanel();

}


/* =========================================================
   MARK ALL NOTIFICATIONS READ
========================================================= */

function markAllNotificationsRead() {

  if (
    allNotifications.length ===
    0
  ) {

    return;

  }

  const ids =
    allNotifications.map(
      notification =>
        notification.id
    );

  saveReadNotificationIds(
    ids
  );

  updateNotificationBadge();

  updateNotificationPanel();

}


/* =========================================================
   CLEAR READ NOTIFICATIONS
========================================================= */

function clearReadNotifications() {

  if (!currentUser) {
    return;
  }

  const readIds =
    getReadNotificationIds();

  if (
    readIds.length ===
    0
  ) {

    alert(
      "There are no read notifications to clear."
    );

    return;

  }

  const unreadIds =
    allNotifications
      .filter(
        notification =>
          !readIds.includes(
            notification.id
          )
      )
      .map(
        notification =>
          notification.id
      );

  saveReadNotificationIds(
    unreadIds
  );

  updateNotificationBadge();

  updateNotificationPanel();

}


/* =========================================================
   NOTIFICATION BUTTON
========================================================= */

notifyBtn?.addEventListener(
  "click",
  showNotifications
);


/* =========================================================
   PART 8
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

      } catch (e) {

        console.warn(e);

      }

    }
  );


  recognition.onresult =
    (e) => {

      if (userInput) {

        userInput.value =
          e.results[0][0]
            .transcript;

        userInput.focus();

      }


      if (micBtn) {

        micBtn.textContent =
          "🎤";

      }


      if (userInput) {

        userInput.placeholder =
          "Ask your question...";

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
    (e) => {

      console.warn(
        "Voice recognition error:",
        e.error
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

      stopNotificationListener();

      closeNotificationPanel();

      await signOut(
        auth
      );


      window.location.href =
        "index.html";


    } catch (error) {

      console.error(
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
  (e) => {

    if (
      e.ctrlKey &&
      e.key.toLowerCase() ===
      "k"
    ) {

      e.preventDefault();

      searchBar?.focus();

    }

    if (
      e.key === "Escape"
    ) {

      closeNotificationPanel();

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


    updateNotificationBadge();


    loadPosts();


    loadNews();


    loadEvents();


    console.log(
      "✅ Sociology Connect Ready"
    );

  }
);
