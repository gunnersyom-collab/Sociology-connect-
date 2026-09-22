
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

import { 
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Hojii Logout (Ba'uu)
window.logout = () => {
  signOut(auth).then(() => {
    location.reload();
  }).catch(error => {
    alert(error.message);
  });
};

// Haala User-ichaa hordofuu (Yeroo seene Imeelii agarsiisuu)
onAuthStateChanged(auth, (user) => {
  const info = document.getElementById("userInfo");
  const login = document.getElementById("loginLink");
  const logout = document.getElementById("logoutBtn");

  if (info && login && logout) {
    if (user) {
      info.style.display = "inline";
      info.textContent = user.email; // Imeelii userichaa asitti mul'isa
      login.style.display = "none";
      logout.style.display = "inline-block";
      logout.onclick = window.logout;
    } else {
      info.style.display = "none";
      login.style.display = "inline";
      logout.style.display = "none";
    }
  }
});
