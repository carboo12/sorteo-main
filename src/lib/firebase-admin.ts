
'use server';
import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Se inicializa la app de Firebase Admin solo si no hay otras apps inicializadas.
// Este enfoque es más robusto y se ejecuta una sola vez cuando el módulo es cargado.
if (!admin.apps.length) {
  try {
    // Casting para asegurar que el tipo sea el correcto.
    const typedServiceAccount = serviceAccount as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(typedServiceAccount),
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  } catch (error: any) {
    // Un error aquí es crítico, lo registramos para depuración en el servidor.
    console.error('Error catastrófico al inicializar Firebase Admin SDK:', error.message);
  }
}

// Se exportan directamente las instancias de los servicios.
// Si la inicialización falló, cualquier llamada a estos servicios lanzará un error.
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
