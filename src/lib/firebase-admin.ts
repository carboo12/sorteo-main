
'use server';

import * as admin from 'firebase-admin';

// This function should be called ONLY after environment variables are loaded.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

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
      console.error('Error al inicializar Firebase Admin SDK:', error);
    }
  } else {
    // This warning is helpful for debugging missing environment variables.
    console.warn('Credenciales de Firebase Admin incompletas. El SDK no se inicializará en el servidor.');
  }
}

// Initialize on module load.
initializeFirebaseAdmin();


// Export a function that safely gets the Firestore instance.
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
}

const adminFirestore = getAdminFirestore();
const adminAuth = getAdminAuth();

export { admin, adminFirestore, adminAuth };
