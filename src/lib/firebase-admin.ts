
import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Si ya hay apps inicializadas, significa que el SDK ya se configuró.
  // No hacemos nada para evitar errores de re-inicialización.
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // El SDK buscará automáticamente las credenciales en el entorno.
    // Este es el método más robusto para entornos de servidor como Vercel, Firebase, etc.
    // Se basa en la variable de entorno GOOGLE_APPLICATION_CREDENTIALS que apunta al service-account.json
    admin.initializeApp();
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    if (error.code === 'app/duplicate-app') {
        // Este error es seguro de ignorar, significa que otro proceso ya lo inicializó.
        return;
    }
    throw new Error(
      'No se pudo inicializar Firebase Admin. ' +
      `Error original: ${error.message}`
    );
  }
}

// Inicializa la app la primera vez que se carga el módulo
initializeFirebaseAdmin();

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
