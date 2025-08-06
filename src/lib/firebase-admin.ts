
import * as admin from 'firebase-admin';

// Variable para almacenar la instancia de la app y evitar re-inicializaciones.
let app: admin.app.App;

function initializeFirebaseAdmin() {
  // Si ya hay apps inicializadas, no hacemos nada para evitar errores.
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // El SDK buscará automáticamente las credenciales en la variable de entorno
    // GOOGLE_APPLICATION_CREDENTIALS, que apunta al archivo service-account.json.
    // Este es el método más robusto y recomendado para entornos de servidor.
    app = admin.initializeApp();
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    if (error.message.includes('credential')) {
       throw new Error(
        'No se pudieron cargar las credenciales de Firebase. Asegúrate de que el archivo service-account.json en la raíz del proyecto es correcto y que la variable de entorno GOOGLE_APPLICATION_CREDENTIALS está configurada.' +
        ` Error original: ${error.message}`
      );
    }
    throw error;
  }
}

// Inicializa la app la primera vez que se carga el módulo
initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
