
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';

// =================================================================================
// Las credenciales de Firebase se cargan desde las variables de entorno
// definidas en el archivo .env.local
// =================================================================================
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,  
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,  
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,  
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,  
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, 
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Asegúrate de que todas las claves tengan un valor antes de inicializar.
if (!firebaseConfig.apiKey) {
    console.error("Error de configuración de Firebase: La API Key no está definida. Por favor, revisa tu archivo .env.local");
}

function getAppInstance() {
    if (!getApps().length) {
        // Solo inicializa si las credenciales están presentes
        if (firebaseConfig.apiKey) {
            return initializeApp(firebaseConfig);
        }
        // Si no hay API key, lanzamos un error para evitar que la app se rompa en otro lado.
        throw new Error("No se puede inicializar Firebase: faltan credenciales del cliente.");
    }
    return getApp();
}

const app = getAppInstance();
const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
