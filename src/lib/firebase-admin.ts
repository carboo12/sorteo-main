
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Verificar si las credenciales son las de marcador de posición
  if (serviceAccount.project_id === 'DEPRECATED - Reemplaza este archivo con tus credenciales') {
    // Solo mostramos una advertencia en la consola, pero no lanzamos un error que detenga la app.
    // La inicialización de Firebase fallará por sí misma con un error más claro si las credenciales son inválidas.
    console.warn('ADVERTENCIA: El archivo service-account.json parece contener credenciales de marcador de posición. Por favor, asegúrate de reemplazarlo con tus credenciales reales de Firebase para que la aplicación funcione correctamente.');
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    // Re-lanzamos el error original de Firebase para que sea más claro en los logs de Next.js
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
