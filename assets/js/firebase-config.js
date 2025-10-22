// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_rWUBwq7NzMM-pNahNRRg5Urq8IY0BBA",
    authDomain: "my-website-fb323.firebaseapp.com",
    projectId: "my-website-fb323",
    storageBucket: "my-website-fb323.firebasestorage.app",
    messagingSenderId: "740018728175",
    appId: "1:740018728175:web:ea0b67e6a8080b80c87f1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the db instance to be used in other modules
export { db };
