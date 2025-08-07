
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../service-account.json';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  const serviceAccount = serviceAccountCredentials as ServiceAccount;

  if (!serviceAccount.project_id || serviceAccount.project_id.startsWith('DEPRECATED')) {
    console.warn('El archivo service-account.json contiene credenciales de marcador de posición. El SDK de Admin no se inicializará.');
    return null;
  }
  
  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto. ` +
      `Error original: ${error.message}`
    );
  }
}

const app = initializeFirebaseAdmin();

export const adminFirestore = app ? admin.firestore() : null;
export const adminAuth = app ? admin.auth() : null;
export { admin };
