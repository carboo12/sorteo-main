
'use server';

import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  // Si ya hay una app inicializada, no hacemos nada para evitar errores.
  if (admin.apps.length > 0) {
    return;
  }

  // Este es el único método que usaremos: el JSON completo de la cuenta de servicio.
  // Es el más robusto y el recomendado oficialmente por Firebase.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida. ' +
      'Por favor, copia el contenido completo de tu archivo JSON de cuenta de servicio en esta variable.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error al parsear o usar el JSON de la cuenta de servicio de Firebase:', error);
    throw new Error(
        'El valor de FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido. ' +
        'Asegúrate de copiar el contenido exacto del archivo de credenciales, incluyendo las llaves de apertura y cierre {}.'
    );
  }
}

// Llama a la inicialización al cargar el módulo.
// Cualquier archivo del lado del servidor que importe este módulo se asegurará
// de que la inicialización haya ocurrido.
initializeFirebaseAdmin();

// Función auxiliar para obtener la instancia de Firestore.
const getAdminFirestore = (): admin.firestore.Firestore => {
  if (!admin.apps.length) {
    // Este error no debería ocurrir si la lógica de inicialización es correcta,
    // pero es una salvaguarda importante.
    throw new Error('El SDK de Firebase Admin no se ha inicializado. Verifica la configuración del servidor.');
  }
  return admin.firestore();
};

// Función auxiliar para obtener la instancia de Auth.
const getAdminAuth = (): admin.auth.Auth => {
  if (!admin.apps.length) {
    throw new Error('El SDK de Firebase Admin no se ha inicializado. Verifica la configuración del servidor.');
  }
  return admin.auth();
};

// Exportar las instancias listas para usar.
const adminFirestore = getAdminFirestore();
const adminAuth = getAdminAuth();

export { admin, adminFirestore, adminAuth };
