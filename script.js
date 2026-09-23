/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS (Professional)
   AI MARI + DARK MODE + SEARCH + VOICE + NOTIFICATIONS
   ========================================================= */

/* ---------- ELEMENTS ---------- */
const chatHistory = document.getElementById("chat-history");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const themeBtn = document.getElementById("themeBtn");
const searchBar = document.getElementById("searchBar");
const notifyBtn = document.getElementById("notifyBtn");

/* ---------- SECURITY ---------- */
function escapeHTML(value){
  return String(value||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

/* ---------- AI MARI ---------- */
async function sendToServer(){

  if(!chatHistory || !userInput) return;

  const text = userInput.value.trim();
  if(!text) return;

  const user = document.createElement("div");
  user.className = "message user";
  user.innerHTML = "<b>You:</b> " + escapeHTML(text);
  chatHistory.appendChild(user);

  userInput.value = "";

  if(sendBtn){
    sendBtn.disabled = true;
    sendBtn.textContent = "Thinking...";
  }

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = "<b>AI Mari:</b><br><i>Typing...</i>";
  chatHistory.appendChild(loading);

  chatHistory.scrollTop = chatHistory.scrollHeight;

  try{

    const res = await fetch(
      "https://text.pollinations.ai/" +
      encodeURIComponent(text)
    );

    if(!res.ok) throw new Error();

    const reply = await res.text();

    loading.remove();

    const ai = document.createElement("div");
    ai.className = "message ai";
    ai.innerHTML = `
      <b>AI Mari:</b><br>
      ${escapeHTML(reply)}
      <br><br>
      <button class="copy-btn">📋 Copy</button>
    `;

    ai.querySelector(".copy-btn").onclick = () => {
      navigator.clipboard.writeText(reply);
    };

    chatHistory.appendChild(ai);

  }catch{

    loading.remove();

    const err = document.createElement("div");
    err.className = "message ai";
    err.style.color = "red";
    err.innerHTML =
      "<b>AI Mari:</b><br>Sorry, connection failed.";

    chatHistory.appendChild(err);

  }finally{

    if(sendBtn){
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

sendBtn?.addEventListener("click",sendToServer);

userInput?.addEventListener("keydown",e=>{
  if(e.key==="Enter" && !e.shiftKey){
    e.preventDefault();
    sendToServer();
  }
});
/* ---------- DARK MODE ---------- */

function updateThemeButton(){

  if(!themeBtn) return;

  if(document.body.classList.contains("dark")){
    themeBtn.textContent = "☀️";
    themeBtn.title = "Light Mode";
  }else{
    themeBtn.textContent = "🌙";
    themeBtn.title = "Dark Mode";
  }
}

function applySavedTheme(){

  if(localStorage.getItem("sociologyTheme")==="dark"){
    document.body.classList.add("dark");
  }else{
    document.body.classList.remove("dark");
  }

  updateThemeButton();
}

window.toggleTheme = function(){

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "sociologyTheme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

  updateThemeButton();
};

/* ---------- SEARCH ---------- */

function searchWebsite(){

  if(!searchBar) return;

  const q = searchBar.value.toLowerCase().trim();

  let visible = 0;

  document.querySelectorAll(
    "#postsContainer > div,#news .card,#events .event-card"
  ).forEach(el=>{

    const ok =
      !q ||
      el.textContent.toLowerCase().includes(q);

    el.style.display = ok ? "" : "none";

    if(ok) visible++;
  });

  const resources =
    document.getElementById("resources");

  if(resources){

    const ok =
      !q ||
      resources.textContent.toLowerCase().includes(q);

    resources.style.display = ok ? "" : "none";
  }

  const counter =
    document.getElementById("searchCount");

  if(counter){
    counter.textContent =
      q ? `${visible} results found` : "";
  }
}

searchBar?.addEventListener(
  "input",
  searchWebsite
);

/* ---------- NOTIFICATIONS ---------- */

function updateNotificationBadge(){

  if(!notifyBtn) return;

  const list =
    JSON.parse(localStorage.getItem("sc_notify")) || [];

  notifyBtn.innerHTML =
    list.length
      ? `🔔 <span style="color:red">${list.length}</span>`
      : "🔔";
}

window.showNotifications = function(){

  const list =
    JSON.parse(localStorage.getItem("sc_notify")) || [];

  if(list.length===0){
    alert("🔔 No new notifications.");
    return;
  }

  alert(
    "🔔 Notifications\n\n" +
    list.slice(0,10).join("\n\n")
  );
};

/* ---------- VOICE INPUT ---------- */

let recognition = null;

if("webkitSpeechRecognition" in window){

  recognition = new webkitSpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn?.addEventListener("click",()=>{

    try{
      recognition.start();
      micBtn.textContent = "🔴";
    }catch{}

  });

  recognition.onresult = e=>{

    userInput.value =
      e.results[0][0].transcript;

    userInput.focus();

    micBtn.textContent = "🎤";
  };

  recognition.onend = ()=>{
    micBtn.textContent = "🎤";
  };

  recognition.onerror = ()=>{
    micBtn.textContent = "🎤";
  };

}else{

  if(micBtn){
    micBtn.title =
      "Voice input is not supported.";
  }
}

/* ---------- START ---------- */

document.addEventListener("DOMContentLoaded",()=>{

  applySavedTheme();
  updateNotificationBadge();

  document.addEventListener("keydown",e=>{

    if(e.ctrlKey &&
       e.key.toLowerCase()==="k"){

      e.preventDefault();
      searchBar?.focus();
    }

  });

  console.log(
    "✅ Sociology Connect Professional Script Loaded."
  );

});
