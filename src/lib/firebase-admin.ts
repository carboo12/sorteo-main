
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  // Si ya hay una app de Firebase inicializada, no hacemos nada.
  if (admin.apps.length > 0) {
    return;
  }

  // Verifica que las propiedades necesarias existan en el service account
  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error(
      'El archivo service-account.json está incompleto o es inválido. ' +
      'Asegúrate de que contenga project_id, client_email y private_key.'
    );
  }

  try {
    // Inicializamos el SDK de Admin con las credenciales del archivo importado.
    admin.initializeApp({
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

// Llamamos a la función de inicialización para que se ejecute cuando se importa el archivo.
initializeFirebaseAdmin();

// Exportamos las instancias de Firestore y Auth para usarlas en otras partes del servidor.
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
