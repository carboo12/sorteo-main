
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getAppInstance() {
    if (!getApps().length) {
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "tu_api_key") {
            console.error("Firebase API Key is missing. Please check your .env file.");
            // We return a dummy object here to avoid crashing the app immediately,
            // allowing the developer to see the console error.
            return new Proxy({}, { get: () => { throw new Error("Firebase not initialized due to missing API Key.")}});
        }
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

export function getAuth() {
    return getFirebaseAuth(getAppInstance());
}

export function getFirestore() {
    return getFirebaseFirestore(getAppInstance());
}
