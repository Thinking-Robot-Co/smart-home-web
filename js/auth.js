// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  signOut,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaGAZ-7Uk3xe1TyilhwQmEb1wuFkqZoVg",
  authDomain: "smarthomeproject-f5e4a.firebaseapp.com",
  databaseURL: "https://smarthomeproject-f5e4a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smarthomeproject-f5e4a",
  storageBucket: "smarthomeproject-f5e4a.firebasestorage.app",
  messagingSenderId: "719061684221",
  appId: "1:719061684221:web:087dbbc3d78704efba9394",
  measurementId: "G-2VWTQ74QPS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Ensure DOM is ready before attaching functions.
document.addEventListener("DOMContentLoaded", () => {

  // Sign Up Function (stores username and email in the database)
  window.signUp = function () {
    const usernameEl = document.getElementById("signupUsername");
    const emailEl = document.getElementById("signupEmail");
    const passwordEl = document.getElementById("signupPassword");
    
    if (!usernameEl || !emailEl || !passwordEl) {
      alert("Signup form is not properly loaded.");
      return;
    }
    
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    
    if (!username) {
      alert("Please enter a username.");
      return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Save additional user profile info in the database
        set(ref(db, "users/" + user.uid + "/profile"), {
          username: username,
          email: email,
          createdAt: Date.now()
        })
        .then(() => {
          alert("Account created successfully! 🎉");
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          alert("Error saving profile: " + error.message);
        });
      })
      .catch((error) => {
        alert("Signup error: " + error.message);
      });
  };

  // Login Function with "Remember Me" feature
  window.login = function () {
    const emailEl = document.getElementById("loginEmail");
    const passwordEl = document.getElementById("loginPassword");
    const rememberEl = document.getElementById("rememberMe");
    
    if (!emailEl || !passwordEl) {
      alert("Login form is not properly loaded.");
      return;
    }
    
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const rememberMe = rememberEl ? rememberEl.checked : false;
    
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    setPersistence(auth, persistence)
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      })
      .then((userCredential) => {
        alert("Login successful ✅");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("Login error: " + error.message);
      });
  };

  // Logout Function
  window.logout = function () {
    signOut(auth)
      .then(() => {
        alert("Logged out successfully!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        alert("Error during logout: " + error.message);
      });
  };

});
