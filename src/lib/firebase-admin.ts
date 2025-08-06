
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  // Si ya hay una app de Firebase inicializada, no hacemos nada.
  if (admin.apps.length > 0) {
    return;
  }

  // Verifica que las propiedades necesarias existan en el service account
  // Esto previene errores si el archivo está incompleto o tiene los placeholders.
  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key ||
    serviceAccount.private_key.includes('DEPRECATED')
  ) {
    console.error('El archivo service-account.json está incompleto o contiene valores de marcador de posición. Por favor, reemplázalo con tus credenciales reales de Firebase.');
    // No lanzamos un error para evitar que la app crashee en un loop,
    // pero la autenticación de admin fallará.
    return;
  }

  try {
    // Inicializamos el SDK de Admin con las credenciales del archivo importado.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    // Este error es común si el formato del JSON es incorrecto.
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto y no esté corrupto. ' +
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
