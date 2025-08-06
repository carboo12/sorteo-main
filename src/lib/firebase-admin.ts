
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    admin.initializeApp({
      // El tipado de 'serviceAccount' es compatible con 'Credential'
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    // Re-lanzamos el error original de Firebase para que sea más claro
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto y no esté corrupto. ' +
      `Error original: ${error.message}`
    );
  }
}

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
