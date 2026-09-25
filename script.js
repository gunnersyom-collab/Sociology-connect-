/* =========================================================
   SOCIOLOGY CONNECT - SCRIPT.JS
   ---------------------------------------------------------
   AI MARI
   FIREBASE POSTS
   LIKE
   COMMENT
   SHARE
   DELETE POST
   ADMIN CLEAR ALL POSTS
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
    onAuthStateChanged,
    signOut
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

const ADMIN_EMAIL =  
"yom@gmail.com";

/* =========================================================
   ADMIN CHECK
   ========================================================= */

function isAdmin() {

    return (
        currentUser &&
        currentUser.email?.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    );

}


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
                loginLink.style.display = "none";
            }

            if (logoutBtn) {
                logoutBtn.style.display = "inline-block";
            }

            /* ADMIN BUTTON */

            createAdminControls();

        } else {

            console.log(
                "ℹ️ No user logged in."
            );

            if (userInfo) {
                userInfo.textContent = "";
            }

            if (loginLink) {
                loginLink.style.display = "inline-block";
            }

            if (logoutBtn) {
                logoutBtn.style.display = "none";
            }

            removeAdminControls();

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
        postBtn.textContent = "Posting...";

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
            postBtn.textContent = "📤 Post";

        }

    }

}


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

        if (navigator.share) {

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
   DELETE ONE POST
   ========================================================= */

async function deletePost(
    postId,
    postOwnerId
) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }

    const allowed =
        isAdmin() ||
        currentUser.uid === postOwnerId;

    if (!allowed) {

        alert(
            "❌ You can only delete your own post."
        );

        return;

    }

    const confirmed =
        confirm(
            "🗑️ Delete this post?\n\n" +
            "This will also delete its likes and comments."
        );

    if (!confirmed) {
        return;
    }

    try {

        /* DELETE LIKES */

        const likesSnapshot =
            await getDocs(
                collection(
                    db,
                    "posts",
                    postId,
                    "likes"
                )
            );

        for (
            const likeDoc
            of likesSnapshot.docs
        ) {

            await deleteDoc(
                likeDoc.ref
            );

        }


        /* DELETE COMMENTS */

        const commentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "posts",
                    postId,
                    "comments"
                )
            );

        for (
            const commentDoc
            of commentsSnapshot.docs
        ) {

            await deleteDoc(
                commentDoc.ref
            );

        }


        /* DELETE POST */

        await deleteDoc(
            doc(
                db,
                "posts",
                postId
            )
        );

        console.log(
            "🗑️ Post deleted:",
            postId
        );

    } catch (error) {

        console.error(
            "❌ DELETE POST ERROR:",
            error
        );

        alert(
            "Delete failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   ADMIN - CLEAR ALL POSTS
   ========================================================= */

async function clearAllPosts() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }

    if (!isAdmin()) {

        alert(
            "❌ Admin access required."
        );

        return;

    }

    const confirmed =
        confirm(
            "⚠️ CLEAR ALL POSTS?\n\n" +
            "This will permanently delete ALL posts, likes and comments.\n\n" +
            "This action cannot easily be undone."
        );

    if (!confirmed) {
        return;
    }

    try {

        const postsSnapshot =
            await getDocs(
                collection(
                    db,
                    "posts"
                )
            );

        if (postsSnapshot.empty) {

            alert(
                "There are no posts to clear."
            );

            return;

        }

        let deletedCount = 0;

        for (
            const postDoc
            of postsSnapshot.docs
        ) {

            const postId =
                postDoc.id;


            /* DELETE LIKES */

            const likesSnapshot =
                await getDocs(
                    collection(
                        db,
                        "posts",
                        postId,
                        "likes"
                    )
                );

            for (
                const likeDoc
                of likesSnapshot.docs
            ) {

                await deleteDoc(
                    likeDoc.ref
                );

            }


            /* DELETE COMMENTS */

            const commentsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "posts",
                        postId,
                        "comments"
                    )
                );

            for (
                const commentDoc
                of commentsSnapshot.docs
            ) {

                await deleteDoc(
                    commentDoc.ref
                );

            }


            /* DELETE POST */

            await deleteDoc(
                doc(
                    db,
                    "posts",
                    postId
                )
            );

            deletedCount++;

        }

        alert(
            `✅ All posts cleared.\n\n${deletedCount} posts deleted.`
        );

    } catch (error) {

        console.error(
            "❌ CLEAR ALL ERROR:",
            error
        );

        alert(
            "Clear All failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   ADMIN CONTROLS
   ========================================================= */

function createAdminControls() {

    if (!isAdmin()) {
        return;
    }

    if (
        document.getElementById(
            "adminClearPostsBtn"
        )
    ) {
        return;
    }

    const composer =
        document.querySelector(
            ".post-composer"
        );

    if (!composer) {
        return;
    }

    const adminBox =
        document.createElement(
            "div"
        );

    adminBox.id =
        "adminControls";

    adminBox.style.marginTop =
        "15px";

    adminBox.style.paddingTop =
        "12px";

    adminBox.style.borderTop =
        "1px solid #ddd";

    adminBox.innerHTML = `

        <div style="
            font-weight:bold;
            margin-bottom:8px;
        ">
            👑 Admin Controls
        </div>

        <button
            id="adminClearPostsBtn"
            type="button"
            style="
                background:#dc3545;
                color:white;
                border:none;
                padding:10px 15px;
                border-radius:9px;
                cursor:pointer;
                font-weight:bold;
            ">
            🧹 Clear All Posts
        </button>

    `;

    composer.appendChild(
        adminBox
    );

    document
        .getElementById(
            "adminClearPostsBtn"
        )
        ?.addEventListener(
            "click",
            clearAllPosts
        );

}


function removeAdminControls() {

    document
        .getElementById(
            "adminControls"
        )
        ?.remove();

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


                /* =================================================
                   DELETE BUTTON
                   ================================================= */

                let deleteButtonHTML = "";

                if (
                    currentUser &&
                    (
                        isAdmin() ||
                        currentUser.uid ===
                        post.userId
                    )
                ) {

                    deleteButtonHTML = `

                        <button
                            type="button"
                            class="delete-btn"
                            data-post-id="${escapeHTML(postId)}"
                            data-owner-id="${escapeHTML(post.userId || "")}"
                            style="
                                color:#dc3545;
                                font-weight:bold;
                            ">
                            🗑️ Delete
                        </button>

                    `;

                }


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
                            data-post-id="${escapeHTML(postId)}">

                            🤍 Like (0)

                        </button>


                        <button
                            type="button"
                            class="comment-btn"
                            data-post-id="${escapeHTML(postId)}">

                            💬 Comment (0)

                        </button>


                        <button
                            type="button"
                            class="share-btn"
                            data-post-id="${escapeHTML(postId)}">

                            📤 Share

                        </button>


                        ${deleteButtonHTML}

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

                const deleteButton =
                    card.querySelector(
                        ".delete-btn"
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

                        await loadComments(
                            postId,
                            commentButton,
                            card,
                            added
                        );

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
                            post.text || ""
                        );

                    }
                );


                /* =================================================
                   DELETE EVENT
                   ================================================= */

                deleteButton?.addEventListener(
                    "click",
                    async () => {

                        await deletePost(
                            postId,
                            post.userId
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
   LOAD TRENDING POSTS
   ========================================================= */

async function loadTrendingPosts() {

    const trendingContainer =
        document.getElementById("trendingContainer");

    if (!trendingContainer) {
        return;
    }

    try {

        const postsSnapshot =
            await getDocs(
                collection(db, "posts")
            );

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

            const post =
                postDoc.data();

            const likesSnapshot =
                await getDocs(
                    collection(
                        db,
                        "posts",
                        postDoc.id,
                        "likes"
                    )
                );

            const commentsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "posts",
                        postDoc.id,
                        "comments"
                    )
                );

            posts.push({
                id: postDoc.id,
                ...post,
                likes: likesSnapshot.size,
                comments: commentsSnapshot.size,
                score:
                    likesSnapshot.size +
                    commentsSnapshot.size
            });
        }

        posts.sort(
            (a, b) =>
                b.score - a.score
        );

        const trending =
            posts.slice(0, 5);

        trendingContainer.innerHTML = "";

        trending.forEach((post) => {

            const card =
                document.createElement("div");

            card.className = "post-card";

            card.innerHTML = `

                <div class="post-header">

                    <div class="post-avatar">
                        ${escapeHTML(
                            (post.name || "Student")
                            .charAt(0)
                            .toUpperCase()
                        )}
                    </div>

                    <div>

                        <div class="post-name">
                            ${escapeHTML(
                                post.name || "Student"
                            )}
                        </div>
/* =========================================================
   LOAD TRENDING POSTS
   ========================================================= */

async function loadTrendingPosts() {

    const trendingContainer = document.getElementById("trendingContainer");
    if (!trendingContainer) return;

    try {
        const postsSnapshot = await getDocs(collection(db, "posts"));

        if (postsSnapshot.empty) {
            trendingContainer.innerHTML = `
                <div class="post-card">🔥 No trending posts yet.</div>
            `;
            return;
        }

        const posts = [];

        for (const postDoc of postsSnapshot.docs) {
            const post = postDoc.data();

            const likes = await getDocs(
                collection(db, "posts", postDoc.id, "likes")
            );

            const comments = await getDocs(
                collection(db, "posts", postDoc.id, "comments")
            );

            posts.push({
                id: postDoc.id,
                name: post.name || "Student",
                text: post.text || "",
                likes: likes.size,
                comments: comments.size,
                score: likes.size + comments.size
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

                <div class="post-text">${escapeHTML(post.text)}</div>

                <div class="post-actions">
                    <button disabled>❤️ ${post.likes}</button>
                    <button disabled>💬 ${post.comments}</button>
                    <button disabled>🔥 Popular</button>
                </div>
            `;

            trendingContainer.appendChild(card);
        });

    } catch (error) {
        console.error("❌ TRENDING ERROR:", error);

        trendingContainer.innerHTML = `
            <div class="post-card">❌ Unable to load trending posts.</div>
        `;
    }
}

loadTrendingPosts();
/* Start Trending */
loadTrendingPosts();

/* =========================================================
   LOAD NEWS FROM FIRESTORE
   ========================================================= */

/* =========================================================
   LOAD NEWS FROM FIRESTORE
   ========================================================= */

function loadNews() {

    const newsContainer =
        document.getElementById("newsContainer");

    if (!newsContainer) {
        return;
    }

    const newsQuery =
        query(
            collection(db, "news"),
            orderBy("createdAt", "desc")
        );

    onSnapshot(
        newsQuery,

        (snapshot) => {

            newsContainer.innerHTML = "";

            if (snapshot.empty) {

                newsContainer.innerHTML = `
                    <div class="card">
                        📰 No latest news available yet.
                    </div>
                `;

                return;
            }

            snapshot.forEach((newsDoc) => {

                const news =
                    newsDoc.data();

                const card =
                    document.createElement("div");

                card.className = "card";

                card.innerHTML = `
                    <h3>
                        📢 ${escapeHTML(
                            news.title || "Latest News"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            news.description || ""
                        )}
                    </p>

                    ${
                        news.createdAt
                        ? `
                            <small style="color:#777;">
                                🕐 ${formatPostTime(
                                    news.createdAt
                                )}
                            </small>
                        `
                        : ""
                    }
                `;

                newsContainer.appendChild(card);

            });

        },

        (error) => {

            console.error(
                "❌ LOAD NEWS ERROR:",
                error
            );

            newsContainer.innerHTML = `
                <div class="card">
                    ❌ Unable to load latest news.
                </div>
            `;

        }
    );

}


loadNews();

/* =========================================================
   LOAD EVENTS FROM FIRESTORE
   ========================================================= */

function loadEvents() {

    const eventsContainer =
        document.getElementById("eventsContainer");

    if (!eventsContainer) {
        return;
    }

    const eventsQuery =
        query(
            collection(db, "events"),
            orderBy("date", "asc")
        );

    onSnapshot(
        eventsQuery,

        (snapshot) => {

            eventsContainer.innerHTML = "";

            if (snapshot.empty) {

                eventsContainer.innerHTML = `
                    <div class="event-card">
                        📅 No events or deadlines available yet.
                    </div>
                `;

                return;
            }

            snapshot.forEach((eventDoc) => {

                const event =
                    eventDoc.data();

                const card =
                    document.createElement("div");

                card.className = "event-card";

                card.innerHTML = `
                    <strong>
                        📅 ${escapeHTML(
                            event.title || "Event"
                        )}
                    </strong>

                    <br><br>

                    ${escapeHTML(
                        event.description || ""
                    )}

                    ${
                        event.date
                        ? `
                            <br><br>
                            <small>
                                📅 ${escapeHTML(event.date)}
                            </small>
                        `
                        : ""
                    }
                `;

                eventsContainer.appendChild(card);

            });

        },

        (error) => {

            console.error(
                "❌ LOAD EVENTS ERROR:",
                error
            );

            eventsContainer.innerHTML = `
                <div class="event-card">
                    ❌ Unable to load events.
                </div>
            `;
        }
    );
}

loadEvents();
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
        sendBtn.textContent = "Thinking...";

    }


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
                type="button">
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

            sendBtn.disabled = false;
            sendBtn.textContent = "Send";

        }

    }

}


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

    let visible = 0;

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

let recognition = null;

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
                    micBtn.textContent = "🔴";
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
                micBtn.textContent = "🎤";
            }

        };

    recognition.onend =
        () => {

            if (micBtn) {
                micBtn.textContent = "🎤";
            }

        };

    recognition.onerror =
        (error) => {

            console.log(
                "Voice error:",
                error
            );

            if (micBtn) {
                micBtn.textContent = "🎤";
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
            "🗑️ Delete system loaded."
        );

        console.log(
            "👑 Admin system loaded."
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
