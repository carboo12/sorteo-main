
'use server';

import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Carga las variables de entorno desde el archivo .env
config();

// Solo intenta inicializar si las credenciales esenciales están presentes
// y si no hay ninguna aplicación ya inicializada.
if (!admin.apps.length) {
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
    console.warn('Credenciales de Firebase Admin incompletas. El SDK no se inicializará en el servidor.');
  }
}

// Exporta una función que obtiene la instancia de Firestore de forma segura.
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

// Exporta las instancias para ser usadas en otras partes de la aplicación de servidor.
// Se invocarán las funciones para lanzar un error si la inicialización falló.
const adminFirestore = getAdminFirestore();
const adminAuth = getAdminAuth();

export { admin, adminFirestore, adminAuth };
