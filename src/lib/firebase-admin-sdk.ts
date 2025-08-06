
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
  
  // Lee las credenciales de la variable de entorno
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.warn('La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida. El SDK de Admin no se inicializará.');
    return null;
  }

  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountString);

    // Corrección programática de la clave privada
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Este bloque se ejecuta si el JSON es inválido o si la inicialización falla
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON o al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. La causa más común es un error de formato en la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON. ` +
      `Asegúrate de que el valor sea un JSON válido. ` +
      `Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
const app = initializeFirebaseAdmin();

// Exporta las instancias del SDK de Admin de forma segura.
// Si la inicialización falla, estas serán `null`.
export const adminFirestore = app ? admin.firestore() : null;
export const adminAuth = app ? admin.auth() : null;
export { admin };
