
'use server';

import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // El método más robusto: usar el JSON completo de la cuenta de servicio.
  // Esto evita problemas de formato con la clave privada.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error al inicializar Firebase Admin SDK con JSON:', error);
      throw error;
    }
  } else {
    // Mantener el método anterior como respaldo, aunque es menos robusto.
    console.warn("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida. Intentando con claves individuales.");
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        } catch (error) {
            console.error('Error al inicializar Firebase Admin SDK con claves individuales:', error);
            throw error;
        }
    } else {
        throw new Error('Credenciales de Firebase Admin incompletas. Verifica tus variables de entorno.');
    }
  }
}

initializeFirebaseAdmin();

const getAdminFirestore = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK no está inicializado. Verifica tus variables de entorno del servidor.');
  }
  return admin.firestore();
};

const getAdminAuth = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK no está inicializado. Verifica tus variables de entorno del servidor.');
  }
  return admin.auth();
};

const adminFirestore = getAdminFirestore();
const adminAuth = getAdminAuth();

export { admin, adminFirestore, adminAuth };
