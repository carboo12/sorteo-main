
import * as admin from 'firebase-admin';

// Asegúrate de que la variable de entorno no esté vacía
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env.local');
}

// Parseamos la clave de la cuenta de servicio desde la variable de entorno
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

// Inicializamos la app de Firebase Admin solo si no hay ninguna instancia activa
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exportamos las instancias de Firestore y Auth para usarlas en otras partes del backend
const firestore = admin.firestore();
const auth = admin.auth();

export { admin, firestore, auth };
