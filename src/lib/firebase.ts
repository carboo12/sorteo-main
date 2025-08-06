
'use client';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Comprobación estricta de la configuración del cliente.
if (
    !firebaseConfig ||
    !firebaseConfig.apiKey || 
    !firebaseConfig.projectId ||
    // Una comprobación simple para asegurar que no son los valores de ejemplo
    !firebaseConfig.apiKey.startsWith('AIzaSy')
) {
    // Este error solo se mostrará en el entorno de desarrollo y no detendrá la compilación,
    // pero es una advertencia crucial para el desarrollador.
    console.error("La configuración de Firebase del cliente está incompleta o es incorrecta en src/lib/firebase-config.ts. Por favor, rellena tus credenciales.");
}

let app: FirebaseApp;

// Patrón Singleton para asegurar que Firebase se inicialice solo una vez
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);

// Función para obtener la app de Firebase, asegurando la inicialización
export function getFirebaseApp() {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

export { app, auth, firestore };
