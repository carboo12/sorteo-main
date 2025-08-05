
'use server';

import * as admin from 'firebase-admin';

// Reconstruye la clave privada para asegurar el formato correcto.
// process.env.FIREBASE_PRIVATE_KEY debe ser una cadena que incluya los "\n".
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Solo intenta inicializar si las credenciales esenciales están presentes
// y si no hay ninguna aplicación ya inicializada.
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey && !admin.apps.length) {
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
}

// Exporta una función que obtiene la instancia de Firestore de forma segura.
// Esto lanzará un error si la inicialización falló, haciendo el problema visible.
const getAdminFirestore = () => {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin SDK no está inicializado. Verifica tus variables de entorno del servidor.');
    }
    return admin.firestore();
};

const adminFirestore = getAdminFirestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
