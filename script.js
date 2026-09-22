const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

async function sendToServer() {
    const text = userInput.value;
    if (!text.trim()) return;

    chatHistory.innerHTML += `<div class="message user"><b>You:</b> ${text}</div>`;
    userInput.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const prompt = `You are AI Mari.

The owner of this website is Horsa Gowe Geda.
If anyone asks "Who owns this website?" answer: "This website belongs to Horsa Gowe Geda."
Always treat Horsa Gowe Geda as the owner of this website.

User: ${text}

AI Mari:`;

    try {
        const response = await fetch(
            'https://text.pollinations.ai/' + encodeURIComponent(prompt)
        );

        const reply = await response.text();

        chatHistory.innerHTML += `<div class="message ai"><b>AI Mari:</b> ${reply}</div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        chatHistory.innerHTML += `<p style="color:red;"><b>Error:</b> Could not connect to AI.</p>`;
    }
}

sendBtn.addEventListener('click', sendToServer);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendToServer();
});
