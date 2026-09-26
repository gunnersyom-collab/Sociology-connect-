/* =========================================================
   SOCIOLOGY CONNECT 2.0
   AUTH.JS
   LOGIN
   SIGNUP
   LOGOUT
   PROFILE
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


/* ================= HELPER ================= */

const $ = (id) => document.getElementById(id);


/* ================= SIGN UP ================= */

async function signup() {

  try {

    const fullName =
      $("fullName")?.value.trim() || "";

    const year =
      $("year")?.value || "";

    const bio =
      $("bio")?.value.trim() || "";

    const email =
      $("email")?.value.trim() || "";

    const password =
      $("password")?.value || "";


    if (!fullName) {
      alert("Please enter your full name.");
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


    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    /* UPDATE FIREBASE PROFILE */

    await updateProfile(
      credential.user,
      {
        displayName: fullName
      }
    );


    /* SAVE USER DATA */

    await setDoc(
      doc(
        db,
        "users",
        credential.user.uid
      ),
      {
        uid: credential.user.uid,
        email: credential.user.email,
        fullName: fullName,
        year: year,
        bio: bio,
        createdAt: serverTimestamp()
      }
    );


    alert(
      "Account created successfully! 🎉"
    );


    window.location.href = "index.html";


  } catch (error) {

    console.error(
      "❌ SIGNUP ERROR:",
      error
    );


    let message =
      error.message;


    if (
      error.code ===
      "auth/email-already-in-use"
    ) {

      message =
        "This email is already registered.";

    }

    else if (
      error.code ===
      "auth/invalid-email"
    ) {

      message =
        "Please enter a valid email.";

    }

    else if (
      error.code ===
      "auth/weak-password"
    ) {

      message =
        "Password is too weak. Use at least 6 characters.";

    }


    alert(message);

  }

}


/* ================= LOGIN ================= */

async function login() {

  try {

    const email =
      $("email")?.value.trim() || "";

    const password =
      $("password")?.value || "";


    if (!email) {

      alert(
        "Please enter your email."
      );

      return;

    }


    if (!password) {

      alert(
        "Please enter your password."
      );

      return;

    }


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


  } catch (error) {

    console.error(
      "❌ LOGIN ERROR:",
      error
    );


    let message =
      error.message;


    if (
      error.code ===
      "auth/invalid-credential"
    ) {

      message =
        "Email or password is incorrect.";

    }

    else if (
      error.code ===
      "auth/user-not-found"
    ) {

      message =
        "No account found with this email.";

    }

    else if (
      error.code ===
      "auth/wrong-password"
    ) {

      message =
        "Incorrect password.";

    }

    else if (
      error.code ===
      "auth/invalid-email"
    ) {

      message =
        "Please enter a valid email.";

    }


    alert(message);

  }

}


/* ================= LOGOUT ================= */

async function logout() {

  try {

    await signOut(auth);

    console.log(
      "✅ LOGOUT SUCCESS"
    );


    window.location.href =
      "login.html";


  } catch (error) {

    console.error(
      "❌ LOGOUT ERROR:",
      error
    );


    alert(
      error.message
    );

  }

}


/* ================= PROFILE ================= */

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


    const data =
      snapshot.exists()
        ? snapshot.data()
        : {};


    const name =
      data.fullName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Student";


    if ($("userInfo")) {

      $("userInfo").textContent =
        "👤 " + name;

    }


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


  } catch (error) {

    console.error(
      "❌ PROFILE ERROR:",
      error
    );

  }

}


/* ================= AUTH STATE ================= */

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

      if ($("loginLink")) {

        $("loginLink").style.display =
          "none";

      }


      if ($("logoutBtn")) {

        $("logoutBtn").style.display =
          "inline-block";

      }


      await loadProfile(user);


    } else {

      if ($("loginLink")) {

        $("loginLink").style.display =
          "inline-block";

      }


      if ($("logoutBtn")) {

        $("logoutBtn").style.display =
          "none";

      }

    }

  }
);


/* ================= GLOBAL BUTTONS ================= */

window.login =
  login;

window.signup =
  signup;

window.logout =
  logout;


/* ================= READY ================= */

console.log(
  "✅ AUTH.JS READY"
);
