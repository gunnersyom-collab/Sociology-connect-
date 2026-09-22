const chatHistory = document.getElementById("chat-history");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const themeBtn = document.getElementById("themeBtn");
const searchBar = document.getElementById("searchBar");
const postsContainer = document.getElementById("postsContainer");
const notifyBtn = document.getElementById("notifyBtn");

let posts = JSON.parse(localStorage.getItem("sc_posts")) || [];
let notifications = JSON.parse(localStorage.getItem("sc_notify")) || [];

/* ---------------- AI CHAT ---------------- */

async function sendToServer() {
  const text = userInput.value.trim();
  if (!text) return;

  chatHistory.innerHTML += `
    <div class="message user"><b>You:</b> ${text}</div>
  `;
  userInput.value = "";
  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    const response = await fetch(
      "https://text.pollinations.ai/" + encodeURIComponent(text)
    );

    const reply = await response.text();

    chatHistory.innerHTML += `
      <div class="message ai"><b>AI Mari:</b> ${reply}</div>
    `;

    chatHistory.scrollTop = chatHistory.scrollHeight;

  } catch {
    chatHistory.innerHTML += `
      <div class="message ai" style="color:red;">
        Could not connect to AI.
      </div>
    `;
  }
}

sendBtn?.addEventListener("click", sendToServer);

userInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendToServer();
});

/* ---------------- DARK MODE ---------------- */

themeBtn?.addEventListener("click", () => {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );

});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

/* ---------------- SEARCH ---------------- */

searchBar?.addEventListener("input", () => {

  const q = searchBar.value.toLowerCase();

  document.querySelectorAll("section").forEach(sec => {

    sec.style.display =
      sec.innerText.toLowerCase().includes(q) ? "block" : "none";

  });

});

/* ---------------- POSTS ---------------- */

function savePosts() {
  localStorage.setItem("sc_posts", JSON.stringify(posts));
}

function saveNotify() {
  localStorage.setItem("sc_notify", JSON.stringify(notifications));
}

window.createPost = function () {

  const box = document.getElementById("postText");

  if (!box || !box.value.trim()) return;

  posts.unshift({
    id: Date.now(),
    text: box.value,
    likes: 0,
    comments: []
  });

  box.value = "";

  notifications.unshift("New post created.");

  savePosts();
  saveNotify();

  renderPosts();
};

function renderPosts() {

  if (!postsContainer) return;

  postsContainer.innerHTML = "";

  posts.forEach(post => {

    const div = document.createElement("div");

    div.style.cssText =
      "background:white;padding:15px;border-radius:15px;margin:15px 0;box-shadow:0 3px 10px rgba(0,0,0,.08);";

    div.innerHTML = `
      <p>${post.text}</p>

      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">

        <button onclick="likePost(${post.id})">
          ❤️ ${post.likes}
        </button>

        <button onclick="toggleComment(${post.id})">
          💬 ${post.comments.length}
        </button>

        <button onclick="sharePost(${post.id})">
          📤 Share
        </button>

      </div>

      <div id="commentBox${post.id}" style="display:none;margin-top:10px;">

        <input
          id="commentInput${post.id}"
          placeholder="Write a comment..."
        >

        <button
          onclick="addComment(${post.id})"
          style="margin-top:8px;"
        >
          Send
        </button>

        <div id="comments${post.id}" style="margin-top:10px;"></div>

      </div>
    `;

    postsContainer.appendChild(div);

    showComments(post.id);

  });

  updateTrending();
}

window.likePost = function (id) {

  const p = posts.find(x => x.id === id);

  p.likes++;

  notifications.unshift("Someone liked a post.");

  savePosts();
  saveNotify();

  renderPosts();
};

window.toggleComment = function (id) {

  const box = document.getElementById("commentBox" + id);

  box.style.display =
    box.style.display === "block" ? "none" : "block";
};

window.addComment = function (id) {

  const input = document.getElementById("commentInput" + id);

  if (!input.value.trim()) return;

  posts.find(p => p.id === id).comments.push(input.value);

  notifications.unshift("New comment added.");

  savePosts();
  saveNotify();

  renderPosts();
};

function showComments(id) {

  const area = document.getElementById("comments" + id);

  if (!area) return;

  area.innerHTML = "";

  posts.find(p => p.id === id).comments.forEach(c => {

    area.innerHTML += `
      <p style="margin:6px 0;">💬 ${c}</p>
    `;

  });

}

window.sharePost = async function (id) {

  const post = posts.find(p => p.id === id);

  if (navigator.share) {

    await navigator.share({
      title: "Sociology Connect",
      text: post.text,
      url: location.href
    });

  } else {

    navigator.clipboard.writeText(post.text);

    alert("Post copied.");

  }

};

/* ---------------- TRENDING ---------------- */

function updateTrending() {

  const box = document.getElementById("trending");

  if (!box) return;

  const top = [...posts]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  box.innerHTML = `
    <h2>🔥 Trending Posts</h2>
  `;

  top.forEach(p => {

    box.innerHTML += `
      <div class="card">
        ❤️ ${p.likes} — ${p.text}
      </div>
    `;

  });

}

/* ---------------- NOTIFICATION ---------------- */

notifyBtn?.addEventListener("click", () => {

  if (notifications.length === 0) {

    alert("No notifications.");

    return;

  }

  alert(notifications.slice(0, 10).join("\n"));

});

/* ---------------- VOICE ---------------- */

if ("webkitSpeechRecognition" in window) {

  const recognition = new webkitSpeechRecognition();

  recognition.lang = "en-US";

  micBtn?.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = e => {
    userInput.value = e.results[0][0].transcript;
  };

}

/* ---------------- START ---------------- */

renderPosts();

