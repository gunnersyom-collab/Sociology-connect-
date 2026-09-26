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


/* ================= FIREBASE ================= */

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
        .toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short"
        });

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
   GET USER NAME
========================================================= */

async function getUserName(user) {

  if (!user) {
    return "Student";
  }

  try {

    const userRef =
      doc(db, "users", user.uid);

    const snap =
      await getDoc(userRef);

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


    /* ================= LOGGED IN ================= */

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
       * Admin controls are created
       * after the page is ready.
       */

      if (
        document.readyState !==
        "loading"
      ) {

        createAdminControls();

      }

    }


    /* ================= LOGGED OUT ================= */

    else {

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
   CREATE POST
   LIKE
   COMMENT
   SHARE
   DELETE
   ADMIN
========================================================= */


/* =========================================================
   CREATE POST
========================================================= */

async function createPost() {

  if (!postInput) {
    console.warn("⚠️ postInput not found");
    return;
  }

  if (!authReady) {
    alert("Please wait for authentication...");
    return;
  }

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const text =
    postInput.value.trim();

  if (!text) {
    alert("Write something first.");
    return;
  }

  if (postBtn) {
    postBtn.disabled = true;
    postBtn.textContent = "Posting...";
  }

  try {

    const name =
      await getUserName(currentUser);

    await addDoc(
      collection(db, "posts"),
      {
        text: text,

        userId:
          currentUser.uid,

        name: name,

        email:
          currentUser.email || "",

        createdAt:
          serverTimestamp()
      }
    );

    postInput.value = "";

  } catch (error) {

    console.error(
      "❌ CREATE POST ERROR:",
      error
    );

    alert(
      "Unable to create post:\n" +
      error.message
    );

  } finally {

    if (postBtn) {
      postBtn.disabled = false;
      postBtn.textContent = "📤 Post";
    }

  }

}


/* =========================================================
   POST BUTTON
========================================================= */

postBtn?.addEventListener(
  "click",
  createPost
);


/* =========================================================
   ENTER TO POST
========================================================= */

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
   LIKE POST
========================================================= */

async function toggleLike(
  postId,
  likeBtn
) {

  if (!currentUser) {

    alert("Please login first.");

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

  } catch (error) {

    console.error(
      "❌ LIKE ERROR:",
      error
    );

  }

}


/* =========================================================
   UPDATE LIKE BUTTON
========================================================= */

async function updateLikeButton(
  postId,
  likeBtn
) {

  if (!likeBtn) return;

  try {

    const likesSnapshot =
      await getDocs(
        collection(
          db,
          "posts",
          postId,
          "likes"
        )
      );

    const count =
      likesSnapshot.size;

    const liked =
      currentUser &&
      likesSnapshot.docs.some(
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
    "❌ LIKE ERROR:",
    error
  );

  alert(
    "Like failed:\n" +
    error.message
  );
  }
}
/* =========================================================
   COMMENT POST
========================================================= */

async function commentPost(
  postId
) {

  if (!currentUser) {

    alert("Please login first.");

    return false;

  }

  const text =
    prompt("Write your comment:");

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

        name:
          name,

        createdAt:
          serverTimestamp()
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ COMMENT ERROR:",
      error
    );

    alert(
      "Unable to comment:\n" +
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

  if (!card) return;

  try {

    const snapshot =
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
        `💬 Comment (${snapshot.size})`;

    }


    card
      .querySelector(
        ".comments-box"
      )
      ?.remove();


    if (
      !show ||
      snapshot.empty
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


    const comments =
      [...snapshot.docs]
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
        );


    comments.forEach(
      (commentDoc) => {

        const data =
          commentDoc.data();

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
              data.name ||
              "Student"
            )}
          </strong>

          <br>

          ${escapeHTML(
            data.text ||
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
      "❌ LOAD COMMENTS ERROR:",
      error
    );

  }

}


/* =========================================================
   SHARE POST
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

      await navigator.share({

        title:
          "Sociology Connect",

        text:
          text,

        url:
          url

      });

      return;

    }


    if (
      navigator.clipboard
    ) {

      await navigator
        .clipboard
        .writeText(url);

      alert(
        "Post link copied."
      );

      return;

    }


    alert(
      "Sharing is not supported on this browser."
    );

  } catch (error) {

    console.warn(
      "Share cancelled or failed:",
      error
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

    alert(
      "Please login first."
    );

    return;

  }


  if (
    !(
      isAdmin() ||
      currentUser.uid === ownerId
    )
  ) {

    alert(
      "You can delete only your own post."
    );

    return;

  }


  if (
    !confirm(
      "Delete this post?"
    )
  ) {

    return;

  }


  try {

    /* DELETE LIKES */

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
      const item
      of likes.docs
    ) {

      await deleteDoc(
        item.ref
      );

    }


    /* DELETE COMMENTS */

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
      const item
      of comments.docs
    ) {

      await deleteDoc(
        item.ref
      );

    }


    /* DELETE POST */

    await deleteDoc(
      doc(
        db,
        "posts",
        postId
      )
    );


  } catch (error) {

    console.error(
      "❌ DELETE POST ERROR:",
      error
    );

    alert(
      "Unable to delete post:\n" +
      error.message
    );

  }

}


/* =========================================================
   CLEAR ALL POSTS
   ADMIN ONLY
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
      const post
      of posts.docs
    ) {

      const postId =
        post.id;


      /* DELETE LIKES */

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
        const item
        of likes.docs
      ) {

        await deleteDoc(
          item.ref
        );

      }


      /* DELETE COMMENTS */

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
        const item
        of comments.docs
      ) {

        await deleteDoc(
          item.ref
        );

      }


      /* DELETE POST */

      await deleteDoc(
        post.ref
      );

    }


    alert(
      "All posts deleted."
    );

  } catch (error) {

    console.error(
      "❌ CLEAR POSTS ERROR:",
      error
    );

    alert(
      "Unable to delete all posts:\n" +
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
      type="button"
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


/* =========================================================
   REMOVE ADMIN CONTROLS
========================================================= */

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
              No posts yet.
              Be the first student to post! 📚
            </p>
          </div>
        `;

        loadTrendingPosts();
        return;
      }


      for (const postDoc of snapshot.docs) {

        const post =
          postDoc.data();

        const postId =
          postDoc.id;

        const name =
          post.name || "Student";


        const card =
          document.createElement("div");

        card.className =
          "post-card";

        card.id =
          "post-" + postId;


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
                🕐 ${formatPostTime(
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

        const deleteBtn =
          card.querySelector(
            ".delete-btn"
          );


        /* LIKE */

        likeBtn?.addEventListener(
  "click",
  () => {
    console.log("❤️ LIKE BUTTON CLICKED:", postId);

    toggleLike(
      postId,
      likeBtn
    );
  }
);

        /* COMMENT */

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


        /* SHARE */

        shareBtn?.addEventListener(
          "click",
          () =>
            sharePost(
              postId,
              post.text || ""
            )
        );


        /* DELETE */

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


        /* COUNTS */

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
            ${escapeHTML(
              error.message
            )}
          </small>
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


    if (postsSnapshot.empty) {

      trendingContainer.innerHTML = `
        <div class="post-card">
          🔥 No trending posts yet.
        </div>
      `;

      return;
    }


    const posts = [];


    for (
      const postDoc
      of postsSnapshot.docs
    ) {

      const post =
        postDoc.data();


      const likesSnapshot =
        await getDocs(
          collection(
            db,
            "posts",
            postDoc.id,
            "likes"
          )
        );


      const commentsSnapshot =
        await getDocs(
          collection(
            db,
            "posts",
            postDoc.id,
            "comments"
          )
        );


      const likes =
        likesSnapshot.size;

      const comments =
        commentsSnapshot.size;


      posts.push({

        id:
          postDoc.id,

        name:
          post.name || "Student",

        text:
          post.text || "",

        likes:
          likes,

        comments:
          comments,

        score:
          likes + comments

      });

    }


    posts.sort(
      (a, b) =>
        b.score - a.score
    );


    trendingContainer.innerHTML =
      "";


    posts
      .slice(0, 5)
      .forEach(
        (post) => {

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
      "❌ TRENDING ERROR:",
      error
    );


    trendingContainer.innerHTML = `
      <div class="post-card">
        ❌ Unable to load trending posts.

        <br><br>

        <small>
          ${escapeHTML(
            error.message
          )}
        </small>
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


      if (snapshot.empty) {

        newsContainer.innerHTML = `
          <div class="card">
            📰 No latest news available yet.
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
              📢 ${escapeHTML(
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
                    🕐 ${formatPostTime(
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
        "❌ NEWS ERROR:",
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


      if (snapshot.empty) {

        eventsContainer.innerHTML = `
          <div class="event-card">
            📅 No events available.
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
              📅 ${escapeHTML(
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
                    📅 ${escapeHTML(
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
        "❌ EVENTS ERROR:",
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
   PART 5
   AI MARI
========================================================= */


/* =========================================================
   SEND TO AI MARI
========================================================= */

async function sendToServer() {

  if (
    !chatHistory ||
    !userInput
  ) {
    return;
  }


  const text =
    userInput.value.trim();


  if (!text) {
    return;
  }


  /* USER MESSAGE */

  const userBox =
    document.createElement(
      "div"
    );

  userBox.className =
    "message user";


  userBox.innerHTML = `
    <b>You:</b>
    ${escapeHTML(text)}
  `;


  chatHistory.appendChild(
    userBox
  );


  userInput.value =
    "";


  /* LOADING */

  const loading =
    document.createElement(
      "div"
    );

  loading.className =
    "message ai";


  loading.innerHTML = `
    <b>AI Mari:</b>
    <br>
    <i>Typing... 🤖</i>
  `;


  chatHistory.appendChild(
    loading
  );


  chatHistory.scrollTop =
    chatHistory.scrollHeight;


  if (sendBtn) {

    sendBtn.disabled =
      true;

    sendBtn.textContent =
      "Thinking...";

  }


  try {

    const response =
      await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(
          text
        )}?model=openai`
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const reply =
      await response.text();


    loading.remove();


    const aiBox =
      document.createElement(
        "div"
      );

    aiBox.className =
      "message ai";


    aiBox.innerHTML = `

      <b>AI Mari:</b>

      <br>

      <span class="ai-text">
        ${escapeHTML(
          reply
        )}
      </span>

      <br><br>

      <button
        type="button"
        class="copy-btn">
        📋 Copy
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

        } catch {

          alert(
            "Copy failed."
          );

        }

      }
    );


    chatHistory.appendChild(
      aiBox
    );


  } catch (error) {

    console.error(
      "❌ AI MARI ERROR:",
      error
    );


    loading.innerHTML = `
      <b>AI Mari:</b>
      <br>
      ❌ Connection failed.
    `;

  }


  if (sendBtn) {

const chatMessages = [];

async function sendToServer() {

  if (!chatHistory || !userInput) return;

  const text = userInput.value.trim();
  if (!text) return;

  chatMessages.push({ role: "user", content: text });

  const userBox = document.createElement("div");
  userBox.className = "message user";
  userBox.innerHTML = `<b>You:</b><br>${escapeHTML(text)}`;
  chatHistory.appendChild(userBox);

  userInput.value = "";

  const aiBox = document.createElement("div");
  aiBox.className = "message ai";
  aiBox.innerHTML = `<b>AI Mari:</b><br><span class="ai-text">Typing... 🤖</span>`;
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
    const reply = data.choices?.[0]?.message?.content || "No response.";

    chatMessages.push({ role: "assistant", content: reply });

    aiBox.innerHTML = `
      <b>AI Mari:</b><br>
      <span class="ai-text">${escapeHTML(reply)}</span><br><br>
      <button type="button" class="copy-btn">📋 Copy</button>
    `;

    aiBox.querySelector(".copy-btn")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(reply);
    });

  } catch (error) {

    console.error("❌ AI MARI ERROR:", error);

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

/* =========================================================
   AI BUTTON
========================================================= */

sendBtn?.addEventListener(
  "click",
  sendToServer
);


/* =========================================================
   AI ENTER
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
    document.body.classList.contains(
      "dark"
    )
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


/* =========================================================
   TOGGLE THEME
========================================================= */

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


  let count = 0;


  const items =
    document.querySelectorAll(
      "#postsContainer > div," +
      "#news .card," +
      "#events .event-card," +
      "#trendingContainer .post-card"
    );


  items.forEach(
    (item) => {

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
   NOTIFICATIONS
   VOICE
   LOGOUT
   SHORTCUTS
   START
========================================================= */


/* =========================================================
   NOTIFICATIONS
========================================================= */

function updateNotificationBadge() {

  if (!notifyBtn) {
    return;
  }


  let list = [];


  try {

    list =
      JSON.parse(
        localStorage.getItem(
          "sc_notify"
        )
      ) || [];

  } catch {

    list = [];

  }


  notifyBtn.innerHTML =
    list.length
      ? `🔔 <span style="color:red">${list.length}</span>`
      : "🔔";

}


/* =========================================================
   SHOW NOTIFICATIONS
========================================================= */

function showNotifications() {

  let list = [];


  try {

    list =
      JSON.parse(
        localStorage.getItem(
          "sc_notify"
        )
      ) || [];

  } catch {

    list = [];

  }


  alert(
    list.length
      ? list.join("\n\n")
      : "🔔 No new notifications."
  );

}


notifyBtn?.addEventListener(
  "click",
  showNotifications
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

        if (micBtn) {
          micBtn.textContent =
            "🔴";
        }

      } catch (error) {

        console.warn(
          "Voice start error:",
          error
        );

      }

    }
  );


  recognition.onresult =
    (event) => {

      const transcript =
        event
          .results[0][0]
          .transcript;


      if (userInput) {

        userInput.value =
          transcript;

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

    };


  recognition.onerror =
    () => {

      if (micBtn) {

        micBtn.textContent =
          "🎤";

      }

    };

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
        "❌ LOGOUT ERROR:",
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


    updateNotificationBadge();


    loadPosts();


    loadNews();     // 📰 News akka fiduuf kun dabalameera


    loadEvents();   // 📅 Events akka fiduuf kunis dabalameera

  }
);
