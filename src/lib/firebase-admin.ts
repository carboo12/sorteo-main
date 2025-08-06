
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // Verificar si las credenciales son las de marcador de posición
  if (serviceAccount.project_id === 'DEPRECATED - Reemplaza este archivo con tus credenciales') {
    const errorMessage = 'El archivo service-account.json contiene credenciales de marcador de posición. Por favor, reemplaza el contenido de service-account.json con tus credenciales reales de Firebase.';
    // No lanzamos un error para evitar que la app crashee, solo lo mostramos en consola.
    // La app fallará de todas formas en la inicialización, pero con un error de Firebase más claro.
    console.error(errorMessage);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    // Re-lanzamos el error original de Firebase para que sea más claro
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto y no esté corrupto. ' +
      `Error original: ${error.message}`
    );
  }
}

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
