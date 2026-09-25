/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
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
   FIREBASE
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
    deleteDoc,
    onAuthStateChanged
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

const postBtn =
    document.getElementById("postBtn");


/* =========================================================
   GLOBAL USER
   ========================================================= */

let currentUser = null;


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
   DATE FORMAT
   ========================================================= */

function formatPostTime(timestamp) {

    if (!timestamp) {
        return "Just now";
    }

    try {

        const date =
            timestamp.toDate();

        return date.toLocaleString(
            "en-US",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    } catch {

        return "Just now";

    }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;

        console.log(
            user
                ? "✅ Logged in: " + user.email
                : "ℹ️ User not logged in"
        );

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

        const profileSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );

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
            "Profile unavailable:",
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


    const text =
        postInput.value.trim();


    if (!text) {

        alert(
            "Please write something first."
        );

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

                name: name,

                email:
                    currentUser.email || "",

                createdAt:
                    serverTimestamp()

            }
        );


        postInput.value = "";


        console.log(
            "✅ POST CREATED"
        );


    } catch (error) {

        console.error(
            "❌ CREATE POST ERROR:",
            error
        );

        alert(
            "Post failed:\n" +
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

if (postBtn) {

    postBtn.addEventListener(
        "click",
        createPost
    );

}


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

async function toggleLike(postId, button) {

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
            await getDoc(likeRef);


        if (likeSnap.exists()) {

            await deleteDoc(
                likeRef
            );

            console.log(
                "💔 Like removed"
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
                "❤️ Post liked"
            );

        }

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
   LOAD LIKE COUNT
   ========================================================= */

async function loadLikeCount(
    postId,
    likeButton
) {

    try {

        const likesSnap =
            await getDocs(
                collection(
                    db,
                    "posts",
                    postId,
                    "likes"
                )
            );


        const count =
            likesSnap.size;


        const liked =
            currentUser
                ? likesSnap.docs.some(
                    d =>
                        d.id ===
                        currentUser.uid
                )
                : false;


        likeButton.textContent =
            liked
                ? `❤️ Liked (${count})`
                : `🤍 Like (${count})`;


    } catch (error) {

        console.error(
            "Like count error:",
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

        return;

    }


    const comment =
        prompt(
            "Write your comment:"
        );


    if (
        !comment ||
        !comment.trim()
    ) {

        return;

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


        alert(
            "✅ Comment added!"
        );


    } catch (error) {

        console.error(
            "❌ COMMENT ERROR:",
            error
        );

        alert(
            "Comment failed:\n" +
            error.message
        );

    }

}


/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadComments(
    postId,
    commentButton,
    card
) {

    try {

        const commentsSnap =
            await getDocs(
                collection(
                    db,
                    "posts",
                    postId,
                    "comments"
                )
            );


        const count =
            commentsSnap.size;


        commentButton.textContent =
            `💬 Comment (${count})`;


        const oldComments =
            card.querySelector(
                ".comments-box"
            );


        if (oldComments) {
            oldComments.remove();
        }


        if (count === 0) {
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

        commentsBox.style.paddingTop =
            "10px";

        commentsBox.style.borderTop =
            "1px solid #ddd";


        commentsSnap.forEach(
            (commentDoc) => {

                const data =
                    commentDoc.data();


                const commentDiv =
                    document.createElement(
                        "div"
                    );


                commentDiv.style.padding =
                    "7px 0";


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
            "Comment loading error:",
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

        if (
            navigator.share
        ) {

            await navigator.share(
                {
                    title:
                        "Sociology Connect",

                    text:
                        postText,

                    url:
                        shareUrl
                }
            );

            return;

        }


        await navigator.clipboard.writeText(
            shareUrl
        );


        alert(
            "✅ Post link copied!"
        );


    } catch (error) {

        console.log(
            "Share cancelled or failed:",
            error
        );

    }

}


/* =========================================================
   LOAD POSTS
   ========================================================= */

function loadPosts() {

    if (!postsContainer) {
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


                const firstLetter =
                    (
                        post.name ||
                        "Student"
                    )
                    .charAt(0)
                    .toUpperCase();


                card.innerHTML = `

                    <div class="post-header">

                        <div
                            class="post-avatar"
                            style="
                                background:#007bff;
                                color:white;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-weight:bold;
                            "
                        >
                            ${escapeHTML(
                                firstLetter
                            )}
                        </div>


                        <div>

                            <div class="post-name">

                                ${escapeHTML(
                                    post.name ||
                                    "Student"
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
                            🤍 Like
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


                /* ---------- LIKE ---------- */

                likeButton.addEventListener(
                    "click",
                    async () => {

                        await toggleLike(
                            postId,
                            likeButton
                        );

                        await loadLikeCount(
                            postId,
                            likeButton
                        );

                    }
                );


                /* ---------- COMMENT ---------- */

                commentButton.addEventListener(
                    "click",
                    async () => {

                        await commentPost(
                            postId
                        );

                        await loadComments(
                            postId,
                            commentButton,
                            card
                        );

                    }
                );


                /* ---------- SHARE ---------- */

                shareButton.addEventListener(
                    "click",
                    async () => {

                        await sharePost(
                            postId,
                            post.text || ""
                        );

                    }
                );


                /* ---------- INITIAL COUNTS ---------- */

                await loadLikeCount(
                    postId,
                    likeButton
                );


                await loadComments(
                    postId,
                    commentButton,
                    card
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


    if (sendBtn) {

        sendBtn.disabled = true;

        sendBtn.textContent =
            "Thinking...";

    }


    const loading =
        document.createElement(
            "div"
        );


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


        loading.remove();


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


        const copyButton =
            aiMessage.querySelector(
                ".copy-btn"
            );


        copyButton?.addEventListener(
            "click",
            async () => {

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            reply
                        );


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


        chatHistory.appendChild(
            aiMessage
        );


        chatHistory.scrollTop =
            chatHistory.scrollHeight;


    } catch (error) {

        console.error(
            "AI Mari Error:",
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

            Sorry, connection failed.
            Please try again.

        `;


        chatHistory.appendChild(
            errorMessage
        );


    } finally {

        if (sendBtn) {

            sendBtn.disabled = false;

            sendBtn.textContent =
                "Send";

        }

    }

}


/* =========================================================
   AI EVENTS
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

    if (!themeBtn) {
        return;
    }


    const dark =
        document.body.classList.contains(
            "dark"
        );


    themeBtn.textContent =
        dark
            ? "☀️"
            : "🌙";


    themeBtn.title =
        dark
            ? "Light Mode"
            : "Dark Mode";

}


function applySavedTheme() {

    const saved =
        localStorage.getItem(
            "sociologyTheme"
        );


    if (saved === "dark") {

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


window.toggleTheme =
    function () {

        document.body.classList.toggle(
            "dark"
        );


        const dark =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "sociologyTheme",
            dark
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


    const q =
        searchBar.value
            .toLowerCase()
            .trim();


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


    const list =
        JSON.parse(
            localStorage.getItem(
                "sc_notify"
            )
        ) || [];


    notifyBtn.innerHTML =
        list.length
            ? `🔔 ${list.length}`
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


        if (!list.length) {

            alert(
                "🔔 No new notifications."
            );

            return;

        }


        alert(
            "🔔 Notifications\n\n" +
            list
                .slice(0,10)
                .join("\n\n")
        );

    };


/* =========================================================
   VOICE
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

            } catch {

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
        () => {

            if (micBtn) {
                micBtn.textContent =
                    "🎤";
            }

        };

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applySavedTheme();

        updateNotificationBadge();

        console.log(
            "✅ Sociology Connect loaded."
        );

        console.log(
            "✅ Firebase Post system loaded."
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

    }
);
