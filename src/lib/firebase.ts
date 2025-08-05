'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';

// =================================================================================
// ¡ACCIÓN REQUERIDA!
// Rellena estas variables con las credenciales de tu proyecto de Firebase.
// Puedes encontrarlas en la configuración de tu proyecto en la consola de Firebase.
// (Project Settings -> General -> Your apps -> Firebase SDK snippet -> Config)
// =================================================================================
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_AUTH_DOMAIN_AQUI",
  projectId: "TU_PROJECT_ID_AQUI",
  storageBucket: "TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
  appId: "TU_APP_ID_AQUI",
};

// Asegúrate de que todas las claves tengan un valor antes de inicializar.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY_AQUI") {
    console.error("Error de configuración de Firebase: La API Key no está definida. Por favor, edita `src/lib/firebase.ts` y añade tus credenciales.");
}

function getAppInstance() {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

const app = getAppInstance();
const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
