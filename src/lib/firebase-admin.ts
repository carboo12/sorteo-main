
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Si ya hay una app inicializada, la retornamos para evitar errores.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // La forma más robusta: usar una única variable de entorno con el JSON completo.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Por favor, añádela con el contenido de tu archivo service-account.json.'
    );
  }

  try {
    // Parseamos el string JSON para obtener el objeto de la cuenta de servicio.
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    // Inicializamos la app de Admin con las credenciales parseadas.
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON o al inicializar Firebase Admin:', error.message);
    // Este error es más específico y ayuda a depurar si el JSON está mal copiado.
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica que el contenido de la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON sea un JSON válido. Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
initializeFirebaseAdmin();

// Exportamos las instancias de los servicios de Admin.
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
