
import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Si ya hay apps inicializadas, no hacemos nada para evitar errores.
  if (admin.apps.length > 0) {
    return;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida.');
    }

    const credentials = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  } catch (error: any) {
    // Proporcionar un mensaje de error más detallado
    throw new Error(
      `No se pudo inicializar Firebase Admin. Error original: ${error.message}. Asegúrate de que FIREBASE_SERVICE_ACCOUNT_JSON esté correctamente configurada como un JSON válido.`
    );
  }
}

// Inicializa la app la primera vez que se carga el módulo
initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
