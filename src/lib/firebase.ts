
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config'; // Import the config directly

let app;

// This check is crucial to prevent errors.
if (
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    firebaseConfig.apiKey !== "YOUR_API_KEY"
) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
} else {
    console.error("Firebase configuration is missing or incomplete in src/lib/firebase-config.ts. Please update it with your project credentials.");
    // Create a proxy to avoid crashes but show errors if used.
    app = new Proxy({}, {
        get: (target, prop) => {
            if (prop === '_isInitialized') return false;
            throw new Error("Firebase is not initialized. Check your configuration in src/lib/firebase-config.ts.");
        }
    }) as any;
}

const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
