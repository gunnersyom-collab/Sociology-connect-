
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
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

/* ---------------- FIREBASE ---------------- */

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "sociologyconnect.firebaseapp.com",
  projectId: "sociologyconnect",
  storageBucket: "sociologyconnect.firebasestorage.app",
  messagingSenderId: "500228908679",
  appId: "1:500228908679:web:ebc9c7cd6bf7c38aa13a22",
  measurementId: "G-BM74QJ4XTZ"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------- SIGNUP ---------------- */

window.signup = async () => {

  try{

    const userCred =
      await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );

    await setDoc(doc(db,"users",userCred.user.uid),{

      email:userCred.user.email,
      bio:"",
      year:"",
      photo:""

    });

    alert("Account created!");

    location.href="index.html";

  }catch(e){

    alert(e.message);

  }

};

/* ---------------- LOGIN ---------------- */

window.login = async () => {

  try{

    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    location.href="index.html";

  }catch(e){

    alert(e.message);

  }

};

/* ---------------- LOGOUT ---------------- */

window.logout = ()=>{

  signOut(auth);

};

/* ---------------- AUTH STATE ---------------- */

onAuthStateChanged(auth,async user=>{

  const info=document.getElementById("userInfo");
  const login=document.getElementById("loginLink");
  const logout=document.getElementById("logoutBtn");

  if(info){

    if(user){

      info.textContent=user.email;
      info.style.display="inline";
      login.style.display="none";
      logout.style.display="inline-block";

      const profile=await getDoc(doc(db,"users",user.uid));

      if(profile.exists()){

        const data=profile.data();

        const bio=document.getElementById("profileBio");
        const year=document.getElementById("profileYear");

        if(bio)bio.value=data.bio||"";
        if(year)year.value=data.year||"";

      }

    }else{

      info.style.display="none";
      login.style.display="inline";
      logout.style.display="none";

    }

  }

});

/* ---------------- SAVE PROFILE ---------------- */

window.saveProfile=async()=>{

  const user=auth.currentUser;

  if(!user)return;

  await setDoc(doc(db,"users",user.uid),{

    email:user.email,
    bio:document.getElementById("profileBio").value,
    year:document.getElementById("profileYear").value

  },{merge:true});

  alert("Profile saved.");

};

/* ---------------- CREATE POST ---------------- */

window.createPost=async()=>{

  const user=auth.currentUser;

  if(!user){

    alert("Login first.");
    return;

  }

  const text=document.getElementById("postText").value.trim();

  if(!text)return;

  await addDoc(collection(db,"posts"),{

    content:text,
    userEmail:user.email,
    createdAt:serverTimestamp(),
    likes:[],
    comments:[]

  });

  document.getElementById("postText").value="";

};

/* ---------------- LIKE ---------------- */

window.likePost=async(id)=>{

  const user=auth.currentUser;

  if(!user){

    alert("Login first.");
    return;

  }

  const ref=doc(db,"posts",id);

  const snap=await getDoc(ref);

  const likes=snap.data().likes||[];

  if(likes.includes(user.email)){

    await updateDoc(ref,{
      likes:arrayRemove(user.email)
    });

  }else{

    await updateDoc(ref,{
      likes:arrayUnion(user.email)
    });

  }

};

/* ---------------- COMMENT ---------------- */

window.addComment=async(id)=>{

  const user=auth.currentUser;

  if(!user){

    alert("Login first.");
    return;

  }

  const input=document.getElementById("commentInput-"+id);

  if(!input.value.trim())return;

  await updateDoc(doc(db,"posts",id),{

    comments:arrayUnion({

      userEmail:user.email,
      text:input.value,
      time:new Date().toISOString()

    })

  });

  input.value="";

};

/* ---------------- SHARE ---------------- */

window.sharePost=async(id)=>{

  if(navigator.share){

    await navigator.share({

      title:"Sociology Connect",
      text:"Check this post.",
      url:location.href

    });

  }

};

/* ---------------- REAL TIME FEED ---------------- */

document.addEventListener("DOMContentLoaded",()=>{

  const box=document.getElementById("postsContainer");

  if(!box)return;

  onSnapshot(

    query(collection(db,"posts"),orderBy("createdAt","desc")),

    snap=>{

      box.innerHTML="";

      const posts=[];

      snap.forEach(d=>{

        posts.push({
          id:d.id,
          ...d.data()
        });

      });

      posts.forEach(post=>{

        const likes=post.likes?post.likes.length:0;

        let comments="";

        (post.comments||[]).forEach(c=>{

          comments+=`
            <div style="background:#f1f3f5;padding:6px;margin:4px 0;border-radius:6px;">
              <b>${c.userEmail}</b><br>${c.text}
            </div>
          `;

        });

        box.innerHTML+=`

          <div style="background:white;padding:15px;margin:15px 0;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,.08);">

            <small><b>${post.userEmail}</b></small>

            <p style="margin:10px 0;">${post.content}</p>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">

              <button onclick="likePost('${post.id}')">
                ❤️ ${likes}
              </button>

              <button onclick="sharePost('${post.id}')">
                📤 Share
              </button>

            </div>

            <div style="margin-top:10px;">

              ${comments}

              <div style="display:flex;gap:6px;">

                <input id="commentInput-${post.id}" placeholder="Comment...">

                <button onclick="addComment('${post.id}')">
                  Send
                </button>

              </div>

            </div>

          </div>

        `;

      });

      updateTrending(posts);

    }

  );

});

/* ---------------- TRENDING ---------------- */

function updateTrending(posts){

  const t=document.getElementById("trending");

  if(!t)return;

  t.innerHTML="<h2>🔥 Trending Posts</h2>";

  posts
    .sort((a,b)=>(b.likes?.length||0)-(a.likes?.length||0))
    .slice(0,3)
    .forEach(p=>{

      t.innerHTML+=`
        <div class="card">
          ❤️ ${p.likes?.length||0} — ${p.content}
        </div>
      `;

    });

}

/* ---------------- ADMIN ---------------- */

window.isAdmin=()=>{

  return auth.currentUser?.email==="admin@sociologyconnect.com";

};

