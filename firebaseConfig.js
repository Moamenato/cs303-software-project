import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAKMADiPYZr8QS1ua0BQR_rrz7ZSLQ_TM",
  authDomain: "epichardware-d1a40.firebaseapp.com",
  projectId: "epichardware-d1a40",
  storageBucket: "epichardware-d1a40.firebasestorage.app",
  messagingSenderId: "288909581545",
  appId: "1:288909581545:web:2df0aecf386dbf56832478",
  measurementId: "G-Y4TLDZF9GC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, query, where };
