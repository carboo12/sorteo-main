
'use server';

import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../service-account.json';

// Esta función se invoca una sola vez en el ámbito del módulo,
// asegurando que la inicialización ocurra solo cuando se carga este archivo.
function initializeFirebaseAdmin() {
  // Evita la reinicialización en entornos de hot-reload
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Comprobación de seguridad para asegurar que no se están usando las credenciales de ejemplo
  if (!serviceAccountCredentials || serviceAccountCredentials.project_id === 'DEPRECATED - Reemplaza este archivo con tus credenciales') {
    // En lugar de lanzar un error que detiene la app, registramos el error y retornamos.
    // La función que use el SDK de admin deberá manejar el caso de no estar inicializado.
    console.error('El archivo service-account.json contiene credenciales de marcador de posición. El SDK de Admin no se inicializará.');
    return null;
  }

  try {
    const serviceAccount = serviceAccountCredentials as ServiceAccount;
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
     // Devolvemos null para que la función que lo llame pueda manejar el error.
    return null;
  }
}

// Invocamos la inicialización al cargar el módulo.
const app = initializeFirebaseAdmin();
const adminFirestore = app ? admin.firestore() : null;
const adminAuth = app ? admin.auth() : null;

export { admin, adminFirestore, adminAuth };
