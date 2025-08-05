
'use server';

import * as admin from 'firebase-admin';

// Evita la re-inicialización en entornos de recarga en caliente (hot-reloading)
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('La variable de entorno FIREBASE_PROJECT_ID no está definida.');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('La variable de entorno FIREBASE_CLIENT_EMAIL no está definida.');
    }
    if (!privateKey) {
      throw new Error('La variable de entorno FIREBASE_PRIVATE_KEY no está definida.');
    }

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

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
