const chatHistory = document.getElementById("chat-history");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const micBtn = document.getElementById("micBtn");

function addMessage(sender, text, isUser) {
    const div = document.createElement("div");
    div.className = `message ${isUser ? "user" : "ai"}`;
    div.innerHTML = `<b>${sender}</b><br>${text}`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return div;
}

async function sendToServer() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage("You", message, true);
    userInput.value = "";

    const typing = addMessage("AI Mari", "Typing...", false);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        typing.innerHTML = `<b>AI Mari</b><br>${data.reply}`;

    } catch (error) {
        typing.innerHTML = "<b>AI Mari</b><br>Connection error.";
        console.error(error);
    }
}

sendBtn.addEventListener("click", sendToServer);

userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendToServer();
});

// Dark Mode
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// Voice Input
if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";

    micBtn.addEventListener("click", () => recognition.start());

    recognition.onresult = (e) => {
        userInput.value = e.results[0][0].transcript;
    };
} else {
    micBtn.style.display = "none";
}
