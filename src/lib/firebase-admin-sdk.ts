
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../service-account.json';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  const serviceAccount = serviceAccountCredentials as ServiceAccount;

  // Verifica que las credenciales no sean las de placeholder
  if (!serviceAccount.project_id || serviceAccount.project_id.startsWith('DEPRECATED')) {
    console.warn('El archivo service-account.json contiene credenciales de marcador de posición. El SDK de Admin no se inicializará y las funciones del servidor fallarán.');
    return null; // Devuelve null si las credenciales son incorrectas
  }
  
  try {
    // Corrige el formato de la clave privada por si acaso
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error(
        `No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto. ` +
        `Error original: ${error.message}`
    );
    // Devuelve null en caso de cualquier otro error de inicialización
    return null;
  }
}

const app = initializeFirebaseAdmin();

// Si la inicialización falla o usa credenciales de placeholder, estas serán `null`.
export const adminFirestore = app ? admin.firestore() : null;
export const adminAuth = app ? admin.auth() : null;
export { admin };
