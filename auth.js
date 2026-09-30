/* =========================================================
   SOCIOLOGY CONNECT 2.0
   AUTH.JS
   ---------------------------------------------------------
   LOGIN
   SIGNUP
   LOGOUT
   PROFILE
   AUTH STATE
   USER DATA
========================================================= */

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   HELPER
========================================================= */

const $ = (id) => document.getElementById(id);

const getValue = (id) => {
  return $(id)?.value?.trim() || "";
};


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getAuthErrorMessage(error) {

  console.error("Firebase Auth Error:", error);

  switch (error?.code) {

    case "auth/email-already-in-use":
      return "This email is already registered. Please login instead.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";

    case "auth/invalid-credential":
      return "Email or password is incorrect.";

    case "auth/user-not-found":
      return "No account was found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "auth/operation-not-allowed":
      return "Email/password authentication is not enabled in Firebase.";

    default:
      return error?.message ||
        "Something went wrong. Please try again.";
  }
}


/* =========================================================
   SIGN UP
========================================================= */

async function signup() {

  const fullName = getValue("fullName");
  const year = $("year")?.value || "";
  const bio = getValue("bio");
  const email = getValue("email").toLowerCase();
  const password = $("password")?.value || "";

  /* ---------- VALIDATION ---------- */

  if (!fullName) {
    alert("Please enter your full name.");
    return;
  }

  if (fullName.length < 2) {
    alert("Please enter a valid full name.");
    return;
  }

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  if (!password) {
    alert("Please enter your password.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }


  try {

    /* ---------- CREATE ACCOUNT ---------- */

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = credential.user;


    /* ---------- FIREBASE AUTH PROFILE ---------- */

    await updateProfile(
      user,
      {
        displayName: fullName
      }
    );


    /* ---------- FIRESTORE USER PROFILE ---------- */

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || email,
        fullName: fullName,
        displayName: fullName,
        year: year,
        bio: bio,
        photoURL: "",
        role: "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );


    console.log(
      "✅ ACCOUNT CREATED:",
      user.email
    );


    alert(
      "Account created successfully! 🎉\n\nWelcome to Sociology Connect."
    );


    window.location.href = "index.html";

  }

  catch (error) {

    alert(
      getAuthErrorMessage(error)
    );

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const email =
    getValue("email").toLowerCase();

  const password =
    $("password")?.value || "";


  /* ---------- VALIDATION ---------- */

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  if (!password) {
    alert("Please enter your password.");
    return;
  }


  try {

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    console.log(
      "✅ LOGIN SUCCESS:",
      credential.user.email
    );


    window.location.href =
      "index.html";

  }

  catch (error) {

    alert(
      getAuthErrorMessage(error)
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await signOut(auth);

    console.log(
      "✅ LOGOUT SUCCESS"
    );


    window.location.href =
      "login.html";

  }

  catch (error) {

    console.error(
      "❌ LOGOUT ERROR:",
      error
    );


    alert(
      getAuthErrorMessage(error)
    );

  }

}


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadProfile(user) {

  if (!user) return;


  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );


    const snapshot =
      await getDoc(userRef);


    let data = {};


    if (snapshot.exists()) {
      data = snapshot.data();
    }


    /* ---------- USER NAME ---------- */

    const name =
      data.fullName ||
      data.displayName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Student";


    /* ---------- HEADER USER ---------- */

    if ($("userInfo")) {

      $("userInfo").textContent =
        "👤 " + name;

    }


    /* ---------- PROFILE PAGE ---------- */

    if ($("profileName")) {

      $("profileName").textContent =
        name;

    }


    if ($("profileEmail")) {

      $("profileEmail").textContent =
        user.email || "";

    }


    if ($("profileYear")) {

      $("profileYear").textContent =
        data.year ||
        "Not added";

    }


    if ($("profileBio")) {

      $("profileBio").textContent =
        data.bio ||
        "No bio yet";

    }


    /* ---------- PROFILE PHOTO ---------- */

    if ($("profilePhoto")) {

      if (data.photoURL) {

        $("profilePhoto").src =
          data.photoURL;

      }

      else {

        $("profilePhoto").src =
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(name) +
          "&background=007bff&color=fff";

      }

    }


    /* ---------- USER ROLE ---------- */

    if ($("userRole")) {

      $("userRole").textContent =
        data.role ||
        "Student";

    }


    return data;

  }

  catch (error) {

    console.error(
      "❌ PROFILE LOAD ERROR:",
      error
    );

  }

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    console.log(
      "🔐 AUTH STATE:",
      user
        ? user.email
        : "Not logged in"
    );


    if (user) {

      /* ---------- LOGIN LINK ---------- */

      if ($("loginLink")) {

        $("loginLink").style.display =
          "none";

      }


      /* ---------- LOGOUT BUTTON ---------- */

      if ($("logoutBtn")) {

        $("logoutBtn").style.display =
          "inline-block";

      }


      /* ---------- USER PROFILE ---------- */

      await loadProfile(user);


      /* ---------- USER INFO ---------- */

      if ($("userInfo")) {

        const name =
          user.displayName ||
          user.email?.split("@")[0] ||
          "Student";

        $("userInfo").textContent =
          "👤 " + name;

      }

    }

    else {

      /* ---------- LOGIN LINK ---------- */

      if ($("loginLink")) {

        $("loginLink").style.display =
          "inline-block";

      }


      /* ---------- LOGOUT BUTTON ---------- */

      if ($("logoutBtn")) {

        $("logoutBtn").style.display =
          "none";

      }


      /* ---------- CLEAR USER INFO ---------- */

      if ($("userInfo")) {

        $("userInfo").textContent =
          "";

      }

    }

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.login =
  login;

window.signup =
  signup;

window.logout =
  logout;

window.loadProfile =
  loadProfile;


/* =========================================================
   READY
========================================================= */

console.log(
  "✅ SOCIOLOGY CONNECT AUTH.JS READY"
);
