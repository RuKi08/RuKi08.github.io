// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQwmJ0AOkYx211nlisDiU2L8tYrkPrIOw",
  authDomain: "ctrlcat-db.firebaseapp.com",
  projectId: "ctrlcat-db",
  storageBucket: "ctrlcat-db.firebasestorage.app",
  messagingSenderId: "321426608354",
  appId: "1:321426608354:web:1284f0703ae0cbaea0cebb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the db instance to be used in other modules
export { db };
