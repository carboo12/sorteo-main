
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const cert = {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(cert),
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
