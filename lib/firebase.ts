// src/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyA2shV9ggbBPNd60Jp0j90BQavGn99h41Y",
  authDomain: "flea-pos.firebaseapp.com",
  projectId: "flea-pos",
  storageBucket: "flea-pos.firebasestorage.app",
  messagingSenderId: "31324014848",
  appId: "1:31324014848:web:7fb7ac9879114dbe8acbe5"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)