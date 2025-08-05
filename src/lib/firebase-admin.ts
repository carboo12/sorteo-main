import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Inicializamos la app de Firebase Admin solo si no hay ninguna instancia activa
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
    // No lanzar el error aquí para permitir que el servidor se inicie, 
    // pero los logs mostrarán el problema.
  }
}

// Exportamos las instancias de Firestore y Auth para usarlas en otras partes del backend
const firestore = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

// Funciones seguras para obtener las instancias, lanzarán un error si la inicialización falló.
function getSafeFirestore() {
    if (!firestore) {
        throw new Error("Attempted to use Firestore, but Firebase Admin SDK failed to initialize. Check your server logs and service-account.json.");
    }
    return firestore;
}

function getSafeAuth() {
    if (!auth) {
        throw new Error("Attempted to use Auth, but Firebase Admin SDK failed to initialize. Check your server logs and service-account.json.");
    }
    return auth;
}


export { admin, getSafeFirestore as firestore, getSafeAuth as auth };