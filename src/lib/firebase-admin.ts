
import * as e from 'firebase-admin';

// Las credenciales del Admin SDK se leen desde las variables de entorno
// Asegúrate de que tu archivo .env.local o las variables de tu entorno de despliegue estén configuradas.
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (e.apps.length === 0) {
  if (projectId && clientEmail && privateKey) {
    try {
      e.initializeApp({
        credential: e.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } catch (error) {
      console.error('Firebase Admin SDK Initialization Error:', error);
    }
  } else {
    // Este mensaje se mostrará en el servidor si faltan las credenciales.
    console.warn('Firebase Admin SDK no se ha inicializado. Faltan variables de entorno (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, NEXT_PUBLIC_FIREBASE_PROJECT_ID). Las funciones de administrador no estarán disponibles.');
  }
}

// Helper para obtener instancias de forma segura.
// Si la inicialización falló, usar estas funciones lanzará un error claro.
function getSafeFirestore(): e.firestore.Firestore {
  if (!e.apps.length) {
    throw new Error("Attempted to use Firestore, but Firebase Admin SDK is not initialized.");
  }
  return e.firestore();
}

function getSafeAuth(): e.auth.Auth {
    if (!e.apps.length) {
        throw new Error("Attempted to use Auth, but Firebase Admin SDK is not initialized.");
    }
    return e.auth();
}

const firestore = getSafeFirestore();
const auth = getSafeAuth();

export {firestore, auth};
