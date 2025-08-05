
import * as e from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to initialize the admin app, ensuring it's only done once.
function initializeAdminApp() {
  if (e.apps.length > 0) {
    return e.app();
  }

  try {
    // Usar el archivo de cuenta de servicio es el método más robusto.
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
        console.warn('El archivo service-account.json no se encontró. El Admin SDK no se inicializará. Por favor, descárgalo de tu consola de Firebase y colócalo en la raíz del proyecto.');
        return null;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Verifica que el archivo no esté vacío o con placeholders
    if (!serviceAccount.project_id || serviceAccount.project_id === "TU_PROJECT_ID_AQUI") {
      console.warn('El archivo service-account.json parece no estar configurado. Por favor, rellénalo con tus credenciales de Firebase.');
      return null;
    }

    return e.initializeApp({
      credential: e.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK Initialization Error:', error.message);
    // Devolvemos null para que la siguiente función lance un error claro.
    return null;
  }
}

// Helper to get Firestore instance safely.
function getSafeFirestore(): e.firestore.Firestore {
  initializeAdminApp(); // Ensure app is initialized
  if (!e.apps.length) {
    throw new Error("Attempted to use Firestore, but Firebase Admin SDK is not initialized. Check your server logs for the original initialization error.");
  }
  return e.firestore();
}

// Helper to get Auth instance safely.
function getSafeAuth(): e.auth.Auth {
    initializeAdminApp(); // Ensure app is initialized
    if (!e.apps.length) {
        throw new Error("Attempted to use Auth, but Firebase Admin SDK is not initialized. Check your server logs for the original initialization error.");
    }
    return e.auth();
}

const firestore = getSafeFirestore();
const auth = getSafeAuth();

export {firestore, auth};
