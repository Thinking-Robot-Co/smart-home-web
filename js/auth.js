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

// Your Firebase config
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign Up Function
window.signUp = function () {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Account created successfully! 🎉");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("Signup error: " + error.message);
    });
};

// Login Function with "Remember Me"
window.login = function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;
  
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
