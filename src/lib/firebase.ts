
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';

// =================================================================================
// 🔥 ¡ACCIÓN REQUERIDA! 🔥
// Rellena estas credenciales con los valores de tu proyecto de Firebase.
// Puedes encontrarlas en la consola de Firebase:
// Project Settings > General > Your apps > SDK setup and configuration
// =================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCOSWahgg7ldlIj1kTaYJy6jFnwmVThwUE",
    authDomain: "multishop-manager-3x6vw.firebaseapp.com",  
    projectId: "multishop-manager-3x6vw",  
    storageBucket: "multishop-manager-3x6vw.firebasestorage.app",
      messagingSenderId: "900084459529",  
    appId: "1:900084459529:web:bada387e4da3d34007b0d8",  
    measurementId: "G-CJLSPD4XY4"  
};

// =================================================================================
// Código de inicialización
// =================================================================================

let app;

// Verifica si la configuración está completa antes de inicializar.
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
    // Si la app no está inicializada, la inicializamos.
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        // Si ya está inicializada, la obtenemos.
        app = getApp();
    }
} else {
    // Si la configuración está incompleta, lanzamos un error claro para el desarrollador.
    console.error("Error de configuración de Firebase: Por favor, edita `src/lib/firebase.ts` y añade tus credenciales.");
    // Creamos un objeto proxy para evitar que la app crashee en el servidor,
    // pero que falle en el cliente para que el error sea visible.
    app = new Proxy({}, { 
        get: (target, prop) => {
            if (prop === '_isInitialized') return false;
            throw new Error("Firebase no está inicializado. Revisa las credenciales en `src/lib/firebase.ts`.");
        }
    }) as any;
}


const auth = getFirebaseAuth(app);
const firestore = getFirebaseFirestore(app);

export { app, auth, firestore };
