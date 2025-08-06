
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // Comprobar si las credenciales parecen ser marcadores de posición
  if (
    !serviceAccount.project_id ||
    serviceAccount.project_id.startsWith('DEPRECATED')
  ) {
    const errorMessage =
      'El archivo service-account.json contiene credenciales de marcador de posición. ' +
      'Por favor, reemplaza el contenido de service-account.json con tus credenciales reales de Firebase.';
    console.error(errorMessage);
    // Lanzamos un error descriptivo para que sea claro en los logs
    throw new Error(errorMessage);
  }

  try {
    admin.initializeApp({
      // El tipado de 'serviceAccount' es compatible con 'Credential'
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
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
