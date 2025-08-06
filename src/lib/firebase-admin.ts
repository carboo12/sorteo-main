
'use server';

import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Esta función se invoca una sola vez en el ámbito del módulo,
// asegurando que la inicialización ocurra solo cuando se carga este archivo.
function initializeFirebaseAdmin() {
  // Evita la reinicialización en entornos de hot-reload
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Las credenciales deben estar en una única variable de entorno con el JSON completo.
  // Este es el método más robusto para entornos de despliegue como Vercel/Next.js.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    const errorMessage = 'La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Este es el método preferido para las credenciales del servidor.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    // Parseamos el JSON desde la variable de entorno.
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    // Inicializamos la app de Admin con las credenciales parseadas.
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Este bloque se ejecuta si el JSON es inválido o si la inicialización falla (ej. clave privada malformada)
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON o al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. La causa más común es un error de formato en la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON. ` +
      `Asegúrate de que el valor sea un JSON válido y que los saltos de línea en la private_key ('\\n') estén correctamente escapados. ` +
      `Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
const app = initializeFirebaseAdmin();
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
