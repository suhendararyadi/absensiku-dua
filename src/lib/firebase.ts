// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check if we're in build/server environment
const isBuildTime = typeof window === 'undefined' && !process.env.NEXT_RUNTIME;

// Firebase configuration - ONLY using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all required config values are present (except during build)
const validateConfig = () => {
  if (isBuildTime) return true; // Skip validation during build
  
  const requiredKeys = [
    'apiKey', 'authDomain', 'projectId', 
    'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  for (const key of requiredKeys) {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      console.error(`Missing Firebase config: ${key}`);
      return false;
    }
  }
  return true;
};

// Initialize Firebase only if not in build time and config is valid
let app: any = null;
let auth: any = null;
let db: any = null;

if (!isBuildTime && validateConfig()) {
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