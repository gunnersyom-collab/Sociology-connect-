/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
   AI MARI + DARK MODE + SEARCH + VOICE
   Firebase Posts are handled by auth.js
   ========================================================= */


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


/* =========================================================
   AI MARI
   ========================================================= */

async function sendToServer() {

    if (!userInput || !chatHistory) {
        return;
    }

    const text = userInput.value.trim();

    if (!text) {
        return;
    }


    /* SHOW USER MESSAGE */

    const userMessage =
        document.createElement("div");

    userMessage.className =
        "message user";

    userMessage.innerHTML =
        "<b>You:</b> " +
        escapeHTML(text);

    chatHistory.appendChild(
        userMessage
    );

    userInput.value = "";

    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    /* DISABLE SEND BUTTON */

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Thinking...";
    }


    /* AI LOADING MESSAGE */

    const loading =
        document.createElement("div");

    loading.className =
        "message ai";

    loading.id =
        "ai-loading";

    loading.innerHTML =
        "<b>AI Mari:</b> Thinking... 🤔";

    chatHistory.appendChild(
        loading
    );

    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    try {

        const response =
            await fetch(
                "https://text.pollinations.ai/" +
                encodeURIComponent(text)
            );


        if (!response.ok) {
            throw new Error(
                "AI request failed"
            );
        }


        const reply =
            await response.text();


        /* REMOVE LOADING */

        loading.remove();


        /* SHOW AI RESPONSE */

        const aiMessage =
            document.createElement("div");

        aiMessage.className =
            "message ai";

        aiMessage.innerHTML =
            "<b>AI Mari:</b><br>" +
            escapeHTML(reply);


        chatHistory.appendChild(
            aiMessage
        );

        chatHistory.scrollTop =
            chatHistory.scrollHeight;


    } catch (error) {

        console.error(
            "AI Error:",
            error
        );


        loading.remove();


        const errorMessage =
            document.createElement("div");

        errorMessage.className =
            "message ai";

        errorMessage.style.color =
            "red";

        errorMessage.innerHTML =
            "<b>AI Mari:</b><br>" +
            "Sorry, I could not connect to the AI right now. Please try again.";


        chatHistory.appendChild(
            errorMessage
        );

        chatHistory.scrollTop =
            chatHistory.scrollHeight;

    } finally {

        if (sendBtn) {

            sendBtn.disabled =
                false;

            sendBtn.textContent =
                "Send";
        }

    }

}


/* SEND BUTTON */

sendBtn?.addEventListener(
    "click",
    sendToServer
);


/* ENTER KEY */

userInput?.addEventListener(
    "keydown",
    function(event) {

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

    if (
        document.body.classList.contains(
            "dark"
        )
    ) {

        themeBtn.textContent =
            "☀️";

        themeBtn.title =
            "Switch to light mode";

    } else {

        themeBtn.textContent =
            "🌙";

        themeBtn.title =
            "Switch to dark mode";

    }

}


function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "sociologyTheme"
        );

    if (savedTheme === "dark") {

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


/* GLOBAL THEME FUNCTION */

window.toggleTheme = function() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "sociologyTheme",
        isDark
            ? "dark"
            : "light"
    );


    updateThemeButton();

};


/* =========================================================
   SEARCH
   ========================================================= */

function searchWebsite() {

    if (!searchBar) {
        return;
    }


    const query =
        searchBar.value
            .toLowerCase()
            .trim();


    /* SEARCH POSTS */

    const postItems =
        document.querySelectorAll(
            "#postsContainer > div"
        );


    postItems.forEach(
        function(post) {

            const text =
                post.textContent
                    .toLowerCase();


            if (
                !query ||
                text.includes(query)
            ) {

                post.style.display =
                    "";

            } else {

                post.style.display =
                    "none";

            }

        }
    );


    /* SEARCH NEWS */

    const newsCards =
        document.querySelectorAll(
            "#news .card"
        );


    newsCards.forEach(
        function(card) {

            const text =
                card.textContent
                    .toLowerCase();


            if (
                !query ||
                text.includes(query)
            ) {

                card.style.display =
                    "";

            } else {

                card.style.display =
                    "none";

            }

        }
    );


    /* SEARCH RESOURCES */

    const resourceSection =
        document.getElementById(
            "resources"
        );


    if (resourceSection) {

        const resourceText =
            resourceSection.textContent
                .toLowerCase();


        resourceSection.style.display =
            !query ||
            resourceText.includes(query)
                ? ""
                : "none";

    }


    /* SEARCH EVENTS */

    const eventCards =
        document.querySelectorAll(
            "#events .event-card"
        );


    eventCards.forEach(
        function(card) {

            const text =
                card.textContent
                    .toLowerCase();


            if (
                !query ||
                text.includes(query)
            ) {

                card.style.display =
                    "";

            } else {

                card.style.display =
                    "none";

            }

        }
    );

}


searchBar?.addEventListener(
    "input",
    searchWebsite
);


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

window.showNotifications =
function() {

    const notifications =
        JSON.parse(
            localStorage.getItem(
                "sc_notify"
            )
        ) || [];


    if (
        notifications.length === 0
    ) {

        alert(
            "🔔 Notifications\n\n" +
            "No new notifications yet."
        );

        return;

    }


    alert(
        "🔔 Notifications\n\n" +
        notifications
            .slice(0, 10)
            .join("\n\n")
    );

};


/* =========================================================
   VOICE INPUT
   ========================================================= */

let recognition = null;


if (
    "webkitSpeechRecognition"
    in window
) {

    recognition =
        new webkitSpeechRecognition();


    recognition.lang =
        "en-US";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    micBtn?.addEventListener(
        "click",
        function() {

            try {

                recognition.start();

                if (micBtn) {
                    micBtn.textContent =
                        "🔴";
                }

            } catch (error) {

                console.log(
                    "Voice already active."
                );

            }

        }
    );


    recognition.onresult =
        function(event) {

            const transcript =
                event
                    .results[0][0]
                    .transcript;


            if (userInput) {

                userInput.value =
                    transcript;

                userInput.focus();

            }


            if (micBtn) {

                micBtn.textContent =
                    "🎤";

            }

        };


    recognition.onend =
        function() {

            if (micBtn) {

                micBtn.textContent =
                    "🎤";

            }

        };


    recognition.onerror =
        function(error) {

            console.error(
                "Voice recognition error:",
                error
            );


            if (micBtn) {

                micBtn.textContent =
                    "🎤";

            }

        };

} else {

    if (micBtn) {

        micBtn.title =
            "Voice input is not supported by this browser.";

    }

}


/* =========================================================
   HTML SECURITY HELPER
   ========================================================= */

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        applySavedTheme();

        console.log(
            "✅ Sociology Connect script.js loaded."
        );

    }
);
