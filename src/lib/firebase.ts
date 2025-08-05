
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

let app;

// Verifica si la configuración está completa antes de inicializar.
if (firebaseConfig.apiKey) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
} else {
    console.error("Error de configuración de Firebase: Las variables de entorno no están cargadas. Asegúrate de que tu archivo .env.local esté configurado.");
    app = new Proxy({}, {
        get: (target, prop) => {
            if (prop === '_isInitialized') return false;
            throw new Error("Firebase no está inicializado. Revisa la configuración de tus variables de entorno.");
        }
    }) as any;
}

const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
