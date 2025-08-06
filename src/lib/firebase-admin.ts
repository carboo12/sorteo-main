
'use server';

import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // Type assertion to satisfy the credential structure
  const serviceAccountParams = {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
  }

  if (!serviceAccountParams.projectId || !serviceAccountParams.clientEmail || !serviceAccountParams.privateKey) {
       throw new Error(
        'El archivo service-account.json no está configurado correctamente o está vacío. ' +
        'Por favor, copia el contenido completo de tu archivo JSON de cuenta de servicio de Firebase en service-account.json.'
       );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountParams),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto. ' +
      `Error original: ${error.message}`
    );
  }
}

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
