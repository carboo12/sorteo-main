
'use client';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config'; // Import the config directly

let app: FirebaseApp;

if (
    !firebaseConfig ||
    !firebaseConfig.apiKey || 
    !firebaseConfig.projectId || 
    !firebaseConfig.apiKey.includes('AIzaSy')
) {
    throw new Error("Firebase configuration is missing or incomplete in src/lib/firebase-config.ts. Please copy firebase-config.example.ts to firebase-config.ts and fill in your project credentials.");
}

// Singleton pattern to ensure Firebase is initialized only once
export function getFirebaseApp() {
    if (!app) {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
    }
    return app;
}

const auth = getFirebaseAuth(getFirebaseApp());
const firestore = getFirebaseFirestore(getFirebaseApp());

export { app, auth, firestore };
