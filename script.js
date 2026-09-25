/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
   AI MARI + FIREBASE POSTS + DARK MODE + SEARCH
   + VOICE + NOTIFICATIONS
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
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
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


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


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   FIREBASE POSTS
   ========================================================= */


/* ================= CREATE POST ================= */

window.createPost = async function () {

    if (!postInput) {
        console.error(
            "postInput was not found."
        );
        return;
    }

    const text =
        postInput.value.trim();

    const user =
        auth.currentUser;


    /* ---------- LOGIN CHECK ---------- */

    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    /* ---------- EMPTY POST CHECK ---------- */

    if (!text) {

        alert(
            "Write something first."
        );

        return;

    }


    try {

        /* ---------- GET USER PROFILE ---------- */

        const profileSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        const profileData =
            profileSnap.exists()
                ? profileSnap.data()
                : {};


        /* ---------- USER NAME ---------- */

        const name =
            profileData.fullName ||
            user.displayName ||
            (
                user.email
                    ? user.email.split("@")[0]
                    : "Student"
            );


        /* ---------- SAVE POST ---------- */

        await addDoc(
            collection(db, "posts"),
            {

                text: text,

                userId: user.uid,

                name: name,

                createdAt:
                    serverTimestamp()

            }
        );


        /* ---------- CLEAR INPUT ---------- */

        postInput.value = "";


        console.log(
            "✅ Post created successfully."
        );


    } catch (error) {

        console.error(
            "❌ Create post error:",
            error
        );

        alert(
            "Post failed: " +
            error.message
        );

    }

};


/* =========================================================
   LOAD POSTS FROM FIRESTORE
   ========================================================= */

if (postsContainer) {

    const postsQuery =
        query(
            collection(db, "posts"),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(

        postsQuery,

        (snapshot) => {

            postsContainer.innerHTML = "";


            if (snapshot.empty) {

                postsContainer.innerHTML = `
                    <div class="post-card">
                        <p>
                            No posts yet. Be the first
                            student to post something! 📚
                        </p>
                    </div>
                `;

                return;

            }


            snapshot.forEach(
                (postDoc) => {

                    const post =
                        postDoc.data();


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "post-card";


                    card.innerHTML = `

                        <div class="post-header">

                            <div class="avatar">
                                👤
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        post.name ||
                                        "Student"
                                    )}
                                </strong>

                                <br>

                                <small>
                                    ${post.createdAt
                                        ? "Posted"
                                        : "Just now"}
                                </small>

                            </div>

                        </div>


                        <p>
                            ${escapeHTML(
                                post.text || ""
                            )}
                        </p>


                        <div class="post-actions">

                            <button
                                type="button"
                                class="like-btn"
                            >
                                ❤️ Like
                            </button>


                            <button
                                type="button"
                                class="comment-btn"
                            >
                                💬 Comment
                            </button>


                            <button
                                type="button"
                                class="share-btn"
                            >
                                📤 Share
                            </button>

                        </div>

                    `;


                    postsContainer.appendChild(
                        card
                    );

                }
            );

        },


        (error) => {

            console.error(
                "❌ Load posts error:",
                error
            );


            postsContainer.innerHTML = `
                <div class="post-card">
                    <p>
                        Unable to load posts.
                    </p>
                </div>
            `;

        }

    );

}


/* =========================================================
   AI MARI
   ========================================================= */

async function sendToServer() {

    if (!chatHistory || !userInput)
        return;


    const text =
        userInput.value.trim();


    if (!text)
        return;


    /* ---------- USER MESSAGE ---------- */

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


    /* ---------- CLEAR INPUT ---------- */

    userInput.value = "";


    /* ---------- SEND BUTTON ---------- */

    if (sendBtn) {

        sendBtn.disabled = true;

        sendBtn.textContent =
            "Thinking...";

    }


    /* ---------- LOADING ---------- */

    const loading =
        document.createElement("div");


    loading.className =
        "message ai";


    loading.innerHTML =
        "<b>AI Mari:</b><br>" +
        "<i>Typing...</i>";


    chatHistory.appendChild(
        loading
    );


    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    try {

        /* ---------- AI REQUEST ---------- */

        const res =
            await fetch(
                "https://text.pollinations.ai/" +
                encodeURIComponent(text)
            );


        if (!res.ok) {

            throw new Error(
                "AI server error"
            );

        }


        const reply =
            await res.text();


        /* ---------- REMOVE LOADING ---------- */

        loading.remove();


        /* ---------- AI MESSAGE ---------- */

        const aiMessage =
            document.createElement("div");


        aiMessage.className =
            "message ai";


        aiMessage.innerHTML = `

            <b>AI Mari:</b><br>

            <span class="ai-text">
                ${escapeHTML(reply)}
            </span>

            <br><br>

            <button
                class="copy-btn"
                type="button"
            >
                📋 Copy
            </button>

        `;


        /* ---------- COPY BUTTON ---------- */

        const copyButton =
            aiMessage.querySelector(
                ".copy-btn"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(reply);


                        copyButton.textContent =
                            "✅ Copied!";


                        setTimeout(
                            () => {

                                copyButton.textContent =
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

        }


        /* ---------- ADD AI MESSAGE ---------- */

        chatHistory.appendChild(
            aiMessage
        );


        /* ---------- KEEP CHAT VISIBLE ---------- */

        chatHistory.scrollTop =
            chatHistory.scrollHeight;


    } catch (error) {

        console.error(
            "AI Mari Error:",
            error
        );


        /* ---------- REMOVE LOADING ---------- */

        loading.remove();


        /* ---------- ERROR MESSAGE ---------- */

        const errorMessage =
            document.createElement(
                "div"
            );


        errorMessage.className =
            "message ai";


        errorMessage.innerHTML = `

            <b>AI Mari:</b><br>

            <span class="ai-text">
                Sorry, connection failed.
                Please try again.
            </span>

        `;


        chatHistory.appendChild(
            errorMessage
        );


        chatHistory.scrollTop =
            chatHistory.scrollHeight;

    } finally {

        if (sendBtn) {

            sendBtn.disabled = false;

            sendBtn.textContent =
                "Send";

        }

    }

}


/* =========================================================
   AI SEND EVENTS
   ========================================================= */

sendBtn?.addEventListener(
    "click",
    sendToServer
);


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
   DARK MODE
   ========================================================= */

function updateThemeButton() {

    if (!themeBtn)
        return;


    if (
        document.body.classList
            .contains("dark")
    ) {

        themeBtn.textContent =
            "☀️";

        themeBtn.title =
            "Light Mode";

    } else {

        themeBtn.textContent =
            "🌙";

        themeBtn.title =
            "Dark Mode";

    }

}


/* ---------- APPLY SAVED THEME ---------- */

function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "sociologyTheme"
        );


    if (
        savedTheme === "dark"
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


/* ---------- TOGGLE THEME ---------- */

window.toggleTheme =
    function () {

        document.body.classList.toggle(
            "dark"
        );


        const darkMode =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "sociologyTheme",
            darkMode
                ? "dark"
                : "light"
        );


        updateThemeButton();

    };


/* =========================================================
   SEARCH
   ========================================================= */

function searchWebsite() {

    if (!searchBar)
        return;


    const q =
        searchBar.value
            .toLowerCase()
            .trim();


    let visible = 0;


    document.querySelectorAll(
        "#postsContainer > div, " +
        "#news .card, " +
        "#events .event-card"
    ).forEach(
        (element) => {

            const match =
                !q ||
                element.textContent
                    .toLowerCase()
                    .includes(q);


            element.style.display =
                match
                    ? ""
                    : "none";


            if (match) {

                visible++;

            }

        }
    );


    const resources =
        document.getElementById(
            "resources"
        );


    if (resources) {

        const match =
            !q ||
            resources.textContent
                .toLowerCase()
                .includes(q);


        resources.style.display =
            match
                ? ""
                : "none";

    }


    const counter =
        document.getElementById(
            "searchCount"
        );


    if (counter) {

        counter.textContent =
            q
                ? `${visible} results found`
                : "";

    }

}


searchBar?.addEventListener(
    "input",
    searchWebsite
);


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function updateNotificationBadge() {

    if (!notifyBtn)
        return;


    const list =
        JSON.parse(
            localStorage.getItem(
                "sc_notify"
            )
        ) || [];


    notifyBtn.innerHTML =
        list.length
            ? `🔔 <span style="color:red">${list.length}</span>`
            : "🔔";

}


window.showNotifications =
    function () {

        const list =
            JSON.parse(
                localStorage.getItem(
                    "sc_notify"
                )
            ) || [];


        if (list.length === 0) {

            alert(
                "🔔 No new notifications."
            );

            return;

        }


        alert(
            "🔔 Notifications\n\n" +
            list
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
        () => {

            try {

                recognition.start();


                if (micBtn) {

                    micBtn.textContent =
                        "🔴";

                }

            } catch (error) {

                console.log(
                    "Voice already running."
                );

            }

        }
    );


    recognition.onresult =
        (event) => {

            if (!userInput)
                return;


            userInput.value =
                event.results[0][0]
                    .transcript;


            userInput.focus();


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


} else {

    if (micBtn) {

        micBtn.title =
            "Voice input is not supported.";

    }

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applySavedTheme();

        updateNotificationBadge();


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() === "k"
                ) {

                    event.preventDefault();

                    searchBar?.focus();

                }

            }
        );


        console.log(
            "✅ Sociology Connect Professional Script Loaded."
        );


        console.log(
            "✅ Firebase Post System Loaded."
        );

    }
);
