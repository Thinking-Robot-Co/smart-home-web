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

document.addEventListener("DOMContentLoaded", () => {

  // Sign Up Function (stores username and email)
  window.signUp = function () {
    const usernameEl = document.getElementById("signupUsername");
    const emailEl = document.getElementById("signupEmail");
    const passwordEl = document.getElementById("signupPassword");
    const messageDiv = document.getElementById("signupMessage");
    
    if (!usernameEl || !emailEl || !passwordEl) {
      messageDiv.textContent = "Signup form is not properly loaded.";
      return;
    }
    
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    
    // Clear message area
    messageDiv.textContent = "";
    
    if (!username) {
      messageDiv.textContent = "Please enter a username.";
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
          // Redirect to dashboard on success
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          messageDiv.textContent = "Error saving profile: " + error.message;
        });
      })
      .catch((error) => {
        messageDiv.textContent = "Signup error: " + error.message;
      });
  };

  // Login Function with "Remember Me"
  window.login = function () {
    const emailEl = document.getElementById("loginEmail");
    const passwordEl = document.getElementById("loginPassword");
    const rememberEl = document.getElementById("rememberMe");
    const messageDiv = document.getElementById("loginMessage");
    
    if (!emailEl || !passwordEl) {
      messageDiv.textContent = "Login form is not properly loaded.";
      return;
    }
    
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const rememberMe = rememberEl ? rememberEl.checked : false;
    
    // Clear previous message
    messageDiv.textContent = "";
    
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    setPersistence(auth, persistence)
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      })
      .then((userCredential) => {
        // Redirect on successful login
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        messageDiv.textContent = "Login error: " + error.message;
      });
  };

  // Logout Function
  window.logout = function () {
    signOut(auth)
      .then(() => {
        window.location.href = "login.html";
      })
      .catch((error) => {
        // Optionally, you can display the error on dashboard (or use alert)
        console.error("Error during logout:", error);
      });
  };

});
