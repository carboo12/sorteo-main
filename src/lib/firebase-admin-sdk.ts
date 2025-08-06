
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
  
  // Asignamos las credenciales importadas directamente.
  // El `as ServiceAccount` es necesario para que TypeScript confíe en la estructura del JSON.
  const serviceAccount = serviceAccountCredentials as ServiceAccount;

  // Verificación crucial para evitar el uso de credenciales de ejemplo.
  if (!serviceAccount.project_id || serviceAccount.project_id === 'DEPRECATED - Reemplaza este archivo con tus credenciales') {
    console.warn('El archivo service-account.json contiene credenciales de marcador de posición. El SDK de Admin no se inicializará.');
    return null;
  }
  
  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Este bloque se ejecuta si la inicialización falla
    console.error('Error al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto. ` +
      `Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
const app = initializeFirebaseAdmin();

// Exporta las instancias del SDK de Admin de forma segura.
// Si la inicialización falla o usa credenciales de placeholder, estas serán `null`.
export const adminFirestore = app ? admin.firestore() : null;
export const adminAuth = app ? admin.auth() : null;
export { admin };
