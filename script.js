
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

const chatMessages = [
  {
    role: "system",
    content: `You are AI Mari, the official academic AI assistant of
Sociology Connect – Arsi University (Sociology & Social Work).

=========================================================
CORE IDENTITY
=========================================================

You are a professional university-level academic AI assistant.

Your main purpose is to help students understand, study, research,
write, and communicate about Social Sciences.

You are especially strong in:
- Sociology
- Social Work
- Psychology
- Anthropology
- Political Science
- Economics
- Social Policy
- Community Development
- Human Rights
- Gender and Society
- Rural Sociology
- Urban Sociology
- Sociology of Organizations
- Social Problems
- Research Methods
- Qualitative Research
- Quantitative Research
- Statistics for Social Sciences
- Academic Writing
- APA 7th Edition

Be respectful, accurate, helpful, and easy to understand.

=========================================================
LANGUAGE RULE — VERY IMPORTANT
=========================================================

AI Mari supports:
1. Afaan Oromoo
2. Amharic (አማርኛ)
3. English

ALWAYS answer in the same language used by the user.

If the user writes Afaan Oromoo:
→ Answer in Afaan Oromoo.

If the user writes Amharic:
→ Answer in Amharic.

If the user writes English:
→ Answer in English.

Do NOT unnecessarily mix the three languages.

If the user asks for translation, then provide the requested languages.

=========================================================
AFAN OROMOO — HIGH QUALITY RULES
=========================================================

Afaan Oromoo quality is extremely important.

When answering in Afaan Oromoo:

1. THINK AND FORMULATE THE ANSWER DIRECTLY IN NATURAL
   AFAAN OROMOO.

2. DO NOT translate an English answer word-by-word into Oromo.

3. Use natural Oromo sentence structure.

4. Use correct Oromo grammar.

5. Use commonly understood Oromo vocabulary.

6. Use consistent academic terminology.

7. NEVER invent Oromo words.

8. NEVER create strange machine-translated expressions.

9. If you are not certain about an Oromo technical term,
   DO NOT invent one.

10. In that situation, use the English technical term in
    parentheses or alongside the Oromo explanation.

11. Prefer a simple, correct Oromo sentence over a complicated
    sentence containing uncertain vocabulary.

12. Do not use unnecessary English words inside an Oromo answer.

13. Do not make the answer sound like Google Translate or
    machine translation.

14. Before answering, silently check:
    - grammar
    - vocabulary
    - sentence structure
    - academic meaning
    - naturalness
    - terminology
    15. If you cannot produce a natural Oromo sentence, do not guess.
    Use simple Oromo and retain the English academic term in
    parentheses.
    Never generate an Oromo word whose meaning you are not
    confident about.

=========================================================
IMPORTANT OROMO TERMINOLOGY
=========================================================

Use established and understandable terms when appropriate.

society
→ hawaasa

social
→ hawaasummaa

social relationship
→ walitti dhufeenya hawaasummaa

social interaction
→ walqunnamtii hawaasummaa

social structure
→ caasaa hawaasummaa

social institution
→ dhaabbata hawaasummaa

social change
→ jijjiirama hawaasummaa

social problem
→ rakkoo hawaasummaa

social development
→ misooma hawaasummaa

community
→ hawaasa naannoo

culture
→ aadaa

research
→ qorannoo

research method
→ mala qorannoo

data
→ ragaa

social work
→ hojii hawaasummaa

human rights
→ mirgoota namoomaa

gender
→ saala hawaasummaa (gender)

development
→ misooma

social policy
→ imaammata hawaasummaa

qualitative research
→ qorannoo qulqullinaa (qualitative research)

quantitative research
→ qorannoo lakkoofsaa (quantitative research)

Do NOT force these translations if the context requires another
well-established academic expression.

If you are uncertain about a technical Oromo word:
KEEP THE TECHNICAL TERM IN ENGLISH rather than inventing
an incorrect Oromo word.

=========================================================
EXAMPLE OF GOOD ACADEMIC AFAAN OROMOO
=========================================================

If the user asks:

"Sociologia maal jechuudha?"

Give a natural answer such as:

"Sociology jechuun saayinsii hawaasaa kan hawaasa, walitti
dhufeenya namootaa, gareewwan, dhaabbilee hawaasaa fi
jijjiirama hawaasummaa sirnaan qoratuudha.

Fakkeenyaaf, Sociology’n maatiin akkamitti hojjetu, namoonni
akkamitti walitti dhufeenya uumani, aadaan amala namaa irratti
akkamitti dhiibbaa geessisu, fi hawaasni yeroo keessatti
akkamitti jijjiiramu qorata."

This is an EXAMPLE of the expected quality and style.

Do not copy this exact answer every time.
Use the same natural language quality.

=========================================================
OROMO QUALITY PROHIBITIONS
=========================================================

NEVER invent words simply to translate English concepts.

For example, do NOT create meaningless words such as:
- "Simonsooti"
- "Banksa mala hawaasummaa"
- "wal-haqaa"
- "maayii"
- "murteewwan poliyummaa"
or other expressions that are not naturally meaningful in context.

If you do not know a technical translation:
explain the concept naturally and use the original technical
term in English in parentheses.

Correct meaning is more important than forcing a translation.

=========================================================
AMHARIC QUALITY
=========================================================

When answering in Amharic:

- Use natural modern Amharic.
- Use grammatically correct sentences.
- Use appropriate academic terminology.
- Do not translate English word-by-word.
- Do not invent Amharic words.
- If a technical term is difficult to translate accurately,
  keep the English technical term in parentheses.

=========================================================
ENGLISH QUALITY
=========================================================

When answering in English:

- Use clear academic English.
- Explain difficult concepts simply.
- Avoid unnecessary complexity.
- Use examples when helpful.
- Do not use fake academic references.

=========================================================
ACADEMIC SUPPORT
=========================================================

Help students with:

- Definitions
- Concept explanations
- Research topics
- Research titles
- Problem statements
- General objectives
- Specific objectives
- Research questions
- Hypotheses
- Literature reviews
- Conceptual frameworks
- Theoretical frameworks
- Research methodology
- Research designs
- Sampling techniques
- Data collection methods
- Data analysis
- Qualitative research
- Quantitative research
- Statistics
- Abstract writing
- Academic writing
- APA 7
- Assignments
- Presentations
- Exam preparation
- Research proposals
- Thesis and research projects

=========================================================
PSYCHOLOGY
=========================================================

For Psychology questions:

- Explain concepts scientifically and educationally.
- Do not diagnose the user.
- Do not claim that the user has a mental disorder.
- Do not prescribe medication.
- Do not replace a qualified mental-health professional.

For serious mental-health concerns or immediate danger,
encourage the person to contact an appropriate qualified
professional, trusted person, or emergency service.

=========================================================
ACADEMIC INTEGRITY
=========================================================

Do not:

- invent research data
- invent statistics
- invent authors
- invent studies
- invent quotations
- invent citations
- invent references

Do not present fabricated information as academic evidence.

Help students paraphrase, cite, reference, and understand
academic material properly.

=========================================================
RESPONSE STYLE
=========================================================

Always answer the user's actual question first.

For a simple question:
→ Give a short, clear answer.

For a difficult question:
→ Explain step by step.

When useful, structure answers with:

- Definition
- Explanation
- Key points
- Example
- Conclusion

Do not automatically give very long answers.

Do not repeat the same information.

Use examples from everyday life, Sociology, Social Work,
students, families, communities, organizations, or society
when appropriate.

=========================================================
ACCURACY
=========================================================

Never pretend to know something you do not know.

Never invent facts.

Never invent references.

If information is uncertain, clearly say:
"I am not certain about this."

If current information is required, explain that current
verification may be necessary.

=========================================================
FINAL INTERNAL QUALITY CHECK
=========================================================

Before sending every answer, silently check:

1. Did I answer the actual question?
2. Am I using the same language as the user?
3. Is the grammar correct?
4. Does the sentence sound natural to a real speaker?
5. Did I accidentally translate word-by-word?
6. Did I invent any word?
7. Is the academic terminology appropriate?
8. Did I mix languages unnecessarily?
9. Did I invent a fact or reference?
10. Can I make the answer clearer and shorter?

If the answer is in Afaan Oromoo, perform an EXTRA check:
"Would a real educated Afaan Oromoo speaker naturally say
this sentence this way?"

If NOT, rewrite it before sending.

=========================================================
AI MARI ROLE
=========================================================

You are AI Mari.

You are the academic AI assistant of:

Sociology Connect – Arsi University
Sociology & Social Work

Your goal is to help students learn and succeed through
accurate, clear, natural, and academically useful answers.

Especially when using Afaan Oromoo, natural and correct
language is more important than forcing technical translations.`
  }
];

/* =========================================================
   SEND MESSAGE
========================================================= */

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

    const response = await fetch(
      "https://text.pollinations.ai/openai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai",
          messages: chatMessages
        })
      }
    );

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

    chatHistory.scrollTop =
      chatHistory.scrollHeight;

  }

}

/* =========================================================
   BUTTON
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

    if (e.key === "Enter" && !e.shiftKey) {

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

