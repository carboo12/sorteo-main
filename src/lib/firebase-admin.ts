
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Evita la reinicialización en entornos de hot-reload
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // El método más robusto: usar una única variable de entorno con el JSON completo.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Por favor, añádela con el contenido de tu archivo service-account.json.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    // Inicializamos la app de Admin con las credenciales parseadas.
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON o al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica que el contenido de FIREBASE_SERVICE_ACCOUNT_JSON sea un JSON válido. Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
