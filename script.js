/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
   ---------------------------------------------------------
   AI MARI
   FIREBASE POSTS
   LIKE
   COMMENT
   SHARE
   DARK MODE
   SEARCH
   VOICE
   NOTIFICATIONS
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
    getDoc,
    getDocs,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
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
   GLOBAL USER STATE
   ========================================================= */

let currentUser = null;

let authReady = false;


/* =========================================================
   SECURITY
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
   FORMAT DATE
   ========================================================= */

function formatPostTime(timestamp) {

    if (!timestamp) {
        return "Just now";
    }

    try {

        if (
            typeof timestamp.toDate === "function"
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

        return "Just now";

    } catch {

        return "Just now";

    }

}


/* =========================================================
   FIREBASE AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;

        authReady = true;

        if (user) {

            console.log(
                "✅ Logged in:",
                user.email
            );

            if (userInfo) {

                userInfo.textContent =
                    "👤 " +
                    (
                        user.displayName ||
                        user.email?.split("@")[0] ||
                        "Student"
                    );

            }

            if (loginLink) {

                loginLink.style.display =
                    "none";

            }

            if (logoutBtn) {

                logoutBtn.style.display =
                    "inline-block";

            }

        } else {

            console.log(
                "ℹ️ No user logged in."
            );

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

        }

    }
);


/* =========================================================
   GET USER NAME
   ========================================================= */

async function getUserName(user) {

    if (!user) {
        return "Student";
    }

    try {

        const profileRef =
            doc(
                db,
                "users",
                user.uid
            );

        const profileSnap =
            await getDoc(profileRef);

        if (profileSnap.exists()) {

            const data =
                profileSnap.data();

            return (
                data.fullName ||
                data.name ||
                user.displayName ||
                user.email?.split("@")[0] ||
                "Student"
            );

        }

    } catch (error) {

        console.log(
            "Profile not available:",
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
   CREATE POST
   ========================================================= */

async function createPost() {

    if (!postInput) {

        console.error(
            "❌ postInput not found."
        );

        return;

    }


    if (!authReady) {

        alert(
            "Please wait a moment and try again."
        );

        return;

    }


    const text =
        postInput.value.trim();


    if (!text) {

        alert(
            "Write something first."
        );

        postInput.focus();

        return;

    }


    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

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
            collection(
                db,
                "posts"
            ),
            {

                text: text,

                userId:
                    currentUser.uid,

                name:
                    name,

                email:
                    currentUser.email || "",

                createdAt:
                    serverTimestamp()

            }
        );


        postInput.value = "";

        console.log(
            "✅ Post created successfully."
        );


    } catch (error) {

        console.error(
            "❌ CREATE POST ERROR:",
            error
        );

        alert(
            "Post failed:\n\n" +
            error.message
        );

    } finally {

        if (postBtn) {

            postBtn.disabled = false;

            postBtn.textContent =
                "📤 Post";

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
    likeButton
) {

    if (!currentUser) {

        alert(
            "Please login to like a post."
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

        const likeSnap =
            await getDoc(
                likeRef
            );


        if (likeSnap.exists()) {

            await deleteDoc(
                likeRef
            );

            console.log(
                "💔 Like removed."
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

            console.log(
                "❤️ Post liked."
            );

        }


        await updateLikeButton(
            postId,
            likeButton
        );


    } catch (error) {

        console.error(
            "❌ LIKE ERROR:",
            error
        );

        alert(
            "Like failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   UPDATE LIKE BUTTON
   ========================================================= */

async function updateLikeButton(
    postId,
    likeButton
) {

    if (!likeButton) {
        return;
    }


    try {

        const likesRef =
            collection(
                db,
                "posts",
                postId,
                "likes"
            );


        const likesSnap =
            await getDocs(
                likesRef
            );


        const count =
            likesSnap.size;


        let liked = false;


        if (currentUser) {

            liked =
                likesSnap.docs.some(
                    (item) =>
                        item.id ===
                        currentUser.uid
                );

        }


        likeButton.textContent =
            liked
                ? `❤️ Liked (${count})`
                : `🤍 Like (${count})`;


    } catch (error) {

        console.error(
            "❌ LIKE COUNT ERROR:",
            error
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

        alert(
            "Please login to comment."
        );

        return false;

    }


    const comment =
        prompt(
            "💬 Write your comment:"
        );


    if (
        comment === null ||
        !comment.trim()
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
                    comment.trim(),

                userId:
                    currentUser.uid,

                name:
                    name,

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "💬 Comment added."
        );


        return true;


    } catch (error) {

        console.error(
            "❌ COMMENT ERROR:",
            error
        );

        alert(
            "Comment failed:\n\n" +
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
    commentButton,
    card,
    showComments = false
) {

    try {

        const commentsRef =
            collection(
                db,
                "posts",
                postId,
                "comments"
            );


        const commentsSnap =
            await getDocs(
                commentsRef
            );


        const count =
            commentsSnap.size;


        if (commentButton) {

            commentButton.textContent =
                `💬 Comment (${count})`;

        }


        const oldBox =
            card.querySelector(
                ".comments-box"
            );


        if (oldBox) {

            oldBox.remove();

        }


        if (
            count === 0 ||
            !showComments
        ) {

            return;

        }


        const commentsBox =
            document.createElement(
                "div"
            );


        commentsBox.className =
            "comments-box";


        commentsBox.style.marginTop =
            "12px";

        commentsBox.style.padding =
            "10px";

        commentsBox.style.borderTop =
            "1px solid #ddd";

        commentsBox.style.borderRadius =
            "10px";


        const sortedComments =
            [...commentsSnap.docs]
                .sort(
                    (a, b) => {

                        const ta =
                            a.data()
                                .createdAt
                                ?.toMillis?.() || 0;

                        const tb =
                            b.data()
                                .createdAt
                                ?.toMillis?.() || 0;

                        return ta - tb;

                    }
                );


        sortedComments.forEach(
            (commentDoc) => {

                const data =
                    commentDoc.data();


                const commentDiv =
                    document.createElement(
                        "div"
                    );


                commentDiv.style.padding =
                    "8px 0";


                commentDiv.style.borderBottom =
                    "1px solid #eee";


                commentDiv.innerHTML = `

                    <strong>
                        ${escapeHTML(
                            data.name ||
                            "Student"
                        )}
                    </strong>

                    <br>

                    <span>
                        ${escapeHTML(
                            data.text ||
                            ""
                        )}
                    </span>

                `;


                commentsBox.appendChild(
                    commentDiv
                );

            }
        );


        card.appendChild(
            commentsBox
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
    postText
) {

    const shareUrl =
        window.location.href.split("#")[0] +
        "#post-" +
        postId;


    try {

        /* ---------- MOBILE SHARE ---------- */

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Sociology Connect",

                text:
                    postText,

                url:
                    shareUrl

            });


            console.log(
                "📤 Post shared."
            );

            return;

        }


        /* ---------- COPY LINK ---------- */

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard
                .writeText(
                    shareUrl
                );


            alert(
                "✅ Post link copied!"
            );

            return;

        }


        /* ---------- FALLBACK ---------- */

        const temporaryInput =
            document.createElement(
                "input"
            );


        temporaryInput.value =
            shareUrl;


        document.body.appendChild(
            temporaryInput
        );


        temporaryInput.select();


        document.execCommand(
            "copy"
        );


        temporaryInput.remove();


        alert(
            "✅ Post link copied!"
        );


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "❌ SHARE ERROR:",
            error
        );

        alert(
            "Share failed."
        );

    }

}


/* =========================================================
   LOAD POSTS
   ========================================================= */

function loadPosts() {

    if (!postsContainer) {

        console.error(
            "❌ postsContainer not found."
        );

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

            postsContainer.innerHTML = "";


            if (snapshot.empty) {

                postsContainer.innerHTML = `

                    <div class="post-card">

                        <p>
                            No posts yet.
                            Be the first student
                            to post something! 📚
                        </p>

                    </div>

                `;

                return;

            }


            for (
                const postDoc
                of snapshot.docs
            ) {

                const post =
                    postDoc.data();


                const postId =
                    postDoc.id;


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "post-card";


                card.id =
                    "post-" +
                    postId;


                const name =
                    post.name ||
                    "Student";


                const firstLetter =
                    name
                        .charAt(0)
                        .toUpperCase();


                card.innerHTML = `

                    <div class="post-header">

                        <div
                            class="post-avatar"
                            aria-label="User avatar"
                        >
                            ${escapeHTML(
                                firstLetter
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
                            post.text ||
                            ""
                        )}

                    </div>


                    <div class="post-actions">

                        <button
                            type="button"
                            class="like-btn"
                        >
                            🤍 Like (0)
                        </button>


                        <button
                            type="button"
                            class="comment-btn"
                        >
                            💬 Comment (0)
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


                const likeButton =
                    card.querySelector(
                        ".like-btn"
                    );


                const commentButton =
                    card.querySelector(
                        ".comment-btn"
                    );


                const shareButton =
                    card.querySelector(
                        ".share-btn"
                    );


                /* =================================================
                   LIKE EVENT
                   ================================================= */

                likeButton?.addEventListener(
                    "click",
                    async () => {

                        await toggleLike(
                            postId,
                            likeButton
                        );

                    }
                );


                /* =================================================
                   COMMENT EVENT
                   ================================================= */

                commentButton?.addEventListener(
                    "click",
                    async () => {

                        const added =
                            await commentPost(
                                postId
                            );


                        if (added) {

                            await loadComments(
                                postId,
                                commentButton,
                                card,
                                true
                            );

                        } else {

                            await loadComments(
                                postId,
                                commentButton,
                                card,
                                false
                            );

                        }

                    }
                );


                /* =================================================
                   SHARE EVENT
                   ================================================= */

                shareButton?.addEventListener(
                    "click",
                    async () => {

                        await sharePost(
                            postId,
                            post.text ||
                            ""
                        );

                    }
                );


                /* =================================================
                   INITIAL LIKE COUNT
                   ================================================= */

                await updateLikeButton(
                    postId,
                    likeButton
                );


                /* =================================================
                   INITIAL COMMENT COUNT
                   ================================================= */

                await loadComments(
                    postId,
                    commentButton,
                    card,
                    false
                );

            }

        },

        (error) => {

            console.error(
                "❌ LOAD POSTS ERROR:",
                error
            );


            postsContainer.innerHTML = `

                <div class="post-card">

                    <p>
                        ❌ Unable to load posts.
                    </p>

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


loadPosts();


/* =========================================================
   AI MARI
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


    /* =====================================================
       USER MESSAGE
       ===================================================== */

    const userMessage =
        document.createElement(
            "div"
        );


    userMessage.className =
        "message user";


    userMessage.innerHTML =
        "<b>You:</b> " +
        escapeHTML(text);


    chatHistory.appendChild(
        userMessage
    );


    userInput.value = "";


    /* =====================================================
       SEND BUTTON
       ===================================================== */

    if (sendBtn) {

        sendBtn.disabled = true;

        sendBtn.textContent =
            "Thinking...";

    }


    /* =====================================================
       LOADING
       ===================================================== */

    const loading =
        document.createElement(
            "div"
        );


    loading.className =
        "message ai";


    loading.innerHTML = `

        <b>AI Mari:</b><br>

        <i>Typing... 🤖</i>

    `;


    chatHistory.appendChild(
        loading
    );


    chatHistory.scrollTop =
        chatHistory.scrollHeight;


    try {

        /* =================================================
           AI REQUEST
           ================================================= */

        const apiUrl =
            "https://text.pollinations.ai/" +
            encodeURIComponent(text);


        const response =
            await fetch(
                apiUrl,
                {
                    method: "GET"
                }
            );


        if (!response.ok) {

            throw new Error(
                "AI server returned HTTP " +
                response.status
            );

        }


        const reply =
            await response.text();


        if (
            !reply ||
            !reply.trim()
        ) {

            throw new Error(
                "Empty AI response."
            );

        }


        loading.remove();


        /* =================================================
           AI MESSAGE
           ================================================= */

        const aiMessage =
            document.createElement(
                "div"
            );


        aiMessage.className =
            "message ai";


        aiMessage.innerHTML = `

            <b>AI Mari:</b><br>

            <span class="ai-text">

                ${escapeHTML(
                    reply
                )}

            </span>

            <br><br>

            <button
                class="copy-btn"
                type="button"
            >
                📋 Copy
            </button>

        `;


        /* =================================================
           COPY AI RESPONSE
           ================================================= */

        const copyButton =
            aiMessage.querySelector(
                ".copy-btn"
            );


        copyButton?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        navigator.clipboard
                    ) {

                        await navigator
                            .clipboard
                            .writeText(
                                reply
                            );

                    } else {

                        const temp =
                            document.createElement(
                                "textarea"
                            );

                        temp.value =
                            reply;

                        document.body
                            .appendChild(
                                temp
                            );

                        temp.select();

                        document.execCommand(
                            "copy"
                        );

                        temp.remove();

                    }


                    copyButton.textContent =
                        "✅ Copied!";


                    setTimeout(
                        () => {

                            copyButton.textContent =
                                "📋 Copy";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "Copy error:",
                        error
                    );

                    alert(
                        "Copy failed."
                    );

                }

            }
        );


        chatHistory.appendChild(
            aiMessage
        );


        chatHistory.scrollTop =
            chatHistory.scrollHeight;


    } catch (error) {

        console.error(
            "❌ AI MARI ERROR:",
            error
        );


        loading.remove();


        const errorMessage =
            document.createElement(
                "div"
            );


        errorMessage.className =
            "message ai";


        errorMessage.innerHTML = `

            <b>AI Mari:</b><br>

            <span class="ai-text">

                ❌ Sorry, AI connection failed.
                Please check your internet connection
                and try again.

            </span>

        `;


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


/* =========================================================
   AI SEND BUTTON
   ========================================================= */

sendBtn?.addEventListener(
    "click",
    sendToServer
);


/* =========================================================
   AI ENTER KEY
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
   DARK MODE
   ========================================================= */

function updateThemeButton() {

    if (!themeBtn) {

        return;

    }


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    themeBtn.textContent =
        isDark
            ? "☀️"
            : "🌙";


    themeBtn.title =
        isDark
            ? "Light Mode"
            : "Dark Mode";

}


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


function toggleTheme() {

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


    console.log(
        isDark
            ? "🌙 Dark mode enabled."
            : "☀️ Light mode enabled."
    );

}


window.toggleTheme =
    toggleTheme;


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


    let visible =
        0;


    document.querySelectorAll(
        "#postsContainer > div, " +
        "#news .card, " +
        "#events .event-card"
    ).forEach(
        (element) => {

            const text =
                element.textContent
                    .toLowerCase();


            const match =
                !q ||
                text.includes(q);


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

    if (!notifyBtn) {

        return;

    }


    const notifications =
        JSON.parse(
            localStorage.getItem(
                "sc_notify"
            )
        ) || [];


    notifyBtn.innerHTML =
        notifications.length
            ? `🔔 <span style="color:red;font-weight:bold;">${notifications.length}</span>`
            : "🔔";

}


function showNotifications() {

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
            "🔔 No new notifications."
        );

        return;

    }


    alert(
        "🔔 Notifications\n\n" +
        notifications
            .slice(0, 10)
            .join("\n\n")
    );

}


window.showNotifications =
    showNotifications;


notifyBtn?.addEventListener(
    "click",
    showNotifications
);


/* =========================================================
   VOICE INPUT
   ========================================================= */

let recognition =
    null;


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


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

            if (!userInput) {

                return;

            }


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
        (error) => {

            console.log(
                "Voice error:",
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
   LOGOUT
   ========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            const {
                signOut
            } = await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"
            );


            await signOut(
                auth
            );


            alert(
                "✅ Logged out successfully."
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "❌ Logout error:",
                error
            );


            alert(
                "Logout failed:\n\n" +
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
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            searchBar?.focus();

        }

    }
);


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applySavedTheme();

        updateNotificationBadge();

        console.log(
            "================================"
        );

        console.log(
            "✅ Sociology Connect loaded."
        );

        console.log(
            "✅ Firebase connected."
        );

        console.log(
            "✅ Post system loaded."
        );

        console.log(
            "❤️ Like system loaded."
        );

        console.log(
            "💬 Comment system loaded."
        );

        console.log(
            "📤 Share system loaded."
        );

        console.log(
            "🤖 AI Mari loaded."
        );

        console.log(
            "🌙 Dark Mode loaded."
        );

        console.log(
            "🔎 Search loaded."
        );

        console.log(
            "🔔 Notifications loaded."
        );

        console.log(
            "🎤 Voice system loaded."
        );

        console.log(
            "================================"
        );

    }
);
