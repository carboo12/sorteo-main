
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../service-account.json';

let app: admin.app.App | null = null;
let initializationError: string | null = null;

try {
  const serviceAccount = serviceAccountCredentials as ServiceAccount;

  if (!serviceAccount.project_id || serviceAccount.project_id.startsWith('DEPRECATED')) {
    throw new Error('Las credenciales del servidor son de ejemplo. Por favor, actualiza el archivo service-account.json con tus credenciales reales.');
  }

  if (admin.apps.length === 0) {
    // Corrige el formato de la clave privada por si acaso
    serviceAccount.private_key = (serviceAccount.private_key || '').replace(/\\n/g, '\n');
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    app = admin.app();
  }
} catch (error: any) {
  console.error("Error al inicializar Firebase Admin:", error.message);
  // Guardar un mensaje de error específico y amigable
  if (error.message.includes('service-account.json')) {
      initializationError = error.message;
  } else {
      initializationError = `Las credenciales del servidor son inválidas. Verifica tu archivo service-account.json. Error original: ${error.message}`;
  }
  app = null;
}

export const adminFirestore = app ? app.firestore() : null;
export const adminAuth = app ? app.auth() : null;
export const isFirebaseAdminError = initializationError;
export { admin };
