
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config'; // Import the config directly

let app;

// This check is crucial to prevent errors.
if (
    !firebaseConfig ||
    !firebaseConfig.apiKey || 
    !firebaseConfig.projectId || 
    firebaseConfig.apiKey.startsWith("AIzaSy") === false // A simple check for a valid-looking API key
) {
    throw new Error("Firebase configuration is missing or incomplete in src/lib/firebase-config.ts. Please copy firebase-config.example.ts to firebase-config.ts and fill in your project credentials.");
}

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
