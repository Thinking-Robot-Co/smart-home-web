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

// Replace with your own Firebase config
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

document.addEventListener("DOMContentLoaded", () => {

  // Utility: display message in a target div
  function showMessage(targetId, msg, isError = true) {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;
    // Decide color (red for error, green for success)
    targetEl.style.color = isError ? "#ff4f4f" : "#4caf50";
    targetEl.textContent = msg;
  }

  // Sign Up
  window.signUp = function () {
    const usernameEl = document.getElementById("signupUsername");
    const emailEl = document.getElementById("signupEmail");
    const passwordEl = document.getElementById("signupPassword");
    const msgElId = "signupMessage";

    if (!usernameEl || !emailEl || !passwordEl) {
      showMessage(msgElId, "Signup form not found.", true);
      return;
    }

    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    // Some basic validation
    if (!username) {
      showMessage(msgElId, "Please enter a username.", true);
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Store user details in database
        set(ref(db, "users/" + user.uid + "/profile"), {
          username: username,
          email: email,
          createdAt: Date.now()
        })
        .then(() => {
          // Show success on signup form
          showMessage(msgElId, "Account created successfully! Redirecting...", false);
          // Redirect to dashboard
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          showMessage(msgElId, "Error saving profile: " + error.message, true);
        });
      })
      .catch((error) => {
        showMessage(msgElId, "Signup error: " + error.message, true);
      });
  };

  // Login
  window.login = function () {
    const emailEl = document.getElementById("loginEmail");
    const passwordEl = document.getElementById("loginPassword");
    const rememberEl = document.getElementById("rememberMe");
    const msgElId = "loginMessage";

    if (!emailEl || !passwordEl) {
      showMessage(msgElId, "Login form not found.", true);
      return;
    }

    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const rememberMe = rememberEl ? rememberEl.checked : false;

    // Set local or session persistence
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    setPersistence(auth, persistence)
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      })
      .then((userCredential) => {
        showMessage(msgElId, "Login successful! Redirecting...", false);
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        showMessage(msgElId, "Login error: " + error.message, true);
      });
  };

  // Logout
  window.logout = function () {
    signOut(auth)
      .then(() => {
        // If you want to show a message upon logout, you can do so,
        // but we'll just redirect immediately.
        window.location.href = "login.html";
      })
      .catch((error) => {
        // We might want to show an inline message on the dashboard or use console.error
        console.error("Error during logout:", error);
      });
  };

});
