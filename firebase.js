import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
