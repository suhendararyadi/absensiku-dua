// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check if we're in build/server environment
const isBuildTime = typeof window === 'undefined' && !process.env.NEXT_RUNTIME;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDjhjUzY71OGrRbtLg08ZiyTuyz7c3lXuM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "attendnow-g1s9e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "attendnow-g1s9e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "attendnow-g1s9e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "111784377349",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:111784377349:web:8c34a8263e1c9f8486f06c",
};

// Initialize Firebase only if not in build time
let app: any = null;
let auth: any = null;
let db: any = null;

if (!isBuildTime) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Provide fallback null values
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };