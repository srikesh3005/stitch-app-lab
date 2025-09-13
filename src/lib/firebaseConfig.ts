// src/lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnylZ79D0YJMtIecljnBUItnTr69hxfPA",
  authDomain: "smart-speed-limiter.firebaseapp.com",
  databaseURL: "https://smart-speed-limiter-default-rtdb.firebaseio.com",
  projectId: "smart-speed-limiter",
  storageBucket: "smart-speed-limiter.firebasestorage.app",
  messagingSenderId: "168270278506",
  appId: "1:168270278506:web:f836373daf789f334bff13",
  measurementId: "G-GM323N8WK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { app, database };