
'use server';

import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import serviceAccountCredentials from '../../service-account.json';

// Esta función se invoca una sola vez en el ámbito del módulo,
// asegurando que la inicialización ocurra solo cuando se carga este archivo.
function initializeFirebaseAdmin() {
  // Evita la reinicialización en entornos de hot-reload
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Comprobación de seguridad para asegurar que no se están usando las credenciales de ejemplo
  if (!serviceAccountCredentials || serviceAccountCredentials.project_id === 'DEPRECATED - Reemplaza este archivo con tus credenciales') {
    const errorMessage = 'El archivo service-account.json contiene credenciales de marcador de posición. Por favor, reemplaza el contenido de service-account.json con tus credenciales reales de Firebase.';
    console.error(errorMessage);
    // Lanzamos un error descriptivo para que sea claro en los logs
    throw new Error(errorMessage);
  }

  try {
    // Aquí convertimos el objeto importado al tipo ServiceAccount esperado
    const serviceAccount = serviceAccountCredentials as ServiceAccount;
    
    // Inicializamos la app de Admin con las credenciales importadas.
    // Este método es el más robusto ya que el sistema de build de Next.js
    // maneja correctamente el parseo del JSON.
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Este bloque se ejecuta si la inicialización falla
    console.error('Error al inicializar Firebase Admin:', error.message);
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica que el archivo service-account.json sea correcto y no esté corrupto. Error original: ${error.message}`
    );
  }
}

// Invocamos la inicialización al cargar el módulo.
const app = initializeFirebaseAdmin();
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
