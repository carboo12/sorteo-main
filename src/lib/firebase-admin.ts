
import * as admin from 'firebase-admin';

// Esta función asegura que Firebase Admin se inicialice solo una vez.
function initializeFirebaseAdmin() {
  // Si ya hay una app de Firebase inicializada, no hacemos nada.
  if (admin.apps.length > 0) {
    return;
  }

  // Obtenemos las credenciales desde las variables de entorno.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // La clave privada a menudo causa problemas de formato. La corregimos aquí.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Verificamos que todas las variables necesarias estén presentes.
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan las variables de entorno de Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). ' +
      'Asegúrate de que estén configuradas correctamente.'
    );
  }

  try {
    // Inicializamos el SDK de Admin con las credenciales ya corregidas.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
    throw new Error(
      'No se pudo inicializar Firebase Admin. Verifica que las variables de entorno sean correctas. ' +
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
