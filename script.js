async function sendToServer() {
    let userInput = document.getElementById('userInput').value;
    let chatHistory = document.getElementById('chat-history');
    
    if (!userInput.trim()) return;

    // Ergaa fayyadamaa chat history irratti dabaluuf
    chatHistory.innerHTML += `<p><b>You:</b> ${userInput}</p>`;
    document.getElementById('userInput').value = '';

    try {
        let response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userInput })
        });
        
        let data = await response.json();
        chatHistory.innerHTML += `<p><b>AI Mari:</b> ${data.reply}</p>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        chatHistory.innerHTML += `<p style="color: red;"><b>Error:</b> Could not connect to AI.</p>`;
    }
}
