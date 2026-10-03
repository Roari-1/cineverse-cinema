import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Replace these values with the Web App configuration from your Firebase Console.
export const firebaseConfig = {
  apiKey: "AIzaSyAnTic96CH-DJc95RzWSU4FKyF6jJVaofk",
  authDomain: "cinema-ticketing-system-7683e.firebaseapp.com",
  projectId: "cinema-ticketing-system-7683e",
  storageBucket: "cinema-ticketing-system-7683e.firebasestorage.app",
  messagingSenderId: "538742937134",
  appId: "1:538742937134:web:0bdee2a2cbe3c38715f1bf"
};

export const firebaseConfigured = !Object.values(firebaseConfig).some(v => String(v).includes('YOUR_'));
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
