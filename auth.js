/* =========================================================
   SOCIOLOGY CONNECT - AUTH.JS
   Firebase Authentication + Profile + Posts
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG (SIRREEFFAME)
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBiwF8jW-hCDLmtbpAD6t99afAhcldGQfw",
  authDomain: "sociologyconnect.firebaseapp.com",
  projectId: "sociologyconnect",
  storageBucket: "sociologyconnect.firebasestorage.app",
  messagingSenderId: "500228908679",
  appId: "1:500228908679:web:ebc9c7cd6bf7c38aa13a22",
  measurementId: "G-BM74QJ4XTZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------- HELPER ---------------- */

const $ = (id) => document.getElementById(id);

function escapeHTML(str=""){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

/* ---------------- ERROR ---------------- */

function firebaseError(error){

  switch(error.code){

    case "auth/email-already-in-use":
      return "Email already exists.";

    case "auth/invalid-email":
      return "Invalid email.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/user-not-found":
      return "Account not found.";

    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/api-key-not-valid":
      return "Firebase API key is invalid.";

    default:
      return error.message;
  }
}

/* ---------------- SIGNUP ---------------- */

window.signup = async ()=>{

  try{

    const fullName=$("fullName")?.value.trim()||"";
    const year=$("year")?.value||"";
    const bio=$("bio")?.value.trim()||"";
    const email=$("email")?.value.trim();
    const password=$("password")?.value;

    const cred=await createUserWithEmailAndPassword(auth,email,password);

    if(fullName){
      await updateProfile(cred.user,{displayName:fullName});
    }

    await setDoc(doc(db,"users",cred.user.uid),{
      uid:cred.user.uid,
      email:cred.user.email,
      fullName,
      year,
      bio,
      photo:"",
      createdAt:serverTimestamp()
    });

    alert("Account created successfully!");
    location.href="index.html";

  }catch(e){
    alert(firebaseError(e));
  }

};

/* ---------------- LOGIN ---------------- */

window.login = async ()=>{

  try{

    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );

    location.href="index.html";

  }catch(e){

    alert(firebaseError(e));

  }

};

/* ---------------- LOGOUT ---------------- */

window.logout = async ()=>{

  await signOut(auth);
  location.href="index.html";

};

/* ---------------- PROFILE ---------------- */

async function loadProfile(user){

  if(!user){

    $("loginMessage")&&( $("loginMessage").style.display="block");
    $("profileCard")&&( $("profileCard").style.display="none");
    return;

  }

  $("loginMessage")&&( $("loginMessage").style.display="none");
  $("profileCard")&&( $("profileCard").style.display="block");

  const snap=await getDoc(doc(db,"users",user.uid));

  const d=snap.exists()?snap.data():{};

  $("profileName")&&($("profileName").textContent=d.fullName||user.displayName||"Student");
  $("profileEmail")&&($("profileEmail").textContent=user.email);
  $("profileYear")&&($("profileYear").textContent=d.year||"Not added");
  $("profileBio")&&($("profileBio").textContent=d.bio||"No bio added yet");

  if($("profilePhoto")){
    $("profilePhoto").src=d.photo||"https://via.placeholder.com/120";
  }

  $("fullName")&&($("fullName").value=d.fullName||user.displayName||"");
  $("year")&&($("year").value=d.year||"");
  $("bio")&&($("bio").value=d.bio||"");
  $("photo")&&($("photo").value=d.photo||"");
}

/* ---------------- AUTH STATE ---------------- */

onAuthStateChanged(auth,async user=>{

  if($("userInfo")){

    if(user){

      $("userInfo").textContent=user.displayName||user.email;
      $("userInfo").style.display="inline";
      $("loginLink")&&($("loginLink").style.display="none");
      $("logoutBtn")&&($("logoutBtn").style.display="inline-block");

    }else{

      $("userInfo").style.display="none";
      $("loginLink")&&($("loginLink").style.display="inline");
      $("logoutBtn")&&($("logoutBtn").style.display="none");

    }

  }

  await loadProfile(user);

});

/* ---------------- SAVE PROFILE ---------------- */

window.saveProfile = async ()=>{

  const user=auth.currentUser;

  if(!user){
    alert("Login first.");
    return;
  }

  const fullName=$("fullName").value.trim();
  const year=$("year").value;
  const bio=$("bio").value.trim();
  const photo=$("photo").value.trim();

  await updateProfile(user,{
    displayName:fullName,
    photoURL:photo
  });

  await setDoc(doc(db,"users",user.uid),{
    fullName,
    year,
    bio,
    photo
  },{merge:true});

  await loadProfile(user);

  alert("Profile saved.");

};

/* ---------------- CREATE POST ---------------- */

window.createPost = async ()=>{

  const user=auth.currentUser;

  if(!user){
    alert("Login first.");
    return;
  }

  const content=$("postText").value.trim();

  if(!content)return;

  await addDoc(collection(db,"posts"),{

    userId:user.uid,
    userEmail:user.email,
    userName:user.displayName||user.email,
    content,
    createdAt:serverTimestamp(),
    likes:[],
    comments:[]

  });

  $("postText").value="";

};

/* ---------------- LIKE ---------------- */

window.likePost = async(id)=>{

  const user=auth.currentUser;

  if(!user){
    alert("Login first.");
    return;
  }

  const ref=doc(db,"posts",id);
  const snap=await getDoc(ref);

  const likes=snap.data().likes||[];

  await updateDoc(ref,{
    likes:likes.includes(user.email)
      ?arrayRemove(user.email)
      :arrayUnion(user.email)
  });

};

/* ---------------- COMMENT ---------------- */

window.addComment = async(id)=>{

  const user=auth.currentUser;

  if(!user){
    alert("Login first.");
    return;
  }

  const input=$("commentInput-"+id);

  if(!input.value.trim())return;

  await updateDoc(doc(db,"posts",id),{

    comments:arrayUnion({
      userEmail:user.email,
      text:input.value.trim(),
      time:new Date().toISOString()
    })

  });

  input.value="";

};

/* ---------------- SHARE ---------------- */
window.sharePost = async (id) => {

  const postUrl = `${location.origin}${location.pathname}?post=${id}`;

  try {

    if (navigator.share && navigator.canShare) {

      await navigator.share({
        title: "Sociology Connect",
        text: "Check out this post on Sociology Connect!",
        url: postUrl
      });

    } else if (navigator.share) {

      await navigator.share({
        title: "Sociology Connect",
        text: "Check out this post on Sociology Connect!",
        url: postUrl
      });

    } else {

      await navigator.clipboard.writeText(postUrl);

      alert("Share is not supported on this browser. Link copied.");

    }

  } catch (err) {

    console.log("Share cancelled.");

  }

};

};

/* ---------------- REALTIME POSTS ---------------- */

document.addEventListener("DOMContentLoaded",()=>{

  const box=$("postsContainer");

  if(!box)return;

  onSnapshot(
    query(collection(db,"posts"),orderBy("createdAt","desc")),
    snap=>{

      box.innerHTML="";
      const posts=[];

      snap.forEach(d=>posts.push({id:d.id,...d.data()}));

      if(posts.length===0){

        box.innerHTML=`
        <div class="card">
          No posts yet.
        </div>`;

      }

      posts.forEach(post=>{

        let commentsHTML="";

        (post.comments||[]).forEach(c=>{

          commentsHTML+=`
          <div style="background:#f1f3f5;padding:8px;border-radius:8px;margin:5px 0;">
            <b>${escapeHTML(c.userEmail)}</b><br>
            ${escapeHTML(c.text)}
          </div>`;

        });

        box.innerHTML+=`
        <div style="background:white;padding:16px;border-radius:14px;margin:15px 0;box-shadow:0 3px 10px rgba(0,0,0,.08);">

          <b>${escapeHTML(post.userName||post.userEmail)}</b><br>
          <small>${escapeHTML(post.userEmail)}</small>

          <p style="margin:12px 0;white-space:pre-wrap;">
            ${escapeHTML(post.content)}
          </p>

          <button onclick="likePost('${post.id}')">
            ❤️ ${post.likes?.length||0}
          </button>

          <button onclick="sharePost('${post.id}')">
            📤 Share
          </button>

          <div style="margin-top:10px;">
            ${commentsHTML}
            <input id="commentInput-${post.id}" placeholder="Comment...">
            <button onclick="addComment('${post.id}')">Send</button>
          </div>

        </div>`;

      });

      updateTrending(posts);

    }
  );

});

/* ---------------- TRENDING ---------------- */

function updateTrending(posts){

  const t=$("trending");

  if(!t)return;

  t.innerHTML="<h2>🔥 Trending Posts</h2>";

  [...posts]
  .sort((a,b)=>(b.likes?.length||0)-(a.likes?.length||0))
  .slice(0,3)
  .forEach(p=>{

    t.innerHTML+=`
    <div class="card">
      ❤️ ${p.likes?.length||0}
      — ${escapeHTML(p.content)}
    </div>`;

  });

}

/* ---------------- ADMIN ---------------- */

window.isAdmin=()=>auth.currentUser?.email==="admin@sociologyconnect.com";

console.log("✅ Sociology Connect Firebase loaded.");
