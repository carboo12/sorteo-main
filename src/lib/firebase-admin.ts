
'use server';

import * as admin from 'firebase-admin';

// Variable para almacenar la instancia de la app y evitar re-inicializaciones.
let app: admin.app.App;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.app();
    }
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida. ' +
      'Por favor, copia el contenido completo de tu archivo JSON de cuenta de servicio en esta variable.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    throw new Error(
        'El valor de FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido. ' +
        'Asegúrate de copiar el contenido exacto del archivo de credenciales, incluyendo las llaves de apertura y cierre {}.'
    );
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que el contenido de FIREBASE_SERVICE_ACCOUNT_JSON sea correcto. ' +
      `Error original: ${error.message}`
    );
  }
}

// Inicializa la app la primera vez que se carga el módulo
initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
