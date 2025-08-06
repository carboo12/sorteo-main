
'use server';

import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
       throw new Error(
        'Las variables de entorno de Firebase Admin no están configuradas. ' +
        'Asegúrate de que FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY están definidas.'
       );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que las variables de entorno sean correctas. ' +
      `Error original: ${error.message}`
    );
  }
}

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
